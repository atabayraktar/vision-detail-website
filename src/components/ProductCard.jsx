import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

export default function ProductCard({ product }) {
  const { t } = useLanguage();

  return (
    // No data-reveal here: useScrollReveal's IntersectionObserver only scans once at
    // mount, but this grid re-renders a different set of cards on every search/filter/
    // sort/page change — cards added after that initial scan would never get observed
    // and stay stuck at opacity:0 (confirmed: this was silently hiding every live-search
    // result). A grid that refilters as you type shouldn't fade in on each keystroke
    // anyway — instant feedback reads as more responsive here than the reveal treatment
    // fits sections that only render once, like the homepage.
    <Link href={`/urunler/${product.id}`} className="product-card">
      <span className="product-card__image-wrap">
        <Image
          src={product.image}
          alt={t(product.name)}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          style={{ objectFit: 'cover' }}
        />
        {product.isNew && <span className="product-card__badge">Yeni</span>}
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
        <span className="product-card__price">Fiyat için WhatsApp'tan sorun</span>
        <GlassSurface
          as="span"
          className="product-card__cta glass-surface--tight glass-surface--solid"
          contentClassName="product-card__cta-content"
        >
          {/* .btn-glass__label already goes gradient when ANY ancestor a/button is
              hovered (see globals.scss) — the whole card is the <a>, so hovering the
              image also lights this up, not just the pill itself. */}
          <span className="btn-glass__label">İncele</span>
        </GlassSurface>
      </span>
    </Link>
  );
}
