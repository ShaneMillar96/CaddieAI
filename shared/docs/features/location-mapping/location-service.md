# LocationService Architecture and Implementation

**Status**: Completed  
**Version**: v1.5.0  
**Author**: CaddieAI Development Team  
**Date**: August 2025  
**File**: `CaddieAIMobile/src/services/LocationService.ts`

## Overview

The `GolfLocationService` is a singleton service that manages GPS tracking, location processing, and golf-specific context analysis for the CaddieAI mobile application. It provides a centralized interface for location-based functionality with robust error handling, callback management, and performance optimizations.

## Class Structure

### Core Properties

```typescript
export class GolfLocationService {
  // GPS tracking state
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private locationHistory: LocationData[] = [];
  private isTracking = false;
  
  // Callback management
  private updateCallbacks: Array<(location: LocationData) => void> = [];
  private contextUpdateCallbacks: Array<(context: CourseLocationContext) => void> = [];
  private shotDetectionCallbacks: Array<(shotData: any) => void> = [];
  
  // Map-specific state
  private mapTargetPin: MapTargetData | null = null;
  private mapLocationCallbacks: Array<(context: MapLocationContext) => void> = [];
  
  // Performance and error handling
  private backendAvailable: boolean = true;
  private hasLoggedNoCallbacksError: boolean = false;
  private pausedDueToNoCallbacks: boolean = false;
  
  // Logging throttle control (v1.5.0)
  private lastLogTimestamp: { [key: string]: number } = {};
  private logThrottleMs: number = 2000;
}
```

### Interface Definitions

```typescript
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
```

## Core Functionality

### GPS Tracking Lifecycle

#### 1. Initialization and Permission Handling

```typescript
async requestLocationPermissions(): Promise<boolean> {
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
    // iOS permissions handled automatically by react-native-community/geolocation
    return true;
  }
}
```

#### 2. Starting Round Tracking

```typescript
async startRoundTracking(
  roundId: number, 
  courseId: number, 
  options?: Partial<LocationUpdateOptions>
): Promise<boolean> {
  // Merge custom options with defaults
  const trackingOptions = { ...this.defaultOptions, ...options };
  
  // Start location updates with golf-optimized settings
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
  return true;
}
```

#### 3. Location Update Processing

```typescript
private handleLocationUpdate(
  position: GeolocationPosition,
  roundId: number,
  courseId: number
): void {
  const locationData: LocationData = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    altitude: position.coords.altitude,
    heading: position.coords.heading,
    speed: position.coords.speed,
    timestamp: Date.now(),
  };

  this.currentLocation = locationData;
  this.locationHistory.push(locationData);

  // Notify all registered callbacks
  this.notifyLocationUpdate(locationData);

  // Process backend context (course analysis, shot detection)
  this.processLocationWithBackend(locationData, roundId, courseId);
}
```

### Callback Management System (Enhanced in v1.5.0)

#### Registration with Deduplication

```typescript
onLocationUpdate(callback: (location: LocationData) => void): () => void {
  this.throttledLog('callback-registration', 
    '🔵 LocationService.onLocationUpdate: Registering callback. Total callbacks before:', 
    this.updateCallbacks.length);
  
  // Validate callback function
  if (!callback || typeof callback !== 'function') {
    console.error('🔴 LocationService.onLocationUpdate: Invalid callback provided');
    return () => {}; // Return no-op unsubscribe function
  }
  
  // Check if callback is already registered (deduplication by function reference)
  const existingIndex = this.updateCallbacks.indexOf(callback);
  if (existingIndex > -1) {
    this.throttledLog('duplicate-callback', 
      '🟡 LocationService.onLocationUpdate: Callback already registered, skipping duplicate registration');
    
    return () => {
      try {
        const index = this.updateCallbacks.indexOf(callback);
        if (index > -1) {
          this.updateCallbacks.splice(index, 1);
          this.throttledLog('callback-unsubscribe', 
            '🔵 LocationService: Duplicate callback unsubscribed. Total callbacks now:', 
            this.updateCallbacks.length);
        }
      } catch (error) {
        console.error('🔴 LocationService: Error unsubscribing duplicate callback:', error);
      }
    };
  }
  
  this.updateCallbacks.push(callback);
  this.throttledLog('callback-registration', 
    '🔵 LocationService.onLocationUpdate: New callback registered. Total callbacks now:', 
    this.updateCallbacks.length);
  
  // Return enhanced unsubscribe function with error handling
  return () => {
    try {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
        this.throttledLog('callback-unsubscribe', 
          '🔵 LocationService: Location update callback unsubscribed. Total callbacks now:', 
          this.updateCallbacks.length);
      } else {
        this.throttledLog('callback-warning', 
          '🟡 LocationService: Attempted to unsubscribe callback that was not found');
      }
    } catch (error) {
      console.error('🔴 LocationService: Error during callback unsubscription:', error);
    }
  };
}
```

