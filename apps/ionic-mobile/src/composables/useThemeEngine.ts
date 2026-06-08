import { ref, watchEffect } from 'vue';

export type AppTheme = 'light' | 'dark' | 'premium' | 'high-contrast';

interface ThemeDefinition {
  primary: string;
  secondary: string;
  tertiary: string;
  success: string;
  warning: string;
  danger: string;
  dark: string;
  medium: string;
  light: string;
  background: string;
  text: string;
}

const themes: Record<AppTheme, Partial<ThemeDefinition>> = {
  light: {
    primary: '#3880ff',
    background: '#ffffff',
    text: '#000000',
  },
  dark: {
    primary: '#428cff',
    background: '#121212',
    text: '#ffffff',
  },
  premium: {
    primary: '#8a2be2',
    secondary: '#ffd700',
    background: '#0f0c29',
    text: '#f8f8f8',
  },
  'high-contrast': {
    primary: '#ffff00',
    background: '#000000',
    text: '#ffffff',
  }
};

/**
 * Enterprise Theme Engine for NexaPay.
 * Manages runtime CSS variable injection for dynamic branding.
 */
export function useThemeEngine() {
  const currentTheme = ref<AppTheme>((localStorage.getItem('nexapay_theme') as AppTheme) || 'light');

  const applyTheme = (theme: AppTheme) => {
    const root = document.documentElement;
    const definition = themes[theme];

    Object.entries(definition).forEach(([key, value]) => {
      root.style.setProperty(`--ion-color-${key}`, value as string);
      if (key === 'background') root.style.setProperty('--ion-background-color', value as string);
      if (key === 'text') root.style.setProperty('--ion-text-color', value as string);
    });

    currentTheme.value = theme;
    localStorage.setItem('nexapay_theme', theme);
  };

  // Auto-apply theme on initialization
  watchEffect(() => {
    applyTheme(currentTheme.value);
  });

  return {
    currentTheme,
    applyTheme,
  };
}
