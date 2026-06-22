'use client';

import { useState } from 'react';
import { Copy, Check, CreditCard } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

const BANK_ACCOUNT = '0079 8688 6070';

export function BankInfoCard() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(BANK_ACCOUNT.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-[#999ba3]">
        <CreditCard size={14} />
        <span className="text-[12px] font-medium tracking-[0.02em] uppercase">{t('booking.bankInfo')}</span>
      </div>
      <div className="flex items-center justify-between rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div>
          <p className="text-[18px] font-semibold tracking-wider text-[#0c0a08] dark:text-white">{BANK_ACCOUNT}</p>
          <p className="mt-0.5 text-[12px] text-[#999ba3]">{t('booking.accountHolder')}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-950 text-[#0c0a08] dark:text-white transition duration-150 hover:bg-[#f4f2f0] dark:hover:bg-slate-900 active:scale-[0.97]"
          title={t('common.copy')}
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
