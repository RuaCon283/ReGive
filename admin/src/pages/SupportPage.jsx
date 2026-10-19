import { useState } from 'react';
import { SquarePen } from 'lucide-react';
import { supportApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  DataState,
  Field,
  FilterSelect,
  Modal,
  PageHeader,
  Select,
  Table,
  TableSkeleton,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { LABELS, SUPPORT_STATUSES } from '../lib/constants';
import { displayName, formatDate, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

const URGENCY = { low: 'Thầp', medium: 'Trung bình', high: 'Cao' };

export default function SupportPage() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => supportApi.list({ status }), [status]);
  const rows = data?.data?.supportRequests || [];
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({ status: 'approved', reviewNote: '' });
  const [saving, setSaving] = useState(false);

  function openReview(row) {
    setCurrent(row);
    setForm({ status: row.status, reviewNote: row.reviewNote || '' });
  }

  async function onReview(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await supportApi.review(oid(current), form);
      toast.success('Đã cập nhật yêu cầu hỗ trợ');
      setCurrent(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Hỗ trợ"
        title="Yêu cầu hỗ trợ"
        description="Duyệt hồ sơ người thụ hưởng. Không lộ dữ liệu nhạy cảm ra ngoài phạm vi nhân sự."
      />
      <div className="mb-4 max-w-xs">
        <FilterSelect
          label="Lọc theo trạng thái yêu cầu"
          value={status}
          onChange={setStatus}
          options={SUPPORT_STATUSES.map((s) => ({ value: s, label: LABELS.support[s] }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        isEmpty={!rows.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={5} columns={6} />}
        emptyTitle="Chưa có yêu cầu hỗ trợ"
        emptyDescription="Yêu cầu từ người thụ hưởng sẽ xuất hiện tại đây."
      >
        <Card>
          <Table
            label="Danh sách yêu cầu hỗ trợ"
            rowKey={(row) => oid(row)}
            rows={rows}
            columns={[
              {
                key: 'beneficiary',
                header: 'Người thụ hưởng',
                render: (row) => (
                  <div>
                    <p className="font-medium">{displayName(row.beneficiary)}</p>
                    <p className="text-xs text-ink/50">
                      {row.beneficiary?.phone || row.beneficiary?.email}
                      {row.beneficiary?.beneficiaryInfo?.householdSize
                        ? ` · ${row.beneficiary.beneficiaryInfo.householdSize} người`
                        : ''}
                    </p>
                  </div>
                ),
              },
              {
                key: 'title',
                header: 'Yêu cầu',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="line-clamp-2 text-xs text-ink/55">{row.description}</p>
                  </div>
                ),
              },
              { key: 'urgency', header: 'Mức độ', render: (row) => URGENCY[row.urgency] || row.urgency },
              { key: 'status', header: 'Trạng thái', render: (row) => <Badge value={row.status} map={LABELS.support} /> },
              {
                key: 'received',
                header: 'Đã nhận',
                render: (row) => (row.receivedConfirmed ? formatDate(row.receivedAt) : 'Chưa'),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openReview(row)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-forest hover:bg-ink/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                  >
                    <SquarePen size={16} />
                    Xử lý
                  </button>
                ),
              },
            ]}
          />
        </Card>
      </DataState>

      <Modal open={Boolean(current)} title="Xử lý yêu cầu hỗ trợ" onClose={() => setCurrent(null)}>
        {current ? (
          <form className="space-y-3" onSubmit={onReview}>
            <p className="text-sm text-ink/70">{current.description}</p>
            {current.beneficiary?.address ? (
              <p className="text-xs text-ink/50">Địa chỉ: {current.beneficiary.address}</p>
            ) : null}
            <Field label="Trạng thái">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {SUPPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.support[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ghi chú nội bộ">
              <Textarea
                value={form.reviewNote}
                onChange={(e) => setForm({ ...form, reviewNote: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCurrent(null)}>
                Huỷ
              </Button>
              <Button type="submit" loading={saving}>
                {saving ? 'Đang lưu…' : 'Lưu'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
