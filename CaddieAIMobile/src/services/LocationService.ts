import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import TokenStorage from './tokenStorage';
import { buildApiUrl, isNetworkError, API_TIMEOUT } from '../config/api';

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

export interface MapTargetData {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  distanceYards: number;
  bearing: number;
  timestamp: number;
}

export interface MapLocationContext {
  userLocation: LocationData;
  targetPin?: MapTargetData;
  courseFeatures?: {
    nearbyHazards: Array<{
      type: string;
      distance: number;
      bearing: number;
    }>;
    distanceToGreen?: number;
    distanceToTee?: number;
  };
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
  
  // Map-specific state
  private mapTargetPin: MapTargetData | null = null;
  private mapLocationCallbacks: Array<(context: MapLocationContext) => void> = [];
  private lastMapUpdate: number = 0;
  
  // Backend availability tracking
  private backendAvailable: boolean = true;
  private lastBackendCheck: number = 0;

  // Default GPS options optimized for golf course tracking
  private defaultOptions: LocationUpdateOptions = {
    enableHighAccuracy: true,
    timeout: 30000, // 30 seconds - Allow more time for GPS to achieve good accuracy
    maximumAge: 10000, // 10 seconds - Allow GPS time to improve between readings
    distanceFilter: 2, // Update every 2 meters
    interval: 5000 // Update every 5 seconds - Reduced frequency for better accuracy
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
   * Start GPS tracking for a golf round with enhanced error handling
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
        console.log('Location permission not granted - GPS tracking disabled');
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
      
      // Try to get initial position to verify GPS is working
      const initialPosition = await this.getCurrentPosition();
      if (initialPosition) {
        console.log('Initial GPS position acquired successfully');
      } else {
        console.warn('Could not acquire initial GPS position, but tracking will continue');
      }
      
      return true;
    } catch (error) {
      console.error('Error starting round tracking:', error);
      // Don't show error alert here - let the calling component handle it
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
    console.log('🔵 LocationService.handleLocationUpdate: ENTRY POINT - GPS data received');
    console.log('🔵 LocationService.handleLocationUpdate: Raw position data:', {
      coords: position.coords,
      timestamp: position.timestamp,
      provider: position.provider
    });
    
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

      console.log('🔵 LocationService.handleLocationUpdate: Processed locationData:', locationData);

      // Enhanced GPS accuracy logging
      const accuracyStatus = this.getAccuracyStatus(locationData.accuracy);
      console.log(`🔵 GPS Update: ${accuracyStatus} (${locationData.accuracy?.toFixed(1)}m) at ${new Date(locationData.timestamp).toLocaleTimeString()}`);
      
      // Log accuracy improvements
      if (this.currentLocation && this.currentLocation.accuracy && locationData.accuracy) {
        const accuracyChange = this.currentLocation.accuracy - locationData.accuracy;
        if (Math.abs(accuracyChange) > 2) {
          const improvement = accuracyChange > 0 ? 'improved' : 'degraded';
          console.log(`🔵 GPS accuracy ${improvement} by ${Math.abs(accuracyChange).toFixed(1)}m`);
        }
      }

      // Update current location
      console.log('🔵 LocationService.handleLocationUpdate: Updating currentLocation from:', this.currentLocation, 'to:', locationData);
      this.currentLocation = locationData;

      // Add to history (keep last 100 locations for shot detection)
      this.locationHistory.push(locationData);
      if (this.locationHistory.length > 100) {
        this.locationHistory = this.locationHistory.slice(-100);
      }

      // Notify subscribers with detailed logging
      console.log('🔵 LocationService.handleLocationUpdate: About to notify subscribers');
      console.log('🔵 LocationService: Current callback count:', this.updateCallbacks.length);
      console.log('🔵 LocationService: Callback array contents:', this.updateCallbacks);
      
      if (this.updateCallbacks.length === 0) {
        console.error('🔴 LocationService: CRITICAL - No location update callbacks registered to receive GPS data!');
        console.error('🔴 LocationService: This means React components won\'t receive location updates');
      } else {
        console.log('🔵 LocationService: Starting callback execution loop...');
        this.updateCallbacks.forEach((callback, index) => {
          try {
            console.log(`🔵 LocationService: EXECUTING callback ${index + 1}/${this.updateCallbacks.length}`);
            console.log(`🔵 LocationService: Callback function:`, callback.toString().substring(0, 100) + '...');
            
            // Execute the callback
            const result = callback(locationData);
            
            console.log(`🟢 LocationService: Callback ${index + 1} executed successfully, result:`, result);
          } catch (error) {
            console.error(`🔴 LocationService: ERROR in location update callback ${index + 1}:`, error);
            console.error(`🔴 LocationService: Error stack:`, error instanceof Error ? error.stack : 'No stack available');
          }
        });
        console.log('🔵 LocationService: Finished executing all callbacks');
      }

      // Process location with backend for course context only if backend is available
      if (this.shouldAttemptBackendProcessing()) {
        await this.processLocationWithBackend(locationData, roundId, courseId);
      }

      // Analyze for potential shots
      await this.analyzeForShotDetection(locationData, roundId);

      // Update map location context for map interface
      this.updateMapLocationContext();

    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  /**
   * Handle location errors
   */
  private handleLocationError(error: any): void {
    const errorDetails = {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    };
    console.error('Location error details:', errorDetails);
    
    let errorMessage = 'Unable to get location';
    let logMessage = '';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location permission denied. Please enable location services.';
        logMessage = 'GPS Error: Permission denied - check app location permissions';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable. Please check your GPS signal.';
        logMessage = 'GPS Error: Position unavailable - device may be indoors or GPS signal blocked';
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out. Trying again...';
        logMessage = `GPS Error: Timeout after ${this.defaultOptions.timeout}ms - GPS may need more time to acquire signal`;
        break;
      default:
        logMessage = `GPS Error: Unknown error code ${error.code}`;
    }

    console.warn(logMessage);

    // For timeout errors, don't show alert as it's temporary
    if (error.code !== 3) {
      Alert.alert('GPS Error', errorMessage);
    }
  }