#### Throttled Logging System (v1.5.0)

```typescript
/**
 * Throttled logging to prevent excessive console noise
 */
private throttledLog(key: string, message: string, ...args: any[]): void {
  const now = Date.now();
  const lastLog = this.lastLogTimestamp[key] || 0;
  
  if (now - lastLog >= this.logThrottleMs) {
    console.log(message, ...args);
    this.lastLogTimestamp[key] = now;
  }
}

/**
 * Throttled warning logging
 */
private throttledWarn(key: string, message: string, ...args: any[]): void {
  const now = Date.now();
  const lastLog = this.lastLogTimestamp[key] || 0;
  
  if (now - lastLog >= this.logThrottleMs) {
    console.warn(message, ...args);
    this.lastLogTimestamp[key] = now;
  }
}
```

### Enhanced Cleanup and Error Handling (v1.5.0)

#### Atomic Cleanup Operations

```typescript
/**
 * Stop GPS tracking with enhanced cleanup and atomic operations
 */
stopRoundTracking(): void {
  try {
    // Atomic cleanup: Stop GPS first, then clean callbacks
    const wasTracking = this.isTracking;
    
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // Reset state atomically
    this.isTracking = false;
    this.locationHistory = [];
    this.currentLocation = null;
    this.pausedDueToNoCallbacks = false;
    this.hasLoggedNoCallbacksError = false;
    
    // Clear all callbacks to prevent memory leaks
    this.clearAllCallbacks();
    
    if (wasTracking) {
      this.throttledLog('gps-stop', 'Stopped GPS tracking and cleared all callbacks');
    }
  } catch (error) {
    console.error('Error stopping GPS tracking:', error);
  }
}

/**
 * Check if the service is in a valid state for operations
 */
isServiceReady(): boolean {
  return this.isTracking && (this.updateCallbacks.length > 0 || this.contextUpdateCallbacks.length > 0);
}
```

## Golf-Specific Features

### Distance Calculation Integration

```typescript
setMapTargetPin(latitude: number, longitude: number, distanceYards: number, bearing: number): void {
  this.mapTargetPin = {
    coordinate: { latitude, longitude },
    distanceYards,
    bearing,
    timestamp: Date.now(),
  };
  
  // Notify map callbacks of target pin update
  this.notifyMapLocationUpdate();
}
```

### Shot Detection Processing

```typescript
private async processLocationWithBackend(
  location: LocationData,
  roundId: number,
  courseId: number
): Promise<void> {
  if (!this.backendAvailable) return;

  try {
    const response = await fetch(buildApiUrl('/api/v1/location/process'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await TokenStorage.getToken()}`,
      },
      body: JSON.stringify({
        roundId,
        courseId,
        location,
        locationHistory: this.locationHistory.slice(-10), // Last 10 locations
      }),
      timeout: API_TIMEOUT,
    });

    if (response.ok) {
      const result: LocationProcessingResult = await response.json();
      
      // Notify context callbacks
      this.notifyContextUpdate({
        currentHole: result.detectedHole,
        distanceToPin: result.distanceToPin,
        distanceToTee: result.distanceToTee,
        positionOnHole: result.positionOnHole as any,
        withinCourseBoundaries: result.isWithinBoundaries,
      });

      // Notify shot detection callbacks if shot detected
      if (result.shotDetected) {
        this.notifyShotDetection({
          detected: true,
          location,
          previousLocation: this.locationHistory[this.locationHistory.length - 2],
          distance: this.calculateShotDistance(),
          estimatedClub: this.estimateClubUsed(),
        });
      }
    }
  } catch (error) {
    if (isNetworkError(error)) {
      this.backendAvailable = false;
      setTimeout(() => { this.backendAvailable = true; }, 30000); // Retry after 30 seconds
    }
  }
}
```

## Configuration and Optimization

### GPS Settings Optimized for Golf

```typescript
// Default GPS options optimized for golf course tracking
private defaultOptions: LocationUpdateOptions = {
  enableHighAccuracy: true,
  timeout: 30000,        // 30 seconds - Allow more time for GPS to achieve good accuracy
  maximumAge: 10000,     // 10 seconds - Allow GPS time to improve between readings
  distanceFilter: 2,     // Update every 2 meters
  interval: 5000         // Update every 5 seconds - Reduced frequency for better accuracy
};
```

### Performance Considerations

- **Memory Management**: Automatic cleanup of callbacks and location history
- **Battery Optimization**: Configurable update intervals and distance filters
- **Error Recovery**: Automatic retry mechanisms for network failures
- **Callback Deduplication**: Prevents memory leaks from duplicate registrations

## Error Handling Strategies

### GPS Hardware Errors

```typescript
private handleLocationError(error: GeolocationError): void {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      console.warn('Location permission denied');
      this.notifyLocationError('Location permission denied. Please enable location services in settings.');
      break;
    case 2: // POSITION_UNAVAILABLE
      console.warn('Location position unavailable');
      this.notifyLocationError('GPS signal unavailable. Try moving to an open area.');
      break;
    case 3: // TIMEOUT
      console.warn('Location request timeout');
      this.notifyLocationError('GPS timeout. Check your location settings.');
      break;
    default:
      console.error('Unknown location error:', error);
      this.notifyLocationError('GPS error occurred. Please restart the app.');
  }
}
```

### Network and Backend Failures

- **Graceful Degradation**: Continue GPS tracking even when backend is unavailable
- **Retry Logic**: Automatic retry for network failures with exponential backoff
- **Local Processing**: Distance calculations continue using local data

## Integration Patterns

### React Component Integration

```typescript
// In ActiveRoundScreen.tsx
const handleLocationUpdate = useCallback((location: LocationData) => {
  // Validate location data
  if (!location.latitude || !location.longitude || 
      Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
    console.warn('🟡 Invalid location data, skipping update');
    return;
  }
  
  // Update Redux state
  dispatch(updateCurrentLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
  }));
}, [dispatch]);

