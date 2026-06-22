'use client';

import Link from 'next/link';
import { CircleCheckBig } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type PaymentSuccessModalProps = {
  isOpen: boolean;
  bookingId: number;
  message?: string;
  type: 'booking' | 'pelunasan';
};

export function PaymentSuccessModal({ isOpen, bookingId, message, type }: PaymentSuccessModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const nextStepCopy = type === 'booking'
    ? t('booking.successNextStep')
    : t('payment.successNextStep');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="animate-modal-spring w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl text-center">
        {/* Animated Green Checkmark SVG */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path
              className="animate-checkmark-draw"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="mt-4 text-xs font-semibold uppercase tracking-[0.02em] text-emerald-600 dark:text-emerald-400">
          {type === 'booking' ? t('booking.successTitle') : t('payment.successTitle')}
        </h2>

        <p className="mt-2 text-lg font-medium text-[var(--text-primary)]">
          {type === 'booking'
            ? t('booking.successBookingLabel', { id: bookingId })
            : t('payment.successBookingLabel', { id: bookingId })}
        </p>

        {message ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
        ) : null}

        <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
          {nextStepCopy}
        </p>

        <div className="mt-6">
          <Link
            href="/customer/history"
            className="btn inline-flex w-full items-center justify-center rounded-[4px] bg-[#e4f222] px-4 py-2.5 text-sm font-medium text-[#0c0a08] transition hover:opacity-90 active:scale-[0.97]"
          >
            {type === 'booking' ? t('booking.successHistoryCta') : t('payment.successHistoryCta')}
          </Link>
        </div>
      </div>
    </div>
  );
}
