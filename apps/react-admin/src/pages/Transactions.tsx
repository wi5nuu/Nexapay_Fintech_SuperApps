import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import api from '@/services/api';
import type { Transaction, PaginatedResponse } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { format } from 'date-fns';

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<Transaction>>({
    queryKey: ['transactions', page, search, typeFilter, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/transactions', {
        params: { page, limit: 10, search, type: typeFilter || undefined, status: statusFilter || undefined },
      });
      return res.data;
    },
    placeholderData: {
      data: Array.from({ length: 10 }).map((_, i) => ({
        id: `txn-${i}`,
        userId: `user-${i % 5}`,
        userEmail: `user${i % 5}@example.com`,
        userName: ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'][i % 5],
        type: (['deposit', 'withdrawal', 'transfer', 'payment'] as const)[i % 4],
        amount: +(Math.random() * 10000).toFixed(2),
        currency: 'USD',
        status: (['completed', 'pending', 'failed', 'refunded'] as const)[i % 4],
        reference: `REF-${String(i).padStart(6, '0')}`,
        fee: +(Math.random() * 25).toFixed(2),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      total: 845,
      page: 1,
      limit: 10,
      totalPages: 85,
    },
  });

  const columns: Column<Transaction>[] = [
    { key: 'reference', header: 'Reference', render: (t) => <span className="font-mono text-xs text-surface-600">{t.reference}</span> },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (t) => (
        <div>
          <p className="font-medium text-surface-900">{t.userName}</p>
          <p className="text-xs text-surface-500">{t.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (t) => (
        <span className="capitalize text-sm font-medium text-surface-700">{t.type}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (t) => (
        <div>
          <p className="font-medium text-surface-900">${t.amount.toFixed(2)}</p>
          <p className="text-xs text-surface-500">Fee: ${t.fee.toFixed(2)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (t) => (
        <span className="text-surface-500 text-sm">{format(new Date(t.createdAt), 'MMM d, yyyy HH:mm')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Transactions</h1>
        <p className="text-surface-500 text-sm mt-1">View and manage all transactions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search transactions..." />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input w-full sm:w-auto"
          >
            <option value="">All types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="payment">Payment</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-full sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <DataTable<Transaction>
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={isLoading}
        keyExtractor={(t) => t.id}
      />
    </div>
  );
}
