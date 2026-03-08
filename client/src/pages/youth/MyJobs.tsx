import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Banknote,
  ClipboardList,
} from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/store/AuthContext';
import StatusBadge from '@/components/common/StatusBadge';
import Card from '@/components/common/Card';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import { formatDate, formatCurrency, getServiceTypeLabel } from '@/utils/formatters';

type FilterTab = 'all' | 'active' | 'completed';

const KANBAN_COLUMNS = [
  { key: 'ASSIGNED', label: 'Assigned', accent: 'bg-sky-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', accent: 'bg-amber-400' },
  { key: 'COMPLETED', label: 'Completed', accent: 'bg-emerald-400' },
] as const;

export default function MyJobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data, isLoading } = useJobs({ status: undefined });

  const myJobs = useMemo(() => {
    if (!data?.jobs || !user) return [];
    return data.jobs.filter((job) => job.youthId === user.id);
  }, [data, user]);

  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') return myJobs;
    if (activeTab === 'active')
      return myJobs.filter(
        (j) => j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS',
      );
    return myJobs.filter((j) => j.status === 'COMPLETED');
  }, [myJobs, activeTab]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filteredJobs> = {
      ASSIGNED: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };
    filteredJobs.forEach((job) => {
      if (map[job.status]) map[job.status].push(job);
    });
    return map;
  }, [filteredJobs]);

  /* ---------- loading skeletons ---------- */
  if (isLoading) {
    return (
      <PageWrapper title="My Jobs" subtitle="Track your assigned work">
        {/* Tab skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} width="5rem" height="2.25rem" className="rounded-lg" />
          ))}
        </div>

        {/* Column skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-3">
              <LoadingSkeleton height="1.5rem" width="8rem" />
              {[1, 2].map((c) => (
                <LoadingSkeleton key={c} variant="card" height="9rem" />
              ))}
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  /* ---------- empty state ---------- */
  if (myJobs.length === 0) {
    return (
      <PageWrapper title="My Jobs" subtitle="Track your assigned work">
        <EmptyState
          icon={ClipboardList}
          title="No jobs assigned yet"
          description="Your coordinator will assign jobs to you. Check back soon!"
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Jobs" subtitle="Track your assigned work">
      {/* ---------- filter tabs ---------- */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-4 py-2 text-sm font-semibold font-body rounded-lg whitespace-nowrap
              transition-colors duration-200
              ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-dark-muted hover:bg-stone-100'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---------- kanban board ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="min-w-0">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${col.accent}`} />
              <h3 className="text-sm font-semibold font-body text-dark-muted uppercase tracking-wide">
                {col.label}
              </h3>
              <span className="ml-auto text-xs font-body text-dark-subtle bg-stone-100 rounded-full px-2 py-0.5">
                {grouped[col.key]?.length ?? 0}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {(grouped[col.key] ?? []).length === 0 && (
                <p className="text-xs text-dark-subtle text-center py-6 bg-white/50 rounded-xl border border-dashed border-stone-300">
                  No jobs here
                </p>
              )}

              {(grouped[col.key] ?? []).map((job) => (
                <Card
                  key={job.id}
                  hover
                  padding="sm"
                  onClick={() => navigate(`/youth/jobs/${job.id}`)}
                  className="active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold font-body text-dark leading-snug line-clamp-2">
                      {job.title}
                    </h4>
                    <StatusBadge status={job.status as 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'} />
                  </div>

                  <span className="inline-block text-xs font-medium font-body text-primary bg-primary/10 rounded px-2 py-0.5 mb-2">
                    {getServiceTypeLabel(job.serviceType)}
                  </span>

                  <div className="space-y-1.5 text-xs text-dark-subtle font-body">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="shrink-0" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Banknote size={13} className="shrink-0" />
                      <span className="font-semibold text-dark">
                        {formatCurrency(job.fee ?? 0)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
