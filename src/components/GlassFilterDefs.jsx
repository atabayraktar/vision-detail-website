// Rendered once per page (in _app). Every GlassSurface references one of these.
// scale="150" reads as a subtle refraction on a large surface (header/footer/panels) but
// the SAME absolute displacement warps a small surface (a 40px-tall button) by a huge
// fraction of its own size — edges look torn/ghosted. glass-distortion-sm (scale 24) is the
// same recipe scaled down for buttons, pills and icon chips; see .glass-surface--tight.
export default function GlassFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      {/* The feComponentTransfer step is from the reference pen (CodePen vEOWpYM): a hard
          gamma curve on R sharpens the horizontal refraction while G's amplitude-0 flattens
          vertical displacement to zero — a cleaner, finer "pulled glass" texture than raw
          turbulence. Displacement scale values stay ours (150 large / 18 small).

          Both filter regions are EXPANDED past the element box (x/y negative, width/height
          >100%). With a tight 0%/100% region the feGaussianBlur blends the displacement map
          with transparent black at the region edge, collapsing R toward 0 there — the map
          then displaces edge pixels by up to scale/2 (75px on the large filter) into
          nothingness, which rendered as the blurry white fringe/halo hugging every large
          glass surface (header, footer, form). Growing the region gives the blur real
          turbulence data on all sides, so the edge behaves exactly like the interior. */}
      <filter id="glass-distortion" x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="mapped" stdDeviation="3" result="softMap" />
        <feDisplacementMap in="SourceGraphic" in2="softMap" scale="150" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* stdDeviation bumped 2 -> 4 (dark mode, 2026-08): the sharp gamma curve above turns
          the turbulence into near-binary bands rather than a smooth gradient, and at small
          button sizes that shows up as a visible hard seam/streak through the refraction —
          nearly invisible against a light-mode interior, but a distinct line against a dark
          one (user-reported "white lines on swipe/CTA buttons"). More blur on the
          displacement map softens that transition into a gradient too gentle to read as a
          seam, while still moving enough to feel like refraction. */}
      <filter id="glass-distortion-sm" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03 0.03" numOctaves="1" seed="5" result="turbulence" />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="mapped" stdDeviation="4" result="softMap" />
        <feDisplacementMap in="SourceGraphic" in2="softMap" scale="18" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
