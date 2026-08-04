'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, KeyRound } from 'lucide-react';
import axios from 'axios';
import { resetPassword } from '@/store/auth/authService';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { BrandMark } from '@/components/BrandMark';
import { useLocale } from '@/lib/i18n/LocaleContext';

const HAS_SPECIAL_CHAR = /[^A-Za-z0-9]/;

/**
 * Renders the "set new password" screen: takes the WhatsApp verification code
 * and a new password (with live requirement checks), submits the reset, and
 * shows a success state once the password has been changed.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const phone = searchParams.get('phone') ?? '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = HAS_SPECIAL_CHAR.test(newPassword);

  /**
   * Validates the new password against the requirements and confirmation
   * match, then submits the reset request; marks the form as done on success
   * or shows an error on failure.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength || !hasSpecialChar) {
      setError(t('auth.resetPassword.errorRequirements'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.resetPassword.errorMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ phone, code, newPassword });
      setDone(true);
    } catch (err) {
      const fallback = t('auth.resetPassword.genericError');
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
        <h1 className="mt-6 text-2xl font-bold text-foreground">{t('auth.resetPassword.doneTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('auth.resetPassword.doneSubtitle')}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-8 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          {t('auth.resetPassword.continue')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold text-foreground">{t('auth.resetPassword.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('auth.resetPassword.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('auth.resetPassword.codeLabel')}
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('auth.resetPassword.codePlaceholder')}
              className="w-full rounded-lg border border-input py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('auth.resetPassword.newPasswordLabel')}
          </label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('auth.resetPassword.confirmPasswordLabel')}
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        <ul className="space-y-1.5">
          <ChecklistItem met={hasMinLength} label={t('auth.resetPassword.reqMinLength')} />
          <ChecklistItem met={hasSpecialChar} label={t('auth.resetPassword.reqSpecialChar')} />
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
          {submitting ? t('auth.resetPassword.resetting') : t('auth.resetPassword.reset')}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.resetPassword.backToLogin')}
      </Link>
    </div>
  );
}

/**
 * Renders a single password-requirement row, showing a check icon styled
 * as met or unmet depending on the `met` flag.
 */
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
