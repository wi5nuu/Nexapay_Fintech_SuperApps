import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import clsx from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Transactions', path: '/transactions', icon: '💳' },
  { label: 'Loans', path: '/loans', icon: '💰' },
  { label: 'Audit Logs', path: '/audit-logs', icon: '📋' },
  { label: 'Roles', path: '/roles', icon: '🔐' },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const location = useLocation();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-surface-200 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          N
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-surface-900 whitespace-nowrap">
            NexaPay Admin
          </span>
        )}
      </div>

      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
              )}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
