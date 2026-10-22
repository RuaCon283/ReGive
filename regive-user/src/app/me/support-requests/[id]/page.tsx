'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Modal, Steps, message } from 'antd';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HandHeart,
  Hash,
  Info,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { SupportRequest } from '@/types';
import { formatDateTime } from '@/lib/format';
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

const URGENCY_CONFIG: Record<
  string,
  { label: string; className: string; description: string; tone: 'rose' | 'amber' | 'slate' }
> = {
  high: {
    label: 'Cấp thiết cao',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Cần được ưu tiên xử lý trong thời gian ngắn nhất.',
    tone: 'rose',
  },
  medium: {
    label: 'Trung bình',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Cần hỗ trợ trong thời gian sớm nhưng chưa khẩn cấp.',
    tone: 'amber',
  },
  low: {
    label: 'Thấp',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Có thể xử lý theo kế hoạch của ban điều phối.',
    tone: 'slate',
  },
};

const SUPPORT_STEPS = [
  { title: 'Gửi yêu cầu', description: 'Yêu cầu được ghi nhận trên hệ thống ReGive.' },
  { title: 'Thẩm định hồ sơ', description: 'Ban điều phối kiểm tra hoàn cảnh và nhu cầu.' },
  { title: 'Đang hỗ trợ', description: 'Nguồn lực được điều phối tới người thụ hưởng.' },
  { title: 'Hoàn tất', description: 'Người thụ hưởng xác nhận đã nhận hỗ trợ.' },
];

