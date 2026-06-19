'use client';

import { useActionState } from 'react';

import { BOOKING_ACTION_INITIAL_STATE, type BookingActionState } from '@/actions/bookings-utils';

type BookingAction = (prevState: BookingActionState, formData: FormData) => Promise<BookingActionState>;

type BookingActionFormProps = {
  action: BookingAction;
  bookingId: number;
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  tone?: 'approve' | 'danger';
};

export function BookingActionForm({
  action,
  bookingId,
  label,
  pendingLabel,
  disabled = false,
  tone = 'approve',
}: BookingActionFormProps) {
  const [state, formAction, isPending] = useActionState(action, BOOKING_ACTION_INITIAL_STATE);
  const buttonClass = tone === 'danger'
    ? 'border border-red-200/35 bg-red-950/55 text-red-50 hover:bg-red-900/70'
    : 'bg-lime-300 text-[#082014] hover:-translate-y-0.5 hover:bg-lime-200';

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className={`${buttonClass} w-full rounded-full px-5 py-3 font-black transition active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isPending ? pendingLabel : label}
      </button>
      {state.error ? <p className="rounded-xl bg-red-950/65 px-3 py-2 text-xs font-semibold text-red-100" aria-live="polite">{state.error}</p> : null}
      {state.ok && state.message ? <p className="rounded-xl bg-lime-950/70 px-3 py-2 text-xs font-semibold text-lime-100" aria-live="polite">{state.message}</p> : null}
    </form>
  );
}
