import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { campaignApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  Field,
  Input,
  PageHeader,
  StatCard,
  Table,
  TableSkeleton,
  Textarea,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LABELS } from '../lib/constants';
import { displayName, formatDate, formatDateOnly, formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

const linkClass =
  'rounded text-sm text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { isAdmin } = useAuth();

  const campaignQ = useAsync(() => campaignApi.get(id), [id]);
  const donationsQ = useAsync(() => campaignApi.donations(id), [id]);
  const volunteersQ = useAsync(() => campaignApi.volunteers(id), [id]);

  const campaign = campaignQ.data?.data?.campaign;
  const donations = donationsQ.data?.data?.donations || [];
  const volunteers = volunteersQ.data?.data?.volunteers || [];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);

  async function submitActivity(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setAdding(true);
    try {
      await campaignApi.addActivity(id, { title: title.trim(), content: content.trim() });
      toast.success('Đã thêm cập nhật hoạt động');
      setTitle('');
      setContent('');
      campaignQ.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Chiến dịch"
        title={campaign?.title || 'Chi tiết chiến dịch'}
        description="Xem thông tin, nhật ký hoạt động, quyên góp và tình nguyện viên của chiến dịch."
        actions={
          <Link to="/campaigns" className={linkClass}>
            ← Quay lại danh sách
          </Link>
        }
      />

      <ErrorBox error={campaignQ.error} onRetry={campaignQ.reload} />

      {campaignQ.loading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : campaign ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Mục tiêu" value={formatVnd(campaign.targetAmount)} hint={LABELS.campaign[campaign.status]} />
            <StatCard label="Đã gây quỹ" value={formatVnd(campaign.raisedAmount)} hint={`${campaign.donationCount || 0} lượt quyên góp`} />
            <StatCard label="Tình nguyện viên" value={campaign.volunteerCount || 0} hint="đăng ký đã ghi nhận" />
            <StatCard label="Bắt đầu" value={formatDateOnly(campaign.startDate)} hint={`→ ${formatDateOnly(campaign.endDate)}`} />
          </div>

          <Card>
            <h2 className="font-display text-xl">Thông tin</h2>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <p className="text-ink/70"><strong>Địa điểm:</strong> {campaign.location}</p>
              <p className="text-ink/70"><strong>Tổ chức:</strong> {campaign.organization || '—'}</p>
              <p className="text-ink/70"><strong>Danh mục:</strong> {campaign.category || '—'}</p>
              <p className="text-ink/70"><strong>Mục tiêu:</strong> {campaign.goal}</p>
            </div>
            {campaign.description && (
              <p className="mt-3 text-sm text-ink/70 whitespace-pre-wrap">{campaign.description}</p>
            )}
          </Card>

          {/* Chỉ ADMIN mới thêm được cập nhật hoạt động — nhất quán với quyền sửa/xoá chiến dịch */}
          {isAdmin && (
          <Card>
            <h2 className="font-display text-xl">Thêm cập nhật hoạt động</h2>
            <form className="mt-3 space-y-3" onSubmit={submitActivity}>
              <Field label="Tiêu đề" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ví dụ: Trao quà đợt 1" />
              </Field>
              <Field label="Nội dung" required>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="Mô tả hoạt động thực địa..." />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" loading={adding} disabled={!title.trim() || !content.trim()}>
                  {adding ? 'Đang lưu…' : 'Đăng cập nhật'}
                </Button>
              </div>
            </form>
          </Card>
          )}

          <Card>
            <h2 className="font-display text-xl">Nhật ký hoạt động</h2>
            {campaign.activities?.length ? (
              <Table
                compact
                label="Nhật ký hoạt động"
                rowKey={(row) => row._id || row.title}
                rows={campaign.activities}
                columns={[
                  { key: 'title', header: 'Tiêu đề', render: (row) => <p className="font-medium">{row.title}</p> },
                  { key: 'content', header: 'Nội dung', render: (row) => row.content },
                  { key: 'author', header: 'Tác giả', render: (row) => row.author || '—' },
                  { key: 'date', header: 'Ngày', render: (row) => formatDate(row.date) },
                ]}
              />
            ) : (
              <p className="text-sm text-ink/50">Chưa có cập nhật hoạt động.</p>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl">Quyên góp</h2>
            {donationsQ.loading ? (
              <TableSkeleton rows={3} columns={4} />
            ) : donations.length ? (
              <Table
                compact
                label="Quyên góp"
                rowKey={(row) => oid(row)}
                rows={donations}
                columns={[
                  { key: 'donor', header: 'Người quyên góp', render: (row) => displayName(row.donor) },
                  { key: 'type', header: 'Loại', render: (row) => <Badge value={row.type} map={LABELS.donationType} /> },
                  { key: 'amount', header: 'Giá trị', render: (row) => (row.type === 'money' ? formatVnd(row.amount) : row.productInfo?.name || 'Hiện vật') },
                  { key: 'at', header: 'Lúc', render: (row) => formatDate(row.createdAt) },
                ]}
              />
            ) : (
              <p className="text-sm text-ink/50">Chưa có quyên góp.</p>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl">Tình nguyện viên</h2>
            {volunteersQ.loading ? (
              <TableSkeleton rows={3} columns={4} />
            ) : volunteers.length ? (
              <Table
                compact
                label="Tình nguyện viên"
                rowKey={(row) => oid(row)}
                rows={volunteers}
                columns={[
                  { key: 'name', header: 'Họ tên', render: (row) => row.userName },
                  { key: 'status', header: 'Trạng thái', render: (row) => <Badge value={row.status} map={LABELS.volunteer} /> },
                  { key: 'skills', header: 'Kỹ năng', render: (row) => row.skills || '—' },
                  { key: 'at', header: 'Đăng ký lúc', render: (row) => formatDate(row.createdAt) },
                ]}
              />
            ) : (
              <p className="text-sm text-ink/50">Chưa có tình nguyện viên.</p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
