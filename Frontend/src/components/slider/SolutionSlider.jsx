import React, { useState, useRef, useEffect } from 'react';
import SubmissionCounter from './SubmissionCounter';
import { ChevronsRight, X, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { fetchSliderProducts, submitInquiry, fetchSubmissionCount } from '../../services/api';

const DEFAULT_PRODUCTS = [
  {
    id: 'water-softener',
    name: 'Water Softener',
    titleWater: 'WATER ',
    titleSoftner: 'SOFTNER'
  }
];

// Format multi-word solution titles into two distinct styling parts
function formatSolutionTitle(name = '') {
  if (!name) return { firstPart: 'WATER ', secondPart: 'SOFTNER' };
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    return { firstPart: words[0].toUpperCase(), secondPart: '' };
  }
  const mid = Math.ceil(words.length / 2);
  const firstPart = words.slice(0, mid).join(' ').toUpperCase() + ' ';
  const secondPart = words.slice(mid).join(' ').toUpperCase();
  return { firstPart, secondPart };
}

export default function SolutionSlider({ 
  counter, 
  onOpenContact,
  selectedSolution = null,
  onClearSolution = null
}) {
  const [productList, setProductList] = useState(DEFAULT_PRODUCTS);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const dragStartX = useRef(0);
  const cardSectionRef = useRef(null);

  // Active solution name dynamically driven by user selection or default product
  const [currentSolutionName, setCurrentSolutionName] = useState('Water Softener');
  const [currentSolutionScope, setCurrentSolutionScope] = useState('Residential');

  // Expansion & Form State
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    type: 'Residential',
    location: '',
    waterIssue: 'Hard water scale on bathroom & appliances',
    product: 'Water Softener',
    remarks: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Dynamic live submission counter state
  const [liveCount, setLiveCount] = useState(() => (typeof counter === 'number' ? counter : 0));

  // Sync with counter prop
  useEffect(() => {
    if (typeof counter === 'number') {
      setLiveCount(counter);
    }
  }, [counter]);

  // Fetch count directly on mount if not provided or to ensure fresh DB sync
  useEffect(() => {
    fetchSubmissionCount().then((count) => {
      if (typeof count === 'number') {
        setLiveCount(count);
      }
    });
  }, []);

  // Format count: 1 -> "01", 9 -> "09", 10 -> "10", 100 -> "100"
  const formattedCountNumber = liveCount < 10 ? `0${liveCount}` : `${liveCount}`;

  // Fetch dynamic products from MongoDB
  useEffect(() => {
    fetchSliderProducts().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setProductList(data);
      }
    });
  }, []);

  const isInitialMountRef = useRef(true);

  // Listen to incoming selectedSolution (from Mega Menu clicks or URL parameters)
  useEffect(() => {
    if (selectedSolution && selectedSolution.name) {
      const solutionName = selectedSolution.name;
      const solutionScope = selectedSolution.scope || 'Residential';

      setCurrentSolutionName(solutionName);
      setCurrentSolutionScope(solutionScope);

      // Update form data product and customer type
      setFormData((prev) => ({
        ...prev,
        product: solutionName,
        type: solutionScope === 'Commercial' ? 'Commercial' : 'Residential'
      }));

      // Never auto-scroll on initial mount / full browser reload
      if (isInitialMountRef.current) {
        return;
      }

      // Trigger 2.4s pulse highlight animation on active user selection
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [selectedSolution]);

  // Check URL query parameter on initial load or popstate (?solution=...&scope=...)
  useEffect(() => {
    const handleUrlSolutionCheck = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const solutionParam = params.get('solution');
      const scopeParam = params.get('scope');

      if (solutionParam) {
        const decodedName = decodeURIComponent(solutionParam);
        const resolvedScope = scopeParam && scopeParam.toLowerCase() === 'commercial' ? 'Commercial' : 'Residential';

        setCurrentSolutionName(decodedName);
        setCurrentSolutionScope(resolvedScope);

        setFormData((prev) => ({
          ...prev,
          product: decodedName,
          type: resolvedScope
        }));

        // Do not auto-scroll to the card section on initial load or browser refresh
      }
    };

    handleUrlSolutionCheck();
    isInitialMountRef.current = false;

    window.addEventListener('popstate', handleUrlSolutionCheck);
    return () => window.removeEventListener('popstate', handleUrlSolutionCheck);
  }, []);

  const TRIGGER_THRESHOLD = 80;
  const currentProduct = productList[activeProductIndex] || DEFAULT_PRODUCTS[0];

  // Dynamic card title formatting
  const formattedTitle = formatSolutionTitle(currentSolutionName);

  // Open expanded inquiry card with smooth scroll alignment
  const handleExpand = (e) => {
    if (e) e.stopPropagation();
    setIsExpanded(true);
    setSubmitSuccess(false);
    setSubmitError('');
    setErrors({});

    // Smoothly ensure the card is in optimal viewport view
    setTimeout(() => {
      if (cardSectionRef.current) {
        cardSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Collapse back to original left-aligned card
  const handleCollapse = (e) => {
    if (e) e.stopPropagation();
    setIsExpanded(false);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  // Close on Escape key when expanded
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Mouse drag handlers (only active when not expanded)
  const handleMouseDown = (e) => {
    if (isExpanded) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isExpanded) return;
    const delta = e.clientX - dragStartX.current;
    if (delta > 0) {
      setDragOffset(Math.min(delta, 160));
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || isExpanded) return;
    setIsDragging(false);
    if (dragOffset >= TRIGGER_THRESHOLD) {
      handleExpand();
    }
    setDragOffset(0);
  };

  // Touch handlers for mobile swipe (only active when not expanded)
  const handleTouchStart = (e) => {
    if (isExpanded) return;
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isExpanded) return;
    const delta = e.touches[0].clientX - dragStartX.current;
    if (delta > 0) {
      setDragOffset(Math.min(delta, 160));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isExpanded) return;
    setIsDragging(false);
    if (dragOffset >= TRIGGER_THRESHOLD) {
      handleExpand();
    }
    setDragOffset(0);
  };

  // Global mouseup safety
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (dragOffset >= TRIGGER_THRESHOLD) {
          handleExpand();
        }
        setDragOffset(0);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragOffset]);

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (isExpanded) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleExpand();
    }
  };

  // Form input validation & submission
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full name is required (min 2 characters)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    const rawMobile = formData.mobile.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!rawMobile) {
      errs.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(rawMobile)) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.type) {
      errs.type = 'Please select a customer type';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      type: formData.type,
      location: formData.location ? formData.location.trim() : '',
      waterIssue: formData.waterIssue ? formData.waterIssue.trim() : '',
      product: formData.product || 'Water Softener',
      remarks: formData.remarks ? formData.remarks.trim() : '',
      source: 'WaterSoftenerCard',
    };

    try {
      const response = await submitInquiry(payload);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      if (response && response.totalSubmissions !== undefined) {
        setLiveCount(response.totalSubmissions);
      } else {
        setLiveCount((prev) => prev + 1);
      }
      // Reset form fields
      setFormData({
        name: '',
        email: '',
        mobile: '',
        type: 'Residential',
        location: '',
        waterIssue: 'Hard water scale on bathroom & appliances',
        product: currentProduct.name,
        remarks: ''
      });
      // Auto-collapse inquiry card after 2.5 seconds or let user click 'Done & Close'
      setTimeout(() => {
        setIsExpanded(false);
        setSubmitSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('[WaterSoftenerCard] Form submission error:', err);
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to submit inquiry. Please try again.');
    }
  };

  return (
    <section 
      id="water-softener-inquiry-section" 
      ref={cardSectionRef} 
      className="slider-section"
    >
      <div className={`slider-container-wrap ${isExpanded ? 'is-expanded-mode' : 'is-collapsed-mode'}`}>
        {/* Grey Outer Slider Card (Left Aligned, Expands Smoothly to Right into Single Form Card) */}
        <div
          className={`solution-slider-card ${isExpanded ? 'is-card-expanded' : ''} ${isDragging ? 'dragging' : ''} ${isHighlighted ? 'card-pulse-highlight' : ''}`}
          role={isExpanded ? 'region' : 'button'}
          tabIndex={isExpanded ? -1 : 0}
          aria-label={
            isExpanded
              ? `${currentSolutionName} Expanded Inquiry Form Card`
              : `${currentSolutionName} Solution Card. Click or press enter to open inquiry form.`
          }
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={!isExpanded ? handleExpand : undefined}
        >
          {/* Top hairline gradient line */}
          <div className="card-top-gradient-line" aria-hidden="true" />

          {/* MAIN INNER CONTENT CONTAINER */}
          <div className="slider-card-content-area">
            {/* Left Column: Dark Panel with Label and Large Sequential Number */}
            <div className="slider-left-column">
              <SubmissionCounter 
                label={currentProduct.cardLabel || 'CURRENT USER ACCESS'} 
                number={formattedCountNumber} 
              />
            </div>

            {/* Center Column: Interactive White Inset Card */}
            <div
              className="slider-center-column"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
              onClick={!isExpanded ? handleExpand : undefined}
            >
              <div className="inset-white-card">
                <div className="card-border-gradient" aria-hidden="true" />
                <h2 className="solution-title">
                  <span className="title-water">{formattedTitle.firstPart}</span>
                  {formattedTitle.secondPart && (
                    <span className="title-softner">{formattedTitle.secondPart}</span>
                  )}
                </h2>
              </div>
            </div>

            {/* Right Column: Double Chevron & "Click Here" */}
            {!isExpanded && (
              <div className="slider-right-column" onClick={handleExpand}>
                <button
                  type="button"
                  className="action-trigger-btn"
                  aria-label={`Open ${currentSolutionName} Inquiry Form`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpand(e);
                  }}
                >
                  <div className="chevron-icon-box">
                    <ChevronsRight className="chevrons-icon" size={32} />
                  </div>
                  <span className="click-here-text">Click Here</span>
                </button>
              </div>
            )}
          </div>

          {/* SINGLE INTEGRATED INQUIRY FORM PANEL INSIDE THE EXPANDED CARD */}
          {isExpanded && (
            <div 
              className="floating-inquiry-panel"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button to collapse back to left original card */}
              <button
                type="button"
                className="floating-form-close-btn"
                onClick={handleCollapse}
                aria-label="Collapse inquiry card"
                title="Collapse form"
              >
                <X size={18} />
              </button>

              <div className="floating-form-header">
                <span className="floating-form-badge">AVXBS PURE SOLUTION</span>
                <h3 className="floating-form-title">
                  {currentSolutionName} Engineering Inquiry
                </h3>
                <p className="floating-form-subtitle">
                  Connect directly with certified AVXBS {currentSolutionScope} water treatment engineers for on-site assessment & system sizing.
                </p>
              </div>

              {submitSuccess ? (
                <div className="floating-form-success">
                  <CheckCircle2 size={46} className="floating-success-icon" />
                  <h4>Inquiry Submitted Successfully!</h4>
                  <p>
                    Thank you for contacting AVXBS. An engineering specialist will review your property requirements and contact you promptly.
                  </p>
                  <button
                    type="button"
                    className="floating-success-btn"
                    onClick={handleCollapse}
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="floating-inquiry-form" noValidate>
                  {submitError && (
                    <div className="floating-form-error-banner">
                      <AlertCircle size={16} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Customer Type Selector */}
                  <div className="floating-form-group">
                    <label className="floating-form-label">Property Scope</label>
                    <div className="floating-type-toggle">
                      <button
                        type="button"
                        className={`type-toggle-btn ${formData.type === 'Residential' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: 'Residential' })}
                      >
                        Residential (Villa / Flat)
                      </button>
                      <button
                        type="button"
                        className={`type-toggle-btn ${formData.type === 'Commercial' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: 'Commercial' })}
                      >
                        Commercial / Industrial
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Row: Full Name & Phone Number */}
                  <div className="floating-form-row">
                    <div className="floating-form-col">
                      <label className="floating-form-label" htmlFor="softener-name">
                        Full Name *
                      </label>
                      <input
                        id="softener-name"
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`floating-input ${errors.name ? 'input-error' : ''}`}
                      />
                      {errors.name && <span className="field-error-text">{errors.name}</span>}
                    </div>

                    <div className="floating-form-col">
                      <label className="floating-form-label" htmlFor="softener-mobile">
                        Phone / WhatsApp *
                      </label>
                      <input
                        id="softener-mobile"
                        type="tel"
                        name="mobile"
                        placeholder="9876543210"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className={`floating-input ${errors.mobile ? 'input-error' : ''}`}
                      />
                      {errors.mobile && <span className="field-error-text">{errors.mobile}</span>}
                    </div>
                  </div>

                  {/* 2-Column Row: Email & Location */}
                  <div className="floating-form-row">
                    <div className="floating-form-col">
                      <label className="floating-form-label" htmlFor="softener-email">
                        Email Address *
                      </label>
                      <input
                        id="softener-email"
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`floating-input ${errors.email ? 'input-error' : ''}`}
                      />
                      {errors.email && <span className="field-error-text">{errors.email}</span>}
                    </div>

                    <div className="floating-form-col">
                      <label className="floating-form-label" htmlFor="softener-location">
                        Location / City
                      </label>
                      <input
                        id="softener-location"
                        type="text"
                        name="location"
                        placeholder="e.g. Whitefield, Bangalore"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="floating-input"
                      />
                    </div>
                  </div>

                  {/* Selected Solution Field (Auto-adapted to selected category) */}
                  <div className="floating-form-group">
                    <label className="floating-form-label" htmlFor="softener-product">
                      Selected Solution / Category
                    </label>
                    <input
                      id="softener-product"
                      type="text"
                      name="product"
                      value={formData.product}
                      readOnly
                      className="floating-input"
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        fontWeight: 600,
                        cursor: 'default'
                      }}
                    />
                  </div>

                  {/* Water Requirements / Issues */}
                  <div className="floating-form-group">
                    <label className="floating-form-label" htmlFor="softener-water-issue">
                      Primary Water Issue / Requirement
                    </label>
                    <select
                      id="softener-water-issue"
                      name="waterIssue"
                      value={formData.waterIssue}
                      onChange={handleInputChange}
                      className="floating-select"
                    >
                      <option value="Hard water scale on bathroom & appliances">Hard water scale on bathroom & appliances</option>
                      <option value="Hair fall & dry skin from hard water">Hair fall & dry skin from hard water</option>
                      <option value="Complete Whole-House Water Softener & Filtration">Complete Whole-House Water Softener & Filtration</option>
                      <option value="Commercial Duplex Softener Plant Sizing">Commercial Duplex Softener Plant Sizing</option>
                      <option value="Boiler Feed / Industrial Softening Process">Boiler Feed / Industrial Softening Process</option>
                    </select>
                  </div>

                  {/* Message Field */}
                  <div className="floating-form-group">
                    <label className="floating-form-label" htmlFor="softener-remarks">
                      Additional Message / Remarks
                    </label>
                    <textarea
                      id="softener-remarks"
                      name="remarks"
                      rows={2}
                      placeholder="Specify number of bathrooms, family size, or daily flow rate needed..."
                      value={formData.remarks}
                      onChange={handleInputChange}
                      className="floating-textarea"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="floating-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
