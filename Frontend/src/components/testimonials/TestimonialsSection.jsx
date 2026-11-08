import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  Quote, 
  Sparkles, 
  Building2, 
  Home, 
  MessageSquare, 
  ShieldCheck, 
  Heart 
} from 'lucide-react';
import { fetchTestimonials } from '../../services/api';
import CustomerAvatar from './CustomerAvatar';

/**
 * Individual Testimonial Card inspired by modern reference design and AVXBS branding.
 */
function TestimonialCard({
  item,
  position = 'center', // 'far-left' | 'left' | 'center' | 'right' | 'far-right'
  index = 0,
  isAnimating = false,
  slideDirection = 'next',
  onClick = null,
}) {
  if (!item) return null;

  const isCenter = position === 'center';
  const isSide = position === 'left' || position === 'right';
  const roleText = item.designation || (item.category === 'Commercial' ? 'Commercial Client' : 'Residential Homeowner');

  const avatarSize = isCenter ? 44 : (isSide ? 38 : 34);
  const quoteSize = isCenter ? 20 : (isSide ? 18 : 16);

  return (
    <div 
      className={`testimonial-card card-${position} ${isCenter ? 'featured-testimonial-card' : ''} ${isAnimating ? `anim-shift-${slideDirection}` : ''}`}
      onClick={!isCenter && onClick ? onClick : undefined}
      role={!isCenter && onClick ? 'button' : undefined}
      tabIndex={!isCenter && onClick ? 0 : undefined}
      onKeyDown={!isCenter && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label={!isCenter ? `Switch to review by ${item.customerName}` : `Featured review by ${item.customerName}`}
    >
      {/* Signature Floating Speech Reaction Bubble (Featured on Center Card) */}
      {isCenter && (
        <div className="card-floating-reaction" aria-hidden="true">
          <div className="reaction-bubble">
            <Heart size={13} className="reaction-heart heart-main" />
            <Heart size={10} className="reaction-heart heart-sub" />
          </div>
          <div className="reaction-tail" />
        </div>
      )}

      {/* Top Header: Quote Icon + Avatar + Author Meta */}
      <div className="card-header-row">
        <div className="card-quote-badge" aria-hidden="true">
          <Quote size={quoteSize} className="card-quote-icon" />
        </div>

        <div className="card-profile-header">
          <CustomerAvatar
            name={item.customerName}
            image={item.profileImage}
            avatarColor={item.avatarColor}
            index={index}
            size={avatarSize}
            border={isCenter ? '2px solid #38bdf8' : '1.5px solid rgba(2, 132, 199, 0.35)'}
            boxShadow={isCenter ? '0 0 16px rgba(56, 189, 248, 0.35)' : '0 2px 8px rgba(15, 23, 42, 0.08)'}
          />
          <div className="card-author-meta">
            <h4 className="author-name card-author-name">{item.customerName}</h4>
            <div className="card-role-badges-line">
              <span className="author-role card-author-role">{roleText}</span>
              {item.category && (
                <span className={`card-category-pill ${item.category === 'Commercial' ? 'pill-comm' : 'pill-res'}`}>
                  {item.category === 'Commercial' ? <Building2 size={10} /> : <Home size={10} />}
                  <span>{item.category}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body: Feedback Text with Typographic Watermark Quote */}
      <div className="card-body">
        <span className="card-watermark-quote" aria-hidden="true">&ldquo;</span>
        <blockquote className="featured-feedback-text card-feedback-text">
          "{item.feedback}"
        </blockquote>
      </div>

      {/* Card Footer: Rating Stars & Verified/Featured Accents (No Social Actions) */}
      <div className="card-footer">
        <div className="featured-rating-stars card-rating-stars" aria-label={`Rating: ${item.rating || 5} out of 5 stars`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={isCenter ? 14 : 12}
              className={`star-icon ${i < (item.rating || 5) ? 'is-filled' : 'is-empty'}`}
            />
          ))}
        </div>

        <div className="card-action-accents" aria-hidden="true">
          {item.isFeatured && (
            <span className="card-featured-pill">
              <Sparkles size={10} />
              <span>Featured</span>
            </span>
          )}
          <span className="card-verified-tag">
            <ShieldCheck size={13} />
            <span>Verified</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const touchStartXRef = useRef(null);
  const animTimerRef = useRef(null);

  // Fetch only reviews marked showOnHomepage from DB
  useEffect(() => {
    let isMounted = true;
    fetchTestimonials().then((data) => {
      if (isMounted) {
        if (Array.isArray(data)) {
          setTestimonials(data);
          // Find if any is marked isFeatured, set it as starting index
          const featIdx = data.findIndex(t => t.isFeatured);
          if (featIdx !== -1) {
            setCurrentIndex(featIdx);
          } else {
            setCurrentIndex(0);
          }
        } else {
          setTestimonials([]);
        }
      }
    }).catch(() => {
      if (isMounted) setTestimonials([]);
    }).finally(() => { 
      if (isMounted) setLoading(false); 
    });

    return () => { isMounted = false; };
  }, []);

  const count = testimonials.length;

  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  // Handle visibility change (pause when tab is hidden, resume when visible)
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const navigateTo = (newIndex, direction = 'next') => {
    if (count <= 1 || newIndex === currentIndex) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
    }
    animTimerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 450);
  };

  const handlePrev = () => {
    if (count <= 1) return;
    const target = ((currentIndex - 1) % count + count) % count;
    navigateTo(target, 'prev');
  };

  const handleNext = () => {
    if (count <= 1) return;
    const target = (currentIndex + 1) % count;
    navigateTo(target, 'next');
  };

  // Automatic Clockwise Rotation (Autoplay interval: 4.5 seconds)
  useEffect(() => {
    if (isPaused || count <= 1) return;

    // Respect prefers-reduced-motion
    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mediaQuery && mediaQuery.matches) return;

    const timer = setTimeout(() => {
      if (!document.hidden) {
        navigateTo((currentIndex + 1) % count, 'next');
      }
    }, 4500);

    return () => {
      clearTimeout(timer);
    };
  }, [currentIndex, isPaused, count]);

  // Touch Swipe Handlers for mobile & tablet
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartXRef.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  const getSlideItem = (offset) => {
    if (count === 0) return { item: null, index: 0 };
    const idx = ((currentIndex + offset) % count + count) % count;
    return { item: testimonials[idx], index: idx };
  };

  const farLeft = getSlideItem(-2);
  const left = getSlideItem(-1);
  const center = getSlideItem(0);
  const right = getSlideItem(1);
  const farRight = getSlideItem(2);

  return (
    <section 
      id="testimonials-section" 
      className="testimonials-master-section" 
      aria-label="Customer Feedback & Testimonials"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="testimonials-container">
        
        {/* ========================================================
            HEADER AREA
            ======================================================== */}
        <div className="testimonials-header-area">
          <span className="testimonials-script-subtitle">Testimonials</span>
          <h2 className="testimonials-main-heading">Client Reviews</h2>
          <p className="testimonials-lead-desc">
            Discover why homeowners and enterprise infrastructure managers rely on AVXBS for precision scale elimination and pure water engineering.
          </p>
        </div>

        {/* ========================================================
            FIVE-CARD TESTIMONIALS STAGE
            ======================================================== */}
        {count === 0 ? (
          <div className="testimonials-empty-state">
            <MessageSquare size={36} color="#38bdf8" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
            <h3 className="empty-state-title">
              No Featured Reviews Yet
            </h3>
            <p className="empty-state-desc">
              Reviews submitted by customers will appear here once toggled to <strong>Show on Homepage</strong>.
            </p>
          </div>
        ) : (
          <div 
            className="testimonials-stage-wrapper"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient Lighting Orbs */}
            <div className="floating-glow-orb orb-left" aria-hidden="true" />
            <div className="floating-glow-orb orb-right" aria-hidden="true" />

            {/* 3D Floating Metallic/Pearl Spheres */}
            <div className="stage-pearl-sphere sphere-left" aria-hidden="true" />
            <div className="stage-pearl-sphere sphere-right" aria-hidden="true" />
            <div className="stage-pearl-sphere sphere-small" aria-hidden="true" />

            {/* Five-Card Stage Frame */}
            <div className="testimonials-cards-frame">
              {/* Far-Left Card: Blurred outer card, clicking goes prev */}
              <TestimonialCard
                key="slot-far-left"
                item={farLeft.item}
                position="far-left"
                index={farLeft.index}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
                onClick={handlePrev}
              />

              {/* Left Card: Sharp side card, clicking goes prev */}
              <TestimonialCard
                key="slot-left"
                item={left.item}
                position="left"
                index={left.index}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
                onClick={handlePrev}
              />

              {/* Center Card: Highlighted hero card */}
              <TestimonialCard
                key="slot-center"
                item={center.item}
                position="center"
                index={center.index}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
              />

              {/* Right Card: Sharp side card, clicking advances next */}
              <TestimonialCard
                key="slot-right"
                item={right.item}
                position="right"
                index={right.index}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
                onClick={handleNext}
              />

              {/* Far-Right Card: Blurred outer card, clicking advances next */}
              <TestimonialCard
                key="slot-far-right"
                item={farRight.item}
                position="far-right"
                index={farRight.index}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
                onClick={handleNext}
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}