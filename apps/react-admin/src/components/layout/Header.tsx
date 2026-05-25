import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-surface-200">
      <div className="flex items-center justify-between h-full px-6">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white',
              'bg-primary-600',
            )}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="text-sm">
              <p className="font-medium text-surface-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-surface-500 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="relative group">
            <button className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-surface-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
