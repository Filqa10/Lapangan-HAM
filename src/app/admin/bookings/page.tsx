import Link from 'next/link';
import { redirect } from 'next/navigation';

import { approveDPFormAction, approveFinalPaymentFormAction, cancelBookingFormAction } from '@/actions/bookings';
import { createClient } from '@/lib/supabase/server';
import { BookingActionForm } from './BookingActionForm';

type PaymentRow = {
  id: number;
  amount: number | string;
  payment_type: 'dp' | 'final';
  receipt_url: string;
  receipt_signed_url?: string;
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
  created_at: string;
  fields: { name: string } | { name: string }[] | null;
  profiles: { name: string; phone: string | null } | { name: string; phone: string | null }[] | null;
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

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/customer');

  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, price, dp_amount, status, created_at, fields(name), profiles(name, phone), payments(id, amount, payment_type, receipt_url, status, created_at)')
    .order('created_at', { ascending: false })
    .limit(60);

  const bookings = error ? [] : await attachPaymentProofLinks(supabase, (data ?? []) as BookingRow[]);
  const verificationQueue = bookings.filter((booking) => booking.status === 'pending' || booking.status === 'payment_2_pending');
  const completed = bookings.filter((booking) => booking.status !== 'pending' && booking.status !== 'payment_2_pending');

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-lime-200/75 hover:text-lime-100">Kembali ke dashboard</Link>
            <p className="mt-5 font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Payment verification</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Verifikasi booking.</h1>
            <p className="mt-3 max-w-2xl text-lime-50/65">Cek bukti transfer di bucket `payment-proofs`, lalu setujui DP atau pelunasan dengan status guard server-side.</p>
          </div>
          <Link href="/admin/fields" className="rounded-full border border-lime-100/25 px-5 py-3 text-center font-black text-lime-50 transition hover:bg-white/5">
            Kelola lapangan
          </Link>
        </header>

        {error ? (
          <p className="mb-5 rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-red-100">Data booking belum bisa dimuat.</p>
        ) : null}

        <section className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5 shadow-2xl">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Antrian verifikasi</h2>
              <p className="mt-1 text-sm text-lime-50/60">{verificationQueue.length} booking membutuhkan keputusan admin.</p>
            </div>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-lime-100/20 bg-[#06140f] p-8 text-center">
              <h3 className="text-xl font-black">Tidak ada pembayaran pending.</h3>
              <p className="mt-2 text-lime-50/60">Booking baru dan pelunasan customer akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {verificationQueue.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5">
          <h2 className="text-2xl font-black">Booking terbaru lainnya</h2>
          <div className="mt-4 grid gap-3">
            {completed.slice(0, 12).map((booking) => (
              <article key={booking.id} className="flex flex-col gap-3 rounded-2xl border border-lime-100/10 bg-[#06140f] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-black">#{booking.id} - {fieldName(booking.fields)}</p>
                  <p className="text-sm text-lime-50/55">{booking.booking_date} {formatTime(booking.start_time)}-{formatTime(booking.end_time)} - {customerName(booking.profiles)}</p>
                  <PaymentProofLinks payments={booking.payments} compact />
                </div>
                <div className="grid gap-2 sm:min-w-52">
                  <span className="rounded-full bg-lime-300/15 px-3 py-1 text-center text-sm font-bold text-lime-100">{statusLabels[booking.status] ?? booking.status}</span>
                  {canCancelBooking(booking.status) ? (
                    <BookingActionForm
                      action={cancelBookingFormAction}
                      bookingId={booking.id}
                      label="Batalkan booking"
                      pendingLabel="Membatalkan..."
                      tone="danger"
                    />
                  ) : null}
                </div>
              </article>
            ))}
            {completed.length === 0 ? <p className="rounded-2xl bg-lime-50/5 p-4 text-lime-50/65">Belum ada booking lain.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const dpPayment = latestPayment(booking.payments, 'dp');
  const finalPayment = latestPayment(booking.payments, 'final');
  const currentProof = booking.status === 'payment_2_pending' ? finalPayment : dpPayment;
  const action = booking.status === 'payment_2_pending' ? approveFinalPaymentFormAction : approveDPFormAction;
  const actionLabel = booking.status === 'payment_2_pending' ? 'Setujui pelunasan' : 'Setujui DP';
  const pendingLabel = booking.status === 'payment_2_pending' ? 'Menyetujui pelunasan...' : 'Menyetujui DP...';

  return (
    <article className="rounded-[1.5rem] border border-lime-100/10 bg-[#06140f] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-lime-200 uppercase">Booking #{booking.id}</p>
          <h3 className="mt-2 text-2xl font-black">{fieldName(booking.fields)}</h3>
          <p className="mt-1 text-lime-50/60">{booking.booking_date} - {formatTime(booking.start_time)}-{formatTime(booking.end_time)}</p>
          <p className="mt-1 text-sm text-lime-50/55">Customer: {customerName(booking.profiles)}{customerPhone(booking.profiles) ? ` - ${customerPhone(booking.profiles)}` : ''}</p>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-[#211707]">{statusLabels[booking.status] ?? booking.status}</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Summary label="Total" value={money.format(Number(booking.price))} />
        <Summary label="DP" value={money.format(Number(booking.dp_amount))} />
        <Summary label="Sisa" value={money.format(Math.max(Number(booking.price) - Number(booking.dp_amount), 0))} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <section className="rounded-2xl border border-lime-100/10 bg-white/[0.04] p-4">
          <h4 className="font-black text-lime-100">Bukti transfer</h4>
          {currentProof ? (
            <div className="mt-3 space-y-2 text-sm">
              <p><span className="text-lime-50/55">Tipe:</span> {currentProof.payment_type === 'dp' ? 'DP' : 'Pelunasan'}</p>
              <p><span className="text-lime-50/55">Nominal:</span> {money.format(Number(currentProof.amount))}</p>
              <p><span className="text-lime-50/55">Status payment:</span> {currentProof.status}</p>
              <p className="break-all"><span className="text-lime-50/55">Object path:</span> {currentProof.receipt_url}</p>
              {currentProof.receipt_signed_url ? (
                <a href={currentProof.receipt_signed_url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-lime-300 px-4 py-2 text-sm font-black text-[#082014] transition hover:bg-lime-200">
                  Lihat bukti
                </a>
              ) : (
                <p className="rounded-xl bg-red-950/45 p-3 text-red-100">Signed URL bukti belum bisa dibuat. Cek policy storage atau object path.</p>
              )}
            </div>
          ) : (
            <p className="mt-2 rounded-xl bg-red-950/45 p-3 text-sm text-red-100">Bukti pembayaran pending belum ditemukan.</p>
          )}
          <PaymentProofLinks payments={booking.payments} />
        </section>

        <div className="grid min-w-52 gap-3">
          <BookingActionForm
            action={action}
            bookingId={booking.id}
            label={actionLabel}
            pendingLabel={pendingLabel}
            disabled={!currentProof}
          />
          {canCancelBooking(booking.status) ? (
            <BookingActionForm
              action={cancelBookingFormAction}
              bookingId={booking.id}
              label="Batalkan booking"
              pendingLabel="Membatalkan..."
              tone="danger"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

async function attachPaymentProofLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookings: BookingRow[],
) {
  const proofPaths = Array.from(new Set(
    bookings.flatMap((booking) => (booking.payments ?? [])
      .map((payment) => payment.receipt_url)
      .filter(Boolean)),
  ));

  const signedUrlEntries = await Promise.all(proofPaths.map(async (path) => {
    const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 10);
    return [path, data?.signedUrl] as const;
  }));
  const signedUrls = new Map(signedUrlEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));

  return bookings.map((booking) => ({
    ...booking,
    payments: booking.payments?.map((payment) => ({
      ...payment,
      receipt_signed_url: signedUrls.get(payment.receipt_url),
    })) ?? null,
  }));
}

function PaymentProofLinks({ payments, compact = false }: { payments: PaymentRow[] | null; compact?: boolean }) {
  const proofPayments = [...(payments ?? [])]
    .filter((payment) => payment.receipt_url)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  if (proofPayments.length === 0) return null;

  return (
    <div className={compact ? 'mt-2 flex flex-wrap gap-2' : 'mt-4 flex flex-wrap gap-2 border-t border-lime-100/10 pt-3'}>
      {proofPayments.map((payment) => payment.receipt_signed_url ? (
        <a
          key={payment.id}
          href={payment.receipt_signed_url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-lime-100/25 px-3 py-1 text-xs font-black text-lime-100 transition hover:bg-white/10"
        >
          Lihat bukti {payment.payment_type === 'dp' ? 'DP' : 'pelunasan'}
        </a>
      ) : (
        <span key={payment.id} className="rounded-full border border-red-200/25 px-3 py-1 text-xs font-bold text-red-100">
          Bukti {payment.payment_type === 'dp' ? 'DP' : 'pelunasan'} belum bisa dibuka
        </span>
      ))}
    </div>
  );
}

function canCancelBooking(status: string) {
  return status !== 'cancelled' && status !== 'confirmed';
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-lime-100/10 bg-white/[0.05] p-4">
      <p className="text-sm text-lime-50/55">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function latestPayment(payments: PaymentRow[] | null, type: PaymentRow['payment_type']) {
  return [...(payments ?? [])]
    .filter((payment) => payment.payment_type === type)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
}

function fieldName(value: BookingRow['fields']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Lapangan HAM';
  return value?.name ?? 'Lapangan HAM';
}

function customerName(value: BookingRow['profiles']) {
  if (Array.isArray(value)) return value[0]?.name ?? 'Customer';
  return value?.name ?? 'Customer';
}

function customerPhone(value: BookingRow['profiles']) {
  if (Array.isArray(value)) return value[0]?.phone ?? '';
  return value?.phone ?? '';
}

function formatTime(value: string) {
  return value.slice(0, 5);
}
