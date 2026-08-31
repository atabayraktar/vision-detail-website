import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

// D2 (design architecture): poster imagery below the info block. The brief used to be a
// single full-bleed shot; the real product data supplies 0-3 "a"-prefixed poster photos
// per SKU plus a real written poster description (ÜRÜN POSTERİ GÖRSELİ / ÜRÜN POSTERİ
// AÇIKLAMASI in the source Excel — see scripts/build-products.mjs), so the layout now
// adapts to how many images (and how much text) a given product actually has instead of
// assuming exactly one of each:
//   - 0 images: nothing renders (most products still don't have poster photos).
//   - 1 image: the original full-bleed treatment — a photo is still the point, text (if
//     any) sits under it as a quiet caption rather than competing with it.
//   - 2-3 images: an editorial spread — the description leads as real intro copy, the
//     photos follow as an equal-width row (stacked on mobile).
export default function ProductPoster({ images, description, alt }) {
  const { t } = useLanguage();
  const photos = (images || []).slice(0, 3);
  if (photos.length === 0) return null;

  const paragraphs = description ? t(description).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];
  const isSpread = photos.length > 1;

  return (
    <div className={`product-poster${isSpread ? ' product-poster--spread' : ''}`} data-reveal>
      {paragraphs.length > 0 && (
        <div className="product-poster__text">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {isSpread ? (
        <div className={`product-poster__row product-poster__row--${photos.length}`}>
          {photos.map((src, i) => (
            <span key={src} className="product-poster__row-image">
              {/* Each shot gets its own numbered alt — the description paragraph above
                  covers the product as a whole, not what's specifically pictured in any one
                  frame, so these aren't redundant with it (image-redundant-alt only applies
                  when the exact same text already sits right next to the image). */}
              <Image src={src} alt={`${alt} — ${i + 1}`} fill sizes="(max-width: 700px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
            </span>
          ))}
        </div>
      ) : (
        <div className="product-poster__single">
          <Image src={photos[0]} alt={alt} fill sizes="100vw" style={{ objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}
