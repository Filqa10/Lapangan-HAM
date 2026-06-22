import type { ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
  colorClass?: string;
};

export function StatCard({ icon, value, label, colorClass = 'bg-[var(--bg-card)]' }: StatCardProps) {
  return (
    <article className={`stagger-item rounded-2xl border border-[var(--border-subtle)] p-5 ${colorClass}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">{label}</p>
    </article>
  );
}
