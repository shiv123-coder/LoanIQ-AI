import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n/config';

export type Language = "en" | "hi" | "mr";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();

  const handleSetLang = (l: Language) => {
    i18n.changeLanguage(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang: (i18n.language || 'en') as Language, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
