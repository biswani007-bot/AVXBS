'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock 
} from 'lucide-react';

export default function AdminContactPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Modal for adding / editing a contact info card
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState(null);
  const [cardForm, setCardForm] = useState({
    title: '',
    content: '',
    subtext: '',
    icon: 'MapPin',
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/contact-config?mode=admin');
      const data = await res.json();
      if (data?.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to load Contact Us configuration');
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
      const res = await fetch('/api/contact-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          header: config.header,
          infoPanel: config.infoPanel,
          formConfig: config.formConfig,
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

  // Contact Info Cards Handlers
  const openAddCard = () => {
    setEditingCardIndex(null);
    setCardForm({ title: '', content: '', subtext: '', icon: 'MapPin' });
    setIsCardModalOpen(true);
  };

  const openEditCard = (index) => {
    const item = config.infoPanel.cards[index];
    setEditingCardIndex(index);
    setCardForm({
      title: item.title || '',
      content: item.content || '',
      subtext: item.subtext || '',
      icon: item.icon || 'MapPin',
    });
    setIsCardModalOpen(true);
  };

  const handleDeleteCard = (index) => {
    if (!confirm('Are you sure you want to delete this contact detail card?')) return;
    const cards = [...(config.infoPanel?.cards || [])];
    cards.splice(index, 1);
    setConfig((prev) => ({
      ...prev,
      infoPanel: { ...prev.infoPanel, cards },
    }));
  };

  const handleSaveCardModal = (e) => {
    e.preventDefault();
    const cards = [...(config.infoPanel?.cards || [])];
    if (editingCardIndex !== null) {
      cards[editingCardIndex] = {
        ...cards[editingCardIndex],
        ...cardForm,
      };
    } else {
      cards.push({
        _id: `contact-card-${Date.now()}`,
        ...cardForm,
        order: cards.length + 1,
        isActive: true,
      });
    }
    setConfig((prev) => ({
      ...prev,
      infoPanel: { ...prev.infoPanel, cards },
    }));
    setIsCardModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
        Loading Contact Us content from MongoDB...
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
        No Contact Us configuration found in database.
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
            Contact Us Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Manage contact information, office locations, helpline details, and form configuration.
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

      {/* SECTION 2: Contact Information Cards */}
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
              Contact Information & Locations
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
              Manage office address, phone helplines, email support, and operating hours.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddCard}
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
            Add Detail Card
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {(config.infoPanel?.cards || []).map((card, idx) => (
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
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                  {card.title}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  {card.content}
                </div>
                {card.subtext && (
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {card.subtext}
                  </div>
                )}
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
                  onClick={() => openEditCard(idx)}
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
                  onClick={() => handleDeleteCard(idx)}
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

      {/* SECTION 3: Consultation Form Configuration */}
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
          Consultation Request Form
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Form Heading
            </label>
            <input
              type="text"
              value={config.formConfig?.heading || ''}
              onChange={(e) => setConfig({ ...config, formConfig: { ...config.formConfig, heading: e.target.value } })}
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
              Submit Button Text
            </label>
            <input
              type="text"
              value={config.formConfig?.submitBtnText || ''}
              onChange={(e) => setConfig({ ...config, formConfig: { ...config.formConfig, submitBtnText: e.target.value } })}
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
              Form Subtitle
            </label>
            <input
              type="text"
              value={config.formConfig?.subtitle || ''}
              onChange={(e) => setConfig({ ...config, formConfig: { ...config.formConfig, subtitle: e.target.value } })}
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
              Submission Success Notification Message
            </label>
            <textarea
              rows={2}
              value={config.formConfig?.successMessage || ''}
              onChange={(e) => setConfig({ ...config, formConfig: { ...config.formConfig, successMessage: e.target.value } })}
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

      {/* DETAIL CARD MODAL (Add / Edit) */}
      {isCardModalOpen && (
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
                {editingCardIndex !== null ? 'Edit Contact Detail' : 'Add Contact Detail'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCardModal}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Card Label / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Corporate Headquarters, Toll-Free Line"
                    value={cardForm.title}
                    onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
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
                    Primary Information / Content *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 1800 200 4882 or office address"
                    value={cardForm.content}
                    onChange={(e) => setCardForm({ ...cardForm, content: e.target.value })}
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
                    Subtext / Operating Timing (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Available 24/7 or Mon-Sat 9AM-6PM"
                    value={cardForm.subtext}
                    onChange={(e) => setCardForm({ ...cardForm, subtext: e.target.value })}
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
                  onClick={() => setIsCardModalOpen(false)}
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
                  Save Detail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
