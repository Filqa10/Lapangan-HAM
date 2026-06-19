import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type PaymentRow = {
  id: number;
  amount: number | string;
  payment_type: 'dp' | 'final';
  status: string;
  created_at: string;
};

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  dp_amount: number | string;
  status: string;
  fields: { name: string } | { name: string }[] | null;
  payments: PaymentRow[] | null;
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const statusLabels: Record<string, string> = {
  pending: 'DP menunggu verifikasi',
  dp_paid: 'DP disetujui',
  payment_2_pending: 'Pelunasan menunggu verifikasi',
  paid: 'Lunas',
  confirmed: 'Terkonfirmasi',
  cancelled: 'Dibatalkan',
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, price, dp_amount, status, fields(name), payments(id, amount, payment_type, status, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const bookings = error ? [] : ((data ?? []) as BookingRow[]);

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/customer" className="text-sm font-bold text-lime-200/75 hover:text-lime-100">Kembali ke dashboard</Link>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Riwayat booking</h1>
            <p className="mt-3 text-lime-50/65">Pantau status DP, pelunasan, dan jadwal main dari satu halaman.</p>
          </div>
          <Link href="/customer/booking/create" className="rounded-full bg-lime-300 px-5 py-3 text-center font-black text-[#082014] transition hover:bg-lime-200">Booking baru</Link>
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200/30 bg-red-950/50 p-4 text-red-100">Riwayat booking belum bisa dimuat.</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-8 text-center">
            <h2 className="text-2xl font-black">Belum ada booking.</h2>
            <p className="mt-2 text-lime-50/60">Pilih slot pertama kamu dan unggah bukti DP.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-[1.75rem] border border-lime-100/15 bg-[#092018] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-xs tracking-[0.25em] text-lime-200 uppercase">Booking #{booking.id}</p>
                    <h2 className="mt-2 text-2xl font-black">{fieldName(booking.fields)}</h2>
                    <p className="mt-1 text-lime-50/60">{booking.booking_date} | {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}</p>
                  </div>
                  <span className="rounded-full bg-lime-300/15 px-4 py-2 text-sm font-bold text-lime-100">{statusLabels[booking.status] ?? booking.status}</span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <Summary label="Total" value={money.format(Number(booking.price))} />
                  <Summary label="DP" value={money.format(Number(booking.dp_amount))} />
                  <Summary label="Sisa" value={money.format(Math.max(Number(booking.price) - Number(booking.dp_amount), 0))} />
                </div>

                <div className="mt-5 rounded-2xl bg-[#06140f] p-4">
                  <p className="mb-3 text-sm font-bold text-lime-100">Pembayaran</p>
                  {booking.payments?.length ? (
                    <div className="grid gap-2">
                      {booking.payments.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-1 rounded-xl bg-white/[0.04] px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span>{payment.payment_type === 'dp' ? 'DP' : 'Pelunasan'} - {money.format(Number(payment.amount))}</span>
                          <span className="font-bold text-lime-200">{payment.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-lime-50/55">Belum ada catatan pembayaran.</p>
                  )}
                </div>

                {booking.status === 'dp_paid' ? (
                  <Link href={`/customer/booking/${booking.id}/pelunasan`} className="mt-5 inline-flex rounded-full bg-amber-100 px-5 py-3 font-black text-[#211707] transition hover:bg-amber-200">
                    Unggah bukti pelunasan
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-lime-100/10 bg-white/[0.05] p-4">
      <p className="text-sm text-lime-50/55">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function fieldName(value: BookingRow['fields']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Lapangan HAM';
  return value?.name ?? 'Lapangan HAM';
}
