import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';
import Lightbox from './Lightbox';

// D2 (design architecture): the product's long-form "poster" story below the info block.
// Real data supplies 0-3 poster photos per SKU, a multi-paragraph written description
// (ÜRÜN POSTERİ GÖRSELİ / ÜRÜN POSTERİ AÇIKLAMASI in the source Excel) and, for cw-ms,
// an actual video clip instead of photos. The section renders as an editorial spread:
//   - An eyebrow + hairline anchors it as its own section (same rhythm as RelatedProducts)
//     instead of the old free-floating text wall.
//   - Media comes first, text after — at every breakpoint. The photos are the poster; the
//     copy reads as its caption, so the picture leads and the words follow.
//   - The first paragraph is set as a display-type lead; remaining paragraphs run in a
//     second column on desktop. Paragraphs whose first line is a short "Label:" (the
//     Excel copy's own "Öneri:" / "Önemli not:" convention) become quiet hairline callouts.
//     A single-paragraph description runs full width instead of a capped measure.
//   - Photos adapt to what the SKU actually has: 1 → full-bleed; 2 → weighted pair;
//     3 landscape → mosaic (one tall, two stacked); 3 portrait → three side by side.
//   - Video (cw-ms) gets its own desktop split: clip on the left, lead beside it on the
//     right, any further paragraphs full width underneath. On mobile it stacks like the
//     rest (video, then text).
//   Media is optional — a SKU with only a written description and no photo/video still
//   renders the text. Nothing renders only when both are empty.
const EYEBROW = { tr: 'Detaylı Bilgi', en: 'Product Details', de: 'Produktdetails' };

// products.js is regenerated from the source Excel by scripts/build-products.mjs, so the
// orientation flag lives here rather than as a hand-added data field that the next
// rebuild would drop. Poster shots are landscape for every SKU except the ones listed —
// whose three 1086×1448 (3:4) frames are designed posters with their own copy, so they
// must show whole (no landscape crop) and sit in a row rather than the tall/stacked mosaic.
// If a future Excel drop adds another portrait set, add its id here.
const PORTRAIT_POSTER_SKUS = new Set(['cw-cfgt-1pc']);

const SWIPER_TEXT = {
  prev: { tr: 'Önceki görsel', en: 'Previous image', de: 'Vorheriges Bild' },
  next: { tr: 'Sonraki görsel', en: 'Next image', de: 'Nächstes Bild' },
};

const ZOOM_TEXT = { open: { tr: 'Görseli tam ekran aç', en: 'Open image fullscreen', de: 'Bild im Vollbild öffnen' } };

// Same zoom-hint affordance as ProductGallery's main image (magnifying-glass icon, fades
// in on hover, always visible on touch — see .product-gallery__zoom-hint) reused as-is so
// poster photos read as zoomable the same way the gallery's already do.
function ZoomHint() {
  return (
    <span className="product-gallery__zoom-hint" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11 8.5v5M8.5 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

// Below 700px (see the matching breakpoint on .product-poster__duo/__mosaic/__trio in the
// stylesheet) 2-3 stacked poster photos read as a long scroll of "photo, photo, photo"
// before the copy ever shows up. This swaps that stack for a one-at-a-time swiper —
// dragged by the user only, never auto-advancing — with an arrow on each side so it reads
// as swipeable at a glance. Both this and the stacked-grid markup stay mounted; only CSS
// decides which one shows at a given width (same reasoning as HeroSlider's mobile/desktop
// media swap: a JS-driven swap would flash the wrong layout on first paint).
function PosterSwiper({ photos, alt, variant, onImageClick }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  // Guards the swipe-vs-tap-to-zoom ambiguity for a mouse drag (the swiper only ever shows
  // below 700px, but a resized desktop window can still land there) — a real touch drag
  // already suppresses its own synthetic click natively, mouse doesn't. Set the moment a
  // drag moves past a few px, checked by the slide's onClick so a drag-release never also
  // pops the lightbox open. Same idea as CategorySlider's `moved` flag.
  const draggedRef = useRef(false);
  const total = photos.length;
  const go = (next) => setIndex(((next % total) + total) % total);

  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta > 0 ? index - 1 : index + 1);
    touchStartX.current = null;
  };

  // Mouse-drag swipe alongside touch, same as HeroSlider — listens on window between
  // mousedown/mouseup so a drag still resolves if the pointer leaves the swiper first.
  const onMouseDown = (event) => {
    if (event.button !== 0) return;
    const startX = event.clientX;
    draggedRef.current = false;
    const onWindowMouseMove = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 5) draggedRef.current = true;
    };
    const onWindowMouseUp = (upEvent) => {
      const delta = upEvent.clientX - startX;
      if (Math.abs(delta) > 40) go(delta > 0 ? index - 1 : index + 1);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  };

  return (
    <div className={`product-poster__swiper product-poster__swiper--${variant}`}>
      <div
        className="product-poster__swiper-viewport"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="product-poster__swiper-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {photos.map((src, i) => (
            <button
              type="button"
              className="product-poster__swiper-slide"
              key={src}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              aria-label={t(ZOOM_TEXT.open)}
              onClick={() => {
                if (draggedRef.current) return;
                onImageClick(i);
              }}
            >
              <Image src={src} alt={`${alt} — ${i + 1}`} fill sizes="100vw" style={{ objectFit: 'cover' }} />
              <ZoomHint />
            </button>
          ))}
        </div>
      </div>

      <GlassSurface
        as="button"
        type="button"
        className="product-poster__swiper-arrow product-poster__swiper-arrow--prev glass-surface--tight glass-surface--solid"
        contentClassName="product-poster__swiper-arrow-content"
        onClick={() => go(index - 1)}
        aria-label={t(SWIPER_TEXT.prev)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>
      <GlassSurface
        as="button"
        type="button"
        className="product-poster__swiper-arrow product-poster__swiper-arrow--next glass-surface--tight glass-surface--solid"
        contentClassName="product-poster__swiper-arrow-content"
        onClick={() => go(index + 1)}
        aria-label={t(SWIPER_TEXT.next)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </GlassSurface>
    </div>
  );
}

