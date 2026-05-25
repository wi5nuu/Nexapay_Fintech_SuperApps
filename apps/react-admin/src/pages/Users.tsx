import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import SearchInput from '@/components/common/SearchInput';
import api from '@/services/api';
import type { User, PaginatedResponse } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { format } from 'date-fns';

export default function Users() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', page, search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { page, limit: 10, search, status: statusFilter || undefined },
      });
      return res.data;
    },
    placeholderData: {
      data: Array.from({ length: 10 }).map((_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        phone: `+1${String(1000000000 + i)}`,
        firstName: ['John', 'Jane', 'Bob', 'Alice', 'Charlie'][i % 5],
        lastName: ['Smith', 'Doe', 'Johnson', 'Brown', 'Wilson'][i % 5],
        status: (['active', 'inactive', 'suspended', 'pending'] as const)[i % 4],
        kycStatus: (['unverified', 'pending', 'verified', 'rejected'] as const)[i % 4],
        role: (['super_admin', 'admin', 'moderator', 'support', 'viewer'] as const)[i % 5],
        createdAt: new Date(Date.now() - i * 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: i % 3 !== 0,
        phoneVerified: i % 2 === 0,
        twoFactorEnabled: i % 4 === 0,
      })),
      total: 248,
      page: 1,
      limit: 10,
      totalPages: 25,
    },
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-surface-900">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-surface-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span className="capitalize text-sm text-surface-600">{user.role.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (user) => <StatusBadge status={user.kycStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (user) => (
        <span className="text-surface-500 text-sm">{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Users</h1>
        <p className="text-surface-500 text-sm mt-1">Manage all platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-full sm:w-44"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <DataTable<User>
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={isLoading}
        keyExtractor={(u) => u.id}
        onRowClick={(u) => navigate(`/users/${u.id}`)}
      />
    </div>
  );
}
