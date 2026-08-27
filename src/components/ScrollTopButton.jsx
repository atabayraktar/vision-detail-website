import { useEffect, useRef, useState } from 'react';
import GlassSurface from './GlassSurface';

// Shows once the page is scrolled (near) all the way down — not the more common "after one
// viewport of scroll" pattern, per the brand direction here — and animates in/out rather
// than popping. Stacked above WhatsAppFab (same right-edge column, same footer-avoidance
// lift technique) so the two read as one consistent FAB stack instead of colliding.
const NEAR_BOTTOM_PX = 200;

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    const fab = fabRef.current;
    if (!footer || !fab) return undefined;

    const GAP = 16;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const nearBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - NEAR_BOTTOM_PX;
      setVisible(nearBottom);

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

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <GlassSurface
      as="button"
      type="button"
      ref={fabRef}
      className={`scroll-top-fab glass-surface--tight${visible ? ' scroll-top-fab--visible' : ''}`}
      contentClassName="scroll-top-fab__content"
      onClick={scrollTop}
      aria-label="Sayfa başına dön"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </GlassSurface>
  );
}
