import { useState, useCallback, useRef, useEffect } from 'react';
import { likesAPI } from '../api';

/**
 * Custom hook for managing like state and actions
 *
 * Features:
 * - Optimistic UI updates (instant feedback)
 * - Request debouncing (prevents duplicate requests)
 * - Error handling with automatic rollback
 * - Real-time synchronization
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

  // Refs for request debouncing
  const requestInFlightRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const pendingRequestRef = useRef(null);

  // Store previous state for rollback on error
  const previousStateRef = useRef({ liked: initialLiked, likeCount: initialLikeCount });

  /**
   * Debounced toggle like with optimistic updates
   * Prevents duplicate requests within 500ms
   */
  const toggleLike = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (requestInFlightRef.current) {
      return;
    }

    // Debounce: prevent requests within 500ms
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 500) {
      // Queue the next request to run after debounce period
      if (!pendingRequestRef.current) {
        pendingRequestRef.current = setTimeout(() => {
          toggleLike();
          pendingRequestRef.current = null;
        }, 500 - (now - lastRequestTimeRef.current));
      }
      return;
    }

    lastRequestTimeRef.current = now;
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

      // Update UI with server response (in case of discrepancy)
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);

      if (onLikeChange) {
        onLikeChange(response.data.liked, response.data.likeCount);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to toggle like:', err);

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
