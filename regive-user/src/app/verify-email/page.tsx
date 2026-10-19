'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Spin, Alert, message } from 'antd';
import { Heart, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const { setUser, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  // Truy cập trực tiếp /verify-email không kèm ?token= — hiển thị hướng dẫn thay vì lỗi đỏ
  const [noToken, setNoToken] = useState(false);

  const handleResendVerification = async () => {
    if (!user) {
      message.warning('Vui lòng đăng nhập trước, sau đó quay lại đây để gửi lại email xác thực.');
      router.push('/login');
      return;
    }
    try {
      setResending(true);
      const msg = await authService.resendVerification();
      setResent(true);
      message.success(msg);
    } catch (err: any) {
      message.error(err.message || 'Không thể gửi lại email xác thực lúc này');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setNoToken(true);
      setLoading(false);
      return;
    }

    authService
      .verifyEmail({ token })
      .then((user) => {
        setUser(user);
        setSuccess(true);
      })
      .catch((err: any) => {
        setError(err.message || 'Xác thực email thất bại');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, setUser]);

  if (loading) {
    return (
      <div className="text-center space-y-4">
        <Spin size="large" />
        <p className="text-sm text-gray-500">Đang xác thực email...</p>
      </div>
    );
  }

  // Truy cập trực tiếp không có token: trang này cần link từ email xác thực
  if (noToken) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-p-s50 border border-p-s100 flex items-center justify-center">
          <Heart className="w-8 h-8 text-p-s600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Xác thực email ReGive</h3>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Trang này chỉ hoạt động qua <strong className="text-gray-700">link xác thực được gửi đến email của bạn</strong>{' '}
            (dạng <code className="text-xs bg-slate-50 px-1.5 py-0.5 rounded">/verify-email?token=…</code>, hiệu lực 24 giờ).
          </p>
        </div>

        <div className="text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs text-gray-600">
          <p className="font-bold text-gray-800">Chưa nhận được email? Thử các bước sau:</p>
          <p>1. Kiểm tra hộp thư đến và mục <strong>Spam/Junk</strong>.</p>
          <p>2. <strong>Đăng nhập</strong> rồi quay lại đây và nhấn nút <strong>"Gửi lại email xác thực"</strong> bên dưới.</p>
          <p className="text-gray-400 pt-1 border-t border-slate-200/70">
            Đang chạy local/demo chưa cấu hình SMTP? Link xác thực được in ra{' '}
            <strong className="text-gray-600">console của backend</strong> (dòng{' '}
            <code className="text-[10px]">[EMAIL] Body: … link …</code>) — copy link đó dán vào trình duyệt để hoàn tất.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="primary"
            size="large"
            className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 font-bold"
            onClick={() => {
              if (!user) {
                router.push('/login');
                return;
              }
              handleResendVerification();
            }}
            loading={resending}
            disabled={resent}
          >
            {resent ? 'Đã gửi lại email xác thực' : user ? 'Gửi lại email xác thực' : 'Đăng nhập để gửi lại email xác thực'}
          </Button>
          <Link href="/">
            <Button size="large" className="w-full h-12 rounded-xl font-bold">
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h3 className="mt-4 text-xl font-bold text-gray-900">Xác thực thất bại</h3>
        </div>
        <Alert message="Lỗi xác thực" description={error} type="error" showIcon />
        <div className="flex flex-col gap-3">
          <Link href="/login">
            <Button type="primary" size="large" className="w-full h-12 rounded-xl bg-p-s600 font-bold">
              Quay lại đăng nhập
            </Button>
          </Link>
          <Button
            size="large"
            className="w-full h-12 rounded-xl font-bold"
            loading={resending}
            disabled={resent}
            onClick={handleResendVerification}
          >
            {resent ? 'Đã gửi lại email xác thực' : 'Gửi lại email xác thực'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h3 className="mt-4 text-xl font-bold text-gray-900">Xác thực email thành công!</h3>
        <p className="mt-2 text-sm text-gray-500">
          Tài khoản ReGive của bạn đã được xác thực. Giờ bạn có thể sử dụng đầy đủ các tính năng.
        </p>
      </div>
      <Button
        type="primary"
        size="large"
        onClick={() => router.push('/me/dashboard')}
        icon={<ArrowRight className="w-4 h-4" />}
        className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold"
      >
        Vào trang cá nhân
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-p-s600 to-sec-s500 flex items-center justify-center text-white shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <span className="text-2xl font-black text-gray-900">
              Re<span className="text-p-s600">Give</span>
            </span>
          </Link>
          <h2 className="mt-4 text-2xl font-black text-gray-900">Xác Thực Email</h2>
        </div>

        <Suspense fallback={<Spin size="large" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}