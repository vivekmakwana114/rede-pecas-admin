'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { forgotPassword } from '@/store/auth/authService';
import { BrandMark } from '@/components/BrandMark';
import { useLocale } from '@/lib/i18n/LocaleContext';

/**
 * Renders the "forgot password" screen: a form that collects the customer's
 * WhatsApp number and requests a verification code, then routes to the reset page.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * Submits the phone number to request a WhatsApp reset code, then
   * navigates to the reset-password page; shows an error message on failure.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await forgotPassword(phone);
      router.push(`/reset-password?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      const fallback = t('auth.forgotPassword.genericError');
      setError(axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message || fallback : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <BrandMark />
      <h1 className="mt-6 text-2xl font-bold text-foreground">{t('auth.forgotPassword.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('auth.forgotPassword.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('auth.forgotPassword.phoneLabel')}
          </label>
          <div className="relative">
            <MessageCircle className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('auth.forgotPassword.phonePlaceholder')}
              autoComplete="tel"
              className="w-full rounded-lg border border-input py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>

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
          {submitting ? t('auth.forgotPassword.sendingCode') : t('auth.forgotPassword.sendCode')}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.forgotPassword.backToLogin')}
      </Link>
    </div>
  );
}
