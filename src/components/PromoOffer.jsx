import { useEffect, useRef, useState } from 'react';
import { contactSection } from '@/data/homepageContent';
import { useLanguage } from '@/context/LanguageContext';
import GlassSurface from './GlassSurface';

// Shows once, a beat after the products page settles, in the same bottom-right FAB column
// as WhatsAppFab (stacked above it, same footer-avoidance lift technique as
// WhatsAppFab.jsx/ScrollTopButton.jsx so it never sits on top of the footer). Dismissing it
// (or just letting it show) marks it seen for the rest of the browser session via
// sessionStorage — a shopper who navigates products → a product page → back to products
// shouldn't see it pop up again every time.
const SHOW_DELAY_MS = 1400;
const SESSION_KEY = 'vd-promo-offer-seen';
const WHATSAPP_MESSAGE = 'Merhaba, web siteniz üzerinden geldim. VSN10 koduyla sipariş vermek istiyorum.';

const TEXT = {
  title: { tr: 'Web Sitemize Özel %10 Avantaj!', en: '10% Off, Just for Web Visitors!', de: '10 % Rabatt exklusiv für die Website!' },
  body: {
    tr: 'ChemicalWorkz ürünlerinde %10 indirimden yararlanmak için WhatsApp hattımıza ulaşın ve VSN10 kodunu iletin.',
    en: "Reach out on WhatsApp and mention code VSN10 to get 10% off ChemicalWorkz products.",
    de: 'Kontaktieren Sie uns über WhatsApp und nennen Sie den Code VSN10, um 10 % Rabatt auf ChemicalWorkz-Produkte zu erhalten.',
  },
  cta: { tr: 'WhatsApp ile Ulaş', en: 'Message on WhatsApp', de: 'Über WhatsApp kontaktieren' },
  close: { tr: 'Kapat', en: 'Close', de: 'Schließen' },
};

export default function PromoOffer() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden until the session check resolves
  const cardRef = useRef(null);

  useEffect(() => {
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // Storage can throw in a locked-down/private context — fail open and just show it once.
    }
    if (alreadySeen) return undefined;

    setDismissed(false);
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Same footer-avoidance lift as WhatsAppFab.jsx/ScrollTopButton.jsx, tracked
  // independently (--fab-lift is set inline per-element, not shared) — this card sits
  // above the WhatsApp FAB in the same right-edge stack, so it needs to rise with it.
  useEffect(() => {
    const footer = document.querySelector('.site-footer');
    const card = cardRef.current;
    if (!footer || !card) return undefined;

    const GAP = 16;
    let raf = 0;
    const update = () => {
      raf = 0;
      const footerTop = footer.getBoundingClientRect().top;
      const restBottom = parseFloat(getComputedStyle(card).bottom) || 0;
      const overlap = window.innerHeight - restBottom - footerTop + GAP;
      card.style.setProperty('--fab-lift', `${Math.max(0, overlap)}px`);
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

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Nothing to fall back to here — worst case it can show again next navigation.
    }
  };

  if (dismissed) return null;

  const whatsappHref = `${contactSection.whatsappHref}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <GlassSurface
      as="div"
      ref={cardRef}
      className={`promo-offer glass-surface--calm glass-surface--solid glass-surface--menu${visible ? ' promo-offer--visible' : ''}`}
      contentClassName="promo-offer__content"
      role="dialog"
      aria-label={t(TEXT.title)}
      aria-hidden={!visible}
    >
      <button type="button" className="promo-offer__close" onClick={dismiss} aria-label={t(TEXT.close)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <p className="promo-offer__title">{t(TEXT.title)}</p>
      <p className="promo-offer__body">{t(TEXT.body)}</p>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="promo-offer__cta"
      >
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.02 4C9.4 4 4 9.37 4 15.98c0 2.15.57 4.15 1.56 5.9L4 28l6.28-1.53a11.9 11.9 0 0 0 5.74 1.46h.01c6.62 0 12.01-5.37 12.01-11.98C28.04 9.37 22.65 4 16.02 4Zm0 21.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.92 1-3.66-.24-.38a9.86 9.86 0 0 1-1.53-5.3c0-5.47 4.46-9.92 9.95-9.92 2.66 0 5.15 1.03 7.03 2.9a9.85 9.85 0 0 1 2.91 7.03c0 5.47-4.46 9.92-9.95 10Z"
          />
          <path
            fill="currentColor"
            d="M22.4 18.68c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.22 2.26 3.46 5.49 4.85.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"
          />
        </svg>
        <span>{t(TEXT.cta)}</span>
      </a>
    </GlassSurface>
  );
}
