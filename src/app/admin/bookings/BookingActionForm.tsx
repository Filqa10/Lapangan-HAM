'use client';

import { useActionState } from 'react';
import { Check, X } from 'lucide-react';

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
  const Icon = tone === 'danger' ? X : Check;
  const buttonClass = tone === 'danger'
    ? 'border border-red-500/25 bg-transparent text-red-600 hover:bg-red-500/10 dark:text-red-400'
    : 'bg-[var(--text-primary)] text-[var(--bg-card)] hover:bg-[var(--accent-blue-hover)]';

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className={`${buttonClass} btn inline-flex items-center justify-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Icon size={13} />
        {isPending ? pendingLabel : label}
      </button>
      {state.error ? <p className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400" aria-live="polite">{state.error}</p> : null}
      {state.ok && state.message ? <p className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400" aria-live="polite">{state.message}</p> : null}
    </form>
  );
}
