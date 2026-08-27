import { useTheme } from '@/context/ThemeContext';
import GlassSurface from './GlassSurface';

// variant="inline" renders a flat row instead of the glass pill trigger — used inside the
// mobile menu panel, matching LanguageSwitcher's own inline variant for that context.
export default function ThemeToggle({ variant = 'pill' }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  const icon = isDark ? (
    // Sun — shown in dark mode, tapping it switches to light.
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    // Moon — shown in light mode, tapping it switches to dark.
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 14.4A8.5 8.5 0 1 1 9.6 3.5a7 7 0 0 0 10.9 10.9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'inline') {
    return (
      <button type="button" className="theme-toggle theme-toggle--inline" onClick={toggle} aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}>
        {icon}
        <span>{isDark ? 'Aydınlık' : 'Karanlık'}</span>
      </button>
    );
  }

  return (
    <GlassSurface
      as="button"
      type="button"
      className="theme-toggle glass-surface--tight"
      contentClassName="theme-toggle__content"
      onClick={toggle}
      aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
    >
      {icon}
    </GlassSurface>
  );
}
