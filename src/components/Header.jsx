import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { header } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const CHEMICALWORKZ_URL = 'https://www.chemicalworkz.de/';

export default function Header() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Logo rule: dark variation on light surfaces, light variation on dark surfaces (see
  // CLAUDE.md's Logo rule) — the header itself is a light/frosted glass surface in light
  // mode and a dark one in dark mode, so the logo swaps with the theme.
  const vdLogoSrc = theme === 'dark' ? '/logos/vision-detail-light.webp' : '/logos/vision-detail-dark.webp';

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

  return (
    <GlassSurface
      as="header"
      className={`site-header glass-surface--calm glass-drift${scrolled ? ' is-scrolled' : ''}`}
      contentClassName="site-header__content"
    >
      <div className="site-header__brand">
        <a href="/" className="site-header__logo-link" aria-label="Vision Detail — anasayfa" onClick={onLogoClick}>
          <Image
            src={vdLogoSrc}
            alt="Vision Detail"
            width={140}
            height={58}
            priority
            className="site-header__vd-logo"
          />
          {/* Gradient-on-hover for a raster logo: a masked copy of the same image, painted
              with the brand gradient instead of re-colored via filter (imprecise/hacky for
              matching exact gradient stops), faded in on hover/focus. */}
          <span
            className="site-header__logo-glow"
            style={{ maskImage: `url(${vdLogoSrc})`, WebkitMaskImage: `url(${vdLogoSrc})` }}
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

      {menuOpen && (
        <GlassSurface
          as="div"
          id="mobile-nav"
          className="site-header__mobile-menu glass-surface--calm glass-surface--solid"
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
