import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid email or password. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-light" />

        {/* African pattern overlay */}
        <div className="absolute inset-0 bg-african-pattern opacity-30" />

        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-accent-light/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
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

          {/* Tagline */}
          <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-tight mb-6">
            Empowering Youth,{' '}
            <span className="text-accent-light">Building Futures</span>
          </h2>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Connecting underserved young people with meaningful work opportunities
            through skills training and community partnerships across Africa.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-12">
            <div>
              <p className="text-3xl font-heading font-bold text-accent-light">500+</p>
              <p className="text-sm text-white/50 mt-1">Youth Empowered</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-accent-light">150+</p>
              <p className="text-sm text-white/50 mt-1">Jobs Completed</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-bold text-accent-light">40+</p>
              <p className="text-sm text-white/50 mt-1">Partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img
              src="/logo.png"
              alt="Maisha Community Initiatives"
              className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shadow border border-stone-200"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-heading font-bold text-dark">Maisha Kazi</span>
              <span className="text-[11px] text-dark-subtle font-body">Community Initiatives</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-dark">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-dark-subtle">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email.message}</p>
              )}
            </div>

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
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-stone-300 text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-dark-muted">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary-light transition-colors"
              >
                Forgot password?
              </button>
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
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-dark-subtle">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary-light transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
