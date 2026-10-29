'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Input, Modal, Steps, message } from 'antd';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Info,
  MapPin,
  Package,
  Phone,
  Receipt,
  ShoppingBag,
  Truck,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { Order, OrderStatus } from '@/types';
import { formatDateTime, formatVND } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { Timeline, TimelineItem } from '@/components/shared/Timeline';
import {
  CodeChip,
  DetailBreadcrumb,
  DetailSection,
  InfoRow,
  InlineEmpty,
  StatTile,
} from '@/components/shared/DetailPrimitives';

const ORDER_STEPS: { key: OrderStatus; title: string; description: string }[] = [
  {
    key: 'pending',
    title: 'Chờ thanh toán',
    description: 'Đơn hàng đã được tạo và đang chờ bạn hoàn tất thanh toán.',
  },
  {
    key: 'paid',
    title: 'Đã thanh toán',
    description: 'ReGive đã ghi nhận thanh toán cho đơn hàng.',
  },
  {
    key: 'processing',
    title: 'Đang chuẩn bị',
    description: 'Vật phẩm đang được kiểm tra và đóng gói.',
  },
  {
    key: 'shipped',
    title: 'Đang giao hàng',
    description: 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.',
  },
  {
    key: 'completed',
    title: 'Hoàn tất',
    description: 'Đơn hàng đã được giao thành công tới người nhận.',
  },
];

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  processing: 'Đang chuẩn bị',
  shipped: 'Đang giao hàng',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

const getStepIndex = (status: string): number => {
  if (status === 'cancelled') return -1;
  const index = ORDER_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
};

const getProductRef = (item: Order['items'][number]) =>
  item.product && typeof item.product === 'object' ? item.product : null;

