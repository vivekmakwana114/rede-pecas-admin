'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { en, type Dictionary } from './translations/en';
import { pt } from './translations/pt';

export type Locale = 'pt' | 'en';

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };
const STORAGE_KEY = 'admin_locale';
const DEFAULT_LOCALE: Locale = 'pt';

const listeners = new Set<() => void>();

/**
 * Reads the persisted locale from localStorage. Only called client-side —
 * `getServerSnapshot` covers the server/pre-hydration render.
 */
function getSnapshot(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'pt' || stored === 'en' ? stored : DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Persists the given locale and notifies every subscribed component so they
 * re-read it via `useSyncExternalStore`.
 */
function setStoredLocale(next: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

type TranslateVars = Record<string, string | number>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: TranslateVars) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Looks up a dot-separated path (e.g. "auth.login.title") inside a Dictionary,
 * falling back to the path itself if a key is missing so a translation gap
 * never renders as a blank string. Substitutes any `{varName}` placeholders
 * from `vars` once the string is resolved.
 */
function resolve(dictionary: Dictionary, path: string, vars?: TranslateVars): string {
  const value = path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);

  const template = typeof value === 'string' ? value : path;
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

/**
 * Provides the active admin-panel locale and a `t()` translate function to
 * the whole app. Reads/writes localStorage via `useSyncExternalStore` (no
 * effect-driven setState, and no SSR/hydration mismatch), defaulting to
 * Angolan Portuguese ('pt') on first visit.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => setStoredLocale(next), []);

  const t = useCallback((path: string, vars?: TranslateVars) => resolve(DICTIONARIES[locale], path, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Hook for reading the active locale, switching it, and translating keys.
 * Must be used within a LocaleProvider (mounted once in the root layout).
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
