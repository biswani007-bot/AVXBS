import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, ArrowLeft } from 'lucide-react';
import ContactForm from '../components/contact/ContactForm';
import { fetchContactConfig } from '../services/api';

const ICON_MAP = {
  MapPin: MapPin,
  Phone: Phone,
  Mail: Mail,
  Clock: Clock,
};

const DEFAULT_CONTACT_DATA = {
  header: {
    pageTitle: 'Contact',
    highlightWord: 'AVXBS',
    subtitle: 'Get in touch with our water softening engineers for custom residential installations, commercial site evaluations, or prompt technical service.',
    titleColor: '#545454',
    highlightColor: '#545454',
    alignment: 'center',
    isEnabled: true,
  },
  infoPanel: {
    sectionHeading: 'Headquarters & Support',
    description: 'Our dedicated water treatment engineering team is available to assist you with system sizing, water test analysis, and installation queries.',
    noticeBanner: 'Note: Official contact credentials pending user confirmation. For immediate inquiries, please submit the form.',
    cards: [
      {
        title: 'Corporate Headquarters',
        content: '[Official Company Address - To Be Provided]',
        subtext: 'Regional dispatch & central engineering facility',
        icon: 'MapPin',
        isActive: true,
      },
      {
        title: 'Helpline & Direct Line',
        content: '[Toll-Free / Support Phone - To Be Provided]',
        subtext: 'Toll-free customer support & technical inquiries',
        icon: 'Phone',
        isActive: true,
      },
      {
        title: 'Electronic Mail',
        content: '[Official Support Email - To Be Provided]',
        subtext: 'Direct response within 24 business hours',
        icon: 'Mail',
        isActive: true,
      },
      {
        title: 'Operating Hours',
        content: 'Monday – Saturday: 9:00 AM – 6:00 PM IST',
        subtext: 'Sunday: Closed for routine maintenance',
        icon: 'Clock',
        isActive: true,
      },
    ],
    backBtnText: 'Return to Home Overview',
    backBtnUrl: '/',
    isEnabled: true,
  },
  formConfig: {
    heading: 'Request Engineering Consultation',
    subtitle: 'Complete the form below to connect with an AVXBS certified water engineer.',
    propertyTypes: ['Residential', 'Commercial'],
    nameField: {
      label: 'Full Name',
      placeholder: 'Enter your full name',
      isRequired: true,
    },
    mobileField: {
      label: 'Mobile Number',
      placeholder: 'e.g. 9876543210',
      isRequired: true,
    },
    emailField: {
      label: 'Email Address',
      placeholder: 'name@example.com',
      isRequired: true,
    },
    remarksField: {
      label: 'Remarks / Water Problem Description',
      placeholder: 'Describe your water requirements, hardness symptoms, or site details (optional)...',
      isRequired: false,
    },
    submitBtnText: 'Submit Consultation Request',
    successMessage: 'Thank you! Your inquiry has been securely recorded. An AVXBS water treatment specialist will contact you shortly.',
    errorMessage: 'Failed to submit inquiry. Please review your details and try again.',
    isEnabled: true,
  },
};

/**
 * Dynamic Contact Us Page for AVXBS
 */
export default function ContactPage({ navigate, initialType = 'Residential', onSubmitSuccess }) {
  const [data, setData] = useState(DEFAULT_CONTACT_DATA);

  useEffect(() => {
    let isMounted = true;
    fetchContactConfig().then((config) => {
      if (isMounted && config) {
        setData(config);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const { header, infoPanel, formConfig } = data;

  return (
    <div className="page-view-container contact-page">
      {/* A. Top Header */}
      {header?.isEnabled !== false && (
        <section className="contact-hero-section">
          <div className="contact-hero-content" style={{ textAlign: header.alignment || 'center' }}>
            <h1 className="contact-page-title">
              {header.pageTitle}{' '}
              <span className="highlight-text">
                {header.highlightWord}
              </span>
            </h1>
            <div className="heading-brand-accent-line" aria-hidden="true" />
            <p className="contact-hero-subtitle">
              {header.subtitle}
            </p>
          </div>
        </section>
      )}

      {/* Main Grid: Contact Credentials + Form */}
      <section className="contact-content-section">
        <div className="section-container">
          <div className="contact-two-col-layout">
            {/* B. Left: Official Contact Details */}
            {infoPanel?.isEnabled !== false && (
              <div className="contact-info-panel">
                <div className="info-card-header">
                  <h2 className="info-panel-title">{infoPanel.sectionHeading}</h2>
                  <p className="info-panel-desc">
                    {infoPanel.description}
                  </p>
                </div>

                {infoPanel.noticeBanner && (
                  <div className="credentials-notice-banner">
                    <em>{infoPanel.noticeBanner}</em>
                  </div>
                )}

                <div className="contact-cards-stack">
                  {infoPanel.cards?.filter(c => c.isActive !== false).map((card, idx) => {
                    const IconComp = ICON_MAP[card.icon] || MapPin;
                    return (
                      <div key={card._id || idx} className="contact-meta-card">
                        <div className="meta-icon-wrapper">
                          <IconComp size={22} className="meta-icon" />
                        </div>
                        <div className="meta-card-body">
                          <h3 className="meta-title">{card.title}</h3>
                          <p className="meta-text">{card.content}</p>
                          {card.subtext && <span className="meta-sub">{card.subtext}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="info-back-wrap">
                  <button
                    type="button"
                    className="btn-back-home"
                    onClick={() => {
                      if (navigate) navigate(infoPanel.backBtnUrl || '/');
                      else window.location.href = infoPanel.backBtnUrl || '/';
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>{infoPanel.backBtnText || 'Return to Home Overview'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* C. Right: Dynamic Contact Inquiry Form */}
            <div className="contact-form-panel">
              <ContactForm
                initialType={initialType}
                formSettings={formConfig}
                onBack={() => {
                  if (navigate) navigate('/');
                  else window.location.href = '/';
                }}
                onSubmitSuccess={onSubmitSuccess}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
