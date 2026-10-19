const { body, param } = require('express-validator');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const {
  DONATION_TYPES,
  DONATION_STATUS,
  CAMPAIGN_STATUS,
  ROLES,
} = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');
const { createNotification } = require('../services/common');

const createValidators = [
  body('campaignId').isMongoId(),
  body('type').isIn(Object.values(DONATION_TYPES)),
  body('amount').optional().isFloat({ min: 0 }),
  body('note').optional().isString(),
  body('isAnonymous').optional().isBoolean(),
  body('productInfo.name').optional().isString(),
  body('productInfo.quantity').optional().isInt({ min: 1 }),
  body('productInfo.category').optional().isString(),
  body('productInfo.description').optional().isString(),
  body('productInfo.conditionNote').optional().isString(),
  body('productInfo.images').optional().isArray(),
  body('productInfo.estimatedValue').optional().isFloat({ min: 0 }),
];

const statusValidators = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(DONATION_STATUS)),
];

const create = asyncHandler(async (req, res) => {
  if (![ROLES.USER, ROLES.ADMIN].includes(req.user.role)) {
    throw new ApiError(403, 'Chỉ tài khoản USER mới có thể tạo quyên góp');
  }

  const { campaignId, type, amount, note, isAnonymous, productInfo } = req.body;
  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
    throw new ApiError(400, 'Chiến dịch hiện không thể nhận quyên góp');
  }

  if (type === DONATION_TYPES.MONEY) {
    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Vui lòng nhập số tiền quyên góp');
    }
  }

  if (type === DONATION_TYPES.PRODUCT) {
    if (!productInfo || !productInfo.name) {
      throw new ApiError(400, 'Vui lòng nhập tên sản phẩm quyên góp');
    }
  }

  const donation = await Donation.create({
    donor: req.user._id,
    campaign: campaignId,
    type,
    amount: type === DONATION_TYPES.MONEY ? amount : 0,
    isAnonymous: Boolean(isAnonymous),
    productInfo:
      type === DONATION_TYPES.PRODUCT
        ? {
            name: productInfo.name,
            quantity: productInfo.quantity || 1,
            category: productInfo.category || '',
            description: productInfo.description || '',
            conditionNote: productInfo.conditionNote || '',
            images: productInfo.images || [],
            estimatedValue: productInfo.estimatedValue || 0,
          }
        : undefined,
    note: note || '',
    status: DONATION_STATUS.PENDING,
  });

  await createNotification({
    userId: req.user._id,
    title: 'Đã tiếp nhận quyên góp',
    message: `Quyên góp ${donation._id} đang chờ xác nhận.`,
    type: 'donation',
    relatedId: donation._id.toString(),
  });

  return success(res, { donation }, 'Tạo quyên góp thành công', 201);
});

const myDonations = asyncHandler(async (req, res) => {
  const donations = await Donation.find({ donor: req.user._id })
    .populate('campaign', 'title status location bannerImage category')
    .sort({ createdAt: -1 });
  return success(res, { donations });
});

const listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.campaignId) filter.campaign = req.query.campaignId;

  const donations = await Donation.find(filter)
    .populate('donor', 'fullName email phone')
    .populate('campaign', 'title status')
    .populate('processedBy', 'fullName email')
    .sort({ createdAt: -1 });
  return success(res, { donations });
});

const getById = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id)
    .populate('donor', 'fullName email phone')
    .populate('campaign', 'title status location bannerImage targetAmount raisedAmount')
    .populate('processedBy', 'fullName email');

  if (!donation) {
    throw new ApiError(404, 'Không tìm thấy quyên góp');
  }

  const isOwner =
    Boolean(donation.donor) &&
    donation.donor._id.toString() === req.user._id.toString();
  const isStaff = [ROLES.ADMIN, ROLES.EMPLOYEE].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Bạn không có quyền truy cập');
  }

  return success(res, { donation });
});

const updateStatus = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id).populate('campaign');
  if (!donation) {
    throw new ApiError(404, 'Không tìm thấy quyên góp');
  }

  const prev = donation.status;
  donation.status = req.body.status;
  donation.processedBy = req.user._id;
  donation.processedAt = new Date();
  await donation.save();

  if (
    donation.type === DONATION_TYPES.MONEY &&
    req.body.status === DONATION_STATUS.COMPLETED &&
    prev !== DONATION_STATUS.COMPLETED
  ) {
    await Campaign.findByIdAndUpdate(donation.campaign._id || donation.campaign, {
      $inc: { raisedAmount: donation.amount },
    });
  }

  await createNotification({
    userId: donation.donor,
    title: 'Cập nhật trạng thái quyên góp',
    message: `Trạng thái quyên góp của bạn đã chuyển sang ${donation.status}.`,
    type: 'donation',
    relatedId: donation._id.toString(),
  });

  return success(res, { donation }, 'Cập nhật trạng thái quyên góp thành công');
});

module.exports = {
  createValidators,
  statusValidators,
  create,
  myDonations,
  listAll,
  getById,
  updateStatus,
};
