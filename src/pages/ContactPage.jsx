import React from 'react';
import { MapPin, Phone, Mail, Clock, ArrowLeft } from 'lucide-react';
import ContactForm from '../components/contact/ContactForm';

/**
 * Contact Us Page for AVXBS
 * Features:
 * - Official contact credentials & information cards (using verified placeholders)
 * - Corporate office & service center details
 * - Interactive Inquiry / Solution Request Form (reusing ContactForm)
 * - Navigation links
 */
export default function ContactPage({ navigate, initialType = 'Residential', onSubmitSuccess }) {
  return (
    <div className="page-view-container contact-page">
      {/* Top Header */}
      <section className="contact-hero-section">
        <div className="contact-hero-content">
          <h1 className="contact-page-title">
            Contact <span className="highlight-text">AVXBS</span>
          </h1>
          <p className="contact-hero-subtitle">
            Get in touch with our water softening engineers for custom residential installations,
            commercial site evaluations, or prompt technical service.
          </p>
        </div>
      </section>

      {/* Main Grid: Contact Credentials + Form */}
      <section className="contact-content-section">
        <div className="section-container">
          <div className="contact-two-col-layout">
            {/* Left: Official Contact Details */}
            <div className="contact-info-panel">
              <div className="info-card-header">
                <h2 className="info-panel-title">Headquarters & Support</h2>
                <p className="info-panel-desc">
                  Our dedicated water treatment engineering team is available to assist you with system sizing, water test analysis, and installation queries.
                </p>
              </div>

              {/* Note on official credentials */}
              <div className="credentials-notice-banner">
                <em>Note: Official contact credentials pending user confirmation. For immediate inquiries, please submit the form.</em>
              </div>

              <div className="contact-cards-stack">
                <div className="contact-meta-card">
                  <div className="meta-icon-wrapper">
                    <MapPin size={22} className="meta-icon" />
                  </div>
                  <div className="meta-card-body">
                    <h3 className="meta-title">Corporate Headquarters</h3>
                    <p className="meta-text">[Official Company Address - To Be Provided]</p>
                    <span className="meta-sub">Regional dispatch & central engineering facility</span>
                  </div>
                </div>

                <div className="contact-meta-card">
                  <div className="meta-icon-wrapper">
                    <Phone size={22} className="meta-icon" />
                  </div>
                  <div className="meta-card-body">
                    <h3 className="meta-title">Helpline & Direct Line</h3>
                    <p className="meta-text">[Toll-Free / Support Phone - To Be Provided]</p>
                    <span className="meta-sub">Toll-free customer support & technical inquiries</span>
                  </div>
                </div>

                <div className="contact-meta-card">
                  <div className="meta-icon-wrapper">
                    <Mail size={22} className="meta-icon" />
                  </div>
                  <div className="meta-card-body">
                    <h3 className="meta-title">Electronic Mail</h3>
                    <p className="meta-text">[Official Support Email - To Be Provided]</p>
                    <span className="meta-sub">Direct response within 24 business hours</span>
                  </div>
                </div>

                <div className="contact-meta-card">
                  <div className="meta-icon-wrapper">
                    <Clock size={22} className="meta-icon" />
                  </div>
                  <div className="meta-card-body">
                    <h3 className="meta-title">Operating Hours</h3>
                    <p className="meta-text">Monday – Saturday: 9:00 AM – 6:00 PM IST</p>
                    <span className="meta-sub">Sunday: Closed for routine maintenance</span>
                  </div>
                </div>
              </div>

              <div className="info-back-wrap">
                <button
                  type="button"
                  className="btn-back-home"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft size={16} />
                  <span>Return to Home Overview</span>
                </button>
              </div>
            </div>

            {/* Right: Embedded Interactive Inquiry Form */}
            <div className="contact-form-panel-wrapper">
              <ContactForm
                initialType={initialType}
                onBack={() => navigate('/')}
                onSubmitSuccess={onSubmitSuccess}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

