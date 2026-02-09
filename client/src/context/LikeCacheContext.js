import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

export const LikeCacheContext = createContext();

const CACHE_STORAGE_KEY = 'confession_like_cache_v1';

/**
 * Caches like status for confessions to prevent redundant API calls
 * Stores up to 200 confessions in memory AND localStorage for persistence
 * Cache persists for 15 minutes across page reloads
 */
export const LikeCacheProvider = ({ children }) => {
  // In-memory cache: { confessionId: { liked, likeCount, timestamp } }
  const cacheRef = useRef({});
  const isInitialized = useRef(false);
  const maxCacheSize = 200; // Increased from 50 for better performance
  const cacheTTL = 15 * 60 * 1000; // 15 minutes (increased from 5)

  /**
   * Load cache from localStorage on mount
   */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Filter out expired entries
        const validEntries = {};
        for (const [id, data] of Object.entries(parsed)) {
          if (now - data.timestamp < cacheTTL) {
            validEntries[id] = data;
          }
        }

        cacheRef.current = validEntries;
        logger.log(`✅ Loaded ${Object.keys(validEntries).length} like statuses from cache`);
      }
    } catch (err) {
      console.error('Failed to load like cache from localStorage:', err);
      cacheRef.current = {};
    }
  }, [cacheTTL]);

  /**
   * Save cache to localStorage
   */
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheRef.current));
    } catch (err) {
      console.error('Failed to save like cache to localStorage:', err);
    }
  }, []);

  /**
   * Get cached like status for a confession
   */
  const getCachedLikeStatus = useCallback((confessionId) => {
    const cached = cacheRef.current[confessionId];
    if (!cached) return null;

    // Check if cache is still valid (not expired)
    if (Date.now() - cached.timestamp > cacheTTL) {
      delete cacheRef.current[confessionId];
      saveToLocalStorage();
      return null;
    }

    return { liked: cached.liked, likeCount: cached.likeCount };
  }, [cacheTTL, saveToLocalStorage]);

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

    // Persist to localStorage
    saveToLocalStorage();
  }, [saveToLocalStorage]);

  /**
   * Clear entire cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear cache from localStorage:', err);
    }
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
