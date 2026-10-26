'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Alert, Tag, message } from 'antd';
import { RefreshCw, CheckCircle, MessageSquare, Eye } from 'lucide-react';
import { supportService } from '@/services/supportService';
import { SupportRequest } from '@/types';
import { formatDate } from '@/lib/format';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function MySupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supportService.getMyRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách yêu cầu hỗ trợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmReceived = async (id: string) => {
    try {
      setConfirmingId(id);
      const updated = await supportService.confirmReceived(id);
      message.success('Đã xác nhận nhận hỗ trợ thành công. Cảm ơn bạn!');
      setRequests((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (err: any) {
      message.error(err.message || 'Xác nhận thất bại');
    } finally {
      setConfirmingId(null);
    }
  };

  const getUrgencyTag = (urgency: string) => {
    if (urgency === 'high') return <Tag color="error">Cấp thiết cao</Tag>;
    if (urgency === 'medium') return <Tag color="warning">Trung bình</Tag>;
    return <Tag color="default">Thấp</Tag>;
  };

  return (
    <DashboardLayout
      title="Yêu Cầu Hỗ Trợ Của Tôi"
      subtitle="Theo dõi quá trình thẩm định, điều phối nguồn lực và xác nhận nhận hỗ trợ"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/support/new">
            <Button type="primary" className="bg-p-s600 rounded-xl">
              + Tạo yêu cầu mới
            </Button>
          </Link>

          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchRequests}>
            Làm mới
          </Button>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        {loading ? (
          <TableSkeleton rows={4} />
        ) : requests.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu hỗ trợ nào"
            description="Nếu gia đình bạn hoặc người thân đang gặp khó khăn, hãy gửi yêu cầu để ReGive hỗ trợ."
            actionText="Gửi yêu cầu hỗ trợ ngay"
            actionHref="/support/new"
          />
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const canConfirm =
                ['approved', 'in_progress', 'completed'].includes(r.status) &&
                !r.receivedConfirmed;

              return (
                <div
                  key={r._id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getUrgencyTag(r.urgency)}
                        <StatusBadge type="support" status={r.status} />
                        <span className="text-xs text-gray-400 font-mono">#{r._id.slice(-6)}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">{r.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <span className="text-xs text-gray-400">
                        Ngày gửi: {formatDate(r.createdAt)}
                      </span>
                      <Link href={`/me/support-requests/${r._id}`}>
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

                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {r.description}
                  </p>

                  {/* Staff Review Note if any */}
                  {r.reviewNote && (
                    <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                        <span>Phản hồi từ điều phối viên:</span>
                      </div>
                      <p>{r.reviewNote}</p>
                    </div>
                  )}

                  {/* Confirm Received action */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
                    {r.receivedConfirmed ? (
                      <div className="flex items-center gap-1.5 text-xs text-p-s700 font-semibold">
                        <CheckCircle className="w-4 h-4 text-p-s600" />
                        <span>Bạn đã xác nhận đã nhận hỗ trợ ({formatDate(r.receivedAt)})</span>
                      </div>
                    ) : canConfirm ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full justify-between">
                        <span className="text-xs text-gray-500">
                          Bạn đã nhận được sự hỗ trợ từ chiến dịch này chưa?
                        </span>
                        <Button
                          type="primary"
                          loading={confirmingId === r._id}
                          onClick={() => handleConfirmReceived(r._id)}
                          className="bg-p-s600 rounded-xl font-bold text-xs"
                        >
                          Xác nhận đã nhận hỗ trợ
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        Hồ sơ đang trong quá trình xét duyệt của ban điều phối.
                      </span>
                    )}
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
