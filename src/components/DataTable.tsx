'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
};

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.sortValue?.(row) ?? '';
        return String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortAsc, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = sortedData.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">{t('common.showEntries')}</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-[var(--text-muted)]">{t('common.entries')}</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('common.search')}
            className="w-full rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-input)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] sm:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-body)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[11px] font-semibold text-[var(--text-muted)] ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="mx-auto max-w-xs">
                    <p className="text-sm font-medium text-[var(--text-primary)]">No records found</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Try changing the search, filter, or page size.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="border-b border-[var(--border-subtle)] last:border-0 transition-colors duration-150 hover:bg-[var(--bg-action-hover)]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 align-middle">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          {t('common.showing')} {sortedData.length === 0 ? 0 : (currentPage - 1) * perPage + 1} {t('common.to')}{' '}
          {Math.min(currentPage * perPage, sortedData.length)} {t('common.of')} {sortedData.length}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="rounded-[4px] border border-[var(--border-subtle)] px-3 py-1.5 font-medium transition hover:bg-[var(--bg-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {t('common.previous')}
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            className="rounded-[4px] border border-[var(--border-subtle)] px-3 py-1.5 font-medium transition hover:bg-[var(--bg-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
