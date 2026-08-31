import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { polishingBanner } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// No more quiz pop-up — the banner now points straight at the EVO Mini product page (the
// polisher the quiz used to route people toward answer-by-answer, per the user's own call:
// "artık pop-up yok tıklayınca direk o ürüne gidecek").
const BANNER_PRODUCT_HREF = '/urunler/cw-evo-mini';

export default function PolishingBanner() {
  const { t } = useLanguage();

  return (
    <section className="polishing-banner">
      <div className="polishing-banner__frame" data-reveal>
        {/* Real art-directed portrait crop for mobile, not a resize (same pattern as
            HeroSlider.jsx's hero-4 slide) — plain CSS breakpoint swap, see
            PolishingBanner.scss. Each of mobile/desktop also stacks a dark-mode variant on
            top, crossfaded by theme via the same opacity technique as Header.jsx's logo
            (--light/--dark class pair), independent of the mobile/mobile-desktop swap. */}
        {polishingBanner.mobileImage && (
          <>
            <Image
              src={polishingBanner.mobileImage}
              alt="ChemicalWorkz polisaj makinesi"
              fill
              sizes="100vw"
              className="polishing-banner__image-mobile polishing-banner__image--light"
              style={{ objectFit: 'cover' }}
            />
            {polishingBanner.mobileImageDark && (
              <Image
                src={polishingBanner.mobileImageDark}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                className="polishing-banner__image-mobile polishing-banner__image--dark"
                style={{ objectFit: 'cover' }}
              />
            )}
          </>
        )}
        <Image
          src={polishingBanner.image}
          alt="ChemicalWorkz polisaj makinesi"
          fill
          sizes="(max-width: 900px) 100vw, 1200px"
          className={`polishing-banner__image--light${polishingBanner.mobileImage ? ' polishing-banner__image-desktop' : ''}`}
          style={{ objectFit: 'cover' }}
        />
        {polishingBanner.imageDark && (
          <Image
            src={polishingBanner.imageDark}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 900px) 100vw, 1200px"
            className={`polishing-banner__image--dark${polishingBanner.mobileImage ? ' polishing-banner__image-desktop' : ''}`}
            style={{ objectFit: 'cover' }}
          />
        )}
        {/* No .glass-drift — see Header.jsx's note: the scroll-lag transform breaks
            backdrop-filter rendering on this element/its descendants after scrolling. */}
        <GlassSurface as="div" className="polishing-banner__panel glass-surface--calm" contentClassName="polishing-banner__panel-content">
          <h2 className="polishing-banner__title">{t(polishingBanner.title)}</h2>
          <GlassSurface
            as={Link}
            href={BANNER_PRODUCT_HREF}
            className="polishing-banner__cta glass-surface--tight glass-surface--solid"
            contentClassName="polishing-banner__cta-content"
          >
            <span className="btn-glass__label">{t(polishingBanner.cta)}</span>
          </GlassSurface>
        </GlassSurface>
      </div>
    </section>
  );
}
