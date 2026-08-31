import { useLayoutEffect, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { equipmentSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// This page is statically pre-rendered (see CLAUDE.md's Static Site Generation section) —
// plain useLayoutEffect fires React's "does nothing during server rendering" warning on
// that pass since there's no DOM to measure yet; falling back to useEffect there is a
// no-op difference in practice (the effect only ever needs a real browser to run in).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const AUTOPLAY_MS = 7000;
// How many cards get cloned on each end for the infinite-loop illusion — matches the max
// number of cards visible at once (desktop), so a full "page" of real content always sits
// between the visible viewport and either clone boundary.
const CLONE_COUNT = 4;

export default function CategorySlider() {
  const { t } = useLanguage();
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const { categories, title } = equipmentSection;

  const leadingClones = categories.slice(-CLONE_COUNT).map((cat, i) => ({ cat, key: `pre-${i}`, clone: true }));
  const trailingClones = categories.slice(0, CLONE_COUNT).map((cat, i) => ({ cat, key: `post-${i}`, clone: true }));
  const realCards = categories.map((cat) => ({ cat, key: `real-${cat.slug}`, clone: false }));
  const loopCards = [...leadingClones, ...realCards, ...trailingClones];

  const getStep = (track) => {
    const card = track.querySelector('.category-slider__card');
    return card ? card.offsetWidth + 20 : 300;
  };

  // Instantly (not animated) folds scrollLeft back into the "safe" real-content zone if
  // it's currently sitting in either clone zone. Called BEFORE every programmatic scroll
  // (arrow click, autoplay tick) so each one always computes its relative delta from an
  // already-correct base — this is what actually fixes looping reliably; the reactive
  // scroll-listener version of this same check (below) raced its own follow-up click
  // often enough to silently skip a card, since it only ran after-the-fact on a debounce.
  const normalizeLoopPosition = (track) => {
    const step = getStep(track);
    const realWidth = step * categories.length;
    const prependWidth = step * CLONE_COUNT;

    if (track.scrollLeft < prependWidth - step / 2) {
      track.style.scrollBehavior = 'auto';
      track.scrollLeft += realWidth;
      track.style.scrollBehavior = '';
    } else if (track.scrollLeft > prependWidth + realWidth - step / 2) {
      track.style.scrollBehavior = 'auto';
      track.scrollLeft -= realWidth;
      track.style.scrollBehavior = '';
    }
  };

  // Land on the first REAL card at rest — before paint, so the leading clones never flash
  // into view. Runs whenever the card count could change the clone-section width (language
  // switch doesn't reorder categories, but keeping this correct if that ever changes).
  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = getStep(track) * CLONE_COUNT;
    track.style.scrollBehavior = '';
  }, [categories.length]);

  // Fallback for organic drag/touch/wheel scrolling (arrow clicks and autoplay normalize
  // proactively — see normalizeLoopPosition above — so this only matters when the user
  // scrolls the track directly): once that settles inside either clone zone, silently
  // fold it back. The `correcting` guard skips the scroll event the correction itself
  // fires, so it doesn't re-arm its own debounce.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let settleTimer;
    let correcting = false;

    const onScroll = () => {
      if (correcting) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        correcting = true;
        normalizeLoopPosition(track);
        requestAnimationFrame(() => {
          correcting = false;
        });
      }, 120);
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      clearTimeout(settleTimer);
    };
  }, [categories.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      normalizeLoopPosition(track);
      track.scrollTo({ left: track.scrollLeft + getStep(track), behavior: 'smooth' });
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, []);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    normalizeLoopPosition(track);
    track.scrollBy({ left: dir * getStep(track), behavior: 'smooth' });
  };

  // Mouse-drag-to-swipe: native overflow-x scrolling already handles touch/trackpad, but a
  // mouse can't drag a scroll container by default — the design blueprint calls for the
  // slider to be drag-controllable, not just arrow/touch-controllable, so this fills that in.
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const onTrackMouseDown = (e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft, moved: false };
    pause();
    // Stops the browser's native image/link drag-ghost from starting, which otherwise
    // hijacks the gesture instead of scrolling the track.
    e.preventDefault();
  };

  // Listens on window (not the track) so the drag keeps tracking even if the cursor
  // slips outside the track's bounds mid-swipe.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const onMouseMove = (e) => {
      const state = dragRef.current;
      if (!state.active) return;
      const dx = e.clientX - state.startX;
      // .is-dragging (which sets pointer-events:none on the cards, see CategorySlider.scss)
      // only gets added HERE, once real movement crosses the threshold — not on mousedown.
      // Adding it eagerly on mousedown made pointer-events:none active on the very card being
      // pressed for the whole click gesture, which made Chromium drop the click's target
      // entirely: a plain, stationary click (or a normal tap, which always has a little
      // finger jitter) never fired the card's navigation at all. Only an actual drag past
      // the threshold should ever disable the cards' pointer-events.
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
      resume();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Swallows the click a card's Link would otherwise fire right after a drag — without
  // this, releasing the mouse over a card you swiped past navigates there.
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

        {/* Arrows grouped together at the far right of the head row (not flanking the
            track's own edges) — same glass-squircle icon-button system as the WhatsApp
            FAB (Brand Guidelines · 05). */}
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
          onMouseEnter={pause}
          onMouseLeave={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
          onMouseDown={onTrackMouseDown}
          onClickCapture={onTrackClickCapture}
        >
          {loopCards.map(({ cat, key, clone }) => (
            <Link
              key={key}
              href={`/urunler?kategori=${cat.slug}`}
              className="category-slider__card"
              data-reveal
              aria-hidden={clone || undefined}
              tabIndex={clone ? -1 : undefined}
            >
              {/* alt="" — the title overlay right on top repeats the same text, so a real
                  alt here would just be announced twice for screen reader users. */}
              <span className="category-slider__image-wrap">
                <Image src={cat.image} alt="" fill sizes="(max-width: 640px) 65vw, 280px" style={{ objectFit: 'cover' }} />
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
