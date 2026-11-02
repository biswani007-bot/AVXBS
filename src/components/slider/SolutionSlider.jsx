import React, { useState, useRef, useEffect } from 'react';
import SubmissionCounter from './SubmissionCounter';
import { ChevronsRight } from 'lucide-react';

const PRODUCTS = [
  {
    id: 'water-softener',
    name: 'Water Softener',
    titleWater: 'WATER ',
    titleSoftner: 'SOFTNER'
  },
  {
    id: 'whole-house-filter',
    name: 'Whole-House Filter',
    titleWater: 'WATER ',
    titleSoftner: 'FILTER'
  },
  {
    id: 'ro-purification',
    name: 'RO & UV Purifier',
    titleWater: 'RO & UV ',
    titleSoftner: 'PURIFIER'
  }
];

/**
 * Interactive Solution Slider Component
 * - Displays active solution (defaults to Water Softener).
 * - Clicking the white inner card or "Click Here" triggers right-side sliding inquiry form with product name populated.
 * - Allows switching between solutions, automatically populating the corresponding product in the inquiry form.
 * - Mouse drag and touch swipe preserved.
 * - Grey outer card and white inner card dimensions and styling strictly preserved.
 */
export default function SolutionSlider({ counter, onOpenContact }) {
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const containerRef = useRef(null);

  const TRIGGER_THRESHOLD = 80; // px drag required to trigger action
  const currentProduct = PRODUCTS[activeProductIndex];

  const triggerInquiry = () => {
    if (onOpenContact) {
      onOpenContact(currentProduct.name);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    if (delta > 0) {
      setDragOffset(Math.min(delta, 160));
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset >= TRIGGER_THRESHOLD) {
      triggerInquiry();
    }
    setDragOffset(0);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStartX.current;
    if (delta > 0) {
      setDragOffset(Math.min(delta, 160));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset >= TRIGGER_THRESHOLD) {
      triggerInquiry();
    }
    setDragOffset(0);
  };

  // Global mouseup safety
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragOffset >= TRIGGER_THRESHOLD) {
          triggerInquiry();
        }
        setDragOffset(0);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragOffset, activeProductIndex]);

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerInquiry();
    }
  };

  return (
    <section className="slider-section">
      <div className="slider-container-wrap">
        {/* Grey Outer Slider Card */}
        <div
          ref={containerRef}
          className={`solution-slider-card ${isDragging ? 'dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`${currentProduct.name} Solution Card. Click, drag right, or press enter to open inquiry form.`}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top hairline gradient line */}
          <div className="card-top-gradient-line" aria-hidden="true" />

          {/* Left Column: Persistent Counter */}
          <div className="slider-left-column">
            <SubmissionCounter count={counter} />
          </div>

          {/* Center Column: Interactive White Inset Card */}
          <div
            className="slider-center-column"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
            onClick={triggerInquiry}
          >
            <div className="inset-white-card">
              <div className="card-border-gradient" aria-hidden="true" />
              <h2 className="solution-title">
                <span className="title-water">{currentProduct.titleWater}</span>
                <span className="title-softner">{currentProduct.titleSoftner}</span>
              </h2>
            </div>
          </div>

          {/* Right Column: Double Chevron & "Click Here" */}
          <div className="slider-right-column" onClick={triggerInquiry}>
            <button
              type="button"
              className="action-trigger-btn"
              aria-label={`Open ${currentProduct.name} Inquiry Form`}
              onClick={(e) => {
                e.stopPropagation();
                triggerInquiry();
              }}
            >
              <div className="chevron-icon-box">
                <ChevronsRight className="chevrons-icon" size={32} />
              </div>
              <span className="click-here-text">Click Here</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
