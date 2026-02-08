import React, { createContext, useCallback, useRef } from 'react';

export const LikeCacheContext = createContext();

/**
 * Caches like status for confessions to prevent redundant API calls
 * Stores up to 50 confessions in memory for quick lookups
 */
export const LikeCacheProvider = ({ children }) => {
  // In-memory cache: { confessionId: { liked, likeCount, timestamp } }
  const cacheRef = useRef({});
  const maxCacheSize = 50;
  const cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached like status for a confession
   */
  const getCachedLikeStatus = useCallback((confessionId) => {
    const cached = cacheRef.current[confessionId];
    if (!cached) return null;

    // Check if cache is still valid (not expired)
    if (Date.now() - cached.timestamp > cacheTTL) {
      delete cacheRef.current[confessionId];
      return null;
    }

    return { liked: cached.liked, likeCount: cached.likeCount };
  }, []);

  /**
   * Set like status in cache for a confession
   */
  const setCachedLikeStatus = useCallback((confessionId, liked, likeCount) => {
    // If cache is getting too large, remove oldest entries
    const cacheKeys = Object.keys(cacheRef.current);
    if (cacheKeys.length >= maxCacheSize) {
      // Find and remove the oldest entry (lowest timestamp)
      let oldestKey = cacheKeys[0];
      let oldestTime = cacheRef.current[oldestKey].timestamp;

      for (const key of cacheKeys) {
        if (cacheRef.current[key].timestamp < oldestTime) {
          oldestTime = cacheRef.current[key].timestamp;
          oldestKey = key;
        }
      }

      delete cacheRef.current[oldestKey];
    }

    // Add or update cache entry with timestamp
    cacheRef.current[confessionId] = {
      liked,
      likeCount,
      timestamp: Date.now()
    };
  }, []);

  /**
   * Clear entire cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  /**
   * Get cache size for debugging
   */
  const getCacheSize = useCallback(() => {
    return Object.keys(cacheRef.current).length;
  }, []);

  return (
    <LikeCacheContext.Provider value={{
      getCachedLikeStatus,
      setCachedLikeStatus,
      clearCache,
      getCacheSize
    }}>
      {children}
    </LikeCacheContext.Provider>
  );
};
