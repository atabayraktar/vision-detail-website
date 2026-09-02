import { useLanguage } from '@/context/LanguageContext';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import GlassSurface from './GlassSurface';

const TEXT = {
  categories: { tr: 'Kategoriler', en: 'Categories', de: 'Kategorien' },
  reset: { tr: 'Sıfırla', en: 'Reset', de: 'Zurücksetzen' },
  all: { tr: 'Tümü', en: 'All', de: 'Alle' },
  filter: { tr: 'Filtrele', en: 'Filter', de: 'Filtern' },
  close: { tr: 'Kapat', en: 'Close', de: 'Schließen' },
};

export default function FilterPanel({ categories, active, onSelect, className = '' }) {
  const { t } = useLanguage();

  return (
    <div className={`filter-panel ${className}`}>
      <div className="filter-panel__head">
        <h2 className="filter-panel__title">{t(TEXT.categories)}</h2>
        {active && (
          <button type="button" className="filter-panel__reset" onClick={() => onSelect(null)}>
            {t(TEXT.reset)}
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
            {t(TEXT.all)}
          </button>
        </li>
        {categories.map((cat) => (
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
  );
}

// Mobile: same list rendered inside a full-screen GlassSurface sheet — see FilterPanel.scss
// and ProductListing usage for how the two variants are toggled. Picking a category closes
// the sheet immediately (like a native dropdown) instead of requiring a separate "Uygula"
// tap — the sheet only ever holds one control (the category list), so there's nothing left
// to "apply" once a choice is made.
export function FilterPanelSheet({ open, onClose, onSelect, ...props }) {
  const { t } = useLanguage();
  useBodyScrollLock(open);
  const handleSelect = (value) => {
    onSelect(value);
    onClose();
  };
  // Always mounted, shown/hidden via opacity + a class transition — same pattern (and same
  // reasoning) as Header.jsx's mobile menu: conditionally mounting this GlassSurface at tap
  // time (the old usePresence approach) stood its backdrop-filter + distortion compositing
  // layer up cold, so the sheet's first frames rendered flat/unblurred before snapping to
  // glass. Keeping it in the DOM (opacity: 0, never display:none/visibility:hidden — those
  // stop compositing and defeat the pre-warm) keeps the layer warm from page load. Closed
  // it's inert + aria-hidden + pointer-events:none. React 18 doesn't forward a boolean
  // `inert`, hence the empty-string form.
  return (
    <div
      className={`filter-sheet__backdrop${open ? ' is-open' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden={!open}
      inert={open ? undefined : ''}
    >
      {/* --solid — the plain --calm tint read as too faint/washed-out to read the category
          list against a busy product grid behind it (user-reported "çok silik"). */}
      <GlassSurface
        as="div"
        className={`filter-sheet glass-surface--veil glass-surface--calm glass-surface--tight glass-surface--solid glass-surface--menu${open ? ' is-open' : ''}`}
        contentClassName="filter-sheet__content"
      >
        <div className="filter-sheet__head">
          <span className="filter-sheet__heading">{t(TEXT.filter)}</span>
          <button type="button" className="filter-sheet__close" onClick={onClose} aria-label={t(TEXT.close)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <FilterPanel {...props} onSelect={handleSelect} />
      </GlassSurface>
    </div>
  );
}
