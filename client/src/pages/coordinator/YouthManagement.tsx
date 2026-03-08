import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Star,
  Briefcase,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useYouth, useYouthById, useVetYouth } from '@/hooks/useYouth';
import type { Youth } from '@/api/youth';

// Fix default Leaflet marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ITEMS_PER_PAGE = 12;

const DAR_ES_SALAAM: [number, number] = [-6.7924, 39.2083];

// Simulated youth locations around Tanzania for map display
function getYouthLocation(youth: Youth): [number, number] {
  // Generate deterministic coordinates based on youth id
  let hash = 0;
  for (let i = 0; i < youth.id.length; i++) {
    hash = youth.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = -6.7924 + ((hash % 200) - 100) * 0.01;
  const lng = 39.2083 + (((hash >> 8) % 200) - 100) * 0.01;
  return [lat, lng];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.round(rating)
              ? 'fill-accent text-accent'
              : 'text-stone-300'
          }
        />
      ))}
      <span className="text-xs text-dark-subtle ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function YouthSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search / filters skeleton */}
      <div className="flex gap-4">
        <LoadingSkeleton height="2.5rem" width="60%" />
        <LoadingSkeleton height="2.5rem" width="20%" />
        <LoadingSkeleton height="2.5rem" width="20%" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" height="14rem" />
        ))}
      </div>
    </div>
  );
}

interface YouthDetailModalProps {
  youthId: string;
  isOpen: boolean;
  onClose: () => void;
}

