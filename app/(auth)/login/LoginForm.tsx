'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/auth/authSlice';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BrandMark } from '@/components/BrandMark';

/**
 * Renders the login screen: email/password fields, remember-me toggle, and
 * a forgot-password link; on submit, dispatches the login action and redirects
 * to the dashboard once authenticated.
 */
export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const tokens = useAppSelector((state) => state.auth.tokens);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tokens?.access?.token) {
      router.replace('/dashboard');
    }
  }, [tokens, router]);

  /**
   * Submits the login form: dispatches the loginUser thunk and, on success,
   * navigates to the dashboard; on failure, surfaces an error message.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      await dispatch(loginUser({ email, password, rememberMe })).unwrap();
      router.push('/dashboard');
    } catch (err) {
      setLoginError(typeof err === 'string' ? err : 'Incorrect email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to manage Rede Peças orders and inventory.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@redepecas.co.ao"
            autoComplete="email"
            className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            Remember Me
          </label>
          <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80">
            Forgot password
          </Link>
        </div>

        {loginError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
