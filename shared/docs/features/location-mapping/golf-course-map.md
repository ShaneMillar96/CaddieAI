# GolfCourseMap Component Architecture

**Status**: Completed  
**Version**: v1.5.0  
**Author**: CaddieAI Development Team  
**Date**: August 2025  
**File**: `CaddieAIMobile/src/components/map/GolfCourseMap.tsx`

## Overview

The `GolfCourseMap` component is a React Native component that provides an interactive golf course map experience using `react-native-maps`. It specializes in golf-specific functionality including user location tracking, target pin selection, distance measurement, and course-optimized map settings.

## Component Architecture

### Core Props Interface

```typescript
export interface GolfCourseMapProps {
  currentLocation: LocationData | {
    latitude: number;
    longitude: number;
    accuracy?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;
  onTargetSelected: (coordinate: Coordinate, distance: DistanceResult) => void;
  onLocationUpdate: (coordinate: Coordinate) => void;
  courseId?: number;
  courseName?: string;
  initialRegion?: Region;
  showSatellite?: boolean;
  enableTargetPin?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
}
```

### State Management

```typescript
const [targetPin, setTargetPin] = useState<TargetPin | null>(null);
const [mapRegion, setMapRegion] = useState<Region | null>(null);
const [isMapReady, setIsMapReady] = useState(false);
const [isMapLoading, setIsMapLoading] = useState(true);
const [mapError, setMapError] = useState<string | null>(null);
const [hasInitialLocation, setHasInitialLocation] = useState(false);
const [mapInitTimeout, setMapInitTimeout] = useState(false);
const [hasMapRef, setHasMapRef] = useState(false);
```

## Core Functionality

### Map Initialization and Lifecycle

#### 1. Map Ready Handling

```typescript
const handleMapReady = useCallback(() => {
  console.log('🟢 GolfCourseMap.handleMapReady: **MAP READY EVENT TRIGGERED**');
  
  setIsMapReady(true);
  setIsMapLoading(false);
  setMapError(null); // Clear any previous errors
  
  // Priority order: current location > initial region > default region
  if (currentLocation && mapRef.current) {
    const region: Region = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005, // Golf-appropriate zoom level
      longitudeDelta: 0.005,
    };
    setMapRegion(region);
    setHasInitialLocation(true);
    // Immediately animate to user location
    mapRef.current.animateToRegion(region, 1000);
    console.log('GolfCourseMap: Map ready - positioned at user location:', region);
  } else if (initialRegion && mapRef.current) {
    setMapRegion(initialRegion);
    mapRef.current.animateToRegion(initialRegion, 1000);
    console.log('GolfCourseMap: Map ready - positioned at initial region:', initialRegion);
  } else {
    setMapRegion(defaultRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(defaultRegion, 1000);
    }
    console.log('GolfCourseMap: Map ready - positioned at default region (Faughan Valley):', defaultRegion);
  }
}, []);
```

#### 2. Map Initialization Timeout Protection

```typescript
// Map initialization timeout - force map ready if it takes too long
useEffect(() => {
  console.log('🟠 GolfCourseMap: Setting up map initialization timeout...');
  
  // Set a 10-second timeout for map initialization
  mapInitTimeoutRef.current = setTimeout(() => {
    if (!isMapReady) {
      console.log('⚠️ GolfCourseMap: Map initialization timeout reached - forcing map ready state');
      setMapInitTimeout(true);
      setIsMapReady(true);
      setIsMapLoading(false);
      
      // Try to initialize with available region
      if (currentLocation) {
        const region: Region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(region);
        
        // If we have a mapRef, try to animate to the region immediately
        if (hasMapRef && mapRef.current) {
          try {
            mapRef.current.animateToRegion(region, 1000);
            console.log('🟢 GolfCourseMap: Timeout - successfully animated to current location');
          } catch (error) {
            console.error('🔴 GolfCourseMap: Timeout - error animating to region:', error);
          }
        }
      }
    }
  }, 10000); // 10 second timeout
  
  return () => {
    if (mapInitTimeoutRef.current) {
      clearTimeout(mapInitTimeoutRef.current);
      mapInitTimeoutRef.current = null;
    }
  };
}, [isMapReady]);
```

