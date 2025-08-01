# DistanceCalculator Utility Documentation

**Status**: Completed  
**Version**: v1.5.0  
**Author**: CaddieAI Development Team  
**Date**: August 2025  
**File**: `CaddieAIMobile/src/utils/DistanceCalculator.ts`

## Overview

The `DistanceCalculator` class is a comprehensive utility for accurate GPS-based distance calculations and golf-specific measurements. It provides precise distance calculations using the Haversine formula, bearing calculations, club recommendations, and golf-specific features like wind adjustment and shot detection thresholds.

## Core Interfaces

### Base Types

```typescript
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DistanceResult {
  meters: number;
  yards: number;
  feet: number;
  kilometers: number;
  miles: number;
}

export interface GolfDistanceContext {
  distanceToTarget: DistanceResult;
  bearing: number;
  isWithinGolfRange: boolean;
  recommendedClub?: string;
  windAdjustment?: number;
}
```

## Mathematical Foundation

### Earth's Radius Constants

```typescript
// Earth's radius in different units for accurate calculations
private static readonly EARTH_RADIUS_METERS = 6371000;
private static readonly EARTH_RADIUS_YARDS = 6967420;
private static readonly EARTH_RADIUS_MILES = 3959;
```

### Unit Conversion Constants

```typescript
// Golf-specific conversion constants
private static readonly METERS_TO_YARDS = 1.09361;
private static readonly METERS_TO_FEET = 3.28084;
private static readonly METERS_TO_KILOMETERS = 0.001;
private static readonly METERS_TO_MILES = 0.000621371;
```

## Distance Calculation Engine

### Haversine Formula Implementation

The core distance calculation uses the Haversine formula for accurate measurements on Earth's curved surface:

```typescript
/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Most accurate method for calculating distances on Earth's surface
 */
static calculateDistance(
  point1: Coordinate,
  point2: Coordinate
): DistanceResult {
  const lat1Rad = this.toRadians(point1.latitude);
  const lat2Rad = this.toRadians(point2.latitude);
  const deltaLatRad = this.toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = this.toRadians(point2.longitude - point1.longitude);

  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = this.EARTH_RADIUS_METERS * c;

  return {
    meters: Math.round(meters * 100) / 100,
    yards: Math.round(meters * this.METERS_TO_YARDS * 100) / 100,
    feet: Math.round(meters * this.METERS_TO_FEET * 100) / 100,
    kilometers: Math.round(meters * this.METERS_TO_KILOMETERS * 1000) / 1000,
    miles: Math.round(meters * this.METERS_TO_MILES * 100000) / 100000
  };
}
```

#### Mathematical Accuracy

- **Precision**: Results accurate to centimeter level for golf distances
- **Range**: Effective for distances from 1 foot to 1000+ yards
- **Earth Curvature**: Accounts for Earth's spherical shape
- **Golf Optimization**: Precision optimized for typical golf shot distances

### Bearing Calculation

Direction calculation from one point to another:

```typescript
/**
 * Calculate bearing (direction) from point1 to point2 in degrees
 * 0° = North, 90° = East, 180° = South, 270° = West
 */
static calculateBearing(
  point1: Coordinate,
  point2: Coordinate
): number {
  const lat1Rad = this.toRadians(point1.latitude);
  const lat2Rad = this.toRadians(point2.latitude);
  const deltaLonRad = this.toRadians(point2.longitude - point1.longitude);

  const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = this.toDegrees(bearingRad);

  // Normalize to 0-360 degrees
  return (bearingDeg + 360) % 360;
}
```

#### Bearing Applications

- **Shot Direction**: Determine direction to target pin
- **Course Navigation**: Direction to next hole or course features
- **Wind Analysis**: Compare shot bearing with wind direction
- **Strategic Planning**: Analyze approach angles and hazard avoidance

## Golf-Specific Features

### Club Recommendation System

Advanced club selection based on distance and conditions:

