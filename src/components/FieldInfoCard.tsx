'use client';

import Image from 'next/image';

import { useTranslation } from '@/lib/i18n';
import { PriceTable } from './PriceTable';

type FieldInfoCardProps = {
  fieldName: string;
  fieldAddress: string | null;
};

export function FieldInfoCard({ fieldName, fieldAddress }: FieldInfoCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 rounded-[12px] border border-[#d2cecb] dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6">
      {/* Field image container - desaturated premium dawn stadium view */}
      <div className="relative overflow-hidden h-36 rounded-[12px] flex items-center justify-center bg-slate-900 border border-[#d2cecb]/10 dark:border-slate-800">
        <Image
          src="https://images.unsplash.com/photo-1597783442538-368f06281679?auto=format&fit=crop&w=600&q=80"
          alt="HAM Stadium Field"
          fill
          className="object-cover opacity-60"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-transparent to-transparent" />
        <span className="relative z-10 text-[13px] font-medium uppercase tracking-[0.05em] text-white/90">HAM Pitch</span>
      </div>

      <div>
        <h3 className="text-[18px] font-medium uppercase tracking-[0.02em] text-[#0c0a08] dark:text-white">{fieldName}</h3>
        {fieldAddress && (
          <p className="mt-1 text-[13px] text-[#999ba3]">{fieldAddress}</p>
        )}
      </div>

      {/* Availability badge - Limestone capsule with small green bullet */}
      <div className="flex items-center gap-2 rounded-[4px] border border-[#d2cecb] dark:border-slate-800 bg-[#f4f2f0] dark:bg-slate-900 px-3 py-2 text-[12px] font-medium text-[#4d505d] dark:text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {t('booking.fieldAvailable')}
      </div>

      {/* Price table */}
      <PriceTable />
    </div>
  );
}
