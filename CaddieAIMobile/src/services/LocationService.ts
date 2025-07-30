import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import TokenStorage from './tokenStorage';

// Types for location data
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationUpdateOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
  interval: number;
}

export interface CourseLocationContext {
  currentHole?: number;
  distanceToPin?: number;
  distanceToTee?: number;
  positionOnHole?: 'tee' | 'fairway' | 'rough' | 'green' | 'hazard' | 'unknown';
  withinCourseBoundaries: boolean;
}

export interface LocationProcessingResult {
  success: boolean;
  detectedHole?: number;
  distanceToPin?: number;
  distanceToTee?: number;
  positionOnHole?: string;
  isWithinBoundaries: boolean;
  shotDetected: boolean;
  messages: string[];
  processedAt: Date;
}

// Location service for GPS tracking during golf rounds
export class GolfLocationService {
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private locationHistory: LocationData[] = [];
  private isTracking = false;
  private updateCallbacks: Array<(location: LocationData) => void> = [];
  private contextUpdateCallbacks: Array<(context: CourseLocationContext) => void> = [];
  private shotDetectionCallbacks: Array<(shotData: any) => void> = [];

  // Default GPS options optimized for golf course tracking
  private defaultOptions: LocationUpdateOptions = {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 2000, // 2 seconds
    distanceFilter: 2, // Update every 2 meters
    interval: 3000 // Update every 3 seconds
  };

  constructor() {
    this.setupGeolocation();
  }

