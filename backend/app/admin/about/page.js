'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  X, 
  Edit3, 
  Image as ImageIcon 
} from 'lucide-react';

export default function AdminAboutPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal state for adding/editing a solution card
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [editingSolutionIndex, setEditingSolutionIndex] = useState(null);
  const [solutionForm, setSolutionForm] = useState({
    title: '',
    description: '',
    icon: 'Droplets',
  });

  // Modal state for adding/editing a metric
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [editingMetricIndex, setEditingMetricIndex] = useState(null);
  const [metricForm, setMetricForm] = useState({
    value: '',
    label: '',
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/about-config?mode=admin');
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to load About Us configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save changes directly to database
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/about-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header: config.header,
          intro: config.intro,
          missionVision: config.missionVision,
          solutions: config.solutions,
          bottomCta: config.bottomCta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      showMessage('success', 'Changes saved successfully to the database!');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Upload intro image
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'about');

    setUploadingImage(true);
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image upload failed');

      setConfig((prev) => ({
        ...prev,
        intro: {
          ...prev.intro,
          image: data.url,
        },
      }));
      showMessage('success', 'Image uploaded successfully!');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Solution Cards Handlers
  const openAddSolution = () => {
    setEditingSolutionIndex(null);
    setSolutionForm({ title: '', description: '', icon: 'Droplets' });
    setIsSolutionModalOpen(true);
  };

  const openEditSolution = (index) => {
    const item = config.solutions.cards[index];
    setEditingSolutionIndex(index);
    setSolutionForm({
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'Droplets',
    });
    setIsSolutionModalOpen(true);
  };

  const handleDeleteSolution = (index) => {
    if (!confirm('Are you sure you want to delete this solution card?')) return;
    const cards = [...(config.solutions?.cards || [])];
    cards.splice(index, 1);
    setConfig((prev) => ({
      ...prev,
      solutions: { ...prev.solutions, cards },
    }));
  };

  const handleSaveSolutionModal = (e) => {
    e.preventDefault();
    const cards = [...(config.solutions?.cards || [])];
    if (editingSolutionIndex !== null) {
      cards[editingSolutionIndex] = {
        ...cards[editingSolutionIndex],
        ...solutionForm,
      };
    } else {
      cards.push({
        _id: `sol-${Date.now()}`,
        ...solutionForm,
        order: cards.length + 1,
        isActive: true,
      });
    }
    setConfig((prev) => ({
      ...prev,
      solutions: { ...prev.solutions, cards },
    }));
    setIsSolutionModalOpen(false);
  };

  // Metrics Handlers
  const openAddMetric = () => {
    setEditingMetricIndex(null);
    setMetricForm({ value: '', label: '' });
    setIsMetricModalOpen(true);
  };

  const openEditMetric = (index) => {
    const item = config.intro.metrics[index];
    setEditingMetricIndex(index);
    setMetricForm({
      value: item.value || '',
      label: item.label || '',
    });
    setIsMetricModalOpen(true);
  };

  const handleDeleteMetric = (index) => {
    if (!confirm('Are you sure you want to delete this metric?')) return;
    const metrics = [...(config.intro?.metrics || [])];
    metrics.splice(index, 1);
    setConfig((prev) => ({
      ...prev,
      intro: { ...prev.intro, metrics },
    }));
  };

  const handleSaveMetricModal = (e) => {
    e.preventDefault();
    const metrics = [...(config.intro?.metrics || [])];
    if (editingMetricIndex !== null) {
      metrics[editingMetricIndex] = {
        ...metrics[editingMetricIndex],
        ...metricForm,
      };
    } else {
      metrics.push({
        _id: `met-${Date.now()}`,
        ...metricForm,
        order: metrics.length + 1,
        isActive: true,
      });
    }
    setConfig((prev) => ({
      ...prev,
      intro: { ...prev.intro, metrics },
    }));
    setIsMetricModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
        Loading About Us content from MongoDB...
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
        No About Us configuration found in database.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Sticky Header with Title and Primary Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1e293b',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            About Us Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Manage the About Us page content. All saved changes immediately update the live database.
          </p>
        </div>

        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#86efac' : '#fca5a5',
            fontSize: '13px',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: Page Header */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
          Page Header
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Page Title
            </label>
            <input
              type="text"
              value={config.header?.pageTitle || ''}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, pageTitle: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Highlight Word
            </label>
            <input
              type="text"
              value={config.header?.highlightWord || ''}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, highlightWord: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Header Subtitle
            </label>
            <input
              type="text"
              value={config.header?.subtitle || ''}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, subtitle: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
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

      {/* SECTION 2: Company Overview & Image */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
          Company Overview & Image
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Section Heading
            </label>
            <input
              type="text"
              value={config.intro?.sectionHeading || ''}
              onChange={(e) => setConfig({ ...config, intro: { ...config.intro, sectionHeading: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Main Overview Paragraph
            </label>
            <textarea
              rows={3}
              value={config.intro?.leadParagraph || ''}
              onChange={(e) => setConfig({ ...config, intro: { ...config.intro, leadParagraph: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Image Upload / URL */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Overview Image
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="/images/about/about-water-treatment.jpg"
                value={config.intro?.image || ''}
                onChange={(e) => setConfig({ ...config, intro: { ...config.intro, image: e.target.value } })}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  borderRadius: '6px',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <Upload size={14} />
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {config.intro?.image && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={config.intro.image}
                  alt="Overview preview"
                  style={{ maxHeight: '120px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>
                Key Performance Metrics
              </span>
              <button
                type="button"
                onClick={openAddMetric}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                Add Metric
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {(config.intro?.metrics || []).map((metric, idx) => (
                <div
                  key={metric._id || idx}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{metric.value}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{metric.label}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditMetric(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMetric(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Mission & Vision */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
          Mission & Vision Statements
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {(config.missionVision?.cards || []).map((card, idx) => (
            <div
              key={card._id || idx}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Card Title
                </label>
                <input
                  type="text"
                  value={card.title}
                  onChange={(e) => {
                    const cards = [...config.missionVision.cards];
                    cards[idx].title = e.target.value;
                    setConfig({ ...config, missionVision: { ...config.missionVision, cards } });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={4}
                  value={card.description}
                  onChange={(e) => {
                    const cards = [...config.missionVision.cards];
                    cards[idx].description = e.target.value;
                    setConfig({ ...config, missionVision: { ...config.missionVision, cards } });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Solution Cards */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Water Treatment Solution Cards
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
              Add, edit, or delete solution overview cards displayed on the About Us page.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddSolution}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Add Solution Card
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {(config.solutions?.cards || []).map((card, idx) => (
            <div
              key={card._id || idx}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                  {card.description}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <button
                  type="button"
                  onClick={() => openEditSolution(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    color: '#cbd5e1',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSolution(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid #7f1d1d',
                    borderRadius: '4px',
                    color: '#f87171',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: Bottom Call to Action */}
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 16px' }}>
          Bottom Call to Action (CTA)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              CTA Heading
            </label>
            <input
              type="text"
              value={config.bottomCta?.heading || ''}
              onChange={(e) => setConfig({ ...config, bottomCta: { ...config.bottomCta, heading: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Button Text
            </label>
            <input
              type="text"
              value={config.bottomCta?.primaryBtnText || ''}
              onChange={(e) => setConfig({ ...config, bottomCta: { ...config.bottomCta, primaryBtnText: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              CTA Description
            </label>
            <textarea
              rows={2}
              value={config.bottomCta?.description || ''}
              onChange={(e) => setConfig({ ...config, bottomCta: { ...config.bottomCta, description: e.target.value } })}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>

      {/* SOLUTION CARD MODAL (Add / Edit) */}
      {isSolutionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {editingSolutionIndex !== null ? 'Edit Solution Card' : 'Add Solution Card'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSolutionModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSolutionModal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={solutionForm.title}
                    onChange={(e) => setSolutionForm({ ...solutionForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={solutionForm.description}
                    onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsSolutionModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* METRIC MODAL (Add / Edit) */}
      {isMetricModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '420px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {editingMetricIndex !== null ? 'Edit Metric' : 'Add Metric'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMetricModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMetricModal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Value (e.g. 99.8%) *
                  </label>
                  <input
                    type="text"
                    required
                    value={metricForm.value}
                    onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Label (e.g. Scale Reduction) *
                  </label>
                  <input
                    type="text"
                    required
                    value={metricForm.label}
                    onChange={(e) => setMetricForm({ ...metricForm, label: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsMetricModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
