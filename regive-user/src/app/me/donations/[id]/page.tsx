'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Image as AntImage, Tag, message } from 'antd';
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
  Heart,
  Image as ImageIcon,
  Info,
  MapPin,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import { donationService } from '@/services/donationService';
import { paymentService } from '@/services/paymentService';
import { Donation, Payment } from '@/types';
import { formatDate, formatDateTime, formatVND } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
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

type DonationCampaignRef = {
  _id?: string;
  title?: string;
  status?: string;
  location?: string;
  bannerImage?: string;
  targetAmount?: number;
  raisedAmount?: number;
};

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Quần áo & Thời trang',
  books_stationery: 'Sách & Văn phòng phẩm',
  electronics: 'Điện tử & Gia dụng',
  toys: 'Đồ chơi & Giáo dục',
  essentials: 'Nhu yếu phẩm',
  other: 'Khác',
};

const DONATION_STATUS_HINT: Record<string, string> = {
  pending: 'Đang chờ ban điều phối xác nhận yêu cầu.',
  confirmed: 'Đã xác nhận, đang chờ thanh toán hoặc xử lý tiếp.',
  processing: 'Đang được kiểm định và tiếp nhận.',
  completed: 'Đã hoàn tất và ghi nhận vào chiến dịch.',
  rejected: 'Yêu cầu không được tiếp nhận.',
};

const getPaymentRefId = (payment: Payment): string | null => {
  const ref = payment.donation;
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return ref._id || null;
};

