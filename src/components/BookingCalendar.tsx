'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type BookingCalendarProps = {
  bookings: { booking_date: string; status: string }[];
};

const statusDotColor: Record<string, string> = {
  pending: 'bg-amber-400',
  dp_paid: 'bg-purple-400',
  payment_2_pending: 'bg-purple-400',
  paid: 'bg-emerald-400',
  confirmed: 'bg-emerald-400',
  cancelled: 'bg-red-400',
};

const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAYS_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; currentMonth: boolean; dateStr: string }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    days.push({ day: d, currentMonth: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      currentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // Fill to complete last row
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = month + 2 > 12 ? 1 : month + 2;
    const nextYear = month + 2 > 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, currentMonth: false, dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
  }

  return days;
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const { t, locale } = useTranslation();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dayLabels = locale === 'id' ? DAYS_ID : DAYS_EN;
  const monthLabels = locale === 'id' ? MONTHS_ID : MONTHS_EN;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build booking map: dateStr → status[]
  const bookingMap = new Map<string, string[]>();
  bookings.forEach((b) => {
    const existing = bookingMap.get(b.booking_date) ?? [];
    existing.push(b.status);
    bookingMap.set(b.booking_date, existing);
  });

  const allDays = getCalendarDays(year, month);

  // For week view: only show the week containing today
  const weekDays = view === 'week'
    ? (() => {
        const todayIdx = allDays.findIndex((d) => d.dateStr === todayStr);
        const idx = todayIdx >= 0 ? todayIdx : allDays.findIndex((d) => d.currentMonth);
        const startOfWeek = idx - (idx % 7);
        return allDays.slice(startOfWeek, startOfWeek + 7);
      })()
    : allDays;

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6" id="booking-calendar">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[18px] font-medium uppercase tracking-[0.02em] text-[#0c0a08] dark:text-white">{t('dashboard.bookingCalendar')}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView(view === 'month' ? 'week' : 'month')}
            className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-[#4d505d] dark:text-slate-300 transition duration-150 hover:bg-[#f4f2f0] dark:hover:bg-slate-800 active:scale-[0.97]"
          >
            {t(`dashboard.${view === 'month' ? 'week' : 'month'}`)}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 p-1.5 text-[#4d505d] dark:text-slate-300 transition hover:bg-[#f4f2f0] dark:hover:bg-slate-800 active:scale-[0.97]"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#0c0a08] dark:text-white" suppressHydrationWarning>{monthLabels[month]} {year}</span>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-[4px] bg-[#e4f222] px-2.5 py-0.5 text-xs font-medium text-[#0c0a08] transition duration-150 hover:opacity-90 active:scale-[0.97]"
          >
            {t('dashboard.today')}
          </button>
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-[4px] border border-[#d2cecb] dark:border-slate-800 p-1.5 text-[#4d505d] dark:text-slate-300 transition hover:bg-[#f4f2f0] dark:hover:bg-slate-800 active:scale-[0.97]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayLabels.map((day) => (
          <div key={day} className="py-1 text-center text-xs font-medium uppercase tracking-[0.02em] text-[#999ba3]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d, i) => {
          const isToday = d.dateStr === todayStr;
          const statuses = bookingMap.get(d.dateStr) ?? [];

          return (
            <div
              key={`${d.dateStr}-${i}`}
              suppressHydrationWarning
              className={`relative flex min-h-[44px] flex-col items-center justify-start rounded-[4px] p-1.5 text-xs transition ${
                d.currentMonth ? '' : 'opacity-30'
              } ${isToday ? 'border border-[#5683d2] bg-[#5683d2]/10 font-semibold text-[#5683d2] dark:text-blue-300' : 'text-[#4d505d] dark:text-slate-300'} hover:bg-[#f4f2f0] dark:hover:bg-slate-800/80`}
            >
              <span>{d.day}</span>
              {statuses.length > 0 && (
                <div className="mt-1 flex gap-0.5">
                  {statuses.slice(0, 3).map((s, si) => (
                    <span key={si} className={`h-1.5 w-1.5 rounded-full ${statusDotColor[s] ?? 'bg-gray-400'}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap gap-4 border-t border-[#f4f2f0] dark:border-slate-800/80 pt-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-[12px] text-[#999ba3]">{t('dashboard.pending')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-[12px] text-[#999ba3]">{t('dashboard.dpPaid')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[12px] text-[#999ba3]">{t('dashboard.confirmedDot')}</span>
        </div>
      </div>
    </div>
  );
}
