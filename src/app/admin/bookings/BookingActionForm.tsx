'use client';

import { useActionState, useState, useRef } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const Icon = tone === 'danger' ? X : Check;
  const buttonClass = tone === 'danger'
    ? 'border border-red-500/25 bg-transparent text-red-600 hover:bg-red-500/10 dark:text-red-400'
    : 'bg-[var(--text-primary)] text-[var(--bg-card)] hover:bg-[var(--accent-blue-hover)]';

  // Customize titles and messages based on action context
  let modalTitle = 'Konfirmasi Tindakan';
  let modalDescription = `Apakah Anda yakin ingin melakukan tindakan ini untuk booking #${bookingId}?`;
  
  if (tone === 'danger') {
    modalTitle = 'Batalkan Booking';
    modalDescription = `Apakah Anda yakin ingin membatalkan booking #${bookingId}? Jadwal lapangan akan dibebaskan kembali untuk booking online.`;
  } else if (label.toLowerCase().includes('lunas')) {
    modalTitle = 'Catat Lunas Offline';
    modalDescription = `Apakah Anda yakin ingin mencatat pelunasan offline untuk booking #${bookingId}? Status booking akan diubah menjadi Lunas.`;
  } else if (label.toLowerCase().includes('dp')) {
    modalTitle = 'Setujui Pembayaran DP';
    modalDescription = `Apakah Anda yakin ingin menyetujui pembayaran DP untuk booking #${bookingId}? Status booking akan berubah menjadi DP Disetujui.`;
  } else if (label.toLowerCase().includes('confirm') || label.toLowerCase().includes('konfirmasi')) {
    modalTitle = 'Konfirmasi Pelunasan';
    modalDescription = `Apakah Anda yakin ingin mengonfirmasi pelunasan booking #${bookingId}?`;
  }

  return (
    <>
      <form ref={formRef} action={formAction} className="inline-flex flex-col gap-1">
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="button"
          disabled={disabled || isPending}
          onClick={() => setConfirmOpen(true)}
          className={`${buttonClass} btn inline-flex items-center justify-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer`}
        >
          <Icon size={13} />
          {isPending ? pendingLabel : label}
        </button>
        {state.error ? <p className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400" aria-live="polite">{state.error}</p> : null}
        {state.ok && state.message ? <p className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400" aria-live="polite">{state.message}</p> : null}
      </form>

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-modal-spring w-full max-w-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                tone === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {modalTitle}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {modalDescription}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-action-hover)] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  formRef.current?.requestSubmit();
                  setConfirmOpen(false);
                }}
                className={`rounded-[4px] px-4 py-2 text-xs font-medium text-white transition cursor-pointer ${
                  tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
