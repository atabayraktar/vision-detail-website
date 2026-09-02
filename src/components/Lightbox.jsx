import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import usePresence from '@/hooks/usePresence';
import { useLanguage } from '@/context/LanguageContext';

const TEXT = {
  prevImage: { tr: 'Önceki görsel', en: 'Previous image', de: 'Vorheriges Bild' },
  nextImage: { tr: 'Sonraki görsel', en: 'Next image', de: 'Nächstes Bild' },
  close: { tr: 'Kapat', en: 'Close', de: 'Schließen' },
};

// Full-screen image zoom, shared by every image grid on the site (ProductGallery's main
// product shots, ProductPoster's poster photos) so a shopper gets the same zoom affordance
// and the same backdrop/close/focus-trap pattern wherever a product photo shows up. Same
// language as the mobile filter sheet's backdrop/panel (FilterPanel.jsx).
//
// Always mounted by the caller (controlled via `open`) so usePresence can delay the unmount
// long enough for an exit animation — see that hook's comment. Keeps its own `index`
// (seeded from `initialIndex` whenever it opens) — the caller may be showing a different
// slide (a gallery thumbnail, a poster swiper) than whatever the lightbox last landed on.
export default function Lightbox({ open, images, initialIndex, alt, onClose }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const { mounted, closing } = usePresence(open, 350);
  useBodyScrollLock(open);
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

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(index - 1);
      if (event.key === 'ArrowRight') go(index + 1);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
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
      <button type="button" className="product-lightbox__close" onClick={onClose} aria-label={t(TEXT.close)}>
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
          <button type="button" className="product-lightbox__arrow product-lightbox__arrow--prev" onClick={() => go(index - 1)} aria-label={t(TEXT.prevImage)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="product-lightbox__arrow product-lightbox__arrow--next" onClick={() => go(index + 1)} aria-label={t(TEXT.nextImage)}>
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
