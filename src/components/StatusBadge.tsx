'use client';

import { useTranslation } from '@/lib/i18n';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  dp_paid: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  payment_2_pending: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = statusStyles[status] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  const label = t(`status.${status}`) || status;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}