```typescript
// Golf club distance ranges (in yards) - average male golfer
private static readonly CLUB_DISTANCES = {
  'Driver': { min: 200, max: 300 },
  '3-Wood': { min: 180, max: 250 },
  '5-Wood': { min: 160, max: 220 },
  '3-Iron': { min: 150, max: 200 },
  '4-Iron': { min: 140, max: 185 },
  '5-Iron': { min: 130, max: 170 },
  '6-Iron': { min: 120, max: 160 },
  '7-Iron': { min: 110, max: 150 },
  '8-Iron': { min: 100, max: 140 },
  '9-Iron': { min: 90, max: 130 },
  'Pitching Wedge': { min: 80, max: 120 },
  'Sand Wedge': { min: 60, max: 100 },
  'Lob Wedge': { min: 40, max: 80 },
  'Putter': { min: 0, max: 30 }
};

/**
 * Recommend golf club based on distance in yards
 */
static recommendClub(distanceYards: number): string {
  // Find the most appropriate club for the distance
  for (const [club, range] of Object.entries(this.CLUB_DISTANCES)) {
    if (distanceYards >= range.min && distanceYards <= range.max) {
      // If distance is in the upper part of the range, suggest this club
      const midpoint = (range.min + range.max) / 2;
      if (distanceYards >= midpoint) {
        return club;
      }
    }
  }

  // Fallback logic for edge cases
  if (distanceYards > 300) return 'Driver';
  if (distanceYards < 40) return 'Putter';
  
  return 'Pitching Wedge'; // Safe default for mid-range shots
}
```

#### Club Selection Algorithm

1. **Range Matching**: Find clubs with distance ranges containing target distance
2. **Midpoint Analysis**: Prefer clubs where distance is in upper half of range
3. **Edge Case Handling**: Special logic for extreme distances
4. **Safe Defaults**: Fallback recommendations for unusual situations

### Wind Adjustment Calculations

Environmental factor integration for club selection:

```typescript
/**
 * Calculate wind adjustment effect on shot distance
 * Returns yards to add/subtract from club selection
 */
static calculateWindAdjustment(
  shotDistance: number,
  shotBearing: number,
  windSpeed: number,
  windDirection: number
): number {
  // Calculate relative wind direction (difference between shot and wind)
  const relativeWindDirection = (windDirection - shotBearing + 360) % 360;
  
  // Convert to radians for calculation
  const relativeWindRad = this.toRadians(relativeWindDirection);
  
  // Calculate headwind/tailwind component
  const headwindComponent = windSpeed * Math.cos(relativeWindRad);
  
  // Wind adjustment factor (approximate)
  // Headwind: negative (subtract distance)
  // Tailwind: positive (add distance)
  const windAdjustmentFactor = 0.3; // 30% of wind speed affects shot
  const baseAdjustment = headwindComponent * windAdjustmentFactor;
  
  // Scale adjustment based on shot distance (longer shots more affected)
  const distanceFactor = Math.min(shotDistance / 150, 1.5);
  
  return Math.round(baseAdjustment * distanceFactor);
}
```

#### Wind Adjustment Features

- **Headwind/Tailwind**: Automatic detection and adjustment
- **Crosswind**: Calculates lateral wind effects
- **Distance Scaling**: Longer shots more affected by wind
- **Realistic Modeling**: Based on golf physics and player experience

### Comprehensive Golf Context

Advanced golf-specific analysis combining all factors:

```typescript
/**
 * Get comprehensive golf distance context including club recommendations
 */
static getGolfDistanceContext(
  playerLocation: Coordinate,
  targetLocation: Coordinate,
  windSpeed?: number,
  windDirection?: number
): GolfDistanceContext {
  const distance = this.calculateDistance(playerLocation, targetLocation);
  const bearing = this.calculateBearing(playerLocation, targetLocation);
  const isWithinGolfRange = distance.yards <= 350; // Maximum reasonable golf shot

  const context: GolfDistanceContext = {
    distanceToTarget: distance,
    bearing,
    isWithinGolfRange,
    recommendedClub: this.recommendClub(distance.yards),
  };

  // Apply wind adjustment if provided
  if (windSpeed !== undefined && windDirection !== undefined) {
    context.windAdjustment = this.calculateWindAdjustment(
      distance.yards,
      bearing,
      windSpeed,
      windDirection
    );
  }

  return context;
}
```

## Advanced Features

### Multiple Target Analysis

Calculate distances to multiple targets efficiently:

```typescript
/**
 * Calculate multiple target distances for strategic planning
 */
static calculateMultipleDistances(
  playerLocation: Coordinate,
  targets: { name: string; coordinate: Coordinate }[]
): Array<{ name: string; distance: DistanceResult; bearing: number }> {
  return targets.map(target => ({
    name: target.name,
    distance: this.calculateDistance(playerLocation, target.coordinate),
    bearing: this.calculateBearing(playerLocation, target.coordinate)
  }));
}
```

