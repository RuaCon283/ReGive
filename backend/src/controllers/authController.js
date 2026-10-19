const { body, param } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { ROLES } = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');
const { signToken, sendVerificationEmail, sendPasswordResetEmail } = require('../services/common');

const registerValidators = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('role')
    .optional()
    .isIn([ROLES.USER, ROLES.BENEFICIARY])
    .withMessage('Đăng ký công khai chỉ cho phép vai trò USER hoặc BENEFICIARY'),
];

const loginValidators = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

const updateProfileValidators = [
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('address').optional().isString(),
  body('beneficiaryInfo.householdSize').optional().isInt({ min: 1 }),
  body('beneficiaryInfo.note').optional().isString(),
];

const updateUserRoleValidators = [
  param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
  body('role').isIn(Object.values(ROLES)).withMessage('Vai trò không hợp lệ'),
];

const updateUserStatusValidators = [
  param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
  body('isActive').isBoolean().withMessage('Trạng thái không hợp lệ'),
];

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('Vui lòng nhập email hợp lệ'),
];

const resetPasswordValidators = [
  body('token').notEmpty().withMessage('Token không hợp lệ'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
];

const verifyEmailValidators = [
  body('token').notEmpty().withMessage('Token xác thực không hợp lệ'),
];

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone, address, role } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new ApiError(409, 'Email đã được đăng ký');
  }

  const passwordHash = await User.hashPassword(password);
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await User.create({
    email,
    passwordHash,
    fullName,
    phone: phone || '',
    address: address || '',
    role: role === ROLES.BENEFICIARY ? ROLES.BENEFICIARY : ROLES.USER,
    emailVerificationToken,
    emailVerificationExpires,
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(user, emailVerificationToken).catch((err) => {
    console.warn('[Email] Gửi email xác thực thất bại:', err.message);
  });

  const token = signToken(user);
  return success(res, { user: user.toSafeObject(), token }, 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Email hoặc mật khẩu không đúng');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Tài khoản đang bị vô hiệu hóa');
  }

  const token = signToken(user);
  return success(res, { user: user.toSafeObject(), token }, 'Đăng nhập thành công');
});

const me = asyncHandler(async (req, res) => {
  return success(res, { user: req.user.toSafeObject() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  const { fullName, phone, address, beneficiaryInfo } = req.body;
  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (beneficiaryInfo) {
    if (beneficiaryInfo.householdSize !== undefined) {
      user.beneficiaryInfo.householdSize = beneficiaryInfo.householdSize;
    }
    if (beneficiaryInfo.note !== undefined) {
      user.beneficiaryInfo.note = beneficiaryInfo.note;
    }
  }

  await user.save();
  return success(res, { user: user.toSafeObject() }, 'Cập nhật hồ sơ thành công');
});

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  return success(res, { users: users.map((u) => u.toSafeObject()) });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Không thể thay đổi vai trò của chính mình');
  }
  user.role = req.body.role;
  await user.save();
  return success(res, { user: user.toSafeObject() }, 'Đã cập nhật vai trò người dùng');
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }
  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Không thể thay đổi trạng thái của chính mình');
  }
  user.isActive = req.body.isActive;
  await user.save();
  return success(
    res,
    { user: user.toSafeObject() },
    req.body.isActive ? 'Tài khoản đã được kích hoạt' : 'Tài khoản đã bị vô hiệu hóa'
  );
});

/* ─── Forgot Password ─── */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    // Don't reveal whether the email exists
    return success(res, null, 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email (non-blocking)
  sendPasswordResetEmail(user, resetToken).catch((err) => {
    console.warn('[Email] Gửi email đặt lại mật khẩu thất bại:', err.message);
  });

  return success(res, null, 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
});

/* ─── Reset Password ─── */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires +passwordHash');

  if (!user) {
    throw new ApiError(400, 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return success(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.');
});

/* ─── Verify Email ─── */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(400, 'Token xác thực email không hợp lệ hoặc đã hết hạn');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  return success(res, { user: user.toSafeObject() }, 'Xác thực email thành công!');
});

/* ─── Resend Verification Email ─── */
const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email đã được xác thực');
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  sendVerificationEmail(user, emailVerificationToken).catch((err) => {
    console.warn('[Email] Gửi lại email xác thực thất bại:', err.message);
  });

  return success(res, null, 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.');
});

module.exports = {
  registerValidators,
  loginValidators,
  updateProfileValidators,
  updateUserRoleValidators,
  updateUserStatusValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  verifyEmailValidators,
  register,
  login,
  me,
  updateProfile,
  listUsers,
  updateUserRole,
  updateUserStatus,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
