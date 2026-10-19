export const ROLES = {
  USER: 'USER',
  BENEFICIARY: 'BENEFICIARY',
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
};

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.EMPLOYEE];

export const LABELS = {
  role: {
    USER: 'Người dùng',
    BENEFICIARY: 'Người thụ hưởng',
    EMPLOYEE: 'Nhân viên',
    ADMIN: 'Quản trị',
  },
  campaign: {
    draft: 'Nháp',
    active: 'Đang chạy',
    closed: 'Đã đóng',
    cancelled: 'Huỷ',
  },
  donationType: {
    money: 'Tiền',
    product: 'Sản phẩm',
  },
  donation: {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    processing: 'Đang xử lý',
    completed: 'Hoàn tất',
    rejected: 'Từ chối',
  },
  volunteer: {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Huỷ',
  },
  support: {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    in_progress: 'Đang hỗ trợ',
    completed: 'Hoàn tất',
  },
  product: {
    draft: 'Nháp',
    assessed: 'Đã đánh giá',
    in_stock: 'Trong kho',
    listed: 'Đang bán',
    sold_out: 'Hết hàng',
    rejected: 'Không phù hợp',
    archived: 'Lưu trữ',
  },
  condition: {
    new: 'Mới',
    like_new: 'Như mới',
    good: 'Tốt',
    fair: 'Khá',
    poor: 'Kém',
    damaged: 'Hỏng',
  },
  quality: {
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thầp',
  },
  order: {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    processing: 'Đang xử lý',
    shipped: 'Đã gửi',
    completed: 'Hoàn tất',
    cancelled: 'Huỷ',
  },
  payment: {
    pending: 'Chờ thanh toán',
    success: 'Thành công',
    failed: 'Thất bại',
    cancelled: 'Huỷ',
  },
  purpose: {
    order: 'Đơn hàng',
    donation: 'Quyên góp',
  },
  inventory: {
    in: 'Nhập kho',
    out: 'Xuất kho',
    adjust: 'Điều chỉnh',
  },
  ai: {
    suggested: 'Chờ duyệt',
    confirmed: 'Đã xác nhận',
    overridden: 'Đã chỉnh sửa',
    rejected: 'Từ chối',
    failed: 'AI lỗi',
  },
};

export const BADGE_TONE = {
  draft: 'muted',
  pending: 'warn',
  suggested: 'warn',
  confirmed: 'ok',
  approved: 'ok',
  active: 'ok',
  processing: 'info',
  in_progress: 'info',
  paid: 'ok',
  success: 'ok',
  shipped: 'info',
  listed: 'ok',
  assessed: 'info',
  in_stock: 'ok',
  completed: 'ok',
  closed: 'muted',
  cancelled: 'danger',
  rejected: 'danger',
  failed: 'danger',
  damaged: 'danger',
  poor: 'warn',
  sold_out: 'muted',
  archived: 'muted',
  overridden: 'info',
  money: 'ok',
  product: 'info',
  high: 'ok',
  medium: 'warn',
  low: 'danger',
};

export const CAMPAIGN_STATUSES = ['draft', 'active', 'closed', 'cancelled'];
export const DONATION_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'rejected'];
export const VOLUNTEER_REVIEW = ['approved', 'rejected', 'cancelled'];
export const SUPPORT_STATUSES = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];
export const PRODUCT_STATUSES = ['draft', 'assessed', 'in_stock', 'listed', 'sold_out', 'rejected', 'archived'];
export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor', 'damaged'];
export const QUALITIES = ['high', 'medium', 'low'];
export const ORDER_NEXT = {
  pending: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
};

export const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@regive.local' },
  { role: 'EMPLOYEE', email: 'employee@regive.local' },
];
