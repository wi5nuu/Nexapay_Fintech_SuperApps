import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'

interface Notification {
  id: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
  topic: string
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=5')
      setNotifications(res.data.data ?? [])
      setUnreadCount(res.data.data?.filter((n: Notification) => !n.readAt).length ?? 0)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silently fail
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-surface-200 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
              <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
              <button
                onClick={() => navigate('/notifications')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                View All
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-surface-400 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-50 border-b border-surface-100 last:border-0 transition-colors ${
                      !n.readAt ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-surface-900 truncate">{n.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {new Date(n.createdAt).toRelativeTimeString?.() ??
                        new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
