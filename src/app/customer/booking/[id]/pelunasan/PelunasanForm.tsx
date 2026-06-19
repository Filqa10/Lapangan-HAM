'use client';

import { useActionState } from 'react';

import { submitPelunasanAction } from '@/actions/bookings';
import { BOOKING_ACTION_INITIAL_STATE } from '@/actions/bookings-utils';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function PelunasanForm({ bookingId, remainingAmount }: { bookingId: number; remainingAmount: number }) {
  const [state, formAction, isPending] = useActionState(
    submitPelunasanAction,
    BOOKING_ACTION_INITIAL_STATE,
  );

  return (
    <form action={formAction} className="rounded-[2rem] border border-amber-200/40 bg-amber-100 p-5 text-[#211707] shadow-2xl">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="font-mono text-xs font-black tracking-[0.25em] uppercase">Pelunasan</p>
      <h2 className="mt-3 text-3xl font-black">Sisa pembayaran {money.format(remainingAmount)}</h2>
      <p className="mt-2 text-[#211707]/65">Transfer nominal sisa pembayaran, lalu unggah bukti. Status akan berubah menjadi menunggu verifikasi pelunasan.</p>

      <label className="mt-5 block rounded-3xl border border-dashed border-[#211707]/30 bg-white/45 p-4">
        <span className="mb-2 block text-sm font-black">Bukti transfer pelunasan</span>
        <input
          type="file"
          name="paymentProof"
          accept="image/jpeg,image/png,image/webp"
          className="w-full cursor-pointer rounded-2xl bg-[#082014] px-4 py-3 text-sm text-lime-50 file:mr-4 file:rounded-full file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-bold file:text-[#082014]"
          required
        />
        <p className="mt-2 text-sm text-[#211707]/60">Unggah JPG, PNG, atau WebP maksimal 5MB.</p>
      </label>

      {state.error ? <p className="mt-4 rounded-2xl bg-red-950 px-4 py-3 text-sm font-semibold text-red-100">{state.error}</p> : null}
      {state.ok && state.message ? <p className="mt-4 rounded-2xl bg-[#082014] px-4 py-3 text-sm font-semibold text-lime-100">{state.message}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-full bg-[#082014] px-5 py-3 font-black text-lime-100 transition hover:-translate-y-0.5 hover:bg-[#123321] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isPending ? 'Mengunggah pelunasan...' : 'Kirim bukti pelunasan'}
      </button>
    </form>
  );
}
