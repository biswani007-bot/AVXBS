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
  Video as VideoIcon,
  Sun,
  Moon,
  Info,
  Sliders,
  Check,
  X
} from 'lucide-react';

const ALLOWED_IMAGE_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];
const ALLOWED_EXTENSIONS = [...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_VIDEO_EXTENSIONS];

const ALLOWED_IMAGE_MIME_TYPES = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export default function WebsiteSettingsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Current persisted logo data
  const [currentLogo, setCurrentLogo] = useState({
    imageUrl: '',
    url: '',
    mediaType: 'image',
    mimeType: '',
    altText: 'AVXBS Water Solutions',
    updatedAt: null,
  });

  // Pending file upload & preview state
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingMeta, setPendingMeta] = useState({
    name: '',
    size: 0,
    width: 0,
    height: 0,
    format: '',
    isVideo: false,
    mimeType: '',
  });

  // Editable alt text
  const [altTextInput, setAltTextInput] = useState('AVXBS Water Solutions');

  const fileInputRef = useRef(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4500);
  };

  // Fetch current website logo setting
  const fetchLogoSetting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings?key=website_logo');
      const data = await res.json();
      if (res.ok && data.success) {
        const val = data.data?.value || data.setting || {};
        const mediaUrl = typeof val === 'string' ? val : (val.url || val.imageUrl || val.videoUrl || '');
        const alt = (typeof val === 'object' && val.altText) ? val.altText : 'AVXBS Water Solutions';
        const updated = (typeof val === 'object' && val.updatedAt) ? val.updatedAt : null;
        const isVid = (typeof val === 'object' && val.mediaType === 'video') ||
                      (typeof val === 'object' && val.mimeType?.startsWith('video/')) ||
                      /\.(mp4|webm)(\?.*)?$/i.test(mediaUrl);
        const mediaType = isVid ? 'video' : 'image';
        const mime = (typeof val === 'object' && val.mimeType) ? val.mimeType : (isVid ? 'video/mp4' : 'image/png');

        setCurrentLogo({
          imageUrl: mediaUrl,
          url: mediaUrl,
          mediaType,
          mimeType: mime,
          altText: alt,
          updatedAt: updated,
        });
        setAltTextInput(alt);
      }
    } catch (err) {
      console.error('Failed to load website logo settings:', err);
      showFeedback('error', 'Failed to load website logo setting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogoSetting();
  }, []);

  // Guarantee preview blob object URLs are revoked on replacement or component unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local file selection with strict client validation
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers onChange
    e.target.value = '';

    const fileName = file.name || '';
    const fileExt = (fileName.substring(fileName.lastIndexOf('.')) || '').toLowerCase();
    const fileMime = (file.type || '').toLowerCase();

    // 1. Format validation (Images: SVG, PNG, JPG, JPEG, WEBP, GIF; Videos: MP4, WebM)
    const isVideoExt = ALLOWED_VIDEO_EXTENSIONS.includes(fileExt);
    const isVideoMime = ALLOWED_VIDEO_MIME_TYPES.includes(fileMime);
    const isVideo = isVideoExt || isVideoMime;

    const isValidExt = ALLOWED_EXTENSIONS.includes(fileExt);
    const isValidMime = ALLOWED_MIME_TYPES.includes(fileMime);

    if (!isValidExt && !isValidMime) {
      showFeedback(
        'error',
        `Invalid file format "${fileExt || fileMime}". Supported formats: PNG, JPG, JPEG, SVG, WEBP, GIF (images) and MP4, WebM (videos).`
      );
      return;
    }

    // 2. File size validation (Images <= 5MB, Videos <= 25MB)
    const maxSize = isVideo ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    const maxLimitLabel = isVideo ? '25MB' : '5MB';
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showFeedback(
        'error',
        `File size exceeds ${maxLimitLabel} limit for ${isVideo ? 'video' : 'image'} logos. Selected file is ${sizeMB} MB. Please upload a file under ${maxLimitLabel}.`
      );
      return;
    }

    // Revoke previous preview URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPreviewUrl(objectUrl);

    if (isVideo) {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        setPendingMeta({
          name: file.name,
          size: file.size,
          width: vid.videoWidth || 0,
          height: vid.videoHeight || 0,
          format: fileExt.replace('.', '').toUpperCase() || 'MP4',
          isVideo: true,
          mimeType: fileMime || (fileExt === '.webm' ? 'video/webm' : 'video/mp4'),
        });
      };
      vid.onerror = () => {
        setPendingMeta({
          name: file.name,
          size: file.size,
          width: 0,
          height: 0,
          format: fileExt.replace('.', '').toUpperCase() || 'MP4',
          isVideo: true,
          mimeType: fileMime || 'video/mp4',
        });
      };
      vid.src = objectUrl;
      showFeedback('success', `Video logo "${file.name}" selected. Inspect the preview below and click Confirm & Save.`);
    } else {
      const img = new Image();
      img.onload = () => {
        setPendingMeta({
          name: file.name,
          size: file.size,
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
          format: fileExt.replace('.', '').toUpperCase() || 'PNG',
          isVideo: false,
          mimeType: fileMime || 'image/png',
        });
      };
      img.onerror = () => {
        setPendingMeta({
          name: file.name,
          size: file.size,
          width: 0,
          height: 0,
          format: fileExt.replace('.', '').toUpperCase() || 'PNG',
          isVideo: false,
          mimeType: fileMime || 'image/png',
        });
      };
      img.src = objectUrl;
      showFeedback('success', `Image logo "${file.name}" selected. Inspect the preview below and click Confirm & Save.`);
    }
  };

  // Discard pending file
  const handleDiscardPending = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl('');
    setPendingMeta({ name: '', size: 0, width: 0, height: 0, format: '', isVideo: false, mimeType: '' });
  };

  // Save new logo or update alt text
  const handleSaveLogo = async () => {
    setSaving(true);
    try {
      let finalMediaUrl = currentLogo.url || currentLogo.imageUrl;
      let finalMediaType = currentLogo.mediaType || 'image';
      let finalMimeType = currentLogo.mimeType || 'image/png';

      // If a pending new file was chosen, upload it to /api/uploads first
      if (pendingFile) {
        const isVid = pendingMeta.isVideo ||
                      ALLOWED_VIDEO_EXTENSIONS.includes((pendingFile.name.substring(pendingFile.name.lastIndexOf('.')) || '').toLowerCase()) ||
                      (pendingFile.type || '').startsWith('video/');

        const formData = new FormData();
        formData.append('file', pendingFile);
        formData.append('category', 'branding');
        formData.append('altText', altTextInput.trim());

        const uploadRes = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || (!uploadData.url && !uploadData.filePath)) {
          throw new Error(uploadData.error || 'Failed to upload logo media file');
        }

        finalMediaUrl = uploadData.url || uploadData.filePath;
        finalMediaType = isVid ? 'video' : 'image';
        finalMimeType = pendingFile.type || uploadData.media?.mimeType || (isVid ? 'video/mp4' : 'image/png');
      }

      if (!finalMediaUrl && !pendingFile) {
        showFeedback('error', 'No logo configured. Please upload an image or video logo file first.');
        setSaving(false);
        return;
      }

      const isVideoMedia = finalMediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(finalMediaUrl);

      // Persist to SiteSetting key website_logo
      const settingPayload = {
        key: 'website_logo',
        group: 'branding',
        description: 'Primary public website header and footer logo',
        value: {
          imageUrl: finalMediaUrl, // Retained for backwards compatibility with tests and callers
          url: finalMediaUrl,
          videoUrl: isVideoMedia ? finalMediaUrl : '',
          mediaType: isVideoMedia ? 'video' : 'image',
          mimeType: finalMimeType,
          altText: altTextInput.trim() || 'AVXBS Water Solutions',
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
        throw new Error(saveData.error || 'Failed to save logo setting');
      }

      // Clean up object URL
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPendingFile(null);
      setPreviewUrl('');
      setPendingMeta({ name: '', size: 0, width: 0, height: 0, format: '', isVideo: false, mimeType: '' });

      // Refresh state
      await fetchLogoSetting();
      showFeedback('success', 'Website logo updated and saved successfully! Changes apply to public website immediately.');
    } catch (err) {
      console.error('Error saving website logo:', err);
      showFeedback('error', err.message || 'Failed to save website logo');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default brand logo fallback
  const handleResetToDefault = async () => {
    if (!window.confirm('Are you sure you want to remove the custom logo and restore the default built-in animated AVXBS logo?')) {
      return;
    }

    setSaving(true);
    try {
      const settingPayload = {
        key: 'website_logo',
        group: 'branding',
        description: 'Primary public website header and footer logo',
        value: {
          imageUrl: '',
          url: '',
          mediaType: '',
          mimeType: '',
          altText: 'AVXBS Water Solutions',
          updatedAt: new Date().toISOString(),
        },
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        handleDiscardPending();
        await fetchLogoSetting();
        showFeedback('success', 'Logo reset to default AVXBS brand logo successfully!');
      } else {
        throw new Error(data.error || 'Failed to reset logo');
      }
    } catch (err) {
      console.error('Reset logo error:', err);
      showFeedback('error', err.message || 'Failed to reset logo');
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
              Site Configuration
            </span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Brand Identity & Assets</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
            Website Settings & Dynamic Logo
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px', margin: 0 }}>
            Upload, validate, and manage the official AVXBS website logo with dual-theme preview before saving.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={fetchLogoSetting}
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
            onClick={handleSaveLogo}
            disabled={saving || (!pendingFile && altTextInput === currentLogo.altText)}
            style={{
              padding: '10px 24px',
              backgroundColor: saving ? '#475569' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: (saving || (!pendingFile && altTextInput === currentLogo.altText)) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              opacity: (!pendingFile && altTextInput === currentLogo.altText) ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Logo...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          Loading website logo settings...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* TOP SECTION: TWO CARDS (CURRENT LOGO vs UPLOAD ACTION) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
            
            {/* Card 1: Currently Active Logo */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {(currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? (
                      <VideoIcon size={18} style={{ color: '#38bdf8' }} />
                    ) : (
                      <ImageIcon size={18} style={{ color: '#38bdf8' }} />
                    )}
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Currently Active Logo
                    </h2>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: (currentLogo.url || currentLogo.imageUrl)
                        ? ((currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                        : 'rgba(148, 163, 184, 0.15)',
                      color: (currentLogo.url || currentLogo.imageUrl)
                        ? ((currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? '#38bdf8' : '#34d399')
                        : '#94a3b8',
                      border: `1px solid ${(currentLogo.url || currentLogo.imageUrl)
                        ? ((currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)')
                        : 'rgba(148, 163, 184, 0.3)'}`,
                    }}
                  >
                    {(currentLogo.url || currentLogo.imageUrl)
                      ? ((currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? 'Custom Video Logo Active' : 'Custom Image Logo Active')
                      : 'Default AVXBS Brand Logo'}
                  </span>
                </div>

                {/* Display Current Logo Container */}
                <div
                  style={{
                    minHeight: '130px',
                    backgroundColor: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    position: 'relative',
                  }}
                >
                  {(currentLogo.url || currentLogo.imageUrl) ? (
                    (currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? (
                      <video
                        src={currentLogo.url || currentLogo.imageUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                        style={{
                          maxHeight: '75px',
                          maxWidth: '90%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <img
                        src={currentLogo.url || currentLogo.imageUrl}
                        alt={currentLogo.altText || 'AVXBS Logo'}
                        style={{
                          maxHeight: '75px',
                          maxWidth: '90%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', letterSpacing: '0.05em' }}>
                        AVXBS
                      </div>
                      <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                        Built-in animated brand logo fallback is active
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata Details */}
                <div style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Media Path: </span>
                    <code style={{ color: '#cbd5e1', backgroundColor: '#182235', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px' }}>
                      {currentLogo.url || currentLogo.imageUrl || '(Built-in dynamic SVG fallback)'}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Media Type: </span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                      {(currentLogo.url || currentLogo.imageUrl)
                        ? ((currentLogo.mediaType === 'video' || /\.(mp4|webm)(\?.*)?$/i.test(currentLogo.url || currentLogo.imageUrl)) ? 'Video (Animated Loop)' : 'Image (Static)')
                        : 'Built-in Vector SVG'}
                    </span>
                  </div>
                  {currentLogo.updatedAt && (
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ color: '#64748b' }}>Last Persisted: </span>
                      <span>{new Date(currentLogo.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Current Logo */}
              {(currentLogo.url || currentLogo.imageUrl) && (
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    disabled={saving}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Uploaded Logo / Reset to Default</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Upload / Replace Logo Control */}
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Upload size={18} style={{ color: '#38bdf8' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {(currentLogo.url || currentLogo.imageUrl) ? 'Replace Existing Logo' : 'Upload New Logo'}
                  </h2>
                </div>

                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Upload an image or video logo. Supported image formats: <strong>PNG, JPG, SVG, WEBP, GIF</strong> (max 5MB). Supported video formats: <strong>MP4, WebM</strong> (max 25MB).
                </p>

                {/* Upload Trigger Area */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,image/svg+xml,image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #334155',
                    borderRadius: '10px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#182235',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284c7';
                    e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.backgroundColor = '#182235';
                  }}
                >
                  <Upload size={28} style={{ color: '#38bdf8', margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                    {(currentLogo.url || currentLogo.imageUrl) ? 'Click to select replacement file (Image or Video)' : 'Click to select logo file (Image or Video)'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Images (PNG, JPG, SVG, WEBP, GIF ≤5MB) | Videos (MP4, WebM ≤25MB)
                  </div>
                </div>
              </div>

              {/* Alt Text Configuration */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Logo Alt Text (Accessibility & SEO):
                </label>
                <input
                  type="text"
                  value={altTextInput}
                  onChange={(e) => setAltTextInput(e.target.value)}
                  placeholder="e.g. AVXBS Water Solutions"
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

          </div>

          {/* DUAL-THEME PREVIEW SECTION (WHEN FILE IS SELECTED FOR PREVIEW) */}
          {previewUrl && (
            <div
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #38bdf8',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 8px 30px rgba(56, 189, 248, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sliders size={18} style={{ color: '#38bdf8' }} />
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      Preview Before Saving: Dual-Theme Simulator
                    </h2>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                    Verify how your logo appears on both Dark website header and Light backgrounds before committing.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleDiscardPending}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <X size={14} />
                    <span>Discard Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveLogo}
                    disabled={saving}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(2, 132, 199, 0.35)',
                    }}
                  >
                    <Check size={14} />
                    <span>{saving ? 'Saving...' : 'Confirm & Save Logo'}</span>
                  </button>
                </div>
              </div>

              {/* Selected File Specs Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '18px',
                  padding: '10px 14px',
                  backgroundColor: '#182235',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  fontSize: '12px',
                  color: '#cbd5e1',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>File: </span>
                  <strong>{pendingMeta.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Media Type: </span>
                  <strong style={{ color: pendingMeta.isVideo ? '#38bdf8' : '#34d399' }}>
                    {pendingMeta.isVideo ? 'Video Logo' : 'Image Logo'} ({pendingMeta.format})
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Size: </span>
                  <strong>{(pendingMeta.size / (1024 * 1024) >= 1) ? `${(pendingMeta.size / (1024 * 1024)).toFixed(2)} MB` : `${(pendingMeta.size / 1024).toFixed(1)} KB`}</strong>
                </div>
                {pendingMeta.width > 0 && (
                  <div>
                    <span style={{ color: '#64748b' }}>Dimensions: </span>
                    <strong>{pendingMeta.width} x {pendingMeta.height} px</strong>
                  </div>
                )}
              </div>

              {/* Dual Simulators Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Simulator A: Dark Website Header Theme */}
                <div
                  style={{
                    backgroundColor: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      <Moon size={15} style={{ color: '#38bdf8' }} />
                      <span>Dark Theme (Header Simulation)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Site Default</span>
                  </div>

                  <div
                    style={{
                      height: '110px',
                      backgroundColor: 'rgba(9, 13, 22, 0.95)',
                      border: '1px solid #283548',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 24px',
                    }}
                  >
                    <div style={{ maxHeight: '60px', display: 'flex', alignItems: 'center' }}>
                      {pendingMeta.isVideo ? (
                        <video
                          src={previewUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls={false}
                          style={{
                            maxHeight: '52px',
                            maxWidth: '180px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Dark Theme Preview"
                          style={{
                            maxHeight: '52px',
                            maxWidth: '180px',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>Residential</span>
                      <span>Commercial</span>
                      <span>About Us</span>
                    </div>
                  </div>
                </div>

                {/* Simulator B: Light Theme View */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    color: '#0f172a',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      <Sun size={15} style={{ color: '#f59e0b' }} />
                      <span>Light Background Simulator</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Print & Documents</span>
                  </div>

                  <div
                    style={{
                      height: '110px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 24px',
                    }}
                  >
                    <div style={{ maxHeight: '60px', display: 'flex', alignItems: 'center' }}>
                      {pendingMeta.isVideo ? (
                        <video
                          src={previewUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls={false}
                          style={{
                            maxHeight: '52px',
                            maxWidth: '180px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Light Theme Preview"
                          style={{
                            maxHeight: '52px',
                            maxWidth: '180px',
                            objectFit: 'contain',
                          }}
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569' }}>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>Residential</span>
                      <span>Commercial</span>
                      <span>About Us</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* INFORMATIONAL GUIDELINE CARD */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Info size={20} style={{ color: '#38bdf8', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
              <strong style={{ color: '#f8fafc' }}>Brand Guideline Note: </strong>
              For optimal rendering across all displays from ultra-wide desktops down to mobile screens, use transparent PNG, SVG, WEBP, GIF images or MP4, WebM videos with horizontal aspect ratios (around 3:1 or 4:1). Uploaded video logos autoplay automatically on mute in an infinite seamless loop. If no custom logo is uploaded, the public frontend automatically falls back to the animated AVXBS brand logo.
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
