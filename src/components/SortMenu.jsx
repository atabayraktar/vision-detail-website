import { useEffect, useRef, useState } from 'react';
import usePresence from '@/hooks/usePresence';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

// No "Yeni Gelenler" option — there's no real recency signal in the data (every product's
// isNew is false, see src/data/products.js), so it was always a no-op sort.
// Stock availability is its own filter now (see StockFilter.jsx, next to this menu in the
// toolbar) rather than a sort order — a separate "in stock / out of stock" control instead
// of burying it as an "Önce Stokta Olanlar" sort option.
export const SORT_OPTIONS = [
  { value: 'name-asc', label: { tr: 'İsim A-Z', en: 'Name A-Z', de: 'Name A-Z' } },
  { value: 'name-desc', label: { tr: 'İsim Z-A', en: 'Name Z-A', de: 'Name Z-A' } },
];
const SORT_ARIA_LABEL = { tr: 'Sıralama', en: 'Sort', de: 'Sortierung' };

export default function SortMenu({ value, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, 350);
  useBodyScrollLock(open);
  const rootRef = useRef(null);
  const current = SORT_OPTIONS.find((opt) => opt.value === value) ?? SORT_OPTIONS[0];

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
    <div className="sort-menu" ref={rootRef}>
      <GlassSurface
        as="button"
        type="button"
        className="sort-menu__trigger glass-surface--tight"
        contentClassName="sort-menu__trigger-content"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{t(current.label)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="sort-menu__chevron">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>

      {mounted && (
        <GlassSurface
          as="ul"
          className={`sort-menu__list glass-surface--tight glass-surface--solid glass-surface--menu${closing ? ' is-closing' : ''}`}
          contentClassName="sort-menu__list-content"
          role="listbox"
          aria-label={t(SORT_ARIA_LABEL)}
        >
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`sort-menu__option${opt.value === value ? ' sort-menu__option--active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {t(opt.label)}
              </button>
            </li>
          ))}
        </GlassSurface>
      )}
    </div>
  );
}
