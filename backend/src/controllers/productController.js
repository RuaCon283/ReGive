const { body, param } = require('express-validator');
const Product = require('../models/Product');
const Donation = require('../models/Donation');
const Order = require('../models/Order');
const AiAssessment = require('../models/AiAssessment');
const {
  ROLES,
  DONATION_TYPES,
  DONATION_STATUS,
  PRODUCT_STATUS,
  PRODUCT_CONDITION,
  PRODUCT_QUALITY,
  UNSAFE_CONDITIONS,
} = require('../constants/enums');
const { ApiError, success, asyncHandler } = require('../utils/api');
const { canListProduct } = require('../services/productRules');

const intakeValidators = [
  body('donationId').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('images').optional().isArray(),
];

const assessValidators = [
  param('id').isMongoId(),
  body('category').optional().trim().notEmpty(),
  body('condition').isIn(Object.values(PRODUCT_CONDITION)),
  body('quality').isIn(Object.values(PRODUCT_QUALITY)),
  body('suggestedPrice').optional().isFloat({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('suitableForMarketplace').optional().isBoolean(),
  body('assessmentNote').optional().isString(),
  body('description').optional().isString(),
];

const updateValidators = [
  param('id').isMongoId(),
  body('sku').optional().isString(),
  body('name').optional().trim().isString().notEmpty(),
  body('brand').optional().isString(),
  body('origin').optional().isString(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('images').optional().isArray(),
  body('originalPrice').optional().isFloat({ min: 0 }),
  body('price').optional().isFloat({ min: 0 }),
  body('suggestedPrice').optional().isFloat({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('dimensions').optional().isObject(),
  body('material').optional().isString(),
  body('color').optional().isString(),
  body('tags').optional().isArray(),
  body('highlights').optional().isArray(),
  body('specifications').optional().isObject(),
  body('inspectionReport').optional().isObject(),
  body('donationStory').optional().isObject(),
  body('charityImpact').optional().isObject(),
  body('warehouseAndShipping').optional().isObject(),
  body('guaranteePolicy').optional().isObject(),
  body('storageLocation').optional().isString(),
  body('assessmentNote').optional().isString(),
];

const idParam = [param('id').isMongoId()];

const intakeFromDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.body.donationId);
  if (!donation) throw new ApiError(404, 'Không tìm thấy quyên góp');
  if (donation.type !== DONATION_TYPES.PRODUCT) {
    throw new ApiError(400, 'Chỉ quyên góp sản phẩm mới có thể chuyển thành sản phẩm');
  }
  if ([DONATION_STATUS.REJECTED].includes(donation.status)) {
    throw new ApiError(400, 'Không thể tiếp nhận quyên góp đã bị từ chối');
  }

  const existing = await Product.findOne({ donation: donation._id });
  if (existing) {
    throw new ApiError(409, 'Sản phẩm đã được tạo từ quyên góp này', {
      productId: existing._id,
    });
  }

  const product = await Product.create({
    name: req.body.name || donation.productInfo?.name || 'Sản phẩm quyên góp',
    description: req.body.description || donation.productInfo?.description || '',
    category: req.body.category || 'other',
    images: req.body.images || [],
    donation: donation._id,
    campaign: donation.campaign,
    stockQuantity: 0,
    createdBy: req.user._id,
    status: PRODUCT_STATUS.DRAFT,
  });

  if (donation.status === DONATION_STATUS.PENDING) {
    donation.status = DONATION_STATUS.PROCESSING;
    donation.processedBy = req.user._id;
    donation.processedAt = new Date();
    await donation.save();
  }

  return success(res, { product }, 'Tiếp nhận sản phẩm thành công', 201);
});

const assess = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  product.condition = req.body.condition;
  product.quality = req.body.quality;
  if (req.body.category !== undefined) product.category = req.body.category;
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.body.suggestedPrice !== undefined) product.suggestedPrice = req.body.suggestedPrice;
  if (req.body.price !== undefined) {
    product.price = req.body.price;
  } else if (req.body.suggestedPrice !== undefined && !product.price) {
    product.price = req.body.suggestedPrice;
  }
  if (req.body.assessmentNote !== undefined) product.assessmentNote = req.body.assessmentNote;

  const suitable =
    req.body.suitableForMarketplace !== undefined
      ? Boolean(req.body.suitableForMarketplace)
      : !UNSAFE_CONDITIONS.includes(product.condition) &&
        product.condition !== PRODUCT_CONDITION.POOR;

  if (UNSAFE_CONDITIONS.includes(product.condition)) {
    product.suitableForMarketplace = false;
    product.status = PRODUCT_STATUS.REJECTED;
  } else {
    product.suitableForMarketplace = suitable;
    product.status = PRODUCT_STATUS.ASSESSED;
  }

  product.reviewed = true;
  product.reviewedBy = req.user._id;
  product.reviewedAt = new Date();
  await product.save();

  return success(res, { product }, 'Đánh giá sản phẩm thành công');
});

