import { forwardRef } from 'react';

// Moves the CSS-driven pointer-highlight (see .glass-surface__shine::after) to track the
// cursor — the concrete bit of "liquid glass moves on hover" the brand direction asks for.
function trackPointer(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--glass-mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
  event.currentTarget.style.setProperty('--glass-my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
}

const GlassSurface = forwardRef(function GlassSurface(
  { as: Tag = 'div', className = '', contentClassName = '', children, ...rest },
  ref
) {
  return (
    <Tag ref={ref} className={`glass-surface ${className}`} onPointerMove={trackPointer} {...rest}>
      <span className="glass-surface__clip" aria-hidden="true">
        <span className="glass-surface__effect" aria-hidden="true" />
        <span className="glass-surface__tint" aria-hidden="true" />
        <span className="glass-surface__shine" aria-hidden="true" />
      </span>
      <span className={`glass-surface__content ${contentClassName}`}>{children}</span>
    </Tag>
  );
});

export default GlassSurface;