function Paragraph({ text }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const isNote = lines.length > 1 && /^.{1,60}:$/.test(lines[0]);
  if (isNote) {
    return (
      <p className="product-poster__note">
        <strong className="product-poster__note-label">{lines[0].replace(/:$/, '')}</strong>
        {lines.slice(1).join(' ')}
      </p>
    );
  }
  return <p>{lines.join(' ')}</p>;
}

function MoreParagraphs({ paragraphs }) {
  if (paragraphs.length === 0) return null;
  return (
    <div className="product-poster__more">
      {paragraphs.map((p, i) => (
        <Paragraph key={i} text={p} />
      ))}
    </div>
  );
}

export default function ProductPoster({ productId, images, video, description, alt }) {
  const { t } = useLanguage();
  const photos = (images || []).slice(0, 3);
  const portrait = photos.length === 3 && PORTRAIT_POSTER_SKUS.has(productId);
  const videoRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openLightbox = (i) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  // The loop autoplays muted (it's a silent product clip) — except for reduced-motion
  // users, who get a paused video with visible controls instead.
  useEffect(() => {
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(reduce);
    const el = videoRef.current;
    if (!el) return;
    if (reduce) el.pause();
    else {
      // React sets `muted` as a DOM property, not an HTML attribute — on a static export
      // the pre-hydration markup lacks it, so make sure it's set before nudging playback.
      el.muted = true;
      el.play().catch(() => {});
    }
  }, [video]);

  const paragraphs = description
    ? t(description).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];
  const [lead, ...more] = paragraphs;
  const leadText = lead ? lead.split('\n').join(' ') : '';

  // Media is optional per SKU (some Excel rows only ever had a written poster
  // description, no photo/video) — only skip the whole section when there's
  // truly nothing to show.
  if (photos.length === 0 && !video && !lead) return null;

  const videoEl = video && (
    <div className="product-poster__video">
      <video
        ref={videoRef}
        className="product-poster__video-el"
        muted
        loop
        playsInline
        autoPlay={!reducedMotion}
        controls={reducedMotion}
        preload="metadata"
        poster={video.poster || undefined}
        aria-label={alt}
      >
        <source src={video.mp4} type="video/mp4" />
        {video.webm && <source src={video.webm} type="video/webm" />}
      </video>
    </div>
  );

  // Video SKU: the clip and the lead share a row on desktop, so they are siblings in
  // one grid instead of the media-block / text-block pair used for photos.
  if (video && !photos.length) {
    return (
      <section className="product-poster product-poster--video" data-reveal aria-label={t(EYEBROW)}>
        <p className="product-poster__eyebrow">{t(EYEBROW)}</p>
        <div className="product-poster__split">
          {videoEl}
          {lead && <p className="product-poster__lead">{leadText}</p>}
        </div>
        <MoreParagraphs paragraphs={more} />
      </section>
    );
  }

  return (
    <section className="product-poster" data-reveal aria-label={t(EYEBROW)}>
      <p className="product-poster__eyebrow">{t(EYEBROW)}</p>

      {(photos.length > 0 || video) && (
      <div className="product-poster__media">
        {videoEl}

        {photos.length === 1 && (
          <button
            type="button"
            className="product-poster__single"
            onClick={() => openLightbox(0)}
            aria-label={t(ZOOM_TEXT.open)}
          >
            <Image src={photos[0]} alt={alt} fill sizes="100vw" style={{ objectFit: 'cover' }} />
            <ZoomHint />
          </button>
        )}

        {photos.length > 1 && (
          <PosterSwiper photos={photos} alt={alt} variant={portrait ? 'portrait' : 'wide'} onImageClick={openLightbox} />
        )}

        {photos.length === 2 && (
          <div className="product-poster__duo">
            {photos.map((src, i) => (
              // Each shot gets its own numbered alt — the description covers the product
              // as a whole, not what's pictured in any one frame, so these aren't
              // redundant with it.
              <button
                key={src}
                type="button"
                className="product-poster__duo-image"
                onClick={() => openLightbox(i)}
                aria-label={t(ZOOM_TEXT.open)}
              >
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  sizes="58vw"
                  style={{ objectFit: 'cover' }}
                />
                <ZoomHint />
              </button>
            ))}
          </div>
        )}

        {photos.length === 3 && !portrait && (
          <div className="product-poster__mosaic">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                className="product-poster__mosaic-image"
                onClick={() => openLightbox(i)}
                aria-label={t(ZOOM_TEXT.open)}
              >
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  sizes="60vw"
                  style={{ objectFit: 'cover' }}
                />
                <ZoomHint />
              </button>
            ))}
          </div>
        )}

        {photos.length === 3 && portrait && (
          <div className="product-poster__trio">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                className="product-poster__trio-image"
                onClick={() => openLightbox(i)}
                aria-label={t(ZOOM_TEXT.open)}
              >
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  sizes="33vw"
                  style={{ objectFit: 'cover' }}
                />
                <ZoomHint />
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {lead && (
        <div className={`product-poster__text${more.length === 0 ? ' product-poster__text--solo' : ''}`}>
          <p className="product-poster__lead">{leadText}</p>
          <MoreParagraphs paragraphs={more} />
        </div>
      )}

      {photos.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          images={photos}
          initialIndex={lightboxIndex}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </section>
  );
}
