/**
 * Location Testing Utilities for Development
 * 
 * Provides functionality to override GPS location with mock coordinates
 * for development and testing purposes.
 */

import { LocationData } from '../services/LocationService';

/**
 * Check if location override is enabled for development testing
 */
export const isLocationOverrideEnabled = (): boolean => {
  // Only allow in development mode for safety
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
 * Get mock location data for Faughan Valley Golf Centre
 */
export const getFaughanValleyMockLocation = (): LocationData => {
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
 * Get location data with development override support
 * @param actualLocationCallback - Function to get real GPS location
 * @returns Promise<LocationData | null> - Mock location if override enabled, otherwise actual location
 */
export const getLocationWithOverride = async (
  actualLocationCallback: () => Promise<LocationData | null>
): Promise<LocationData | null> => {
  
  // Check if location override is enabled
  if (isLocationOverrideEnabled()) {
    const mockLocation = getFaughanValleyMockLocation();
    
    console.log('🧪 DEVELOPMENT: Using mock location override');
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
  
  if (isLocationOverrideEnabled()) {
    console.log('🧪 Location Source: MOCK (Faughan Valley Golf Centre)');
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