  /**
   * Check if we should attempt backend processing based on availability and timing
   */
  private shouldAttemptBackendProcessing(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastBackendCheck;
    
    // If backend was marked unavailable, retry after 5 minutes
    if (!this.backendAvailable && timeSinceLastCheck < 300000) {
      return false;
    }
    
    // If it's been more than 5 minutes since last check, try again
    if (timeSinceLastCheck > 300000) {
      this.backendAvailable = true;
    }
    
    return this.backendAvailable;
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
      // Use proper API URL with timeout and error handling
      const apiUrl = buildApiUrl('voiceai/location-update');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Location processing request timed out');
        controller.abort();
      }, API_TIMEOUT);
      
      const response = await fetch(apiUrl, {
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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        // Mark backend as available
        this.backendAvailable = true;
        this.lastBackendCheck = Date.now();
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
      } else if (response.status === 404) {
        console.log('Backend location endpoint not found - disabling backend processing');
        this.backendAvailable = false;
        this.lastBackendCheck = Date.now();
      } else {
        console.warn(`Backend location processing failed with status: ${response.status}`);
      }
    } catch (error: any) {
      // Enhanced error handling with graceful degradation
      if (isNetworkError(error)) {
        console.log('Backend location processing unavailable - continuing in offline mode');
        this.backendAvailable = false;
        this.lastBackendCheck = Date.now();
        return;
      }
      
      if (error.name === 'AbortError') {
        console.log('Location processing request timed out - continuing without backend processing');
        this.backendAvailable = false;
        this.lastBackendCheck = Date.now();
        return;
      }
      
      console.error('Error processing location with backend:', error);
      this.backendAvailable = false;
      this.lastBackendCheck = Date.now();
      // Continue without backend processing - app remains functional
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
   * Subscribe to location updates with deduplication
   */
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    console.log('🔵 LocationService.onLocationUpdate: Registering callback. Total callbacks before:', this.updateCallbacks.length);
    
    // Check if callback is already registered (deduplication)
    const existingIndex = this.updateCallbacks.indexOf(callback);
    if (existingIndex > -1) {
      console.warn('🟡 LocationService.onLocationUpdate: Callback already registered, skipping duplicate registration');
      return () => {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
          this.updateCallbacks.splice(index, 1);
          console.log('🔵 LocationService: Duplicate callback unsubscribed. Total callbacks now:', this.updateCallbacks.length);
        }
      };
    }
    
    this.updateCallbacks.push(callback);
    console.log('🔵 LocationService.onLocationUpdate: New callback registered. Total callbacks now:', this.updateCallbacks.length);
    console.log('🔵 LocationService.onLocationUpdate: Callback function signature:', callback.toString().substring(0, 150) + '...');
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
        console.log('🔵 LocationService: Location update callback unsubscribed. Total callbacks now:', this.updateCallbacks.length);
      } else {
        console.warn('🟡 LocationService: Attempted to unsubscribe callback that was not found');
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
   * Get backend processing status for debugging
   */
  getBackendStatus(): { available: boolean; lastCheck: number } {
    return {
      available: this.backendAvailable,
      lastCheck: this.lastBackendCheck,
    };
  }

  /**
   * Get one-time location reading with enhanced error handling and progressive accuracy
   */
  async getCurrentPosition(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      // First try: Quick coarse location
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
          
          // If accuracy is good enough (≤20m), return immediately
          if (position.coords.accuracy <= 20) {
            console.log(`GPS position acquired with good accuracy: ${position.coords.accuracy}m`);
            resolve(locationData);
            return;
          }
          
          // If accuracy is poor, try again with high accuracy
          console.log(`Initial GPS accuracy: ${position.coords.accuracy}m, trying for better accuracy...`);
          
          Geolocation.getCurrentPosition(
            (highAccuracyPosition) => {
              const highAccuracyData: LocationData = {
                latitude: highAccuracyPosition.coords.latitude,
                longitude: highAccuracyPosition.coords.longitude,
                accuracy: highAccuracyPosition.coords.accuracy,
                altitude: highAccuracyPosition.coords.altitude || undefined,
                heading: highAccuracyPosition.coords.heading || undefined,
                speed: highAccuracyPosition.coords.speed || undefined,
                timestamp: highAccuracyPosition.timestamp
              };
              console.log(`High accuracy GPS position: ${highAccuracyPosition.coords.accuracy}m`);
              resolve(highAccuracyData);
            },
            (highAccuracyError) => {
              console.log('High accuracy GPS failed, using initial position');
              // Fall back to initial position if high accuracy fails
              resolve(locationData);
            },
            {
              enableHighAccuracy: true,
              timeout: 20000, // Longer timeout for high accuracy attempt
              maximumAge: 0 // Force fresh reading
            }
          );
        },
        (error) => {
          console.error('Error getting current position:', error);
          // Return null for graceful degradation
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Start with coarse location for speed
          timeout: 10000, // Quick initial timeout
          maximumAge: 30000 // Allow cached location for initial reading
        }
      );
    });
  }

  // Map-specific methods

  /**
   * Set target pin for distance measurement
   */
  setMapTargetPin(
    latitude: number,
    longitude: number,
    distanceYards: number,
    bearing: number
  ): void {
    this.mapTargetPin = {
      coordinate: { latitude, longitude },
      distanceYards,
      bearing,
      timestamp: Date.now(),
    };

    // Trigger map location context update
    this.updateMapLocationContext();
  }

  /**
   * Clear target pin
   */
  clearMapTargetPin(): void {
    this.mapTargetPin = null;
    this.updateMapLocationContext();
  }

  /**
   * Get current map target pin
   */
  getMapTargetPin(): MapTargetData | null {
    return this.mapTargetPin;
  }

  /**
   * Subscribe to map location context updates
   */
  onMapLocationUpdate(callback: (context: MapLocationContext) => void): () => void {
    this.mapLocationCallbacks.push(callback);
    
    // Immediately send current context if available
    if (this.currentLocation) {
      this.updateMapLocationContext();
    }
    
    return () => {
      const index = this.mapLocationCallbacks.indexOf(callback);
      if (index > -1) {
        this.mapLocationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update map location context and notify subscribers
   */
  private updateMapLocationContext(): void {
    if (!this.currentLocation) return;

    const now = Date.now();
    // Throttle updates to every 500ms for map performance
    if (now - this.lastMapUpdate < 500) return;

    const context: MapLocationContext = {
      userLocation: this.currentLocation,
      targetPin: this.mapTargetPin || undefined,
      courseFeatures: this.getCourseFeatures(),
    };

    this.mapLocationCallbacks.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('Error in map location callback:', error);
      }
    });

    this.lastMapUpdate = now;
  }

  /**
   * Get nearby course features for map context
   */
  private getCourseFeatures(): MapLocationContext['courseFeatures'] {
    // This would ideally integrate with course data from backend
    // For now, return basic structure that can be populated later
    return {
      nearbyHazards: [],
      distanceToGreen: undefined,
      distanceToTee: undefined,
    };
  }

  /**
   * Calculate distance between current location and map coordinates
   */
  calculateDistanceToMapCoordinate(
    targetLatitude: number,
    targetLongitude: number
  ): { meters: number; yards: number } | null {
    if (!this.currentLocation) return null;

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      targetLatitude,
      targetLongitude
    );

    return {
      meters: distance,
      yards: distance * 1.09361, // Convert meters to yards
    };
  }

  /**
   * Enhanced shot detection for map interface
   */
  detectShotFromMapMovement(
    newLocation: LocationData,
    targetPin?: MapTargetData
  ): boolean {
    if (this.locationHistory.length < 2) return false;

    const previousLocation = this.locationHistory[this.locationHistory.length - 1];
    const distance = this.calculateDistance(
      previousLocation.latitude,
      previousLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    const timeDiff = (newLocation.timestamp - previousLocation.timestamp) / 1000;
    const speed = timeDiff > 0 ? distance / timeDiff : 0;

    // Enhanced shot detection with target pin context
    let shotDetected = false;
    
    if (distance > 30 && timeDiff < 10 && speed > 5) {
      shotDetected = true;
      
      // If we have a target pin, check if we're moving toward it
      if (targetPin) {
        const bearingToTarget = this.calculateBearingBetweenPoints(
          newLocation.latitude,
          newLocation.longitude,
          targetPin.coordinate.latitude,
          targetPin.coordinate.longitude
        );
        
        const movementBearing = this.calculateBearingBetweenPoints(
          previousLocation.latitude,
          previousLocation.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
        
        // If movement is roughly toward target (within 45 degrees), it's likely intentional
        const bearingDiff = Math.abs(bearingToTarget - movementBearing);
        const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);
        
        if (normalizedDiff <= 45) {
          console.log('Shot detected toward target pin');
        }
      }
    }

    return shotDetected;
  }

  // Private helper methods

  /**
   * Get accuracy status string for logging
   */
  private getAccuracyStatus(accuracy?: number): string {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 8) return 'Excellent';
    if (accuracy <= 15) return 'Good';
    if (accuracy <= 25) return 'Fair';
    if (accuracy <= 50) return 'Poor';
    return 'Very Poor';
  }

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

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private calculateBearingBetweenPoints(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    const deltaLonRad = this.toRadians(lon2 - lon1);

    const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = this.toDegrees(bearingRad);

    // Normalize to 0-360 degrees
    return (bearingDeg + 360) % 360;
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
let _golfLocationService: GolfLocationService | null = null;

export const getGolfLocationService = (): GolfLocationService => {
  if (!_golfLocationService) {
    _golfLocationService = new GolfLocationService();
  }
  return _golfLocationService;
};

// Export singleton instance for backward compatibility
export const golfLocationService = getGolfLocationService();

// Helper function to check if service is available
export const isLocationServiceAvailable = (): boolean => {
  try {
    const service = getGolfLocationService();
    return service != null;
  } catch (error) {
    console.error('Location service is not available:', error);
    return false;
  }
};

// Safe wrapper for location service operations
export const safeLocationServiceCall = async <T>(
  operation: (service: GolfLocationService) => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    if (!isLocationServiceAvailable()) {
      console.warn('Location service not available, using fallback');
      return fallback;
    }
    const service = getGolfLocationService();
    return await operation(service);
  } catch (error) {
    console.error('Error in location service operation:', error);
    return fallback;
  }
};