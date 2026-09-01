import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

const TEXT = {
  new: { tr: 'Yeni', en: 'New', de: 'Neu' },
  outOfStock: { tr: 'Stokta Yok', en: 'Out of Stock', de: 'Nicht auf Lager' },
  askPrice: { tr: "Sipariş ve detaylı bilgi için WhatsApp'tan ulaşın", en: 'Contact us on WhatsApp for orders and details', de: 'Für Bestellungen und weitere Informationen kontaktieren Sie uns über WhatsApp' },
  unavailable: { tr: 'Şu an temin edilemiyor', en: 'Currently unavailable', de: 'Derzeit nicht verfügbar' },
  view: { tr: 'İncele', en: 'View', de: 'Ansehen' },
};

export default function ProductCard({ product, priority = false }) {
  const { t } = useLanguage();

  // Out-of-stock products (STOK column of the source Excel — see scripts/build-products.mjs)
  // render as a dimmed, non-interactive card: on a static export the detail page's HTML
  // still exists at its URL (getStaticPaths builds every id), so the correct way to keep
  // people out of it is simply not linking there — a plain <div> instead of the <Link>.
  const inStock = product.inStock !== false;

  const body = (
    <>
      <span className="product-card__image-wrap">
        <Image
          src={product.image}
          alt={t(product.name)}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          style={{ objectFit: 'contain' }}
          priority={priority}
        />
        {product.isNew && inStock && <span className="product-card__badge">{t(TEXT.new)}</span>}
        {/* Text label, not just dimming — stock state must not be conveyed by opacity alone. */}
        {!inStock && <span className="product-card__badge product-card__badge--stock">{t(TEXT.outOfStock)}</span>}
      </span>
      <span className="product-card__body">
        <span className="product-card__name">{t(product.name)}</span>
        {/* Several products share an identical name and differ only by color/size (e.g.
            three "Yumuşak Detay Fırçası" cards at 16/20/24mm) — without this the grid
            shows duplicate-looking cards with no way to tell them apart before clicking
            through. */}
        {(product.color || product.size) && (
          <span className="product-card__variant">{product.color ? t(product.color) : product.size}</span>
        )}
        {/* No real price data (see src/data/products.js) — every product routes to a
            WhatsApp inquiry instead of a cart, so this reads as an invitation, not a gap. */}
        {inStock ? (
          <>
            <span className="product-card__price">{t(TEXT.askPrice)}</span>
            <GlassSurface
              as="span"
              className="product-card__cta glass-surface--tight glass-surface--solid"
              contentClassName="product-card__cta-content"
            >
              {/* .btn-glass__label already goes gradient when ANY ancestor a/button is
                  hovered (see globals.scss) — the whole card is the <a>, so hovering the
                  image also lights this up, not just the pill itself. */}
              <span className="btn-glass__label">{t(TEXT.view)}</span>
            </GlassSurface>
          </>
        ) : (
          <span className="product-card__price">{t(TEXT.unavailable)}</span>
        )}
      </span>
    </>
  );

  if (!inStock) {
    return <div className="product-card product-card--out-of-stock">{body}</div>;
  }

  return (
    // No data-reveal here: useScrollReveal's IntersectionObserver only scans once at
    // mount, but this grid re-renders a different set of cards on every search/filter/
    // sort/page change — cards added after that initial scan would never get observed
    // and stay stuck at opacity:0 (confirmed: this was silently hiding every live-search
    // result). A grid that refilters as you type shouldn't fade in on each keystroke
    // anyway — instant feedback reads as more responsive here than the reveal treatment
    // fits sections that only render once, like the homepage.
    <Link href={`/urunler/${product.id}`} className="product-card">
      {body}
    </Link>
  );
}
