# MapOverlay Component Documentation

**Status**: Completed  
**Version**: v1.5.0  
**Author**: CaddieAI Development Team  
**Date**: August 2025  
**File**: `CaddieAIMobile/src/components/map/MapOverlay.tsx`

## Overview

The `MapOverlay` component provides a comprehensive UI overlay system for the GolfCourseMap, delivering real-time status information, interactive controls, and golf-specific data visualization. It acts as the primary interface between the user and the mapping system, displaying GPS status, distance measurements, shot tracking, and course information.

## Component Architecture

### Core Props Interface

```typescript
export interface MapOverlayProps {
  courseName?: string;
  currentHole?: number;
  currentLocation: LocationData | {
    latitude: number;
    longitude: number;
    accuracy?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;
  targetDistance: DistanceResult | null;
  targetPin?: {
    latitude: number;
    longitude: number;
    distanceYards: number;
    bearing: number;
    timestamp: number;
  } | null;
  shotMarkers?: ShotMarker[];
  isLocationTracking: boolean;
  isVoiceInterfaceVisible: boolean;
  isPlacingShotMode?: boolean;
  onVoiceToggle: () => void;
  onSettingsPress: () => void;
  onRoundControlsPress: () => void;
  onClearTarget: () => void;
  onToggleShotMode?: () => void;
  onCenterOnUser?: () => void;
  onRemoveShotMarker?: (markerId: string) => void;
  roundStatus?: string;
  gpsAccuracy?: number;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
}
```

### Supporting Interfaces

```typescript
export interface ShotMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  distance?: DistanceResult;
  club?: string;
  note?: string;
}
```

## Core Components

### GPS Status Indicator

The `GPSStatusIndicator` component provides real-time GPS connection and accuracy information:

```typescript
const GPSStatusIndicator: React.FC<{
  currentLocation: any;
  gpsAccuracy?: number;
}> = React.memo(({ currentLocation, gpsAccuracy }) => {
  const gpsStatus = useMemo(() => {
    if (!currentLocation) {
      return { icon: 'location-off', color: '#dc3545', text: 'No GPS' };
    }
    
    const accuracy = gpsAccuracy || currentLocation.accuracy;
    
    if (accuracy === undefined || accuracy === null) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'Searching...' };
    }
    
    if (accuracy <= 8) {
      return { icon: 'gps-fixed', color: '#28a745', text: 'Excellent' };
    } else if (accuracy <= 15) {
      return { icon: 'gps-fixed', color: '#28a745', text: 'Good' };
    } else if (accuracy <= 25) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'Fair' };
    } else if (accuracy <= 50) {
      return { icon: 'gps-off', color: '#ff6b35', text: 'Poor' };
    } else {
      return { icon: 'gps-off', color: '#dc3545', text: 'Very Poor' };
    }
  }, [currentLocation, gpsAccuracy]);

  return (
    <View style={styles.gpsStatus}>
      <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
      <Text style={[styles.gpsText, { color: gpsStatus.color }]}>
        {gpsStatus.text}
      </Text>
      {gpsAccuracy && (
        <Text style={styles.accuracyText}>
          {gpsAccuracy.toFixed(0)}m
        </Text>
      )}
    </View>
  );
});
```

#### GPS Status Thresholds

- **Excellent (≤8m)**: Ideal for precise golf measurements
- **Good (≤15m)**: Suitable for general golf guidance
- **Fair (≤25m)**: Adequate for approximate distances
- **Poor (≤50m)**: Limited accuracy for golf applications
- **Very Poor (>50m)**: Recommend moving to open area

## UI Layout Structure

### Top Status Bar

Located at the top of the screen, providing essential course and round information:

```typescript
<View style={styles.topStatusBar}>
  <View style={styles.courseInfo}>
    <Icon name="golf-course" size={20} color="#fff" />
    <Text style={styles.courseName}>
      {courseName || 'Golf Course'}
    </Text>
  </View>
  
  <View style={styles.holeInfo}>
    <Text style={styles.holeLabel}>Hole</Text>
    <Text style={styles.holeNumber}>{currentHole || 1}</Text>
  </View>
  
  <View style={styles.roundStatus}>
    <Icon 
      name={getRoundStatusIcon(roundStatus)} 
      size={16} 
      color="#fff" 
    />
    <Text style={styles.statusText}>
      {formatRoundStatus(roundStatus)}
    </Text>
  </View>
</View>
```

### Right Control Panel

Vertical panel on the right side containing interactive controls:

