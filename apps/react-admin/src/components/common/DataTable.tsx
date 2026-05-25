import { useState, useMemo } from 'react';
import clsx from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  loading = false,
  emptyMessage = 'No data found',
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-surface-700',
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortField === col.key && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-surface-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={clsx(
                    'hover:bg-surface-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3 whitespace-nowrap', col.className)}>
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
          <p className="text-sm text-surface-500">
            Showing {Math.min((page - 1) * pageSize + 1, total)} to{' '}
            {Math.min(page * pageSize, total)} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4));
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={clsx(
                    'px-3 py-1.5 text-xs rounded-md transition-colors',
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-surface-600 hover:bg-surface-200',
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
