import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from './AdminDashboardClient';

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

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: fieldsData }, { data: bookingsData }, { data: paymentsData }] = await Promise.all([
    supabase.from('fields').select('id, name, price, status').order('name'),
    supabase.from('bookings').select('id, field_id, booking_date, status, price, fields(name)').order('booking_date', { ascending: false }).limit(200),
    supabase.from('payments').select('amount, status, created_at, bookings(field_id, fields(name))'),
  ]);

  const fields = (fieldsData ?? []) as { id: number; name: string; price: number | string; status: string }[];
  const bookings = (bookingsData ?? []) as BookingRow[];
  const payments = (paymentsData ?? []) as PaymentRow[];

  return (
    <AdminDashboardClient
      fields={fields}
      bookings={bookings}
      payments={payments}
    />
  );
}
