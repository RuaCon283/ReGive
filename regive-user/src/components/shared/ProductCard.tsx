import React from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, ArrowRight, Sparkles, Heart, Flame } from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

interface ProductCardProps {
  product: Product;
  onBuyNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuyNow }) => {
  const hasImage = product.images && product.images.length > 0;
  const inStock = product.stockQuantity > 0;
  const isLowStock = inStock && product.stockQuantity <= 2;
  const isNew = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 3 * 86400000;
  const hasAi = !!product.latestAiAssessment?.suggestion;
  const hasCampaign = product.campaign && typeof product.campaign === 'object' && product.campaign.title;

  return (
    <div className="clay-card flex flex-col h-full overflow-hidden group">
      <div className={`relative h-48 w-full overflow-hidden ${hasImage ? '' : 'bg-gradient-to-br from-p-s100 to-p-s200'}`}>
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2.5">
            <Package className="w-14 h-14 text-p-s500 stroke-[1.5]" />
            <span className="text-xs font-semibold text-n-s600">Sản phẩm quyên góp</span>
          </div>
        )}
        {product.condition && <div className="absolute top-3 left-3 z-10"><StatusBadge type="product" status={product.condition} /></div>}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 items-end">
          {isNew && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sec-s500 text-white text-[10px] font-bold shadow-sm"><Sparkles className="w-3 h-3" /> Mới</span>}
          {isLowStock && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-pulse"><Flame className="w-3 h-3" /> Còn {product.stockQuantity}</span>}
          {!inStock && <span className="px-2 py-0.5 rounded-full bg-n-s900/60 backdrop-blur-md text-white text-[10px] font-bold">Hết hàng</span>}
        </div>
        <Link href={`/marketplace/${product._id}`} className="no-underline">
          <div className="absolute inset-0 bg-n-s900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[5]">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-md text-n-s900 text-xs font-bold shadow-md"><Package className="w-4 h-4" /> Xem chi tiết</span>
          </div>
        </Link>
      </div>
      {/* ── Content ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <span className="clay-badge clay-badge-green text-[11px]">{product.category || 'Vật phẩm'}</span>
            {hasAi && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-p-s50 border border-p-s200/50 text-[10px] font-bold text-p-s700"><Sparkles className="w-3 h-3" /> AI ✓</span>}
          </div>
          <Link href={`/marketplace/${product._id}`} className="no-underline block mt-1">
            <h3 className="text-base font-bold text-n-s900 leading-snug mb-2 line-clamp-2 hover:text-p-s700 transition-colors">{product.name}</h3>
          </Link>
          {hasCampaign && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-w-s50/70 border border-w-s200/40 mb-1.5">
              <Heart className="w-3 h-3 text-w-s600 shrink-0" />
              <span className="text-[11px] font-semibold text-w-s800 truncate">Quỹ: {(product.campaign as any).title}</span>
            </div>
          )}
          {product.description && <p className="text-xs text-n-s500 leading-relaxed mt-1 line-clamp-2 m-0">{product.description}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-3 pt-3 border-t-2 border-dashed border-p-s500/15">
            <div>
              <span className="text-[10px] text-n-s400 font-semibold block">Giá gây quỹ</span>
              <span className="text-lg font-black text-p-s600">{formatVND(product.price)}</span>
            </div>
            {hasCampaign && <span className="text-[10px] text-w-s600 font-bold flex items-center gap-1"><Heart className="w-3 h-3 fill-w-s500 text-w-s500" /> 100% → Quỹ</span>}
          </div>
          <div className="flex gap-2">
            <Link href={`/marketplace/${product._id}`} className="flex-1 no-underline">
              <button className="w-full inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold py-2 px-3 rounded-full border border-n-s200 text-n-s700 hover:border-p-s400 hover:text-p-s600 transition-colors cursor-pointer bg-white">Chi tiết <ArrowRight className="w-3.5 h-3.5" /></button>
            </Link>
            <button onClick={() => onBuyNow ? onBuyNow(product) : (window.location.href = `/marketplace/${product._id}`)} disabled={!inStock}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold py-2 px-3 rounded-full transition-colors cursor-pointer ${inStock ? 'bg-p-s500 text-white hover:bg-p-s600 shadow-sm shadow-p-s500/20' : 'bg-n-s100 text-n-s500 cursor-not-allowed'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />{inStock ? 'Mua ngay' : 'Hết hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
