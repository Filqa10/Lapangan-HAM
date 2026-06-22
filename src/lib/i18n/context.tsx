'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import en from './translations/en';
import id from './translations/id';

export type Locale = 'en' | 'id';

const dictionaries: Record<Locale, Record<string, string>> = { en, id };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const LOCALE_STORAGE_KEY = 'lang';
const LOCALE_CHANGE_EVENT = 'locale-change';

function getLocaleSnapshot(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'id') return stored;
  return 'en';
}

function subscribeToLocale(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(subscribeToLocale, getLocaleSnapshot, () => 'en');

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replaceAll(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [locale],
  );

  const contextValue: I18nContextValue = {
    locale,
    setLocale,
    t,
  };

  return <I18nContext value={contextValue}>{children}</I18nContext>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
