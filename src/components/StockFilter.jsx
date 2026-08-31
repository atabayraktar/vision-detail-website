import { useEffect, useRef, useState } from 'react';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';

// Separate from SortMenu on purpose (see SortMenu.jsx) — stock availability is a filter
// (narrows the list), not a sort order, so it gets its own small glass dropdown sitting
// right next to "İsim A-Z" instead of living inside the sort options.
export const STOCK_OPTIONS = [
  { value: null, label: 'Tümü' },
  { value: 'in', label: 'Stokta Var' },
  { value: 'out', label: 'Stokta Yok' },
];

export default function StockFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, 350);
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
        <span>{current.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="stock-filter__chevron">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>

      {mounted && (
        <GlassSurface
          as="ul"
          className={`stock-filter__list glass-surface--tight glass-surface--solid glass-surface--menu${closing ? ' is-closing' : ''}`}
          contentClassName="stock-filter__list-content"
          role="listbox"
          aria-label="Stok durumu"
        >
          {STOCK_OPTIONS.map((opt) => (
            <li key={opt.label} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={`stock-filter__option${opt.value === value ? ' stock-filter__option--active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </GlassSurface>
      )}
    </div>
  );
}
