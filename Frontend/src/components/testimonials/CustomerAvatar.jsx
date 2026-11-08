import React, { useState } from 'react';

// Generates dynamic 2-letter uppercase initials from any customer name
export function getCustomerInitials(name = '') {
  if (!name || typeof name !== 'string') return 'AV';
  const clean = name.trim().replace(/[^\w\s]/gi, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Preset AVXBS Brand Gradients for Initials Avatars (Navy, Cyan, Blue, Teal)
export const BRAND_AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0f172a 0%, #0085D1 100%)', // Deep Navy to Corporate Blue
  'linear-gradient(135deg, #0085D1 0%, #079C91 100%)', // Corporate Blue to Teal
  'linear-gradient(135deg, #079C91 0%, #0f172a 100%)', // Teal to Deep Navy
  'linear-gradient(135deg, #1e293b 0%, #0284c7 100%)', // Slate to Cyan
  'linear-gradient(135deg, #0369a1 0%, #06b6d4 100%)', // Deep Cyan to Light Cyan
];

export function getAvatarBackground(item, index = 0) {
  if (item?.avatarColor && item.avatarColor.trim()) {
    return item.avatarColor;
  }
  return BRAND_AVATAR_GRADIENTS[index % BRAND_AVATAR_GRADIENTS.length];
}

/**
 * Reusable CustomerAvatar component
 * - Perfectly circular with guaranteed 1:1 aspect ratio
 * - Handles image loading errors gracefully by falling back to initials
 * - Centers initials vertically and horizontally with zero clipping
 * - Provides subtle cyan glow border matching AVXBS design theme
 */
export default function CustomerAvatar({
  name = '',
  image = '',
  avatarColor = '',
  index = 0,
  size = 56, // Size in pixels
  border = '2px solid rgba(56, 189, 248, 0.75)',
  boxShadow = '0 0 16px rgba(56, 189, 248, 0.25)',
  className = '',
  style = {}
}) {
  const [imageError, setImageError] = useState(false);
  const initials = getCustomerInitials(name);
  const bg = avatarColor || getAvatarBackground({ avatarColor }, index);

  // Compute proportional font size for initials
  const fontSize = Math.max(12, Math.round(size * 0.40));

  const hasValidImage = image && image.trim() && !imageError;

  return (
    <div
      className={`avxbs-customer-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        border: border || 'none',
        boxShadow: boxShadow || 'none',
        background: bg,
        userSelect: 'none',
        ...style
      }}
      aria-label={`Avatar for ${name || 'Customer'}`}
    >
      {hasValidImage ? (
        <img
          src={image}
          alt={name ? `${name} avatar` : 'Customer'}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            borderRadius: '50%'
          }}
        />
      ) : (
        <span
          style={{
            color: '#FFFFFF',
            fontSize: `${fontSize}px`,
            fontWeight: '800',
            fontFamily: 'var(--font-primary, "SamsungOne", sans-serif)',
            letterSpacing: '0.04em',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            margin: 0,
            padding: 0,
            transform: 'none',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.35)'
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

