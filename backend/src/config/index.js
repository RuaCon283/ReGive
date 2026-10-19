const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (() => {
    const listed = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const webOrigin = 'http://localhost:3000';
    if (!listed.includes(webOrigin)) listed.push(webOrigin);
    return listed;
  })(),
  nodeEnv: process.env.NODE_ENV || 'development',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  aiModel: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-2.0-flash',
  vnpay: {
    url: process.env.VN_PAY_URL || '',
    merchantId: process.env.VN_PAY_MERCHANT_ID || '',
    // VN_PAY_HASH_SECRET là biến chuẩn; giữ fallback HASH_KEY cũ cho tương thích .env đã phát hành
    hashSecret: process.env.VN_PAY_HASH_SECRET || process.env.VN_PAY_HASH_KEY || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'ReGive <noreply@regive.vn>',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

module.exports = config;
