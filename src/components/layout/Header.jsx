import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import AVXBSLogo from './AVXBSLogo';

/**
 * Minimalist Brand Header with Responsive Right-Side Three-Dot Navigation
 * - Preserves existing AVXBS logo and animated vertical bars on the left.
 * - Adds MoreVertical (three-dot) menu icon on the extreme right, vertically centered.
 * - Dropdown menu contains "About Us" (/about) and "Contact Us" (/contact).
 * - Smooth open/close animations, outside-click & Escape dismissal.
 */
export default function Header({ navigate, currentPath = '/' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <header className="site-header">
      <div className="header-container">
        {/* AVXBS Brand Logo (Left) */}
        <a 
          href="/" 
          className="header-logo-link" 
          aria-label="AVXBS Home"
          onClick={(e) => handleLinkClick(e, '/')}
        >
          <AVXBSLogo className="header-logo-img" animated={true} />
        </a>

        {/* Right-Side Three-Dot Menu */}
        <div className="header-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className={`header-menu-btn ${isMenuOpen ? 'active' : ''}`}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <MoreVertical size={24} className="menu-icon" />
          </button>

          {/* Clean Dropdown Menu */}
          <div 
            className={`navbar-dropdown-menu ${isMenuOpen ? 'open' : ''}`} 
            role="menu"
            aria-label="Site Navigation"
          >
            <a
              href="/about"
              role="menuitem"
              className={`dropdown-menu-item ${currentPath === '/about' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, '/about')}
            >
              About Us
            </a>
            <a
              href="/contact"
              role="menuitem"
              className={`dropdown-menu-item ${currentPath === '/contact' ? 'active' : ''}`}
              onClick={(e) => handleLinkClick(e, '/contact')}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
