import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import usePresence from '@/hooks/usePresence';
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

  // Split into an always-visible base list and a collapsible "extra" tail instead of
  // slicing one array — the base items need to stay mounted and static while only the
  // extra tail animates open/closed (see the grid-rows 0fr/1fr technique in FilterPanel.scss).
  const base = categories.slice(0, COLLAPSED_COUNT);
  const extra = categories.slice(COLLAPSED_COUNT);
  const hasMore = extra.length > 0;

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
        {base.map((cat) => (
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
        <div className={`filter-panel__extra${expanded ? ' filter-panel__extra--open' : ''}`}>
          <ul className="filter-panel__list filter-panel__extra-list">
            {extra.map((cat) => (
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
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className={`filter-panel__more${expanded ? ' filter-panel__more--open' : ''}`}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Daha az göster' : 'Daha fazla göster'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="filter-panel__more-chevron">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Mobile: same list rendered inside a full-screen GlassSurface sheet — see FilterPanel.scss
// and ProductListing usage for how the two variants are toggled.
export function FilterPanelSheet({ open, onClose, ...props }) {
  const { mounted, closing } = usePresence(open, 350);
  if (!mounted) return null;
  return (
    <div
      className={`filter-sheet__backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* --solid — the plain --calm tint read as too faint/washed-out to read the category
          list against a busy product grid behind it (user-reported "çok silik"). */}
      <GlassSurface
        as="div"
        className={`filter-sheet glass-surface--calm glass-surface--solid glass-surface--menu${closing ? ' is-closing' : ''}`}
        contentClassName="filter-sheet__content"
      >
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
