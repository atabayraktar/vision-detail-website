import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { equipmentSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

export default function CategorySlider() {
  const { t } = useLanguage();
  const trackRef = useRef(null);
  const { categories, title } = equipmentSection;

  // Mobile-only affordance: arrows below scroll one card at a time (no loop, no
  // autoplay — see CategorySlider.scss, which hides these entirely once the section
  // becomes a static 4-up grid at 640px).
  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.category-slider__card');
    const step = card ? card.offsetWidth + 16 : 200;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Mouse-drag-to-swipe on mobile widths: native overflow-x scrolling already handles
  // touch/trackpad, but a mouse can't drag a scroll container by default, and the user
  // asked for "elle de hareket edebilsin" (also movable by hand) alongside the arrows.
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

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

  return (
    <section className="category-slider" aria-label={t(title).join(' ')}>
      <div className="container category-slider__head" data-reveal>
        <h2 className="category-slider__title">
          {t(title).map((line, i, arr) => (
            <span
              key={i}
              className={arr.length > 1 && i === arr.length - 1 ? 'category-slider__title-line--bold' : undefined}
            >
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </h2>

        <div className="category-slider__arrows">
          <GlassSurface
            as="button"
            type="button"
            className="category-slider__control glass-surface--tight glass-surface--solid"
            contentClassName="category-slider__control-content"
            onClick={() => scrollByCard(-1)}
            aria-label="Önceki kategoriler"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GlassSurface>
          <GlassSurface
            as="button"
            type="button"
            className="category-slider__control glass-surface--tight glass-surface--solid"
            contentClassName="category-slider__control-content"
            onClick={() => scrollByCard(1)}
            aria-label="Sonraki kategoriler"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </GlassSurface>
        </div>
      </div>

      <div className="category-slider__viewport">
        <div
          className="category-slider__track"
          ref={trackRef}
          onMouseDown={onTrackMouseDown}
          onClickCapture={onTrackClickCapture}
        >
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/urunler?kategori=${cat.slug}`} className="category-slider__card" data-reveal>
              {/* alt="" — the title overlay right on top repeats the same text, so a real
                  alt here would just be announced twice for screen reader users. */}
              <span className="category-slider__image-wrap">
                <Image src={cat.image} alt="" fill sizes="(max-width: 640px) 45vw, 280px" style={{ objectFit: 'cover' }} />
                <span className="category-slider__scrim" aria-hidden="true" />
                <span className="category-slider__card-title gradient-hover">{t(cat.title)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
