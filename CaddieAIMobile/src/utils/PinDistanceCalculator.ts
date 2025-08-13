/**
 * PinDistanceCalculator - Utility for calculating distances related to pin location
 * 
 * Provides accurate distance calculations for:
 * - User current location to pin
 * - Shot placement location to pin  
 * - Real-time distance updates as user moves
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface PinDistanceResult {
  distanceMeters: number;
  distanceYards: number;
  distanceFeet: number;
  bearing: number;
  bearingText: string;
}

export interface PinDistances {
  userToPin: PinDistanceResult | null;
  shotToPin: PinDistanceResult | null;
}

class PinDistanceCalculator {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * Most accurate for short distances typical in golf
   */
  private calculateHaversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = coord1.latitude * Math.PI / 180;
    const lat2Rad = coord2.latitude * Math.PI / 180;
    const deltaLatRad = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const deltaLngRad = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLatRad/2) * Math.sin(deltaLatRad/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad/2) * Math.sin(deltaLngRad/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate bearing between two coordinates
   */
  private calculateBearing(from: Coordinate, to: Coordinate): number {
    const lat1 = from.latitude * Math.PI / 180;
    const lat2 = to.latitude * Math.PI / 180;
    const deltaLng = (to.longitude - from.longitude) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
    
    return bearingDeg;
  }

  /**
   * Convert bearing degrees to compass direction text
   */
  private getBearingText(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * Convert meters to yards and feet
   */
  private convertUnits(meters: number): { yards: number; feet: number } {
    const yards = meters * 1.09361;
    const feet = meters * 3.28084;
    return { yards, feet };
  }

  /**
   * Calculate complete distance result between two coordinates
   */
  public calculateDistance(from: Coordinate, to: Coordinate): PinDistanceResult {
    const distanceMeters = this.calculateHaversineDistance(from, to);
    const { yards, feet } = this.convertUnits(distanceMeters);
    const bearing = this.calculateBearing(from, to);
    const bearingText = this.getBearingText(bearing);

    return {
      distanceMeters: Math.round(distanceMeters * 100) / 100, // Round to 2 decimal places
      distanceYards: Math.round(yards),
      distanceFeet: Math.round(feet),
      bearing: Math.round(bearing),
      bearingText
    };
  }

  /**
   * Calculate all pin-related distances
   */
  public calculatePinDistances(
    userLocation: Coordinate | null,
    shotLocation: Coordinate | null,
    pinLocation: Coordinate | null
  ): PinDistances {
    return {
      userToPin: userLocation && pinLocation 
        ? this.calculateDistance(userLocation, pinLocation) 
        : null,
      shotToPin: shotLocation && pinLocation 
        ? this.calculateDistance(shotLocation, pinLocation) 
        : null
    };
  }

  /**
   * Get recommended approach for distance to pin
   */
  public getPinApproach(distanceYards: number): string {
    if (distanceYards <= 5) return 'Tap-in';
    if (distanceYards <= 15) return 'Short putt';
    if (distanceYards <= 30) return 'Long putt';
    if (distanceYards <= 50) return 'Chip shot';
    if (distanceYards <= 80) return 'Pitch shot';
    if (distanceYards <= 100) return 'Wedge shot';
    if (distanceYards <= 150) return 'Short iron';
    if (distanceYards <= 180) return 'Mid iron';
    if (distanceYards <= 210) return 'Long iron';
    return 'Approach shot';
  }

  /**
   * Format distance for display
   */
  public formatDistance(distanceResult: PinDistanceResult): string {
    if (distanceResult.distanceYards < 1) {
      return `${distanceResult.distanceFeet}'`;
    } else if (distanceResult.distanceYards < 100) {
      return `${distanceResult.distanceYards}y`;
    } else {
      return `${distanceResult.distanceYards}y`;
    }
  }

  /**
   * Check if pin location is valid for golf hole
   */
  public isValidPinLocation(
    pinLocation: Coordinate,
    userLocation: Coordinate,
    maxDistanceYards: number = 600
  ): boolean {
    const distance = this.calculateDistance(userLocation, pinLocation);
    return distance.distanceYards <= maxDistanceYards && distance.distanceYards >= 10;
  }
}

// Export singleton instance
export const pinDistanceCalculator = new PinDistanceCalculator();
export default pinDistanceCalculator;