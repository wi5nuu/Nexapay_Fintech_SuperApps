import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';
import SearchInput from '@/components/common/SearchInput';
import api from '@/services/api';
import type { Loan, PaginatedResponse } from '@/types';
import type { Column } from '@/components/common/DataTable';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function Loans() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<Loan>>({
    queryKey: ['loans', page, search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/loans', {
        params: { page, limit: 10, search, status: statusFilter || undefined },
      });
      return res.data;
    },
    placeholderData: {
      data: Array.from({ length: 10 }).map((_, i) => ({
        id: `loan-${i}`,
        userId: `user-${i % 5}`,
        userEmail: `user${i % 5}@example.com`,
        userName: ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'][i % 5],
        amount: +(Math.random() * 100000).toFixed(2),
        currency: 'USD',
        interestRate: +(5 + Math.random() * 10).toFixed(1),
        termMonths: [6, 12, 18, 24, 36][i % 5],
        status: (['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'] as const)[i % 6],
        purpose: ['Business expansion', 'Home renovation', 'Debt consolidation', 'Education', 'Medical'][i % 5],
        createdAt: new Date(Date.now() - i * 86400000 * 15).toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      total: 156,
      page: 1,
      limit: 10,
      totalPages: 16,
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (loanId: string) => {
      await api.post(`/admin/loans/${loanId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan approved successfully');
      setModalOpen(false);
    },
    onError: () => toast.error('Failed to approve loan'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (loanId: string) => {
      await api.post(`/admin/loans/${loanId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan rejected');
      setModalOpen(false);
    },
    onError: () => toast.error('Failed to reject loan'),
  });

  const columns: Column<Loan>[] = [
    { key: 'id', header: 'ID', render: (l) => <span className="font-mono text-xs text-surface-500">{l.id.slice(0, 8)}</span> },
    {
      key: 'userName',
      header: 'User',
      render: (l) => (
        <div>
          <p className="font-medium text-surface-900">{l.userName}</p>
          <p className="text-xs text-surface-500">{l.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (l) => <span className="font-medium text-surface-900">${l.amount.toLocaleString()}</span>,
    },
    {
      key: 'interestRate',
      header: 'Rate',
      render: (l) => <span>{l.interestRate}%</span>,
    },
    {
      key: 'termMonths',
      header: 'Term',
      render: (l) => <span>{l.termMonths} months</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'createdAt',
      header: 'Applied',
      sortable: true,
      render: (l) => (
        <span className="text-surface-500 text-sm">{format(new Date(l.createdAt), 'MMM d, yyyy')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (l) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedLoan(l); setModalOpen(true); }}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Review
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Loans</h1>
        <p className="text-surface-500 text-sm mt-1">Manage loan applications</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search loans..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-full sm:w-44"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="defaulted">Defaulted</option>
        </select>
      </div>

      <DataTable<Loan>
        columns={columns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        loading={isLoading}
        keyExtractor={(l) => l.id}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Review Loan Application"
        size="lg"
      >
        {selectedLoan && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Applicant</p>
                <p className="text-sm font-medium mt-0.5">{selectedLoan.userName}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Email</p>
                <p className="text-sm mt-0.5">{selectedLoan.userEmail}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Amount</p>
                <p className="text-lg font-bold text-surface-900 mt-0.5">${selectedLoan.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Interest Rate</p>
                <p className="text-sm mt-0.5">{selectedLoan.interestRate}%</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Term</p>
                <p className="text-sm mt-0.5">{selectedLoan.termMonths} months</p>
              </div>
              <div>
                <p className="text-xs text-surface-500 uppercase font-medium">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedLoan.status} /></div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-surface-500 uppercase font-medium">Purpose</p>
                <p className="text-sm mt-0.5">{selectedLoan.purpose || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
              {selectedLoan.status === 'pending' && (
                <>
                  <button
                    onClick={() => rejectMutation.mutate(selectedLoan.id)}
                    disabled={rejectMutation.isPending}
                    className="btn-danger"
                  >
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(selectedLoan.id)}
                    disabled={approveMutation.isPending}
                    className="btn-primary"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </>
              )}
              {(selectedLoan.status === 'approved' || selectedLoan.status === 'rejected') && (
                <p className="text-sm text-surface-500">This loan has already been processed.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
