'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Modal, Form, Input, InputNumber, Alert, message, Tag, Tabs, Tooltip } from 'antd';
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  CheckCircle,
  Truck,
  Sparkles,
  Award,
  HeartHandshake,
  Info,
  FileText,
  Leaf,
  RefreshCw,
  PhoneCall,
  Calendar,
  Box,
  Tag as TagIcon,
  Check,
  UserCheck,
  HelpCircle,
  Clock,
  Layers,
  Flame,
  BadgePercent,
  CheckCircle2,
} from 'lucide-react';
import { marketplaceService } from '@/services/marketplaceService';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { Product } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { formatVND, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ProductCard } from '@/components/shared/ProductCard';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSection } from '@/components/shared/CommentSection';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buy Now modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadProductAndRelated() {
      try {
        setLoading(true);
        setError(null);
        const [data, allProducts] = await Promise.all([
          marketplaceService.getMarketplaceDetail(id),
          marketplaceService.listMarketplace().catch(() => []),
        ]);
        setProduct(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }
        setRelatedProducts(allProducts.filter((p) => p._id !== id).slice(0, 4));
      } catch (err: any) {
        setError(err.message || 'Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    }
    loadProductAndRelated();
  }, [id]);

  const handleOpenBuyModal = () => {
    if (!user) {
      message.info('Vui lòng đăng nhập để tiến hành mua hàng');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmOrder = async (values: any) => {
    if (!product) return;
    try {
      setPlacingOrder(true);
      setOrderError(null);

      // 1. Create order
      const order = await orderService.create({
        productId: product._id,
        quantity,
        shippingAddress: values.shippingAddress,
        phone: values.phone,
        note: values.note,
      });

      // 2. Create payment
      const payment = await paymentService.create({
        purpose: 'order',
        orderId: order._id,
      });

      message.success('Tạo đơn hàng thành công! Đang chuyển đến trang thanh toán...');
      setModalOpen(false);

      const paymentId = payment.id || payment._id;
      window.location.href = payment.checkoutUrl || `/payments/${paymentId}/checkout`;
    } catch (err: any) {
      setOrderError(err.message || 'Có lỗi xảy ra khi đặt đơn hàng');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Alert
          message="Không tìm thấy sản phẩm"
          description={error || 'Sản phẩm này không còn tồn tại trên marketplace.'}
          type="error"
          showIcon
          className="mb-6 rounded-2xl"
        />
        <Button onClick={() => router.push('/marketplace')} icon={<ArrowLeft className="w-4 h-4" />}>
          Về danh sách sản phẩm
        </Button>
      </div>
    );
  }

  const hasImage = Boolean(selectedImage || (product.images && product.images.length > 0));
  const activeImage = selectedImage || (product.images ? product.images[0] : '');
  const totalPrice = product.price * quantity;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Donation story details fallback
  const donorDisplayName =
    product.donationStory?.donorName ||
    (typeof product.donation === 'object' && product.donation?.donor && !product.donation?.isAnonymous
      ? typeof product.donation.donor === 'object'
        ? product.donation.donor.fullName
        : 'Người hảo tâm ReGive'
      : product.donationStory?.isAnonymous || (typeof product.donation === 'object' && product.donation?.isAnonymous)
      ? 'Nhà hảo tâm ẩn danh'
      : 'Cộng đồng ReGive');

  const donorMessageText =
    product.donationStory?.donorMessage ||
    (typeof product.donation === 'object' && product.donation?.note) ||
    'Món quà được trao gửi với mong muốn sẻ chia yêu thương và tiếp thêm động lực cho các hoàn cảnh khó khăn.';

  const intakeLocationText =
    product.donationStory?.intakeLocation ||
    product.storageLocation ||
    'Trạm tiếp nhận & điều phối ReGive Trung Tâm';

  // Quality score & inspection — chỉ dùng dữ liệu kiểm định thật, không bịa điểm mặc định
  const inspectionScore = product.inspectionReport?.score;
  const inspectorName =
    product.inspectionReport?.inspectorName ||
    (typeof product.reviewedBy === 'object' ? product.reviewedBy?.fullName : null);
  const inspectedDate = product.inspectionReport?.inspectedAt || product.reviewedAt || product.createdAt;

  // Tabs items definition
  const tabItems = [
    {
      key: 'specs',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Layers className="w-4 h-4" />
          Thông số & Đặc tính
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          {/* Specifications Table */}
          {product.specifications && product.specifications.length > 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-p-s600" />
                Bảng thông số chi tiết của vật phẩm
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {product.brand && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Thương hiệu / Hãng:</span>
                    <span className="font-semibold text-gray-900 text-right">{product.brand}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Xuất xứ / Nguồn gốc:</span>
                    <span className="font-semibold text-gray-900 text-right">{product.origin}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Chất liệu cấu thành:</span>
                    <span className="font-semibold text-gray-900 text-right">{product.material}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Màu sắc:</span>
                    <span className="font-semibold text-gray-900 text-right">{product.color}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Trọng lượng:</span>
                    <span className="font-semibold text-gray-900 text-right">{product.weight}</span>
                  </div>
                )}
                {product.dimensions && product.dimensions.length && product.dimensions.width ? (
                  <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">Kích thước (D x R x C):</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height || 0}{' '}
                      {product.dimensions.unit || 'cm'}
                    </span>
                  </div>
                ) : null}
                {product.specifications.map((spec, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 border-b border-gray-200/60">
                    <span className="text-gray-500">{spec.key}:</span>
                    <span className="font-semibold text-gray-900 text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Danh mục:</span>
                <span className="font-semibold text-gray-900 capitalize">{product.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Tình trạng:</span>
                <span className="font-semibold text-gray-900 uppercase">{product.condition || 'Tốt'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Phẩm chất:</span>
                <span className="font-semibold text-gray-900 capitalize">{product.quality || 'Cao'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Mã vật phẩm (SKU):</span>
                <span className="font-semibold text-gray-900">{product.sku || product._id.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Full Detailed Description */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-2">Mô tả chi tiết từ đội ngũ ReGive</h4>
            <div className="prose max-w-none text-gray-700 bg-white p-5 rounded-2xl border border-gray-100 leading-relaxed whitespace-pre-line text-sm">
              {product.description ||
                'Vật phẩm quyên góp đã qua phân loại kỹ thuật và được phê duyệt niêm yết trên ReGive Marketplace.'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'inspection',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-p-s600" />
          Biên bản kiểm định & AI
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          {/* Quality Rating Overview Header */}
          <div className="bg-gradient-to-r from-p-s50 via-sec-s50 to-p-s50 rounded-2xl p-5 border border-p-s200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-p-s700" />
                <span className="font-black text-p-s950 text-base">Chứng chỉ giám định ReGive Quality Shield</span>
              </div>
              <p className="text-xs text-p-s800">
                Được kiểm định độc lập & đối chiếu chéo bởi chuyên viên ReGive kết hợp AI Assessment.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/90 px-4 py-2.5 rounded-2xl border border-p-s200 shadow-sm shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Điểm thẩm định</span>
                <span className="text-xs font-semibold text-p-s800">
                  {inspectionScore != null ? 'Đạt chuẩn A+' : 'Chưa có điểm'}
                </span>
              </div>
              <span className="text-2xl font-black text-p-s700">
                {inspectionScore != null ? `${inspectionScore}/10` : '—'}
              </span>
            </div>
          </div>

          {/* Inspection Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-p-s600" />
                Độ hao mòn & Hình thức thực tế
              </span>
              <p className="text-gray-700 text-xs leading-relaxed">
                {product.inspectionReport?.conditionDetails ||
                  'Đang chờ cập nhật biên bản kiểm định chi tiết từ đội ngũ ReGive.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-p-s600" />
                Kiểm tra công năng & Khả năng sử dụng
              </span>
              <p className="text-gray-700 text-xs leading-relaxed">
                {product.inspectionReport?.functionalityStatus ||
                  'Đang chờ cập nhật kết quả kiểm tra công năng từ đội ngũ ReGive.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sec-s600" />
                Quy trình vệ sinh & Khử trùng
              </span>
              <p className="text-gray-700 text-xs leading-relaxed">
                {product.inspectionReport?.sanitizationStatus ||
                  'Đang chờ cập nhật quy trình vệ sinh & khử trùng từ đội ngũ ReGive.'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-600" />
                Phụ kiện đi kèm
              </span>
              {product.inspectionReport?.accessoriesIncluded && product.inspectionReport.accessoriesIncluded.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.inspectionReport.accessoriesIncluded.map((acc, i) => (
                    <Tag key={i} color="default" className="text-xs rounded-lg px-2.5 py-0.5 m-0 border-gray-200">
                      + {acc}
                    </Tag>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                {product.inspectionReport
                  ? 'Đầy đủ phụ kiện tiêu chuẩn đi kèm theo mô tả.'
                  : 'Đang chờ cập nhật danh sách phụ kiện kèm theo.'}
              </p>
              )}
            </div>
          </div>

          {/* AI Assessment Deep Verification */}
          {product.latestAiAssessment && (
            <div className="p-5 rounded-2xl bg-sec-s50/70 border border-sec-s200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sec-s950 text-sm">
                  <Sparkles className="w-4 h-4 text-sec-s600" />
                  <span>Mô hình AI Đánh giá & Định lượng minh bạch</span>
                </div>
                <Tag color="cyan" className="text-xs font-bold px-3 py-1 rounded-full m-0 border-0">
                  Độ tin cậy AI: {Math.round((product.latestAiAssessment.suggestion?.confidence || 0.95) * 100)}%
                </Tag>
              </div>

              <p className="text-xs text-sec-s900/90 leading-relaxed">
                {product.latestAiAssessment.suggestion?.rationale ||
                  product.latestAiAssessment.finalDecision?.rationale ||
                  `AI đã phân tích dữ liệu hình ảnh, thương hiệu và thông số của sản phẩm để đưa ra mức giá ủng hộ tối ưu ${formatVND(
                    product.price
                  )}, đảm bảo vừa dễ dàng tiếp cận người mua vừa tối đa hóa nguồn quỹ từ thiện.`}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-sec-s800 border-t border-sec-s200/60">
                <span>Nhà cung cấp thuật toán: {product.latestAiAssessment.provider || 'Gemini 1.5 Pro Vision'}</span>
                <span>Trạng thái: Đã phê duyệt và niêm yết</span>
              </div>
            </div>
          )}

          {/* Inspector Sign-off info */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {inspectorName ? (
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-p-s600" />
                  Chuyên viên giám định: <strong className="text-gray-800">{inspectorName}</strong>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-p-s600" />
                  Chuyên viên giám định: <strong className="text-gray-800">Đang cập nhật</strong>
                </span>
              )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Ngày kiểm định: {formatDate(inspectedDate)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'story',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <HeartHandshake className="w-4 h-4 text-rose-500" />
          Câu chuyện món quà
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          <div className="bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 font-black text-lg">
                ❤️
              </div>
              <div>
                <span className="text-xs text-rose-700 font-bold uppercase tracking-wider block">Người trao tặng</span>
                <h4 className="text-base font-extrabold text-gray-900">{donorDisplayName}</h4>
              </div>
            </div>

            <blockquote className="italic text-gray-700 bg-white/90 p-4 rounded-2xl border border-rose-100 text-sm leading-relaxed relative">
              <span className="text-3xl text-rose-300 font-serif absolute -top-3 left-3 select-none">“</span>
              <p className="pt-1 pl-4">{donorMessageText}</p>
              <span className="text-3xl text-rose-300 font-serif absolute -bottom-4 right-3 select-none">”</span>
            </blockquote>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 pt-2 border-t border-rose-100/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Trạm tiếp nhận: {intakeLocationText}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Ngày trao gửi: {formatDate(product.donationStory?.receivedAt || product.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'impact',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Leaf className="w-4 h-4 text-p-s600" />
          Tác động xã hội & Xanh
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          {/* Direct Charity Benefit Card */}
          <div className="bg-p-s50 rounded-2xl p-5 border border-p-s200/80 space-y-3">
            <div className="flex items-center gap-2 text-p-s950 font-bold text-sm">
              <HeartHandshake className="w-5 h-5 text-p-s600" />
              <span>Ý nghĩa hỗ trợ cộng đồng trực tiếp</span>
            </div>
            <p className="text-sm text-p-s900 leading-relaxed font-medium">
              {product.charityImpact?.directBenefit ||
                `100% doanh thu ${formatVND(
                  product.price
                )} từ việc bạn mua vật phẩm này sẽ được chuyển thẳng vào quỹ cứu trợ, không trừ bất kỳ khoản phí trung gian nào.`}
            </p>
          </div>

          {/* Environmental Savings Grid */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-p-s600" />
              Tác động tích cực đến môi trường (Kinh tế tuần hoàn)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-2xl font-black text-p-s600">
                  {product.charityImpact?.co2SavedKg || (product.price > 100000 ? 3.5 : 1.8)} kg
                </span>
                <span className="text-xs text-gray-500 block font-medium">Giảm phát thải CO2</span>
                <span className="text-[10px] text-gray-400 block">Tương đương trồng 0.5 cây xanh</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-2xl font-black text-sec-s600">
                  {product.charityImpact?.wasteDivertedKg || (product.weight ? product.weight : '0.8 kg')}
                </span>
                <span className="text-xs text-gray-500 block font-medium">Rác thải giảm khỏi bãi chôn</span>
                <span className="text-[10px] text-gray-400 block">Tái tuần hoàn vật chất</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-2xl font-black text-p-s700">100%</span>
                <span className="text-xs text-gray-500 block font-medium">Minh bạch dòng tiền</span>
                <span className="text-[10px] text-gray-400 block">Truy xuất sao kê thời gian thực</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'shipping',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Truck className="w-4 h-4 text-blue-600" />
          Vận chuyển & Bảo hành
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            {/* Shipping & Warehouse */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Thông tin kho hàng & Giao nhận
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block">Địa chỉ lưu kho:</span>
                  <span className="font-semibold text-gray-800">
                    {product.warehouseAndShipping?.storageLocation || product.storageLocation || 'Kho ReGive Trung Tâm'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Quy cách đóng gói:</span>
                  <span className="font-semibold text-gray-800">
                    {product.warehouseAndShipping?.packagingType ||
                      'Thùng/Túi giấy kraft tái chế 100%, bọc xốp khí sinh học tự hủy thân thiện môi trường'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Thời gian giao hàng dự kiến:</span>
                  <span className="font-semibold text-gray-800">
                    {product.warehouseAndShipping?.estimatedDeliveryDays || '2 - 3 ngày làm việc'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guarantee Policy */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-p-s600" />
                Chính sách đồng kiểm & Bảo hành
              </h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <span className="text-gray-400 block">Thời hạn bảo hành đổi trả:</span>
                  <span className="font-semibold text-p-s700">
                    {product.guaranteePolicy?.warrantyDays || 30} ngày kể từ khi nhận hàng
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Cam kết quyền lợi:</span>
                  <span className="font-semibold text-gray-800">
                    {product.guaranteePolicy?.returnPolicy ||
                      'Được quyền đồng kiểm trước khi nhận. Đổi trả hoặc hoàn tiền 100% gây quỹ nếu phát hiện lỗi sai mô tả.'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Hotline hỗ trợ 24/7:</span>
                  <span className="font-semibold text-gray-800">
                    {product.guaranteePolicy?.supportHotline || '1900 6868'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs & Back link */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-p-s600 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-p-s600 transition-colors">
            Chợ gây quỹ ReGive
          </Link>
          <span>/</span>
          <span className="capitalize text-gray-400">{product.category || 'Vật phẩm'}</span>
          <span>/</span>
          <span className="font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-p-s600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách</span>
        </Link>
      </div>

      {/* Main Top Section: Images Gallery (Left) & Essential Info / Action (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Gallery & Quality Badges (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-50/80 flex items-center justify-center overflow-hidden relative group">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Package className="w-20 h-20 stroke-[1.2] text-p-s500 mb-2" />
                  <span className="text-sm font-medium">Vật phẩm trao tặng ReGive</span>
                </div>
              )}

              {/* Top overlay badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.condition && <StatusBadge type="product" status={product.condition} />}
                {discountPercent && discountPercent > 0 ? (
                  <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    <Flame className="w-3 h-3" /> Tiết kiệm {discountPercent}%
                  </span>
                ) : null}
              </div>
            </div>

            {/* Thumbnails if multiple */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto w-full pt-4 pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                      activeImage === img ? 'border-p-s600 shadow-md ring-2 ring-p-s100' : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ReGive Quality Shield Box */}
          <div className="bg-p-s50/80 border border-p-s200/80 rounded-2xl p-4 space-y-2 text-xs text-p-s950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-p-s900">
                <ShieldCheck className="w-4 h-4 text-p-s700" />
                <span>ReGive Quality Shield Guarantee</span>
              </div>
              <span className="text-[11px] font-extrabold text-p-s700 bg-white px-2 py-0.5 rounded-full border border-p-s200">
                {inspectionScore}/10
              </span>
            </div>
            <p className="text-p-s800 leading-relaxed">
              Vật phẩm đã được nhân viên ReGive tiếp nhận, khử khuẩn chuyên sâu, kiểm tra công năng và đóng gói theo quy chuẩn bảo vệ môi trường.
            </p>
          </div>
        </div>

        {/* Right Column: Title, Prices, Highlights & Action (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-5">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center gap-2">
              {product.sku && (
                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                  {product.sku}
                </span>
              )}
              {product.brand && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Hãng: {product.brand}
                </span>
              )}
              {product.origin && (
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200">
                  Xuất xứ: {product.origin}
                </span>
              )}
              {product.quality && (
                <Tag color="blue" className="text-xs font-semibold px-2.5 py-0.5 rounded-full border-0 m-0">
                  Phẩm chất: {product.quality}
                </Tag>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Price Box with original price comparison */}
            <div className="p-4 sm:p-5 rounded-2xl bg-p-s50/70 border border-p-s200/80 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Giá ủng hộ gây quỹ:</span>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-p-s700">
                    {formatVND(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through font-semibold">
                      {formatVND(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-p-s800 font-semibold bg-white px-3 py-1.5 rounded-xl border border-p-s200 shadow-sm inline-flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-p-s600" />
                  100% nạp vào quỹ
                </span>
              </div>
            </div>

            {/* Target Campaign Banner if linked */}
            {product.campaign && typeof product.campaign === 'object' && product.campaign.title && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
                    <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Chiến dịch thụ hưởng doanh thu</span>
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm truncate">
                    {product.campaign.title}
                  </h4>
                  <p className="text-xs text-amber-900/80">
                    100% số tiền {formatVND(product.price)} sẽ được nạp trực tiếp vào quỹ hỗ trợ của chiến dịch này.
                  </p>
                </div>
                <Link
                  href={`/campaigns/${product.campaign._id}`}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Xem quỹ
                </Link>
              </div>
            )}

            {/* Highlights bullet list */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Đặc điểm nổi bật:</span>
                <ul className="space-y-1.5 text-xs text-gray-700">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-p-s600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warehouse stock info */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Tồn kho khả dụng:</span>
                <span className="font-black text-gray-900 text-sm">{product.stockQuantity} món</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Vị trí kho lưu:</span>
                <span className="font-bold text-p-s700 text-sm truncate block">
                  {product.storageLocation || 'Kho ReGive Trung Tâm'}
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2">
              <Button
                type="primary"
                size="large"
                disabled={product.stockQuantity <= 0}
                onClick={handleOpenBuyModal}
                icon={<ShoppingBag className="w-5 h-5" />}
                className="w-full h-14 rounded-2xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-base shadow-xl shadow-p-s600/25 transition-all"
              >
                {product.stockQuantity > 0 ? 'Mua ngay để gây quỹ' : 'Tạm hết hàng'}
              </Button>
            </div>

            {/* Micro reassurance assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 pt-1">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-p-s600 shrink-0" />
                <span>Giao hàng toàn quốc 2-3 ngày</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-p-s600 shrink-0" />
                <span>Đồng kiểm & Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Structured Information Tabs Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <Tabs defaultActiveKey="specs" items={tabItems} size="large" className="custom-product-tabs" />
      </section>

      {/* Community Comments */}
      <CommentSection targetType="product" targetId={product._id} />

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-p-s600 uppercase tracking-wider">
                Khám phá thêm
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                Vật Phẩm Trao Tặng Khác
              </h3>
            </div>
            <Link
              href="/marketplace"
              className="text-sm font-bold text-p-s700 hover:text-p-s800"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Buy Now Order Confirmation Modal */}
      <Modal
        title={
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-900">Xác Nhận Đặt Hàng & Gây Quỹ</h3>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Vật phẩm: <span className="font-semibold text-gray-800">{product.name}</span>
            </p>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
        className="rounded-2xl"
      >
        <div className="py-4 space-y-4">
          {orderError && <Alert message="Lỗi đặt hàng" description={orderError} type="error" showIcon />}

          <Form
            layout="vertical"
            onFinish={handleConfirmOrder}
            initialValues={{
              quantity: 1,
              shippingAddress: user?.address || '',
              phone: user?.phone || '',
            }}
            requiredMark="optional"
          >
            <Form.Item label="Số lượng muốn mua" required>
              <div className="flex items-center gap-3">
                <InputNumber
                  min={1}
                  max={product.stockQuantity}
                  value={quantity}
                  onChange={(val) => setQuantity(val || 1)}
                  size="large"
                  className="!rounded-xl w-32"
                />
                <span className="text-xs text-gray-400">
                  (Còn lại: {product.stockQuantity} món)
                </span>
              </div>
            </Form.Item>

            <Form.Item
              label="Địa chỉ giao nhận hàng"
              name="shippingAddress"
              rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận hàng' }]}
            >
              <Input placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." size="large" className="!rounded-xl" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại liên hệ"
              name="phone"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input placeholder="09xxxxxxxx" size="large" className="!rounded-xl" />
            </Form.Item>

            <Form.Item label="Ghi chú đơn hàng" name="note">
              <Input.TextArea rows={2} placeholder="Ghi chú thời gian nhận hàng thuận tiện..." className="!rounded-xl" />
            </Form.Item>

            {/* Total calculation */}
            <div className="bg-p-s50/70 p-4 rounded-2xl border border-p-s100 flex items-center justify-between mb-4">
              <div>
                <span className="text-xs text-gray-500 block">Tổng tiền thanh toán:</span>
                <span className="text-xs text-gray-400">
                  {formatVND(product.price)} × {quantity}
                </span>
              </div>
              <span className="text-2xl font-black text-p-s700">
                {formatVND(totalPrice)}
              </span>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={placingOrder}
              size="large"
              className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20"
            >
              Xác nhận và Chuyển đến thanh toán
            </Button>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
