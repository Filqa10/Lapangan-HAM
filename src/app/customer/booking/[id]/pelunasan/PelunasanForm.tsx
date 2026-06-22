'use client';

import { useActionState } from 'react';
import { CreditCard } from 'lucide-react';

import { submitPelunasanAction } from '@/actions/bookings';
import { BOOKING_ACTION_INITIAL_STATE } from '@/actions/bookings-utils';
import { useTranslation } from '@/lib/i18n';
import { BankInfoCard } from '@/components/BankInfoCard';
import { UploadZone } from '@/components/UploadZone';
import { PaymentSuccessModal } from '@/components/PaymentSuccessModal';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

type PelunasanFormProps = {
  bookingId: number;
  remainingAmount: number;
};

export function PelunasanForm({ bookingId, remainingAmount }: PelunasanFormProps) {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(
    submitPelunasanAction,
    BOOKING_ACTION_INITIAL_STATE,
  );
  const successBookingId = state.ok ? state.bookingId ?? null : null;
  const showSuccessPanel = successBookingId !== null;

  return (
    <form action={formAction} className="space-y-6 rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
      <input type="hidden" name="bookingId" value={bookingId} />

      <div className="flex items-center gap-2 text-[#999ba3]">
        <CreditCard size={15} />
        <span className="text-[12px] font-medium uppercase tracking-[0.02em]">{t('payment.title')}</span>
      </div>

      {/* Remaining balance highlight */}
      <div className="rounded-[4px] bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-[0.02em]">{t('payment.remainingBalance')}</p>
        <p className="mt-1.5 text-[32px] font-normal tracking-tight text-amber-600 dark:text-amber-400 leading-none">{money.format(remainingAmount)}</p>
      </div>

      {showSuccessPanel ? (
        <PaymentSuccessModal
          isOpen={showSuccessPanel}
          bookingId={successBookingId}
          message={state.message}
          type="pelunasan"
        />
      ) : (
        <>
          {/* Bank info */}
          <BankInfoCard />

          {/* Upload */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
              {t('booking.paymentProof')}
            </label>
            <UploadZone name="paymentProof" required />
          </div>

          {state.error && (
            <div className="rounded-[4px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 font-medium">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-[4px] bg-[#e4f222] px-4 py-3 text-[16px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? t('payment.submitting') : t('payment.submitProof')}
          </button>
        </>
      )}
    </form>
  );
}
