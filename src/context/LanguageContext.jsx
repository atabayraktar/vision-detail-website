import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LANGUAGES = ['tr', 'en', 'de'];
const STORAGE_KEY = 'vd-lang';

const LanguageContext = createContext({
  lang: 'tr',
  setLang: () => {},
  t: (field) => (typeof field === 'string' ? field : field?.tr ?? ''),
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('tr');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (next) => {
    if (!LANGUAGES.includes(next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — language just won't persist across visits.
    }
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (field) => {
        if (typeof field === 'string') return field;
        if (!field) return '';
        return field[lang] ?? field.tr ?? '';
      },
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LANGUAGES };
