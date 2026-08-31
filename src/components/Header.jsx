import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { header } from '@/data/homepageContent';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const CHEMICALWORKZ_URL = 'https://www.chemicalworkz.de/';

export default function Header() {
  const { t } = useLanguage();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { mounted: menuMounted, closing: menuClosing } = usePresence(menuOpen, 350);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);

  // Same outside-tap-closes behavior as LanguageSwitcher's dropdown — the mobile menu is
  // the same class of floating panel, and the user-reported bug was that it only closed via
  // the burger toggle or a nav link, not by tapping the page behind it like every other
  // dropdown on the site.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // Small "reacts to scroll" cue for the floating glass pill — solidifies slightly once
  // there's page content behind it to blur, instead of sitting static the whole time.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Already on the homepage: a normal <a href="/"> still forces a full reload for what
  // the user only wants to feel like "take me back to the top". Elsewhere the link is
  // real navigation, so let it behave like one.
  const onLogoClick = (event) => {
    if (router.pathname === '/') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // "ChemicalWorkz" and "İletişim" are in-page anchors to homepage-only sections — a bare
  // "#chemicalworkz" href from /urunler or /urunler/[id] just appends the hash to the
  // CURRENT url (e.g. /urunler#chemicalworkz), which points at nothing and silently does
  // nothing (the user-reported "çalışmıyo" bug). Off the homepage these need the leading
  // "/" to actually navigate there first; on the homepage itself, the bare hash is what
  // keeps the existing Lenis-eased in-page scroll (see _app.jsx) instead of forcing a full
  // reload of "/" just to land on a section already on screen.
  const resolveNavHref = (href) => (href.startsWith('#') && router.pathname !== '/' ? `/${href}` : href);

  // Clears a section's hash from the URL once you've scrolled fully past it — clicking
  // "ChemicalWorkz" leaves "#chemicalworkz" sitting in the address bar forever otherwise,
  // stale the moment you keep scrolling past that section. Homepage-only (these ids only
  // exist there); a plain history.replaceState (not router.replace) so this never touches
  // Next's router — no route-change events, no page-transition/scroll-restore side effects
  // for what is purely a same-page URL cosmetic.
  useEffect(() => {
    if (router.pathname !== '/') return undefined;

    const hashIds = header.nav
      .map((item) => item.href)
      .filter((href) => href.startsWith('#'))
      .map((href) => href.slice(1));
    const sections = hashIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && window.location.hash === `#${entry.target.id}`) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      });
    });
    sections.forEach((section) => io.observe(section));
    return () => io.disconnect();
  }, [router.pathname]);

  return (
    <GlassSurface
      as="header"
      ref={headerRef}
      // No .glass-drift here — the scroll-lag transform on this element (or any ancestor
      // of a backdrop-filter user) breaks backdrop-filter rendering the moment a
      // backdrop-filter layer is freshly created while that transform is active: the
      // mobile menu / language dropdown mounting while the header had already drifted from
      // scrolling rendered with zero blur, page content showing straight through (a real,
      // reproducible Chromium compositing bug, not a one-off). The header itself is exactly
      // that ancestor for both dropdowns, so it can't carry this transform. Confirmed via a
      // real scroll-then-open repro; lost effect is a few px of decorative parallax.
      className={`site-header glass-surface--calm${scrolled ? ' is-scrolled' : ''}`}
      contentClassName="site-header__content"
    >
      <div className="site-header__brand">
        <a href="/" className="site-header__logo-link" aria-label="Vision Detail — anasayfa" onClick={onLogoClick}>
          {/* Both logo variants render at once, stacked, with the theme switch crossfading
              their opacity in pure CSS (see Header.scss) — swapping a single <Image>'s src
              instead snapped instantly with no way to transition between two different
              files, which read as the whole theme toggle "just snapping" even though every
              color token elsewhere was already crossfading. */}
          <span className="site-header__vd-logo-stack">
            <Image
              src="/logos/vision-detail-dark.webp"
              alt="Vision Detail"
              width={140}
              height={58}
              priority
              className="site-header__vd-logo site-header__vd-logo--dark"
            />
            <Image
              src="/logos/vision-detail-light.webp"
              alt=""
              aria-hidden="true"
              width={140}
              height={58}
              priority
              className="site-header__vd-logo site-header__vd-logo--light"
            />
          </span>
          {/* Gradient-on-hover for a raster logo: a masked copy of the same image, painted
              with the brand gradient instead of re-colored via filter (imprecise/hacky for
              matching exact gradient stops), faded in on hover/focus. Mask uses the dark
              file's alpha shape regardless of theme — both variants share the same silhouette,
              only the ink color differs, and a mask only reads the alpha channel anyway. */}
          <span
            className="site-header__logo-glow"
            style={{ maskImage: 'url(/logos/vision-detail-dark.webp)', WebkitMaskImage: 'url(/logos/vision-detail-dark.webp)' }}
            aria-hidden="true"
          />
        </a>
        <span className="site-header__divider" aria-hidden="true" />
        <div className="site-header__cw">
          <a
            href={CHEMICALWORKZ_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="site-header__cw-logo-link"
            aria-label="ChemicalWorkz — chemicalworkz.de"
          >
            <Image
              src="/logos/chemicalworkz-dark.svg"
              alt="ChemicalWorkz"
              width={112}
              height={22}
              className="site-header__cw-logo"
            />
            <span
              className="site-header__logo-glow"
              style={{ maskImage: 'url(/logos/chemicalworkz-dark.svg)', WebkitMaskImage: 'url(/logos/chemicalworkz-dark.svg)' }}
              aria-hidden="true"
            />
          </a>
          <span className="site-header__cw-info">{t(header.info)}</span>
        </div>
      </div>

      {/* Nav sits grouped with the language switcher on the right (not floating alone in
          the middle) — one flex group so the two read as a single cluster. */}
      <div className="site-header__nav-group">
        <nav className="site-header__nav" aria-label="Ana menü">
          <ul>
            {header.nav.map((item) => (
              <li key={item.href}>
                <a href={resolveNavHref(item.href)} className="gradient-hover">
                  {t(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__right">
          <div className="site-header__controls-desktop">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className="nav__burger"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuMounted && (
        <GlassSurface
          as="div"
          id="mobile-nav"
          // --tight swaps in the smaller-scale distortion filter (see GlassSurface.scss and
          // GlassFilterDefs.jsx) — the default one tears at this panel's size, which is what
          // read as the menu "screwing up" (page content bleeding through, garbled text).
          // The language dropdown already uses this same fix; this panel just never got it.
          className={`site-header__mobile-menu glass-surface--calm glass-surface--tight glass-surface--solid glass-surface--menu${menuClosing ? ' is-closing' : ''}`}
          contentClassName="site-header__mobile-menu-content"
        >
          <nav aria-label="Mobil menü">
            <ul>
              {header.nav.map((item) => (
                <li key={item.href}>
                  <a href={resolveNavHref(item.href)} className="gradient-hover" onClick={() => setMenuOpen(false)}>
                    {t(item.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-header__mobile-controls">
            <ThemeToggle variant="inline" />
            <LanguageSwitcher variant="inline" />
          </div>
        </GlassSurface>
      )}
    </GlassSurface>
  );
}
