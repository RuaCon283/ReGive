import React from 'react';
import { formatVND } from '@/lib/format';

interface ProgressBarProps {
  current: number;
  target: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  currentLabel?: string;
  targetLabel?: string;
  percentLabel?: string;
  size?: 'small' | 'default' | 'large';
  color?: string;
  trackColor?: string;
  className?: string;
  suffix?: React.ReactNode;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  showLabels = true,
  showPercentage = true,
  currentLabel,
  targetLabel,
  percentLabel,
  size = 'default',
  color,
  trackColor,
  className = '',
  suffix,
}) => {
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  const heightMap = { small: 'h-1.5', default: 'h-2.5', large: 'h-3.5' };
  const height = heightMap[size];

  const fillColor = color || (percent >= 100 ? '#024870' : '#18c9ff');
  const bgColor = trackColor || '#e2e8f0';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Top row: current + percentage */}
      {(showLabels || showPercentage) && (
        <div className="flex justify-between items-baseline">
          {showLabels && (
            <div>
              <span className="text-[11px] text-gray-400 font-semibold">
                {currentLabel || 'Đã gây quỹ'}
              </span>
              <span className="block text-base font-black text-p-s600">
                {formatVND(current)}
              </span>
            </div>
          )}
          {showPercentage && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                percent >= 100
                  ? 'bg-p-s100 text-p-s700 border-p-s300'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {percentLabel || `${percent}%`}
            </span>
          )}
        </div>
      )}

      {/* Bar */}
      <div
        className={`${height} w-full rounded-full overflow-hidden`}
        style={{ backgroundColor: bgColor }}
      >
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${percent}%`,
            backgroundColor: fillColor,
            backgroundImage:
              percent >= 100
                ? 'linear-gradient(90deg, #024870, #18c9ff)'
                : undefined,
          }}
        />
      </div>

      {/* Bottom row: target + suffix */}
      {showLabels && (
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-gray-400 font-medium">
            {targetLabel || `Mục tiêu: ${formatVND(target)}`}
          </span>
          {suffix}
        </div>
      )}
    </div>
  );
};

/* ─── Variant: simple bar without labels ─── */

interface SimpleProgressBarProps {
  percent: number;
  size?: 'small' | 'default' | 'large';
  color?: string;
  className?: string;
}

export const SimpleProgressBar: React.FC<SimpleProgressBarProps> = ({
  percent,
  size = 'default',
  color = '#18c9ff',
  className = '',
}) => {
  const heightMap = { small: 'h-1', default: 'h-2', large: 'h-2.5' };
  const height = heightMap[size];
  const clamped = Math.min(Math.max(percent, 0), 100);

  return (
    <div
      className={`${height} w-full rounded-full overflow-hidden ${className}`}
      style={{ backgroundColor: '#e2e8f0' }}
    >
      <div
        className={`${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
};