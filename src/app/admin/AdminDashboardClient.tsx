'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle2, Landmark, LayoutGrid, TrendingUp } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type BookingRow = {
  id: number;
  field_id: number;
  booking_date: string;
  status: string;
  price: number | string;
  fields: { name: string } | { name: string }[] | null;
};

type PaymentRow = {
  amount: number | string;
  status: string;
  created_at: string;
  bookings: {
    field_id: number;
    fields: {
      name: string;
    } | { name: string }[] | null;
  } | {
    field_id: number;
    fields: {
      name: string;
    } | { name: string }[] | null;
  }[] | null;
};

type FieldRow = {
  id: number;
  name: string;
  price: number | string;
  status: string;
};

type Props = {
  fields: FieldRow[];
  bookings: BookingRow[];
  payments: PaymentRow[];
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

export function AdminDashboardClient({ fields, bookings, payments }: Props) {
  const { t, locale } = useTranslation();
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');

  const filteredBookings = bookings.filter((b) => {
    if (selectedFieldId === 'all') return true;
    return String(b.field_id) === selectedFieldId;
  });

  const getFieldIdFromPayment = (p: PaymentRow): number | null => {
    const booking = Array.isArray(p.bookings) ? p.bookings[0] : p.bookings;
    return booking?.field_id ?? null;
  };

  const filteredPayments = payments.filter((p) => {
    if (selectedFieldId === 'all') return true;
    return String(getFieldIdFromPayment(p)) === selectedFieldId;
  });

  // Calculate dynamic stats
  const totalBookingCount = filteredBookings.length;
  const pendingCount = filteredBookings.filter((b) => ['pending', 'payment_2_pending'].includes(b.status)).length;
  const confirmedCount = filteredBookings.filter((b) => ['confirmed', 'paid'].includes(b.status)).length;

  const approvedPayments = filteredPayments.filter((p) => p.status === 'approved');
  const dpRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(todayStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const thisMonthStr = todayStr.slice(0, 7);
  const thisMonthRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(thisMonthStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const last7Days = buildDailyRevenue(approvedPayments, 7);
  const last6Months = buildMonthlyRevenue(approvedPayments, 6);

  const todayLabel = new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const monthLabel = new Date().toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const activeFieldLabel = selectedFieldId === 'all'
    ? `${fields.filter((f) => f.status === 'active').length}/${fields.length}`
    : fields.find((f) => String(f.id) === selectedFieldId)?.status === 'active'
      ? t('admin.active')
      : t('admin.inactive') || 'Inactive';

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
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-lime)]"
          >
            <option value="all">All Fields</option>
            {fields.map((field) => (
              <option key={field.id} value={String(field.id)}>
                {field.name}
              </option>
            ))}
          </select>
          <Link href="/admin/fields" className="btn inline-flex items-center justify-center rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)] active:scale-[0.97]">
            {t('admin.fields')}
          </Link>
        </div>
      </div>

      {/* Bird's-Eye View Metrics at the TOP */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" id="admin-stats">
        <MetricTile label={t('admin.fields')} value={activeFieldLabel} detail={t('admin.active')} icon={LayoutGrid} />
        <MetricTile label={t('admin.totalBookingCount')} value={totalBookingCount} detail="All recent bookings" icon={Calendar} />
        <MetricTile label={t('admin.dpRevenue')} value={money.format(dpRevenue)} detail="Approved payment total" icon={Landmark} />
        <MetricTile label={t('admin.confirmedPaid')} value={confirmedCount} detail="Ready or completed slots" icon={CheckCircle2} tone="success" />
      </div>

      {/* Primary Operations Grid (Action items & Revenue Summary) */}
      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Pending Actions */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.pendingVerification')}</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-[var(--text-primary)]">{pendingCount}</p>
            </div>
            <Link href="/admin/bookings" className="btn inline-flex items-center justify-center gap-2 rounded-[4px] bg-[var(--accent-lime)] px-4 py-2.5 text-sm font-medium text-[#0c0a08] transition hover:opacity-90 active:scale-[0.97]">
              {t('admin.verifyPayments')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-[var(--text-primary)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.todayRevenue')}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]" suppressHydrationWarning>{money.format(todayRevenue)}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]" suppressHydrationWarning>{todayLabel}</p>
          <div className="mt-6 border-t border-[var(--border-subtle)] pt-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.02em]">{t('admin.thisMonthRevenue')}</p>
            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]" suppressHydrationWarning>{money.format(thisMonthRevenue)}</p>
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

function buildDailyRevenue(payments: PaymentRow[], limit: number) {
  const dailyMap: Record<string, number> = {};

  payments.forEach((p) => {
    if (!p.created_at) return;
    const datePart = typeof p.created_at === 'string' ? p.created_at.slice(0, 10) : new Date(p.created_at).toISOString().slice(0, 10);
    const [y, m, d] = datePart.split('-');
    const label = `${d}/${m}/${y}`;
    dailyMap[label] = (dailyMap[label] ?? 0) + Number(p.amount);
  });

  return Object.entries(dailyMap)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => {
      const [da, ma, ya] = a.date.split('/').map(Number);
      const [db, mb, yb] = b.date.split('/').map(Number);
      return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
    })
    .slice(0, limit);
}

function buildMonthlyRevenue(payments: PaymentRow[], limit: number) {
  const monthlyMap: Record<string, { label: string; revenue: number }> = {};

  payments.forEach((p) => {
    if (!p.created_at) return;
    const datePart = typeof p.created_at === 'string' ? p.created_at.slice(0, 10) : new Date(p.created_at).toISOString().slice(0, 10);
    const [y, m] = datePart.split('-').map(Number);
    const dateObj = new Date(y, m - 1, 1);
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!monthlyMap[key]) {
      monthlyMap[key] = { label, revenue: 0 };
    }
    monthlyMap[key].revenue += Number(p.amount);
  });

  return Object.keys(monthlyMap)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      month: monthlyMap[key].label,
      revenue: monthlyMap[key].revenue,
    }))
    .slice(0, limit);
}
