import { create } from 'zustand';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  notifications: Notification[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    setTimeout(() => {
      get().removeNotification(id);
    }, notification.duration ?? 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));
