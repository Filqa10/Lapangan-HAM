'use client';

import { useActionState, useState, useEffect } from 'react';
import Flatpickr from 'react-flatpickr';
import { Calendar, Clock, CreditCard, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

import { createBookingAction } from '@/actions/bookings';
import { BOOKING_ACTION_INITIAL_STATE } from '@/actions/bookings-utils';
import { BOOKING_PRICE_SLOTS, calculateBookingPrice } from '@/config/pricing';
import { useTranslation } from '@/lib/i18n';
import { BankInfoCard } from '@/components/BankInfoCard';
import { UploadZone } from '@/components/UploadZone';
import { FieldInfoCard } from '@/components/FieldInfoCard';
import { PaymentSuccessModal } from '@/components/PaymentSuccessModal';

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

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}.00`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BookingCreateForm({
  fields,
  initialDate = '',
  initialStart = 18,
  initialEnd = 20,
}: {
  fields: FieldOption[];
  initialDate?: string;
  initialStart?: number;
  initialEnd?: number;
}) {
  const { t } = useTranslation();
  const [state, formAction, isPending] = useActionState(
    createBookingAction,
    BOOKING_ACTION_INITIAL_STATE,
  );

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (initialDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(initialDate);
      if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      }
      const parsed = new Date(initialDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  });
  const [fieldId] = useState(fields[0]?.id ? String(fields[0].id) : '');
  const [startHour, setStartHour] = useState(initialStart);
  const [endHour, setEndHour] = useState(initialEnd);
  const [paymentOption, setPaymentOption] = useState<'dp' | 'full'>('dp');

  const [bookedSlots, setBookedSlots] = useState<{ start_time: string; end_time: string }[]>([]);

  const handleDateChange = async (date: Date | null) => {
    setSelectedDate(date);
    if (!date) {
      setBookedSlots([]);
      return;
    }

    const supabase = createClient();
    const dateStr = formatLocalDate(date);
    const { data, error } = await supabase
      .rpc('get_booked_slots', { p_start_date: dateStr, p_end_date: dateStr });

    const slots = !error && data ? data : [];
    setBookedSlots(slots);

    const day = date.getDay();
    const availableSlots = BOOKING_PRICE_SLOTS.filter((slot) => {
      const isOpHourOpen = day >= 1 && day <= 4
        ? slot.weekdayPrice !== null
        : (day === 5 ? slot.fridayPrice !== null : true);

      if (!isOpHourOpen) return false;

      const isBooked = slots.some((b: { start_time: string; end_time: string }) => {
        const bStart = Number(b.start_time.split(':')[0]);
        const bEnd = Number(b.end_time.split(':')[0]);
        return Math.max(slot.startHour, bStart) < Math.min(slot.endHour, bEnd);
      });

      return !isBooked;
    });

    if (availableSlots.length === 0) return;

    const isStartAvailable = availableSlots.some((slot) => slot.startHour === startHour);
    if (!isStartAvailable) {
      const firstAvailable = availableSlots[0];
      setStartHour(firstAvailable.startHour);
      setEndHour(firstAvailable.endHour);
    } else {
      const isRangeAvailable = BOOKING_PRICE_SLOTS.filter(
        (slot) => slot.startHour >= startHour && slot.endHour <= endHour
      ).every((slot) => {
        const isOpHourOpen = day >= 1 && day <= 4
          ? slot.weekdayPrice !== null
          : (day === 5 ? slot.fridayPrice !== null : true);

        if (!isOpHourOpen) return false;

        const isBooked = slots.some((b: { start_time: string; end_time: string }) => {
          const bStart = Number(b.start_time.split(':')[0]);
          const bEnd = Number(b.end_time.split(':')[0]);
          return Math.max(slot.startHour, bStart) < Math.min(slot.endHour, bEnd);
        });

        return !isBooked;
      });

      if (!isRangeAvailable) {
        const currentSlot = availableSlots.find((slot) => slot.startHour === startHour);
        if (currentSlot) {
          setEndHour(currentSlot.endHour);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const supabase = createClient();
      const dateStr = formatLocalDate(selectedDate);
      supabase
        .rpc('get_booked_slots', { p_start_date: dateStr, p_end_date: dateStr })
        .then(({ data, error }) => {
          if (!error && data) {
            setBookedSlots(data);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedField = fields.find((f) => String(f.id) === fieldId);
  const bookingDate = selectedDate ? formatLocalDate(selectedDate) : '';
  const price = selectedDate && startHour < endHour
    ? calculateBookingPrice(selectedDate, startHour, endHour)
    : { total: 0, dp: 0 };

  const startOptions = BOOKING_PRICE_SLOTS.filter((slot) => {
    if (!selectedDate) return true;
    const day = selectedDate.getDay();
    const isOpHourOpen = day >= 1 && day <= 4
      ? slot.weekdayPrice !== null
      : (day === 5 ? slot.fridayPrice !== null : true);

    if (!isOpHourOpen) return false;

    const isBooked = bookedSlots.some((b) => {
      const bStart = Number(b.start_time.split(':')[0]);
      const bEnd = Number(b.end_time.split(':')[0]);
      return Math.max(slot.startHour, bStart) < Math.min(slot.endHour, bEnd);
    });

    return !isBooked;
  }).map((slot) => slot.startHour);

  const endOptions = Array.from(new Set(BOOKING_PRICE_SLOTS.map((slot) => slot.endHour)))
    .filter((hour) => hour > startHour)
    .filter((hour) => {
      if (!selectedDate) return true;
      const day = selectedDate.getDay();
      
      const intermediateSlots = BOOKING_PRICE_SLOTS.filter(
        (slot) => slot.startHour >= startHour && slot.endHour <= hour
      );
      
      const allOpen = intermediateSlots.every((slot) => {
        if (day >= 1 && day <= 4) return slot.weekdayPrice !== null;
        if (day === 5) return slot.fridayPrice !== null;
        return true;
      });

      if (!allOpen) return false;

      const isBookedRange = bookedSlots.some((b) => {
        const bStart = Number(b.start_time.split(':')[0]);
        const bEnd = Number(b.end_time.split(':')[0]);
        return Math.max(startHour, bStart) < Math.min(hour, bEnd);
      });

      return !isBookedRange;
    });

  const canProceedToStep2 = fieldId && bookingDate && price.total > 0;
  const successBookingId = state.ok ? state.bookingId ?? null : null;
  const showSuccessPanel = successBookingId !== null;

  return (
    <div className="space-y-6">
      {/* Step indicator - desaturated modular tabs */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-[4px] border text-xs font-medium ${
          step > 1
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
            : 'border-[#d2cecb] dark:border-slate-800 bg-[#e4f222] text-[#0c0a08]'
        }`}>
          {step > 1 ? '✓' : '1'}
        </div>
        <span className={`text-[14px] font-medium uppercase tracking-[0.02em] ${step === 1 ? 'text-[#0c0a08] dark:text-white' : 'text-[#999ba3]'}`}>
          {t('booking.step1Title')}
        </span>
        <ChevronRight size={14} className="text-[#999ba3]" />
        <div className={`flex h-8 w-8 items-center justify-center rounded-[4px] border text-xs font-medium ${
          step === 2
            ? 'border-[#d2cecb] dark:border-slate-800 bg-[#e4f222] text-[#0c0a08]'
            : 'border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900 text-[#999ba3]'
        }`}>
          2
        </div>
        <span className={`text-[14px] font-medium uppercase tracking-[0.02em] ${step === 2 ? 'text-[#0c0a08] dark:text-white' : 'text-[#999ba3]'}`}>
          {t('booking.step2Title')}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        {/* Main form area */}
        <form action={formAction} className="space-y-6 order-2 lg:order-1">
          <input type="hidden" name="bookingDate" value={bookingDate} />
          <input type="hidden" name="fieldId" value={fieldId} />
          <input type="hidden" name="startHour" value={startHour} />
          <input type="hidden" name="endHour" value={endHour} />

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Mobile-only pricing table / field info preview */}
              <div className="lg:hidden">
                <FieldInfoCard
                  fieldName={selectedField?.name ?? 'Lapangan HAM'}
                  fieldAddress={selectedField?.address ?? null}
                />
              </div>

              <div className="space-y-6 rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
            <div className="flex items-center gap-2 text-[#999ba3]">
              <Calendar size={15} />
              <span className="text-[12px] font-medium uppercase tracking-[0.02em]">{t('booking.step')} 1: {t('booking.step1Title')}</span>
            </div>
            <p className="text-[13px] text-[#999ba3] leading-relaxed">{t('booking.step1Subtitle')}</p>

            {/* Date picker */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300 flex items-center justify-between">
                <span>{t('booking.bookingDate')}</span>
                <span className="text-[11px] text-[#999ba3] font-normal lowercase">({t('booking.minToday')})</span>
              </label>
              <Flatpickr
                value={selectedDate ?? ''}
                options={{ dateFormat: 'Y-m-d', minDate: 'today', disableMobile: false }}
                onChange={([date]) => handleDateChange(date ?? null)}
                placeholder={t('booking.pickDate')}
                className="w-full rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] text-[#0c0a08] dark:text-white placeholder:text-[#999ba3] transition focus:border-slate-600 focus:ring-0"
              />
            </div>

            {/* Time selectors */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="start-time" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
                  <Clock size={13} />
                  {t('booking.startTime')}
                </label>
                <select
                  id="start-time"
                  value={startHour}
                  onChange={(e) => {
                    const nextStart = Number(e.target.value);
                    setStartHour(nextStart);
                    setEndHour(nextStart + 2);
                  }}
                  className="w-full rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] text-[#0c0a08] dark:text-white transition focus:border-slate-600 focus:ring-0"
                >
                  {startOptions.map((hour) => (
                    <option key={hour} value={hour}>{formatHour(hour)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="end-time" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
                  <Clock size={13} />
                  {t('booking.endTime')}
                </label>
                <select
                  id="end-time"
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[15px] text-[#0c0a08] dark:text-white transition focus:border-slate-600 focus:ring-0"
                >
                  {endOptions.map((hour) => (
                    <option key={hour} value={hour}>{formatHour(hour)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price preview - Limestone container with Bone border */}
            {price.total > 0 && (
              <div className="space-y-2 rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40 p-4">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#999ba3]">{t('booking.totalPrice')}</span>
                  <span className="font-medium text-[#0c0a08] dark:text-white">{money.format(price.total)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#999ba3]">{t('booking.dpAmount')}</span>
                  <span className="font-semibold text-emerald-500">{money.format(price.dp)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#999ba3]">{t('booking.remaining')}</span>
                  <span className="font-medium text-[#0c0a08] dark:text-white">{money.format(price.total - price.dp)}</span>
                </div>
              </div>
            )}

            {/* Next button */}
            <button
              type="button"
              disabled={!canProceedToStep2}
              onClick={() => setStep(2)}
              className="w-full rounded-[4px] bg-[#e4f222] px-4 py-3 text-[16px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('booking.step2Title')} →
            </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6 rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-[14px] font-medium text-[#0c0a08] dark:text-white hover:text-[#5683d2] transition duration-150 active:scale-[0.97]"
            >
              <ChevronLeft size={14} />
              {t('common.back')}
            </button>

            <div className="flex items-center gap-2 text-[#999ba3]">
              <CreditCard size={15} />
              <span className="text-[12px] font-medium uppercase tracking-[0.02em]">{t('booking.step')} 2: {t('booking.step2Title')}</span>
            </div>
            <p className="text-[13px] text-[#999ba3] leading-relaxed">{t('booking.step2Subtitle')}</p>

            {showSuccessPanel ? (
              <PaymentSuccessModal
                isOpen={showSuccessPanel}
                bookingId={successBookingId}
                message={state.message}
                type="booking"
              />
            ) : (
              <>
                {/* Bank info */}
                <BankInfoCard />

                {/* Pilih Metode Pembayaran */}
                <div className="space-y-3">
                  <label className="block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
                    Pilih Opsi Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('dp')}
                      className={`rounded-[4px] border p-3.5 text-left transition duration-150 cursor-pointer ${
                        paymentOption === 'dp'
                          ? 'border-[#e4f222] bg-[#e4f222]/10 text-[#0c0a08] dark:text-white'
                          : 'border-[#d2cecb] dark:border-slate-800 bg-transparent text-[#999ba3] hover:border-[#999ba3]/40'
                      }`}
                    >
                      <p className="text-sm font-semibold">Bayar DP 30%</p>
                      <p className="mt-1 text-xs">{money.format(price.dp)}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('full')}
                      className={`rounded-[4px] border p-3.5 text-left transition duration-150 cursor-pointer ${
                        paymentOption === 'full'
                          ? 'border-[#e4f222] bg-[#e4f222]/10 text-[#0c0a08] dark:text-white'
                          : 'border-[#d2cecb] dark:border-slate-800 bg-transparent text-[#999ba3] hover:border-[#999ba3]/40'
                      }`}
                    >
                      <p className="text-sm font-semibold">Bayar Lunas</p>
                      <p className="mt-1 text-xs">{money.format(price.total)}</p>
                    </button>
                  </div>
                  <input type="hidden" name="paymentOption" value={paymentOption} />
                </div>

                {/* Upload guide - Limestone desaturated card */}
                <div className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/60 p-4">
                  <div className="flex items-start gap-2.5">
                    <Info size={15} className="mt-0.5 text-[#999ba3]" />
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-[0.02em] text-[#0c0a08] dark:text-white">{t('booking.uploadGuideTitle')}</p>
                      <p className="mt-1 text-[12px] text-[#999ba3] leading-relaxed">{t('booking.uploadGuide')}</p>
                    </div>
                  </div>
                </div>

                {/* Upload zone */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium uppercase tracking-[0.02em] text-[#4d505d] dark:text-slate-300">
                    {paymentOption === 'full' ? 'Bukti Pembayaran Lunas' : 'Bukti Pembayaran DP'}
                  </label>
                  <UploadZone name="paymentProof" required />
                </div>

                {/* Summary + Submit */}
                <div className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900/40 p-4 space-y-2">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#999ba3]">{t('booking.totalPrice')}</span>
                    <span className="font-medium text-[#0c0a08] dark:text-white">{money.format(price.total)}</span>
                  </div>
                  <div className="flex justify-between text-[14px] items-center">
                    <span className="text-[#999ba3]">
                      {paymentOption === 'full' ? 'Jumlah Pembayaran' : t('booking.dpAmount')}
                    </span>
                    <span className="font-semibold text-lg text-emerald-500">
                      {money.format(paymentOption === 'full' ? price.total : price.dp)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[#999ba3]">{t('booking.remaining') || 'Sisa Pembayaran'}</span>
                    <span className="font-medium text-[#0c0a08] dark:text-white">
                      {money.format(paymentOption === 'full' ? 0 : price.total - price.dp)}
                    </span>
                  </div>
                </div>

                {state.error && (
                  <div className="rounded-[4px] bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500 font-medium">
                    {state.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending || fields.length === 0}
                  className="w-full rounded-[4px] bg-[#e4f222] px-4 py-3 text-[16px] font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? t('booking.submitting') : t('booking.confirmButton')}
                </button>
              </>
            )}
          </div>
        )}
      </form>

      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:block w-full lg:max-w-[340px] order-1 lg:order-2">
        <div className="sticky top-20">
          <FieldInfoCard
            fieldName={selectedField?.name ?? 'Lapangan HAM'}
            fieldAddress={selectedField?.address ?? null}
          />
        </div>
      </aside>
    </div>
  </div>
);
}
