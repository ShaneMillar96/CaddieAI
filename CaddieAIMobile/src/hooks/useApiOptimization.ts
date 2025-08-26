/**
 * API Call Optimization Hook
 * 
 * Provides utilities for optimizing API calls to reduce redundancy and improve performance:
 * - Request deduplication for concurrent calls
 * - Intelligent caching with TTL
 * - Conditional fetching based on data freshness
 * - Background refresh patterns
 */

import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import type { AsyncThunk } from '@reduxjs/toolkit';

interface CacheEntry {
  timestamp: number;
  data: any;
  isRefreshing?: boolean;
}

interface ApiOptimizationOptions {
  cacheTTL?: number; // Time to live in milliseconds
  enableDeduplication?: boolean;
  backgroundRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

/**
 * Hook for optimizing API calls with caching and deduplication
 */
export const useApiOptimization = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const activeRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Clear expired cache entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of cache.current.entries()) {
        if (now - entry.timestamp > 300000) { // 5 minutes max cache
          cache.current.delete(key);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  /**
   * Optimized fetch with caching and deduplication
   */
  const optimizedFetch = useCallback(async <T>(
    cacheKey: string,
    fetchThunk: AsyncThunk<T, any, any>,
    params: any,
    options: ApiOptimizationOptions = {}
  ): Promise<T> => {
    const {
      cacheTTL = 300000, // 5 minutes default
      enableDeduplication = true,
      backgroundRefresh = true,
      staleWhileRevalidate = true,
    } = options;

    const now = Date.now();
    const cached = cache.current.get(cacheKey);

    // Return cached data if fresh and not stale-while-revalidate
    if (cached && (now - cached.timestamp < cacheTTL) && !staleWhileRevalidate) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      return cached.data;
    }

    // Deduplication: return existing promise if same request is in flight
    if (enableDeduplication && activeRequests.current.has(cacheKey)) {
      console.log(`🔄 Deduplicating request for ${cacheKey}`);
      return activeRequests.current.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = dispatch(fetchThunk(params)).unwrap();
    
    if (enableDeduplication) {
      activeRequests.current.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      
      // Cache the result
      cache.current.set(cacheKey, {
        timestamp: now,
        data: result,
      });

      console.log(`✅ Cached fresh data for ${cacheKey}`);
      return result;
    } catch (error) {
      // Return stale data on error if available
      if (cached && staleWhileRevalidate) {
        console.log(`⚠️ Request failed, returning stale data for ${cacheKey}`);
        return cached.data;
      }
      throw error;
    } finally {
      if (enableDeduplication) {
        activeRequests.current.delete(cacheKey);
      }
    }
  }, [dispatch]);

  /**
   * Conditional fetch - only fetch if data is stale or missing
   */
  const conditionalFetch = useCallback(<T>(
    cacheKey: string,
    fetchThunk: AsyncThunk<T, any, any>,
    params: any,
    existingData: T | null,
    isLoading: boolean,
    options: { forceRefresh?: boolean; cacheTTL?: number } = {}
  ): boolean => {
    const { forceRefresh = false, cacheTTL = 300000 } = options;

    // Don't fetch if already loading
    if (isLoading && !forceRefresh) {
      return false;
    }

    // Always fetch if no data exists
    if (!existingData) {
      optimizedFetch(cacheKey, fetchThunk, params, { cacheTTL });
      return true;
    }

    // Check cache freshness
    const cached = cache.current.get(cacheKey);
    const now = Date.now();
    
    if (forceRefresh || !cached || (now - cached.timestamp > cacheTTL)) {
      optimizedFetch(cacheKey, fetchThunk, params, { 
        cacheTTL,
        staleWhileRevalidate: true // Return stale data while refreshing
      });
      return true;
    }

    return false;
  }, [optimizedFetch]);

  /**
   * Background refresh for keeping data fresh
   */
  const backgroundRefresh = useCallback(<T>(
    cacheKey: string,
    fetchThunk: AsyncThunk<T, any, any>,
    params: any,
    options: { interval?: number } = {}
  ) => {
    const { interval = 600000 } = options; // 10 minutes default

    return setInterval(() => {
      optimizedFetch(cacheKey, fetchThunk, params, {
        staleWhileRevalidate: true,
        backgroundRefresh: true,
      });
    }, interval);
  }, [optimizedFetch]);

  /**
   * Invalidate cache entries by pattern
   */
  const invalidateCache = useCallback((pattern: string | RegExp) => {
    const keysToDelete: string[] = [];
    
    for (const key of cache.current.keys()) {
      if (typeof pattern === 'string' && key.includes(pattern)) {
        keysToDelete.push(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      cache.current.delete(key);
      console.log(`🗑️ Invalidated cache for ${key}`);
    });

    return keysToDelete.length;
  }, []);

  /**
   * Get cache statistics for debugging
   */
  const getCacheStats = useCallback(() => {
    const stats = {
      totalEntries: cache.current.size,
      activeRequests: activeRequests.current.size,
      entries: Array.from(cache.current.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        isStale: Date.now() - entry.timestamp > 300000,
      })),
    };

    console.log('📊 API Cache Stats:', stats);
    return stats;
  }, []);

  return {
    optimizedFetch,
    conditionalFetch,
    backgroundRefresh,
    invalidateCache,
    getCacheStats,
  };
};

/**
 * Hook for location-based API optimization
 * Prevents redundant location requests and caches location data
 */
export const useLocationOptimization = () => {
  const locationCache = useRef<{
    location: any | null;
    timestamp: number;
    accuracy: number;
  }>({ location: null, timestamp: 0, accuracy: 0 });

  const getOptimizedLocation = useCallback(async (
    locationService: any,
    options: { 
      maxAge?: number; // Max age in milliseconds
      minAccuracy?: number; // Minimum accuracy in meters
      forceRefresh?: boolean;
    } = {}
  ) => {
    const { maxAge = 60000, minAccuracy = 100, forceRefresh = false } = options;
    const now = Date.now();
    const cached = locationCache.current;

    // Return cached location if fresh and accurate enough
    if (
      !forceRefresh && 
      cached.location && 
      (now - cached.timestamp < maxAge) &&
      cached.accuracy <= minAccuracy
    ) {
      console.log('📍 Using cached location');
      return cached.location;
    }

    try {
      console.log('📍 Fetching fresh location');
      const hasPermission = await locationService.requestLocationPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await locationService.getCurrentPosition();
      
      if (location) {
        // Cache the new location
        locationCache.current = {
          location,
          timestamp: now,
          accuracy: location.accuracy || 0,
        };
        
        console.log('📍 Cached fresh location with accuracy:', location.accuracy);
        return location;
      }

      throw new Error('Unable to get location');
    } catch (error) {
      // Return stale location if available
      if (cached.location) {
        console.log('⚠️ Location request failed, using stale location');
        return cached.location;
      }
      throw error;
    }
  }, []);

  const invalidateLocationCache = useCallback(() => {
    locationCache.current = { location: null, timestamp: 0, accuracy: 0 };
    console.log('🗑️ Invalidated location cache');
  }, []);

  return {
    getOptimizedLocation,
    invalidateLocationCache,
  };
};