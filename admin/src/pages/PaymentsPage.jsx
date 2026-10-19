import { useState } from 'react';
import { paymentApi } from '../api/client';
import { Badge, Card, DataState, FilterSelect, PageHeader, Table, TableSkeleton } from '../components/ui';
import { LABELS } from '../lib/constants';
import { displayName, formatDate, formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

export default function PaymentsPage() {
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const { data, loading, error, reload } = useAsync(() => paymentApi.list({ status, purpose }), [status, purpose]);
  const payments = data?.data?.payments || [];

  return (
    <div>
      <PageHeader
        eyebrow="Tài chính"
        title="Thanh toán"
        description="Sandbox gateway. Nhân sự xem toàn bộ giao dịch đơn hàng và quyên góp tiền."
      />
      <div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <FilterSelect
          label="Lọc theo trạng thái thanh toán"
          value={status}
          onChange={setStatus}
          options={Object.entries(LABELS.payment).map(([value, label]) => ({ value, label }))}
        />
        <FilterSelect
          label="Lọc theo loại thanh toán"
          value={purpose}
          onChange={setPurpose}
          options={Object.entries(LABELS.purpose).map(([value, label]) => ({ value, label }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        isEmpty={!payments.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} columns={7} />}
        emptyTitle="Chưa có thanh toán"
        emptyDescription="Giao dịch sẽ xuất hiện khi có đơn hàng hoặc quyên góp tiền."
      >
        <Card>
          <Table
            label="Danh sách thanh toán"
            rowKey={(row) => oid(row) || row.paymentCode}
            rows={payments}
            columns={[
              { key: 'code', header: 'Mã', render: (row) => <span className="font-medium">{row.paymentCode}</span> },
              { key: 'payer', header: 'Người trả', render: (row) => displayName(row.payer) },
              { key: 'purpose', header: 'Loại', render: (row) => <Badge value={row.purpose} map={LABELS.purpose} /> },
              { key: 'amount', header: 'Số tiền', render: (row) => formatVnd(row.amount) },
              { key: 'status', header: 'TT', render: (row) => <Badge value={row.status} map={LABELS.payment} /> },
              {
                key: 'ref',
                header: 'Tham chiếu',
                render: (row) => row.order?.orderCode || (row.donation ? 'Donation' : '—'),
              },
              { key: 'at', header: 'Lúc', render: (row) => formatDate(row.paidAt || row.createdAt) },
            ]}
          />
        </Card>
      </DataState>
    </div>
  );
}
