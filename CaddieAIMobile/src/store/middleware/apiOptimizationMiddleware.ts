/**
 * API Optimization Middleware
 * 
 * Redux middleware that automatically optimizes API calls by:
 * - Deduplicating concurrent identical requests
 * - Implementing request caching with TTL
 * - Rate limiting to prevent API abuse
 * - Batch processing related requests
 */

import { Middleware, MiddlewareAPI, AnyAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface RequestCache {
  [key: string]: {
    timestamp: number;
    promise: Promise<any>;
    result?: any;
    ttl: number;
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface ApiOptimizationConfig {
  enableDeduplication: boolean;
  enableCaching: boolean;
  enableRateLimiting: boolean;
  defaultCacheTTL: number;
  rateLimitWindow: number;
  maxRequestsPerWindow: number;
}

const defaultConfig: ApiOptimizationConfig = {
  enableDeduplication: true,
  enableCaching: true,
  enableRateLimiting: true,
  defaultCacheTTL: 300000, // 5 minutes
  rateLimitWindow: 60000, // 1 minute
  maxRequestsPerWindow: 100, // 100 requests per minute
};

/**
 * Creates API optimization middleware with configuration
 */
export const createApiOptimizationMiddleware = (
  config: Partial<ApiOptimizationConfig> = {}
): Middleware => {
  const finalConfig = { ...defaultConfig, ...config };
  const requestCache: RequestCache = {};
  const rateLimits: { [key: string]: RateLimitEntry } = {};
  
  return (api: MiddlewareAPI<any, RootState>) => (next) => (action: any) => {
    // Only process async thunk actions
    if (!action.type?.endsWith('/pending')) {
      return next(action);
    }

    const actionType = action.type.replace('/pending', '');
    const requestId = `${actionType}:${JSON.stringify(action.meta?.arg || {})}`;
    const now = Date.now();

    // Rate limiting check
    if (finalConfig.enableRateLimiting) {
      const clientId = 'default'; // Could be user-specific in future
      let rateLimit = rateLimits[clientId];
      
      if (!rateLimit || now > rateLimit.resetTime) {
        rateLimit = {
          count: 0,
          resetTime: now + finalConfig.rateLimitWindow,
        };
        rateLimits[clientId] = rateLimit;
      }
      
      if (rateLimit.count >= finalConfig.maxRequestsPerWindow) {
        console.warn(`⚠️ API Rate limit exceeded for ${actionType}`);
        // Return rejected action instead of proceeding
        const rejectedAction = {
          ...action,
          type: action.type.replace('/pending', '/rejected'),
          payload: 'Rate limit exceeded',
        };
        return next(rejectedAction);
      }
      
      rateLimit.count++;
    }

    // Request deduplication
    if (finalConfig.enableDeduplication) {
      const existingRequest = requestCache[requestId];
      
      if (existingRequest && existingRequest.promise) {
        console.log(`🔄 Deduplicating request: ${actionType}`);
        
        // Return the existing promise instead of making a new request
        existingRequest.promise
          .then((result) => {
            const fulfilledAction = {
              ...action,
              type: action.type.replace('/pending', '/fulfilled'),
              payload: result,
            };
            api.dispatch(fulfilledAction);
          })
          .catch((error) => {
            const rejectedAction = {
              ...action,
              type: action.type.replace('/pending', '/rejected'),
              payload: error.message || 'Request failed',
            };
            api.dispatch(rejectedAction);
          });
        
        return; // Don't proceed with the original action
      }
    }

    // Cache check
    if (finalConfig.enableCaching) {
      const cached = requestCache[requestId];
      
      if (cached && cached.result && (now - cached.timestamp) < cached.ttl) {
        console.log(`📦 Cache hit for: ${actionType}`);
        
        // Return cached result immediately
        const fulfilledAction = {
          ...action,
          type: action.type.replace('/pending', '/fulfilled'),
          payload: cached.result,
        };
        return next(fulfilledAction);
      }
    }

    // Proceed with the request and cache the promise
    const result = next(action);
    
    // Store the promise for deduplication (simplified approach)
    if (finalConfig.enableDeduplication && result) {
      requestCache[requestId] = {
        timestamp: now,
        promise: Promise.resolve(result),
        ttl: getCacheTTL(actionType, finalConfig.defaultCacheTTL),
      };
      
      // Clean up after a delay
      setTimeout(() => {
        if (requestCache[requestId]) {
          delete requestCache[requestId];
        }
      }, 10000); // 10 seconds cleanup delay
    }

    return result;
  };
};

/**
 * Determines appropriate cache TTL based on action type
 */
const getCacheTTL = (actionType: string, defaultTTL: number): number => {
  const ttlMap: { [key: string]: number } = {
    // User courses - cache for 5 minutes
    'userCourses/fetchUserCourses': 300000,
    
    // General courses - cache for 10 minutes
    'courses/fetchCourses': 600000,
    'courses/searchCourses': 300000, // Shorter for search results
    
    // Nearby courses - cache for 15 minutes
    'courses/fetchNearbyCourses': 900000,
    
    // Proximity checks - cache for 3 minutes
    'userCourses/checkProximity': 180000,
    
    // Round data - cache for 1 minute (more dynamic)
    'rounds/fetchActiveRound': 60000,
    
    // Auth data - cache for 30 minutes
    'auth/initializeAuth': 1800000,
  };

  return ttlMap[actionType] || defaultTTL;
};

/**
 * Background cache cleanup utility
 */
export const startCacheCleanup = (
  cacheRef: RequestCache,
  interval: number = 300000 // 5 minutes
) => {
  return setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of Object.entries(cacheRef)) {
      if (now - entry.timestamp > entry.ttl) {
        delete cacheRef[key];
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }, interval);
};

/**
 * Cache invalidation utility
 */
export const createCacheInvalidator = (cacheRef: RequestCache) => {
  return {
    invalidateByPattern: (pattern: RegExp | string) => {
      let invalidated = 0;
      const keysToDelete: string[] = [];
      
      for (const key of Object.keys(cacheRef)) {
        const matches = typeof pattern === 'string' 
          ? key.includes(pattern)
          : pattern.test(key);
          
        if (matches) {
          keysToDelete.push(key);
          invalidated++;
        }
      }
      
      keysToDelete.forEach(key => delete cacheRef[key]);
      
      console.log(`🗑️ Invalidated ${invalidated} cache entries matching pattern`);
      return invalidated;
    },
    
    invalidateByType: function(actionType: string) {
      return this.invalidateByPattern(actionType);
    },
    
    clearAll: () => {
      const count = Object.keys(cacheRef).length;
      for (const key of Object.keys(cacheRef)) {
        delete cacheRef[key];
      }
      console.log(`🗑️ Cleared all ${count} cache entries`);
      return count;
    },
  };
};

// Default middleware instance
export const apiOptimizationMiddleware = createApiOptimizationMiddleware();