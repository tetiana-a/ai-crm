import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  const value = useMemo(() => {
    const currentTranslations = translations[language] || {};

    const tFunction = (key) => currentTranslations[key] || key;

    const t = new Proxy(tFunction, {
      get(_, prop) {
        return currentTranslations[prop] || String(prop);
      },
      apply(_, __, args) {
        const key = args[0];
        return currentTranslations[key] || key;
      },
    });

    return {
      language,
      setLanguage,
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}