/**
 * Mapbox Service for CaddieAI Golf Application
 * 
 * Provides real Mapbox SDK integration for golf course mapping,
 * distance calculations, and location services.
 */

import Mapbox from '@rnmapbox/maps';

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

export interface GolfMapStyle {
  satellite: string;
  outdoors: string;
  streets: string;
}

class MapboxService {
  private static instance: MapboxService;
  private config: MapboxConfig | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  /**
   * Initialize Mapbox service with real SDK integration
   */
  public initialize(accessToken: string): void {
    console.log('🗺️ MapboxService: Initializing with real Mapbox SDK');
    
    if (!accessToken || accessToken === 'pk.your_mapbox_access_token_here') {
      console.warn('⚠️ MapboxService: Invalid or placeholder token provided');
      return;
    }

    try {
      // Initialize Mapbox with the access token
      // Note: setWellKnownTileServer is deprecated in newer Mapbox SDK versions
      Mapbox.setAccessToken(accessToken);
      
      this.config = {
        accessToken,
        styleURL: 'mapbox://styles/mapbox/satellite-v9', // Golf-optimized satellite view
        defaultZoom: 15,
        maxZoom: 20,
        minZoom: 8,
      };
      
      this.isInitialized = true;
      console.log('✅ MapboxService: Successfully initialized with Mapbox SDK');
    } catch (error) {
      console.error('❌ MapboxService: Failed to initialize Mapbox SDK:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get available golf-optimized map styles
   */
  public getGolfMapStyles(): GolfMapStyle {
    return {
      satellite: 'mapbox://styles/mapbox/satellite-v9',
      outdoors: 'mapbox://styles/mapbox/outdoors-v11', 
      streets: 'mapbox://styles/mapbox/streets-v11',
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): MapboxConfig | null {
    return this.config;
  }

  /**
   * Calculate distances for golf features using precise Haversine formula
   */
  public calculateGolfDistances(
    userLat: number,
    userLng: number,
    pinLat: number,
    pinLng: number,
    teeLat?: number,
    teeLng?: number,
  ): GolfDistanceCalculation {
    const distanceToPin = this.calculateDistance(userLat, userLng, pinLat, pinLng, 'yards');
    const distanceToTee = (teeLat && teeLng) 
      ? this.calculateDistance(userLat, userLng, teeLat, teeLng, 'yards')
      : 0;

    return {
      distanceToPin: Math.round(distanceToPin),
      distanceToTee: Math.round(distanceToTee),
      unit: 'yards',
    };
  }

  /**
   * Check if service is properly initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized && this.config !== null;
  }

  /**
   * Get default map center (Faughan Valley Golf Centre)
   */
  public getDefaultCenter(): { latitude: number; longitude: number } {
    return {
      latitude: 55.020906,
      longitude: -7.247879,
    };
  }

  /**
   * Check if Mapbox is configured
   */
  public isConfigured(): boolean {
    return this.isInitialized && 
           this.config !== null && 
           this.config.accessToken !== '' &&
           this.config.accessToken !== 'pk.your_mapbox_access_token_here';
  }

  /**
   * Get access token
   */
  public getAccessToken(): string {
    return this.config?.accessToken || 'pk.your_mapbox_access_token_here';
  }

  /**
   * Get default style URL for golf courses (satellite view)
   */
  public getDefaultStyleUrl(): string {
    return this.getGolfMapStyles().satellite;
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