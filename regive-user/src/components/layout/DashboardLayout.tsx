'use client';

import React from 'react';
import { DashboardShell } from './DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <DashboardShell title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {children}
      </div>
    </DashboardShell>
  );
};