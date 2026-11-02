import React from 'react';

/**
 * AnimatedHeadline Component
 * Strictly recreates the 4-line headline with per-word custom color tokens and a
 * continuous subtle reflective shimmer / light-sweep sheen.
 */
export default function AnimatedHeadline() {
  return (
    <div className="headline-wrapper" aria-label="Now Just Put Your Inquiry And Get the Solution. At Door step">
      <h1 className="hero-headline animated-headline">
        {/* Line 1: Now Just */}
        <div className="headline-line line-1">
          <span className="hl-word word-now">Now</span>
          <span className="hl-word word-just">Just</span>
        </div>

        {/* Line 2: Put Your Inquiry */}
        <div className="headline-line line-2">
          <span className="hl-word word-put">Put</span>
          <span className="hl-word word-your">Your</span>
          <span className="hl-word word-inquiry">Inquiry</span>
        </div>

        {/* Line 3: And Get the Solution. */}
        <div className="headline-line line-3">
          <span className="hl-word word-and">And</span>
          <span className="hl-word word-get">Get</span>
          <span className="hl-word word-the">the</span>
          <span className="hl-word word-solution">Solution.</span>
        </div>

        {/* Line 4: At Door step */}
        <div className="headline-line line-4">
          <span className="hl-word word-atdoor">At Door</span>
          <span className="hl-word word-step">step</span>
        </div>
      </h1>
    </div>
  );
}
