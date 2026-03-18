import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation resources
import enCommon from '../locales/en/common.json';
import enNavigation from '../locales/en/navigation.json';
import enMaps from '../locales/en/maps.json';
import enDashboard from '../locales/en/dashboard.json';
import enErrors from '../locales/en/errors.json';
import enTradearea from '../locales/en/tradearea.json';
import enBackup from '../locales/en/backup.json';
import enImage from '../locales/en/image.json';

import thCommon from '../locales/th/common.json';
import thNavigation from '../locales/th/navigation.json';
import thMaps from '../locales/th/maps.json';
import thDashboard from '../locales/th/dashboard.json';
import thErrors from '../locales/th/errors.json';
import thTradearea from '../locales/th/tradearea.json';
import thBackup from '../locales/th/backup.json';
import thImage from '../locales/th/image.json';

import kmCommon from '../locales/km/common.json';
import kmNavigation from '../locales/km/navigation.json';
import kmMaps from '../locales/km/maps.json';
import kmDashboard from '../locales/km/dashboard.json';
import kmErrors from '../locales/km/errors.json';
import kmTradearea from '../locales/km/tradearea.json';
import kmBackup from '../locales/km/backup.json';
import kmImage from '../locales/km/image.json';

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    maps: enMaps,
    dashboard: enDashboard,
    errors: enErrors,
    tradearea: enTradearea,
    backup: enBackup,
    image: enImage,
  },
  th: {
    common: thCommon,
    navigation: thNavigation,
    maps: thMaps,
    dashboard: thDashboard,
    errors: thErrors,
    tradearea: thTradearea,
    backup: thBackup,
    image: thImage,
  },
  km: {
    common: kmCommon,
    navigation: kmNavigation,
    maps: kmMaps,
    dashboard: kmDashboard,
    errors: kmErrors,
    tradearea: kmTradearea,
    backup: kmBackup,
    image: kmImage,
  },
};

// Get saved language from localStorage (will be synced with store)
const getInitialLanguage = () => {
  const stored = localStorage.getItem('i18nextLng');
  return stored || 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [
    'common',
    'navigation',
    'maps',
    'dashboard',
    'errors',
    'tradearea',
    'backup',
    'image',
  ],

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  react: {
    useSuspense: false,
  },

  debug: import.meta.env.DEV,
});

export default i18n;