```typescript
<View style={styles.rightControlPanel}>
  {/* GPS Status */}
  <GPSStatusIndicator 
    currentLocation={currentLocation}
    gpsAccuracy={gpsAccuracy}
  />
  
  {/* Voice AI Toggle */}
  <TouchableOpacity
    style={[
      styles.controlButton,
      isVoiceInterfaceVisible && styles.controlButtonActive
    ]}
    onPress={onVoiceToggle}
  >
    <Icon 
      name={isVoiceInterfaceVisible ? 'mic' : 'mic-off'} 
      size={24} 
      color={isVoiceInterfaceVisible ? '#4a7c59' : '#666'} 
    />
  </TouchableOpacity>
  
  {/* Map Settings */}
  <TouchableOpacity
    style={styles.controlButton}
    onPress={onSettingsPress}
  >
    <Icon name="layers" size={24} color="#666" />
  </TouchableOpacity>
  
  {/* Round Controls */}
  <TouchableOpacity
    style={styles.controlButton}
    onPress={onRoundControlsPress}
  >
    <Icon name="more-vert" size={24} color="#666" />
  </TouchableOpacity>
</View>
```

### Bottom Information Panel

Dynamic panel showing distance measurements and golf-specific data:

```typescript
<View style={styles.bottomPanel}>
  {/* Target Distance Display */}
  {targetDistance && (
    <View style={styles.distanceCard}>
      <View style={styles.distanceHeader}>
        <Icon name="straighten" size={20} color="#4a7c59" />
        <Text style={styles.distanceLabel}>Target Distance</Text>
        <TouchableOpacity onPress={onClearTarget}>
          <Icon name="close" size={18} color="#999" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.distanceContent}>
        <Text style={styles.distanceValue}>
          {targetDistance.yards}
        </Text>
        <Text style={styles.distanceUnit}>yards</Text>
      </View>
      
      <View style={styles.clubRecommendation}>
        <Icon name="golf-course" size={16} color="#666" />
        <Text style={styles.clubText}>
          {getRecommendedClub(targetDistance.yards)}
        </Text>
      </View>
      
      {targetPin && (
        <View style={styles.bearingInfo}>
          <Icon name="explore" size={14} color="#999" />
          <Text style={styles.bearingText}>
            {formatBearing(targetPin.bearing)}
          </Text>
        </View>
      )}
    </View>
  )}
  
  {/* Current Location Info */}
  {currentLocation && (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <Icon name="my-location" size={16} color="#4a7c59" />
        <Text style={styles.locationLabel}>Current Position</Text>
      </View>
      
      <View style={styles.locationDetails}>
        {currentLocation.distanceToPin && (
          <View style={styles.locationItem}>
            <Text style={styles.locationItemLabel}>To Pin:</Text>
            <Text style={styles.locationItemValue}>
              {currentLocation.distanceToPin}y
            </Text>
          </View>
        )}
        
        {currentLocation.distanceToTee && (
          <View style={styles.locationItem}>
            <Text style={styles.locationItemLabel}>To Tee:</Text>
            <Text style={styles.locationItemValue}>
              {currentLocation.distanceToTee}y
            </Text>
          </View>
        )}
        
        {currentLocation.positionOnHole && (
          <View style={styles.locationItem}>
            <Text style={styles.locationItemLabel}>Position:</Text>
            <Text style={styles.locationItemValue}>
              {formatPosition(currentLocation.positionOnHole)}
            </Text>
          </View>
        )}
      </View>
    </View>
  )}
</View>
```

## Interactive Features

### Shot Tracking Mode

When shot tracking is enabled, the overlay provides shot placement and management tools:

```typescript
{isPlacingShotMode && (
  <View style={styles.shotModeOverlay}>
    <View style={styles.shotModeHeader}>
      <Icon name="golf-course" size={24} color="#4a7c59" />
      <Text style={styles.shotModeTitle}>Tap map to place shot</Text>
      <TouchableOpacity 
        onPress={onToggleShotMode}
        style={styles.cancelShotMode}
      >
        <Icon name="close" size={20} color="#999" />
      </TouchableOpacity>
    </View>
    
    <Text style={styles.shotModeInstructions}>
      Tap anywhere on the map to mark your shot location
    </Text>
  </View>
)}

{/* Shot Markers List */}
{shotMarkers && shotMarkers.length > 0 && (
  <ScrollView style={styles.shotMarkersList} horizontal>
    {shotMarkers.map((marker, index) => (
      <View key={marker.id} style={styles.shotMarkerItem}>
        <View style={styles.shotMarkerHeader}>
          <Text style={styles.shotMarkerNumber}>
            Shot {index + 1}
          </Text>
          <TouchableOpacity 
            onPress={() => onRemoveShotMarker?.(marker.id)}
          >
            <Icon name="delete" size={16} color="#dc3545" />
          </TouchableOpacity>
        </View>
        
        {marker.distance && (
          <Text style={styles.shotMarkerDistance}>
            {marker.distance.yards}y
          </Text>
        )}
        
        {marker.club && (
          <Text style={styles.shotMarkerClub}>
            {marker.club}
          </Text>
        )}
        
        <Text style={styles.shotMarkerTime}>
          {formatTime(marker.timestamp)}
        </Text>
      </View>
    ))}
  </ScrollView>
)}
```

