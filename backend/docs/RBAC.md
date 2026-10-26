# RBAC Matrix — ReGive Backend

Roles: `USER` · `BENEFICIARY` · `EMPLOYEE` · `ADMIN`

| Resource / Action | USER | BENEFICIARY | EMPLOYEE | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | seed | seed |
| View active campaigns | ✅ | ✅ | ✅ | ✅ |
| Manage campaigns CRUD | — | — | — | ✅ |
| Create campaign (draft) | ✅* | — | — | ✅ |
| Donate money/product | ✅ | — | — | ✅* |
| Process donations | — | — | ✅ | ✅ |
| Volunteer register | ✅ | — | — | ✅* |
| Review volunteers | — | — | ✅ | ✅ |
| Support request create | — | ✅ | — | ✅* |
| Review support requests | — | — | ✅ | ✅ |
| Product intake/assess/publish | — | — | ✅ | ✅ |
| Marketplace browse/buy | ✅ | — | view | view |
| Inventory stock in/out | — | — | ✅ | ✅ |
| Orders create | ✅ | — | — | ✅* |
| Orders process status | — | — | ✅ | ✅ |
| Payments create/confirm | ✅ | — | — | ✅* |
| Payments list all | — | — | ✅ | ✅ |
| AI assess / confirm | — | — | ✅ | ✅ |
| Reports overview | — | — | ✅ | ✅ |
| List all users | — | — | — | ✅ |

\* Admin có thể gọi một số API User-facing khi cần demo/ops; nghiệp vụ chính dành cho USER/BENEFICIARY.

\*\* USER có thể tạo chiến dịch nhưng ở trạng thái `draft` (chưa active). Chỉ ADMIN/EMPLOYEE mới có thể tạo chiến dịch `active` hoặc cập nhật trạng thái chiến dịch.

## AI rule

AI output = suggestion only. Publish marketplace chỉ qua `POST /api/products/:id/publish` sau human review.
