import { useEffect } from 'react';

// Lazy reveal (design architecture "Scroll" note): elements marked data-reveal surface
// gently on first viewport entry. One-shot per element (unobserved after revealing) — the
// page must not keep re-animating on every scroll pass. The html.has-reveal gate is what
// arms the hiding CSS (see globals.scss); it is deliberately NOT added for
// prefers-reduced-motion users or missing-IntersectionObserver browsers, so content is
// simply visible there.
export default function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return undefined;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return undefined;
    }

    document.documentElement.classList.add('has-reveal');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      document.documentElement.classList.remove('has-reveal');
    };
  }, []);
}
