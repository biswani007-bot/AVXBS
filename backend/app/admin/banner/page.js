'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Check
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function SecondaryBannerAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Banner configuration state
  const [formData, setFormData] = useState({
    imageUrl: '',
    altText: 'AVXBS Advanced Water Purification Solutions',
    title: 'Pure Water, Pure Excellence',
    subtitle: 'Discover next-generation filtration and water softening technology for residential and commercial facilities.',
    linkUrl: '#water-softener-inquiry-section',
    buttonText: 'Explore Solutions',
    isActive: true,
    updatedAt: null,
  });

  // Pending file & preview
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingMeta, setPendingMeta] = useState({
    name: '',
    size: 0,
    width: 0,
    height: 0,
  });

  // Viewport simulation mode in preview: 'desktop' | 'tablet' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const fileInputRef = useRef(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  // Fetch current secondary banner setting
  const fetchBannerSetting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings?key=secondary_banner');
      const data = await res.json();
      if (res.ok && data.success) {
        const val = data.data?.value || data.setting || {};
        if (typeof val === 'object' && val !== null) {
          setFormData({
            imageUrl: val.imageUrl || val.url || '',
            altText: val.altText || val.imageAlt || 'AVXBS Advanced Water Purification Solutions',
            title: val.title !== undefined ? val.title : 'Pure Water, Pure Excellence',
            subtitle: val.subtitle !== undefined ? val.subtitle : 'Discover next-generation filtration and water softening technology.',
            linkUrl: val.linkUrl || '#water-softener-inquiry-section',
            buttonText: val.buttonText || 'Explore Solutions',
            isActive: val.isActive !== undefined ? Boolean(val.isActive) : (val.isEnabled !== undefined ? Boolean(val.isEnabled) : true),
            updatedAt: val.updatedAt || null,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load secondary banner settings:', err);
      showFeedback('error', 'Failed to load secondary banner settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerSetting();
  }, []);

  // Handle local file selection with validation
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    const fileName = file.name || '';
    const fileExt = (fileName.substring(fileName.lastIndexOf('.')) || '').toLowerCase();
    const fileMime = (file.type || '').toLowerCase();

    // Format validation
    const isValidExt = ALLOWED_EXTENSIONS.includes(fileExt);
    const isValidMime = ALLOWED_MIME_TYPES.includes(fileMime);

    if (!isValidExt && !isValidMime) {
      showFeedback(
        'error',
        `Invalid file type "${fileExt || fileMime}". Only JPG, PNG, WebP, and SVG images are allowed.`
      );
      return;
    }

    // Size validation (<= 5MB)
    if (file.size > MAX_BANNER_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showFeedback(
        'error',
        `Banner file size exceeds 5MB limit. Selected file is ${sizeMB} MB. Please select an image under 5MB.`
      );
      return;
    }

    // Revoke old blob URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPreviewUrl(objectUrl);

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      setPendingMeta({
        name: file.name,
        size: file.size,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
    };
    img.onerror = () => {
      setPendingMeta({
        name: file.name,
        size: file.size,
        width: 0,
        height: 0,
      });
    };
    img.src = objectUrl;

    showFeedback('success', `Banner image "${file.name}" selected. Inspect the preview below and click Save Changes.`);
  };

  // Discard pending file
  const handleDiscardPending = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl('');
    setPendingMeta({ name: '', size: 0, width: 0, height: 0 });
  };

  // Save banner configuration
  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // If a pending new file was chosen, upload it to /api/uploads first
      if (pendingFile) {
        const uploadBody = new FormData();
        uploadBody.append('file', pendingFile);
        uploadBody.append('category', 'banners');
        uploadBody.append('altText', formData.altText || '');

        const uploadRes = await fetch('/api/uploads', {
          method: 'POST',
          body: uploadBody,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || (!uploadData.url && !uploadData.filePath)) {
          throw new Error(uploadData.error || 'Failed to upload banner image');
        }

        finalImageUrl = uploadData.url || uploadData.filePath;
      }

      // Persist to SiteSetting key secondary_banner
      const settingPayload = {
        key: 'secondary_banner',
        group: 'banners',
        description: 'Promotional banner section below Tap Water image section',
        value: {
          imageUrl: finalImageUrl,
          url: finalImageUrl,
          altText: formData.altText.trim(),
          imageAlt: formData.altText.trim(),
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim(),
          linkUrl: formData.linkUrl.trim(),
          buttonText: formData.buttonText.trim(),
          isActive: Boolean(formData.isActive),
          isEnabled: Boolean(formData.isActive),
          updatedAt: new Date().toISOString(),
        },
      };

      const saveRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingPayload),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || 'Failed to save banner setting');
      }

      // Clean up object URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPendingFile(null);
      setPreviewUrl('');
      setPendingMeta({ name: '', size: 0, width: 0, height: 0 });

      // Refresh state
      await fetchBannerSetting();
      showFeedback('success', 'Secondary banner settings saved successfully! Changes apply to public website immediately.');
    } catch (err) {
      console.error('Error saving secondary banner:', err);
      showFeedback('error', err.message || 'Failed to save secondary banner settings');
    } finally {
      setSaving(false);
    }
  };

  // Remove banner image
  const handleDeleteImage = () => {
    if (window.confirm('Are you sure you want to remove the current secondary banner image?')) {
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
      handleDiscardPending();
      showFeedback('success', 'Banner image cleared. Click Save Changes to apply.');
    }
  };

  const activeImage = previewUrl || formData.imageUrl;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '70px' }}>
      {/* Toast Alert */}
      {feedback.message && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            backgroundColor: feedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} color="#34d399" /> : <AlertCircle size={18} color="#f87171" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              Homepage Presentation
            </span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Secondary Banner Section (~80% Hero Height)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Secondary Banner Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Manage the promotional banner section located below the Tap Water image section with live preview and database persistence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchBannerSetting}
            disabled={loading}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBanner}
            disabled={saving}
            style={{
              padding: '10px 24px',
              backgroundColor: saving ? '#475569' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          Loading secondary banner settings...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* SECTION STATUS TOGGLE CARD */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: formData.isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Secondary Banner Visibility & Active Status
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: formData.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: formData.isActive ? '#34d399' : '#f87171',
                    border: `1px solid ${formData.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  {formData.isActive ? 'Active on Public Site' : 'Inactive (Hidden)'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                When active, this banner displays immediately after the Tap Water image section (~80% of hero banner height).
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                border: formData.isActive ? '1px solid #10b981' : '1px solid #334155',
                backgroundColor: formData.isActive ? '#065f46' : '#1e293b',
                color: formData.isActive ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.2s ease',
              }}
            >
              {formData.isActive ? (
                <>
                  <Eye size={15} />
                  <span>Toggle to Inactive</span>
                </>
              ) : (
                <>
                  <EyeOff size={15} />
                  <span>Toggle to Active</span>
                </>
              )}
            </button>
          </div>

          {/* TWO COLUMN GRID: BANNER UPLOAD & TEXT CONFIGURATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '24px', alignItems: 'start' }}>
            
            {/* LEFT COLUMN: Image Upload / Replace Card */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: '#38bdf8' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Banner Image Asset
                  </h2>
                </div>
                {pendingFile && (
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                    Pending Save
                  </span>
                )}
              </div>

              {/* Current / Selected Image Thumbnail Box */}
              <div
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    height: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#182235',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeImage ? (
                    <img
                      src={activeImage}
                      alt={formData.altText || 'Banner Preview'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '13px' }}>No banner image configured</div>
                    </div>
                  )}
                </div>

                {activeImage && (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', wordBreak: 'break-all' }}>
                    <span style={{ color: '#64748b' }}>Source: </span>
                    <code>{pendingFile ? `Local: ${pendingFile.name}` : formData.imageUrl}</code>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Upload size={15} />
                  <span>{activeImage ? 'Replace Banner Image' : 'Upload Banner Image'}</span>
                </button>

                {activeImage && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    title="Remove banner image"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Image Alt Text */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Image Alt Description (SEO & Accessibility):
                </label>
                <input
                  type="text"
                  value={formData.altText}
                  onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="e.g. AVXBS Water Filtration Facility Banner"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Typography & Action Destination */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
                <Sparkles size={18} style={{ color: '#38bdf8' }} />
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Banner Content & Call-to-Action
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                    Headline, descriptive subtitle, and button destination overlaying the banner.
                  </p>
                </div>
              </div>

              {/* Title / Headline */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Banner Headline:
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Pure Water, Pure Excellence"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Subtitle / Description */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Banner Subtitle / Description:
                </label>
                <textarea
                  rows={3}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Discover next-generation filtration technology for your facility"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Grid: Button Text & Link URL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Button Label:
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="e.g. Explore Solutions"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Destination Link URL:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      placeholder="#water-softener-inquiry-section or /contact"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 30px',
                        backgroundColor: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* INTERACTIVE PREVIEW BEFORE SAVING: SIMULATOR SECTION */}
          {activeImage && (
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Live Banner Preview (~80% Hero Height Simulator)
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                    Inspect responsive layout across desktop, tablet, and mobile viewports.
                  </p>
                </div>

                {/* Device Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#090d16', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewDevice === 'desktop' ? '#1e293b' : 'transparent',
                      color: previewDevice === 'desktop' ? '#38bdf8' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Monitor size={14} />
                    <span>Desktop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewDevice === 'tablet' ? '#1e293b' : 'transparent',
                      color: previewDevice === 'tablet' ? '#38bdf8' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Tablet size={14} />
                    <span>Tablet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewDevice === 'mobile' ? '#1e293b' : 'transparent',
                      color: previewDevice === 'mobile' ? '#38bdf8' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Smartphone size={14} />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Simulator Outer Frame */}
              <div
                style={{
                  backgroundColor: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: previewDevice === 'desktop' ? '100%' : (previewDevice === 'tablet' ? '768px' : '380px'),
                    maxWidth: '100%',
                    height: previewDevice === 'desktop' ? '380px' : (previewDevice === 'tablet' ? '300px' : '240px'),
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    border: '1px solid #334155',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Banner Image Background */}
                  <img
                    src={activeImage}
                    alt={formData.altText}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />

                  {/* Dark Gradient Overlay for text contrast */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, rgba(9, 13, 22, 0.85) 0%, rgba(9, 13, 22, 0.4) 60%, rgba(9, 13, 22, 0.2) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: previewDevice === 'mobile' ? '20px' : '40px 50px',
                    }}
                  >
                    <div style={{ maxWidth: previewDevice === 'mobile' ? '100%' : '520px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#38bdf8',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        AVXBS Specialized Solutions
                      </span>

                      {formData.title && (
                        <h3
                          style={{
                            fontSize: previewDevice === 'mobile' ? '18px' : (previewDevice === 'tablet' ? '24px' : '30px'),
                            fontWeight: 800,
                            color: '#ffffff',
                            margin: '0 0 10px 0',
                            lineHeight: 1.2,
                          }}
                        >
                          {formData.title}
                        </h3>
                      )}

                      {formData.subtitle && (
                        <p
                          style={{
                            fontSize: previewDevice === 'mobile' ? '12px' : '14px',
                            color: '#cbd5e1',
                            margin: '0 0 16px 0',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: previewDevice === 'mobile' ? 2 : 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {formData.subtitle}
                        </p>
                      )}

                      {formData.buttonText && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: previewDevice === 'mobile' ? '6px 14px' : '8px 18px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            borderRadius: '6px',
                            fontSize: previewDevice === 'mobile' ? '12px' : '13px',
                            fontWeight: 700,
                          }}
                        >
                          <span>{formData.buttonText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
