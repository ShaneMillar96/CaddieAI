/**
 * Location Testing Utilities for Development
 * 
 * Provides functionality to override GPS location with mock coordinates
 * for development and testing purposes using Redux state management.
 */

import { LocationData } from '../services/LocationService';
import { store } from '../store';

/**
 * Check if test mode location override is enabled
 */
export const isTestModeEnabled = (): boolean => {
  // Only allow in development mode for safety
  if (!__DEV__) {
    return false;
  }

  try {
    const state = store.getState();
    return state.testMode?.enabled === true;
  } catch (error) {
    console.warn('⚠️ LocationTesting: Could not access Redux store, disabling test mode');
    return false;
  }
};

/**
 * DEPRECATED: Use isTestModeEnabled() instead
 * Check if location override is enabled for development testing
 */
export const isLocationOverrideEnabled = (): boolean => {
  console.warn('⚠️ LocationTesting: isLocationOverrideEnabled() is deprecated, use isTestModeEnabled()');
  
  // Check Redux state first
  if (isTestModeEnabled()) {
    return true;
  }
  
  // Fallback to legacy config for backward compatibility
  if (!__DEV__) {
    return false;
  }

  try {
    const { MAPBOX_GOLF_LOCATION } = require('../../mapbox.config.js');
    return MAPBOX_GOLF_LOCATION === true;
  } catch (error) {
    console.warn('⚠️ LocationTesting: Could not load mapbox config, disabling location override');
    return false;
  }
};

/**
 * Get current test mode location data from Redux state
 */
export const getTestModeLocation = (): LocationData => {
  try {
    const state = store.getState();
    const { coordinates } = state.testMode;
    
    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracy: 5.0, // High accuracy mock reading
      altitude: 30, // Approximate elevation
      heading: undefined,
      speed: 0,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ LocationTesting: Could not load test mode coordinates from Redux store');
    // Fallback coordinates for Faughan Valley Golf Centre
    return {
      latitude: 55.020906,
      longitude: -7.247879,
      accuracy: 5.0,
      altitude: 30,
      heading: undefined,
      speed: 0,
      timestamp: Date.now()
    };
  }
};

/**
 * DEPRECATED: Use getTestModeLocation() instead
 * Get mock location data for Faughan Valley Golf Centre
 */
