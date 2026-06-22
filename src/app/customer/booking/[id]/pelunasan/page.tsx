import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { PelunasanForm } from './PelunasanForm';

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

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default async function PelunasanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = Number(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/customer');

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return <MissingBooking />;
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, price, dp_amount, status, fields(name)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return <MissingBooking />;
  }

  const booking = data as BookingRow;
  const remainingAmount = Math.max(Number(booking.price) - Number(booking.dp_amount), 0);
  const fName = Array.isArray(booking.fields) ? booking.fields[0]?.name ?? 'Field' : booking.fields?.name ?? 'Field';

  return (
    <div className="space-y-6 font-sans text-[#0c0a08] dark:text-white">
      {/* Back link */}
      <Link href="/customer/history" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0c0a08] dark:text-white transition hover:text-[#5683d2]">
        ← Back to History
      </Link>

      {/* Booking summary */}
      <section className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
        <span className="inline-flex items-center rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
          Booking #{booking.id}
        </span>
        <h1 className="mt-3 text-[28px] font-normal uppercase tracking-tight leading-none text-[#0c0a08] dark:text-white">{fName}</h1>
        <p className="mt-1.5 text-[13px] text-[#999ba3] leading-relaxed">
          {booking.booking_date} | {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total" value={money.format(Number(booking.price))} />
          <SummaryCard label="DP Paid" value={money.format(Number(booking.dp_amount))} isDp />
          <SummaryCard label="Remaining" value={money.format(remainingAmount)} highlight />
        </div>
      </section>

      {/* Payment form or status message */}
      {booking.status === 'dp_paid' ? (
        <PelunasanForm bookingId={booking.id} remainingAmount={remainingAmount} />
      ) : (
        <div className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
          <h2 className="text-[18px] font-medium uppercase tracking-[0.02em] text-[#0c0a08] dark:text-white">Payment Not Available</h2>
          <p className="mt-2 text-[14px] text-[#999ba3] leading-relaxed">
            Current status: {booking.status}. Payment is available after admin approves your DP.
          </p>
        </div>
      )}
    </div>
  );
}

function MissingBooking() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center max-w-sm w-full">
        <h1 className="text-[20px] font-normal uppercase tracking-tight text-[#0c0a08] dark:text-white">Booking Not Found</h1>
        <p className="mt-2 text-[14px] text-[#999ba3]">Check your booking history.</p>
        <Link href="/customer/history" className="mt-4 inline-flex rounded-[4px] bg-[#e4f222] px-5 py-2.5 text-[15px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97]">
          Open History
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, isDp, highlight }: { label: string; value: string; isDp?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-[4px] border p-4 ${
      highlight
        ? 'border-amber-500/20 bg-amber-500/10'
        : 'border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40'
    }`}>
      <p className="text-[11px] font-medium text-[#999ba3] uppercase tracking-[0.02em]">{label}</p>
      <p className={`mt-1.5 text-[20px] font-semibold tracking-tight leading-none ${
        highlight
          ? 'text-amber-600 dark:text-amber-400'
          : isDp
            ? 'text-emerald-500'
            : 'text-[#0c0a08] dark:text-white'
      }`}>
        {value}
      </p>
    </div>
  );
}

