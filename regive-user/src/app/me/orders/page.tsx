'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Alert, Modal, Input, message } from 'antd';
import { Package, RefreshCw, Eye, CreditCard, MapPin, XCircle } from 'lucide-react';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/format';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handlePayOrder = async (orderId: string) => {
    try {
      setPayingId(orderId);
      const payment = await paymentService.create({
        purpose: 'order',
        orderId,
      });
      const paymentId = payment.id || payment._id;
      window.location.href = payment.checkoutUrl || `/payments/${paymentId}/checkout`;
    } catch (err: any) {
      setError(err.message || 'Không thể tạo phiên thanh toán cho đơn hàng');
      setPayingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCancellingId(orderToCancel._id);
      await orderService.cancelOrder(orderToCancel._id, cancelReason);
      message.success('Đã hủy đơn hàng thành công');
      setCancelModalOpen(false);
      setOrderToCancel(null);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      message.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Đơn Hàng Marketplace"
      subtitle="Theo dõi quá trình giao nhận, lịch sử vận chuyển và trạng thái thanh toán các vật phẩm bạn đã mua"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchOrders} className="rounded-xl">
            Làm mới
          </Button>
        </div>

        {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

        {loading ? (
          <TableSkeleton rows={4} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Hãy ủng hộ quỹ bằng cách mua sắm các vật phẩm tuần hoàn trên Marketplace."
            actionText="Đến Chợ vật phẩm"
            actionHref="/marketplace"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o._id}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {o.orderCode}
                    </span>
                    <span className="text-xs text-gray-400">• {formatDate(o.createdAt)}</span>
                  </div>
                  <StatusBadge type="order" status={o.status} />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-p-s600" />
                        <span className="font-bold">{item.name}</span>
                        <span className="text-gray-400">× {item.quantity}</span>
                      </div>
                      <span className="font-bold text-p-s800">{formatVND(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping address & Total */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>Giao tới: {o.shippingAddress || 'Chưa cung cấp'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-gray-400 mr-2">Tổng tiền:</span>
                      <span className="text-base font-black text-p-s700">
                        {formatVND(o.totalAmount)}
                      </span>
                    </div>

                    {o.status === 'pending' && (
                      <>
                        <Button
                          type="primary"
                          size="small"
                          loading={payingId === o._id}
                          icon={<CreditCard className="w-3.5 h-3.5" />}
                          onClick={() => handlePayOrder(o._id)}
                          className="bg-p-s600 rounded-lg text-xs"
                        >
                          Thanh toán
                        </Button>
                        <Button
                          danger
                          size="small"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setOrderToCancel(o);
                            setCancelModalOpen(true);
                          }}
                          className="rounded-lg text-xs"
                        >
                          Hủy đơn
                        </Button>
                      </>
                    )}

                    <Link href={`/me/orders/${o._id}`}>
                      <Button
                        size="small"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="rounded-lg text-xs"
                      >
                        Chi tiết & Tiến độ
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Order Modal */}
        <Modal
          title="Xác Nhận Hủy Đơn Hàng"
          open={cancelModalOpen}
          onCancel={() => {
            setCancelModalOpen(false);
            setOrderToCancel(null);
          }}
          onOk={handleConfirmCancel}
          confirmLoading={Boolean(cancellingId)}
          okText="Xác nhận hủy"
          cancelText="Đóng"
          okButtonProps={{ danger: true, className: 'rounded-xl' }}
          cancelButtonProps={{ className: 'rounded-xl' }}
        >
          <div className="py-2 space-y-3 text-sm text-gray-600">
            <p>
              Bạn có chắc chắn muốn hủy đơn hàng{' '}
              <strong className="font-mono text-gray-900">{orderToCancel?.orderCode}</strong> không?
            </p>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Lý do hủy đơn (không bắt buộc):
              </label>
              <Input.TextArea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do đổi ý hoặc muốn thay đổi số lượng..."
                className="!rounded-xl"
              />
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
