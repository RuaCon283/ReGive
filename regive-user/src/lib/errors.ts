/**
 * Lấy message hiển thị được từ một lỗi chưa biết kiểu.
 * Axios interceptor của dự án luôn reject bằng `Error`, nhưng vẫn phòng trường hợp khác.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}
