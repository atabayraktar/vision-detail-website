import { useEffect, useState } from 'react';

// Every popover/sheet/modal in this codebase used a plain `{open && <X/>}` conditional
// render — CSS `animation` on mount gave it an entrance, but React yanks the node out of
// the DOM the instant `open` goes false, so there was never an exit animation, just an
// instant disappearance (the recurring "kapanırken animasyonsuz" reports). This hook keeps
// the node mounted for `exitMs` after `open` flips to false so a reverse/exit animation has
// time to actually play, then unmounts for real.
//
// Usage: const { mounted, closing } = usePresence(open, 350); if (!mounted) return null;
// then toggle an exit class (`closing`) whose CSS reverses the entrance animation.
export default function usePresence(open, exitMs = 350) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;

    setClosing(true);
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { mounted, closing };
}