### Location Tracking and Updates

#### 1. Dynamic Location Updates

```typescript
// Update map region when current location changes with auto-zoom
useEffect(() => {
  if (currentLocation && isMapReady && hasMapRef && mapRef.current) {
    const newRegion: Region = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005, // Closer zoom for golf (approximately 500m radius)
      longitudeDelta: 0.005,
    };

    // Only update if location has changed significantly or it's the first location
    const now = Date.now();
    const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
    const isFirstLocation = lastLocationUpdateRef.current === 0;
    
    if (isFirstLocation || timeSinceLastUpdate > 3000) { // Update max every 3 seconds, immediate for first location
      setMapRegion(newRegion);
      
      // Auto-zoom to user location with smooth animation
      try {
        mapRef.current.animateToRegion(newRegion, 1500); // 1.5 second animation
      } catch (error) {
        console.error('🔴 GolfCourseMap: Error calling animateToRegion:', error);
      }
      
      lastLocationUpdateRef.current = now;
      
      // Notify parent of location update
      if (onLocationUpdate) {
        onLocationUpdate({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
    }
  }
}, [currentLocation, isMapReady, hasMapRef]);
```

#### 2. Map Region Calculation

```typescript
// Default region (should be updated based on course location)
const defaultRegion: Region = initialRegion || {
  latitude: 54.9783, // Faughan Valley Golf Centre coordinates
  longitude: -7.2054,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};
```

### Interactive Features

#### 1. Target Pin Selection

```typescript
// Handle map press for enhanced target pin placement with loading state
const handleMapPress = useCallback((event: MapPressEvent) => {
  if (!enableTargetPin || !currentLocation) {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please wait for GPS to acquire your location before selecting targets.',
        [{ text: 'OK' }]
      );
    }
    return;
  }

  const coordinate = event.nativeEvent.coordinate;
  
  // Calculate distance to target with enhanced validation
  const distance = DistanceCalculator.calculateDistance(
    {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    },
    coordinate
  );

  // Enhanced distance validation for golf shots
  if (distance.yards < 5) {
    Alert.alert(
      'Target Too Close',
      'Please select a target at least 5 yards away for meaningful distance measurement.',
      [{ text: 'OK' }]
    );
    return;
  }

  if (distance.yards > 600) {
    Alert.alert(
      'Target Too Far',
      'Please select a target within 600 yards for accurate golf distance measurement. Consider breaking longer shots into segments.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Create new target pin with enhanced data and smooth transition
  const newTargetPin: TargetPin = {
    coordinate,
    distance,
    timestamp: Date.now(),
  };

  // Add smooth transition for target pin placement
  setTargetPin(null); // Clear first for smooth transition
  setTimeout(() => {
    setTargetPin(newTargetPin);
    onTargetSelected(coordinate, distance);
  }, 100);
  
  console.log(`Target selected: ${distance.yards} yards from current location`);
}, [currentLocation, enableTargetPin, onTargetSelected]);
```

#### 2. Map Gestures and Controls

```typescript
// Handle long press for recentering map with enhanced feedback
const handleLongPress = useCallback(() => {
  if (currentLocation && mapRef.current) {
    const region: Region = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current.animateToRegion(region, 1500);
    
    // Reset last update time to force immediate update on next location change
    lastLocationUpdateRef.current = 0;
    
    console.log('Map recentered to user location');
  } else if (!currentLocation) {
    console.warn('Cannot recenter: user location not available');
  }
}, [currentLocation]);

// Clear target pin on double tap with smooth animation
const handleDoubleTap = useCallback(() => {
  if (targetPin) {
    // Animate out the target pin
    setTargetPin(null);
    onTargetSelected({ latitude: 0, longitude: 0 }, { yards: 0, meters: 0, feet: 0, kilometers: 0, miles: 0 });
    console.log('Target pin cleared with animation');
  }
}, [targetPin, onTargetSelected]);
```

