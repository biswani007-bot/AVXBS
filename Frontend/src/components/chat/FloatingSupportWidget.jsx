import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, MessageCircle } from 'lucide-react';

/**
 * FloatingSupportWidget Component
 * Premium floating customer-support widget:
 * - Green glowing circular avatar with multi-layer breathing neon glow animation.
 * - Clearly visible cross (×) close button at the top-right corner of the circular avatar.
 * - Clicking the close button smoothly hides the entire floating chat widget (bubble & avatar).
 * - Compact reopening button (small chat icon) appears neatly at the bottom-right corner.
 * - Draggable across the screen with touch and mouse support.
 * - Viewport bounds constraint with safe boundary padding.
 * - Distinction between dragging and clicking to prevent accidental drawer opening.
 * - Premium message speech bubble with smooth entrance and dismiss button.
 * - Responsive across desktop and mobile devices.
 */
export default function FloatingSupportWidget({ onOpenChat }) {
  const [isVisible, setIsVisible] = useState(true);
  const [showBubble, setShowBubble] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const widgetRef = useRef(null);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
    hasMoved: false,
  });

  // Handle Drag Start (Mouse & Touch)
  const handlePointerDown = (e) => {
    // If clicking any close button or re-open button, do not start drag
    if (e.target.closest('.bubble-close-btn') || e.target.closest('.avatar-close-badge-btn')) {
      return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialOffsetX: offset.x,
      initialOffsetY: offset.y,
      hasMoved: false,
    };

    setIsDragging(true);
  };

  // Handle Drag Move (Mouse & Touch)
  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.hasMoved = true;
    }

    if (dragRef.current.hasMoved) {
      if (e.cancelable && e.type === 'touchmove') {
        e.preventDefault();
      }

      // Compute desired new offset
      const targetOffsetX = dragRef.current.initialOffsetX + deltaX;
      const targetOffsetY = dragRef.current.initialOffsetY + deltaY;

      // Clamp so the avatar stays completely inside screen viewport (excluding vertical scrollbar)
      const viewportClientWidth = (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) || window.innerWidth;
      const defaultRightX = viewportClientWidth - 88;
      const defaultBottomY = window.innerHeight - 88;

      const avatarCurrentX = defaultRightX + targetOffsetX;
      const avatarCurrentY = defaultBottomY + targetOffsetY;

      const minX = 16;
      const maxX = viewportClientWidth - 76;
      const minY = 80; // Below header
      const maxY = window.innerHeight - 76;

      const clampedX = Math.min(Math.max(avatarCurrentX, minX), maxX);
      const clampedY = Math.min(Math.max(avatarCurrentY, minY), maxY);

      setOffset({
        x: clampedX - defaultRightX,
        y: clampedY - defaultBottomY,
      });
    }
  }, [isDragging]);

  // Handle Drag End
  const handlePointerEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
  }, [isDragging]);

  // Global listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove, { passive: false });
      window.addEventListener('mouseup', handlePointerEnd);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerEnd);
      window.addEventListener('touchcancel', handlePointerEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerEnd);
      window.removeEventListener('touchcancel', handlePointerEnd);
    };
  }, [isDragging, handlePointerMove, handlePointerEnd]);

  // Avatar Click Handler
  const handleAvatarClick = (e) => {
    if (dragRef.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    setShowBubble(false);
    if (onOpenChat) {
      onOpenChat();
    }
  };

  // Close the entire floating chat widget
  const handleCloseWidget = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  // Reopen the floating chat widget
  const handleReopenWidget = (e) => {
    e.stopPropagation();
    setIsVisible(true);
    setShowBubble(true);
  };

  // Determine speech bubble placement: Left if avatar is in right half of screen, right otherwise
  const currentAvatarX = (typeof window !== 'undefined' ? (document.documentElement.clientWidth || window.innerWidth) - 88 : 1000) + offset.x;
  const isRightSide = currentAvatarX > ((typeof window !== 'undefined' ? (document.documentElement.clientWidth || window.innerWidth) : 1200) / 2);

  // If closed, render subtle floating chat pill button at bottom-right corner to reopen
  if (!isVisible) {
    return (
      <button
        type="button"
        className="reopen-chat-launcher-btn"
        onClick={handleReopenWidget}
        aria-label="Reopen Customer Support Chat"
        title="Open Support Chat"
      >
        <MessageCircle size={20} className="reopen-chat-icon" />
        <span className="reopen-chat-text">Chat with us</span>
        <span className="reopen-chat-online-dot" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={`floating-support-chat ${isDragging ? 'is-dragging' : ''}`}
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        flexDirection: isRightSide ? 'row' : 'row-reverse',
        touchAction: isDragging ? 'none' : 'auto',
      }}
      role="complementary"
      aria-label="Customer Support Chat"
    >
      {/* 1. White Speech Bubble with Two-Line Text */}
      {showBubble && (
        <div
          className={`chat-speech-bubble ${isRightSide ? 'bubble-pointing-right' : 'bubble-pointing-left'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bubble-text-lines">
            <span className="bubble-line line-top">Check for special</span>
            <span className="bubble-line line-bottom">offers, chat with us</span>
          </div>
          <button
            type="button"
            className="bubble-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowBubble(false);
            }}
            aria-label="Dismiss special offer notice"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* 2. Green Glowing Circular Avatar with Top-Right Close Button */}
      <div className="avatar-widget-interactive-box">
        {/* Top-Right Cross (×) Button to close the whole chat widget */}
        <button
          type="button"
          className="avatar-close-badge-btn"
          onClick={handleCloseWidget}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Close Chat Widget"
          title="Close chat widget"
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          className="chat-avatar-btn"
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onClick={handleAvatarClick}
          aria-label="Chat with water treatment specialist"
        >
          <div className="avatar-circle-glow-wrapper">
            {/* Animated Neon Green Glow Layers */}
            <div className="avatar-glow-pulse" aria-hidden="true" />
            <div className="avatar-green-border" aria-hidden="true" />

            {/* Profile Image with Pure White Background */}
            <div className="avatar-img-container">
              <img
                src="/assets/support-agent-white.png"
                alt="AVXBS Support Specialist"
                className="avatar-img"
                draggable="false"
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
