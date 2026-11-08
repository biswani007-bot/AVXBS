import React, { useState, useEffect, useRef, useCallback } from 'react';
import { resolveMediaUrl } from '../../services/api';

/**
 * Helper to determine slide layout properties:
 * - isComposed: graphic composition slides containing text/logos/product focus (Slide 1, Slide 3)
 * - isFullBleed: full-background cinematic video/ambient imagery (Slide 2)
 * - isLight: slide has clean white/light background
 */
function getSlideLayout(slide) {
  if (!slide) return { isComposed: false, isFullBleed: true, isLight: false, themeClass: 'theme-dark', slideBg: '#000000', mediaClass: 'is-fullbleed' };

  const url = (slide.mediaUrl || '').toLowerCase();
  const title = (slide.title || '').toLowerCase();
  const isImage = slide.mediaType === 'image';

  // Composed slides contain designed graphics, headlines, or product imagery on white backgrounds
  const isComposed =
    isImage ||
    url.includes('screenshot') ||
    url.includes('6_44_18') ||
    title.includes('inquiry') ||
    slide.isComposed === true;

  const isLight =
    isComposed ||
    url.includes('screenshot') ||
    url.includes('6_44_18') ||
    slide.theme === 'light' ||
    slide.isLight === true;

  return {
    isComposed,
    isFullBleed: !isComposed,
    isLight,
    themeClass: isLight ? 'theme-light' : 'theme-dark',
    slideBg: isLight ? '#ffffff' : '#000000',
    mediaClass: isComposed ? 'is-composed' : 'is-fullbleed'
  };
}

/**
 * FullPageHeroBanner Component
 * Inspired by Samsung's edge-to-edge promotional hero presentation:
 * - 100% full-width banner spanning the entire screen.
 * - Automatically changes hero slides according to settings (configurable via Admin Panel).
 * - Smooth, snappy transitions (~400-500ms fade).
 * - Instant manual navigation via arrows, progress bars, and Play/Pause control.
 * - Proportional responsive fitting across desktop, tablet, and mobile.
 * - Seamless elimination of unwanted black bars by matching slide background themes.
 */
