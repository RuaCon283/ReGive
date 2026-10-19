import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { aiApi, inventoryApi, productApi, uploadApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorBox,
  Field,
  ImageUpload,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { CONDITIONS, LABELS, QUALITIES } from '../lib/constants';
import { formatDate, formatVnd, oid } from '../lib/format';

const emptyAssess = {
  category: '',
  condition: 'good',
  quality: 'medium',
  suggestedPrice: 0,
  price: 0,
  suitableForMarketplace: true,
  assessmentNote: '',
  description: '',
};

function ProductDetailSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <Skeleton className="h-16 w-2/3 rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
      <span className="sr-only">Đang tải sản phẩm…</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyAssess);
  const [edit, setEdit] = useState({ name: '', description: '', category: '', price: 0, storageLocation: '' });
  const [stockQty, setStockQty] = useState(1);
  const [busy, setBusy] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pRes, aRes] = await Promise.all([productApi.get(id), aiApi.byProduct(id)]);
      const p = pRes.data.product;
      setProduct(p);
      setAssessments(aRes.data.assessments || []);
      setForm({
        category: p.category || '',
        condition: p.condition || 'good',
        quality: p.quality || 'medium',
        suggestedPrice: p.suggestedPrice || 0,
        price: p.price || 0,
        suitableForMarketplace: Boolean(p.suitableForMarketplace),
        assessmentNote: p.assessmentNote || '',
        description: p.description || '',
      });
      setEdit({
        name: p.name || '',
        description: p.description || '',
        category: p.category || '',
        price: p.price || 0,
        storageLocation: p.storageLocation || '',
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(name, fn, okMessage) {
    setBusy(name);
    try {
      await fn();
      toast.success(okMessage);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  }

  async function handleImageUpload(file) {
    if (!file) return;
    setUploadingImage(true);
    try {
      // If file is a File object, upload it first
      let imageUrl = file;
      if (file instanceof File) {
        const res = await uploadApi.single(file);
        imageUrl = res.data?.url;
      }

      if (imageUrl) {
        await productApi.update(id, { images: [...(product.images || []), imageUrl] });
        toast.success('Đã thêm ảnh sản phẩm');
        await load();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function confirmDeleteProduct() {
    setDeleteBusy(true);
    try {
      await productApi.remove(id);
      toast.success('Đã xoá sản phẩm');
      navigate('/products');
    } catch (err) {
      toast.error(err.message);
      setDeleteBusy(false);
    }
  }

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!product) return null;

  const latestSuggested = assessments.find((a) => a.status === 'suggested');

  return (
    <div>
      <PageHeader
        eyebrow="Sản phẩm"
        title={product.name}
        description="Đánh giá thủ công hoặc xác nhận gợi ý AI. Publish marketplace là bước riêng sau khi có tồn kho."
        actions={
          <>
            <Link
              to="/products"
              aria-label="Quay lại danh sách sản phẩm"
              className="rounded text-sm text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              ← Danh sách
            </Link>
            {product.listedOnMarketplace ? (
              <Button variant="ghost" disabled={busy === 'pub'} loading={busy === 'pub'} onClick={() => run('pub', () => productApi.unpublish(id), 'Đã gỡ bán')}>
                Gỡ marketplace
              </Button>
            ) : (
              <Button disabled={busy === 'pub'} loading={busy === 'pub'} onClick={() => run('pub', () => productApi.publish(id), 'Đã đăng marketplace')}>
                Đăng marketplace
              </Button>
            )}
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Xoá sản phẩm
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge value={product.status} map={LABELS.product} />
            {product.condition ? <Badge value={product.condition} map={LABELS.condition} /> : null}
            {product.quality ? <Badge value={product.quality} map={LABELS.quality} /> : null}
            <Badge value={product.listedOnMarketplace ? 'listed' : 'draft'} map={{ listed: 'Đang bán', draft: 'Chưa đăng' }} />
          </div>
          {product.images?.length ? (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((src) => (
                <img key={src} src={src} alt={`Ảnh sản phẩm ${product.name}`} className="h-28 w-28 rounded-2xl object-cover" />
              ))}
            </div>
          ) : null}
          <div className="w-48">
            <ImageUpload
              value={null}
              onChange={(file) => {
                if (file) {
                  handleImageUpload(file);
                }
              }}
              label="Thêm ảnh sản phẩm"
            />
          </div>
          <p className="text-sm text-ink/70">{product.description || 'Chưa có mô tả.'}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-ink/45">Giá bán</dt>
              <dd className="font-medium">{formatVnd(product.price)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/45">Giá gợi ý</dt>
              <dd className="font-medium">{formatVnd(product.suggestedPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/45">Tồn kho</dt>
              <dd className="font-medium">{product.stockQuantity}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/45">Vị trí</dt>
              <dd className="font-medium">{product.storageLocation || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-display text-xl">Nhập / xuất kho</h2>
          <Field label="Số lượng">
            <Input type="number" min="1" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value) || 1)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="lime"
              disabled={busy === 'in'}
              loading={busy === 'in'}
              onClick={() =>
                run('in', () => inventoryApi.stockIn({ productId: id, quantity: stockQty, reason: 'Admin stock in' }), 'Đã nhập kho')
              }
            >
              Nhập kho
            </Button>
            <Button
              variant="outline"
              disabled={busy === 'out'}
              loading={busy === 'out'}
              onClick={() =>
                run('out', () => inventoryApi.stockOut({ productId: id, quantity: stockQty, reason: 'Admin stock out' }), 'Đã xuất kho')
              }
            >
              Xuất kho
            </Button>
          </div>
          <p className="text-xs text-ink/50">Publish yêu cầu sản phẩm đã review, phù hợp marketplace và còn tồn.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display mb-4 text-xl">Cập nhật thông tin</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                'edit',
                () =>
                  productApi.update(id, {
                    ...edit,
                    price: Number(edit.price) || 0,
                  }),
                'Đã lưu sản phẩm'
              );
            }}
          >
            <Field label="Tên">
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Danh mục">
              <Input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} />
            </Field>
            <Field label="Giá bán">
              <Input type="number" min="0" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} />
            </Field>
            <Field label="Vị trí kho">
              <Input value={edit.storageLocation} onChange={(e) => setEdit({ ...edit, storageLocation: e.target.value })} />
            </Field>
            <Field label="Mô tả">
              <Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy === 'edit'} loading={busy === 'edit'}>
              Lưu thông tin
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display mb-4 text-xl">Đánh giá thủ công</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                'assess',
                () =>
                  productApi.assess(id, {
                    ...form,
                    suggestedPrice: Number(form.suggestedPrice) || 0,
                    price: Number(form.price) || 0,
                  }),
                'Đã đánh giá sản phẩm'
              );
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tình trạng">
                <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  {CONDITIONS.map((s) => (
                    <option key={s} value={s}>
                      {LABELS.condition[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chất lượng">
                <Select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
                  {QUALITIES.map((s) => (
                    <option key={s} value={s}>
                      {LABELS.quality[s]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Danh mục">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá gợi ý">
                <Input type="number" min="0" value={form.suggestedPrice} onChange={(e) => setForm({ ...form, suggestedPrice: e.target.value })} />
              </Field>
              <Field label="Giá bán">
                <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.suitableForMarketplace}
                onChange={(e) => setForm({ ...form, suitableForMarketplace: e.target.checked })}
              />
              Phù hợp marketplace
            </label>
            <Field label="Ghi chú đánh giá">
              <Textarea value={form.assessmentNote} onChange={(e) => setForm({ ...form, assessmentNote: e.target.value })} />
            </Field>
            <Button type="submit" disabled={busy === 'assess'} loading={busy === 'assess'}>
              Xác nhận đánh giá
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">AI hỗ trợ — human-in-the-loop</h2>
            <p className="text-sm text-ink/55">Gợi ý không tự áp dụng. Confirm/override mới ghi vào sản phẩm; vẫn không auto-publish.</p>
          </div>
          <Button
            variant="lime"
            disabled={busy === 'ai'}
            loading={busy === 'ai'}
            onClick={() => run('ai', () => aiApi.assess({ productId: id }), 'AI đã trả gợi ý — hãy xác nhận')}
          >
            Chạy AI đánh giá
          </Button>
        </div>
        {latestSuggested ? (
          <div className="mb-4 rounded-2xl border border-lime bg-lime/20 p-4 text-sm">
            Có đánh giá đang chờ duyệt.{' '}
            <Link className="font-medium text-moss underline" to={`/ai/${oid(latestSuggested)}`}>
              Mở màn hình so sánh AI
            </Link>
          </div>
        ) : null}
        <div className="space-y-3">
          {assessments.length ? (
            assessments.map((a) => (
              <div key={oid(a)} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                <div>
                  <Badge value={a.status} map={LABELS.ai} />
                  <p className="mt-1 text-sm text-ink/70">
                    {a.suggestion?.category || '—'} · {LABELS.condition[a.suggestion?.condition] || a.suggestion?.condition} ·{' '}
                    {formatVnd(a.suggestion?.suggestedPrice)} · {formatDate(a.createdAt)}
                  </p>
                </div>
                {a.status === 'suggested' ? (
                  <Link
                    to={`/ai/${oid(a)}`}
                    aria-label={`Review đánh giá AI tạo lúc ${formatDate(a.createdAt)}`}
                    className="rounded text-sm font-medium text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                  >
                    Review
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink/50">Chưa có lần gọi AI nào.</p>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Xoá sản phẩm"
        description="Xoá sản phẩm này? Hành động không thể hoàn tác. Sản phẩm đang bán hoặc đã có đơn hàng sẽ bị chặn xoá."
        confirmLabel="Xoá"
        busy={deleteBusy}
        onConfirm={confirmDeleteProduct}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
