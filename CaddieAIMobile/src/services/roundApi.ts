import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  HoleScore,
  PaginatedResponse,
  RoundStatus
} from '../types';
import TokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:5277/api';

class RoundApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
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
        return Promise.reject(error);
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
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/round/${roundId}/resume`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to resume round');
  }

  // Complete a round
  async completeRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/round/${roundId}/complete`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to complete round');
  }

  // Abandon a round
  async abandonRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/round/${roundId}/abandon`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to abandon round');
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
}

export const roundApi = new RoundApiService();
export default roundApi;