'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { CustomerRegisterForm } from './CustomerRegisterForm';

export default function CustomerRegisterPage() {
  const { t } = useTranslation();

  return (
    <main className="grid min-h-screen lg:grid-cols-12 bg-[var(--bg-body)] text-[var(--text-primary)] font-sans transition-colors duration-300">
      {/* Left Panel: Immersive Sports Imagery & Branding */}
      <section
        className="hidden lg:flex lg:col-span-6 relative flex-col justify-between p-16 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #0c0a08 0%, #0c0a08 22%, #1d2740 52%, #3a548c 74%, #5683d2 88%, #f4f2f0 100%)',
        }}
      >
        {/* Full-bleed background image with premium dark gradient overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1597783442538-368f06281679?auto=format&fit=crop&w=1200&q=80"
            alt="Soccer kicker action"
            fill
            sizes="50vw"
            className="object-cover object-center opacity-65"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/40 to-[#0c0a08]/80 mix-blend-multiply" />
        </div>

        {/* Brand Header */}
        <Link href="/" className="relative z-10 stagger-item hover:opacity-90 transition-opacity">
          <Image
            src="/assets/Logo-HAM-fix.png"
            alt="HAM Stadium Logo"
            width={130}
            height={130}
            className="shrink-0 object-contain"
          />
        </Link>

        {/* Content Statement & Footer */}
        <div className="relative z-10 space-y-8 stagger-item" style={{ animationDelay: '150ms' }}>
          <div>
            <h2 className="text-[38px] sm:text-[46px] font-normal leading-[1.08] tracking-tight text-white uppercase max-w-lg">
              {t('auth.panel.title.register')}
            </h2>
            <p className="mt-4 text-[16px] leading-[1.55] text-white/70 max-w-md">
              {t('auth.panel.desc.register')}
            </p>
          </div>

          <p className="text-[12px] text-white/55 font-medium tracking-wider uppercase">
            HAM Stadium Booking System v1.0
          </p>
        </div>
      </section>

      {/* Right Panel: Clean Form Layout */}
      <section className="flex flex-col justify-center lg:col-span-6 px-6 py-16 sm:px-16 lg:px-24 relative bg-[var(--bg-card)]">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h1 className="text-[32px] font-normal leading-[1.15] tracking-tight text-[var(--text-primary)]">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-2 text-[15px] text-[var(--text-secondary)] font-normal">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <CustomerRegisterForm />
        </div>
      </section>
    </main>
  );
}
