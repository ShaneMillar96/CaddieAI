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

/**
 * Comprehensive distance calculation utility for golf applications
 * Provides accurate GPS-based distance measurements with golf-specific features
 */
export class DistanceCalculator {
  // Earth's radius in different units
  private static readonly EARTH_RADIUS_METERS = 6371000;
  private static readonly EARTH_RADIUS_YARDS = 6967420;
  private static readonly EARTH_RADIUS_MILES = 3959;

  // Golf-specific conversion constants
  private static readonly METERS_TO_YARDS = 1.09361;
  private static readonly METERS_TO_FEET = 3.28084;
  private static readonly METERS_TO_KILOMETERS = 0.001;
  private static readonly METERS_TO_MILES = 0.000621371;

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

  // Private utility methods
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Export utility functions for backward compatibility
export const calculateDistance = DistanceCalculator.calculateDistance;
export const calculateBearing = DistanceCalculator.calculateBearing;
export const getGolfDistanceContext = DistanceCalculator.getGolfDistanceContext;
export const recommendClub = DistanceCalculator.recommendClub;
export const formatGolfDistance = DistanceCalculator.formatGolfDistance;