## Custom Markers and Overlays

### User Location Marker

```typescript
const renderUserLocationMarker = () => {
  if (!currentLocation) return null;

  const accuracyText = currentLocation.accuracy 
    ? `GPS: ${currentLocation.accuracy.toFixed(1)}m` 
    : 'GPS: Unknown';
  
  const speedText = ('speed' in currentLocation && currentLocation.speed) 
    ? ` • Speed: ${(currentLocation.speed * 3.6).toFixed(1)} km/h` 
    : '';

  return (
    <Marker
      coordinate={{
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      title="Your Position"
      description={`${accuracyText}${speedText}`}
    >
      <View style={styles.userLocationContainer}>
        <View style={styles.userLocationMarker}>
          <Icon name="person-pin" size={16} color="#fff" />
        </View>
        <View style={styles.userLocationPulse} />
        {/* GPS accuracy indicator */}
        {currentLocation.accuracy && currentLocation.accuracy <= 10 && (
          <View style={styles.accuracyIndicator}>
            <Icon name="gps-fixed" size={12} color="#4CAF50" />
          </View>
        )}
      </View>
    </Marker>
  );
};
```

### Target Pin Marker

```typescript
const renderTargetMarker = () => {
  if (!targetPin) return null;

  const formattedDistance = DistanceCalculator.formatGolfDistance(targetPin.distance);
  const recommendedClub = getRecommendedClub(targetPin.distance.yards);

  return (
    <Marker
      coordinate={targetPin.coordinate}
      anchor={{ x: 0.5, y: 1.0 }}
      title="Shot Target"
      description={`${formattedDistance} • ${recommendedClub}`}
    >
      <View style={styles.targetMarkerContainer}>
        {/* Target pin with distance badge */}
        <View style={styles.targetMarker}>
          <Icon name="golf-course" size={24} color="#fff" />
        </View>
        {/* Distance badge */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{targetPin.distance.yards}y</Text>
        </View>
        {/* Crosshair effect */}
        <View style={styles.crosshair}>
          <View style={[styles.crosshairLine, styles.crosshairHorizontal]} />
          <View style={[styles.crosshairLine, styles.crosshairVertical]} />
        </View>
      </View>
    </Marker>
  );
};
```

### Club Recommendation System

```typescript
// Get recommended club based on distance
const getRecommendedClub = (yards: number): string => {
  if (yards >= 280) return 'Driver';
  if (yards >= 240) return '3-Wood';
  if (yards >= 210) return '5-Wood';
  if (yards >= 190) return '3-Iron';
  if (yards >= 170) return '4-Iron';
  if (yards >= 160) return '5-Iron';
  if (yards >= 150) return '6-Iron';
  if (yards >= 140) return '7-Iron';
  if (yards >= 130) return '8-Iron';
  if (yards >= 120) return '9-Iron';
  if (yards >= 105) return 'PW';
  if (yards >= 90) return 'SW';
  if (yards >= 70) return 'LW';
  return 'Short Iron';
};
```

## Map Configuration and Optimization

### Golf-Optimized Settings

