'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Steps, message } from 'antd';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HandHeart,
  Hash,
  Info,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react';
import { volunteerService } from '@/services/volunteerService';
import { VolunteerRegistration } from '@/types';
import { formatDate, formatDateTime } from '@/lib/format';
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

const VOLUNTEER_STEPS = [
  { title: 'Gửi đăng ký', description: 'Hồ sơ tình nguyện được gửi tới ban điều phối.' },
  { title: 'Xét duyệt hồ sơ', description: 'Ban điều phối kiểm tra kỹ năng và lịch rảnh.' },
  { title: 'Phân công lịch', description: 'Bạn nhận được ngày, khung giờ và địa điểm cụ thể.' },
  { title: 'Sẵn sàng tham gia', description: 'Có mặt đúng hẹn và phối hợp cùng đội tình nguyện.' },
];

const PREPARE_CHECKLIST = [
  'Xác nhận lại ngày, khung giờ và địa điểm với điều phối viên trước 24 giờ.',
  'Mặc trang phục gọn gàng, phù hợp với hoạt động ngoài trời.',
  'Mang theo nước uống, khẩu trang và giấy tờ tùy thân nếu được yêu cầu.',
  'Có mặt trước giờ hẹn ít nhất 15 phút để nhận bàn giao công việc.',
  'Chụp lại hình ảnh hoạt động để ban điều phối cập nhật báo cáo minh bạch.',
];

const formatCalendarDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

