import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Please enter a valid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 characters').optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['YOUTH', 'CLIENT'], { message: 'Please select a role' }),
    organizationName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => data.role !== 'CLIENT' || (data.organizationName && data.organizationName.length >= 2),
    {
      message: 'Organization name is required for clients',
      path: ['organizationName'],
    },
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
      organizationName: '',
    },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: RegisterFormData) {
    try {
      setError(null);
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || undefined,
      });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-light" />
        <div className="absolute inset-0 bg-african-pattern opacity-30" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-accent-light/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-4 mb-10">
            <img
              src="/logo.png"
              alt="Maisha Community Initiatives"
              className="w-16 h-16 rounded-xl object-contain bg-white p-1 shadow-lg shadow-black/20"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-heading font-bold text-white leading-tight">Maisha Kazi</span>
              <span className="text-sm text-white/60 font-body">Community Initiatives</span>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-tight mb-6">
            Join the{' '}
            <span className="text-accent-light">Movement</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Whether you are a young person seeking opportunities or an organization looking to
            make an impact, Maisha Kazi connects you to a vibrant community driving change.
          </p>

          {/* Feature list */}
          <div className="mt-12 space-y-4">
            {[
              'Skills training and mentorship programs',
              'Direct access to vetted job opportunities',
              'Track your impact and CSR contributions',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-accent-light" />
                </div>
                <p className="text-sm text-white/70">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img
              src="/logo.png"
              alt="Maisha Community Initiatives"
              className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shadow"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-heading font-bold text-dark">Maisha Kazi</span>
              <span className="text-[11px] text-dark-subtle font-body">Community Initiatives</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-dark-subtle">
              Get started with Maisha Kazi today
            </p>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-dark-muted mb-1.5">
                Full name
              </label>
              <input
                {...register('name')}
                id="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className={`
                  w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm
                  placeholder:text-stone-400
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                  ${errors.name ? 'border-error' : 'border-stone-300'}
                `}
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-muted mb-1.5">
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`
                  w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm
                  placeholder:text-stone-400
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                  ${errors.email ? 'border-error' : 'border-stone-300'}
                `}
              />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-dark-muted mb-1.5">
                Phone number <span className="text-stone-400">(optional)</span>
              </label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+254 700 000 000"
                className={`
                  w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm
                  placeholder:text-stone-400
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                  ${errors.phone ? 'border-error' : 'border-stone-300'}
                `}
              />
              {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone.message}</p>}
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-dark-muted mb-1.5">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['YOUTH', 'CLIENT'] as const).map((role) => (
                  <label
                    key={role}
                    className={`
                      relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer
                      transition-all duration-200 text-sm font-medium
                      ${selectedRole === role
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-stone-200 bg-white text-dark-muted hover:border-stone-300'
                      }
                    `}
                  >
                    <input
                      {...register('role')}
                      type="radio"
                      value={role}
                      className="sr-only"
                    />
                    {role === 'YOUTH' ? 'Youth / Job Seeker' : 'Client / Organization'}
                  </label>
                ))}
              </div>
              {errors.role && <p className="mt-1 text-xs text-error">{errors.role.message}</p>}
            </div>

            {/* Organization name (conditional) */}
            {selectedRole === 'CLIENT' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-dark-muted mb-1.5">
                  Organization name
                </label>
                <input
                  {...register('organizationName')}
                  id="organizationName"
                  type="text"
                  placeholder="Acme Corp"
                  className={`
                    w-full px-4 py-2.5 rounded-lg border bg-white text-dark text-sm
                    placeholder:text-stone-400
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors
                    ${errors.organizationName ? 'border-error' : 'border-stone-300'}
                  `}
                />
                {errors.organizationName && (
                  <p className="mt-1 text-xs text-error">{errors.organizationName.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`
                    w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-dark text-sm
                    placeholder:text-stone-400
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors
                    ${errors.password ? 'border-error' : 'border-stone-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-dark-muted transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-muted mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`
                    w-full px-4 py-2.5 pr-11 rounded-lg border bg-white text-dark text-sm
                    placeholder:text-stone-400
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors
                    ${errors.confirmPassword ? 'border-error' : 'border-stone-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-dark-muted transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2
                px-6 py-3 rounded-lg
                bg-primary text-white font-semibold text-sm
                hover:bg-primary-light active:bg-primary-dark
                focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-dark-subtle">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:text-primary-light transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
