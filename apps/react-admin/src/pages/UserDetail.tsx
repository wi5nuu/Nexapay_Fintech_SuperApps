import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/common/DataTable';
import api from '@/services/api';
import type { User, Transaction, Loan } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { format } from 'date-fns';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'transactions' | 'loans'>('transactions');

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}`);
      return res.data;
    },
    placeholderData: {
      id: id ?? '',
      email: 'john.smith@example.com',
      phone: '+1 234 567 8900',
      firstName: 'John',
      lastName: 'Smith',
      status: 'active',
      kycStatus: 'verified',
      role: 'admin',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-12-01T10:00:00Z',
      lastLogin: '2024-12-20T14:30:00Z',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
    },
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['user-transactions', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}/transactions`);
      return res.data;
    },
    placeholderData: Array.from({ length: 5 }).map((_, i) => ({
      id: `txn-${i}`,
      userId: id ?? '',
      userEmail: 'john.smith@example.com',
      userName: 'John Smith',
      type: (['deposit', 'withdrawal', 'transfer', 'payment'] as const)[i % 4],
      amount: Math.random() * 5000,
      currency: 'USD',
      status: (['completed', 'pending', 'failed'] as const)[i % 3],
      reference: `REF-${String(i).padStart(6, '0')}`,
      fee: Math.random() * 10,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  });

  const { data: loans } = useQuery<Loan[]>({
    queryKey: ['user-loans', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}/loans`);
      return res.data;
    },
    placeholderData: Array.from({ length: 3 }).map((_, i) => ({
      id: `loan-${i}`,
      userId: id ?? '',
      userEmail: 'john.smith@example.com',
      userName: 'John Smith',
      amount: Math.random() * 50000,
      currency: 'USD',
      interestRate: 5.5 + i * 0.5,
      termMonths: 12 + i * 6,
      status: (['active', 'completed', 'pending'] as const)[i % 3],
      purpose: ['Business expansion', 'Home renovation', 'Debt consolidation'][i],
      createdAt: new Date(Date.now() - i * 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-surface-200 rounded" />
              <div className="h-4 w-24 bg-surface-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-500">User not found</p>
      </div>
    );
  }

  const txnColumns: Column<Transaction>[] = [
    { key: 'reference', header: 'Reference', render: (t) => <span className="font-mono text-xs">{t.reference}</span> },
    { key: 'type', header: 'Type', render: (t) => <span className="capitalize">{t.type}</span> },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (t) => <span className="font-medium">${t.amount.toFixed(2)}</span>,
    },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'createdAt',
      header: 'Date',
      render: (t) => <span className="text-surface-500 text-sm">{format(new Date(t.createdAt), 'MMM d, yyyy')}</span>,
    },
  ];

  const loanColumns: Column<Loan>[] = [
    { key: 'id', header: 'ID', render: (l) => <span className="font-mono text-xs">{l.id.slice(0, 8)}</span> },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (l) => <span className="font-medium">${l.amount.toFixed(2)}</span>,
    },
    { key: 'interestRate', header: 'Rate', render: (l) => <span>{l.interestRate}%</span> },
    { key: 'termMonths', header: 'Term', render: (l) => <span>{l.termMonths}mo</span> },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-surface-900">{user.firstName} {user.lastName}</h1>
                <p className="text-surface-500 text-sm">{user.email} · {user.phone}</p>
              </div>
              <StatusBadge status={user.status} size="md" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Role</p>
                <p className="text-sm font-medium capitalize mt-0.5">{user.role.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">KYC Status</p>
                <div className="mt-0.5"><StatusBadge status={user.kycStatus} /></div>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Joined</p>
                <p className="text-sm font-medium mt-0.5">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Last Login</p>
                <p className="text-sm font-medium mt-0.5">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-emerald-500' : 'bg-surface-300'}`} />
                <span className="text-xs text-surface-600">Email {user.emailVerified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.phoneVerified ? 'bg-emerald-500' : 'bg-surface-300'}`} />
                <span className="text-xs text-surface-600">Phone {user.phoneVerified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user.twoFactorEnabled ? 'bg-emerald-500' : 'bg-surface-300'}`} />
                <span className="text-xs text-surface-600">2FA {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
              }`}
            >
              Transactions ({transactions?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'loans'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100'
              }`}
            >
              Loans ({loans?.length ?? 0})
            </button>
          </div>
        </div>
        <div className="card-body">
          {activeTab === 'transactions' ? (
            <DataTable<Transaction>
              columns={txnColumns}
              data={transactions ?? []}
              keyExtractor={(t) => t.id}
            />
          ) : (
            <DataTable<Loan>
              columns={loanColumns}
              data={loans ?? []}
              keyExtractor={(l) => l.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
