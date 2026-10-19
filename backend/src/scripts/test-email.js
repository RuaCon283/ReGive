/**
 * Test email (SMTP) — chạy: npm run test:email
 * Kiểm tra: (1) credentials SMTP có hợp lệ không, (2) gửi được email thật hay không.
 * Gửi tới chính SMTP_USER (email của bạn) để tự kiểm tra hộp thư.
 */
require('dotenv').config();

const nodemailer = require('nodemailer');
const config = require('../config');
const { sendVerificationEmail } = require('../services/common');

async function main() {
  console.log('════════ EMAIL CONFIG ════════');
  console.log(`host   : ${config.email.host}`);
  console.log(`port   : ${config.email.port}`);
  console.log(`user   : ${config.email.user || '(chưa cấu hình)'}`);
  console.log(`pass   : ${config.email.pass ? '***(' + config.email.pass.replace(/ /g, '').length + ' ký tự)' : '(chưa cấu hình)'}`);
  console.log(`from   : ${config.email.from}`);

  if (!config.email.user || !config.email.pass) {
    console.error('\n[FAIL] Thiếu SMTP_USER / SMTP_PASS trong backend/.env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: { user: config.email.user, pass: config.email.pass },
  });

  // 1) Verify credentials
  try {
    await transporter.verify();
    console.log('\n[OK] SMTP verify thành công — credentials hợp lệ.');
  } catch (err) {
    console.error(`\n[FAIL] SMTP verify lỗi: ${err.message}`);
    process.exit(1);
  }

  // 2) Gửi email thật (template xác thực) tới chính user cấu hình trong .env
  const fakeUser = {
    email: config.email.user,
    fullName: 'Test ReGive',
    isEmailVerified: false,
  };

  try {
    const info = await sendVerificationEmail(fakeUser, 'test-token-' + Date.now());
    console.log('\n[OK] Gửi email thành công!');
    console.log(`     messageId : ${info.messageId}`);
    console.log(`     accepted  : ${JSON.stringify(info.accepted)}`);
    console.log(`     response  : ${(info.response || '').slice(0, 200)}`);
    console.log('\n→ Kiểm tra hộp thư (Inbox/Spam) của ' + config.email.user);
    process.exit(0);
  } catch (err) {
    console.error(`\n[FAIL] Gửi email lỗi: ${err.message}`);
    process.exit(1);
  }
}

main();
