import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react';
import AVXBSLogo from './AVXBSLogo';

/**
 * Structured Enterprise Footer
 * Inspired by Samsung's 5-column directory layout, customized for AVXBS Water Treatment.
 * As strictly instructed, unverified contact info and social links use clearly identified placeholders.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main-container">
        {/* Top Directory Grid (3 Columns) */}
        <div className="footer-columns-grid">
          {/* Column 1: Company & Brand Identity */}
          <div className="footer-col col-brand">
            <div className="footer-logo-wrap">
              <AVXBSLogo className="footer-logo-img" animated={true} />
            </div>
            <p className="footer-company-desc">
              AVXBS is an advanced water treatment and softening solutions engineering platform,
              delivering state-of-the-art ion-exchange softeners, filtration, and water purification
              systems for residential and commercial infrastructures.
            </p>
            <div className="partner-tag">
              Engineering Pure Water for Homes & Enterprises
            </div>
          </div>

          {/* Column 2: Verified Contact Information (With Required Placeholders) */}
          <div className="footer-col col-contact">
            <h4 className="footer-col-title">Contact & Support</h4>
            <p className="footer-note-sub">
              <em>Note: Official contact credentials pending user confirmation.</em>
            </p>
            <ul className="footer-contact-list">
              <li className="contact-item">
                <MapPin className="contact-icon" size={18} />
                <span>
                  <strong>Headquarters:</strong><br />
                  [Official Company Address - To Be Provided]
                </span>
              </li>
              <li className="contact-item">
                <Phone className="contact-icon" size={18} />
                <span>
                  <strong>Helpline:</strong><br />
                  [Toll-Free / Support Phone - To Be Provided]
                </span>
              </li>
              <li className="contact-item">
                <Mail className="contact-icon" size={18} />
                <span>
                  <strong>Email:</strong><br />
                  [Official Support Email - To Be Provided]
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Social Channels & Compliance */}
          <div className="footer-col col-social">
            <h4 className="footer-col-title">Stay Connected</h4>
            <p className="footer-note-sub">Official Social Profiles:</p>
            <div className="footer-social-row">
              <a
                href="#social-linkedin-placeholder"
                className="social-btn"
                aria-label="LinkedIn [Placeholder Link - Pending Confirmation]"
              >
                LinkedIn
              </a>
              <a
                href="#social-twitter-placeholder"
                className="social-btn"
                aria-label="Twitter / X [Placeholder Link - Pending Confirmation]"
              >
                X (Twitter)
              </a>
              <a
                href="#social-instagram-placeholder"
                className="social-btn"
                aria-label="Instagram [Placeholder Link - Pending Confirmation]"
              >
                Instagram
              </a>
              <a
                href="#social-youtube-placeholder"
                className="social-btn"
                aria-label="YouTube [Placeholder Link - Pending Confirmation]"
              >
                YouTube
              </a>
            </div>
            <div className="regional-badge">
              <Globe size={16} />
              <span>India | English</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal & Disclaimers */}
        <div className="footer-bottom-bar">
          <div className="legal-links">
            <span>© {currentYear} AVXBS Solutions. All Rights Reserved.</span>
            <span className="dot">•</span>
            <a href="#privacy">Privacy Policy</a>
            <span className="dot">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="dot">•</span>
            <a href="#warranty">Warranty & Service Policy</a>
          </div>
          <div className="prototype-disclaimer">
            <span>Prototype Version 1.0.0 — Designed for AVXBS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
