import { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';
import ProductCard from './ProductCard';

const TITLE = {
  tr: 'Bu kategoriden diğer ürünler',
  en: 'More from this category',
  de: 'Mehr aus dieser Kategorie',
};
const PREV_LABEL = { tr: 'Önceki ürünler', en: 'Previous products', de: 'Vorherige Produkte' };
const NEXT_LABEL = { tr: 'Sonraki ürünler', en: 'Next products', de: 'Nächste Produkte' };

// Same-category products shown as a horizontally swipeable row at the bottom of every
// product detail page — plain scroll-snap + drag (no autoplay/infinite-loop like
// CategorySlider; a "more from this category" rail doesn't need to keep moving on its own).
export default function RelatedProducts({ products }) {
  const { t } = useLanguage();
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const getStep = (track) => {
    const card = track.querySelector('.related-products__card');
    return card ? card.offsetWidth + 20 : 300;
  };

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * getStep(track), behavior: 'smooth' });
  };

  // Mouse-drag-to-swipe — native overflow-x already covers touch/trackpad, a mouse can't
  // drag a scroll container by default (same technique as CategorySlider.jsx).
  const onTrackMouseDown = (e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft, moved: false };
    e.preventDefault();
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const onMouseMove = (e) => {
      const state = dragRef.current;
      if (!state.active) return;
      const dx = e.clientX - state.startX;
      // .is-dragging (which sets pointer-events:none on the cards, see
      // RelatedProducts.scss) only gets added HERE, once real movement crosses the
      // threshold — not on mousedown. Adding it eagerly on mousedown made
      // pointer-events:none active on the very card being pressed for the whole click
      // gesture, which made Chromium drop the click's target entirely: a plain,
      // stationary click never navigated to the product at all (see CategorySlider.jsx's
      // identical fix).
      if (Math.abs(dx) > 4 && !state.moved) {
        state.moved = true;
        track.classList.add('is-dragging');
      }
      track.scrollLeft = state.startScroll - dx;
    };

    const onMouseUp = () => {
      const state = dragRef.current;
      if (!state.active) return;
      state.active = false;
      track.classList.remove('is-dragging');
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Swallows the click a card's Link would otherwise fire right after a drag.
  const onTrackClickCapture = (e) => {
    if (dragRef.current.moved) e.preventDefault();
  };

  if (!products.length) return null;

  return (
    <section className="related-products" aria-label={t(TITLE)} data-reveal>
      <div className="related-products__head">
        <h2 className="related-products__title">{t(TITLE)}</h2>
        {products.length > 2 && (
          <div className="related-products__arrows">
            <GlassSurface
              as="button"
              type="button"
              className="related-products__control glass-surface--tight glass-surface--solid"
              contentClassName="related-products__control-content"
              onClick={() => scrollByCard(-1)}
              aria-label={t(PREV_LABEL)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GlassSurface>
            <GlassSurface
              as="button"
              type="button"
              className="related-products__control glass-surface--tight glass-surface--solid"
              contentClassName="related-products__control-content"
              onClick={() => scrollByCard(1)}
              aria-label={t(NEXT_LABEL)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GlassSurface>
          </div>
        )}
      </div>

      <div
        className="related-products__track"
        ref={trackRef}
        onMouseDown={onTrackMouseDown}
        onClickCapture={onTrackClickCapture}
      >
        {products.map((product) => (
          <div key={product.id} className="related-products__card">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