export default function FullPageHeroBanner({ slides = [], settings = {}, loading = false, error = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [videoDurations, setVideoDurations] = useState({});
  const [videoAspectRatios, setVideoAspectRatios] = useState({});
  const timerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const videoRefs = useRef({});
  const lastIndexRef = useRef(currentIndex);

  const activeSlides = slides && slides.length > 0 ? slides.filter((s) => s.isActive !== false) : [];

  // Default auto-slide speed: 3000ms (3s); transition duration: 450ms (~400-500ms)
  const slideDuration = Number(settings.slideDuration) || 3000;
  const transitionDuration = Number(settings.transitionDuration) || 450;
  const isAutoplay = settings.autoplay !== false && activeSlides.length > 1;
  const showIndicators = settings.showIndicators !== false && activeSlides.length > 1;
  const transitionEffect = settings.transitionEffect || 'fade';

  // Performance Image Preloader: preloads next and previous image slides in memory
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % activeSlides.length;
    const prevIdx = (currentIndex - 1 + activeSlides.length) % activeSlides.length;

    [nextIdx, prevIdx].forEach((idx) => {
      const slide = activeSlides[idx];
      if (slide && slide.mediaType !== 'video' && slide.mediaUrl) {
        const img = new Image();
        img.src = resolveMediaUrl(slide.mediaUrl);
      }
    });
  }, [currentIndex, activeSlides]);

  // Read video metadata when loaded
  const handleLoadedMetadata = useCallback((index, target) => {
    if (!target) return;
    const dur = target.duration;
    const w = target.videoWidth;
    const h = target.videoHeight;
    if (dur && !isNaN(dur) && isFinite(dur)) {
      setVideoDurations((prev) => (prev[index] === dur ? prev : { ...prev, [index]: dur }));
    }
    if (w && h) {
      const ratio = w / h;
      setVideoAspectRatios((prev) => (prev[index] === ratio ? prev : { ...prev, [index]: ratio }));
    }
  }, []);

  // Sync existing video elements' metadata (e.g. cached/preloaded)
  useEffect(() => {
    activeSlides.forEach((slide, idx) => {
      if (slide.mediaType === 'video') {
        const vid = videoRefs.current[idx];
        if (vid) {
          if (vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
            setVideoDurations((prev) => (prev[idx] === vid.duration ? prev : { ...prev, [idx]: vid.duration }));
          }
          if (vid.videoWidth && vid.videoHeight) {
            const ratio = vid.videoWidth / vid.videoHeight;
            setVideoAspectRatios((prev) => (prev[idx] === ratio ? prev : { ...prev, [idx]: ratio }));
          }
        }
      }
    });
  }, [activeSlides, currentIndex]);

  // Advance to next slide helper
  const goToNextSlide = useCallback(() => {
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  // Immediate manual advance to next slide
  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    goToNextSlide();
  }, [goToNextSlide]);

  // Immediate manual return to previous slide
  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  // Immediate manual slide jump via indicator dots
  const handleDotClick = useCallback((index, e) => {
    if (e) e.stopPropagation();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentIndex(index);
  }, []);

  // Autoplay and video playback lifecycle
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (activeSlides.length === 0) return;

    const currentSlide = activeSlides[currentIndex];
    const isVideo = currentSlide?.mediaType === 'video';
    const currentVid = videoRefs.current[currentIndex];
    const indexChanged = lastIndexRef.current !== currentIndex;
    lastIndexRef.current = currentIndex;

    // Pause all other videos without destroying their visible end frame during crossfade
    activeSlides.forEach((slide, idx) => {
      if (idx !== currentIndex && videoRefs.current[idx]) {
        videoRefs.current[idx].pause();
      }
    });

    if (isVideo && currentVid) {
      currentVid.muted = true;
      currentVid.loop = false; // Never loop so ended event fires naturally!
      if (!isAutoplayPaused) {
        if (indexChanged || currentVid.ended) {
          try {
            currentVid.currentTime = 0;
          } catch {}
        }
        currentVid.play().catch((err) => {
          console.warn('[HeroBanner] Video autoplay failed/blocked, falling back to timer:', err);
          if (isAutoplay && !isAutoplayPaused && activeSlides.length > 1) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              goToNextSlide();
            }, slideDuration);
          }
        });
      } else {
        currentVid.pause();
      }
      // Note: Video advancement is driven by onEnded event, not a fixed timer!
    } else if (!isVideo) {
      // Non-video slide: advance using slideDuration timer
      if (isAutoplay && !isAutoplayPaused && activeSlides.length > 1) {
        timerRef.current = setTimeout(() => {
          goToNextSlide();
        }, slideDuration);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, isAutoplay, isAutoplayPaused, activeSlides, slideDuration, goToNextSlide]);

  // Toggle Play / Pause button
  const handleTogglePlayPause = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsAutoplayPaused((prev) => {
      const willBePaused = !prev;
      const currentVid = videoRefs.current[currentIndex];
      const isVideo = activeSlides[currentIndex]?.mediaType === 'video';

      if (willBePaused) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (isVideo && currentVid) currentVid.pause();
      } else {
        if (isVideo && currentVid) {
          if (currentVid.ended) {
            try {
              currentVid.currentTime = 0;
            } catch {}
          }
          currentVid.play().catch(() => {});
        } else if (!isVideo && activeSlides.length > 1) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            goToNextSlide();
          }, slideDuration);
        }
      }
      return willBePaused;
    });
  }, [currentIndex, activeSlides, slideDuration, goToNextSlide]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Clean zero-flash skeleton state during in-flight API request
  if (loading || slides === null) {
    return (
      <div
        className="full-page-hero-container hero-banner-skeleton"
        role="region"
        aria-busy="true"
        aria-label="Loading banner..."
      >
        <div className="hero-skeleton-shimmer" />
      </div>
    );
  }

  // Graceful fallback / error state without stale promotional assets
  if (error || activeSlides.length === 0) {
    return (
      <div
        className="full-page-hero-container hero-banner-fallback-state"
        role="region"
        aria-label="AVXBS Water Solutions"
      >
        <div className="hero-fallback-content">
          <img
            src="/assets/logo/avxbs-logo.png"
            alt="AVXBS"
            className="hero-fallback-logo-img"
          />
          <h2 className="hero-fallback-title">Advanced Water Treatment & Purification Solutions</h2>
          <p className="hero-fallback-desc">Commercial & Residential Water Engineering</p>
        </div>
      </div>
    );
  }

  const currentSlide = activeSlides[currentIndex];
  const currentLayout = getSlideLayout(currentSlide);
  const currentTheme = currentLayout.themeClass;
  const isVideoSlide = currentSlide?.mediaType === 'video';

  const currentVideoDur = videoDurations[currentIndex];
  const activeSlideDurationMs =
    isVideoSlide && currentVideoDur && !isNaN(currentVideoDur) && isFinite(currentVideoDur)
      ? Math.round(currentVideoDur * 1000)
      : slideDuration;

  const currentVideoRatio =
    videoAspectRatios[currentIndex] ||
    (videoRefs.current[currentIndex]?.videoWidth && videoRefs.current[currentIndex]?.videoHeight
      ? videoRefs.current[currentIndex].videoWidth / videoRefs.current[currentIndex].videoHeight
      : (currentSlide?.mediaUrl?.includes('6_44_18') ? 2 : 16 / 9));

  let containerClassName = `full-page-hero-container ${currentTheme}`;
  if (isVideoSlide) {
    containerClassName += ' is-video-active';
  }

  const containerStyle = {
    backgroundColor: currentLayout.slideBg,
    ...(isVideoSlide ? { '--hero-video-aspect-ratio': currentVideoRatio } : {}),
  };

  return (
    <>
      <div
        className={containerClassName}
        style={containerStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Full-Page Promotional Hero Showcase"
      >
        <div className={`hero-carousel-viewport ${transitionEffect === 'slide' ? 'is-slide-mode' : 'is-fade-mode'}`}>
          {activeSlides.map((slide, index) => {
            const isActive = index === currentIndex;
            const isPrev = (currentIndex - 1 + activeSlides.length) % activeSlides.length === index;
            const isNext = (currentIndex + 1) % activeSlides.length === index;
            const layout = getSlideLayout(slide);

            let slideClass = `hero-banner-slide ${layout.themeClass} ${layout.isComposed ? 'slide-composed' : 'slide-fullbleed'}`;
            if (isActive) slideClass += ' is-active';
            if (isPrev) slideClass += ' is-prev';
            if (isNext) slideClass += ' is-next';

            return (
              <div
                key={slide._id || index}
                className={slideClass}
                style={{
                  backgroundColor: layout.slideBg,
                  opacity: transitionEffect === 'fade' ? (isActive ? 1 : 0) : undefined,
                  transition: `opacity ${transitionDuration}ms cubic-bezier(0.25, 1, 0.5, 1), transform ${transitionDuration}ms cubic-bezier(0.25, 1, 0.5, 1)`,
                  zIndex: isActive ? 2 : 1,
                }}
                aria-hidden={!isActive}
              >
                <div className={`hero-slide-inner ${layout.isComposed ? 'inner-composed' : 'inner-fullbleed'}`}>
                  {slide.mediaType === 'video' ? (
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={resolveMediaUrl(slide.mediaUrl)}
                      poster={slide.posterUrl ? resolveMediaUrl(slide.posterUrl) : undefined}
                      autoPlay
                      muted
                      playsInline
                      preload="auto"
                      className={`hero-media-cover ${layout.mediaClass}`}
                      onLoadedMetadata={(e) => {
                        handleLoadedMetadata(index, e.target);
                      }}
                      onLoadedData={(e) => {
                        handleLoadedMetadata(index, e.target);
                      }}
                      onCanPlay={(e) => {
                        handleLoadedMetadata(index, e.target);
                      }}
                      onEnded={() => {
                        if (index === currentIndex && isAutoplay && !isAutoplayPaused && activeSlides.length > 1) {
                          goToNextSlide();
                        }
                      }}
                      onError={(e) => {
                        console.warn('[HeroBanner] Video playback unavailable, using poster/fallback:', slide.mediaUrl);
                        if (index === currentIndex && isAutoplay && !isAutoplayPaused && activeSlides.length > 1) {
                          if (timerRef.current) clearTimeout(timerRef.current);
                          timerRef.current = setTimeout(() => {
                            goToNextSlide();
                          }, slideDuration);
                        }
                      }}
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(slide.mediaUrl)}
                      alt={slide.altText || slide.title || 'AVXBS Water Treatment'}
                      className={`hero-media-cover ${layout.mediaClass}`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={() => {
                        console.warn('[HeroBanner] Slide media load failed:', slide.mediaUrl);
                      }}
                    />
                  )}

                  {/* Optional Text Overlay */}
                  {slide.overlayText && (
                    <div className="hero-slide-overlay">
                      <div className="hero-slide-overlay-inner">
                        <p className="hero-slide-overlay-text">{slide.overlayText}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Samsung-Style Edge Left / Right Navigation Arrows */}
        {settings.showNavigationArrows !== false && activeSlides.length > 1 && (
          <>
            <button
              type="button"
              className="hero-nav-arrow arrow-prev"
              onClick={handlePrev}
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              className="hero-nav-arrow arrow-next"
              onClick={handleNext}
              aria-label="Next slide"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Samsung-Style Thin Horizontal Progress Indicators with Play/Pause Control (Overlay inside banner at bottom-center) */}
        {showIndicators && activeSlides.length > 1 && (
          <div 
            className={`hero-progress-indicators ${currentTheme}`} 
            role="region" 
            aria-label="Slide transition progress and controls"
          >
            <div className="hero-progress-bars-row" role="tablist">
              {activeSlides.map((slide, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={slide._id || index}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${index + 1}${slide.title ? `: ${slide.title}` : ''}`}
                    className={`hero-progress-btn ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => handleDotClick(index, e)}
                  >
                    <span className="hero-progress-track">
                      {isActive && (
                        <span
                          key={`${currentIndex}-${activeSlideDurationMs}`}
                          className={`hero-progress-fill ${isAutoplay ? 'is-animating' : 'is-static'}`}
                          style={{
                            animationDuration: isAutoplay ? `${activeSlideDurationMs}ms` : undefined,
                            animationPlayState: isAutoplay && !isAutoplayPaused ? 'running' : 'paused',
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Samsung-Style Play / Pause Toggle Button */}
            <button
              type="button"
              className="hero-progress-next-btn"
              onClick={handleTogglePlayPause}
              aria-label={isAutoplayPaused ? 'Play slide rotation' : 'Pause slide rotation'}
              title={isAutoplayPaused ? 'Play' : 'Pause'}
            >
              {isAutoplayPaused ? (
                <svg
                  className="play-triangle-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
                </svg>
              ) : (
                <svg
                  className="play-triangle-icon pause-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
