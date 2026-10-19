import { useState } from 'react';
import { Ban, Rocket, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productApi } from '../api/client';
import {
  Badge,
  Card,
  ConfirmDialog,
  DataState,
  FilterSelect,
  PageHeader,
  Table,
  TableSkeleton,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { LABELS, PRODUCT_STATUSES } from '../lib/constants';
import { formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

export default function ProductsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => productApi.list({ status }), [status]);
  const products = data?.data?.products || [];
  const [busy, setBusy] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await productApi.remove(oid(deleting));
      toast.success('Đã xoá sản phẩm');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function togglePublish(row) {
    setBusy(oid(row));
    try {
      if (row.listedOnMarketplace) await productApi.unpublish(oid(row));
      else await productApi.publish(oid(row));
      toast.success(row.listedOnMarketplace ? 'Đã gỡ khỏi marketplace' : 'Đã đăng marketplace');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Sản phẩm"
        title="Sản phẩm"
        description="Intake → đánh giá (thủ công hoặc AI) → nhập kho → publish. AI không tự đăng bán."
      />
      <div className="mb-4 max-w-xs">
        <FilterSelect
          label="Lọc theo trạng thái sản phẩm"
          value={status}
          onChange={setStatus}
          options={PRODUCT_STATUSES.map((s) => ({ value: s, label: LABELS.product[s] }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        isEmpty={!products.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} columns={8} />}
        emptyTitle="Chưa có sản phẩm"
        emptyDescription="Sản phẩm được tạo từ quyên góp đã tiếp nhận."
      >
        <Card>
          <Table
            label="Danh sách sản phẩm"
            rowKey={(row) => oid(row)}
            rows={products}
            columns={[
              {
                key: 'name',
                header: 'Sản phẩm',
                render: (row) => (
                  <Link
                    aria-label={`Xem chi tiết sản phẩm ${row.name}`}
                    className="rounded font-medium text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                    to={`/products/${oid(row)}`}
                  >
                    {row.name}
                  </Link>
                ),
              },
              { key: 'category', header: 'Danh mục' },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (row) => <Badge value={row.status} map={LABELS.product} />,
              },
              {
                key: 'condition',
                header: 'Tình trạng',
                render: (row) => <Badge value={row.condition} map={LABELS.condition} />,
              },
              { key: 'stock', header: 'Tồn', render: (row) => row.stockQuantity },
              { key: 'price', header: 'Giá', render: (row) => formatVnd(row.price) },
              {
                key: 'market',
                header: 'Marketplace',
                render: (row) => (row.listedOnMarketplace ? 'Đang bán' : 'Chưa đăng'),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublish(row)}
                      disabled={busy === oid(row)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${
                        row.listedOnMarketplace ? 'text-rose hover:bg-rose/10' : 'text-moss hover:bg-ink/5'
                      }`}
                    >
                      {row.listedOnMarketplace ? <Ban size={16} /> : <Rocket size={16} />}
                      {row.listedOnMarketplace ? 'Gỡ bán' : 'Đăng bán'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(row)}
                      title="Xoá sản phẩm"
                      aria-label="Xoá sản phẩm"
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose hover:bg-rose/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
                    >
                      <Trash2 size={16} />
                      Xoá
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </DataState>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá sản phẩm"
        description={
          deleting
            ? `Xoá sản phẩm "${deleting.name}"? Hành động này không thể hoàn tác. Sản phẩm đang bán hoặc đã có đơn hàng sẽ bị chặn xoá.`
            : ''
        }
        confirmLabel="Xoá"
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