```typescript
<MapView
  ref={(ref) => {
    mapRef.current = ref;
    setHasMapRef(!!ref);
  }}
  provider={getMapProvider()}
  style={styles.map}
  mapType={currentMapType as any}
  region={mapRegion || defaultRegion}
  onPress={handleMapPress}
  onLongPress={handleLongPress}
  onDoublePress={handleDoubleTap}
  onMapReady={handleMapReady}
  showsUserLocation={false} // We use custom marker
  showsMyLocationButton={false}
  showsCompass={true}
  showsScale={true}
  showsTraffic={false} // Disable traffic for golf courses
  showsBuildings={currentMapType === 'satellite' || currentMapType === 'hybrid'}
  showsIndoors={false} // Disable indoor maps
  rotateEnabled={true}
  scrollEnabled={true}
  zoomEnabled={true}
  pitchEnabled={false} // Disable 3D tilt for golf
  toolbarEnabled={false}
  moveOnMarkerPress={false}
  onRegionChangeComplete={(region) => {
    setMapRegion(region);
  }}
  // Golf-optimized settings
  minZoomLevel={12} // Prevent zooming out too far
  maxZoomLevel={20} // Allow detailed course view
  // Performance optimizations
  cacheEnabled={true}
  loadingEnabled={true}
  loadingIndicatorColor="#4a7c59"
  loadingBackgroundColor="#f5f5f5"
>
```

### Platform-Specific Providers

```typescript
// Get map provider based on platform
const getMapProvider = () => {
  return Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
};
```

## Error Handling and Fallbacks

### Map Loading Error Handling

```typescript
const handleMapError = useCallback((error: unknown) => {
  console.error('Map loading error:', error);
  setIsMapLoading(false);
  setIsMapReady(false);
  
  let errorMessage = 'Unable to load map. Please check your internet connection and try again.';
  
  // Provide more specific error messages
  const errorObj = error as any;
  if (errorObj?.code === 'NETWORK_ERROR') {
    errorMessage = 'Network error: Please check your internet connection.';
  } else if (errorObj?.code === 'API_KEY_ERROR') {
    errorMessage = 'Map service configuration error. Please contact support.';
  } else if (errorObj?.message?.includes('location')) {
    errorMessage = 'Location services error. Please enable GPS and try again.';
  }
  
  setMapError(errorMessage);
}, []);
```

### Fallback Components

```typescript
// Loading component for map initialization
const renderMapLoading = () => (
  <View style={styles.loadingContainer}>
    <Icon name="golf-course" size={48} color="#4a7c59" />
    <Text style={styles.loadingTitle}>Loading Golf Course Map</Text>
    <Text style={styles.loadingMessage}>
      {currentLocation ? 'Centering on your location...' : 'Initializing course view...'}
    </Text>
  </View>
);

// Fallback component when map fails to load
const renderMapFallback = () => (
  <View style={styles.fallbackContainer}>
    <Icon name="map-off" size={48} color="#ccc" />
    <Text style={styles.fallbackTitle}>Map Unavailable</Text>
    <Text style={styles.fallbackMessage}>
      {mapError || 'The map could not be loaded. Golf features will work with location data only.'}
    </Text>
    {currentLocation && (
      <View style={styles.locationInfo}>
        <Text style={styles.locationText}>
          Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
        </Text>
        {currentLocation.accuracy && (
          <Text style={styles.accuracyText}>
            GPS Accuracy: {currentLocation.accuracy.toFixed(1)}m
          </Text>
        )}
      </View>
    )}
  </View>
);
```

## Performance Optimization

### React.memo with Custom Comparison

```typescript
export default React.memo(GolfCourseMap, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.currentLocation?.latitude === nextProps.currentLocation?.latitude &&
    prevProps.currentLocation?.longitude === nextProps.currentLocation?.longitude &&
    prevProps.currentLocation?.accuracy === nextProps.currentLocation?.accuracy &&
    prevProps.mapType === nextProps.mapType &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.enableTargetPin === nextProps.enableTargetPin
  );
});
```

### Efficient State Updates

```typescript
// Only update map region when necessary
const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
const isFirstLocation = lastLocationUpdateRef.current === 0;

if (isFirstLocation || timeSinceLastUpdate > 3000) {
  // Update with throttling
  setMapRegion(newRegion);
  mapRef.current.animateToRegion(newRegion, 1500);
  lastLocationUpdateRef.current = now;
}
```

## UI Controls and Indicators

### Map Controls Overlay

