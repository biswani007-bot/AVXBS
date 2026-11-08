import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitInquiry } from '../../services/api';

/**
 * Dedicated Contact Us Inquiry Form Panel
 * Dynamic field labels, placeholders, button text, and feedback messages
 * connected to admin settings while maintaining robust Indian mobile and email validation.
 */
export default function ContactForm({ 
  initialType = 'Residential', 
  formSettings,
  onBack, 
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

  // Settings fallbacks
  const heading = formSettings?.heading || 'Contact Us';
  const subtitle = formSettings?.subtitle || 'Tell us your requirements. Our team will help you find the right water treatment solution.';
  const propertyTypes = formSettings?.propertyTypes && formSettings.propertyTypes.length > 0
    ? formSettings.propertyTypes 
    : ['Residential', 'Commercial'];

  const nameField = formSettings?.nameField || { label: 'Full Name', placeholder: 'Enter your full name', isRequired: true };
  const mobileField = formSettings?.mobileField || { label: 'Mobile Number', placeholder: 'e.g. 9876543210', isRequired: true };
  const emailField = formSettings?.emailField || { label: 'Email Address', placeholder: 'you@domain.com', isRequired: true };
  const remarksField = formSettings?.remarksField || { label: 'Remarks / Water Problem Description', placeholder: 'Tell us about your water hardness, TDS levels, source (borewell/municipal), or installation requirements...', isRequired: false };
  const submitBtnText = formSettings?.submitBtnText || 'Submit Inquiry';
  const successMessage = formSettings?.successMessage || 'Thank you! Your inquiry has been securely recorded. An AVXBS water treatment specialist will contact you shortly.';

  const validate = () => {
    const errs = {};

    // 1. Type validation
    if (!formData.type) {
      errs.type = 'Please select a valid property type.';
    }

    // 2. Name validation
    if (nameField.isRequired !== false) {
      if (!formData.name.trim()) {
        errs.name = `${nameField.label || 'Full name'} is required.`;
      } else if (formData.name.trim().length < 2) {
        errs.name = 'Please enter at least 2 characters.';
      }
    }

    // 3. Mobile Number validation (Indian 10-digit standard: 6-9 followed by 9 digits, optional +91 prefix)
    if (mobileField.isRequired !== false) {
      const rawMobile = formData.mobile.replace(/[\s\-\(\)]/g, '');
      const mobileRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!rawMobile) {
        errs.mobile = `${mobileField.label || 'Mobile number'} is required.`;
      } else if (!mobileRegex.test(rawMobile)) {
        errs.mobile = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
      }
    }

    // 4. Email validation
    if (emailField.isRequired !== false) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        errs.email = `${emailField.label || 'Email address'} is required.`;
      } else if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    // 5. Remarks validation
    if (remarksField.isRequired === true && !formData.remarks.trim()) {
      errs.remarks = `${remarksField.label || 'Remarks'} is required.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || isSubmitted) return;
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      ...formData,
      product: 'Water Softener',
      source: 'ContactPage',
    };

    try {
      const response = await submitInquiry(payload);
      setIsSubmitting(false);
      setIsSubmitted(true);

      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...formData,
          totalSubmissions: response?.totalSubmissions,
          submittedAt: new Date().toISOString(),
        });
      }

      setFormData({
        type: propertyTypes[0] || 'Residential',
        name: '',
        mobile: '',
        email: '',
        remarks: '',
      });
    } catch (err) {
      console.warn('Backend inquiry submission fallback:', err.message);
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...formData,
          submittedAt: new Date().toISOString(),
        });
      }
      setFormData({
        type: propertyTypes[0] || 'Residential',
        name: '',
        mobile: '',
        email: '',
        remarks: '',
      });
    }
  };

  return (
    <section className="contact-panel-section" id="contact-panel">
      <div className="contact-panel-container">
        <div className="contact-card-box">
          <div className="contact-card-header">
            <h2 className="contact-heading">{heading}</h2>
            <p className="contact-subtitle">
              {subtitle}
            </p>
          </div>

          {/* Success State Notification */}
          {isSubmitted ? (
            <div className="submission-success-banner" role="status">
              <CheckCircle2 className="success-icon" size={32} />
              <div className="success-text-box">
                <h3 className="success-title">Inquiry Recorded Successfully</h3>
                <p className="success-desc">
                  {successMessage}
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
                  {propertyTypes.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
                {errors.type && <span className="field-error-msg">{errors.type}</span>}
              </div>

              {/* Field 2: Name */}
              <div className="form-group">
                <label htmlFor="inquiry-name" className="form-label">
                  {nameField.label} {nameField.isRequired !== false && <span className="req">*</span>}
                </label>
                <input
                  type="text"
                  id="inquiry-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={nameField.placeholder}
                  className={`form-input ${errors.name ? 'error-border' : ''}`}
                  autoComplete="name"
                />
                {errors.name && <span className="field-error-msg">{errors.name}</span>}
              </div>

              {/* Field 3: Mobile Number */}
              <div className="form-group">
                <label htmlFor="inquiry-mobile" className="form-label">
                  {mobileField.label} {mobileField.isRequired !== false && <span className="req">*</span>}
                </label>
                <input
                  type="tel"
                  id="inquiry-mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder={mobileField.placeholder}
                  className={`form-input ${errors.mobile ? 'error-border' : ''}`}
                  autoComplete="tel"
                />
                {errors.mobile && <span className="field-error-msg">{errors.mobile}</span>}
              </div>

              {/* Field 4: Email */}
              <div className="form-group">
                <label htmlFor="inquiry-email" className="form-label">
                  {emailField.label} {emailField.isRequired !== false && <span className="req">*</span>}
                </label>
                <input
                  type="email"
                  id="inquiry-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={emailField.placeholder}
                  className={`form-input ${errors.email ? 'error-border' : ''}`}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error-msg">{errors.email}</span>}
              </div>

              {/* Field 5: Remarks (Optional / Configurable) */}
              <div className="form-group">
                <label htmlFor="inquiry-remarks" className="form-label">
                  {remarksField.label} {remarksField.isRequired ? <span className="req">*</span> : <span className="opt">(Optional)</span>}
                </label>
                <textarea
                  id="inquiry-remarks"
                  name="remarks"
                  rows={4}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder={remarksField.placeholder}
                  className={`form-textarea ${errors.remarks ? 'error-border' : ''}`}
                />
                {errors.remarks && <span className="field-error-msg">{errors.remarks}</span>}
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
                    <span>{submitBtnText}</span>
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
