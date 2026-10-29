const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/enums');
const ctrl = require('../controllers/volunteerController');

const router = express.Router();

router.use(authenticate);

router.post('/register', ctrl.registerValidators, validate, ctrl.register);
router.get('/me', ctrl.myRegistrations);
router.get('/', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), ctrl.listAll);
router.get('/:id', ctrl.idParam, validate, ctrl.getById);
router.patch(
  '/:id/review',
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.reviewValidators,
  validate,
  ctrl.review
);

module.exports = router;
