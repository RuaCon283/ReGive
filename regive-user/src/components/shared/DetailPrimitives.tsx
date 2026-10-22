'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Copy } from 'lucide-react';
import { message } from 'antd';

/* ─── Breadcrumb dùng chung cho các trang chi tiết ─── */
export interface DetailCrumb {
  label: string;
  href?: string;
}

export const DetailBreadcrumb: React.FC<{ items: DetailCrumb[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <nav
    aria-label="Đường dẫn"
    className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 ${className}`}
  >
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
        {item.href ? (
          <Link
            href={item.href}
            className="hover:text-p-s700 transition-colors truncate max-w-[180px] sm:max-w-none"
          >
            {item.label}
          </Link>
        ) : (
          <span className="text-gray-900 truncate max-w-[180px] sm:max-w-none">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

/* ─── Khối nội dung (section card) thống nhất toàn bộ trang chi tiết ─── */
interface DetailSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: 'default' | 'warning' | 'success' | 'info';
}

const SECTION_TONE: Record<NonNullable<DetailSectionProps['tone']>, string> = {
  default: 'bg-gray-50/70 border-gray-100',
  warning: 'bg-amber-50/70 border-amber-100',
  success: 'bg-emerald-50/70 border-emerald-100',
  info: 'bg-sky-50/70 border-sky-100',
};

export const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  subtitle,
  icon,
  extra,
  children,
  className = '',
  bodyClassName = '',
  tone = 'default',
}) => (
  <section
    className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
  >
    <header
      className={`flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b ${SECTION_TONE[tone]}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className="w-9 h-9 rounded-xl bg-white text-p-s600 border border-p-s100 flex items-center justify-center shrink-0 shadow-xs">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-black text-gray-900 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </header>
    <div className={`px-5 sm:px-6 py-5 ${bodyClassName}`}>{children}</div>
  </section>
);

/* ─── Dòng thông tin label / value ─── */
interface InfoRowProps {
  label: string;
  children?: React.ReactNode;
  value?: React.ReactNode;
  hint?: string;
  mono?: boolean;
  className?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  children,
  value,
  hint,
  mono = false,
  className = '',
}) => {
  const content = children ?? value ?? '—';

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-6 py-3 border-b border-dashed border-gray-100 last:border-b-0 last:pb-0 first:pt-0 ${className}`}
    >
      <span className="text-xs font-semibold text-gray-500 shrink-0 sm:pt-0.5">{label}</span>
      <div className="sm:text-right min-w-0">
        <div
          className={`text-sm font-semibold text-gray-900 break-words ${
            mono ? 'font-mono text-xs sm:text-[13px]' : ''
          }`}
        >
          {content}
        </div>
        {hint && <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    </div>
  );
};

/* ─── Thẻ số liệu nhanh ─── */
export type StatTone = 'primary' | 'green' | 'amber' | 'sky' | 'slate' | 'rose';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  className?: string;
}

const STAT_TONE: Record<StatTone, { wrap: string; icon: string; value: string }> = {
  primary: {
    wrap: 'bg-gradient-to-br from-p-s50 to-white border-p-s100',
    icon: 'bg-white text-p-s600 border-p-s200',
    value: 'text-p-s800',
  },
  green: {
    wrap: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
    icon: 'bg-white text-emerald-600 border-emerald-200',
    value: 'text-emerald-800',
  },
  amber: {
    wrap: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
    icon: 'bg-white text-amber-600 border-amber-200',
    value: 'text-amber-800',
  },
  sky: {
    wrap: 'bg-gradient-to-br from-sky-50 to-white border-sky-100',
    icon: 'bg-white text-sky-600 border-sky-200',
    value: 'text-sky-800',
  },
  slate: {
    wrap: 'bg-gradient-to-br from-slate-50 to-white border-slate-200',
    icon: 'bg-white text-slate-600 border-slate-200',
    value: 'text-slate-800',
  },
  rose: {
    wrap: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',
    icon: 'bg-white text-rose-600 border-rose-200',
    value: 'text-rose-800',
  },
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  className = '',
}) => {
  const cfg = STAT_TONE[tone];

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${cfg.wrap} ${className}`}>
      {icon && (
        <span
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${cfg.icon}`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <p className={`text-sm sm:text-base font-black leading-tight mt-0.5 break-words ${cfg.value}`}>
          {value}
        </p>
        {hint && <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{hint}</p>}
      </div>
    </div>
  );
};

/* ─── Chip mã tham chiếu + nút sao chép ─── */
interface CodeChipProps {
  value: string;
  label?: string;
  display?: string;
  className?: string;
}

export const CodeChip: React.FC<CodeChipProps> = ({
  value,
  label = 'mã',
  display,
  className = '',
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(`Đã sao chép ${label}!`);
    } catch {
      message.error('Trình duyệt không cho phép sao chép tự động');
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 max-w-full font-mono text-xs font-bold text-gray-800 bg-slate-100 border border-slate-200 rounded-lg pl-2 pr-1 py-1 ${className}`}
    >
      <span className="truncate">{display || value}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Sao chép ${label}`}
        className="p-1 rounded-md text-gray-500 hover:text-p-s700 hover:bg-white transition-colors cursor-pointer shrink-0"
      >
        <Copy className="w-3 h-3" />
      </button>
    </span>
  );
};

/* ─── Trạng thái rỗng gọn trong section ─── */
interface InlineEmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const InlineEmpty: React.FC<InlineEmptyProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-8 text-center flex flex-col items-center gap-2">
    {icon && (
      <span className="w-11 h-11 rounded-2xl bg-white border border-gray-200 text-gray-400 flex items-center justify-center">
        {icon}
      </span>
    )}
    <p className="text-sm font-bold text-gray-800">{title}</p>
    {description && (
      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="pt-1">{action}</div>}
  </div>
);
