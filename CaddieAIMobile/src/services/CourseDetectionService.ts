import { CourseDetectionResult } from '../types/golf';
import { getMapboxConfig } from '../utils/mapboxConfig';
import { store } from '../store';
import { isTestModeEnabled } from '../utils/locationTesting';

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

// Search Box API v1 response interfaces
interface MapboxSearchBoxFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;
    place_formatted?: string; // This is the actual field name in API response
    full_address?: string;
    poi_category?: string[];
    poi_category_ids?: string[];
    brand?: string[];
    coordinates?: {
      longitude: number;
      latitude: number;
    };
    context?: {
      country?: {
        id: string;
        name: string;
        country_code: string;
        country_code_alpha_3: string;
      };
      region?: {
        id: string;
        name: string;
        region_code: string;
      };
      postcode?: {
        id: string;
        name: string;
      };
      place?: {
        id: string;
        name: string;
      };
      locality?: {
        id: string;
        name: string;
      };
      neighborhood?: {
        id: string;
        name: string;
      };
      address?: {
        id: string;
        name: string;
        address_number: string;
        street_name: string;
      };
    };
  };
}

interface MapboxSearchBoxResponse {
  type: 'FeatureCollection';
  features: MapboxSearchBoxFeature[];
  attribution: string;
}

export class CourseDetectionService {
  private getMapboxToken(): string {
    const config = getMapboxConfig();
    console.log('🗺️ CourseDetectionService: Getting Mapbox token...');
    if (!config.accessToken) {
      console.error('❌ CourseDetectionService: Mapbox access token not configured');
      throw new Error('Mapbox access token not configured');
    }
    console.log('✅ CourseDetectionService: Mapbox token retrieved successfully, length:', config.accessToken.length);
    return config.accessToken;
  }

  /**
   * Detect the single most likely golf course at the current location
   * Only returns courses within 1000m (on-course detection)
   */
  async detectCurrentCourse(
    latitude: number,
    longitude: number,
    radius = 1000 // increased radius for realistic golf course detection
  ): Promise<CourseDetectionResult | null> {
    try {
      const nearbyGolfCourses = await this.detectNearbyGolfCourses(latitude, longitude, radius);
      
      if (nearbyGolfCourses.length === 0) {
        return null;
      }

      // Return the closest, highest confidence course within detection radius
      const onCourseCandidates = nearbyGolfCourses
        .filter(course => course.distance <= 500) // Increased for large courses (within 500m)
        .filter(course => course.confidence >= 0.6) // Reasonable confidence threshold
        .sort((a, b) => {
          // Sort by confidence first, then by distance
          if (Math.abs(a.confidence - b.confidence) < 0.1) {
            return a.distance - b.distance;
          }
          return b.confidence - a.confidence;
        });

      const detectedCourse = onCourseCandidates[0] || null;
      if (detectedCourse) {
        console.log('🎯 CourseDetectionService: Current course detected:', {
          name: detectedCourse.name,
          distance: `${detectedCourse.distance}m`,
          confidence: `${Math.round(detectedCourse.confidence * 100)}%`,
          isOnCourse: detectedCourse.distance <= 500
        });
      } else {
        console.log('🚫 CourseDetectionService: No course detected at current location (within 1000m with >60% confidence)');
      }
      
      return detectedCourse;
    } catch (error) {
      console.error('❌ CourseDetectionService: Error detecting current course:', error);
      return null; // Fail gracefully without mock data
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
      const mapboxToken = this.getMapboxToken();
      
      // Use dynamic search strategies with Search Box API v1 for better coverage
      const searchQueries = this.generateSearchQueries(latitude, longitude);
      
      const allResults: CourseDetectionResult[] = [];
      
      for (const queryParams of searchQueries) {
        const url = `https://api.mapbox.com/search/searchbox/v1/forward?` +
          `q=${encodeURIComponent(queryParams.q)}&` +
          `proximity=${longitude},${latitude}&` +
          `types=poi&` +
          (queryParams.country ? `country=${queryParams.country}&` : '') +
          `limit=10&` +
          `access_token=${mapboxToken}`;

        console.log(`🔍 CourseDetectionService: Searching for: "${queryParams.q}" near:`, { latitude, longitude });
        console.log(`🌐 CourseDetectionService: API URL:`, url.replace(mapboxToken, 'TOKEN_HIDDEN'));

        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`❌ CourseDetectionService: Mapbox API error for query "${queryParams.q}": ${response.status} ${response.statusText}`);
          try {
            const errorBody = await response.text();
            console.error(`❌ CourseDetectionService: Error response body:`, errorBody);
          } catch (err) {
            console.error(`❌ CourseDetectionService: Could not read error response body`);
          }
          continue; // Skip this query and try the next one
        }

        const data: MapboxSearchBoxResponse = await response.json();
        console.log(`✅ CourseDetectionService: API response for "${queryParams.q}":`, data.features.length, 'features received');
        
        const rawFeatures = data.features;
        
        // DEBUG: Log first few features to understand response format
        if (rawFeatures.length > 0) {
          console.log(`🔍 CourseDetectionService: Sample feature data for "${queryParams.q}":`, JSON.stringify(rawFeatures[0], null, 2));
          if (rawFeatures.length > 1) {
            console.log(`🔍 CourseDetectionService: Second feature data:`, JSON.stringify(rawFeatures[1], null, 2));
          }
        }
        
        const golfFeatures = rawFeatures.filter(feature => this.isGolfCourseSearchBox(feature));
        console.log(`🏌️ CourseDetectionService: Filtered to ${golfFeatures.length} golf-related features`);
        
        const golfCourses = golfFeatures
          .map(feature => this.mapSearchBoxFeatureToResult(feature, latitude, longitude))
          .filter(result => result.distance <= radius);
          
        console.log(`📍 CourseDetectionService: Found ${golfCourses.length} courses within ${radius}m radius`);
        if (golfCourses.length > 0) {
          console.log('🏌️ CourseDetectionService: Course distances:', golfCourses.map(course => ({
            name: course.name,
            distance: `${course.distance}m`
          })));
        }
        allResults.push(...golfCourses);
      }
      
