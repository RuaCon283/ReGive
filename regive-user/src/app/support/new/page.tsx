'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Select, Button, Alert, message } from 'antd';
import { LifeBuoy, ArrowLeft, ShieldCheck, HeartHandshake } from 'lucide-react';
import { supportService } from '@/services/supportService';
import { campaignService } from '@/services/campaignService';
import { Campaign, SupportUrgency } from '@/types';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { RoleGuard } from '@/components/shared/RoleGuard';

export default function NewSupportRequestPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    campaignService
      .listPublic()
      .then((data) => setCampaigns(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);

      await supportService.create({
        title: values.title,
        description: values.description,
        urgency: values.urgency || 'medium',
        campaignId: values.campaignId || undefined,
      });

      message.success('Gửi yêu cầu hỗ trợ thành công!');
      router.push('/me/support-requests');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <RoleGuard
        allowedRoles={['BENEFICIARY']}
        fallbackTitle="Tính Năng Dành Cho Người Thụ Hưởng"
        fallbackMessage="Chỉ tài khoản đăng ký với vai trò Người thụ hưởng (BENEFICIARY) mới có thể gửi yêu cầu hỗ trợ."
      >
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <div>
            <Link
              href="/me/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-p-s600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
            <div className="border-b border-gray-100 pb-5">
              <div className="flex items-center gap-2 text-p-s600 font-bold text-xs uppercase tracking-wider mb-1">
                <LifeBuoy className="w-4 h-4 text-p-s600" />
                <span>Trợ giúp & Đồng hành</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900">Gửi Yêu Cầu Hỗ Trợ</h1>
              <p className="text-sm text-gray-500 mt-1">
                Mô tả rõ hoàn cảnh và nhu cầu hỗ trợ để đội ngũ ReGive điều phối nguồn lực nhanh nhất.
              </p>
            </div>

            {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

            <Form
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ urgency: 'medium' }}
              requiredMark="optional"
              className="space-y-4"
            >
              <Form.Item
                label="Tiêu đề yêu cầu hỗ trợ"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề yêu cầu' }]}
              >
                <Input
                  placeholder="Ví dụ: Xin hỗ trợ sách vở và áo ấm cho 2 con nhỏ mùa tựu trường..."
                  size="large"
                  className="!rounded-xl"
                />
              </Form.Item>

              <Form.Item
                label="Mức độ cấp thiết"
                name="urgency"
                rules={[{ required: true, message: 'Vui lòng chọn mức độ cấp thiết' }]}
              >
                <Select
                  size="large"
                  className="!rounded-xl"
                  options={[
                    { label: 'Thầp (Không quá gấp)', value: 'low' },
                    { label: 'Trung bình (Cần hỗ trợ sớm)', value: 'medium' },
                    { label: 'Cao (Rất cấp thiết)', value: 'high' },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Thuộc chiến dịch cụ thể (không bắt buộc)"
                name="campaignId"
              >
                <Select
                  placeholder="Chọn chiến dịch phù hợp nếu có..."
                  size="large"
                  allowClear
                  options={campaigns.map((c) => ({
                    label: `${c.title} (${c.location})`,
                    value: c._id,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Mô tả hoàn cảnh khó khăn & nhu cầu cụ thể"
                name="description"
                rules={[{ required: true, message: 'Vui lòng mô tả chi tiết hoàn cảnh của bạn' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Nêu rõ tình trạng gia đình, các vật phẩm hoặc nguồn lực cần hỗ trợ, số lượng và lý do..."
                  className="!rounded-xl"
                />
              </Form.Item>

              <div className="pt-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-base shadow-md shadow-p-s600/20"
                >
                  Gửi hồ sơ yêu cầu hỗ trợ
                </Button>
              </div>
            </Form>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400 text-center">
              <ShieldCheck className="w-4 h-4 text-p-s600" />
              <span>Hồ sơ của bạn sẽ được bảo mật và nhân viên ReGive sẽ liên hệ xác minh.</span>
            </div>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
