import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  BarChart3,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency, getServiceTypeLabel, formatRelativeTime } from '@/utils/formatters';

export default function BrandedPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch recent jobs
  const { data: jobsData, isLoading } = useJobs({ page: 1, limit: 5 });

  const recentJobs = useMemo(() => {
    if (!jobsData?.jobs || !user?.id) return [];
    return jobsData.jobs.filter((j) => j.clientId === user.id).slice(0, 5);
  }, [jobsData, user?.id]);

  // Quick stats
  const stats = useMemo(() => {
    const all = jobsData?.jobs?.filter((j) => j.clientId === user?.id) ?? [];
    return {
      total: all.length,
      active: all.filter((j) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(j.status)).length,
      completed: all.filter((j) => j.status === 'COMPLETED').length,
      totalSpent: all.reduce((sum, j) => sum + Number(j.fee ?? 0), 0),
    };
  }, [jobsData, user?.id]);

  const orgName = user?.name ?? 'Your Organization';

  return (
    <div className="min-h-screen bg-surface-gradient">
      {/* Branded Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-african-pattern opacity-15" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                <Sparkles size={14} className="text-accent-light" />
                <span className="text-xs font-semibold text-white/90 font-body">Client Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-2">
                Welcome back,
              </h1>
              <p className="text-xl sm:text-2xl text-white/80 font-heading font-medium">
                {orgName}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="accent"
                size="lg"
                onClick={() => navigate('/client/request')}
                className="shadow-lg"
              >
                <Plus size={18} />
                Request a Service
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-14 relative z-10">
          <Card padding="md" className="text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Briefcase size={20} className="text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              {isLoading ? '--' : stats.total}
            </p>
            <p className="text-xs text-dark-subtle font-body mt-1">Total Jobs</p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-accent" />
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              {isLoading ? '--' : stats.active}
            </p>
            <p className="text-xs text-dark-subtle font-body mt-1">Active</p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={20} className="text-success" />
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              {isLoading ? '--' : stats.completed}
            </p>
            <p className="text-xs text-dark-subtle font-body mt-1">Completed</p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={20} className="text-info" />
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              {isLoading ? '--' : formatCurrency(stats.totalSpent)}
            </p>
            <p className="text-xs text-dark-subtle font-body mt-1">Total Invested</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-dark">
                      Recent Activity
                    </h2>
                    <p className="text-xs text-dark-subtle font-body">
                      Your latest service requests
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/client/jobs')}
                  className="text-sm text-primary font-semibold font-body hover:text-primary-light transition-colors inline-flex items-center gap-1"
                >
                  View All
                  <ArrowRight size={14} />
                </button>
              </div>

              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <LoadingSkeleton key={i} variant="table-row" />
                  ))}
                </div>
              )}

              {!isLoading && recentJobs.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase size={40} className="text-dark-subtle/30 mx-auto mb-3" />
                  <p className="text-sm text-dark-subtle font-body mb-4">
                    No service requests yet. Get started!
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/client/request')}
                  >
                    <Plus size={16} />
                    Request Your First Service
                  </Button>
                </div>
              )}

              {!isLoading && recentJobs.length > 0 && (
                <div className="divide-y divide-stone-100">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Briefcase size={18} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark font-body truncate">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-dark-subtle font-body">
                            {getServiceTypeLabel(job.serviceType)}
                          </span>
                          <span className="text-dark-subtle/30">|</span>
                          <span className="text-xs text-dark-subtle font-body">
                            {formatRelativeTime(job.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={job.status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'} />
                        <span className="text-xs font-semibold text-dark font-body">
                          {formatCurrency(job.fee ?? 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar: Quick Actions + Impact Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card padding="lg">
              <h3 className="text-base font-heading font-semibold text-dark mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/client/request')}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-xl
                    bg-primary/5 hover:bg-primary/10
                    transition-all duration-200 text-left group
                  "
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark font-body">New Service Request</p>
                    <p className="text-xs text-dark-subtle font-body">Post a new job</p>
                  </div>
                  <ArrowRight size={16} className="text-dark-subtle group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/client/jobs')}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-xl
                    bg-accent/5 hover:bg-accent/10
                    transition-all duration-200 text-left group
                  "
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Briefcase size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark font-body">Manage Jobs</p>
                    <p className="text-xs text-dark-subtle font-body">Track and confirm</p>
                  </div>
                  <ArrowRight size={16} className="text-dark-subtle group-hover:text-accent transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/client/csr-report')}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-xl
                    bg-info/5 hover:bg-info/10
                    transition-all duration-200 text-left group
                  "
                >
                  <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                    <BarChart3 size={18} className="text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark font-body">CSR Report</p>
                    <p className="text-xs text-dark-subtle font-body">View your impact</p>
                  </div>
                  <ArrowRight size={16} className="text-dark-subtle group-hover:text-info transition-colors" />
                </button>
              </div>
            </Card>

            {/* Impact Summary */}
            <Card padding="lg" className="relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-accent/10 blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-accent" />
                  <h3 className="text-base font-heading font-semibold text-dark">
                    Youth Impact
                  </h3>
                </div>
                <p className="text-sm text-dark-muted font-body leading-relaxed mb-4">
                  Every service you request creates income opportunities for young
                  professionals in your community.
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-heading font-bold text-primary">
                      {isLoading ? '--' : stats.completed}
                    </p>
                    <p className="text-[10px] text-dark-subtle font-body uppercase tracking-wider">
                      Jobs Done
                    </p>
                  </div>
                  <div className="w-px h-10 bg-stone-200" />
                  <div className="text-center">
                    <p className="text-2xl font-heading font-bold text-accent">
                      {isLoading ? '--' : `${stats.completed * 4}h`}
                    </p>
                    <p className="text-[10px] text-dark-subtle font-body uppercase tracking-wider">
                      Impact Hours
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-primary/10 border border-accent/15 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-heading font-semibold text-dark mb-1">
              Need something done?
            </h3>
            <p className="text-sm text-dark-muted font-body">
              Our network of skilled youth professionals is ready to help. Submit
              a request and get matched within hours.
            </p>
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={() => navigate('/client/request')}
            className="shrink-0"
          >
            Request a Service
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
