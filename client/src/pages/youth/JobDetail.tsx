import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Banknote,
  User,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  Play,
  Clock,
  ImageIcon,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useJob, useUpdateJobStatus, useUploadProof } from '@/hooks/useJobs';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import {
  formatDate,
  formatCurrency,
  getServiceTypeLabel,
} from '@/utils/formatters';

import 'leaflet/dist/leaflet.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

interface ProofForm {
  proof: FileList;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useJob(id ?? '');
  const updateStatus = useUpdateJobStatus();
  const uploadProof = useUploadProof();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProofForm>();

  const selectedFiles = watch('proof');

  /* ------ handle file preview ------ */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        setPreviewUrl(null);
        return;
      }

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Please select an image file (JPEG, PNG, or WebP)');
        e.target.value = '';
        setPreviewUrl(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Image must be smaller than 5 MB');
        e.target.value = '';
        setPreviewUrl(null);
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [],
  );

  /* ------ Start Job ------ */
  const handleStartJob = async () => {
    if (!id) return;
    try {
      await updateStatus.mutateAsync({ id, status: 'IN_PROGRESS' });
      toast.success('Job started! Good luck.');
    } catch {
      toast.error('Failed to start job. Please try again.');
    }
  };

  /* ------ Upload & Complete ------ */
  const onSubmitProof = async (data: ProofForm) => {
    if (!id) return;
    const file = data.proof?.[0];
    if (!file) {
      toast.error('Please take a photo of the completed work');
      return;
    }

    try {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await uploadProof.mutateAsync({ id, file });
      clearInterval(interval);
      setUploadProgress(100);

      await updateStatus.mutateAsync({ id, status: 'COMPLETED' });
      toast.success('Proof uploaded! Waiting for client confirmation.');
      reset();
      setPreviewUrl(null);
      setUploadProgress(0);
    } catch {
      setUploadProgress(0);
      toast.error('Upload failed. Please try again.');
    }
  };

  /* ------ Loading ------ */
  if (isLoading) {
    return (
      <PageWrapper title="" subtitle="">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-dark-subtle hover:text-dark mb-4 font-body"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="space-y-4">
          <LoadingSkeleton height="2rem" width="60%" />
          <LoadingSkeleton variant="card" height="16rem" />
          <LoadingSkeleton variant="card" height="10rem" />
        </div>
      </PageWrapper>
    );
  }

  if (!job) {
    return (
      <PageWrapper title="Job Not Found" subtitle="">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-light font-body"
        >
          <ArrowLeft size={16} /> Go back
        </button>
      </PageWrapper>
    );
  }

  /* ------ parse coords from location (e.g. "-6.7924,39.2083") ------ */
  const coordMatch = job.location?.match(
    /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/,
  );
  const coords = coordMatch
    ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
    : null;

  return (
    <PageWrapper title="" subtitle="">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-dark-subtle hover:text-dark mb-4 font-body transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Jobs
      </button>

      {/* ===== Header ===== */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-dark">
            {job.title}
          </h1>
          <StatusBadge status={job.status as 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'} />
        </div>
        <span className="inline-block text-xs font-medium font-body text-primary bg-primary/10 rounded px-2.5 py-1">
          {getServiceTypeLabel(job.serviceType)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* ===== Left column ===== */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-primary" />
              <h2 className="text-base font-heading font-semibold text-dark">
                Description
              </h2>
            </div>
            <p className="text-sm text-dark-muted font-body leading-relaxed whitespace-pre-wrap">
              {job.description || 'No description provided.'}
            </p>
          </Card>

          {/* Location & Map */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-primary" />
              <h2 className="text-base font-heading font-semibold text-dark">
                Location
              </h2>
            </div>
            <p className="text-sm text-dark-muted font-body mb-3">
              {job.location}
            </p>

            {coords && (
              <div className="h-48 sm:h-56 rounded-xl overflow-hidden ring-1 ring-stone-200">
                <MapContainer
                  center={[coords.lat, coords.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[coords.lat, coords.lng]} />
                </MapContainer>
              </div>
            )}
          </Card>

          {/* ===== Action section ===== */}
          {job.status === 'ASSIGNED' && (
            <Card className="border-2 border-dashed border-sky-300 bg-sky-50/50">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mb-4">
                  <Play size={24} className="text-sky-600" />
                </div>
                <h3 className="text-base font-heading font-semibold text-dark mb-1">
                  Ready to start?
                </h3>
                <p className="text-sm text-dark-subtle font-body mb-4 max-w-sm">
                  Tap below when you arrive at the job location and are ready to
                  begin working.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={updateStatus.isPending}
                  onClick={handleStartJob}
                  className="w-full sm:w-auto"
                >
                  Start Job
                </Button>
              </div>
            </Card>
          )}

          {job.status === 'IN_PROGRESS' && (
            <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-4">
                <Camera size={18} className="text-amber-600" />
                <h2 className="text-base font-heading font-semibold text-dark">
                  Upload Proof of Completion
                </h2>
              </div>

              <p className="text-sm text-dark-subtle font-body mb-4">
                Take a clear photo showing the completed work. This will be sent
                to the client for confirmation.
              </p>

              <form onSubmit={handleSubmit(onSubmitProof)} className="space-y-4">
                {/* Camera / file button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    relative flex flex-col items-center justify-center
                    border-2 border-dashed border-stone-300 rounded-xl
                    py-8 px-4 cursor-pointer
                    hover:border-primary hover:bg-primary/5
                    transition-colors duration-200
                    active:scale-[0.99]
                  "
                >
                  {previewUrl ? (
                    <div className="relative w-full">
                      <img
                        src={previewUrl}
                        alt="Proof preview"
                        className="w-full max-h-64 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                      >
                        <X size={16} className="text-dark-muted" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
                        <Camera size={24} className="text-dark-subtle" />
                      </div>
                      <p className="text-sm font-semibold font-body text-dark mb-1">
                        Tap to take a photo
                      </p>
                      <p className="text-xs text-dark-subtle font-body">
                        JPEG, PNG or WebP, max 5 MB
                      </p>
                    </>
                  )}

                  <input
                    {...register('proof', {
                      required: 'Please select a photo',
                      validate: {
                        isImage: (files) => {
                          const file = files?.[0];
                          if (!file) return 'Please select a photo';
                          if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
                            return 'File must be an image';
                          return true;
                        },
                        maxSize: (files) => {
                          const file = files?.[0];
                          if (!file) return true;
                          if (file.size > MAX_FILE_SIZE)
                            return 'Image must be smaller than 5 MB';
                          return true;
                        },
                      },
                    })}
                    ref={(e) => {
                      register('proof').ref(e);
                      (fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                    }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      register('proof').onChange(e);
                      handleFileChange(e);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {errors.proof && (
                  <p className="text-xs text-error font-body">
                    {errors.proof.message}
                  </p>
                )}

                {/* Upload progress */}
                {uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-body text-dark-subtle">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  isLoading={uploadProof.isPending || updateStatus.isPending}
                  disabled={!selectedFiles?.length}
                  className="w-full"
                >
                  <Upload size={18} />
                  Upload &amp; Complete
                </Button>
              </form>
            </Card>
          )}

          {job.status === 'COMPLETED' && (
            <Card className="border-2 border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h2 className="text-base font-heading font-semibold text-dark">
                  Job Completed
                </h2>
              </div>

              {/* Proof image if available */}
              {job.proofPhotoUrl ? (
                <div className="mb-4">
                  <p className="text-xs text-dark-subtle font-body mb-2">
                    Proof photo:
                  </p>
                  <img
                    src={String(job.proofPhotoUrl)}
                    alt="Proof of completion"
                    className="w-full max-h-64 object-contain rounded-xl ring-1 ring-stone-200"
                  />
                </div>
              ) : null}

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <p className="text-sm font-body text-amber-800">
                  Waiting for client confirmation
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* ===== Right sidebar ===== */}
        <div className="space-y-4">
          {/* Job details card */}
          <Card>
            <h3 className="text-sm font-heading font-semibold text-dark mb-4">
              Job Details
            </h3>

            <dl className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-dark-subtle shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs text-dark-subtle font-body">
                    Scheduled Date
                  </dt>
                  <dd className="text-sm font-body text-dark font-medium">
                    {formatDate(job.createdAt)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Banknote size={16} className="text-dark-subtle shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs text-dark-subtle font-body">Fee</dt>
                  <dd className="text-sm font-body text-dark font-medium">
                    {formatCurrency(job.fee ?? 0)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Banknote size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs text-dark-subtle font-body">
                    Your Earning
                  </dt>
                  <dd className="text-sm font-body text-accent font-bold">
                    {formatCurrency(job.youthEarning ?? Math.round((job.fee ?? 0) * 0.8))}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-dark-subtle shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs text-dark-subtle font-body">
                    Location
                  </dt>
                  <dd className="text-sm font-body text-dark">
                    {job.location}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          {/* Client info */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-primary" />
              <h3 className="text-sm font-heading font-semibold text-dark">
                Client
              </h3>
            </div>
            <p className="text-sm font-body text-dark-muted">
              Client #{job.clientId?.slice(-6) ?? 'N/A'}
            </p>
          </Card>

          {/* Instructions */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={16} className="text-primary" />
              <h3 className="text-sm font-heading font-semibold text-dark">
                Coordinator Notes
              </h3>
            </div>
            <p className="text-sm font-body text-dark-muted leading-relaxed">
              {job.notes ? String(job.notes) : 'No additional instructions.'}
            </p>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
