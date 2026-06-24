'use client';

import Link from 'next/link';
import { Calendar, Clock, DollarSign, ArrowRight } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import { BookingCalendar } from '@/components/BookingCalendar';

type Props = {
  userName: string;
  stats: {
    total: number;
    waiting: number;
    confirmed: number;
    cancelled: number;
    totalSpending: number;
    successfulCount: number;
  };
  recentBookings: {
    id: number;
    fieldName: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    price: number;
    status: string;
  }[];
  calendarBookings: { booking_date: string; status: string }[];
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.greeting.morning');
  if (hour < 17) return t('dashboard.greeting.afternoon');
  return t('dashboard.greeting.evening');
}

export function CustomerDashboardClient({ userName, stats, recentBookings, calendarBookings }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 font-sans text-[#0c0a08]">
      {/* Hero Greeting Card - Dawn-lit Sky Gradient */}
      <section
        className="relative overflow-hidden rounded-[12px] p-8 sm:p-10 text-white"
        id="dashboard-hero"
        style={{
          background: 'linear-gradient(165deg, #0c0a08 0%, #0c0a08 30%, #1d2740 60%, #3a548c 80%, #5683d2 92%, #f4f2f0 100%)',
        }}
      >
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]" suppressHydrationWarning>
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#e4f222]" />
              {getGreeting(t)} {t('dashboard.greeting.emoji')}
            </span>
            <h1 className="mt-3 text-[32px] sm:text-[40px] font-normal leading-[1.1] tracking-tight uppercase text-white">
              {userName}
            </h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-white/70">
              {t('dashboard.readyToPlay')}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-white/45">
              <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
                <Clock size={14} />
                {t('dashboard.today')} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col shrink-0">
            <Link
              href="/customer/booking/create"
              className="btn flex items-center justify-center gap-2 rounded-[4px] bg-[#e4f222] px-5 py-3 text-[15px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              <Calendar size={16} />
              {t('dashboard.bookNow')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Summary Strip - Typography-led & Desaturated */}
      <section
        className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40 p-6"
        id="dashboard-stats"
      >
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#d2cecb]/40 dark:divide-slate-800">
          <div className="flex flex-col">
            <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
              {t('dashboard.totalBooking')}
            </span>
            <span className="mt-2 text-[32px] font-normal tracking-tight text-[#0c0a08] dark:text-white leading-none">
              {stats.total}
            </span>
          </div>
          <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
              {t('dashboard.waiting')}
            </span>
            <span className="mt-2 text-[32px] font-normal tracking-tight text-[#0c0a08] dark:text-white leading-none">
              {stats.waiting}
            </span>
          </div>
          <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
              {t('dashboard.confirmed')}
            </span>
            <span className="mt-2 text-[32px] font-normal tracking-tight text-[#0c0a08] dark:text-white leading-none">
              {stats.confirmed}
            </span>
          </div>
          <div className="flex flex-col pt-4 sm:pt-0 sm:pl-6">
            <span className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
              {t('dashboard.cancelled')}
            </span>
            <span className="mt-2 text-[32px] font-normal tracking-tight text-[#0c0a08] dark:text-white leading-none">
              {stats.cancelled}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area: Recent Bookings & Calendar */}
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]" id="dashboard-main">
        {/* Recent Booking Activity */}
        <div className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[18px] font-medium uppercase tracking-[0.02em] text-[#0c0a08] dark:text-white">
                {t('dashboard.bookingActivity')}
              </h2>
              <Link href="/customer/history" className="text-[14px] font-medium text-[#0c0a08] dark:text-white transition hover:text-[#5683d2] hover:underline">
                {t('dashboard.viewAll')} →
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <p className="rounded-[4px] bg-[#f4f2f0] dark:bg-slate-900 p-6 text-center text-[15px] text-[#999ba3]">
                {t('dashboard.noBookings')}
              </p>
            ) : (
              <div className="divide-y divide-[#f4f2f0] dark:divide-slate-800/80">
                {recentBookings.map((b) => (
                  <article
                    key={b.id}
                    className="stagger-item flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-[15px] font-medium text-[#0c0a08] dark:text-white">{b.fieldName}</p>
                      <p className="mt-1 text-[13px] text-[#999ba3]">
                        {b.booking_date} • {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)} • {money.format(b.price)}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Calendar */}
        <BookingCalendar bookings={calendarBookings} />
      </section>

      {/* Total Spending Panel - Typography-led Limestone block */}
      <section
        className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40 p-6"
        id="dashboard-spending"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] bg-emerald-500/10">
              <DollarSign size={22} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
                {t('dashboard.totalSpending')}
              </p>
              <p className="mt-1.5 text-[32px] font-normal tracking-tight text-[#0c0a08] dark:text-white leading-none">
                {money.format(stats.totalSpending)}
              </p>
              <p className="mt-2.5 text-[13px] text-[#999ba3]">
                {t('dashboard.fromBookings', { count: stats.successfulCount })}
              </p>
            </div>
          </div>
          <Link
            href="/customer/history"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-[14px] font-medium text-[#0c0a08] dark:text-white transition duration-150 hover:bg-[#f4f2f0] dark:hover:bg-slate-800 active:scale-[0.97]"
          >
            {t('dashboard.viewHistory')} <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
