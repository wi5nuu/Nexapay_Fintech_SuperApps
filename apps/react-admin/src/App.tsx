import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Users = lazy(() => import('@/pages/Users'));
const UserDetail = lazy(() => import('@/pages/UserDetail'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const Loans = lazy(() => import('@/pages/Loans'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const Roles = lazy(() => import('@/pages/Roles'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}

function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/roles" element={<Roles />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