const listManage = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.reviewed !== undefined) filter.reviewed = req.query.reviewed === 'true';

  const products = await Product.find(filter)
    .populate('donation', 'type status productInfo donor')
    .populate('campaign', 'title')
    .populate('createdBy', 'fullName email')
    .populate('reviewedBy', 'fullName email')
    .sort({ createdAt: -1 });

  return success(res, { products });
});

const getById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'donation',
      select: 'type status productInfo donor isAnonymous note createdAt',
      populate: { path: 'donor', select: 'fullName email' },
    })
    .populate('campaign', 'title status bannerImage targetAmount raisedAmount location description')
    .populate('latestAiAssessment')
    .populate('createdBy', 'fullName email')
    .populate('reviewedBy', 'fullName email');

  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  const isStaff = [ROLES.ADMIN, ROLES.EMPLOYEE].includes(req.user?.role);
  if (!product.listedOnMarketplace && !isStaff) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }

  return success(res, { product });
});

const listMarketplace = asyncHandler(async (req, res) => {
  const filter = {
    listedOnMarketplace: true,
    status: PRODUCT_STATUS.LISTED,
    stockQuantity: { $gt: 0 },
  };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.condition) filter.condition = req.query.condition;

  const products = await Product.find(filter)
    .populate('campaign', 'title bannerImage targetAmount raisedAmount location status')
    .populate('latestAiAssessment', 'suggestion status')
    .select('-assessmentNote')
    .sort({ listedAt: -1 });

  return success(res, { products });
});

const getMarketplaceDetail = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    listedOnMarketplace: true,
    status: PRODUCT_STATUS.LISTED,
  })
    .populate('campaign', 'title bannerImage targetAmount raisedAmount location status description category organization contactInfo')
    .populate({
      path: 'donation',
      select: 'donor isAnonymous productInfo note createdAt type',
      populate: { path: 'donor', select: 'fullName email' },
    })
    .populate('latestAiAssessment')
    .populate('reviewedBy', 'fullName email')
    .select('-assessmentNote');

  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm trên marketplace');
  return success(res, { product });
});

const publish = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  const check = canListProduct(product);
  if (!check.ok) throw new ApiError(400, check.reason);

  product.listedOnMarketplace = true;
  product.listedAt = new Date();
  product.status = PRODUCT_STATUS.LISTED;
  await product.save();

  return success(res, { product }, 'Đăng bán sản phẩm trên marketplace thành công');
});

const unpublish = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  product.listedOnMarketplace = false;
  product.status =
    product.stockQuantity > 0 ? PRODUCT_STATUS.IN_STOCK : PRODUCT_STATUS.SOLD_OUT;
  await product.save();

  return success(res, { product }, 'Gỡ sản phẩm khỏi marketplace thành công');
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  const fields = [
    'sku',
    'name',
    'brand',
    'origin',
    'description',
    'category',
    'images',
    'originalPrice',
    'price',
    'suggestedPrice',
    'weight',
    'dimensions',
    'material',
    'color',
    'tags',
    'highlights',
    'specifications',
    'inspectionReport',
    'donationStory',
    'charityImpact',
    'warehouseAndShipping',
    'guaranteePolicy',
    'storageLocation',
    'assessmentNote',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });

  await product.save();
  return success(res, { product }, 'Cập nhật sản phẩm thành công');
});

const removeProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Không tìm thấy sản phẩm');

  // Chặn xoá khi sản phẩm đang niêm yết trên marketplace
  if (product.listedOnMarketplace && product.status === PRODUCT_STATUS.LISTED) {
    throw new ApiError(400, 'Sản phẩm đang bán trên marketplace. Vui lòng gỡ bán trước khi xoá.');
  }

  // Chặn xoá khi sản phẩm đã nằm trong đơn hàng (giữ nguyên vẹn dữ liệu giao dịch)
  const orderCount = await Order.countDocuments({ 'items.product': product._id });
  if (orderCount > 0) {
    throw new ApiError(
      409,
      `Không thể xoá: sản phẩm đã nằm trong ${orderCount} đơn hàng. Hãy gỡ bán (unpublish) thay vì xoá.`
    );
  }

  // Xoá sạch các bản đánh giá AI liên quan, rồi xoá sản phẩm
  await AiAssessment.deleteMany({ product: product._id });
  await product.deleteOne();

  return success(res, null, 'Đã xoá sản phẩm thành công');
});

module.exports = {
  intakeValidators,
  assessValidators,
  updateValidators,
  idParam,
  intakeFromDonation,
  assess,
  listManage,
  getById,
  listMarketplace,
  getMarketplaceDetail,
  publish,
  unpublish,
  updateProduct,
  removeProduct,
};
