import { useEffect } from 'react';

// Every glass dropdown/sheet/lightbox on the site left the page scrollable behind it —
// on touch devices, a drag that started over the popup (trying to scroll its own content,
// or just to dismiss it) scrolled the underlying page instead, because the panel is a
// normal in-flow overlay with nothing stopping scroll/touch from reaching <body>.
//
// `overflow: hidden` on body alone doesn't reliably stop touch scrolling on iOS Safari, so
// this uses the standard `position: fixed` body-pinning technique instead: the scroll
// position is preserved via a negative `top` offset and restored on unlock. A module-level
// counter lets multiple lock calls stack safely (harmless if two overlays are ever open at
// once) without unlocking early. Panels with their own internal scroll (e.g. a long filter
// list) are unaffected — only <body> is pinned, so their own overflow:auto still scrolls.
let lockCount = 0;
let savedScrollY = 0;

export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      const { body } = document;
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount > 0) return;
      const { body } = document;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.paddingRight = '';
      window.scrollTo(0, savedScrollY);
    };
  }, [active]);
}
