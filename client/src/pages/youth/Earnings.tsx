import { useMemo } from 'react';
import {
  Banknote,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/store/AuthContext';
import { useYouthEarnings } from '@/hooks/useYouth';
import Card from '@/components/common/Card';
import StatsCard from '@/components/common/StatsCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import Badge from '@/components/common/Badge';
import PageWrapper from '@/components/layout/PageWrapper';
import { formatCurrency, formatDate } from '@/utils/formatters';

/* ---------- helpers ---------- */
function getWeekEarnings(
  earnings: Array<{ amount: number; date: string }>,
): number {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return earnings
    .filter((e) => new Date(e.date) >= weekAgo)
    .reduce((sum, e) => sum + e.amount, 0);
}

function getMonthEarnings(
  earnings: Array<{ amount: number; date: string }>,
): number {
  const now = new Date();
  return earnings
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

function buildMonthlyChart(
  earnings: Array<{ amount: number; date: string }>,
): Array<{ month: string; amount: number }> {
  const monthMap = new Map<string, number>();
  const now = new Date();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap.set(key, 0);
  }

  earnings.forEach((e) => {
    const d = new Date(e.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount);
    }
  });

  return Array.from(monthMap.entries()).map(([month, amount]) => ({
    month,
    amount,
  }));
}

/* ---------- custom tooltip ---------- */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg px-3 py-2 ring-1 ring-stone-200">
      <p className="text-xs font-body text-dark-subtle">{label}</p>
      <p className="text-sm font-body font-bold text-dark">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function Earnings() {
  const { user } = useAuth();
  const { data, isLoading } = useYouthEarnings(user?.id ?? '');

  const weekEarnings = useMemo(
    () => (data?.earnings ? getWeekEarnings(data.earnings) : 0),
    [data],
  );

  const monthEarnings = useMemo(
    () => (data?.earnings ? getMonthEarnings(data.earnings) : 0),
    [data],
  );

  const chartData = useMemo(
    () => (data?.earnings ? buildMonthlyChart(data.earnings) : []),
    [data],
  );

  /* ---------- loading ---------- */
  if (isLoading) {
    return (
      <PageWrapper title="Earnings" subtitle="Track your income">
        {/* Summary skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" height="7rem" />
          ))}
        </div>

        {/* Chart skeleton */}
        <LoadingSkeleton variant="card" height="16rem" className="mb-6" />

        {/* List skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} variant="table-row" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  const earnings = data?.earnings ?? [];

  return (
    <PageWrapper title="Earnings" subtitle="Track your income">
      {/* ===== Summary cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="This Week"
          value={formatCurrency(weekEarnings)}
          icon={Wallet}
          trend={weekEarnings > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(monthEarnings)}
          icon={Calendar}
          trend={monthEarnings > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="All Time"
          value={formatCurrency(data?.totalEarnings ?? 0)}
          icon={TrendingUp}
        />
      </div>

      {/* ===== Chart ===== */}
      {earnings.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-base font-heading font-semibold text-dark mb-4">
            Monthly Trend
          </h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#78716C', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#78716C', fontFamily: 'DM Sans' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(27,67,50,0.05)' }} />
                <Bar
                  dataKey="amount"
                  fill="#1B4332"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ===== Recent earnings list ===== */}
      <Card>
        <h2 className="text-base font-heading font-semibold text-dark mb-4">
          Recent Earnings
        </h2>

        {earnings.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No earnings yet"
            description="Complete jobs to start earning. Your income will show up here."
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {earnings.map((earning) => (
              <li
                key={earning.jobId}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={16} className="text-emerald-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-dark truncate">
                    {earning.jobTitle}
                  </p>
                  <p className="text-xs font-body text-dark-subtle">
                    {formatDate(earning.date)}
                  </p>
                </div>

                {/* Amount + status */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-body font-bold text-dark">
                    {formatCurrency(earning.amount)}
                  </p>
                  <Badge
                    variant={earning.status === 'paid' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {earning.status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageWrapper>
  );
}