```typescript
{/* Enhanced map controls with smooth transitions */}
<View style={styles.mapControlsContainer}>
  {/* Map type indicator */}
  <View style={styles.mapTypeContainer}>
    <Icon 
      name={getMapTypeIcon(currentMapType)} 
      size={20} 
      color="#4a7c59" 
    />
    <Text style={styles.mapTypeText}>{getMapTypeLabel(currentMapType)}</Text>
  </View>
  
  {/* Distance display for target with smooth appearance */}
  {targetPin && (
    <View style={[styles.distanceDisplay, styles.fadeInAnimation]}>
      <Icon name="straighten" size={16} color="#4a7c59" />
      <Text style={styles.distanceDisplayText}>
        {targetPin.distance.yards}y
      </Text>
      <Text style={styles.clubRecommendation}>
        {getRecommendedClub(targetPin.distance.yards)}
      </Text>
    </View>
  )}
  
  {/* GPS status indicator */}
  {currentLocation && (
    <View style={styles.gpsStatusContainer}>
      <Icon 
        name={currentLocation.accuracy && currentLocation.accuracy <= 10 ? 'gps-fixed' : 'gps-not-fixed'} 
        size={16} 
        color={currentLocation.accuracy && currentLocation.accuracy <= 10 ? '#4CAF50' : '#ff9800'} 
      />
      <Text style={styles.gpsStatusText}>
        {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'GPS'}
      </Text>
    </View>
  )}
</View>
```

### Map Type Management

```typescript
// Helper functions for map controls
const getMapTypeIcon = (mapType: string) => {
  switch (mapType) {
    case 'satellite': return 'satellite';
    case 'hybrid': return 'layers';
    case 'terrain': return 'terrain';
    default: return 'map';
  }
};

const getMapTypeLabel = (mapType: string) => {
  switch (mapType) {
    case 'satellite': return 'Satellite';
    case 'hybrid': return 'Hybrid';
    case 'terrain': return 'Terrain';
    default: return 'Standard';
  }
};
```

## Testing and Validation

### Component Testing Focus

- **Map Initialization**: Verify map loads correctly with various props
- **Location Updates**: Test map recentering with location changes
- **Target Pin Interaction**: Validate distance calculations and club recommendations
- **Error Handling**: Test graceful degradation when map fails to load
- **Performance**: Verify efficient re-renders with location updates

### Integration Testing

- **GPS Integration**: Test with real location data from LocationService
- **Redux Integration**: Verify state updates propagate correctly
- **Platform Testing**: Test on both iOS and Android devices
- **Network Conditions**: Test offline and poor connectivity scenarios

## Platform Considerations

### iOS Specific

- **Apple Maps Integration**: Uses PROVIDER_DEFAULT for consistent iOS experience
- **Core Location**: Proper integration with iOS location services
- **Performance**: Optimized for Metal rendering on iOS devices

### Android Specific

- **Google Maps Integration**: Uses PROVIDER_GOOGLE for full feature support
- **Google Play Services**: Requires Google Play Services for full functionality
- **Memory Management**: Optimized for Android's garbage collection patterns

## Future Enhancements

### Planned Features

- **Course Boundary Detection**: Automatic hole detection based on GPS location
- **Elevation Profile**: Display elevation changes for course strategy
- **Weather Overlay**: Wind direction and speed visualization
- **Shot Tracking**: Automatic shot detection and trajectory display

### Performance Improvements

- **Offline Maps**: Pre-cached course maps for offline play
- **Vector Tiles**: More efficient map rendering
- **WebGL Acceleration**: Enhanced performance for complex overlays

## Related Documentation

- [Location and Mapping System Overview](./location-mapping-system.md)
- [LocationService Architecture](./location-service.md)
- [MapOverlay Component](./map-overlay.md)
- [DistanceCalculator Utility](./distance-calculator.md)
- [Troubleshooting Guide](./troubleshooting.md)

---

*This documentation reflects the GolfCourseMap implementation as of v1.5.0 (August 2025). Update when making changes to the component.*