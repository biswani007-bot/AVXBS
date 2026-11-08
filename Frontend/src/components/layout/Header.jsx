import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, ArrowRight, ChevronDown } from 'lucide-react';
import AVXBSLogo from './AVXBSLogo';
import SamsungMegaMenu from './SamsungMegaMenu';
import { searchWebsite, fetchMegaMenu } from '../../services/api';

// Fallback Submenu items matching desktop navigation
const DEFAULT_RESIDENTIAL_SUBITEMS = [
  { id: 'res-sol-1', title: 'Water Softener' },
  { id: 'res-sol-2', title: 'Whole House Filtration (WTP)' },
  { id: 'res-sol-3', title: 'Plumbing Solutions' },
  { id: 'res-sol-4', title: 'Modular Kitchen Purifiers' },
  { id: 'res-sol-5', title: 'Sanitary & Bath Fittings' },
];

const DEFAULT_COMMERCIAL_SUBITEMS = [
  { id: 'comm-sol-1', title: 'Commercial Softener Plants' },
  { id: 'comm-sol-2', title: 'Industrial Water Treatment (WTP)' },
  { id: 'comm-sol-3', title: 'Commercial RO & DM Systems' },
  { id: 'comm-sol-4', title: 'Sanitary & Commercial Bath' },
];

/**
 * Clean AVXBS Navbar matching Samsung Navigation Reference Exactly
 * - Far Left: AVXBS Logo
 * - Two main navigation items: [ Residential ] [ Commercial ] (Desktop)
 * - Hovering opens full-width mega menu directly underneath without page reload
 * - Far Right: Search Bar & Hamburger Menu (☰)
 * - Hamburger opens full-height side navigation drawer sliding from right edge
 */
