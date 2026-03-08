import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  Camera,
  Star,
  MapPin,
  Phone,
  FileText,
  Upload,
  X,
  Briefcase,
  Banknote,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import { useYouthById, useYouthEarnings, useUpdateYouthProfile } from '@/hooks/useYouth';
import * as youthApi from '@/api/youth';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageWrapper from '@/components/layout/PageWrapper';
import { formatCurrency } from '@/utils/formatters';

/* ---------- Zod schema ---------- */
const profileSchema = z.object({
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .min(2, 'Location is required')
    .max(200, 'Location is too long'),
  phone: z
    .string()
    .min(9, 'Enter a valid phone number')
    .max(15, 'Phone number is too long'),
  skills: z
    .array(z.string().min(1))
    .min(1, 'Add at least one skill'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

/* ---------- Star rating ---------- */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          className={
            star <= Math.round(rating)
              ? 'fill-accent text-accent'
              : 'text-stone-300'
          }
        />
      ))}
      <span className="ml-1.5 text-sm font-body text-dark-muted font-medium">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { data: youth, isLoading } = useYouthById(user?.id ?? '');
  const { data: earningsData } = useYouthEarnings(user?.id ?? '');
  const updateProfile = useUpdateYouthProfile(user?.id ?? '');

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idDocInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: '',
      location: '',
      phone: '',
      skills: [],
    },
    values: youth
      ? {
          bio: youth.bio ?? '',
          location: youth.location ?? '',
          phone: youth.phone ?? '',
          skills: youth.skills ?? [],
        }
      : undefined,
  });

  const currentSkills = watch('skills') ?? [];

  /* ---------- photo handlers ---------- */
  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be smaller than 5 MB');
        return;
      }
      setProfilePhoto(URL.createObjectURL(file));
      try {
        await youthApi.uploadProfilePhoto(file);
        toast.success('Profile photo updated');
      } catch {
        toast.error('Failed to upload photo');
      }
    },
    [],
  );

  const handleIdDocChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Document must be smaller than 5 MB');
        return;
      }
      setIdDocPreview(URL.createObjectURL(file));
      try {
        await youthApi.uploadIdDocument(file);
        toast.success('ID document uploaded');
      } catch {
        toast.error('Failed to upload document');
      }
    },
    [],
  );

  /* ---------- skill tag management ---------- */
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (currentSkills.includes(trimmed)) {
      toast.error('Skill already added');
      return;
    }
    setValue('skills', [...currentSkills, trimmed], { shouldDirty: true, shouldValidate: true });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setValue(
      'skills',
      currentSkills.filter((s) => s !== skill),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  /* ---------- submit ---------- */
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        bio: data.bio ?? '',
        location: data.location,
        phone: data.phone,
        skills: data.skills,
      });
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  /* ---------- loading ---------- */
  if (isLoading) {
    return (
      <PageWrapper title="My Profile" subtitle="Manage your information">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <LoadingSkeleton variant="circle" width="5rem" height="5rem" />
            <div className="space-y-2 flex-1">
              <LoadingSkeleton height="1.5rem" width="60%" />
              <LoadingSkeleton height="1rem" width="40%" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="card" height="8rem" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Profile" subtitle="Manage your information">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ===== Profile header ===== */}
        <Card className="relative overflow-hidden">
          {/* Decorative top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-4">
            {/* Photo */}
            <div className="relative group">
              <Avatar
                src={profilePhoto}
                name={user?.name ?? 'User'}
                size="xl"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="
                  absolute -bottom-1 -right-1
                  w-8 h-8 rounded-full
                  bg-primary text-white
                  flex items-center justify-center
                  shadow-md
                  hover:bg-primary-light transition-colors
                "
              >
                <Camera size={14} />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-heading font-bold text-dark">
                {user?.name ?? 'Youth Worker'}
              </h2>
              <p className="text-sm text-dark-subtle font-body mt-0.5">
                {user?.email}
              </p>

              {youth && (
                <div className="mt-2">
                  <StarRating rating={youth.rating ?? 0} />
                </div>
              )}

              {youth?.isVetted && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-body font-medium text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
                  <ShieldCheck size={13} />
                  Verified
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-stone-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-dark-subtle mb-1">
                <Briefcase size={14} />
                <span className="text-xs font-body">Total Jobs</span>
              </div>
              <p className="text-xl font-heading font-bold text-dark">
                {youth?.completedJobs ?? 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-dark-subtle mb-1">
                <Banknote size={14} />
                <span className="text-xs font-body">Total Earnings</span>
              </div>
              <p className="text-xl font-heading font-bold text-accent">
                {formatCurrency(earningsData?.totalEarnings ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        {/* ===== Edit form ===== */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bio */}
          <Card>
            <label className="block text-sm font-semibold font-body text-dark mb-2">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell clients about yourself and your experience..."
              className="
                w-full rounded-lg border border-stone-300 px-3.5 py-2.5
                text-sm font-body text-dark placeholder:text-dark-subtle
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                resize-none
              "
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-error font-body">{errors.bio.message}</p>
            )}
          </Card>

          {/* Location */}
          <Card>
            <label className="block text-sm font-semibold font-body text-dark mb-2">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> Location
              </span>
            </label>
            <input
              {...register('location')}
              type="text"
              placeholder="e.g. Dar es Salaam, Kinondoni"
              className="
                w-full rounded-lg border border-stone-300 px-3.5 py-2.5
                text-sm font-body text-dark placeholder:text-dark-subtle
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
              "
            />
            {errors.location && (
              <p className="mt-1 text-xs text-error font-body">{errors.location.message}</p>
            )}
          </Card>

          {/* Phone */}
          <Card>
            <label className="block text-sm font-semibold font-body text-dark mb-2">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} /> Phone Number
              </span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+255 700 000 000"
              className="
                w-full rounded-lg border border-stone-300 px-3.5 py-2.5
                text-sm font-body text-dark placeholder:text-dark-subtle
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
              "
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-error font-body">{errors.phone.message}</p>
            )}
          </Card>

          {/* Skills */}
          <Card>
            <label className="block text-sm font-semibold font-body text-dark mb-2">
              Skills
            </label>

            {/* Existing skill badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {currentSkills.map((skill) => (
                <Badge key={skill} variant="info" size="md">
                  <span className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-600 transition-colors ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                </Badge>
              ))}
              {currentSkills.length === 0 && (
                <p className="text-xs text-dark-subtle font-body">
                  No skills added yet
                </p>
              )}
            </div>

            {/* Add skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter"
                className="
                  flex-1 rounded-lg border border-stone-300 px-3.5 py-2
                  text-sm font-body text-dark placeholder:text-dark-subtle
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                "
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkill}
              >
                <Plus size={14} />
                Add
              </Button>
            </div>

            {errors.skills && (
              <p className="mt-1 text-xs text-error font-body">{errors.skills.message}</p>
            )}
          </Card>

          {/* ID Document Upload */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-primary" />
              <h3 className="text-sm font-semibold font-body text-dark">
                ID Document
              </h3>
            </div>
            <p className="text-xs text-dark-subtle font-body mb-3">
              Upload a government-issued ID for verification.
            </p>

            {idDocPreview ? (
              <div className="relative">
                <img
                  src={idDocPreview}
                  alt="ID Document"
                  className="w-full max-h-48 object-contain rounded-lg ring-1 ring-stone-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIdDocPreview(null);
                    if (idDocInputRef.current) idDocInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
                >
                  <X size={14} className="text-dark-muted" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => idDocInputRef.current?.click()}
                className="
                  flex flex-col items-center justify-center
                  border-2 border-dashed border-stone-300 rounded-xl
                  py-8 cursor-pointer
                  hover:border-primary hover:bg-primary/5
                  transition-colors duration-200
                  active:scale-[0.99]
                "
              >
                <Upload size={24} className="text-dark-subtle mb-2" />
                <p className="text-sm font-body text-dark-muted">
                  Tap to upload ID document
                </p>
                <p className="text-xs font-body text-dark-subtle mt-1">
                  JPEG, PNG, max 5 MB
                </p>
              </div>
            )}

            <input
              ref={idDocInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleIdDocChange}
              className="hidden"
            />
          </Card>

          {/* Save button */}
          <div className="sticky bottom-4 z-10">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={!isDirty}
              className="w-full shadow-lg"
            >
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
