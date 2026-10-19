const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử chậm lại.',
  },
});

// Giới hạn riêng cho endpoint AI công khai (tốn chi phí gọi model AI)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã dùng hết lượt thử AI trong phút này. Vui lòng thử lại sau.',
  },
});

module.exports = { authLimiter, apiLimiter, aiLimiter };
