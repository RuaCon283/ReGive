import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  Info,
  Package,
  Palette,
  Ruler,
  Scale,
  ShieldCheck,
  Tag,
  Warehouse,
  X,
} from 'lucide-react';
import { productApi, uploadApi } from '../api/client';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import {
  CONDITIONS,
  LABELS,
  PRODUCT_BRANDS,
  PRODUCT_CATEGORIES,
  PRODUCT_COLORS,
  PRODUCT_LOCATIONS,
  PRODUCT_MATERIALS,
  PRODUCT_WEIGHTS,
  QUALITIES,
} from '../lib/constants';

const accentStyles = {
  moss: { icon: 'bg-moss/10 text-moss' },
  clay: { icon: 'bg-clay/10 text-clay' },
  leaf: { icon: 'bg-leaf/10 text-leaf' },
};

const SectionTitle = ({ icon: Icon, title, subtitle, accent = 'moss' }) => {
  const s = accentStyles[accent] || accentStyles.moss;
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${s.icon}`}>
        <Icon size={20} />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {subtitle && <p className="text-sm text-ink/50 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    originalPrice: '',
    stockQuantity: '',
    condition: '',
    quality: '',
    storageLocation: '',
    color: '',
    material: '',
    weight: '',
    imageFiles: [],
  });

  function handleImageSelect(files) {
    if (!files || !files.length) return;
    const newFiles = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setForm((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...newFiles],
    }));
  }

  function removeImage(index) {
    setForm((prev) => {
      URL.revokeObjectURL(prev.imageFiles[index]?.preview);
      return {
        ...prev,
        imageFiles: prev.imageFiles.filter((_, i) => i !== index),
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    setSaving(true);
    try {
      let imageUrls = [];
      if (form.imageFiles.length > 0) {
        const files = form.imageFiles.map((item) => item.file);
        const res = await uploadApi.multiple(files);
        imageUrls = res.data?.urls || [];
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category || 'other',
        brand: form.brand.trim(),
        price: Number(form.price) || 0,
        originalPrice: Number(form.originalPrice) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
        condition: form.condition || undefined,
        quality: form.quality || undefined,
        images: imageUrls,
        storageLocation: form.storageLocation.trim(),
        color: form.color.trim(),
        material: form.material.trim(),
        weight: form.weight.trim(),
      };
      await productApi.create(payload);
      toast.success('Đã tạo sản phẩm mới');
      setForm({
        name: '', description: '', category: '', brand: '',
        price: '', originalPrice: '', stockQuantity: '',
        condition: '', quality: '', storageLocation: '',
        color: '', material: '', weight: '', imageFiles: [],
      });
      navigate('/products');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filledCount = [
    form.name, form.description, form.category, form.brand,
    form.price, form.condition, form.color, form.material,
    form.imageFiles.length > 0,
  ].filter(Boolean).length;
  const totalFields = 9;
  const progressPercent = Math.round((filledCount / totalFields) * 100);

  return (
    <div>
      <PageHeader
        eyebrow="Sản phẩm"
        title="Tạo sản phẩm mới"
        description="Thêm sản phẩm thủ công vào hệ thống. Sau khi tạo, có thể đánh giá và đăng bán."
        actions={
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-forest hover:bg-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Cột trái */}
          <div className="space-y-6 lg:col-span-2">
            {/* Thông tin cơ bản */}
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-r from-forest/5 to-moss/5 px-6 py-4 border-b border-forest/8">
                <SectionTitle
                  icon={Package}
                  title="Thông tin cơ bản"
                  subtitle="Nhập tên và mô tả để nhận diện sản phẩm"
                />
              </div>
              <div className="p-6 space-y-4">
                <Field label="Tên sản phẩm" required>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Ví dụ: Áo khoác denim Levi's"
                  />
                </Field>
                <Field label="Mô tả">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả chi tiết sản phẩm, tình trạng thực tế..."
                    rows={4}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Danh mục">
                    <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">— Chọn danh mục —</option>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Thương hiệu">
                    <Select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                      <option value="">— Chọn thương hiệu —</option>
                      {PRODUCT_BRANDS.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            </Card>

            {/* Giá và tồn kho */}
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-r from-clay/5 to-clay/3 px-6 py-4 border-b border-clay/10">
                <SectionTitle
                  icon={Tag}
                  title="Giá và tồn kho"
                  subtitle="Thiết lập giá bán và số lượng"
                  accent="clay"
                />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Giá bán" required>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 font-medium pointer-events-none">₫</span>
                    </div>
                  </Field>
                  <Field label="Giá gốc">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={form.originalPrice}
                        onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink/40 font-medium pointer-events-none">₫</span>
                    </div>
                  </Field>
                  <Field label="Số lượng tồn">
                    <Input
                      type="number"
                      min="0"
                      value={form.stockQuantity}
                      onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>
            </Card>

            {/* Đánh giá sơ bộ */}
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-r from-leaf/5 to-leaf/3 px-6 py-4 border-b border-leaf/10">
                <SectionTitle
                  icon={ShieldCheck}
                  title="Đánh giá sơ bộ"
                  subtitle="Tình trạng và chất lượng sản phẩm"
                  accent="leaf"
                />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tình trạng">
                    <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                      <option value="">— Chưa đánh giá —</option>
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{LABELS.condition[c]}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Chất lượng">
                    <Select value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })}>
                      <option value="">— Chưa đánh giá —</option>
                      {QUALITIES.map((q) => (
                        <option key={q} value={q}>{LABELS.quality[q]}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            </Card>

            {/* Thông tin khác */}
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-r from-moss/5 to-moss/3 px-6 py-4 border-b border-moss/10">
                <SectionTitle
                  icon={Palette}
                  title="Chi tiết sản phẩm"
                  subtitle="Màu sắc, chất liệu, kích thước và vị trí kho"
                />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={<>Màu sắc</>}>
                    <Select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
                      <option value="">— Chọn màu —</option>
                      {PRODUCT_COLORS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={<>Chất liệu</>}>
                    <Select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                      <option value="">— Chọn chất liệu —</option>
                      {PRODUCT_MATERIALS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={<>Trọng lượng</>}>
                    <Select value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}>
                      <option value="">— Chọn trọng lượng —</option>
                      {PRODUCT_WEIGHTS.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label={<>Vị trí kho</>}>
                    <Select value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}>
                      <option value="">— Chọn vị trí —</option>
                      {PRODUCT_LOCATIONS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            </Card>
          </div>

          {/* Cột phải - Sticky sidebar */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Hình ảnh */}
              <Card className="overflow-hidden !p-0">
                <div className="bg-gradient-to-r from-purple-50 to-purple-50/30 px-6 py-4 border-b border-purple-100">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink">Hình ảnh</h2>
                      <p className="text-sm text-ink/50 mt-0.5">Tối đa 10 ảnh, sẽ tải lên khi tạo</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {form.imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {form.imageFiles.map((item, i) => (
                        <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-forest/10 shadow-sm">
                          <img
                            src={item.preview}
                            alt={`Ảnh ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg hover:bg-rose/90"
                            aria-label="Xoá ảnh"
                          >
                            <X size={14} />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-forest/80 text-white text-xs font-medium backdrop-blur-sm">
                              Ảnh bìa
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="block w-full rounded-2xl border-2 border-dashed border-forest/15 bg-gradient-to-b from-forest/3 to-transparent hover:from-forest/8 hover:border-forest/30 transition-all flex flex-col items-center justify-center gap-3 py-10 cursor-pointer group">
                    <div className="p-3 rounded-2xl bg-forest/8 group-hover:bg-forest/12 transition-colors">
                      <Camera size={24} className="text-forest/50 group-hover:text-forest/70 transition-colors" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-forest font-semibold block">Chọn ảnh để tải lên</span>
                      <span className="text-xs text-ink/40 mt-1 block">PNG, JPG, WEBP • Tối đa 10 ảnh</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleImageSelect(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {form.imageFiles.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-ink/50">
                      <Check size={14} className="text-moss" />
                      <span>{form.imageFiles.length} ảnh đã chọn</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Progress */}
              <Card className="!p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-ink/70">Hoàn thiện</span>
                  <span className="text-sm font-semibold text-forest">{progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-mist overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forest to-moss transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-ink/40 mt-2">
                  {progressPercent < 50 ? 'Hãy điền thêm thông tin để sản phẩm hoàn chỉnh hơn' : progressPercent < 100 ? 'Sắp xong rồi! Bổ sung thêm nhé' : 'Tuyệt vời! Sản phẩm đã đầy đủ thông tin'}
                </p>
              </Card>

              {/* Actions */}
              <Card className="!p-5 space-y-3">
                <Button
                  type="submit"
                  loading={saving}
                  disabled={!form.name.trim()}
                  className="w-full justify-center"
                >
                  {saving ? 'Đang tạo...' : 'Tạo sản phẩm'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/products')}
                  className="w-full justify-center"
                >
                  Huỷ bỏ
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
