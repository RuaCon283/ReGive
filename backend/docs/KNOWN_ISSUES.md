# Known Issues — ReGive Backend v1.0.0

| # | Hạng mục | Mô tả | Mức | Ghi chú |
|---:|---|---|---|---|
| 1 | Payment | **Đã tích hợp VNPay sandbox** (tạo checkout URL + return/IPN verify). Khi chưa cấu hình `VN_PAY_*` vẫn dùng được sandbox nội bộ | Done | Cần `VN_PAY_MERCHANT_ID`, `VN_PAY_HASH_SECRET` cho VNPay thật |
| 2 | AI | Provider mặc định là **Gemini**, fallback heuristic khi lỗi | Done | Hook `AI_PROVIDER=gemini` sẵn, cần `GEMINI_API_KEY` |
| 3 | Upload ảnh | **Cloudinary** khi cấu hình đủ, **tự fallback lưu local** (`backend/uploads/`, serve qua `/uploads`) khi chưa có credentials | Done | `POST /api/uploads/single`, `POST /api/uploads/multiple`, `DELETE /api/uploads/delete` |
| 4 | Cart | Mua ngay 1 sản phẩm / đơn, chưa có giỏ hàng nhiều SP | By design | Theo quyết định Sprint 2 |
| 5 | Notification | In-app + **email** (SMTP) | Done | `SMTP_USER`/`SMTP_PASS` đã cấu hình (Gmail app password); test OK 19/10/2026 — chạy `npm run test:email` để kiểm tra lại |
| 6 | Mongo txn | Không dùng multi-doc transaction (tương thích Mongo standalone) | Limitation | Payment dùng claim idempotent |
| 7 | Frontend | Đã có UI React (regive-user + admin) | Done | Phase FE hoàn tất |
| 8 | Deploy | Chưa cấu hình hosting/CI production mặc định | Pending | Phase 6 buffer |
| 9 | Rate limit | Auth limit có thể chặn nếu spam login khi demo; **AI preview công khai có rate limit riêng 10 lần/phút** | Note | Tăng `AUTH_RATE_LIMIT_MAX` nếu cần |
| 10 | Password reset | **Đã hỗ trợ** forgot-password / reset-password qua email | Done | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| 11 | Email verification | **Đã hỗ trợ** xác thực email khi đăng ký + nút gửi lại ở UI user | Done | `POST /api/auth/verify-email`, `POST /api/auth/resend-verification` |

## Hardening 19/10/2026 (đã xử lý)

- Sổ cái minh bạch (`GET /api/reports/transparency-ledger`): bỏ số giải ngân bịa 1.500.000đ — hồ sơ cứu trợ chưa có số tiền thực sẽ hiển thị "Đang cập nhật" và không tính vào tổng OUTFLOW.
- `PATCH /api/products/{id}`: đã thêm express-validator cho toàn bộ trường được phép update.
- `POST /api/ai/preview-donation`: đã áp rate limit riêng.
- `GET /api/donations/{id}`, `GET /api/payments/{id}`: null-check donor/payer (người dùng bị xoá không còn gây 500).
- `GET /api/campaigns`: bỏ giá trị filter donation `approved`/`received` không tồn tại.
- **Mới**: `DELETE /api/products/{id}` (chặn khi đang bán hoặc đã có đơn hàng, xoá kèm AiAssessment liên quan).
- VNPay config: gộp `VN_PAY_HASH_SECRET`/`VN_PAY_HASH_KEY` trùng nhau (chỉ dùng `hashSecret`).

Không coi các mục Expected/By design là bug trừ khi mentor yêu cầu mở rộng.
