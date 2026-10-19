'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Alert, message } from 'antd';
import { Settings, Sparkles } from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { Campaign } from '@/types';

interface EditCampaignModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedCampaign: Campaign) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Đang hoạt động (Active)' },
  { value: 'closed', label: 'Đã hoàn thành (Closed)' },
  { value: 'draft', label: 'Bản nháp / Chờ duyệt (Draft)' },
  { value: 'cancelled', label: 'Đã hủy (Cancelled)' },
];

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  campaign,
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaign && open) {
      form.setFieldsValue({
        title: campaign.title,
        shortDescription: campaign.shortDescription,
        goal: campaign.goal,
        location: campaign.location,
        status: campaign.status,
        targetAmount: campaign.targetAmount,
        bannerImage: campaign.bannerImage,
        organization: campaign.organization,
        volunteerConditions: campaign.volunteerConditions,
      });
    }
  }, [campaign, open, form]);

  if (!campaign) return null;

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);

      const updated = await campaignService.update(campaign._id, values);
      message.success('Cập nhật chiến dịch thành công!');
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật chiến dịch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-p-s100 flex items-center justify-center text-p-s600">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Quản Lý & Chỉnh Sửa Chiến Dịch</h3>
            <p className="text-xs text-gray-500 font-normal truncate max-w-sm">
              {campaign.title}
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={600}
      className="rounded-2xl"
    >
      <div className="py-3 space-y-4">
        {error && <Alert message="Lỗi cập nhật" description={error} type="error" showIcon />}

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item label="Trạng thái chiến dịch" name="status" required>
              <Select options={STATUS_OPTIONS} size="large" className="!rounded-xl" />
            </Form.Item>

            <Form.Item label="Mục tiêu gây quỹ (VND)" name="targetAmount">
              <InputNumber
                min={0}
                step={1000000}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                size="large"
                className="w-full !rounded-xl"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Tên chiến dịch"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input size="large" className="!rounded-xl" />
          </Form.Item>

          <Form.Item label="Mục tiêu ngắn hạn (Goal)" name="goal">
            <Input size="large" className="!rounded-xl" />
          </Form.Item>

          <Form.Item label="Mô tả tóm tắt" name="shortDescription">
            <Input className="!rounded-xl" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item label="Địa điểm" name="location">
              <Input className="!rounded-xl" />
            </Form.Item>

            <Form.Item label="Đơn vị tổ chức" name="organization">
              <Input className="!rounded-xl" />
            </Form.Item>
          </div>

          <Form.Item label="Link ảnh bìa Banner" name="bannerImage">
            <Input className="!rounded-xl" />
          </Form.Item>

          <Form.Item label="Điều kiện tình nguyện viên" name="volunteerConditions">
            <Input.TextArea rows={2} className="!rounded-xl" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
            className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
          >
            Lưu thay đổi
          </Button>
        </Form>
      </div>
    </Modal>
  );
};
