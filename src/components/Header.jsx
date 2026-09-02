import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { header } from '@/data/homepageContent';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import GlassSurface from './GlassSurface';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const CHEMICALWORKZ_URL = 'https://www.chemicalworkz.de/';

export default function Header() {
  const { t } = useLanguage();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  useBodyScrollLock(menuOpen);

  // The mobile menu closes ONLY by picking a nav item or pressing its own X (owner
  // decision, 2026-09 — it used to also close on any tap outside the header, like the
  // dropdowns do, and that was explicitly unwanted here). Escape stays: it's the keyboard
  // equivalent of the X button, not an outside tap, and dismissing a menu with Escape is a
  // baseline expectation for keyboard users.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // The header is now a persistent singleton in _app.jsx (never unmounted on client-side
  // navigation — that remount was what flashed the glass pill flat/opaque on every nav).
  // Closing the mobile menu on navigation used to be a free side effect of that unmount;
  // now it has to be explicit. routeChangeStart (not Complete) so the menu is already
  // folding as the new page comes in. The nav links' own onClick close still covers the
  // hash-anchor cases that never touch the router.
  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

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

  // Real-page nav items ("/urunler", the logo's "/") render as next/link so navigation is
  // CLIENT-SIDE — as plain <a> tags they forced a full browser reload, which rebuilds the
  // whole document and stands the header's backdrop-filter compositing layer up cold (the
  // flat/opaque header flash the user recorded when tapping "Ürünler" in the mobile menu).
  // The persistent-header layout in _app.jsx only helps navigations that go through Next's
  // router, so these links have to actually use it. Hash items stay plain <a>: on the
  // homepage that's what keeps the Lenis-eased in-page scroll, and off it the full
  // "/#section" load scrolls to the section natively — a client-side hash nav would get
  // overridden by _app.jsx's own scroll positioning (it scrolls to 0/saved on route change).
  const NavAnchor = ({ href, ...rest }) => (href.startsWith('#') || href.startsWith('/#') ? <a href={href} {...rest} /> : <Link href={href} {...rest} />);

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
        <Link href="/" className="site-header__logo-link" aria-label="Vision Detail — anasayfa" onClick={onLogoClick}>
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
        </Link>
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
                <NavAnchor href={resolveNavHref(item.href)} className="gradient-hover">
                  {t(item.label)}
                </NavAnchor>
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

      {/* Always mounted, shown/hidden via opacity — NOT conditionally rendered like the
          other popovers (no usePresence here). Mounting a fresh backdrop-filter surface at
          click time forces the compositor to stand up the blur + SVG-distortion layer from
          scratch, and its first frames render with no blur — the page behind flashed sharp,
          then snapped blurry. Keeping the node permanently in the DOM (opacity: 0, never
          display:none/visibility:hidden — those stop compositing and defeat the pre-warm)
          keeps that layer warm so the blur is there from the very first frame. While closed
          it's inert + aria-hidden + pointer-events:none, so it's invisible to keyboard,
          screen readers and taps. React 18 doesn't forward a boolean `inert`, hence the
          empty-string form. */}
      <GlassSurface
        as="div"
        id="mobile-nav"
        // --tight swaps in the smaller-scale distortion filter (see GlassSurface.scss and
        // GlassFilterDefs.jsx) — the default one tears at this panel's size, which is what
        // read as the menu "screwing up" (page content bleeding through, garbled text).
        // The language dropdown already uses this same fix; this panel just never got it.
        className={`site-header__mobile-menu glass-surface--veil glass-surface--calm glass-surface--tight glass-surface--solid glass-surface--menu${menuOpen ? ' is-open' : ''}`}
        contentClassName="site-header__mobile-menu-content"
        aria-hidden={!menuOpen}
        inert={menuOpen ? undefined : ''}
      >
        <nav aria-label="Mobil menü">
          <ul>
            {header.nav.map((item) => (
              <li key={item.href}>
                <NavAnchor href={resolveNavHref(item.href)} className="gradient-hover" onClick={() => setMenuOpen(false)}>
                  {t(item.label)}
                </NavAnchor>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__mobile-controls">
          <ThemeToggle variant="inline" />
          <LanguageSwitcher variant="inline" />
        </div>
      </GlassSurface>
    </GlassSurface>
  );
}
