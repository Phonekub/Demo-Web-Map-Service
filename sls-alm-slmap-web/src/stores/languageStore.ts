import { create } from 'zustand';
import i18n from '@/i18n/config';
import { devtools } from 'zustand/middleware';

type Language = 'en' | 'th' | 'km';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  initLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  devtools(
    set => ({
      language: 'th',

      setLanguage: (lang: Language) => {
        set({ language: lang });
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
      },

      initLanguage: () => {
        const stored = localStorage.getItem('i18nextLng') as Language | null;
        const lang = stored || 'th';
        set({ language: lang });
        i18n.changeLanguage(lang);
      },
    }),
    {
      name: 'language-storage',
      enabled: import.meta.env.DEV,
    }
  )
);

// Typed getter for non-React modules to read current language synchronously
export const getLanguage = (): Language => {
  return useLanguageStore.getState().language || 'en';
};
