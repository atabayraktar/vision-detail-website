import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { footer, contactSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    // No .glass-drift — see Header.jsx's note: the scroll-lag transform breaks
    // backdrop-filter rendering on this element/its descendants after scrolling.
    <GlassSurface as="footer" className="site-footer glass-surface--calm" contentClassName="site-footer__content">
      <a href="/" className="site-footer__logo" aria-label="Vision Detail — anasayfa">
        {/* Both variants stacked, crossfaded in pure CSS on theme change — see Header.jsx's
            identical technique and Footer.scss for why (an instant src-swap read as the
            whole theme toggle "snapping" even though every color token elsewhere faded). */}
        <span className="site-footer__logo-stack">
          <Image src="/logos/vision-detail-dark.webp" alt="Vision Detail" width={120} height={50} className="site-footer__vd-logo site-footer__vd-logo--dark" />
          <Image src="/logos/vision-detail-light.webp" alt="" aria-hidden="true" width={120} height={50} className="site-footer__vd-logo site-footer__vd-logo--light" />
        </span>
        {/* Same masked-gradient hover technique as the header/About logos (see Header.jsx) —
            a gradient-painted copy of the same image, faded in and swept on hover. Mask
            uses the dark file's alpha shape regardless of theme (see Header.jsx's note). */}
        <span
          className="site-footer__logo-glow"
          style={{ maskImage: 'url(/logos/vision-detail-dark.webp)', WebkitMaskImage: 'url(/logos/vision-detail-dark.webp)' }}
          aria-hidden="true"
        />
      </a>

      <p className="site-footer__rights">
        © {year} Vision Detail — {t(footer.rights)}
      </p>

      {/* Shared gradient def for the icon hover state below — SVG icons can't use the
          background-clip:text trick .gradient-hover uses for links, so their hover state
          points stroke/fill at this gradient directly (see Footer.scss). */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <linearGradient id="footer-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--g1)" />
          <stop offset="28%" stopColor="var(--g2)" />
          <stop offset="50%" stopColor="var(--g3)" />
          <stop offset="72%" stopColor="var(--g2)" />
          <stop offset="100%" stopColor="var(--g1)" />
        </linearGradient>
      </svg>

      <ul className="site-footer__icons">
        <li>
          <a href={`tel:${contactSection.phone.replace(/\s/g, '')}`} aria-label="Telefon">
            {/* Real telephone-handset glyph — distinct from the WhatsApp mark below (they
                used to share the same outline, easy to mistake for each other at 18px). */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </li>
        <li>
          <a href={contactSection.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            {/* Same real WhatsApp brand mark as WhatsAppFab.jsx. */}
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16.02 4C9.4 4 4 9.37 4 15.98c0 2.15.57 4.15 1.56 5.9L4 28l6.28-1.53a11.9 11.9 0 0 0 5.74 1.46h.01c6.62 0 12.01-5.37 12.01-11.98C28.04 9.37 22.65 4 16.02 4Zm0 21.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.92 1-3.66-.24-.38a9.86 9.86 0 0 1-1.53-5.3c0-5.47 4.46-9.92 9.95-9.92 2.66 0 5.15 1.03 7.03 2.9a9.85 9.85 0 0 1 2.91 7.03c0 5.47-4.46 9.92-9.95 10Z"
              />
              <path
                fill="currentColor"
                d="M22.4 18.68c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.22 2.26 3.46 5.49 4.85.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"
              />
            </svg>
          </a>
        </li>
        <li>
          <a href={contactSection.instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
            </svg>
          </a>
        </li>
        <li>
          <a href={contactSection.facebookHref} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M13.6 8.6h1.5V6.2h-1.9c-1.8 0-2.9 1.1-2.9 3v1.6H8.6v2.3h1.7V18h2.4v-4.9h1.8l.3-2.3h-2.1v-1.3c0-.6.2-.9.9-.9Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </li>
        <li>
          <a href={contactSection.mapHref} target="_blank" rel="noopener noreferrer" aria-label="Konum">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </a>
        </li>
      </ul>
    </GlassSurface>
  );
}
