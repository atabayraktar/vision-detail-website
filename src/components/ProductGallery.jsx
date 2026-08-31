import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';

// `thumbs` (optional): pre-generated small (THUMB_MAX_WIDTH, see build-products.mjs)
// copies of `images`, same order — the thumbnail rail displays each at 68x68 CSS px, but
// under `output: 'export'` next/image runs unoptimized (no server to derive a responsive
// srcset from `sizes`), so without a genuinely small source file every thumbnail was
// downloading the same ~1400px main-viewer image. Falls back to `images` for any caller
// that hasn't supplied thumbs yet, rather than breaking.
//
// `video` (optional): { mp4, webm } — appended as one extra slide after the images (e.g.
// cw-ms, a "feature" that's genuinely a clip rather than a photo — see products.js's
// `video` field). It shares the same main-viewer/thumbnail track as the photos so arrows
// and swipe still cover it, but it never opens the (image-only) lightbox — a <video> with
// native controls needs real clicks, not a wrapping zoom button.
export default function ProductGallery({ images, thumbs, video, alt }) {
  const thumbSrcs = thumbs || images;
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const slides = video ? [...images, { video }] : images;
  const total = slides.length;
  const go = (next) => setIndex(((next % total) + total) % total);
  const current = slides[index];
  const isVideo = typeof current === 'object';

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        {isVideo ? (
          <div className="product-gallery__video-wrap">
            <video key={current.video.mp4} className="product-gallery__video" controls playsInline preload="metadata">
              <source src={current.video.mp4} type="video/mp4" />
              <source src={current.video.webm} type="video/webm" />
            </video>
          </div>
        ) : (
          <button
            type="button"
            className="product-gallery__image-wrap"
            onClick={() => setLightboxOpen(true)}
            aria-label="Görseli tam ekran aç"
          >
            <Image
              key={current}
              src={current}
              alt={alt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              priority
              style={{ objectFit: 'contain' }}
            />
            <span className="product-gallery__zoom-hint" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M11 8.5v5M8.5 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        )}

        {total > 1 && (
          <>
            <GlassSurface
              as="button"
              type="button"
              className="product-gallery__arrow product-gallery__arrow--prev glass-surface--tight glass-surface--solid"
              contentClassName="product-gallery__arrow-content"
              onClick={() => go(index - 1)}
              aria-label="Önceki görsel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GlassSurface>
            <GlassSurface
              as="button"
              type="button"
              className="product-gallery__arrow product-gallery__arrow--next glass-surface--tight glass-surface--solid"
              contentClassName="product-gallery__arrow-content"
              onClick={() => go(index + 1)}
              aria-label="Sonraki görsel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GlassSurface>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="product-gallery__thumbs">
          {slides.map((slide, i) => (
            <li key={typeof slide === 'string' ? slide : 'video'}>
              <button
                type="button"
                className={`product-gallery__thumb${i === index ? ' product-gallery__thumb--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={typeof slide === 'string' ? `${i + 1}. görsel` : 'Video'}
                aria-current={i === index}
              >
                {typeof slide === 'string' ? (
                  <Image src={thumbSrcs[i] ?? slide} alt="" fill sizes="80px" style={{ objectFit: 'contain' }} />
                ) : (
                  <span className="product-gallery__thumb-video" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M8 6.5v11l9-5.5-9-5.5Z" fill="currentColor" />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        open={lightboxOpen}
        images={images}
        initialIndex={Math.min(index, images.length - 1)}
        alt={alt}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

// Full-screen zoom — click the main image (or any thumbnail) to open. Same
// backdrop/close/focus-trap pattern as the mobile filter sheet (FilterPanel.jsx) for
// consistency. Always mounted by the parent (controlled via `open`) so usePresence can
// delay the unmount long enough for an exit animation — see that hook's comment.
//
// Keeps its own index (seeded from `initialIndex` whenever it opens) bounded to `images`
// only, rather than sharing the main gallery's index/go — the main track can also include
// a trailing video slide (see ProductGallery above), and the lightbox has no video variant
// to show for that index.
function Lightbox({ open, images, initialIndex, alt, onClose }) {
  const dialogRef = useRef(null);
  const { mounted, closing } = usePresence(open, 350);
  const total = images.length;
  const [index, setIndex] = useState(initialIndex);
  const go = (next) => setIndex(((next % total) + total) % total);

  useEffect(() => {
    if (open) setIndex(initialIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(index - 1);
      if (event.key === 'ArrowRight') go(index + 1);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, index]);

  if (!mounted) return null;

  return (
    <div
      className={`product-lightbox__backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      ref={dialogRef}
      tabIndex={-1}
    >
      <button type="button" className="product-lightbox__close" onClick={onClose} aria-label="Kapat">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* The backdrop's own onMouseDown-outside-target close handler almost never fires in
          practice: this frame (sized to fill the whole padded backdrop) sits on top of it,
          and object-fit:contain typically leaves visible "empty" space around the image
          that's still inside the frame's box — clicking there hit the frame, not the
          backdrop, so nothing closed. Closing on any click here (frame or image) matches
          what people expect from "tap the dark area to dismiss." */}
      <div className={`product-lightbox__frame${closing ? ' is-closing' : ''}`} onClick={onClose}>
        <Image key={images[index]} src={images[index]} alt={alt} fill sizes="100vw" style={{ objectFit: 'contain' }} priority />
      </div>

      {total > 1 && (
        <>
          <button type="button" className="product-lightbox__arrow product-lightbox__arrow--prev" onClick={() => go(index - 1)} aria-label="Önceki görsel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="product-lightbox__arrow product-lightbox__arrow--next" onClick={() => go(index + 1)} aria-label="Sonraki görsel">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="product-lightbox__count">{index + 1} / {total}</span>
        </>
      )}
    </div>
  );
}
