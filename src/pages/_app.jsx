import { useEffect } from 'react';
import { Archivo, Hanken_Grotesk } from 'next/font/google';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import '@/styles/main.scss';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import GlassFilterDefs from '@/components/GlassFilterDefs';

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
          <Component {...pageProps} />
        </LanguageProvider>
      </ThemeProvider>
    </div>
  );
}
