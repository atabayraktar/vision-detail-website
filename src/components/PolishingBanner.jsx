import { useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { polishingBanner } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';
import QuizModal from './QuizModal';

export default function PolishingBanner() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <section className="polishing-banner">
      <div className="polishing-banner__frame" data-reveal>
        {/* Real art-directed portrait crop for mobile, not a resize (same pattern as
            HeroSlider.jsx's hero-4 slide) — plain CSS breakpoint swap, see
            PolishingBanner.scss. */}
        {polishingBanner.mobileImage && (
          <Image
            src={polishingBanner.mobileImage}
            alt="ChemicalWorkz polisaj makinesi"
            fill
            sizes="100vw"
            className="polishing-banner__image-mobile"
            style={{ objectFit: 'cover' }}
          />
        )}
        <Image
          src={polishingBanner.image}
          alt="ChemicalWorkz polisaj makinesi"
          fill
          sizes="(max-width: 900px) 100vw, 1200px"
          className={polishingBanner.mobileImage ? 'polishing-banner__image-desktop' : undefined}
          style={{ objectFit: 'cover' }}
        />
        <GlassSurface as="div" className="polishing-banner__panel glass-surface--calm glass-drift" contentClassName="polishing-banner__panel-content">
          <h2 className="polishing-banner__title">{t(polishingBanner.title)}</h2>
          <GlassSurface
            as="button"
            type="button"
            className="polishing-banner__cta glass-surface--tight glass-surface--solid"
            contentClassName="polishing-banner__cta-content"
            ref={triggerRef}
            onClick={() => setOpen(true)}
          >
            <span className="btn-glass__label">{t(polishingBanner.cta)}</span>
          </GlassSurface>
        </GlassSurface>
      </div>

      <QuizModal open={open} onClose={() => { setOpen(false); triggerRef.current?.focus(); }} />
    </section>
  );
}