export default function DonationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [donation, setDonation] = useState<Donation | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await donationService.getById(id);
        if (cancelled) return;
        setDonation(detail);

        try {
          const payments = await paymentService.getMyPayments();
          if (cancelled) return;
          setPayment(payments.find((item) => getPaymentRefId(item) === detail._id) || null);
        } catch {
          if (!cancelled) setPayment(null);
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Không thể tải thông tin quyên góp'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePayNow = async () => {
    if (!donation) return;
    try {
      setPaying(true);
      const session =
        payment ||
        (await paymentService.create({ purpose: 'donation', donationId: donation._id }));
      const paymentId = session.id || session._id;
      window.location.href = session.checkoutUrl || `/payments/${paymentId}/checkout`;
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể tạo phiên thanh toán'));
      setPaying(false);
    }
  };

  const campaignRef = donation?.campaign;
  const campaign =
    campaignRef && typeof campaignRef === 'object' ? (campaignRef as DonationCampaignRef) : null;

  const isProduct = donation?.type === 'product';
  const productInfo = donation?.productInfo;
  const images = (productInfo?.images || []).filter(Boolean);
  const referenceCode = donation ? donation._id.slice(-8).toUpperCase() : '';
  const displayValue = isProduct ? productInfo?.estimatedValue || 0 : donation?.amount || 0;
  const isMoneyPending = !isProduct && donation?.status === 'pending';
  const paymentId = payment ? payment.id || payment._id : null;
  const processedBy =
    donation && donation.processedBy && typeof donation.processedBy === 'object'
      ? donation.processedBy
      : null;

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!donation) return [];
    const rank: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      completed: 3,
    };
    const current = donation.status === 'rejected' ? -1 : rank[donation.status] ?? 0;
    const product = donation.type === 'product';

    if (donation.status === 'rejected') {
      return [
        {
          phase: 'Bước 1',
          title: 'Đã gửi yêu cầu quyên góp',
          description: 'Hệ thống đã ghi nhận thông tin bạn cung cấp.',
          date: formatDateTime(donation.createdAt),
          status: 'completed',
        },
        {
          phase: 'Kết thúc',
          title: 'Yêu cầu không được tiếp nhận',
          description:
            'Ban điều phối đã từ chối yêu cầu này. Vui lòng liên hệ ban điều phối của chiến dịch để biết thêm chi tiết.',
          date: formatDateTime(donation.processedAt || donation.updatedAt),
          status: 'completed',
        },
      ];
    }

    return [
      {
        phase: 'Bước 1',
        title: 'Gửi yêu cầu quyên góp',
        description: product
          ? 'Thông tin hiện vật bạn trao tặng đã được ghi nhận.'
          : 'Khoản ủng hộ tiền mặt đã được ghi nhận trên hệ thống.',
        date: formatDateTime(donation.createdAt),
        status: 'completed',
      },
      {
        phase: 'Bước 2',
        title: product ? 'Chờ tiếp nhận hiện vật' : 'Chờ xác nhận khoản ủng hộ',
        description: product
          ? 'Ban tiếp nhận sẽ liên hệ hẹn thu gom và kiểm tra tình trạng hiện vật.'
          : 'Ban điều phối đối soát thông tin trước khi ghi nhận khoản ủng hộ.',
        date: current >= 1 ? formatDateTime(donation.updatedAt) : undefined,
        status: current >= 1 ? 'completed' : 'in_progress',
      },
      {
        phase: 'Bước 3',
        title: product ? 'Kiểm định & nhập kho' : 'Thanh toán & đối soát',
        description: product
          ? 'Hiện vật được phân loại, đánh giá chất lượng và đưa vào kho ReGive.'
          : 'Khoản ủng hộ được xác nhận qua cổng thanh toán của ReGive.',
        date: current >= 2 ? formatDateTime(donation.processedAt || donation.updatedAt) : undefined,
        status: current >= 2 ? 'completed' : current === 1 ? 'in_progress' : 'upcoming',
      },
      {
        phase: 'Hoàn tất',
        title: 'Hoàn tất quyên góp',
        description: 'Khoản quyên góp được ghi nhận vào chiến dịch và sổ minh bạch của ReGive.',
        date: donation.processedAt ? formatDateTime(donation.processedAt) : undefined,
        status: current >= 3 ? 'completed' : 'upcoming',
      },
    ];
  }, [donation]);

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết quyên góp" subtitle="Đang tải dữ liệu quyên góp…">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !donation) {
    return (
      <DashboardLayout title="Chi tiết quyên góp">
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <DetailBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Lịch sử quyên góp', href: '/me/donations' },
              { label: 'Không tìm thấy' },
            ]}
          />
          <Alert
            type="error"
            showIcon
            message="Không thể hiển thị quyên góp"
            description={error || 'Không tìm thấy dữ liệu quyên góp.'}
            className="rounded-2xl"
          />
          <Link href="/me/donations">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Quay lại lịch sử quyên góp
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Chi tiết quyên góp" subtitle={`Mã tham chiếu #${referenceCode}`}>
      <DetailBreadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Lịch sử quyên góp', href: '/me/donations' },
          { label: `#${referenceCode}` },
        ]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-p-s800 via-p-s700 to-p-s500 text-white shadow-xl shadow-p-s800/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 rounded-full bg-sec-s400/20 blur-2xl" />

        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-2.5 py-1">
                {isProduct ? <Package className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                {isProduct ? 'Quyên góp hiện vật' : 'Quyên góp tiền mặt'}
              </span>
              {donation.isAnonymous && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-2.5 py-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ẩn danh
                </span>
              )}
              <StatusBadge type="donation" status={donation.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words">
              {isProduct ? productInfo?.name || 'Hiện vật quyên góp' : 'Khoản ủng hộ chiến dịch'}
            </h1>

            <p className="text-sm text-white/80 leading-relaxed max-w-2xl whitespace-pre-line">
              {isProduct
                ? productInfo?.description || 'Cảm ơn bạn đã trao gửi hiện vật cho chiến dịch.'
                : donation.note || 'Cảm ơn bạn đã chung tay cùng chiến dịch.'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {formatDateTime(donation.createdAt)}
              </span>
              {campaign?.title && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[220px]">{campaign.title}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Hash className="w-3.5 h-3.5" /> {referenceCode}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                {isProduct ? 'Giá trị ước tính' : 'Số tiền quyên góp'}
              </p>
              <p className="text-3xl font-black mt-1 break-words">{formatVND(displayValue)}</p>
              {isProduct && (
                <p className="text-xs text-white/70 mt-1">
                  Số lượng: {productInfo?.quantity || 1} ·{' '}
                  {PRODUCT_CATEGORY_LABELS[productInfo?.category || ''] || 'Chưa phân loại'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {isMoneyPending && (
                <Button
                  size="large"
                  loading={paying}
                  icon={<CreditCard className="w-4 h-4" />}
                  onClick={handlePayNow}
                  className="w-full h-11 rounded-xl bg-white text-p-s800 hover:bg-white border-white font-bold"
                >
                  {paymentId ? 'Tiếp tục thanh toán' : 'Thanh toán ngay'}
                </Button>
              )}
              {campaign?._id && (
                <Link href={`/campaigns/${campaign._id}`} className="block">
                  <Button
                    size="large"
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl bg-transparent !text-p-s800 !border-white/40 hover:!border-white font-bold"
                  >
                    Xem chiến dịch
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Mọi khoản quyên góp đều được ghi nhận vào sổ minh bạch của ReGive.
            </p>
          </div>
        </div>
      </section>

      {/* ── SỐ LIỆU NHANH ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Trạng thái"
          value={<StatusBadge type="donation" status={donation.status} />}
          hint={DONATION_STATUS_HINT[donation.status]}
          icon={<BadgeCheck className="w-4 h-4" />}
          tone={
            donation.status === 'rejected'
              ? 'rose'
              : donation.status === 'completed'
                ? 'green'
                : 'amber'
          }
        />
        <StatTile
          label="Hình thức"
          value={isProduct ? 'Hiện vật' : 'Tiền mặt'}
          hint={isProduct ? `${productInfo?.quantity || 1} vật phẩm` : 'Chuyển khoản / cổng thanh toán'}
          icon={isProduct ? <Package className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
          tone="sky"
        />
        <StatTile
          label={isProduct ? 'Giá trị ước tính' : 'Giá trị ghi nhận'}
          value={formatVND(displayValue)}
          hint={isProduct ? 'Do bạn cung cấp khi gửi hiện vật' : 'Số tiền bạn đã nhập'}
          icon={<Receipt className="w-4 h-4" />}
          tone="primary"
        />
        <StatTile
          label="Ngày gửi"
          value={formatDate(donation.createdAt)}
          hint={`Cập nhật: ${formatDateTime(donation.updatedAt)}`}
          icon={<Calendar className="w-4 h-4" />}
          tone="slate"
        />
      </div>

      {/* ── NỘI DUNG CHI TIẾT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection
            title="Thông tin quyên góp"
            subtitle="Toàn bộ dữ liệu hệ thống ghi nhận cho giao dịch này"
            icon={<FileText className="w-4 h-4" />}
            extra={<StatusBadge type="donation" status={donation.status} />}
          >
            <InfoRow label="Mã quyên góp" mono>
              <CodeChip value={donation._id} label="mã quyên góp" />
            </InfoRow>
            <InfoRow label="Hình thức">
              <Tag color={isProduct ? 'cyan' : 'blue'} className="font-semibold">
                {isProduct ? 'Quyên góp hiện vật' : 'Quyên góp tiền mặt'}
              </Tag>
            </InfoRow>
            <InfoRow label={isProduct ? 'Tên vật phẩm' : 'Số tiền'}>
              {isProduct ? (
                productInfo?.name || '—'
              ) : (
                <span className="text-base font-black text-p-s700">
                  {formatVND(donation.amount)}
                </span>
              )}
            </InfoRow>
            <InfoRow
              label="Trạng thái"
              hint={DONATION_STATUS_HINT[donation.status]}
              value={<StatusBadge type="donation" status={donation.status} />}
            />
            <InfoRow
              label="Hiển thị tên"
              value={donation.isAnonymous ? 'Ẩn danh' : 'Công khai'}
              hint={
                donation.isAnonymous
                  ? 'Tên của bạn được hiển thị là Nhà hảo tâm ẩn danh trên bảng đóng góp.'
                  : 'Tên của bạn được hiển thị công khai trên bảng đóng góp của chiến dịch.'
              }
            />
            <InfoRow label="Chiến dịch" value={campaign?.title || 'Không xác định'} />
            <InfoRow label="Ngày gửi" value={formatDateTime(donation.createdAt)} />
            <InfoRow label="Cập nhật gần nhất" value={formatDateTime(donation.updatedAt)} />
            <InfoRow label="Ghi chú của bạn">
              {donation.note ? (
                <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm italic text-gray-700 leading-relaxed whitespace-pre-line">
                  “{donation.note}”
                </span>
              ) : (
                '—'
              )}
            </InfoRow>
          </DetailSection>

          {isProduct && (
            <DetailSection
              title="Chi tiết hiện vật trao tặng"
              subtitle="Thông tin bạn đã cung cấp khi gửi hiện vật"
              icon={<Package className="w-4 h-4" />}
              extra={
                <span className="text-[11px] font-bold text-sec-s700 bg-sec-s50 border border-sec-s200 rounded-full px-2.5 py-1">
                  {productInfo?.quantity || 1} vật phẩm
                </span>
              }
            >
              {images.length > 0 ? (
                <AntImage.PreviewGroup>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {images.map((src, index) => (
                      <AntImage
                        key={`${src}-${index}`}
                        src={src}
                        alt={`Ảnh vật phẩm ${index + 1}`}
                        width="100%"
                        height={140}
                        style={{ objectFit: 'cover', borderRadius: 14 }}
                      />
                    ))}
                  </div>
                </AntImage.PreviewGroup>
              ) : (
                <div className="mb-5">
                  <InlineEmpty
                    icon={<ImageIcon className="w-5 h-5" />}
                    title="Chưa có ảnh đính kèm"
                    description="Bạn chưa tải lên ảnh thực tế của vật phẩm. Nhân viên tiếp nhận sẽ kiểm tra trực tiếp khi thu gom."
                  />
                </div>
              )}

              <InfoRow label="Tên vật phẩm" value={productInfo?.name || '—'} />
              <InfoRow label="Số lượng" value={productInfo?.quantity || 1} />
              <InfoRow
                label="Danh mục"
                value={PRODUCT_CATEGORY_LABELS[productInfo?.category || ''] || 'Chưa phân loại'}
              />
              <InfoRow
                label="Giá trị ước tính"
                value={
                  <span className="text-base font-black text-sec-s700">
                    {formatVND(productInfo?.estimatedValue || 0)}
                  </span>
                }
                hint="Giá trị do bạn tự ước tính, ban tiếp nhận sẽ kiểm định lại."
              />
              <InfoRow label="Tình trạng" value={productInfo?.conditionNote || 'Chưa ghi rõ'} />
              <InfoRow label="Mô tả chi tiết">
                {productInfo?.description ? (
                  <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {productInfo.description}
                  </span>
                ) : (
                  '—'
                )}
              </InfoRow>
            </DetailSection>
          )}

          <DetailSection
            title="Chiến dịch nhận quyên góp"
            subtitle="Khoản quyên góp của bạn được ghi nhận trực tiếp vào chiến dịch này"
            icon={<Heart className="w-4 h-4" />}
            extra={
              campaign?._id ? (
                <Link href={`/campaigns/${campaign._id}`}>
                  <Button
                    size="small"
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                    className="rounded-lg text-xs"
                  >
                    Mở chiến dịch
                  </Button>
                </Link>
              ) : undefined
            }
          >
            {campaign ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    {campaign.bannerImage ? (
                      <img
                        src={campaign.bannerImage}
                        alt={campaign.title || 'Ảnh chiến dịch'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Heart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge type="campaign" status={campaign.status} />
                      {campaign._id && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          #{campaign._id.slice(-6)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-gray-900 leading-snug">
                      {campaign.title}
                    </h3>
                    {campaign.location && (
                      <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {campaign.location}
                      </p>
                    )}
                  </div>
                </div>

                {typeof campaign.targetAmount === 'number' && campaign.targetAmount > 0 ? (
                  <div className="rounded-2xl border border-p-s100 bg-p-s50/40 p-4">
                    <ProgressBar
                      current={campaign.raisedAmount || 0}
                      target={campaign.targetAmount}
                      currentLabel="Đã gây quỹ"
                      targetLabel={`Mục tiêu: ${formatVND(campaign.targetAmount)}`}
                      suffix={
                        <span className="text-[11px] text-gray-500 font-semibold">
                          Đóng góp của bạn đã được cộng vào tiến độ
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 text-xs text-gray-500 flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    Chiến dịch chưa công bố mục tiêu gây quỹ chi tiết.
                  </div>
                )}
              </div>
            ) : (
              <InlineEmpty
                icon={<Heart className="w-5 h-5" />}
                title="Không tìm thấy thông tin chiến dịch"
                description="Chiến dịch có thể đã bị ẩn hoặc dữ liệu chưa được đồng bộ."
              />
            )}
          </DetailSection>

          <DetailSection
            title="Thanh toán & đối soát"
            subtitle="Trạng thái giao dịch thanh toán gắn với khoản quyên góp"
            icon={<CreditCard className="w-4 h-4" />}
            tone="info"
            extra={payment ? <StatusBadge type="payment" status={payment.status} /> : undefined}
          >
            {isProduct ? (
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">Quyên góp hiện vật không cần thanh toán trực tuyến</p>
                  <p className="text-xs leading-relaxed text-sky-800">
                    Ban tiếp nhận ReGive sẽ liên hệ theo thông tin bạn cung cấp để hẹn thu gom,
                    kiểm định và nhập kho hiện vật.
                  </p>
                </div>
              </div>
            ) : payment ? (
              <div className="space-y-4">
                <div>
                  <InfoRow label="Mã thanh toán" mono>
                    <CodeChip value={payment.paymentCode} label="mã thanh toán" />
                  </InfoRow>
                  <InfoRow
                    label="Số tiền"
                    value={
                      <span className="text-base font-black text-p-s700">
                        {formatVND(payment.amount)}
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
                  <InfoRow label="Ngày tạo phiên" value={formatDateTime(payment.createdAt)} />
                </div>

                {payment.status === 'pending' && paymentId && (
                  <Link href={`/payments/${paymentId}/checkout`} className="block">
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<CreditCard className="w-4 h-4" />}
                      className="rounded-xl"
                    >
                      Tiếp tục thanh toán
                    </Button>
                  </Link>
                )}

                {payment.status === 'success' && (
                  <Alert
                    type="success"
                    showIcon
                    message="Đã thanh toán thành công"
                    description="Khoản ủng hộ đã được ghi nhận vào chiến dịch."
                    className="rounded-xl"
                  />
                )}

                {payment.status === 'failed' && (
                  <Alert
                    type="error"
                    showIcon
                    message="Giao dịch thanh toán thất bại"
                    description="Vui lòng thử tạo phiên thanh toán mới hoặc liên hệ ban điều phối để được hỗ trợ."
                    className="rounded-xl"
                  />
                )}

                {payment.status === 'cancelled' && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Phiên thanh toán đã bị hủy"
                    description="Bạn có thể tạo phiên thanh toán mới cho khoản quyên góp này."
                    className="rounded-xl"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <InlineEmpty
                  icon={<CreditCard className="w-5 h-5" />}
                  title="Chưa có phiên thanh toán"
                  description="Khoản ủng hộ tiền mặt cần được thanh toán để chuyển sang trạng thái hoàn tất."
                />
                {isMoneyPending && (
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
        </div>

        {/* ── CỘT PHẢI: TIẾN TRÌNH / NGƯỜI XỬ LÝ / HỖ TRỢ ── */}
        <div className="space-y-6">
          <DetailSection
            title="Tiến trình xử lý"
            subtitle="Các mốc trạng thái của khoản quyên góp"
            icon={<Clock className="w-4 h-4" />}
          >
            <Timeline items={timelineItems} />
          </DetailSection>

          <DetailSection
            title="Người xử lý"
            subtitle="Nhân sự ReGive phụ trách khoản quyên góp này"
            icon={<UserRound className="w-4 h-4" />}
          >
            {processedBy ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-p-s50/60 border border-p-s100 p-4">
                  <div className="w-11 h-11 rounded-full bg-white border border-p-s200 text-p-s700 font-black flex items-center justify-center shrink-0">
                    {(processedBy.fullName || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {processedBy.fullName || 'Nhân viên ReGive'}
                    </p>
                    {processedBy.email && (
                      <p className="text-[11px] text-gray-500 truncate">{processedBy.email}</p>
                    )}
                  </div>
                </div>
                <InfoRow
                  label="Thời điểm xử lý"
                  value={donation.processedAt ? formatDateTime(donation.processedAt) : 'Chưa xử lý'}
                />
                <InfoRow
                  label="Trạng thái hiện tại"
                  value={<StatusBadge type="donation" status={donation.status} />}
                />
              </div>
            ) : (
              <InlineEmpty
                icon={<UserRound className="w-5 h-5" />}
                title="Chưa có người xử lý"
                description="Khoản quyên góp đang chờ ban điều phối tiếp nhận và cập nhật trạng thái."
              />
            )}
          </DetailSection>

          <DetailSection
            title="Cần hỗ trợ?"
            subtitle="ReGive luôn sẵn sàng đồng hành cùng bạn"
            icon={<Sparkles className="w-4 h-4" />}
          >
            <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Mọi khoản quyên góp đều được đối soát và ghi nhận trên sổ minh bạch.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Nếu trạng thái chưa cập nhật sau 24 giờ, hãy gửi yêu cầu hỗ trợ kèm mã tham chiếu.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                Không chia sẻ mã giao dịch hoặc thông tin thanh toán cho người lạ.
              </li>
            </ul>

            <div className="pt-4 space-y-2">
              <Link href="/support/new" className="block">
                <Button block icon={<Heart className="w-4 h-4" />} className="rounded-xl">
                  Gửi yêu cầu hỗ trợ
                </Button>
              </Link>
              <Link href="/faq" className="block">
                <Button block icon={<Info className="w-4 h-4" />} className="rounded-xl">
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
          Mã tham chiếu:
          <span className="font-mono font-bold text-gray-800">#{referenceCode}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/me/donations">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Về danh sách quyên góp
            </Button>
          </Link>
          {campaign?._id && (
            <Link href={`/campaigns/${campaign._id}`}>
              <Button
                type="primary"
                icon={<ExternalLink className="w-4 h-4" />}
                className="rounded-xl"
              >
                Xem chiến dịch
              </Button>
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

