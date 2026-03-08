import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Star,
  FileDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/common/Card';
import StatsCard from '@/components/common/StatsCard';
import Button from '@/components/common/Button';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { useClients } from '@/hooks/useClients';
import * as reportsApi from '@/api/reports';
import { formatCurrency } from '@/utils/formatters';

// African Modern palette colors for charts
const CHART_COLORS = [
  '#1B4332', // primary
  '#D97706', // accent
  '#2D6A4F', // primary-light
  '#F59E0B', // accent-light
  '#15803D', // success
  '#0369A1', // info
  '#B45309', // accent-dark
  '#78716C', // dark-subtle
  '#0F2921', // primary-dark
  '#DC2626', // error
  '#44403C', // dark-muted
  '#FEF9C3', // surface-warm
];

function ReportsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="8rem" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton variant="card" height="20rem" />
        <LoadingSkeleton variant="card" height="20rem" />
      </div>
      <LoadingSkeleton variant="card" height="20rem" />
    </div>
  );
}

export default function Reports() {
  const location = useLocation();
  const [selectedClientId, setSelectedClientId] = useState<string>(
    (location.state as { csrClientId?: string } | null)?.csrClientId ?? '',
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['platform-reports'],
    queryFn: () => reportsApi.getPlatformReports().then((res) => (res.data as any).data),
  });

  const { data: clientsData } = useClients({ limit: 100 });

  const handleGenerateCSR = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client first');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await reportsApi.generateCSRReport(selectedClientId);
      const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `csr-report-${selectedClientId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSR report downloaded successfully');
    } catch {
      toast.error('Failed to generate CSR report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Reports" subtitle="Platform analytics and CSR reporting">
        <ReportsSkeleton />
      </PageWrapper>
    );
  }

  const stats = reportData?.platformStats;
  const jobsByServiceType = reportData?.jobsByServiceType ?? [];
  const monthlyCompletions = reportData?.monthlyCompletions ?? [];
  const earningsDistribution = reportData?.youthEarningsDistribution ?? [];

  return (
    <PageWrapper title="Reports" subtitle="Platform analytics and CSR reporting">
      <div className="space-y-8">
        {/* Platform Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Jobs"
            value={stats?.totalJobs ?? 0}
            icon={Briefcase}
          />
          <StatsCard
            title="Total Youth"
            value={stats?.totalYouth ?? 0}
            icon={Users}
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            icon={DollarSign}
          />
          <StatsCard
            title="Average Rating"
            value={stats?.averageRating?.toFixed(1) ?? '0.0'}
            icon={Star}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs by Service Type - Pie Chart */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-primary" />
              <h2 className="text-lg font-heading font-semibold text-dark">
                Jobs by Service Type
              </h2>
            </div>

            {jobsByServiceType.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobsByServiceType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="serviceType"
                      label={(props: any) =>
                        `${props.name ?? ''} (${((props.percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {jobsByServiceType.map((_: unknown, index: number) => (
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-dark-subtle text-center py-16">
                No data available yet.
              </p>
            )}
          </Card>

          {/* Monthly Job Completions - Line Chart */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-accent" />
              <h2 className="text-lg font-heading font-semibold text-dark">
                Monthly Job Completions
              </h2>
            </div>

            {monthlyCompletions.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyCompletions}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#78716C' }}
                      tickLine={false}
                      axisLine={{ stroke: '#d6d3d1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#78716C' }}
                      tickLine={false}
                      axisLine={{ stroke: '#d6d3d1' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(28,25,23,0.1)',
                        fontFamily: '"DM Sans", system-ui, sans-serif',
                        fontSize: '0.8125rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#1B4332"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#1B4332', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#D97706', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-dark-subtle text-center py-16">
                No data available yet.
              </p>
            )}
          </Card>
        </div>

        {/* Youth Earnings Distribution - Bar Chart */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={18} className="text-success" />
            <h2 className="text-lg font-heading font-semibold text-dark">
              Youth Earnings Distribution
            </h2>
          </div>

          {earningsDistribution.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={earningsDistribution}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12, fill: '#78716C' }}
                    tickLine={false}
                    axisLine={{ stroke: '#d6d3d1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#78716C' }}
                    tickLine={false}
                    axisLine={{ stroke: '#d6d3d1' }}
                    allowDecimals={false}
                  />
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
                    wrapperStyle={{
                      fontFamily: '"DM Sans", system-ui, sans-serif',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Youth Count"
                    fill="#2D6A4F"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-dark-subtle text-center py-16">
              No data available yet.
            </p>
          )}
        </Card>

        {/* CSR Report Generation */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <FileDown size={18} className="text-info" />
            <h2 className="text-lg font-heading font-semibold text-dark">
              CSR Report Generation
            </h2>
          </div>

          <p className="text-sm text-dark-subtle mb-5">
            Generate a Corporate Social Responsibility report for a specific
            client. The report includes total jobs posted, spending, youth
            employed, and impact metrics.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm font-body
                bg-white rounded-lg border border-stone-200
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                appearance-none cursor-pointer"
            >
              <option value="">Select a client...</option>
              {clientsData?.clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company
                    ? `${client.company} - ${client.name}`
                    : client.name}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              onClick={handleGenerateCSR}
              disabled={!selectedClientId || isGenerating}
              isLoading={isGenerating}
            >
              {!isGenerating && <FileDown size={16} />}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