  private setupGeolocation(): void {
    // Configure geolocation for better accuracy
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      enableBackgroundLocationUpdates: false, // Set to true for background tracking
      locationProvider: 'auto'
    });
  }

  /**
   * Request location permissions based on platform
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'CaddieAI Location Permission',
            message: 'CaddieAI needs access to your location to provide accurate distance measurements and course navigation during your golf round.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS permissions are handled automatically by react-native-community/geolocation
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking for a golf round
   */
  async startRoundTracking(
    roundId: number, 
    courseId: number, 
    options?: Partial<LocationUpdateOptions>
  ): Promise<boolean> {
    try {
      // Check permissions first
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to track your round with GPS.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Merge custom options with defaults
      const trackingOptions = { ...this.defaultOptions, ...options };

      // Clear previous tracking data
      this.locationHistory = [];
      this.currentLocation = null;

      // Start location updates
      this.watchId = Geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position, roundId, courseId),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: trackingOptions.enableHighAccuracy,
          timeout: trackingOptions.timeout,
          maximumAge: trackingOptions.maximumAge,
          distanceFilter: trackingOptions.distanceFilter,
          interval: trackingOptions.interval,
          useSignificantChanges: false // We want all location updates for shot detection
        }
      );

      this.isTracking = true;
      console.log(`Started GPS tracking for round ${roundId} on course ${courseId}`);
      
      return true;
    } catch (error) {
      console.error('Error starting round tracking:', error);
      return false;
    }
  }

  /**
   * Stop GPS tracking
   */
  stopRoundTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.locationHistory = [];
    this.currentLocation = null;
    
    console.log('Stopped GPS tracking');
  }

  /**
   * Handle location updates from GPS
   */
  private async handleLocationUpdate(
    position: any, 
    roundId: number, 
    courseId: number
  ): Promise<void> {
    try {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };

      // Update current location
      this.currentLocation = locationData;

      // Add to history (keep last 100 locations for shot detection)
      this.locationHistory.push(locationData);
      if (this.locationHistory.length > 100) {
        this.locationHistory = this.locationHistory.slice(-100);
      }

      // Notify subscribers
      this.updateCallbacks.forEach(callback => {
        try {
          callback(locationData);
        } catch (error) {
          console.error('Error in location update callback:', error);
        }
      });

      // Process location with backend for course context
      await this.processLocationWithBackend(locationData, roundId, courseId);

      // Analyze for potential shots
      await this.analyzeForShotDetection(locationData, roundId);

    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  /**
   * Handle location errors
   */
  private handleLocationError(error: any): void {
    console.error('Location error:', error);
    
    let errorMessage = 'Unable to get location';
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location permission denied. Please enable location services.';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable. Please check your GPS signal.';
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out. Trying again...';
        break;
    }

    // For timeout errors, don't show alert as it's temporary
    if (error.code !== 3) {
      Alert.alert('GPS Error', errorMessage);
    }
  }

  /**
   * Process location with backend API for course context
   */
  private async processLocationWithBackend(
    location: LocationData, 
    roundId: number, 
    courseId: number
  ): Promise<void> {
    try {
      // This would call the LocationTrackingService on the backend
      const response = await fetch('/api/voiceai/location-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          userId: await this.getCurrentUserId(),
          roundId: roundId,
          locationContext: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracyMeters: location.accuracy,
            movementSpeedMps: location.speed,
            timestamp: new Date(location.timestamp).toISOString()
          }
        })
      });

      if (response.ok) {
        const result: LocationProcessingResult = await response.json();
        
        // Update course context
        const context: CourseLocationContext = {
          currentHole: result.detectedHole,
          distanceToPin: result.distanceToPin,
          distanceToTee: result.distanceToTee,
          positionOnHole: result.positionOnHole as any,
          withinCourseBoundaries: result.isWithinBoundaries
        };

        // Notify context subscribers
        this.contextUpdateCallbacks.forEach(callback => {
          try {
            callback(context);
          } catch (error) {
            console.error('Error in context update callback:', error);
          }
        });

        // Handle shot detection
        if (result.shotDetected) {
          this.shotDetectionCallbacks.forEach(callback => {
            try {
              callback({
                detected: true,
                messages: result.messages,
                processedAt: result.processedAt
              });
            } catch (error) {
              console.error('Error in shot detection callback:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing location with backend:', error);
      // Continue without backend processing - offline mode
    }
  }

  /**
   * Simple client-side shot detection analysis
   */
  private async analyzeForShotDetection(location: LocationData, roundId: number): Promise<void> {
    try {
      if (this.locationHistory.length < 2) return;

      const previousLocation = this.locationHistory[this.locationHistory.length - 2];
      const distance = this.calculateDistance(
        previousLocation.latitude, previousLocation.longitude,
        location.latitude, location.longitude
      );

      const timeDiff = (location.timestamp - previousLocation.timestamp) / 1000; // seconds
      const speed = timeDiff > 0 ? distance / timeDiff : 0;

      // Simple shot detection: significant distance moved quickly
      if (distance > 30 && // Moved more than 30 meters
          timeDiff < 10 && // Within 10 seconds
          speed > 5 && // Faster than normal walking
          (previousLocation.speed || 0) < 2) { // Previously moving slowly or stationary

        console.log(`Potential shot detected: ${distance.toFixed(0)}m in ${timeDiff.toFixed(1)}s`);
        
        // Notify shot detection subscribers
        this.shotDetectionCallbacks.forEach(callback => {
          try {
            callback({
              detected: true,
              distance: distance,
              duration: timeDiff,
              estimatedClub: this.estimateClubFromDistance(distance),
              startLocation: previousLocation,
              endLocation: location
            });
          } catch (error) {
            console.error('Error in shot detection callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error in shot detection analysis:', error);
    }
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to course context updates
   */
  onContextUpdate(callback: (context: CourseLocationContext) => void): () => void {
    this.contextUpdateCallbacks.push(callback);
    
    return () => {
      const index = this.contextUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.contextUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to shot detection events
   */
  onShotDetection(callback: (shotData: any) => void): () => void {
    this.shotDetectionCallbacks.push(callback);
    
    return () => {
      const index = this.shotDetectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.shotDetectionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current location data
   */
  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationData[] {
    return [...this.locationHistory];
  }

  /**
   * Check if currently tracking
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get one-time location reading
   */
  async getCurrentPosition(): Promise<LocationData | null> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting current position:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  }

  // Private helper methods

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private estimateClubFromDistance(distance: number): string {
    if (distance >= 250) return 'Driver';
    if (distance >= 200) return '3-Wood';
    if (distance >= 180) return '5-Wood';
    if (distance >= 160) return '4-Iron';
    if (distance >= 140) return '6-Iron';
    if (distance >= 120) return '8-Iron';
    if (distance >= 100) return 'Pitching Wedge';
    if (distance >= 80) return 'Sand Wedge';
    if (distance >= 50) return 'Lob Wedge';
    return 'Short Iron';
  }

  private async getAuthToken(): Promise<string> {
    // Get JWT token from secure storage using existing TokenStorage
    const token = await TokenStorage.getAccessToken();
    return token || '';
  }

  private async getCurrentUserId(): Promise<number> {
    // This would typically come from the decoded JWT token or user state
    // For now, return a placeholder - should be integrated with auth state
    return 1;
  }
}

// Export singleton instance
export const golfLocationService = new GolfLocationService();