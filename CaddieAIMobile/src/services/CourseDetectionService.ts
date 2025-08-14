import { CourseDetectionResult } from '../types/golf';

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  place_type: string[];
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    category?: string;
    maki?: string;
  };
  context?: Array<{
    id: string;
    text: string;
  }>;
}

interface MapboxResponse {
  features: MapboxFeature[];
}

export class CourseDetectionService {
  private mapboxToken: string;

  constructor() {
    // Get Mapbox token from config
    this.mapboxToken = require('../utils/mapboxConfig').MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Detect the single most likely golf course at the current location
   */
  async detectCurrentCourse(
    latitude: number,
    longitude: number,
    radius = 500 // smaller radius for current location detection
  ): Promise<CourseDetectionResult | null> {
    try {
      const nearbyGolfCourses = await this.detectNearbyGolfCourses(latitude, longitude, radius);
      
      if (nearbyGolfCourses.length === 0) {
        return null;
      }

      // Return the closest, highest confidence course
      const bestCourse = nearbyGolfCourses
        .filter(course => course.confidence >= 0.7) // High confidence threshold
        .sort((a, b) => {
          // Sort by confidence first, then by distance
          if (Math.abs(a.confidence - b.confidence) < 0.1) {
            return a.distance - b.distance;
          }
          return b.confidence - a.confidence;
        })[0];

      return bestCourse || nearbyGolfCourses[0]; // Fallback to closest if no high-confidence match
    } catch (error) {
      console.error('Error detecting current course:', error);
      
      // Fallback to mock detection for development
      if (__DEV__) {
        console.warn('Using mock current course detection');
        const mockResults = this.getMockDetectionResults(latitude, longitude);
        return mockResults[0] || null;
      }
      
      throw error;
    }
  }

  /**
   * Detect nearby golf courses using Mapbox Places API
   */
  async detectNearbyGolfCourses(
    latitude: number,
    longitude: number,
    radius = 1000 // meters
  ): Promise<CourseDetectionResult[]> {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/golf.json?` +
        `proximity=${longitude},${latitude}&` +
        `types=poi&` +
        `category=golf&` +
        `limit=5&` +
        `access_token=${this.mapboxToken}`;

      console.log('Detecting golf courses near:', { latitude, longitude });

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
      }

      const data: MapboxResponse = await response.json();
      
      const golfCourses = data.features
        .filter(feature => this.isGolfCourse(feature))
        .map(feature => this.mapFeatureToResult(feature, latitude, longitude))
        .filter(result => result.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      console.log(`Found ${golfCourses.length} golf courses nearby`);
      return golfCourses;

    } catch (error) {
      console.error('Error detecting golf courses:', error);
      
      // Fallback to mock detection for development
      if (__DEV__) {
        console.warn('Using mock golf course detection');
        return this.getMockDetectionResults(latitude, longitude);
      }
      
      throw error;
    }
  }

  /**
   * Check if a Mapbox feature represents a golf course
   */
  private isGolfCourse(feature: MapboxFeature): boolean {
    const golfKeywords = [
      'golf',
      'course',
      'club',
      'country club',
      'links',
      'resort'
    ];

    const placeName = feature.place_name?.toLowerCase() || '';
    const text = feature.text?.toLowerCase() || '';
    const category = feature.properties?.category?.toLowerCase() || '';
    const maki = feature.properties?.maki?.toLowerCase() || '';

    // Check if it's categorized as golf-related
    if (category.includes('golf') || maki === 'golf') {
      return true;
    }

    // Check place name and text for golf-related keywords
    return golfKeywords.some(keyword => 
      placeName.includes(keyword) || text.includes(keyword)
    );
  }

  /**
   * Map Mapbox feature to CourseDetectionResult
   */
  private mapFeatureToResult(
    feature: MapboxFeature,
    userLat: number,
    userLon: number
  ): CourseDetectionResult {
    const [longitude, latitude] = feature.geometry.coordinates;
    const distance = this.calculateDistance(userLat, userLon, latitude, longitude);
    
    // Calculate confidence based on various factors
    let confidence = 0.5; // Base confidence
    
    const placeName = feature.place_name?.toLowerCase() || '';
    const text = feature.text?.toLowerCase() || '';
    
    // Higher confidence for explicit golf keywords
    if (text.includes('golf') || placeName.includes('golf')) confidence += 0.3;
    if (text.includes('country club') || placeName.includes('country club')) confidence += 0.2;
    if (feature.properties?.maki === 'golf') confidence += 0.2;
    
    // Lower confidence for very distant results
    if (distance > 500) confidence -= 0.2;
    if (distance > 1000) confidence -= 0.3;
    
    // Determine place type
    let placeType: 'golf_course' | 'country_club' | 'resort' = 'golf_course';
    if (placeName.includes('country club') || text.includes('country club')) {
      placeType = 'country_club';
    } else if (placeName.includes('resort') || text.includes('resort')) {
      placeType = 'resort';
    }

    // Extract address from context
    const address = this.extractAddress(feature);

    return {
      id: feature.id,
      name: feature.text,
      address,
      latitude,
      longitude,
      confidence: Math.max(0, Math.min(1, confidence)),
      distance,
      placeType,
    };
  }

  /**
   * Extract address from Mapbox feature context
   */
  private extractAddress(feature: MapboxFeature): string {
    if (!feature.context) {
      return feature.place_name || '';
    }

    const addressParts = feature.context
      .filter(ctx => ctx.id.startsWith('address') || ctx.id.startsWith('place'))
      .map(ctx => ctx.text);

    return addressParts.join(', ') || feature.place_name || '';
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Mock detection results for development/testing
   */
  private getMockDetectionResults(latitude: number, longitude: number): CourseDetectionResult[] {
    return [
      {
        id: 'mock-1',
        name: 'Nearby Golf Club',
        address: '123 Golf Course Rd',
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        confidence: 0.9,
        distance: 150,
        placeType: 'golf_course',
      },
      {
        id: 'mock-2',
        name: 'Country Club Resort',
        address: '456 Country Club Dr',
        latitude: latitude + 0.002,
        longitude: longitude - 0.001,
        confidence: 0.8,
        distance: 300,
        placeType: 'country_club',
      },
    ];
  }
}