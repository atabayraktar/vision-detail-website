import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { heroSlides } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// Slow, unhurried autoplay per the brand direction's "acelesiz" carousel pacing — pauses
// the moment someone touches the slider (hover, focus, drag) and never fights a manual nav.
const AUTOPLAY_MS = 8000;

export default function HeroSlider() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const touchStartX = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    setLoaded((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, [index]);

  const total = heroSlides.length;
  const go = (next) => setIndex(((next % total) + total) % total);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % total);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [total]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  const onTouchStart = (event) => {
    pause();
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      go(delta > 0 ? index - 1 : index + 1);
    }
    touchStartX.current = null;
    resume();
  };

  // Mouse-drag swipe (touch already worked via onTouchStart/onTouchEnd above) — listens on
  // window between mousedown/mouseup so the drag still resolves correctly if the pointer
  // leaves the slider before release, which a plain onMouseUp on the element would miss.
  const onMouseDown = (event) => {
    // Ignore right/middle-click drags and clicks starting on a real control (dots, CTA
    // link) — only the bare slider surface should initiate a drag.
    if (event.button !== 0) return;
    pause();
    const startX = event.clientX;

    const onWindowMouseUp = (upEvent) => {
      const delta = upEvent.clientX - startX;
      if (Math.abs(delta) > 40) {
        go(delta > 0 ? index - 1 : index + 1);
      }
      window.removeEventListener('mouseup', onWindowMouseUp);
      resume();
    };

    window.addEventListener('mouseup', onWindowMouseUp);
  };

  return (
    <section
      className="hero-slider"
      aria-roledescription="carousel"
      aria-label="Öne çıkan ürünler"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div
        className="hero-slider__viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="hero-slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {heroSlides.map((slide, i) => (
            <div
              className="hero-slider__slide"
              key={slide.id}
              aria-hidden={i !== index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
            >
              <div className="hero-slider__media">
                {slide.media.type === 'video' ? (
                  loaded.has(i) && (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      poster={slide.media.poster}
                      preload={i === 0 ? 'auto' : 'metadata'}
                    >
                      {/* Mobile sources are a real art-directed portrait crop supplied
                          separately (not just a smaller resize of the desktop video) — the
                          media query has to come first: a <video> picks the first <source>
                          that both matches its media query (if any) and has a playable
                          type, so unscoped desktop sources must sort after these or they'd
                          always win first. */}
                      {slide.media.mobileMp4 && (
                        <source media="(max-width: 640px)" src={slide.media.mobileMp4} type="video/mp4" />
                      )}
                      {slide.media.mobileWebm && (
                        <source media="(max-width: 640px)" src={slide.media.mobileWebm} type="video/webm" />
                      )}
                      <source src={slide.media.mp4} type="video/mp4" />
                      <source src={slide.media.webm} type="video/webm" />
                    </video>
                  )
                ) : (
                  <>
                    {/* Same art-direction split as the video slides, done with a plain CSS
                        breakpoint swap (see HeroSlider.scss) rather than matchMedia — next/image
                        doesn't support <picture>-style per-source art direction natively, and a
                        JS-driven swap would flash the wrong crop on first paint / SSR mismatch. */}
                    {slide.media.mobileSrc && (
                      <Image
                        src={slide.media.mobileSrc}
                        alt={t(slide.media.alt)}
                        fill
                        priority={i === 0}
                        sizes="100vw"
                        className="hero-slider__media-mobile"
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                    <Image
                      src={slide.media.src}
                      alt={t(slide.media.alt)}
                      fill
                      priority={i === 0}
                      sizes="100vw"
                      className={slide.media.mobileSrc ? 'hero-slider__media-desktop' : undefined}
                      // The source photo's product cluster sits in the right half of the
                      // frame with empty space to spare on the left — a center crop clips the
                      // rightmost pad while keeping dead space on the left. Shifting the focal
                      // point right keeps every pad in frame at any viewport width.
                      style={{ objectFit: 'cover', objectPosition: '92% center' }}
                    />
                  </>
                )}
                <div className="hero-slider__scrim" aria-hidden="true" />
              </div>

              <div className="hero-slider__copy">
                {/* Only the active slide gets the real <h1> — all 4 slides are always in
                    the DOM for the sliding transition, and a page must have exactly one
                    h1. aria-hidden on the slide wrapper hides inactive copy from screen
                    readers, but crawlers still parse raw HTML, so the tag itself has to
                    change too, not just the ARIA state. */}
                {i === index ? (
                  <h1 className="hero-slider__title">{t(slide.title)}</h1>
                ) : (
                  <p className="hero-slider__title">{t(slide.title)}</p>
                )}
                <p className="hero-slider__info">{t(slide.info)}</p>
                <GlassSurface
                  as="a"
                  href={slide.href}
                  className="hero-slider__cta glass-surface--tight glass-surface--solid"
                  contentClassName="hero-slider__cta-content"
                >
                  <span className="btn-glass__label">{t(slide.cta)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </GlassSurface>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-slider__dots">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            className={`hero-slider__dot${i === index ? ' hero-slider__dot--active' : ''}`}
            aria-label={`${i + 1}. slayta git`}
            aria-current={i === index}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}