### Quick Action Buttons

Floating action buttons for common operations:

```typescript
<View style={styles.quickActions}>
  {/* Center on User Location */}
  <TouchableOpacity
    style={styles.quickActionButton}
    onPress={onCenterOnUser}
    disabled={!currentLocation}
  >
    <Icon 
      name="my-location" 
      size={20} 
      color={currentLocation ? "#4a7c59" : "#ccc"} 
    />
  </TouchableOpacity>
  
  {/* Toggle Shot Mode */}
  <TouchableOpacity
    style={[
      styles.quickActionButton,
      isPlacingShotMode && styles.quickActionButtonActive
    ]}
    onPress={onToggleShotMode}
  >
    <Icon 
      name="add-location" 
      size={20} 
      color={isPlacingShotMode ? "#fff" : "#4a7c59"} 
    />
  </TouchableOpacity>
  
  {/* Clear All Targets */}
  {(targetDistance || (shotMarkers && shotMarkers.length > 0)) && (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={() => {
        onClearTarget();
        shotMarkers?.forEach(marker => 
          onRemoveShotMarker?.(marker.id)
        );
      }}
    >
      <Icon name="clear-all" size={20} color="#dc3545" />
    </TouchableOpacity>
  )}
</View>
```

## Data Formatting and Utilities

### Distance Formatting

```typescript
const formatDistance = (distance: DistanceResult): string => {
  if (distance.yards < 1) {
    return `${Math.round(distance.feet)}'`;
  } else if (distance.yards < 100) {
    return `${Math.round(distance.yards)} yds`;
  } else {
    return `${Math.round(distance.yards)} yards`;
  }
};
```

### Bearing and Direction

```typescript
const formatBearing = (bearing: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return `${directions[index]} (${Math.round(bearing)}°)`;
};
```

### Club Recommendations

```typescript
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
  if (yards >= 105) return 'Pitching Wedge';
  if (yards >= 90) return 'Sand Wedge';
  if (yards >= 70) return 'Lob Wedge';
  return 'Short Iron';
};
```

### Time and Status Formatting

```typescript
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatRoundStatus = (status?: string): string => {
  switch (status) {
    case 'InProgress': return 'Playing';
    case 'Paused': return 'Paused';
    case 'Completed': return 'Finished';
    case 'Abandoned': return 'Abandoned';
    default: return 'Active';
  }
};

const getRoundStatusIcon = (status?: string): string => {
  switch (status) {
    case 'InProgress': return 'play-arrow';
    case 'Paused': return 'pause';
    case 'Completed': return 'check-circle';
    case 'Abandoned': return 'cancel';
    default: return 'golf-course';
  }
};

const formatPosition = (position: string): string => {
  switch (position.toLowerCase()) {
    case 'tee': return 'Tee Box';
    case 'fairway': return 'Fairway';
    case 'rough': return 'Rough';
    case 'green': return 'Green';
    case 'hazard': return 'Hazard';
    default: return 'Course';
  }
};
```

## Responsive Design and Animations

### Adaptive Layout

The overlay adapts to different screen sizes and orientations:

```typescript
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  
  topStatusBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  
  rightControlPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  
  bottomPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    maxHeight: height * 0.4,
  },
});
```

### Smooth Animations

```typescript
const fadeInAnimation = {
  opacity: 1,
  transform: [{ scale: 1 }],
};

// Animated components for smooth transitions
const AnimatedDistanceCard = Animated.createAnimatedComponent(View);
const AnimatedControlButton = Animated.createAnimatedComponent(TouchableOpacity);
```

## Performance Optimization

### Memoized Components

```typescript
const GPSStatusIndicator = React.memo(({ currentLocation, gpsAccuracy }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.currentLocation?.accuracy === nextProps.currentLocation?.accuracy &&
    prevProps.gpsAccuracy === nextProps.gpsAccuracy
  );
});
```

### Efficient State Updates

```typescript
// Use useMemo for expensive calculations
const gpsStatus = useMemo(() => {
  // GPS status calculation logic
}, [currentLocation, gpsAccuracy]);