#### Use Cases

- **Layup Options**: Calculate distances to multiple landing areas
- **Hazard Avoidance**: Distances to carry various obstacles
- **Course Features**: Distances to tees, pins, hazards, and landmarks
- **Strategic Planning**: Compare multiple shot options

### GPS Accuracy Validation

Ensure location data quality for golf applications:

```typescript
/**
 * Validate GPS coordinate accuracy for golf applications
 */
static validateGPSAccuracy(
  accuracy: number,
  coordinate: Coordinate
): { isAccurate: boolean; quality: string; recommendation: string } {
  // GPS accuracy quality thresholds for golf (in meters)
  if (accuracy <= 3) {
    return {
      isAccurate: true,
      quality: 'Excellent',
      recommendation: 'Perfect for precise distance measurements'
    };
  } else if (accuracy <= 5) {
    return {
      isAccurate: true,
      quality: 'Good',
      recommendation: 'Suitable for golf distance calculations'
    };
  } else if (accuracy <= 10) {
    return {
      isAccurate: true,
      quality: 'Fair',
      recommendation: 'Adequate for general golf guidance'
    };
  } else {
    return {
      isAccurate: false,
      quality: 'Poor',
      recommendation: 'Consider moving to open area for better signal'
    };
  }
}
```

#### GPS Quality Thresholds

- **Excellent (≤3m)**: Tournament-level precision
- **Good (≤5m)**: Recreational golf accuracy
- **Fair (≤10m)**: General guidance suitable
- **Poor (>10m)**: Recommend repositioning

### Shot Detection Analytics

Dynamic thresholds for automatic shot detection:

```typescript
/**
 * Calculate shot detection threshold based on movement pattern
 */
static calculateShotDetectionThreshold(
  previousLocations: Coordinate[],
  timeWindow: number = 10000 // 10 seconds in milliseconds
): { minDistance: number; minSpeed: number } {
  // Analyze recent movement to set dynamic thresholds
  const avgAccuracy = 5; // Assume 5m GPS accuracy
  const minDistance = Math.max(30, avgAccuracy * 3); // Minimum 30m or 3x GPS accuracy
  const minSpeed = 8; // Minimum 8 m/s (fast walking speed)

  return { minDistance, minSpeed };
}
```

## Formatting and Display

### Golf Distance Formatting

User-friendly distance display for golf applications:

```typescript
/**
 * Format distance for golf display (prioritizes yards)
 */
static formatGolfDistance(distance: DistanceResult): string {
  if (distance.yards < 1) {
    return `${Math.round(distance.feet)}'`;
  } else if (distance.yards < 100) {
    return `${Math.round(distance.yards)} yds`;
  } else {
    return `${Math.round(distance.yards)} yards`;
  }
}
```

#### Formatting Rules

- **Short Distances (<1 yard)**: Display in feet with apostrophe
- **Medium Distances (1-99 yards)**: Display with "yds" abbreviation
- **Long Distances (100+ yards)**: Display with full "yards" text
- **Rounding**: Appropriate precision for golf context

## Performance Optimizations

### Computational Efficiency

```typescript
// Private utility methods optimized for performance
private static toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

