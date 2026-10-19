'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, InputNumber, Button, Alert, message, Result, Select, Checkbox, Upload } from 'antd';
import { Package, ArrowLeft, ShieldCheck, CheckCircle, Info, Sparkles, Upload as UploadIcon } from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { donationService } from '@/services/donationService';
import { aiService } from '@/services/aiService';
import { uploadService } from '@/services/uploadService';
import { Campaign, Donation, AiDonationPreview } from '@/types';
import { formatVND } from '@/lib/format';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { VerifyEmailNotice } from '@/components/shared/VerifyEmailNotice';

const PRODUCT_CATEGORIES = [
  { value: 'clothing', label: 'Quần áo ấm & Thời trang' },
  { value: 'books_stationery', label: 'Sách giáo khoa, truyện & Vở viết' },
  { value: 'electronics', label: 'Thiết bị điện tử & Gia dụng' },
  { value: 'toys', label: 'Đồ chơi & Bộ phát triển trí tuệ' },
  { value: 'essentials', label: 'Nhu yếu phẩm & Đồ khô' },
  { value: 'other', label: 'Khác' },
];

export default function DonateProductPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;
  const [form] = Form.useForm();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);

  // Ảnh vật phẩm: upload thật qua /api/uploads (Cloudinary hoặc local fallback)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleUploadImage = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      setUploadingImages(true);
      const res = await uploadService.uploadImage(file as File);
      setImageUrls((prev) => (prev.length >= 5 ? prev : [...prev, res.url]));
      onSuccess?.(res);
    } catch (err: any) {
      message.error(err.message || 'Tải ảnh thất bại. Vui lòng thử ảnh khác (JPEG/PNG/GIF/WebP, tối đa 5MB).');
      onError?.(err);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (file: any) => {
    setImageUrls((prev) => prev.filter((url) => url !== file?.response?.url));
  };

  // AI Assistant states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiDonationPreview | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    campaignService
      .getById(campaignId)
      .then((c) => setCampaign(c))
      .catch((err) => setError(err.message || 'Không tìm thấy chiến dịch'));
  }, [campaignId]);

  const handleAiAnalyze = async () => {
    const name = form.getFieldValue('name');
    if (!name || !name.trim()) {
      message.warning('Vui lòng nhập tên vật phẩm trước khi yêu cầu AI thẩm định!');
      return;
    }
    try {
      setAiLoading(true);
      const res = await aiService.previewDonation({
        name,
        description: form.getFieldValue('description'),
        category: form.getFieldValue('category'),
        images: imageUrls,
        extraNote: form.getFieldValue('conditionNote'),
      });
      setAiResult(res);
      message.success('AI đã hoàn tất thẩm định và tính toán giá trị tác động!');
    } catch (err: any) {
      message.error(err.message || 'Không thể gọi AI thẩm định lúc này');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAi = () => {
    if (!aiResult) return;
    const catMap: Record<string, string> = {
      clothing: 'clothing',
      bags: 'clothing',
      books: 'books_stationery',
      electronics: 'electronics',
      toys: 'toys',
      home: 'essentials',
      other: 'other',
    };
    const mappedCategory = catMap[aiResult.assessment.category] || 'other';
    form.setFieldsValue({
      category: mappedCategory,
      estimatedValue: aiResult.assessment.suggestedPrice,
      conditionNote: `Độ mới: ${aiResult.assessment.condition}, chất lượng: ${aiResult.assessment.quality}`,
    });
    message.success('Đã áp dụng các thông số gợi ý từ AI vào mẫu quyên góp!');
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      setError(null);

      if (uploadingImages) {
        message.warning('Ảnh đang được tải lên, vui lòng đợi một chút rồi thử lại.');
        return;
      }

      const donation = await donationService.createDonation({
        campaignId,
        type: 'product',
        isAnonymous,
        productInfo: {
          name: values.name,
          category: values.category || 'other',
          quantity: values.quantity || 1,
          description: values.description || '',
          conditionNote: values.conditionNote || '',
          estimatedValue: values.estimatedValue || 0,
          images: imageUrls,
        },
        note: values.note || '',
      });

      setCreatedDonation(donation);
      message.success('Gửi đăng ký quyên góp hiện vật thành công!');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi thông tin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
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

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl">
          <VerifyEmailNotice />
          {createdDonation ? (
            <Result
              status="success"
              title="Đăng Ký Quyên Góp Hiện Vật Thành Công!"
              subTitle={
                <div className="text-gray-600 text-sm space-y-3 mt-3">
                  <p>
                    Mã quyên góp của bạn là:{' '}
                    <strong className="text-p-s700 font-mono text-base">
                      {createdDonation._id}
                    </strong>
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-1.5 text-xs text-gray-700">
                    <div>
                      <strong>Vật phẩm:</strong> {createdDonation.productInfo?.name}
                    </div>
                    <div>
                      <strong>Số lượng:</strong> {createdDonation.productInfo?.quantity}
                    </div>
                    {createdDonation.productInfo?.conditionNote && (
                      <div>
                        <strong>Tình trạng:</strong> {createdDonation.productInfo?.conditionNote}
                      </div>
                    )}
                  </div>
                  <div className="bg-sec-s50 text-sec-s900 p-4 rounded-2xl text-xs text-left leading-relaxed border border-sec-s200">
                    <strong className="flex items-center gap-1 mb-1 font-bold text-sec-s950">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quy trình tiếp nhận tiếp theo:
                    </strong>
                    Điều phối viên kho ReGive sẽ liên hệ với bạn qua số điện thoại tài khoản trong vòng 24h để xác nhận phương thức vận chuyển hoặc điểm tập kết vật phẩm gần bạn nhất.
                  </div>
                </div>
              }
              extra={[
                <Link key="me" href="/me/donations">
                  <Button type="primary" className="bg-p-s600 rounded-xl h-11 px-6 font-bold">
                    Xem lịch sử quyên góp
                  </Button>
                </Link>,
                <Link key="back" href={`/campaigns/${campaignId}`}>
                  <Button className="rounded-xl h-11 px-6">Về chiến dịch</Button>
                </Link>,
              ]}
            />
          ) : (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-2 text-sec-s600 font-bold text-xs uppercase tracking-wider mb-1">
                  <Package className="w-4 h-4" />
                  <span>Tuần hoàn vật phẩm</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900">Quyên Góp Hiện Vật</h1>
                {campaign && (
                  <div className="mt-2 p-3 bg-sec-s50/60 rounded-xl border border-sec-s100/80">
                    <p className="text-xs text-sec-s800 font-medium">Chiến dịch tiếp nhận:</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{campaign.title}</p>
                  </div>
                )}
              </div>

              {/* Guidelines banner */}
              <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Tiêu chuẩn vật phẩm tiếp nhận ReGive:</p>
                  <p>
                    Vật phẩm cần còn sử dụng tốt (độ mới từ 70% trở lên), đã được giặt sạch hoặc vệ sinh cẩn thận. Không gửi các đồ vật dễ cháy nổ, đồ ăn ôi thiu hoặc đồ đã hư hỏng nặng.
                  </p>
                </div>
              </div>

              {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ quantity: 1, category: 'clothing' }}
                requiredMark="optional"
              >
                {/* AI Assistant Banner */}
                <div className="bg-gradient-to-r from-sec-s50 via-p-s50 to-cyan-50 border border-sec-s200/80 rounded-2xl p-4 sm:p-5 mb-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sec-s600 text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Trợ lý AI Thẩm định & Định giá</h4>
                        <p className="text-xs text-gray-500">Tự động nhận diện tình trạng, gợi ý giá trị và tính toán số suất cơm hỗ trợ.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={aiLoading}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sec-s600 hover:bg-sec-s700 text-white font-bold text-xs shadow-md shadow-sec-s600/20 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                      <span>{aiLoading ? 'AI đang phân tích...' : 'Thẩm định cùng AI'}</span>
                    </button>
                  </div>

                  {aiResult && (
                    <div className="mt-3 p-4 bg-white/90 rounded-xl border border-sec-s200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-sec-s900 text-sm flex items-center gap-1.5">
                          <span>Kết quả thẩm định AI</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sec-s100 text-sec-s800">
                            Độ tin cậy {(aiResult.assessment.confidence * 100).toFixed(0)}%
                          </span>
                          {aiResult.provider && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                aiResult.provider === 'gemini'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                              title={aiResult.fallbackReason || undefined}
                            >
                              {aiResult.provider === 'gemini'
                                ? `Gemini${aiResult.model ? ` · ${aiResult.model}` : ''}`
                                : 'AI fallback'}
                            </span>
                          )}
                        </span>
                        <Button
                          type="dashed"
                          size="small"
                          onClick={handleApplyAi}
                          className="!text-sec-s700 !border-sec-s400 font-bold hover:!bg-sec-s50"
                        >
                          Áp dụng thông số này
                        </Button>
                      </div>

                      {aiResult.fallbackReason && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-900">
                          Gemini tạm thời không trả kết quả, hệ thống đang dùng bộ đánh giá dự phòng. Lý do: {aiResult.fallbackReason}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-gray-400 block text-[10px]">Tình trạng:</span>
                          <span className="font-bold text-gray-800 uppercase">{aiResult.assessment.condition}</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-gray-400 block text-[10px]">Phẩm chất:</span>
                          <span className="font-bold text-gray-800 uppercase">{aiResult.assessment.quality}</span>
                        </div>
                        <div className="p-2 bg-p-s50 rounded-lg col-span-2 sm:col-span-1 border border-p-s100">
                          <span className="text-p-s600 block text-[10px] font-medium">Giá trị ước tính:</span>
                          <span className="font-black text-p-s800 text-sm">
                            {formatVND(aiResult.assessment.suggestedPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Social & Environmental Impact */}
                      {aiResult.impactMetrics && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 text-amber-900 space-y-1">
                          <p className="font-bold text-xs flex items-center gap-1">
                            Tác động xã hội & môi trường ước tính:
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {aiResult.impactMetrics.quote}
                          </p>
                          <p className="text-[10px] text-amber-800/80 font-medium">
                            Giảm thiểu ~{aiResult.impactMetrics.wasteDivertedKg} kg rác thải ra bãi chôn lấp (tiết kiệm ~{aiResult.impactMetrics.co2SavedKg} kg CO2).
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label="Danh mục vật phẩm"
                    name="category"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                  >
                    <Select options={PRODUCT_CATEGORIES} size="large" className="!rounded-xl" />
                  </Form.Item>

                  <Form.Item
                    label="Số lượng"
                    name="quantity"
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                  >
                    <InputNumber min={1} max={1000} size="large" className="w-full !rounded-xl" />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Tên vật phẩm quyên góp"
                  name="name"
                  rules={[{ required: true, message: 'Vui lòng nhập tên vật phẩm' }]}
                >
                  <Input
                    placeholder="Ví dụ: Áo khoác lông vũ mùa đông, 10 Bộ sách giáo khoa lớp 4..."
                    size="large"
                    className="!rounded-xl"
                  />
                </Form.Item>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item label="Tình trạng vật phẩm" name="conditionNote">
                    <Input
                      placeholder="Ví dụ: Mới 95%, nguyên cúc áo, đã giặt thơm..."
                      size="large"
                      className="!rounded-xl"
                    />
                  </Form.Item>

                  <Form.Item label="Giá trị ước tính (VND)" name="estimatedValue">
                    <InputNumber
                      min={0}
                      step={50000}
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      placeholder="Ví dụ: 300,000"
                      size="large"
                      className="w-full !rounded-xl"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Ảnh chụp thực tế vật phẩm (tối đa 5 ảnh, JPEG/PNG/GIF/WebP ≤ 5MB)"
                  required={false}
                  extra="Ảnh thật giúp nhân viên ReGive và AI thẩm định chính xác hơn."
                >
                  <Upload
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    listType="picture-card"
                    multiple
                    maxCount={5}
                    customRequest={handleUploadImage}
                    onRemove={handleRemoveImage}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                      <UploadIcon className="w-5 h-5 text-sec-s600" />
                      <span className="text-[11px] font-medium">Chọn / chụp ảnh</span>
                    </div>
                  </Upload>
                  {uploadingImages && <p className="text-xs text-gray-400 mt-1">Đang tải ảnh lên…</p>}
                </Form.Item>

                <Form.Item label="Mô tả chi tiết" name="description">
                  <Input.TextArea
                    rows={3}
                    placeholder="Màu sắc, kích thước, các đặc điểm cần lưu ý..."
                    className="!rounded-xl"
                  />
                </Form.Item>

                <Form.Item label="Ghi chú giao nhận / thời gian liên hệ thuận tiện" name="note">
                  <Input.TextArea
                    rows={2}
                    placeholder="Địa chỉ quận/huyện hoặc khung giờ bạn có thể nghe máy..."
                    className="!rounded-xl"
                  />
                </Form.Item>

                {/* Anonymous Option */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl mb-4">
                  <Checkbox
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="text-xs font-bold text-gray-800"
                  >
                    Ủng hộ ẩn danh trên Bảng vàng đóng góp
                  </Checkbox>
                </div>

                <div className="pt-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    size="large"
                    className="w-full h-12 rounded-xl bg-sec-s600 hover:bg-sec-s700 text-white font-bold text-base shadow-lg shadow-sec-s600/25"
                  >
                    Xác nhận gửi thông tin quyên góp
                  </Button>
                </div>
              </Form>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400 text-center">
                <ShieldCheck className="w-4 h-4 text-p-s600" />
                <span>Vật phẩm sẽ được nhân viên ReGive kiểm định và chuyển giao minh bạch.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
