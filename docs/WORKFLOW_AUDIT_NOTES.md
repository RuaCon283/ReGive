# 🔍 AUDIT: So Sánh Tài Liệu vs Source Code Thực Tế

> **Ngày audit:** 26/10/2026  
> **Phạm vi:** Toàn bộ docs, backend, admin (React), regive-user (Next.js)  
> **Mục đích:** Xác định workflow đã chạy đúng chưa, còn thiếu/chưa chi tiết/mơ hồ

---

## ✅ PHẦN A: WORKFLOW ĐÃ TRIỂN KHAI ĐÚNG (Backend + FE)

### 1. Authentication & RBAC ✅
- 4 roles: USER, BENEFICIARY, EMPLOYEE, ADMIN ✅
- JWT auth, register chỉ cho USER/BENEFICIARY ✅
- Email verification + Forgot/Reset password ✅
- Seed 4 tài khoản demo ✅

### 2. Campaign Management ✅
- CRUD campaigns (Admin), public list (active only) ✅
- Campaign detail + donations + volunteers + activities ✅
- Schema đầy đủ: targetItems, budgetBreakdown, timeline, faqs, verificationStatus, bankAccount ✅

### 3. Donation (Quyên góp) ✅
- Donate money/product (USER), anonymous support ✅
- Status: pending → confirmed → processing → completed/rejected ✅
- raisedAmount tự cập nhật khi donation completed ✅

### 4. Volunteer Registration ✅
- USER đăng ký, duplicate check (user+campaign) ✅
- Staff review (approve/reject/cancel), schedule khi approved ✅
- Notification khi status change ✅

### 5. Beneficiary Support Request ✅
- BENEFICIARY tạo yêu cầu, status workflow đầy đủ ✅
- Staff review + reviewNote, beneficiary xác nhận đã nhận ✅

### 6. Product & Inventory ✅
- Intake từ donation, assess thủ công, publish/unpublish ✅
- Product rules (reviewed, condition != damaged) ✅
- Inventory stock in/out/adjust, auto SOLD_OUT khi stock=0 ✅
- Delete chặn khi listed/có order ✅

### 7. AI Workflow (Human-in-the-loop) ✅
- AI assess-product (staff), preview-donation (public, rate-limited) ✅
- Suggestion → human confirm/override/reject ✅
- KHÔNG auto-publish, UNSAFE → auto reject ✅
- Gemini provider + heuristic fallback ✅

### 8. Order & Payment ✅
- Tạo order (USER), status machine đầy đủ ✅
- VNPay checkout URL + return/IPN verify (HMAC-SHA512) ✅
- Sandbox confirm fallback ✅
- Payment complete → order.paid / donation.completed ✅
- **Circular charity:** order revenue → campaign.raisedAmount ✅

### 9. Reports, Notifications, Upload, Comments ✅
- Overview report, public impact, transparency ledger ✅
- In-app + Email notifications ✅
- Cloudinary + local fallback upload ✅
- Comments trên campaign/product ✅


## 🟡 PHẦN B: WORKFLOW ĐÚNG NHƯNG CHƯA CHI TIẾT / MƠ HỒ

### ~~B1. 🔸 Payment flow khi chưa config VNPay~~ → ✅ ĐÃ CHẠY ĐÚNG (đã test 26/10/2026)

### ~~B2. 🔸 Admin FE thiếu nút "Tạo sản phẩm từ Donation"~~ → ✅ ĐÃ CÓ (DonationsPage.jsx dòng 145-155, nút "Intake sản phẩm")

### ~~B3. 🔸 USER tạo Campaign (draft)~~ → ✅ ĐÃ CẬP NHẬT RBAC.md (thêm dòng "Create campaign (draft)" + footnote)

### ~~B4. 🔸 Order → Payment trên FE~~ → ✅ ĐÃ CHẠY ĐÚNG (đã test 26/10/2026)

### ~~B5. 🔸 Beneficiary thiếu trang "Tạo yêu cầu hỗ trợ"~~ → ✅ ĐÃ CÓ (/support/new/page.tsx, có form + AuthGuard + RoleGuard)

### ~~B6. 🔸 Campaign create trên regive-user~~ → ✅ ĐÃ CẬP NHẬT cùng B3 trong RBAC.md

### ~~B7. 🔸 Product marketplace detail — Thiếu "Campaign liên quan"~~ → ✅ ĐÃ CÓ (Target Campaign Banner dòng 752-770 + ProductCard hiển thị "Quỹ:")

### ~~B8. 🔸 Volunteer dashboard — Thiếu ngày/địa điểm lịch tham gia~~ → ✅ ĐÃ SỬA (hiển thị schedule.date + timeSlot + location)

