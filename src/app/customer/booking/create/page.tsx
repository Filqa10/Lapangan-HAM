import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BookingCreateForm } from './BookingCreateForm';

type FieldRow = {
  id: number;
  name: string;
  address: string | null;
};

export default async function BookingCreatePage() {
  const supabase = await createClient();
  const { data: fields } = await supabase
    .from('fields')
    .select('id, name, address')
    .eq('status', 'active')
    .order('name');

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <section
        className="relative overflow-hidden rounded-[12px] p-8 sm:p-10 text-white"
        style={{
          background: 'linear-gradient(165deg, #0c0a08 0%, #0c0a08 30%, #1d2740 60%, #3a548c 80%, #5683d2 92%, #f4f2f0 100%)',
        }}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
          <Link href="/customer" className="transition hover:text-white">Dashboard</Link>
          <span>/</span>
          <span className="text-white font-medium">New Booking</span>
        </div>
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.02em] text-[#999ba3]">
            <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#e4f222]" />
            BOOKING FORM
          </span>
          <h1 className="mt-3 text-[32px] sm:text-[40px] font-normal leading-[1.1] tracking-tight uppercase text-white">
            Book Your Field
          </h1>
          <p className="mt-2.5 max-w-lg text-[16px] leading-relaxed text-white/70">
            Fill in booking details, make the DP transfer, and upload payment proof.
          </p>
        </div>
      </section>

      <BookingCreateForm fields={(fields ?? []) as FieldRow[]} />
    </div>
  );
}
