import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEMES = ['light', 'dark'];
const STORAGE_KEY = 'vd-theme';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
});

// The <html data-theme> attribute is what CSS actually reacts to (see _tokens.scss's
// :root[data-theme='dark'] overrides). A tiny inline script in _document.jsx sets it
// BEFORE hydration from the same localStorage key, so there's no flash of the wrong theme
// on load for a returning dark-mode visitor — this effect just keeps React's own state in
// sync with whatever that script (or a later toggle) already put on the element.
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored && THEMES.includes(stored) ? stored : document.documentElement.getAttribute('data-theme') || 'light';
    setThemeState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (next) => {
    if (!THEMES.includes(next)) return;
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — theme just won't persist across visits.
    }
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES };
