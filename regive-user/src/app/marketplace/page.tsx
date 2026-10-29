'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Select, Button, Alert } from 'antd';
import {
  ShoppingBag, RefreshCw, Heart, Repeat, ShieldCheck, TrendingUp,
  Sparkles, Leaf, Package, Backpack, Shirt, BookOpen, Laptop,
  Blocks, Home, Layers, Eye,
} from 'lucide-react';
import { marketplaceService } from '@/services/marketplaceService';
import { Product } from '@/types';
import { ProductCard } from '@/components/shared/ProductCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SearchInput } from '@/components/shared/SearchInput';
import { formatVND } from '@/lib/format';

const CATEGORY_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  all: { label: 'Tất cả', icon: <Layers className="w-4 h-4" /> },
  bags: { label: 'Túi xách', icon: <Backpack className="w-4 h-4" /> },
  clothing: { label: 'Quần áo', icon: <Shirt className="w-4 h-4" /> },
  books: { label: 'Sách vở', icon: <BookOpen className="w-4 h-4" /> },
  electronics: { label: 'Điện tử', icon: <Laptop className="w-4 h-4" /> },
  toys: { label: 'Đồ chơi', icon: <Blocks className="w-4 h-4" /> },
  home: { label: 'Gia dụng', icon: <Home className="w-4 h-4" /> },
  other: { label: 'Khác', icon: <Package className="w-4 h-4" /> },
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (conditionFilter !== 'all') params.condition = conditionFilter;
      const data = await marketplaceService.listMarketplace(params);
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, conditionFilter]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-p-s50 via-sec-s50 to-i-s50 rounded-3xl p-8 sm:p-10 shadow-md relative overflow-hidden border-2 border-p-s200/30">
        <div aria-hidden="true" className="absolute -top-12 right-[8%] w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(24,201,255,0.10)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-p-s100 text-p-s700 text-xs font-bold border border-p-s200">
              <Repeat className="w-3.5 h-3.5" /><span>Chợ thiện nguyện tuần hoàn</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-n-s900 tracking-tight">Vật Phẩm Gây Quỹ ReGive</h1>
            <p className="text-n-s500 text-sm leading-relaxed">
              Mỗi vật phẩm đều đã được <strong className="text-n-s700">kiểm định chất lượng</strong>. <strong className="text-p-s600">100% doanh thu</strong> chuyển trực tiếp vào quỹ chiến dịch thiện nguyện.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            {[
              { icon: <ShieldCheck className="w-5 h-5 text-p-s600" />, t: 'Kiểm định', s: 'AI + Nhân viên', b: 'border-p-s200/50' },
              { icon: <Heart className="w-5 h-5 text-sec-s600" />, t: '100% Doanh thu', s: '→ Quỹ thiện nguyện', b: 'border-sec-s200/50' },
              { icon: <Leaf className="w-5 h-5 text-s-s600" />, t: 'Tuần hoàn', s: 'Giảm rác thải', b: 'border-s-s200/50' },
            ].map((x, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border ${x.b} shadow-sm`}>
                {x.icon}
                <div><p className="text-xs font-bold text-n-s800">{x.t}</p><p className="text-[10px] text-n-s400">{x.s}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Impact Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <ShoppingBag className="w-4 h-4 text-p-s600" />, value: `${products.length}`, label: 'Vật phẩm đang bán', bg: 'bg-p-s50' },
          { icon: <TrendingUp className="w-4 h-4 text-sec-s600" />, value: `${products.filter(p => p.stockQuantity <= 2 && p.stockQuantity > 0).length}`, label: 'Sắp hết hàng', bg: 'bg-sec-s50' },
          { icon: <Sparkles className="w-4 h-4 text-w-s600" />, value: `${products.filter(p => p.latestAiAssessment?.suggestion).length}`, label: 'Đã AI kiểm định', bg: 'bg-w-s50' },
          { icon: <Repeat className="w-4 h-4 text-s-s600" />, value: `${categories.length}`, label: 'Danh mục', bg: 'bg-s-s50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm flex items-center gap-3`}>
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">{s.icon}</div>
            <div><p className="text-lg font-black text-n-s800 leading-tight">{s.value}</p><p className="text-[11px] text-n-s400 font-medium">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* ── Category Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {Object.entries(CATEGORY_MAP).map(([key, { label, icon }]) => {
          const isActive = categoryFilter === key;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-p-s600 border-p-s600 text-white shadow-md shadow-p-s600/20'
                  : 'bg-white border-gray-200 text-n-s600 hover:border-p-s300 hover:text-p-s600 hover:bg-p-s50'
              }`}
            >
              {icon}<span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search + Sort Bar ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1">
          <SearchInput placeholder="Tìm vật phẩm theo tên hoặc mô tả..." value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <Select value={conditionFilter} onChange={setConditionFilter} size="large" className="min-w-[160px]"
            options={[
              { label: 'Mọi tình trạng', value: 'all' },
              { label: 'Mới 100%', value: 'new' },
              { label: 'Như mới', value: 'like_new' },
              { label: 'Còn tốt', value: 'good' },
              { label: 'Chấp nhận được', value: 'fair' },
            ]}
          />
          <Select value={sortBy} onChange={setSortBy} size="large" className="min-w-[160px]"
            options={[
              { label: 'Mới nhất', value: 'newest' },
              { label: 'Giá thấp → cao', value: 'priceAsc' },
              { label: 'Giá cao → thấp', value: 'priceDesc' },
            ]}
          />
          <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchProducts} size="large" className="rounded-xl" title="Làm mới" />
        </div>
      </div>

      {/* ── Result count ── */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-n-s500">
            Hiển thị <strong className="text-n-s800">{filteredProducts.length}</strong> vật phẩm
            {categoryFilter !== 'all' && <span> trong <strong className="text-p-s600">{CATEGORY_MAP[categoryFilter]?.label || categoryFilter}</strong></span>}
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

      {/* Product Grid */}
      {loading ? (
        <CardSkeleton count={8} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm phù hợp"
          description="Hiện tại không có sản phẩm nào khớp với bộ lọc của bạn."
          actionText="Đặt lại bộ lọc"
          onAction={() => {
            setSearchQuery('');
            setCategoryFilter('all');
            setConditionFilter('all');
            setSortBy('newest');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
