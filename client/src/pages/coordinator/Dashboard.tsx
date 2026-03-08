import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Plus,
  UserPlus,
  Clock,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatsCard from '@/components/common/StatsCard';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { useCoordinatorSummary } from '@/hooks/useCoordinatorSummary';
import { formatCurrency, formatRelativeTime } from '@/utils/formatters';

const statusColors: Record<string, string> = {
  OPEN: 'bg-sky-100 text-sky-600',
  ASSIGNED: 'bg-purple-100 text-purple-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-600',
  COMPLETED: 'bg-emerald-100 text-emerald-600',
  DISPUTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-stone-100 text-stone-500',
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="8rem" />
        ))}
      </div>

      {/* Activity + Actions skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoadingSkeleton variant="card" height="20rem" />
        </div>
        <div>
          <LoadingSkeleton variant="card" height="20rem" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useCoordinatorSummary();

  if (isLoading) {
    return (
      <PageWrapper title="Dashboard" subtitle="Overview of your platform activity">
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Dashboard" subtitle="Overview of your platform activity">
      <div className="space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Youth"
            value={summary?.activeYouth ?? 0}
            icon={Users}
            trend="up"
            trendValue="Vetted & active"
          />
          <StatsCard
            title="Open Jobs"
            value={summary?.openJobs ?? 0}
            icon={Briefcase}
            trend="neutral"
            trendValue="Awaiting assignment"
          />
          <StatsCard
            title="Completed This Week"
            value={summary?.completedThisWeek ?? 0}
            icon={CheckCircle2}
            trend="up"
            trendValue="Jobs completed"
          />
          <StatsCard
            title="Total Fees Collected"
            value={formatCurrency(summary?.totalEarnings?.totalFees ?? 0)}
            icon={DollarSign}
            trend="up"
            trendValue="Platform revenue"
          />
        </div>

        {/* Activity Feed + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-heading font-semibold text-dark">
                Recent Activity
              </h2>
              <span className="text-xs text-dark-subtle font-medium">
                Latest updates
              </span>
            </div>

            {summary?.recentActivity && summary.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {summary.recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-3 relative"
                  >
                    {/* Timeline line */}
                    {index < summary.recentActivity.length - 1 && (
                      <div className="absolute left-[15px] top-[42px] bottom-0 w-px bg-stone-200" />
                    )}

                    {/* Activity icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        statusColors[activity.status] ?? 'bg-stone-100 text-dark-subtle'
                      }`}
                    >
                      <Clock size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark leading-snug">
                        <span className="font-medium">{activity.title}</span>
                        {activity.client && (
                          <span className="text-dark-subtle"> · {activity.client.name}</span>
                        )}
                        {activity.youth && (
                          <span className="text-dark-subtle"> → {activity.youth.name}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            statusColors[activity.status] ?? 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {activity.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-dark-subtle">
                          {formatRelativeTime(activity.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-subtle py-8 text-center">
                No recent activity to show.
              </p>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-heading font-semibold text-dark mb-5">
              Quick Actions
            </h2>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-start"
                onClick={() => navigate('/coordinator/jobs', { state: { openCreateModal: true } })}
              >
                <Plus size={18} />
                Create Job
              </Button>

              <Button
                variant="accent"
                size="lg"
                className="w-full justify-start"
                onClick={() => navigate('/coordinator/youth')}
              >
                <UserPlus size={18} />
                Add Youth
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start"
                onClick={() => navigate('/coordinator/reports')}
              >
                <Briefcase size={18} />
                View Reports
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start"
                onClick={() => navigate('/coordinator/clients')}
              >
                <Users size={18} />
                Manage Clients
              </Button>
            </div>

            {/* Summary cards */}
            <div className="mt-6 pt-5 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-subtle">Active Youth</span>
                <span className="font-semibold text-dark">
                  {summary?.activeYouth ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-subtle">Open Jobs</span>
                <span className="font-semibold text-dark">
                  {summary?.openJobs ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-subtle">Youth Earnings Paid</span>
                <span className="font-semibold text-dark">
                  {formatCurrency(summary?.totalEarnings?.youthEarnings ?? 0)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
