import axios, { AxiosInstance } from 'axios';
import TokenStorage from './tokenStorage';
import { API_BASE_URL } from '../config/api';
import { CaddieContext, CaddieScenario } from './TextToSpeechService';

// Types for Voice AI API
export interface VoiceAIRequest {
  userId: number;
  roundId: number;
  voiceInput: string;
  locationContext?: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    currentHole?: number;
    distanceToPinMeters?: number;
    distanceToTeeMeters?: number;
    positionOnHole?: string;
    movementSpeedMps?: number;
    withinCourseBoundaries: boolean;
    timestamp: string;
  };
  conversationHistory?: {
    content: string;
    role: string;
    timestamp: string;
  }[];
  golfContext?: {
    hasActiveTarget: boolean;
    currentHole?: number;
    shotType: string;
    shotPlacementActive?: boolean;
    targetDistance?: number;
    clubRecommendationRequested?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface VoiceAIResponse {
  message: string;
  responseId: string;
  generatedAt: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  confidenceScore: number;
  suggestedActions?: string[];
  requiresConfirmation: boolean;
}

export interface LocationUpdateRequest {
  userId: number;
  roundId: number;
  locationContext: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    currentHole?: number;
    distanceToPinMeters?: number;
    distanceToTeeMeters?: number;
    positionOnHole?: string;
    movementSpeedMps?: number;
    withinCourseBoundaries: boolean;
    timestamp: string;
  };
}

export interface HoleCompletionRequest {
  userId: number;
  roundId: number;
  holeNumber: number;
  score: number;
  par: number;
  shotData?: any;
}

export interface HoleCompletionResponse {
  commentary: string;
  performanceSummary: string;
  scoreDescription: string;
  encouragementLevel: number;
  generatedAt: string;
}

export interface UsageStats {
  userId: number;
  fromDate: string;
  toDate: string;
  totalTokens: number;
  totalMessages: number;
  estimatedCost: number;
  currency: string;
}

export interface CaddieResponseRequest {
  userId: number;
  roundId: number;
  scenario: CaddieScenario;
  context?: CaddieContext;
  userInput?: string;
  metadata?: Record<string, any>;
}

