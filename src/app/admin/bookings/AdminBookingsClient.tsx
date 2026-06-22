'use client';

import { useState } from 'react';
import { Calendar, ExternalLink, Filter, ReceiptText } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { BookingActionForm } from './BookingActionForm';
import {
  approveDPFormAction,
  approveFinalPaymentFormAction,
  cancelBookingFormAction,
} from '@/actions/bookings';

type BookingItem = {
  id: number;
  fieldName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number;
  dp_amount: number;
  status: string;
  receiptUrl: string | null;
  receiptUnavailable: boolean;
  created_at_label: string;
  created_at_sort_key: number;
};

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const STATUS_OPTIONS = ['pending', 'dp_paid', 'payment_2_pending', 'paid', 'confirmed', 'cancelled'];

export function AdminBookingsClient({
  bookings,
  loadError = null,
}: {
  bookings: BookingItem[];
  loadError?: string | null;
}) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      sortValue: (row: BookingItem) => row.id,
      render: (row: BookingItem) => <span className="font-semibold text-[var(--text-muted)]">#{row.id}</span>,
    },
    {
      key: 'customer',
      label: t('admin.customer'),
      sortable: true,
      sortValue: (row: BookingItem) => row.customerName,
      render: (row: BookingItem) => (
        <div className="space-y-1">
          <p className="font-semibold text-[var(--text-primary)]">{row.customerName || '—'}</p>
          <div className="flex max-w-[240px] flex-col gap-0.5 text-xs text-[var(--text-muted)]">
            {row.customerEmail ? <span>{row.customerEmail}</span> : null}
            {row.customerPhone ? <span>{row.customerPhone}</span> : null}
            {!row.customerEmail && !row.customerPhone ? <span>—</span> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'field',
      label: t('admin.fieldCol'),
      sortable: true,
      sortValue: (row: BookingItem) => row.fieldName,
      render: (row: BookingItem) => <span className="font-semibold">{row.fieldName}</span>,
    },
    {
      key: 'date',
      label: t('admin.dateCol'),
      sortable: true,
      sortValue: (row: BookingItem) => row.booking_date,
      render: (row: BookingItem) => <span>{row.booking_date}</span>,
    },
    {
      key: 'time',
      label: t('admin.time'),
      render: (row: BookingItem) => (
        <span>{row.start_time.slice(0, 5)} - {row.end_time.slice(0, 5)}</span>
      ),
    },
    {
      key: 'price',
      label: t('admin.price'),
      sortable: true,
      sortValue: (row: BookingItem) => row.price,
      render: (row: BookingItem) => <span className="font-bold">{money.format(row.price)}</span>,
    },
    {
      key: 'dp',
      label: t('admin.dp'),
      render: (row: BookingItem) => (
        <span className="font-bold text-[var(--accent-blue)]">{money.format(row.dp_amount)}</span>
      ),
    },
    {
      key: 'receipt',
      label: t('admin.paymentProof'),
      render: (row: BookingItem) => {
        return row.receiptUrl ? (
          <a
            href={row.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-action-hover)]"
          >
            <ExternalLink size={14} />
            {t('admin.viewProof')}
          </a>
        ) : row.receiptUnavailable ? (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300"
          >
            <ReceiptText size={13} />
            {t('admin.proofUnavailable')}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">—</span>
        );
      },
    },
    {
      key: 'status',
      label: t('admin.statusCol'),
      sortable: true,
      sortValue: (row: BookingItem) => row.status,
      render: (row: BookingItem) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      label: t('admin.bookingDate'),
      sortable: true,
      sortValue: (row: BookingItem) => row.created_at_sort_key,
      render: (row: BookingItem) => <span className="text-[var(--text-secondary)]">{row.created_at_label}</span>,
    },
    {
      key: 'actions',
      label: t('admin.actions'),
      render: (row: BookingItem) => (
        <div className="flex flex-wrap gap-1.5">
          {row.status === 'pending' && (
            <BookingActionForm
              action={approveDPFormAction}
              bookingId={row.id}
              label={t('admin.approveDP')}
              pendingLabel="..."
              tone="approve"
            />
          )}
          {row.status === 'payment_2_pending' && (
            <BookingActionForm
              action={approveFinalPaymentFormAction}
              bookingId={row.id}
              label={t('admin.confirmPaid')}
              pendingLabel="..."
              tone="approve"
            />
          )}
          {!['cancelled', 'confirmed'].includes(row.status) && (
            <BookingActionForm
              action={cancelBookingFormAction}
              bookingId={row.id}
              label={t('admin.cancelBooking')}
              pendingLabel="..."
              tone="danger"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
        >
          {loadError}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('admin.bookingList')}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {filtered.length} / {bookings.length} bookings visible
            </p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2">
          <Filter size={15} className="text-[var(--text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[4px] border border-transparent bg-transparent px-1 py-1 text-sm text-[var(--text-primary)] focus:border-transparent focus:shadow-none"
          >
            <option value="">{t('common.allStatus')}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
        />
      </div>
    </div>
  );
}
