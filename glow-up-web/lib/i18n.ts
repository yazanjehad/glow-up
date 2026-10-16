import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslations from '@/lib/locales/ar.json';
import enTranslations from '@/lib/locales/en.json';

// Always keep translation bundles in sync with the imported JSON.
// This matters during dev/HMR: i18next won't re-init if it's already initialized.
const upsertBundles = () => {
  // ns: "translation" because we store everything under "translation".
  i18n.addResourceBundle('ar', 'translation', arTranslations, true, true);
  i18n.addResourceBundle('en', 'translation', enTranslations, true, true);
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ar: { translation: arTranslations },
        en: { translation: enTranslations },
      },
      lng: 'ar',
      fallbackLng: 'ar',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  // Handle RTL/LTR direction (client-side only)
  const updateDirection = (lng: string) => {
    if (typeof document !== 'undefined') {
      const dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
      localStorage.setItem('language', lng);
    }
  };

  i18n.on('languageChanged', updateDirection);

  // Set initial direction on first load
  if (typeof document !== 'undefined') {
    const savedLang = localStorage.getItem('language') || 'ar';
    const dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = savedLang;
  }
}

upsertBundles();

export default i18n;
