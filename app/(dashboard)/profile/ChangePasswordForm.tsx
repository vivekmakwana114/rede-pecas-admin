'use client';

import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Check, KeyRound } from 'lucide-react';
import { changePassword } from '@/store/auth/authService';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { useLocale } from '@/lib/i18n/LocaleContext';

const HAS_SPECIAL_CHAR = /[^A-Za-z0-9]/;

/**
 * Form for changing the logged-in admin's password, with live checklist
 * validation of the new password's requirements before submission.
 */
export function ChangePasswordForm() {
  const { t } = useLocale();
  const { toast, showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = HAS_SPECIAL_CHAR.test(newPassword);

  /**
   * Validates the new password against the requirements and confirmation
   * match, then submits the password change request to the API.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const data = new FormData(e.currentTarget);
    const current = String(data.get('current-password') ?? '');
    const next = String(data.get('new-password') ?? '');
    const confirm = String(data.get('confirm-password') ?? '');

    if (next.length < 8 || !HAS_SPECIAL_CHAR.test(next)) {
      setError(t('profile.changePassword.errorRequirements'));
      return;
    }
    if (next !== confirm) {
      setError(t('profile.changePassword.errorMismatch'));
      return;
    }
    if (next === current) {
      setError(t('profile.changePassword.errorSameAsCurrent'));
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('profile.changePassword.successToast'), 'success');
    } catch (err) {
      const fallback = t('profile.changePassword.genericError');
      setError(axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message || fallback : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border/80 bg-background p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-foreground">{t('profile.changePassword.title')}</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t('profile.changePassword.subtitle')}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('profile.changePassword.currentPasswordLabel')}
          </label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder={t('profile.changePassword.currentPasswordPlaceholder')}
            autoComplete="current-password"
          />
        </div>

        <div>
          <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('profile.changePassword.newPasswordLabel')}
          </label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder={t('profile.changePassword.newPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t('profile.changePassword.confirmPasswordLabel')}
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder={t('profile.changePassword.confirmPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        <ul className="space-y-1.5">
          <ChecklistItem met={hasMinLength} label={t('profile.changePassword.reqMinLength')} />
          <ChecklistItem met={hasSpecialChar} label={t('profile.changePassword.reqSpecialChar')} />
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
          {submitting ? t('profile.changePassword.submitting') : t('profile.changePassword.submit')}
        </button>
      </form>

      <Toast toast={toast} />
    </section>
  );
}

/**
 * Renders a single password-requirement row, showing a check mark and
 * highlighted text once the requirement is met.
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
