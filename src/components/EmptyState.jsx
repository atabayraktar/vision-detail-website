export default function EmptyState({ onReset }) {
  return (
    <div className="empty-state">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" />
        <path d="M45 45 62 62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 32h16M32 24v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
      <p className="empty-state__title">Sonuç bulunamadı</p>
      <p className="empty-state__info">Bu filtrelerle eşleşen ürün yok. Aramayı veya kategori seçimini değiştirmeyi deneyin.</p>
      <button type="button" className="empty-state__reset" onClick={onReset}>
        Filtreleri değiştir
      </button>
    </div>
  );
}
