'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Image as ImageIcon,
  ExternalLink,
  Upload,
  RefreshCw,
  X,
  Droplets,
  ShieldCheck,
  Workflow,
  Sparkles,
  Bath,
  Layers,
  Factory,
  Filter,
  Cpu,
  Wrench,
  Settings,
  ArrowRight,
  LayoutGrid
} from 'lucide-react';

// Icon options available for Solution Cards
const ICON_OPTIONS = [
  { value: 'Droplets', label: 'Droplets (Water Purity / Softener)', icon: Droplets },
  { value: 'ShieldCheck', label: 'ShieldCheck (WTP / Defense)', icon: ShieldCheck },
  { value: 'Workflow', label: 'Workflow (Plumbing / Pipeline)', icon: Workflow },
  { value: 'Sparkles', label: 'Sparkles (Kitchen / Purifier)', icon: Sparkles },
  { value: 'Bath', label: 'Bath (Sanitary & Fittings)', icon: Bath },
  { value: 'Layers', label: 'Layers (Commercial Plants)', icon: Layers },
  { value: 'Factory', label: 'Factory (Industrial Plants)', icon: Factory },
  { value: 'Filter', label: 'Filter (Filtration Media)', icon: Filter },
  { value: 'Cpu', label: 'Cpu (Automation / RO & DM)', icon: Cpu },
  { value: 'Wrench', label: 'Wrench (Turnkey Engineering)', icon: Wrench },
  { value: 'Settings', label: 'Settings (Technical Control)', icon: Settings },
];

const renderCardIcon = (iconName, size = 18) => {
  const match = ICON_OPTIONS.find((item) => item.value === iconName);
  const IconComponent = match ? match.icon : Droplets;
  return <IconComponent size={size} />;
};

