'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  X,
  Phone,
  Mail,
  RefreshCw,
  Building2,
  Home,
  Layers,
  Inbox,
  Filter,
  Check,
  Calendar,
  MessageSquare
} from 'lucide-react';

export default function InquiriesAdminPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [productFilter, setProductFilter] = useState('All');
  const [distinctProducts, setDistinctProducts] = useState([]);

  // Summary Metrics
  const [summary, setSummary] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    solved: 0,
    notSolved: 0,
  });

  // Selected Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Toast Feedback Notification
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Status updating state for optimistic/safe UX
  const [updatingId, setUpdatingId] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
        status: statusFilter,
        type: typeFilter,
        product: productFilter,
      });

      const res = await fetch(`/api/inquiries?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.inquiries || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
        if (data.summary) {
          setSummary(data.summary);
        }
        if (data.distinctProducts) {
          setDistinctProducts(data.distinctProducts);
        }
      } else {
        showFeedback('error', data.error || 'Failed to load inquiries');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, productFilter, search]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All');
    setProductFilter('All');
    setPage(1);
  };

  // Status management: New, In Progress, Solved, Not Solved
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInquiries((prev) =>
          prev.map((item) =>
            item._id === id
              ? { ...item, status: newStatus, updatedAt: data.inquiry?.updatedAt || new Date().toISOString() }
              : item
          )
        );
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry((prev) => ({
            ...prev,
            status: newStatus,
            updatedAt: data.inquiry?.updatedAt || new Date().toISOString()
          }));
        }

        // Refresh summary metrics asynchronously
        fetchInquiries();
        showFeedback('success', `Status updated to "${newStatus}"`);
      } else {
        showFeedback('error', data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Network error updating inquiry status');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inquiries/${deleteConfirmId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setInquiries((prev) => prev.filter((item) => item._id !== deleteConfirmId));
        if (selectedInquiry?._id === deleteConfirmId) setSelectedInquiry(null);
        setDeleteConfirmId(null);
        showFeedback('success', 'Inquiry deleted successfully');
        fetchInquiries();
      } else {
        showFeedback('error', data.error || 'Failed to delete inquiry');
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Network error deleting inquiry');
    } finally {
      setDeleting(false);
    }
  };

  // Status Styling Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          icon: Clock,
          label: 'New'
        };
      case 'In Progress':
      case 'Contacted':
        return {
          bg: 'rgba(251, 191, 36, 0.12)',
          color: '#fbbf24',
          border: 'rgba(251, 191, 36, 0.3)',
          icon: AlertCircle,
          label: 'In Progress'
        };
      case 'Solved':
      case 'Resolved':
        return {
          bg: 'rgba(52, 211, 153, 0.12)',
          color: '#34d399',
          border: 'rgba(52, 211, 153, 0.3)',
          icon: CheckCircle2,
          label: 'Solved'
        };
      case 'Not Solved':
      case 'Closed':
        return {
          bg: 'rgba(248, 113, 113, 0.12)',
          color: '#f87171',
          border: 'rgba(248, 113, 113, 0.3)',
          icon: XCircle,
          label: 'Not Solved'
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.3)',
          icon: Clock,
          label: status
        };
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {feedback.message && (
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
          backgroundColor: feedback.type === 'success' ? '#065f46' : '#7f1d1d',
          color: '#ffffff',
          border: feedback.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
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
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            Customer Inquiries & Form Submissions
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', marginBottom: 0 }}>
            Manage and resolve all customer consultations, system sizing requests, and contact submissions.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
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
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card: Total */}
        <div 
          onClick={() => { setStatusFilter('All'); setPage(1); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'All' ? '1px solid #38bdf8' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Inquiries
            </span>
            <Inbox size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '10px' }}>
            {summary.total}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            All website submissions
          </span>
        </div>

        {/* Card: New */}
        <div 
          onClick={() => { setStatusFilter('New'); setPage(1); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'New' ? '1px solid #38bdf8' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              New
            </span>
            <Clock size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', marginTop: '10px' }}>
            {summary.new}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Awaiting response
          </span>
        </div>

        {/* Card: In Progress */}
        <div 
          onClick={() => { setStatusFilter('In Progress'); setPage(1); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'In Progress' ? '1px solid #fbbf24' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress
            </span>
            <AlertCircle size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#fbbf24', marginTop: '10px' }}>
            {summary.inProgress}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Active team engagement
          </span>
        </div>

        {/* Card: Solved */}
        <div 
          onClick={() => { setStatusFilter('Solved'); setPage(1); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'Solved' ? '1px solid #34d399' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Solved
            </span>
            <CheckCircle2 size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', marginTop: '10px' }}>
            {summary.solved}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Successfully resolved
          </span>
        </div>

        {/* Card: Not Solved */}
        <div 
          onClick={() => { setStatusFilter('Not Solved'); setPage(1); }}
          style={{
            backgroundColor: '#0f172a',
            border: statusFilter === 'Not Solved' ? '1px solid #f87171' : '1px solid #1e293b',
            borderRadius: '12px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Not Solved
            </span>
            <XCircle size={18} color="#f87171" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f87171', marginTop: '10px' }}>
            {summary.notSolved}
          </div>
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Closed / could not resolve
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
        {/* Search input */}
        <form 
          onSubmit={handleSearchSubmit} 
          style={{ display: 'flex', flex: '1 1 280px', position: 'relative' }}
        >
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </form>

        {/* Filter: Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Solved">Solved</option>
            <option value="Not Solved">Not Solved</option>
          </select>
        </div>

        {/* Filter: Property Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
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
            <option value="All">All Types</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>

        {/* Filter: Product */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Product:</span>
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '180px'
            }}
          >
            <option value="All">All Products</option>
            {distinctProducts.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(search || statusFilter !== 'All' || typeFilter !== 'All' || productFilter !== 'All') && (
          <button
            type="button"
            onClick={handleClearFilters}
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

      {/* Main Table Card */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Loading inquiries from database...</div>
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Inbox size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc' }}>No customer inquiries found</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{
                  backgroundColor: '#0a0f1d',
                  borderBottom: '1px solid #1e293b',
                  color: '#94a3b8',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <th style={{ padding: '14px 20px' }}>Customer Name</th>
                  <th style={{ padding: '14px 16px' }}>Mobile / Phone</th>
                  <th style={{ padding: '14px 16px' }}>Email Address</th>
                  <th style={{ padding: '14px 16px' }}>Property Type</th>
                  <th style={{ padding: '14px 16px' }}>Selected Product</th>
                  <th style={{ padding: '14px 16px' }}>Inquiry Message</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Submission Date</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => {
                  const badge = getStatusBadge(inq.status);
                  const isUpdating = updatingId === inq._id;
                  const displayMessage = inq.remarks || inq.waterIssue || inq.location || 'Consultation requested';

                  return (
                    <tr 
                      key={inq._id} 
                      style={{ 
                        borderBottom: '1px solid #1e293b',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#f8fafc' }}>
                        {inq.name}
                      </td>

                      {/* Mobile */}
                      <td style={{ padding: '14px 16px', color: '#60a5fa', fontWeight: '500' }}>
                        <a href={`tel:${inq.mobile}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                          {inq.mobile}
                        </a>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                        <a href={`mailto:${inq.email}`} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                          {inq.email}
                        </a>
                      </td>

                      {/* Property Type */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '600',
                          backgroundColor: inq.type === 'Residential' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: inq.type === 'Residential' ? '#34d399' : '#fbbf24',
                          border: inq.type === 'Residential' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)'
                        }}>
                          {inq.type === 'Residential' ? <Home size={12} /> : <Building2 size={12} />}
                          {inq.type}
                        </span>
                      </td>

                      {/* Selected Product */}
                      <td style={{ padding: '14px 16px', color: '#f1f5f9' }}>
                        <span style={{
                          display: 'inline-block',
                          maxWidth: '160px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={inq.product}>
                          {inq.product || 'Water Softener'}
                        </span>
                      </td>

                      {/* Message preview */}
                      <td style={{ padding: '14px 16px', color: '#94a3b8', maxWidth: '200px' }}>
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={displayMessage}>
                          {displayMessage}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={
                            inq.status === 'Contacted' ? 'In Progress' :
                            inq.status === 'Resolved' ? 'Solved' :
                            inq.status === 'Closed' ? 'Not Solved' :
                            inq.status
                          }
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                          style={{
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            outline: 'none',
                            cursor: isUpdating ? 'wait' : 'pointer'
                          }}
                        >
                          <option value="New" style={{ backgroundColor: '#0f172a', color: '#38bdf8' }}>New</option>
                          <option value="In Progress" style={{ backgroundColor: '#0f172a', color: '#fbbf24' }}>In Progress</option>
                          <option value="Solved" style={{ backgroundColor: '#0f172a', color: '#34d399' }}>Solved</option>
                          <option value="Not Solved" style={{ backgroundColor: '#0f172a', color: '#f87171' }}>Not Solved</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(inq.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            title="View Complete Details"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(inq._id)}
                            title="Delete Inquiry"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0a0f1d',
          color: '#94a3b8',
          fontSize: '13px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            Showing <strong>{inquiries.length}</strong> of <strong>{totalRecords}</strong> customer inquiries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                color: page <= 1 ? '#475569' : '#e2e8f0',
                border: '1px solid #334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
                fontSize: '12.5px'
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                color: page >= totalPages ? '#475569' : '#e2e8f0',
                border: '1px solid #334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
                fontSize: '12.5px'
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
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
            maxWidth: '620px',
            padding: '30px',
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedInquiry(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  Customer Inquiry Details
                </h2>
                {(() => {
                  const b = getStatusBadge(selectedInquiry.status);
                  return (
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: b.bg,
                      color: b.color,
                      border: `1px solid ${b.border}`
                    }}>
                      {b.label}
                    </span>
                  );
                })()}
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                Database ID: {selectedInquiry._id}
              </p>
            </div>

            {/* Fields List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              {/* Customer Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Customer Name:</span>
                <strong style={{ color: '#f8fafc' }}>{selectedInquiry.name}</strong>
              </div>

              {/* Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Mobile Number:</span>
                <a href={`tel:${selectedInquiry.mobile}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}>
                  {selectedInquiry.mobile}
                </a>
              </div>

              {/* Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Email Address:</span>
                <a href={`mailto:${selectedInquiry.email}`} style={{ color: '#cbd5e1', textDecoration: 'none' }}>
                  {selectedInquiry.email}
                </a>
              </div>

              {/* Property Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Property Type:</span>
                <span style={{ color: '#f8fafc', fontWeight: '500' }}>{selectedInquiry.type}</span>
              </div>

              {/* Product */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Selected Product:</span>
                <strong style={{ color: '#38bdf8' }}>{selectedInquiry.product || 'Water Softener'}</strong>
              </div>

              {/* Location */}
              {selectedInquiry.location && (
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8' }}>City / Location:</span>
                  <span style={{ color: '#f8fafc' }}>{selectedInquiry.location}</span>
                </div>
              )}

              {/* Water Issue */}
              {selectedInquiry.waterIssue && (
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8' }}>Water Issue / Need:</span>
                  <span style={{ color: '#fbbf24' }}>{selectedInquiry.waterIssue}</span>
                </div>
              )}

              {/* Source */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Submission Source:</span>
                <span style={{ color: '#94a3b8' }}>{selectedInquiry.source || 'Website Drawer Form'}</span>
              </div>

              {/* Submitted On */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8' }}>Submission Date:</span>
                <span style={{ color: '#cbd5e1' }}>
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Last Updated */}
              {selectedInquiry.updatedAt && (
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8' }}>Last Updated:</span>
                  <span style={{ color: '#64748b' }}>
                    {new Date(selectedInquiry.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Inquiry Message / Remarks */}
              <div>
                <span style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Inquiry Message / Remarks:</span>
                <div style={{
                  backgroundColor: '#090d16',
                  padding: '14px',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  border: '1px solid #1e293b',
                  minHeight: '70px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedInquiry.remarks || selectedInquiry.waterIssue || 'No additional remarks provided.'}
                </div>
              </div>

              {/* Status Action Dropdown */}
              <div style={{
                marginTop: '10px',
                padding: '16px',
                backgroundColor: '#0a0f1d',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#f8fafc' }}>
                    Update Resolution Status
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Changes save directly to MongoDB and persist across sessions.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['New', 'In Progress', 'Solved', 'Not Solved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedInquiry._id, st)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: selectedInquiry.status === st ? '1px solid #38bdf8' : '1px solid #334155',
                        backgroundColor: selectedInquiry.status === st ? '#0284c7' : '#1e293b',
                        color: selectedInquiry.status === st ? '#ffffff' : '#cbd5e1',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Delete Customer Inquiry?
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete this customer inquiry? This action cannot be undone.
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
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: deleting ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                }}
              >
                {deleting ? 'Deleting...' : 'Delete Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
