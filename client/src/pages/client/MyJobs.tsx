import { useState, useMemo } from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Search,
  ClipboardList,
} from 'lucide-react';
import { useJobs, useConfirmJob, useUpdateJobStatus } from '@/hooks/useJobs';
import { useAuth } from '@/store/AuthContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDate, getServiceTypeLabel } from '@/utils/formatters';
import toast from 'react-hot-toast';

type TabKey = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'DISPUTED', label: 'Disputed' },
];

const ITEMS_PER_PAGE = 8;

interface ConfirmModalState {
  isOpen: boolean;
  jobId: string;
  jobTitle: string;
  proofUrl?: string;
}

export default function MyJobs() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    jobId: '',
    jobTitle: '',
  });
  const [disputeReason, setDisputeReason] = useState('');

  const statusParam = activeTab === 'ALL' ? undefined : activeTab;

  const { data, isLoading, isError } = useJobs({
    page,
    limit: ITEMS_PER_PAGE,
    status: statusParam,
    search: search || undefined,
  });

  const confirmJob = useConfirmJob();
  const updateJobStatus = useUpdateJobStatus();

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Filter jobs belonging to this client (in case API returns all)
  const clientJobs = useMemo(() => {
    if (!user?.id) return jobs;
    return jobs.filter((j) => j.clientId === user.id);
  }, [jobs, user?.id]);

  const handleConfirmCompletion = async () => {
    try {
      await confirmJob.mutateAsync(confirmModal.jobId);
      toast.success('Job confirmed as completed! Thank you.');
      setConfirmModal({ isOpen: false, jobId: '', jobTitle: '' });
    } catch {
      toast.error('Failed to confirm job. Please try again.');
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute.');
      return;
    }
    try {
      await updateJobStatus.mutateAsync({
        id: confirmModal.jobId,
        status: 'DISPUTED',
      });
      toast.success('Dispute has been raised. Our team will review it.');
      setConfirmModal({ isOpen: false, jobId: '', jobTitle: '' });
      setDisputeReason('');
    } catch {
      toast.error('Failed to raise dispute. Please try again.');
    }
  };

  const openConfirmModal = (jobId: string, jobTitle: string, proofUrl?: string) => {
    setConfirmModal({ isOpen: true, jobId, jobTitle, proofUrl });
    setDisputeReason('');
  };

  return (
    <div className="min-h-screen bg-surface-gradient px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-dark mb-2">
            My Jobs
          </h1>
          <p className="text-dark-subtle font-body text-sm">
            Track and manage all your service requests in one place.
          </p>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-subtle" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-stone-200
                bg-white text-dark font-body text-sm
                placeholder:text-dark-subtle/50
                focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold font-body whitespace-nowrap
                transition-all duration-200
                ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-dark-muted hover:bg-stone-100'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="md">
                <div className="flex items-start gap-4">
                  <LoadingSkeleton variant="circle" width="3rem" height="3rem" />
                  <div className="flex-1 space-y-3">
                    <LoadingSkeleton width="60%" height="1.25rem" />
                    <LoadingSkeleton width="40%" height="0.875rem" />
                    <div className="flex gap-4">
                      <LoadingSkeleton width="6rem" height="0.875rem" />
                      <LoadingSkeleton width="6rem" height="0.875rem" />
                    </div>
                  </div>
                  <LoadingSkeleton width="5rem" height="2rem" className="rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card padding="lg" className="text-center">
            <AlertTriangle size={40} className="text-error mx-auto mb-3" />
            <p className="text-dark font-semibold font-body">Failed to load jobs</p>
            <p className="text-dark-subtle text-sm font-body mt-1">
              Please check your connection and try again.
            </p>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !isError && clientJobs.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="No jobs found"
            description={
              activeTab === 'ALL'
                ? "You haven't requested any services yet. Get started by requesting your first service!"
                : `No ${activeTab.toLowerCase().replace('_', ' ')} jobs at the moment.`
            }
            actionLabel={activeTab === 'ALL' ? 'Request a Service' : undefined}
            onAction={activeTab === 'ALL' ? () => (window.location.href = '/client/request') : undefined}
          />
        )}

        {/* Job Cards */}
        {!isLoading && !isError && clientJobs.length > 0 && (
          <div className="space-y-4">
            {clientJobs.map((job) => (
              <Card key={job.id} padding="md" hover className="group">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Service icon */}
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Briefcase size={22} className="text-accent" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-base font-heading font-semibold text-dark truncate">
                        {job.title}
                      </h3>
                      <StatusBadge status={job.status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-dark-subtle font-body">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase size={13} />
                        {getServiceTypeLabel(job.serviceType)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(job.createdAt)}
                      </span>
                      {job.youthId && (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          <User size={13} />
                          Youth assigned
                        </span>
                      )}
                    </div>

                    {/* Dispute info */}
                    {job.status === 'DISPUTED' && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-red-700 font-medium font-body">
                          <AlertTriangle size={13} className="inline mr-1" />
                          This job is under dispute review by our coordinator team.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right side: price + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 shrink-0">
                    <span className="text-lg font-heading font-bold text-dark">
                      {formatCurrency(job.fee ?? 0)}
                    </span>

                    {job.status === 'COMPLETED' && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => openConfirmModal(job.id, job.title)}
                      >
                        <CheckCircle2 size={14} />
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="
                p-2 rounded-lg bg-white border border-stone-200
                text-dark-muted hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-dark-subtle text-sm">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`
                          w-9 h-9 rounded-lg text-sm font-semibold font-body
                          transition-all duration-200
                          ${
                            p === page
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white text-dark-muted hover:bg-stone-100'
                          }
                        `}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="
                p-2 rounded-lg bg-white border border-stone-200
                text-dark-muted hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Confirm Completion Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, jobId: '', jobTitle: '' })}
        title="Confirm Job Completion"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-dark-muted font-body">
            Please review the work for <span className="font-semibold text-dark">{confirmModal.jobTitle}</span> and
            confirm completion or raise a dispute.
          </p>

          {/* Proof Photo */}
          <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-6 text-center">
            {confirmModal.proofUrl ? (
              <img
                src={confirmModal.proofUrl}
                alt="Proof of work"
                className="w-full max-h-64 object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-dark-subtle">
                <ImageIcon size={40} className="opacity-40" />
                <p className="text-sm font-body">
                  Proof photo from the youth worker will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Dispute Reason */}
          <div>
            <label className="text-xs font-semibold text-dark-muted font-body mb-1 block">
              Dispute Reason (only if raising a dispute)
            </label>
            <textarea
              rows={2}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe the issue..."
              className="
                w-full px-3 py-2 rounded-lg border border-stone-200
                bg-white text-dark font-body text-sm resize-none
                placeholder:text-dark-subtle/50
                focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                transition-all duration-200
              "
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="danger"
              size="md"
              onClick={handleRaiseDispute}
              isLoading={updateJobStatus.isPending}
              className="flex-1"
            >
              <AlertTriangle size={16} />
              Raise Dispute
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmCompletion}
              isLoading={confirmJob.isPending}
              className="flex-1"
            >
              <CheckCircle2 size={16} />
              Confirm Completion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
