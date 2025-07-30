import axios, { AxiosInstance } from 'axios';
import TokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:5277/api';

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
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request.');
      }
      
      if (error.response?.status === 404) {
        throw new Error('Round not found. Please start a new round.');
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
}

// Export singleton instance
export const voiceAIApiService = new VoiceAIApiService();
export default voiceAIApiService;