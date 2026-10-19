const cloudinary = require('cloudinary').v2;
const config = require('../config');
const { success, asyncHandler, ApiError } = require('../utils/api');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary?.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: config.cloudinary?.apiKey || process.env.CLOUDINARY_API_KEY,
  api_secret: config.cloudinary?.apiSecret || process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary chỉ dùng khi cấu hình đủ; thiếu thì fallback lưu local và serve qua /uploads
const isCloudinaryConfigured = Boolean(
  (config.cloudinary?.cloudName || process.env.CLOUDINARY_CLOUD_NAME) &&
    (config.cloudinary?.apiKey || process.env.CLOUDINARY_API_KEY) &&
    (config.cloudinary?.apiSecret || process.env.CLOUDINARY_API_SECRET)
);

function localFileUrl(req, filename) {
  const forwardedProto = req.get('x-forwarded-proto');
  const proto = forwardedProto ? forwardedProto.split(',')[0] : req.protocol;
  return `${proto}://${req.get('host')}/uploads/${filename}`;
}

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Vui lòng chọn file ảnh để upload');
  }

  // Fallback local khi chưa cấu hình Cloudinary (dev/demo)
  if (!isCloudinaryConfigured) {
    return success(res, {
      url: localFileUrl(req, req.file.filename),
      publicId: null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storage: 'local',
    }, 'Upload ảnh thành công (lưu trữ local)');
  }

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'regive',
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return success(res, {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
  }, 'Upload ảnh thành công');
});

const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'Vui lòng chọn ít nhất một file ảnh');
  }

  // Fallback local khi chưa cấu hình Cloudinary (dev/demo)
  if (!isCloudinaryConfigured) {
    const files = req.files.map((file) => ({
      url: localFileUrl(req, file.filename),
      publicId: null,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: 'local',
    }));
    return success(res, { files }, `Upload ${files.length} ảnh thành công (lưu trữ local)`);
  }

  const uploadPromises = req.files.map((file) =>
    cloudinary.uploader.upload(file.path, {
      folder: 'regive',
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })
  );

  const results = await Promise.all(uploadPromises);

  const files = results.map((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
  }));

  return success(res, { files }, `Upload ${files.length} ảnh thành công`);
});

const deleteImage = asyncHandler(async (req, res) => {
  const { publicId, filename } = req.body;

  if (!publicId && !filename) {
    throw new ApiError(400, 'Vui lòng cung cấp publicId (Cloudinary) hoặc filename (local) của ảnh');
  }

  // Ảnh local (fallback storage) — xoá file trên đĩa
  if (!publicId && filename) {
    const path = require('path');
    const fs = require('fs');
    const UPLOAD_DIR = path.join(__dirname, '../../uploads');
    const target = path.join(UPLOAD_DIR, path.basename(filename));
    if (fs.existsSync(target)) fs.unlinkSync(target);
    return success(res, null, 'Đã xoá ảnh local');
  }

  const result = await cloudinary.uploader.destroy(publicId);

  if (result.result !== 'ok') {
    throw new ApiError(500, 'Không thể xoá ảnh từ Cloudinary');
  }

  return success(res, null, 'Xoá ảnh thành công');
});

module.exports = { uploadImage, uploadMultipleImages, deleteImage };