const { body, param } = require('express-validator');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const VolunteerRegistration = require('../models/VolunteerRegistration');
const { CAMPAIGN_STATUS, DONATION_STATUS } = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');

// Một nguồn duy nhất cho validators chiến dịch: create (bắt buộc trường chính) và update (mọi trường optional)
function buildCampaignValidators({ optional = false } = {}) {
  const req = (field) => (optional ? body(field).optional() : body(field));
  return [
    req('title').trim().notEmpty(),
    req('shortDescription').isString(),
    req('description').trim().notEmpty(),
    req('goal').trim().notEmpty(),
    req('location').trim().notEmpty(),
    req('startDate').isISO8601(),
    req('endDate').isISO8601(),
    body('status').optional().isIn(Object.values(CAMPAIGN_STATUS)),
    body('urgency').optional().isIn(['normal', 'urgent', 'emergency']),
    body('targetAmount').optional().isFloat({ min: 0 }),
    body('beneficiaryCount').optional().isInt({ min: 0 }),
    req('beneficiaryUnit').isString(),
    req('impactSummary').isString(),
    req('category').isString(),
    req('bannerImage').isString(),
    req('galleryImages').isArray(),
    req('organization').isString(),
    req('contactInfo').isObject(),
    req('bankAccount').isObject(),
    req('volunteerConditions').isString(),
    req('targetItems').isArray(),
    req('budgetBreakdown').isArray(),
    req('timeline').isArray(),
    req('faqs').isArray(),
    req('verificationStatus').isObject(),
    req('donationGuidelines').isObject(),
    req('tags').isArray(),
  ];
}

const campaignBodyValidators = buildCampaignValidators();
const campaignUpdateValidators = buildCampaignValidators({ optional: true });

const idParam = [param('id').isMongoId()];

const listPublic = asyncHandler(async (req, res) => {
  const filter = { status: CAMPAIGN_STATUS.ACTIVE };
  if (req.query.status && req.user && ['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
    filter.status = req.query.status;
  }
  if (req.query.category && req.query.category !== 'all') {
    filter.category = req.query.category;
  }
  const campaigns = await Campaign.find(filter)
    .populate('createdBy', 'fullName email')
    .sort({ startDate: -1 });

  const campaignIds = campaigns.map((c) => c._id);
  const [donationCounts, volunteerCounts] = await Promise.all([
    Donation.aggregate([
      {
        $match: {
          campaign: { $in: campaignIds },
          status: { $in: ['completed', 'confirmed', 'processing'] },
        },
      },
      { $group: { _id: '$campaign', count: { $sum: 1 } } },
    ]),
    VolunteerRegistration.aggregate([
      {
        $match: {
          campaign: { $in: campaignIds },
          status: { $in: ['approved', 'completed', 'pending'] },
        },
      },
      { $group: { _id: '$campaign', count: { $sum: 1 } } },
    ]),
  ]);

  const donationCountMap = Object.fromEntries(donationCounts.map((d) => [d._id.toString(), d.count]));
  const volunteerCountMap = Object.fromEntries(volunteerCounts.map((v) => [v._id.toString(), v.count]));

  const enrichedCampaigns = campaigns.map((c) => {
    const obj = c.toObject();
    obj.donationCount = donationCountMap[c._id.toString()] || 0;
    obj.volunteerCount = volunteerCountMap[c._id.toString()] || 0;
    return obj;
  });

  return success(res, { campaigns: enrichedCampaigns });
});

const listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const campaigns = await Campaign.find(filter)
    .populate('createdBy', 'fullName email role')
    .sort({ createdAt: -1 });
  return success(res, { campaigns });
});

const getById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate(
    'createdBy',
    'fullName email role'
  );
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const isStaff = req.user && ['ADMIN', 'EMPLOYEE'].includes(req.user.role);
  if (campaign.status !== CAMPAIGN_STATUS.ACTIVE && !isStaff) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const [donationCount, volunteerCount] = await Promise.all([
    Donation.countDocuments({
      campaign: campaign._id,
      status: { $in: ['completed', 'confirmed', 'processing'] },
    }),
    VolunteerRegistration.countDocuments({
      campaign: campaign._id,
      status: { $in: ['approved', 'completed', 'pending'] },
    }),
  ]);

  const obj = campaign.toObject();
  obj.donationCount = donationCount;
  obj.volunteerCount = volunteerCount;

  return success(res, { campaign: obj });
});

const listPublicDonations = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const donations = await Donation.find({
    campaign: req.params.id,
    status: {
      $in: [
        DONATION_STATUS.COMPLETED,
        DONATION_STATUS.CONFIRMED,
        DONATION_STATUS.PROCESSING,
      ],
    },
  })
    .populate('donor', 'fullName')
    .sort({ createdAt: -1 })
    .limit(50);

  const sanitized = donations.map((d) => {
    const obj = d.toObject ? d.toObject() : { ...d };
    if (obj.isAnonymous || !obj.donor) {
      obj.donor = { fullName: 'Nhà hảo tâm ẩn danh' };
    } else {
      obj.donor = { fullName: obj.donor.fullName || 'Nhà hảo tâm' };
    }
    return {
      _id: obj._id,
      donor: obj.donor,
      type: obj.type,
      amount: obj.amount,
      productInfo: obj.productInfo,
      note: obj.note,
      isAnonymous: obj.isAnonymous,
      createdAt: obj.createdAt,
    };
  });

  return success(res, { donations: sanitized });
});