export const getFaughanValleyMockLocation = (): LocationData => {
  console.warn('⚠️ LocationTesting: getFaughanValleyMockLocation() is deprecated, use getTestModeLocation()');
  
  // Try Redux state first
  if (isTestModeEnabled()) {
    return getTestModeLocation();
  }
  
  // Fallback to legacy config
  try {
    const { FAUGHAN_VALLEY_LOCATION } = require('../../mapbox.config.js');
    
    return {
      latitude: FAUGHAN_VALLEY_LOCATION.latitude,
      longitude: FAUGHAN_VALLEY_LOCATION.longitude,
      accuracy: 5.0, // High accuracy mock reading
      altitude: 30, // Approximate elevation for Faughan Valley
      heading: undefined,
      speed: 0,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ LocationTesting: Could not load Faughan Valley coordinates');
    // Fallback coordinates for Faughan Valley Golf Centre
    return {
      latitude: 55.020906,
      longitude: -7.247879,
      accuracy: 5.0,
      altitude: 30,
      heading: undefined,
      speed: 0,
      timestamp: Date.now()
    };
  }
};

/**
 * Get location data with test mode override support
 * @param actualLocationCallback - Function to get real GPS location
 * @returns Promise<LocationData | null> - Test mode location if enabled, otherwise actual location
 */
export const getLocationWithTestMode = async (
  actualLocationCallback: () => Promise<LocationData | null>
): Promise<LocationData | null> => {
  
  // Check if test mode is enabled
  if (isTestModeEnabled()) {
    const testLocation = getTestModeLocation();
    
    try {
      const state = store.getState();
      const currentPreset = state.testMode.presets.find(preset => 
        preset.latitude === testLocation.latitude && 
        preset.longitude === testLocation.longitude
      );
      
      const locationName = currentPreset ? currentPreset.name : 'Custom Location';
      
      console.log('🧪 DEVELOPMENT: Using test mode location override');
      console.log(`📍 Test Location: ${locationName}`);
      console.log(`   Coordinates: ${testLocation.latitude}, ${testLocation.longitude}`);
      console.log(`   Accuracy: ${testLocation.accuracy}m`);
      console.log(`   Distance from course center: ~20-50m (simulated course proximity)`);
      console.log('   This is for DEVELOPMENT/TESTING only');
      console.log('   Expected behavior: Play Golf button should be ENABLED');
    } catch (error) {
      console.warn('⚠️ Could not get test mode preset info:', error);
    }
    
    // Add a small delay to simulate realistic GPS timing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return testLocation;
  }
  
  // Otherwise, use actual GPS location
  console.log('📍 PRODUCTION: Using real GPS location');
  return actualLocationCallback();
};

/**
 * DEPRECATED: Use getLocationWithTestMode() instead
 * Get location data with development override support
 */
export const getLocationWithOverride = async (
  actualLocationCallback: () => Promise<LocationData | null>
): Promise<LocationData | null> => {
  console.warn('⚠️ LocationTesting: getLocationWithOverride() is deprecated, use getLocationWithTestMode()');
  
  // Check Redux test mode first
  if (isTestModeEnabled()) {
    return getLocationWithTestMode(actualLocationCallback);
  }
  
  // Fallback to legacy override system
  if (isLocationOverrideEnabled()) {
    const mockLocation = getFaughanValleyMockLocation();
    
    console.log('🧪 DEVELOPMENT: Using legacy mock location override');
    console.log('📍 Mock Location: Faughan Valley Golf Centre');
    console.log(`   Coordinates: ${mockLocation.latitude}, ${mockLocation.longitude}`);
    console.log(`   Accuracy: ${mockLocation.accuracy}m`);
    console.log(`   Distance from course center: ~20-50m (simulated course proximity)`);
    console.log('   This is for DEVELOPMENT/TESTING only');
    console.log('   Expected behavior: Play Golf button should be ENABLED');
    
    // Add a small delay to simulate realistic GPS timing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockLocation;
  }
  
  // Otherwise, use actual GPS location
  console.log('📍 PRODUCTION: Using real GPS location');
  return actualLocationCallback();
};

/**
 * Log location source for debugging
 */
export const logLocationSource = (location: LocationData | null): void => {
  if (!location) return;
  
  if (isTestModeEnabled()) {
    try {
      const state = store.getState();
      const currentPreset = state.testMode.presets.find(preset => 
        preset.latitude === location.latitude && 
        preset.longitude === location.longitude
      );
      
      const locationName = currentPreset ? currentPreset.name : 'Custom Location';
      console.log(`🧪 Location Source: TEST MODE (${locationName})`);
    } catch (error) {
      console.log('🧪 Location Source: TEST MODE');
    }
  } else if (isLocationOverrideEnabled()) {
    console.log('🧪 Location Source: LEGACY MOCK (Faughan Valley Golf Centre)');
  } else {
    console.log('📍 Location Source: GPS');
  }
  
  console.log(`   Coordinates: ${location.latitude}, ${location.longitude}`);
  console.log(`   Accuracy: ${location.accuracy}m`);
};

/**
 * Calculate distance between two points for testing/debugging
 */
export const calculateTestDistance = (
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number => {
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

/**
 * Verify mock location proximity to course coordinates
 */
export const verifyMockLocationProximity = (
  courseLatitude: number, 
  courseLongitude: number,
  courseName: string
): void => {
  try {
    if (!isLocationOverrideEnabled()) return;
    
    // Validate input parameters
    if (typeof courseLatitude !== 'number' || typeof courseLongitude !== 'number') {
      console.warn('⚠️ verifyMockLocationProximity: Invalid course coordinates:', courseLatitude, courseLongitude);
      return;
    }
    
    if (!courseName || typeof courseName !== 'string') {
      console.warn('⚠️ verifyMockLocationProximity: Invalid course name:', courseName);
      return;
    }
    
    const mockLocation = getFaughanValleyMockLocation();
    if (!mockLocation) {
      console.warn('⚠️ verifyMockLocationProximity: Could not get mock location');
      return;
    }
    
    const distance = calculateTestDistance(
      mockLocation.latitude, 
      mockLocation.longitude,
      courseLatitude,
      courseLongitude
    );
    
    if (!Number.isFinite(distance) || distance < 0) {
      console.warn('⚠️ verifyMockLocationProximity: Invalid distance calculation:', distance);
      return;
    }
    
    const distanceFeet = distance * 3.28084; // Convert to feet
    const isWithinProximity = distance <= 100; // 100m threshold
    
    console.log(`🧮 Mock Location Proximity Test:`);
    console.log(`   Course: ${courseName}`);
    console.log(`   Course coordinates: ${courseLatitude}, ${courseLongitude}`);
    console.log(`   Mock location: ${mockLocation.latitude}, ${mockLocation.longitude}`);
    console.log(`   Distance: ${distance.toFixed(1)}m (${distanceFeet.toFixed(0)}ft)`);
    console.log(`   Within 100m threshold: ${isWithinProximity ? '✅ YES' : '❌ NO'}`);
    console.log(`   Expected Play Golf button state: ${isWithinProximity ? 'ENABLED' : 'DISABLED'}`);
  } catch (error) {
    console.error('❌ Error in verifyMockLocationProximity:', error, {
      courseLatitude,
      courseLongitude,
      courseName
    });
  }
};