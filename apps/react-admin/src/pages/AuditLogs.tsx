import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import SearchInput from '@/components/common/SearchInput';
import api from '@/services/api';
import type { AuditLog, PaginatedResponse } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ['audit-logs', page, search, actionFilter],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', {
        params: { page, limit: 10, search, action: actionFilter || undefined },
      });
      return res.data;
    },
    placeholderData: {
      data: Array.from({ length: 10 }).map((_, i) => ({
        id: `audit-${i}`,
        action: (['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'suspend'] as const)[i % 8],
        actorId: `actor-${i % 3}`,
        actorEmail: `admin${i % 3}@nexapay.com`,
        actorName: ['Alice Admin', 'Bob Manager', 'Charlie Support'][i % 3],
        targetType: ['user', 'transaction', 'loan', 'product'][i % 4],
        targetId: `target-${i}`,
        changes: i % 2 === 0 ? { status: { old: 'pending', new: 'active' } } : undefined,
        ip: `192.168.1.${i + 1}`,
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      })),
      total: 2340,
      page: 1,
      limit: 10,
      totalPages: 234,
    },
  });

  const actionColors: Record<string, string> = {
    create: 'text-emerald-600 bg-emerald-50',
    update: 'text-blue-600 bg-blue-50',
    delete: 'text-red-600 bg-red-50',
    login: 'text-primary-600 bg-primary-50',
    logout: 'text-surface-600 bg-surface-100',
    approve: 'text-emerald-600 bg-emerald-50',
    reject: 'text-red-600 bg-red-50',
    suspend: 'text-amber-600 bg-amber-50',
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (log) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${actionColors[log.action] || 'text-surface-600 bg-surface-100'}`}>
          {log.action}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (log) => (
        <div>
          <p className="font-medium text-surface-900">{log.actorName}</p>
          <p className="text-xs text-surface-500">{log.actorEmail}</p>
        </div>
      ),
    },
    { key: 'targetType', header: 'Target', render: (log) => <span className="capitalize text-surface-700">{log.targetType}</span> },
    {
      key: 'targetId',
      header: 'Target ID',
      render: (log) => <span className="font-mono text-xs text-surface-500">{log.targetId}</span>,
    },
    { key: 'ip', header: 'IP Address', render: (log) => <span className="font-mono text-xs text-surface-500">{log.ip}</span> },
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (log) => (
        <span className="text-surface-500 text-sm">{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Audit Logs</h1>
        <p className="text-surface-500 text-sm mt-1">Track all system activity</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search audit logs..." />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="input w-full sm:w-44"
        >
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="approve">Approve</option>
          <option value="reject">Reject</option>
          <option value="suspend">Suspend</option>
        </select>
      </div>

      <DataTable<AuditLog>
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={isLoading}
        keyExtractor={(l) => l.id}
      />
    </div>
  );
}
