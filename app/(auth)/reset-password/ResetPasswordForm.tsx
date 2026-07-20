'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, KeyRound } from 'lucide-react';
import axios from 'axios';
import { resetPassword } from '@/store/auth/authService';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BrandMark } from '@/components/BrandMark';

const HAS_SPECIAL_CHAR = /[^A-Za-z0-9]/;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = HAS_SPECIAL_CHAR.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength || !hasSpecialChar) {
      setError('Password does not meet the requirements below.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ phone, code, newPassword });
      setDone(true);
    } catch (err) {
      const fallback = 'Invalid or expired code. Please try again.';
      setError(axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message || fallback : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Password reset</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your password has been reset successfully. Sign in with your new password below.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="mt-8 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div>
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold text-foreground">Set new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter the code we sent to your WhatsApp and choose a new password.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-foreground">
            Verification code
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-input py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground">
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            autoComplete="new-password"
          />
        </div>

        <ul className="space-y-1.5">
          <ChecklistItem met={hasMinLength} label="Must be at least 8 characters" />
          <ChecklistItem met={hasSpecialChar} label="Must contain one special character" />
        </ul>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to log in
      </Link>
    </div>
  );
}

function ChecklistItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          met ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span className={met ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  );
}
