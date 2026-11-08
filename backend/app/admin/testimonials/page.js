'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Edit3, 
  Star, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Building2, 
  Home, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Calendar,
  X,
  MessageSquare,
  User,
  MapPin,
  Mail,
  Plus
} from 'lucide-react';

// Helper to compute 2-letter initials from customer name
function getCustomerInitials(name = '') {
  if (!name || typeof name !== 'string') return 'AV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const BRAND_GRADIENT_PRESETS = [
  'linear-gradient(135deg, #101B33 0%, #0085D1 100%)',
  'linear-gradient(135deg, #0085D1 0%, #079C91 100%)',
  'linear-gradient(135deg, #079C91 0%, #101B33 100%)',
  'linear-gradient(135deg, #101B33 0%, #079C91 100%)',
];

function CustomerAvatar({ name, image, avatarColor, index = 0, size = 52, border }) {
  const initials = getCustomerInitials(name);
  const bg = avatarColor || BRAND_GRADIENT_PRESETS[index % BRAND_GRADIENT_PRESETS.length];

  if (image) {
    return (
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        border: border || '2px solid #334155',
        backgroundColor: '#0c1322'
      }}>
        <img
          src={image}
          alt={name || 'Customer'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      minWidth: `${size}px`,
      minHeight: `${size}px`,
      borderRadius: '50%',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontWeight: '800',
      fontSize: `${Math.round(size * 0.38)}px`,
      letterSpacing: '0.02em',
      border: border || '2px solid #334155',
      userSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      {initials}
    </div>
  );
}

export default function CustomerFeedbackAdminPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, visible: 0, hidden: 0, active: 0, inactive: 0 });

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback
  const [toast, setToast] = useState({ type: '', message: '' });

  // Toggle button updating indicator
  const [togglingId, setTogglingId] = useState(null);

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormData, setAddFormData] = useState({
    customerName: '',
    email: '',
    designation: '',
    category: 'Residential',
    rating: 5,
    feedback: '',
    isActive: true,
    isFeatured: false,
  });

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    email: '',
    designation: '',
    category: 'Residential',
    rating: 5,
    feedback: '',
    isActive: true,
    isFeatured: false,
  });

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: '', message: '' });
    }, 4000);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        all: 'true',
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery.trim(),
      });

      const res = await fetch(`/api/testimonials?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        showToast('error', data.error || 'Failed to load feedback');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Explicit Active / Inactive Toggle: Updates both isActive & showOnHomepage
  const handleToggleActiveStatus = async (review) => {
    // Current active state: true if isActive !== false AND showOnHomepage !== false
    const currentIsActive = review.isActive !== false && Boolean(review.showOnHomepage);
    const newActiveState = !currentIsActive;
    setTogglingId(review._id);

    try {
      const res = await fetch(`/api/testimonials/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: newActiveState,
          showOnHomepage: newActiveState,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestimonials((prev) =>
          prev.map((item) =>
            item._id === review._id
              ? { ...item, isActive: newActiveState, showOnHomepage: newActiveState }
              : item
          )
        );
        fetchReviews();
        showToast(
          'success',
          newActiveState
            ? `Review by "${review.customerName}" is now Active (visible on public website).`
            : `Review by "${review.customerName}" is now Inactive (hidden from public website).`
        );
      } else {
        showToast('error', data.error || 'Failed to update review status');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error updating review status');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Add Review Modal
  const handleOpenAdd = () => {
    setAddFormData({
      customerName: '',
      email: '',
      designation: '',
      category: 'Residential',
      rating: 5,
      feedback: '',
      isActive: true,
      isFeatured: false,
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Review Form
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!addFormData.customerName.trim()) {
      showToast('error', 'Customer name is required');
      return;
    }
    if (!addFormData.feedback.trim() || addFormData.feedback.trim().length < 6) {
      showToast('error', 'Feedback message must be at least 6 characters');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const payload = {
        customerName: addFormData.customerName.trim(),
        email: addFormData.email.trim(),
        designation: addFormData.designation.trim() || (addFormData.category === 'Commercial' ? 'Commercial Client' : 'Residential Homeowner'),
        category: addFormData.category,
        rating: Number(addFormData.rating),
        feedback: addFormData.feedback.trim(),
        isActive: Boolean(addFormData.isActive),
        showOnHomepage: Boolean(addFormData.isActive),
        approvalStatus: addFormData.isActive ? 'approved' : 'pending',
        isFeatured: Boolean(addFormData.isFeatured),
      };

      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        fetchReviews();
        showToast('success', 'New customer review added successfully!');
      } else {
        showToast('error', data.error || 'Failed to add review');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error adding review');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    const itemIsActive = item.isActive !== false && Boolean(item.showOnHomepage);
    setEditFormData({
      customerName: item.customerName || '',
      email: item.email || '',
      designation: item.designation || '',
      category: item.category || 'Residential',
      rating: item.rating || 5,
      feedback: item.feedback || '',
      isActive: itemIsActive,
      isFeatured: Boolean(item.isFeatured),
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editFormData.customerName.trim()) {
      showToast('error', 'Customer name is required');
      return;
    }
    if (!editFormData.feedback.trim() || editFormData.feedback.trim().length < 6) {
      showToast('error', 'Feedback message must be at least 6 characters');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload = {
        customerName: editFormData.customerName.trim(),
        email: editFormData.email.trim(),
        designation: editFormData.designation.trim(),
        category: editFormData.category,
        rating: Number(editFormData.rating),
        feedback: editFormData.feedback.trim(),
        isActive: Boolean(editFormData.isActive),
        showOnHomepage: Boolean(editFormData.isActive),
        isFeatured: Boolean(editFormData.isFeatured),
      };

      const res = await fetch(`/api/testimonials/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditModalOpen(false);
        setEditingItem(null);
        fetchReviews();
        showToast('success', 'Customer review updated successfully');
      } else {
        showToast('error', data.error || 'Failed to update review');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving review');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/testimonials/${deleteConfirmId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestimonials((prev) => prev.filter((t) => t._id !== deleteConfirmId));
        setDeleteConfirmId(null);
        fetchReviews();
        showToast('success', 'Customer review deleted successfully');
      } else {
        showToast('error', data.error || 'Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error deleting review');
    } finally {
      setDeleting(false);
    }
  };

  const totalReviewsCount = summary.total || testimonials.length;
  const activeReviewsCount = summary.active !== undefined ? summary.active : summary.visible;
  const inactiveReviewsCount = summary.inactive !== undefined ? summary.inactive : summary.hidden;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Toast Notification */}
      {toast.message && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 99999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          backgroundColor: toast.type === 'success' ? '#065f46' : '#7f1d1d',
          color: '#ffffff',
          border: toast.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
        }}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
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
              Feedback Moderation
            </span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Client Reviews & Ratings</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Customer Review Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>
            Add new reviews manually, view submissions, edit, delete, and toggle Active/Inactive status. Only Active reviews appear on the public website.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>Add New Review</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total Feedback */}
        <div 
          onClick={() => { setStatusFilter('all'); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'all' ? '1px solid #38bdf8' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Total Reviews
            </span>
            <MessageSquare size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
            {totalReviewsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            All customer reviews stored in database
          </span>
        </div>

        {/* Active Reviews */}
        <div 
          onClick={() => { setStatusFilter('active'); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'active' ? '1px solid #10b981' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#34d399', textTransform: 'uppercase' }}>
              Active Reviews
            </span>
            <Eye size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', marginTop: '10px' }}>
            {activeReviewsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Live on public website review carousel
          </span>
        </div>

        {/* Inactive Reviews */}
        <div 
          onClick={() => { setStatusFilter('inactive'); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'inactive' ? '1px solid #94a3b8' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Inactive Reviews
            </span>
            <EyeOff size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#94a3b8', marginTop: '10px' }}>
            {inactiveReviewsCount}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Hidden from public website (kept in DB)
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search reviews by name, location, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13.5px',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('ALL'); }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Review Cards Grid */}
      {loading ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          color: '#94a3b8'
        }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading customer reviews...</div>
        </div>
      ) : testimonials.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          color: '#94a3b8'
        }}>
          <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
            No customer reviews found
          </div>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px' }}>
            Click &quot;Add New Review&quot; above to create a customer testimonial manually.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          {testimonials.map((review, idx) => {
            const isActive = review.isActive !== false && Boolean(review.showOnHomepage);
            const isToggling = togglingId === review._id;

            return (
              <div
                key={review._id}
                style={{
                  backgroundColor: '#0f172a',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #1e293b',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  position: 'relative',
                  boxShadow: isActive ? '0 4px 20px rgba(56, 189, 248, 0.08)' : '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Top Section: Avatar + Customer Details + Badges */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <CustomerAvatar
                        name={review.customerName}
                        image={review.profileImage}
                        avatarColor={review.avatarColor}
                        index={idx}
                        size={52}
                        border={isActive ? '2px solid #38bdf8' : '2px solid #334155'}
                      />
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                          {review.customerName}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                          {review.designation || (review.category === 'Commercial' ? 'Commercial Client' : 'Residential Homeowner')}
                        </p>
                        {review.email && (
                          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {review.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Top Right: Status Badge & Category Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {/* Explicit Active / Inactive Status Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: isActive ? '#34d399' : '#94a3b8',
                        border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(100, 116, 139, 0.35)',
                      }}>
                        {isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        {isActive ? 'Active' : 'Inactive'}
                      </span>

                      {/* Category Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: review.category === 'Commercial' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                        color: review.category === 'Commercial' ? '#fbbf24' : '#38bdf8',
                        border: review.category === 'Commercial' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                      }}>
                        {review.category === 'Commercial' ? <Building2 size={11} /> : <Home size={11} />}
                        {review.category}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars + Featured Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          fill={i < (review.rating || 5) ? '#fbbf24' : 'none'}
                          color={i < (review.rating || 5) ? '#fbbf24' : '#475569'}
                        />
                      ))}
                    </div>

                    {review.isFeatured && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        <Sparkles size={11} />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Feedback Message */}
                  <div style={{
                    backgroundColor: '#090d16',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontSize: '13.5px',
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    minHeight: '75px'
                  }}>
                    &quot;{review.feedback}&quot;
                  </div>

                  {/* Submission Date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    fontSize: '11.5px',
                    color: '#64748b'
                  }}>
                    <Calendar size={12} />
                    <span>Created on {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                {/* Bottom Section: Explicit Active/Inactive Toggle Button + Edit/Delete */}
                <div style={{
                  paddingTop: '14px',
                  borderTop: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  {/* Explicit Active / Inactive Toggle Button */}
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleActiveStatus(review)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: isToggling ? 'wait' : 'pointer',
                      border: isActive ? '1px solid #10b981' : '1px solid #334155',
                      backgroundColor: isActive ? '#065f46' : '#1e293b',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {isToggling ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : isActive ? (
                      <>
                        <EyeOff size={14} />
                        <span>Set Inactive</span>
                      </>
                    ) : (
                      <>
                        <Eye size={14} />
                        <span>Set Active</span>
                      </>
                    )}
                  </button>

                  {/* Actions: Edit & Delete */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(review)}
                      title="Edit Review Details"
                      style={{
                        padding: '8px',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(review._id)}
                      title="Delete Review"
                      style={{
                        padding: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD NEW REVIEW MODAL */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '580px',
            padding: '28px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setIsAddModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: '0 0 6px 0' }}>
              Add New Customer Review
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0' }}>
              Manually add a testimonial from a customer with complete review details.
            </p>

            <form onSubmit={handleSubmitAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={addFormData.customerName}
                  onChange={(e) => setAddFormData({ ...addFormData, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Customer Type / Category *
                  </label>
                  <select
                    value={addFormData.category}
                    onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Location / Role / Title
                  </label>
                  <input
                    type="text"
                    value={addFormData.designation}
                    onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
                    placeholder="e.g. Homeowner, Gurgaon"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="e.g. ramesh@example.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Star Rating (1 - 5 Stars) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAddFormData({ ...addFormData, rating: st })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: addFormData.rating === st ? '1px solid #fbbf24' : '1px solid #334155',
                        backgroundColor: addFormData.rating === st ? '#1e293b' : '#090d16',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Star size={14} fill={addFormData.rating >= st ? '#fbbf24' : 'none'} />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Review Feedback Message * (Min 6 characters)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share customer's feedback and experience with AVXBS water systems..."
                  value={addFormData.feedback}
                  onChange={(e) => setAddFormData({ ...addFormData, feedback: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status Radio / Toggles */}
              <div style={{ backgroundColor: '#182235', padding: '14px', borderRadius: '10px', border: '1px solid #283548', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#38bdf8' }}>
                  Review Visibility & Publication Status
                </div>
                
                <div style={{ display: 'flex', gap: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                    <input
                      type="radio"
                      name="addActiveStatus"
                      checked={addFormData.isActive === true}
                      onChange={() => setAddFormData({ ...addFormData, isActive: true })}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Active (Visible on Website)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                    <input
                      type="radio"
                      name="addActiveStatus"
                      checked={addFormData.isActive === false}
                      onChange={() => setAddFormData({ ...addFormData, isActive: false })}
                      style={{ accentColor: '#94a3b8' }}
                    />
                    <span style={{ color: '#94a3b8' }}>Inactive (Hidden from Website)</span>
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={addFormData.isFeatured}
                    onChange={(e) => setAddFormData({ ...addFormData, isFeatured: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                  />
                  <span>Mark as Featured Review (Prominent initial card in slider)</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  style={{
                    padding: '9px 22px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: isSubmittingAdd ? 'wait' : 'pointer'
                  }}
                >
                  {isSubmittingAdd ? 'Adding Review...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT REVIEW MODAL */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '580px',
            padding: '28px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setIsEditModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: '0 0 16px 0' }}>
              Edit Customer Review
            </h2>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.customerName}
                  onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Customer Type / Category *
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Location / Role / Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.designation}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                    placeholder="e.g. Homeowner, Gurgaon"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      backgroundColor: '#090d16',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="e.g. ramesh@example.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Star Rating (1 - 5 Stars) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, rating: st })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: editFormData.rating === st ? '1px solid #fbbf24' : '1px solid #334155',
                        backgroundColor: editFormData.rating === st ? '#1e293b' : '#090d16',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Star size={14} fill={editFormData.rating >= st ? '#fbbf24' : 'none'} />
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Review Feedback Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editFormData.feedback}
                  onChange={(e) => setEditFormData({ ...editFormData, feedback: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#090d16',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status & Featured Controls */}
              <div style={{ backgroundColor: '#182235', padding: '14px', borderRadius: '10px', border: '1px solid #283548', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#38bdf8' }}>
                  Review Publication Status
                </div>

                <div style={{ display: 'flex', gap: '18px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                    <input
                      type="radio"
                      name="editActiveStatus"
                      checked={editFormData.isActive === true}
                      onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Active (Visible on Website)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0' }}>
                    <input
                      type="radio"
                      name="editActiveStatus"
                      checked={editFormData.isActive === false}
                      onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                      style={{ accentColor: '#94a3b8' }}
                    />
                    <span style={{ color: '#94a3b8' }}>Inactive (Hidden from Website)</span>
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={editFormData.isFeatured}
                    onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                  />
                  <span>Mark as Featured Review (Prominent initial card in slider)</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  style={{
                    padding: '9px 22px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: isSavingEdit ? 'wait' : 'pointer'
                  }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: '0 0 10px 0' }}>
              Delete Customer Review?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete this customer review? It will be removed from both the database and the public website.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: deleting ? 'wait' : 'pointer'
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
