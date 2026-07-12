'use client';

import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Button } from '@/components/ui/button';

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

  const statItems = [
    { label: t('dashboard.totalBooking'), value: stats.total },
    { label: t('dashboard.waiting'), value: stats.waiting },
    { label: t('dashboard.confirmed'), value: stats.confirmed },
    { label: t('dashboard.cancelled'), value: stats.cancelled },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome band — restrained obsidian with a single dawn-cobalt glow */}
      <section
        className="relative overflow-hidden rounded-xl p-6 text-white sm:p-8"
        id="dashboard-hero"
        style={{
          background:
            'radial-gradient(125% 125% at 88% -10%, rgba(86,131,210,0.40) 0%, rgba(86,131,210,0) 46%), #0c0a08',
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/60"
              suppressHydrationWarning
            >
              <span className="inline-block size-1.5 rounded-full bg-[#e4f222]" />
              {getGreeting(t)} {t('dashboard.greeting.emoji')}
            </span>
            <h1 className="mt-2.5 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {userName}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/65">
              {t('dashboard.readyToPlay')}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/45" suppressHydrationWarning>
              <Clock size={13} />
              {t('dashboard.today')} — {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="shrink-0 bg-[#e4f222] text-[#0c0a08] hover:bg-[#e4f222]/90"
          >
            <Link href="/customer/booking/create">
              <Calendar size={16} />
              {t('dashboard.bookNow')}
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats — one panel, divided columns (avoids identical card grid) */}
      <div className="overflow-hidden rounded-xl border border-border bg-card" id="dashboard-stats">
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {statItems.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                'flex flex-col gap-2 p-5',
                i % 2 !== 0 && 'border-l border-border',
                i >= 2 && 'border-t border-border',
                'sm:border-t-0',
                i === 0 ? 'sm:border-l-0' : 'sm:border-l',
              )}
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Booking activity + calendar */}
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]" id="dashboard-main">
        <div className="flex flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">{t('dashboard.bookingActivity')}</h2>
            <Link
              href="/customer/history"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>

          <div className="px-5 py-2">
            {recentBookings.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{t('dashboard.noBookings')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentBookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.fieldName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                        {b.booking_date} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)} · {money.format(b.price)}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <BookingCalendar bookings={calendarBookings} />
      </section>

      {/* Total spending */}
      <section
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        id="dashboard-spending"
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {t('dashboard.totalSpending')}
          </p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">
            {money.format(stats.totalSpending)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('dashboard.fromBookings', { count: stats.successfulCount })}
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/customer/history">
            {t('dashboard.viewHistory')} <ArrowRight size={15} />
          </Link>
        </Button>
      </section>
    </div>
  );
}
