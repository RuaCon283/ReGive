'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Progress, Tabs, Alert, Modal, message, Tooltip, Tag, Collapse } from 'antd';
import {
  MapPin,
  Calendar,
  Heart,
  Package,
  HandHeart,
  ShieldCheck,
  ArrowLeft,
  Share2,
  Users,
  Clock,
  CheckCircle2,
  Copy,
  Sparkles,
  Camera,
  Layers,
  Settings,
  Plus,
  Building,
  Phone,
  Mail,
  Info,
  QrCode,
  Landmark,
  FileCheck2,
  Target,
  Flame,
  HelpCircle,
  TrendingUp,
  Receipt,
  Award,
  ChevronRight,
} from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { Campaign } from '@/types';
import { formatVND, formatDate, calculateProgress } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DetailSkeleton } from '@/components/shared/LoadingSkeleton';
import { CommentSection } from '@/components/shared/CommentSection';
import { Timeline } from '@/components/shared/Timeline';
import { QuickDonateModal } from '@/components/campaigns/QuickDonateModal';
import { QuickVolunteerModal } from '@/components/campaigns/QuickVolunteerModal';
import { AddActivityModal } from '@/components/campaigns/AddActivityModal';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import { useAuthStore } from '@/store/useAuthStore';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuthStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [donationCount, setDonationCount] = useState<number>(0);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [volunteerCount, setVolunteerCount] = useState<number>(0);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchCampaignData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [cData, dData, vData] = await Promise.all([
        campaignService.getById(id),
        campaignService.getCampaignDonations(id, 50).catch(() => ({ donations: [], total: 0 })),
        campaignService.getVolunteers(id).catch(() => ({ volunteers: [], total: 0 })),
      ]);
      setCampaign(cData);
      if (cData.galleryImages && cData.galleryImages.length > 0) {
        setSelectedGalleryImg(cData.galleryImages[0]);
      } else if (cData.bannerImage) {
        setSelectedGalleryImg(cData.bannerImage);
      }
      setDonations(dData.donations || []);
      setDonationCount(dData.total || cData.donationCount || 0);
      setVolunteers(vData.volunteers || []);
      setVolunteerCount(vData.total || cData.volunteerCount || 0);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      message.success('Đã sao chép liên kết chiến dịch!');
    }
  };

  const handleCopyBankAccount = (text: string, label: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      message.success(`Đã sao chép ${label}: ${text}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Alert
          message="Không tìm thấy chiến dịch"
          description={error || 'Chiến dịch không tồn tại hoặc đã bị gỡ bỏ.'}
          type="error"
          showIcon
          className="mb-6 rounded-2xl"
        />
        <Button onClick={() => router.push('/campaigns')} icon={<ArrowLeft className="w-4 h-4" />}>
          Về danh sách chiến dịch
        </Button>
      </div>
    );
  }

  const progress = calculateProgress(campaign.raisedAmount, campaign.targetAmount);

  const now = new Date().getTime();
  const end = new Date(campaign.endDate).getTime();
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const daysLeftText = diffDays > 0 ? `Còn ${diffDays} ngày` : 'Đã kết thúc';

  const isCreator =
    user &&
    ((typeof campaign.createdBy === 'object' && campaign.createdBy?._id === user.id) ||
      campaign.createdBy === user.id);

  const galleryList =
    campaign.galleryImages && campaign.galleryImages.length > 0
      ? campaign.galleryImages
      : campaign.bannerImage
      ? [campaign.bannerImage]
      : [];

  const activeMainImage = selectedGalleryImg || campaign.bannerImage || '';

  // Tab definitions
  const tabItems = [
    {
      key: 'story',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-p-s600" />
          Câu chuyện & Kế hoạch
        </span>
      ),
      children: (
        <div className="space-y-8 pt-3 text-gray-700 leading-relaxed">
          {/* Key Objective Focus Card */}
          <div className="bg-gradient-to-br from-p-s50 via-sec-s50/50 to-white rounded-2xl p-6 border border-p-s200/80 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-p-s950 text-base">
              <Target className="w-5 h-5 text-p-s600" />
              <span>Mục tiêu cốt lõi của chiến dịch</span>
            </div>
            <p className="text-p-s900 font-semibold text-sm leading-relaxed">
              {campaign.goal}
            </p>
            {campaign.impactSummary && (
              <p className="text-xs text-p-s800/90 pt-1 border-t border-p-s200/60">
                {campaign.impactSummary}
              </p>
            )}
          </div>

          {/* Full Narrative Description */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-p-s600" />
              Bối cảnh thực tế & Kế hoạch triển khai
            </h4>
            <div className="prose max-w-none text-gray-700 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 whitespace-pre-line text-sm leading-relaxed">
              {campaign.description}
            </div>
          </div>

          {/* Timeline Milestones Section */}
          {campaign.timeline && campaign.timeline.length > 0 && (
            <Timeline
              title="Lộ trình triển khai theo các giai đoạn (Milestones)"
              icon={<Calendar className="w-4 h-4 text-p-s600" />}
              items={campaign.timeline.map((tl) => ({
                phase: tl.phase,
                title: tl.title,
                date: tl.date,
                description: tl.description,
                status: tl.status as any,
              }))}
            />
          )}

          {/* Donation Guidelines */}
          {campaign.donationGuidelines && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-p-s50/70 p-4 rounded-2xl border border-p-s200/80 space-y-1.5">
                <span className="font-bold text-p-s900 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-p-s600" />
                  Quy định ủng hộ tiền mặt
                </span>
                <p className="text-p-s800 leading-relaxed">
                  {campaign.donationGuidelines.moneyNote ||
                    '100% số tiền ủng hộ được nạp vào quỹ chiến dịch, sao kê tự động theo thời gian thực.'}
                </p>
              </div>

              <div className="bg-sec-s50/70 p-4 rounded-2xl border border-sec-s200/80 space-y-1.5">
                <span className="font-bold text-sec-s900 uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-sec-s600" />
                  Tiêu chuẩn tiếp nhận hiện vật
                </span>
                <p className="text-sec-s800 leading-relaxed">
                  {campaign.donationGuidelines.productNote ||
                    'Hiện vật cần còn dùng tốt (>80%), sạch sẽ, lành lặn để đảm bảo giá trị trao tặng.'}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'transparency',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Receipt className="w-4 h-4 text-p-s600" />
          Sao kê & Ngân sách
        </span>
      ),
      children: (
        <div className="space-y-8 pt-3">
          {/* Official Bank Account & QR Helper Box */}
          {campaign.bankAccount && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-p-s400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-4 h-4" />
                    Tài khoản tiếp nhận minh bạch chính thức
                  </span>
                  <h4 className="text-lg font-black text-white">{campaign.bankAccount.bankName}</h4>
                </div>
                <Tag color="cyan" className="font-bold text-xs px-3 py-1 rounded-full border-0 m-0">
                  Sao kê tự động 24/7
                </Tag>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-700/80 text-sm">
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 block">Số tài khoản thiện nguyện:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-mono font-black text-p-s300">
                      {campaign.bankAccount.accountNumber || '9999REGIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBankAccount(campaign.bankAccount?.accountNumber || '9999REGIVE', 'Số tài khoản')}
                      className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 block">Tên chủ tài khoản:</span>
                  <span className="text-sm font-bold text-white block truncate">
                    {campaign.bankAccount.accountHolder || 'QUY THIEN NGUYEN REGIVE'}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 block">Cú pháp chuyển khoản:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300 truncate">
                      REGIVE {campaign._id.slice(-6).toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyBankAccount(`REGIVE ${campaign._id.slice(-6).toUpperCase()}`, 'Cú pháp chuyển khoản')
                      }
                      className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Breakdown Section */}
          {campaign.budgetBreakdown && campaign.budgetBreakdown.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-p-s600" />
                Kế hoạch phân bổ ngân sách dự kiến (Budget Allocation)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaign.budgetBreakdown.map((b, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <h5 className="font-bold text-gray-900 text-sm">{b.title}</h5>
                      <span className="text-p-s700 font-black text-sm">{b.percentage}%</span>
                    </div>
                    <Progress percent={b.percentage} size="small" strokeColor="#024870" showInfo={false} />
                    <div className="flex justify-between text-xs text-gray-500 pt-1">
                      <span>Dự toán: <strong>{formatVND(b.amount)}</strong></span>
                    </div>
                    {b.description && (
                      <p className="text-[11px] text-gray-500 leading-relaxed pt-1 border-t border-gray-100">
                        {b.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Donors Stream Table */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                Danh sách ủng hộ trực tiếp ({donationCount} lượt)
              </h4>
              <Button
                type="primary"
                size="small"
                onClick={() => setDonateModalOpen(true)}
                className="bg-p-s600 rounded-xl text-xs font-bold"
              >
                + Góp sức ngay
              </Button>
            </div>

            {donations.length === 0 ? (
              <div className="py-12 text-center text-gray-400 bg-slate-50 rounded-2xl border border-slate-100">
                <Heart className="w-8 h-8 mx-auto mb-2 text-rose-300" />
                <p className="text-sm font-medium">Chưa có lượt đóng góp nào được ghi nhận.</p>
                <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên tiếp sức cho chiến dịch ý nghĩa này!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                {donations.map((d, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-p-s100 text-p-s800 flex items-center justify-center font-black text-sm shrink-0">
                        {d.donor?.fullName ? d.donor.fullName.charAt(0) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-bold text-gray-900 text-sm truncate">
                            {d.donor?.fullName || (d.isAnonymous ? 'Nhà hảo tâm ẩn danh' : 'Người hảo tâm')}
                          </h5>
                          {d.isAnonymous && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              Ẩn danh
                            </span>
                          )}
                        </div>
                        {d.note && <p className="text-xs text-gray-500 truncate italic mt-0.5">"{d.note}"</p>}
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {d.createdAt ? formatDate(d.createdAt) : 'Gần đây'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-p-s700 text-sm block">
                        {d.type === 'money'
                          ? formatVND(d.amount)
                          : `${d.productInfo?.quantity || 1} × ${d.productInfo?.name || 'Hiện vật'}`}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {d.type === 'money' ? 'Ủng hộ tiền' : 'Quyên góp hiện vật'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'volunteers',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <HandHeart className="w-4 h-4 text-sky-600" />
          Tình nguyện & Lịch trình ({volunteerCount})
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          {/* Volunteer Condition Notice */}
          <div className="p-6 bg-sky-50/80 rounded-3xl border border-sky-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-sky-950 text-base">
                <Users className="w-5 h-5 text-sky-600" />
                <span>Tiêu chuẩn & Yêu cầu tham gia Đội tình nguyện</span>
              </div>
              <Button
                type="primary"
                onClick={() => setVolunteerModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-700 rounded-xl text-xs font-bold"
              >
                Đăng ký TNV ngay
              </Button>
            </div>
            <p className="text-xs text-sky-900 leading-relaxed whitespace-pre-line">
              {campaign.volunteerConditions ||
                'Ưu tiên các bạn trẻ nhiệt huyết, có sức khỏe tốt, sẵn sàng tham gia công tác phân loại, đóng gói và di chuyển cùng đoàn thực địa.'}
            </p>
          </div>

          {/* Volunteers List */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-gray-900 text-sm">
              Đội ngũ tình nguyện viên đã đăng ký ({volunteers.length})
            </h4>

            {volunteers.length === 0 ? (
              <div className="py-12 text-center text-gray-400 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-8 h-8 mx-auto mb-2 text-sky-300" />
                <p className="text-sm">Chưa có tình nguyện viên nào đăng ký.</p>
                <Button
                  type="primary"
                  onClick={() => setVolunteerModalOpen(true)}
                  className="mt-3 bg-sky-600 rounded-xl text-xs font-bold"
                >
                  Trở thành tình nguyện viên đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {volunteers.map((v, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-gray-900 text-sm">{v.userName}</h5>
                      <p className="text-gray-500">Kỹ năng: {v.skills || 'Hỗ trợ tổng hợp'}</p>
                      {v.schedule?.date && (
                        <span className="text-[11px] text-sky-700 block">
                          Lịch: {formatDate(v.schedule.date)} ({v.schedule.timeSlot || 'Cả ngày'})
                        </span>
                      )}
                    </div>
                    <Tag color="cyan" className="rounded-full text-[10px] border-0 capitalize m-0">
                      {v.status === 'approved' ? 'Đã duyệt' : 'Chờ xác nhận'}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'activities',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Camera className="w-4 h-4 text-p-s600" />
          Nhật ký thực địa ({campaign.activities?.length || 0})
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3">
          {isCreator && (
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setActivityModalOpen(true)}
                className="bg-p-s600 rounded-xl font-bold text-xs"
              >
                + Đăng cập nhật thực địa
              </Button>
            </div>
          )}

          {!campaign.activities || campaign.activities.length === 0 ? (
            <div className="py-12 text-center text-gray-400 bg-slate-50 rounded-2xl border border-slate-100">
              <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Chưa có nhật ký hoạt động nào được cập nhật.</p>
              <p className="text-xs text-gray-400 mt-1">
                Các tình nguyện viên và ban điều phối sẽ cập nhật hình ảnh trực tiếp sau mỗi chuyến công tác.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-p-s200 ml-4 pl-6 space-y-8">
              {campaign.activities.map((act, idx) => (
                <div key={idx} className="relative group">
                  <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-p-s600 border-4 border-white shadow-xs" />
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-base">{act.title}</h4>
                      <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        {act.date ? formatDate(act.date) : 'Gần đây'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{act.content}</p>
                    {act.image && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 max-w-xl">
                        <img
                          src={act.image}
                          alt={act.title}
                          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="text-xs text-p-s800 font-semibold pt-1">
                      Người cập nhật: {act.author || 'Ban điều phối ReGive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'organization',
      label: (
        <span className="flex items-center gap-1.5 font-bold text-sm">
          <Building className="w-4 h-4 text-p-s600" />
          Tổ chức & Hỏi đáp
        </span>
      ),
      children: (
        <div className="space-y-6 pt-3 text-sm">
          {/* Organization details card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-p-s100 text-p-s800 flex items-center justify-center font-black text-lg">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-p-s700 uppercase tracking-wider block">Đơn vị chủ trì</span>
                  <h4 className="text-base font-black text-gray-900">{campaign.organization || 'Ban Điều Hành ReGive'}</h4>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-p-s700 bg-white px-3 py-1.5 rounded-full border border-p-s200 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Đã xác thực pháp lý</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 pt-2 border-t border-gray-200/60">
              {campaign.contactInfo?.representative && (
                <div>
                  <span className="text-gray-400 block">Đại diện ban tổ chức:</span>
                  <span className="font-bold text-gray-800">{campaign.contactInfo.representative}</span>
                </div>
              )}
              {campaign.contactInfo?.phone && (
                <div>
                  <span className="text-gray-400 block">Số điện thoại liên hệ:</span>
                  <span className="font-bold text-gray-800">{campaign.contactInfo.phone}</span>
                </div>
              )}
              {campaign.contactInfo?.email && (
                <div>
                  <span className="text-gray-400 block">Hòm thư tiếp nhận:</span>
                  <span className="font-bold text-gray-800">{campaign.contactInfo.email}</span>
                </div>
              )}
              {campaign.verificationStatus?.licenseNumber && (
                <div>
                  <span className="text-gray-400 block">Số giấy phép / Văn bản phê duyệt:</span>
                  <span className="font-bold text-p-s700">{campaign.verificationStatus.licenseNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* FAQs Accordion */}
          {campaign.faqs && campaign.faqs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-p-s600" />
                Các câu hỏi thường gặp (FAQs)
              </h4>
              <div className="space-y-2">
                {campaign.faqs.map((faq, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
                    <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span className="text-p-s600 font-mono">Q:</span>
                      <span>{faq.question}</span>
                    </h5>
                    <p className="text-xs text-gray-600 leading-relaxed pl-6">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation & Top Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-p-s600 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/campaigns" className="hover:text-p-s600 transition-colors">
            Chiến dịch thiện nguyện
          </Link>
          <span>/</span>
          <span className="capitalize text-gray-400">{campaign.category || 'Cộng đồng'}</span>
          <span>/</span>
          <span className="font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-xs">{campaign.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {isCreator && (
            <Button
              icon={<Settings className="w-3.5 h-3.5" />}
              onClick={() => setEditModalOpen(true)}
              size="small"
              className="rounded-xl border-gray-200 text-gray-700 hover:text-p-s600 text-xs"
            >
              Chỉnh sửa
            </Button>
          )}
          <Button
            icon={<Share2 className="w-3.5 h-3.5" />}
            onClick={() => setShareModalOpen(true)}
            size="small"
            className="rounded-xl border-gray-200 hover:text-p-s600 text-xs"
          >
            Chia sẻ
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Detailed Columns & Right Sticky Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hero Cover, Photo Gallery, Target Items, Deep Tabs (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Visual Banner */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md space-y-4">
            <div className="relative h-72 sm:h-96 w-full flex flex-col justify-end p-6 sm:p-8 text-white overflow-hidden">
              {/* Background cover image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{
                  backgroundImage: activeMainImage
                    ? `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.15) 100%), url(${activeMainImage})`
                    : 'linear-gradient(to tr, #024870, #0aa3d6, #18c9ff)',
                }}
              />

              {/* Top Badges */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-p-s400" />
                  {daysLeftText}
                </span>
                <StatusBadge type="campaign" status={campaign.status} />
              </div>

              {/* Header Details */}
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-p-s100">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Building className="w-3.5 h-3.5 text-p-s300" />
                    <span>{campaign.organization || 'Ban Điều Hành ReGive'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-p-s300" />
                    <span>{campaign.location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-p-s300" />
                    <span>
                      {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
                    </span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  {campaign.title}
                </h1>

                {campaign.shortDescription && (
                  <p className="text-xs sm:text-sm text-p-s100/90 line-clamp-2 leading-relaxed font-normal">
                    {campaign.shortDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Gallery Thumbnails Strip */}
            {galleryList.length > 1 && (
              <div className="px-6 pb-4 flex gap-2.5 overflow-x-auto">
                {galleryList.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedGalleryImg(img)}
                    className={`w-20 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                      activeMainImage === img
                        ? 'border-p-s600 shadow-md ring-2 ring-p-s100 scale-105'
                        : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Impact Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-0.5">
              <span className="text-xs text-gray-400 block font-medium">Đã gây quỹ</span>
              <span className="text-lg sm:text-xl font-black text-p-s700 block">
                {formatVND(campaign.raisedAmount)}
              </span>
              <span className="text-[11px] font-bold text-p-s600 block">{progress}% mục tiêu</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-0.5">
              <span className="text-xs text-gray-400 block font-medium">Người thụ hưởng</span>
              <span className="text-lg sm:text-xl font-black text-sec-s700 block">
                {campaign.beneficiaryCount || 1200}
              </span>
              <span className="text-[11px] text-gray-500 block truncate">
                {campaign.beneficiaryUnit || 'người nhận'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-0.5">
              <span className="text-xs text-gray-400 block font-medium">Lượt ủng hộ</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 block">{donationCount}</span>
              <span className="text-[11px] text-gray-500 block">Tấm lòng sẻ chia</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-0.5">
              <span className="text-xs text-gray-400 block font-medium">Tình nguyện viên</span>
              <span className="text-lg sm:text-xl font-black text-sky-600 block">{volunteerCount}</span>
              <span className="text-[11px] text-gray-500 block">Đã tham gia</span>
            </div>
          </div>

          {/* Target In-Kind Items Needed Section */}
          {campaign.targetItems && campaign.targetItems.length > 0 && (
            <div className="bg-sec-s50/70 border border-sec-s200/80 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-sec-s700" />
                  <h3 className="font-black text-base text-sec-s950">
                    Vật phẩm hiện vật đang kêu gọi ({campaign.targetItems.length})
                  </h3>
                </div>
                <Link href={`/campaigns/${campaign._id}/donate-product`}>
                  <Button
                    type="primary"
                    size="small"
                    className="bg-sec-s700 hover:bg-sec-s800 rounded-xl text-xs font-bold"
                  >
                    Ủng hộ đồ ngay
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {campaign.targetItems.map((item, idx) => {
                  const itemProgress = item.targetQty
                    ? Math.min(100, Math.round((item.receivedQty / item.targetQty) * 100))
                    : 0;
                  return (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-sec-s100 shadow-xs space-y-2">
                      <div className="flex justify-between items-baseline font-bold text-xs text-gray-800">
                        <span className="truncate pr-2">{item.name}</span>
                        <span className="text-sec-s700 font-mono shrink-0">
                          {item.receivedQty} / {item.targetQty} {item.unit}
                        </span>
                      </div>
                      <Progress percent={itemProgress} size="small" strokeColor="#18c9ff" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deep Tabs Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <Tabs defaultActiveKey="story" size="large" items={tabItems} className="custom-campaign-tabs" />
          </div>
        </div>

        {/* Right Column: Sticky Donation & Quick Action Card (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5 sticky top-24">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Tiến độ gây quỹ
                </span>
                <span className="text-xs font-semibold text-p-s700 bg-p-s50 px-2.5 py-0.5 rounded-full border border-p-s200">
                  {donationCount} lượt ủng hộ
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <span className="text-3xl font-black text-p-s700">
                  {formatVND(campaign.raisedAmount)}
                </span>
                <span className="text-base font-extrabold text-gray-700">{progress}%</span>
              </div>

              <Progress
                percent={progress}
                showInfo={false}
                strokeColor={{ '0%': '#024870', '100%': '#18c9ff' }}
                className="mt-2"
              />

              <div className="flex justify-between items-center text-xs text-gray-500 mt-2 font-medium">
                <span>Mục tiêu: {formatVND(campaign.targetAmount)}</span>
                <span className="text-p-s800 font-bold">100% minh bạch</span>
              </div>
            </div>

            {/* Quick Action CTA Buttons — chỉ mở ủng hộ khi chiến dịch đang hoạt động */}
            <div className="space-y-3 pt-1">
              {campaign.status === 'active' ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<Heart className="w-4 h-4 fill-white" />}
                    onClick={() => setDonateModalOpen(true)}
                    className="w-full h-14 rounded-2xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-base shadow-xl shadow-p-s600/25 transition-all"
                  >
                    Ủng hộ tiền trực tuyến
                  </Button>

                  <Link href={`/campaigns/${campaign._id}/donate-product`} className="block">
                    <Button
                      size="large"
                      icon={<Package className="w-4 h-4 text-sec-s600" />}
                      className="w-full h-12 rounded-xl border border-sec-s200 hover:border-sec-s500 text-sec-s800 font-bold text-sm bg-sec-s50/50 hover:bg-sec-s50 transition-all"
                    >
                      Ủng hộ hiện vật (Đồ cũ/Mới)
                    </Button>
                  </Link>

                  <Button
                    size="large"
                    icon={<HandHeart className="w-4 h-4 text-sky-600" />}
                    onClick={() => setVolunteerModalOpen(true)}
                    className="w-full h-12 rounded-xl border border-sky-200 hover:border-sky-500 text-sky-800 font-bold text-sm bg-sky-50/50 hover:bg-sky-50 transition-all"
                  >
                    Đăng ký Tình nguyện viên
                  </Button>
                </>
              ) : (
                <Alert
                  type={campaign.status === 'cancelled' ? 'error' : 'info'}
                  showIcon
                  message={
                    campaign.status === 'closed'
                      ? 'Chiến dịch đã kết thúc — cảm ơn bạn đã đồng hành cùng ReGive.'
                      : campaign.status === 'cancelled'
                        ? 'Chiến dịch đã bị huỷ và không nhận ủng hộ mới.'
                        : 'Chiến dịch đang ở trạng thái nháp, chưa mở nhận ủng hộ.'
                  }
                />
              )}
            </div>

            {/* Micro reassurance badges */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-p-s600 shrink-0" />
                <span>Số tiền chuyển 100% đến đối tượng thụ hưởng.</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-p-s600 shrink-0" />
                <span>Tự động xuất biên lai điện tử & lịch sử giao dịch.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Comments */}
      <CommentSection targetType="campaign" targetId={campaign._id} />

      {/* Share Modal */}
      <Modal
        title="Chia sẻ chiến dịch thiện nguyện"
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        footer={null}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Hãy lan tỏa thông điệp của chiến dịch này đến bạn bè và người thân để cùng chung tay giúp đỡ những hoàn cảnh khó khăn:
          </p>

          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl border border-gray-200">
            <span className="text-xs text-gray-700 truncate flex-1 font-mono">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </span>
            <Button
              type="primary"
              size="small"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
              className="bg-p-s600 hover:bg-p-s700 rounded-lg text-xs font-bold"
            >
              Sao chép
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Donate Modal */}
      <QuickDonateModal
        campaign={campaign}
        open={donateModalOpen}
        onClose={() => setDonateModalOpen(false)}
      />

      {/* Quick Volunteer Modal */}
      <QuickVolunteerModal
        campaign={campaign}
        open={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
        onSuccess={() => fetchCampaignData()}
      />

      {/* Add Field Activity Modal */}
      <AddActivityModal
        campaign={campaign}
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSuccess={(updated) => setCampaign(updated)}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        campaign={campaign}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(updated) => setCampaign(updated)}
      />
    </div>
  );
}
