const express = require('express');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../constants/enums');
const ctrl = require('../controllers/productController');

const router = express.Router();

// Marketplace (public)
router.get('/marketplace', ctrl.listMarketplace);
router.get('/marketplace/:id', ctrl.idParam, validate, ctrl.getMarketplaceDetail);

// Staff product ops
router.post(
  '/intake',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.intakeValidators,
  validate,
  ctrl.intakeFromDonation
);
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.createValidators,
  validate,
  ctrl.createProduct
);
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.listManage
);
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.idParam,
  validate,
  ctrl.getById
);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.updateValidators,
  validate,
  ctrl.updateProduct
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.idParam,
  validate,
  ctrl.removeProduct
);
router.post(
  '/:id/assess',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.assessValidators,
  validate,
  ctrl.assess
);
router.post(
  '/:id/publish',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.idParam,
  validate,
  ctrl.publish
);
router.post(
  '/:id/unpublish',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  ctrl.idParam,
  validate,
  ctrl.unpublish
);

module.exports = router;
