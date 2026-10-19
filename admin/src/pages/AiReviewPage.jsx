import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { aiApi } from '../api/client';
import {
  Badge,
  Button,
  Card,
  DataState,
  ErrorBox,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { CONDITIONS, LABELS, QUALITIES } from '../lib/constants';
import { formatDate, formatVnd, oid } from '../lib/format';
import { useAsync } from '../lib/hooks';

function suggestionToForm(suggestion = {}) {
  return {
    category: suggestion.category || '',
    condition: suggestion.condition || 'good',
    quality: suggestion.quality || 'medium',
    suggestedPrice: suggestion.suggestedPrice || 0,
    price: suggestion.suggestedPrice || 0,
    suitableForMarketplace: Boolean(suggestion.suitableForMarketplace),
    assessmentNote: suggestion.rationale || '',
    applyPrice: true,
  };
}

function AiReviewSkeleton() {
  return (
    <div role="status" className="space-y-4">
      <Skeleton className="h-16 w-2/3 rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
      <span className="sr-only">Đang tải đánh giá AI…</span>
    </div>
  );
}

function PendingSkeleton() {
  return (
    <div role="status" className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-20 rounded-3xl" />
      ))}
      <span className="sr-only">Đang tải hàng chờ AI…</span>
    </div>
  );
}

