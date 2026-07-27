'use client';

import { useEffect } from 'react';
import { Mail, Phone, UserRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAdminProfile } from '@/store/auth/authSlice';
import { ChangePasswordForm } from './ChangePasswordForm';
import { useLocale } from '@/lib/i18n/LocaleContext';

/**
 * Profile page: loads and displays the logged-in admin's account info
 * alongside the change-password form.
 */
export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  const admin = useAppSelector((state) => state.auth.admin);

  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/80 bg-background p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-secondary ring-offset-2 ring-offset-background">
              <UserRound className="h-6 w-6" />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">{admin?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{t('profile.administrator')}</p>
            </div>
          </div>

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
        </section>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
