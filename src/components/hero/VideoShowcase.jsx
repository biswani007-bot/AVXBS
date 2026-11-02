import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

/**
 * Dual Video Showcase Component
 * Features two responsive, visually balanced HTML5 video presentations using
 * the verified project video asset with smooth playback controls and no layout shifts.
 */
export default function VideoShowcase() {
  const video1Ref = useRef(null);
  const video2Ref = useRef(null);

  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isMuted1, setIsMuted1] = useState(true);

  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isMuted2, setIsMuted2] = useState(true);

  const togglePlay1 = () => {
    if (!video1Ref.current) return;
    if (video1Ref.current.paused) {
      video1Ref.current.play();
      setIsPlaying1(true);
    } else {
      video1Ref.current.pause();
      setIsPlaying1(false);
    }
  };

  const toggleMute1 = () => {
    if (!video1Ref.current) return;
    video1Ref.current.muted = !video1Ref.current.muted;
    setIsMuted1(video1Ref.current.muted);
  };

  const togglePlay2 = () => {
    if (!video2Ref.current) return;
    if (video2Ref.current.paused) {
      video2Ref.current.play();
      setIsPlaying2(true);
    } else {
      video2Ref.current.pause();
      setIsPlaying2(false);
    }
  };

  const toggleMute2 = () => {
    if (!video2Ref.current) return;
    video2Ref.current.muted = !video2Ref.current.muted;
    setIsMuted2(video2Ref.current.muted);
  };

  const requestFullscreen = (ref) => {
    if (ref.current) {
      if (ref.current.requestFullscreen) {
        ref.current.requestFullscreen();
      } else if (ref.current.webkitRequestFullscreen) {
        ref.current.webkitRequestFullscreen();
      }
    }
  };

  return (
    <div className="video-showcase-container">
      {/* Brand & Partner Introduction Header */}
      <div className="venetus-brand-strip">
        <div className="venetus-brand-content">
          <div className="venetus-logo-mark">
            <svg viewBox="0 0 100 80" className="venetus-swoosh-svg" aria-hidden="true">
              <defs>
                <linearGradient id="venetusGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0072CE" />
                  <stop offset="100%" stopColor="#00B4D8" />
                </linearGradient>
              </defs>
              <path
                d="M15,45 C25,50 35,65 42,75 C52,45 70,20 95,5 C70,25 48,50 38,60 C30,50 22,46 15,45 Z"
                fill="url(#venetusGrad)"
              />
            </svg>
          </div>
          <div className="venetus-brand-text">
            <span className="venetus-title">VENETUS</span>
            <p className="venetus-tagline">
              Save <span className="tag-blue">the blue</span> to keep{' '}
              <span className="tag-green">the green</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dual Video Showcase Grid */}
      <div className="video-dual-grid">
        {/* Video Card 1: Primary System Overview */}
        <div className="video-card-wrapper card-primary">
          <div className="video-card-header">
            <span className="video-badge">Demonstration 01</span>
            <h3 className="video-card-title">Water Softening Technology Overview</h3>
          </div>

          <div className="video-player-box" onClick={togglePlay1}>
            <video
              ref={video1Ref}
              src="/assets/videos/reference-video.mp4"
              className="html5-video-player"
              playsInline
              muted={isMuted1}
              preload="metadata"
              onPlay={() => setIsPlaying1(true)}
              onPause={() => setIsPlaying1(false)}
            />

            {!isPlaying1 && (
              <div className="video-play-overlay">
                <button
                  type="button"
                  className="play-pulse-btn"
                  aria-label="Play Water Softener Overview Video"
                >
                  <Play className="play-icon" size={28} />
                </button>
                <span className="overlay-caption">Watch Water Softener Demonstration</span>
              </div>
            )}

            <div className="video-control-bar" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={togglePlay1}
                className="ctrl-btn"
                aria-label={isPlaying1 ? 'Pause' : 'Play'}
              >
                {isPlaying1 ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                onClick={toggleMute1}
                className="ctrl-btn"
                aria-label={isMuted1 ? 'Unmute' : 'Mute'}
              >
                {isMuted1 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="spacer" />
              <button
                type="button"
                onClick={() => requestFullscreen(video1Ref)}
                className="ctrl-btn"
                aria-label="Full screen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Card 2: Technical Operation & Process */}
        <div className="video-card-wrapper card-secondary">
          <div className="video-card-header">
            <span className="video-badge">Demonstration 02</span>
            <h3 className="video-card-title">Residential & Commercial Process Flow</h3>
          </div>

          <div className="video-player-box" onClick={togglePlay2}>
            <video
              ref={video2Ref}
              src="/assets/videos/water-softener-demo.mp4"
              className="html5-video-player"
              playsInline
              muted={isMuted2}
              preload="metadata"
              onPlay={() => setIsPlaying2(true)}
              onPause={() => setIsPlaying2(false)}
            />

            {!isPlaying2 && (
              <div className="video-play-overlay">
                <button
                  type="button"
                  className="play-pulse-btn"
                  aria-label="Play Process Demonstration Video"
                >
                  <Play className="play-icon" size={28} />
                </button>
                <span className="overlay-caption">Explore Treatment Process Flow</span>
              </div>
            )}

            <div className="video-control-bar" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={togglePlay2}
                className="ctrl-btn"
                aria-label={isPlaying2 ? 'Pause' : 'Play'}
              >
                {isPlaying2 ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                onClick={toggleMute2}
                className="ctrl-btn"
                aria-label={isMuted2 ? 'Unmute' : 'Mute'}
              >
                {isMuted2 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="spacer" />
              <button
                type="button"
                onClick={() => requestFullscreen(video2Ref)}
                className="ctrl-btn"
                aria-label="Full screen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

