'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Alert } from 'antd';
import { Calendar, MapPin, Clock, RefreshCw, Eye } from 'lucide-react';
import { volunteerService } from '@/services/volunteerService';
import { VolunteerRegistration } from '@/types';
import { formatDate } from '@/lib/format';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function MyVolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await volunteerService.getMyRegistrations();
      setVolunteers(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đăng ký tình nguyện');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  return (
    <DashboardLayout
      title="Đăng Ký Tình Nguyện"
      subtitle="Theo dõi trạng thái xét duyệt và lịch phân công tình nguyện của bạn"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchVolunteers}>
            Làm mới
          </Button>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        {loading ? (
          <TableSkeleton rows={4} />
        ) : volunteers.length === 0 ? (
          <EmptyState
            title="Chưa có đăng ký tình nguyện nào"
            description="Hãy tham gia đóng góp sức trẻ và kỹ năng cùng các chiến dịch ReGive."
            actionText="Xem các chiến dịch cần tình nguyện viên"
            actionHref="/campaigns"
          />
        ) : (
          <div className="space-y-4">
            {volunteers.map((v) => {
              const campaignTitle =
                typeof v.campaign === 'object' && v.campaign?.title
                  ? v.campaign.title
                  : 'Chiến dịch thiện nguyện';

              const isApproved = v.status === 'approved';

              return (
                <div
                  key={v._id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{campaignTitle}</h4>
                      <span className="text-xs text-gray-400">
                        Ngày đăng ký: {formatDate(v.createdAt)}
                      </span>
                    </div>
                    <StatusBadge type="volunteer" status={v.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-gray-400 block mb-1">Kỹ năng đăng ký:</span>
                      <p className="font-medium text-gray-800">{v.skills || 'Không ghi rõ'}</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <span className="text-gray-400 block mb-1">Lịch rảnh có thể tham gia:</span>
                      <p className="font-medium text-gray-800">{v.availabilityNote || 'Không ghi rõ'}</p>
                    </div>
                  </div>

                  {/* Schedule Card if Approved */}
                  {isApproved && v.schedule && (v.schedule.date || v.schedule.location) && (
                    <div className="p-4 rounded-xl bg-p-s50/70 border border-p-s200 text-xs text-p-s950 space-y-2">
                      <span className="font-bold uppercase tracking-wider text-[11px] text-p-s800 block">
                        Lịch phân công tình nguyện chính thức:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {v.schedule.date && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-p-s600 shrink-0" />
                            <span>Ngày: {formatDate(v.schedule.date)}</span>
                          </div>
                        )}
                        {v.schedule.timeSlot && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-p-s600 shrink-0" />
                            <span>Khung giờ: {v.schedule.timeSlot}</span>
                          </div>
                        )}
                        {v.schedule.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-p-s600 shrink-0" />
                            <span>Địa điểm: {v.schedule.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex justify-end">
                    <Link href={`/me/volunteers/${v._id}`}>
                      <Button
                        size="small"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="rounded-lg text-xs"
                      >
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
