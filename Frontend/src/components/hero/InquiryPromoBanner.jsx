import React, { useState, useEffect } from 'react';
import { fetchInquirySection, resolveMediaUrl } from '../../services/api';

const DEFAULT_INQUIRY_CONFIG = {
  isEnabled: true,
  imageUrl: '/images/hero-enhanced/pure-faucet-glass.jpg',
  imageAlt: 'Premium modern water purification faucet pouring crystal-clear drinking water into a transparent glass goblet',
  imagePosition: 'left',
  imageFit: 'contain',
  imageMaxHeight: 480,

  line1Text1: 'Now',
  line1Color1: '#171B2D', // Deep Navy/Black
  line1Text2: 'Just',
  line1Color2: 'gradient', // AVXBS Logo Gradient

  line2Text1: 'Put Your',
  line2Color1: '#171B2D', // Deep Navy/Black
  line2Text2: 'Inquiry',
  line2Color2: 'gradient', // AVXBS Logo Gradient

  line3Text1: 'And Get the',
  line3Color1: '#171B2D', // Deep Navy/Black
  line3Text2: 'Solution.',
  line3Color2: 'gradient', // AVXBS Logo Gradient

  line4Text1: 'At',
  line4Color1: '#171B2D', // Deep Navy/Black
  line4Text2: 'Door step',
  line4Color2: '#087CC1', // Blue Accent

  description:
    'Engineered whole-house and commercial water purification, softening, and filtration solutions installed directly at your doorstep.',
  showDescription: false,
};

/**
 * Premium Promotional Inquiry Banner for AVXBS
 * - Typography aligned with official AVXBS logo color palette:
 *   - Dark Charcoal: #292929
 *   - Deep Navy/Black: #171B2D
 *   - AVXBS Logo Gradient: Orange, Pink, Purple, Blue on "Just", "Inquiry", and "Solution."
 *   - Blue Accent: #087CC1
 *   - Blue underline beneath "Solution."
 */
export default function InquiryPromoBanner() {
  const [config, setConfig] = useState(DEFAULT_INQUIRY_CONFIG);

  useEffect(() => {
    let isMounted = true;
    fetchInquirySection().then((data) => {
      if (isMounted && data) {
        setConfig(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (config.isEnabled === false) {
    return null;
  }

  const isReversed = config.imagePosition === 'right';

  // Helper to render text with either logo gradient class or custom solid hex
  const renderStyledWord = (text, colorCode, defaultToGradient = false, className = '') => {
    const isGradient = colorCode === 'gradient' || (!colorCode && defaultToGradient);
    if (isGradient) {
      return <span className={`avxbs-logo-gradient-text ${className}`}>{text}</span>;
    }
    return (
      <span className={className} style={{ color: colorCode || '#087CC1' }}>
        {text}
      </span>
    );
  };

  return (
    <section 
      className="inquiry-promo-section" 
      aria-label="Water Treatment Inquiry Banner"
    >
      <div className={`inquiry-promo-container ${isReversed ? 'layout-reversed' : ''}`}>
        {/* Column 1: AI Generated Water Purification Image */}
        <div className="inquiry-promo-left">
          <div 
            className="inquiry-promo-image-wrapper"
            style={{ maxHeight: `${config.imageMaxHeight || 520}px` }}
          >
            <img 
              src={resolveMediaUrl(config.imageUrl, DEFAULT_INQUIRY_CONFIG.imageUrl)} 
              alt={config.imageAlt || 'Crystal pure water purification faucet with drinking glass'} 
              className="inquiry-promo-img"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/hero-enhanced/hero-pure-drinking-water.jpg';
              }}
            />
            {/* Subtle light ambient glow beneath image */}
            <div className="inquiry-img-ambient-glow" aria-hidden="true" />
          </div>
        </div>

        {/* Column 2: Exact brand-colour typography & highlights */}
        <div className="inquiry-promo-right">
          <div className="inquiry-promo-text-wrap">
            {/* Line 1: Now Just */}
            <div className="inquiry-line inquiry-line-lead">
              <span className="inquiry-text-dark">
                {config.line1Text1 || 'Now'}{' '}
              </span>
              <span className="highlight-lead">
                {renderStyledWord(config.line1Text2 || 'Just', config.line1Color2, true, 'glow-word glow-just')}
              </span>
            </div>

            {/* Line 2: Put Your Inquiry */}
            <h2 className="inquiry-line inquiry-line-main">
              <span className="inquiry-text-dark">
                {config.line2Text1 || 'Put Your'}{' '}
              </span>
              <span className="highlight-inquiry">
                {renderStyledWord(config.line2Text2 || 'Inquiry', config.line2Color2, true, 'glow-word glow-inquiry')}
              </span>
            </h2>

            {/* Line 3: And Get the Solution. with smooth animated underline */}
            <div className="inquiry-line-solution-wrapper">
              <div className="inquiry-line inquiry-line-sub">
                <span className="inquiry-text-dark">
                  {config.line3Text1 || 'And Get the'}{' '}
                </span>
                <span className="highlight-solution-word">
                  {renderStyledWord(config.line3Text2 || 'Solution.', config.line3Color2, true, 'glow-word glow-solution')}
                  {/* Subtle animated curved SVG underline beneath "Solution." in Accent Blue #087CC1 */}
                  <svg 
                    className="curved-blue-underline" 
                    viewBox="0 0 240 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path 
                      d="M 6 14 Q 120 25 234 8" 
                      stroke="#087CC1" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* Line 4: At Door step */}
            <div className="inquiry-line inquiry-line-doorstep">
              <span className="inquiry-text-dark">
                {config.line4Text1 || 'At'}{' '}
              </span>
              <span className="highlight-doorstep glow-word glow-doorstep">
                {config.line4Color2 === 'gradient'
                  ? renderStyledWord(config.line4Text2 || 'Door step', 'gradient', false, 'glow-word glow-doorstep')
                  : (config.line4Text2 || 'Door step')}
              </span>
            </div>

            {/* Optional Supporting Description */}
            {config.showDescription && config.description && (
              <p className="inquiry-promo-description">
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
