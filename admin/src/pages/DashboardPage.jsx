import { Link } from 'react-router-dom';
import { reportApi } from '../api/client';
import { Badge, Card, EmptyState, ErrorBox, PageHeader, Skeleton, StatCard, Table } from '../components/ui';
import { useAsync } from '../lib/hooks';
import { LABELS } from '../lib/constants';
import { displayName, formatDate, formatVnd, oid } from '../lib/format';

const linkClass =
  'rounded text-sm text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss';

function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-3xl" />
      <Skeleton className="h-56 rounded-3xl" />
      <span className="sr-only">Đang tải báo cáo…</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => reportApi.overview(), []);
  const overview = data?.data;

  return (
    <div>
      <PageHeader
        eyebrow="Báo cáo"
        title="Tổng quan vận hành"
        description="Doanh thu marketplace, quyên góp tiền, tồn kho thấp và hoạt động gần đây."
      />

      {loading ? <DashboardSkeleton /> : null}
      <ErrorBox error={error} onRetry={reload} />
      {!loading && !error && !overview ? (
        <EmptyState title="Chưa có dữ liệu báo cáo" description="Báo cáo sẽ xuất hiện khi hệ thống có hoạt động." />
      ) : null}
      {!loading && overview ? <DashboardContent overview={overview} /> : null}
    </div>
  );
}

function DashboardContent({ overview }) {
  const { summary, recentOrders, recentPayments, recentStockMoves } = overview;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doanh thu bán hàng" value={formatVnd(summary.orderRevenue)} hint="Thanh toán đơn thành công" />
        <StatCard label="Quyên góp tiền" value={formatVnd(summary.donationRevenue)} hint={`${summary.moneyDonationsCompleted} khoản hoàn tất`} />
        <StatCard label="Đơn chờ xử lý" value={summary.ordersPending} hint={`${summary.ordersPaid} đơn đã thanh toán/xử lý`} />
        <StatCard label="Tồn kho thấp" value={summary.lowStock} hint={`${summary.listedProducts}/${summary.totalProducts} SP đang bán`} />
      </div>

      <div className="mt-6 space-y-4">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Đơn gần đây</h2>
            <Link aria-label="Xem tất cả đơn hàng" className={linkClass} to="/orders">
              Xem tất cả
            </Link>
          </div>
          {recentOrders?.length ? (
            <Table
              compact
              label="Đơn hàng gần đây"
              rowKey={(row) => oid(row)}
              rows={recentOrders}
              columns={[
                {
                  key: 'order',
                  header: 'Mã',
                  render: (row) => (
                    <Link
                      aria-label={`Xem đơn hàng ${row.orderCode}`}
                      className="rounded font-medium text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                      to="/orders"
                    >
                      {row.orderCode}
                    </Link>
                  ),
                },
                {
                  key: 'buyer',
                  header: 'Người mua',
                  render: (row) => displayName(row.buyer),
                },
                {
                  key: 'status',
                  header: 'Trạng thái',
                  render: (row) => <Badge value={row.status} map={LABELS.order} />,
                },
                {
                  key: 'total',
                  header: 'Tổng',
                  render: (row) => formatVnd(row.totalAmount),
                },
                {
                  key: 'at',
                  header: 'Ngày',
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-ink/50">Chưa có đơn.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Thanh toán</h2>
            <Link aria-label="Xem tất cả thanh toán" className={linkClass} to="/payments">
              Xem tất cả
            </Link>
          </div>
          {recentPayments?.length ? (
            <Table
              compact
              label="Thanh toán gần đây"
              rowKey={(row) => oid(row)}
              rows={recentPayments}
              columns={[
                { key: 'code', header: 'Mã', render: (row) => row.paymentCode },
                { key: 'payer', header: 'Người trả', render: (row) => displayName(row.payer) },
                { key: 'purpose', header: 'Loại', render: (row) => <Badge value={row.purpose} map={LABELS.purpose} /> },
                { key: 'amount', header: 'Số tiền', render: (row) => formatVnd(row.amount) },
                { key: 'at', header: 'Lúc', render: (row) => formatDate(row.paidAt) },
              ]}
            />
          ) : (
            <p className="text-sm text-ink/50">Chưa có thanh toán.</p>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">Kho gần đây</h2>
            <Link aria-label="Xem tất cả giao dịch kho" className={linkClass} to="/inventory">
              Xem tất cả
            </Link>
          </div>
          {recentStockMoves?.length ? (
            <Table
              compact
              label="Giao dịch kho gần đây"
              rowKey={(row) => oid(row)}
              rows={recentStockMoves}
              columns={[
                { key: 'product', header: 'Sản phẩm', render: (row) => row.product?.name || '—' },
                { key: 'type', header: 'Loại', render: (row) => <Badge value={row.type} map={LABELS.inventory} /> },
                { key: 'qty', header: 'Thay đổi', render: (row) => `${row.previousStock} → ${row.newStock}` },
                { key: 'reason', header: 'Lý do', render: (row) => row.reason || '—' },
                { key: 'at', header: 'Lúc', render: (row) => formatDate(row.createdAt) },
              ]}
            />
          ) : (
            <p className="text-sm text-ink/50">Chưa có giao dịch kho.</p>
          )}
        </Card>
      </div>
    </>
  );
}
