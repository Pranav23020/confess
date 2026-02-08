import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/likeAnimations.css';

/**
 * Instagram-Style Like Button Component
 *
 * Features:
 * - Single tap/click toggle (like/unlike)
 * - Smooth scale and bounce animation (Instagram-style)
 * - Heart icon (outline → filled red when liked)
 * - Optimistic UI updates
 * - Mobile-first touch support
 * - Accessibility support
 * - 60fps smooth animations
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.liked - Whether the item is currently liked
 * @param {number} props.likeCount - Current like count
 * @param {Function} props.onLike - Callback when like is toggled
 * @param {boolean} props.isLoading - Whether like request is in flight
 * @param {boolean} props.compact - Compact mode (smaller size)
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
  // Animation state
  const [animatingCount, setAnimatingCount] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastLikedRef = useRef(liked);
  const buttonRef = useRef(null);

  /**
   * Handle button click - toggle like/unlike
   */
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onNavigateLogin?.();
      return;
    }

    // Don't allow clicking while loading
    if (isLoading) {
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);

    // Call the like handler
    onLike();
  }, [isLoading, onLike, isAuthenticated, onNavigateLogin]);

  /**
   * Animate like count change with pop animation
   */
  useEffect(() => {
    if (liked !== lastLikedRef.current) {
      setAnimatingCount(true);
      lastLikedRef.current = liked;
      const timeout = setTimeout(() => setAnimatingCount(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [liked]);

  const baseButtonClasses = compact 
    ? 'px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs' 
    : 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm';

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={liked ? 'Unlike this post' : 'Like this post'}
      aria-pressed={liked}
      className={`
        group/btn flex items-center gap-1 sm:gap-1.5 ${baseButtonClasses} rounded-lg sm:rounded-xl
        select-none font-bold
        like-button-transition
        ${liked
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-red-500'
        }
        ${isLoading ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
        ${isAnimating ? 'instagram-button-pulse' : ''}
        ${className}
      `}
      title={liked ? 'Unlike' : 'Like'}
    >
      {/* Heart Icon - Instagram Style */}
      <span
        className={`
          material-symbols-outlined text-base sm:text-lg md:text-xl
          transition-transform duration-300 ease-out
          ${liked ? 'filled instagram-heart-pop' : ''}
          ${isAnimating && liked ? 'instagram-heart-pop' : ''}
          ${isAnimating && !liked ? 'instagram-heart-unlike' : ''}
          group-hover/btn:scale-110
        `}
        style={{
          fontWeight: liked ? '400' : '300',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        favorite
      </span>

      {/* Like Count - Only show in non-compact mode */}
      {!compact && (
        <span 
          className={`
            tabular-nums transition-all duration-200
            ${animatingCount ? 'instagram-count-pop' : ''}
          `}
        >
          {likeCount || 0}
        </span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        {liked ? 'You like this post' : 'You do not like this post'}
      </span>
    </button>
  );
};

export default LikeButton;
