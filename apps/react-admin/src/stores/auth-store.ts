import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RoleType } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const rolePermissions: Record<RoleType, string[]> = {
  super_admin: ['*'],
  admin: ['users.read', 'users.write', 'transactions.read', 'transactions.write', 'loans.read', 'loans.write', 'products.read', 'products.write', 'audit.read', 'roles.read', 'roles.write'],
  moderator: ['users.read', 'users.write', 'transactions.read', 'loans.read', 'loans.write', 'audit.read'],
  support: ['users.read', 'transactions.read', 'loans.read'],
  viewer: ['users.read', 'transactions.read', 'loans.read', 'products.read', 'audit.read'],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => {
        set({ user });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        const perms = rolePermissions[user.role];
        if (!perms) return false;
        return perms.includes('*') || perms.includes(permission);
      },
    }),
    {
      name: 'nexapay-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
