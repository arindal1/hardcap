/** Fixed, subtle film-grain texture over the whole app — the one texture pass, per the design system. */
export function GrainOverlay() {
  return (
    <svg className="grain-overlay" aria-hidden focusable="false">
      <filter id="hardcap-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#hardcap-grain)" />
    </svg>
  );
}