export default function Header({ 
  navigate, 
  onSelectSolution,
  onSelectType,
  currentPath = '/',
  searchQuery = '',
  onSearchChange,
  selectedType = 'Residential'
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'Residential' | 'Commercial' | null
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    residential: false,
    commercial: false,
  });

  const [residentialSubItems, setResidentialSubItems] = useState(DEFAULT_RESIDENTIAL_SUBITEMS);
  const [commercialSubItems, setCommercialSubItems] = useState(DEFAULT_COMMERCIAL_SUBITEMS);

  const hoverTimeoutRef = useRef(null);
  const headerRef = useRef(null);
  const navDrawerRef = useRef(null);
  const lastTouchTimeRef = useRef(0);

  const handleTouchStart = () => {
    lastTouchTimeRef.current = Date.now();
  };

  // Load dynamic submenu items from backend if available
  useEffect(() => {
    let mounted = true;
    fetchMegaMenu().then((data) => {
      if (!mounted || !data) return;
      if (data.residential?.solutions?.length) {
        setResidentialSubItems(data.residential.solutions);
      }
      if (data.commercial?.solutions?.length) {
        setCommercialSubItems(data.commercial.solutions);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Prevent background scrolling while navigation drawer is open
  useEffect(() => {
    if (isNavDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isNavDrawerOpen]);

  const cancelCloseTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback((delay = 200) => {
    cancelCloseTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, delay);
  }, [cancelCloseTimeout]);

  // Immediate hover trigger on Residential or Commercial
  const handleTriggerEnter = useCallback((category) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    cancelCloseTimeout();
    setActiveMenu(category);
  }, [cancelCloseTimeout]);

  // Pointer enter trigger item (ignores touch so click handles tap toggle cleanly)
  const handleTriggerPointerEnter = useCallback((category, e) => {
    if (e?.pointerType === 'touch' || Date.now() - lastTouchTimeRef.current < 600) return;
    cancelCloseTimeout();
    setActiveMenu(category);
  }, [cancelCloseTimeout]);

  // Pointer leave trigger item
  const handleTriggerLeave = useCallback((e) => {
    if (e?.pointerType === 'touch' || Date.now() - lastTouchTimeRef.current < 600) {
      return;
    }
    if (e?.currentTarget && e?.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    scheduleClose(200);
  }, [scheduleClose]);

  // Dropdown panel hover handlers
  const handleDropdownMouseEnter = useCallback(() => {
    cancelCloseTimeout();
  }, [cancelCloseTimeout]);

  const handleDropdownMouseLeave = useCallback((e) => {
    if (e?.currentTarget && e?.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    scheduleClose(200);
  }, [scheduleClose]);

  // Click/Tap toggle for touch devices
  const handleTriggerClick = useCallback((category) => {
    cancelCloseTimeout();
    setActiveMenu((prev) => (prev === category ? null : category));
  }, [cancelCloseTimeout]);

  // Focus trigger for keyboard navigation
  const handleTriggerFocus = useCallback((category) => {
    if (Date.now() - lastTouchTimeRef.current < 600) return;
    cancelCloseTimeout();
    setActiveMenu(category);
  }, [cancelCloseTimeout]);

  // Close mega menu only when pointer genuinely leaves the header area
  const handleHeaderMouseLeave = useCallback((e) => {
    if (
      headerRef.current &&
      e?.relatedTarget instanceof Node &&
      headerRef.current.contains(e.relatedTarget)
    ) {
      return;
    }
    scheduleClose(200);
  }, [scheduleClose]);

  const handleCloseMenu = useCallback(() => {
    cancelCloseTimeout();
    setActiveMenu(null);
  }, [cancelCloseTimeout]);

  // Toggle drawer accordion section
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle side navigation drawer
  const handleToggleNavDrawer = () => {
    setActiveMenu(null);
    setIsSearchOpen(false);
    setIsNavDrawerOpen((prev) => !prev);
  };

  const handleCloseNavDrawer = () => {
    setIsNavDrawerOpen(false);
  };

  // Drawer submenu item selection handler
  const handleSelectDrawerSubItem = (solutionName, scope) => {
    setIsNavDrawerOpen(false);
    setActiveMenu(null);
    if (onSelectType) onSelectType(scope);
    if (onSelectSolution) {
      onSelectSolution({
        name: solutionName,
        scope: scope,
      });
    } else if (navigate) {
      navigate(`/?solution=${encodeURIComponent(solutionName)}&scope=${scope}`);
    } else {
      window.location.href = `/?solution=${encodeURIComponent(solutionName)}&scope=${scope}`;
    }
  };

  // Direct page navigation link handler (About Us, Contact Us)
  const handleDrawerDirectNav = (e, path) => {
    e.preventDefault();
    setIsNavDrawerOpen(false);
    setActiveMenu(null);
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  // Policy links click handler
  const handlePolicyClick = (e, hash) => {
    e.preventDefault();
    setIsNavDrawerOpen(false);
    setActiveMenu(null);
    if (typeof window !== 'undefined') {
      window.location.hash = hash;
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Search state
  const [internalQuery, setInternalQuery] = useState(searchQuery || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const mobileSearchOverlayRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  // Sync with prop if changed externally
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== internalQuery) {
      setInternalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Focus mobile search input when expanded
  useEffect(() => {
    if (isMobileSearchOpen) {
      const timer = setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMobileSearchOpen]);

  // Close mobile search overlay on tablet/desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced search query
  const performSearch = useCallback(async (text) => {
    if (!text || !text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await searchWebsite(text);
      if (res && res.success) {
        setSearchResults(res.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (val) => {
    setInternalQuery(val);
    if (onSearchChange) onSearchChange(val);

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      performSearch(val);
    }, 250);
  };

  const handleClearSearch = () => {
    setInternalQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
    if (onSearchChange) onSearchChange('');
  };

  const handleSearchResultClick = (result) => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setInternalQuery('');
    if (onSearchChange) onSearchChange('');

    if (result.type === 'page' && result.url) {
      if (navigate) navigate(result.url);
      else window.location.href = result.url;
      return;
    }

    if (onSelectSolution) {
      onSelectSolution({
        name: result.solutionName || result.title,
        scope: result.scope || 'Residential'
      });
    }

    // Scroll to appropriate section
    if (result.target === 'hero') {
      const el = document.getElementById('full-page-hero-banner');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('water-softener-inquiry-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
      setIsNavDrawerOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSearchResultClick(searchResults[0]);
      } else if (internalQuery.trim()) {
        performSearch(internalQuery);
      }
    }
  };

  const handleToggleMobileSearch = () => {
    setActiveMenu(null);
    setIsNavDrawerOpen(false);
    setIsMobileSearchOpen(true);
    if (internalQuery.trim()) {
      setIsSearchOpen(true);
      performSearch(internalQuery);
    }
  };

  const handleCloseMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setIsSearchOpen(false);
  };

  // Close menus, search, & drawer on Escape or Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (
        mobileSearchOverlayRef.current && 
        !mobileSearchOverlayRef.current.contains(event.target) &&
        !event.target.closest('.navbar-search-mobile-toggle-btn')
      ) {
        setIsMobileSearchOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setIsNavDrawerOpen(false);
        setIsSearchOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const handleSelectItem = (item) => {
    handleCloseMenu();
    if (onSelectSolution) {
      onSelectSolution({
        name: typeof item === 'string' ? item : (item?.name || item?.title || 'Water Softener'),
        scope: activeMenu || item?.category || 'Residential'
      });
    }
  };

  // Reusable search results list shared across desktop dropdown and mobile overlay
  const renderSearchResultsContent = () => {
    if (isSearching) {
      return (
        <div className="search-status-item">
          <Loader2 size={16} className="animate-spin text-blue-500" />
          <span>Searching AVXBS database...</span>
        </div>
      );
    }

    if (searchResults.length > 0) {
      return (
        <div className="search-results-list">
          <div className="search-results-header">
            <span>Found {searchResults.length} matching result{searchResults.length > 1 ? 's' : ''}</span>
          </div>
          {searchResults.map((item) => (
            <div
              key={item.id}
              className="search-result-row"
              onClick={() => handleSearchResultClick(item)}
              role="option"
              tabIndex={0}
            >
              {item.image && (
                <div className="search-result-thumb">
                  <img src={item.image} alt={item.title} />
                </div>
              )}
              <div className="search-result-info">
                <div className="search-result-top-line">
                  <span className="search-result-title">{item.title}</span>
                  {item.badge && (
                    <span className={`search-result-badge badge-${item.badge.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="search-result-desc">{item.description}</span>
              </div>
              <ArrowRight size={14} className="search-result-arrow" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="search-no-results">
        <span>No results found for "<strong>{internalQuery}</strong>"</span>
        <p>Try searching for "Water Softener", "WTP", "RO", or "Filter"</p>
      </div>
    );
  };

  return (
    <header 
      className={`site-header ${isNavDrawerOpen ? 'drawer-active' : ''}`} 
      ref={headerRef}
      onMouseLeave={handleHeaderMouseLeave}
    >
      <div className="header-container">
        {/* Left Side: Brand Logo + Primary Navigation (Desktop) */}
        <div className="header-left-group">
          {/* AVXBS Brand Logo */}
          <a 
            href="/" 
            className="header-logo-link site-logo" 
            aria-label="AVXBS Home"
            onMouseEnter={handleCloseMenu}
            onClick={(e) => {
              e.preventDefault();
              handleCloseMenu();
              setIsNavDrawerOpen(false);
              if (navigate) navigate('/');
              else window.location.href = '/';
            }}
          >
            <AVXBSLogo className="header-logo-img" animated={true} />
          </a>

          {/* Simple Navigation: Residential and Commercial (Desktop & Tablet) */}
          <nav 
            className="header-primary-nav" 
            aria-label="Primary Solutions Navigation"
          >
            <div 
              className="nav-item-wrapper samsung-nav-tab-wrapper"
              onTouchStart={handleTouchStart}
              onPointerDown={(e) => {
                if (e?.pointerType === 'touch') lastTouchTimeRef.current = Date.now();
              }}
              onMouseEnter={() => handleTriggerEnter('Residential')}
              onMouseLeave={handleTriggerLeave}
              onPointerEnter={(e) => handleTriggerPointerEnter('Residential', e)}
              onPointerLeave={handleTriggerLeave}
            >
              <button
                type="button"
                className={`samsung-nav-tab-btn ${activeMenu === 'Residential' ? 'is-active' : ''}`}
                onTouchStart={handleTouchStart}
                onPointerDown={(e) => {
                  if (e?.pointerType === 'touch') lastTouchTimeRef.current = Date.now();
                }}
                onClick={() => handleTriggerClick('Residential')}
                onMouseEnter={() => handleTriggerEnter('Residential')}
                onFocus={() => handleTriggerFocus('Residential')}
                aria-haspopup="true"
                aria-expanded={activeMenu === 'Residential'}
                aria-label="Residential solutions menu"
              >
                <span className="nav-tab-text">Residential</span>
                <span className="nav-tab-indicator" aria-hidden="true" />
              </button>
            </div>

            <div 
              className="nav-item-wrapper samsung-nav-tab-wrapper"
              onTouchStart={handleTouchStart}
              onPointerDown={(e) => {
                if (e?.pointerType === 'touch') lastTouchTimeRef.current = Date.now();
              }}
              onMouseEnter={() => handleTriggerEnter('Commercial')}
              onMouseLeave={handleTriggerLeave}
              onPointerEnter={(e) => handleTriggerPointerEnter('Commercial', e)}
              onPointerLeave={handleTriggerLeave}
            >
              <button
                type="button"
                className={`samsung-nav-tab-btn ${activeMenu === 'Commercial' ? 'is-active' : ''}`}
                onTouchStart={handleTouchStart}
                onPointerDown={(e) => {
                  if (e?.pointerType === 'touch') lastTouchTimeRef.current = Date.now();
                }}
                onClick={() => handleTriggerClick('Commercial')}
                onMouseEnter={() => handleTriggerEnter('Commercial')}
                onFocus={() => handleTriggerFocus('Commercial')}
                aria-haspopup="true"
                aria-expanded={activeMenu === 'Commercial'}
                aria-label="Commercial solutions menu"
              >
                <span className="nav-tab-text">Commercial</span>
                <span className="nav-tab-indicator" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>

        {/* Right Side: Search Input + Mobile Search Icon + Hamburger Menu (☰) */}
        <div className="header-right-group">
          {/* Functional Search Field with Interactive Results Dropdown (Desktop) */}
          <div className="navbar-search-container" ref={searchContainerRef} onMouseEnter={handleCloseMenu}>
            <div className={`navbar-search-wrapper ${isSearchOpen ? 'is-expanded' : ''}`}>
              <button
                type="button"
                className="navbar-search-submit-btn"
                onClick={() => {
                  if (internalQuery.trim()) {
                    setIsSearchOpen(true);
                    performSearch(internalQuery);
                  }
                }}
                aria-label="Submit search"
              >
                {isSearching ? (
                  <Loader2 className="navbar-search-icon animate-spin" size={16} />
                ) : (
                  <Search className="navbar-search-icon" size={16} />
                )}
              </button>

              <span className="navbar-search-separator" aria-hidden="true">|</span>

              <input
                type="text"
                className="navbar-search-input"
                placeholder="Search solutions..."
                value={internalQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => {
                  if (internalQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search solutions"
                autoComplete="off"
              />

              {internalQuery && (
                <button
                  type="button"
                  className="navbar-search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Clean Dropdown of Matching Search Results */}
            {isSearchOpen && internalQuery.trim().length > 0 && (
              <div className="navbar-search-dropdown-menu" role="listbox">
                {renderSearchResultsContent()}
              </div>
            )}
          </div>

          {/* Compact Mobile Search Icon (Replaces full search bar on mobile screens <= 1024px) */}
          <button
            type="button"
            className={`navbar-search-mobile-toggle-btn ${isMobileSearchOpen ? 'active' : ''}`}
            onClick={handleToggleMobileSearch}
            aria-label="Search solutions"
            aria-expanded={isMobileSearchOpen}
          >
            <Search size={20} className="navbar-search-mobile-icon" />
          </button>

          {/* Right-Side Hamburger Menu (☰) - Animates to X when open */}
          <div className="header-menu-wrapper">
            <button
              type="button"
              className={`header-menu-btn ${isNavDrawerOpen ? 'is-open' : ''}`}
              aria-label={isNavDrawerOpen ? 'Close navigation drawer' : 'Open navigation menu'}
              aria-expanded={isNavDrawerOpen}
              onClick={handleToggleNavDrawer}
            >
              <span className="hamburger-box" aria-hidden="true">
                <span className="hamburger-line top" />
                <span className="hamburger-line middle" />
                <span className="hamburger-line bottom" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Expanded Search Bar Interface (Active when user taps mobile search icon) */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay" ref={mobileSearchOverlayRef}>
          <div className="mobile-search-bar">
            <div className="mobile-search-input-wrap">
              {isSearching ? (
                <Loader2 className="mobile-search-icon animate-spin" size={18} />
              ) : (
                <Search className="mobile-search-icon" size={18} />
              )}
              <input
                ref={mobileSearchInputRef}
                type="text"
                className="mobile-search-input"
                placeholder="Search solutions (e.g. Water Softener)..."
                value={internalQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search solutions"
                autoComplete="off"
              />
              {internalQuery && (
                <button
                  type="button"
                  className="mobile-search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search text"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="mobile-search-close-btn"
              onClick={handleCloseMobileSearch}
              aria-label="Close search interface"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Search Results Dropdown Panel */}
          {isSearchOpen && internalQuery.trim().length > 0 && (
            <div className="mobile-search-results-panel" role="listbox">
              {renderSearchResultsContent()}
            </div>
          )}
        </div>
      )}

      {/* Samsung-Style Exact 3-Section Full-Width Mega Menu Panel (Desktop Hover) */}
      <SamsungMegaMenu
        isOpen={activeMenu !== null}
        scope={activeMenu || 'Residential'}
        onClose={handleCloseMenu}
        onSelectItem={handleSelectItem}
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
      />

      {/* Semi-Transparent Dark Overlay Behind Side Navigation Drawer */}
      <div 
        className={`nav-drawer-overlay ${isNavDrawerOpen ? 'open' : ''}`}
        onClick={handleCloseNavDrawer}
        aria-hidden="true"
      />

      {/* Full-Height Side Navigation Drawer Sliding in from the Right Edge */}
      <aside 
        ref={navDrawerRef}
        className={`nav-drawer ${isNavDrawerOpen ? 'open' : ''}`}
        aria-label="Main Navigation Drawer"
        aria-hidden={!isNavDrawerOpen}
      >
        {/* Drawer Header: Brand Logo & Close (X) Button */}
        <div className="nav-drawer-header">
          <div className="nav-drawer-logo-wrap">
            <AVXBSLogo className="nav-drawer-logo" animated={false} />
          </div>
          <button
            type="button"
            className="nav-drawer-close-btn"
            onClick={handleCloseNavDrawer}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation Body with Expandable Accordion Submenus */}
        <nav className="nav-drawer-body">
          {/* 1. Residential (Mobile Only) */}
          <div className="drawer-nav-group drawer-mobile-only drawer-mobile-tablet-only">
            <button
              type="button"
              className={`drawer-nav-item drawer-nav-trigger ${
                currentPath === '/' && selectedType === 'Residential' ? 'active' : ''
              } ${expandedSections.residential ? 'expanded' : ''}`}
              onClick={() => toggleSection('residential')}
              aria-expanded={expandedSections.residential}
            >
              <span className="drawer-nav-label">Residential</span>
              <ChevronDown 
                size={18} 
                className={`drawer-chevron ${expandedSections.residential ? 'rotated' : ''}`} 
              />
            </button>

            <div className={`drawer-submenu ${expandedSections.residential ? 'open' : ''}`}>
              <div className="drawer-submenu-inner">
                {residentialSubItems.map((item) => (
                  <button
                    key={item.id || item.title}
                    type="button"
                    className="drawer-subitem"
                    onClick={() => handleSelectDrawerSubItem(item.title, 'Residential')}
                  >
                    <span className="drawer-subitem-dot" aria-hidden="true" />
                    <span className="drawer-subitem-text">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Commercial (Mobile Only) */}
          <div className="drawer-nav-group drawer-mobile-only drawer-mobile-tablet-only">
            <button
              type="button"
              className={`drawer-nav-item drawer-nav-trigger ${
                currentPath === '/' && selectedType === 'Commercial' ? 'active' : ''
              } ${expandedSections.commercial ? 'expanded' : ''}`}
              onClick={() => toggleSection('commercial')}
              aria-expanded={expandedSections.commercial}
            >
              <span className="drawer-nav-label">Commercial</span>
              <ChevronDown 
                size={18} 
                className={`drawer-chevron ${expandedSections.commercial ? 'rotated' : ''}`} 
              />
            </button>

            <div className={`drawer-submenu ${expandedSections.commercial ? 'open' : ''}`}>
              <div className="drawer-submenu-inner">
                {commercialSubItems.map((item) => (
                  <button
                    key={item.id || item.title}
                    type="button"
                    className="drawer-subitem"
                    onClick={() => handleSelectDrawerSubItem(item.title, 'Commercial')}
                  >
                    <span className="drawer-subitem-dot" aria-hidden="true" />
                    <span className="drawer-subitem-text">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. About Us */}
          <div className="drawer-nav-group">
            <a
              href="/about"
              className={`drawer-nav-item ${currentPath === '/about' ? 'active' : ''}`}
              onClick={(e) => handleDrawerDirectNav(e, '/about')}
            >
              <span className="drawer-nav-label">About Us</span>
            </a>
          </div>

          {/* 4. Contact Us */}
          <div className="drawer-nav-group">
            <a
              href="/contact"
              className={`drawer-nav-item ${currentPath === '/contact' ? 'active' : ''}`}
              onClick={(e) => handleDrawerDirectNav(e, '/contact')}
            >
              <span className="drawer-nav-label">Contact Us</span>
            </a>
          </div>

          {/* Subtle Divider separating main navigation from policy links */}
          <div className="drawer-divider" aria-hidden="true" />

          {/* 5. Policy Links Section */}
          <div className="drawer-policy-section">
            <a
              href="#privacy"
              className="drawer-policy-item"
              onClick={(e) => handlePolicyClick(e, '#privacy')}
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="drawer-policy-item"
              onClick={(e) => handlePolicyClick(e, '#terms')}
            >
              Terms of Service
            </a>
            <a
              href="#warranty"
              className="drawer-policy-item"
              onClick={(e) => handlePolicyClick(e, '#warranty')}
            >
              Warranty & Service Policy
            </a>
          </div>
        </nav>
      </aside>
    </header>
  );
}
