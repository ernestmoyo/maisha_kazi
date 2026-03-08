import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Wrench,
  Type,
  AlignLeft,
  MapPin,
  CalendarClock,
  StickyNote,
  DollarSign,
  Sparkles,
  Car,
  SprayCan,
  Flower2,
  PanelTop,
  Hammer,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useCreateJob } from '@/hooks/useJobs';
import { useAuth } from '@/store/AuthContext';

const SERVICE_TYPES = [
  { value: 'CAR_WASH', label: 'Car Wash', icon: Car },
  { value: 'CLEANING', label: 'Cleaning', icon: SprayCan },
  { value: 'GARDENING', label: 'Gardening', icon: Flower2 },
  { value: 'WINDOW_FIX', label: 'Window Fix', icon: PanelTop },
  { value: 'HANDYWORK', label: 'Handywork', icon: Hammer },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
] as const;

const serviceRequestSchema = z.object({
  serviceType: z.string().min(1, 'Please select a service type'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
  location: z.string().min(3, 'Please enter a valid location'),
  preferredDate: z.string().min(1, 'Please select a preferred date and time'),
  specialInstructions: z.string().max(500, 'Special instructions are too long').optional(),
  budget: z.string().min(1, 'Budget is required').transform((val) => Number(val)).pipe(z.number().min(1000, 'Minimum budget is TSH 1,000').max(10000000, 'Maximum budget is TSH 10,000,000')),
});

type ServiceRequestForm = z.infer<typeof serviceRequestSchema>;

export default function RequestService() {
  const { user } = useAuth();
  const createJob = useCreateJob();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: '',
      title: '',
      description: '',
      location: '',
      preferredDate: '',
      specialInstructions: '',
      budget: '',
    },
  });

  const onSubmit = async (data: ServiceRequestForm) => {
    try {
      await createJob.mutateAsync({
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        location: data.location,
        fee: data.budget,
        clientId: user?.id,
      });
      toast.success('Service request submitted successfully!');
      reset();
    } catch {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-gradient px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-dark mb-2">
            Request a Service
          </h1>
          <p className="text-dark-subtle font-body text-sm sm:text-base max-w-md mx-auto">
            Fill in the details below and our coordinator team will match you with a
            skilled youth professional.
          </p>
        </div>

        <Card padding="lg" className="mb-6">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            {/* Service Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                <Wrench size={16} className="text-primary" />
                Service Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={value}
                      {...register('serviceType')}
                      className="peer sr-only"
                    />
                    <div className="
                      flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-stone-200
                      bg-white transition-all duration-200
                      peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md
                      hover:border-stone-300 hover:bg-stone-50
                    ">
                      <Icon size={24} className="text-dark-subtle peer-checked:text-primary" />
                      <span className="text-xs font-medium text-dark-muted font-body">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.serviceType && (
                <p className="mt-1.5 text-xs text-error font-body">{errors.serviceType.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                <Type size={16} className="text-primary" />
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Deep clean 3-bedroom apartment"
                {...register('title')}
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-stone-200
                  bg-white text-dark font-body text-sm
                  placeholder:text-dark-subtle/50
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  transition-all duration-200
                "
              />
              {errors.title && (
                <p className="mt-1.5 text-xs text-error font-body">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                <AlignLeft size={16} className="text-primary" />
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe what you need done in detail..."
                {...register('description')}
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-stone-200
                  bg-white text-dark font-body text-sm resize-none
                  placeholder:text-dark-subtle/50
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  transition-all duration-200
                "
              />
              {errors.description && (
                <p className="mt-1.5 text-xs text-error font-body">{errors.description.message}</p>
              )}
            </div>

            {/* Location + Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                  <MapPin size={16} className="text-primary" />
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="e.g., Mikocheni, Dar es Salaam"
                  {...register('location')}
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-stone-200
                    bg-white text-dark font-body text-sm
                    placeholder:text-dark-subtle/50
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200
                  "
                />
                {errors.location && (
                  <p className="mt-1.5 text-xs text-error font-body">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="preferredDate" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                  <CalendarClock size={16} className="text-primary" />
                  Preferred Date & Time
                </label>
                <input
                  id="preferredDate"
                  type="datetime-local"
                  {...register('preferredDate')}
                  className="
                    w-full px-4 py-3 rounded-xl border-2 border-stone-200
                    bg-white text-dark font-body text-sm
                    placeholder:text-dark-subtle/50
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200
                  "
                />
                {errors.preferredDate && (
                  <p className="mt-1.5 text-xs text-error font-body">{errors.preferredDate.message}</p>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label htmlFor="specialInstructions" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                <StickyNote size={16} className="text-primary" />
                Special Instructions
                <span className="text-dark-subtle font-normal text-xs">(optional)</span>
              </label>
              <textarea
                id="specialInstructions"
                rows={3}
                placeholder="Any specific requirements, access instructions, or preferences..."
                {...register('specialInstructions')}
                className="
                  w-full px-4 py-3 rounded-xl border-2 border-stone-200
                  bg-white text-dark font-body text-sm resize-none
                  placeholder:text-dark-subtle/50
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                  transition-all duration-200
                "
              />
              {errors.specialInstructions && (
                <p className="mt-1.5 text-xs text-error font-body">{errors.specialInstructions.message}</p>
              )}
            </div>

            {/* Fee Budget */}
            <div>
              <label htmlFor="budget" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2 font-body">
                <DollarSign size={16} className="text-primary" />
                Fee Budget (TSH)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-dark-subtle font-semibold font-body">
                  TSH
                </span>
                <input
                  id="budget"
                  type="number"
                  placeholder="50,000"
                  {...register('budget')}
                  className="
                    w-full pl-14 pr-4 py-3 rounded-xl border-2 border-stone-200
                    bg-white text-dark font-body text-sm
                    placeholder:text-dark-subtle/50
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200
                  "
                />
              </div>
              {errors.budget && (
                <p className="mt-1.5 text-xs text-error font-body">{errors.budget.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting || createJob.isPending}
                className="w-full"
              >
                <Send size={18} />
                Submit Service Request
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Note */}
        <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 text-center">
          <p className="text-sm text-primary font-body font-medium">
            Your request will be reviewed by our coordinator team. You will be notified
            once a youth professional has been matched to your job.
          </p>
        </div>
      </div>
    </div>
  );
}
