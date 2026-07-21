'use client';

import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Check, KeyRound } from 'lucide-react';
import { changePassword } from '@/store/auth/authService';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';

const HAS_SPECIAL_CHAR = /[^A-Za-z0-9]/;

export function ChangePasswordForm() {
  const { toast, showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasSpecialChar = HAS_SPECIAL_CHAR.test(newPassword);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Read the form's actual DOM values rather than trusting the controlled
    // state alone — browser password-manager autofill can set an input's
    // value without firing React's onChange, leaving `currentPassword`/
    // `newPassword`/`confirmPassword` stale even though the field visibly
    // shows the right value. FormData always reflects what's really there.
    const data = new FormData(e.currentTarget);
    const current = String(data.get('current-password') ?? '');
    const next = String(data.get('new-password') ?? '');
    const confirm = String(data.get('confirm-password') ?? '');

    if (next.length < 8 || !HAS_SPECIAL_CHAR.test(next)) {
      setError('New password does not meet the requirements below.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (next === current) {
      setError('New password must be different from your current password.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully.', 'success');
    } catch (err) {
      const fallback = 'Failed to change password.';
      setError(axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message || fallback : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border/80 bg-background p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-foreground">Change password</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Choose a new password for your admin account.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-foreground">
            Current password
          </label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
            autoComplete="current-password"
          />
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
            Confirm new password
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
          {submitting ? 'Changing…' : 'Change password'}
        </button>
      </form>

      <Toast toast={toast} />
    </section>
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
