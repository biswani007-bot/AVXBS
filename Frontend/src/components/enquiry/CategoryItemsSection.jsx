import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Layers, 
  Wrench, 
  Utensils, 
  Bath, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Tag
} from 'lucide-react';
import { fetchEnquiryTabs } from '../../services/api';

// Icon resolver based on tab or item name
const getCategoryIcon = (name = '') => {
  const upper = name.toUpperCase();
  if (upper.includes('SOFTENER') || upper.includes('SOFTNER')) return Droplets;
  if (upper.includes('WTP') || upper.includes('TREATMENT') || upper.includes('PLANT')) return Layers;
  if (upper.includes('PLUMBING')) return Wrench;
  if (upper.includes('KITCHEN')) return Utensils;
  if (upper.includes('SANITARY') || upper.includes('BATH')) return Bath;
  return Sparkles;
};

export default function CategoryItemsSection({ category = 'Residential' }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch category tabs and items from MongoDB backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchEnquiryTabs(category).then((data) => {
      if (isMounted) {
        if (Array.isArray(data) && data.length > 0) {
          setTabs(data);
          setActiveTabId(data[0]._id);
        } else {
          setTabs([]);
          setActiveTabId(null);
        }
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [category]);

  const activeTab = tabs.find(t => t._id === activeTabId) || tabs[0] || null;
  const items = (activeTab?.items || []).filter(item => item.isActive !== false);

  const isCommercial = category === 'Commercial';
  const themeColor = isCommercial ? '#7e22ce' : '#0284c7';
  const themeBgLight = isCommercial ? 'rgba(126, 34, 206, 0.06)' : 'rgba(2, 132, 199, 0.06)';

  return (
    <section 
      id="category-items-section"
      className="category-items-section"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        padding: '48px 24px 80px',
        boxSizing: 'border-box',
        minHeight: '75vh',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Section Heading & Breadcrumb Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: themeBgLight,
            padding: '6px 16px',
            borderRadius: '20px',
            color: themeColor,
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}>
            <span>{category} Portfolio</span>
            <span>•</span>
            <span>{activeTab ? activeTab.tabName : 'Solutions'}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}>
            {isCommercial 
              ? 'Commercial Water & Industrial Plant Solutions' 
              : 'Residential Water & Infrastructure Solutions'}
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#64748b',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Explore our precision-engineered solutions. Select a category tab below to view all systems and specifications.
          </p>
        </div>

        {/* Clean Horizontal Category Tabs Bar */}
        <div 
          className="category-tabs-nav"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '40px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '24px',
          }}
        >
          {tabs.map((tab) => {
            const IconComp = getCategoryIcon(tab.tabName);
            const isActive = tab._id === activeTabId;
            return (
              <button
                key={tab._id}
                type="button"
                onClick={() => setActiveTabId(tab._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  border: isActive 
                    ? `2px solid ${themeColor}` 
                    : '1px solid #e2e8f0',
                  backgroundColor: isActive 
                    ? themeBgLight 
                    : '#ffffff',
                  color: isActive 
                    ? themeColor 
                    : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                <IconComp size={16} />
                <span>{tab.tabName}</span>
              </button>
            );
          })}
        </div>

        {/* Category Description Banner */}
        {activeTab && activeTab.description && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: themeBgLight,
                color: themeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {React.createElement(getCategoryIcon(activeTab.tabName), { size: 18 })}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' }}>
                  {activeTab.tabName}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  {activeTab.description}
                </p>
              </div>
            </div>

            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              whiteSpace: 'nowrap',
            }}>
              {items.length} {items.length === 1 ? 'Solution' : 'Solutions'} Available
            </span>
          </div>
        )}

        {/* Category Items Cards Grid (No Form) */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p>Loading category items...</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{
            border: '1px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '60px 24px',
            textAlign: 'center',
            color: '#64748b',
            backgroundColor: '#f8fafc',
          }}>
            <h3 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '8px' }}>
              No items available under this category
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
              Items can be added anytime through the Admin Dashboard under Enquiry Tab Management.
            </p>
          </div>
        ) : (
          <div 
            className="category-items-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'stretch',
            }}
          >
            {items.map((item, idx) => {
              const ItemIcon = getCategoryIcon(item.name || activeTab?.tabName);
              return (
                <div
                  key={item._id || idx}
                  className="category-item-card"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(15, 23, 42, 0.12)';
                    e.currentTarget.style.borderColor = themeColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(15, 23, 42, 0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div>
                    {/* Card Top: Icon & Badge */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '18px',
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: themeBgLight,
                        color: themeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <ItemIcon size={20} />
                      </div>

                      {item.badge && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          backgroundColor: themeBgLight,
                          color: themeColor,
                          border: `1px solid ${isCommercial ? 'rgba(126, 34, 206, 0.2)' : 'rgba(2, 132, 199, 0.2)'}`,
                        }}>
                          <Tag size={11} />
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Item Name */}
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '800',
                      color: '#0f172a',
                      margin: '0 0 10px',
                      lineHeight: '1.4',
                    }}>
                      {item.name}
                    </h3>

                    {/* Item Description */}
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#475569',
                      margin: 0,
                    }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Card Bottom: Engineering Assurance Pill */}
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#64748b',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={13} color={themeColor} />
                      AVXBS Engineered Purity
                    </span>
                    <span style={{ color: themeColor, fontWeight: '700' }}>
                      Item #{idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

