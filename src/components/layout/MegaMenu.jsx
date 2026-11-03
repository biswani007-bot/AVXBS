import React from 'react';
import { 
  Droplets, 
  Layers, 
  ShieldCheck, 
  Award, 
  ChevronRight, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

/**
 * AVXBS Samsung-Style Mega Menu Content & Layout
 * Organized strictly around actual residential and commercial solutions in AVXBS.
 */

export const RESIDENTIAL_MENU_DATA = {
  scope: 'Residential',
  badge: 'Residential Water Treatment',
  description: 'Advanced ion-exchange softening, filtration, and whole-home scale prevention engineered for luxury living.',
  columns: [
    {
      id: 'softening',
      title: 'Water Softening',
      icon: Droplets,
      items: [
        {
          name: 'Water Softener (System 06)',
          description: 'Automated ion-exchange unit with metered regeneration',
          productName: 'Water Softener',
          badge: 'Most Popular',
          type: 'inquiry'
        },
        {
          name: 'Whole-House Softener',
          description: 'High-capacity dual-tank continuous soft water system',
          productName: 'Whole-House Softener',
          type: 'inquiry'
        },
        {
          name: 'Compact Cabinet Softener',
          description: 'Space-saving integrated brine cabinet for modern homes',
          productName: 'Compact Cabinet Softener',
          type: 'inquiry'
        },
        {
          name: 'Bathroom Hard Water Softener',
          description: 'Point-of-entry protection for geysers, showers & fixtures',
          productName: 'Bathroom Softener',
          type: 'inquiry'
        }
      ]
    },
    {
      id: 'filtration',
      title: 'Filtration & Purity',
      icon: Layers,
      items: [
        {
          name: 'Whole-House Water Filter',
          description: 'Multi-media sediment, turbidity, and chlorine reduction',
          productName: 'Whole-House Filter',
          type: 'inquiry'
        },
        {
          name: 'Iron & Rust Removal Column',
          description: 'Catalytic media extraction for borewell & groundwater',
          productName: 'Iron Removal Filter',
          type: 'inquiry'
        },
        {
          name: 'Activated Carbon Filter',
          description: 'Removes volatile organics, foul odor, and unpleasant taste',
          productName: 'Activated Carbon Filter',
          type: 'inquiry'
        },
        {
          name: 'Sediment Pre-Filter Cartridge',
          description: 'High-flow sediment trapping for incoming municipal supply',
          productName: 'Sediment Pre-Filter',
          type: 'inquiry'
        }
      ]
    },
    {
      id: 'purification',
      title: 'Drinking Water & RO',
      icon: ShieldCheck,
      items: [
        {
          name: 'RO & UV Purifier Station',
          description: 'High-recovery reverse osmosis with germicidal UV sterilizer',
          productName: 'RO & UV Purifier',
          type: 'inquiry'
        },
        {
          name: 'Multi-Stage Alkaline Purifier',
          description: 'Mineral-balanced pure drinking water for healthy families',
          productName: 'Alkaline RO Purifier',
          type: 'inquiry'
        },
        {
          name: 'Under-Sink Drinking System',
          description: 'Dedicated high-purity kitchen tap water unit',
          productName: 'Under-Sink RO System',
          type: 'inquiry'
        },
        {
          name: 'Free Home Hardness Test',
          description: 'Book our certified water test kit and analysis',
          productName: 'Free Water Hardness Test',
          badge: 'Complimentary',
          type: 'inquiry'
        }
      ]
    }
  ],
  featured: {
    title: 'Featured: System 06 Softener',
    subtitle: '99.8% Scale Reduction • 50% Lower Salt Consumption',
    description: 'Intelligent microprocessor demand-initiated regeneration with premium food-grade uniform bead cation resins.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
    primaryCta: 'Inquire for Residential',
    secondaryCta: 'Explore Solutions',
    primaryProduct: 'Water Softener',
    secondaryPath: '/about'
  }
};

export const COMMERCIAL_MENU_DATA = {
  scope: 'Commercial',
  badge: 'Commercial & Industrial Platforms',
  description: 'Heavy-duty continuous ion-exchange softening, commercial RO plants, and custom industrial water engineering.',
  columns: [
    {
      id: 'comm-softening',
      title: 'Commercial Softening',
      icon: Layers,
      items: [
        {
          name: 'Commercial Duplex Softening Plant',
          description: '24/7 non-stop uninterrupted softened water supply',
          productName: 'Commercial Softening Plant',
          badge: 'Heavy Duty',
          type: 'inquiry'
        },
        {
          name: 'Triplex Industrial Softening Unit',
          description: 'High-throughput manifold for multi-facility operations',
          productName: 'Triplex Softening Unit',
          type: 'inquiry'
        },
        {
          name: 'Boiler Feed Water Softener',
          description: 'Zero-hardness feed protection for HVAC boilers & cooling towers',
          productName: 'Boiler Feed Softener',
          type: 'inquiry'
        },
        {
          name: 'Hospitality & Hotel Softener',
          description: 'Engineered scale prevention for laundry, kitchen & guest rooms',
          productName: 'Hotel Water Softener',
          type: 'inquiry'
        }
      ]
    },
    {
      id: 'comm-filtration',
      title: 'Commercial Filtration',
      icon: Droplets,
      items: [
        {
          name: 'Multi-Media Pressure Sand Filter',
          description: 'Graded silica bed for high-volume suspended solids removal',
          productName: 'Pressure Sand Filter',
          type: 'inquiry'
        },
        {
          name: 'Commercial Carbon Adsorption',
          description: 'Large-scale dechlorination and organic contaminant removal',
          productName: 'Commercial Carbon Filter',
          type: 'inquiry'
        },
        {
          name: 'Industrial Catalytic Iron Unit',
          description: 'Heavy borewell iron and manganese precipitation system',
          productName: 'Industrial Iron Filter',
          type: 'inquiry'
        },
        {
          name: 'Automatic Backwash Pre-Filter',
          description: 'Automated differential pressure flushing for main inlets',
          productName: 'Auto Backwash Filter',
          type: 'inquiry'
        }
      ]
    },
    {
      id: 'comm-ro',
      title: 'Commercial RO & DM',
      icon: Award,
      items: [
        {
          name: 'Commercial RO Plant (500-50,000 LPH)',
          description: 'High-recovery semi-permeable spiral wound membrane system',
          productName: 'Commercial RO Plant',
          type: 'inquiry'
        },
        {
          name: 'Industrial Demineralizer (DM)',
          description: 'Two-bed & mixed-bed ion exchange for ultra-low conductivity',
          productName: 'DM Plant',
          type: 'inquiry'
        },
        {
          name: 'Ultrafiltration & UV Skids',
          description: 'Physical barrier filtration with 0.02-micron hollow fiber membranes',
          productName: 'UF & UV Skid',
          type: 'inquiry'
        },
        {
          name: 'Site Hardness & Flow Audit',
          description: 'Schedule certified on-site commercial engineering survey',
          productName: 'Commercial Site Hardness Audit',
          badge: 'On-Site',
          type: 'inquiry'
        }
      ]
    }
  ],
  featured: {
    title: 'Featured: Duplex Softening Plant',
    subtitle: 'Zero Downtime • Automated Valve Manifold',
    description: 'Engineered for hotels, hospitals, food processing, and industrial boiler feed requiring continuous softened output.',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=80',
    primaryCta: 'Request Commercial Audit',
    secondaryCta: 'Contact Engineering',
    primaryProduct: 'Commercial Softening Plant',
    secondaryPath: '/contact'
  }
};

/**
 * MegaMenu Component
 */
export default function MegaMenu({ 
  activeMenu, 
  onClose, 
  onSelectType, 
  onOpenInquiry, 
  navigate 
}) {
  if (!activeMenu) return null;

  const data = activeMenu === 'residential' ? RESIDENTIAL_MENU_DATA : COMMERCIAL_MENU_DATA;

  const handleItemClick = (item) => {
    onClose();
    if (onSelectType) {
      onSelectType(data.scope);
    }
    if (item.type === 'inquiry' && onOpenInquiry) {
      onOpenInquiry(item.productName || item.name);
    } else if (item.path && navigate) {
      navigate(item.path);
    }
  };

  const handlePrimaryFeaturedClick = () => {
    onClose();
    if (onSelectType) {
      onSelectType(data.scope);
    }
    if (onOpenInquiry) {
      onOpenInquiry(data.featured.primaryProduct);
    }
  };

  const handleSecondaryFeaturedClick = () => {
    onClose();
    if (navigate) {
      navigate(data.featured.secondaryPath);
    }
  };

  return (
    <div 
      className={`mega-menu-panel-wrapper ${activeMenu ? 'is-visible' : ''}`}
      role="region"
      aria-label={`${data.scope} Mega Menu`}
    >
      <div className="mega-menu-inner-container">
        {/* Top Scope Header Banner */}
        <div className="mega-menu-header-bar">
          <div className="mega-menu-header-left">
            <span className={`scope-badge scope-${data.scope.toLowerCase()}`}>
              {data.badge}
            </span>
            <p className="scope-tagline">{data.description}</p>
          </div>
          <div className="mega-menu-header-right">
            <button 
              type="button" 
              className="quick-inquire-link"
              onClick={handlePrimaryFeaturedClick}
            >
              <PhoneCall size={14} />
              <span>Direct Solution Inquiry</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Multi-Column Grid Layout */}
        <div className="mega-menu-grid">
          {/* 3 Solution Columns */}
          {data.columns.map((col) => {
            const IconComp = col.icon;
            return (
              <div key={col.id} className="mega-menu-col">
                <div className="col-header">
                  <div className="col-icon-wrap">
                    <IconComp size={18} className="col-icon" />
                  </div>
                  <h4 className="col-title">{col.title}</h4>
                </div>
                <ul className="col-items-list">
                  {col.items.map((item, idx) => (
                    <li key={idx} className="col-item-entry">
                      <button
                        type="button"
                        className="col-item-btn"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="item-text-group">
                          <span className="item-name">
                            {item.name}
                            {item.badge && (
                              <span className="item-badge">{item.badge}</span>
                            )}
                          </span>
                          <span className="item-desc">{item.description}</span>
                        </div>
                        <ChevronRight size={14} className="item-arrow" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* 4th Column: Featured Samsung-Style Solution Card */}
          <div className="mega-menu-col col-featured">
            <div className="featured-solution-card">
              <div className="featured-image-wrap">
                <img 
                  src={data.featured.image} 
                  alt={data.featured.title} 
                  className="featured-image"
                  loading="lazy"
                />
                <span className="featured-tag">
                  <Sparkles size={12} />
                  <span>Featured Solution</span>
                </span>
              </div>
              <div className="featured-card-body">
                <h5 className="featured-title">{data.featured.title}</h5>
                <p className="featured-subtitle">{data.featured.subtitle}</p>
                <p className="featured-desc">{data.featured.description}</p>
                <div className="featured-card-actions">
                  <button
                    type="button"
                    className="featured-btn-primary"
                    onClick={handlePrimaryFeaturedClick}
                  >
                    <span>{data.featured.primaryCta}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    className="featured-btn-secondary"
                    onClick={handleSecondaryFeaturedClick}
                  >
                    <span>{data.featured.secondaryCta}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Navigation & Assurance Bar */}
        <div className="mega-menu-bottom-bar">
          <div className="assurance-pills">
            <span className="assurance-pill">
              <CheckCircle2 size={14} className="check-icon" />
              <span>Certified Hardness Testing</span>
            </span>
            <span className="assurance-pill">
              <CheckCircle2 size={14} className="check-icon" />
              <span>Custom Engineering Sizing</span>
            </span>
            <span className="assurance-pill">
              <CheckCircle2 size={14} className="check-icon" />
              <span>Dedicated Installation AMC</span>
            </span>
          </div>
          <div className="bottom-links">
            <button 
              type="button" 
              className="bottom-nav-link"
              onClick={() => { onClose(); navigate && navigate('/about'); }}
            >
              <span>About AVXBS Platforms</span>
              <ArrowRight size={13} />
            </button>
            <button 
              type="button" 
              className="bottom-nav-link"
              onClick={() => { onClose(); navigate && navigate('/contact'); }}
            >
              <span>Contact Specialists</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

