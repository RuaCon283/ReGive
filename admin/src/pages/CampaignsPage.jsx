import { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { campaignApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataState,
  Field,
  FilterSelect,
  ImageUpload,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  TableSkeleton,
  Textarea,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CAMPAIGN_STATUSES, LABELS } from '../lib/constants';
import { formatDateOnly, formatVnd, oid, toDateInput, toIsoEnd, toIsoStart } from '../lib/format';
import { useAsync } from '../lib/hooks';

const emptyForm = {
  title: '',
  description: '',
  goal: '',
  location: '',
  startDate: '',
  endDate: '',
  status: 'draft',
  targetAmount: 0,
  bannerImage: '',
};

export default function CampaignsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => campaignApi.listAll({ status }), [status]);
  const campaigns = data?.data?.campaigns || [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(campaign) {
    setEditing(campaign);
    setForm({
      title: campaign.title || '',
      description: campaign.description || '',
      goal: campaign.goal || '',
      location: campaign.location || '',
      startDate: toDateInput(campaign.startDate),
      endDate: toDateInput(campaign.endDate),
      status: campaign.status || 'draft',
      targetAmount: campaign.targetAmount || 0,
      bannerImage: campaign.bannerImage || '',
    });
    setOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let bannerImage = form.bannerImage;

      // If bannerImage is a File object, upload it first
      if (bannerImage instanceof File) {
        const { uploadApi } = await import('../api/client');
        const res = await uploadApi.single(bannerImage);
        bannerImage = res.data?.url;
      }

      const payload = {
        ...form,
        bannerImage,
        startDate: toIsoStart(form.startDate),
        endDate: toIsoEnd(form.endDate),
        targetAmount: Number(form.targetAmount) || 0,
      };

      if (editing) await campaignApi.update(oid(editing), payload);
      else await campaignApi.create(payload);
      toast.success(editing ? 'Đã cập nhật chiến dịch' : 'Đã tạo chiến dịch');
      setOpen(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await campaignApi.remove(oid(deleting));
      toast.success('Đã xoá chiến dịch');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Chiến dịch"
        title="Chiến dịch"
        description="Admin tạo, sửa, đóng chiến dịch. Nhân viên xem toàn bộ trạng thái."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>Tạo chiến dịch</Button>
          ) : null
        }
      />

      <div className="mb-4 max-w-xs">
        <FilterSelect
          label="Lọc theo trạng thái chiến dịch"
          value={status}
          onChange={setStatus}
          options={CAMPAIGN_STATUSES.map((s) => ({ value: s, label: LABELS.campaign[s] }))}
        />
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={!campaigns.length}
        onRetry={reload}
        skeleton={<TableSkeleton rows={5} columns={6} />}
        emptyTitle="Chưa có chiến dịch"
        emptyDescription="Tạo chiến dịch đầu tiên để bắt đầu quyên góp."
      >
        <Card>
          <Table
            label="Danh sách chiến dịch"
            rowKey={(row) => oid(row)}
            rows={campaigns}
            columns={[
              { key: 'title', header: 'Tên', render: (row) => <span className="font-medium">{row.title}</span> },
              { key: 'location', header: 'Địa điểm' },
              {
                key: 'status',
                header: 'Trạng thái',
                render: (row) => <Badge value={row.status} map={LABELS.campaign} />,
              },
              {
                key: 'money',
                header: 'Gây quỹ',
                render: (row) => `${formatVnd(row.raisedAmount)} / ${formatVnd(row.targetAmount)}`,
              },
              {
                key: 'dates',
                header: 'Thời gian',
                render: (row) => `${formatDateOnly(row.startDate)} – ${formatDateOnly(row.endDate)}`,
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (row) => (
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/campaigns/${oid(row)}`}
                      className="p-2 rounded-lg text-moss hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                    >
                      <Eye size={24} />
                    </Link>
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-2 rounded-lg text-forest hover:bg-ink/5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                          title="Sửa"
                          aria-label="Sửa"
                        >
                          <Pencil size={24} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(row)}
                          className="p-2 rounded-lg text-rose hover:bg-rose/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
                          title="Xoá"
                          aria-label="Xoá"
                        >
                          <Trash2 size={24} />
                        </button>
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </DataState>

      <Modal open={open} title={editing ? 'Sửa chiến dịch' : 'Tạo chiến dịch'} onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={onSave}>
          <Field label="Tiêu đề">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Mô tả">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </Field>
          <Field label="Ảnh bìa">
            <ImageUpload
              value={form.bannerImage}
              onChange={(url) => setForm({ ...form, bannerImage: url })}
              label="Chọn ảnh bìa chiến dịch"
            />
          </Field>
          <Field label="Mục tiêu">
            <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required />
          </Field>
          <Field label="Địa điểm">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bắt đầu">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </Field>
            <Field label="Kết thúc">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trạng thái">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CAMPAIGN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.campaign[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Số tiền mục tiêu">
              <Input
                type="number"
                min="0"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Xoá chiến dịch"
        description={deleting ? `Xoá chiến dịch “${deleting.title}”? Hành động này không thể hoàn tác.` : ''}
        confirmLabel="Xoá"
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
