const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { ROLES } = require('../constants/enums');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post('/register', authLimiter, ctrl.registerValidators, validate, ctrl.register);
router.post('/login', authLimiter, ctrl.loginValidators, validate, ctrl.login);
router.post('/forgot-password', authLimiter, ctrl.forgotPasswordValidators, validate, ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPasswordValidators, validate, ctrl.resetPassword);
router.post('/verify-email', ctrl.verifyEmailValidators, validate, ctrl.verifyEmail);
router.get('/me', authenticate, ctrl.me);
router.patch(
  '/me',
  authenticate,
  ctrl.updateProfileValidators,
  validate,
  ctrl.updateProfile
);
router.post('/resend-verification', authenticate, ctrl.resendVerification);
router.get('/users', authenticate, authorize(ROLES.ADMIN), ctrl.listUsers);
router.patch(
  '/users/:id/role',
  authenticate,
  authorize(ROLES.ADMIN),
  ctrl.updateUserRoleValidators,
  validate,
  ctrl.updateUserRole
);
router.patch(
  '/users/:id/status',
  authenticate,
  authorize(ROLES.ADMIN),
  ctrl.updateUserStatusValidators,
  validate,
  ctrl.updateUserStatus
);

module.exports = router;
