import { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { donationApi, productApi } from '../api/client';
import {
  Badge,
  Card,
  DataState,
  FilterSelect,
  PageHeader,
  Select,
  Table,
  TableSkeleton,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { DONATION_STATUSES, LABELS } from '../lib/constants';
import { displayName, formatDate, formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

export default function DonationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const { data, loading, error, reload } = useAsync(
    () => donationApi.list({ status, type }),
    [status, type]
  );
  const donations = data?.data?.donations || [];
  const [busy, setBusy] = useState('');

  async function changeStatus(row, next) {
    setBusy(oid(row));
    try {
      await donationApi.updateStatus(oid(row), next);
      toast.success('Đã cập nhật trạng thái quyên góp');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function intake(row) {
    setBusy(oid(row));
    try {
      const res = await productApi.intake({ donationId: oid(row) });
      toast.success('Đã tạo sản phẩm từ quyên góp');
      navigate(`/products/${oid(res.data.product)}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Quyên góp"
        title="Quyên góp"
        description="Xử lý quyên góp tiền/sản phẩm. Sản phẩm có thể intake vào kho để đánh giá."
      />
      <div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <FilterSelect
          label="Lọc theo trạng thái quyên góp"
          value={status}
          onChange={setStatus}
          options={DONATION_STATUSES.map((s) => ({ value: s, label: LABELS.donation[s] }))}
        />
        <FilterSelect
          label="Lọc theo loại quyên góp"
          value={type}
          onChange={setType}
          options={[
            { value: 'money', label: 'Tiền' },
            { value: 'product', label: 'Sản phẩm' },
          ]}
        />
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!donations.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={5} columns={7} />}
        emptyTitle="Không có khoản quyên góp"
        emptyDescription="Quyên góp tiền và sản phẩm sẽ xuất hiện tại đây."
      >
        <Card>
          <Table
            label="Danh sách quyên góp"
            rowKey={(row) => oid(row)}
            rows={donations}
            columns={[
              {
                key: 'donor',
                header: 'Người tặng',
                render: (row) => (
                  <div>
                    <p className="font-medium">{displayName(row.donor)}</p>
                    <p className="text-xs text-ink/50">{row.donor?.email}</p>
                  </div>
                ),
              },
              { key: 'campaign', header: 'Chiến dịch', render: (row) => row.campaign?.title || '—' },
              {
                key: 'type',
                header: 'Loại',
                render: (row) => <Badge value={row.type} map={LABELS.donationType} />,
              },
              {
                key: 'detail',
                header: 'Chi tiết',
                render: (row) =>
                  row.type === 'money'
                    ? formatVnd(row.amount)
                    : `${row.productInfo?.name || 'SP'} × ${row.productInfo?.quantity || 1}`,
              },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (row) => <Badge value={row.status} map={LABELS.donation} />,
              },
              { key: 'at', header: 'Ngày', render: (row) => formatDate(row.createdAt) },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <div className="flex min-w-52 flex-col gap-2">
                    <Select
                      aria-label={`Trạng thái quyên góp của ${displayName(row.donor)}`}
                      value={row.status}
                      disabled={busy === oid(row)}
                      onChange={(e) => changeStatus(row, e.target.value)}
                    >
                      {DONATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {LABELS.donation[s]}
                        </option>
                      ))}
                    </Select>
                    {row.type === 'product' && row.status !== 'rejected' ? (
                      <button
                        type="button"
                        onClick={() => intake(row)}
                        disabled={busy === oid(row)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-forest hover:bg-ink/5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                      >
                        <PackagePlus size={16} />
                        Intake sản phẩm
                      </button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </DataState>
    </div>
  );
}
