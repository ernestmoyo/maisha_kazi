import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Briefcase,
  Calendar,
  MapPin,
  DollarSign,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';
import Avatar from '@/components/common/Avatar';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useJobs, useCreateJob, useAssignJob } from '@/hooks/useJobs';
import { useYouth } from '@/hooks/useYouth';
import { useClients } from '@/hooks/useClients';
import {
  formatCurrency,
  formatDate,
  getServiceTypeLabel,
} from '@/utils/formatters';
import type { Job } from '@/api/jobs';

const ITEMS_PER_PAGE = 12;

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'DISPUTED', label: 'Disputed' },
] as const;

const SERVICE_TYPES = [
  'CAR_WASH',
  'CLEANING',
  'GARDENING',
  'WINDOW_FIX',
  'HANDYWORK',
  'OTHER',
] as const;

const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  serviceType: z.string().min(1, 'Please select a service type'),
  location: z.string().min(2, 'Location is required'),
  budget: z.string().min(1, 'Fee is required').transform((val) => Number(val)).pipe(z.number().positive('Fee must be greater than 0')),
  clientId: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
});

type CreateJobFormData = z.infer<typeof createJobSchema>;

function serviceTypeBadgeVariant(type: string): 'success' | 'warning' | 'info' | 'neutral' | 'danger' {
  const map: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
    cleaning: 'info',
    gardening: 'success',
    car_wash: 'info',
    window_fix: 'warning',
    handywork: 'warning',
    other: 'neutral',
  };
  return map[type.toLowerCase()] ?? 'neutral';
}

function JobsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} height="2.25rem" width="5rem" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="14rem" />
        ))}
      </div>
    </div>
  );
}

interface AssignYouthModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

