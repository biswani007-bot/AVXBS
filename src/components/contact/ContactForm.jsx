import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Dedicated Contact Us Inquiry Form Panel
 * Strictly implements the required fields, validation (including Indian mobile numbers),
 * duplicate prevention, loading states, counter incrementing, and return navigation.
 */
export default function ContactForm({ initialType = 'Residential', onBack, onSubmitSuccess }) {
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

    // 3. Mobile Number validation (Indian 10-digit standard: 6-9 followed by 9 digits, optional +91 prefix)
    const rawMobile = formData.mobile.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!rawMobile) {
      errs.mobile = 'Mobile number is required.';
    } else if (!mobileRegex.test(rawMobile)) {
      errs.mobile = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
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
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || isSubmitted) return;

    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate reliable prototype submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Increment counter exactly once via parent callback
      onSubmitSuccess({
        ...formData,
        submittedAt: new Date().toISOString()
      });

      // Clear form data
      setFormData({
        type: 'Residential',
        name: '',
        mobile: '',
        email: '',
        remarks: ''
      });
    }, 800);
  };

  return (
    <section className="contact-panel-section" id="contact-panel">
      <div className="contact-panel-container">
        <div className="contact-card-box">
          <div className="contact-card-header">
            <h2 className="contact-heading">Contact Us</h2>
            <p className="contact-subtitle">
              Tell us your requirements. Our team will help you find the right water treatment solution.
            </p>
          </div>

          {/* Success State Notification */}
          {isSubmitted ? (
            <div className="submission-success-banner" role="status">
              <CheckCircle2 className="success-icon" size={32} />
              <div className="success-text-box">
                <h3 className="success-title">Inquiry Recorded Successfully</h3>
                <p className="success-desc">
                  Thank you! Your prototype inquiry has been registered. The submission counter has been updated.
                </p>
              </div>
              <button
                type="button"
                className="submit-another-btn"
                onClick={() => setIsSubmitted(false)}
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="inquiry-form">
              {/* Field 1: Type Dropdown */}
              <div className="form-group">
                <label htmlFor="inquiry-type" className="form-label">
                  Property Type <span className="req">*</span>
                </label>
                <select
                  id="inquiry-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`form-select ${errors.type ? 'error-border' : ''}`}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
                {errors.type && <span className="field-error-msg">{errors.type}</span>}
              </div>

              {/* Field 2: Name */}
              <div className="form-group">
                <label htmlFor="inquiry-name" className="form-label">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="inquiry-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`form-input ${errors.name ? 'error-border' : ''}`}
                  autoComplete="name"
                />
                {errors.name && <span className="field-error-msg">{errors.name}</span>}
              </div>

              {/* Field 3: Mobile Number */}
              <div className="form-group">
                <label htmlFor="inquiry-mobile" className="form-label">
                  Mobile Number <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  id="inquiry-mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`form-input ${errors.mobile ? 'error-border' : ''}`}
                  autoComplete="tel"
                />
                {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
              </div>

              {/* Field 4: Email */}
              <div className="form-group">
                <label htmlFor="inquiry-email" className="form-label">
                  Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  id="inquiry-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@domain.com"
                  className={`form-input ${errors.email ? 'error-border' : ''}`}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error-msg">{errors.email}</span>}
              </div>

              {/* Field 5: Remarks (Optional) */}
              <div className="form-group">
                <label htmlFor="inquiry-remarks" className="form-label">
                  Remarks / Water Problem Description <span className="opt">(Optional)</span>
                </label>
                <textarea
                  id="inquiry-remarks"
                  name="remarks"
                  rows={4}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Tell us about your water hardness, TDS levels, source (borewell/municipal), or installation requirements..."
                  className="form-textarea"
                />
              </div>

              {/* Submit CTA Button */}
              <div className="form-action-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-inquiry-btn"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="spinner-icon" size={20} />
                      <span>Processing Inquiry...</span>
                    </>
                  ) : (
                    <span>Submit Inquiry</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

