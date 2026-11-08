'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Image as ImageIcon,
  Type,
  Edit2
} from 'lucide-react';

export default function InquirySectionAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    isEnabled: true,
    imageUrl: '/images/hero-enhanced/pure-faucet-glass.jpg',
    imageAlt: 'Premium modern water purification faucet pouring crystal-clear drinking water into a transparent glass goblet',
    line1Text1: 'Now',
    line1Text2: 'Just',
    line2Text1: 'Put Your',
    line2Text2: 'Inquiry',
    line3Text1: 'And Get the',
    line3Text2: 'Solution.',
    line4Text1: 'At',
    line4Text2: 'Door step',
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inquiry-section');
      const data = await res.json();
      if (data.success && data.data) {
        setFormData((prev) => ({
          ...prev,
          isEnabled: data.data.isEnabled !== false,
          imageUrl: data.data.imageUrl || '/images/hero-enhanced/pure-faucet-glass.jpg',
          imageAlt: data.data.imageAlt || '',
          line1Text1: data.data.line1Text1 || 'Now',
          line1Text2: data.data.line1Text2 || 'Just',
          line2Text1: data.data.line2Text1 || 'Put Your',
          line2Text2: data.data.line2Text2 || 'Inquiry',
          line3Text1: data.data.line3Text1 || 'And Get the',
          line3Text2: data.data.line3Text2 || 'Solution.',
          line4Text1: data.data.line4Text1 || 'At',
          line4Text2: data.data.line4Text2 || 'Door step',
        }));
      }
    } catch (err) {
      console.error('Failed to load inquiry section settings:', err);
      showFeedback('error', 'Failed to load inquiry section settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Upload or replace image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'inquiry');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (res.ok && (data.url || data.filePath)) {
        const uploadedPath = data.url || data.filePath;
        setFormData((prev) => ({ ...prev, imageUrl: uploadedPath }));
        showFeedback('success', 'Image uploaded successfully! Click Save Changes to apply.');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      showFeedback('error', err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete image with confirmation (reverts to default)
  const handleDeleteImage = () => {
    if (window.confirm('Are you sure you want to delete this custom image and restore the default water purification photo?')) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: '/images/hero-enhanced/pure-faucet-glass.jpg',
      }));
      showFeedback('success', 'Image reset to default placeholder. Click Save Changes to apply.');
    }
  };

  // Save changes
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/inquiry-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Homepage Inquiry Section saved and updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      showFeedback('error', err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', paddingBottom: '70px' }}>
      {/* Toast Alert */}
      {feedback.message && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
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
          {feedback.type === 'success' ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#f87171" />}
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
            <span style={{ color: '#64748b', fontSize: '13px' }}>Promotional Inquiry Section</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Homepage Inquiry Section Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Manage the AI product image and 4-line brand heading typography with instant database persistence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchConfig}
            style={{
              padding: '10px 16px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleSubmit}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          Loading inquiry section settings...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '28px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: SECTION TOGGLE & ESSENTIAL IMAGE MANAGEMENT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section Visibility & Enable/Disable Control */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  Section Visibility
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Enable or disable this promotional section on the public homepage.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  style={{ accentColor: '#0284c7', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: formData.isEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: formData.isEnabled ? '#4ade80' : '#f87171',
                    border: `1px solid ${formData.isEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  {formData.isEnabled ? 'Section Enabled' : 'Section Disabled'}
                </span>
              </label>
            </div>

            {/* AI Image Upload, Replace & Delete Controls */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: '#38bdf8' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    AI-Generated Product Image
                  </h2>
                </div>
                {uploading && (
                  <span style={{ fontSize: '12px', color: '#38bdf8' }}>Uploading image...</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Image Preview Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: '#182235',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                  }}
                >
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={formData.imageUrl}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = '/images/hero-enhanced/hero-pure-drinking-water.jpg';
                      }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Current Image Reference:
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="/images/... or https://..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Edit / Replace & Delete Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Upload size={15} />
                    <span>{uploading ? 'Uploading...' : 'Edit / Replace Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    title="Delete custom image and reset to default"
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#1e293b',
                      color: '#f87171',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Delete Image</span>
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Image Accessibility Description (Alt Text):
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    placeholder="Enter image description for SEO and screen readers"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BRAND HEADING MANAGEMENT (4 LINES) */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #1e293b' }}>
              <Type size={18} style={{ color: '#38bdf8' }} />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Brand Heading Management
                </h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                  Official AVXBS brand colors and gradients are applied automatically.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* LINE 1: Now Just */}
              <div style={{ backgroundColor: '#182235', padding: '16px', borderRadius: '10px', border: '1px solid #283548' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Line 1: Lead Words
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dark Charcoal + Brand Gradient</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Primary Word:
                    </label>
                    <input
                      type="text"
                      value={formData.line1Text1}
                      onChange={(e) => setFormData({ ...formData, line1Text1: e.target.value })}
                      placeholder="Now"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Highlighted Word:
                    </label>
                    <input
                      type="text"
                      value={formData.line1Text2}
                      onChange={(e) => setFormData({ ...formData, line1Text2: e.target.value })}
                      placeholder="Just"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* LINE 2: Put Your Inquiry */}
              <div style={{ backgroundColor: '#182235', padding: '16px', borderRadius: '10px', border: '1px solid #283548' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Line 2: Action Prompt
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dark Charcoal + Brand Gradient</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Primary Words:
                    </label>
                    <input
                      type="text"
                      value={formData.line2Text1}
                      onChange={(e) => setFormData({ ...formData, line2Text1: e.target.value })}
                      placeholder="Put Your"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Highlighted Word:
                    </label>
                    <input
                      type="text"
                      value={formData.line2Text2}
                      onChange={(e) => setFormData({ ...formData, line2Text2: e.target.value })}
                      placeholder="Inquiry"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* LINE 3: And Get the Solution. */}
              <div style={{ backgroundColor: '#182235', padding: '16px', borderRadius: '10px', border: '1px solid #283548' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Line 3: Solution Promise
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dark Charcoal + Gradient & Underline</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Primary Words:
                    </label>
                    <input
                      type="text"
                      value={formData.line3Text1}
                      onChange={(e) => setFormData({ ...formData, line3Text1: e.target.value })}
                      placeholder="And Get the"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Highlighted Word:
                    </label>
                    <input
                      type="text"
                      value={formData.line3Text2}
                      onChange={(e) => setFormData({ ...formData, line3Text2: e.target.value })}
                      placeholder="Solution."
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* LINE 4: At Door step */}
              <div style={{ backgroundColor: '#182235', padding: '16px', borderRadius: '10px', border: '1px solid #283548' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Line 4: Doorstep Delivery
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dark Charcoal + Brand Blue Accent</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Primary Word:
                    </label>
                    <input
                      type="text"
                      value={formData.line4Text1}
                      onChange={(e) => setFormData({ ...formData, line4Text1: e.target.value })}
                      placeholder="At"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      Highlighted Words:
                    </label>
                    <input
                      type="text"
                      value={formData.line4Text2}
                      onChange={(e) => setFormData({ ...formData, line4Text2: e.target.value })}
                      placeholder="Door step"
                      style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Save Button Row */}
              <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    padding: '11px 28px',
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
                    transition: 'all 0.2s',
                  }}
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
