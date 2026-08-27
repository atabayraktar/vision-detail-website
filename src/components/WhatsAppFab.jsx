import { useEffect, useRef } from 'react';
import { contactSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// Brand guidelines' icon+button spec (05) shows a rounded-square glass chip housing a
// smaller circular brand-color badge — not a flat solid-green circle — so the WhatsApp
// glyph itself is the real recognizable brand mark (SVG, not an emoji — renders identically
// across platforms and can be recolored/kept crisp at any size).
export default function WhatsAppFab() {
  const fabRef = useRef(null);

  // The fixed FAB must never sit ON the footer, but it should stay visible, parked just
  // above it — not disappear, and not flush against it either. As the footer's top edge
  // rises past the FAB's own bottom inset, lift the FAB by that overlap plus a fixed gap
  // so a sliver of breathing room always survives between the two.
  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    const fab = fabRef.current;
    if (!footer || !fab) return undefined;

    const GAP = 16;
    let raf = 0;
    const update = () => {
      raf = 0;
      const footerTop = footer.getBoundingClientRect().top;
      const restBottom = parseFloat(getComputedStyle(fab).bottom) || 0;
      const overlap = window.innerHeight - restBottom - footerTop + GAP;
      fab.style.setProperty('--fab-lift', `${Math.max(0, overlap)}px`);
    };
    const onScrollOrResize = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <GlassSurface
      as="a"
      ref={fabRef}
      className="whatsapp-fab glass-surface--tight"
      contentClassName="whatsapp-fab__content"
      href={`${contactSection.whatsappHref}?text=${encodeURIComponent('Merhaba, Vision Detail ürünleri hakkında bilgi almak istiyorum.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile iletişime geç"
    >
      <span className="whatsapp-fab__badge">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            fill="#fff"
            d="M16.02 4C9.4 4 4 9.37 4 15.98c0 2.15.57 4.15 1.56 5.9L4 28l6.28-1.53a11.9 11.9 0 0 0 5.74 1.46h.01c6.62 0 12.01-5.37 12.01-11.98C28.04 9.37 22.65 4 16.02 4Zm0 21.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.92 1-3.66-.24-.38a9.86 9.86 0 0 1-1.53-5.3c0-5.47 4.46-9.92 9.95-9.92 2.66 0 5.15 1.03 7.03 2.9a9.85 9.85 0 0 1 2.91 7.03c0 5.47-4.46 9.92-9.95 10Z"
          />
          <path
            fill="#fff"
            d="M22.4 18.68c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.22 2.26 3.46 5.49 4.85.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"
          />
        </svg>
      </span>
    </GlassSurface>
  );
}
