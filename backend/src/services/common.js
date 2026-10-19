const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config');
const Notification = require('../models/Notification');

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function createNotification({ userId, title, message, type = 'system', relatedId = null }) {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    relatedId,
  });

  // Send email notification in background (non-blocking)
  if (type !== 'system') {
    const User = require('../models/User');
    User.findById(userId).then((user) => {
      if (user && user.isEmailVerified) {
        const { sendNotificationEmail } = require('./common');
        sendNotificationEmail(user, title, message).catch(() => {});
      }
    }).catch(() => {});
  }

  return notification;
}

/* ───────────── Email Service ───────────── */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!config.email.user || !config.email.pass) {
    // No SMTP credentials — use ethereal (test) account for dev
    console.warn('[Email] SMTP_USER/SMTP_PASS chưa cấu hình, dùng console logger.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    // Fallback: log to console in development
    console.log('═══════════════════════════════════════════');
    console.log(`[EMAIL] To: ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${text || '(HTML only)'}`);
    console.log('═══════════════════════════════════════════');
    return { messageId: 'console-log', accepted: [to] };
  }

  try {
    const info = await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    // Gửi SMTP thất bại (sai credentials / mất mạng / bị chặn):
    // dump lại toàn bộ nội dung (kèm link xác thực/reset) ra console để dev/demo vẫn lấy được,
    // rồi rethrow cho caller log thêm ngữ cảnh.
    console.error('[Email] Gửi SMTP thất bại:', err.message);
    console.log('═══════════════════════════════════════════');
    console.log(`[EMAIL-FALLBACK] To: ${to}`);
    console.log(`[EMAIL-FALLBACK] Subject: ${subject}`);
    console.log(`[EMAIL-FALLBACK] Body: ${text || '(HTML only)'}`);
    console.log('═══════════════════════════════════════════');
    throw err;
  }
}

async function sendVerificationEmail(user, token) {
  const link = `${config.frontendUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Xác thực email tài khoản ReGive',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #024870; margin: 0;">Re<span style="color: #18c9ff;">Give</span></h1>
        </div>
        <div style="background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; color: #1e293b;">Xác thực email của bạn</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Xin chào <strong>${user.fullName}</strong>,<br/>
            Vui lòng nhấn nút bên dưới để xác thực email và kích hoạt tài khoản ReGive.
          </p>
          <a href="${link}" style="display: inline-block; background: #024870; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Xác thực email
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Link xác thực sẽ hết hạn sau 24 giờ.<br/>
            Nếu bạn không tạo tài khoản ReGive, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `,
    text: `Xin chào ${user.fullName},\n\nVui lòng truy cập link sau để xác thực email: ${link}\n\nLink sẽ hết hạn sau 24 giờ.`,
  });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${config.frontendUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Đặt lại mật khẩu ReGive',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #024870; margin: 0;">Re<span style="color: #18c9ff;">Give</span></h1>
        </div>
        <div style="background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; color: #1e293b;">Đặt lại mật khẩu</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Xin chào <strong>${user.fullName}</strong>,<br/>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
            Nhấn nút bên dưới để tạo mật khẩu mới.
          </p>
          <a href="${link}" style="display: inline-block; background: #024870; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Đặt lại mật khẩu
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
            Link đặt lại mật khẩu sẽ hết hạn sau 1 giờ.<br/>
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          </p>
        </div>
      </div>
    `,
    text: `Xin chào ${user.fullName},\n\nVui lòng truy cập link sau để đặt lại mật khẩu: ${link}\n\nLink sẽ hết hạn sau 1 giờ.`,
  });
}

async function sendNotificationEmail(user, title, message) {
  return sendEmail({
    to: user.email,
    subject: `[ReGive] ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #024870; margin: 0;">Re<span style="color: #18c9ff;">Give</span></h1>
        </div>
        <div style="background: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; color: #1e293b;">${title}</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            Xin chào <strong>${user.fullName}</strong>,<br/><br/>
            ${message}
          </p>
          <a href="${config.frontendUrl}/notifications" style="display: inline-block; background: #024870; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Xem thông báo
          </a>
        </div>
      </div>
    `,
    text: `Xin chào ${user.fullName},\n\n${title}\n\n${message}\n\nXem chi tiết tại: ${config.frontendUrl}/notifications`,
  });
}

module.exports = {
  signToken,
  createNotification,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendNotificationEmail,
};
