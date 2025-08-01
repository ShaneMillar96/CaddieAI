# Location and Mapping System Troubleshooting Guide

**Status**: Completed  
**Version**: v1.5.0  
**Author**: CaddieAI Development Team  
**Date**: August 2025  
**Components**: LocationService, GolfCourseMap, MapOverlay, ActiveRoundScreen

## Overview

This troubleshooting guide provides solutions for common issues encountered with the CaddieAI location tracking and mapping system. It covers GPS problems, map loading failures, performance issues, and integration problems along with their solutions and prevention strategies.

## GPS and Location Tracking Issues

### GPS Not Starting / No Location Data

**Symptoms:**
- "No GPS" status indicator
- Map shows default location (Faughan Valley Golf Centre)
- Distance measurements unavailable
- Console shows "Location service not available"

**Common Causes:**
1. Location permissions not granted
2. GPS disabled on device
3. Component lifecycle issues
4. LocationService initialization failure

**Solutions:**

#### 1. Check Location Permissions

```typescript
// Verify permissions manually
const hasPermission = await golfLocationService.requestLocationPermissions();
if (!hasPermission) {
  Alert.alert(
    'Location Permission Required',
    'Please enable location services in device settings',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() }
    ]
  );
}
```

#### 2. Verify GPS Hardware Status

```bash
# Android - Check GPS status via ADB
adb shell settings get secure location_providers_allowed

# iOS - Check in Simulator
# Device -> Location -> Custom Location or Apple
```

#### 3. Component Mount State Issues

```typescript
// Ensure proper component mounting before GPS initialization
useEffect(() => {
  if (activeRound?.id && componentMountedRef.current && !locationTrackingInitializedRef.current) {
    locationTrackingInitializedRef.current = true;
    
    // Add delay to prevent race conditions
    setTimeout(() => {
      if (componentMountedRef.current) {
        startLocationTracking(activeRound.id, activeRound.courseId);
      }
    }, 300);
  }
}, [activeRound?.id]);
```

#### 4. Reset LocationService

```typescript
// Force reset of LocationService
if (isLocationServiceAvailable()) {
  golfLocationService.stopRoundTracking();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const success = await golfLocationService.startRoundTracking(roundId, courseId);
  
  if (!success) {
    console.error('Failed to restart location tracking');
    // Show user-friendly error message
  }
}
```

### Poor GPS Accuracy

**Symptoms:**
- GPS accuracy indicator shows "Poor" or "Very Poor"
- Inaccurate distance measurements
- Erratic location updates
- Map position jumping around

**Accuracy Thresholds:**
- **Excellent**: ≤8m accuracy
- **Good**: ≤15m accuracy  
- **Fair**: ≤25m accuracy
- **Poor**: ≤50m accuracy
- **Very Poor**: >50m accuracy

**Solutions:**

#### 1. Environmental Factors
- Move to open area away from buildings and trees
- Avoid playing in heavy cloud cover or storms
- Check for electromagnetic interference (power lines, cell towers)
- Wait for GPS to acquire more satellites (may take 30-60 seconds)

#### 2. Device-Specific Issues
```typescript
// Android: Clear GPS cache
// Settings > Apps > Google Play Services > Storage > Clear Cache

// iOS: Reset location services
// Settings > Privacy & Security > Location Services > System Services > Reset Location & Privacy
```

#### 3. Adjust GPS Settings
```typescript
// In LocationService.ts - more aggressive settings for better accuracy
private defaultOptions: LocationUpdateOptions = {
  enableHighAccuracy: true,
  timeout: 45000,        // Increase timeout for better fix
  maximumAge: 5000,      // Reduce max age for fresher data
  distanceFilter: 1,     // More sensitive distance filter
  interval: 3000         // More frequent updates
};
```

### GPS Constantly Starting/Stopping

**Symptoms:**
- Console logs showing repeated GPS start/stop cycles
- Battery drain from constant GPS usage
- Inconsistent location tracking
- "GPS tracking started/stopped" messages repeatedly

**Root Cause:**
Component mounting/unmounting rapidly causing GPS lifecycle issues.

**Solutions:**

#### 1. Component Lifecycle Fixes (v1.5.0)
```typescript
// Prevent multiple GPS initializations
const componentMountedRef = useRef(false);
const locationTrackingInitializedRef = useRef(false);
const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  componentMountedRef.current = true;
  
  return () => {
    componentMountedRef.current = false;
  };
}, []);

// Debounced GPS initialization
useEffect(() => {
  if (activeRound?.id && !isLocationTracking && !locationTrackingInitializedRef.current && componentMountedRef.current) {
    locationTrackingInitializedRef.current = true;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (componentMountedRef.current) {
        startLocationTracking(activeRound.id, activeRound.courseId);
      }
    }, 300);
  }
}, [activeRound?.id, user?.id]);
```

