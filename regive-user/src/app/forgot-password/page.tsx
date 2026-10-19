'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Form, Input, Button, Alert, message } from 'antd';
import { Heart, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (values: { email: string }) => {
    try {
      setSubmitting(true);
      setError(null);
      const msg = await authService.forgotPassword({ email: values.email });
      setSentMessage(msg);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

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
          <h2 className="mt-4 text-2xl font-black text-gray-900">Quên Mật Khẩu</h2>
          <p className="mt-1 text-xs text-gray-500">
            Nhập email đăng ký để nhận hướng dẫn đặt lại mật khẩu
          </p>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="font-bold text-green-800 text-base">Đã gửi hướng dẫn!</h3>
              <p className="text-sm text-green-700">{sentMessage}</p>
              <p className="text-xs text-green-600">
                Vui lòng kiểm tra hộp thư (bao gồm cả mục Spam) để tìm email từ ReGive.
              </p>
            </div>
            <Link href="/login">
              <Button
                type="primary"
                size="large"
                icon={<ArrowLeft className="w-4 h-4" />}
                className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm"
              >
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} className="space-y-4">
              <Form.Item
                label="Email đăng ký"
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

              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  icon={<Send className="w-4 h-4" />}
                  className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
                >
                  Gửi hướng dẫn đặt lại mật khẩu
                </Button>
              </div>
            </Form>

            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              Nhớ lại mật khẩu?{' '}
              <Link href="/login" className="font-bold text-p-s600 hover:text-p-s700">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}