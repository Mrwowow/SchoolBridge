'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Phone, Lock } from 'lucide-react';
import { LoginDto } from '@schoolbridge/types';
import { apiFetch, ApiError } from '@/lib/api';
import { setToken, setRefreshToken, setSchoolId } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import type { AuthTokens, SessionUser } from '@schoolbridge/types';

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Client-side validation using the shared Zod schema
    const parsed = LoginDto.safeParse({ phone, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as 'phone' | 'password';
        if (field === 'phone' || field === 'password') {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // POST /auth/login returns AuthTokens; the user profile is fetched separately.
      const tokens = await apiFetch<AuthTokens>('/auth/login', {
        method: 'POST',
        body: parsed.data,
        unauthenticated: true,
      });

      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      // Resolve the active school from the user's memberships.
      const me = await apiFetch<SessionUser>('/auth/me');
      const firstMembership = me.memberships[0];
      if (firstMembership) {
        setSchoolId(firstMembership.schoolId);
      }

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrors({ form: 'Incorrect phone number or password.' });
      } else {
        setErrors({ form: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center" aria-label="SchoolBridge home">
            <Logo kind="lockup" color="brand" height={58} priority />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your school dashboard
            </p>
          </div>

          {errors.form && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Phone number"
              type="tel"
              id="phone"
              placeholder="08012345678 or +2348012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              leftIcon={<Phone size={16} />}
              autoComplete="tel"
              inputMode="tel"
              required
              aria-required="true"
            />

            <div className="relative flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-brand-500 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors duration-150 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-1"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          New to SchoolBridge?{' '}
          <Link href="/#pricing" className="font-medium text-brand-500 hover:underline">
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
