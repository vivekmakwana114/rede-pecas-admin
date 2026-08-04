'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Pencil, Phone, UserRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAdminProfile, updateAdminProfile } from '@/store/auth/authSlice';
import { ChangePasswordForm } from './ChangePasswordForm';
import { Toast } from '@/components/dashboard/Toast';
import { useToast } from '@/components/dashboard/useToast';
import { useLocale } from '@/lib/i18n/LocaleContext';

const inputClassName =
  'w-full rounded-lg border border-input px-3 py-2 text-sm text-foreground placeholder:text-placeholder-color transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

/**
 * Profile page: loads and displays the logged-in admin's account info (with
 * an inline edit mode for name/email) alongside the change-password form.
 */
export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const { toast, showToast } = useToast();
  const admin = useAppSelector((state) => state.auth.admin);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  const startEditing = () => {
    setForm({ name: admin?.name ?? '', email: admin?.email ?? '' });
    setError('');
    setEditing(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const result = await dispatch(updateAdminProfile({ name: form.name, email: form.email }));
    setSaving(false);

    if (updateAdminProfile.fulfilled.match(result)) {
      setEditing(false);
      showToast(t('profile.editProfile.successToast'), 'success');
    } else {
      setError((result.payload as string) || t('profile.editProfile.genericError'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/80 bg-background p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-secondary ring-offset-2 ring-offset-background">
                <UserRound className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-bold text-foreground">{admin?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{t('profile.administrator')}</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={startEditing}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('profile.editProfile.edit')}
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-2xs font-semibold text-muted-foreground">
                  {t('profile.editProfile.nameLabel')}
                </label>
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-2xs font-semibold text-muted-foreground">
                  {t('profile.editProfile.emailLabel')}
                </label>
                <input
                  type="email"
                  className={inputClassName}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent"
                >
                  {t('profile.editProfile.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? t('profile.editProfile.saving') : t('profile.editProfile.save')}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-2xs font-semibold text-muted-foreground">{t('profile.email')}</dt>
                  <dd className="text-sm font-semibold text-foreground">{admin?.email ?? '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <dt className="text-2xs font-semibold text-muted-foreground">{t('profile.phone')}</dt>
                  <dd className="text-sm font-semibold text-foreground">{admin?.phone ?? '—'}</dd>
                </div>
              </div>
            </dl>
          )}

          <Toast toast={toast} />
        </section>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
