'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Table, Tag, Input, Select, Button, Card, Statistic, Alert } from 'antd';
import {
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Sparkles,
  HeartHandshake,
  FileText,
  RefreshCw,
  Coins,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { reportService } from '@/services/reportService';
import { TransparencyLedgerData, TransparencyTransaction } from '@/types';
import { formatVND, formatDateTime } from '@/lib/format';
import { SearchInput } from '@/components/shared/SearchInput';

export default function TransparencyPage() {
  const [data, setData] = useState<TransparencyLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportService.getTransparencyLedger();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải sổ cái minh bạch';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    reportService
      .getTransparencyLedger()
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Không thể tải sổ cái minh bạch';
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.partner.toLowerCase().includes(search.toLowerCase()) ||
        item.campaignTitle.toLowerCase().includes(search.toLowerCase());

      const matchDirection =
        directionFilter === 'ALL' || item.direction === directionFilter;

      const matchCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchDirection && matchCategory;
    });
  }, [data, search, directionFilter, categoryFilter]);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 140,
      render: (val: string) => (
        <span className="text-xs text-gray-500 font-mono">
          {formatDateTime(val)}
        </span>
      ),
    },
    {
      title: 'Mã & Dòng tiền',
      key: 'code',
      width: 160,
      render: (_: unknown, record: TransparencyTransaction) => (
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-gray-800">
            {record.code}
          </span>
          <div>
            {record.direction === 'INFLOW' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-p-s100 text-p-s800">
                <ArrowDownLeft className="w-3 h-3 text-p-s600" />
                DÒNG TIỀN VÀO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                <ArrowUpRight className="w-3 h-3 text-rose-600" />
                GIẢI NGÂN HỖ TRỢ
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Khoản mục chi tiết',
      key: 'title',
      render: (_: unknown, record: TransparencyTransaction) => (
        <div className="space-y-1">
          <p className="font-bold text-gray-900 text-xs sm:text-sm">
            {record.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span>Đối tác: <strong className="text-gray-700">{record.partner}</strong></span>
            <span>•</span>
            <span className="text-p-s700 font-medium">{record.campaignTitle}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Số tiền / Giá trị',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      width: 160,
      render: (val: number | null, record: TransparencyTransaction) => (
        <div className="text-right">
          <span
            className={`font-black text-sm sm:text-base font-mono ${
              record.direction === 'INFLOW' ? 'text-p-s700' : 'text-rose-600'
            }`}
          >
            {val == null
              ? 'Đang cập nhật'
              : `${record.direction === 'INFLOW' ? '+' : '-'} ${formatVND(val)}`}
          </span>
          <span className="block text-[10px] text-gray-400 mt-0.5">
            {record.proofType}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-p-s100 via-sec-s50 to-i-s50 rounded-3xl p-8 sm:p-10 relative overflow-hidden border-2 border-p-s200/30 shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-p-s100 text-p-s700 text-xs font-bold border border-p-s200">
            <ShieldCheck className="w-4 h-4 text-p-s600" />
            <span>Sổ cái Thời gian thực (Real-time Transparency Ledger)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-n-s900">
            Minh Bạch Tuyệt Đối Nguồn Lực Thiện Nguyện
          </h1>
          <p className="text-n-s500 text-sm leading-relaxed">
            ReGive cam kết công khai 100% dòng tiền quyên góp, doanh thu bán vật phẩm tuần hoàn từ Marketplace và các khoản giải ngân thực địa.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Tổng nguồn lực vào (Inflow)</span>
            <div className="w-8 h-8 rounded-xl bg-p-s50 text-p-s600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-p-s700 font-mono">
            {formatVND(data?.summary.totalInflow || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Gồm quyên góp trực tiếp & doanh thu bán đồ tuần hoàn
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Giải ngân hỗ trợ (Outflow)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
            {formatVND(data?.summary.totalOutflow || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Kinh phí đã trao trực tiếp cho Người thụ hưởng & Chiến dịch
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase mb-2">
            <span>Tồn quỹ khả dụng</span>
            <div className="w-8 h-8 rounded-xl bg-sec-s50 text-sec-s600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sec-s700 font-mono">
            {formatVND(data?.summary.netBalance || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Sẵn sàng giải ngân theo từng cột mốc chiến dịch
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1">
          <SearchInput
            placeholder="Tìm theo mã giao dịch, tên đối tác hoặc chiến dịch..."
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
          <Select
            value={directionFilter}
            onChange={setDirectionFilter}
            size="large"
            className="min-w-[140px]"
            options={[
              { label: 'Tất cả dòng tiền', value: 'ALL' },
              { label: 'Dòng tiền vào (+)', value: 'INFLOW' },
              { label: 'Giải ngân (-)', value: 'OUTFLOW' },
            ]}
          />

          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            size="large"
            className="min-w-[160px]"
            options={[
              { label: 'Tất cả phân loại', value: 'ALL' },
              { label: 'Quyên góp tiền', value: 'DONATION_MONEY' },
              { label: 'Bán đồ tuần hoàn', value: 'MARKETPLACE_REVENUE' },
              { label: 'Cứu trợ người thụ hưởng', value: 'BENEFICIARY_DISBURSEMENT' },
            ]}
          />

          <Button
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchLedger}
            size="large"
            className="!rounded-xl"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {error && <Alert message="Lỗi" description={error} type="error" showIcon />}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2 sm:p-4">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">
            Hiển thị {filteredTransactions.length} giao dịch gần nhất
          </span>
          <span className="text-[11px] text-gray-400">
            Kiểm toán lần cuối: {formatDateTime(data?.summary.lastAuditedAt)}
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          className="overflow-x-auto"
        />
      </div>

      {/* Assurance Note */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
        <HelpCircle className="w-5 h-5 text-sec-s600 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-bold text-gray-900 text-sm">Cơ chế bảo chứng minh bạch tại ReGive:</p>
          <p>
            Mọi thanh toán thành công qua Sandbox hay cổng thanh toán đều tự động kích hoạt một bản ghi tức thì vào Sổ cái công khai.
            Các khoản phân phối hiện vật và tài chính cho Người thụ hưởng phải được xác thực bằng biên bản và hình ảnh thực địa trước khi đóng trạng thái hoàn tất.
          </p>
        </div>
      </div>
    </div>
  );
}