export default function MegaMenuAdminPage() {
  const [activeScope, setActiveScope] = useState('Residential'); // 'Residential' | 'Commercial'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Separate states for Residential and Commercial
  const [residentialData, setResidentialData] = useState({
    highlightsHeading: 'Residential Highlights',
    solutionsHeading: 'Residential Solutions & Systems',
    highlights: [],
    solutions: [],
  });

  const [commercialData, setCommercialData] = useState({
    highlightsHeading: 'Commercial Highlights',
    solutionsHeading: 'Commercial Solutions & Plants',
    highlights: [],
    solutions: [],
  });

  // Modal states for Highlights
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
  const [editingHighlightIndex, setEditingHighlightIndex] = useState(null);
  const [highlightForm, setHighlightForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    url: '',
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal states for Solution Cards
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [editingSolutionIndex, setEditingSolutionIndex] = useState(null);
  const [solutionForm, setSolutionForm] = useState({
    title: '',
    description: '',
    icon: 'Droplets',
    url: '',
    isActive: true,
  });

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mega-menu?all=true');
      const data = await res.json();
      if (data.success) {
        if (data.residential) {
          setResidentialData({
            highlightsHeading: data.residential.highlightsHeading || 'Residential Highlights',
            solutionsHeading: data.residential.solutionsHeading || 'Residential Solutions & Systems',
            highlights: data.residential.highlights || [],
            solutions: data.residential.solutions || [],
          });
        }
        if (data.commercial) {
          setCommercialData({
            highlightsHeading: data.commercial.highlightsHeading || 'Commercial Highlights',
            solutionsHeading: data.commercial.solutionsHeading || 'Commercial Solutions & Plants',
            highlights: data.commercial.highlights || [],
            solutions: data.commercial.solutions || [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load mega menu data:', err);
      showFeedback('error', 'Failed to load mega menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  // Cross-tab and public website cache notification
  const notifyMenuUpdated = (scope) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mega-menu-updated', { detail: { scope } }));
      try {
        localStorage.setItem('avxbs_megamenu_last_updated', Date.now().toString());
      } catch (_) {}
    }
  };

  const countActiveHighlights = (dataset) => {
    if (!dataset || !Array.isArray(dataset.highlights)) return 0;
    return dataset.highlights.filter(
      (h) => h && h.isActive !== false && Boolean(h.title && h.title.trim()) && Boolean(h.image && h.image.trim())
    ).length;
  };

  const residentialHighlightCount = countActiveHighlights(residentialData);
  const commercialHighlightCount = countActiveHighlights(commercialData);

  const currentData = activeScope === 'Residential' ? residentialData : commercialData;
  const setCurrentData = (updater) => {
    if (activeScope === 'Residential') {
      setResidentialData(updater);
    } else {
      setCommercialData(updater);
    }
  };

  // Save current scope configuration to database
  const handleSaveScope = async () => {
    setSaving(true);
    try {
      const payload = {
        scope: activeScope,
        highlightsHeading: currentData.highlightsHeading,
        solutionsHeading: currentData.solutionsHeading,
        highlights: currentData.highlights,
        solutions: currentData.solutions,
      };

      const res = await fetch('/api/mega-menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        showFeedback('success', `${activeScope} Mega Menu saved successfully!`);
        await fetchMenuData();
        notifyMenuUpdated(activeScope);
      } else {
        throw new Error(resData.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      showFeedback('error', err.message || 'Error saving menu data');
    } finally {
      setSaving(false);
    }
  };

  // ================= HIGHLIGHT CARDS HANDLERS =================
  const openAddHighlightModal = () => {
    setEditingHighlightIndex(null);
    setHighlightForm({
      title: '',
      subtitle: '',
      image: '',
      url: '',
      isActive: true,
    });
    setIsHighlightModalOpen(true);
  };

  const openEditHighlightModal = (index) => {
    setEditingHighlightIndex(index);
    const item = currentData.highlights[index];
    setHighlightForm({
      title: item.title || '',
      subtitle: item.subtitle || item.description || '',
      image: item.image || '',
      url: item.url || '',
      isActive: item.isActive !== false,
    });
    setIsHighlightModalOpen(true);
  };

  const handleUploadHighlightImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setHighlightForm((prev) => ({ ...prev, image: data.url }));
        showFeedback('success', 'Image uploaded successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showFeedback('error', err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveHighlight = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!highlightForm.title.trim()) {
      showFeedback('error', 'Card title is required');
      return;
    }
    if (!highlightForm.image.trim()) {
      showFeedback('error', 'Card image is required');
      return;
    }

    setSaving(true);
    try {
      if (editingHighlightIndex !== null) {
        // Edit existing highlight record (preserves ID, no duplication)
        const existingItem = currentData.highlights[editingHighlightIndex];
        const targetId = existingItem.id || existingItem._id;
        const payload = {
          scope: activeScope,
          type: 'highlight',
          item: {
            ...existingItem,
            id: targetId,
            title: highlightForm.title.trim(),
            subtitle: highlightForm.subtitle.trim(),
            description: highlightForm.subtitle.trim(),
            image: highlightForm.image.trim(),
            url: highlightForm.url.trim(),
            category: activeScope,
            order: existingItem.order || (editingHighlightIndex + 1),
            isActive: highlightForm.isActive !== false,
          },
        };

        const res = await fetch('/api/mega-menu', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          showFeedback('success', `${activeScope} Highlight updated successfully!`);
          await fetchMenuData();
          setIsHighlightModalOpen(false);
          setEditingHighlightIndex(null);
          notifyMenuUpdated(activeScope);
        } else {
          throw new Error(resData.error || 'Failed to update highlight');
        }
      } else {
        // Add new highlight record with direct database persistence
        const newHighlight = {
          id: `${activeScope.toLowerCase()}-hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: highlightForm.title.trim(),
          subtitle: highlightForm.subtitle.trim(),
          description: highlightForm.subtitle.trim(),
          image: highlightForm.image.trim(),
          url: highlightForm.url.trim(),
          category: activeScope,
          order: (currentData.highlights.length || 0) + 1,
          isActive: highlightForm.isActive !== false,
        };

        const res = await fetch('/api/mega-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: activeScope,
            type: 'highlight',
            item: newHighlight,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          showFeedback('success', `${activeScope} Highlight added successfully!`);
          await fetchMenuData();
          setIsHighlightModalOpen(false);
          setEditingHighlightIndex(null);
          notifyMenuUpdated(activeScope);
        } else {
          throw new Error(resData.error || 'Failed to add highlight');
        }
      }
    } catch (err) {
      console.error('Save highlight error:', err);
      showFeedback('error', err.message || 'Error saving highlight');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHighlight = async (index) => {
    const item = currentData.highlights[index];
    if (!item) return;

    if (typeof window !== 'undefined' && !window.__TEST_BYPASS_CONFIRM__) {
      if (!window.confirm(`Are you sure you want to delete highlight "${item.title || 'this card'}"?`)) {
        return;
      }
    }

    try {
      const targetId = item.id || item._id;
      const res = await fetch(`/api/mega-menu?scope=${activeScope}&type=highlight&id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', 'Highlight card deleted successfully!');
        await fetchMenuData();
        notifyMenuUpdated(activeScope);
      } else {
        throw new Error(data.error || 'Failed to delete highlight card from database');
      }
    } catch (err) {
      console.error('Delete highlight error:', err);
      showFeedback('error', err.message || 'Failed to delete highlight card');
    }
  };

  const handleToggleHighlightActive = async (index) => {
    const item = currentData.highlights[index];
    if (!item) return;

    const newActiveState = item.isActive === false ? true : false;
    const targetId = item.id || item._id;

    try {
      const res = await fetch('/api/mega-menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: activeScope,
          type: 'highlight',
          item: {
            ...item,
            id: targetId,
            isActive: newActiveState,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Card ${newActiveState ? 'activated' : 'deactivated'} successfully`);
        await fetchMenuData();
        notifyMenuUpdated(activeScope);
      } else {
        throw new Error(data.error || 'Failed to update active state');
      }
    } catch (err) {
      console.error('Toggle active error:', err);
      showFeedback('error', err.message || 'Failed to toggle card active state');
    }
  };

  const handleMoveHighlight = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentData.highlights.length) return;
    const updated = [...currentData.highlights];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((item, idx) => {
      item.order = idx + 1;
    });

    try {
      const res = await fetch('/api/mega-menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: activeScope,
          highlightsHeading: currentData.highlightsHeading,
          solutionsHeading: currentData.solutionsHeading,
          highlights: updated,
          solutions: currentData.solutions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchMenuData();
        notifyMenuUpdated(activeScope);
      }
    } catch (err) {
      console.error('Move highlight error:', err);
    }
  };

  // ================= SOLUTIONS HANDLERS =================
  const openAddSolutionModal = () => {
    setEditingSolutionIndex(null);
    setSolutionForm({
      title: '',
      description: '',
      icon: 'Droplets',
      url: '#water-softener-inquiry-section',
      isActive: true,
    });
    setIsSolutionModalOpen(true);
  };

  const openEditSolutionModal = (index) => {
    setEditingSolutionIndex(index);
    const item = currentData.solutions[index];
    setSolutionForm({
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'Droplets',
      url: item.url || '#water-softener-inquiry-section',
      isActive: item.isActive !== false,
    });
    setIsSolutionModalOpen(true);
  };

  const handleSaveSolution = (e) => {
    e.preventDefault();
    if (!solutionForm.title.trim()) {
      showFeedback('error', 'Solution title is required');
      return;
    }
    const updated = [...currentData.solutions];
    if (editingSolutionIndex !== null) {
      updated[editingSolutionIndex] = {
        ...updated[editingSolutionIndex],
        ...solutionForm,
      };
    } else {
      updated.push({
        id: `${activeScope.toLowerCase()}-sol-${Date.now()}`,
        ...solutionForm,
        order: updated.length + 1,
      });
    }
    setCurrentData((prev) => ({ ...prev, solutions: updated }));
    setIsSolutionModalOpen(false);
  };

  const handleDeleteSolution = (index) => {
    if (!window.confirm('Delete this solution card?')) return;
    const updated = currentData.solutions.filter((_, i) => i !== index);
    setCurrentData((prev) => ({ ...prev, solutions: updated }));
  };

  const handleToggleSolutionActive = (index) => {
    const updated = [...currentData.solutions];
    updated[index].isActive = !updated[index].isActive;
    setCurrentData((prev) => ({ ...prev, solutions: updated }));
  };

  const handleMoveSolution = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentData.solutions.length) return;
    const updated = [...currentData.solutions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setCurrentData((prev) => ({ ...prev, solutions: updated }));
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Alert */}
      {feedback.message && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            backgroundColor: feedback.type === 'success' ? '#065f46' : '#991b1b',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {feedback.message}
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
          marginBottom: '24px',
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
              Navigation Architecture
            </span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Active Mega Menu System</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Mega Menu Navigation Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px', margin: 0 }}>
            Independently manage Highlights and Solution Cards for {activeScope} navigation menus.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchMenuData}
            title="Reload from database"
            style={{
              padding: '10px 14px',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={handleSaveScope}
            disabled={saving}
            style={{
              padding: '10px 22px',
              backgroundColor: saving ? '#64748b' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : `Save ${activeScope} Menu`}
          </button>
        </div>
      </div>

      {/* Scope Navigation Tabs: Residential vs Commercial */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: '#0f172a',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          marginBottom: '24px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setActiveScope('Residential')}
          data-testid="residential-scope-tab"
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeScope === 'Residential' ? '#2563eb' : 'transparent',
            color: activeScope === 'Residential' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeScope === 'Residential' ? '#60a5fa' : '#475569',
            }}
          />
          Residential Mega Menu
          <span
            className="tab-highlight-count"
            data-testid="residential-highlight-count"
            data-count={residentialHighlightCount}
            title={`${residentialHighlightCount} saved active highlights`}
            style={{
              fontSize: '11px',
              backgroundColor: activeScope === 'Residential' ? 'rgba(255,255,255,0.2)' : '#1e293b',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {residentialHighlightCount}
          </span>
        </button>

        <button
          onClick={() => setActiveScope('Commercial')}
          data-testid="commercial-scope-tab"
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeScope === 'Commercial' ? '#2563eb' : 'transparent',
            color: activeScope === 'Commercial' ? '#ffffff' : '#94a3b8',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: activeScope === 'Commercial' ? '#60a5fa' : '#475569',
            }}
          />
          Commercial Mega Menu
          <span
            className="tab-highlight-count"
            data-testid="commercial-highlight-count"
            data-count={commercialHighlightCount}
            title={`${commercialHighlightCount} saved active highlights`}
            style={{
              fontSize: '11px',
              backgroundColor: activeScope === 'Commercial' ? 'rgba(255,255,255,0.2)' : '#1e293b',
              padding: '2px 8px',
              borderRadius: '999px',
            }}
          >
            {commercialHighlightCount}
          </span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          Loading mega menu data...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Main 2-Column Management Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(360px, 1.1fr) minmax(440px, 1.4fr)',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* COLUMN 1: HIGHLIGHT CARDS (LEFT) */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Section 1: Highlights ({countActiveHighlights(currentData)})
                    </h2>
                  </div>
                  <input
                    type="text"
                    value={currentData.highlightsHeading || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentData((prev) => ({ ...prev, highlightsHeading: val }));
                    }}
                    placeholder={`${activeScope} Highlights`}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    title="Section heading displayed above the visual highlights cards"
                  />
                </div>
                <button
                  onClick={openAddHighlightModal}
                  data-testid="add-highlight-button"
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} /> Add Card
                </button>
              </div>

              {currentData.highlights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                  No highlight cards configured. Click "Add Card" to create one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentData.highlights.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="admin-highlight-card-row"
                      data-testid={`highlight-card-${item.id || idx}`}
                      data-active={item.isActive !== false}
                      style={{
                        backgroundColor: item.isActive === false ? '#131b2e' : '#182235',
                        border: '1px solid #283548',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        opacity: item.isActive === false ? 0.6 : 1,
                      }}
                    >
                      {/* Thumbnail Image */}
                      <div
                        style={{
                          width: '70px',
                          height: '52px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#090d16',
                          flexShrink: 0,
                          border: '1px solid #334155',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = '/assets/water-softener-system.jpg';
                          }}
                        />
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#f1f5f9',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '2px',
                          }}
                        >
                          {item.subtitle || 'No subtitle'}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleMoveHighlight(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === 0 ? '#334155' : '#94a3b8',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                          }}
                        >
                          <MoveUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveHighlight(idx, 'down')}
                          disabled={idx === currentData.highlights.length - 1}
                          title="Move Down"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === currentData.highlights.length - 1 ? '#334155' : '#94a3b8',
                            cursor: idx === currentData.highlights.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                          }}
                        >
                          <MoveDown size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleHighlightActive(idx)}
                          data-testid={`toggle-highlight-${item.id || idx}`}
                          title={item.isActive === false ? 'Enable Card' : 'Disable Card'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: item.isActive === false ? '#64748b' : '#38bdf8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          {item.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => openEditHighlightModal(idx)}
                          data-testid={`edit-highlight-${item.id || idx}`}
                          title="Edit Card"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteHighlight(idx)}
                          data-testid={`delete-highlight-${item.id || idx}`}
                          title="Delete Card"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMN 2: SOLUTION CARDS (RIGHT) */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Section 2: Solution Cards
                    </h2>
                  </div>
                  <input
                    type="text"
                    value={currentData.solutionsHeading || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCurrentData((prev) => ({ ...prev, solutionsHeading: val }));
                    }}
                    placeholder={activeScope === 'Residential' ? 'Residential Solutions & Systems' : 'Commercial Solutions & Plants'}
                    style={{
                      marginTop: '6px',
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    title="Section heading displayed above the solutions cards"
                  />
                </div>
                <button
                  onClick={openAddSolutionModal}
                  style={{
                    padding: '7px 12px',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} /> Add Solution Card
                </button>
              </div>

              {currentData.solutions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                  No solution cards configured. Click "Add Solution Card" to create one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentData.solutions.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        backgroundColor: item.isActive === false ? '#131b2e' : '#182235',
                        border: '1px solid #283548',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        opacity: item.isActive === false ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        {/* Icon display */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#0c4a6e',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {renderCardIcon(item.icon, 18)}
                        </div>

                        {/* Title, description & URL */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#38bdf8',
                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {item.icon || 'Droplets'}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '3px',
                            }}
                          >
                            {item.description || 'No description configured'}
                          </div>
                          {item.url && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              Target: {item.url}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleMoveSolution(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === 0 ? '#334155' : '#94a3b8',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                          }}
                        >
                          <MoveUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveSolution(idx, 'down')}
                          disabled={idx === currentData.solutions.length - 1}
                          title="Move Down"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === currentData.solutions.length - 1 ? '#334155' : '#94a3b8',
                            cursor: idx === currentData.solutions.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                          }}
                        >
                          <MoveDown size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleSolutionActive(idx)}
                          title={item.isActive === false ? 'Enable' : 'Disable'}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: item.isActive === false ? '#64748b' : '#38bdf8',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          {item.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => openEditSolutionModal(idx)}
                          title="Edit Solution"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteSolution(idx)}
                          title="Delete Solution"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= LIVE PREVIEW MATCHING WEBSITE NAVBAR MEGA MENU ================= */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayoutGrid size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Live Preview: {activeScope} Navbar Mega Menu
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Exact rendered appearance on public website
              </span>
            </div>

            {/* Render Preview matching SamsungMegaMenu */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '28px 32px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                color: '#0f172a',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(320px, 1fr) 1px minmax(420px, 1.4fr)',
                  gap: '32px',
                  alignItems: 'start',
                }}
              >
                {/* Preview Highlights Column */}
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748b',
                      marginBottom: '16px',
                    }}
                  >
                    {activeScope} Highlights
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    {currentData.highlights
                      .filter((h) => h.isActive !== false)
                      .map((h, idx) => (
                        <div
                          key={h.id || idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '95px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <img
                              src={h.image}
                              alt={h.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = '/assets/water-softener-system.jpg';
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                              {h.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                              {h.subtitle}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', backgroundColor: '#e2e8f0', height: '100%', minHeight: '260px' }} />

                {/* Preview Solutions Grid */}
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748b',
                      marginBottom: '16px',
                    }}
                  >
                    {activeScope === 'Commercial' ? 'Commercial Solutions & Plants' : 'Residential Solutions & Systems'}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {currentData.solutions
                      .filter((s) => s.isActive !== false)
                      .map((s, idx) => (
                        <div
                          key={s.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: '#f0f7ff',
                              border: '1px solid #dbeafe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0284c7',
                              flexShrink: 0,
                            }}
                          >
                            {renderCardIcon(s.icon, 18)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0f172a',
                                lineHeight: 1.25,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {s.title}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#64748b',
                                lineHeight: 1.3,
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {s.description}
                            </div>
                          </div>
                          <ArrowRight size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT HIGHLIGHT CARD ================= */}
      {isHighlightModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {editingHighlightIndex !== null ? 'Edit Highlight Card' : 'Add Highlight Card'} ({activeScope})
              </h3>
              <button
                onClick={() => setIsHighlightModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveHighlight}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Card Title *
                  </label>
                  <input
                    type="text"
                    required
                    name="title"
                    data-testid="highlight-input-title"
                    placeholder="e.g. Water Softener Systems"
                    value={highlightForm.title}
                    onChange={(e) => setHighlightForm({ ...highlightForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Card Subtitle / Description
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    data-testid="highlight-input-subtitle"
                    placeholder="e.g. Zero scale protection for homes"
                    value={highlightForm.subtitle}
                    onChange={(e) => setHighlightForm({ ...highlightForm, subtitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Image Upload & URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Card Image *
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      required
                      name="image"
                      data-testid="highlight-input-image"
                      placeholder="/images/... or http://..."
                      value={highlightForm.image}
                      onChange={(e) => setHighlightForm({ ...highlightForm, image: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        backgroundColor: '#182235',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <label
                      style={{
                        padding: '10px 14px',
                        backgroundColor: uploadingImage ? '#334155' : '#2563eb',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Upload size={14} />
                      {uploadingImage ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadHighlightImage}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {highlightForm.image && (
                    <div
                      style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #334155',
                        backgroundColor: '#090d16',
                      }}
                    >
                      <img
                        src={highlightForm.image}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                {/* Target Navigation Link / URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Navigation Link (Optional)
                  </label>
                  <input
                    type="text"
                    name="url"
                    data-testid="highlight-input-url"
                    placeholder="e.g. #water-softener-inquiry-section or /products"
                    value={highlightForm.url}
                    onChange={(e) => setHighlightForm({ ...highlightForm, url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="highlightActive"
                    checked={highlightForm.isActive}
                    onChange={(e) => setHighlightForm({ ...highlightForm, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <label htmlFor="highlightActive" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                    Active (visible in menu)
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                  paddingTop: '16px',
                  borderTop: '1px solid #1e293b',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsHighlightModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="highlight-modal-submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingHighlightIndex !== null ? 'Update Card' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SOLUTION CARD ================= */}
      {isSolutionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                paddingBottom: '12px',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {editingSolutionIndex !== null ? 'Edit Solution Card' : 'Add Solution Card'} ({activeScope})
              </h3>
              <button
                onClick={() => setIsSolutionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSolution}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Solution Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water Softener"
                    value={solutionForm.title}
                    onChange={(e) => setSolutionForm({ ...solutionForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Short Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief 1-line feature explanation for the card"
                    value={solutionForm.description}
                    onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Card Icon *
                  </label>
                  <select
                    value={solutionForm.icon || 'Droplets'}
                    onChange={(e) => setSolutionForm({ ...solutionForm, icon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Navigation Destination URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="#water-softener-inquiry-section or /about"
                    value={solutionForm.url}
                    onChange={(e) => setSolutionForm({ ...solutionForm, url: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#182235',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="solActive"
                    checked={solutionForm.isActive}
                    onChange={(e) => setSolutionForm({ ...solutionForm, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <label htmlFor="solActive" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                    Active (visible in menu)
                  </label>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                  paddingTop: '16px',
                  borderTop: '1px solid #1e293b',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsSolutionModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="highlight-modal-submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingSolutionIndex !== null ? 'Update Card' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
