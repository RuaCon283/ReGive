const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const VolunteerRegistration = require('../models/VolunteerRegistration');
const InventoryTransaction = require('../models/InventoryTransaction');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PURPOSE,
  DONATION_TYPES,
  PRODUCT_STATUS,
} = require('../constants/enums');
const { success, asyncHandler } = require('../utils/api');

const overview = asyncHandler(async (_req, res) => {
  const [
    totalProducts,
    listedProducts,
    lowStock,
    ordersPending,
    ordersPaid,
    paymentsSuccess,
    moneyDonationsCompleted,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ listedOnMarketplace: true, status: PRODUCT_STATUS.LISTED }),
    Product.countDocuments({ stockQuantity: { $gt: 0, $lte: 2 } }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
    Order.countDocuments({
      status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED] },
    }),
    Payment.countDocuments({ status: PAYMENT_STATUS.SUCCESS }),
    Donation.countDocuments({ type: DONATION_TYPES.MONEY, status: 'completed' }),
  ]);

  const [orderRevenue, donationRevenue] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.SUCCESS,
          purpose: PAYMENT_PURPOSE.ORDER,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: PAYMENT_STATUS.SUCCESS,
          purpose: PAYMENT_PURPOSE.DONATION,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('buyer', 'fullName email')
    .select('orderCode status totalAmount createdAt');

  const recentPayments = await Payment.find({ status: PAYMENT_STATUS.SUCCESS })
    .sort({ paidAt: -1 })
    .limit(5)
    .populate('payer', 'fullName email')
    .select('paymentCode purpose amount paidAt');

  const recentStockMoves = await InventoryTransaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('product', 'name')
    .select('type quantity previousStock newStock reason createdAt');

  return success(res, {
    summary: {
      totalProducts,
      listedProducts,
      lowStock,
      ordersPending,
      ordersPaid,
      paymentsSuccess,
      moneyDonationsCompleted,
      orderRevenue: orderRevenue[0]?.total || 0,
      donationRevenue: donationRevenue[0]?.total || 0,
      currency: 'VND',
    },
    recentOrders,
    recentPayments,
    recentStockMoves,
  });
});

const publicImpact = asyncHandler(async (_req, res) => {
  const [
    totalCampaigns,
    activeCampaigns,
    totalProducts,
    totalDonations,
    totalVolunteers,
    moneyStats,
    topDonors,
    recentPublicDonations,
  ] = await Promise.all([
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: 'active' }),
    Product.countDocuments({ status: { $ne: 'draft' } }),
    Donation.countDocuments({ status: 'completed' }),
    VolunteerRegistration.countDocuments({ status: { $in: ['approved', 'completed'] } }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS, purpose: PAYMENT_PURPOSE.DONATION } },
      { $group: { _id: '$payer', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, totalAmount: 1, count: 1, 'user.fullName': 1 } },
    ]),
    Donation.find({ status: { $in: ['completed', 'approved', 'received'] } })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('donor', 'fullName')
      .populate('campaign', 'title slug')
      .select('type amount donor isAnonymous campaign createdAt'),
  ]);

  const sanitizedRecent = recentPublicDonations.map((d) => ({
    _id: d._id,
    type: d.type,
    amount: d.amount,
    donorName: d.isAnonymous ? 'Nhà hảo tâm ẩn danh' : (d.donor?.fullName || 'Nhà hảo tâm'),
    campaignTitle: d.campaign?.title,
    campaignId: d.campaign?._id,
    createdAt: d.createdAt,
  }));

  const sanitizedTopDonors = topDonors.map((td, index) => ({
    rank: index + 1,
    name: td.user?.fullName
      ? td.user.fullName.split(' ').slice(-1)[0] + ' ' + (td.user.fullName.charAt(0) || 'U') + '***'
      : 'Mạnh thường quân',
    totalAmount: td.totalAmount,
    count: td.count,
  }));

  return success(res, {
    totalRaised: moneyStats[0]?.total || 0,
    totalDonations: totalDonations || 0,
    totalCampaigns: totalCampaigns || 0,
    activeCampaigns: activeCampaigns || 0,
    totalProducts: totalProducts || 0,
    totalVolunteers: totalVolunteers || 0,
    topDonors: sanitizedTopDonors,
    recentDonations: sanitizedRecent,
  });
});

