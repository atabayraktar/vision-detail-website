import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';
import Lightbox from './Lightbox';

const TEXT = {
  openFullscreen: { tr: 'Görseli tam ekran aç', en: 'Open image fullscreen', de: 'Bild im Vollbild öffnen' },
  prevImage: { tr: 'Önceki görsel', en: 'Previous image', de: 'Vorheriges Bild' },
  nextImage: { tr: 'Sonraki görsel', en: 'Next image', de: 'Nächstes Bild' },
  imageN: { tr: (i) => `${i}. görsel`, en: (i) => `Image ${i}`, de: (i) => `Bild ${i}` },
  video: { tr: 'Video', en: 'Video', de: 'Video' },
};

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
  const { t, lang } = useLanguage();
  const imageN = (i) => (TEXT.imageN[lang] ?? TEXT.imageN.tr)(i);
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
            aria-label={t(TEXT.openFullscreen)}
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
              aria-label={t(TEXT.prevImage)}
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
              aria-label={t(TEXT.nextImage)}
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
                aria-label={typeof slide === 'string' ? imageN(i + 1) : t(TEXT.video)}
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
