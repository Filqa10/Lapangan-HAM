'use client';

import { useState } from 'react';
import { Calendar, ExternalLink, Filter, ReceiptText, Copy, Phone, Mail } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { BookingActionForm } from './BookingActionForm';
import {
  approveDPFormAction,
  approveFinalPaymentFormAction,
  cancelBookingFormAction,
  completePaymentOfflineFormAction,
} from '@/actions/bookings';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-[var(--bg-body)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-action-hover)] transition cursor-pointer"
    >
      <Copy size={10} className={copied ? 'text-emerald-500' : ''} />
      {copied ? 'Tersalin' : 'Salin'}
    </button>
  );
}

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

  const renderDetails = (row: BookingItem) => {
    const unpaidBalance = Math.max(0, row.price - row.dp_amount);
    const isFullyPaid = ['confirmed', 'paid'].includes(row.status);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        {/* Kontak Customer */}
        <div className="space-y-2 border-r border-[var(--border-subtle)] pr-6 last:border-r-0">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Kontak Pelanggan
          </h4>
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Nama:</span>
              <span className="font-medium text-[var(--text-primary)]">{row.customerName || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <Mail size={12} /> Email:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[var(--text-primary)] break-all max-w-[120px] md:max-w-[140px] truncate">{row.customerEmail || '—'}</span>
                {row.customerEmail && <CopyButton text={row.customerEmail} />}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1">
                <Phone size={12} /> Telepon:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[var(--text-primary)]">{row.customerPhone || '—'}</span>
                {row.customerPhone && <CopyButton text={row.customerPhone} />}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-subtle)]/50">
              <span className="text-[var(--text-muted)]">Lapangan:</span>
              <span className="font-medium text-[var(--text-primary)]">{row.fieldName}</span>
            </div>
          </div>
        </div>

        {/* Rincian Pembayaran */}
        <div className="space-y-2 border-r border-[var(--border-subtle)] pr-6 last:border-r-0">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Rincian Pembayaran
          </h4>
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Harga Total:</span>
              <span className="font-semibold text-[var(--text-primary)]">{money.format(row.price)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Jumlah DP:</span>
              <span className="font-semibold text-[var(--accent-blue)]">{money.format(row.dp_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Sisa Pembayaran:</span>
              <span className={`font-semibold ${isFullyPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isFullyPaid ? 'Lunas' : money.format(unpaidBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-subtle)]/50">
              <span className="text-[var(--text-muted)]">Tanggal Dibuat:</span>
              <span className="text-[var(--text-secondary)]">{row.created_at_label}</span>
            </div>
          </div>
        </div>

        {/* Bukti Pembayaran */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Bukti Transfer
          </h4>
          <div className="mt-2">
            {row.receiptUrl ? (
              <div className="space-y-2">
                <a
                  href={row.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn inline-flex items-center gap-1.5 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-action-hover)]"
                >
                  <ExternalLink size={12} />
                  Lihat Bukti Asli
                </a>
                <div className="relative aspect-video max-h-24 md:max-h-28 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-body)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.receiptUrl}
                    alt="Bukti Transfer"
                    className="h-full w-full object-contain hover:scale-105 transition duration-200 cursor-zoom-in"
                    onClick={() => window.open(row.receiptUrl!, '_blank')}
                  />
                </div>
              </div>
            ) : row.receiptUnavailable ? (
              <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 font-semibold">
                <ReceiptText size={12} />
                Bukti Tidak Tersedia
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Belum Unggah Bukti</span>
            )}
          </div>
        </div>
      </div>
    );
  };

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
      sortValue: (row: BookingItem) => `${row.customerName} ${row.customerEmail || ''} ${row.customerPhone || ''} ${row.fieldName}`,
      render: (row: BookingItem) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-[var(--text-primary)]">{row.customerName || '—'}</p>
          <p className="text-xs text-[var(--text-muted)] font-medium">{row.fieldName}</p>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: t('admin.dateCol'),
      sortable: true,
      sortValue: (row: BookingItem) => row.booking_date,
      render: (row: BookingItem) => (
        <div className="space-y-0.5">
          <div className="font-medium text-[var(--text-primary)]">{row.booking_date}</div>
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {row.start_time.slice(0, 5)} - {row.end_time.slice(0, 5)}
          </div>
        </div>
      ),
    },
    {
      key: 'payment',
      label: 'Pembayaran',
      sortable: true,
      sortValue: (row: BookingItem) => row.price,
      render: (row: BookingItem) => (
        <div className="space-y-0.5 font-medium">
          <div className="text-[var(--text-primary)]">{money.format(row.price)}</div>
          <div className="text-xs text-[var(--accent-blue)]">
            DP: {money.format(row.dp_amount)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('admin.statusCol'),
      sortable: true,
      sortValue: (row: BookingItem) => row.status,
      render: (row: BookingItem) => <StatusBadge status={row.status} />,
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
          {row.status === 'dp_paid' && (
            <BookingActionForm
              action={completePaymentOfflineFormAction}
              bookingId={row.id}
              label="Mark as Lunas"
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
          expandableRender={renderDetails}
        />
      </div>
    </div>
  );
}
