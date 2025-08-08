import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

// Simple location data interface
export interface SimpleLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// GPS options optimized for golf
interface LocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
}

/**
 * Simplified Location Service for CaddieAI
 * 
 * Focus: Essential GPS functionality only
 * - Location permissions
 * - Real-time location updates
 * - Basic error handling
 * - Simple callback system
 */
export class SimpleLocationService {
  private watchId: number | null = null;
  private currentLocation: SimpleLocationData | null = null;
  private isTracking = false;
  private locationCallbacks: Array<(location: SimpleLocationData) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];
  private fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  private isUsingFallback = false;

  // Golf-optimized GPS settings
  private gpsOptions: LocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds - faster timeout for better responsiveness
    maximumAge: 5000, // 5 seconds - fresher location data
    distanceFilter: 2, // Update every 2 meters
  };

  // Faughan Valley Golf Course fallback location for testing
  private fallbackLocation: SimpleLocationData = {
    latitude: 55.020906,
    longitude: -7.247879,
    accuracy: 999, // High accuracy number to indicate this is fallback
    timestamp: 0, // Will be set when used
  };

  constructor() {
    this.setupGeolocation();
  }

  private setupGeolocation(): void {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false,
      locationProvider: 'auto'
    });
  }

  /**
   * Check if location permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const fineLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarseLocationGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        
        console.log('🔍 SimpleLocationService: Permission check results:', {
          fineLocation: fineLocationGranted,
          coarseLocation: coarseLocationGranted
        });
        
        return fineLocationGranted || coarseLocationGranted;
      } else {
        // iOS permissions handled automatically
        return true;
      }
    } catch (error) {
      console.error('❌ SimpleLocationService: Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Request location permissions for both platforms
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📱 SimpleLocationService: Requesting location permissions...');
      
      if (Platform.OS === 'android') {
        // First check if we already have permissions
        const hasPermissions = await this.checkPermissions();
        if (hasPermissions) {
          console.log('✅ SimpleLocationService: Permissions already granted');
          return true;
        }

        console.log('🔐 SimpleLocationService: Requesting FINE_LOCATION permission...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'CaddieAI Location Permission',
            message: 'CaddieAI needs access to your location for accurate distance measurements during your golf round.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('🔍 SimpleLocationService: Permission request result:', granted, 'isGranted:', isGranted);
        
        return isGranted;
      } else {
        // iOS permissions handled automatically by react-native-geolocation
        console.log('🍎 SimpleLocationService: iOS permissions handled automatically');
        return true;
      }
    } catch (error) {
      console.error('❌ SimpleLocationService: Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking
   */
  async startTracking(): Promise<boolean> {
    try {
      console.log('🚀 SimpleLocationService: Starting GPS tracking...');
      
      // Check permissions first
      console.log('🔐 SimpleLocationService: Checking permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ SimpleLocationService: Location permission denied');
        this.notifyError('Location permission denied. Please enable location access in settings.');
        return false;
      }

      console.log('✅ SimpleLocationService: Permissions granted, starting location watch...');

      // Start location updates
      this.watchId = Geolocation.watchPosition(
        (position) => {
          console.log('📍 SimpleLocationService: Got position from GPS:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
          
          // Clear fallback timeout since we got real GPS
          if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
            console.log('✅ SimpleLocationService: Real GPS acquired, cancelling fallback');
          }
          
          this.isUsingFallback = false;
          this.handleLocationUpdate(position);
        },
        (error) => {
          console.error('❌ SimpleLocationService: GPS error:', error);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: this.gpsOptions.enableHighAccuracy,
          timeout: this.gpsOptions.timeout,
          maximumAge: this.gpsOptions.maximumAge,
          distanceFilter: this.gpsOptions.distanceFilter,
        }
      );

      // Set up fallback timeout (8 seconds - faster than GPS timeout)
      console.log('⏰ SimpleLocationService: Setting up 8s fallback timeout...');
      this.fallbackTimeout = setTimeout(() => {
        if (!this.currentLocation && this.isTracking) {
          console.log('🏌️ SimpleLocationService: GPS timeout - activating Faughan Valley fallback location');
          this.activateFallbackLocation();
        }
      }, 8000);

      this.isTracking = true;
      console.log('✅ SimpleLocationService: GPS tracking started successfully with watchId:', this.watchId);
      return true;
    } catch (error) {
      console.error('❌ SimpleLocationService: Error starting GPS tracking:', error);
      this.notifyError('Failed to start GPS tracking');
      return false;
    }
  }

  /**
   * Stop GPS tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // Clear fallback timeout
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    
    this.isTracking = false;
    this.currentLocation = null;
    this.isUsingFallback = false;
    console.log('GPS tracking stopped');
  }

  /**
   * Get current location (one-time reading)
   */
  async getCurrentLocation(): Promise<SimpleLocationData | null> {
    return new Promise((resolve) => {
      console.log('⚡ SimpleLocationService: Getting current location...');
      
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: SimpleLocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          
          console.log('✅ SimpleLocationService: Got current location:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ SimpleLocationService: Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Match GPS timeout
          maximumAge: 5000,
        }
      );
    });
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: SimpleLocationData) => void): () => void {
    this.locationCallbacks.push(callback);
    
    // Send current location immediately if available
    if (this.currentLocation) {
      callback(this.currentLocation);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to location errors
   */
  onLocationError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get the last known location
   */
  getLastKnownLocation(): SimpleLocationData | null {
    return this.currentLocation;
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Check if using fallback location
   */
  isUsingFallbackLocation(): boolean {
    return this.isUsingFallback;
  }

  /**
   * Activate fallback location for testing purposes
   */
  private activateFallbackLocation(): void {
    console.log('🏌️ SimpleLocationService: Activating Faughan Valley fallback location');
    
    const fallbackWithTimestamp: SimpleLocationData = {
      ...this.fallbackLocation,
      timestamp: Date.now(),
    };
    
    this.isUsingFallback = true;
    this.currentLocation = fallbackWithTimestamp;
    
    // Notify all subscribers of fallback location
    this.locationCallbacks.forEach(callback => {
      try {
        callback(fallbackWithTimestamp);
      } catch (error) {
        console.error('Error in fallback location callback:', error);
      }
    });
    
    console.log('✅ SimpleLocationService: Fallback location activated:', {
      lat: fallbackWithTimestamp.latitude,
      lng: fallbackWithTimestamp.longitude,
      accuracy: fallbackWithTimestamp.accuracy,
      isFallback: true
    });
  }

  /**
   * Handle location updates from GPS
   */
  private handleLocationUpdate(position: any): void {
    // Validate coordinates
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    if (!latitude || !longitude || 
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      console.warn('Invalid GPS coordinates received, skipping update');
      return;
    }

    const locationData: SimpleLocationData = {
      latitude,
      longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    this.currentLocation = locationData;

    // Notify all subscribers
    this.locationCallbacks.forEach(callback => {
      try {
        callback(locationData);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  /**
   * Handle location errors
   */
  private handleLocationError(error: any): void {
    let errorMessage = 'GPS error occurred';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location permission denied';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'GPS signal unavailable';
        break;
      case 3: // TIMEOUT
        errorMessage = 'GPS timeout - trying again...';
        break;
      default:
        errorMessage = `GPS error: ${error.message}`;
    }

    console.warn('GPS Error:', errorMessage);
    
    // For timeout errors, don't show alert as it's temporary
    if (error.code !== 3) {
      this.notifyError(errorMessage);
    }
  }

  /**
   * Notify error callbacks
   */
  private notifyError(error: string): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }
}

// Export singleton instance
let _simpleLocationService: SimpleLocationService | null = null;

export const getSimpleLocationService = (): SimpleLocationService => {
  if (!_simpleLocationService) {
    _simpleLocationService = new SimpleLocationService();
  }
  return _simpleLocationService;
};

// Export default instance
export const simpleLocationService = getSimpleLocationService();

// Helper function to check if service is available
export const isLocationServiceAvailable = (): boolean => {
  try {
    return getSimpleLocationService() != null;
  } catch (error) {
    console.error('Location service is not available:', error);
    return false;
  }
};