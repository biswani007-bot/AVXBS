import React, { useRef, useEffect, useState } from 'react';

/**
 * Automatic Promotional Video Player Component
 * Features the original AI commercial video for AVXBS Water Softening Technology.
 * - 16:9 Aspect ratio.
 * - Muted autoplay, seamless looping, inline playback.
 * - Zero player controls, no play/pause buttons, no overlays.
 * - Autoplay resilience with IntersectionObserver and user gesture fallback.
 */
export default function AutoVideoPlayer() {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt instant autoplay
    const attemptPlay = () => {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay started successfully
          })
          .catch(() => {
            // Retry on user interaction if browser policy requires it
            const resumeOnInteraction = () => {
              if (video) {
                video.muted = true;
                video.play().catch(() => {});
              }
              window.removeEventListener('click', resumeOnInteraction);
              window.removeEventListener('touchstart', resumeOnInteraction);
              window.removeEventListener('scroll', resumeOnInteraction);
            };
            window.addEventListener('click', resumeOnInteraction, { once: true });
            window.addEventListener('touchstart', resumeOnInteraction, { once: true });
            window.addEventListener('scroll', resumeOnInteraction, { once: true });
          });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            attemptPlay();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(video);
    attemptPlay();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="hero-video-card">
      <div className={`hero-video-inner ${isLoaded ? 'loaded' : 'loading'}`}>
        <video
          ref={videoRef}
          src="/assets/videos/water-softener-promo.mp4"
          className="auto-html5-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          aria-label="AVXBS Water Softening Technology Commercial Video"
        />
      </div>
    </div>
  );
}
