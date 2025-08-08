import { SimpleLocationData, simpleLocationService } from './SimpleLocationService';
import voiceAIApiService from './voiceAIApi';

export interface ShotPlacementCoordinates {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface ShotPlacementData {
  id: string;
  coordinates: ShotPlacementCoordinates;
  distanceToPin: number;
  distanceFromCurrentLocation: number;
  isActive: boolean;
  completedAt?: number;
  clubRecommendation?: string;
}

export enum ShotPlacementState {
  INACTIVE = 'inactive',
  SHOT_PLACEMENT = 'shot_placement',
  SHOT_IN_PROGRESS = 'shot_in_progress', 
  SHOT_COMPLETED = 'shot_completed',
  MOVEMENT_DETECTED = 'movement_detected'
}

export interface ShotPlacementConfig {
  movementThresholdMeters: number;
  locationUpdateIntervalMs: number;
  shotCompletionTimeoutMs: number;
  maxDistanceForShotMeters: number;
}

const DEFAULT_CONFIG: ShotPlacementConfig = {
  movementThresholdMeters: 10, // 10m movement indicates shot taken
  locationUpdateIntervalMs: 2000, // Update every 2 seconds
  shotCompletionTimeoutMs: 30000, // 30 second timeout for shot completion
  maxDistanceForShotMeters: 500, // Maximum realistic shot distance
};

export class ShotPlacementService {
  private currentShotPlacement: ShotPlacementData | null = null;
  private currentState: ShotPlacementState = ShotPlacementState.INACTIVE;
  private config: ShotPlacementConfig = DEFAULT_CONFIG;
  private listeners: Array<(data: ShotPlacementData | null, state: ShotPlacementState) => void> = [];
  private movementCheckInterval: ReturnType<typeof setInterval> | null = null;
  private shotCompletionTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastKnownLocation: SimpleLocationData | null = null;
  private shotStartLocation: SimpleLocationData | null = null;

  constructor() {
    this.setupLocationTracking();
  }

  /**
   * Setup location tracking for movement detection
   */
  private setupLocationTracking(): void {
    simpleLocationService.onLocationUpdate((location) => {
      this.handleLocationUpdate(location);
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert meters to yards
   */
  private metersToYards(meters: number): number {
    return Math.round(meters * 1.094);
  }

  /**
   * Handle location updates for movement detection
   */
  private handleLocationUpdate(location: SimpleLocationData): void {
    this.lastKnownLocation = location;

    // Only track movement if we have an active shot placement
    if (
      this.currentState === ShotPlacementState.SHOT_IN_PROGRESS &&
      this.shotStartLocation &&
      this.currentShotPlacement
    ) {
      const distanceMoved = this.calculateDistance(
        this.shotStartLocation.latitude,
        this.shotStartLocation.longitude,
        location.latitude,
        location.longitude
      );

      console.log(`📍 ShotPlacementService: Movement detected: ${distanceMoved.toFixed(1)}m`);

      // Check if movement threshold exceeded
      if (distanceMoved > this.config.movementThresholdMeters) {
        this.setState(ShotPlacementState.MOVEMENT_DETECTED);
        this.completeShotPlacement();
      }
    }
  }

  /**
   * Create a new shot placement
   */
  async createShotPlacement(
    coordinates: { latitude: number; longitude: number },
    pinLocation?: { latitude: number; longitude: number },
    currentHole?: number
  ): Promise<ShotPlacementData> {
    const currentLocation = this.lastKnownLocation || simpleLocationService.getLastKnownLocation();
    
    if (!currentLocation) {
      throw new Error('Current location not available for shot placement');
    }

    // Calculate distance to pin (placeholder - will use actual hole data from API)
    let distanceToPin = 0;
    if (pinLocation) {
      distanceToPin = this.metersToYards(
        this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          pinLocation.latitude,
          pinLocation.longitude
        )
      );
    }

    // Calculate distance from current location
    const distanceFromCurrent = this.metersToYards(
      this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        coordinates.latitude,
        coordinates.longitude
      )
    );

    // Validate shot distance is realistic
    if (distanceFromCurrent > this.config.maxDistanceForShotMeters * 1.094) {
      throw new Error(`Shot placement too far: ${distanceFromCurrent} yards`);
    }

    const shotPlacement: ShotPlacementData = {
      id: `shot-${Date.now()}`,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timestamp: Date.now(),
        accuracy: currentLocation.accuracy,
      },
      distanceToPin,
      distanceFromCurrentLocation: distanceFromCurrent,
      isActive: true,
    };

    this.currentShotPlacement = shotPlacement;
    this.shotStartLocation = currentLocation;
    this.setState(ShotPlacementState.SHOT_PLACEMENT);

    console.log(`🎯 ShotPlacementService: Created shot placement at ${distanceFromCurrent}y from current position`);
    
    // Notify listeners
    this.notifyListeners();

    // Request club recommendation from AI if hole context available
    if (currentHole && distanceToPin > 0) {
      this.requestClubRecommendation(distanceToPin, currentHole);
    }

    return shotPlacement;
  }