export default function SupportRequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await supportService.getById(id);
        if (!cancelled) setRequest(detail);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Không thể tải yêu cầu hỗ trợ'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleConfirmReceived = async () => {
    if (!request) return;
    try {
      setConfirming(true);
      await supportService.confirmReceived(request._id);
      // Backend trả về hồ sơ chưa populate (beneficiary, campaign, handledBy) nên phải tải lại chi tiết.
      const refreshed = await supportService.getById(request._id);
      setRequest(refreshed);
      setConfirmOpen(false);
      message.success('Đã xác nhận nhận hỗ trợ thành công. Cảm ơn bạn!');
    } catch (err) {
      message.error(getErrorMessage(err, 'Xác nhận thất bại'));
    } finally {
      setConfirming(false);
    }
  };

  const beneficiary =
    request && request.beneficiary && typeof request.beneficiary === 'object'
      ? request.beneficiary
      : null;
  const handledBy =
    request && request.handledBy && typeof request.handledBy === 'object'
      ? request.handledBy
      : null;
  const campaign =
    request && request.campaign && typeof request.campaign === 'object'
      ? request.campaign
      : null;

  const referenceCode = request ? request._id.slice(-8).toUpperCase() : '';
  const isRejected = request?.status === 'rejected';
  const canConfirm =
    Boolean(request) &&
    ['approved', 'in_progress', 'completed'].includes(request!.status) &&
    !request!.receivedConfirmed;
  const urgency = URGENCY_CONFIG[request?.urgency || 'medium'] || URGENCY_CONFIG.medium;

  const currentStep = useMemo(() => {
    if (!request) return 0;
    if (request.status === 'pending') return 0;
    if (request.status === 'approved' || request.status === 'rejected') return 1;
    if (request.status === 'in_progress') return 2;
    return 3;
  }, [request]);

  const steps = useMemo(
    () =>
      SUPPORT_STEPS.map((step, index) => {
        if (index === 0) {
          return {
            title: step.title,
            description: (
              <span className="text-xs">
                {step.description}
                <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                  {request ? formatDateTime(request.createdAt) : ''}
                </span>
              </span>
            ),
          };
        }
        if (index === 1) {
          return {
            title: step.title,
            description: (
              <span className="text-xs">
                {step.description}
                {request?.handledAt && (
                  <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                    {formatDateTime(request.handledAt)}
                  </span>
                )}
              </span>
            ),
          };
        }
        if (index === 3) {
          return {
            title: step.title,
            description: (
              <span className="text-xs">
                {step.description}
                {request?.receivedAt && (
                  <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                    {formatDateTime(request.receivedAt)}
                  </span>
                )}
              </span>
            ),
          };
        }
        return {
          title: step.title,
          description: <span className="text-xs">{step.description}</span>,
        };
      }),
    [request]
  );

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!request) return [];
    const items: TimelineItem[] = [
      {
        phase: 'Bước 1',
        title: 'Gửi yêu cầu hỗ trợ',
        description: 'Yêu cầu của bạn đã được ghi nhận trên hệ thống ReGive.',
        date: formatDateTime(request.createdAt),
        status: 'completed',
      },
    ];

    if (isRejected) {
      items.push({
        phase: 'Kết thúc',
        title: 'Yêu cầu không được phê duyệt',
        description:
          request.reviewNote ||
          'Ban điều phối chưa thể đáp ứng yêu cầu này. Vui lòng liên hệ để được giải thích thêm.',
        date: formatDateTime(request.handledAt || request.updatedAt),
        status: 'completed',
      });
      return items;
    }

    items.push({
      phase: 'Bước 2',
      title: 'Thẩm định hồ sơ',
      description:
        request.reviewNote ||
        (request.status === 'pending'
          ? 'Ban điều phối đang kiểm tra hoàn cảnh và nhu cầu hỗ trợ.'
          : 'Hồ sơ đã được thẩm định bởi ban điều phối.'),
      date: request.handledAt ? formatDateTime(request.handledAt) : undefined,
      status: request.status === 'pending' ? 'in_progress' : 'completed',
    });

    items.push({
      phase: 'Bước 3',
      title: 'Điều phối hỗ trợ',
      description:
        request.status === 'in_progress'
          ? 'Nguồn lực đang được điều phối tới bạn.'
          : request.status === 'completed'
            ? 'Hoạt động hỗ trợ đã được triển khai.'
            : 'Hoạt động hỗ trợ sẽ bắt đầu sau khi hồ sơ được duyệt.',
      status:
        request.status === 'in_progress'
          ? 'in_progress'
          : request.status === 'completed'
            ? 'completed'
            : 'upcoming',
    });

    items.push({
      phase: 'Hoàn tất',
      title: request.receivedConfirmed ? 'Đã xác nhận nhận hỗ trợ' : 'Chờ bạn xác nhận',
      description: request.receivedConfirmed
        ? 'Bạn đã xác nhận đã nhận được hỗ trợ từ ReGive.'
        : 'Sau khi nhận hỗ trợ, hãy bấm xác nhận để hoàn tất hồ sơ.',
      date: request.receivedAt ? formatDateTime(request.receivedAt) : undefined,
      status: request.receivedConfirmed ? 'completed' : 'upcoming',
    });

    return items;
  }, [request, isRejected]);

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết yêu cầu hỗ trợ" subtitle="Đang tải hồ sơ hỗ trợ…">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardLayout title="Chi tiết yêu cầu hỗ trợ">
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <DetailBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Yêu cầu hỗ trợ', href: '/me/support-requests' },
              { label: 'Không tìm thấy' },
            ]}
          />
          <Alert
            type="error"
            showIcon
            message="Không thể hiển thị yêu cầu hỗ trợ"
            description={error || 'Không tìm thấy dữ liệu yêu cầu hỗ trợ.'}
            className="rounded-2xl"
          />
          <Link href="/me/support-requests">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Quay lại danh sách yêu cầu
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Chi tiết yêu cầu hỗ trợ"
      subtitle={`Mã hồ sơ #${referenceCode}`}
    >
      <DetailBreadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Yêu cầu hỗ trợ', href: '/me/support-requests' },
          { label: `#${referenceCode}` },
        ]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-p-s900 via-p-s700 to-emerald-600 text-white shadow-xl shadow-p-s900/25">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-12 bottom-0 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-2.5 py-1">
                <LifeBuoy className="w-3.5 h-3.5" /> Yêu cầu hỗ trợ
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-1 ${urgency.className}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> {urgency.label}
              </span>
              <StatusBadge type="support" status={request.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words">
              {request.title}
            </h1>

            <p className="text-sm text-white/80 leading-relaxed max-w-2xl whitespace-pre-line">
              {request.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Gửi {formatDateTime(request.createdAt)}
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
                Trạng thái hồ sơ
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge type="support" status={request.status} />
                <span className="text-[11px] text-white/70">
                  Cập nhật {formatDateTime(request.updatedAt)}
                </span>
              </div>
              <p className="text-xs text-white/75 mt-2 leading-relaxed">
                {request.receivedConfirmed
                  ? 'Bạn đã xác nhận nhận hỗ trợ. Hồ sơ đã hoàn tất.'
                  : isRejected
                    ? 'Yêu cầu chưa được phê duyệt. Xem phản hồi của điều phối viên bên dưới.'
                    : request.status === 'pending'
                      ? 'Hồ sơ đang chờ ban điều phối thẩm định.'
                      : 'Hồ sơ đã được duyệt và đang trong quá trình hỗ trợ.'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {canConfirm && (
                <Button
                  size="large"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => setConfirmOpen(true)}
                  className="w-full h-11 rounded-xl bg-white text-p-s800 hover:bg-white border-white font-bold"
                >
                  Xác nhận đã nhận hỗ trợ
                </Button>
              )}

              <Link href="/support/new" className="block">
                <Button
                  size="large"
                  icon={<LifeBuoy className="w-4 h-4" />}
                  className="w-full h-11 rounded-xl bg-transparent !text-white !border-white/40 hover:!border-white font-bold"
                >
                  Tạo yêu cầu mới
                </Button>
              </Link>

              {campaign?._id && (
                <Link href={`/campaigns/${campaign._id}`} className="block">
                  <Button
                    size="large"
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl bg-transparent !text-white !border-white/40 hover:!border-white font-bold"
                  >
                    Xem chiến dịch
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Thông tin hồ sơ chỉ hiển thị cho bạn và ban điều phối của ReGive.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIẾN TRÌNH HỒ SƠ ── */}
      <DetailSection
        title="Tiến trình xử lý yêu cầu"
        subtitle="Theo dõi từng bước thẩm định và điều phối nguồn lực"
        icon={<LifeBuoy className="w-4 h-4" />}
        extra={<StatusBadge type="support" status={request.status} />}
      >
        {isRejected ? (
          <Alert
            type="error"
            showIcon
            message="Yêu cầu không được phê duyệt"
            description={
              request.reviewNote ||
              'Ban điều phối chưa thể đáp ứng yêu cầu này. Vui lòng liên hệ để được giải thích thêm.'
            }
            className="rounded-xl"
          />
        ) : (
          <div className="pt-1 pb-2 overflow-x-auto">
            <Steps current={currentStep} items={steps} responsive className="min-w-[580px]" />
          </div>
        )}
      </DetailSection>

      {/* ── SỐ LIỆU NHANH ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Trạng thái"
          value={<StatusBadge type="support" status={request.status} />}
          hint={
            request.receivedConfirmed
              ? 'Đã xác nhận nhận hỗ trợ'
              : isRejected
                ? 'Hồ sơ không được phê duyệt'
                : request.status === 'pending'
                  ? 'Đang chờ thẩm định'
                  : 'Đang được điều phối hỗ trợ'
          }
          icon={<BadgeCheck className="w-4 h-4" />}
          tone={
            request.receivedConfirmed
              ? 'green'
              : isRejected
                ? 'rose'
                : request.status === 'pending'
                  ? 'amber'
                  : 'sky'
          }
        />
        <StatTile
          label="Mức độ ưu tiên"
          value={urgency.label}
          hint={urgency.description}
          icon={<AlertTriangle className="w-4 h-4" />}
          tone={urgency.tone}
        />
        <StatTile
          label="Chiến dịch liên quan"
          value={campaign?.title || 'Không gắn chiến dịch'}
          hint={
            campaign?.status
              ? 'Có liên kết tới chiến dịch đang xét duyệt'
              : 'Yêu cầu hỗ trợ độc lập'
          }
          icon={<HandHeart className="w-4 h-4" />}
          tone="primary"
        />
        <StatTile
          label="Ngày gửi"
          value={formatDateTime(request.createdAt)}
          hint={`Cập nhật: ${formatDateTime(request.updatedAt)}`}
          icon={<Calendar className="w-4 h-4" />}
          tone="slate"
        />
      </div>

      {/* ── NỘI DUNG CHI TIẾT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection
            title="Nội dung yêu cầu"
            subtitle="Toàn bộ thông tin bạn đã gửi tới ban điều phối"
            icon={<FileText className="w-4 h-4" />}
            extra={<StatusBadge type="support" status={request.status} />}
          >
            <InfoRow label="Mã hồ sơ" mono>
              <CodeChip value={request._id} label="mã hồ sơ" />
            </InfoRow>
            <InfoRow label="Tiêu đề" value={request.title} />
            <InfoRow label="Mức độ ưu tiên">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-1 ${urgency.className}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> {urgency.label}
              </span>
            </InfoRow>
            <InfoRow
              label="Trạng thái"
              value={<StatusBadge type="support" status={request.status} />}
            />
            <InfoRow
              label="Chiến dịch liên quan"
              value={campaign?.title || 'Không gắn chiến dịch cụ thể'}
            />
            <InfoRow label="Ngày gửi" value={formatDateTime(request.createdAt)} />
            <InfoRow label="Cập nhật gần nhất" value={formatDateTime(request.updatedAt)} />
            <InfoRow label="Mô tả chi tiết">
              <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {request.description}
              </span>
            </InfoRow>
          </DetailSection>

          <DetailSection
            title="Phản hồi từ điều phối viên"
            subtitle="Ghi chú thẩm định và hướng xử lý hồ sơ"
            icon={<MessageSquare className="w-4 h-4" />}
            tone={request.reviewNote ? 'info' : 'default'}
          >
            {request.reviewNote ? (
              <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4 text-sm text-sky-900 leading-relaxed whitespace-pre-line">
                {request.reviewNote}
              </div>
            ) : (
              <InlineEmpty
                icon={<MessageSquare className="w-5 h-5" />}
                title="Chưa có phản hồi"
                description={
                  request.status === 'pending'
                    ? 'Ban điều phối đang thẩm định hồ sơ và sẽ phản hồi trong thời gian sớm nhất.'
                    : 'Hồ sơ này không có ghi chú thẩm định kèm theo.'
                }
              />
            )}

            <div className="mt-4">
              {handledBy ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-p-s50/60 border border-p-s100 p-4">
                    <div className="w-11 h-11 rounded-full bg-white border border-p-s200 text-p-s700 font-black flex items-center justify-center shrink-0">
                      {(handledBy.fullName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {handledBy.fullName || 'Điều phối viên ReGive'}
                      </p>
                      {handledBy.email && (
                        <p className="text-[11px] text-gray-500 truncate">{handledBy.email}</p>
                      )}
                    </div>
                  </div>
                  <InfoRow
                    label="Thời điểm xử lý"
                    value={
                      request.handledAt ? formatDateTime(request.handledAt) : 'Chưa cập nhật'
                    }
                  />
                  <InfoRow
                    label="Kết quả"
                    value={<StatusBadge type="support" status={request.status} />}
                  />
                </div>
              ) : (
                <InlineEmpty
                  icon={<UserRound className="w-5 h-5" />}
                  title="Chưa có người phụ trách"
                  description="Hồ sơ đang chờ ban điều phối phân công người xử lý."
                />
              )}
            </div>
          </DetailSection>

          <DetailSection
            title="Thông tin người thụ hưởng"
            subtitle="Thông tin liên hệ dùng để điều phối hỗ trợ"
            icon={<Users className="w-4 h-4" />}
          >
            {beneficiary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4">
                  <div className="w-11 h-11 rounded-full bg-white border border-emerald-200 text-emerald-700 font-black flex items-center justify-center shrink-0">
                    {(beneficiary.fullName || 'B').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {beneficiary.fullName || 'Người thụ hưởng'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Hồ sơ yêu cầu hỗ trợ của ReGive
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
                      {beneficiary.email || '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Số điện thoại
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 font-mono">
                      {beneficiary.phone || '—'}
                    </p>
                  </div>
                </div>

                <InfoRow label="Địa chỉ liên hệ" value={beneficiary.address || '—'} />
                <InfoRow
                  label="Số thành viên hộ gia đình"
                  value={beneficiary.beneficiaryInfo?.householdSize ?? '—'}
                  hint="Thông tin do bạn cung cấp khi đăng ký tài khoản."
                />
                <InfoRow
                  label="Ghi chú hoàn cảnh"
                  value={beneficiary.beneficiaryInfo?.note || '—'}
                />
              </div>
            ) : (
              <InlineEmpty
                icon={<Users className="w-5 h-5" />}
                title="Không tìm thấy thông tin người thụ hưởng"
                description="Dữ liệu người thụ hưởng chưa được đồng bộ hoặc đã bị thay đổi."
              />
            )}
          </DetailSection>

          <DetailSection
            title="Xác nhận đã nhận hỗ trợ"
            subtitle="Bước cuối cùng để hoàn tất hồ sơ yêu cầu hỗ trợ"
            icon={<CheckCircle2 className="w-4 h-4" />}
            tone={request.receivedConfirmed ? 'success' : 'default'}
          >
            {request.receivedConfirmed ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Bạn đã xác nhận nhận hỗ trợ
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Thời điểm xác nhận:{' '}
                  <span className="font-semibold">
                    {request.receivedAt ? formatDateTime(request.receivedAt) : '—'}
                  </span>
                </p>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Cảm ơn bạn đã phản hồi. Hồ sơ đã được ghi nhận hoàn tất trên hệ thống ReGive.
                </p>
              </div>
            ) : canConfirm ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  Khi đã nhận được hỗ trợ, hãy bấm xác nhận để ban điều phối cập nhật trạng thái hồ
                  sơ và ghi nhận vào báo cáo minh bạch.
                </div>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-xl"
                >
                  Xác nhận đã nhận hỗ trợ
                </Button>
              </div>
            ) : (
              <InlineEmpty
                icon={<Clock className="w-5 h-5" />}
                title={
                  isRejected ? 'Hồ sơ không được phê duyệt' : 'Chưa thể xác nhận nhận hỗ trợ'
                }
                description={
                  isRejected
                    ? 'Yêu cầu không được phê duyệt nên không có bước xác nhận nhận hỗ trợ.'
                    : 'Bạn có thể xác nhận sau khi hồ sơ được duyệt và quá trình hỗ trợ bắt đầu.'
                }
              />
            )}
          </DetailSection>
        </div>

        {/* ── CỘT PHẢI: TIẾN TRÌNH / QUY TRÌNH / HỖ TRỢ ── */}
        <div className="space-y-6">
          <DetailSection
            title="Tiến trình hồ sơ"
            subtitle="Các mốc xử lý yêu cầu hỗ trợ của bạn"
            icon={<Clock className="w-4 h-4" />}
          >
            <Timeline items={timelineItems} />
          </DetailSection>

          <DetailSection
            title="Quy trình xử lý yêu cầu"
            subtitle="ReGive xử lý hồ sơ theo 4 bước minh bạch"
            icon={<Sparkles className="w-4 h-4" />}
          >
            <ol className="space-y-3">
              {SUPPORT_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-p-s50 border border-p-s200 text-p-s700 text-[11px] font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900">{step.title}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </DetailSection>

          <DetailSection
            title="Cần hỗ trợ thêm?"
            subtitle="Ban điều phối luôn sẵn sàng lắng nghe"
            icon={<LifeBuoy className="w-4 h-4" />}
          >
            <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Gửi thêm yêu cầu mới nếu hoàn cảnh hoặc nhu cầu của bạn thay đổi.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Khi liên hệ, hãy kèm mã hồ sơ để được tra cứu nhanh hơn.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                Không chia sẻ thông tin hồ sơ cho người không liên quan.
              </li>
            </ul>

            <div className="pt-4 space-y-2">
              <Link href="/support/new" className="block">
                <Button block icon={<LifeBuoy className="w-4 h-4" />} className="rounded-xl">
                  Tạo yêu cầu hỗ trợ mới
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
          Mã hồ sơ:
          <span className="font-mono font-bold text-gray-800">#{referenceCode}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/me/support-requests">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Về danh sách yêu cầu
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

      {/* ── MODAL XÁC NHẬN ĐÃ NHẬN HỖ TRỢ ── */}
      <Modal
        title="Xác nhận đã nhận hỗ trợ"
        open={confirmOpen}
        onCancel={() => {
          if (!confirming) setConfirmOpen(false);
        }}
        onOk={handleConfirmReceived}
        confirmLoading={confirming}
        okText="Tôi đã nhận được hỗ trợ"
        cancelText="Để sau"
        okButtonProps={{ className: 'rounded-xl' }}
        cancelButtonProps={{ className: 'rounded-xl' }}
        destroyOnHidden
      >
        <div className="py-2 space-y-3 text-sm text-gray-600">
          <Alert
            type="warning"
            showIcon
            message="Xác nhận này không thể hoàn tác"
            description="Chỉ bấm xác nhận khi bạn đã thực sự nhận được hỗ trợ từ chiến dịch."
            className="rounded-xl"
          />
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-1 text-xs">
            <p>
              <span className="text-gray-500">Mã hồ sơ: </span>
              <span className="font-mono font-bold text-gray-900">#{referenceCode}</span>
            </p>
            <p>
              <span className="text-gray-500">Tiêu đề: </span>
              <span className="font-semibold text-gray-900">{request.title}</span>
            </p>
            <p>
              <span className="text-gray-500">Mức độ ưu tiên: </span>
              <span className="font-semibold text-gray-900">{urgency.label}</span>
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
