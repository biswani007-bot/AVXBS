import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AVXBSLogo from './AVXBSLogo';
import { fetchFooterConfig, fetchMegaMenu } from '../../services/api';

// Crisp SVG brand icons for the bottom footer social bar
function FacebookIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function InstagramIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YouTubeIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function LinkedInIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

/**
 * Standard Default Footer Directory Fallback (Samsung Website Benchmark Architecture)
 */
const DEFAULT_FOOTER_DATA = {
  companyInfo: {
    tagline: 'Engineering Pure Water for Homes & Enterprises',
    description:
      'AVXBS is an advanced water treatment and softening solutions engineering platform, delivering state-of-the-art ion-exchange softeners, filtration, and water purification systems for residential and commercial infrastructures.',
    headquarters: '[Official Company Address - To Be Provided]',
    helpline: '[Toll-Free / Support Phone - To Be Provided]',
    email: '[Official Support Email - To Be Provided]',
    badgeText: 'Engineering Pure Water for Homes & Enterprises',
    regionText: 'India | English',
    copyrightText: '© 2026 AVXBS Solutions. All Rights Reserved.',
  },
  columns: [
    {
      title: 'Residential',
      sectionKey: 'residential',
      order: 1,
      isActive: true,
      links: [
        { label: 'Water Softener', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'WTP Filtration', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'Plumbing Solutions', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'Modular Kitchen Purifiers', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'Sanitary & Bath Fittings', url: '#water-softener-inquiry-section', isExternal: false },
      ],
    },
    {
      title: 'Commercial',
      sectionKey: 'commercial',
      order: 2,
      isActive: true,
      links: [
        { label: 'Commercial Softener Plants', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'Industrial WTP', url: '#water-softener-inquiry-section', isExternal: false },
        { label: 'Sanitary & Commercial Bath', url: '#water-softener-inquiry-section', isExternal: false },
      ],
    },
    {
      title: 'Support',
      sectionKey: 'support',
      order: 3,
      isActive: true,
      links: [
        { label: 'Contact Us', url: '/contact', isExternal: false },
        { label: 'Customer Support', url: '#support', isExternal: false },
        { label: 'FAQs', url: '#faqs', isExternal: false },
        { label: 'Warranty & Service Policy', url: '#warranty', isExternal: false },
        { label: 'Privacy Policy', url: '#privacy', isExternal: false },
        { label: 'Terms of Service', url: '#terms', isExternal: false },
      ],
    },
    {
      title: 'Company',
      sectionKey: 'company',
      order: 4,
      isActive: true,
      links: [
        { label: 'About AVXBS', url: '/about', isExternal: false },
        { label: 'Our Services', url: '#services', isExternal: false },
        { label: 'Company Information', url: '#company-info', isExternal: false },
        { label: 'Careers', url: '#careers', isExternal: false },
      ],
    },
  ],
};

// Verified Bottom Footer Navigation Links
const BOTTOM_LEGAL_LINKS = [
  { label: 'Privacy Policy', url: '#privacy' },
  { label: 'Terms of Service', url: '#terms' },
  { label: 'Warranty & Service Policy', url: '#warranty' },
];

// Verified Social Media Icons Mapping
const SOCIAL_ICON_COMPONENTS = {
  Facebook: FacebookIcon,
  X: XIcon,
  'X (Twitter)': XIcon,
  Twitter: XIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
  LinkedIn: LinkedInIcon,
  WhatsApp: WhatsAppIcon,
};

const DEFAULT_SOCIAL_LIST = [
  { platform: 'LinkedIn', url: '#social-linkedin-placeholder', label: 'LinkedIn', isActive: true },
  { platform: 'Instagram', url: '#social-instagram-placeholder', label: 'Instagram', isActive: true },
  { platform: 'YouTube', url: '#social-youtube-placeholder', label: 'YouTube', isActive: true },
  { platform: 'X (Twitter)', url: '#social-twitter-placeholder', label: 'X (Twitter)', isActive: true },
];

/**
 * Premium Full-Width Multi-Column Corporate Footer with Samsung-Style Bottom Bar
 */
