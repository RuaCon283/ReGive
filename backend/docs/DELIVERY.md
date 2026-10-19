# ReGive Backend — Final Delivery (Phase 5)

**Version:** 1.0.0  
**Stack:** Node.js · Express · MongoDB · JWT · Gemini AI · VNPay · Cloudinary  
**Ngày:** 19/10/2026 (cập nhật hardening)

## Phạm vi đã bàn giao (Backend)

| Sprint | Nội dung | Trạng thái |
|---|---|---|
| 1 | Auth, Campaign, Donation, Volunteer, Beneficiary, Notification | Done |
| 2 | Product, Inventory, Marketplace, Order, Payment sandbox, Reports | Done |
| 3 | AI assess + human-in-the-loop, E2E demo | Done |
| 5 | Hardening, OpenAPI, regression, delivery docs | Done |

## Chạy nhanh

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm start
```

Kiểm tra:

```bash
npm run demo:e2e
npm run test:regression
```

## Tài khoản demo

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@regive.local | Admin@123 |
| EMPLOYEE | employee@regive.local | Employee@123 |
| USER | user@regive.local | User@123 |
| BENEFICIARY | beneficiary@regive.local | Beneficiary@123 |

## Tài liệu kèm theo

| File | Mục đích |
|---|---|
| `README.md` | Hướng dẫn API & chạy local |
| `docs/openapi.yaml` | OpenAPI 3 contract (tóm tắt) |
| `docs/RBAC.md` | Ma trận phân quyền |
| `docs/KNOWN_ISSUES.md` | Hạn chế đã biết + nhật ký hardening |
| `docs/DEMO_SCRIPT.md` | Script demo mentor ~10 phút |
| `../../docs/ReGive_*.md` | Proposal / chức năng / plan phase |

## Endpoints hệ thống

- `GET /api/health` — liveness + version/phase
- `GET /api/ready` — readiness (MongoDB)

## Tích hợp notable (cập nhật 19/10/2026)

- **VNPay**: `POST /api/payments` trả `checkoutUrl` VNPay sandbox; `GET /api/payments/vnpay/return` (redirect) + `GET /api/payments/vnpay/ipn` (verify chữ ký). Chưa cấu hình `VN_PAY_*` thì thanh toán sandbox nội bộ vẫn dùng được.
- **Upload ảnh (Cloudinary + local fallback)**: `POST /api/uploads/single` / `POST /api/uploads/multiple` (JWT, multer ≤ 5MB, chỉ JPEG/PNG/GIF/WebP). Có Cloudinary credentials thì upload lên Cloudinary; thiếu thì tự lưu local `backend/uploads/` và serve qua `/uploads/<filename>`. `DELETE /api/uploads/delete` nhận `publicId` (Cloudinary) hoặc `filename` (local).
- **Xoá sản phẩm**: `DELETE /api/products/{id}` (ADMIN/EMPLOYEE) — chặn khi đang bán trên marketplace (400) hoặc đã nằm trong đơn hàng (409); xoá kèm các bản AiAssessment liên quan.
- **AI preview công khai**: `POST /api/ai/preview-donation` (public, rate limit 10 lần/phút) cho user xem trước định giá trước khi quyên góp hiện vật.
- **Sổ cái minh bạch**: `GET /api/reports/transparency-ledger` chỉ dùng số tiền thật; giải ngân chưa có số tiền hiển thị "Đang cập nhật".

## Ghi chú bảo mật Final Release

- Helmet security headers
- Rate limit API chung + siết auth login/register
- Ẩn `sandboxToken` / `rawCallback` khỏi list payment
- Cảnh báo / chặn JWT_SECRET yếu khi production