#### 2. Proper Cleanup Coordination
```typescript
// Enhanced cleanup in useEffect return
return () => {
  if (!componentMountedRef.current) {
    // Cancel any pending initialization
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    // Unregister callbacks first
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];
    
    // Then stop GPS tracking
    if (isLocationServiceAvailable()) {
      golfLocationService.stopRoundTracking();
    }
    
    // Reset state
    setIsLocationTracking(false);
    locationTrackingInitializedRef.current = false;
  }
};
```

## Map Loading and Display Issues

### Map Fails to Load

**Symptoms:**
- Gray screen where map should appear
- "Map Unavailable" fallback component shown
- Console errors about map provider
- Loading spinner never disappears

**Solutions:**

#### 1. Check Internet Connection
```typescript
// Test network connectivity
import NetInfo from '@react-native-community/netinfo';

const checkNetworkConnection = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    Alert.alert(
      'Network Error',
      'Map requires internet connection. Please check your network settings.',
      [{ text: 'OK' }]
    );
  }
};
```

#### 2. Verify Map Provider Configuration
```typescript
// Android - ensure Google Maps is properly configured
// Check android/app/src/main/AndroidManifest.xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY" />

// iOS - ensure proper map provider
const getMapProvider = () => {
  return Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
};
```

#### 3. Handle Map Timeout
```typescript
// Force map ready after timeout
useEffect(() => {
  const timeout = setTimeout(() => {
    if (!isMapReady) {
      console.warn('Map initialization timeout - forcing ready state');
      setIsMapReady(true);
      setIsMapLoading(false);
    }
  }, 10000); // 10 second timeout
  
  return () => clearTimeout(timeout);
}, [isMapReady]);
```

### Map Performance Issues

**Symptoms:**
- Slow map rendering
- Choppy animations
- Delayed location updates on map
- High memory usage

**Solutions:**

#### 1. Optimize Map Settings
```typescript
<MapView
  // Performance optimizations
  cacheEnabled={true}
  loadingEnabled={true}
  rotateEnabled={true}
  scrollEnabled={true}
  zoomEnabled={true}
  pitchEnabled={false}  // Disable 3D for better performance
  toolbarEnabled={false}
  moveOnMarkerPress={false}
  // Limit zoom levels
  minZoomLevel={12}
  maxZoomLevel={20}
/>
```

#### 2. Throttle Location Updates
```typescript
// Limit map region updates
const lastLocationUpdateRef = useRef<number>(0);

const shouldUpdateMap = (newLocation: LocationData): boolean => {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
  
  // Update max every 3 seconds
  if (timeSinceLastUpdate < 3000) {
    return false;
  }
  
  lastLocationUpdateRef.current = now;
  return true;
};
```

#### 3. Optimize Component Re-renders
```typescript
// Use React.memo with custom comparison
export default React.memo(GolfCourseMap, (prevProps, nextProps) => {
  return (
    prevProps.currentLocation?.latitude === nextProps.currentLocation?.latitude &&
    prevProps.currentLocation?.longitude === nextProps.currentLocation?.longitude &&
    prevProps.currentLocation?.accuracy === nextProps.currentLocation?.accuracy &&
    prevProps.mapType === nextProps.mapType
  );
});
```

### Map Markers Not Appearing

**Symptoms:**
- User location marker missing
- Target pin not visible
- Shot markers not displaying
- Markers appear in wrong locations

**Solutions:**

#### 1. Validate Coordinate Data
```typescript
const isValidCoordinate = (coord: Coordinate): boolean => {
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    Math.abs(coord.latitude) <= 90 &&
    Math.abs(coord.longitude) <= 180 &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
};

// Use validation before creating markers
if (currentLocation && isValidCoordinate(currentLocation)) {
  return (
    <Marker
      coordinate={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }}
      // ... other props
    />
  );
}
```

#### 2. Check Marker Lifecycle
```typescript
// Ensure markers are rendered after map is ready
const renderUserLocationMarker = () => {
  if (!currentLocation || !isMapReady) return null;
  
  // Validate coordinates before rendering
  if (!isValidCoordinate(currentLocation)) {
    console.warn('Invalid coordinates for user marker:', currentLocation);
    return null;
  }
  
  return <Marker /* ... */ />;
};
```

## State Management Issues

### Redux State Not Updating

