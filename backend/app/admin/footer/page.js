'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Globe,
  Share2,
  FileText,
  Building,
  RotateCcw,
  UploadCloud,
  Check,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminFooterPage() {
  const [config, setConfig] = useState(null);
  const [initialConfig, setInitialConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(null); // 'all' | 'company' | 'columns' | 'social' | 'publish' | 'reset'
  const [message, setMessage] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Supported Social Media Platforms
  const SOCIAL_PLATFORMS = [
    'LinkedIn',
    'Instagram',
    'YouTube',
    'Facebook',
    'X (Twitter)',
    'WhatsApp'
  ];

  // Fetch footer config from database
  const loadFooterConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/footer-config?mode=admin');
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config);
        setInitialConfig(JSON.parse(JSON.stringify(data.config)));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to load footer config:', err);
      showMessage('error', 'Failed to load footer configuration from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFooterConfig();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (initialConfig && config) {
      const isDirty = JSON.stringify(initialConfig) !== JSON.stringify(config);
      setHasUnsavedChanges(isDirty);
    }
  }, [config, initialConfig]);

  // Unsaved changes warning before window unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in Footer Management. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // 1. SAVE ALL CHANGES
  const handleSaveAll = async () => {
    setSavingAction('all');
    setMessage(null);
    try {
      const res = await fetch('/api/footer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyInfo: config.companyInfo,
          columns: config.columns,
          socialLinks: config.socialLinks,
          legalLinks: config.legalLinks,
          isActive: config.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      setHasUnsavedChanges(false);
      showMessage('success', 'All footer changes saved and updated live on the website successfully!');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingAction(null);
    }
  };

  // 2. SAVE INDIVIDUAL SECTION
  const handleSaveSection = async (sectionName, sectionData) => {
    setSavingAction(sectionName);
    setMessage(null);
    try {
      const res = await fetch('/api/footer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_section',
          section: sectionName,
          data: sectionData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save section');
      
      // Update initialConfig for that section
      setInitialConfig((prev) => ({
        ...prev,
        [sectionName]: JSON.parse(JSON.stringify(sectionData)),
      }));

      showMessage('success', `Section "${sectionName}" saved and updated live on the website!`);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingAction(null);
    }
  };

  // 3. RESET CHANGES (Restore last saved version)
  const handleReset = async () => {
    if (!confirm('Discard all unsaved edits and restore the last saved footer configuration?')) return;
    setSavingAction('reset');
    setMessage(null);
    try {
      const res = await fetch('/api/footer-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset');
      
      await loadFooterConfig();
      showMessage('success', 'Footer configuration reverted to the last saved version.');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSavingAction(null);
    }
  };

  // ================= COMPANY INFO HANDLERS =================
  const handleCompanyChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value,
      },
    }));
  };

  // ================= NAVIGATION COLUMN HANDLERS =================
  const handleAddColumn = () => {
    const newCol = {
      title: 'New Column',
      sectionKey: `column-${Date.now()}`,
      order: (config.columns?.length || 0) + 1,
      isActive: true,
      links: [
        { label: 'Sample Link', url: '#', isExternal: false, order: 1, isActive: true },
      ],
    };
    setConfig((prev) => ({
      ...prev,
      columns: [...(prev.columns || []), newCol],
    }));
  };

  const handleRemoveColumn = (colIdx) => {
    if (!confirm(`Are you sure you want to delete column "${config.columns[colIdx].title}" and all its links?`)) return;
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated.splice(colIdx, 1);
      return { ...prev, columns: updated };
    });
  };

  const handleColumnTitleChange = (colIdx, title) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated[colIdx].title = title;
      return { ...prev, columns: updated };
    });
  };

  const handleColumnVisibility = (colIdx) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated[colIdx].isActive = !updated[colIdx].isActive;
      return { ...prev, columns: updated };
    });
  };

  const handleMoveColumn = (colIdx, direction) => {
    const targetIdx = direction === 'left' ? colIdx - 1 : colIdx + 1;
    if (targetIdx < 0 || targetIdx >= config.columns.length) return;
    setConfig((prev) => {
      const updated = [...prev.columns];
      const temp = updated[colIdx];
      updated[colIdx] = updated[targetIdx];
      updated[targetIdx] = temp;
      updated.forEach((col, idx) => {
        col.order = idx + 1;
      });
      return { ...prev, columns: updated };
    });
  };

  // ================= LINK MANAGEMENT WITHIN COLUMNS =================
  const handleAddLink = (colIdx) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      const links = updated[colIdx].links || [];
      links.push({
        label: 'New Link',
        url: '#',
        isExternal: false,
        order: links.length + 1,
        isActive: true,
      });
      updated[colIdx].links = links;
      return { ...prev, columns: updated };
    });
  };

  const handleRemoveLink = (colIdx, linkIdx) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated[colIdx].links.splice(linkIdx, 1);
      return { ...prev, columns: updated };
    });
  };

  const handleLinkChange = (colIdx, linkIdx, field, value) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated[colIdx].links[linkIdx][field] = value;
      return { ...prev, columns: updated };
    });
  };

  const handleToggleLinkActive = (colIdx, linkIdx) => {
    setConfig((prev) => {
      const updated = [...prev.columns];
      updated[colIdx].links[linkIdx].isActive = updated[colIdx].links[linkIdx].isActive === false ? true : false;
      return { ...prev, columns: updated };
    });
  };

  const handleMoveLink = (colIdx, linkIdx, direction) => {
    const targetIdx = direction === 'up' ? linkIdx - 1 : linkIdx + 1;
    if (targetIdx < 0 || targetIdx >= config.columns[colIdx].links.length) return;
    setConfig((prev) => {
      const updated = [...prev.columns];
      const links = [...updated[colIdx].links];
      const temp = links[linkIdx];
      links[linkIdx] = links[targetIdx];
      links[targetIdx] = temp;
      links.forEach((l, idx) => {
        l.order = idx + 1;
      });
      updated[colIdx].links = links;
      return { ...prev, columns: updated };
    });
  };

  // ================= SOCIAL MEDIA MANAGEMENT =================
  const handleAddSocial = (platformName = 'LinkedIn') => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: [
        ...(prev.socialLinks || []),
        { 
          platform: platformName, 
          url: 'https://', 
          label: platformName, 
          order: (prev.socialLinks?.length || 0) + 1, 
          isActive: true 
        },
      ],
    }));
  };

  const handleSocialChange = (sIdx, field, value) => {
    setConfig((prev) => {
      const updated = [...prev.socialLinks];
      updated[sIdx][field] = value;
      return { ...prev, socialLinks: updated };
    });
  };

  const handleToggleSocialActive = (sIdx) => {
    setConfig((prev) => {
      const updated = [...prev.socialLinks];
      updated[sIdx].isActive = updated[sIdx].isActive === false ? true : false;
      return { ...prev, socialLinks: updated };
    });
  };

  const handleRemoveSocial = (sIdx) => {
    setConfig((prev) => {
      const updated = [...prev.socialLinks];
      updated.splice(sIdx, 1);
      return { ...prev, socialLinks: updated };
    });
  };

  const handleMoveSocial = (sIdx, direction) => {
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    if (targetIdx < 0 || targetIdx >= config.socialLinks.length) return;
    setConfig((prev) => {
      const updated = [...prev.socialLinks];
      const temp = updated[sIdx];
      updated[sIdx] = updated[targetIdx];
      updated[targetIdx] = temp;
      updated.forEach((s, idx) => {
        s.order = idx + 1;
      });
      return { ...prev, socialLinks: updated };
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', color: '#94a3b8', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '14px', fontSize: '14px' }}>Loading footer configuration from database...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Top Action Bar & Notification Alert */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#090d16',
        padding: '16px 0',
        marginBottom: '24px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Footer Directory Management
            </h1>
            {hasUnsavedChanges && (
              <span style={{
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                color: '#facc15',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.04em'
              }}>
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '4px 0 0' }}>
            Multi-column Samsung-style directory footer, company information, navigation categories & social icons.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleReset}
            disabled={savingAction !== null}
            title="Restore last published configuration"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #334155',
              fontSize: '0.86rem',
              fontWeight: '600',
              cursor: savingAction !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={15} />
            {savingAction === 'reset' ? 'Resetting...' : 'Reset'}
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isPreviewOpen ? '#0284c7' : '#1e293b',
              color: '#ffffff',
              padding: '9px 14px',
              borderRadius: '8px',
              border: isPreviewOpen ? '1px solid #38bdf8' : '1px solid #334155',
              fontSize: '0.86rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={15} />
            {isPreviewOpen ? 'Hide Preview' : 'Preview Changes'}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={savingAction !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: savingAction !== null ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(29, 78, 216, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={16} />
            {savingAction === 'all' ? 'Saving All...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Floating or Embedded Toast Message */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 22px',
          borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          backgroundColor: message.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: '#ffffff',
          fontSize: '0.92rem',
          fontWeight: '500',
          maxWidth: '480px'
        }}>
          {message.type === 'success' ? <CheckCircle size={20} color="#34d399" /> : <AlertCircle size={20} color="#f87171" />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', marginLeft: 'auto', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Interactive Live Footer Preview Panel */}
      {isPreviewOpen && (
        <div style={{
          backgroundColor: '#030712',
          border: '2px dashed #0284c7',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="#38bdf8" />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Footer Dynamic Preview
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Shows exactly how the footer renders with current admin edits</span>
          </div>

          <div style={{ backgroundColor: '#0d1527', borderRadius: '12px', padding: '24px', border: '1px solid #1e293b' }}>
            {/* Top Brand Tier */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
              <div style={{ maxWidth: '600px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.05em' }}>AVXBS</span>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.5' }}>
                  {config?.companyInfo?.description}
                </p>
              </div>
              <div style={{ padding: '6px 14px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '12px', fontWeight: '600' }}>
                {config?.companyInfo?.badgeText}
              </div>
            </div>

            {/* Middle Columns Tier */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config?.columns?.filter(c => c.isActive !== false).length || 4}, 1fr)`, gap: '20px', borderTop: '1px solid #1e293b', paddingTop: '20px', marginBottom: '24px' }}>
              {config?.columns?.filter(c => c.isActive !== false).map((col, idx) => (
                <div key={idx}>
                  <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>{col.title}</h5>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {col.links?.filter(l => l.isActive !== false).map((link, lIdx) => (
                      <li key={lIdx}>
                        <a href={link.url} style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'none' }}>{link.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom Bar Tier */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                <span style={{ color: '#38bdf8', fontWeight: '600' }}>{config?.companyInfo?.regionText}</span>
                <span>|</span>
                <span>{config?.companyInfo?.copyrightText}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Stay in the Loop?</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {config?.socialLinks?.filter(s => s.isActive !== false).map((s, idx) => (
                    <span key={idx} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#1e293b', fontSize: '11px', color: '#cbd5e1' }}>
                      {s.platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 1: COMPANY INFORMATION ================= */}
      <section style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              1. Company Information & Brand Taglines
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleSaveSection('companyInfo', config.companyInfo)}
            disabled={savingAction !== null}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: savingAction !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={14} />
            {savingAction === 'companyInfo' ? 'Saving...' : 'Save Company Info'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Company Tagline / Main Proposition:
            </label>
            <input
              type="text"
              value={config?.companyInfo?.tagline || ''}
              onChange={(e) => handleCompanyChange('tagline', e.target.value)}
              placeholder="e.g. Engineering Pure Water for Homes & Enterprises"
              style={{
                width: '100%',
                backgroundColor: '#182235',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Region / Language Selector Text:
            </label>
            <input
              type="text"
              value={config?.companyInfo?.regionText || ''}
              onChange={(e) => handleCompanyChange('regionText', e.target.value)}
              placeholder="e.g. India | English"
              style={{
                width: '100%',
                backgroundColor: '#182235',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Company Business Description (Water Treatment / Softening Platform):
            </label>
            <textarea
              rows={3}
              value={config?.companyInfo?.description || ''}
              onChange={(e) => handleCompanyChange('description', e.target.value)}
              placeholder="AVXBS is an advanced water treatment and softening solutions engineering platform..."
              style={{
                width: '100%',
                backgroundColor: '#182235',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Copyright Notice:
            </label>
            <input
              type="text"
              value={config?.companyInfo?.copyrightText || ''}
              onChange={(e) => handleCompanyChange('copyrightText', e.target.value)}
              placeholder="e.g. © 2026 AVXBS Solutions. All Rights Reserved."
              style={{
                width: '100%',
                backgroundColor: '#182235',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Badge Tagline (Right Top Pill):
            </label>
            <input
              type="text"
              value={config?.companyInfo?.badgeText || ''}
              onChange={(e) => handleCompanyChange('badgeText', e.target.value)}
              placeholder="e.g. Engineering Pure Water for Homes & Enterprises"
              style={{
                width: '100%',
                backgroundColor: '#182235',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: NAVIGATION COLUMNS ================= */}
      <section style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              2. Navigation Columns (Solutions, Products, Support, Company)
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleAddColumn}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Add Column
            </button>
            <button
              type="button"
              onClick={() => handleSaveSection('columns', config.columns)}
              disabled={savingAction !== null}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: savingAction !== null ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={14} />
              {savingAction === 'columns' ? 'Saving...' : 'Save Columns'}
            </button>
          </div>
        </div>

        {/* Dynamic Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {config?.columns?.map((col, colIdx) => (
            <div
              key={col._id || `col-${colIdx}`}
              style={{
                backgroundColor: '#131d32',
                border: `1px solid ${col.isActive ? '#334155' : '#475569'}`,
                borderRadius: '12px',
                padding: '18px',
                opacity: col.isActive ? 1 : 0.65,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Column Title, Reorder & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', minWidth: 0 }}>
                <input
                  type="text"
                  value={col.title}
                  onChange={(e) => handleColumnTitleChange(colIdx, e.target.value)}
                  placeholder="Column Title"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    color: '#f8fafc',
                    fontWeight: '700',
                    fontSize: '0.94rem',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />

                {/* Move Column Left / Right */}
                <button
                  type="button"
                  onClick={() => handleMoveColumn(colIdx, 'left')}
                  disabled={colIdx === 0}
                  title="Move Column Left"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colIdx === 0 ? '#475569' : '#cbd5e1',
                    cursor: colIdx === 0 ? 'not-allowed' : 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <MoveUp size={16} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveColumn(colIdx, 'right')}
                  disabled={colIdx === config.columns.length - 1}
                  title="Move Column Right"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colIdx === config.columns.length - 1 ? '#475569' : '#cbd5e1',
                    cursor: colIdx === config.columns.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <MoveDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                </button>

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => handleColumnVisibility(colIdx)}
                  title={col.isActive ? 'Hide Column' : 'Show Column'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: col.isActive ? '#22c55e' : '#94a3b8',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {col.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>

                {/* Delete Column */}
                <button
                  type="button"
                  onClick={() => handleRemoveColumn(colIdx)}
                  title="Delete Column"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Links list in column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px', minWidth: 0 }}>
                {col.links?.map((link, linkIdx) => (
                  <div
                    key={link._id || `col-${colIdx}-link-${linkIdx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#1e293b',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: `1px solid ${link.isActive !== false ? '#293548' : '#3f4b5d'}`,
                      opacity: link.isActive !== false ? 1 : 0.6,
                      minWidth: 0
                    }}
                  >
                    {/* Link Label */}
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#f1f5f9',
                        fontSize: '0.82rem',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    />

                    {/* Link URL */}
                    <input
                      type="text"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'url', e.target.value)}
                      style={{
                        flex: 1.2,
                        minWidth: 0,
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        fontSize: '0.82rem',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                    />

                    {/* Move Up / Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveLink(colIdx, linkIdx, 'up')}
                      disabled={linkIdx === 0}
                      title="Move Link Up"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: linkIdx === 0 ? '#475569' : '#cbd5e1',
                        cursor: linkIdx === 0 ? 'not-allowed' : 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <MoveUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveLink(colIdx, linkIdx, 'down')}
                      disabled={linkIdx === col.links.length - 1}
                      title="Move Link Down"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: linkIdx === col.links.length - 1 ? '#475569' : '#cbd5e1',
                        cursor: linkIdx === col.links.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <MoveDown size={13} />
                    </button>

                    {/* Toggle Active */}
                    <button
                      type="button"
                      onClick={() => handleToggleLinkActive(colIdx, linkIdx)}
                      title={link.isActive !== false ? 'Disable Link' : 'Enable Link'}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: link.isActive !== false ? '#22c55e' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {link.isActive !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>

                    {/* Delete Link */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(colIdx, linkIdx)}
                      title="Delete Link"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Link Button */}
              <button
                type="button"
                onClick={() => handleAddLink(colIdx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px dashed #38bdf8',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: 'auto'
                }}
              >
                <Plus size={14} /> Add Link to {col.title}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION 3: SOCIAL MEDIA LINKS ================= */}
      <section style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Share2 size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
              3. Stay Connected (Social Media Channels)
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick add dropdown for standard platforms */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddSocial(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              style={{
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="" disabled>+ Add Platform...</option>
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleSaveSection('socialLinks', config.socialLinks)}
              disabled={savingAction !== null}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: savingAction !== null ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={14} />
              {savingAction === 'socialLinks' ? 'Saving...' : 'Save Social Links'}
            </button>
          </div>
        </div>

        {/* Dynamic Social Links Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          alignItems: 'stretch'
        }}>
          {config?.socialLinks?.map((s, sIdx) => (
            <div
              key={s._id || `social-${sIdx}`}
              style={{
                backgroundColor: '#1e293b',
                border: `1px solid ${s.isActive !== false ? '#334155' : '#475569'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: s.isActive !== false ? 1 : 0.65,
                minWidth: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <select
                value={s.platform}
                onChange={(e) => handleSocialChange(sIdx, 'platform', e.target.value)}
                style={{
                  width: '125px',
                  flexShrink: 0,
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  outline: 'none'
                }}
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="https://..."
                value={s.url}
                onChange={(e) => handleSocialChange(sIdx, 'url', e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: '#0f172a',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  fontSize: '0.84rem',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  outline: 'none'
                }}
              />

              {/* Move Social Up / Down */}
              <button
                type="button"
                onClick={() => handleMoveSocial(sIdx, 'up')}
                disabled={sIdx === 0}
                title="Move Up"
                style={{
                  background: 'none',
                  border: 'none',
                  color: sIdx === 0 ? '#475569' : '#cbd5e1',
                  cursor: sIdx === 0 ? 'not-allowed' : 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <MoveUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSocial(sIdx, 'down')}
                disabled={sIdx === config.socialLinks.length - 1}
                title="Move Down"
                style={{
                  background: 'none',
                  border: 'none',
                  color: sIdx === config.socialLinks.length - 1 ? '#475569' : '#cbd5e1',
                  cursor: sIdx === config.socialLinks.length - 1 ? 'not-allowed' : 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <MoveDown size={14} />
              </button>

              {/* Toggle Visibility */}
              <button
                type="button"
                onClick={() => handleToggleSocialActive(sIdx)}
                title={s.isActive !== false ? 'Disable Social Link' : 'Enable Social Link'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: s.isActive !== false ? '#22c55e' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                {s.isActive !== false ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleRemoveSocial(sIdx)}
                title="Delete Social Link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