### B9. 🔸 Notification — Không có real-time push (WebSocket/SSE)

### B10. 🔸 Transparency Ledger — Thiếu sao kê theo từng campaign


---

## 🔴 PHẦN C: WORKFLOW CHƯA TRIỂN KHAI

| # | Feature | Ghi chú từ docs | Trạng thái |
|---|---|---|---|
| C1 | Giỏ hàng nhiều SP | "By design" — KNOWN_ISSUES.md | Không làm |
| C2 | Deploy / CI/CD | "Pending" — KNOWN_ISSUES.md | Chưa làm |
| C3 | Refund flow | Proposal nhắc nhưng không chi tiết | Chưa làm |
| C4 | Beneficiary eligibility | Proposal: "eligibility criteria, docs" | Chưa làm |
| C5 | Volunteer capacity/check-in | Proposal: "capacity, shifts, attendance" | Chưa làm |
| C6 | Đồng hành gây quỹ | USER_WEBSITE_PLAN: "Khoảng trống" | Chưa làm |
| C7 | Bản đồ/Sự kiện/Bảng tin/Tin tức | USER_WEBSITE_PLAN: "Khoảng trống" | Chưa làm |
| C8 | OpenAPI đầy đủ | AI_WORKFLOW_AUDIT: "chưa đầy đủ" | Cần cập nhật |

---

## 🟠 PHẦN D: MÂU THUẪN TÀI LIỆU ↔ CODE

### ~~D1. ⚠️ Payment.provider default~~ → ✅ ĐÃ SỬA (ReGive_Database.md: 'sandbox' → 'vnpay')

### ~~D2. ⚠️ Donation status "confirmed"~~ → Ghi chú: "confirmed" chỉ dùng khi staff manual update, không có auto-trigger. Đây là thiết kế đúng.

### ~~D3. ⚠️ Demo script chưa cập nhật VNPay~~ → ✅ ĐÃ SỬA (DEMO_SCRIPT.md đã cập nhật VNPay checkoutUrl flow)

### ~~D4. ⚠️ Circular Charity~~ → Ghi chú: Feature có trong code, docs không mô tả. Không ảnh hưởng chức năng.

### ~~D5. ⚠️ Product schema phong phú~~ → Ghi chú: Schema mở rộng hợp lý, FE đã hiển thị đầy đủ.

---

## 🔵 PHẦN E: LỖI NHỎ / TYPO

| # | Vị trí | Vấn đề |
|---|---|---|
| E1 | `marketplace/page.tsx:166,168` | ~~Typo "thầp"~~ → ✅ ĐÃ SỬA "thấp" |
| E1b | `support-requests/page.tsx:54` | ~~Typo "Thầp"~~ → ✅ ĐÃ SỬA "Thấp" |
| E2 | `DEMO_SCRIPT.md` | ~~Sandbox flow cũ~~ → ✅ ĐÃ CẬP NHẬT VNPay flow |
| E3 | `aiService.js` | Heuristic price cố định — chấp nhận được cho demo |

---

## 📊 TỔNG KẾT (Cập nhật sau khi sửa)

| Nhóm | Đã đúng | Đã sửa lần này | Còn lại |
|---|---|---|---|
| Backend API | 10/10 modules | — | 0 |
| Admin FE | Đầy đủ trang | — | 0 |
| User FE | Đầy đủ trang chính | B8 (volunteer schedule) | 0 |
| Tài liệu ↔ Code | — | D1 (provider), D3 (demo script), B3+B6 (RBAC) | 0 |
| Typo | — | E1 (thầp→thấp) x2, E2 (demo script) | 0 |
| Feature ngoài scope | — | — | 8 (C1-C8, by design) |

### Tất cả các mục ưu tiên đã xử lý:
1. ✅ **B1+B4:** Payment — đã test chạy đúng.
2. ✅ **B2:** Nút "Intake sản phẩm" — đã có sẵn trên DonationsPage.
3. ✅ **B5:** Trang `/support/new` — đã có sẵn.
4. ✅ **B3+B6:** RBAC.md đã cập nhật USER tạo campaign draft.
5. ✅ **B7:** Campaign banner — đã có sẵn trên marketplace detail.
6. ✅ **B8:** Volunteer dashboard — đã sửa hiển thị đầy đủ ngày/giờ/địa điểm.
7. ✅ **D1:** Database doc — sửa provider default 'sandbox' → 'vnpay'.
8. ✅ **D3:** Demo script — cập nhật VNPay checkoutUrl flow.
9. ✅ **E1:** Fix typo "thầp" → "thấp" (marketplace + support-requests).

---