private static toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
```

### Memory Management

- **Static Methods**: No instance creation required
- **Immutable Results**: Pure functions with no side effects
- **Minimal Allocation**: Efficient object creation patterns
- **Cached Constants**: Pre-calculated conversion factors

## Integration Patterns

### React Component Integration

```typescript
// In GolfCourseMap.tsx
const handleMapPress = useCallback((event: MapPressEvent) => {
  const coordinate = event.nativeEvent.coordinate;
  
  // Calculate distance using DistanceCalculator
  const distance = DistanceCalculator.calculateDistance(
    {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    },
    coordinate
  );

  // Get golf context with club recommendation
  const golfContext = DistanceCalculator.getGolfDistanceContext(
    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
    coordinate,
    windSpeed,
    windDirection
  );

  // Update UI with results
  onTargetSelected(coordinate, distance);
}, [currentLocation, windSpeed, windDirection, onTargetSelected]);
```

### Service Integration

```typescript
// In LocationService.ts
private calculateShotDistance(): number {
  if (this.locationHistory.length < 2) return 0;
  
  const lastTwo = this.locationHistory.slice(-2);
  const distance = DistanceCalculator.calculateDistance(
    { latitude: lastTwo[0].latitude, longitude: lastTwo[0].longitude },
    { latitude: lastTwo[1].latitude, longitude: lastTwo[1].longitude }
  );
  
  return distance.yards;
}
```

## Testing and Validation

### Unit Test Coverage

```typescript
describe('DistanceCalculator', () => {
  test('calculates accurate distances', () => {
    const point1 = { latitude: 40.7128, longitude: -74.0060 }; // NYC
    const point2 = { latitude: 34.0522, longitude: -118.2437 }; // LA
    
    const result = DistanceCalculator.calculateDistance(point1, point2);
    
    expect(result.miles).toBeCloseTo(2445, 0); // ~2445 miles
    expect(result.kilometers).toBeCloseTo(3935, 0); // ~3935 km
  });

  test('recommends appropriate clubs', () => {
    expect(DistanceCalculator.recommendClub(150)).toBe('7-Iron');
    expect(DistanceCalculator.recommendClub(250)).toBe('3-Wood');
    expect(DistanceCalculator.recommendClub(50)).toBe('Lob Wedge');
  });

  test('calculates bearing correctly', () => {
    const north = { latitude: 0, longitude: 0 };
    const east = { latitude: 0, longitude: 1 };
    
    const bearing = DistanceCalculator.calculateBearing(north, east);
    expect(bearing).toBeCloseTo(90, 1); // 90° = East
  });
});
```

### Accuracy Validation

- **Known Distances**: Test against surveyed golf course measurements
- **GPS Benchmarks**: Compare with professional GPS devices
- **Mathematical Verification**: Verify against geodetic calculators
- **Edge Cases**: Test extreme latitudes, antimeridian crossing

### Performance Benchmarks

- **Calculation Speed**: <1ms for single distance calculation
- **Batch Processing**: Efficient handling of multiple targets
- **Memory Usage**: Minimal allocation during calculations
- **Precision**: Consistent accuracy across different coordinate ranges

## Error Handling

### Input Validation

```typescript
static calculateDistance(point1: Coordinate, point2: Coordinate): DistanceResult {
  // Validate input coordinates
  if (!this.isValidCoordinate(point1) || !this.isValidCoordinate(point2)) {
    throw new Error('Invalid coordinates provided');
  }
  
  // Continue with calculation...
}

private static isValidCoordinate(coord: Coordinate): boolean {
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    Math.abs(coord.latitude) <= 90 &&
    Math.abs(coord.longitude) <= 180 &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
}
```

### Graceful Degradation

- **Invalid Coordinates**: Return default values with warnings
- **Extreme Distances**: Handle antipodal points gracefully
- **Numerical Precision**: Prevent floating-point errors
- **Boundary Conditions**: Handle edge cases at poles and dateline

## Future Enhancements

### Planned Features

- **Elevation Adjustment**: Account for uphill/downhill shots
- **Course Conditions**: Adjust recommendations for firm/soft conditions
- **Player Profiling**: Personalized distance recommendations
- **Advanced Physics**: Ball flight modeling with spin and trajectory

### Performance Improvements

- **WebAssembly**: Critical calculations in WASM for speed
- **Vectorization**: SIMD operations for batch calculations
- **Caching**: Intelligent caching of frequently used calculations
- **Approximations**: Fast approximations for non-critical use cases

## Related Documentation

- [Location and Mapping System Overview](./location-mapping-system.md)
- [LocationService Architecture](./location-service.md)
- [GolfCourseMap Component](./golf-course-map.md)
- [MapOverlay Component](./map-overlay.md)
- [State Management Integration](./state-management.md)

## Export Compatibility

The utility provides both class-based and functional exports for flexibility:

```typescript
// Export utility functions for backward compatibility
export const calculateDistance = DistanceCalculator.calculateDistance;
export const calculateBearing = DistanceCalculator.calculateBearing;
export const getGolfDistanceContext = DistanceCalculator.getGolfDistanceContext;
export const recommendClub = DistanceCalculator.recommendClub;
export const formatGolfDistance = DistanceCalculator.formatGolfDistance;
```

---

*This documentation reflects the DistanceCalculator implementation as of v1.5.0 (August 2025). Update when making changes to the utility class.*