'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type FieldFormProps = {
  action: (prevState: { ok: boolean; error: string | null }, formData: FormData) => Promise<{ ok: boolean; error: string | null }>;
  initialData?: {
    id?: number;
    name: string;
    price: number;
    address: string;
    status: string;
  };
  title: string;
};

export function FieldForm({ action, initialData, title }: FieldFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, { ok: false, error: null });

  useEffect(() => {
    if (state.ok) {
      router.push('/admin/fields');
    }
  }, [state.ok, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">{t('admin.manageFields')}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Link href="/admin/fields" className="btn inline-flex items-center gap-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          {t('common.back')}
        </Link>
      </div>

      <form action={formAction} className="max-w-2xl space-y-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
        {initialData?.id && <input type="hidden" name="fieldId" value={initialData.id} />}

        <div>
          <label htmlFor="field-name" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t('admin.fieldNameLabel')}
          </label>
          <input
            id="field-name"
            name="name"
            type="text"
            required
            defaultValue={initialData?.name ?? ''}
            className="w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] transition"
          />
        </div>

        <div>
          <label htmlFor="field-price" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t('admin.basePriceLabel')}
          </label>
          <input
            id="field-price"
            name="price"
            type="number"
            required
            min="0"
            defaultValue={initialData?.price ?? ''}
            className="w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] transition"
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">Use the base slot price in Rupiah.</p>
        </div>

        <div>
          <label htmlFor="field-address" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t('admin.addressLabel')}
          </label>
          <input
            id="field-address"
            name="address"
            type="text"
            defaultValue={initialData?.address ?? ''}
            className="w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] transition"
          />
        </div>

        <div>
          <label htmlFor="field-status" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            {t('admin.statusLabel')}
          </label>
          <select
            id="field-status"
            name="status"
            defaultValue={initialData?.status ?? 'active'}
            className="w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)]"
          >
            <option value="active">{t('admin.active')}</option>
            <option value="inactive">{t('admin.inactive')}</option>
          </select>
        </div>

        {state.error && (
          <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {state.error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-5 sm:flex-row sm:justify-end">
          <Link href="/admin/fields" className="btn inline-flex items-center justify-center rounded-[4px] border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-action-hover)] hover:text-[var(--text-primary)]">
            {t('common.back')}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="btn inline-flex items-center justify-center gap-2 rounded-[4px] bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-card)] transition hover:bg-[var(--accent-blue-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            {isPending ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
