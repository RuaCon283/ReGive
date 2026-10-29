const { body, param } = require('express-validator');
const VolunteerRegistration = require('../models/VolunteerRegistration');
const Campaign = require('../models/Campaign');
const {
  VOLUNTEER_STATUS,
  CAMPAIGN_STATUS,
  ROLES,
} = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');
const { createNotification } = require('../services/common');

const registerValidators = [
  body('campaignId').isMongoId(),
  body('skills').optional().isString(),
  body('availabilityNote').optional().isString(),
];

const reviewValidators = [
  param('id').isMongoId(),
  body('status').isIn([
    VOLUNTEER_STATUS.APPROVED,
    VOLUNTEER_STATUS.REJECTED,
    VOLUNTEER_STATUS.CANCELLED,
  ]),
  body('schedule.date').optional().isISO8601(),
  body('schedule.timeSlot').optional().isString(),
  body('schedule.location').optional().isString(),
];

const register = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.USER && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Chỉ tài khoản USER mới có thể đăng ký tình nguyện');
  }

  const campaign = await Campaign.findById(req.body.campaignId);
  if (!campaign || campaign.status !== CAMPAIGN_STATUS.ACTIVE) {
    throw new ApiError(400, 'Chiến dịch hiện không nhận đăng ký tình nguyện');
  }

  const existing = await VolunteerRegistration.findOne({
    user: req.user._id,
    campaign: req.body.campaignId,
  });
  if (existing) {
    throw new ApiError(409, 'Bạn đã đăng ký tình nguyện cho chiến dịch này');
  }

  const registration = await VolunteerRegistration.create({
    user: req.user._id,
    campaign: req.body.campaignId,
    skills: req.body.skills || '',
    availabilityNote: req.body.availabilityNote || '',
  });

  await createNotification({
    userId: req.user._id,
    title: 'Đã gửi đăng ký tình nguyện',
    message: 'Đăng ký tình nguyện của bạn đang chờ xét duyệt.',
    type: 'volunteer',
    relatedId: registration._id.toString(),
  });

  return success(res, { registration }, 'Đăng ký tình nguyện thành công', 201);
});

const myRegistrations = asyncHandler(async (req, res) => {
  const registrations = await VolunteerRegistration.find({ user: req.user._id })
    .populate('campaign', 'title location startDate endDate status')
    .sort({ createdAt: -1 });
  return success(res, { registrations });
});

const idParam = [param('id').isMongoId()];

const getById = asyncHandler(async (req, res) => {
  const registration = await VolunteerRegistration.findById(req.params.id)
    .populate('user', 'fullName email phone')
    .populate(
      'campaign',
      'title description location startDate endDate status bannerImage organization'
    )
    .populate('reviewedBy', 'fullName email');

  if (!registration) {
    throw new ApiError(404, 'Không tìm thấy đăng ký tình nguyện');
  }

  const isOwner =
    Boolean(registration.user) &&
    registration.user._id.toString() === req.user._id.toString();
  const isStaff = [ROLES.ADMIN, ROLES.EMPLOYEE].includes(req.user.role);
  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Bạn không có quyền truy cập');
  }

  return success(res, { registration });
});

const listAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.campaignId) filter.campaign = req.query.campaignId;

  const registrations = await VolunteerRegistration.find(filter)
    .populate('user', 'fullName email phone')
    .populate('campaign', 'title location status')
    .populate('reviewedBy', 'fullName email')
    .sort({ createdAt: -1 });
  return success(res, { registrations });
});

const review = asyncHandler(async (req, res) => {
  const registration = await VolunteerRegistration.findById(req.params.id);
  if (!registration) {
    throw new ApiError(404, 'Không tìm thấy đăng ký tình nguyện');
  }

  registration.status = req.body.status;
  registration.reviewedBy = req.user._id;
  registration.reviewedAt = new Date();

  if (req.body.schedule) {
    registration.schedule = {
      date: req.body.schedule.date || registration.schedule.date,
      timeSlot: req.body.schedule.timeSlot || registration.schedule.timeSlot,
      location: req.body.schedule.location || registration.schedule.location,
    };
  }

  await registration.save();

  await createNotification({
    userId: registration.user,
    title: 'Cập nhật đăng ký tình nguyện',
    message: `Trạng thái tình nguyện của bạn hiện là ${registration.status}.`,
    type: 'volunteer',
    relatedId: registration._id.toString(),
  });

  return success(res, { registration }, 'Duyệt đăng ký tình nguyện thành công');
});

module.exports = {
  registerValidators,
  reviewValidators,
  idParam,
  register,
  myRegistrations,
  getById,
  listAll,
  review,
};
