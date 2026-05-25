import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/services/api';
import ChartCard from '@/components/common/ChartCard';
import StatusBadge from '@/components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import type { DashboardStats } from '@/types';

function StatCard({ label, value, change, icon }: { label: string; value: string; change?: string; icon: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
          {change && (
            <p className="text-xs text-emerald-600 mt-1">↑ {change} from last month</p>
          )}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
    // Placeholder data for development
    placeholderData: {
      totalUsers: 12483,
      activeUsers: 8756,
      totalTransactions: 45231,
      totalRevenue: 2847500,
      pendingLoans: 234,
      activeLoans: 1890,
      userGrowth: Array.from({ length: 12 }).map((_, i) => ({
        date: `2024-${String(i + 1).padStart(2, '0')}`,
        count: Math.floor(8000 + Math.random() * 4000),
      })),
      revenueData: Array.from({ length: 12 }).map((_, i) => ({
        date: `2024-${String(i + 1).padStart(2, '0')}`,
        amount: Math.floor(150000 + Math.random() * 200000),
      })),
      recentTransactions: Array.from({ length: 10 }).map((_, i) => ({
        id: `txn-${i}`,
        userId: `user-${i}`,
        userEmail: `user${i}@example.com`,
        userName: `User ${i}`,
        type: ['deposit', 'withdrawal', 'transfer', 'payment'][Math.floor(Math.random() * 4)] as DashboardStats['recentTransactions'][0]['type'],
        amount: Math.floor(Math.random() * 50000) / 100,
        currency: 'USD',
        status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)] as DashboardStats['recentTransactions'][0]['status'],
        reference: `REF-${String(i).padStart(6, '0')}`,
        fee: Math.random() * 5,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 w-24 bg-surface-200 rounded mb-3" />
              <div className="h-8 w-32 bg-surface-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} change="12.5%" icon="👥" />
        <StatCard label="Active Users" value={stats.activeUsers.toLocaleString()} change="8.2%" icon="✅" />
        <StatCard label="Total Transactions" value={stats.totalTransactions.toLocaleString()} change="23.1%" icon="💳" />
        <StatCard label="Total Revenue" value={`$${(stats.totalRevenue / 1000).toFixed(0)}k`} change="15.3%" icon="💰" />
        <StatCard label="Pending Loans" value={stats.pendingLoans.toLocaleString()} icon="⏳" />
        <StatCard label="Active Loans" value={stats.activeLoans.toLocaleString()} change="5.7%" icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Overview" subtitle="Monthly revenue in USD">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="User Growth" subtitle="New users per month">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {stats.recentTransactions.slice(0, 5).map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-surface-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/transactions')}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-surface-900">{tx.userName}</p>
                      <p className="text-xs text-surface-500">{tx.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-surface-700">{tx.type}</td>
                  <td className="px-4 py-3 font-medium">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