export default function AiReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const pending = useAsync(() => aiApi.pending(), []);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const [form, setForm] = useState(suggestionToForm());
  const [saving, setSaving] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await aiApi.get(id);
        if (cancelled) return;
        const assessment = res.data.assessment;
        setDetail(assessment);
        setForm(suggestionToForm(assessment.suggestion));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const assessments = pending.data?.data?.assessments || [];
  const product = detail?.product;
  const suggestion = detail?.suggestion || {};

  const changed = useMemo(() => {
    if (!detail?.suggestion) return false;
    const s = detail.suggestion;
    return (
      form.category !== s.category ||
      form.condition !== s.condition ||
      form.quality !== s.quality ||
      Number(form.suggestedPrice) !== Number(s.suggestedPrice) ||
      Boolean(form.suitableForMarketplace) !== Boolean(s.suitableForMarketplace)
    );
  }, [form, detail]);

  async function confirm() {
    setSaving('confirm');
    try {
      await aiApi.confirm(id, {
        category: form.category,
        condition: form.condition,
        quality: form.quality,
        suggestedPrice: Number(form.suggestedPrice) || 0,
        price: Number(form.price) || 0,
        suitableForMarketplace: form.suitableForMarketplace,
        assessmentNote: form.assessmentNote,
        applyPrice: form.applyPrice,
      });
      toast.success(changed ? 'Đã override và áp dụng vào sản phẩm' : 'Đã xác nhận gợi ý AI');
      navigate(product ? `/products/${oid(product)}` : '/ai');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving('');
    }
  }

  async function reject() {
    setSaving('reject');
    try {
      await aiApi.reject(id);
      toast.success('Đã từ chối — sản phẩm không đổi');
      navigate('/ai');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving('');
    }
  }

  if (id) {
    if (loading) return <AiReviewSkeleton />;
    if (error) return <ErrorBox error={error} />;
    if (!detail) return null;

    return (
      <div>
        <PageHeader
          eyebrow="AI · Human-in-the-loop"
          title="So sánh gợi ý AI"
          description="Xem ảnh và gợi ý bên trái, chỉnh form bên phải, rồi Confirm. AI không tự đăng marketplace."
          actions={
            <Link
              to="/ai"
              aria-label="Quay lại hàng chờ AI"
              className="rounded text-sm text-moss hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              ← Hàng chờ AI
            </Link>
          }
        />
        <div className="mb-4 rounded-2xl bg-lime/30 px-4 py-3 text-sm text-ink">
          Trạng thái: <Badge value={detail.status} map={LABELS.ai} /> · Provider {detail.provider || 'heuristic'} ·{' '}
          {formatDate(detail.createdAt)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-display mb-3 text-2xl">{product?.name || 'Sản phẩm'}</h2>
            {product?.images?.length ? (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {product.images.map((src) => (
                  <img key={src} src={src} alt={`Ảnh sản phẩm ${product?.name || ''}`} className="h-36 w-36 rounded-2xl object-cover" />
                ))}
              </div>
            ) : (
              <div className="mb-4 flex h-36 items-center justify-center rounded-2xl bg-mist text-sm text-ink/50">
                Không có ảnh
              </div>
            )}
            <p className="mb-4 text-sm text-ink/70">{product?.description || detail.input?.extraNote || '—'}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-forest/8 py-2">
                <dt className="text-ink/50">Danh mục</dt>
                <dd>{suggestion.category || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-forest/8 py-2">
                <dt className="text-ink/50">Tình trạng</dt>
                <dd>{LABELS.condition[suggestion.condition] || suggestion.condition || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-forest/8 py-2">
                <dt className="text-ink/50">Chất lượng</dt>
                <dd>{LABELS.quality[suggestion.quality] || suggestion.quality || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-forest/8 py-2">
                <dt className="text-ink/50">Giá gợi ý</dt>
                <dd>{formatVnd(suggestion.suggestedPrice)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-forest/8 py-2">
                <dt className="text-ink/50">Marketplace?</dt>
                <dd>{suggestion.suitableForMarketplace ? 'Có' : 'Không'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-ink/50">Độ tin cậy</dt>
                <dd>{suggestion.confidence != null ? Math.round(suggestion.confidence * 100) + '%' : '—'}</dd>
              </div>
            </dl>
            {suggestion.rationale ? (
              <p className="mt-4 rounded-2xl bg-white p-3 text-sm text-ink/70">{suggestion.rationale}</p>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-display mb-1 text-2xl">Quyết định của nhân sự</h2>
            <p className="mb-4 text-sm text-ink/55">
              {changed ? 'Bạn đang override gợi ý AI.' : 'Giữ nguyên gợi ý rồi xác nhận.'}
            </p>
            {detail.status !== 'suggested' ? (
              <p className="text-sm text-ink/60">Assessment này đã được xử lý.</p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  confirm();
                }}
              >
                <Field label="Danh mục">
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </Field>
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Giá gợi ý">
                    <Input
                      type="number"
                      min="0"
                      value={form.suggestedPrice}
                      onChange={(e) => setForm({ ...form, suggestedPrice: e.target.value })}
                    />
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
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.applyPrice}
                    onChange={(e) => setForm({ ...form, applyPrice: e.target.checked })}
                  />
                  Áp giá gợi ý nếu sản phẩm chưa có giá
                </label>
                <Field label="Ghi chú">
                  <Textarea value={form.assessmentNote} onChange={(e) => setForm({ ...form, assessmentNote: e.target.value })} />
                </Field>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="submit" disabled={saving} loading={saving === 'confirm'}>
                    {saving === 'confirm' ? 'Đang lưu…' : changed ? 'Override & áp dụng' : 'Confirm & áp dụng'}
                  </Button>
                  <Button variant="danger" disabled={saving} loading={saving === 'reject'} onClick={reject}>
                    Từ chối
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI Review"
        title="Hàng chờ AI"
        description="Chỉ các assessment status suggested. Confirm mới ghi vào product; publish là bước khác."
      />
      <DataState
        loading={pending.loading}
        error={pending.error}
        isEmpty={!assessments.length}
        onRetry={pending.reload}
        skeleton={<PendingSkeleton />}
        emptyTitle="Không có gợi ý đang chờ"
        emptyDescription="Mở sản phẩm nháp và bấm “Chạy AI đánh giá”."
      >
        <div className="grid gap-3">
        {assessments.map((a) => (
          <Card key={oid(a)} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">{a.product?.name || 'Sản phẩm'}</p>
              <p className="text-sm text-ink/60">
                {a.suggestion?.category} · {LABELS.condition[a.suggestion?.condition] || a.suggestion?.condition} ·{' '}
                {formatVnd(a.suggestion?.suggestedPrice)} · {formatDate(a.createdAt)}
              </p>
            </div>
            <Button
              onClick={() => navigate(`/ai/${oid(a)}`)}
              aria-label={`Review gợi ý AI cho ${a.product?.name || 'sản phẩm'}`}
            >
              Review
            </Button>
          </Card>
        ))}
        </div>
      </DataState>
    </div>
  );
}
