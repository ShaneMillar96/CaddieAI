/**
 * Optimized Screen Data Hooks
 * 
 * Provides optimized data fetching patterns for screens to reduce API redundancy:
 * - Smart refresh logic based on data age and user interaction
 * - Elimination of duplicate location requests
 * - Conditional API calls based on existing data
 * - Background refresh for stale data
 */

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { AppDispatch, RootState } from '../store';
import { 
  fetchCourses, 
  searchCourses, 
  fetchNearbyCourses,
} from '../store/slices/courseSlice';
import { 
  fetchUserCourses,
  checkProximityToUserCourses,
} from '../store/slices/userCoursesSlice';
import { useLocationOptimization } from './useApiOptimization';
import { golfLocationService } from '../services/LocationService';

/**
 * Optimized courses screen data fetching
 * Reduces redundant API calls and improves location handling
 */
export const useOptimizedCoursesData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { getOptimizedLocation } = useLocationOptimization();
  
  const {
    courses,
    nearbyCourses,
    isLoading,
    isLoadingNearby,
    lastLocation,
  } = useSelector((state: RootState) => state.courses);

  const lastFetchTime = useRef<number>(0);
  const locationCache = useRef<any>(null);

  /**
   * Smart initial data loading - only fetch if data is missing or stale
   */
  const loadInitialCourses = useCallback(() => {
    const now = Date.now();
    const STALE_THRESHOLD = 300000; // 5 minutes
    
    // Don't fetch if already loading or data is fresh
    if (isLoading || (courses.length > 0 && (now - lastFetchTime.current) < STALE_THRESHOLD)) {
      console.log('📦 Courses: Skipping fetch - data is fresh or loading');
      return;
    }

    console.log('🚀 Courses: Loading initial courses data');
    dispatch(fetchCourses({ page: 1, pageSize: 20 }));
    lastFetchTime.current = now;
  }, [dispatch, courses.length, isLoading]);

  /**
   * Optimized nearby courses search with location caching
   */
  const searchNearby = useCallback(async (forceRefresh = false) => {
    // Don't search if already loading
    if (isLoadingNearby && !forceRefresh) {
      console.log('📦 NearBy: Already loading, skipping');
      return;
    }

    try {
      // Use optimized location fetching
      const location = await getOptimizedLocation(golfLocationService, {
        maxAge: 300000, // 5 minutes
        minAccuracy: 1000, // 1km accuracy is fine for nearby search
        forceRefresh,
      });

      if (!location) {
        throw new Error('Location not available');
      }

      // Check if we need to fetch (location changed significantly or data is stale)
      const lastLoc = lastLocation;
      const locationChanged = !lastLoc || 
        Math.abs(lastLoc.latitude - location.latitude) > 0.01 || 
        Math.abs(lastLoc.longitude - location.longitude) > 0.01;

      const now = Date.now();
      const NEARBY_CACHE_TIME = 600000; // 10 minutes for nearby results
      const isStale = nearbyCourses.length === 0 || 
        (locationChanged || (now - lastFetchTime.current) > NEARBY_CACHE_TIME);

      if (!isStale && !forceRefresh) {
        console.log('📦 Nearby: Using cached nearby results');
        return;
      }

      console.log('🔍 Nearby: Fetching nearby courses');
      const nearbyRequest = {
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: 50,
      };

      dispatch(fetchNearbyCourses(nearbyRequest));
      locationCache.current = location;
      lastFetchTime.current = now;

    } catch (error) {
      console.error('❌ Nearby: Error getting nearby courses:', error);
      throw error;
    }
  }, [dispatch, isLoadingNearby, nearbyCourses.length, lastLocation, getOptimizedLocation]);

  /**
   * Optimized search with debouncing and result caching
   */
  const searchDebounced = useCallback((term: string) => {
    // Simple search optimization - only search if term is meaningful
    if (term.trim().length < 2) {
      return;
    }

    console.log('🔍 Courses: Searching for:', term);
    dispatch(searchCourses({
      query: term.trim(),
      page: 1,
      pageSize: 20,
    }));
  }, [dispatch]);

  return {
    loadInitialCourses,
    searchNearby,
    searchDebounced,
    hasLocation: !!locationCache.current,
  };
};

