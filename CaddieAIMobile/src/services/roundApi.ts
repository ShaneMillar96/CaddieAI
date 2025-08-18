import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  HoleScore,
  PaginatedResponse,
  RoundStatus,
  HoleCompletionRequest
} from '../types';
import TokenStorage from './tokenStorage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

class RoundApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
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
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - could trigger token refresh
          await TokenStorage.clearAll();
        }
        
        // Enhanced error context for debugging
        const enhancedError = new Error(
          error.response?.data?.message || 
          error.message || 
          `HTTP ${error.response?.status || 'Unknown'} Error`
        );
        
        // Add additional context for common errors
        if (error.response?.status === 405) {
          enhancedError.message = `Method not allowed: ${error.config?.method?.toUpperCase()} ${error.config?.url}. Check API endpoint configuration.`;
        }
        
        // Attach original error for debugging
        (enhancedError as any).originalError = error;
        (enhancedError as any).status = error.response?.status;
        
        return Promise.reject(enhancedError);
      }
    );
  }

  // Create a new round
  async createRound(roundData: CreateRoundRequest): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      '/round',
      roundData
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create round');
  }

  // Get round by ID
  async getRoundById(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.get(
      `/round/${roundId}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round');
  }

  // Update round details
  async updateRound(roundId: number, updateData: UpdateRoundRequest): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/round/${roundId}`,
      updateData
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update round');
  }

  // Start a round (update status to InProgress)
  async startRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/round/${roundId}/start`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to start round');
  }

  // Create and start a new round
  async createAndStartRound(courseId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      '/round/start',
      { courseId }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create and start round');
  }

  // Check if user has an active round (validation method)
  async hasActiveRound(): Promise<boolean> {
    try {
      const activeRound = await this.getActiveRound();
      return activeRound !== null;
    } catch (error) {
      // If error is 404 or "no active round", return false
      if (error instanceof Error && (error.message?.includes('404') || error.message?.includes('No active round'))) {
        return false;
      }
      // For other errors, throw them up
      throw error;
    }
  }

  // Validate round creation (pre-flight check)
  async validateRoundCreation(_courseId: number): Promise<{ canCreate: boolean; reason?: string; activeRound?: Round }> {
    try {
      const activeRound = await this.getActiveRound();
      if (activeRound) {
        return {
          canCreate: false,
          reason: 'You already have an active round in progress',
          activeRound: activeRound
        };
      }
      return { canCreate: true };
    } catch (error) {
      // If no active round found, creation is allowed
      if (error instanceof Error && (error.message?.includes('404') || error.message?.includes('No active round'))) {
        return { canCreate: true };
      }
      // For other errors, assume creation is not safe
      return {
        canCreate: false,
        reason: 'Unable to validate round creation. Please try again.'
      };
    }
  }

  // Pause a round
  async pauseRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      `/round/${roundId}/pause`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to pause round');
  }

  // Resume a round
  async resumeRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      `/round/${roundId}/resume`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || `Failed to resume round ${roundId}`);
  }

  // Complete a round
  async completeRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      `/round/${roundId}/complete`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || `Failed to complete round ${roundId}`);
  }

  // Abandon a round
  async abandonRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      `/round/${roundId}/abandon`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || `Failed to abandon round ${roundId}`);
  }

  // Get user's round history with pagination
  async getRoundHistory(page = 1, pageSize = 20): Promise<PaginatedResponse<Round>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Round>>> = await this.api.get(
      `/round/history?page=${page}&pageSize=${pageSize}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round history');
  }

  // Get active round for user
  async getActiveRound(): Promise<Round | null> {
    const response: AxiosResponse<ApiResponse<Round | null>> = await this.api.get(
      '/round/active'
    );
    
    if (response.data.success) {
      return response.data.data || null;
    }
    
    throw new Error(response.data.message || 'Failed to fetch active round');
  }

  // Get rounds by status
  async getRoundsByStatus(status: RoundStatus, page = 1, pageSize = 20): Promise<PaginatedResponse<Round>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Round>>> = await this.api.get(
      `/round/status/${status}?page=${page}&pageSize=${pageSize}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch rounds by status');
  }

  // Add hole score to round
  async addHoleScore(roundId: number, holeScore: Omit<HoleScore, 'id' | 'roundId'>): Promise<HoleScore> {
    const response: AxiosResponse<ApiResponse<HoleScore>> = await this.api.post(
      `/round/${roundId}/hole-scores`,
      holeScore
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to add hole score');
  }

  // Update hole score
  async updateHoleScore(roundId: number, holeScoreId: number, holeScore: Partial<HoleScore>): Promise<HoleScore> {
    const response: AxiosResponse<ApiResponse<HoleScore>> = await this.api.put(
      `/round/${roundId}/hole-scores/${holeScoreId}`,
      holeScore
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update hole score');
  }

  // Get hole scores for a round
  async getHoleScores(roundId: number): Promise<HoleScore[]> {
    const response: AxiosResponse<ApiResponse<HoleScore[]>> = await this.api.get(
      `/round/${roundId}/hole-scores`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch hole scores');
  }

  // Delete a round (soft delete)
  async deleteRound(roundId: number): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.delete(
      `/round/${roundId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete round');
    }
  }

  // Get round statistics
  async getRoundStatistics(roundId: number): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(
      `/round/${roundId}/statistics`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round statistics');
  }

  // Complete a hole with par and score
  async completeHole(holeCompletion: HoleCompletionRequest): Promise<HoleScore> {
    const response: AxiosResponse<ApiResponse<HoleScore>> = await this.api.post(
      `/round/${holeCompletion.roundId}/holes/${holeCompletion.holeNumber}/complete`,
      {
        holeNumber: holeCompletion.holeNumber,
        score: holeCompletion.score,
        par: holeCompletion.par,
      }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to complete hole');
  }

  // Update hole par value (user-defined)
  async updateHolePar(courseId: number, holeNumber: number, par: number): Promise<void> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.patch(
      `/course/${courseId}/holes/${holeNumber}/par`,
      { par }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update hole par');
    }
  }
}

export const roundApi = new RoundApiService();
export default roundApi;