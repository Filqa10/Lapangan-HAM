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

  if (!user) redirect('/login');

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

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/customer/history" className="text-sm font-bold text-lime-200/75 hover:text-lime-100">Kembali ke riwayat</Link>
        <section className="my-8 rounded-[2rem] border border-lime-100/15 bg-[#092018] p-6">
          <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Booking #{booking.id}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">{fieldName(booking.fields)}</h1>
          <p className="mt-2 text-lime-50/65">{booking.booking_date} | {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Summary label="Total" value={money.format(Number(booking.price))} />
            <Summary label="DP diterima" value={money.format(Number(booking.dp_amount))} />
            <Summary label="Sisa" value={money.format(remainingAmount)} />
          </div>
        </section>

        {booking.status === 'dp_paid' ? (
          <PelunasanForm bookingId={booking.id} remainingAmount={remainingAmount} />
        ) : (
          <div className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-6">
            <h2 className="text-2xl font-black">Pelunasan belum bisa dikirim.</h2>
            <p className="mt-2 text-lime-50/65">Status booking saat ini: {booking.status}. Tombol pelunasan aktif setelah DP disetujui admin.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function MissingBooking() {
  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-12 text-lime-50">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-lime-100/15 bg-[#092018] p-6 text-center">
        <h1 className="text-3xl font-black">Booking tidak ditemukan.</h1>
        <p className="mt-2 text-lime-50/60">Periksa kembali riwayat booking akun kamu.</p>
        <Link href="/customer/history" className="mt-5 inline-flex rounded-full bg-lime-300 px-5 py-3 font-black text-[#082014]">Buka riwayat</Link>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-lime-100/10 bg-white/[0.05] p-4">
      <p className="text-sm text-lime-50/55">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function fieldName(value: BookingRow['fields']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Lapangan HAM';
  return value?.name ?? 'Lapangan HAM';
}
