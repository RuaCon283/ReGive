const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const ctrl = require('../controllers/uploadController');

const router = express.Router();

router.post(
  '/single',
  authenticate,
  uploadSingle('image'),
  ctrl.uploadImage
);

router.post(
  '/multiple',
  authenticate,
  uploadMultiple('images', 5),
  ctrl.uploadMultipleImages
);

router.delete(
  '/delete',
  authenticate,
  ctrl.deleteImage
);

module.exports = router;