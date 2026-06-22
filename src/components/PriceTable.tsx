'use client';

import { useTranslation } from '@/lib/i18n';
import { BOOKING_PRICE_SLOTS } from '@/config/pricing';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function PriceTable() {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="bg-[#f4f2f0] dark:bg-slate-900/60 px-4 py-2.5 border-b border-[#d2cecb] dark:border-slate-800">
        <p className="text-[11px] font-medium tracking-[0.02em] text-[#4d505d] dark:text-slate-300 uppercase">{t('booking.pricePerSlot')}</p>
      </div>
      <div className="overflow-x-auto scrollbar-none">
        <table className="w-full text-[12px] border-collapse min-w-[360px] sm:min-w-0">
          <thead>
            <tr className="border-b border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0]/30 dark:bg-slate-900/20">
              <th className="px-3 py-2 text-left font-medium text-[#999ba3] uppercase tracking-[0.02em] whitespace-nowrap">{t('booking.slot')}</th>
              <th className="px-3 py-2 text-right font-medium text-[#999ba3] uppercase tracking-[0.02em] whitespace-nowrap">{t('booking.monThu')}</th>
              <th className="px-3 py-2 text-right font-medium text-[#999ba3] uppercase tracking-[0.02em] whitespace-nowrap">{t('booking.friday')}</th>
              <th className="px-3 py-2 text-right font-medium text-[#999ba3] uppercase tracking-[0.02em] whitespace-nowrap">{t('booking.satSun')}</th>
            </tr>
          </thead>
          <tbody>
            {BOOKING_PRICE_SLOTS.map((slot) => (
              <tr key={slot.startHour} className="border-b border-[#f4f2f0] dark:border-slate-800 last:border-0 hover:bg-[#f4f2f0]/20 dark:hover:bg-slate-900/10">
                <td className="px-3 py-2 font-medium text-[#0c0a08] dark:text-white whitespace-nowrap">
                  {String(slot.startHour).padStart(2, '0')}.00 - {String(slot.endHour).padStart(2, '0')}.00
                </td>
                <td className="px-3 py-2 text-right text-[#4d505d] dark:text-slate-300 whitespace-nowrap">
                  {slot.weekdayPrice ? money.format(slot.weekdayPrice) : t('booking.na')}
                </td>
                <td className="px-3 py-2 text-right text-[#4d505d] dark:text-slate-300 whitespace-nowrap">
                  {slot.fridayPrice ? money.format(slot.fridayPrice) : t('booking.na')}
                </td>

                <td className="px-3 py-2 text-right text-[#4d505d] dark:text-slate-300 font-medium whitespace-nowrap">
                  {money.format(slot.weekendPrice)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