// Register callback before starting GPS tracking
useEffect(() => {
  if (activeRound?.id && user?.id && !isLocationTracking && componentMountedRef.current) {
    const unsubscribeLocation = golfLocationService.onLocationUpdate(handleLocationUpdate);
    const unsubscribeContext = golfLocationService.onContextUpdate(handleContextUpdate);
    
    // Store cleanup functions
    cleanupFunctionsRef.current.push(unsubscribeLocation);
    cleanupFunctionsRef.current.push(unsubscribeContext);
    
    // Start GPS tracking
    golfLocationService.startRoundTracking(activeRound.id, activeRound.courseId);
  }
}, [activeRound?.id, user?.id]);
```

### Redux State Integration

```typescript
// Updates Redux store through actions
dispatch(updateCurrentLocation({
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy,
  currentHole: context.currentHole,
  distanceToPin: context.distanceToPin,
  distanceToTee: context.distanceToTee,
  positionOnHole: context.positionOnHole,
}));
```

## Testing and Validation

### Unit Testing Focus Areas

- **Callback Management**: Registration, deduplication, and cleanup
- **Error Handling**: GPS errors, network failures, permission issues
- **Data Validation**: Location data accuracy and bounds checking
- **Performance**: Memory leaks and callback efficiency

### Integration Testing

- **GPS Hardware**: Real device testing in various conditions
- **Network Scenarios**: Backend availability and failure recovery
- **State Synchronization**: Redux store updates and component coordination

## Security and Privacy

### Data Protection

- **Local Processing**: Location calculations performed on-device
- **Minimal Transmission**: Only necessary data sent to backend
- **Session Cleanup**: Location history cleared after round completion

### Permission Handling

- **Clear Messaging**: Explain why location permissions are needed
- **Graceful Degradation**: App remains functional without location services
- **User Control**: Easy way to disable location tracking

## Recent Improvements (v1.5.0)

### Component Lifecycle Fixes

- **Mount State Protection**: Prevents multiple GPS initializations
- **Atomic Cleanup**: Coordinated cleanup between service and components
- **Enhanced Error Recovery**: Better handling of component unmount scenarios

### Performance Enhancements

- **Throttled Logging**: Reduces console noise from 100+ logs/second to manageable levels
- **Callback Deduplication**: Prevents memory leaks from duplicate registrations
- **Efficient State Updates**: Minimized Redux store updates

### Developer Experience

- **Better Debugging**: Structured logging with emoji indicators
- **Error Context**: More detailed error messages and recovery suggestions
- **Performance Monitoring**: Built-in callback count tracking

## Troubleshooting Common Issues

### GPS Not Starting

1. Check location permissions in device settings
2. Verify GPS is enabled on device
3. Ensure app has foreground access
4. Check for component mount state issues

### Poor GPS Accuracy

1. Move to open area away from buildings
2. Check device GPS hardware status
3. Verify accuracy thresholds in configuration
4. Consider increasing timeout values

### Memory Leaks

1. Verify cleanup functions are called on unmount
2. Check for duplicate callback registrations
3. Monitor callback count in development logs
4. Ensure proper useEffect dependencies

## Related Documentation

- [Location and Mapping System Overview](./location-mapping-system.md)
- [GolfCourseMap Component](./golf-course-map.md)
- [DistanceCalculator Utility](./distance-calculator.md)
- [Troubleshooting Guide](./troubleshooting.md)

---

*This documentation reflects the LocationService implementation as of v1.5.0 (August 2025). Update when making changes to the service.*