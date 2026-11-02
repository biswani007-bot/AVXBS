import React from 'react';
import AnimatedHeadline from './AnimatedHeadline';
import AutoVideoPlayer from './AutoVideoPlayer';
import { Search } from 'lucide-react';

/**
 * HeroSection Component (Corrected 2-Column Architecture)
 * - 45% Left Column: Shimmering Animated Headline + Property Scope & Search Strip.
 * - 55% Right Column: Autonomous Video Player (HTML5, muted autoplay, loop, zero controls).
 * - Complete removal of VENETUS brand card per user instruction.
 * - Responsive stacking: Side-by-side on desktop/tablet, vertical stack on mobile.
 */
export default function HeroSection({ selectedType, onSelectType, searchQuery, onSearchChange }) {
  return (
    <section className="hero-banner-section">
      <div className="hero-two-column-container">
        {/* LEFT COLUMN: Animated Headline + Controls Row (Residential, Commercial, Search) */}
        <div className="hero-left-col">
          {/* 1. Animated 4-Line Headline */}
          <AnimatedHeadline />

          {/* 2. Controls Row: [ Residential ] [ Commercial ] [ Search ] all on SAME ROW on desktop */}
          <div className="hero-controls-row">
            <button
              type="button"
              className={`filter-option-btn ${selectedType === 'Residential' ? 'active' : ''}`}
              onClick={() => onSelectType('Residential')}
              aria-label="Select Residential Scope"
            >
              <span className="sphere-indicator sphere-green" aria-hidden="true" />
              <span className="filter-label">Residential</span>
            </button>

            <button
              type="button"
              className={`filter-option-btn ${selectedType === 'Commercial' ? 'active' : ''}`}
              onClick={() => onSelectType('Commercial')}
              aria-label="Select Commercial Scope"
            >
              <span className="sphere-indicator sphere-copper" aria-hidden="true" />
              <span className="filter-label">Commercial</span>
            </button>

            <div className="search-pill-wrapper">
              <Search className="search-icon" size={16} />
              <span className="search-separator">|</span>
              <input
                type="text"
                className="search-pill-input"
                placeholder="Search solutions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search water treatment solutions"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Autonomous Video Player */}
        <div className="hero-right-col">
          <AutoVideoPlayer />
        </div>
      </div>
    </section>
  );
}