      // Remove duplicates and sort by distance
      const uniqueResults = this.removeDuplicates(allResults)
        .sort((a, b) => a.distance - b.distance);

      console.log(`🏁 CourseDetectionService: Detection complete - found ${uniqueResults.length} unique golf courses nearby`);
      if (uniqueResults.length > 0) {
        console.log('🏌️ CourseDetectionService: Detected courses:', uniqueResults.map(course => ({
          name: course.name,
          distance: `${course.distance}m`,
          confidence: `${Math.round(course.confidence * 100)}%`
        })));
      }
      return uniqueResults;

    } catch (error) {
      console.error('Error detecting golf courses:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Check if a Mapbox feature represents a golf course
   */
  private isGolfCourse(feature: MapboxFeature): boolean {
    const golfKeywords = [
      'golf course',
      'golf club', 
      'country club',
      'golf resort',
      'golf links',
      'municipal golf',
      'public golf',
      'private golf'
    ];
    
    const excludeKeywords = [
      'golf shop',
      'golf store', 
      'golf equipment',
      'mini golf',
      'driving range', // Only driving range, not full course
      'golf lessons',
      'golf instruction'
    ];

    const placeName = feature.place_name?.toLowerCase() || '';
    const text = feature.text?.toLowerCase() || '';
    const category = feature.properties?.category?.toLowerCase() || '';
    const maki = feature.properties?.maki?.toLowerCase() || '';

    // Exclude non-course golf related places
    if (excludeKeywords.some(keyword => placeName.includes(keyword) || text.includes(keyword))) {
      return false;
    }

    // Check if it's categorized as golf-related
    if (category.includes('golf') || maki === 'golf') {
      return true;
    }

    // Check place name and text for golf course keywords
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
    let confidence = 0.4; // Base confidence
    
    const placeName = feature.place_name?.toLowerCase() || '';
    const text = feature.text?.toLowerCase() || '';
    
    // Higher confidence for explicit golf course keywords
    if (text.includes('golf course') || placeName.includes('golf course')) confidence += 0.4;
    else if (text.includes('golf club') || placeName.includes('golf club')) confidence += 0.3;
    else if (text.includes('golf') || placeName.includes('golf')) confidence += 0.2;
    
    if (text.includes('country club') || placeName.includes('country club')) confidence += 0.2;
    if (feature.properties?.maki === 'golf') confidence += 0.2;
    
    // Distance-based confidence adjustment
    if (distance <= 100) confidence += 0.2; // Very close - likely on course
    else if (distance <= 200) confidence += 0.1; // Close - likely on course
    else if (distance > 500) confidence -= 0.2; // Further away
    else if (distance > 1000) confidence -= 0.3; // Very far
    
    // Determine place type with better classification
    let placeType: 'golf_course' | 'country_club' | 'resort' = 'golf_course';
    if (placeName.includes('country club') || text.includes('country club')) {
      placeType = 'country_club';
    } else if (placeName.includes('resort') || text.includes('resort') || 
               placeName.includes('hotel') || text.includes('hotel')) {
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
      distance: Math.round(distance),
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
   * Remove duplicate golf courses based on name and location similarity
   */
  private removeDuplicates(results: CourseDetectionResult[]): CourseDetectionResult[] {
    const unique: CourseDetectionResult[] = [];
    
    for (const result of results) {
      const isDuplicate = unique.some(existing => {
        // Check if names are similar (basic similarity check)
        const namesSimilar = this.areNamesSimilar(existing.name, result.name);
        
        // Check if locations are very close (within 50m)
        const distance = this.calculateDistance(
          existing.latitude, existing.longitude,
          result.latitude, result.longitude
        );
        
        return namesSimilar && distance < 50;
      });
      
      if (!isDuplicate) {
        unique.push(result);
      } else {
        // Keep the one with higher confidence
        const existingIndex = unique.findIndex(existing => {
          const namesSimilar = this.areNamesSimilar(existing.name, result.name);
          const distance = this.calculateDistance(
            existing.latitude, existing.longitude,
            result.latitude, result.longitude
          );
          return namesSimilar && distance < 50;
        });
        
        if (existingIndex >= 0 && result.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = result;
        }
      }
    }
    
    return unique;
  }

  /**
   * Check if two course names are similar
   */
  private areNamesSimilar(name1: string, name2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    return false;
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
      Math.sin(dLat/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Generate dynamic search queries based on location and test mode
   */
  private generateSearchQueries(latitude: number, longitude: number): Array<{q: string, country?: string}> {
    const queries: Array<{q: string, country?: string}> = [];
    
    // Check if we're in test mode and get the current preset
    if (isTestModeEnabled()) {
      try {
        const state = store.getState();
        const currentPreset = state.testMode.presets.find(preset => 
          Math.abs(preset.latitude - latitude) < 0.01 && 
          Math.abs(preset.longitude - longitude) < 0.01
        );
        
        if (currentPreset) {
          console.log(`🎯 CourseDetectionService: Test mode detected for ${currentPreset.name}`);
          
          // Add specific course name search first (highest priority)
          queries.push({ q: currentPreset.name });
          
          // Add location-specific searches based on the preset
          if (currentPreset.name.includes('St Andrews')) {
            queries.push({ q: 'St Andrews Old Course' });
            queries.push({ q: 'St Andrews Links' });
            queries.push({ q: 'golf course St Andrews' });
            // No country restriction for international courses
          } else if (currentPreset.name.includes('Augusta')) {
            queries.push({ q: 'Augusta National Golf Club' });
            queries.push({ q: 'Augusta National' });
            queries.push({ q: 'golf course Augusta' });
            // No country restriction for US courses
          } else if (currentPreset.name.includes('Royal County Down')) {
            queries.push({ q: 'Royal County Down' });
            queries.push({ q: 'golf course Newcastle' });
            queries.push({ q: 'golf course', country: 'GB' });
          } else {
            // For UK courses like Faughan Valley, use country restriction
            queries.push({ q: 'golf course', country: 'GB' });
            queries.push({ q: 'golf club', country: 'GB' });
          }
        }
      } catch (error) {
        console.warn('⚠️ CourseDetectionService: Could not access test mode state:', error);
      }
    }
    
    // If no test mode specific queries were added, use generic searches
    if (queries.length === 0) {
      queries.push({ q: 'golf course' });
      queries.push({ q: 'golf club' });
      queries.push({ q: 'country club' });
    }
    
    console.log('🔍 CourseDetectionService: Generated search queries:', queries.map(q => q.q));
    return queries;
  }

  // ===== SEARCH BOX API v1 METHODS =====

  /**
   * Check if a Search Box API feature represents a golf course
   */
  private isGolfCourseSearchBox(feature: MapboxSearchBoxFeature): boolean {
    const name = feature.properties.name?.toLowerCase() || '';
    const placeFormatted = feature.properties.place_formatted?.toLowerCase() || '';
    const fullAddress = feature.properties.full_address?.toLowerCase() || '';
    const poiCategories = feature.properties.poi_category || [];
    
    const golfKeywords = [
      'golf course',
      'golf club', 
      'country club',
      'golf resort',
      'golf links',
      'municipal golf',
      'public golf',
      'private golf'
    ];
    
    const excludeKeywords = [
      'golf shop',
      'golf store', 
      'golf equipment',
      'mini golf',
      'driving range', // Only driving range, not full course
      'golf lessons',
      'golf instruction'
    ];

    const searchableText = [name, placeFormatted, fullAddress].join(' ');

    // Exclude non-course golf related places
    if (excludeKeywords.some(keyword => searchableText.includes(keyword))) {
      return false;
    }

    // Check POI categories for golf-related types
    const golfPoiCategories = ['recreation', 'golf', 'sport', 'sports'];
    if (poiCategories.some(cat => golfPoiCategories.includes(cat))) {
      // If it has golf POI category, check for golf keywords
      if (searchableText.includes('golf')) {
        return true;
      }
    }

    // Check name and address for golf-related keywords
    if (golfKeywords.some(keyword => searchableText.includes(keyword))) {
      return true;
    }

    // If searching specifically for golf terms, be more lenient
    if (searchableText.includes('golf')) {
      return true;
    }

    return false;
  }

  /**
   * Map Search Box API feature to CourseDetectionResult
   */
  private mapSearchBoxFeatureToResult(
    feature: MapboxSearchBoxFeature,
    userLat: number,
    userLon: number
  ): CourseDetectionResult {
    const [longitude, latitude] = feature.geometry.coordinates;
    const distance = this.calculateDistance(userLat, userLon, latitude, longitude);
    
    // Calculate confidence based on various factors
    let confidence = 0.6; // Higher base confidence for Search Box API since it's more accurate
    
    const name = feature.properties.name?.toLowerCase() || '';
    const placeFormatted = feature.properties.place_formatted?.toLowerCase() || '';
    const fullAddress = feature.properties.full_address?.toLowerCase() || '';
    const poiCategories = feature.properties.poi_category || [];
    
    const searchableText = [name, placeFormatted, fullAddress].join(' ');
    
    // Higher confidence for explicit golf course keywords
    if (searchableText.includes('golf course')) confidence += 0.3;
    else if (searchableText.includes('golf club')) confidence += 0.25;
    else if (searchableText.includes('country club') && searchableText.includes('golf')) confidence += 0.2;
    else if (searchableText.includes('golf')) confidence += 0.15;
    
    // POI category bonus
    const golfPoiCategories = ['recreation', 'golf', 'sport', 'sports'];
    if (poiCategories.some(cat => golfPoiCategories.includes(cat))) confidence += 0.1;
    if (poiCategories.includes('golf')) confidence += 0.2;
    
    // Distance-based confidence adjustment (more generous for large courses)
    if (distance <= 200) confidence += 0.2; // Very close - likely on course
    else if (distance <= 500) confidence += 0.15; // Close - probably at course
    else if (distance <= 1000) confidence += 0.05; // Still reasonable for large courses
    else if (distance > 2000) confidence -= 0.2; // Far - less likely to be relevant
    
    // Determine place type
    let placeType: 'golf_course' | 'country_club' | 'resort' = 'golf_course';
    if (searchableText.includes('country club')) {
      placeType = 'country_club';
    } else if (searchableText.includes('resort')) {
      placeType = 'resort';
    }

    // Extract address - use place_formatted from actual API response format
    let address = '';
    if (feature.properties.place_formatted) {
      address = feature.properties.place_formatted;
    } else if (feature.properties.full_address) {
      address = feature.properties.full_address;
    } else if (feature.properties.context) {
      const addressParts = [];
      const ctx = feature.properties.context;
      if (ctx.place?.name) addressParts.push(ctx.place.name);
      if (ctx.region?.name) addressParts.push(ctx.region.name);
      if (ctx.country?.name) addressParts.push(ctx.country.name);
      address = addressParts.join(', ');
    }

    return {
      id: feature.id,
      name: feature.properties.name,
      address,
      latitude,
      longitude,
      confidence: Math.max(0, Math.min(1, confidence)),
      distance,
      placeType,
    };
  }

}