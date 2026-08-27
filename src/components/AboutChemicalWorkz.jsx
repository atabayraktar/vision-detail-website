import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { aboutChemicalWorkz } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// Icons sit directly on the card's glass (no nested chip) as a quiet counterpoint to the
// big stat; the stat carries the hierarchy, the icon only annotates it. Three are the
// site's usual 1.6-stroke line-icon language (medal, people, gauge); the EU/Germany ones
// are real small flags — a monochrome outline can't read as "the EU flag" the way color
// can, so those two are a deliberate, scoped exception to the single-color icon rule.
// All five share the same ~26px footprint (flags 26px tall at their native 3:2 ratio).
const ICONS = {
  rank: (
    // award medal — market-leader rank
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <circle cx="12" cy="9.6" r="4.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.4 13.4 8 19.6l4-2 4 2-1.4-6.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eu: (
    // EU flag — circle of gold stars on blue
    <svg viewBox="0 0 36 24" width="39" height="26" aria-hidden="true">
      <clipPath id="about-flag-eu-clip">
        <rect width="36" height="24" rx="3" />
      </clipPath>
      <g clipPath="url(#about-flag-eu-clip)">
        <rect width="36" height="24" fill="#003399" />
        <circle cx="18" cy="5.2" r="1.15" fill="#ffcc00" />
        <circle cx="23.1" cy="6.9" r="1.15" fill="#ffcc00" />
        <circle cx="26.4" cy="11.4" r="1.15" fill="#ffcc00" />
        <circle cx="26.4" cy="16.6" r="1.15" fill="#ffcc00" />
        <circle cx="23.1" cy="21.1" r="1.15" fill="#ffcc00" />
        <circle cx="18" cy="22.8" r="1.15" fill="#ffcc00" />
        <circle cx="12.9" cy="21.1" r="1.15" fill="#ffcc00" />
        <circle cx="9.6" cy="16.6" r="1.15" fill="#ffcc00" />
        <circle cx="9.6" cy="11.4" r="1.15" fill="#ffcc00" />
        <circle cx="12.9" cy="6.9" r="1.15" fill="#ffcc00" />
      </g>
    </svg>
  ),
  'flag-de': (
    // German flag — black / red / gold
    <svg viewBox="0 0 36 24" width="39" height="26" aria-hidden="true">
      <clipPath id="about-flag-de-clip">
        <rect width="36" height="24" rx="3" />
      </clipPath>
      <g clipPath="url(#about-flag-de-clip)">
        <rect width="36" height="8" fill="#1a1a1a" />
        <rect y="8" width="36" height="8" fill="#dd0000" />
        <rect y="16" width="36" height="8" fill="#ffce00" />
      </g>
    </svg>
  ),
  customers: (
    // two people — customers, plural, not a single-customer icon
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <circle cx="8.6" cy="7.8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.4" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 19.6c.8-3.3 3.1-5 5.6-5s4.8 1.7 5.6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15 15c1.9.3 3.3 1.7 3.9 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  gear: (
    // performance gauge
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true">
      <path d="M4.4 17.2a8.4 8.4 0 1 1 15.2 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m12 15.4 3.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="15.6" r="1.3" fill="currentColor" />
    </svg>
  ),
};

export default function AboutChemicalWorkz() {
  const { t } = useLanguage();
  const { title, paragraph, image, boxes } = aboutChemicalWorkz;

  return (
    <section className="about-cw container" id="chemicalworkz">
      <div className="about-cw__top" data-reveal>
        <div className="about-cw__image-wrap">
          <Image src={image} alt="ChemicalWorkz ürünleri" fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />
        </div>
        <div className="about-cw__copy">
          <h2 className="about-cw__title">{t(title)}</h2>
          <p className="about-cw__paragraph">{t(paragraph)}</p>
          <a
            href="https://www.chemicalworkz.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="about-cw__site-link"
          >
            <span className="about-cw__site-link-logo">
              <Image src="/logos/chemicalworkz-dark.svg" alt="" width={96} height={19} aria-hidden="true" />
              <span
                className="about-cw__site-link-glow"
                style={{ maskImage: 'url(/logos/chemicalworkz-dark.svg)', WebkitMaskImage: 'url(/logos/chemicalworkz-dark.svg)' }}
                aria-hidden="true"
              />
            </span>
            <span className="gradient-hover">
              {t({ tr: 'Siteyi ziyaret edin', en: 'Visit the site', de: 'Website besuchen' })}
            </span>
          </a>
        </div>
      </div>

      <div className="about-cw__boxes">
        {boxes.map((box) => (
          <GlassSurface
            as="div"
            className="about-cw__box glass-surface--tight"
            contentClassName="about-cw__box-content"
            key={box.icon}
            data-reveal
          >
            <div className="about-cw__box-head">
              <span className="about-cw__stat gradient-hover">{t(box.eyebrow)}</span>
              <span className="about-cw__box-icon" aria-hidden="true">
                {ICONS[box.icon]}
              </span>
            </div>
            <p className="about-cw__box-info">{t(box.info)}</p>
          </GlassSurface>
        ))}
      </div>
    </section>
  );
}
