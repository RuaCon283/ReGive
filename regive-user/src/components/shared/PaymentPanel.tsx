'use client';

import React, { useState } from 'react';
import { Button, Input, message, Tabs } from 'antd';
import {
  CreditCard, ShieldCheck, Info, Copy, Building, Landmark, Receipt,
} from 'lucide-react';
import { Payment } from '@/types';
import { formatVND } from '@/lib/format';

interface PaymentPanelProps {
  payment: Payment;
  onConfirmSandbox: (sandboxToken: string) => Promise<void>;
  onVnpayCheckout?: () => void;
  submitting?: boolean;
  className?: string;
}

function BankTransferTab({ payment, onConfirm, submitting, onCopy }: {
  payment: Payment; onConfirm: () => void; submitting: boolean;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="pt-2 space-y-4">
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 space-y-3">
        <div className="flex items-center gap-1.5 font-bold">
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>Thông tin tài khoản thụ hưởng</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-emerald-700">Ngân hàng</span><strong>VCB – Vietcombank</strong></div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-700">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <strong className="font-mono">1028374650</strong>
              <Button size="small" icon={<Copy className="w-3 h-3" />} onClick={() => onCopy('1028374650', 'STK')} className="h-6 px-2 text-[10px]">Copy</Button>
            </div>
          </div>
          <div className="flex justify-between"><span className="text-emerald-700">Tên thụ hưởng</span><strong>REGIVE CHARITY PLATFORM</strong></div>
          <div className="flex justify-between"><span className="text-emerald-700">Số tiền</span><strong className="text-p-s700 text-sm">{formatVND(payment.amount)}</strong></div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-700">Nội dung</span>
            <div className="flex items-center gap-2">
              <strong className="font-mono text-xs">CK {payment.paymentCode}</strong>
              <Button size="small" icon={<Copy className="w-3 h-3" />} onClick={() => onCopy(`CK ${payment.paymentCode}`, 'Nội dung')} className="h-6 px-2 text-[10px]">Copy</Button>
            </div>
          </div>
        </div>
      </div>
      <Button type="primary" size="large" loading={submitting} onClick={onConfirm} className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-lg shadow-p-s600/25">
        Xác nhận đã chuyển khoản ({formatVND(payment.amount)})
      </Button>
    </div>
  );
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  payment, onConfirmSandbox, onVnpayCheckout, submitting = false, className = '',
}) => {
  const [sandboxToken, setSandboxToken] = useState(payment.sandboxToken || '');
  const handleCopy = (text: string, label: string) => {
    if (typeof window !== 'undefined') { navigator.clipboard.writeText(text); message.success(`Đã sao chép ${label}!`); }
  };
  const handleConfirm = async () => {
    if (!sandboxToken.trim()) { message.error('Vui lòng nhập sandboxToken'); return; }
    await onConfirmSandbox(sandboxToken.trim());
  };
  const hasVnpay = payment.provider === 'vnpay' && onVnpayCheckout;
  const tabItems: any[] = [];

  if (hasVnpay) {
    tabItems.push({ key: 'vnpay',
      label: <span className="flex items-center gap-1.5 text-xs font-bold"><CreditCard className="w-3.5 h-3.5" /> VNPay</span>,
      children: (
        <div className="pt-2 space-y-4">
          <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold"><Info className="w-4 h-4 text-amber-600" /><span>Thanh toán VNPay Sandbox</span></div>
            <p className="leading-relaxed">Chuyển đến cổng VNPay. Môi trường sandbox, không trừ tiền thật.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Mã thanh toán</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900">{payment.paymentCode}</span>
                <Button size="small" icon={<Copy className="w-3 h-3" />} onClick={() => handleCopy(payment.paymentCode, 'Mã')} className="h-6 px-2 text-[10px]">Copy</Button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-50 pt-2">
              <span className="text-xs text-gray-500">Số tiền</span>
              <span className="font-black text-base text-p-s700">{formatVND(payment.amount)}</span>
            </div>
          </div>
          <Button type="primary" size="large" onClick={onVnpayCheckout} className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-lg shadow-p-s600/25">
            Thanh toán VNPay ({formatVND(payment.amount)})
          </Button>
        </div>
      ),
    });
  }

  tabItems.push({ key: 'bank', label: <span className="flex items-center gap-1.5 text-xs font-bold"><Building className="w-3.5 h-3.5" /> Chuyển khoản</span>,
    children: <BankTransferTab payment={payment} onConfirm={handleConfirm} submitting={submitting} onCopy={handleCopy} /> });

  tabItems.push({ key: 'sandbox', label: <span className="flex items-center gap-1.5 text-xs font-bold"><Receipt className="w-3.5 h-3.5" /> Sandbox Token</span>,
    children: (
      <div className="pt-2 space-y-4">
        <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 text-xs text-sky-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold"><Info className="w-4 h-4 text-sky-600" /><span>Sandbox Token tự động điền</span></div>
          <p className="leading-relaxed">Nhấn xác nhận để kích hoạt thanh toán thành công tức thì.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Sandbox Token:</label>
          <Input value={sandboxToken} onChange={(e) => setSandboxToken(e.target.value)} placeholder="sandboxToken..." size="large" className="font-mono text-xs !rounded-xl" />
        </div>
        <Button type="primary" size="large" loading={submitting} onClick={handleConfirm} className="w-full h-12 rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold text-sm shadow-md shadow-p-s600/20">
          Xác nhận Sandbox ({formatVND(payment.amount)})
        </Button>
      </div>
    ),
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs defaultActiveKey={hasVnpay ? 'vnpay' : 'bank'} items={tabItems} />
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 text-center pt-2">
        <ShieldCheck className="w-4 h-4 text-p-s600" />
        <span>Môi trường Sandbox không trừ tiền thật.</span>
      </div>
    </div>
  );
};