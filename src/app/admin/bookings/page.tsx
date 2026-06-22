import { createClient } from '@/lib/supabase/server';
import { AdminBookingsClient } from './AdminBookingsClient';
import {
  buildAdminBookingRows,
  buildAdminBookingsLoadMessage,
  type AdminBookingsQueryRow,
} from './bookings-view-model';

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, price, dp_amount, status, created_at, fields(name), profiles(name, email, phone), payments(receipt_url, payment_type, status, created_at)')
    .order('created_at', { ascending: false });

  const rows = await buildAdminBookingRows(
    (bookings ?? []) as AdminBookingsQueryRow[],
    async (proofPath) => {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(proofPath, 60 * 10);

      if (error || !data?.signedUrl) {
        return null;
      }

      return data.signedUrl;
    },
  );

  return (
    <AdminBookingsClient
      bookings={rows}
      loadError={error ? buildAdminBookingsLoadMessage(error) : null}
    />
  );
}
