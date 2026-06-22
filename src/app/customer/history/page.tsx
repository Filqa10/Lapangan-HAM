import { createClient } from '@/lib/supabase/server';
import { HistoryClient } from './HistoryClient';

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  dp_amount: number | string;
  status: string;
  fields: { name: string } | { name: string }[] | null;
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, price, dp_amount, status, fields(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  const rows = ((bookings ?? []) as BookingRow[]).map((b) => ({
    id: b.id,
    fieldName: Array.isArray(b.fields) ? b.fields[0]?.name ?? 'Field' : b.fields?.name ?? 'Field',
    booking_date: b.booking_date,
    start_time: b.start_time,
    end_time: b.end_time,
    price: Number(b.price),
    dp_amount: Number(b.dp_amount),
    status: b.status,
  }));

  return <HistoryClient bookings={rows} />;
}
