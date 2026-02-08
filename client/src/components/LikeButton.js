import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/likeAnimations.css';

/**
 * Enhanced LikeButton Component with Double-Tap Detection
 *
 * Features:
 * - Double-tap/double-click to like (smooth animation)
 * - Single-tap/click toggle
 * - Animated heart particles on like
 * - Floating hearts animation
 * - Mobile-first touchscreen support
 * - Accessibility support (keyboard, screen readers)
 * - Smooth color transitions
 * - Touch-friendly sizing
 * - Works on desktop and mobile
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.liked - Whether the item is currently liked
 * @param {number} props.likeCount - Current like count
 * @param {Function} props.onLike - Callback when like is toggled
 * @param {boolean} props.isLoading - Whether like request is in flight
 * @param {boolean} props.compact - Compact mode (mobile)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onNavigateLogin - Callback to navigate to login
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @returns {JSX.Element} The like button component
 */
const LikeButton = ({
  liked = false,
  likeCount = 0,
  onLike = () => {},
  isLoading = false,
  compact = false,
  className = '',
  onNavigateLogin = null,
  isAuthenticated = true
}) => {
  // Animation and double-tap state
  const [isDoubleTapping, setIsDoubleTapping] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [animatingCount, setAnimatingCount] = useState(false);

  // Refs for double-tap detection
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const buttonRef = useRef(null);
  const lastLikedRef = useRef(liked);

  // Configuration constants
  const DOUBLE_TAP_DELAY = 300; // ms - time window for double-tap
  const DOUBLE_TAP_TRIGGER_DELAY = 100; // ms - delay before triggering like on double-tap
  const GLOW_ANIMATION_DURATION = 600; // ms - duration of heart glow animation

  /**
   * Handle single click/tap
   * Single tap toggles the like
   */
  const handleSingleTap = useCallback(() => {
    if (!isAuthenticated) {
      onNavigateLogin?.();
      return;
    }

    if (isLoading) return;

    onLike();
  }, [isLoading, onLike, isAuthenticated, onNavigateLogin]);

  /**
   * Handle double-tap/click
   * Creates visual feedback with floating hearts and scale animation
   */
  const handleDoubleTap = useCallback(() => {
    if (!isAuthenticated) {
      onNavigateLogin?.();
      return;
    }

    if (isLoading) return;

    // Only trigger if currently not liked
    if (liked) return;

    // Visual feedback
    setIsDoubleTapping(true);
    setAnimatingCount(true);

    // Create floating hearts
    createFloatingHearts();

    // Animate the button
    setTimeout(() => {
      setIsDoubleTapping(false);
    }, GLOW_ANIMATION_DURATION);

    // Trigger the like after brief delay for better UX
    setTimeout(() => {
      onLike();
    }, DOUBLE_TAP_TRIGGER_DELAY);
  }, [liked, isLoading, onLike, isAuthenticated, onNavigateLogin]);

  /**
   * Detect double-tap on touch devices
   */
  const handleTouchStart = useCallback(
    (e) => {
      if (isLoading) return;

      tapCountRef.current += 1;

      if (tapCountRef.current === 1) {
        // First tap - wait to see if second tap comes
        tapTimeoutRef.current = setTimeout(() => {
          // Only a single tap
          if (tapCountRef.current === 1) {
            handleSingleTap();
          }
          tapCountRef.current = 0;
        }, DOUBLE_TAP_DELAY);
      } else if (tapCountRef.current === 2) {
        // Double tap detected
        clearTimeout(tapTimeoutRef.current);
        tapCountRef.current = 0;
        handleDoubleTap();
      }
    },
    [handleSingleTap, handleDoubleTap, isLoading]
  );

  /**
   * Detect double-click on desktop
   */
  const handleDoubleClick = useCallback(
    (e) => {
      e.preventDefault();
      handleDoubleTap();
    },
    [handleDoubleTap]
  );

  /**
   * Single click for desktop (with modifier key for quick unlike)
   */
  const handleClick = useCallback(
    (e) => {
      // Only trigger single tap on single clicks, not double-clicks
      // Double-click handler will take precedence
      e.preventDefault();

      // If it's a double-click event, it will be handled by onDoubleClick
      // For single clicks, we need to differentiate
      // This is handled by the click sequence - double clicks fire click + doubleclick
      // We only want single clicks here

      // Check if this is truly a single click by using a small timeout
      const clickTime = Date.now();
      if (
        lastClickTimeRef.current &&
        clickTime - lastClickTimeRef.current < 300
      ) {
        // This might be part of a double-click sequence, ignore
        return;
      }
      lastClickTimeRef.current = clickTime;

      setTimeout(() => {
        // Clear the flag after double-click window
        if (Date.now() - clickTime > 300) {
          handleSingleTap();
        }
      }, DOUBLE_TAP_DELAY + 50);
    },
    [handleSingleTap]
  );

  const lastClickTimeRef = useRef(0);

  /**
   * Create floating heart particles from the button
   * Creates 3-5 hearts that float upward with different trajectories
   */
  const createFloatingHearts = useCallback(() => {
    const heartCount = Math.random() < 0.5 ? 3 : 4;
    const hearts = Array.from({ length: heartCount }, (_, i) => ({
      id: `${Date.now()}-${i}`,
      delay: i * 80, // Stagger animation
      duration: 800 + Math.random() * 400,
      drift: (Math.random() - 0.5) * 40 // Random horizontal drift
    }));

    setFloatingHearts((prev) => [...prev, ...hearts]);

    // Clean up after animation completes
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((h) => !hearts.find((nh) => nh.id === h.id))
      );
    }, 1200);
  }, []);

  /**
   * Animate like count change with pop animation
   */
  useEffect(() => {
    if (liked !== lastLikedRef.current) {
      setAnimatingCount(true);
      lastLikedRef.current = liked;
      const timeout = setTimeout(() => setAnimatingCount(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [liked]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const baseButtonClasses = compact ? 'px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs' : 'px-3 py-2 text-sm';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        disabled={isLoading}
        aria-label={liked ? 'Unlike this post' : 'Like this post'}
        aria-pressed={liked}
        className={`
          group/btn flex items-center gap-1 ${baseButtonClasses} rounded-lg 
          select-none font-bold ring-1 ring-inset
          like-button-transition
          ${liked
            ? 'bg-red-500 text-white ring-red-500 shadow-lg shadow-red-500/30'
            : 'text-slate-400 ring-transparent hover:bg-slate-100 dark:hover:bg-white/5 hover:text-red-500'
          }
          ${isLoading ? 'opacity-75 cursor-wait' : 'cursor-pointer active:scale-95'}
          ${isDoubleTapping ? 'like-button-active' : ''}
          ${className}
        `}
        title={liked ? 'Unlike' : 'Like (or double-tap)'}
      >
        {/* Heart Icon */}
        <span
          className={`
            material-symbols-outlined text-base sm:text-lg 
            transition-all duration-200
            ${liked ? 'filled like-heart-scale' : ''}
            ${isDoubleTapping ? 'like-heart-scale' : ''}
            group-hover/btn:scale-110
          `}
        >
          favorite
        </span>

        {/* Like Count */}
        {!compact && (
          <span className={animatingCount ? 'like-count-pop' : ''}>
            {likeCount || 0}
          </span>
        )}
      </button>

      {/* Floating Hearts Animation Container */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="float-up fixed pointer-events-none"
          style={{
            left: buttonRef.current
              ? buttonRef.current.getBoundingClientRect().left +
                buttonRef.current.offsetWidth / 2
              : 0,
            top: buttonRef.current
              ? buttonRef.current.getBoundingClientRect().top
              : 0,
            '--drift': `${heart.drift}px`,
            animation: `floatUp ${heart.duration}ms ease-out forwards`,
            animationDelay: `${heart.delay}ms`,
            zIndex: 50
          }}
        >
          ❤️
        </div>
      ))}

      {/* Accessibility note */}
      <span className="sr-only">
        {liked ? 'You like this post' : 'You do not like this post'}
      </span>
    </div>
  );
};

export default LikeButton;
