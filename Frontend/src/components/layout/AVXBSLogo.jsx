import React, { useState, useEffect, useRef } from 'react';
import { fetchWebsiteLogo, resolveMediaUrl } from '../../services/api';

const LOGO_STORAGE_KEY = 'avxbs_website_logo';

/**
 * AVXBS Dynamic Website Logo Component
 * - Immediately initializes from localStorage to prevent layout shifts on page refresh
 * - Dynamically retrieves the administrator-configured website logo via API (Image or Video)
 * - Supports PNG, JPG, SVG, WEBP, GIF images and MP4, WebM videos
 * - Maintains proper aspect ratio, responsive sizing, and clean visual integration
 * - Graceful fallback to the built-in animated AVXBS logo when unconfigured or on error
 * - Reserves logo container dimensions to eliminate initial-versus-settled CLS
 */
export default function AVXBSLogo({ className = '', animated = true, alt = 'AVXBS Water Solutions' }) {
  const [dynamicLogo, setDynamicLogo] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(LOGO_STORAGE_KEY);
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      if (typeof parsed === 'string') {
        const isVid = /\.(mp4|webm)(\?.*)?$/i.test(parsed);
        return {
          imageUrl: parsed,
          url: parsed,
          videoUrl: isVid ? parsed : '',
          mediaType: isVid ? 'video' : 'image',
          mimeType: isVid ? (parsed.endsWith('.webm') ? 'video/webm' : 'video/mp4') : 'image/png',
          altText: alt,
        };
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loadError, setLoadError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    fetchWebsiteLogo()
      .then((logoData) => {
        if (!isMounted) return;
        if (logoData && (logoData.imageUrl || logoData.url || logoData.videoUrl)) {
          setDynamicLogo(logoData);
          setLoadError(false);
          try {
            localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(logoData));
          } catch {}
        } else {
          // If no dynamic logo configured on server, clear cache
          setDynamicLogo(null);
          try {
            localStorage.removeItem(LOGO_STORAGE_KEY);
          } catch {}
        }
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedLogo = (typeof dynamicLogo === 'string')
    ? {
        imageUrl: dynamicLogo,
        url: dynamicLogo,
        videoUrl: /\.(mp4|webm)(\?.*)?$/i.test(dynamicLogo) ? dynamicLogo : '',
        mediaType: /\.(mp4|webm)(\?.*)?$/i.test(dynamicLogo) ? 'video' : 'image',
        altText: alt,
      }
    : dynamicLogo;

  const logoUrl = normalizedLogo ? (normalizedLogo.url || normalizedLogo.imageUrl || normalizedLogo.videoUrl) : null;
  const logoAlt = (normalizedLogo && normalizedLogo.altText) ? normalizedLogo.altText : alt;

  const isVideo = Boolean(
    normalizedLogo &&
    (normalizedLogo.mediaType === 'video' ||
     (normalizedLogo.mimeType && normalizedLogo.mimeType.toLowerCase().startsWith('video/')) ||
     (logoUrl && /\.(mp4|webm)(\?.*)?$/i.test(logoUrl)))
  );

  // Guarantee muted autoplay for video logo in all modern browsers
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[AVXBSLogo] Video logo autoplay prevented:', err);
          if (videoRef.current && videoRef.current.error) {
            setLoadError(true);
          }
        });
      }
    }
  }, [isVideo, logoUrl]);

  // Dynamic admin-configured logo rendering
  if (logoUrl && !loadError) {
    if (isVideo) {
      return (
        <div
          className={`avxbs-dynamic-logo site-logo ${className}`}
          role="img"
          aria-label={logoAlt}
        >
          <video
            ref={videoRef}
            src={resolveMediaUrl(logoUrl)}
            className="avxbs-dynamic-logo-video"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="auto"
            aria-label={logoAlt}
            onError={() => {
              // Gracefully fall back to built-in animated logo if the video fails to load
              setLoadError(true);
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`avxbs-dynamic-logo site-logo ${className}`}
        role="img"
        aria-label={logoAlt}
      >
        <img
          src={resolveMediaUrl(logoUrl)}
          alt={logoAlt}
          className="avxbs-dynamic-logo-img"
          onError={() => {
            // Gracefully fall back to built-in animated logo if the image fails to load
            setLoadError(true);
          }}
          loading="eager"
          fetchpriority="high"
          decoding="sync"
        />
      </div>
    );
  }

  // Graceful fallback: Built-in pixel-perfect animated AVXBS logo
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