export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await orderService.getById(id);
        if (!cancelled) setOrder(detail);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Không thể tải thông tin đơn hàng'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePayNow = async () => {
    if (!order) return;
    try {
      setPaying(true);

      let paymentId = '';
      let checkoutUrl: string | undefined;

      if (typeof order.payment === 'object' && order.payment) {
        paymentId = order.payment._id || '';
      } else {
        const created = await paymentService.create({ purpose: 'order', orderId: order._id });
        paymentId = created.id || created._id;
        checkoutUrl = created.checkoutUrl;
      }

      window.location.href = checkoutUrl || `/payments/${paymentId}/checkout`;
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể tạo phiên thanh toán cho đơn hàng'));
      setPaying(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setCancelling(true);
      await orderService.cancelOrder(order._id, cancelReason.trim() || undefined);
      // Backend trả về order chưa populate (items.product, buyer, payment) nên phải tải lại chi tiết.
      const refreshed = await orderService.getById(order._id);
      setOrder(refreshed);
      setCancelOpen(false);
      setCancelReason('');
      message.success('Đã hủy đơn hàng thành công');
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể hủy đơn hàng'));
    } finally {
      setCancelling(false);
    }
  };

  const buyer = order && typeof order.buyer === 'object' ? order.buyer : null;
  const payment = order && typeof order.payment === 'object' ? order.payment : null;
  const referenceCode = order ? order.orderCode : '';
  const itemCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const shippingFee = order ? Math.max(order.totalAmount - subtotal, 0) : 0;
  const canPay = order?.status === 'pending';
  const canCancel = order?.status === 'pending';
  const currentStep = order ? getStepIndex(order.status) : 0;

  const stepItems = useMemo(() => {
    const historyMap: Record<string, { at?: string; note?: string }> = {};
    order?.statusHistory?.forEach((entry) => {
      if (!historyMap[entry.status]) {
        historyMap[entry.status] = { at: entry.at, note: entry.note };
      }
    });

    return ORDER_STEPS.map((step) => {
      const history = historyMap[step.key];
      return {
        title: step.title,
        description: (
          <span className="text-xs leading-relaxed">
            {step.description}
            {history?.at && (
              <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                {formatDateTime(history.at)}
              </span>
            )}
          </span>
        ),
      };
    });
  }, [order]);

  const historyItems = useMemo<TimelineItem[]>(() => {
    if (!order?.statusHistory?.length) return [];
    return [...order.statusHistory]
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
      .map((entry) => ({
        phase: ORDER_STATUS_LABEL[entry.status] || entry.status,
        title: `Chuyển sang: ${ORDER_STATUS_LABEL[entry.status] || entry.status}`,
        description: entry.note || 'Hệ thống ghi nhận thay đổi trạng thái đơn hàng.',
        date: formatDateTime(entry.at),
        status: 'completed' as const,
      }));
  }, [order]);

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết đơn hàng" subtitle="Đang tải dữ liệu đơn hàng…">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout title="Chi tiết đơn hàng">
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <DetailBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đơn hàng của tôi', href: '/me/orders' },
              { label: 'Không tìm thấy' },
            ]}
          />
          <Alert
            type="error"
            showIcon
            message="Không thể hiển thị đơn hàng"
            description={error || 'Không tìm thấy dữ liệu đơn hàng.'}
            className="rounded-2xl"
          />
          <Link href="/me/orders">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Quay lại danh sách đơn hàng
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Chi tiết đơn hàng" subtitle={`Mã đơn ${referenceCode}`}>
      <DetailBreadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đơn hàng của tôi', href: '/me/orders' },
          { label: referenceCode },
        ]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-p-s900 to-p-s700 text-white shadow-xl shadow-p-s900/25">
        <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-p-s400/20 blur-2xl" />
        <div className="absolute -left-12 bottom-0 w-48 h-48 rounded-full bg-sec-s400/15 blur-2xl" />

        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-2.5 py-1">
                <ShoppingBag className="w-3.5 h-3.5" /> Đơn hàng Marketplace
              </span>
              <StatusBadge type="order" status={order.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words font-mono">
              {order.orderCode}
            </h1>

            <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
              {order.status === 'cancelled'
                ? 'Đơn hàng đã được hủy. Bạn có thể đặt lại vật phẩm khác trên Marketplace.'
                : `Đơn hàng gồm ${itemCount} vật phẩm, được giao tới ${order.shippingAddress || 'địa chỉ bạn đã cung cấp'}.`}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Đặt lúc {formatDateTime(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> {itemCount} vật phẩm
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5" /> {referenceCode}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Tổng thanh toán
              </p>
              <p className="text-3xl font-black mt-1 break-words">{formatVND(order.totalAmount)}</p>
              <p className="text-xs text-white/70 mt-1">
                {itemCount} vật phẩm · {order.currency || 'VND'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {canPay && (
                <Button
                  size="large"
                  loading={paying}
                  icon={<CreditCard className="w-4 h-4" />}
                  onClick={handlePayNow}
                  className="w-full h-11 rounded-xl bg-white text-p-s800 hover:bg-white border-white font-bold"
                >
                  {payment ? 'Tiếp tục thanh toán' : 'Thanh toán ngay'}
                </Button>
              )}
              <Link href="/marketplace" className="block">
                <Button
                  size="large"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  className="w-full h-11 rounded-xl bg-transparent !text-p-s800 !border-white/40 hover:!border-white font-bold"
                >
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed flex items-start gap-1.5">
              <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Đơn hàng được đóng gói và giao trong 2–3 ngày làm việc sau khi thanh toán.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIẾN ĐỘ ĐƠN HÀNG ── */}
      <DetailSection
        title="Tiến độ đơn hàng"
        subtitle="Các mốc xử lý đơn hàng được cập nhật liên tục"
        icon={<Truck className="w-4 h-4" />}
        extra={<StatusBadge type="order" status={order.status} />}
      >
        {order.status === 'cancelled' ? (
          <Alert
            type="error"
            showIcon
            message="Đơn hàng đã bị hủy"
            description={
              order.statusHistory?.find((entry) => entry.status === 'cancelled')?.note ||
              'Đơn hàng đã bị hủy theo yêu cầu của bạn hoặc do quá hạn thanh toán.'
            }
            className="rounded-xl"
          />
        ) : (
          <div className="pt-1 pb-2 overflow-x-auto">
            <Steps current={currentStep} items={stepItems} responsive className="min-w-[560px]" />
          </div>
        )}
      </DetailSection>

      {/* ── SỐ LIỆU NHANH ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Trạng thái"
          value={ORDER_STATUS_LABEL[order.status] || order.status}
          hint={
            order.status === 'cancelled'
              ? 'Đơn hàng không còn hiệu lực'
              : 'Cập nhật theo thời gian thực'
          }
          icon={<BadgeCheck className="w-4 h-4" />}
          tone={
            order.status === 'cancelled'
              ? 'rose'
              : order.status === 'completed'
                ? 'green'
                : 'amber'
          }
        />
        <StatTile
          label="Tổng thanh toán"
          value={formatVND(order.totalAmount)}
          hint={`Tạm tính: ${formatVND(subtotal)}`}
          icon={<Wallet className="w-4 h-4" />}
          tone="primary"
        />
        <StatTile
          label="Số lượng"
          value={`${itemCount} vật phẩm`}
          hint={`${order.items.length} dòng sản phẩm`}
          icon={<Package className="w-4 h-4" />}
          tone="sky"
        />
        <StatTile
          label="Ngày đặt"
          value={formatDateTime(order.createdAt)}
          hint={`Cập nhật: ${formatDateTime(order.updatedAt)}`}
          icon={<Calendar className="w-4 h-4" />}
          tone="slate"
        />
      </div>

      {/* ── NỘI DUNG CHI TIẾT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection
            title="Vật phẩm trong đơn"
            subtitle={`${order.items.length} dòng sản phẩm · ${itemCount} vật phẩm`}
            icon={<Package className="w-4 h-4" />}
            extra={
              <span className="text-[11px] font-bold text-p-s700 bg-p-s50 border border-p-s200 rounded-full px-2.5 py-1">
                {formatVND(order.totalAmount)}
              </span>
            }
          >
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const product = getProductRef(item);
                const productId = product?._id;
                const image = product?.images?.[0];

                return (
                  <div
                    key={`${item.name}-${index}`}
                    className="rounded-2xl border border-gray-100 bg-gray-50/40 p-3 sm:p-4 flex gap-3 sm:gap-4"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                      {image ? (
                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-7 h-7" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 leading-snug break-words">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {product?.status && (
                              <StatusBadge type="product" status={product.status} />
                            )}
                            {productId && (
                              <Link
                                href={`/marketplace/${productId}`}
                                className="text-[11px] font-bold text-p-s700 hover:underline inline-flex items-center gap-1"
                              >
                                Xem sản phẩm
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-p-s700">
                            {formatVND(item.price * item.quantity)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {formatVND(item.price)} / vật phẩm
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-dashed border-gray-200">
                        <span>Đơn giá × số lượng</span>
                        <span className="font-semibold text-gray-700">
                          {formatVND(item.price)} × {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DetailSection>

          <DetailSection
            title="Tổng kết thanh toán"
            subtitle="Chi tiết các khoản cấu thành nên tổng tiền đơn hàng"
            icon={<Receipt className="w-4 h-4" />}
          >
            <InfoRow label="Tạm tính" value={formatVND(subtotal)} />
            <InfoRow
              label="Phí vận chuyển"
              value={shippingFee > 0 ? formatVND(shippingFee) : 'Miễn phí'}
              hint={
                shippingFee > 0
                  ? 'Phí vận chuyển được tính theo địa chỉ giao hàng.'
                  : 'ReGive hỗ trợ miễn phí vận chuyển cho đơn hàng này.'
              }
            />
            <InfoRow label="Giảm giá" value="—" />
            <InfoRow label="Đơn vị tiền tệ" value={order.currency || 'VND'} />

            <div className="mt-4 rounded-2xl bg-p-s50/60 border border-p-s100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-p-s700">
                  Tổng thanh toán
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Đã bao gồm toàn bộ các khoản phí hiển thị ở trên
                </p>
              </div>
              <p className="text-2xl font-black text-p-s800">{formatVND(order.totalAmount)}</p>
            </div>
          </DetailSection>

          <DetailSection
            title="Thông tin giao hàng"
            subtitle="Người nhận và địa chỉ bạn đã cung cấp khi đặt hàng"
            icon={<MapPin className="w-4 h-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <UserRound className="w-3.5 h-3.5" /> Người nhận
                </div>
                <p className="text-sm font-bold text-gray-900 mt-2">{buyer?.fullName || '—'}</p>
                {buyer?.email && (
                  <p className="text-xs text-gray-500 mt-0.5 break-all">{buyer.email}</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" /> Số điện thoại
                </div>
                <p className="text-sm font-bold text-gray-900 mt-2 font-mono">
                  {order.phone || buyer?.phone || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Dùng để liên hệ khi giao hàng</p>
              </div>
            </div>

            <div className="mt-4">
              <InfoRow label="Địa chỉ giao hàng">
                <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm text-gray-700 leading-relaxed">
                  {order.shippingAddress || 'Chưa cung cấp'}
                </span>
              </InfoRow>
              <InfoRow label="Ghi chú giao hàng">{order.note || '—'}</InfoRow>
              <InfoRow label="Ngày đặt hàng" value={formatDateTime(order.createdAt)} />
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-3.5 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              Vui lòng kiểm tra kỹ thông tin nhận hàng. Nếu cần thay đổi, hãy liên hệ ban điều phối
              trước khi đơn hàng được bàn giao cho đơn vị vận chuyển.
            </div>
          </DetailSection>

          <DetailSection
            title="Thanh toán đơn hàng"
            subtitle="Giao dịch thanh toán gắn với đơn hàng này"
            icon={<CreditCard className="w-4 h-4" />}
            tone="info"
            extra={payment ? <StatusBadge type="payment" status={payment.status} /> : undefined}
          >
            {payment ? (
              <div className="space-y-4">
                <div>
                  <InfoRow label="Mã thanh toán" mono>
                    {payment.paymentCode ? (
                      <CodeChip value={payment.paymentCode} label="mã thanh toán" />
                    ) : (
                      '—'
                    )}
                  </InfoRow>
                  <InfoRow
                    label="Số tiền"
                    value={
                      <span className="text-base font-black text-p-s700">
                        {formatVND(payment.amount || order.totalAmount)}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Trạng thái"
                    value={<StatusBadge type="payment" status={payment.status} />}
                  />
                  <InfoRow label="Cổng thanh toán" value={payment.provider || 'Sandbox nội bộ'} />
                  <InfoRow
                    label="Thời điểm thanh toán"
                    value={payment.paidAt ? formatDateTime(payment.paidAt) : 'Chưa thanh toán'}
                  />
                </div>

                {payment.status === 'pending' && (
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={paying}
                    onClick={handlePayNow}
                    icon={<CreditCard className="w-4 h-4" />}
                    className="rounded-xl"
                  >
                    Tiếp tục thanh toán
                  </Button>
                )}

                {payment.status === 'success' && (
                  <Alert
                    type="success"
                    showIcon
                    message="Đơn hàng đã được thanh toán"
                    description="ReGive đã ghi nhận thanh toán và sẽ chuẩn bị hàng cho bạn."
                    className="rounded-xl"
                  />
                )}

                {payment.status === 'failed' && (
                  <Alert
                    type="error"
                    showIcon
                    message="Thanh toán thất bại"
                    description="Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
                    className="rounded-xl"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <InlineEmpty
                  icon={<CreditCard className="w-5 h-5" />}
                  title="Chưa có phiên thanh toán"
                  description={
                    canPay
                      ? 'Đơn hàng đang chờ thanh toán. Hãy tạo phiên thanh toán để ReGive chuẩn bị hàng.'
                      : 'Đơn hàng này không có giao dịch thanh toán trực tuyến.'
                  }
                />
                {canPay && (
                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={paying}
                    onClick={handlePayNow}
                    icon={<CreditCard className="w-4 h-4" />}
                    className="rounded-xl"
                  >
                    Tạo phiên thanh toán
                  </Button>
                )}
              </div>
            )}
          </DetailSection>

          <DetailSection
            title="Nhật ký trạng thái"
            subtitle="Lịch sử cập nhật đơn hàng do hệ thống ghi nhận"
            icon={<Clock className="w-4 h-4" />}
          >
            {historyItems.length > 0 ? (
              <Timeline items={historyItems} />
            ) : (
              <InlineEmpty
                icon={<Clock className="w-5 h-5" />}
                title="Chưa có nhật ký trạng thái"
                description="Đơn hàng mới được tạo và chưa có thay đổi trạng thái nào."
              />
            )}
          </DetailSection>
        </div>

        {/* ── CỘT PHẢI: TÓM TẮT / THAO TÁC / HỖ TRỢ ── */}
        <div className="space-y-6">
          <DetailSection
            title="Tóm tắt đơn hàng"
            subtitle="Thông tin nhanh về đơn hàng của bạn"
            icon={<Receipt className="w-4 h-4" />}
          >
            <div className="rounded-2xl bg-gradient-to-br from-p-s700 to-p-s500 text-white p-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-white/70">
                Tổng thanh toán
              </p>
              <p className="text-2xl font-black mt-1">{formatVND(order.totalAmount)}</p>
              <p className="text-[11px] text-white/70 mt-1">
                {itemCount} vật phẩm · {order.currency || 'VND'}
              </p>
            </div>

            <div className="mt-3">
              <InfoRow label="Mã đơn hàng" mono>
                <CodeChip value={order.orderCode} label="mã đơn hàng" />
              </InfoRow>
              <InfoRow
                label="Trạng thái"
                value={<StatusBadge type="order" status={order.status} />}
              />
              <InfoRow label="Ngày đặt" value={formatDateTime(order.createdAt)} />
              <InfoRow label="Cập nhật gần nhất" value={formatDateTime(order.updatedAt)} />
              <InfoRow label="Số dòng sản phẩm" value={order.items.length} />
            </div>
          </DetailSection>

          <DetailSection
            title="Thao tác"
            subtitle="Các hành động khả dụng cho đơn hàng"
            icon={<FileText className="w-4 h-4" />}
          >
            <div className="space-y-2">
              {canPay && (
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={paying}
                  onClick={handlePayNow}
                  icon={<CreditCard className="w-4 h-4" />}
                  className="rounded-xl"
                >
                  {payment ? 'Tiếp tục thanh toán' : 'Thanh toán đơn hàng'}
                </Button>
              )}

              {canCancel && (
                <Button
                  danger
                  block
                  size="large"
                  onClick={() => setCancelOpen(true)}
                  icon={<XCircle className="w-4 h-4" />}
                  className="rounded-xl"
                >
                  Hủy đơn hàng
                </Button>
              )}

              <Link href="/marketplace" className="block">
                <Button block icon={<ShoppingBag className="w-4 h-4" />} className="rounded-xl">
                  Tiếp tục mua sắm
                </Button>
              </Link>

              <Link href="/me/orders" className="block">
                <Button block icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
                  Danh sách đơn hàng
                </Button>
              </Link>
            </div>

            {!canPay && !canCancel && (
              <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                Đơn hàng ở trạng thái hiện tại không thể thanh toán hoặc hủy trực tuyến. Vui lòng
                liên hệ ban điều phối nếu cần hỗ trợ thêm.
              </p>
            )}
          </DetailSection>

          <DetailSection
            title="Cần hỗ trợ?"
            subtitle="ReGive đồng hành cùng bạn trong suốt đơn hàng"
            icon={<Info className="w-4 h-4" />}
          >
            <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Kiểm tra tình trạng vật phẩm ngay khi nhận hàng và phản hồi cho ban điều phối.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Đơn hàng quá 7 ngày chưa cập nhật, hãy gửi yêu cầu hỗ trợ kèm mã đơn.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                Không chuyển khoản ngoài cổng thanh toán chính thức của ReGive.
              </li>
            </ul>

            <div className="pt-4 space-y-2">
              <Link href="/support/new" className="block">
                <Button block icon={<Info className="w-4 h-4" />} className="rounded-xl">
                  Gửi yêu cầu hỗ trợ
                </Button>
              </Link>
              <Link href="/faq" className="block">
                <Button block icon={<FileText className="w-4 h-4" />} className="rounded-xl">
                  Câu hỏi thường gặp
                </Button>
              </Link>
            </div>
          </DetailSection>
        </div>
      </div>

      {/* ── THANH ĐIỀU HƯỚNG CUỐI TRANG ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
          <Hash className="w-3.5 h-3.5 text-gray-400" />
          Mã đơn:
          <span className="font-mono font-bold text-gray-800">{order.orderCode}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/me/orders">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Về danh sách đơn
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button
              type="primary"
              icon={<ShoppingBag className="w-4 h-4" />}
              className="rounded-xl"
            >
              Mua sắm tiếp
            </Button>
          </Link>
        </div>
      </div>

      {/* ── MODAL HỦY ĐƠN ── */}
      <Modal
        title="Xác nhận hủy đơn hàng"
        open={cancelOpen}
        onCancel={() => {
          if (cancelling) return;
          setCancelOpen(false);
          setCancelReason('');
        }}
        onOk={handleCancelOrder}
        confirmLoading={cancelling}
        okText="Xác nhận hủy"
        cancelText="Giữ đơn hàng"
        okButtonProps={{ danger: true, className: 'rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl' }}
        destroyOnHidden
      >
        <div className="py-2 space-y-4 text-sm text-gray-600">
          <Alert
            type="warning"
            showIcon
            message="Đơn hàng sẽ bị hủy ngay lập tức"
            description="Sau khi hủy, bạn không thể khôi phục đơn hàng này. Vật phẩm sẽ được trả lại Marketplace nếu còn hàng."
            className="rounded-xl"
          />

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1 text-xs">
            <p>
              <span className="text-gray-500">Mã đơn: </span>
              <span className="font-mono font-bold text-gray-900">{order.orderCode}</span>
            </p>
            <p>
              <span className="text-gray-500">Tổng tiền: </span>
              <span className="font-bold text-p-s700">{formatVND(order.totalAmount)}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700" htmlFor="cancel-reason">
              Lý do hủy (không bắt buộc)
            </label>
            <Input.TextArea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              maxLength={200}
              showCount
              placeholder="Ví dụ: Tôi muốn thay đổi địa chỉ nhận hàng…"
              className="!rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
