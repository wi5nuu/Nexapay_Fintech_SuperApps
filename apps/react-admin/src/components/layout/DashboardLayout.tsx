import { useEffect } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '@/stores/auth-store'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('nexapay_admin_token')
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
