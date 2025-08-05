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
  elevation?: number;
  accuracyQuality?: string;
  shotDifficulty?: 'Easy' | 'Moderate' | 'Difficult' | 'Expert';
}

export interface PinLocationData {
  front: number;
  center: number;
  back: number;
  pinPosition?: 'front' | 'middle' | 'back';
}

export interface ShotAnalysis {
  carry: number;
  total: number;
  trajectory: 'low' | 'mid' | 'high';
  spin: 'low' | 'medium' | 'high';
  confidence: number;
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

  // Enhanced golf club distance ranges with additional data
  private static readonly CLUB_DISTANCES = {
    'Driver': { min: 200, max: 300, avg: 250, trajectory: 'low', spin: 'low' },
    '3-Wood': { min: 180, max: 250, avg: 215, trajectory: 'mid', spin: 'low' },
    '5-Wood': { min: 160, max: 220, avg: 190, trajectory: 'mid', spin: 'medium' },
    '3-Iron': { min: 150, max: 200, avg: 175, trajectory: 'low', spin: 'low' },
    '4-Iron': { min: 140, max: 185, avg: 162, trajectory: 'low', spin: 'medium' },
    '5-Iron': { min: 130, max: 170, avg: 150, trajectory: 'mid', spin: 'medium' },
    '6-Iron': { min: 120, max: 160, avg: 140, trajectory: 'mid', spin: 'medium' },
    '7-Iron': { min: 110, max: 150, avg: 130, trajectory: 'mid', spin: 'medium' },
    '8-Iron': { min: 100, max: 140, avg: 120, trajectory: 'mid', spin: 'high' },
    '9-Iron': { min: 90, max: 130, avg: 110, trajectory: 'high', spin: 'high' },
    'PW': { min: 80, max: 120, avg: 100, trajectory: 'high', spin: 'high' },
    'SW': { min: 60, max: 100, avg: 80, trajectory: 'high', spin: 'high' },
    'LW': { min: 40, max: 80, avg: 60, trajectory: 'high', spin: 'high' },
    'Putter': { min: 0, max: 30, avg: 15, trajectory: 'low', spin: 'low' }
  } as const;

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
   * Enhanced club recommendation with conditions
   */
  static recommendClub(distanceYards: number, conditions?: {
    wind?: 'headwind' | 'tailwind' | 'crosswind' | 'calm';
    elevation?: 'uphill' | 'downhill' | 'level';
    pin?: 'front' | 'middle' | 'back';
    confidence?: 'conservative' | 'aggressive';
  }): string {
    let adjustedDistance = distanceYards;

    // Apply condition adjustments
    if (conditions) {
      if (conditions.wind === 'headwind') adjustedDistance *= 1.1;
      else if (conditions.wind === 'tailwind') adjustedDistance *= 0.9;
      
      if (conditions.elevation === 'uphill') adjustedDistance *= 1.1;
      else if (conditions.elevation === 'downhill') adjustedDistance *= 0.9;
      
      if (conditions.pin === 'back') adjustedDistance *= 1.05;
      else if (conditions.pin === 'front') adjustedDistance *= 0.95;
      
      if (conditions.confidence === 'conservative') adjustedDistance *= 1.05;
      else if (conditions.confidence === 'aggressive') adjustedDistance *= 0.95;
    }

    // Find best club match
    let bestClub = 'PW';
    let bestScore = Infinity;

    for (const [club, range] of Object.entries(this.CLUB_DISTANCES)) {
      const score = Math.abs(adjustedDistance - range.avg);
      if (score < bestScore && adjustedDistance >= range.min - 10 && adjustedDistance <= range.max + 10) {
        bestScore = score;
        bestClub = club;
      }
    }

    return bestClub;
  }

  /**
   * Get multiple club options for a distance
   */
  static getClubOptions(distanceYards: number): Array<{
    club: string;
    confidence: number;
    shot: 'full' | 'easy' | 'hard';
  }> {
    const options: Array<{ club: string; confidence: number; shot: 'full' | 'easy' | 'hard' }> = [];

    for (const [club, range] of Object.entries(this.CLUB_DISTANCES)) {
      if (distanceYards >= range.min - 15 && distanceYards <= range.max + 15) {
        let confidence = 100;
        let shot: 'full' | 'easy' | 'hard' = 'full';

        const distanceFromAvg = Math.abs(distanceYards - range.avg);
        const rangeSize = range.max - range.min;
        confidence = Math.max(50, 100 - (distanceFromAvg / rangeSize) * 100);

        if (distanceYards < range.avg - rangeSize * 0.2) shot = 'easy';
        else if (distanceYards > range.avg + rangeSize * 0.2) shot = 'hard';

        options.push({ club, confidence: Math.round(confidence), shot });
      }
    }

    return options.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
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
    _coordinate: Coordinate
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
   * Enhanced distance formatting with context
   */
  static formatGolfDistance(distance: DistanceResult, format: 'compact' | 'detailed' | 'precise' = 'compact'): string {
    const yards = Math.round(distance.yards);
    const meters = Math.round(distance.meters);
    const feet = Math.round(distance.feet);

    switch (format) {
      case 'detailed':
        if (yards < 1) return `${feet}ft`;
        return `${yards} yds (${meters}m)`;
      
      case 'precise':
        if (yards < 1) return `${feet}ft`;
        if (yards < 10) return `${distance.yards.toFixed(1)} yds`;
        return `${yards} yds`;
      
      case 'compact':
      default:
        if (yards < 1) return `${feet}ft`;
        return `${yards} yds`;
    }
  }

  /**
   * Get compass direction text from bearing
   */
  static getBearingDirection(bearing: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  /**
   * Calculate shot detection threshold based on movement pattern
   */
  static calculateShotDetectionThreshold(
    _previousLocations: Coordinate[],
    _timeWindow: number = 10000 // 10 seconds in milliseconds
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