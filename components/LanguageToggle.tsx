'use client';

import { useLocale, type Locale } from '@/lib/i18n/LocaleContext';

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'pt', label: 'PT' },
  { value: 'en', label: 'EN' },
];

/**
 * Two-way switch for the admin's UI language, persisted client-side via
 * LocaleProvider. Rendered in the dashboard header and on auth pages.
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="flex items-center rounded-lg border border-input bg-background p-0.5 text-xs font-semibold"
    >
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          className={`rounded-md px-2.5 py-1 transition-all ${
            locale === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
