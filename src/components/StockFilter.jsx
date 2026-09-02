import { useEffect, useRef, useState } from 'react';
import usePresence from '@/hooks/usePresence';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

// Separate from SortMenu on purpose (see SortMenu.jsx) — stock availability is a filter
// (narrows the list), not a sort order, so it gets its own small glass dropdown sitting
// right next to "İsim A-Z" instead of living inside the sort options.
export const STOCK_OPTIONS = [
  { value: null, label: { tr: 'Tümü', en: 'All', de: 'Alle' } },
  { value: 'in', label: { tr: 'Stokta Var', en: 'In Stock', de: 'Auf Lager' } },
  { value: 'out', label: { tr: 'Stokta Yok', en: 'Out of Stock', de: 'Nicht auf Lager' } },
];
const STOCK_ARIA_LABEL = { tr: 'Stok durumu', en: 'Stock status', de: 'Lagerstatus' };

export default function StockFilter({ value, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  // 220ms = GlassSurface.scss's $peel-out plus a frame of slack — keep them in step.
  const { mounted, closing } = usePresence(open, 220);
  useBodyScrollLock(open);
  const rootRef = useRef(null);
  const current = STOCK_OPTIONS.find((opt) => opt.value === value) ?? STOCK_OPTIONS[0];

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
    <div className="stock-filter" ref={rootRef}>
      <GlassSurface
        as="button"
        type="button"
        className="stock-filter__trigger glass-surface--tight"
        contentClassName="stock-filter__trigger-content"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{t(current.label)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="stock-filter__chevron">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>

      {mounted && (
        <GlassSurface
          as="ul"
          className={`stock-filter__list glass-surface--peel glass-surface--tight glass-surface--solid glass-surface--menu${closing ? ' is-closing' : ''}`}
          contentClassName="stock-filter__list-content"
          role="listbox"
          aria-label={t(STOCK_ARIA_LABEL)}
        >
          {STOCK_OPTIONS.map((opt) => (
            <li key={opt.label.tr} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`stock-filter__option${opt.value === value ? ' stock-filter__option--active' : ''}`}
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
