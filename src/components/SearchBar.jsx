import GlassSurface from './GlassSurface';

export default function SearchBar({ value, onChange }) {
  return (
    <GlassSurface as="div" className="search-bar glass-surface--calm" contentClassName="search-bar__content">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ürün ara..."
        aria-label="Ürün ara"
      />
    </GlassSurface>
  );
}