export interface CaddieResponseResponse {
  message: string;
  responseId: string;
  scenario: CaddieScenario;
  generatedAt: string;
  confidenceScore: number;
  suggestedActions?: string[];
  requiresConfirmation: boolean;
  adviceCategory?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

class VoiceAIApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Longer timeout for voice processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await TokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, attempt refresh
          try {
            const refreshToken = await TokenStorage.getRefreshToken();
            if (refreshToken) {
              // This would call a refresh endpoint - for now just clear tokens
              await TokenStorage.clearAll();
              throw new Error('Authentication failed. Please log in again.');
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await TokenStorage.clearAll();
            throw new Error('Authentication failed. Please log in again.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send voice input to AI and get response
   */
  async processVoiceInput(request: VoiceAIRequest): Promise<VoiceAIResponse> {
    try {
      const response = await this.api.post<VoiceAIResponse>('/voiceai/golf-conversation', request);
      return response.data;
    } catch (error: any) {
      console.error('Error processing voice input:', error);
      
      // Enhanced error handling for voice AI API
      if (error.response?.status === 400) {
        console.error('Bad Request - Invalid voice input parameters:', error.response?.data);
        throw new Error('Invalid voice input. Please try again.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Round not found. Please start a new round.');
      }
      
      if (error.response?.status >= 500) {
        console.error('Server error during voice processing:', error.response?.status);
        throw new Error('Server is temporarily unavailable. Please try again later.');
      }
      
      if (!error.response) {
        console.error('Network error during voice processing');
        throw new Error('Network connection issue. Please check your connection.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to process voice input'
      );
    }
  }

  /**
   * Update location context for AI awareness
   */
  async updateLocationContext(request: LocationUpdateRequest): Promise<void> {
    try {
      await this.api.post('/voiceai/location-update', request);
    } catch (error: any) {
      console.error('Error updating location context:', error);
      // Don't throw error for location updates as they're background operations
    }
  }

  /**
   * Generate hole completion commentary
   */
  async generateHoleCompletion(request: HoleCompletionRequest): Promise<HoleCompletionResponse> {
    try {
      const response = await this.api.post<HoleCompletionResponse>('/voiceai/hole-completion', request);
      return response.data;
    } catch (error: any) {
      console.error('Error generating hole completion:', error);
      
      // Return default commentary on error
      return {
        commentary: this.getDefaultHoleCommentary(request.score, request.par),
        performanceSummary: this.getPerformanceSummary(request.score, request.par),
        scoreDescription: this.getScoreDescription(request.score, request.par),
        encouragementLevel: this.calculateEncouragementLevel(request.score, request.par),
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(fromDate?: Date): Promise<UsageStats> {
    try {
      const params = fromDate ? { fromDate: fromDate.toISOString() } : undefined;
      const response = await this.api.get<UsageStats>('/voiceai/usage-stats', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error getting usage statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to get usage statistics');
    }
  }

  /**
   * Check if voice AI service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      // Simple health check by getting usage stats
      await this.getUsageStatistics();
      return true;
    } catch (error) {
      console.error('Voice AI service health check failed:', error);
      return false;
    }
  }

  /**
   * Generate dynamic caddie response for specific golf scenarios
   */
  async generateCaddieResponse(request: CaddieResponseRequest): Promise<CaddieResponseResponse> {
    try {
      const response = await this.api.post<CaddieResponseResponse>('/voiceai/caddie-response', request);
      return response.data;
    } catch (error: any) {
      console.error('Error generating caddie response:', error);
      
      // Handle specific HTTP error codes
      if (error.response?.status === 400) {
        console.error('Bad Request - Invalid parameters:', error.response?.data);
        // Don't throw error, return fallback instead for 400 errors
        // This prevents disruption of the shot placement flow
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      } else if (error.response?.status === 404) {
        throw new Error('Round not found. Please start a new round.');
      } else if (error.response?.status >= 500) {
        console.error('Server error:', error.response?.status, error.response?.data);
        // Don't throw error, use fallback for server errors
      } else if (!error.response) {
        console.error('Network error or timeout');
        // Don't throw error, use fallback for network issues
      }
      
      // Return fallback response on error
      return {
        message: this.getFallbackCaddieMessage(request.scenario, request.context),
        responseId: `fallback-${Date.now()}`,
        scenario: request.scenario,
        generatedAt: new Date().toISOString(),
        confidenceScore: 0.5,
        suggestedActions: this.getFallbackCaddieActions(request.scenario),
        requiresConfirmation: false,
        adviceCategory: this.getAdviceCategory(request.scenario),
      };
    }
  }

  /**
   * Request club recommendation for shot placement
   */
  async requestClubRecommendation(payload: {
    userId: number;
    roundId: number;
    distanceYards: number;
    currentHole?: number;
    locationContext?: {
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
    };
  }): Promise<VoiceAIResponse> {
    try {
      const request: VoiceAIRequest = {
        userId: payload.userId,
        roundId: payload.roundId,
        voiceInput: `I need a club recommendation for ${payload.distanceYards} yards${payload.currentHole ? ` on hole ${payload.currentHole}` : ''}`,
        locationContext: payload.locationContext ? {
          latitude: payload.locationContext.latitude,
          longitude: payload.locationContext.longitude,
          accuracyMeters: payload.locationContext.accuracyMeters,
          currentHole: payload.currentHole,
          distanceToPinMeters: Math.round(payload.distanceYards * 0.9144), // Convert yards to meters
          withinCourseBoundaries: true,
          timestamp: new Date().toISOString(),
        } : undefined,
        golfContext: {
          hasActiveTarget: true,
          currentHole: payload.currentHole,
          shotType: 'approach',
          shotPlacementActive: true,
          targetDistance: payload.distanceYards,
          clubRecommendationRequested: true,
        }
      };

      const response = await this.processVoiceInput(request);
      return response;
    } catch (error: any) {
      console.error('Error requesting club recommendation:', error);
      
      // Return fallback recommendation
      return {
        message: this.getFallbackClubRecommendation(payload.distanceYards),
        responseId: `fallback-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        confidenceScore: 0.5,
        suggestedActions: ['Use recommended club', 'Adjust for conditions'],
        requiresConfirmation: false,
      };
    }
  }

  /**
   * Announce shot placement status
   */
  async announceShotPlacementStatus(payload: {
    userId: number;
    roundId: number;
    status: 'placed' | 'activated' | 'in_progress' | 'completed';
    distanceYards?: number;
    currentHole?: number;
    clubRecommendation?: string;
  }): Promise<VoiceAIResponse> {
    try {
      let voiceInput = '';
      
      switch (payload.status) {
        case 'placed':
          voiceInput = `Shot target placed${payload.distanceYards ? ` at ${payload.distanceYards} yards` : ''}. Please provide encouragement and next steps.`;
          break;
        case 'activated':
          voiceInput = `Shot tracking is now active. Provide brief encouragement for taking the shot.`;
          break;
        case 'in_progress':
          voiceInput = `Shot is in progress. Provide brief monitoring message.`;
          break;
        case 'completed':
          voiceInput = `Shot completed successfully. Provide positive feedback and next steps.`;
          break;
      }

      const request: VoiceAIRequest = {
        userId: payload.userId,
        roundId: payload.roundId,
        voiceInput,
        golfContext: {
          hasActiveTarget: payload.status !== 'completed',
          currentHole: payload.currentHole,
          shotType: 'status_update',
          shotPlacementActive: payload.status === 'activated' || payload.status === 'in_progress',
          targetDistance: payload.distanceYards,
        }
      };

      const response = await this.processVoiceInput(request);
      return response;
    } catch (error: any) {
      console.error('Error announcing shot placement status:', error);
      
      // Return fallback message
      return {
        message: this.getFallbackStatusMessage(payload.status, payload.distanceYards),
        responseId: `fallback-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        confidenceScore: 0.5,
        suggestedActions: [],
        requiresConfirmation: false,
      };
    }
  }

  /**
   * Process shot placement guidance request
   */
  async requestShotPlacementGuidance(payload: {
    userId: number;
    roundId: number;
    requestType: 'welcome' | 'instruction' | 'assistance';
    currentHole?: number;
    context?: string;
  }): Promise<VoiceAIResponse> {
    try {
      let voiceInput = '';
      
      switch (payload.requestType) {
        case 'welcome':
          voiceInput = `Welcome the user to shot placement mode and provide brief instructions on how to use it.`;
          break;
        case 'instruction':
          voiceInput = `Provide instructions on how to use shot placement mode for golf.`;
          break;
        case 'assistance':
          voiceInput = payload.context || 'The user needs general assistance with shot placement mode.';
          break;
      }

      const request: VoiceAIRequest = {
        userId: payload.userId,
        roundId: payload.roundId,
        voiceInput,
        golfContext: {
          hasActiveTarget: false,
          currentHole: payload.currentHole,
          shotType: 'guidance',
          shotPlacementActive: true,
        }
      };

      const response = await this.processVoiceInput(request);
      return response;
    } catch (error: any) {
      console.error('Error requesting shot placement guidance:', error);
      
      // Return fallback guidance
      return {
        message: this.getFallbackGuidanceMessage(payload.requestType),
        responseId: `fallback-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        confidenceScore: 0.5,
        suggestedActions: ['Tap map to place shot', 'Use voice commands'],
        requiresConfirmation: false,
      };
    }
  }

  // Private helper methods for fallback responses
  private getDefaultHoleCommentary(score: number, par: number): string {
    const difference = score - par;
    
    if (difference <= -1) {
      return "Great job on that hole! Keep up the excellent play.";
    } else if (difference === 0) {
      return "Nice par! Solid golf right there.";
    } else if (difference === 1) {
      return "Good bogey. Stay positive and focus on the next hole.";
    } else {
      return "Tough hole, but that's golf! Let's bounce back on the next one.";
    }
  }

  private getPerformanceSummary(score: number, par: number): string {
    const difference = score - par;
    
    if (difference <= -2) return "Exceptional performance";
    if (difference === -1) return "Excellent play";
    if (difference === 0) return "Solid par performance";
    if (difference === 1) return "Close to par";
    if (difference === 2) return "Room for improvement";
    return "Challenging hole";
  }

  private getScoreDescription(score: number, par: number): string {
    const difference = score - par;
    
    switch (difference) {
      case -3: return "Albatross";
      case -2: return "Eagle";
      case -1: return "Birdie";
      case 0: return "Par";
      case 1: return "Bogey";
      case 2: return "Double Bogey";
      case 3: return "Triple Bogey";
      default:
        if (difference > 3) return `${difference} over par`;
        return `${Math.abs(difference)} under par`;
    }
  }

  private calculateEncouragementLevel(score: number, par: number): number {
    const difference = score - par;
    
    if (difference <= -1) return 5; // Maximum encouragement for under par
    if (difference === 0) return 4;  // High encouragement for par
    if (difference === 1) return 3;  // Neutral for bogey
    if (difference === 2) return 2;  // Supportive for double bogey
    return 1; // Most supportive for worse scores
  }

  // Shot placement fallback helper methods
  private getFallbackClubRecommendation(distanceYards: number): string {
    if (distanceYards < 100) {
      return "For this short approach, I recommend a wedge or short iron.";
    } else if (distanceYards < 150) {
      return "For this distance, consider a 9 or 8 iron.";
    } else if (distanceYards < 170) {
      return "A 7 or 6 iron should work well for this yardage.";
    } else if (distanceYards < 190) {
      return "I'd suggest a 5 iron or hybrid for this distance.";
    } else if (distanceYards < 220) {
      return "Consider using a 4 iron or fairway wood.";
    } else {
      return "For this longer shot, a driver or 3 wood would be appropriate.";
    }
  }

  private getFallbackStatusMessage(status: string, distanceYards?: number): string {
    switch (status) {
      case 'placed':
        return `Target set${distanceYards ? ` at ${distanceYards} yards` : ''}. When you're ready, activate shot tracking.`;
      case 'activated':
        return "Shot tracking is active. Take your shot when ready.";
      case 'in_progress':
        return "Monitoring your shot. Good luck!";
      case 'completed':
        return "Nice shot! Ready for your next target.";
      default:
        return "Shot placement is ready.";
    }
  }

  private getFallbackGuidanceMessage(requestType: string): string {
    switch (requestType) {
      case 'welcome':
        return "Welcome to shot placement mode! Tap anywhere on the map to set your target, and I'll help with club recommendations.";
      case 'instruction':
        return "To use shot placement: tap the map to set your target, review the distance, then activate shot tracking when ready.";
      case 'assistance':
        return "I'm here to help! Tap the map to place your shot target, and I'll provide club recommendations based on the distance.";
      default:
        return "How can I assist you with your shot placement?";
    }
  }

  // Caddie response helper methods
  private getFallbackCaddieMessage(scenario: CaddieScenario, context?: CaddieContext): string {
    switch (scenario) {
      case 'ShotPlacementWelcome':
        return "Welcome to shot placement! Tap the map to set your target.";
      
      case 'ClubRecommendation':
        const distance = context?.golfContext?.targetDistanceYards ?? 150;
        return this.getFallbackClubRecommendation(distance);
      
      case 'ShotPlacementConfirmation':
        const targetYards = context?.golfContext?.targetDistanceYards ?? 150;
        return `Target set at ${targetYards} yards. You're ready to go!`;
      
      case 'ShotTrackingActivation':
        return "Shot tracking active. Trust your swing and follow through.";
      
      case 'ShotInProgress':
        return "Looking good! Stay committed to your shot.";
      
      case 'ShotCompletion':
        return "Well played! Ready for your next target.";
      
      case 'MovementDetected':
        return "Shot complete. Nice work out there!";
      
      case 'DistanceAnnouncement':
        const announceDistance = context?.golfContext?.targetDistanceYards ?? 150;
        return `Distance: ${announceDistance} yards to target.`;
      
      case 'HoleCompletion':
        return "Good hole! Let's keep the momentum going.";
      
      case 'ErrorHandling':
        return "No problem! I'm here to help you get back on track.";
      
      default:
        return "I'm here to help with your golf game!";
    }
  }

  private getFallbackCaddieActions(scenario: CaddieScenario): string[] {
    switch (scenario) {
      case 'ShotPlacementWelcome':
        return ['Tap map to place target', 'Ask for course strategy', 'Get weather conditions'];
      
      case 'ClubRecommendation':
        return ['Confirm club selection', 'Ask about conditions', 'Get distance adjustment'];
      
      case 'ShotPlacementConfirmation':
        return ['Activate shot tracking', 'Adjust target position', 'Ask for advice'];
      
      case 'ShotTrackingActivation':
        return ['Take your shot', 'Cancel shot tracking', 'Ask for swing tip'];
      
      case 'ShotCompletion':
        return ['Place next target', 'View shot statistics', 'Move to next hole'];
      
      case 'HoleCompletion':
        return ['View scorecard', 'Get strategy for next hole', 'Review hole performance'];
      
      default:
        return ['Ask for advice', 'Get club recommendation', 'Check course strategy'];
    }
  }

  private getAdviceCategory(scenario: CaddieScenario): string {
    switch (scenario) {
      case 'ClubRecommendation':
        return 'Club Selection';
      case 'CourseStrategy':
        return 'Course Strategy';
      case 'ShotPlacementWelcome':
      case 'ShotPlacementConfirmation':
      case 'ShotTrackingActivation':
        return 'Shot Placement';
      case 'PerformanceEncouragement':
      case 'HoleCompletion':
        return 'Performance';
      case 'WeatherConditions':
        return 'Course Conditions';
      case 'ErrorHandling':
        return 'Support';
      default:
        return 'General Advice';
    }
  }
}

// Export singleton instance
export const voiceAIApiService = new VoiceAIApiService();
export default voiceAIApiService;