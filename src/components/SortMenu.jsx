import { useEffect, useRef, useState } from 'react';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';

// No "Yeni Gelenler" option — there's no real recency signal in the data (every product's
// isNew is false, see src/data/products.js), so it was always a no-op sort.
// "Önce Stokta Olanlar" sorts in-stock products first (out-of-stock cards render dimmed
// and unlinked — see ProductCard.jsx), with name A-Z as the tiebreak within each group.
export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'İsim A-Z' },
  { value: 'name-desc', label: 'İsim Z-A' },
  { value: 'stock', label: 'Önce Stokta Olanlar' },
];

export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, 350);
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
        <span>{current.label}</span>
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
          aria-label="Sıralama"
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
                {opt.label}
              </button>
            </li>
          ))}
        </GlassSurface>
      )}
    </div>
  );
}
