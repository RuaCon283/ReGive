'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Slider } from 'antd';
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Repeat,
  Package,
  TrendingUp,
  Award,
  Zap,
  HandHeart,
  Layers,
  Smile,
} from 'lucide-react';
import { campaignService } from '@/services/campaignService';
import { marketplaceService } from '@/services/marketplaceService';
import { reportService } from '@/services/reportService';
import { Campaign, Product, PublicImpact } from '@/types';
import { CampaignCard } from '@/components/shared/CampaignCard';
import { ProductCard } from '@/components/shared/ProductCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatVND } from '@/lib/format';

const IMPACT_TIERS = [
  {
    amount: 50000,
    label: '50.000 đ',
    title: '2 Bữa cơm ấm',
    desc: 'Cung cấp 2 phần cơm nóng hổi đầy đủ dinh dưỡng cho người vô gia cư tại TP.HCM.',
    colorClass: 'text-sec-s600',
    borderClass: 'border-sec-s300/40',
    bgClass: 'bg-sec-s50',
    btnClass: 'border-sec-s400 bg-sec-s400 text-white',
  },
  {
    amount: 150000,
    label: '150.000 đ',
    title: 'Bộ dụng cụ học tập',
    desc: 'Trang bị trọn bộ tập vở, bút màu, thước kẻ cho 1 em nhỏ vùng biên giới.',
    colorClass: 'text-i-s600',
    borderClass: 'border-i-s300/40',
    bgClass: 'bg-i-s50',
    btnClass: 'border-i-s500 bg-i-s500 text-white',
  },
  {
    amount: 350000,
    label: '350.000 đ',
    title: 'Áo ấm & Ủng đi mưa',
    desc: 'Bảo vệ các em học sinh tiểu học Hà Giang vượt qua mùa đông buốt giá dưới 5°C.',
    colorClass: 'text-purple-600',
    borderClass: 'border-purple-300/40',
    bgClass: 'bg-purple-50',
    btnClass: 'border-purple-500 bg-purple-500 text-white',
  },
  {
    amount: 1000000,
    label: '1.000.000 đ',
    title: 'Học bổng vượt khó 1 tháng',
    desc: 'Hỗ trợ sinh hoạt phí và sách vở cho trẻ em mồ côi hoặc gia đình bị sạt lở bão lũ.',
    colorClass: 'text-w-s700',
    borderClass: 'border-w-s300/40',
    bgClass: 'bg-w-s50',
    btnClass: 'border-w-s500 bg-w-s500 text-white',
  },
];

const CAUSE_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'children', label: 'Trẻ em' },
  { id: 'disaster_relief', label: 'Cứu trợ' },
  { id: 'poverty_alleviation', label: 'Bữa cơm' },
  { id: 'education', label: 'Tri thức' },
  { id: 'environment', label: 'Nước sạch' },
  { id: 'healthcare', label: 'Y tế' },
];

const FLOW_STEPS = [
  {
    num: '01',
    title: 'Quyên Góp Tiền & Vật Phẩm',
    desc: 'Bạn có thể ủng hộ trực tiếp bằng tiền mặt hoặc trao tặng những đồ dùng còn tốt như sách vở, quần áo ấm, thiết bị điện tử.',
    colorClass: 'text-p-s600',
    watermarkClass: 'text-p-s500/15',
  },
  {
    num: '02',
    title: 'Kiểm Định & Tuần Hoàn',
    desc: 'Đội ngũ kiểm định phân loại cẩn thận, chuyển giao trực tiếp cho người cần hoặc đăng bán minh bạch trên sàn gây quỹ.',
    colorClass: 'text-sec-s600',
    watermarkClass: 'text-sec-s500/15',
  },
  {
    num: '03',
    title: 'Trao Tận Tay & Báo Cáo',
    desc: 'Tình nguyện viên trực tiếp trao quà, người thụ hưởng nhận quà và hệ thống cập nhật nhật ký thực địa minh bạch.',
    colorClass: 'text-i-s600',
    watermarkClass: 'text-i-s500/15',
  },
];

