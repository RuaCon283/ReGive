'use client';

import { Alert } from 'antd';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Banner nhắc xác thực email cho user đã đăng nhập nhưng chưa verify.
 * Hiển thị ở các luồng donate / buy / volunteer. Không chặn thao tác
 * (backend hiện chưa enforce), chỉ nudge + dẫn link xác thực.
 */
export function VerifyEmailNotice() {
  const { user } = useAuthStore();

  if (!user || user.isEmailVerified) return null;

  return (
    <Alert
      type="warning"
      showIcon
      message="Email của bạn chưa được xác thực"
      description={
        <span>
          Bạn vẫn có thể gửi yêu cầu, nhưng hãy{' '}
          <Link href="/verify-email" className="font-bold text-p-s600 hover:text-p-s700 underline">
            xác thực email ngay tại đây
          </Link>{' '}
          để nhận biên lai, thông báo trạng thái quyên góp/đơn hàng qua email và không bị chặn ở các tính năng sau này.
        </span>
      }
    />
  );
}