**Symptoms:**
- Location data not reflected in UI
- Map doesn't respond to target selection
- State appears stale or incorrect
- Components don't re-render with new data

**Solutions:**

#### 1. Check Action Dispatch
```typescript
// Verify actions are being dispatched
const handleLocationUpdate = useCallback((location: LocationData) => {
  console.log('Dispatching location update:', location);
  
  dispatch(updateCurrentLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
  }));
}, [dispatch]);

// Check in Redux DevTools for action history
```

#### 2. Verify State Selectors
```typescript
// Use proper selectors
const currentLocation = useSelector((state: RootState) => {
  console.log('Current location from state:', state.voice.currentLocation);
  return state.voice.currentLocation;
});

// Avoid destructuring that might cause issues
// const { currentLocation } = useSelector((state: RootState) => state.voice);
```

#### 3. State Mutation Issues
```typescript
// Ensure immutable updates
const updateCurrentLocation = (state: VoiceState, action: PayloadAction<LocationUpdate>) => {
  // Good: Create new object
  state.currentLocation = {
    ...state.currentLocation,
    ...action.payload,
  };
  
  // Bad: Direct mutation
  // state.currentLocation.latitude = action.payload.latitude;
};
```

### Memory Leaks and Performance

**Symptoms:**
- App becomes slow over time
- Increasing memory usage
- Callbacks not being cleaned up
- Multiple GPS watchers running

**Solutions:**

#### 1. Callback Cleanup (v1.5.0)
```typescript
// Enhanced callback management
const cleanupFunctionsRef = useRef<Array<() => void>>([]);

// Register callbacks with cleanup tracking
const unsubscribeLocation = golfLocationService.onLocationUpdate(handleLocationUpdate);
cleanupFunctionsRef.current.push(unsubscribeLocation);

// Proper cleanup on unmount
useEffect(() => {
  return () => {
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  };
}, []);
```

#### 2. Prevent Duplicate Registrations
```typescript
// LocationService callback deduplication
onLocationUpdate(callback: (location: LocationData) => void): () => void {
  // Check for existing callback
  const existingIndex = this.updateCallbacks.indexOf(callback);
  if (existingIndex > -1) {
    console.warn('Callback already registered, skipping duplicate');
    return () => { /* cleanup existing */ };
  }
  
  this.updateCallbacks.push(callback);
  return () => { /* proper cleanup */ };
}
```

## Console Logging Issues

### Excessive Console Output

**Symptoms:**
- Console flooded with location updates
- Performance impact from logging
- Difficulty finding relevant information
- "LocationService" messages repeating constantly

**Solution - Throttled Logging (v1.5.0):**

```typescript
// In LocationService.ts
private lastLogTimestamp: { [key: string]: number } = {};
private logThrottleMs: number = 2000;

private throttledLog(key: string, message: string, ...args: any[]): void {
  const now = Date.now();
  const lastLog = this.lastLogTimestamp[key] || 0;
  
  if (now - lastLog >= this.logThrottleMs) {
    console.log(message, ...args);
    this.lastLogTimestamp[key] = now;
  }
}

// Replace repetitive console.log with throttledLog
this.throttledLog('location-update', 'Location updated:', location);
this.throttledLog('callback-registration', 'Callback registered, total:', this.updateCallbacks.length);
```

### Debug Logging Configuration

```typescript
// Environment-based logging
const isDevelopment = __DEV__;

const debugLog = (message: string, ...args: any[]) => {
  if (isDevelopment) {
    console.log(`🔵 [DEBUG] ${message}`, ...args);
  }
};

// Production-safe error logging
const errorLog = (message: string, error?: any) => {
  console.error(`🔴 [ERROR] ${message}`, error);
  
  // In production, you might want to send to crash reporting
  if (!isDevelopment && error) {
    // crashlytics.recordError(error);
  }
};
```

## Platform-Specific Issues

### iOS Specific Problems

#### Location Services Not Working in Simulator
```typescript
// Check if running in simulator
import { Platform } from 'react-native';

const isSimulator = Platform.OS === 'ios' && Platform.isPad === false && Platform.isTVOS === false;

if (isSimulator) {
  Alert.alert(
    'Simulator Location',
    'Location services may be limited in iOS Simulator. Use Device > Location > Custom Location to set a test location.',
    [{ text: 'OK' }]
  );
}
```

#### Info.plist Configuration
```xml
<!-- Ensure these are in ios/CaddieAIMobile/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>CaddieAI needs location access to provide accurate golf distance measurements and course navigation.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>CaddieAI uses your location to track your position during golf rounds and provide distance calculations.</string>
```