function YouthDetailModal({ youthId, isOpen, onClose }: YouthDetailModalProps) {
  const { data: youth, isLoading } = useYouthById(youthId);
  const vetMutation = useVetYouth();

  const handleVet = () => {
    vetMutation.mutate(youthId, {
      onSuccess: () => {
        toast.success('Youth has been vetted successfully');
        onClose();
      },
      onError: () => {
        toast.error('Failed to vet youth. Please try again.');
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Youth Profile" size="lg">
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <LoadingSkeleton variant="circle" width="4rem" height="4rem" />
            <div className="space-y-2 flex-1">
              <LoadingSkeleton height="1.25rem" width="60%" />
              <LoadingSkeleton height="0.875rem" width="40%" />
            </div>
          </div>
          <LoadingSkeleton height="6rem" />
        </div>
      ) : youth ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={youth.name} size="xl" />
            <div>
              <h3 className="text-lg font-heading font-semibold text-dark">
                {youth.name}
              </h3>
              <p className="text-sm text-dark-subtle">{youth.email}</p>
              {youth.phone && (
                <p className="text-sm text-dark-subtle">{youth.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-dark-subtle mb-1">Rating</p>
              <StarRating rating={youth.rating} />
            </div>
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs text-dark-subtle mb-1">Jobs Completed</p>
              <p className="text-lg font-semibold text-dark">
                {youth.completedJobs}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-dark-subtle mb-2 font-medium">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {youth.skills.map((skill) => (
                <Badge key={skill} variant="info" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-subtle">Vetted Status:</span>
            {youth.isVetted ? (
              <Badge variant="success">Vetted</Badge>
            ) : (
              <Badge variant="warning">Unvetted</Badge>
            )}
          </div>

          {!youth.isVetted && (
            <div className="pt-2 border-t border-stone-100">
              <Button
                variant="primary"
                onClick={handleVet}
                isLoading={vetMutation.isPending}
                className="w-full"
              >
                <ShieldCheck size={16} />
                Vet This Youth
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-dark-subtle text-center py-6">
          Youth profile not found.
        </p>
      )}
    </Modal>
  );
}

export default function YouthManagement() {
  const [search, setSearch] = useState('');
  const [vettedFilter, setVettedFilter] = useState<'all' | 'vetted' | 'unvetted'>('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      limit: ITEMS_PER_PAGE,
      search: search || undefined,
      isVetted:
        vettedFilter === 'all'
          ? undefined
          : vettedFilter === 'vetted',
    }),
    [page, search, vettedFilter],
  );

  const { data, isLoading } = useYouth(params);
  const vetMutation = useVetYouth();

  const youthList = data?.youth ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Filter by skill locally if needed
  const filteredYouth = skillFilter
    ? youthList.filter((y) =>
        y.skills.some((s) =>
          s.toLowerCase().includes(skillFilter.toLowerCase()),
        ),
      )
    : youthList;

  // Collect all unique skills for filter dropdown
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    youthList.forEach((y) => y.skills.forEach((s) => skills.add(s)));
    return Array.from(skills).sort();
  }, [youthList]);

  const handleVet = (id: string) => {
    vetMutation.mutate(id, {
      onSuccess: () => toast.success('Youth has been vetted successfully'),
      onError: () => toast.error('Failed to vet youth. Please try again.'),
    });
  };

  if (isLoading) {
    return (
      <PageWrapper title="Youth Management" subtitle="Manage and vet youth workers">
        <YouthSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Youth Management" subtitle="Manage and vet youth workers">
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtle"
            />
            <input
              type="text"
              placeholder="Search youth by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-body
                bg-white rounded-lg border border-stone-200
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                placeholder:text-dark-subtle/60
                transition-all duration-200"
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

          <div className="flex gap-3">
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-subtle pointer-events-none"
              />
              <select
                value={vettedFilter}
                onChange={(e) => {
                  setVettedFilter(e.target.value as 'all' | 'vetted' | 'unvetted');
                  setPage(1);
                }}
                className="pl-8 pr-8 py-2.5 text-sm font-body
                  bg-white rounded-lg border border-stone-200
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="vetted">Vetted</option>
                <option value="unvetted">Unvetted</option>
              </select>
            </div>

            {allSkills.length > 0 && (
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="px-3 py-2.5 text-sm font-body
                  bg-white rounded-lg border border-stone-200
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  appearance-none cursor-pointer"
              >
                <option value="">All Skills</option>
                {allSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Youth Cards Grid */}
        {filteredYouth.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No youth found"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredYouth.map((youth) => (
              <Card key={youth.id} hover>
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={youth.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setSelectedYouthId(youth.id)}
                      className="text-sm font-semibold text-dark hover:text-primary transition-colors text-left truncate block w-full"
                    >
                      {youth.name}
                    </button>
                    <div className="flex items-center gap-1 text-xs text-dark-subtle mt-0.5">
                      <MapPin size={12} />
                      <span>Tanzania</span>
                    </div>
                  </div>
                  {youth.isVetted ? (
                    <Badge variant="success" size="sm">
                      <ShieldCheck size={12} className="mr-0.5" />
                      Vetted
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Unvetted</Badge>
                  )}
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {youth.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs rounded-full
                        bg-primary/8 text-primary font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {youth.skills.length > 4 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-stone-100 text-dark-subtle">
                      +{youth.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <StarRating rating={youth.rating} />
                  <div className="flex items-center gap-1 text-xs text-dark-subtle">
                    <Briefcase size={12} />
                    <span>{youth.completedJobs} jobs</span>
                  </div>
                </div>

                {/* Vet action for unvetted youth */}
                {!youth.isVetted && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVet(youth.id);
                      }}
                      isLoading={vetMutation.isPending}
                    >
                      <ShieldCheck size={14} />
                      Vet Youth
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Map Section */}
        {filteredYouth.length > 0 && (
          <Card>
            <h2 className="text-lg font-heading font-semibold text-dark mb-4">
              Youth Locations
            </h2>
            <div className="rounded-xl overflow-hidden border border-stone-200" style={{ height: '400px' }}>
              <MapContainer
                center={DAR_ES_SALAAM}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredYouth.map((youth) => {
                  const position = getYouthLocation(youth);
                  return (
                    <Marker key={youth.id} position={position}>
                      <Popup>
                        <div className="font-body">
                          <p className="font-semibold text-sm">{youth.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {youth.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-dark-subtle">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, total)} of {total} youth
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

      {/* Youth Detail Modal */}
      {selectedYouthId && (
        <YouthDetailModal
          youthId={selectedYouthId}
          isOpen={!!selectedYouthId}
          onClose={() => setSelectedYouthId(null)}
        />
      )}
    </PageWrapper>
  );
}
