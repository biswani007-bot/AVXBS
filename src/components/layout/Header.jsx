import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';
import AVXBSLogo from './AVXBSLogo';
import MegaMenu from './MegaMenu';

/**
 * Responsive Enterprise Header with Samsung-Style Mega Menus
 * - Preserves existing AVXBS logo and animated vertical bars on the left.
 * - Adds "Residential" and "Commercial" navigation links beside the logo.
 * - Full-width Samsung-style multi-column mega menu on desktop hover and mobile/tablet tap.
 * - Smooth transition between Residential and Commercial without closing/flicker.
 * - Keeps the existing right-side MoreVertical (three-dot) menu for About Us & Contact Us.
 * - Dismisses on outside click, Escape key, or when mouse leaves combined nav/menu area.
 */
export default function Header({ 
  navigate, 
  currentPath = '/',
  selectedType = 'Residential',
  onSelectType,
  onOpenInquiry 
}) {
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null); // 'residential' | 'commercial' | null

  const threeDotMenuRef = useRef(null);
  const headerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  // Clear hover timeout safely
  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Open/switch mega menu on hover
  const handleNavMouseEnter = (menuType) => {
    clearCloseTimeout();
    setIsThreeDotMenuOpen(false);
    setActiveMegaMenu(menuType);
  };

  // Schedule close on mouse leave with grace period
  const handleNavMouseLeave = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 180);
  };

  // Keep open when hovering inside the mega menu panel
  const handleMegaMenuMouseEnter = () => {
    clearCloseTimeout();
  };

  // Toggle on mobile/tablet tap or desktop click
  const handleNavClick = (menuType) => {
    clearCloseTimeout();
    setIsThreeDotMenuOpen(false);
    setActiveMegaMenu((prev) => (prev === menuType ? null : menuType));
  };

  // Explicit close handler
  const handleCloseMegaMenu = useCallback(() => {
    clearCloseTimeout();
    setActiveMegaMenu(null);
  }, []);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMegaMenu(null);
        setIsThreeDotMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMegaMenu(null);
        setIsThreeDotMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearCloseTimeout();
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleThreeDotClick = (e, path) => {
    e.preventDefault();
    setIsThreeDotMenuOpen(false);
    setActiveMegaMenu(null);
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-container">
        {/* Left Side: Brand Logo + Primary Mega Menu Links */}
        <div className="header-left-group">
          {/* AVXBS Brand Logo */}
          <a 
            href="/" 
            className="header-logo-link" 
            aria-label="AVXBS Home"
            onClick={(e) => handleThreeDotClick(e, '/')}
          >
            <AVXBSLogo className="header-logo-img" animated={true} />
          </a>

          {/* Samsung-Style Primary Navigation Links */}
          <nav 
            className="header-primary-nav" 
            aria-label="Water Treatment Solutions"
            onMouseLeave={handleNavMouseLeave}
          >
            <button
              type="button"
              className={`primary-nav-btn ${activeMegaMenu === 'residential' ? 'is-active' : ''}`}
              onMouseEnter={() => handleNavMouseEnter('residential')}
              onClick={() => handleNavClick('residential')}
              aria-expanded={activeMegaMenu === 'residential'}
              aria-haspopup="true"
            >
              <span className="nav-btn-label">Residential</span>
              <span className="nav-btn-indicator" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`primary-nav-btn ${activeMegaMenu === 'commercial' ? 'is-active' : ''}`}
              onMouseEnter={() => handleNavMouseEnter('commercial')}
              onClick={() => handleNavClick('commercial')}
              aria-expanded={activeMegaMenu === 'commercial'}
              aria-haspopup="true"
            >
              <span className="nav-btn-label">Commercial</span>
              <span className="nav-btn-indicator" aria-hidden="true" />
            </button>
          </nav>
        </div>

        {/* Right-Side Three-Dot Menu */}
        <div className="header-menu-wrapper" ref={threeDotMenuRef}>
          <button
            type="button"
            className={`header-menu-btn ${isThreeDotMenuOpen ? 'active' : ''}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isThreeDotMenuOpen}
            aria-haspopup="true"
            onClick={() => {
              setActiveMegaMenu(null);
              setIsThreeDotMenuOpen((prev) => !prev);
            }}
          >
            <MoreVertical size={24} className="menu-icon" />
          </button>

          {/* Clean Dropdown Menu */}
          <div 
            className={`navbar-dropdown-menu ${isThreeDotMenuOpen ? 'open' : ''}`} 
            role="menu"
            aria-label="Site Navigation"
          >
            <a
              href="/about"
              role="menuitem"
              className={`dropdown-menu-item ${currentPath === '/about' ? 'active' : ''}`}
              onClick={(e) => handleThreeDotClick(e, '/about')}
            >
              About Us
            </a>
            <a
              href="/contact"
              role="menuitem"
              className={`dropdown-menu-item ${currentPath === '/contact' ? 'active' : ''}`}
              onClick={(e) => handleThreeDotClick(e, '/contact')}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

      {/* Full-Width Samsung-Style Mega Menu Panel */}
      <div 
        className={`mega-menu-container-outer ${activeMegaMenu ? 'is-open' : ''}`}
        onMouseEnter={handleMegaMenuMouseEnter}
        onMouseLeave={handleNavMouseLeave}
      >
        <MegaMenu
          activeMenu={activeMegaMenu}
          onClose={handleCloseMegaMenu}
          onSelectType={onSelectType}
          onOpenInquiry={onOpenInquiry}
          navigate={navigate}
        />
      </div>

      {/* Page Dimming Backdrop */}
      {activeMegaMenu && (
        <div 
          className="mega-menu-backdrop-overlay" 
          aria-hidden="true"
          onClick={handleCloseMegaMenu}
        />
      )}
    </header>
  );
}
