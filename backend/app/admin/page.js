'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Inbox, 
  Layers, 
  Menu as MenuIcon, 
  Image as ImageIcon, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Droplets,
  ExternalLink,
  MessageSquareQuote,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
          setRecentInquiries(data.recentInquiries || []);
        }
      })
      .catch((err) => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: 'Total Inquiries',
      value: stats?.totalInquiries ?? 0,
      sub: `${stats?.newInquiries ?? 0} New pending review`,
      icon: Inbox,
      color: '#3b82f6',
      href: '/admin/inquiries',
    },
    {
      title: 'Residential Scope',
      value: stats?.residentialInquiries ?? 0,
      sub: 'Domestic water softening inquiries',
      icon: Droplets,
      color: '#10b981',
      href: '/admin/inquiries?type=Residential',
    },
    {
      title: 'Commercial Scope',
      value: stats?.commercialInquiries ?? 0,
      sub: 'Industrial plant & duplex audits',
      icon: TrendingUp,
      color: '#f59e0b',
      href: '/admin/inquiries?type=Commercial',
    },
    {
      title: 'Active Products',
      value: stats?.totalProducts ?? 0,
      sub: 'Managed solutions catalog',
      icon: Layers,
      color: '#8b5cf6',
      href: '/admin/products',
    },
    {
      title: 'Customer Feedback',
      value: stats?.totalFeedback ?? 0,
      sub: `${stats?.pendingFeedback ?? 0} Pending approval`,
      icon: MessageSquareQuote,
      color: '#ec4899',
      href: '/admin/testimonials',
    },
  ];

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.02em' }}>
            System Overview & Metrics
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
            Real-time status of AVXBS water treatment inquiries, catalog items, and dynamic content.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid #334155'
            }}
          >
            <span>Live Website</span>
            <ExternalLink size={15} />
          </a>
          <Link
            href="/admin/inquiries"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <span>View Submissions</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((card, i) => {
          const IconComp = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '12px',
                padding: '24px',
                display: 'block',
                transition: 'transform 0.2s, border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '500', color: '#9ca3af' }}>{card.title}</span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: `${card.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <IconComp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#f9fafb', marginBottom: '6px' }}>
                {loading ? '...' : card.value}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {card.sub}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Feedback Metrics Summary Bar */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(236, 72, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ec4899'
          }}>
            <MessageSquareQuote size={20} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
              Customer Feedback Moderation
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Reviews submitted via homepage "Share Your Experience" form
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>
              {stats?.totalFeedback ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Reviews
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#1f2937' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#facc15' }}>
              {stats?.pendingFeedback ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Approval
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#1f2937' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ade80' }}>
              {stats?.approvedFeedback ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved (Live)
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#1f2937' }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f87171' }}>
              {stats?.rejectedFeedback ?? 0}
            </div>
            <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rejected
            </div>
          </div>

          <Link
            href="/admin/testimonials"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              marginLeft: '12px'
            }}
          >
            <span>Moderate Reviews</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Recent Inquiries Panel */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f9fafb' }}>Recent Customer Submissions</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>Latest inquiries captured from drawer and contact forms</p>
          </div>
          <Link
            href="/admin/inquiries"
            style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>See all records</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading submissions...</div>
        ) : recentInquiries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No inquiries recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 24px' }}>Customer</th>
                  <th style={{ padding: '14px 20px' }}>Phone / Email</th>
                  <th style={{ padding: '14px 20px' }}>Scope</th>
                  <th style={{ padding: '14px 20px' }}>Product</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((inq) => (
                  <tr key={inq._id} style={{ borderBottom: '1px solid #182234' }}>
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#f3f4f6' }}>{inq.name}</td>
                    <td style={{ padding: '16px 20px', color: '#9ca3af' }}>
                      <div>{inq.mobile}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{inq.email}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: inq.type === 'Residential' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: inq.type === 'Residential' ? '#34d399' : '#fbbf24',
                      }}>
                        {inq.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#d1d5db' }}>{inq.product || 'Water Softener'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: inq.status === 'New' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                        color: inq.status === 'New' ? '#60a5fa' : '#9ca3af',
                      }}>
                        {inq.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

