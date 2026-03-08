import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

type Trend = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: Trend;
  trendValue?: string;
  className?: string;
}

const trendConfig: Record<Trend, { icon: LucideIcon; color: string }> = {
  up: { icon: TrendingUp, color: 'text-emerald-600' },
  down: { icon: TrendingDown, color: 'text-red-600' },
  neutral: { icon: Minus, color: 'text-dark-subtle' },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  className = '',
}: StatsCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;
  const trendColor = trend ? trendConfig[trend].color : '';

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white rounded-xl p-6
        shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]
        ${className}
      `}
    >
      {/* Subtle gradient accent in top-right */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-primary/8 to-accent/8 blur-lg" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-dark-subtle">{title}</p>
          <p className="text-3xl font-heading font-bold text-dark">{value}</p>

          {trend && trendValue && TrendIcon && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon size={14} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={22} className="text-primary" />
        </div>
      </div>
    </div>
  );
}
