'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, CheckCircle2, ShieldAlert, Key } from 'lucide-react';

export default function ProfileAdminPage() {
  const [profile, setProfile] = useState({ name: '', email: '', role: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setProfile(data.user);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Profile and credentials updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        localStorage.setItem('avxbs_admin_user', JSON.stringify(data.user));
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc' }}>
          Admin Profile & Security
        </h1>
        <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '4px' }}>
          Update administrator account details and change security passwords.
        </p>
      </div>

      {message && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '13.5px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '13.5px',
          marginBottom: '20px'
        }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px' }}>
            Administrator Name
          </label>
          <input
            type="text"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            disabled
            value={profile.email}
            style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0a0d14', border: '1px solid #232d3f', borderRadius: '8px', color: '#64748b', fontSize: '14px', cursor: 'not-allowed' }}
          />
        </div>

        <div style={{ borderTop: '1px solid #1f2937', paddingTop: '16px', marginTop: '6px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: '#3b82f6' }} />
            <span>Change Password (Leave blank to keep current)</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px' }}>
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required if changing password"
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#d1d5db', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Updating Account...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

