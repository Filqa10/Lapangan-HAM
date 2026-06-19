import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type FieldRow = {
  id: number;
  name: string;
  price: number | string;
  status: string;
};

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
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/customer');

  const [{ data: fieldsData, error: fieldsError }, { data: bookingsData, error: bookingsError }, { data: paymentsData, error: paymentsError }] = await Promise.all([
    supabase.from('fields').select('id, name, price, status').order('name'),
    supabase.from('bookings').select('id, booking_date, status, price, fields(name)').order('booking_date', { ascending: false }).limit(80),
    supabase.from('payments').select('amount, status'),
  ]);

  const fields = fieldsError ? [] : ((fieldsData ?? []) as FieldRow[]);
  const bookings = bookingsError ? [] : ((bookingsData ?? []) as BookingRow[]);
  const payments = paymentsError ? [] : ((paymentsData ?? []) as PaymentRow[]);
  const activeFields = fields.filter((field) => field.status === 'active');
  const pendingCount = bookings.filter((booking) => booking.status === 'pending' || booking.status === 'payment_2_pending').length;
  const confirmedCount = bookings.filter((booking) => booking.status === 'confirmed' || booking.status === 'paid').length;
  const revenue = payments.filter((payment) => payment.status === 'approved').reduce((total, payment) => total + Number(payment.amount), 0);
  const monthlyCounts = buildMonthlyCounts(bookings);
  const maxMonthlyCount = Math.max(...monthlyCounts.map((month) => month.count), 1);

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-lime-100/15 bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.22),transparent_34%),#092018] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Admin control room</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Floodlight dashboard.</h1>
              <p className="mt-4 max-w-2xl text-lime-50/65">Pantau booking masuk, pendapatan terverifikasi, dan kesiapan lapangan dari satu layar kerja.</p>
            </div>
            <nav className="flex flex-col gap-3 sm:flex-row" aria-label="Admin navigation">
              <Link href="/admin/bookings" className="rounded-full bg-lime-300 px-5 py-3 text-center font-black text-[#082014] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0">
                Verifikasi pembayaran
              </Link>
              <Link href="/admin/fields" className="rounded-full border border-lime-100/25 px-5 py-3 text-center font-black text-lime-50 transition hover:bg-white/5">
                Kelola lapangan
              </Link>
            </nav>
          </div>
        </header>

        {(fieldsError || bookingsError || paymentsError) ? (
          <p className="mt-5 rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-red-100">Sebagian data dashboard belum bisa dimuat.</p>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan admin">
          <Stat label="Pendapatan approved" value={money.format(revenue)} note="Dihitung dari payment approved" />
          <Stat label="Booking menunggu" value={String(pendingCount)} note="DP dan pelunasan pending" />
          <Stat label="Booking confirmed" value={String(confirmedCount)} note="Siap dimainkan" />
          <Stat label="Lapangan aktif" value={`${activeFields.length}/${fields.length}`} note="Ketersediaan booking online" />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Booking per bulan</h2>
                <p className="mt-1 text-sm text-lime-50/60">Enam bulan terakhir dari data booking terbaru.</p>
              </div>
            </div>
            <div className="grid gap-3">
              {monthlyCounts.map((month) => (
                <div key={month.key} className="grid gap-2 sm:grid-cols-[120px_1fr_48px] sm:items-center">
                  <span className="font-mono text-sm text-lime-100/75">{month.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-[#06140f]" aria-hidden="true">
                    <div className="h-full rounded-full bg-lime-300" style={{ width: `${Math.max((month.count / maxMonthlyCount) * 100, month.count ? 8 : 0)}%` }} />
                  </div>
                  <span className="text-right font-black">{month.count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Status lapangan</h2>
                <p className="mt-1 text-sm text-lime-50/60">Ketersediaan untuk booking online.</p>
              </div>
              <Link href="/admin/fields" className="text-sm font-bold text-lime-200/80 hover:text-lime-100">Edit</Link>
            </div>
            <div className="grid gap-3">
              {fields.length === 0 ? (
                <p className="rounded-2xl bg-lime-50/5 p-4 text-lime-50/65">Belum ada data lapangan.</p>
              ) : fields.map((field) => (
                <article key={field.id} className="flex flex-col gap-2 rounded-2xl border border-lime-100/10 bg-[#06140f] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black">{field.name}</h3>
                    <p className="text-sm text-lime-50/55">{money.format(Number(field.price))}</p>
                  </div>
                  <span className={field.status === 'active' ? 'rounded-full bg-lime-300/15 px-3 py-1 text-sm font-bold text-lime-100' : 'rounded-full bg-amber-200/15 px-3 py-1 text-sm font-bold text-amber-100'}>
                    {field.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-[1.5rem] border border-lime-100/15 bg-white/[0.06] p-5">
      <p className="text-sm font-bold text-lime-100/75">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-lime-50/55">{note}</p>
    </article>
  );
}

function buildMonthlyCounts(bookings: BookingRow[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), count: 0 };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));

  bookings.forEach((booking) => {
    const key = booking.booking_date.slice(0, 7);
    const month = monthMap.get(key);
    if (month) month.count += 1;
  });

  return months;
}
