import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    dashboard: 'Dashboard',
    profile: 'Profile'
  },
  id: {
    dashboard: 'Beranda',
    profile: 'Profil'
  }
};

export const i18n = createI18n({
  locale: 'id',
  messages
});
