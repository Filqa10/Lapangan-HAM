'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig;

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

  // Chart wants chronological order (oldest -> newest) and a compact day label.
  const dailyChart = [...last7Days]
    .reverse()
    .map((row) => ({ date: row.date.slice(0, 5), revenue: row.revenue }));

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

  const kpis = [
    { label: t('admin.fields'), value: activeFieldLabel, caption: t('admin.active') },
    { label: t('admin.totalBookingCount'), value: String(totalBookingCount), caption: 'All recent bookings' },
    { label: t('admin.dpRevenue'), value: money.format(dpRevenue), caption: 'Approved payment total' },
    { label: t('admin.confirmedPaid'), value: String(confirmedCount), caption: 'Ready or completed' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('admin.dashboardTitle')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Keep verification work visible, monitor field availability, and track approved payment revenue.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {fields.map((field) => (
                <SelectItem key={field.id} value={String(field.id)}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href="/admin/fields">{t('admin.fields')}</Link>
          </Button>
        </div>
      </div>

      {/* Pending verification — focused action banner */}
      {pendingCount > 0 ? (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-lime)] text-xl font-semibold tabular-nums text-[#0c0a08]">
              {pendingCount}
            </span>
            <div>
              <p className="font-medium">{t('admin.pendingVerification')}</p>
              <p className="text-sm text-muted-foreground">{t('admin.pendingBannerDesc')}</p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0 bg-[var(--accent-lime)] text-[#0c0a08] hover:bg-[var(--accent-lime)]/90"
          >
            <Link href="/admin/bookings">
              {t('admin.verifyPayments')} <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 sm:p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p className="font-medium">{t('admin.allClearTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('admin.allClearDesc')}</p>
          </div>
        </div>
      )}

      {/* KPIs — one panel, divided columns */}
      <div className="overflow-hidden rounded-xl border border-border bg-card" id="admin-stats">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className={cn(
                'flex flex-col gap-2 p-5',
                i % 2 !== 0 && 'border-l border-border',
                i >= 2 && 'border-t border-border',
                'lg:border-t-0',
                i === 0 ? 'lg:border-l-0' : 'lg:border-l',
              )}
            >
              <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">{kpi.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums" suppressHydrationWarning>
                {kpi.value}
              </dd>
              <dd className="text-xs text-muted-foreground">{kpi.caption}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Revenue trend + summary */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]" id="admin-trends">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight">{t('admin.last7Days')}</h2>
            <span className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
              {t('admin.revenueTrend')}
            </span>
          </div>
          <div className="p-5">
            {dailyChart.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No revenue data yet.</p>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
                <BarChart accessibilityLayer data={dailyChart} margin={{ left: 4, right: 4, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {t('admin.todayRevenue')}
          </p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums" suppressHydrationWarning>
            {money.format(todayRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>{todayLabel}</p>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
              {t('admin.thisMonthRevenue')}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums" suppressHydrationWarning>
              {money.format(thisMonthRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>{monthLabel}</p>
          </div>
        </div>
      </div>

      {/* Last 6 months */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">{t('admin.last6Months')}</h2>
          <span className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {t('admin.revenueTrend')}
          </span>
        </div>
        <div className="px-5 py-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('admin.monthCol')}</TableHead>
                <TableHead className="text-right">{t('admin.revenueTrend')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {last6Months.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">
                    No revenue data yet.
                  </TableCell>
                </TableRow>
              ) : (
                last6Months.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums" suppressHydrationWarning>
                      {money.format(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
