import { createClient } from '@/lib/supabase/server';
import { CustomerDashboardClient } from './CustomerDashboardClient';

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  fields: { name: string } | { name: string }[] | null;
};

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: bookings }, { data: allBookings }] = await Promise.all([
    supabase.from('profiles').select('name, phone').eq('id', user!.id).maybeSingle(),
    supabase
      .from('bookings')
      .select('id, booking_date, start_time, end_time, price, status, fields(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('bookings')
      .select('id, booking_date, price, status')
      .eq('user_id', user!.id),
  ]);

  const recentBookings = (bookings ?? []) as BookingRow[];
  const allBookingsList = (allBookings ?? []) as { id: number; booking_date: string; price: number | string; status: string }[];

  // Stats
  const total = allBookingsList.length;
  const waiting = allBookingsList.filter((b) => ['pending', 'payment_2_pending'].includes(b.status)).length;
  const confirmed = allBookingsList.filter((b) => ['confirmed', 'paid', 'dp_paid'].includes(b.status)).length;
  const cancelled = allBookingsList.filter((b) => b.status === 'cancelled').length;
  const totalSpending = allBookingsList
    .filter((b) => ['confirmed', 'paid'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.price), 0);
  const successfulCount = allBookingsList.filter((b) => ['confirmed', 'paid'].includes(b.status)).length;

  // Calendar data
  const calendarBookings = allBookingsList.map((b) => ({
    booking_date: b.booking_date,
    status: b.status,
  }));

  return (
    <CustomerDashboardClient
      userName={profile?.name ?? user!.email ?? 'Customer'}
      stats={{ total, waiting, confirmed, cancelled, totalSpending, successfulCount }}
      recentBookings={recentBookings.map((b) => ({
        id: b.id,
        fieldName: Array.isArray(b.fields) ? b.fields[0]?.name ?? 'Field' : b.fields?.name ?? 'Field',
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        price: Number(b.price),
        status: b.status,
      }))}
      calendarBookings={calendarBookings}
    />
  );
}
