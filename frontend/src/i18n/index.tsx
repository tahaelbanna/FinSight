import React, { createContext, useContext, useMemo, useState } from 'react';
import { en, type Translations } from './en';
import { ar } from './ar';

type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface I18nContextValue {
  language: Language;
  direction: Direction;
  t: (key: string, fallback?: string) => string;
  setLanguage: (lang: Language) => void;
}

const translations: Record<Language, Translations> = {
  en,
  ar,
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // English only for MVP launch
  const [language, setLanguageState] = useState<Language>('en');

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  };

  const t = useMemo(() => {
    return (path: string, fallback?: string): string => {
      const keys = path.split('.');
      let current: any = translations[language];

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return fallback || path;
        }
      }

      return typeof current === 'string' ? current : fallback || path;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      direction,
      t,
      setLanguage,
    }),
    [language, direction, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
