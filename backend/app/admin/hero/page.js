'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Video, 
  Image as ImageIcon,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function HeroBannerAdminPage() {
  const [slides, setSlides] = useState([]);
  const [settings, setSettings] = useState({
    autoplay: true,
    slideDuration: 3000,
    transitionDuration: 450,
    transitionEffect: 'fade',
    showNavigationArrows: true,
    showIndicators: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  // Modal / Form state for Add/Edit Slide
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    mediaType: 'image',
    mediaUrl: '',
    posterUrl: '',
    altText: '',
    isActive: true,
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Fetch slides and settings
  const fetchHeroData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hero-slides?all=true');
      const data = await res.json();
      if (data.success) {
        setSlides(data.slides || []);
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load hero banner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);

  // Open modal for new slide
  const handleAddNew = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      mediaType: 'image',
      mediaUrl: '',
      posterUrl: '',
      altText: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      mediaType: slide.mediaType || 'image',
      mediaUrl: slide.mediaUrl || '',
      posterUrl: slide.posterUrl || '',
      altText: slide.altText || '',
      isActive: slide.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Upload file (Media file: Image or MP4 video)
  const handleUploadFile = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'mediaUrl') setUploadingMedia(true);
    if (field === 'posterUrl') setUploadingPoster(true);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('category', 'hero-banner');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (res.ok && data.media?.url) {
        setFormData((prev) => {
          const next = { ...prev, [field]: data.media.url };
          if (field === 'mediaUrl') {
            if (file.type.startsWith('video/')) {
              next.mediaType = 'video';
            } else if (file.type.startsWith('image/')) {
              next.mediaType = 'image';
            }
          }
          return next;
        });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      if (field === 'mediaUrl') setUploadingMedia(false);
      if (field === 'posterUrl') setUploadingPoster(false);
      e.target.value = '';
    }
  };

  // Save slide (Create or Update)
  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!formData.mediaUrl) {
      alert('Please provide or upload a media URL');
      return;
    }

    try {
      if (editingSlide && editingSlide._id && !editingSlide._id.startsWith('default-')) {
        // Update existing
        const res = await fetch(`/api/hero-slides/${editingSlide._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchHeroData();
        } else {
          alert(data.error || 'Update failed');
        }
      } else {
        // Create new
        const res = await fetch('/api/hero-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            order: slides.length,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchHeroData();
        } else {
          alert(data.error || 'Creation failed');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save slide');
    }
  };

  // Toggle active status
  const handleToggleActive = async (slide) => {
    try {
      const res = await fetch(`/api/hero-slides/${slide._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      if (res.ok) {
        setSlides((prev) =>
          prev.map((s) => (s._id === slide._id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete slide
  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Delete this hero banner slide?')) return;
    try {
      const res = await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSlides((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move slide Up/Down
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);

    setSlides(newSlides);

    // Save reordered array to backend
    try {
      await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: newSlides.map((s, idx) => ({ id: s._id, order: idx })),
        }),
      });
    } catch (err) {
      console.error('Failed to save slide ordering:', err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Banner settings saved successfully!');
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const activeSlides = slides.filter((s) => s.isActive);
  const currentPreviewSlide = activeSlides[previewActiveIndex] || activeSlides[0] || slides[0];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ffffff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#0070ba" />
            Full-Page Hero Banner Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Configure full-width hero slideshow with photos, MP4 videos, transition timing, and admin ordering.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={handleAddNew}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#0070ba',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 112, 186, 0.4)',
            }}
          >
            <Plus size={18} /> Add Banner Slide
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: Slides & Live Preview, Right: Carousel Settings) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column */}
        <div>
          {/* Live Full-Width Banner Preview Card */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: '600' }}>Live Banner Preview (Full-Width Simulation)</h3>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {activeSlides.length} active slide{activeSlides.length === 1 ? '' : 's'}
              </span>
            </div>

            {currentPreviewSlide ? (
              <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#020617' }}>
                {currentPreviewSlide.mediaType === 'video' ? (
                  <video
                    src={currentPreviewSlide.mediaUrl}
                    poster={currentPreviewSlide.posterUrl || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={currentPreviewSlide.mediaUrl}
                    alt={currentPreviewSlide.altText || currentPreviewSlide.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {/* Badge Overlay */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {currentPreviewSlide.mediaType === 'video' ? <Video size={13} color="#38bdf8" /> : <ImageIcon size={13} color="#4ade80" />}
                  {currentPreviewSlide.title || 'Slide'}
                </div>

                {/* Slide indicator dots */}
                {activeSlides.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 2
                  }}>
                    {activeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewActiveIndex(idx)}
                        style={{
                          width: previewActiveIndex === idx ? '22px' : '8px',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: previewActiveIndex === idx ? '#ffffff' : 'rgba(255,255,255,0.4)',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          padding: 0
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', backgroundColor: '#020617', borderRadius: '8px' }}>
                No active slides to display
              </div>
            )}
          </div>

          {/* Slide Table / List */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: '600' }}>Hero Slides Sequence</h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Order determines front-page appearance</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading banner slides...</div>
            ) : slides.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                No hero slides found. Click &quot;Add Banner Slide&quot; above to add your first photo or video.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {slides.map((slide, index) => (
                  <div
                    key={slide._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: index < slides.length - 1 ? '1px solid #1e293b' : 'none',
                      backgroundColor: slide.isActive ? 'transparent' : 'rgba(15, 23, 42, 0.4)',
                      opacity: slide.isActive ? 1 : 0.6,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Media Thumbnail + Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '74px',
                        height: '46px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#020617',
                        border: '1px solid #334155',
                        flexShrink: 0,
                        position: 'relative'
                      }}>
                        {slide.mediaType === 'video' ? (
                          <>
                            <video
                              src={slide.mediaUrl}
                              poster={slide.posterUrl || undefined}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              muted
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0,0,0,0.3)'
                            }}>
                              <Play size={14} color="#ffffff" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={slide.mediaUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.92rem' }}>
                            {slide.title || 'Untitled Slide'}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            backgroundColor: slide.mediaType === 'video' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                            color: slide.mediaType === 'video' ? '#38bdf8' : '#4ade80'
                          }}>
                            {slide.mediaType.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                          {slide.mediaUrl}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Reorder, Active Toggle, Edit, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, -1)}
                        disabled={index === 0}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: index === 0 ? '#334155' : '#94a3b8',
                          cursor: index === 0 ? 'default' : 'pointer',
                          padding: '6px',
                          borderRadius: '4px'
                        }}
                        title="Move Up"
                      >
                        <MoveUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(index, 1)}
                        disabled={index === slides.length - 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: index === slides.length - 1 ? '#334155' : '#94a3b8',
                          cursor: index === slides.length - 1 ? 'default' : 'pointer',
                          padding: '6px',
                          borderRadius: '4px'
                        }}
                        title="Move Down"
                      >
                        <MoveDown size={16} />
                      </button>

                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(slide)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: slide.isActive ? '#4ade80' : '#64748b',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={slide.isActive ? 'Active (Click to Disable)' : 'Disabled (Click to Enable)'}
                      >
                        {slide.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(slide)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #334155',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide._id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '4px'
                        }}
                        title="Delete Slide"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Banner Settings Panel */}
        <div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#f8fafc', fontWeight: '600' }}>Banner Settings</h3>

            <form onSubmit={handleSaveSettings}>
              {/* Autoplay Toggle */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#e2e8f0', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <span>Automatic Slide Playback</span>
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => setSettings({ ...settings, autoplay: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#0070ba' }}
                  />
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Slides automatically advance</span>
              </div>

              {/* Transition Effect */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.88rem', marginBottom: '6px' }}>Transition Effect</label>
                <select
                  value={settings.transitionEffect}
                  onChange={(e) => setSettings({ ...settings, transitionEffect: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                >
                  <option value="fade">Smooth Fade (Samsung style)</option>
                  <option value="slide">Horizontal Slide</option>
                </select>
              </div>

              {/* Slide Duration */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.88rem', marginBottom: '6px' }}>
                  Slide Duration ({(settings.slideDuration / 1000).toFixed(1)}s)
                </label>
                <input
                  type="range"
                  min="1500"
                  max="12000"
                  step="500"
                  value={settings.slideDuration}
                  onChange={(e) => setSettings({ ...settings, slideDuration: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#0070ba' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Time before advancing to next slide (Default: 3.0s)</span>
              </div>

              {/* Transition Duration */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.88rem', marginBottom: '6px' }}>
                  Crossfade Duration ({settings.transitionDuration}ms)
                </label>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={settings.transitionDuration}
                  onChange={(e) => setSettings({ ...settings, transitionDuration: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#0070ba' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Transition smoothness speed (Recommended: 400-500ms)</span>
              </div>

              {/* Navigation Arrows */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#e2e8f0', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <span>Show Navigation Arrows</span>
                  <input
                    type="checkbox"
                    checked={settings.showNavigationArrows}
                    onChange={(e) => setSettings({ ...settings, showNavigationArrows: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#0070ba' }}
                  />
                </label>
              </div>

              {/* Indicators */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#e2e8f0', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <span>Show Bottom Dot Indicators</span>
                  <input
                    type="checkbox"
                    checked={settings.showIndicators}
                    onChange={(e) => setSettings({ ...settings, showIndicators: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#0070ba' }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0070ba',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} /> {savingSettings ? 'Saving...' : 'Save Banner Settings'}
              </button>
            </form>
          </div>

          {/* Quick Info Callout */}
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#38bdf8', fontWeight: '600' }}>Full-Width Guidelines</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Landscape ratio 16:9 or 21:9 renders best.</li>
              <li>Images automatically adapt to edge-to-edge browser width using cover sizing.</li>
              <li>MP4 videos play inline seamlessly on desktop and mobile.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal for Add / Edit Slide */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <h2 style={{ margin: '0 0 18px 0', fontSize: '1.25rem', color: '#ffffff', fontWeight: '700' }}>
              {editingSlide ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
            </h2>

            <form onSubmit={handleSaveSlide}>
              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px' }}>Slide Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Modern Water Softener Solution"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Media Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px' }}>Media Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="mediaType"
                      value="image"
                      checked={formData.mediaType === 'image'}
                      onChange={() => setFormData({ ...formData, mediaType: 'image' })}
                      style={{ accentColor: '#0070ba' }}
                    />
                    Image (JPG / PNG / WebP)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="mediaType"
                      value="video"
                      checked={formData.mediaType === 'video'}
                      onChange={() => setFormData({ ...formData, mediaType: 'video' })}
                      style={{ accentColor: '#0070ba' }}
                    />
                    Video (MP4 / WebM)
                  </label>
                </div>
              </div>

              {/* Media URL + Upload */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px' }}>
                  {formData.mediaType === 'video' ? 'Video File URL (MP4)' : 'Image URL'}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    placeholder="/assets/hero-water-tap-glass.jpg or /uploads/..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    required
                  />
                  <label style={{
                    padding: '8px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: uploadingMedia ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}>
                    {uploadingMedia ? 'Uploading...' : 'Upload File'}
                    <input
                      type="file"
                      accept={formData.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                      onChange={(e) => handleUploadFile(e, 'mediaUrl')}
                      disabled={uploadingMedia}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Video Poster URL (if video) */}
              {formData.mediaType === 'video' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px' }}>
                    Video Poster / Fallback Image URL
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={formData.posterUrl}
                      onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                      placeholder="/assets/hero-water-tap-glass.jpg"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <label style={{
                      padding: '8px 14px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: uploadingPoster ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}>
                      {uploadingPoster ? 'Uploading...' : 'Upload Poster'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadFile(e, 'posterUrl')}
                        disabled={uploadingPoster}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Alt Text */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', marginBottom: '6px' }}>Alt Text (Accessibility)</label>
                <input
                  type="text"
                  value={formData.altText}
                  onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="e.g. Modern water filtration technology"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Active Checkbox */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#0070ba' }}
                  />
                  Enable and publish this slide on frontend
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#0070ba',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

