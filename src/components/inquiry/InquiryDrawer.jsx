import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, Send, Droplets } from 'lucide-react';

/**
 * Animated Right-Side Inquiry Form Drawer
 * - Slides in smoothly from right to left (450ms cubic-bezier transition).
 * - Fixed right position with rounded left border and subtle shadow.
 * - Semi-transparent background overlay.
 * - Dismisses on: X click, overlay click, or Escape key.
 * - Preserves underlying page position and layout completely.
 * - Form validation (Type, Name, Mobile, Email, Remarks).
 * - Auto-populates selected product name from the slider.
 */
export default function InquiryDrawer({
  isOpen,
  onClose,
  productName = 'Water Softener',
  initialType = 'Residential',
  onSubmitSuccess
}) {
  const [formData, setFormData] = useState({
    type: initialType || 'Residential',
    name: '',
    mobile: '',
    email: '',
    remarks: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const drawerRef = useRef(null);

  // Sync initial property type if changed externally
  useEffect(() => {
    if (initialType) {
      setFormData((prev) => ({ ...prev, type: initialType }));
    }
  }, [initialType]);

  // Handle Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form when drawer opens for a new inquiry
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const errs = {};

    // 1. Type validation
    if (!formData.type || (formData.type !== 'Residential' && formData.type !== 'Commercial')) {
      errs.type = 'Please select a valid property type.';
    }

    // 2. Name validation (required, at least 2 chars)
    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Please enter at least 2 characters.';
    }

    // 3. Mobile Number validation (Indian 10-digit standard: 6-9 followed by 9 digits)
    const rawMobile = formData.mobile.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!rawMobile) {
      errs.mobile = 'Mobile number is required.';
    } else if (!mobileRegex.test(rawMobile)) {
      errs.mobile = 'Please enter a valid 10-digit mobile number (e.g. 9876543210).';
    }

    // 4. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // Remarks is optional

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear specific error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate reliable submission (Prototype)
    setTimeout(() => {
      const payload = {
        ...formData,
        product: productName,
        submittedAt: new Date().toISOString()
      };

      console.log('Inquiry submitted via Drawer (Prototype):', payload);

      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmittedData(payload);

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }
    }, 600);
  };

  const handleReset = () => {
    setFormData({
      type: initialType || 'Residential',
      name: '',
      mobile: '',
      email: '',
      remarks: ''
    });
    setErrors({});
    setIsSubmitted(false);
    setSubmittedData(null);
  };

  return (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      <div
        className={`inquiry-drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Right-Side Slide-in Drawer Container */}
      <aside
        ref={drawerRef}
        className={`inquiry-drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-heading"
        aria-hidden={!isOpen}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with Title and Close Button */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <h2 id="drawer-heading" className="drawer-main-title">
              Get Your Inquiry
            </h2>
            <div className="drawer-product-pill">
              <Droplets size={13} className="pill-icon" />
              <span className="pill-text">{productName}</span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close inquiry drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body (Scrollable independently) */}
        <div className="drawer-body">
          {isSubmitted ? (
            /* Success Feedback State */
            <div className="drawer-success-state">
              <div className="success-icon-bubble">
                <CheckCircle2 size={48} className="success-check-icon" />
              </div>
              <h3 className="success-title">Inquiry Received!</h3>
              <p className="success-message">
                Thank you, <strong>{submittedData?.name}</strong>. Our water treatment engineering
                team has received your inquiry for <strong>{submittedData?.product}</strong> ({submittedData?.type})
                and will connect with you at <strong>{submittedData?.mobile}</strong> shortly.
              </p>

              <div className="success-actions">
                <button
                  type="button"
                  className="btn-drawer-secondary"
                  onClick={handleReset}
                >
                  Submit Another Inquiry
                </button>
                <button
                  type="button"
                  className="btn-drawer-primary"
                  onClick={onClose}
                >
                  Close Drawer
                </button>
              </div>
            </div>
          ) : (
            /* Main Inquiry Form */
            <form onSubmit={handleSubmit} className="drawer-inquiry-form" noValidate>
              <p className="drawer-intro-text">
                Please provide your details below and our technical team will recommend the optimal water treatment setup.
              </p>

              {/* 1. Type Drop-Down */}
              <div className="form-field-group">
                <label htmlFor="drawer-type" className="form-field-label">
                  Property Type <span className="req-star">*</span>
                </label>
                <div className="select-input-wrap">
                  <select
                    id="drawer-type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`drawer-select-input ${errors.type ? 'input-error' : ''}`}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>
                {errors.type && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.type}</span>
                  </div>
                )}
              </div>

              {/* 2. Full Name */}
              <div className="form-field-group">
                <label htmlFor="drawer-name" className="form-field-label">
                  Full Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  id="drawer-name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`drawer-text-input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* 3. Mobile Number */}
              <div className="form-field-group">
                <label htmlFor="drawer-mobile" className="form-field-label">
                  Mobile Number <span className="req-star">*</span>
                </label>
                <input
                  type="tel"
                  id="drawer-mobile"
                  name="mobile"
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`drawer-text-input ${errors.mobile ? 'input-error' : ''}`}
                />
                {errors.mobile && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.mobile}</span>
                  </div>
                )}
              </div>

              {/* 4. Email */}
              <div className="form-field-group">
                <label htmlFor="drawer-email" className="form-field-label">
                  Email Address <span className="req-star">*</span>
                </label>
                <input
                  type="email"
                  id="drawer-email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`drawer-text-input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && (
                  <div className="field-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* 5. Remarks */}
              <div className="form-field-group">
                <label htmlFor="drawer-remarks" className="form-field-label">
                  Remarks / Notes <span className="optional-tag">(Optional)</span>
                </label>
                <textarea
                  id="drawer-remarks"
                  name="remarks"
                  rows={3}
                  placeholder="Any specific requirements, water hardness level, or questions..."
                  value={formData.remarks}
                  onChange={handleChange}
                  className="drawer-textarea-input"
                />
              </div>

              {/* Submit Button */}
              <div className="drawer-submit-wrap">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="drawer-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spinner-icon" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Inquiry</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}

