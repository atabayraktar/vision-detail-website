import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

// D2 (design architecture): the product's long-form "poster" story below the info block.
// Real data supplies 0-3 poster photos per SKU, a multi-paragraph written description
// (ÜRÜN POSTERİ GÖRSELİ / ÜRÜN POSTERİ AÇIKLAMASI in the source Excel) and, for cw-ms,
// an actual video clip instead of photos. The section renders as an editorial spread:
//   - An eyebrow + hairline anchors it as its own section (same rhythm as RelatedProducts)
//     instead of the old free-floating text wall.
//   - The first paragraph is set as a display-type lead; remaining paragraphs run in a
//     second column on desktop. Paragraphs whose first line is a short "Label:" (the
//     Excel copy's own "Öneri:" / "Önemli not:" convention) become quiet hairline callouts.
//   - Media adapts to what the SKU actually has: video → full-width cinematic loop;
//     1 photo → full-bleed; 2 photos → weighted pair; 3 photos → mosaic (one tall, two
//     stacked). Nothing renders for SKUs with no poster media at all.
const EYEBROW = { tr: 'Detaylı Bilgi', en: 'Product Details', de: 'Produktdetails' };

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

export default function ProductPoster({ images, video, description, alt }) {
  const { t } = useLanguage();
  const photos = (images || []).slice(0, 3);
  const videoRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  if (photos.length === 0 && !video) return null;

  const paragraphs = description
    ? t(description).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];
  const [lead, ...more] = paragraphs;

  return (
    <section className="product-poster" data-reveal aria-label={t(EYEBROW)}>
      <p className="product-poster__eyebrow">{t(EYEBROW)}</p>

      {lead && (
        <div className={`product-poster__text${more.length === 0 ? ' product-poster__text--solo' : ''}`}>
          <p className="product-poster__lead">{lead.split('\n').join(' ')}</p>
          {more.length > 0 && (
            <div className="product-poster__more">
              {more.map((p, i) => (
                <Paragraph key={i} text={p} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="product-poster__media">
        {video && (
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
        )}

        {photos.length === 1 && (
          <div className="product-poster__single">
            <Image src={photos[0]} alt={alt} fill sizes="100vw" style={{ objectFit: 'cover' }} />
          </div>
        )}

        {photos.length === 2 && (
          <div className="product-poster__duo">
            {photos.map((src, i) => (
              <span key={src} className="product-poster__duo-image">
                {/* Each shot gets its own numbered alt — the description above covers the
                    product as a whole, not what's pictured in any one frame, so these
                    aren't redundant with it. */}
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  sizes={i === 0 ? '(max-width: 700px) 100vw, 58vw' : '(max-width: 700px) 100vw, 42vw'}
                  style={{ objectFit: 'cover' }}
                />
              </span>
            ))}
          </div>
        )}

        {photos.length === 3 && (
          <div className="product-poster__mosaic">
            {photos.map((src, i) => (
              <span key={src} className="product-poster__mosaic-image">
                <Image
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  sizes={i === 0 ? '(max-width: 700px) 100vw, 60vw' : '(max-width: 700px) 100vw, 40vw'}
                  style={{ objectFit: 'cover' }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
