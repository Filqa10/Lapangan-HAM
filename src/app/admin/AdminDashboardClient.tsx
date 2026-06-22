'use client';

import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle2, Landmark, LayoutGrid, TrendingUp } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type Props = {
  stats: {
    activeFieldCount: number;
    totalFieldCount: number;
    totalBookingCount: number;
    pendingCount: number;
    dpPaidCount: number;
    confirmedCount: number;
    dpRevenue: number;
    todayRevenue: number;
    thisMonthRevenue: number;
  };
  last7Days: { date: string; revenue: number }[];
  last6Months: { month: string; revenue: number }[];
};

type MetricTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ElementType;
  tone?: 'default' | 'attention' | 'success';
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function MetricTile({ label, value, detail, icon: Icon, tone = 'default' }: MetricTileProps) {
  const toneClass = {
    default: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
    attention: 'bg-[#0c0a08] text-white dark:bg-[#e4f222] dark:text-[#0c0a08]',
    success: 'bg-[var(--bg-card)] text-[var(--text-primary)]',
  }[tone];
  const iconClass = tone === 'attention'
    ? 'bg-white/10 text-white dark:bg-[#0c0a08]/10 dark:text-[#0c0a08]'
    : tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-[var(--bg-body)] text-[var(--text-secondary)]';
  const mutedClass = tone === 'attention' ? 'text-white/70 dark:text-[#0c0a08]/70' : 'text-[var(--text-muted)]';

  return (
    <article className={`stagger-item rounded-xl border border-[var(--border-subtle)] p-5 transition-transform duration-150 active:scale-[0.98] ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-medium uppercase tracking-[0.02em] ${mutedClass}`}>{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] ${iconClass}`}>
          <Icon size={18} />
        </span>
      </div>
      {detail ? <p className={`mt-4 text-xs ${mutedClass}`}>{detail}</p> : null}
    </article>
  );
}

function TrendTable({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: { date?: string; month?: string; revenue: number }[];
}) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-[0.02em]">{title}</h2>
        <TrendingUp size={16} className="text-[var(--text-muted)]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="pb-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No revenue data yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.date ?? row.month} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                  <td className="py-3 font-medium text-[var(--text-secondary)]">{row.date ?? row.month}</td>
                  <td className="py-3 text-right font-semibold text-[var(--text-primary)]" suppressHydrationWarning>
                    {money.format(row.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AdminDashboardClient({ stats, last7Days, last6Months }: Props) {
  const { t, locale } = useTranslation();

  const todayLabel = new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const monthLabel = new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.controlRoom')}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{t('admin.dashboardTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Keep verification work visible, monitor field availability, and track approved payment revenue.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/admin/bookings" className="btn inline-flex items-center justify-center gap-2 rounded-[4px] bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-card)] transition hover:bg-[var(--accent-blue-hover)] active:scale-[0.97]">
            {t('admin.verifyPayments')} <ArrowRight size={16} />
          </Link>
          <Link href="/admin/fields" className="btn inline-flex items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)] active:scale-[0.97]">
            {t('admin.fields')}
          </Link>
        </div>
      </div>

      {/* Bird's-Eye View Metrics at the TOP */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" id="admin-stats">
        <MetricTile label={t('admin.fields')} value={`${stats.activeFieldCount}/${stats.totalFieldCount}`} detail={t('admin.active')} icon={LayoutGrid} />
        <MetricTile label={t('admin.totalBookingCount')} value={stats.totalBookingCount} detail="All recent bookings" icon={Calendar} />
        <MetricTile label={t('admin.dpRevenue')} value={money.format(stats.dpRevenue)} detail="Approved payment total" icon={Landmark} />
        <MetricTile label={t('admin.confirmedPaid')} value={stats.confirmedCount} detail="Ready or completed slots" icon={CheckCircle2} tone="success" />
      </div>

      {/* Primary Operations Grid (Action items & Revenue Summary) */}
      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Pending Actions */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.pendingVerification')}</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-[var(--text-primary)]">{stats.pendingCount}</p>
            </div>
            <Link href="/admin/bookings" className="btn inline-flex items-center justify-center gap-2 rounded-[4px] bg-[var(--accent-lime)] px-4 py-2.5 text-sm font-medium text-[#0c0a08] transition hover:opacity-90 active:scale-[0.97]">
              {t('admin.verifyPayments')} <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="mt-6 grid gap-4 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.dpPaid')}</p>
              <p className="mt-1 text-xl font-medium text-[var(--text-primary)]">{stats.dpPaidCount}</p>
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-4 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.confirmedPaid')}</p>
              <p className="mt-1 text-xl font-medium text-[var(--text-primary)]">{stats.confirmedCount}</p>
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-4 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.totalBookingCount')}</p>
              <p className="mt-1 text-xl font-medium text-[var(--text-primary)]">{stats.totalBookingCount}</p>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-[var(--text-primary)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.todayRevenue')}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]" suppressHydrationWarning>{money.format(stats.todayRevenue)}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]" suppressHydrationWarning>{todayLabel}</p>
          <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.thisMonthRevenue')}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]" suppressHydrationWarning>{money.format(stats.thisMonthRevenue)}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]" suppressHydrationWarning>{monthLabel}</p>
          </div>
        </div>
      </section>

      {/* Charts & Trends */}
      <div className="grid gap-5 xl:grid-cols-2" id="admin-trends">
        <TrendTable title={t('admin.last7Days')} label={t('admin.date')} rows={last7Days} />
        <TrendTable title={t('admin.last6Months')} label={t('admin.monthCol')} rows={last6Months} />
      </div>
    </div>
  );
}
