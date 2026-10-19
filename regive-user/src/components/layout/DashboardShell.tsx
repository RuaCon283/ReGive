'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Drawer, Dropdown } from 'antd';
import {
  Heart,
  Bell,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Gift,
  HandHeart,
  Package,
  CreditCard,
  LifeBuoy,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { notificationService } from '@/services/notificationService';

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  title,
  subtitle,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      notificationService
        .listMine({ unread: true })
        .then((items) => setUnread(items.length))
        .catch(() => { });
    }
  }, [user, pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Tổng quan cá nhân', href: '/me/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Lịch sử quyên góp', href: '/me/donations', icon: <Gift className="w-4 h-4" /> },
    { label: 'Đăng ký tình nguyện', href: '/me/volunteers', icon: <HandHeart className="w-4 h-4" /> },
    { label: 'Đơn hàng Marketplace', href: '/me/orders', icon: <Package className="w-4 h-4" /> },
    { label: 'Lịch sử thanh toán', href: '/me/payments', icon: <CreditCard className="w-4 h-4" /> },
    ...(user?.role === 'BENEFICIARY'
      ? [
        {
          label: 'Yêu cầu hỗ trợ của tôi',
          href: '/me/support-requests',
          icon: <LifeBuoy className="w-4 h-4" />,
        },
      ]
      : []),
    { label: 'Thông báo', href: '/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Cài đặt tài khoản', href: '/profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const brand = (
    <Link
      href="/"
      aria-label="Về trang chủ ReGive"
      onClick={() => setMobileOpen(false)}
      className="flex items-center gap-2.5 group no-underline shrink-0"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-p-s500 to-p-s400 flex items-center justify-center shadow-md shadow-p-s500/25 group-hover:scale-110 transition-transform duration-200">
        <Heart className="w-5 h-5 fill-white text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight text-n-s900">
        Re<span className="text-p-s600">Give</span>
      </span>
    </Link>
  );

  const sidebarNav = (
    <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm no-underline transition-colors ${active
              ? 'bg-p-s100 text-p-s700 font-semibold border border-p-s200'
              : 'text-n-s600 hover:bg-p-s50 hover:text-p-s700'
              }`}
          >
            <span className={active ? 'text-p-s600' : 'text-n-s500'}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const userMenuItems = [
    { key: 'dashboard', label: <Link href="/me/dashboard">Tổng quan của tôi</Link> },
    { key: 'profile', label: <Link href="/profile">Cài đặt tài khoản</Link> },
    { type: 'divider' as const },
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-dvh w-full">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-n-s100 text-n-s900 sticky top-0 h-dvh">
          <div className="h-16 px-5 flex items-center border-b border-n-s100">{brand}</div>
          {sidebarNav}
          <div className="p-3 border-t border-n-s100">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-p-s500 to-p-s400 text-white flex items-center justify-center text-sm font-black shrink-0">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-n-s900 truncate">{user?.fullName}</p>
                <p className="text-[11px] text-n-s400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-n-s50 hover:bg-n-s100 text-n-s600 text-sm font-semibold border border-n-s200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* ── Mobile Drawer ── */}
        <Drawer
          placement="left"
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          width={280}
          closeIcon={<X className="w-5 h-5 text-n-s900" />}
          styles={{ body: { padding: 0, background: '#ffffff' } }}
        >
          <div className="flex flex-col h-full text-n-s900">
            <div className="h-16 px-5 flex items-center border-b border-n-s100">{brand}</div>
            {sidebarNav}
            <div className="p-3 border-t border-n-s100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-n-s50 hover:bg-n-s100 text-n-s600 text-sm font-semibold border border-n-s200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          </div>
        </Drawer>

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 flex flex-col bg-gradient-to-br from-n-s50 via-white to-p-s50/30">
          {/* Topbar */}
          <header className="h-16 sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-n-s200 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-n-s200 text-n-s700 cursor-pointer"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                {title && (
                  <h1 className="text-base sm:text-lg font-bold text-n-s900 truncate leading-tight">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-n-s500 truncate hidden sm:block">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/notifications"
                className="relative p-2.5 rounded-xl border border-n-s200 text-n-s600 no-underline hover:border-p-s400 hover:text-p-s600 transition-colors"
                aria-label="Thông báo"
              >
                <Badge count={unread} size="small" offset={[3, -3]}>
                  <Bell className="w-5 h-5" />
                </Badge>
              </Link>

              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-n-s200 bg-white hover:border-p-s400 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-p-s100 to-p-s200 text-p-s700 font-black text-sm flex items-center justify-center">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-xs font-bold text-n-s800 max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-n-s400 hidden sm:block" />
                </button>
              </Dropdown>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
};