const transparencyLedger = asyncHandler(async (_req, res) => {
  const SupportRequest = require('../models/SupportRequest');

  const [donations, payments, supports] = await Promise.all([
    Donation.find({ status: 'completed' })
      .populate('donor', 'fullName')
      .populate('campaign', 'title')
      .sort({ processedAt: -1, createdAt: -1 })
      .limit(30),
    Payment.find({ status: PAYMENT_STATUS.SUCCESS, purpose: PAYMENT_PURPOSE.ORDER })
      .populate('payer', 'fullName')
      .sort({ paidAt: -1 })
      .limit(30),
    SupportRequest.find({ status: 'completed' })
      .populate('beneficiary', 'fullName')
      .populate('campaign', 'title')
      .sort({ handledAt: -1, updatedAt: -1 })
      .limit(20),
  ]);

  const transactions = [];

  donations.forEach((d) => {
    transactions.push({
      id: d._id,
      code: `DON-${d._id.toString().slice(-6).toUpperCase()}`,
      direction: 'INFLOW',
      category: d.type === 'money' ? 'DONATION_MONEY' : 'DONATION_PRODUCT',
      title: d.type === 'money' ? 'Quyên góp tiền mặt trực tiếp' : `Hiện vật: ${d.productInfo?.name || 'Vật phẩm'}`,
      amount: d.amount || d.productInfo?.estimatedValue || 0,
      partner: d.isAnonymous ? 'Nhà hảo tâm ẩn danh' : (d.donor?.fullName || 'Nhà hảo tâm'),
      campaignTitle: d.campaign?.title || 'Quỹ Chung ReGive',
      campaignId: d.campaign?._id,
      timestamp: d.processedAt || d.createdAt,
      proofType: 'Biên lai điện tử',
    });
  });

  payments.forEach((p) => {
    transactions.push({
      id: p._id,
      code: `ORD-${p._id.toString().slice(-6).toUpperCase()}`,
      direction: 'INFLOW',
      category: 'MARKETPLACE_REVENUE',
      title: `Doanh thu bán đồ tuần hoàn (Mã ${p.paymentCode})`,
      amount: p.amount,
      partner: p.payer?.fullName ? `${p.payer.fullName.split(' ').slice(-1)[0]} (Mua hàng)` : 'Người mua tuần hoàn',
      campaignTitle: '100% Phân bổ vào Quỹ Chiến Dịch',
      timestamp: p.paidAt || p.createdAt,
      proofType: 'Cổng thanh toán Sandbox',
    });
  });

  supports.forEach((s) => {
    transactions.push({
      id: s._id,
      code: `SUP-${s._id.toString().slice(-6).toUpperCase()}`,
      direction: 'OUTFLOW',
      category: 'BENEFICIARY_DISBURSEMENT',
      title: `Giải ngân cứu trợ: ${s.title}`,
      // Không bịa số tiền giải ngân: hồ sơ cứu trợ hiện chưa có trường số tiền thực tế.
      // Trả về null để frontend hiển thị "Đang cập nhật" và loại khỏi tổng OUTFLOW.
      amount: null,
      partner: s.beneficiary?.fullName || 'Người thụ hưởng',
      campaignTitle: s.campaign?.title || 'Chương trình trợ cấp ReGive',
      campaignId: s.campaign?._id,
      timestamp: s.handledAt || s.updatedAt,
      proofType: 'Biên bản nghiệm thu & trao quà',
    });
  });

  transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalInflow = transactions
    .filter((t) => t.direction === 'INFLOW')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOutflow = transactions
    .filter((t) => t.direction === 'OUTFLOW' && typeof t.amount === 'number')
    .reduce((sum, t) => sum + t.amount, 0);

  return success(res, {
    summary: {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      transactionCount: transactions.length,
      lastAuditedAt: new Date(),
    },
    transactions: transactions.slice(0, 50),
  });
});

module.exports = { overview, publicImpact, transparencyLedger };
