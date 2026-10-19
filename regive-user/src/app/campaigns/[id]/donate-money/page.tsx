'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, Alert, Checkbox, message } from 'antd';
import { Heart, ArrowLeft, ShieldCheck, EyeOff, Sparkles } from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { donationService } from '@/services/donationService';
import { paymentService } from '@/services/paymentService';
import { Campaign } from '@/types';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { VerifyEmailNotice } from '@/components/shared/VerifyEmailNotice';
import { formatVND } from '@/lib/format';

function DonateMoneyContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params?.id as string;
  const initialAmount = searchParams?.get('amount') ? parseInt(searchParams.get('amount') as string, 10) : 100000;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState<number>(initialAmount || 100000);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    campaignService
      .getById(campaignId)
      .then((c) => setCampaign(c))
      .catch((err) => setError(err.message || 'Không tìm thấy chiến dịch'))
      .finally(() => setLoadingCampaign(false));
  }, [campaignId]);

  const handleSubmit = async (values: { note?: string }) => {
    if (!amount || amount < 10000) {
      message.error('Số tiền tối thiểu là 10.000 VND');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 1. Create Donation with isAnonymous support
      const donation = await donationService.createDonation({
        campaignId,
        type: 'money',
        amount,
        isAnonymous,
        note: values.note,
      });

      // 2. Create Payment for Donation
      const payment = await paymentService.create({
        purpose: 'donation',
        donationId: donation._id,
      });

      message.success('Tạo yêu cầu quyên góp thành công. Đang chuyển đến cổng thanh toán...');

      // 3. Redirect to Sandbox Checkout
      const paymentId = payment.id || payment._id;
      window.location.href = payment.checkoutUrl || `/payments/${paymentId}/checkout`;
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo giao dịch quyên góp');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-p-s600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại chi tiết chiến dịch</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
        <div className="border-b border-gray-100 pb-5">
          <div className="flex items-center gap-2 text-p-s600 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-p-s600" />
            <span>Ủng hộ tài chính</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Quyên Góp Tiền Mặt</h1>
          {campaign && (
            <div className="mt-2 p-3 bg-p-s50/60 rounded-xl border border-p-s100/80">
              <p className="text-xs text-p-s800 font-medium">Chiến dịch tiếp nhận:</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{campaign.title}</p>
            </div>
          )}
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        <VerifyEmailNotice />

        <Form layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          {/* Amount Input with Presets */}
          <Form.Item label="Chọn hoặc nhập số tiền ủng hộ (VND)" required>
            <MoneyInput
              value={amount}
              onChange={(val) => setAmount(val || 0)}
              min={10000}
            />
          </Form.Item>

          {/* Anonymous Option */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4">
            <Checkbox
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="text-sm font-bold text-gray-800"
            >
              Ủng hộ ẩn danh
            </Checkbox>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              Tên của bạn sẽ được hiển thị dưới dạng &quot;Nhà hảo tâm ẩn danh&quot; trên Bảng vàng đóng góp công khai của chiến dịch.
            </p>
          </div>

          {/* Note */}
          <Form.Item label="Lời nhắn gửi (không bắt buộc)" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Gửi lời chúc, nhắn nhủ đến các hoàn cảnh hoặc ban tổ chức chiến dịch..."
              maxLength={300}
              showCount
              className="!rounded-xl"
            />
          </Form.Item>

          {/* Summary preview */}
          <div className="bg-p-s50/70 border border-p-s200/60 rounded-2xl p-4 space-y-2 text-xs text-gray-700">
            <div className="flex justify-between items-center">
              <span>Số tiền quyên góp:</span>
              <span className="text-lg font-black text-p-s700">
                {formatVND(amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span>Phương thức thanh toán:</span>
              <span>Cổng thanh toán ReGive Sandbox</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              size="large"
              className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-base shadow-lg shadow-p-s600/25"
            >
              Tiến hành thanh toán {formatVND(amount)}
            </Button>
          </div>
        </Form>

        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400 text-center">
          <ShieldCheck className="w-4 h-4 text-p-s600" />
          <span>Khoản tiền sẽ được chuyển thẳng vào quỹ chiến dịch sau khi hoàn tất.</span>
        </div>
      </div>
    </div>
  );
}

export default function DonateMoneyPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-12 text-center text-gray-400">Đang tải...</div>}>
        <DonateMoneyContent />
      </Suspense>
    </AuthGuard>
  );
}
