// Inline SVG artwork for the nature theme. Decorative only: hidden from screen readers.

/** Brand mark: a two-leaf sprout. */
export function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <path d="M16 29V15" stroke="#2e7a44" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M16 17C16 10 11 6 4 6c0 7 5 11 12 11Z" fill="#78b464" />
      <path d="M16 14c0-6 4.5-10 12-10 0 6.5-4.5 10-12 10Z" fill="#2e7a44" />
    </svg>
  );
}

/** Small sprout that keeps growing while a scope is being generated. */
export function Sprout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path className="sprout-stem" d="M12 22v-9" stroke="#2e7a44" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path className="sprout-leaf sprout-leaf-left" d="M12 14c0-4-3-7-8-7 0 4.5 3.5 7 8 7Z" fill="#78b464" />
      <path className="sprout-leaf sprout-leaf-right" d="M12 12c0-4 3-7 8-7 0 4.5-3.5 7-8 7Z" fill="#2e7a44" />
    </svg>
  );
}

/**
 * Rolling hills with a sun rising behind them and drifting clouds, along the bottom of the home hero.
 * The scene is cropped from the top on wide screens (slice), so everything sits low in the viewBox,
 * and the sun is near the middle so phones (which crop the sides) still see it.
 */
export function Landscape({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden>
      <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className="h-full w-full" focusable="false">
        <circle className="sun-glow" cx="960" cy="150" r="58" fill="#f7d24a" opacity="0.5" />
        <circle cx="960" cy="150" r="38" fill="#f7d24a" />
        <g className="cloud-slow" fill="#ffffff" opacity="0.9">
          <ellipse cx="220" cy="128" rx="70" ry="18" />
          <ellipse cx="260" cy="116" rx="46" ry="20" />
          <ellipse cx="185" cy="120" rx="32" ry="14" />
        </g>
        <g className="cloud-fast" fill="#ffffff" opacity="0.75">
          <ellipse cx="640" cy="112" rx="56" ry="14" />
          <ellipse cx="672" cy="103" rx="34" ry="15" />
        </g>
        <path d="M0 170C180 120 360 135 540 160s360 25 540-10 270-40 360-20V260H0Z" fill="#cfe6be" />
        <path d="M0 200c220-55 420-30 600 0s400 30 560-10 210-30 280-20V260H0Z" fill="#a7d18a" />
        <path d="M0 228c180-35 380-25 560 0s420 20 600-5 220-15 280-5V260H0Z" fill="#78b464" />
        <path d="M0 246c240-18 520-12 760 2s460 8 680-6V260H0Z" fill="#4e8d4f" />
      </svg>
    </div>
  );
}
