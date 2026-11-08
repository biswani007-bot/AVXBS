import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowRight, 
  Droplets,
  ShieldCheck,
  Workflow,
  Sparkles,
  Bath,
  Layers,
  Factory,
  Filter,
  Cpu,
  Wrench,
  Settings
} from 'lucide-react';
import { fetchMegaMenu, resolveMediaUrl, invalidateMegaMenuCache } from '../../services/api';

/**
 * Exact Samsung-Style Full-Width Mega Menu for AVXBS
 * - Section 1 (LEFT): Highlights Image Section (Dynamic API-Driven, Single Source of Truth)
 * - Subtle Vertical Divider
 * - Section 2 (RIGHT): Solution Cards Grid
 */

// Icon resolver helper for dynamic solution cards
const renderSolutionIcon = (iconName) => {
  const iconProps = { size: 20, className: 'samsung-solution-icon' };
  switch (iconName) {
    case 'ShieldCheck':
      return <ShieldCheck {...iconProps} />;
    case 'Workflow':
      return <Workflow {...iconProps} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    case 'Bath':
      return <Bath {...iconProps} />;
    case 'Layers':
      return <Layers {...iconProps} />;
    case 'Factory':
      return <Factory {...iconProps} />;
    case 'Filter':
      return <Filter {...iconProps} />;
    case 'Cpu':
      return <Cpu {...iconProps} />;
    case 'Wrench':
      return <Wrench {...iconProps} />;
    case 'Settings':
      return <Settings {...iconProps} />;
    case 'Droplets':
    default:
      return <Droplets {...iconProps} />;
  }
};

const DEFAULT_SOLUTIONS = {
  residential: [
    {
      id: 'res-sol-1',
      title: 'Water Softener',
      description: 'Automated ion-exchange unit with metered regeneration and mineral retention.',
      icon: 'Droplets',
      order: 1,
      isActive: true,
    },
    {
      id: 'res-sol-2',
      title: 'Whole House Filtration (WTP)',
      description: 'Multi-stage sediment and carbon filtration for complete home water purity.',
      icon: 'Filter',
      order: 2,
      isActive: true,
    },
    {
      id: 'res-sol-3',
      title: 'Plumbing Solutions',
      description: 'Anti-scaling pipe protection, pressure management and balanced flow.',
      icon: 'Wrench',
      order: 3,
      isActive: true,
    },
    {
      id: 'res-sol-4',
      title: 'Modular Kitchen Purifiers',
      description: 'Under-sink reverse osmosis with alkaline remineralization & UV safety.',
      icon: 'Sparkles',
      order: 4,
      isActive: true,
    },
    {
      id: 'res-sol-5',
      title: 'Sanitary & Bath Fittings',
      description: 'Scale-free showerheads, concealed valves and bathroom fittings protection.',
      icon: 'Bath',
      order: 5,
      isActive: true,
    },
  ],
  commercial: [
    {
      id: 'comm-sol-1',
      title: 'Commercial Softener Plants',
      description: 'Duplex continuous ion-exchange softening towers for high-demand facilities.',
      icon: 'Factory',
      order: 1,
      isActive: true,
    },
    {
      id: 'comm-sol-2',
      title: 'Industrial Water Treatment (WTP)',
      description: 'Custom engineered raw water clarification, filtration and turbidity removal.',
      icon: 'Filter',
      order: 2,
      isActive: true,
    },
    {
      id: 'comm-sol-3',
      title: 'Commercial RO & DM Systems',
      description: 'Skid-mounted reverse osmosis and demineralization plants for manufacturing.',
      icon: 'Cpu',
      order: 3,
      isActive: true,
    },
    {
      id: 'comm-sol-4',
      title: 'Sanitary & Commercial Bath',
      description: 'Heavy-duty scale prevention for hotels, hospitals, gyms and commercial kitchens.',
      icon: 'Bath',
      order: 4,
      isActive: true,
    },
  ],
};

