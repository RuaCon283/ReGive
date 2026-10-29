# Demo Script Backend (~10–12 phút)

Yêu cầu: `npm run seed` + `npm start`

## 1. Health (30s)
- `GET /api/health` → `phase: final-release`, `sprint: 3`
- `GET /api/ready` → Mongo connected

## 2. Charity core — Sprint 1 (2 phút)
1. Login `user@regive.local` / `User@123`
2. `GET /api/campaigns` — xem chiến dịch
3. `POST /api/donations` type `money` hoặc `product`
4. Login `beneficiary@regive.local` — tạo support request
5. Login `employee@regive.local` — duyệt volunteer/support

## 3. Marketplace — Sprint 2 (3 phút)
1. `GET /api/products/marketplace` — Balo đã list
2. User tạo `POST /api/orders`
3. `POST /api/payments` với `{ purpose: "order", orderId: "..." }` → trả `checkoutUrl` (VNPay sandbox)
4. Chuyển người dùng đến `checkoutUrl` để thanh toán VNPay
5. Sau thanh toán, VNPay redirect về `GET /api/payments/vnpay/return` → tự động xác nhận
6. (Hoặc dùng sandbox nội bộ: lấy `sandboxToken` từ payment detail → `POST /api/payments/sandbox/confirm`)
7. `GET /api/orders/me` → status `paid`
8. `GET /api/reports/overview` (employee)

## 4. AI human-in-the-loop — Sprint 3 (3 phút)
1. Employee: lấy product draft **Áo khoác denim** (`GET /api/products?status=draft`)
2. `POST /api/ai/assess-product` → status `suggested` (chưa đổi giá authoritative)
3. `POST /api/ai/assessments/:id/confirm` (có thể chỉnh price)
4. Nhấn mạnh: `listedOnMarketplace` vẫn `false`
5. Stock-in → publish → (optional) order

## 5. Hoặc chạy tự động
```bash
npm run demo:e2e
npm run test:regression
```

## Closing
- Known issues: AI mock (heuristic + Gemini fallback), chưa FE staff review trên regive-user
- Payment: VNPay sandbox (checkoutUrl) + sandbox nội bộ fallback
- Backend đủ demo end-to-end cho mentor
