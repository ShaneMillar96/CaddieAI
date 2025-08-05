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

  // Golf-optimized GPS settings
  private gpsOptions: LocationOptions = {
    enableHighAccuracy: true,
    timeout: 30000, // 30 seconds
    maximumAge: 10000, // 10 seconds
    distanceFilter: 2, // Update every 2 meters
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
   * Request location permissions for both platforms
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
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
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions handled automatically
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking
   */
  async startTracking(): Promise<boolean> {
    try {
      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.notifyError('Location permission denied');
        return false;
      }

      // Start location updates
      this.watchId = Geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: this.gpsOptions.enableHighAccuracy,
          timeout: this.gpsOptions.timeout,
          maximumAge: this.gpsOptions.maximumAge,
          distanceFilter: this.gpsOptions.distanceFilter,
        }
      );

      this.isTracking = true;
      console.log('GPS tracking started successfully');
      return true;
    } catch (error) {
      console.error('Error starting GPS tracking:', error);
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
    
    this.isTracking = false;
    this.currentLocation = null;
    console.log('GPS tracking stopped');
  }

  /**
   * Get current location (one-time reading)
   */
  async getCurrentLocation(): Promise<SimpleLocationData | null> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: SimpleLocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
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