  /**
   * Request club recommendation from Voice AI
   */
  private async requestClubRecommendation(yardage: number, holeNumber: number): Promise<void> {
    try {
      // This would typically include more context from active round
      const voiceRequest = {
        userId: 1, // Placeholder - get from auth
        roundId: 1, // Placeholder - get from active round
        voiceInput: `I need a club recommendation for ${yardage} yards on hole ${holeNumber}`,
        golfContext: {
          hasActiveTarget: true,
          currentHole: holeNumber,
          shotType: 'approach'
        }
      };

      const response = await voiceAIApiService.processVoiceInput(voiceRequest);
      
      if (this.currentShotPlacement) {
        this.currentShotPlacement.clubRecommendation = response.message;
        this.notifyListeners();
      }

      console.log(`🤖 ShotPlacementService: AI recommendation: ${response.message}`);
    } catch (error) {
      console.error('Failed to get club recommendation:', error);
    }
  }

  /**
   * Activate shot placement mode (user is ready to take shot)
   */
  activateShotPlacement(): void {
    if (!this.currentShotPlacement) {
      throw new Error('No shot placement available to activate');
    }

    this.setState(ShotPlacementState.SHOT_IN_PROGRESS);
    this.startMovementDetection();
    this.notifyListeners();

    console.log('🏌️ ShotPlacementService: Shot placement activated - monitoring for movement');
  }

  /**
   * Start movement detection and shot completion timeout
   */
  private startMovementDetection(): void {
    // Clear any existing intervals/timeouts
    this.stopMovementDetection();

    // Set timeout for automatic shot completion
    this.shotCompletionTimeout = setTimeout(() => {
      console.log('⏰ ShotPlacementService: Shot completion timeout - auto-completing shot');
      this.completeShotPlacement();
    }, this.config.shotCompletionTimeoutMs);
  }

  /**
   * Stop movement detection
   */
  private stopMovementDetection(): void {
    if (this.movementCheckInterval) {
      clearInterval(this.movementCheckInterval);
      this.movementCheckInterval = null;
    }
    
    if (this.shotCompletionTimeout) {
      clearTimeout(this.shotCompletionTimeout);
      this.shotCompletionTimeout = null;
    }
  }

  /**
   * Complete the current shot placement
   */
  private completeShotPlacement(): void {
    if (!this.currentShotPlacement) return;

    this.currentShotPlacement.completedAt = Date.now();
    this.currentShotPlacement.isActive = false;
    
    this.setState(ShotPlacementState.SHOT_COMPLETED);
    this.stopMovementDetection();
    
    console.log('✅ ShotPlacementService: Shot placement completed');
    
    // Notify listeners and then clear after a brief delay
    this.notifyListeners();
    
    setTimeout(() => {
      this.clearCurrentShotPlacement();
    }, 3000); // Show completion state for 3 seconds
  }

  /**
   * Cancel current shot placement
   */
  cancelShotPlacement(): void {
    if (this.currentShotPlacement) {
      console.log('❌ ShotPlacementService: Shot placement cancelled');
      this.clearCurrentShotPlacement();
    }
  }

  /**
   * Clear current shot placement and reset state
   */
  private clearCurrentShotPlacement(): void {
    this.currentShotPlacement = null;
    this.shotStartLocation = null;
    this.stopMovementDetection();
    this.setState(ShotPlacementState.INACTIVE);
    this.notifyListeners();
  }

  /**
   * Set internal state and log state changes
   */
  private setState(newState: ShotPlacementState): void {
    if (this.currentState !== newState) {
      console.log(`🔄 ShotPlacementService: State change: ${this.currentState} → ${newState}`);
      this.currentState = newState;
    }
  }

  /**
   * Get current shot placement data
   */
  getCurrentShotPlacement(): ShotPlacementData | null {
    return this.currentShotPlacement;
  }

  /**
   * Get current state
   */
  getCurrentState(): ShotPlacementState {
    return this.currentState;
  }

  /**
   * Check if shot placement mode is active
   */
  isActive(): boolean {
    return this.currentState !== ShotPlacementState.INACTIVE;
  }

  /**
   * Subscribe to shot placement updates
   */
  onShotPlacementUpdate(
    callback: (data: ShotPlacementData | null, state: ShotPlacementState) => void
  ): () => void {
    this.listeners.push(callback);
    
    // Send current state immediately
    callback(this.currentShotPlacement, this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentShotPlacement, this.currentState);
      } catch (error) {
        console.error('Error in shot placement listener:', error);
      }
    });
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ShotPlacementConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ ShotPlacementService: Configuration updated:', this.config);
  }

  /**
   * Get service configuration
   */
  getConfig(): ShotPlacementConfig {
    return { ...this.config };
  }

  /**
   * Cleanup service resources
   */
  cleanup(): void {
    this.stopMovementDetection();
    this.listeners = [];
    this.currentShotPlacement = null;
    this.setState(ShotPlacementState.INACTIVE);
    console.log('🧹 ShotPlacementService: Service cleaned up');
  }
}

// Export singleton instance
let _shotPlacementService: ShotPlacementService | null = null;

export const getShotPlacementService = (): ShotPlacementService => {
  if (!_shotPlacementService) {
    _shotPlacementService = new ShotPlacementService();
  }
  return _shotPlacementService;
};

// Export default instance
export const shotPlacementService = getShotPlacementService();

// Helper function to check if service is available
export const isShotPlacementServiceAvailable = (): boolean => {
  try {
    return getShotPlacementService() != null;
  } catch (error) {
    console.error('Shot placement service is not available:', error);
    return false;
  }
};