'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';

import { loginAction, type LoginActionState } from '@/actions/auth';
import { useTranslation } from '@/lib/i18n';

export function CustomerLoginForm() {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState<LoginActionState | undefined, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-[4px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 font-medium">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-[#999ba3]">
          {t('auth.email')}
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999ba3]" />
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={t('auth.enterEmail')}
            className="w-full rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#ffffff] dark:bg-slate-900 py-3 pl-10 pr-4 text-[15px] text-[var(--text-primary)] placeholder:text-[#999ba3] transition focus:border-slate-600 focus:ring-0"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-[#999ba3]">
          {t('auth.password')}
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999ba3]" />
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder={t('auth.enterPassword')}
            className="w-full rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#ffffff] dark:bg-slate-900 py-3 pl-10 pr-4 text-[15px] text-[var(--text-primary)] placeholder:text-[#999ba3] transition focus:border-slate-600 focus:ring-0"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        id="login-submit"
        className="w-full rounded-[4px] bg-[#e4f222] px-4 py-3 text-[16px] font-medium text-[#0c0a08] transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? t('common.loading') : t('auth.login')}
      </button>

      <div className="border-t border-[#d2cecb] dark:border-slate-800 pt-5 text-center text-[14px] text-[#999ba3] font-normal">
        {t('auth.noAccount')}{' '}
        <Link href="/auth/customer/register" className="font-medium text-[#0c0a08] dark:text-white transition hover:text-[#5683d2] hover:underline">
          {t('auth.registerNow')} →
        </Link>
      </div>
    </form>
  );
}
