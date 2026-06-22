import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from './AdminDashboardClient';

type BookingRow = {
  id: number;
  booking_date: string;
  status: string;
  price: number | string;
  fields: { name: string } | { name: string }[] | null;
};

type PaymentRow = {
  amount: number | string;
  status: string;
  created_at: string;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: fieldsData }, { data: bookingsData }, { data: paymentsData }] = await Promise.all([
    supabase.from('fields').select('id, name, price, status').order('name'),
    supabase.from('bookings').select('id, booking_date, status, price, fields(name)').order('booking_date', { ascending: false }).limit(200),
    supabase.from('payments').select('amount, status, created_at'),
  ]);

  const fields = (fieldsData ?? []) as { id: number; name: string; price: number | string; status: string }[];
  const bookings = (bookingsData ?? []) as BookingRow[];
  const payments = (paymentsData ?? []) as PaymentRow[];

  const activeFieldCount = fields.filter((f) => f.status === 'active').length;
  const totalBookingCount = bookings.length;
  const pendingCount = bookings.filter((b) => ['pending', 'payment_2_pending'].includes(b.status)).length;
  const dpPaidCount = bookings.filter((b) => b.status === 'dp_paid').length;
  const confirmedCount = bookings.filter((b) => ['confirmed', 'paid'].includes(b.status)).length;

  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const dpRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Today's revenue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(todayStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Last 7 days
  const last7Days = buildDailyRevenue(approvedPayments, 7);

  // Last 6 months
  const last6Months = buildMonthlyRevenue(approvedPayments, 6);

  // This month
  const monthStr = todayStr.slice(0, 7);
  const thisMonthRevenue = approvedPayments
    .filter((p) => p.created_at?.startsWith(monthStr))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <AdminDashboardClient
      stats={{
        activeFieldCount,
        totalFieldCount: fields.length,
        totalBookingCount,
        pendingCount,
        dpPaidCount,
        confirmedCount,
        dpRevenue,
        todayRevenue,
        thisMonthRevenue,
      }}
      last7Days={last7Days}
      last6Months={last6Months}
    />
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
