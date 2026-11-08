import React, { useState, useEffect } from 'react';
import FullPageHeroBanner from './FullPageHeroBanner';
import { fetchHeroBanner } from '../../services/api';

const DEFAULT_BANNER_SETTINGS = {
  autoplay: true,
  slideDuration: 3000,
  transitionDuration: 450,
  transitionEffect: 'fade',
  showNavigationArrows: true,
  showIndicators: true,
};

/**
 * HeroSection Component (Samsung-Inspired Full-Width Hero Architecture)
 * - Section 1: Full-Width, Full-Page Hero Banner (Edge-to-edge images & MP4 videos).
 * - Clean loading state while API request is in-flight (zero flash, zero layout shift).
 * - Direct render of live API-provided slides without stale hardcoded fallbacks.
 * - Fully integrated with MongoDB backend and Admin Hero Banner Management.
 */
export default function HeroSection() {
  const [slides, setSlides] = useState(null); // null represents loading state
  const [settings, setSettings] = useState(DEFAULT_BANNER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchHeroBanner()
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.slides) && data.slides.length > 0) {
          const activeSlides = data.slides.filter((s) => s.isActive !== false);
          setSlides(activeSlides);
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
          setError(false);
        } else {
          setSlides([]);
          setError(data ? false : true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[HeroSection] Hero banner load error:', err?.message || err);
          setError(true);
          setSlides([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="hero-fullpage-master-section" aria-label="AVXBS Hero Presentation">
      {/* 1. Full-Page Edge-to-Edge Moving Image & Video Banner */}
      <div className="hero-banner-fullwidth-wrapper">
        <FullPageHeroBanner
          slides={slides}
          settings={settings}
          loading={loading}
          error={error}
        />
      </div>
    </section>
  );
}
