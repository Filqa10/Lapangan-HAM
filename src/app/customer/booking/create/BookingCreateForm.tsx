'use client';

import { useActionState, useState } from 'react';
import Flatpickr from 'react-flatpickr';

import { createBookingAction } from '@/actions/bookings';
import { BOOKING_ACTION_INITIAL_STATE } from '@/actions/bookings-utils';
import { BOOKING_PRICE_SLOTS, calculateBookingPrice } from '@/config/pricing';

type FieldOption = {
  id: number;
  name: string;
  address: string | null;
};

const money = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function BookingCreateForm({ fields }: { fields: FieldOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createBookingAction,
    BOOKING_ACTION_INITIAL_STATE,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [fieldId, setFieldId] = useState(fields[0]?.id ? String(fields[0].id) : '');
  const [startHour, setStartHour] = useState(18);
  const [endHour, setEndHour] = useState(20);

  const bookingDate = selectedDate ? formatLocalDate(selectedDate) : '';
  const price = selectedDate && startHour < endHour
    ? calculateBookingPrice(selectedDate, startHour, endHour)
    : { total: 0, dp: 0 };

  const startOptions = BOOKING_PRICE_SLOTS.map((slot) => slot.startHour);
  const endOptions = Array.from(new Set(BOOKING_PRICE_SLOTS.map((slot) => slot.endHour))).filter(
    (hour) => hour > startHour,
  );

  return (
    <form action={formAction} className="grid gap-5 rounded-[2rem] border border-lime-100/15 bg-[#092018] p-5 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
      <input type="hidden" name="bookingDate" value={bookingDate} />

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-lime-100">Lapangan</span>
          <select
            name="fieldId"
            value={fieldId}
            onChange={(event) => setFieldId(event.target.value)}
            className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition focus:border-lime-300"
            required
          >
            {fields.length === 0 ? <option value="">Belum ada lapangan aktif</option> : null}
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}{field.address ? ` - ${field.address}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-lime-100">Tanggal main</span>
          <Flatpickr
            value={selectedDate ?? undefined}
            options={{ dateFormat: 'Y-m-d', minDate: 'today', disableMobile: false }}
            onChange={([date]) => setSelectedDate(date ?? null)}
            placeholder="Pilih tanggal"
            className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-300"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-lime-100">Jam mulai</span>
            <select
              name="startHour"
              value={startHour}
              onChange={(event) => {
                const nextStart = Number(event.target.value);
                setStartHour(nextStart);
                if (endHour <= nextStart) setEndHour(nextStart + 2);
              }}
              className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition focus:border-lime-300"
            >
              {startOptions.map((hour) => (
                <option key={hour} value={hour}>{formatHour(hour)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-lime-100">Jam selesai</span>
            <select
              name="endHour"
              value={endHour}
              onChange={(event) => setEndHour(Number(event.target.value))}
              className="w-full rounded-2xl border border-lime-100/20 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition focus:border-lime-300"
            >
              {endOptions.map((hour) => (
                <option key={hour} value={hour}>{formatHour(hour)}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block rounded-3xl border border-dashed border-lime-100/30 bg-lime-50/5 p-4">
          <span className="mb-2 block text-sm font-bold text-lime-100">Bukti transfer DP</span>
          <input
            type="file"
            name="paymentProof"
            accept="image/jpeg,image/png,image/webp"
            className="w-full cursor-pointer rounded-2xl bg-[#06140f] px-4 py-3 text-sm text-lime-50 file:mr-4 file:rounded-full file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-bold file:text-[#082014]"
            required
          />
          <p className="mt-2 text-sm text-lime-50/55">Gunakan rekening tujuan dari admin HAM, lalu unggah foto bukti transfer JPG, PNG, atau WebP maksimal 5MB.</p>
        </label>
      </div>

      <aside className="rounded-[1.5rem] border border-amber-200/40 bg-amber-100 p-5 text-[#211707]">
        <p className="font-mono text-xs font-black tracking-[0.24em] uppercase">Preview pembayaran</p>
        <div className="mt-6 space-y-4">
          <PriceLine label="Tanggal" value={bookingDate || 'Belum dipilih'} />
          <PriceLine label="Jam" value={`${formatHour(startHour)}-${formatHour(endHour)}`} />
          <PriceLine label="Total" value={price.total > 0 ? money.format(price.total) : '-'} />
          <div className="rounded-2xl bg-[#082014] p-4 text-lime-50">
            <p className="text-sm text-lime-100/70">DP wajib dikirim sekarang</p>
            <p className="mt-1 text-3xl font-black">{price.dp > 0 ? money.format(price.dp) : '-'}</p>
          </div>
        </div>
        {state.error ? <p className="mt-4 rounded-2xl bg-red-950 px-4 py-3 text-sm font-semibold text-red-100">{state.error}</p> : null}
        {state.ok && state.message ? <p className="mt-4 rounded-2xl bg-lime-950 px-4 py-3 text-sm font-semibold text-lime-100">{state.message}</p> : null}
        <button
          type="submit"
          disabled={isPending || fields.length === 0 || !bookingDate || price.total <= 0}
          className="mt-5 w-full rounded-full bg-[#082014] px-5 py-3 font-black text-lime-100 transition hover:-translate-y-0.5 hover:bg-[#123321] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isPending ? 'Mengirim booking...' : 'Kirim booking dan bukti DP'}
        </button>
      </aside>
    </form>
  );
}

function PriceLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#211707]/15 pb-3">
      <span className="text-sm font-semibold text-[#211707]/65">{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}.00`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
