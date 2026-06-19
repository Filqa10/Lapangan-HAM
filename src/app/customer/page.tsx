import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type BookingRow = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  status: string;
  fields: { name: string } | { name: string }[] | null;
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const statusLabels: Record<string, string> = {
  pending: 'DP menunggu verifikasi',
  dp_paid: 'DP disetujui, siap pelunasan',
  payment_2_pending: 'Pelunasan menunggu verifikasi',
  paid: 'Lunas',
  confirmed: 'Terkonfirmasi',
  cancelled: 'Dibatalkan',
};

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: bookings, error: bookingsError }] = await Promise.all([
    supabase.from('profiles').select('name, phone').eq('id', user.id).maybeSingle(),
    supabase
      .from('bookings')
      .select('id, booking_date, start_time, end_time, price, status, fields(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const recentBookings = bookingsError ? [] : ((bookings ?? []) as BookingRow[]);

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-lime-100/15 bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.2),transparent_32%),#092018] p-6 shadow-2xl sm:p-8">
          <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Customer portal</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Selamat datang, {profile?.name ?? user.email ?? 'Customer'}.</h1>
              <p className="mt-4 max-w-2xl text-lime-50/65">Mulai booking baru, unggah bukti DP, lalu lanjutkan pelunasan setelah admin menyetujui pembayaran pertama.</p>
            </div>
            <div className="grid gap-3">
              <Link href="/customer/booking/create" className="rounded-full bg-lime-300 px-5 py-3 text-center font-black text-[#082014] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0">
                Booking lapangan
              </Link>
              <Link href="/customer/history" className="rounded-full border border-lime-100/25 px-5 py-3 text-center font-black text-lime-50 transition hover:bg-white/5">
                Lihat riwayat
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {['Pilih tanggal dan jam main', 'Transfer DP sesuai preview', 'Tunggu verifikasi admin'].map((step) => (
            <div key={step} className="rounded-3xl border border-lime-100/15 bg-white/[0.06] p-5">
              <p className="font-mono text-xs tracking-[0.25em] text-lime-200 uppercase">Langkah</p>
              <p className="mt-3 text-xl font-black">{step}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Booking terbaru</h2>
            <Link href="/customer/history" className="text-sm font-bold text-lime-200/80 hover:text-lime-100">Semua riwayat</Link>
          </div>
          {bookingsError ? (
            <p className="rounded-2xl bg-red-950/60 p-4 text-red-100">Riwayat belum bisa dimuat sekarang.</p>
          ) : recentBookings.length === 0 ? (
            <p className="rounded-2xl bg-lime-50/5 p-4 text-lime-50/65">Belum ada booking. Mulai dengan memilih slot lapangan.</p>
          ) : (
            <div className="grid gap-3">
              {recentBookings.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-lime-100/10 bg-[#06140f] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black">{fieldName(booking.fields)} - {booking.booking_date}</p>
                      <p className="text-sm text-lime-50/55">{booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)} | {money.format(Number(booking.price))}</p>
                    </div>
                    <span className="rounded-full bg-lime-300/15 px-3 py-1 text-sm font-bold text-lime-100">{statusLabels[booking.status] ?? booking.status}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function fieldName(value: BookingRow['fields']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Lapangan HAM';
  return value?.name ?? 'Lapangan HAM';
}
