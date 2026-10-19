'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Form, Input, Button, Alert, message, Result } from 'antd';
import { HandHeart, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { volunteerService } from '@/services/volunteerService';
import { Campaign } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { VerifyEmailNotice } from '@/components/shared/VerifyEmailNotice';

interface QuickVolunteerModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickVolunteerModal: React.FC<QuickVolunteerModalProps> = ({
  campaign,
  open,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  if (!campaign) return null;

  const handleSubmit = async (values: any) => {
    if (!user) {
      message.info('Vui lòng đăng nhập để đăng ký làm tình nguyện viên');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await volunteerService.register({
        campaignId: campaign._id,
        skills: values.skills || '',
        availabilityNote: values.availabilityNote || '',
      });

      setRegistered(true);
      message.success('Đăng ký tình nguyện viên thành công!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setRegistered(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
            <HandHeart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Đăng Ký Tình Nguyện Viên Nhanh</h3>
            <p className="text-xs text-gray-500 font-normal truncate max-w-sm">
              Chiến dịch: <span className="font-semibold text-gray-800">{campaign.title}</span>
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={handleModalClose}
      footer={null}
      destroyOnHidden
      centered
      className="rounded-2xl"
    >
      <div className="py-3">
        {registered ? (
          <Result
            status="success"
            title="Đăng Ký Thành Công!"
            subTitle={
              <div className="text-xs text-gray-600 space-y-2 mt-1">
                <p>
                  Hồ sơ tình nguyện viên của bạn cho chiến dịch{' '}
                  <strong className="text-gray-900">{campaign.title}</strong> đang được điều phối viên xem xét.
                </p>
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 text-sky-900 text-left">
                  Điều phối viên sẽ liên hệ và phân công lịch trình cụ thể qua số điện thoại tài khoản của bạn.
                </div>
              </div>
            }
            extra={[
              <Button
                key="close"
                type="primary"
                onClick={handleModalClose}
                className="bg-p-s600 rounded-xl h-10 px-6 font-bold"
              >
                Hoàn tất
              </Button>,
            ]}
          />
        ) : (
          <div className="space-y-4">
            <VerifyEmailNotice />

            {campaign.volunteerConditions && (
              <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Yêu cầu từ ban tổ chức:</strong>
                  <p className="leading-relaxed">{campaign.volunteerConditions}</p>
                </div>
              </div>
            )}

            {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

            <Form layout="vertical" onFinish={handleSubmit} requiredMark="optional">
              <Form.Item
                label="Kỹ năng hoặc thế mạnh của bạn"
                name="skills"
                rules={[{ required: true, message: 'Vui lòng chia sẻ kỹ năng hoặc kinh nghiệm' }]}
              >
                <Input
                  placeholder="Ví dụ: Lái xe, sơ cấp cứu, khuân vác, dạy học, chụp ảnh, nấu ăn..."
                  size="large"
                  className="!rounded-xl"
                />
              </Form.Item>

              <Form.Item
                label="Thời gian và sự sẵn sàng tham gia"
                name="availabilityNote"
                rules={[{ required: true, message: 'Vui lòng cung cấp khung giờ bạn rảnh' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Ví dụ: Rảnh cả ngày thứ Bảy và Chủ Nhật, có thể đi xa 2 ngày 1 đêm..."
                  className="!rounded-xl"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-600/20"
              >
                Xác nhận đăng ký tham gia
              </Button>
            </Form>
          </div>
        )}
      </div>
    </Modal>
  );
};
