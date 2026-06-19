import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { BookingCreateForm } from './BookingCreateForm';

type FieldRow = {
  id: number;
  name: string;
  address: string | null;
};

export default async function CreateBookingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('fields')
    .select('id, name, address')
    .eq('status', 'active')
    .order('name');

  const fields = error ? [] : ((data ?? []) as FieldRow[]);

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link href="/customer" className="text-sm font-bold text-lime-200/75 hover:text-lime-100">
          Kembali ke dashboard
        </Link>
        <div className="my-8 max-w-3xl">
          <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Booking baru</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Pilih slot, lihat DP, unggah bukti.</h1>
          <p className="mt-4 text-lime-50/65">Harga dihitung langsung dari aturan slot HAM. Setelah bukti DP masuk, admin akan memverifikasi sebelum status berubah.</p>
        </div>
        {error ? (
          <p className="mb-5 rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-red-100">
            Data lapangan belum bisa dimuat. Form tetap ditampilkan dalam mode kosong.
          </p>
        ) : null}
        <BookingCreateForm fields={fields} />
      </div>
    </main>
  );
}
