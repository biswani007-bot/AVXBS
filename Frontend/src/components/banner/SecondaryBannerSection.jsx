import React, { useState, useEffect } from 'react';
import { fetchSecondaryBanner, resolveMediaUrl } from '../../services/api';

/**
 * SecondaryBannerSection Component
 * Positioned immediately after the Tap Water InquiryPromoBanner section.
 * Height is approximately 80% of the main FullPageHeroBanner height.
 * Dynamic asset retrieval via API backed by SiteSetting MongoDB storage.
 */
export default function SecondaryBannerSection() {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchSecondaryBanner()
      .then((data) => {
        if (!isMounted) return;
        if (data && typeof data === 'object') {
          setBanner(data);
        }
      })
      .catch((err) => {
        console.warn('[SecondaryBanner] Failed to fetch banner:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section
        className="secondary-banner-section secondary-banner-root secondary-banner-skeleton"
        aria-label="Loading banner..."
      >
        <div className="secondary-banner-skeleton-shimmer" />
      </section>
    );
  }

  // If explicitly inactive or missing image, do not render
  if (!banner || banner.isActive === false || !banner.imageUrl) {
    return null;
  }

  const {
    imageUrl,
    altText = 'AVXBS Advanced Water Solutions',
    title = '',
    subtitle = '',
    linkUrl = '',
    buttonText = 'Explore Solutions',
  } = banner;

  return (
    <section
      className="secondary-banner-section secondary-banner-root"
      aria-label={title || 'AVXBS Featured Water Solutions Banner'}
    >
      <div className="secondary-banner-inner">
        <img
          src={resolveMediaUrl(imageUrl)}
          alt={altText || title || 'AVXBS Water Solutions'}
          className="secondary-banner-media"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/hero-enhanced/hero-industrial-treatment.jpg';
          }}
        />

        <div className="secondary-banner-gradient-overlay" />

        {(title || subtitle || linkUrl) && (
          <div className="secondary-banner-content-container">
            <div className="secondary-banner-content">
              {title && <h2 className="secondary-banner-title">{title}</h2>}
              {subtitle && <p className="secondary-banner-subtitle">{subtitle}</p>}
              {linkUrl && (
                <a
                  href={linkUrl}
                  className="secondary-banner-cta-btn"
                >
                  <span>{buttonText || 'Explore Solutions'}</span>
                  <svg
                    className="secondary-banner-btn-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
