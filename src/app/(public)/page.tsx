'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Sprout, Lightbulb, Users, Clock, ArrowRight, Plus, Minus } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { BOOKING_PRICE_SLOTS, calculateBookingPrice } from '@/config/pricing';
import { createClient } from '@/lib/supabase/client';

const HAMMapWrapper = dynamic(() => import('@/components/HAMMapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f2f0]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0c0a08]/10 border-t-[#0c0a08]" />
    </div>
  ),
});

/* Ramp palette (DESIGN.md) */
const PAPER = '#ffffff';
const LIMESTONE = '#f4f2f0';
const OBSIDIAN = '#0c0a08';
const SLATE = '#4d505d';
const FOG = '#999ba3';
const BONE = '#d2cecb';
const LIME = '#e4f222';

const rupiah = new Intl.NumberFormat('id-ID');
const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';

const motionDelay = (index: number, base = 90) => ({
  animationDelay: `${base + index * 90}ms`,
});

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2.5 text-[13px] font-medium uppercase tracking-[0.02em]"
      style={{ color: onDark ? FOG : SLATE }}
    >
      <span className="inline-block h-[7px] w-[7px]" style={{ backgroundColor: LIME }} />
      {children}
    </span>
  );
}

export default function AboutPage() {
  const { t, locale, setLocale } = useTranslation();

  interface DBBooking {
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
  }

  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatGridDate = (date: Date, localeStr: string) => {
    const l = localeStr === 'id' ? 'id-ID' : 'en-US';
    const weekday = date.toLocaleDateString(l, { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString(l, { month: 'short' });
    return `${weekday}, ${day} ${month}`;
  };

  useEffect(() => {
    async function fetchBookings() {
      try {
        const supabase = createClient();
        const startDate = toLocalDateString(dates[0]);
        const endDate = toLocalDateString(dates[4]);

        const { data, error } = await supabase
          .from('bookings')
          .select('booking_date, start_time, end_time, status')
          .neq('status', 'cancelled')
          .gte('booking_date', startDate)
          .lte('booking_date', endDate);

        if (error) {
          console.error('Error fetching bookings:', error);
        } else if (data) {
          setBookings(data as DBBooking[]);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchBookings();
  }, [dates]);

  const isSlotBooked = (dateStr: string, startHour: number, endHour: number) => {
    return bookings.some(b => {
      if (b.booking_date !== dateStr) return false;

      const bStartHour = Number(b.start_time.split(':')[0]);
      const bEndHour = Number(b.end_time.split(':')[0]);

      const overlapStart = Math.max(startHour, bStartHour);
      const overlapEnd = Math.min(endHour, bEndHour);

      return overlapStart < overlapEnd;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-card');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const features = [
    { icon: Sprout, label: t('about.stats.grass'), detail: t('about.stats.grassDetail') },
    { icon: Lightbulb, label: t('about.stats.light'), detail: t('about.stats.lightDetail') },
    { icon: Users, label: t('about.stats.seats'), detail: t('about.stats.seatsDetail') },
    { icon: Clock, label: t('about.stats.booking'), detail: t('about.stats.bookingDetail') },
  ];

  const priceNotes = [
    { title: t('about.pricing.weekdays'), text: t('about.pricing.weekdaysDesc') },
    { title: t('about.pricing.weekend'), text: t('about.pricing.weekendDesc') },
    { title: t('about.pricing.dp'), text: t('about.pricing.dpDesc') },
  ];

  const faqs = [
    { question: t('about.faq.q1'), answer: t('about.faq.a1') },
    { question: t('about.faq.q2'), answer: t('about.faq.a2') },
    { question: t('about.faq.q3'), answer: t('about.faq.a3') },
  ];

  const fmtHour = (h: number) => `${String(h).padStart(2, '0')}.00`;
  const fmtPrice = (n: number | null) => (n === null ? t('about.priceTable.na') : `Rp${rupiah.format(n)}`);

  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: PAPER, color: OBSIDIAN }}>
      <style jsx global>{`
        @keyframes about-rise {
          from {
            transform: translate3d(0, 18px, 0);
            filter: saturate(0.92);
          }
          to {
            transform: translate3d(0, 0, 0);
            filter: saturate(1);
          }
        }

        @keyframes about-image-settle {
          from {
            transform: scale(1.035);
            filter: saturate(0.9) contrast(0.96);
          }
          to {
            transform: scale(1);
            filter: saturate(1) contrast(1);
          }
        }

        @keyframes about-wipe {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(102%, 0, 0);
          }
        }

        @keyframes about-line {
          from {
            transform: scaleX(0.35);
          }
          to {
            transform: scaleX(1);
          }
        }

        .about-motion-rise {
          animation: about-rise 760ms ${easeOut} both;
          will-change: transform, filter;
        }

        .about-motion-image {
          animation: about-image-settle 1100ms ${easeOut} both;
          will-change: transform, filter;
        }

        .about-motion-wipe {
          animation: about-wipe 900ms ${easeOut} 220ms both;
          will-change: transform;
        }

        .about-motion-line {
          animation: about-line 900ms ${easeOut} both;
          transform-origin: left center;
        }

        .about-motion-card {
          animation: about-rise 680ms ${easeOut} both;
          will-change: transform, filter;
        }

        .scroll-reveal {
          opacity: 0;
          transform: translate3d(0, 18px, 0);
          transition: transform 700ms ${easeOut}, opacity 700ms ${easeOut};
          will-change: transform, opacity;
        }

        .scroll-reveal.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .scroll-reveal-card {
          opacity: 0;
          transform: translate3d(0, 18px, 0);
          transition: transform 600ms ${easeOut}, opacity 600ms ${easeOut};
          will-change: transform, opacity;
        }

        .scroll-reveal-card.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        @media (prefers-reduced-motion: reduce) {
          .about-motion-rise,
          .about-motion-image,
          .about-motion-wipe,
          .about-motion-line,
          .about-motion-card,
          .scroll-reveal,
          .scroll-reveal-card {
            animation: none !important;
            transform: none !important;
            filter: none !important;
            transition: none !important;
            opacity: 1 !important;
          }

          .about-motion-wipe {
            display: none;
          }
        }
      `}</style>

      {/* ============ NAV (transparent over light hero) ============ */}
      <nav className="absolute top-0 z-50 w-full">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6">
          <Link href="/" className="group flex items-center transition-transform duration-300 ease-out hover:-translate-y-0.5">
            <Image
              src="/assets/Logo-HAM-fix.png"
              alt="HAM Stadium Logo"
              width={140}
              height={140}
              className="shrink-0 object-contain invert"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#facilities" className="relative text-[14px] font-medium text-[#4d505d] transition duration-200 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#0c0a08] after:transition-transform after:duration-250 hover:text-[#0c0a08] hover:after:scale-x-100">{t('about.nav.facilities')}</a>
            <a href="#pricing" className="relative text-[14px] font-medium text-[#4d505d] transition duration-200 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#0c0a08] after:transition-transform after:duration-250 hover:text-[#0c0a08] hover:after:scale-x-100">{t('about.nav.pricing')}</a>
            <a href="#gallery" className="relative text-[14px] font-medium text-[#4d505d] transition duration-200 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#0c0a08] after:transition-transform after:duration-250 hover:text-[#0c0a08] hover:after:scale-x-100">{t('about.nav.gallery')}</a>
            <a href="#faq" className="relative text-[14px] font-medium text-[#4d505d] transition duration-200 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#0c0a08] after:transition-transform after:duration-250 hover:text-[#0c0a08] hover:after:scale-x-100">{t('about.nav.faq')}</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'id' : 'en')}
              className="px-2 py-1 text-[13px] font-semibold text-[#4d505d] hover:text-[#0c0a08] transition cursor-pointer"
              aria-label="Toggle language"
            >
              {locale === 'en' ? 'EN' : 'ID'}
            </button>
            <Link
              href="/auth/customer"
              className="hidden px-2.5 py-1.5 text-[14px] font-semibold text-[#4d505d] transition duration-200 hover:text-[#0c0a08] sm:block"
            >
              {t('about.signIn')}
            </Link>
            <Link
              href="/auth/customer/register"
              className="rounded-[4px] px-4 py-2 text-[14px] font-semibold transition duration-200 hover:bg-[#0c0a08]/90 active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: OBSIDIAN, color: PAPER }}
            >
              {t('about.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO (light minimalist style) ============ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: PAPER,
        }}
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pt-36 pb-24 lg:grid-cols-12 lg:gap-10 lg:pt-44 lg:pb-28">
          {/* Text */}
          <div className="lg:col-span-6">
            <div className="about-motion-rise" style={motionDelay(0)}>
              <Eyebrow>{t('about.hero.badge')}</Eyebrow>
            </div>
            <h1 className="about-motion-rise mt-6 text-[44px] font-normal leading-[1.03] tracking-tight text-[#0c0a08] sm:text-[58px] lg:text-[72px]" style={motionDelay(1)}>
              Stadion
              <br />
              H. Abdul Malik
            </h1>
            <p className="about-motion-rise mt-7 max-w-xl text-[17px] leading-[1.55] text-[#4d505d]" style={motionDelay(2)}>
              {t('landing.heroDescription')}
            </p>
            <div className="about-motion-rise mt-9 flex flex-col gap-3 sm:flex-row" style={motionDelay(3)}>
              <Link
                href="/customer/booking/create"
                className="btn group inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-[16px] font-medium shadow-[0_16px_50px_rgba(12,10,8,0.06)] transition duration-300 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0 active:scale-[0.99]"
                style={{ backgroundColor: LIME, color: OBSIDIAN }}
              >
                {t('landing.bookNow')} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="about-motion-rise mt-7 text-[14px] text-[#999ba3]" style={motionDelay(4)}>{t('about.heroSub')}</p>
          </div>

          {/* Image */}
          <div className="about-motion-rise lg:col-span-6" style={motionDelay(2, 160)}>
            <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[12px] border border-[#d2cecb] shadow-[0_30px_90px_rgba(12,10,8,0.08)]">
              <Image
                src="/assets/Stadion HAM side view.png"
                alt="HAM Stadium side view"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="about-motion-image object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                priority
              />
              <div className="about-motion-wipe pointer-events-none absolute inset-0" style={{ backgroundColor: LIMESTONE }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FACILITIES — feature card grid ============ */}
      <section id="facilities" className="px-6 py-20 lg:py-24" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="scroll-reveal" style={motionDelay(0, 120)}>
            <Eyebrow>{t('about.features.eyebrow')}</Eyebrow>
          </div>
          <h2 className="scroll-reveal mt-5 max-w-2xl text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[44px]" style={motionDelay(1, 120)}>
            {t('about.features.title')}
          </h2>
          <p className="scroll-reveal mt-4 max-w-xl text-[17px] leading-relaxed" style={{ ...motionDelay(2, 120), color: FOG }}>
            {t('about.features.subtitle')}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, index) => (
              <div
                key={f.label}
                className="scroll-reveal-card group flex flex-col gap-4 rounded-[12px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(12,10,8,0.09)] active:translate-y-0"
                style={{ ...motionDelay(index, 240), backgroundColor: LIMESTONE }}
              >
                <f.icon size={28} strokeWidth={1.5} className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" style={{ color: OBSIDIAN }} />
                <h3 className="text-[20px] font-medium leading-snug">{f.label}</h3>
                <p className="text-[16px] leading-relaxed" style={{ color: FOG }}>
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALLERY — editorial split ============ */}
      <section id="gallery" className="px-6 py-20 lg:py-24" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="scroll-reveal" style={motionDelay(0, 120)}>
              <Eyebrow>{t('about.gallery.eyebrow')}</Eyebrow>
            </div>
            <h2 className="scroll-reveal mt-5 text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[44px]" style={motionDelay(1, 120)}>
              {t('about.gallery.title')}
            </h2>
            <p className="scroll-reveal mt-6 max-w-lg text-[18px] leading-relaxed" style={{ ...motionDelay(2, 120), color: FOG }}>
              {t('about.gallery.desc')}
            </p>
            <Link
              href="/customer/booking/create"
              className="scroll-reveal group mt-8 inline-flex items-center gap-2 text-[16px] font-medium transition duration-300 hover:-translate-y-0.5 active:translate-y-0"
              style={{ ...motionDelay(3, 120), color: OBSIDIAN }}
            >
              {t('about.bookSlot')} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="scroll-reveal group relative aspect-square w-full overflow-hidden rounded-[12px] shadow-[0_24px_70px_rgba(12,10,8,0.13)]" style={motionDelay(2, 180)}>
            <Image
              src="/assets/Golden Hour HAM.png"
              alt="Golden hour at HAM Stadium"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="about-motion-image object-cover transition duration-700 group-hover:scale-[1.025]"
            />
            <div className="about-motion-wipe pointer-events-none absolute inset-0" style={{ backgroundColor: LIMESTONE }} />
          </div>
        </div>
      </section>

      {/* ============ PRICING — detailed slot table ============ */}
      <section id="pricing" className="px-6 py-20 lg:py-24" style={{ backgroundColor: LIMESTONE }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="scroll-reveal" style={motionDelay(0, 120)}>
            <Eyebrow>{t('about.priceTable.eyebrow')}</Eyebrow>
          </div>
          <h2 className="scroll-reveal mt-5 text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[44px]" style={motionDelay(1, 120)}>
            {t('about.priceTable.title')}
          </h2>
          <p className="scroll-reveal mt-4 max-w-2xl text-[17px] leading-relaxed" style={{ ...motionDelay(2, 120), color: SLATE }}>
            {t('about.priceTable.subtitle')}
          </p>

          {/* Table */}
          <div
            className="scroll-reveal mt-10 overflow-x-auto rounded-[12px] border shadow-[0_20px_55px_rgba(12,10,8,0.06)]"
            style={{ ...motionDelay(3, 120), backgroundColor: PAPER, borderColor: BONE }}
          >
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BONE}` }}>
                  <th className="px-6 py-5 align-top text-[13px] font-medium uppercase tracking-wide" style={{ color: OBSIDIAN }}>
                    {t('about.priceTable.colSlot')}
                  </th>
                  <th className="px-6 py-5 align-top">
                    <span className="block text-[13px] font-medium uppercase tracking-wide" style={{ color: OBSIDIAN }}>
                      {t('about.priceTable.colWeekday')}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-normal normal-case" style={{ color: FOG }}>
                      {t('about.priceTable.colWeekdayHint')}
                    </span>
                  </th>
                  <th className="px-6 py-5 align-top">
                    <span className="block text-[13px] font-medium uppercase tracking-wide" style={{ color: OBSIDIAN }}>
                      {t('about.priceTable.colFriday')}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-normal normal-case" style={{ color: FOG }}>
                      {t('about.priceTable.colFridayHint')}
                    </span>
                  </th>
                  <th className="px-6 py-5 align-top">
                    <span className="block text-[13px] font-medium uppercase tracking-wide" style={{ color: OBSIDIAN }}>
                      {t('about.priceTable.colWeekend')}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-normal normal-case" style={{ color: FOG }}>
                      {t('about.priceTable.colWeekendHint')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {BOOKING_PRICE_SLOTS.map((slot, i) => (
                  <tr
                    key={`${slot.startHour}-${slot.endHour}`}
                    className="transition duration-200 hover:bg-black/[0.025]"
                    style={{ borderBottom: i === BOOKING_PRICE_SLOTS.length - 1 ? 'none' : `1px solid ${LIMESTONE}` }}
                  >
                    <td className="px-6 py-5 text-[15px] font-medium whitespace-nowrap" style={{ color: OBSIDIAN }}>
                      {fmtHour(slot.startHour)} – {fmtHour(slot.endHour)}
                    </td>
                    <td className="px-6 py-5 text-[15px]" style={{ color: slot.weekdayPrice === null ? FOG : SLATE }}>
                      {fmtPrice(slot.weekdayPrice)}
                    </td>
                    <td className="px-6 py-5 text-[15px]" style={{ color: slot.fridayPrice === null ? FOG : SLATE }}>
                      {fmtPrice(slot.fridayPrice)}
                    </td>
                    <td className="px-6 py-5 text-[15px] font-medium" style={{ color: OBSIDIAN }}>
                      {fmtPrice(slot.weekendPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-[14px] leading-relaxed" style={{ color: SLATE }}>
            {t('about.priceTable.note')}
          </p>

          {/* Pricing notes */}
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[12px] sm:grid-cols-3" style={{ backgroundColor: BONE }}>
            {priceNotes.map((note, index) => (
              <div
                key={note.title}
                className="scroll-reveal-card p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(12,10,8,0.07)]"
                style={{ ...motionDelay(index, 180), backgroundColor: PAPER }}
              >
                <h4 className="text-[13px] font-medium uppercase tracking-wide" style={{ color: SLATE }}>
                  {note.title}
                </h4>
                <p className="mt-3 text-[18px] font-normal leading-snug" style={{ color: OBSIDIAN }}>
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SCHEDULE — dynamic availability grid ============ */}
      <section id="schedule" className="px-6 py-20 lg:py-24 border-t border-[#d2cecb]/20" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="scroll-reveal" style={motionDelay(0, 120)}>
            <Eyebrow>{t('about.schedule.eyebrow')}</Eyebrow>
          </div>
          <h2 className="scroll-reveal mt-5 text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[44px]" style={motionDelay(1, 120)}>
            {t('about.schedule.title')}
          </h2>
          <p className="scroll-reveal mt-4 max-w-2xl text-[17px] leading-relaxed" style={{ ...motionDelay(2, 120), color: SLATE }}>
            {t('about.schedule.subtitle')}
          </p>

          {loadingBookings ? (
            <div className="mt-12 flex h-60 items-center justify-center rounded-[12px] border border-dashed border-[#d2cecb]" style={{ backgroundColor: LIMESTONE }}>
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0c0a08]/10 border-t-[#0c0a08]" />
                <p className="text-[15px] font-medium" style={{ color: SLATE }}>
                  {t('about.schedule.loading')}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-12 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
              <div className="flex gap-5 min-w-[1000px]">
                {dates.map((date, dayIdx) => {
                  const dateStr = toLocalDateString(date);
                  const isToday = dayIdx === 0;
                  const dateHeader = formatGridDate(date, locale);
                  const dayOfWeekLabel = isToday 
                    ? `${dateHeader} ${locale === 'id' ? '(Hari Ini)' : '(Today)'}` 
                    : dateHeader;

                  return (
                    <div
                      key={dateStr}
                      className="flex-1 min-w-[180px] rounded-[12px] p-4 border border-[#d2cecb]/60 snap-align-start"
                      style={{ backgroundColor: LIMESTONE }}
                    >
                      <div className="mb-4 pb-3 border-b border-[#d2cecb]/60 text-center">
                        <span className="block text-[14px] font-bold" style={{ color: OBSIDIAN }}>
                          {dayOfWeekLabel}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {BOOKING_PRICE_SLOTS.map((slot) => {
                          const isBooked = isSlotBooked(dateStr, slot.startHour, slot.endHour);
                          const { total: slotPrice } = calculateBookingPrice(date, slot.startHour, slot.endHour);

                          if (isBooked) {
                            return (
                              <div
                                key={`${slot.startHour}-${slot.endHour}`}
                                className="flex flex-col items-start gap-1 rounded-[8px] border border-[#d2cecb]/40 p-3 select-none"
                                style={{ backgroundColor: '#e2e0de', color: '#999ba3' }}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-[13px] font-medium">
                                    {fmtHour(slot.startHour)} – {fmtHour(slot.endHour)}
                                  </span>
                                  <Minus size={14} className="text-[#999ba3]" />
                                </div>
                                <span className="text-[12px] font-medium uppercase tracking-wide opacity-80">
                                  {t('about.schedule.booked')}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={`${slot.startHour}-${slot.endHour}`}
                              href={`/customer/booking/create?date=${dateStr}&start=${slot.startHour}&end=${slot.endHour}`}
                              className="flex flex-col items-start gap-1 rounded-[8px] border border-emerald-500/20 bg-white p-3 hover:border-emerald-500 hover:shadow-sm transition duration-200"
                            >
                              <div className="flex w-full items-center justify-between">
                                <span className="text-[13px] font-semibold text-[#0c0a08]">
                                  {fmtHour(slot.startHour)} – {fmtHour(slot.endHour)}
                                </span>
                                <Plus size={14} className="text-emerald-600" />
                              </div>
                              <span className="text-[12px] font-medium text-emerald-700">
                                {fmtPrice(slotPrice)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============ LOCATION / MAPS ============ */}
      <section id="location" className="px-6 py-20 lg:py-24 border-t border-[#d2cecb]/20" style={{ backgroundColor: LIMESTONE }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="scroll-reveal" style={motionDelay(0, 120)}>
            <Eyebrow>{t('about.schedule.eyebrow')}</Eyebrow>
          </div>
          <h2 className="scroll-reveal mt-5 text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[44px]" style={motionDelay(1, 120)}>
            {t('about.schedule.mapTitle')}
          </h2>
          <p className="scroll-reveal mt-4 max-w-2xl text-[17px] leading-relaxed" style={{ ...motionDelay(2, 120), color: SLATE }}>
            {t('about.schedule.mapSubtitle')}
          </p>

          <div className="scroll-reveal mt-12 overflow-hidden rounded-[12px] border border-[#d2cecb] shadow-[0_20px_55px_rgba(12,10,8,0.06)] bg-white" style={{ ...motionDelay(3, 120), height: '450px' }}>
            <HAMMapWrapper />
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="px-6 py-20 lg:py-24" style={{ backgroundColor: PAPER }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="scroll-reveal lg:col-span-4" style={motionDelay(0, 120)}>
            <Eyebrow>{t('about.faq.eyebrow')}</Eyebrow>
            <h2 className="mt-5 text-[34px] font-normal leading-[1.1] tracking-tight sm:text-[40px]">
              {t('about.faq.title')}
            </h2>
          </div>
          <div className="lg:col-span-8">
            <div className="about-motion-line" style={{ borderTop: `1px solid ${BONE}`, animationDelay: '180ms' }}>
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="scroll-reveal-card group py-7 transition duration-300 hover:pl-3"
                  style={{ ...motionDelay(index, 180), borderBottom: `1px solid ${BONE}` }}
                >
                  <h3 className="text-[20px] font-medium leading-snug">{faq.question}</h3>
                  <p className="mt-3 max-w-2xl text-[16px] leading-relaxed" style={{ color: FOG }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA (lime on light) ============ */}
      <section className="px-6 pb-24" style={{ backgroundColor: PAPER }}>
        <div
          className="scroll-reveal mx-auto flex max-w-[1200px] flex-col items-start gap-8 rounded-[12px] p-10 shadow-[0_18px_55px_rgba(12,10,8,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(12,10,8,0.09)] lg:flex-row lg:items-center lg:justify-between lg:p-14"
          style={{ backgroundColor: LIMESTONE }}
        >
          <div className="max-w-xl">
            <Eyebrow>{t('about.cta.eyebrow')}</Eyebrow>
            <h2 className="mt-5 text-[30px] font-normal leading-[1.1] tracking-tight sm:text-[40px]">
              {t('about.cta.title')}
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed" style={{ color: SLATE }}>
              {t('about.cta.subtitle')}
            </p>
          </div>
          <Link
            href="/customer/booking/create"
            className="btn group inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] px-6 py-3.5 text-[16px] font-medium transition duration-300 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.99]"
            style={{ backgroundColor: LIME, color: OBSIDIAN }}
          >
            {t('landing.bookNow')} <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ============ FOOTER (Obsidian ground) ============ */}
      <footer className="px-6 py-12" style={{ backgroundColor: OBSIDIAN }}>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Image
              src="/assets/Logo-HAM-fix.png"
              alt="HAM Stadium Logo"
              width={16}
              height={16}
              className="shrink-0 object-contain"
            />
            <p className="text-[14px]" style={{ color: FOG }}>{t('about.footer.rights')}</p>
          </div>
          <div className="flex gap-6 text-[14px] font-medium">
            <Link href="/auth/customer" className="text-white/70 transition duration-300 hover:-translate-y-0.5 hover:text-white active:translate-y-0">{t('about.signIn')}</Link>
            <Link href="/auth/admin" className="text-white/70 transition duration-300 hover:-translate-y-0.5 hover:text-white active:translate-y-0">{t('about.footer.admin')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
