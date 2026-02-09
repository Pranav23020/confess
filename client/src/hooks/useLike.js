import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { likesAPI } from '../api';
import { LikeCacheContext } from '../context/LikeCacheContext';
import socket from '../utils/socket';

/**
 * Custom hook for managing like state and actions
 *
 * Features:
 * - INSTANT optimistic UI updates (zero delay)
 * - Fast request debouncing (300ms prevents spam)
 * - Automatic error rollback
 * - Smart caching for instant repeated views
 * - No loading states - purely optimistic
 *
 * @param {string} confessionId - The ID of the confession/reply to like
 * @param {number} initialLikeCount - Initial like count from server
 * @param {boolean} initialLiked - Whether the user has already liked this
 * @param {Function} onLikeChange - Optional callback when like state changes
 * @returns {Object} Like state and handlers
 */
export const useLike = (
  confessionId,
  initialLikeCount = 0,
  initialLiked = false,
  onLikeChange = null
) => {
  const likeCache = useContext(LikeCacheContext);

  // State management - Initialize from cache or props (INSTANT, no API call)
  const [liked, setLiked] = useState(() => {
    if (likeCache) {
      const cached = likeCache.getCachedLikeStatus(confessionId);
      if (cached) return cached.liked;
    }
    return initialLiked;
  });

  const [likeCount, setLikeCount] = useState(() => {
    if (likeCache) {
      const cached = likeCache.getCachedLikeStatus(confessionId);
      if (cached) return cached.likeCount;
    }
    return initialLikeCount;
  });

  const [error, setError] = useState(null);

  // Refs for strict request control
  const requestInFlightRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const pendingRequestRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasInitialized = useRef(false);

  // Store previous state for rollback on error
  const previousStateRef = useRef({ liked, likeCount });

  // Silently sync with server on mount (no loading state, updates in background)
  useEffect(() => {
    const syncWithServer = async () => {
      if (hasInitialized.current || !confessionId) return;
      hasInitialized.current = true;

      // Check cache first
      if (likeCache) {
        const cached = likeCache.getCachedLikeStatus(confessionId);
        if (cached) {
          // Cache hit - already showing correct data, no need to fetch
          return;
        }
      }

      // Not in cache - fetch from server silently in background
      try {
        const response = await likesAPI.check(confessionId);
        if (isMountedRef.current) {
          const serverLiked = response.data.liked;
          const serverLikeCount = response.data.likeCount || initialLikeCount;

          // Update cache
          if (likeCache) {
            likeCache.setCachedLikeStatus(confessionId, serverLiked, serverLikeCount);
          }

          // Update state silently (no loading indicator)
          setLiked(serverLiked);
          setLikeCount(serverLikeCount);
        }
      } catch (err) {
        console.error('Failed to sync like status:', err);
        // Fail silently - user still sees optimistic state
      }
    };

    syncWithServer();
  }, [confessionId, initialLikeCount, likeCache]);

  /**
   * Real-time WebSocket sync - Instagram-level live updates  
   * Updates UI instantly when anyone likes/unlikes
   */
  useEffect(() => {
    if (!confessionId) return;

    const handleLikeUpdate = (data) => {
      if (data.confessionId !== confessionId) return;
      if (typeof data.likeCount === 'number' && isMountedRef.current) {
        setLikeCount(data.likeCount);
        if (likeCache) {
          likeCache.setCachedLikeStatus(confessionId, liked, data.likeCount);
        }
        if (onLikeChange) {
          onLikeChange(liked, data.likeCount);
        }
      }
    };

    socket.on('confession:engagement', handleLikeUpdate);
    return () => socket.off('confession:engagement', handleLikeUpdate);
  }, [confessionId, liked, likeCache, onLikeChange]);

  /**
   * INSTANT toggle like with optimistic updates
   * UI updates immediately, API syncs in background
   * Improved debouncing and request queuing to prevent duplicates
   */
  const toggleLike = useCallback(async () => {
    // STRICT: Block if ANY request is in flight
    if (requestInFlightRef.current) {
      console.log('⏸️ Request already in flight, blocking duplicate');
      return;
    }

    // Improved debounce: prevent rapid-fire requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < 300) {
      // Queue only ONE pending request (prevents duplicate queueing)
      if (!pendingRequestRef.current) {
        const delay = 300 - timeSinceLastRequest;
        console.log(`⏳ Queueing request (${delay}ms delay)`);
        pendingRequestRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            pendingRequestRef.current = null;
            toggleLike();
          }
        }, delay);
      } else {
        console.log('⏸️ Request already queued, ignoring duplicate');
      }
      return;
    }

    // LOCK: Set in-flight flag IMMEDIATELY before any async work
    requestInFlightRef.current = true;
    console.log(`🔒 Request locked for confession: ${confessionId}`);
    setError(null);

    // Store current state for rollback
    const prevState = { liked, likeCount };
    previousStateRef.current = prevState;

    // INSTANT optimistic update (NO loading state)
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    // Update cache immediately for instant repeated views
    if (likeCache) {
      likeCache.setCachedLikeStatus(confessionId, newLiked, newLikeCount);
    }

    // Call the callback if provided
    if (onLikeChange) {
      onLikeChange(newLiked, newLikeCount);
    }

    try {
      // Sync with server in background (user doesn't wait)
      console.log(`📡 Sending ${newLiked ? 'like' : 'unlike'} request...`);
      const response = await likesAPI.toggle(confessionId);

      // Only update if component is still mounted
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, ignoring response');
        return;
      }

      // Sync with server truth
      const serverLiked = response.data.liked;
      const serverLikeCount = response.data.likeCount;

      console.log(`✅ Server confirmed: liked=${serverLiked}, count=${serverLikeCount}`);

      setLiked(serverLiked);
      setLikeCount(serverLikeCount);

      // Update cache with server truth
      if (likeCache) {
        likeCache.setCachedLikeStatus(confessionId, serverLiked, serverLikeCount);
      }

      if (onLikeChange) {
        onLikeChange(serverLiked, serverLikeCount);
      }

      setError(null);
      lastRequestTimeRef.current = Date.now();
    } catch (err) {
      console.error('❌ Failed to toggle like:', err);

      if (!isMountedRef.current) {
        return;
      }

      // Rollback to previous state on error
      console.log('↩️ Rolling back to previous state');
      setLiked(prevState.liked);
      setLikeCount(prevState.likeCount);

      // Rollback cache too
      if (likeCache) {
        likeCache.setCachedLikeStatus(confessionId, prevState.liked, prevState.likeCount);
      }

      if (onLikeChange) {
        onLikeChange(prevState.liked, prevState.likeCount);
      }

      // Set error message
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to update like';
      setError(errorMsg);
      lastRequestTimeRef.current = Date.now();
    } finally {
      // UNLOCK: Always release the lock
      requestInFlightRef.current = false;
      console.log(`🔓 Request unlocked for confession: ${confessionId}`);
    }
  }, [confessionId, liked, likeCount, onLikeChange, likeCache]);

  /**
   * Reset hook to initial state
   */
  const reset = useCallback(() => {
    setLiked(initialLiked);
    setLikeCount(initialLikeCount);
    setError(null);
    requestInFlightRef.current = false;
    lastRequestTimeRef.current = 0;
    if (pendingRequestRef.current) {
      clearTimeout(pendingRequestRef.current);
      pendingRequestRef.current = null;
    }
  }, [initialLiked, initialLikeCount]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pendingRequestRef.current) {
        clearTimeout(pendingRequestRef.current);
        pendingRequestRef.current = null;
      }
    };
  }, []);

  return {
    // State
    liked,
    likeCount,
    error,

    // Actions
    toggleLike,
    reset,

    // Utility
    setLiked,
    setLikeCount,
    setError
  };
};

export default useLike;
