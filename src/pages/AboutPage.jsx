import React from 'react';
import { 
  ShieldCheck, 
  Droplets, 
  Award, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Workflow
} from 'lucide-react';

/**
 * About Us Page for AVXBS
 * Features:
 * - Company Introduction
 * - Company Overview & Core Pillars
 * - Mission & Vision
 * - Water Treatment Solutions Overview
 * - Call to action to connect with engineering
 */
export default function AboutPage({ navigate }) {
  return (
    <div className="page-view-container about-page">
      {/* Hero Banner */}
      <section className="about-hero-section">
        <div className="about-hero-content">
          <h1 className="about-page-title">
            About <span className="highlight-text">AVXBS</span>
          </h1>
          <p className="about-hero-subtitle">
            Delivering advanced water treatment, ion-exchange softening, and purification platforms
            engineered for uncompromising purity in residential and commercial infrastructures.
          </p>
        </div>
      </section>

      {/* Company Overview & Intro */}
      <section className="about-section overview-section">
        <div className="section-container">
          <div className="overview-grid">
            <div className="overview-text-col">
              <h2 className="section-heading">Company Introduction & Overview</h2>
              <p className="lead-paragraph">
                <strong>AVXBS</strong> is an advanced water treatment and softening solutions engineering platform,
                delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems
                for residential and commercial infrastructures.
              </p>
              <p className="body-paragraph">
                Water hardness causes persistent scale deposition, plumbing deterioration, reduced thermal efficiency
                in water heaters, and premature appliance failure. At AVXBS, we merge precision chemical engineering
                with intelligent automated flow sensing to eliminate calcium and magnesium hardness at the point of entry.
              </p>
              <p className="body-paragraph">
                From luxury residences and high-rise apartments to industrial boiler feeds and commercial hospitality
                complexes, our engineered solutions protect equipment, elevate water quality, and optimize resource efficiency.
              </p>
              
              <div className="highlights-row">
                <div className="highlight-item">
                  <span className="highlight-value">99.8%</span>
                  <span className="highlight-label">Scale Reduction</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-value">50%</span>
                  <span className="highlight-label">Lower Salt Consumption</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-value">100%</span>
                  <span className="highlight-label">Food-Grade Resins</span>
                </div>
              </div>
            </div>

            <div className="overview-card-col">
              <div className="engineering-card">
                <div className="card-top-icon">
                  <Cpu size={32} className="accent-icon" />
                </div>
                <h3 className="card-title">Engineered Purity at Scale</h3>
                <ul className="pillars-list">
                  <li>
                    <CheckCircle2 size={18} className="check-icon" />
                    <span><strong>High-Capacity Ion Exchange:</strong> Premium uniform-bead cation resins for maximum divalent ion capture.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="check-icon" />
                    <span><strong>Demand-Initiated Regeneration:</strong> Smart microprocessor valves that regenerate solely on metered volume.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="check-icon" />
                    <span><strong>Anti-Corrosive Architecture:</strong> Fiber-reinforced polymer tanks resistant to hydraulic pressures.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={18} className="check-icon" />
                    <span><strong>End-to-End Technical AMC:</strong> Professional hardness testing, periodic servicing, and performance validation.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section mission-vision-section">
        <div className="section-container">
          <div className="cards-two-col">
            <div className="mv-card mission-card">
              <div className="mv-icon-wrap">
                <Workflow size={28} />
              </div>
              <h3 className="mv-card-title">Our Mission</h3>
              <p className="mv-card-text">
                To engineer pure, scale-free water for homes and enterprises, protecting plumbing
                infrastructure and optimizing energy efficiency through intelligent, eco-conscious
                water treatment technology.
              </p>
            </div>

            <div className="mv-card vision-card">
              <div className="mv-icon-wrap">
                <TrendingUp size={28} />
              </div>
              <h3 className="mv-card-title">Our Vision</h3>
              <p className="mv-card-text">
                To become the industry benchmark in next-generation water softening and purification
                solutions, integrating smart automated controls, high-capacity ion exchange, and
                zero-compromise environmental stewardship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Water Treatment Solutions */}
      <section className="about-section solutions-overview-section">
        <div className="section-container">
          <div className="section-header-centered">
            <h2 className="section-heading">Water Treatment Solutions</h2>
            <p className="section-subheading">
              Comprehensive water engineering platforms built for residential luxury and commercial performance.
            </p>
          </div>

          <div className="solutions-cards-grid">
            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Droplets size={24} />
              </div>
              <h4 className="sol-card-title">Whole-House Water Softeners</h4>
              <p className="sol-card-desc">
                High-efficiency automated softening systems engineered to eliminate hard calcium and magnesium minerals,
                preventing limescale accumulation, extending appliance longevity, and providing silky soft water.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Layers size={24} />
              </div>
              <h4 className="sol-card-title">Commercial Softening Plants</h4>
              <p className="sol-card-desc">
                Heavy-duty duplex and triplex ion-exchange softening plants engineered for hotels, hospitals,
                manufacturing facilities, and HVAC boiler feed requiring continuous non-stop softened output.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <ShieldCheck size={24} />
              </div>
              <h4 className="sol-card-title">Iron & Turbidity Removal</h4>
              <p className="sol-card-desc">
                Advanced catalytic and multi-media filtration columns that extract dissolved iron, rust stains,
                suspended solids, and particulate matter from borewell and groundwater sources.
              </p>
            </div>

            <div className="solution-feature-card">
              <div className="sol-icon-box">
                <Award size={24} />
              </div>
              <h4 className="sol-card-title">Reverse Osmosis & UV Disinfection</h4>
              <p className="sol-card-desc">
                High-recovery semi-permeable membrane filtration paired with germicidal ultraviolet sterilization
                to neutralize microbiological contaminants and deliver purified drinking standards.
              </p>
            </div>
          </div>

          {/* Bottom CTA Box */}
          <div className="about-cta-card">
            <div className="cta-text-side">
              <h3 className="cta-heading">Ready to protect your water infrastructure?</h3>
              <p className="cta-subtext">
                Speak directly with an AVXBS water treatment specialist to assess your water hardness and specify the optimal system.
              </p>
            </div>
            <div className="cta-actions">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => navigate('/contact')}
              >
                <span>Contact Engineering</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => navigate('/')}
              >
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

