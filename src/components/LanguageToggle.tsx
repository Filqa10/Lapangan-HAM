'use client';

import { Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <button
      type="button"
      id="language-toggle"
      onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
      className="flex items-center gap-1.5 rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium tracking-[0.02em] uppercase text-[#4d505d] dark:text-slate-300 transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#999ba3] hover:text-[#0c0a08] dark:hover:text-white active:scale-[0.97] focus:outline-none"
      aria-label={`Switch language to ${locale === 'en' ? 'Indonesian' : 'English'}`}
    >
      <Globe size={13} className="text-[#999ba3]" />
      {locale === 'en' ? 'EN' : 'ID'}
    </button>
  );
}

