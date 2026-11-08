
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Menu as MenuIcon,
  Sliders,
  Image as ImageIcon,
  Settings,
  LogOut,
  Droplets,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PanelBottom,
  MessageSquareQuote,
  Info,
  PhoneCall,
  User
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);

  // Authentication check
  // IMPORTANT: All hooks must execute before conditional returns
  useEffect(() => {
    // Login page does not require admin authentication check
    if (pathname === '/admin/login') {
      return;
    }

    let active = true;

    // Get cached user information
    const stored = localStorage.getItem('avxbs_admin_user');

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('avxbs_admin_user');
        setUser(null);
      }
    }

    // Verify authentication through backend API
    fetch('/api/auth/me')
      .then((res) => {
        if (!active) return null;

        if (!res.ok) {
          router.replace('/admin/login');
          return null;
        }

        return res.json();
      })
      .then((data) => {
        if (!active || !data?.user) return;

        setUser(data.user);

        localStorage.setItem(
          'avxbs_admin_user',
          JSON.stringify(data.user)
        );
      })
      .catch((error) => {
        if (active) {
          console.error('Authentication verification failed:', error);
        }
      });

    // Cleanup pending authentication request handling
    return () => {
      active = false;
    };

  }, [pathname, router]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    }

    localStorage.removeItem('avxbs_admin_user');
    setUser(null);

    router.replace('/admin/login');
  };

  // Navigation menu items
  const navItems = [
    {
      label: 'Dashboard Overview',
      href: '/admin',
      icon: LayoutDashboard
    },
    {
      label: 'Hero Banner Management',
      href: '/admin/hero',
      icon: Sparkles
    },
    {
      label: 'Inquiry Section Banner',
      href: '/admin/inquiry-section',
      icon: Sparkles
    },
    {
      label: 'Secondary Banner',
      href: '/admin/banner',
      icon: ImageIcon
    },
    {
      label: 'Website Settings & Logo',
      href: '/admin/settings',
      icon: Settings
    },
    {
      label: 'Customer Inquiries',
      href: '/admin/inquiries',
      icon: Inbox
    },
    {
      label: 'Customer Feedback',
      href: '/admin/testimonials',
      icon: MessageSquareQuote
    },
    {
      label: 'Mega Menu Navigation',
      href: '/admin/menu',
      icon: MenuIcon
    },
    {
      label: 'About Us Page',
      href: '/admin/about',
      icon: Info
    },
    {
      label: 'Contact Us Page',
      href: '/admin/contact',
      icon: PhoneCall
    },
    {
      label: 'Footer Management',
      href: '/admin/footer',
      icon: PanelBottom
    },
    {
      label: 'Admin Profile',
      href: '/admin/profile',
      icon: User
    }
  ];

  // Login page: render without admin sidebar
  // This return is AFTER all hooks
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#e5e7eb'
      }}
    >

      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >

        {/* Brand Header */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Droplets size={20} />
          </div>

          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#f8fafc',
                letterSpacing: '-0.02em'
              }}
            >
              AVXBS Admin
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b'
              }}
            >
              Water Treatment Operations
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            padding: '16px 12px',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 8px 8px 8px'
            }}
          >
            Management
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {navItems.map((item) => {
              const IconComp = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' &&
                  pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    backgroundColor: isActive
                      ? 'rgba(37, 99, 235, 0.12)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(59, 130, 246, 0.25)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp
                    size={18}
                    style={{
                      color: isActive ? '#3b82f6' : '#64748b'
                    }}
                  />

                  <span style={{ flex: 1 }}>
                    {item.label}
                  </span>

                  {isActive && (
                    <ChevronRight
                      size={14}
                      style={{ color: '#3b82f6' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Website Link */}
          <div
            style={{
              marginTop: '24px',
              padding: '0 8px 8px 8px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Website Link
          </div>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid #1e293b'
            }}
          >
            <ExternalLink
              size={16}
              style={{ color: '#64748b' }}
            />

            <span>Open React Frontend</span>
          </a>
        </nav>

        {/* User Bar & Logout */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0c1322',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#f1f5f9',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {user?.name || 'Administrator'}
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              {user?.email || 'admin@avxbs.com'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              transition: 'background 0.2s',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto'
        }}
      >
        {children}
      </main>

    </div>
  );
}
