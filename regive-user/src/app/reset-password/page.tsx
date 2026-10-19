'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Alert, message, Spin } from 'antd';
import { Heart, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (values: { newPassword: string }) => {
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await authService.resetPassword({ token, newPassword: values.newPassword });
      setSuccess(true);
      message.success('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <Alert
          message="Link không hợp lệ"
          description="Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới."
          type="error"
          showIcon
        />
        <Link href="/forgot-password">
          <Button type="primary" className="rounded-xl bg-p-s600">
            Yêu cầu đặt lại mật khẩu mới
          </Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="font-bold text-green-800 text-base">Đặt lại mật khẩu thành công!</h3>
          <p className="text-sm text-green-700">
            Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => router.push('/login')}
          className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm"
        >
          Đăng nhập ngay
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} className="space-y-4">
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
          ]}
        >
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-gray-400 mr-1" />}
            placeholder="Tối thiểu 6 ký tự"
            size="large"
            className="!rounded-xl"
          />
        </Form.Item>

        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-gray-400 mr-1" />}
            placeholder="Nhập lại mật khẩu mới"
            size="large"
            className="!rounded-xl"
          />
        </Form.Item>

        <div className="pt-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
            className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
          >
            Đặt lại mật khẩu
          </Button>
        </div>
      </Form>

      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        <Link href="/login" className="font-bold text-p-s600 hover:text-p-s700 inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" />
          Quay lại đăng nhập
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <h2 className="mt-4 text-2xl font-black text-gray-900">Đặt Lại Mật Khẩu</h2>
          <p className="mt-1 text-xs text-gray-500">
            Tạo mật khẩu mới cho tài khoản ReGive của bạn
          </p>
        </div>

        <Suspense fallback={<Spin size="large" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}