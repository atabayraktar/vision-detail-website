import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

const COLLAPSED_COUNT = 6;

export default function FilterPanel({ categories, active, onSelect, className = '' }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  // A deep link (e.g. the homepage's category cards, or a shared URL) can land on a
  // category outside the first 6 — without this, the active filter is applied correctly
  // but invisible, sitting collapsed behind "daha fazla göster" with no visual indication
  // of which category is actually selected.
  useEffect(() => {
    if (!active) return;
    const activeIndex = categories.findIndex((cat) => cat.slug === active);
    if (activeIndex >= COLLAPSED_COUNT) setExpanded(true);
  }, [active, categories]);

  const visible = expanded ? categories : categories.slice(0, COLLAPSED_COUNT);
  const hasMore = categories.length > COLLAPSED_COUNT;

  return (
    <div className={`filter-panel ${className}`}>
      <div className="filter-panel__head">
        <h2 className="filter-panel__title">Kategoriler</h2>
        {active && (
          <button type="button" className="filter-panel__reset" onClick={() => onSelect(null)}>
            Sıfırla
          </button>
        )}
      </div>

      <ul className="filter-panel__list">
        <li>
          <button
            type="button"
            className={`filter-panel__item${!active ? ' filter-panel__item--active' : ''}`}
            onClick={() => onSelect(null)}
          >
            Tümü
          </button>
        </li>
        {visible.map((cat) => (
          <li key={cat.slug}>
            <button
              type="button"
              className={`filter-panel__item${active === cat.slug ? ' filter-panel__item--active' : ''}`}
              onClick={() => onSelect(cat.slug)}
            >
              {t(cat.label)}
            </button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button type="button" className="filter-panel__more" onClick={() => setExpanded((e) => !e)}>
          {expanded ? 'Daha az göster' : 'Daha fazla göster'}
        </button>
      )}
    </div>
  );
}

// Mobile: same list rendered inside a full-screen GlassSurface sheet — see FilterPanel.scss
// and ProductListing usage for how the two variants are toggled.
export function FilterPanelSheet({ open, onClose, ...props }) {
  if (!open) return null;
  return (
    <div className="filter-sheet__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <GlassSurface as="div" className="filter-sheet glass-surface--calm" contentClassName="filter-sheet__content">
        <div className="filter-sheet__head">
          <span className="filter-sheet__heading">Filtrele</span>
          <button type="button" className="filter-sheet__close" onClick={onClose} aria-label="Kapat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <FilterPanel {...props} />
        <GlassSurface
          as="button"
          type="button"
          className="filter-sheet__apply glass-surface--tight glass-surface--solid"
          contentClassName="filter-sheet__apply-content"
          onClick={onClose}
        >
          <span className="btn-glass__label">Uygula</span>
        </GlassSurface>
      </GlassSurface>
    </div>
  );
}