function AssignYouthModal({ job, isOpen, onClose }: AssignYouthModalProps) {
  const [search, setSearch] = useState('');
  const { data: youthData, isLoading } = useYouth({
    limit: 50,
    isVetted: true,
    search: search || undefined,
  });
  const assignMutation = useAssignJob();

  const handleAssign = (youthId: string) => {
    assignMutation.mutate(
      { id: job.id, youthId },
      {
        onSuccess: () => {
          toast.success('Youth assigned to job successfully');
          onClose();
        },
        onError: () => {
          toast.error('Failed to assign youth. Please try again.');
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Youth to "${job.title}"`} size="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtle"
          />
          <input
            type="text"
            placeholder="Search vetted youth..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm font-body
              bg-surface rounded-lg border border-stone-200
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              placeholder:text-dark-subtle/60"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="table-row" />
            ))}
          </div>
        ) : youthData?.youth && youthData.youth.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {youthData.youth.map((y) => (
              <div
                key={y.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={y.name} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-dark">{y.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-dark-subtle">
                        {y.completedJobs} jobs
                      </span>
                      <span className="text-xs text-dark-subtle">
                        Rating: {y.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAssign(y.id)}
                  isLoading={assignMutation.isPending}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-subtle text-center py-8">
            No vetted youth found.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default function JobManagement() {
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(
    (location.state as { openCreateModal?: boolean } | null)?.openCreateModal ?? false,
  );
  const [assignJob, setAssignJob] = useState<Job | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: ITEMS_PER_PAGE,
      status: statusFilter || undefined,
      search: search || undefined,
    }),
    [page, statusFilter, search],
  );

  const { data, isLoading } = useJobs(params);
  const createMutation = useCreateJob();
  const { data: clientsData } = useClients({ limit: 100 });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: '',
      description: '',
      serviceType: '',
      location: '',
      budget: '',
      clientId: '',
      scheduledAt: '',
      notes: '',
    },
  });

  const onCreateSubmit = (formData: CreateJobFormData) => {
    createMutation.mutate(
      {
        title: formData.title,
        description: formData.description,
        serviceType: formData.serviceType,
        location: formData.location,
        fee: formData.budget,
        scheduledAt: formData.scheduledAt || undefined,
        notes: formData.notes || undefined,
        clientId: formData.clientId || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Job created successfully');
          setShowCreateModal(false);
          reset();
        },
        onError: () => {
          toast.error('Failed to create job. Please try again.');
        },
      },
    );
  };

  const inputClasses =
    'w-full px-3 py-2.5 text-sm font-body bg-white rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-dark-subtle/60 transition-all duration-200';

  const labelClasses = 'block text-sm font-medium text-dark mb-1.5';

  const errorClasses = 'text-xs text-error mt-1';

  if (isLoading) {
    return (
      <PageWrapper
        title="Job Management"
        subtitle="Create, assign, and manage jobs"
        actions={
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Job
          </Button>
        }
      >
        <JobsSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Job Management"
      subtitle="Create, assign, and manage jobs"
      actions={
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Create Job
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'text-dark-subtle hover:bg-stone-100 hover:text-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtle"
          />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-9 py-2.5 text-sm font-body
              bg-white rounded-lg border border-stone-200
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              placeholder:text-dark-subtle/60 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-subtle hover:text-dark"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Job Cards Grid */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={
              statusFilter
                ? `No ${statusFilter.toLowerCase().replace('_', ' ')} jobs at the moment.`
                : 'Create your first job to get started.'
            }
            actionLabel="Create Job"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-dark leading-snug line-clamp-2 flex-1 mr-2">
                    {job.title}
                  </h3>
                  <StatusBadge status={job.status as 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'} />
                </div>

                <Badge variant={serviceTypeBadgeVariant(job.serviceType)} size="sm">
                  {getServiceTypeLabel(job.serviceType)}
                </Badge>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-dark-subtle">
                    <MapPin size={13} />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-dark-subtle">
                    <DollarSign size={13} />
                    <span className="font-medium text-dark">
                      {formatCurrency(job.fee ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-dark-subtle">
                    <Calendar size={13} />
                    <span>{formatDate(job.createdAt)}</span>
                  </div>

                  {job.youthId && (
                    <div className="flex items-center gap-2 text-xs text-dark-subtle">
                      <UserCheck size={13} />
                      <span>Assigned</span>
                    </div>
                  )}
                </div>

                {/* Assign action for open jobs */}
                {job.status === 'OPEN' && (
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setAssignJob(job)}
                    >
                      <UserCheck size={14} />
                      Assign Youth
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-dark-subtle">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, total)} of {total} jobs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-white'
                          : 'text-dark-subtle hover:bg-stone-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Create New Job"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreateSubmit as any)} className="space-y-4">
          <div>
            <label className={labelClasses}>Title</label>
            <input
              {...register('title')}
              className={inputClasses}
              placeholder="e.g., Office Deep Cleaning"
            />
            {errors.title && (
              <p className={errorClasses}>{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              {...register('description')}
              className={`${inputClasses} resize-none`}
              rows={3}
              placeholder="Describe the job in detail..."
            />
            {errors.description && (
              <p className={errorClasses}>{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Service Type</label>
              <select {...register('serviceType')} className={inputClasses}>
                <option value="">Select type...</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getServiceTypeLabel(type)}
                  </option>
                ))}
              </select>
              {errors.serviceType && (
                <p className={errorClasses}>{errors.serviceType.message}</p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Location</label>
              <input
                {...register('location')}
                className={inputClasses}
                placeholder="e.g., Dar es Salaam, Kinondoni"
              />
              {errors.location && (
                <p className={errorClasses}>{errors.location.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Fee (TSH)</label>
              <input
                type="number"
                {...register('budget')}
                className={inputClasses}
                placeholder="50000"
              />
              {errors.budget && (
                <p className={errorClasses}>{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Scheduled Date</label>
              <input
                type="datetime-local"
                {...register('scheduledAt')}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Client (optional)</label>
            <select {...register('clientId')} className={inputClasses}>
              <option value="">No client (coordinator-created)</option>
              {clientsData?.clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company ? `${client.company} - ${client.name}` : client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Notes (optional)</label>
            <textarea
              {...register('notes')}
              className={`${inputClasses} resize-none`}
              rows={2}
              placeholder="Additional notes or instructions..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              <Plus size={16} />
              Create Job
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Youth Modal */}
      {assignJob && (
        <AssignYouthModal
          job={assignJob}
          isOpen={!!assignJob}
          onClose={() => setAssignJob(null)}
        />
      )}
    </PageWrapper>
  );
}
