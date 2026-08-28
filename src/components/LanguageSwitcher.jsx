import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, useLanguage } from '@/context/LanguageContext';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';

const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch' };

// Real small flags, not emoji (emoji renders inconsistently across platforms and isn't a
// real icon per the brand's anti-generic rule). Square viewBox corners are fine as-is —
// the visible rounding comes from the wrapping .lang-switch__flag span's
// border-radius + overflow:hidden in CSS, so no per-flag clipPath/id bookkeeping is
// needed even though the same flag element renders several times on the page (trigger +
// every dropdown row + the mobile inline row).
const FLAGS = {
  tr: (
    <svg viewBox="0 0 36 24" aria-hidden="true">
      <rect width="36" height="24" fill="#E30A17" />
      <circle cx="14.5" cy="12" r="6.2" fill="#fff" />
      <circle cx="16.3" cy="12" r="5" fill="#E30A17" />
      <path d="M21.6 9.6l.62 1.9h2l-1.62 1.18.62 1.9-1.62-1.18-1.62 1.18.62-1.9L19 11.5h2z" fill="#fff" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 36 24" aria-hidden="true">
      <rect width="36" height="24" fill="#00247d" />
      <path d="M0 0L36 24M36 0L0 24" stroke="#fff" strokeWidth="4.4" />
      <path d="M0 0L36 24M36 0L0 24" stroke="#cf142b" strokeWidth="1.6" />
      <path d="M18 0V24M0 12H36" stroke="#fff" strokeWidth="7" />
      <path d="M18 0V24M0 12H36" stroke="#cf142b" strokeWidth="3" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 36 24" aria-hidden="true">
      <rect width="36" height="8" fill="#1a1a1a" />
      <rect y="8" width="36" height="8" fill="#dd0000" />
      <rect y="16" width="36" height="8" fill="#ffce00" />
    </svg>
  ),
};

// variant="inline" renders a flat row instead of a popover — used inside the mobile menu
// panel, which already clips overflow for its own glass corners and has room to spare.
export default function LanguageSwitcher({ variant = 'dropdown' }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, 350);
  const rootRef = useRef(null);

  if (variant === 'inline') {
    return (
      <ul className="lang-switch lang-switch--inline" role="listbox" aria-label="Dil seçimi / Language / Sprache">
        {LANGUAGES.map((code) => (
          <li key={code} role="option" aria-selected={code === lang}>
            <button
              type="button"
              className={`lang-switch__option${code === lang ? ' lang-switch__option--active' : ''}`}
              onClick={() => setLang(code)}
            >
              <span className="lang-switch__flag">{FLAGS[code]}</span>
              <span className="lang-switch__option-code">{code.toUpperCase()}</span>
              <span className="lang-switch__option-name">{LANGUAGE_NAMES[code]}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="lang-switch" ref={rootRef}>
      <GlassSurface
        as="button"
        type="button"
        className="lang-switch__trigger glass-surface--tight"
        contentClassName="lang-switch__trigger-content"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="lang-switch__flag">{FLAGS[lang]}</span>
        <span>{lang.toUpperCase()}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="lang-switch__chevron">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>

      {mounted && (
        <GlassSurface
          as="ul"
          className={`lang-switch__menu glass-surface--tight glass-surface--solid glass-surface--menu${closing ? ' is-closing' : ''}`}
          contentClassName="lang-switch__menu-content"
          role="listbox"
          aria-label="Dil seçimi / Language / Sprache"
        >
          {LANGUAGES.map((code) => (
            <li key={code} role="option" aria-selected={code === lang}>
              <button
                type="button"
                className={`lang-switch__option${code === lang ? ' lang-switch__option--active' : ''}`}
                onClick={() => {
                  setLang(code);
                  setOpen(false);
                }}
              >
                <span className="lang-switch__flag">{FLAGS[code]}</span>
                <span className="lang-switch__option-code">{code.toUpperCase()}</span>
                <span className="lang-switch__option-name">{LANGUAGE_NAMES[code]}</span>
              </button>
            </li>
          ))}
        </GlassSurface>
      )}
    </div>
  );
}
