import React from 'react';
import { Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';

export type TimelineStatus = 'completed' | 'in_progress' | 'upcoming';

export interface TimelineItem {
  phase?: string;
  title: string;
  date?: string;
  description?: string;
  status?: TimelineStatus;
}

interface TimelineProps {
  items: TimelineItem[];
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const STATUS_CONFIG: Record<
  TimelineStatus,
  { dotClass: string; icon: React.ReactNode }
> = {
  completed: {
    dotClass: 'bg-p-s600',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-p-s600" />,
  },
  in_progress: {
    dotClass: 'bg-amber-500 animate-pulse',
    icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  },
  upcoming: {
    dotClass: 'bg-gray-300',
    icon: <Circle className="w-3.5 h-3.5 text-gray-300" />,
  },
};

export const Timeline: React.FC<TimelineProps> = ({
  items,
  title,
  icon,
  className = '',
}) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h4 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
          {icon || <Calendar className="w-4 h-4 text-p-s600" />}
          {title}
        </h4>
      )}

      <div className="relative border-l-2 border-p-s200 ml-4 pl-6 space-y-6">
        {items.map((item, i) => {
          const status = item.status || 'upcoming';
          const cfg = STATUS_CONFIG[status];

          return (
            <div key={i} className="relative group">
              {/* Dot on the line */}
              <span
                className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-xs ${cfg.dotClass}`}
              />

              {/* Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.phase && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-p-s700 bg-p-s50 px-2.5 py-0.5 rounded-md">
                        {item.phase}
                      </span>
                    )}
                    <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      {cfg.icon}
                      {item.title}
                    </h5>
                  </div>
                  {item.date && (
                    <span className="text-xs text-gray-400 font-mono">
                      {item.date}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Vertical Steps variant (for order status) ─── */

interface StepItem {
  title: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
}

interface VerticalStepsProps {
  steps: StepItem[];
  className?: string;
}

export const VerticalSteps: React.FC<VerticalStepsProps> = ({
  steps,
  className = '',
}) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={`space-y-0 ${className}`}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex gap-3">
            {/* Indicator column */}
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border-2 ${
                  step.completed
                    ? 'bg-p-s600 border-p-s600 text-white'
                    : step.active
                    ? 'bg-white border-p-s600 text-p-s600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] ${
                    step.completed ? 'bg-p-s600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-bold ${
                  step.completed || step.active
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};