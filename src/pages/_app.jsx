import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Archivo, Hanken_Grotesk } from 'next/font/google';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import '@/styles/main.scss';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import GlassFilterDefs from '@/components/GlassFilterDefs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import ScrollTopButton from '@/components/ScrollTopButton';

// Self-hosted via next/font (built at compile time, no external request at runtime) —
// same Archivo/Hanken Grotesk variable families the brand file specifies, still driven by
// font-variation-settings for weight/width. axes:['wdth'] pulls in Archivo's width axis
// (the brand's "Width 125" headings); Hanken Grotesk on Google Fonts only exposes wght, so
// its wdth setting elsewhere in the CSS is a harmless no-op fallback.
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  axes: ['wdth'],
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Page-reveal + scroll restoration, coordinated so a "blink" never happens: the incoming
  // page stays invisible (opacity:0, see .page-transition/.is-visible in globals.scss)
  // until we've positioned its scroll correctly, THEN it fades in already-settled. Without
  // this ordering, Next's own automatic POP-navigation scroll restore fires the instant the
  // new page mounts — before client-hydrated state (e.g. /urunler's URL-synced filters) has
  // grown the page to its real height — so it restores against a still-short page and lands
  // near the top; our own correction then arrives a beat later and visibly snaps the
  // content into place. Hiding the page for that whole window makes the wrong intermediate
  // position invisible — the user only ever sees the final, correctly-scrolled state fade in.
  //
  // `ready` starts true (covers the very first load: server-rendered markup and the
  // client's initial hydration pass agree, so there's nothing to hide or restore — the
  // static HTML should just be there immediately, not delayed by an animation with nothing
  // to transition *from*). `isFirstPathRef` skips the hide/restore dance on that same first
  // run of the effect below (which fires once per pathname, including the initial one).
  const [ready, setReady] = useState(true);
  const isFirstPathRef = useRef(true);

  // Keyed to router.pathname (not asPath) so shallow query-only updates on the same page
  // (/urunler's filter/sort/page syncing, a product's variant swap) never trigger this —
  // only a real navigation to a different page does, matching the wrapper's own remount key
  // below.
  useEffect(() => {
    if (isFirstPathRef.current) {
      isFirstPathRef.current = false;
      return undefined;
    }

    setReady(false);
    const key = `scrollpos:${router.asPath}`;
    const saved = sessionStorage.getItem(key);

    let raf = 0;
    let cancelled = false;

    if (saved !== null) {
      const target = Number(saved);
      // A fixed frame count guessed wrong for anything further down the page (a product
      // near the bottom of the grid) — the destination page's own client-hydrated content
      // (e.g. /urunler's URL-synced filters) hadn't grown tall enough to actually contain
      // that scroll position yet, so we'd land short and then visibly correct once it did.
      // Poll instead: wait until the document is actually tall enough for `target`, one rAF
      // at a time. The cap is wall-clock time (Date.now()), not a frame count — a page in a
      // backgrounded/throttled tab can go many real seconds between rAF ticks, so a frame
      // count alone could leave the page invisible far longer than intended; this guarantees
      // a reveal within ~1.5s of real time either way (a page genuinely shorter than the
      // saved position, its content having changed, just reveals at whatever height it
      // settled at).
      const deadline = Date.now() + 1500;
      const waitForHeight = () => {
        if (cancelled) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll >= target || Date.now() >= deadline) {
          sessionStorage.removeItem(key);
          window.scrollTo(0, target);
          setReady(true);
        } else {
          raf = requestAnimationFrame(waitForHeight);
        }
      };
      raf = requestAnimationFrame(waitForHeight);
    } else {
      raf = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        setReady(true);
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  // Saved on every real navigation-away (routeChangeStart), keyed to the exact URL being
  // left (query included) so distinct filtered/variant views each restore correctly.
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(`scrollpos:${router.asPath}`, String(window.scrollY));
    };
    router.events.on('routeChangeStart', saveScroll);
    return () => router.events.off('routeChangeStart', saveScroll);
  }, [router.asPath, router.events]);

  // Real inertia smooth-scroll (the reference the user pointed at only used native CSS
  // scroll-behavior:smooth, which does nothing for mouse-wheel input — this is what
  // actually makes wheel/trackpad scrolling feel eased instead of stepping in raw OS
  // increments). respectReducedMotion defaults to true in Lenis itself (lerp forced to 1,
  // tracks input 1:1), so no extra prefers-reduced-motion guard is needed here — same
  // outcome as the rest of the codebase's manual checks, just handled inside the library.
  // anchors:true covers the header nav's "#chemicalworkz"/"#iletisim" links with eased
  // scrolling. Clearance under the floating fixed header is handled via CSS
  // scroll-margin-top on the target sections (see their .scss files) rather than Lenis's
  // own `offset` option — more portable, and works the same whether a scroll is
  // Lenis-driven or native.
  useEffect(() => {
    // autoRaf:true — without it Lenis intercepts wheel/touch/click input but never actually
    // ticks its own animation frame, so scrolling silently did nothing and anchor clicks
    // fell back to an instant jump instead of easing.
    const lenis = new Lenis({ anchors: true, autoRaf: true });
    return () => lenis.destroy();
  }, []);

  // Scroll float for the big liquid-glass panes (.glass-drift consumers — header, footer,
  // banner panel): scroll velocity feeds a spring-less lerp toward a ±6px cap, decaying
  // back to 0 at rest, published as --scroll-drift on <html>. One passive listener + one
  // rAF loop that stops itself when settled; transform-only, and skipped entirely under
  // prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const root = document.documentElement;
    let target = 0;
    let current = 0;
    let raf = 0;
    let lastY = window.scrollY;

    const tick = () => {
      target *= 0.86; // relax toward rest
      current += (target - current) * 0.14;
      if (Math.abs(current) < 0.03 && Math.abs(target) < 0.03) {
        current = 0;
        root.style.setProperty('--scroll-drift', '0px');
        raf = 0;
        return;
      }
      root.style.setProperty('--scroll-drift', `${current.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      target = Math.max(-6, Math.min(6, target + delta * 0.12));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--scroll-drift');
    };
  }, []);

  return (
    <div className={`${archivo.variable} ${hankenGrotesk.variable} font-root`}>
      <ThemeProvider>
        <LanguageProvider>
          <GlassFilterDefs />
          <a href="#main-content" className="skip-link">
            Ana içeriğe geç
          </a>
          {/* Persistent chrome — Header/Footer/WhatsAppFab/ScrollTopButton live HERE, as
              siblings of the keyed page-transition div below, never inside it. Rendering
              them per-page meant every client-side navigation unmounted and remounted them
              (the keyed div fully swaps its subtree), tearing down the header's warm
              backdrop-filter + SVG-distortion compositing layer and standing a fresh one up
              cold — whose first frames render flat/unblurred (the user-visible "header
              flashes opaque then pops back to glass" bug on nav). Same cold-layer problem
              already fixed for the header's mobile dropdown (see Header.jsx); the fix here
              is to simply never unmount the chrome. None of these four take props, so the
              move is pure relocation. */}
          <Header />
          {/* Keyed to the route pattern (not full asPath, so filter/sort/page query changes
              on the same page don't retrigger it) — remounting this wrapper on every real
              navigation replays the fade-in below. Client-side route swaps otherwise have no
              transition at all (the new page just appears), which is what made "Ürünlere
              geri dön" (router.back() from a product page to /urunler) read as an abrupt
              snap instead of the "no hard cuts" motion language the rest of the site uses.
              `ready` (see above) gates the actual fade — see .page-transition/.is-visible in
              globals.scss. Opacity-only, deliberately no transform: kept that way even now
              that the fixed-position chrome (Header/WhatsAppFab/ScrollTopButton) sits
              outside this div — per-page content can still contain fixed/sticky descendants
              (e.g. modals), and a transforming ancestor would become their containing block
              mid-transition. */}
          <div key={router.pathname} className={`page-transition${ready ? ' is-visible' : ''}`}>
            <Component {...pageProps} />
          </div>
          <Footer />
          <WhatsAppFab />
          <ScrollTopButton />
        </LanguageProvider>
      </ThemeProvider>
    </div>
  );
}