export default function VolunteerDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [registration, setRegistration] = useState<VolunteerRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const detail = await volunteerService.getById(id);
        if (!cancelled) setRegistration(detail);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Không thể tải thông tin đăng ký tình nguyện'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const campaign =
    registration && registration.campaign && typeof registration.campaign === 'object'
      ? registration.campaign
      : null;
  const reviewer =
    registration && registration.reviewedBy && typeof registration.reviewedBy === 'object'
      ? registration.reviewedBy
      : null;
  const schedule = registration?.schedule;
  const hasSchedule = Boolean(schedule?.date || schedule?.timeSlot || schedule?.location);
  const referenceCode = registration ? registration._id.slice(-8).toUpperCase() : '';
  const isRejected = registration?.status === 'rejected';
  const isCancelled = registration?.status === 'cancelled';
  const isApproved = registration?.status === 'approved';

  const currentStep = useMemo(() => {
    if (!registration) return 0;
    if (isRejected || isCancelled) return 1;
    if (isApproved) return 3;
    return 1;
  }, [registration, isRejected, isCancelled, isApproved]);

  const steps = useMemo(
    () =>
      VOLUNTEER_STEPS.map((step, index) => {
        if (index === 0) {
          return {
            title: step.title,
            description: (
              <span className="text-xs">
                {step.description}
                <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                  {registration ? formatDateTime(registration.createdAt) : ''}
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
                {registration?.reviewedAt && (
                  <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                    {formatDateTime(registration.reviewedAt)}
                  </span>
                )}
              </span>
            ),
          };
        }
        if (index === 2) {
          return {
            title: step.title,
            description: (
              <span className="text-xs">
                {step.description}
                {schedule?.date && (
                  <span className="block text-[11px] text-gray-400 mt-0.5 font-mono">
                    {formatDate(schedule.date)}
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
    [registration, schedule]
  );

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!registration) return [];
    const items: TimelineItem[] = [
      {
        phase: 'Bước 1',
        title: 'Gửi đăng ký tình nguyện',
        description: 'Hồ sơ của bạn đã được gửi tới ban điều phối chiến dịch.',
        date: formatDateTime(registration.createdAt),
        status: 'completed',
      },
    ];

    if (isRejected || isCancelled) {
      items.push({
        phase: 'Kết thúc',
        title: isRejected ? 'Hồ sơ bị từ chối' : 'Đăng ký đã bị hủy',
        description: isRejected
          ? 'Ban điều phối chưa thể sắp xếp bạn vào đợt tình nguyện này. Bạn có thể đăng ký chiến dịch khác.'
          : 'Đăng ký tình nguyện đã được hủy bỏ.',
        date: formatDateTime(registration.reviewedAt || registration.updatedAt),
        status: 'completed',
      });
      return items;
    }

    items.push({
      phase: 'Bước 2',
      title: 'Xét duyệt hồ sơ',
      description: isApproved
        ? 'Ban điều phối đã duyệt hồ sơ của bạn.'
        : 'Ban điều phối đang kiểm tra kỹ năng và lịch rảnh của bạn.',
      date: registration.reviewedAt ? formatDateTime(registration.reviewedAt) : undefined,
      status: isApproved ? 'completed' : 'in_progress',
    });

    items.push({
      phase: 'Bước 3',
      title: 'Phân công lịch tham gia',
      description: hasSchedule
        ? `Bạn được phân công${schedule?.timeSlot ? ` khung ${schedule.timeSlot}` : ''}${
            schedule?.location ? ` tại ${schedule.location}` : ''
          }.`
        : 'Lịch phân công sẽ được cập nhật sau khi hồ sơ được duyệt.',
      date: schedule?.date ? formatDate(schedule.date) : undefined,
      status: hasSchedule ? 'completed' : isApproved ? 'in_progress' : 'upcoming',
    });

    items.push({
      phase: 'Hoàn tất',
      title: 'Sẵn sàng tham gia',
      description: 'Bạn đã sẵn sàng cho buổi tình nguyện theo lịch phân công.',
      status: isApproved && hasSchedule ? 'completed' : 'upcoming',
    });

    return items;
  }, [registration, isApproved, isRejected, isCancelled, hasSchedule, schedule]);

  const calendarUrl = useMemo(() => {
    if (!schedule?.date) return null;
    const start = new Date(schedule.date);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const searchParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Tình nguyện: ${campaign?.title || 'Chiến dịch ReGive'}`,
      dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`,
      details: [
        `Khung giờ: ${schedule.timeSlot || 'Theo phân công của ban điều phối'}`,
        schedule.location ? `Địa điểm: ${schedule.location}` : '',
        'Lịch được tạo từ ReGive.',
      ]
        .filter(Boolean)
        .join('\n'),
      location: schedule.location || '',
    });

    return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
  }, [schedule, campaign]);

  const handleCopyLocation = async () => {
    if (!schedule?.location) return;
    try {
      await navigator.clipboard.writeText(schedule.location);
      message.success('Đã sao chép địa điểm!');
    } catch {
      message.error('Trình duyệt không cho phép sao chép tự động');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết đăng ký tình nguyện" subtitle="Đang tải hồ sơ tình nguyện…">
        <DetailSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !registration) {
    return (
      <DashboardLayout title="Chi tiết đăng ký tình nguyện">
        <div className="max-w-2xl mx-auto py-8 space-y-4">
          <DetailBreadcrumb
            items={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Đăng ký tình nguyện', href: '/me/volunteers' },
              { label: 'Không tìm thấy' },
            ]}
          />
          <Alert
            type="error"
            showIcon
            message="Không thể hiển thị hồ sơ tình nguyện"
            description={error || 'Không tìm thấy dữ liệu đăng ký tình nguyện.'}
            className="rounded-2xl"
          />
          <Link href="/me/volunteers">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Quay lại danh sách đăng ký
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Chi tiết đăng ký tình nguyện"
      subtitle={`Mã hồ sơ #${referenceCode}`}
    >
      <DetailBreadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đăng ký tình nguyện', href: '/me/volunteers' },
          { label: `#${referenceCode}` },
        ]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-p-s600 to-sec-s500 text-white shadow-xl shadow-sky-800/20">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-12 bottom-0 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative p-6 sm:p-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/25 rounded-full px-2.5 py-1">
                <HandHeart className="w-3.5 h-3.5" /> Tình nguyện viên
              </span>
              <StatusBadge type="volunteer" status={registration.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight break-words">
              {campaign?.title || 'Đăng ký tình nguyện chiến dịch'}
            </h1>

            <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
              {isRejected
                ? 'Hồ sơ của bạn chưa được sắp xếp vào đợt tình nguyện này. Bạn vẫn có thể đồng hành cùng các chiến dịch khác của ReGive.'
                : isCancelled
                  ? 'Đăng ký tình nguyện đã được hủy. Bạn có thể đăng ký lại nếu chiến dịch vẫn đang mở.'
                  : 'Cảm ơn bạn đã dành thời gian và kỹ năng để đồng hành cùng chiến dịch.'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Đăng ký {formatDateTime(registration.createdAt)}
              </span>
              {campaign?.location && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[220px]">{campaign.location}</span>
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
                Lịch phân công
              </p>
              {hasSchedule ? (
                <div className="mt-2 space-y-2 text-sm">
                  <p className="flex items-center gap-2 font-bold">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {schedule?.date ? formatDate(schedule.date) : 'Chưa xác định ngày'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    {schedule?.timeSlot || 'Theo phân công'}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="break-words">
                      {schedule?.location || 'Chưa xác định địa điểm'}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-white/80 mt-2 leading-relaxed">
                  {isApproved
                    ? 'Hồ sơ đã được duyệt, đang chờ điều phối viên xếp lịch cụ thể.'
                    : 'Lịch phân công sẽ xuất hiện sau khi hồ sơ được duyệt.'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {calendarUrl && (
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    size="large"
                    icon={<CalendarPlus className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl bg-white text-p-s800 hover:bg-white border-white font-bold"
                  >
                    Thêm vào Google Calendar
                  </Button>
                </a>
              )}
              {campaign?._id && (
                <Link href={`/campaigns/${campaign._id}`} className="block">
                  <Button
                    size="large"
                    icon={<ExternalLink className="w-4 h-4" />}
                    className="w-full h-11 rounded-xl bg-transparent text-p-s800 !border-white/40 hover:!border-white font-bold"
                  >
                    Xem chiến dịch
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Mọi hoạt động tình nguyện đều có điều phối viên hướng dẫn và bảo hộ.
            </p>
          </div>
        </div>
      </section>

      {/* ── TIẾN TRÌNH HỒ SƠ ── */}
      <DetailSection
        title="Tiến trình hồ sơ tình nguyện"
        subtitle="Theo dõi từng bước từ lúc gửi đăng ký đến khi nhận lịch phân công"
        icon={<HandHeart className="w-4 h-4" />}
        extra={<StatusBadge type="volunteer" status={registration.status} />}
      >
        {isRejected || isCancelled ? (
          <Alert
            type={isRejected ? 'error' : 'warning'}
            showIcon
            message={isRejected ? 'Hồ sơ đã bị từ chối' : 'Đăng ký đã bị hủy'}
            description={
              isRejected
                ? 'Ban điều phối chưa thể sắp xếp bạn vào đợt tình nguyện này. Hãy thử đăng ký chiến dịch khác phù hợp hơn.'
                : 'Đăng ký tình nguyện đã được hủy. Bạn có thể đăng ký lại nếu chiến dịch vẫn đang nhận tình nguyện viên.'
            }
            className="rounded-xl"
          />
        ) : (
          <div className="pt-1 pb-2 overflow-x-auto">
            <Steps
              current={currentStep}
              items={steps}
              responsive
              className="min-w-[600px]"
            />
          </div>
        )}
      </DetailSection>

      {/* ── SỐ LIỆU NHANH ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label="Trạng thái hồ sơ"
          value={<StatusBadge type="volunteer" status={registration.status} />}
          hint={
            isApproved
              ? 'Hồ sơ đã được duyệt'
              : isRejected
                ? 'Hồ sơ không được tiếp nhận'
                : isCancelled
                  ? 'Đăng ký đã bị hủy'
                  : 'Đang chờ ban điều phối xét duyệt'
          }
          icon={<BadgeCheck className="w-4 h-4" />}
          tone={isApproved ? 'green' : isRejected || isCancelled ? 'rose' : 'amber'}
        />
        <StatTile
          label="Chiến dịch"
          value={campaign?.title || '—'}
          hint={campaign?.location || 'Chưa có địa điểm'}
          icon={<HandHeart className="w-4 h-4" />}
          tone="primary"
        />
        <StatTile
          label="Ngày đăng ký"
          value={formatDate(registration.createdAt)}
          hint={`Cập nhật: ${formatDateTime(registration.updatedAt)}`}
          icon={<Calendar className="w-4 h-4" />}
          tone="slate"
        />
        <StatTile
          label="Lịch phân công"
          value={schedule?.date ? formatDate(schedule.date) : 'Chưa phân công'}
          hint={schedule?.timeSlot || 'Chờ điều phối viên cập nhật'}
          icon={<Clock className="w-4 h-4" />}
          tone={hasSchedule ? 'sky' : 'amber'}
        />
      </div>

      {/* ── NỘI DUNG CHI TIẾT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection
            title="Thông tin đăng ký"
            subtitle="Dữ liệu bạn đã cung cấp khi gửi hồ sơ tình nguyện"
            icon={<FileText className="w-4 h-4" />}
            extra={<StatusBadge type="volunteer" status={registration.status} />}
          >
            <InfoRow label="Mã hồ sơ" mono>
              <CodeChip value={registration._id} label="mã hồ sơ" />
            </InfoRow>
            <InfoRow
              label="Trạng thái"
              value={<StatusBadge type="volunteer" status={registration.status} />}
            />
            <InfoRow label="Chiến dịch" value={campaign?.title || '—'} />
            <InfoRow label="Ngày gửi hồ sơ" value={formatDateTime(registration.createdAt)} />
            <InfoRow
              label="Thời điểm xét duyệt"
              value={
                registration.reviewedAt
                  ? formatDateTime(registration.reviewedAt)
                  : 'Chưa được xét duyệt'
              }
            />
            <InfoRow label="Cập nhật gần nhất" value={formatDateTime(registration.updatedAt)} />
            <InfoRow label="Kỹ năng / thế mạnh">
              <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {registration.skills || 'Bạn chưa ghi rõ kỹ năng.'}
              </span>
            </InfoRow>
            <InfoRow label="Thời gian có thể tham gia">
              <span className="block text-left bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {registration.availabilityNote || 'Bạn chưa ghi rõ lịch rảnh.'}
              </span>
            </InfoRow>
          </DetailSection>

          <DetailSection
            title="Lịch phân công chính thức"
            subtitle="Thông tin do điều phối viên cập nhật sau khi duyệt hồ sơ"
            icon={<Calendar className="w-4 h-4" />}
            tone={hasSchedule ? 'success' : 'default'}
            extra={
              calendarUrl ? (
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="small"
                    icon={<CalendarPlus className="w-3.5 h-3.5" />}
                    className="rounded-lg text-xs"
                  >
                    Thêm vào lịch
                  </Button>
                </a>
              ) : undefined
            }
          >
            {hasSchedule ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-p-s100 bg-p-s50/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-p-s700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Ngày tham gia
                    </p>
                    <p className="text-sm font-black text-gray-900 mt-1.5">
                      {schedule?.date ? formatDate(schedule.date) : 'Chưa xác định'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Khung giờ
                    </p>
                    <p className="text-sm font-black text-gray-900 mt-1.5">
                      {schedule?.timeSlot || 'Theo phân công'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sec-s100 bg-sec-s50/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sec-s700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Địa điểm
                    </p>
                    <p className="text-sm font-black text-gray-900 mt-1.5 break-words">
                      {schedule?.location || 'Chưa xác định'}
                    </p>
                  </div>
                </div>

                {schedule?.location && (
                  <Button
                    block
                    icon={<MapPin className="w-4 h-4" />}
                    onClick={handleCopyLocation}
                    className="rounded-xl"
                  >
                    Sao chép địa điểm tập trung
                  </Button>
                )}

                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Hãy có mặt trước giờ hẹn ít nhất 15 phút và liên hệ điều phối viên nếu có thay
                  đổi đột xuất.
                </div>
              </div>
            ) : (
              <InlineEmpty
                icon={<Calendar className="w-5 h-5" />}
                title={isApproved ? 'Đã duyệt — đang chờ phân công lịch' : 'Chưa có lịch phân công'}
                description={
                  isApproved
                    ? 'Điều phối viên đang sắp xếp ngày, khung giờ và địa điểm phù hợp với lịch rảnh của bạn.'
                    : 'Lịch phân công chỉ xuất hiện sau khi hồ sơ của bạn được duyệt.'
                }
              />
            )}
          </DetailSection>

          <DetailSection
            title="Chiến dịch bạn đăng ký"
            subtitle="Thông tin chiến dịch và thời gian diễn ra"
            icon={<HandHeart className="w-4 h-4" />}
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
                        <HandHeart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge type="campaign" status={campaign.status} />
                      {campaign.organization && (
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                          {campaign.organization}
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

                {campaign.description && (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
                    {campaign.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Bắt đầu
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {campaign.startDate ? formatDate(campaign.startDate) : '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Kết thúc
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {campaign.endDate ? formatDate(campaign.endDate) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <InlineEmpty
                icon={<HandHeart className="w-5 h-5" />}
                title="Không tìm thấy thông tin chiến dịch"
                description="Chiến dịch có thể đã bị ẩn hoặc dữ liệu chưa được đồng bộ."
              />
            )}
          </DetailSection>

          <DetailSection
            title="Kết quả xét duyệt"
            subtitle="Người phụ trách và thời điểm cập nhật hồ sơ"
            icon={<UserRound className="w-4 h-4" />}
            tone={isApproved ? 'success' : isRejected ? 'warning' : 'default'}
          >
            {reviewer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-p-s50/60 border border-p-s100 p-4">
                  <div className="w-11 h-11 rounded-full bg-white border border-p-s200 text-p-s700 font-black flex items-center justify-center shrink-0">
                    {(reviewer.fullName || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {reviewer.fullName || 'Điều phối viên ReGive'}
                    </p>
                    {reviewer.email && (
                      <p className="text-[11px] text-gray-500 truncate">{reviewer.email}</p>
                    )}
                  </div>
                </div>
                <InfoRow
                  label="Thời điểm xét duyệt"
                  value={registration.reviewedAt ? formatDateTime(registration.reviewedAt) : '—'}
                />
                <InfoRow
                  label="Kết quả"
                  value={<StatusBadge type="volunteer" status={registration.status} />}
                />
              </div>
            ) : (
              <InlineEmpty
                icon={<UserRound className="w-5 h-5" />}
                title="Chưa có kết quả xét duyệt"
                description="Hồ sơ đang chờ điều phối viên kiểm tra kỹ năng và lịch rảnh của bạn."
              />
            )}

            {isRejected && (
              <Alert
                type="error"
                showIcon
                message="Vì sao hồ sơ có thể bị từ chối?"
                description="Thường do chiến dịch đã đủ tình nguyện viên, kỹ năng chưa phù hợp hoặc lịch rảnh không trùng với đợt triển khai. Bạn có thể đăng ký chiến dịch khác."
                className="rounded-xl mt-4"
              />
            )}
          </DetailSection>

          <DetailSection
            title="Chuẩn bị trước buổi tình nguyện"
            subtitle="Danh sách gợi ý giúp bạn tham gia hiệu quả và an toàn"
            icon={<ListChecks className="w-4 h-4" />}
          >
            <ul className="space-y-3">
              {PREPARE_CHECKLIST.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-white border border-p-s200 text-p-s700 text-[11px] font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Đây là gợi ý chung. Hướng dẫn chính thức sẽ do điều phối viên của chiến dịch cung cấp
              khi bạn nhận lịch phân công.
            </p>
          </DetailSection>
        </div>

        {/* ── CỘT PHẢI: TIẾN TRÌNH / HỖ TRỢ ── */}
        <div className="space-y-6">
          <DetailSection
            title="Tiến trình hồ sơ"
            subtitle="Các mốc quan trọng của đăng ký tình nguyện"
            icon={<Clock className="w-4 h-4" />}
          >
            <Timeline items={timelineItems} />
          </DetailSection>

          <DetailSection
            title="Liên hệ & hỗ trợ"
            subtitle="Điều phối viên luôn sẵn sàng giải đáp"
            icon={<Sparkles className="w-4 h-4" />}
          >
            <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Mỗi chiến dịch chỉ nhận một đăng ký tình nguyện cho mỗi tài khoản.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-p-s600 mt-0.5 shrink-0" />
                Nếu có việc đột xuất, hãy báo cho điều phối viên sớm nhất có thể.
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                Không tự ý thay đổi địa điểm hoặc thời gian khi chưa được duyệt.
              </li>
            </ul>

            <div className="pt-4 space-y-2">
              <Link href="/support/new" className="block">
                <Button block icon={<HandHeart className="w-4 h-4" />} className="rounded-xl">
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
          Mã hồ sơ:
          <span className="font-mono font-bold text-gray-800">#{referenceCode}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/me/volunteers">
            <Button icon={<ArrowLeft className="w-4 h-4" />} className="rounded-xl">
              Về danh sách đăng ký
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
