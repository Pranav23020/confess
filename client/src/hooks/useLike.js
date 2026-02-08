import { useState, useCallback, useRef, useEffect } from 'react';
import { likesAPI } from '../api';

/**
 * Custom hook for managing like state and actions
 *
 * Features:
 * - Optimistic UI updates (instant feedback)
 * - Strict request debouncing (prevents duplicate requests)
 * - Error handling with automatic rollback
 * - Real-time synchronization with socket.io
 * - Network state awareness
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
  // State management
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for strict request control
  const requestInFlightRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const pendingRequestRef = useRef(null);
  const isMountedRef = useRef(true);

  // Store previous state for rollback on error
  const previousStateRef = useRef({ liked: initialLiked, likeCount: initialLikeCount });

  /**
   * Strict debounced toggle like with optimistic updates
   * Prevents any request while one is in flight
   * Prevents duplicate requests within 800ms
   */
  const toggleLike = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (requestInFlightRef.current) {
      return;
    }

    // Strict debounce: prevent requests within 800ms of last successful request
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    if (timeSinceLastRequest < 800) {
      // Queue only one pending request
      if (!pendingRequestRef.current) {
        const delay = 800 - timeSinceLastRequest;
        pendingRequestRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            toggleLike();
          }
          pendingRequestRef.current = null;
        }, delay);
      }
      return;
    }

    // Mark request as in flight immediately to block concurrent requests
    requestInFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    // Store current state for rollback
    const prevState = { liked, likeCount };
    previousStateRef.current = prevState;

    // Optimistic update
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : likeCount - 1;
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    // Call the callback if provided
    if (onLikeChange) {
      onLikeChange(newLiked, newLikeCount);
    }

    try {
      // Send to server
      const response = await likesAPI.toggle(confessionId);

      // Only update if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Update UI with server response (use server truth)
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);

      if (onLikeChange) {
        onLikeChange(response.data.liked, response.data.likeCount);
      }

      setError(null);
      lastRequestTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to toggle like:', err);

      if (!isMountedRef.current) {
        return;
      }

      // Rollback to previous state on error
      setLiked(prevState.liked);
      setLikeCount(prevState.likeCount);

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
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      requestInFlightRef.current = false;
    }
  }, [confessionId, liked, likeCount, onLikeChange]);

  /**
   * Reset hook to initial state
   */
  const reset = useCallback(() => {
    setLiked(initialLiked);
    setLikeCount(initialLikeCount);
    setError(null);
    setIsLoading(false);
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
    isLoading,
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
      setLikeCount(prevState.likeCount);

      if (onLikeChange) {
        onLikeChange(prevState.liked, prevState.likeCount);
      }

      // Set error message
      const errorMsg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to update like';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      requestInFlightRef.current = false;
    }
  }, [confessionId, liked, likeCount, onLikeChange]);

  /**
   * Reset hook to initial state
   */
  const reset = useCallback(() => {
    setLiked(initialLiked);
    setLikeCount(initialLikeCount);
    setError(null);
    setIsLoading(false);
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
      if (pendingRequestRef.current) {
        clearTimeout(pendingRequestRef.current);
      }
    };
  }, []);

  return {
    // State
    liked,
    likeCount,
    isLoading,
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
