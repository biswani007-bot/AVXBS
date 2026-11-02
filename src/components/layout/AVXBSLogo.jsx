import React from 'react';

/**
 * AVXBS Animated Logo Component
 * - Unaltered, pixel-perfect AV and XBS letter typography
 * - Continuous colorful loading animation inside the double vertical bars (||)
 * - Smooth vertical light/gradient moving from bottom to top at 0.8s per cycle
 * - 0.2s synchronized layered delay on the second bar
 * - Original brand colors (orange, coral, dark purple) strictly preserved
 * - No position/dimension scaling of the bars themselves
 * - Respects prefers-reduced-motion
 */
export default function AVXBSLogo({ className = '', animated = true, alt = 'AVXBS Water Solutions' }) {
  return (
    <div
      className={`avxbs-animated-logo-root ${className} ${animated ? 'is-animated' : ''}`}
      role="img"
      aria-label={alt}
    >
      {/* 1. Base Letters (AV and XBS) - 100% original, static & sharp */}
      <img
        src="/assets/logo/avxbs-letters.png"
        alt=""
        className="logo-layer logo-letters"
        aria-hidden="true"
      />

      {/* 2. Left Vertical Bar (Orange / Warm Coral Palette) */}
      <div className="logo-layer logo-bar-wrapper bar-1-wrapper" aria-hidden="true">
        <img
          src="/assets/logo/avxbs-bar1.png"
          alt=""
          className="bar-image"
          aria-hidden="true"
        />
        {animated && <div className="bar-loading-overlay bar-1-loading" aria-hidden="true" />}
      </div>

      {/* 3. Right Vertical Bar (Coral / Magenta / Dark Purple Palette) */}
      <div className="logo-layer logo-bar-wrapper bar-2-wrapper" aria-hidden="true">
        <img
          src="/assets/logo/avxbs-bar2.png"
          alt=""
          className="bar-image"
          aria-hidden="true"
        />
        {animated && <div className="bar-loading-overlay bar-2-loading" aria-hidden="true" />}
      </div>
    </div>
  );
}