/**
 * Optimized user courses data fetching
 * Eliminates redundant proximity checks and location requests
 */
export const useOptimizedUserCoursesData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { getOptimizedLocation } = useLocationOptimization();
  
  const {
    userCourses,
    isLoading,
    isCheckingProximity,
    proximityStatus,
  } = useSelector((state: RootState) => state.userCourses);

  const lastFetchTime = useRef<number>(0);
  const lastProximityCheck = useRef<number>(0);
  const lastProximityLocation = useRef<{ latitude: number; longitude: number } | null>(null);

  /**
   * Smart user courses loading with focus optimization
   */
  const loadUserCourses = useCallback((forceRefresh = false) => {
    const now = Date.now();
    const CACHE_TIME = 300000; // 5 minutes
    
    // Skip if data is fresh and not forcing refresh
    if (!forceRefresh && userCourses.length > 0 && (now - lastFetchTime.current) < CACHE_TIME && !isLoading) {
      console.log('📦 UserCourses: Skipping fetch - data is fresh');
      return;
    }

    console.log('🚀 UserCourses: Loading user courses');
    dispatch(fetchUserCourses());
    lastFetchTime.current = now;
  }, [dispatch, userCourses.length, isLoading]);

  /**
   * Optimized proximity checking with intelligent location caching
   */
  const checkProximity = useCallback(async (forceRefresh = false) => {
    // Skip if no courses to check against
    if (userCourses.length === 0) {
      console.log('📦 Proximity: No courses to check against');
      return;
    }

    const now = Date.now();
    const PROXIMITY_CACHE_TIME = 180000; // 3 minutes

    // Skip if already checking or recent check exists
    if (!forceRefresh && (isCheckingProximity || (now - lastProximityCheck.current) < PROXIMITY_CACHE_TIME)) {
      console.log('📦 Proximity: Skipping - recently checked or in progress');
      return;
    }

    try {
      // Use optimized location with appropriate accuracy for proximity
      const location = await getOptimizedLocation(golfLocationService, {
        maxAge: 180000, // 3 minutes
        minAccuracy: 100, // 100m accuracy for proximity checks
        forceRefresh,
      });

      if (!location) {
        console.log('📦 Proximity: No location available');
        return;
      }

      // Check if location changed significantly since last proximity check
      const lastLoc = lastProximityLocation.current;
      if (lastLoc && !forceRefresh) {
        const distance = calculateDistance(
          lastLoc.latitude, lastLoc.longitude,
          location.latitude, location.longitude
        );
        
        // Skip if user hasn't moved much (less than 50m)
        if (distance < 50) {
          console.log('📦 Proximity: User hasn\'t moved significantly, skipping check');
          return;
        }
      }

      console.log('🔍 Proximity: Checking proximity to user courses');
      dispatch(checkProximityToUserCourses({
        latitude: location.latitude,
        longitude: location.longitude,
      }));

      lastProximityCheck.current = now;
      lastProximityLocation.current = location;

    } catch (error) {
      console.error('❌ Proximity: Error checking proximity:', error);
    }
  }, [dispatch, userCourses.length, isCheckingProximity, getOptimizedLocation]);

  /**
   * Combined initialization for screen focus
   */
  const initializeScreenData = useCallback((forceRefresh = false) => {
    loadUserCourses(forceRefresh);
    // Delay proximity check to allow courses to load first
    setTimeout(() => checkProximity(forceRefresh), 1000);
  }, [loadUserCourses, checkProximity]);

  return {
    loadUserCourses,
    checkProximity,
    initializeScreenData,
    hasProximityData: Object.keys(proximityStatus).length > 0,
  };
};

/**
 * Helper function for distance calculation
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};