const listVolunteers = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const volunteers = await VolunteerRegistration.find({
    campaign: req.params.id,
    status: { $in: ['approved', 'completed', 'pending'] },
  })
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(50);

  const sanitized = volunteers.map((v) => ({
    _id: v._id,
    userName: v.user?.fullName || 'Tình nguyện viên',
    status: v.status,
    skills: v.skills,
    schedule: v.schedule,
    createdAt: v.createdAt,
  }));

  return success(res, { volunteers: sanitized, total: sanitized.length });
});

const addActivity = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const isOwner = campaign.createdBy.toString() === req.user._id.toString();
  const isStaff = ['ADMIN', 'EMPLOYEE'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Bạn không có quyền truy cập');
  }

  const { title, content, image, author, date } = req.body;
  if (!title || !content) {
    throw new ApiError(400, 'Vui lòng nhập tiêu đề và nội dung');
  }

  campaign.activities.push({
    title,
    content,
    image: image || '',
    author: author || req.user.fullName || 'Ban điều phối ReGive',
    date: date ? new Date(date) : new Date(),
  });

  await campaign.save();
  return success(res, { campaign }, 'Hoạt động đã được thêm vào nhật ký thực địa', 201);
});

const create = asyncHandler(async (req, res) => {
  const {
    title,
    shortDescription,
    description,
    goal,
    location,
    startDate,
    endDate,
    status,
    urgency,
    targetAmount,
    beneficiaryCount,
    beneficiaryUnit,
    impactSummary,
    category,
    bannerImage,
    galleryImages,
    organization,
    contactInfo,
    bankAccount,
    volunteerConditions,
    targetItems,
    budgetBreakdown,
    timeline,
    faqs,
    verificationStatus,
    donationGuidelines,
    tags,
  } = req.body;

  if (new Date(endDate) < new Date(startDate)) {
    throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  }

  const isStaff = ['ADMIN', 'EMPLOYEE'].includes(req.user.role);
  const initialStatus = isStaff ? status || CAMPAIGN_STATUS.ACTIVE : CAMPAIGN_STATUS.DRAFT;

  const campaign = await Campaign.create({
    title,
    shortDescription: shortDescription || '',
    description,
    goal,
    location,
    startDate,
    endDate,
    status: initialStatus,
    urgency: urgency || 'normal',
    targetAmount: targetAmount || 0,
    beneficiaryCount: beneficiaryCount || 0,
    beneficiaryUnit: beneficiaryUnit || 'người thụ hưởng',
    impactSummary: impactSummary || '',
    category: category || 'chung',
    bannerImage: bannerImage || '',
    galleryImages: galleryImages || [],
    organization: organization || 'Ban Điều Hành ReGive',
    contactInfo: contactInfo || {},
    bankAccount: bankAccount || {},
    volunteerConditions: volunteerConditions || '',
    targetItems: targetItems || [],
    budgetBreakdown: budgetBreakdown || [],
    timeline: timeline || [],
    faqs: faqs || [],
    verificationStatus: verificationStatus || {},
    donationGuidelines: donationGuidelines || {},
    tags: tags || [],
    createdBy: req.user._id,
  });

  return success(res, { campaign }, 'Chiến dịch đã được tạo thành công', 201);
});

const update = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const isOwner = campaign.createdBy.toString() === req.user._id.toString();
  const isStaff = ['ADMIN', 'EMPLOYEE'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Bạn không có quyền truy cập');
  }

  const fields = [
    'title',
    'shortDescription',
    'description',
    'goal',
    'location',
    'startDate',
    'endDate',
    'status',
    'urgency',
    'targetAmount',
    'beneficiaryCount',
    'beneficiaryUnit',
    'impactSummary',
    'category',
    'bannerImage',
    'galleryImages',
    'organization',
    'contactInfo',
    'bankAccount',
    'volunteerConditions',
    'targetItems',
    'budgetBreakdown',
    'timeline',
    'faqs',
    'verificationStatus',
    'donationGuidelines',
    'tags',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      campaign[field] = req.body[field];
    }
  });

  if (new Date(campaign.endDate) < new Date(campaign.startDate)) {
    throw new ApiError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  }

  await campaign.save();
  return success(res, { campaign }, 'Chiến dịch đã được cập nhật thành công');
});

const remove = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Không tìm thấy chiến dịch');
  }

  const isOwner = campaign.createdBy.toString() === req.user._id.toString();
  const isStaff = ['ADMIN'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Bạn không có quyền truy cập');
  }

  await Campaign.findByIdAndDelete(req.params.id);
  return success(res, null, 'Chiến dịch đã được xóa thành công');
});

module.exports = {
  campaignBodyValidators,
  campaignUpdateValidators,
  idParam,
  listPublic,
  listAll,
  getById,
  listPublicDonations,
  listVolunteers,
  addActivity,
  create,
  update,
  remove,
};
