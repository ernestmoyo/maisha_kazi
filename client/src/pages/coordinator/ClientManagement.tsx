import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  FileText,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useClients } from '@/hooks/useClients';
import { formatDate } from '@/utils/formatters';

function ClientsSkeleton() {
  return (
    <div className="space-y-6">
      <LoadingSkeleton height="2.5rem" width="50%" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="5rem" />
        ))}
      </div>
    </div>
  );
}

export default function ClientManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      limit: 100,
      search: search || undefined,
    }),
    [search],
  );

  const { data, isLoading } = useClients(params);

  const clients = data?.clients ?? [];

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <PageWrapper title="Client Management" subtitle="View and manage platform clients">
        <ClientsSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Client Management" subtitle="View and manage platform clients">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtle"
          />
          <input
            type="text"
            placeholder="Search clients by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Clients Table */}
        {clients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No clients found"
            description="No clients match your search criteria."
          />
        ) : (
          <Card padding="sm">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b border-stone-100 text-xs font-semibold text-dark-subtle uppercase tracking-wide">
              <div className="col-span-4">Client</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-1 text-center">Jobs</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-1" />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-stone-50">
              {clients.map((client) => (
                <div key={client.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggleExpand(client.id)}
                    className="w-full grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 px-4 py-4 text-left hover:bg-surface/50 transition-colors items-center"
                  >
                    {/* Client name + avatar */}
                    <div className="sm:col-span-4 flex items-center gap-3">
                      <Avatar
                        name={client.company || client.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-dark-subtle truncate sm:hidden">
                          {client.company || 'Individual'}
                        </p>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-sm text-dark truncate">
                        {client.company || '--'}
                      </p>
                    </div>

                    {/* Contact */}
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-sm text-dark-subtle truncate">
                        {client.email}
                      </p>
                    </div>

                    {/* Jobs */}
                    <div className="hidden sm:flex sm:col-span-1 justify-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/8 text-primary text-sm font-semibold">
                        {client.totalJobs}
                      </span>
                    </div>

                    {/* Joined */}
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-sm text-dark-subtle">
                        {formatDate(client.createdAt)}
                      </p>
                    </div>

                    {/* Expand icon */}
                    <div className="hidden sm:flex sm:col-span-1 justify-end">
                      {expandedId === client.id ? (
                        <ChevronUp size={16} className="text-dark-subtle" />
                      ) : (
                        <ChevronDown size={16} className="text-dark-subtle" />
                      )}
                    </div>

                    {/* Mobile stats */}
                    <div className="sm:hidden flex items-center gap-4 text-xs text-dark-subtle">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} />
                        {client.totalJobs} jobs
                      </span>
                      <span>{formatDate(client.createdAt)}</span>
                      {expandedId === client.id ? (
                        <ChevronUp size={14} className="ml-auto" />
                      ) : (
                        <ChevronDown size={14} className="ml-auto" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedId === client.id && (
                    <div className="px-4 pb-4 bg-surface/30">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-stone-100">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-dark-subtle uppercase tracking-wide">
                            Contact Details
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-dark">
                              <Mail size={14} className="text-dark-subtle shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-dark">
                                <Phone size={14} className="text-dark-subtle shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-dark-subtle uppercase tracking-wide">
                            Organization
                          </p>
                          <div className="flex items-center gap-2 text-sm text-dark">
                            <Building2 size={14} className="text-dark-subtle shrink-0" />
                            <span>{client.company || 'Individual Client'}</span>
                          </div>
                          <p className="text-xs text-dark-subtle">
                            Member since {formatDate(client.createdAt)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-dark-subtle uppercase tracking-wide">
                            Actions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/coordinator/jobs?client=${client.id}`)
                              }
                            >
                              <Briefcase size={14} />
                              View Jobs
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate('/coordinator/reports', {
                                  state: { csrClientId: client.id },
                                })
                              }
                            >
                              <FileText size={14} />
                              CSR Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
