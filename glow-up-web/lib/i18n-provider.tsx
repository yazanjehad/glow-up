'use client';

import { ReactNode, useEffect, useState } from 'react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

function updateDocumentDirection(lang: string) {
  const isRTL = lang.startsWith('ar');
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.classList.toggle('rtl', isRTL);
  document.documentElement.classList.toggle('ltr', !isRTL);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize i18n on client side
    const initI18n = async () => {
      if (!i18n.isInitialized) {
        await i18n.init();
      }
      const savedLanguage = localStorage.getItem('language') || 'ar';
      await i18n.changeLanguage(savedLanguage);
      updateDocumentDirection(savedLanguage);
      setReady(true);
    };

    initI18n();

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      updateDocumentDirection(lng);
    };
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (!ready) {
    // Return a loading state that doesn't use hooks from i18next
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
