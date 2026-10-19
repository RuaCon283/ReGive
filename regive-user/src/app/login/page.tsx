'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Alert, message, Spin } from 'antd';
import { Heart, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  const { login } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);
      await login({
        email: values.email,
        password: values.password,
      });
      message.success('Đăng nhập thành công!');
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
        <h2 className="mt-4 text-2xl font-black text-gray-900">Đăng Nhập Tài Khoản</h2>
        <p className="mt-1 text-xs text-gray-500">
          Chào mừng bạn quay lại với cộng đồng ReGive
        </p>
      </div>

      {error && <Alert message="Lỗi đăng nhập" description={error} type="error" showIcon />}

      <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} className="space-y-4">
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input
            prefix={<Mail className="w-4 h-4 text-gray-400 mr-1" />}
            placeholder="example@regive.vn"
            size="large"
            className="!rounded-xl"
          />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password
            prefix={<Lock className="w-4 h-4 text-gray-400 mr-1" />}
            placeholder="••••••••"
            size="large"
            className="!rounded-xl"
          />
        </Form.Item>

        <div className="flex justify-end -mt-2">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-p-s600 hover:text-p-s700"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
            className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
          >
            Đăng nhập
          </Button>
        </div>
      </Form>

      {/* Demo credentials hint */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Tài khoản thử nghiệm hệ thống:</p>
        <p>User: <code className="text-p-s700 font-mono">user@regive.local</code> / <code className="text-gray-700 font-mono">User@123</code></p>
        <p>Beneficiary: <code className="text-p-s700 font-mono">beneficiary1@example.com</code> / <code className="text-gray-700 font-mono">password123</code></p>
      </div>

      {/* Register link */}
      <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-bold text-p-s600 hover:text-p-s700">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Spin size="large" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