export default function HomePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [impactData, setImpactData] = useState<PublicImpact | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [calculatorTier, setCalculatorTier] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [cList, pList, impact] = await Promise.all([
          campaignService.listPublic(),
          marketplaceService.listMarketplace(),
          reportService.getPublicImpact().catch(() => null),
        ]);
        setCampaigns(cList);
        setProducts(pList);
        if (impact) setImpactData(impact);
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu trang chủ');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredCampaigns =
    selectedCategory === 'all'
      ? campaigns
      : campaigns.filter((c) => c.category === selectedCategory);

  const currentImpactTier = IMPACT_TIERS[calculatorTier];
  const featuredCampaign = campaigns[0];

  return (
    <div className="flex flex-col gap-0 w-full">

      {/* ── Live Ticker ── */}
      {impactData?.recentDonations && impactData.recentDonations.length > 0 && (
        <div
          className="bg-gradient-to-r from-p-s700 via-p-s800 to-p-s900 text-p-s100 text-xs py-2 overflow-hidden"
          role="marquee"
          aria-label="Hoạt động quyên góp mới nhất"
        >
          <div className="flex items-center max-w-7xl mx-auto px-6">
            <div className="inline-flex items-center gap-1.5 font-extrabold text-[11px] tracking-wider uppercase text-p-s100 mr-4 shrink-0 border-r border-p-s100/30 pr-4">
              <span
                className="w-2 h-2 rounded-full bg-p-s400 inline-block animate-[float-slow_2s_ease-in-out_infinite]"
                aria-hidden="true"
              />
              Live
            </div>
            <div className="overflow-hidden flex-1">
              <div className="ticker-inner flex items-center gap-12">
                {[...impactData.recentDonations, ...impactData.recentDonations].map((d, idx) => (
                  <span
                    key={`${d._id}-${idx}`}
                    className="inline-flex items-center gap-1.5 mr-12 shrink-0"
                  >
                    <Heart className="w-3 h-3 text-sec-s400 fill-sec-s400 shrink-0" />
                    <strong className="text-white font-bold">{d.donorName}</strong>
                    <span className="text-p-s100/90">vừa đóng góp</span>
                    <span className="text-p-s300 font-black">
                      {d.type === 'money' ? formatVND(d.amount) : 'hiện vật'}
                    </span>
                    <span className="text-p-s100/90">cho</span>
                    <span className="underline underline-offset-2 text-white font-semibold">
                      {d.campaignTitle || 'ReGive'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className="bg-gradient-to-br from-n-s50 via-p-s50 to-i-s50 pt-16 pb-24 px-6 relative overflow-hidden">
        {/* Decorative floating blobs */}
        <div
          aria-hidden="true"
          className="float-slow absolute -top-10 right-[5%] w-80 h-80 rounded-[62%_38%_50%_50%/46%_46%_54%_54%] bg-[radial-gradient(circle,rgba(24,201,255,0.20)_0%,transparent_70%)] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="float-med absolute -bottom-16 left-[3%] w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(2,72,112,0.14)_0%,transparent_70%)] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-[30%] left-[15%] w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(107,211,243,0.18)_0%,transparent_70%)] pointer-events-none"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Hero Badge */}
            <div className="clay-section-tag mb-6 text-xs inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Nền tảng thiện nguyện & trao tặng tuần hoàn minh bạch hàng đầu
            </div>

            {/* Main Headline */}
            <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl text-n-s900 leading-tight mb-5 tracking-tight">
              Trao Đi Yêu Thương,{' '}
              <span className="bg-gradient-to-r from-p-s500 via-p-s400 to-i-s500 bg-clip-text text-transparent">
                Lan Tỏa Giá Trị Tuần Hoàn
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-n-s600 leading-relaxed mb-9 font-normal max-w-2xl mx-auto">
              ReGive biến từng đóng góp tiền mặt, vật phẩm cũ và thời gian tình nguyện thành
              những nguồn lực thiết thực nhất để trao tận tay người thụ hưởng một cách{' '}
              <strong className="text-p-s600 font-bold">minh bạch và trực tiếp</strong>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14">
              <Link
                href="/campaigns"
                className="clay-btn-primary text-sm sm:text-base px-8 py-3.5 no-underline"
              >
                <Heart className="w-4 h-4 fill-white" />
                Khám phá chiến dịch
              </Link>
              <Link
                href="/marketplace"
                className="clay-btn-outline text-sm sm:text-base px-7 py-3 no-underline"
              >
                <Repeat className="w-4 h-4" />
                Cửa hàng trao tặng ({products.length} vật phẩm)
              </Link>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t-2 border-dashed border-p-s500/25">
              {[
                { icon: <ShieldCheck className="w-5 h-5" />, title: 'Minh bạch 100%', sub: 'Sao kê tự động', colorClass: 'text-p-s600', bgClass: 'bg-p-s100' },
                { icon: <Repeat className="w-5 h-5" />, title: 'Tuần hoàn đồ dùng', sub: 'Giảm rác thải nhựa', colorClass: 'text-sec-s600', bgClass: 'bg-sec-s100' },
                { icon: <Users className="w-5 h-5" />, title: 'Tình nguyện viên', sub: 'Kết nối thực địa', colorClass: 'text-i-s600', bgClass: 'bg-i-s100' },
                { icon: <Package className="w-5 h-5" />, title: 'Hỗ trợ đúng người', sub: 'Xác thực thụ hưởng', colorClass: 'text-sec-s600', bgClass: 'bg-sec-s100' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-left">
                  <div className={`w-11 h-11 rounded-2xl ${item.bgClass} flex items-center justify-center ${item.colorClass} shrink-0 shadow-sm border border-white/80`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-n-s900 m-0">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-n-s400 m-0 font-medium">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact Stats Banner ── */}
      <section className="px-6 -translate-y-10 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-white via-p-s50 to-sec-s50 rounded-3xl p-8 sm:p-12 shadow-lg border-2 border-p-s200/40 grid grid-cols-2 md:grid-cols-4 gap-8 relative overflow-hidden">
            {/* Decorative glow */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[radial-gradient(circle,rgba(24,201,255,0.15)_0%,transparent_70%)] pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(2,72,112,0.06)_0%,transparent_70%)] pointer-events-none"
            />
            {[
              { value: impactData?.totalCampaigns || campaigns.length, label: 'Chiến dịch thiện nguyện', colorClass: 'text-p-s700', iconBg: 'bg-p-s100', icon: <Sparkles className="w-5 h-5 text-p-s600" /> },
              { value: formatVND(impactData?.totalRaised || 0), label: 'Tổng nguồn lực quyên góp', colorClass: 'text-sec-s700', isFormatted: true, iconBg: 'bg-sec-s100', icon: <TrendingUp className="w-5 h-5 text-sec-s600" /> },
              { value: impactData?.totalDonations || 0, label: 'Lượt đóng góp thành công', colorClass: 'text-i-s700', iconBg: 'bg-i-s100', icon: <Heart className="w-5 h-5 text-i-s600" /> },
              { value: impactData?.totalVolunteers || 0, label: 'Tình nguyện viên đã xác nhận', colorClass: 'text-s-s700', iconBg: 'bg-s-s100', icon: <Users className="w-5 h-5 text-s-s600" /> },
            ].map((stat, idx) => (
              <div key={idx} className="text-center relative z-10">
                <div className={`w-11 h-11 rounded-2xl ${stat.iconBg} flex items-center justify-center mx-auto mb-2.5 shadow-sm border border-white/80`}>
                  {stat.icon}
                </div>
                <span className={`block font-black ${stat.isFormatted ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'} ${stat.colorClass} leading-tight mb-1.5`}>
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-n-s500 font-medium leading-snug block">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Error Notification ── */}
      {error && (
        <div className="max-w-7xl mx-auto -mt-5 px-6 pb-4">
          <Alert message="Lỗi tải dữ liệu" description={error} type="warning" showIcon />
        </div>
      )}

      {/* ── Impact Calculator ── */}
      <section className="py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-p-s100 via-p-s50 to-i-s50 rounded-3xl p-8 sm:p-14 border border-p-s500/20 shadow-md">
            <div className="max-w-2xl mx-auto text-center">
              <div className="clay-section-tag mb-5 inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Công cụ tính toán sức mạnh cộng đồng
              </div>
              <h2 className="font-bold text-2xl sm:text-4xl text-n-s900 mb-3">
                Mỗi Đóng Góp Của Bạn Tạo Ra Thay Đổi Gì?
              </h2>
              <p className="text-sm sm:text-base text-n-s600 mb-9 leading-relaxed">
                Chọn mức đóng góp để xem giá trị thiết thực bạn mang đến cho cộng đồng.
              </p>

              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border-2 border-white/90 text-left">
                {/* Tier Buttons */}
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {IMPACT_TIERS.map((tier, idx) => {
                    const isSelected = calculatorTier === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCalculatorTier(idx)}
                        className={`px-4 py-2.5 rounded-full text-sm font-extrabold border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-p-s500 bg-p-s500 text-white shadow-md -translate-y-0.5'
                            : 'border-n-s200 bg-white text-n-s800 hover:border-p-s300 shadow-sm'
                        }`}
                      >
                        {tier.label}
                      </button>
                    );
                  })}
                </div>

                <div className="px-1">
                  <Slider
                    min={0}
                    max={3}
                    step={1}
                    value={calculatorTier}
                    onChange={(val) => setCalculatorTier(val)}
                    tooltip={{ formatter: (val) => IMPACT_TIERS[val ?? 0].label }}
                  />
                </div>

                {/* Result Card */}
                <div className={`mt-6 flex flex-wrap items-center gap-5 p-6 rounded-2xl border-2 transition-colors duration-300 ${currentImpactTier.bgClass} ${currentImpactTier.borderClass}`}>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-n-s900 mb-1.5">
                      {currentImpactTier.title}{' '}
                      <span className={currentImpactTier.colorClass}>({currentImpactTier.label})</span>
                    </h4>
                    <p className="text-sm text-n-s600 m-0 leading-relaxed">
                      {currentImpactTier.desc}
                    </p>
                  </div>
                  {featuredCampaign && (
                    <Link
                      href={`/campaigns/${featuredCampaign._id}/donate-money?amount=${currentImpactTier.amount}`}
                      className="clay-btn-primary text-xs sm:text-sm px-5 py-2.5 no-underline shrink-0"
                    >
                      Ủng hộ mức này
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ── */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <div className="clay-section-tag mb-3 inline-flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Chung tay vì cộng đồng
              </div>
              <h2 className="font-bold text-2xl sm:text-3xl text-n-s900 m-0">
                Chiến Dịch Thiện Nguyện Cần Chung Tay
              </h2>
            </div>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-p-s600 hover:text-p-s700 no-underline transition-colors"
            >
              Xem tất cả ({campaigns.length})
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category Pills */}
          <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-4 mb-6">
            {CAUSE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap cursor-pointer border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-p-s500 bg-p-s500 text-white font-extrabold shadow-md -translate-y-0.5'
                      : 'border-n-s200 bg-white text-n-s800 font-semibold hover:border-p-s300 shadow-sm'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <CardSkeleton count={3} />
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              title="Chưa có chiến dịch trong danh mục này"
              description="Hãy thử chọn danh mục khác hoặc quay lại xem toàn bộ chiến dịch."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.slice(0, 6).map((c) => (
                <CampaignCard key={c._id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Donors Leaderboard ── */}
      {impactData?.topDonors && impactData.topDonors.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-w-s50 via-yellow-50 to-amber-50 rounded-3xl p-8 sm:p-14 relative overflow-hidden border-2 border-w-s200/40 shadow-lg">
              {/* Glow */}
              <div
                aria-hidden="true"
                className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12)_0%,transparent_70%)] pointer-events-none"
              />

              <div className="max-w-lg mb-9 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-w-s100 border border-w-s200 text-w-s700 text-xs font-extrabold tracking-wider uppercase mb-4">
                  <Award className="w-3.5 h-3.5 text-w-s600" />
                  Bảng vàng vinh danh
                </div>
                <h2 className="font-bold text-2xl sm:text-3xl text-n-s900 mb-2.5">
                  Những Trái Tim Vàng ReGive
                </h2>
                <p className="text-sm text-n-s500 m-0 leading-relaxed">
                  Tri ân các nhà hảo tâm và mạnh thường quân đã đồng hành cùng ReGive trao tặng yêu thương.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
                {impactData.topDonors.map((donor, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-w-s100 rounded-2xl p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 shadow-sm"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl mx-auto mb-3 flex items-center justify-center font-black ${
                        idx === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-lg shadow-lg shadow-yellow-400/30'
                          : idx === 1
                          ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white text-lg'
                          : idx === 2
                          ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white text-lg'
                          : 'bg-p-s100 text-p-s700 text-sm'
                      }`}
                    >
                      {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : `#${idx + 1}`}
                    </div>
                    <h4 className="font-bold text-sm text-n-s800 mb-1.5 truncate">
                      {donor.name}
                    </h4>
                    <p className="text-xs sm:text-sm font-black text-w-s700 mb-1">
                      {formatVND(donor.totalAmount)}
                    </p>
                    <span className="text-[11px] text-n-s400 block font-medium">{donor.count} lượt ủng hộ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace Spotlight ── */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-n-s50 rounded-3xl p-8 sm:p-12 border border-p-s500/15 shadow-md">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
              <div>
                <div className="clay-section-tag mb-3 inline-flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Trao đổi & Gây quỹ
                </div>
                <h2 className="font-bold text-2xl sm:text-3xl text-n-s900 mb-2">
                  Cửa Hàng Trao Tặng ReGive
                </h2>
                <p className="text-sm text-n-s600 m-0 leading-relaxed max-w-lg">
                  100% doanh thu từ mua bán vật phẩm tuần hoàn được chuyển thẳng vào quỹ cứu trợ chiến dịch.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-p-s600 hover:text-p-s700 no-underline transition-colors"
              >
                Xem chợ vật phẩm ({products.length})
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <CardSkeleton count={4} />
            ) : products.length === 0 ? (
              <EmptyState
                title="Cửa hàng đang được cập nhật"
                description="Các vật phẩm được quyên góp đang được kiểm định và chuẩn bị lên kệ."
                actionText="Quyên góp vật phẩm"
                actionHref="/campaigns"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {products.slice(0, 4).map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Circular Charity Flow ── */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-lg mx-auto mb-12">
            <div className="clay-section-tag mb-4 inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Cách thức vận hành
            </div>
            <h2 className="font-bold text-2xl sm:text-4xl text-n-s900 mb-3">
              Mô Hình Thiện Nguyện Tuần Hoàn
            </h2>
            <p className="text-sm sm:text-base text-n-s600 m-0 leading-relaxed">
              Mọi nguồn lực quyên góp đều được phân loại, kiểm định và tối ưu hóa đến tận tay người cần.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLOW_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="clay-card p-8 relative overflow-hidden"
              >
                {/* Step number watermark */}
                <span
                  aria-hidden="true"
                  className={`absolute -top-3 right-4 font-black text-7xl select-none leading-none pointer-events-none ${step.watermarkClass}`}
                >
                  {step.num}
                </span>

                <h3 className="font-bold text-lg text-n-s900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-n-s600 leading-relaxed m-0">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Volunteer CTA Banner ── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-p-s50 via-sec-s50 to-i-s50 p-8 sm:p-16 relative shadow-lg border-2 border-p-s200/30">
            {/* Decorative blobs */}
            <div
              aria-hidden="true"
              className="float-med absolute -top-16 right-[10%] w-60 h-60 rounded-full bg-[radial-gradient(circle,rgba(24,201,255,0.12)_0%,transparent_70%)] pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-10 left-[5%] w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(2,72,112,0.06)_0%,transparent_70%)] pointer-events-none"
            />

            <div className="max-w-2xl relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-p-s100 border border-p-s200 text-p-s700 text-xs font-extrabold tracking-wider uppercase mb-5">
                <Smile className="w-3.5 h-3.5" />
                Đồng hành cùng ReGive
              </span>

              <h2 className="font-bold text-2xl sm:text-4xl text-n-s900 mb-4 leading-snug">
                Trở Thành Tình Nguyện Viên ReGive Ngay Hôm Nay
              </h2>
              <p className="text-sm sm:text-base text-n-s600 leading-relaxed mb-9">
                Bạn có kỹ năng, thời gian hoặc trái tim nhiệt huyết? Hãy cùng chúng tôi tham gia phân loại vật phẩm,
                tổ chức sự kiện và mang niềm vui đến cho các em nhỏ và gia đình cần giúp đỡ.
              </p>

              <div className="flex flex-wrap gap-3.5">
                <Link
                  href="/campaigns"
                  className="clay-btn-primary text-sm sm:text-base px-7 py-3.5 no-underline"
                >
                  <HandHeart className="w-4 h-4" />
                  Đăng ký tham gia chiến dịch
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-p-s300 text-p-s700 text-sm sm:text-base font-bold no-underline bg-white/70 hover:border-p-s400 hover:bg-white transition-colors shadow-sm"
                >
                  Tìm hiểu thêm
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