export default function SamsungMegaMenu({
  isOpen = false,
  scope = 'Residential', // 'Residential' | 'Commercial'
  onClose,
  onSelectItem,
  onMouseEnter,
  onMouseLeave,
}) {
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(null);
  const [menuData, setMenuData] = useState({
    residential: null,
    commercial: null,
  });
  const [loading, setLoading] = useState(false);

  const loadMenuData = useCallback(async (skipCache = false) => {
    try {
      if (skipCache) {
        invalidateMegaMenuCache();
      }
      const res = await fetchMegaMenu(null, { skipCache });
      if (res && res.success) {
        setMenuData({
          residential: res.residential || null,
          commercial: res.commercial || null,
        });
      }
    } catch (err) {
      console.warn('[MegaMenu] Failed to fetch menu data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & Cross-tab / Admin CRUD revalidation
  useEffect(() => {
    loadMenuData(false);

    const handleUpdate = () => {
      loadMenuData(true);
    };

    const handleStorage = (e) => {
      if (e.key === 'avxbs_megamenu_last_updated') {
        loadMenuData(true);
      }
    };

    window.addEventListener('mega-menu-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('mega-menu-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadMenuData]);

  // Revalidate fresh menu data whenever mega menu is opened
  useEffect(() => {
    if (isOpen) {
      loadMenuData(true);
    }
  }, [isOpen, loadMenuData]);

  if (!isOpen) return null;

  const isCommercial = scope === 'Commercial';
  const currentScopeData = isCommercial ? menuData?.commercial : menuData?.residential;

  // Resolve dynamic headings from database
  const highlightsHeading = currentScopeData?.highlightsHeading || 
    (isCommercial ? 'Commercial Highlights' : 'Residential Highlights');
  const solutionsHeading = currentScopeData?.solutionsHeading || 
    (isCommercial ? 'Commercial Solutions & Plants' : 'Residential Solutions & Systems');

  // Resolve highlights strictly from the API database response
  // Filter for active items with valid title and image, sorted by order
  // No merging with hardcoded fallback cards
  const highlights = (currentScopeData?.highlights || [])
    .filter(
      (h) => h && h.isActive !== false && Boolean(h.title && h.title.trim()) && Boolean(h.image && h.image.trim())
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Resolve solutions from DB, falling back to default solutions only if not loaded yet
  const rawSolutions = currentScopeData?.solutions && currentScopeData.solutions.length > 0
    ? currentScopeData.solutions
    : (isCommercial ? DEFAULT_SOLUTIONS.commercial : DEFAULT_SOLUTIONS.residential);

  const solutions = (rawSolutions || [])
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleCardClick = (item) => {
    if (onClose) onClose();
    if (onSelectItem) {
      onSelectItem({
        name: item.title,
        url: item.url,
        scope,
      });
    }

    if (item.url && item.url.startsWith('#')) {
      const targetId = item.url.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (item.url && (item.url.startsWith('/') || item.url.startsWith('http'))) {
      window.location.href = item.url;
    } else {
      setTimeout(() => {
        const el = document.getElementById('water-softener-inquiry-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleSolutionClick = (solution) => {
    if (onClose) onClose();
    if (onSelectItem) {
      onSelectItem({
        name: solution.title,
        url: solution.url,
        scope,
      });
    }

    if (solution.url && solution.url.startsWith('#')) {
      const targetId = solution.url.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (solution.url && solution.url.startsWith('/')) {
      window.location.href = solution.url;
    } else {
      setTimeout(() => {
        const el = document.getElementById('water-softener-inquiry-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  return (
    <div className="samsung-nav-mega-container">
      {/* Semi-transparent page backdrop overlay */}
      <div 
        className="samsung-nav-backdrop" 
        onClick={onClose} 
        onMouseEnter={onClose}
        onPointerEnter={onClose}
        aria-hidden="true" 
      />

      {/* Main Full-Width Dropdown Surface */}
      <div 
        className="samsung-nav-mega-surface" 
        role="region" 
        aria-label={`${scope} Navigation Menu`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onPointerEnter={onMouseEnter}
        onPointerLeave={onMouseLeave}
      >
        <div className="samsung-nav-mega-inner">
          
          {/* SECTION 1: LEFT-SIDE SOLUTION HIGHLIGHTS WITH INTERACTIVE EXPANDING IMAGES */}
          <div className="samsung-nav-section-left">
            <div className="samsung-section-title">
              {highlightsHeading}
            </div>

            {loading && !currentScopeData && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                Loading {scope} highlights...
              </div>
            )}

            {(!loading || currentScopeData) && highlights.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                No active highlights found.
              </div>
            )}

            {highlights.length > 0 && (
              <div className="samsung-highlights-grid">
                {highlights.map((item, idx) => {
                  const isHovered = activeHighlightIndex === idx;
                  const imgSrc = resolveMediaUrl(item.image, '/assets/water-softener-system.jpg');
                  return (
                    <div
                      key={item.id || item._id || idx}
                      className={`samsung-highlight-card ${isHovered ? 'is-active-hover' : ''}`}
                      onMouseEnter={() => setActiveHighlightIndex(idx)}
                      onMouseLeave={() => setActiveHighlightIndex(null)}
                      onClick={() => handleCardClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCardClick(item);
                        }
                      }}
                    >
                      <div className="samsung-highlight-img-box">
                        <img
                          src={imgSrc}
                          alt={item.title || 'Water Treatment Highlight'}
                          className="samsung-highlight-img"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = '/assets/water-softener-system.jpg';
                          }}
                        />
                      </div>
                      <div className="samsung-highlight-caption">
                        <span className="samsung-highlight-name">{item.title}</span>
                        <span className="samsung-highlight-sub">{item.subtitle || item.description || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUBTLE VERTICAL DIVIDER */}
          <div className="samsung-nav-vertical-divider" aria-hidden="true" />

          {/* SECTION 2: RIGHT-SIDE MODERN SOLUTION CARDS GRID */}
          <div className="samsung-nav-section-solutions">
            <div className="samsung-section-title">
              {solutionsHeading}
            </div>

            {solutions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                No active solutions found.
              </div>
            )}

            {solutions.length > 0 && (
              <div className="samsung-solution-cards-grid">
                {solutions.map((item, idx) => (
                  <div
                    key={item.id || item._id || idx}
                    className="samsung-solution-card"
                    onClick={() => handleSolutionClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSolutionClick(item);
                      }
                    }}
                    aria-label={`Select solution: ${item.title}`}
                  >
                    <div className="samsung-solution-card-icon-box">
                      {renderSolutionIcon(item.icon)}
                    </div>
                    <div className="samsung-solution-card-content">
                      <h4 className="samsung-solution-card-title">{item.title}</h4>
                      <p className="samsung-solution-card-desc">{item.description}</p>
                    </div>
                    <div className="samsung-solution-card-arrow-wrap" aria-hidden="true">
                      <ArrowRight size={16} className="samsung-solution-card-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
