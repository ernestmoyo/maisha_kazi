import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Briefcase,
  Users,
  DollarSign,
  Clock,
  Download,
  Heart,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import Card from '@/components/common/Card';
import StatsCard from '@/components/common/StatsCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import Button from '@/components/common/Button';
import { getCSRReport } from '@/api/clients';
import { formatCurrency } from '@/utils/formatters';

// African Modern color palette for charts
const CHART_COLORS = [
  '#1B4332', // primary deep green
  '#D97706', // accent amber
  '#2D6A4F', // primary light
  '#B45309', // accent dark
  '#15803D', // success green
  '#0369A1', // info blue
  '#78716C', // muted stone
  '#F59E0B', // accent light
];

export default function CSRReport() {
  const { user } = useAuth();

  const { data: report, isLoading } = useQuery({
    queryKey: ['csr-report', user?.id],
    queryFn: () => getCSRReport(user!.id).then((res) => (res.data as unknown as { data: import('@/api/clients').CSRReport }).data),
    enabled: !!user?.id,
  });

  // Estimate community impact hours (avg 4h per job)
  const impactHours = useMemo(() => {
    return (report?.totalJobsPosted ?? 0) * 4;
  }, [report?.totalJobsPosted]);

  // Build monthly trend data with both jobs and spending
  const monthlyTrendData = useMemo(() => {
    if (!report?.monthlySpending) return [];
    return report.monthlySpending.map((item) => ({
      month: item.month,
      spending: item.amount,
      // Estimate jobs based on average budget
      jobs: report.totalJobsPosted
        ? Math.round(
            (item.amount /
              (report.totalSpent / report.totalJobsPosted)) *
              1,
          )
        : 0,
    }));
  }, [report]);

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-gradient px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <LoadingSkeleton variant="card" height="12rem" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" height="8rem" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="card" height="20rem" />
            <LoadingSkeleton variant="card" height="20rem" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-gradient px-4 py-8 sm:px-6 lg:px-8 print:bg-white print:px-0">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light mb-8 print:rounded-none print:mb-4">
          {/* African pattern overlay */}
          <div className="absolute inset-0 bg-african-pattern opacity-20" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
              <Heart size={14} className="text-accent-light" />
              <span className="text-xs font-semibold text-white/90 font-body">Community Impact</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-heading font-bold text-white mb-3">
              Your Community Impact
            </h1>
            <p className="text-lg text-white/80 font-body max-w-lg mx-auto">
              {report?.clientName ?? user?.name ?? 'Your Organization'} is making a
              real difference in the lives of young people.
            </p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end mb-6 print:hidden">
          <Button variant="outline" size="md" onClick={handleExportPDF}>
            <Download size={16} />
            Export as PDF
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Jobs This Month"
            value={report?.totalJobsPosted ?? 0}
            icon={Briefcase}
            trend="up"
            trendValue="vs last month"
          />
          <StatsCard
            title="Youth Employed"
            value={report?.youthEmployed ?? 0}
            icon={Users}
            trend="up"
            trendValue="young people"
          />
          <StatsCard
            title="Total Paid to Youth"
            value={formatCurrency(report?.totalSpent ?? 0)}
            icon={DollarSign}
            trend="up"
            trendValue="invested"
          />
          <StatsCard
            title="Community Impact Hours"
            value={`${impactHours}h`}
            icon={Clock}
            trend="up"
            trendValue="of productive work"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart: Jobs by Service Type */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-dark">
                  Jobs by Service Type
                </h3>
                <p className="text-xs text-dark-subtle font-body">
                  Distribution of services requested
                </p>
              </div>
            </div>

            {report?.jobsByCategory && report.jobsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={report.jobsByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {report.jobsByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(28,25,23,0.1)',
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.75rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-dark-subtle text-sm font-body">
                No data available yet
              </div>
            )}
          </Card>

          {/* Line Chart: Monthly Trend */}
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-dark">
                  Monthly Trend
                </h3>
                <p className="text-xs text-dark-subtle font-body">
                  Jobs and spending over time
                </p>
              </div>
            </div>

            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fontFamily: '"DM Sans", system-ui, sans-serif', fill: '#78716C' }}
                    axisLine={{ stroke: '#D6D3D1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fontFamily: '"DM Sans", system-ui, sans-serif', fill: '#78716C' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fontFamily: '"DM Sans", system-ui, sans-serif', fill: '#78716C' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(28,25,23,0.1)',
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.8125rem',
                    }}
                    formatter={(value: unknown, name: unknown) => {
                      if (name === 'spending') return [formatCurrency(Number(value)), 'Spending'];
                      return [Number(value), 'Jobs'];
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="jobs"
                    name="Jobs"
                    stroke="#1B4332"
                    strokeWidth={2.5}
                    dot={{ fill: '#1B4332', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="spending"
                    name="Spending"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ fill: '#D97706', r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-dark-subtle text-sm font-body">
                No data available yet
              </div>
            )}
          </Card>
        </div>

        {/* Youth Impact Stories */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Star size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-dark">
                Youth Impact Stories
              </h3>
              <p className="text-xs text-dark-subtle font-body">
                Young professionals who have worked on your jobs
              </p>
            </div>
          </div>

          {(report?.youthEmployed ?? 0) > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Generate placeholder youth stories based on the count */}
              {Array.from({ length: Math.min(report?.youthEmployed ?? 0, 6) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="
                      flex items-center gap-3 p-4 rounded-xl
                      bg-gradient-to-br from-surface-warm/50 to-surface-cool/50
                      border border-stone-100
                    "
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm font-body shrink-0"
                      style={{
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    >
                      {`Y${i + 1}`}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark font-body truncate">
                        Youth Professional #{i + 1}
                      </p>
                      <p className="text-xs text-dark-subtle font-body">
                        Completed jobs through your support
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users size={40} className="text-dark-subtle/30 mx-auto mb-3" />
              <p className="text-sm text-dark-subtle font-body">
                Youth impact stories will appear here as youth complete your jobs.
              </p>
            </div>
          )}
        </Card>

        {/* Footer note */}
        <div className="text-center print:hidden">
          <p className="text-xs text-dark-subtle font-body">
            This report reflects your organization's contribution to youth employment in the community.
          </p>
        </div>
      </div>
    </div>
  );
}
