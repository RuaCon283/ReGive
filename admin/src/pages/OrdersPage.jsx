import { useState } from 'react';
import { orderApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  DataState,
  Field,
  FilterSelect,
  Modal,
  PageHeader,
  Table,
  TableSkeleton,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { LABELS, ORDER_NEXT } from '../lib/constants';
import { displayName, formatDate, formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

export default function OrdersPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => orderApi.list({ status }), [status]);
  const orders = data?.data?.orders || [];
  const [current, setCurrent] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');

  async function changeStatus(order, next) {
    setSaving(next);
    try {
      await orderApi.updateStatus(oid(order), { status: next, note });
      toast.success('Đã cập nhật đơn hàng');
      setCurrent(null);
      setNote('');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving('');
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Vận hành"
        title="Đơn hàng"
        description="Chỉ chuyển trạng thái hợp lệ: paid → processing → shipped → completed. Huỷ khi pending/paid/processing."
      />
      <div className="mb-4 max-w-xs">
        <FilterSelect
          label="Lọc theo trạng thái đơn hàng"
          value={status}
          onChange={setStatus}
          options={Object.entries(LABELS.order).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        isEmpty={!orders.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} columns={7} />}
        emptyTitle="Chưa có đơn hàng"
        emptyDescription="Đơn hàng sẽ xuất hiện khi người dùng đặt mua sản phẩm."
      >
        <Card>
          <Table
            label="Danh sách đơn hàng"
            rowKey={(row) => oid(row)}
            rows={orders}
            columns={[
              { key: 'code', header: 'Mã', render: (row) => <span className="font-medium">{row.orderCode}</span> },
              {
                key: 'buyer',
                header: 'Người mua',
                render: (row) => (
                  <div>
                    <p>{displayName(row.buyer)}</p>
                    <p className="text-xs text-ink/50">{row.phone || row.buyer?.phone}</p>
                  </div>
                ),
              },
              {
                key: 'items',
                header: 'SP',
                render: (row) => row.items?.map((i) => `${i.name} × ${i.quantity}`).join(', '),
              },
              { key: 'total', header: 'Tổng', render: (row) => formatVnd(row.totalAmount) },
              { key: 'status', header: 'Trạng thái', render: (row) => <Badge value={row.status} map={LABELS.order} /> },
              { key: 'at', header: 'Ngày', render: (row) => formatDate(row.createdAt) },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrent(row);
                      setNote(''); // reset note để không dính ghi chú của đơn trước
                    }}
                  >
                    Cập nhật
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </DataState>

      <Modal open={Boolean(current)} title={current ? `Đơn ${current.orderCode}` : ''} onClose={() => setCurrent(null)}>
        {current ? (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">
              {displayName(current.buyer)} · {current.shippingAddress || 'Chưa có địa chỉ'}
            </p>
            <p className="text-sm">
              Hiện tại: <Badge value={current.status} map={LABELS.order} />
            </p>
            <Field label="Ghi chú">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {(ORDER_NEXT[current.status] || []).map((next) => (
                <Button
                  key={next}
                  variant={next === 'cancelled' ? 'danger' : 'primary'}
                  disabled={Boolean(saving)}
                  loading={saving === next}
                  onClick={() => changeStatus(current, next)}
                >
                  {LABELS.order[next]}
                </Button>
              ))}
              {!ORDER_NEXT[current.status]?.length ? (
                <p className="text-sm text-ink/50">Không còn bước chuyển trạng thái.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