// Use useCallback for event handlers
const handleQuickAction = useCallback((action: string) => {
  switch (action) {
    case 'center':
      onCenterOnUser?.();
      break;
    case 'shot':
      onToggleShotMode?.();
      break;
    case 'clear':
      onClearTarget();
      break;
  }
}, [onCenterOnUser, onToggleShotMode, onClearTarget]);
```

## Accessibility Features

### Screen Reader Support

```typescript
<TouchableOpacity
  style={styles.controlButton}
  onPress={onVoiceToggle}
  accessibilityLabel="Toggle voice assistant"
  accessibilityHint="Activates or deactivates the AI golf assistant"
  accessibilityRole="button"
>
  <Icon name="mic" size={24} color="#4a7c59" />
</TouchableOpacity>
```

### High Contrast Support

```typescript
const getContrastColor = (backgroundColor: string): string => {
  // Calculate appropriate text color based on background
  const luminance = calculateLuminance(backgroundColor);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
```

## Error Handling

### Graceful Degradation

```typescript
// Handle missing location data
if (!currentLocation) {
  return (
    <View style={styles.noLocationOverlay}>
      <Icon name="location-off" size={48} color="#ccc" />
      <Text style={styles.noLocationText}>
        Waiting for GPS signal...
      </Text>
    </View>
  );
}

// Handle missing distance data
const safeDistance = targetDistance || { yards: 0, meters: 0, feet: 0 };
```

### Error Boundaries

```typescript
// Wrap critical components in error boundaries
<ErrorBoundary fallback={<MinimalOverlay />}>
  <MapOverlay {...props} />
</ErrorBoundary>
```

## Integration with Parent Components

### ActiveRoundScreen Integration

```typescript
// In ActiveRoundScreen.tsx
<MapOverlay
  courseName={activeRound?.course?.name}
  currentHole={currentHole}
  currentLocation={currentLocation}
  targetDistance={targetDistance}
  targetPin={mapState.targetPin}
  shotMarkers={mapStateLocal.shotMarkers}
  isLocationTracking={isLocationTracking}
  isVoiceInterfaceVisible={isVoiceInterfaceVisible}
  isPlacingShotMode={mapStateLocal.isPlacingShotMode}
  onVoiceToggle={handleVoiceToggle}
  onSettingsPress={handleSettingsPress}
  onRoundControlsPress={() => setShowRoundControls(!showRoundControls)}
  onClearTarget={() => handleTargetSelected({ latitude: 0, longitude: 0 }, { yards: 0, meters: 0, feet: 0, kilometers: 0, miles: 0 })}
  onToggleShotMode={toggleShotPlacementMode}
  onCenterOnUser={centerOnUserLocation}
  onRemoveShotMarker={removeShotMarker}
  roundStatus={activeRound?.status}
  gpsAccuracy={currentLocation?.accuracy}
  mapType={mapState.mapType}
/>
```

## Testing Strategy

### Component Testing

- **Render Testing**: Verify correct rendering with various prop combinations
- **Interaction Testing**: Test button presses and gesture handling
- **State Updates**: Verify proper response to prop changes
- **Accessibility**: Test screen reader compatibility

### Integration Testing

- **GPS Status**: Test accuracy indicators with various GPS conditions
- **Distance Display**: Verify calculations and formatting
- **Shot Tracking**: Test shot marker creation and management
- **Voice Integration**: Test voice interface toggle functionality

### Visual Testing

- **Layout Testing**: Verify responsive behavior across screen sizes
- **Animation Testing**: Test smooth transitions and state changes
- **Theme Testing**: Verify appearance in different map modes
- **Platform Testing**: Test iOS and Android visual consistency

## Future Enhancements

### Planned Features

- **Weather Integration**: Display wind speed and direction
- **Course Hazards**: Show sand traps, water hazards, and obstacles
- **Green Slopes**: Visualize putting green contours
- **Statistics Dashboard**: Real-time round statistics

### Performance Improvements

- **Virtualization**: Efficient rendering of large shot marker lists
- **Gesture Optimization**: Improved touch response and gesture recognition
- **Memory Management**: Reduced memory footprint for extended rounds

## Related Documentation

- [Location and Mapping System Overview](./location-mapping-system.md)
- [GolfCourseMap Component](./golf-course-map.md)
- [LocationService Architecture](./location-service.md)
- [DistanceCalculator Utility](./distance-calculator.md)
- [State Management Integration](./state-management.md)

---

*This documentation reflects the MapOverlay implementation as of v1.5.0 (August 2025). Update when making changes to the component.*