export default function Footer() {
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER_DATA);
  const [openMobileCols, setOpenMobileCols] = useState({});

  useEffect(() => {
    let isMounted = true;

    // Fetch footer configuration directly from MongoDB API as the single source of truth
    fetchFooterConfig()
      .then((footerRes) => {
        if (!isMounted) return;

        if (footerRes && Array.isArray(footerRes.columns) && footerRes.columns.length > 0) {
          setFooterData(footerRes);
        } else {
          setFooterData(DEFAULT_FOOTER_DATA);
        }
      })
      .catch((err) => {
        console.warn('[Footer] Load error, using default:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleMobileCol = (index) => {
    setOpenMobileCols((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const { companyInfo, columns, socialLinks, legalLinks } = footerData;
  const activeColumns = (columns && columns.length > 0 ? columns : DEFAULT_FOOTER_DATA.columns)
    ?.filter((col) => col.isActive !== false) || [];

  const activeLegalLinks = (legalLinks && legalLinks.length > 0 ? legalLinks : BOTTOM_LEGAL_LINKS)
    ?.filter((l) => l.isActive !== false);

  const activeSocialLinks = (socialLinks && socialLinks.length > 0 ? socialLinks : DEFAULT_SOCIAL_LIST)
    ?.filter((s) => s.isActive !== false);

  return (
    <footer className="site-footer">
      {/* Section A – Company Introduction */}
      <div className="footer-section footer-section-intro">
        <div className="footer-inner-container">
          <div className="footer-brand-section">
            <div className="footer-brand-left">
              <div className="footer-logo-wrap">
                <AVXBSLogo className="footer-logo-img" animated={true} />
              </div>
              <p className="footer-company-desc">
                {companyInfo?.description || DEFAULT_FOOTER_DATA.companyInfo.description}
              </p>
            </div>
            <div className="footer-brand-right">
              <div className="partner-tag">
                {companyInfo?.badgeText || companyInfo?.tagline || DEFAULT_FOOTER_DATA.companyInfo.badgeText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section B – Navigation Columns (with full-height vertical dividers) */}
      <div className="footer-section footer-section-nav">
        <div className="footer-inner-container">
          <div
            className="footer-nav-grid footer-directory-grid"
            style={{ '--footer-col-count': activeColumns.length }}
          >
            {activeColumns.map((col, idx) => (
              <div key={col._id || idx} className="footer-dir-col">
                {/* Desktop Column Header */}
                <h4 className="footer-col-title desktop-only-title">{col.title}</h4>

                {/* Mobile Collapsible Header */}
                <button
                  type="button"
                  className="footer-mobile-col-btn mobile-only-toggle"
                  onClick={() => toggleMobileCol(idx)}
                  aria-expanded={!!openMobileCols[idx]}
                >
                  <span>{col.title}</span>
                  {openMobileCols[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Links List */}
                <ul className={`footer-links-list ${openMobileCols[idx] ? 'is-expanded' : ''}`}>
                  {col.links?.filter((l) => l.isActive !== false).map((link, lIdx) => (
                    <li key={link._id || lIdx} className="footer-link-item">
                      <a
                        href={link.url}
                        className="footer-nav-link"
                        target={link.isExternal || (link.url && link.url.startsWith('http')) ? '_blank' : '_self'}
                        rel={link.isExternal || (link.url && link.url.startsWith('http')) ? 'noopener noreferrer' : undefined}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section C – Copyright and Legal Information */}
      <div className="footer-section footer-section-legal">
        <div className="footer-inner-container">
          <div className="footer-legal-content">
            <p className="footer-copyright-statement">
              {companyInfo?.copyrightText || DEFAULT_FOOTER_DATA.companyInfo.copyrightText}
            </p>
            <p className="footer-legal-disclaimer">
              AVXBS is committed to delivering advanced water treatment and softening solutions engineered for residential and commercial infrastructures. Please dispose of filtration consumables and water treatment systems responsibly in accordance with local environmental regulations. For service guidelines and compliance frameworks, please review our{' '}
              <a href="#warranty" className="footer-legal-inline-link">Warranty &amp; Service Policy</a> or{' '}
              <a href="#privacy" className="footer-legal-inline-link">Privacy Policy</a>.
            </p>
            {companyInfo?.headquarters && !companyInfo.headquarters.includes('[Official') && (
              <p className="footer-corporate-info">
                <span>Registered Office: {companyInfo.headquarters}</span>
                {companyInfo?.helpline && !companyInfo.helpline.includes('[Toll-Free') && (
                  <span> &bull; Helpline: {companyInfo.helpline}</span>
                )}
                {companyInfo?.email && !companyInfo.email.includes('[Official') && (
                  <span> &bull; Email: {companyInfo.email}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section D – Bottom Footer Bar */}
      <div className="footer-section footer-section-bottom footer-bottom-bar-wrapper">
        <div className="footer-inner-container">
          <div className="footer-bottom-bar-inner">
            {/* Left side: Country/language selector and legal links */}
            <div className="footer-bottom-left">
              <button type="button" className="footer-locale-btn" aria-label="Select Region and Language">
                <span>{companyInfo?.regionText || 'India / English'}</span>
              </button>
              <span className="footer-bar-vdivider" aria-hidden="true">|</span>
              <nav className="footer-bottom-nav" aria-label="Footer Legal Links">
                {activeLegalLinks.map((item, idx) => (
                  <React.Fragment key={item._id || idx}>
                    {idx > 0 && <span className="footer-bar-vdivider" aria-hidden="true">|</span>}
                    <a href={item.url} className="footer-bottom-nav-link">
                      {item.label}
                    </a>
                  </React.Fragment>
                ))}
              </nav>
            </div>

            {/* Right side: Stay in the Loop? and social media icons */}
            <div className="footer-bottom-right">
              <span className="stay-in-loop-text">Stay in the Loop?</span>
              <div className="footer-bottom-social-icons">
                {activeSocialLinks.map((social, idx) => {
                  const IconComponent =
                    SOCIAL_ICON_COMPONENTS[social.platform] ||
                    SOCIAL_ICON_COMPONENTS['LinkedIn'] ||
                    FacebookIcon;
                  return (
                    <a
                      key={social._id || idx}
                      href={social.url}
                      className="footer-social-icon-btn"
                      aria-label={`${social.platform} - AVXBS Official`}
                      title={social.platform}
                      target={social.url && social.url.startsWith('http') ? '_blank' : '_self'}
                      rel={social.url && social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <IconComponent size={18} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
