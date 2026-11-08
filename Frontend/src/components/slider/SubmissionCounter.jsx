import React, { useState, useEffect, useRef } from 'react';

/**
 * SubmissionCounter Component (Left Panel)
 * - Displays card label (e.g. CURRENT USER ACCESS)
 * - Prominent sequential number formatted dynamically (1 -> 01, 9 -> 09, 10 -> 10, 100 -> 100)
 * - Includes smooth animated count transition when value updates
 */
export default function SubmissionCounter({ label = 'CURRENT USER ACCESS', number = '01' }) {
  const [displayNumber, setDisplayNumber] = useState(number);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevNumberRef = useRef(number);

  useEffect(() => {
    if (number !== prevNumberRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayNumber(number);
        setIsAnimating(false);
        prevNumberRef.current = number;
      }, 180);
      return () => clearTimeout(timer);
    } else {
      setDisplayNumber(number);
    }
  }, [number]);

  return (
    <div className="counter-box" aria-label={`${label}: ${displayNumber}`}>
      <span className="counter-label">{label}</span>
      <span 
        className={`counter-number ${isAnimating ? 'counter-number-transition' : ''}`}
        style={{
          display: 'inline-block',
          transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease',
          transform: isAnimating ? 'scale(1.12) translateY(-2px)' : 'scale(1) translateY(0)',
          opacity: isAnimating ? 0.75 : 1,
        }}
      >
        {displayNumber}
      </span>
    </div>
  );
}
