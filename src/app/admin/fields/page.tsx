import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createFieldAction, deleteFieldAction, updateFieldAction } from '@/actions/fields';
import { createClient } from '@/lib/supabase/server';

type FieldRow = {
  id: number;
  name: string;
  price: number | string;
  address: string | null;
  status: 'active' | 'inactive';
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default async function AdminFieldsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/customer');

  const { data, error } = await supabase.from('fields').select('id, name, price, address, status').order('name');
  const fields = error ? [] : ((data ?? []) as FieldRow[]);

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-lime-200/75 hover:text-lime-100">Kembali ke dashboard</Link>
            <p className="mt-5 font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Field operations</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Kelola lapangan.</h1>
            <p className="mt-3 max-w-2xl text-lime-50/65">Tambah, ubah harga, dan nonaktifkan lapangan tanpa menyentuh data booking pelanggan.</p>
          </div>
          <Link href="/admin/bookings" className="rounded-full border border-lime-100/25 px-5 py-3 text-center font-black text-lime-50 transition hover:bg-white/5">
            Verifikasi booking
          </Link>
        </header>

        {error ? (
          <p className="mb-5 rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-red-100">Data lapangan belum bisa dimuat.</p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-5">
            <form action={createFieldFromForm} className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5 shadow-2xl">
              <h2 className="text-2xl font-black">Tambah lapangan</h2>
              <FieldInputs submitLabel="Tambah lapangan" />
            </form>

            <section className="rounded-[1.5rem] border border-amber-200/35 bg-amber-100 p-5 text-[#211707]">
              <h2 className="text-xl font-black">Gambar lapangan</h2>
              <p className="mt-2 text-sm font-semibold text-[#211707]/70">
                Bucket `field-images` sudah disiapkan untuk upload admin, tetapi tabel `fields` saat ini hanya punya `name`, `price`, `address`, dan `status`. UI ini belum menyimpan gambar agar tidak membuat object storage yatim tanpa kolom referensi.
              </p>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">Daftar lapangan</h2>
                <p className="mt-1 text-sm text-lime-50/60">{fields.length} lapangan terdaftar.</p>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-lime-100/20 bg-[#06140f] p-8 text-center">
                <h3 className="text-xl font-black">Belum ada lapangan.</h3>
                <p className="mt-2 text-lime-50/60">Tambah lapangan pertama agar customer bisa memilih slot.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {fields.map((field) => (
                  <article key={field.id} className="rounded-[1.5rem] border border-lime-100/10 bg-[#06140f] p-4">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black">{field.name}</h3>
                        <p className="mt-1 text-sm text-lime-50/55">{field.address || 'Alamat belum diisi'} - {money.format(Number(field.price))}</p>
                      </div>
                      <span className={field.status === 'active' ? 'rounded-full bg-lime-300/15 px-3 py-1 text-sm font-bold text-lime-100' : 'rounded-full bg-amber-200/15 px-3 py-1 text-sm font-bold text-amber-100'}>
                        {field.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <form action={updateFieldFromForm} className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_1fr_150px_auto] lg:items-end">
                      <input type="hidden" name="fieldId" value={field.id} />
                      <FieldInputs field={field} submitLabel="Simpan" compact />
                    </form>

                    <form action={deleteFieldFromForm} className="mt-3">
                      <input type="hidden" name="fieldId" value={field.id} />
                      <button type="submit" className="rounded-full border border-amber-200/40 px-4 py-2 text-sm font-black text-amber-100 transition hover:bg-amber-950/40">
                        Nonaktifkan lapangan
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

async function createFieldFromForm(formData: FormData) {
  'use server';
  await createFieldAction(formData);
}

async function updateFieldFromForm(formData: FormData) {
  'use server';
  await updateFieldAction(formData);
}

async function deleteFieldFromForm(formData: FormData) {
  'use server';
  await deleteFieldAction(formData);
}

function FieldInputs({ field, submitLabel, compact = false }: { field?: FieldRow; submitLabel: string; compact?: boolean }) {
  const labelClass = compact ? 'block' : 'mt-5 block';

  return (
    <>
      <label className={labelClass}>
        <span className="mb-2 block text-sm font-bold text-lime-100">Nama</span>
        <input name="name" defaultValue={field?.name ?? ''} required className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-300" placeholder="Stadion Barat" />
      </label>
      <label className={labelClass}>
        <span className="mb-2 block text-sm font-bold text-lime-100">Harga</span>
        <input name="price" type="number" min="0" step="1000" defaultValue={field ? Number(field.price) : ''} required className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-300" placeholder="250000" />
      </label>
      <label className={labelClass}>
        <span className="mb-2 block text-sm font-bold text-lime-100">Alamat</span>
        <input name="address" defaultValue={field?.address ?? ''} className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-300" placeholder="Jl. HAM" />
      </label>
      <label className={labelClass}>
        <span className="mb-2 block text-sm font-bold text-lime-100">Status</span>
        <select name="status" defaultValue={field?.status ?? 'active'} className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition focus:border-lime-300">
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </label>
      <button type="submit" className={compact ? 'rounded-full bg-lime-300 px-5 py-3 font-black text-[#082014] transition hover:bg-lime-200' : 'mt-5 w-full rounded-full bg-lime-300 px-5 py-3 font-black text-[#082014] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0'}>
        {submitLabel}
      </button>
    </>
  );
}
