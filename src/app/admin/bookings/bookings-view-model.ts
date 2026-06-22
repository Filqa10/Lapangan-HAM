export type AdminBookingsQueryRow = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  dp_amount: number | string;
  status: string;
  created_at: string;
  fields: { name: string | null } | { name: string | null }[] | null;
  profiles:
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }[]
    | null;
  payments:
    | {
        receipt_url: string | null;
        payment_type: string | null;
        status: string | null;
        created_at: string;
      }[]
    | null;
};

export type AdminBookingRow = {
  id: number;
  fieldName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
  dp_amount: number;
  status: string;
  receiptUrl: string | null;
  receiptUnavailable: boolean;
  created_at_label: string;
  created_at_sort_key: number;
};

export type AdminBookingsLoadError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

type PaymentRow = NonNullable<AdminBookingsQueryRow['payments']>[number];

export async function buildAdminBookingRows(
  bookings: AdminBookingsQueryRow[],
  signProofUrl: (path: string) => Promise<string | null>,
): Promise<AdminBookingRow[]> {
  return Promise.all(
    bookings.map(async (booking) => {
      const selectedProof = selectProofForStatus(booking.status, booking.payments ?? []);
      const receiptPath = selectedProof?.receipt_url?.trim() ?? '';
      let receiptUrl: string | null = null;
      if (receiptPath) {
        try {
          receiptUrl = await signProofUrl(receiptPath);
        } catch {
          receiptUrl = null;
        }
      }
      const profile = firstRelation(booking.profiles);

      return {
        id: booking.id,
        fieldName: firstRelation(booking.fields)?.name?.trim() ?? '',
        customerName: profile?.name?.trim() ?? '',
        customerEmail: profile?.email?.trim() ?? '',
        customerPhone: profile?.phone?.trim() ?? '',
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        price: Number(booking.price),
        dp_amount: Number(booking.dp_amount),
        status: booking.status,
        receiptUrl,
        receiptUnavailable: Boolean(receiptPath) && !receiptUrl,
        created_at_label: formatBookingCreatedLabel(booking.created_at),
        created_at_sort_key: Date.parse(booking.created_at),
      };
    }),
  );
}

export function buildAdminBookingsLoadMessage(error: AdminBookingsLoadError) {
  const missingProfileContactColumn = /profiles\.(email|phone)/i.test(error.message);
  const reason = missingProfileContactColumn
    ? 'The bookings query is asking for profile contact fields that are missing in this database. Apply the profiles.email / profiles.phone migration and retry.'
    : 'Review the query error below and retry after the underlying data issue is resolved.';

  return `Booking data could not be loaded for admins. ${reason} Supabase said: ${error.message}`;
}

function selectProofForStatus(status: string, payments: PaymentRow[]): PaymentRow | null {
  switch (status) {
    case 'pending':
      return latestPayment(payments, { paymentType: 'dp', status: 'pending' });
    case 'payment_2_pending':
      return latestPayment(payments, { paymentType: 'final', status: 'pending' });
    case 'dp_paid':
      return latestPayment(payments, { paymentType: 'dp', status: 'approved' });
    case 'confirmed':
    case 'paid':
      return (
        latestPayment(payments, { paymentType: 'final', status: 'approved' }) ??
        latestPayment(payments, { paymentType: 'dp', status: 'approved' })
      );
    default:
      return null;
  }
}

function latestPayment(
  payments: PaymentRow[],
  criteria: { paymentType: string; status: string },
): PaymentRow | null {
  const matches = payments
    .filter(
      (payment) =>
        payment.payment_type === criteria.paymentType &&
        payment.status === criteria.status &&
        Boolean(payment.receipt_url?.trim()),
    )
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

  return matches[0] ?? null;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatBookingCreatedLabel(value: string) {
  const date = new Date(value);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
