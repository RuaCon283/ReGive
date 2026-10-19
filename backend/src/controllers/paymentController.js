const { body, param } = require('express-validator');
const Payment = require('../models/Payment');
const { PAYMENT_PURPOSE, ROLES } = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');
const {
  createPayment,
  createVnpayCheckoutUrl,
  confirmSandboxPayment,
  confirmVnpayPayment,
} = require('../services/paymentService');

function sanitizePayment(payment, { includeSandboxToken = false, extra = {} } = {}) {
  const obj = payment.toObject ? payment.toObject() : { ...payment };
  if (!includeSandboxToken) {
    delete obj.sandboxToken;
  }
  delete obj.rawCallback;
  return { ...obj, ...extra };
}

const createValidators = [
  body('purpose').isIn(Object.values(PAYMENT_PURPOSE)),
  body('orderId').optional().isMongoId(),
  body('donationId').optional().isMongoId(),
];

const confirmValidators = [
  body('paymentId').isMongoId(),
  body('sandboxToken').isString().notEmpty(),
];

function getApiBaseUrl(req) {
  const forwardedProto = req.get('x-forwarded-proto');
  const proto = forwardedProto ? forwardedProto.split(',')[0] : req.protocol;
  return `${proto}://${req.get('host')}`;
}

function getClientBaseUrl(req) {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (referer) return new URL(referer).origin;
  return 'http://localhost:3000';
}

const create = asyncHandler(async (req, res) => {
  const { purpose, orderId, donationId } = req.body;

  if (purpose === PAYMENT_PURPOSE.ORDER && !orderId) {
    throw new ApiError(400, 'Vui lòng cung cấp orderId để thanh toán đơn hàng');
  }
  if (purpose === PAYMENT_PURPOSE.DONATION && !donationId) {
    throw new ApiError(400, 'Vui lòng cung cấp donationId để thanh toán quyên góp');
  }

  const payment = await createPayment({
    purpose,
    payerId: req.user._id,
    orderId,
    donationId,
  });

  const clientReturnUrl = `${getClientBaseUrl(req)}/payments/${payment._id}/checkout`;
  if (payment.clientReturnUrl !== clientReturnUrl || payment.provider !== 'vnpay') {
    payment.clientReturnUrl = clientReturnUrl;
    payment.provider = 'vnpay';
    await payment.save();
  }

  const checkoutUrl = createVnpayCheckoutUrl({
    payment,
    returnUrl: `${getApiBaseUrl(req)}/api/payments/vnpay/return`,
    ipAddr: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });

  return success(
    res,
    {
      payment: {
        id: payment._id,
        paymentCode: payment.paymentCode,
        purpose: payment.purpose,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        checkoutUrl,
        order: payment.order,
        donation: payment.donation,
        checkoutHint: 'Chuyển người dùng đến checkoutUrl để thanh toán qua VNPay',
      },
    },
    'Tạo thanh toán thành công',
    201
  );
});

const sandboxConfirm = asyncHandler(async (req, res) => {
  const payment = await confirmSandboxPayment({
    paymentId: req.body.paymentId,
    sandboxToken: req.body.sandboxToken,
    rawCallback: req.body,
  });

  return success(res, { payment: sanitizePayment(payment) }, 'Xác nhận thanh toán sandbox thành công');
});

const sandboxWebhook = asyncHandler(async (req, res) => {
  const paymentId = req.body.paymentId || req.body.payment_id;
  const token = req.body.sandboxToken || req.body.token;
  if (!paymentId || !token) {
    throw new ApiError(400, 'Vui lòng cung cấp paymentId và sandboxToken');
  }

  const payment = await confirmSandboxPayment({
    paymentId,
    sandboxToken: token,
    rawCallback: req.body,
  });

  return success(res, { payment: sanitizePayment(payment) }, 'Xử lý webhook thành công');
});

const vnpayReturn = asyncHandler(async (req, res) => {
  const payment = await confirmVnpayPayment({ query: req.query });
  const redirectUrl = new URL(
    payment.clientReturnUrl || `http://localhost:3000/payments/${payment._id}/checkout`
  );
  redirectUrl.searchParams.set('vnpay', payment.status === 'success' ? 'success' : 'failed');
  if (payment.failureReason) redirectUrl.searchParams.set('reason', payment.failureReason);
  return res.redirect(redirectUrl.toString());
});

const vnpayIpn = asyncHandler(async (req, res) => {
  try {
    const payment = await confirmVnpayPayment({ query: req.query });
    return res.json({
      RspCode: '00',
      Message: 'Xác nhận thành công',
      paymentId: payment._id,
      status: payment.status,
    });
  } catch (err) {
    const statusCode = err.statusCode === 404 ? '01' : err.statusCode === 400 ? '97' : '99';
    return res.json({
      RspCode: statusCode,
      Message: err.message || 'Xác nhận thất bại',
    });
  }
});

const getById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('order', 'orderCode status totalAmount')
    .populate('donation', 'type amount status')
    .populate('payer', 'fullName email');

  if (!payment) throw new ApiError(404, 'Không tìm thấy thanh toán');

  const isOwner =
    Boolean(payment.payer) &&
    payment.payer._id.toString() === req.user._id.toString();
  const isStaff = [ROLES.ADMIN, ROLES.EMPLOYEE].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Bạn không có quyền truy cập');

  let checkoutUrl;
  if (isOwner && payment.status === 'pending' && payment.provider === 'vnpay') {
    const clientReturnUrl = `${getClientBaseUrl(req)}/payments/${payment._id}/checkout`;
    checkoutUrl = createVnpayCheckoutUrl({
      payment,
      returnUrl: `${getApiBaseUrl(req)}/api/payments/vnpay/return`,
      ipAddr: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
    if (payment.clientReturnUrl !== clientReturnUrl) {
      await Payment.findByIdAndUpdate(payment._id, { clientReturnUrl });
    }
  }

  return success(res, {
    payment: sanitizePayment(payment, {
      includeSandboxToken: isOwner && payment.status === 'pending',
      extra: checkoutUrl ? { checkoutUrl } : {},
    }),
  });
});

const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ payer: req.user._id })
    .populate('order', 'orderCode status totalAmount')
    .populate('donation', 'type amount status')
    .sort({ createdAt: -1 });
  return success(res, { payments: payments.map((p) => sanitizePayment(p)) });
});

const listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.purpose) filter.purpose = req.query.purpose;

  const payments = await Payment.find(filter)
    .populate('payer', 'fullName email')
    .populate('order', 'orderCode status')
    .populate('donation', 'type amount status')
    .sort({ createdAt: -1 });

  return success(res, { payments: payments.map((p) => sanitizePayment(p)) });
});

module.exports = {
  createValidators,
  confirmValidators,
  create,
  sandboxConfirm,
  sandboxWebhook,
  vnpayReturn,
  vnpayIpn,
  getById,
  myPayments,
  listAll,
};
