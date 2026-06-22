'use client';

import Link from 'next/link';
import { History } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';

type BookingItem = {
  id: number;
  fieldName: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
  dp_amount: number;
  status: string;
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function HistoryClient({ bookings }: { bookings: BookingItem[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 font-sans text-[#0c0a08] dark:text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900">
            <History size={18} className="text-[#999ba3]" />
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-normal uppercase tracking-tight leading-none">
            {t('history.title')}
          </h1>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center">
          <p className="text-[15px] text-[#999ba3]">{t('history.noHistory')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <article
              key={b.id}
              className="stagger-item rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 transition hover:border-[#999ba3]/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[16px] font-medium text-[#0c0a08] dark:text-white">{b.fieldName}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1.5 text-[13px] text-[#999ba3] leading-relaxed">
                    {b.booking_date} • {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                  </p>
                  <div className="mt-2 flex gap-6 text-[13px]">
                    <div>
                      <span className="text-[#999ba3]">{t('booking.totalPrice') || 'Total'}:</span>{' '}
                      <span className="font-medium text-[#0c0a08] dark:text-white">{money.format(b.price)}</span>
                    </div>
                    <div>
                      <span className="text-[#999ba3]">{t('booking.dpAmount') || 'DP'}:</span>{' '}
                      <span className="font-semibold text-emerald-500">{money.format(b.dp_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {b.status === 'dp_paid' && (
                    <Link
                      href={`/customer/booking/${b.id}/pelunasan`}
                      className="rounded-[4px] bg-[#e4f222] px-4 py-2 text-[14px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97]"
                    >
                      {t('history.completePayment')}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

