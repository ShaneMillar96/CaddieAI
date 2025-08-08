/**
 * Mapbox Service - Placeholder
 * 
 * This is a temporary placeholder for the Mapbox service.
 * The original Mapbox functionality has been temporarily disabled
 * while we resolve compatibility issues with React Native 0.80.2.
 * 
 * TODO: Re-implement with compatible Mapbox version or alternative
 */

export interface MapboxConfig {
  accessToken: string;
  styleURL: string;
  defaultZoom: number;
  maxZoom: number;
  minZoom: number;
}

export interface GolfDistanceCalculation {
  distanceToPin: number;
  distanceToTee: number;
  distanceToHazard?: number;
  unit: 'yards' | 'meters';
}

class MapboxService {
  private static instance: MapboxService;
  private config: MapboxConfig | null = null;

  private constructor() {}

  public static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  /**
   * Initialize Mapbox service with configuration - PLACEHOLDER
   */
  public initialize(accessToken: string): void {
    console.log('🗺️ MapboxService: Initialize called (placeholder mode)');
    this.config = {
      accessToken,
      styleURL: 'placeholder://satellite-streets-v12',
      defaultZoom: 15,
      maxZoom: 20,
      minZoom: 8,
    };
  }

  /**
   * Get current configuration - PLACEHOLDER
   */
  public getConfig(): MapboxConfig | null {
    return this.config;
  }

  /**
   * Calculate distances for golf features - PLACEHOLDER
   */
  public calculateGolfDistances(
    userLat: number,
    userLng: number,
    pinLat: number,
    pinLng: number,
    teeLat?: number,
    teeLng?: number,
  ): GolfDistanceCalculation {
    // Basic distance calculation using Haversine formula
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = toRadians(lat1);
      const φ2 = toRadians(lat2);
      const Δφ = toRadians(lat2 - lat1);
      const Δλ = toRadians(lng2 - lng1);

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c; // Distance in meters
    };

    const distanceToPin = calculateDistance(userLat, userLng, pinLat, pinLng);
    const distanceToTee = teeLat && teeLng 
      ? calculateDistance(userLat, userLng, teeLat, teeLng)
      : 0;

    // Convert meters to yards
    const metersToYards = (meters: number) => meters * 1.09361;

    return {
      distanceToPin: Math.round(metersToYards(distanceToPin)),
      distanceToTee: Math.round(metersToYards(distanceToTee)),
      unit: 'yards',
    };
  }

  /**
   * Check if service is properly initialized - PLACEHOLDER
   */
  public isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Get default map center (Faughan Valley Golf Centre) - PLACEHOLDER
   */
  public getDefaultCenter(): { latitude: number; longitude: number } {
    return {
      latitude: 54.9783,
      longitude: -7.2054,
    };
  }

  /**
   * Check if Mapbox is configured - PLACEHOLDER
   */
  public isConfigured(): boolean {
    return this.config !== null && this.config.accessToken !== '';
  }

  /**
   * Get access token - PLACEHOLDER
   */
  public getAccessToken(): string {
    return this.config?.accessToken || 'placeholder_token';
  }

  /**
   * Calculate distance between two points - PLACEHOLDER
   */
  public calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    unit: 'yards' | 'meters' = 'meters',
  ): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lng2 - lng1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distanceInMeters = R * c; // Distance in meters
    
    if (unit === 'yards') {
      return distanceInMeters * 1.09361;
    }
    
    return distanceInMeters;
  }

  /**
   * Format distance for display - PLACEHOLDER
   */
  public formatDistance(distance: number, unit: 'yards' | 'meters' = 'yards'): string {
    if (unit === 'yards') {
      return `${Math.round(distance)} yds`;
    } else {
      return `${Math.round(distance)} m`;
    }
  }
}

export const mapboxService = MapboxService.getInstance();
export default mapboxService;