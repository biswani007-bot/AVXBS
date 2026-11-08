import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Droplets, 
  Award, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Workflow,
  Sparkles
} from 'lucide-react';
import { fetchAboutConfig } from '../services/api';

// Icon component lookup map
const ICON_MAP = {
  Workflow: Workflow,
  TrendingUp: TrendingUp,
  Droplets: Droplets,
  Layers: Layers,
  ShieldCheck: ShieldCheck,
  Award: Award,
  Sparkles: Sparkles,
  CheckCircle2: CheckCircle2,
};

const DEFAULT_ABOUT_DATA = {
  header: {
    pageTitle: 'About',
    highlightWord: 'AVXBS',
    subtitle: 'Delivering advanced unique solutions for residential and commercial infrastructures.',
    titleColor: '#545454',
    highlightColor: '#545454',
    alignment: 'center',
    isEnabled: true,
  },
  intro: {
    sectionHeading: 'Company Introduction & Overview',
    leadParagraph: 'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
    additionalParagraphs: [
      'Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.',
      'From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.',
    ],
    image: '/images/about/about-water-treatment.jpg',
    imageAlt: 'AVXBS Advanced Industrial Water Treatment & Purification Engineering Facility',
    metrics: [
      { value: '99.8%', label: 'Scale Reduction', isActive: true },
      { value: '50%', label: 'Lower Salt Consumption', isActive: true },
      { value: '100%', label: 'Food-Grade Resins', isActive: true },
    ],
    isEnabled: true,
  },
  missionVision: {
    sectionHeading: 'Our Core Purpose',
    cards: [
      {
        title: 'Our Mission',
        description: 'To engineer pure, scale-free water for homes and enterprises, protecting plumbing infrastructure and optimizing energy efficiency through intelligent, eco-conscious water treatment technology.',
        icon: 'Workflow',
        isActive: true,
      },
      {
        title: 'Our Vision',
        description: 'To become the industry benchmark in next-generation water softening and purification solutions, integrating smart automated controls, high-capacity ion exchange, and zero-compromise environmental stewardship.',
        icon: 'TrendingUp',
        isActive: true,
      },
    ],
    isEnabled: true,
  },
  solutions: {
    sectionHeading: 'Water Treatment Solutions',
    sectionSubheading: 'Comprehensive water engineering platforms built for residential luxury and commercial performance.',
    cards: [
      {
        title: 'Whole-House Water Softeners',
        description: 'High-efficiency automated softening systems engineered to eliminate hard calcium and magnesium minerals, preventing limescale accumulation, extending appliance longevity, and providing silky soft water.',
        icon: 'Droplets',
        isActive: true,
      },
      {
        title: 'Commercial Softening Plants',
        description: 'Heavy-duty duplex and triplex ion-exchange softening plants engineered for hotels, hospitals, manufacturing facilities, and HVAC boiler feed requiring continuous non-stop softened output.',
        icon: 'Layers',
        isActive: true,
      },
      {
        title: 'Iron & Turbidity Removal',
        description: 'Advanced catalytic and multi-media filtration columns that extract dissolved iron, rust stains, suspended solids, and particulate matter from borewell and groundwater sources.',
        icon: 'ShieldCheck',
        isActive: true,
      },
      {
        title: 'Reverse Osmosis & UV Disinfection',
        description: 'High-recovery semi-permeable membrane filtration paired with germicidal ultraviolet sterilization to neutralize microbiological contaminants and deliver purified drinking standards.',
        icon: 'Award',
        isActive: true,
      },
    ],
    isEnabled: true,
  },
  bottomCta: {
    heading: 'Ready to protect your water infrastructure?',
    description: 'Speak directly with an AVXBS water treatment specialist to assess your water hardness and specify the optimal system.',
    primaryBtnText: 'Contact Engineering',
    primaryBtnUrl: '/contact',
    secondaryBtnText: 'Return to Home',
    secondaryBtnUrl: '/',
    isEnabled: true,
  },
};

/**
 * Dynamic About Us Page for AVXBS
 */
