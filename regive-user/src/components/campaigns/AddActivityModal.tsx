'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, message, DatePicker } from 'antd';
import { Camera, Sparkles } from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { Campaign } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface AddActivityModalProps {
  campaign: Campaign | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedCampaign: Campaign) => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  campaign,
  open,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!campaign) return null;

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);

      const activityData = {
        title: values.title,
        content: values.content,
        image: values.image || '',
        author: values.author || user?.fullName || 'Ban điều phối ReGive',
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
      };

      const updated = await campaignService.addActivity(campaign._id, activityData);
      message.success('Đã đăng cập nhật nhật ký thực địa mới!');
      form.resetFields();
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể thêm hoạt động');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-p-s100 flex items-center justify-center text-p-s600">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-900">Thêm Nhật Ký Thực Địa Mới</h3>
            <p className="text-xs text-gray-500 font-normal">
              Cập nhật hình ảnh và tin tức tiến độ chuyến đi cho các nhà hảo tâm cùng theo dõi.
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      className="rounded-2xl"
    >
      <div className="py-3 space-y-4">
        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            author: user?.fullName ? `TNV ${user.fullName}` : 'Ban điều phối ReGive',
          }}
          requiredMark="optional"
        >
          <Form.Item
            label="Tiêu đề hoạt động"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề hoạt động' }]}
          >
            <Input
              placeholder="Ví dụ: Đêm phát cơm thứ 5 tại Chợ Lớn hoặc Hoàn tất trao 300 áo ấm..."
              size="large"
              className="!rounded-xl"
            />
          </Form.Item>

          <Form.Item label="Thời gian thực hiện" name="date">
            <DatePicker size="large" className="w-full !rounded-xl" />
          </Form.Item>

          <Form.Item
            label="Nội dung chi tiết hoạt động"
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung thực địa' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Mô tả số lượng quà đã trao, cảm xúc của bà con/các em, tình hình thời tiết và các tình nguyện viên tham gia..."
              className="!rounded-xl"
            />
          </Form.Item>

          <Form.Item label="Link ảnh thực tế chuyến đi (URL)" name="image">
            <Input
              placeholder="https://images.unsplash.com/... hoặc link ảnh công khai"
              size="large"
              className="!rounded-xl"
            />
          </Form.Item>

          <Form.Item label="Người / Đội ngũ cập nhật" name="author">
            <Input placeholder="Ban điều phối ReGive" size="large" className="!rounded-xl" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
            className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
          >
            Đăng cập nhật thực địa
          </Button>
        </Form>
      </div>
    </Modal>
  );
};