### Android Specific Problems

#### Google Play Services Issues
```bash
# Check Google Play Services on device
adb shell pm list packages | grep google

# Update Google Play Services
# Play Store > Google Play Services > Update
```

#### Permissions in AndroidManifest.xml
```xml
<!-- Ensure these permissions are in android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### Proguard Configuration
```bash
# If using Proguard, add to android/app/proguard-rules.pro
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
```

## Testing and Debugging Tools

### GPS Testing Tools

#### Manual GPS Testing
```typescript
// Add to development menu
const testGPS = async () => {
  const position = await new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (error) => {
        console.error('GPS test failed:', error);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
  
  Alert.alert('GPS Test', `Position: ${JSON.stringify(position, null, 2)}`);
};
```

#### Location Service Status
```typescript
// Development debugging component
const LocationDebugger: React.FC = () => {
  const [status, setStatus] = useState<any>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        isTracking: golfLocationService.isTracking,
        callbackCount: golfLocationService.updateCallbacks.length,
        currentLocation: golfLocationService.getCurrentLocation(),
        lastUpdate: new Date().toISOString(),
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!__DEV__) return null;
  
  return (
    <View style={styles.debugOverlay}>
      <Text>GPS Status: {status.isTracking ? 'Active' : 'Inactive'}</Text>
      <Text>Callbacks: {status.callbackCount}</Text>
      <Text>Location: {status.currentLocation ? 'Available' : 'None'}</Text>
    </View>
  );
};
```

### Performance Monitoring

```typescript
// Monitor component re-renders
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
};

// Use in components
const GolfCourseMap: React.FC<GolfCourseMapProps> = (props) => {
  useRenderCount('GolfCourseMap');
  // ... component logic
};
```

## Emergency Recovery Procedures

### Complete System Reset

If all else fails, follow these steps to reset the location system:

```typescript
const emergencyLocationReset = async () => {
  try {
    // 1. Stop all location tracking
    if (isLocationServiceAvailable()) {
      golfLocationService.stopRoundTracking();
    }
    
    // 2. Clear all callbacks
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];
    
    // 3. Clear Redux state
    dispatch(updateCurrentLocation({
      latitude: 0,
      longitude: 0,
      accuracy: undefined,
    }));
    dispatch(clearTargetPin());
    
    // 4. Reset component state
    setIsLocationTracking(false);
    setMapStateLocal({
      region: null,
      userLocation: null,
      shotMarkers: [],
      isPlacingShotMode: false,
    });
    
    // 5. Wait and restart
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Restart location tracking
    if (activeRound?.id) {
      await startLocationTracking(activeRound.id, activeRound.courseId);
    }
    
    Alert.alert('System Reset', 'Location system has been reset successfully.');
  } catch (error) {
    console.error('Emergency reset failed:', error);
    Alert.alert('Reset Failed', 'Please restart the app.');
  }
};
```

## Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|--------|----------|
| "Location service not available" | LocationService not initialized | Check component mount state, restart GPS |
| "No location update callbacks registered" | Callbacks cleared before GPS stop | Ensure proper cleanup order |
| "Attempted to unsubscribe callback that was not found" | Duplicate cleanup calls | Use callback deduplication |
| "Invalid location data, skipping update" | GPS returning invalid coordinates | Validate coordinates before processing |
| "Map initialization timeout reached" | Map taking too long to load | Check network, force map ready after timeout |
| "GPS tracking started/stopped" (repeated) | Component lifecycle issues | Implement mount state protection |

## Prevention Best Practices

### Code Quality
- Always validate GPS coordinates before use
- Implement proper error boundaries
- Use TypeScript for type safety
- Add comprehensive unit tests

### Performance
- Throttle location updates appropriately
- Use memoization for expensive calculations
- Clean up resources on component unmount
- Monitor memory usage in development

### User Experience
- Provide clear feedback on GPS status
- Handle permission requests gracefully
- Offer fallback functionality when GPS unavailable
- Show loading states during map initialization

### Debugging
- Use environment-based logging levels
- Implement performance monitoring
- Add development debugging tools
- Test on real devices regularly

## Related Documentation

- [Location and Mapping System Overview](./location-mapping-system.md)
- [LocationService Architecture](./location-service.md)
- [GolfCourseMap Component](./golf-course-map.md)
- [MapOverlay Component](./map-overlay.md)
- [DistanceCalculator Utility](./distance-calculator.md)
- [State Management Integration](./state-management.md)

---

*This troubleshooting guide reflects known issues and solutions as of v1.5.0 (August 2025). Update when new issues are discovered or resolved.*