export default function AboutPage({ navigate }) {
  const [data, setData] = useState(DEFAULT_ABOUT_DATA);

  useEffect(() => {
    let isMounted = true;
    fetchAboutConfig().then((config) => {
      if (isMounted && config) {
        setData(config);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const { header, intro, missionVision, solutions, bottomCta } = data;

  return (
    <div className="page-view-container about-page">
      {/* A. Hero Banner */}
      {header?.isEnabled !== false && (
        <section className="about-hero-section">
          <div className="about-hero-content" style={{ textAlign: header.alignment || 'center' }}>
            <h1 className="about-page-title">
              {header.pageTitle}{' '}
              <span className="highlight-text">
                {header.highlightWord}
              </span>
            </h1>
            <div className="heading-brand-accent-line" aria-hidden="true" />
            <p className="about-hero-subtitle">
              {header.subtitle}
            </p>
          </div>
        </section>
      )}

      {/* B. Company Overview & Intro */}
      {intro?.isEnabled !== false && (
        <section className="about-section overview-section">
          <div className="section-container">
            <div className="overview-grid">
              <div className="overview-text-col">
                <h2 className="section-heading">{intro.sectionHeading}</h2>
                <p className="lead-paragraph">
                  {intro.leadParagraph}
                </p>
                {intro.additionalParagraphs?.map((para, pIdx) => (
                  <p key={pIdx} className="body-paragraph">
                    {para}
                  </p>
                ))}
                
                {intro.metrics && intro.metrics.length > 0 && (
                  <div className="highlights-row">
                    {intro.metrics.filter(m => m.isActive !== false).map((m, mIdx) => (
                      <div key={m._id || mIdx} className="highlight-item">
                        <span className="highlight-value">{m.value}</span>
                        <span className="highlight-label">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Showcase Image */}
              <div className="overview-card-col">
                <div className="about-overview-image-wrapper">
                  <img 
                    src={intro.image || '/images/about/about-water-treatment.jpg'} 
                    alt={intro.imageAlt || 'AVXBS Advanced Water Treatment Facility'} 
                    className="about-overview-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/about-water-treatment.jpg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* C. Mission & Vision */}
      {missionVision?.isEnabled !== false && (
        <section className="about-section mission-vision-section">
          <div className="section-container">
            <div className="cards-two-col">
              {missionVision.cards?.filter(c => c.isActive !== false).map((card, idx) => {
                const IconComp = ICON_MAP[card.icon] || Workflow;
                return (
                  <div key={card._id || idx} className="mv-card mission-card">
                    <div className="mv-icon-wrap">
                      <IconComp size={28} />
                    </div>
                    <h3 className="mv-card-title">{card.title}</h3>
                    <p className="mv-card-text">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* D. Water Treatment Solutions */}
      {solutions?.isEnabled !== false && (
        <section className="about-section solutions-overview-section">
          <div className="section-container">
            <div className="section-header-centered">
              <h2 className="section-heading">{solutions.sectionHeading}</h2>
              <p className="section-subheading">
                {solutions.sectionSubheading}
              </p>
            </div>

            <div className="solutions-cards-grid">
              {solutions.cards?.filter(c => c.isActive !== false).map((card, idx) => {
                const IconComp = ICON_MAP[card.icon] || Droplets;
                return (
                  <div key={card._id || idx} className="solution-feature-card">
                    <div className="sol-icon-box">
                      <IconComp size={24} />
                    </div>
                    <h4 className="sol-card-title">{card.title}</h4>
                    <p className="sol-card-desc">{card.description}</p>
                  </div>
                );
              })}
            </div>

            {/* E. Bottom CTA Box */}
            {bottomCta?.isEnabled !== false && (
              <div 
                className="about-cta-card"
                style={{
                  backgroundColor: bottomCta.backgroundColor || '#0d1527',
                  color: bottomCta.textColor || '#f8fafc'
                }}
              >
                <div className="cta-text-side">
                  <h3 className="cta-heading" style={{ color: bottomCta.textColor || '#f8fafc' }}>
                    {bottomCta.heading}
                  </h3>
                  <p className="cta-subtext">
                    {bottomCta.description}
                  </p>
                </div>
                <div className="cta-actions">
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => {
                      if (navigate) navigate(bottomCta.primaryBtnUrl || '/contact');
                      else window.location.href = bottomCta.primaryBtnUrl || '/contact';
                    }}
                  >
                    <span>{bottomCta.primaryBtnText}</span>
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    onClick={() => {
                      if (navigate) navigate(bottomCta.secondaryBtnUrl || '/');
                      else window.location.href = bottomCta.secondaryBtnUrl || '/';
                    }}
                  >
                    <span>{bottomCta.secondaryBtnText}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
