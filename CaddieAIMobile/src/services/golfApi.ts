import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  // Course-related types
  Course,
  CourseListItem,
  CourseSearchRequest,
  NearbyCoursesRequest,
  PaginatedResponse,
  // Round-related types
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  HoleScore,
  RoundStatus,
  // Statistics types
  StatisticsRequest,
  PerformanceAnalysisResponse,
  HandicapTrendResponse,
  ScoringTrendsResponse,
  // Club recommendation types
  ClubRecommendationRequest,
  ClubRecommendationResponse,
  RecommendationFeedbackRequest,
  // Chat types
  ChatSessionRequest,
  ChatSessionResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  // Weather types
  WeatherData,
} from '../types';
import TokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:5277/api';

class GolfApiService {
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

  // =============================================================================
  // COURSE MANAGEMENT METHODS
  // =============================================================================

  // Get paginated courses
  async getCourses(page = 1, pageSize = 20): Promise<PaginatedResponse<CourseListItem>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<CourseListItem>>> = await this.api.get(
      `/courses?page=${page}&pageSize=${pageSize}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch courses');
  }

  // Get course by ID with full details
  async getCourseById(courseId: number): Promise<Course> {
    const response: AxiosResponse<ApiResponse<Course>> = await this.api.get(
      `/courses/${courseId}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course details');
  }

  // Search courses with filters
  async searchCourses(searchRequest: CourseSearchRequest): Promise<PaginatedResponse<CourseListItem>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<CourseListItem>>> = await this.api.post(
      '/courses/search',
      searchRequest
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to search courses');
  }

  // Get nearby courses based on location
  async getNearbyCourses(nearbyRequest: NearbyCoursesRequest): Promise<CourseListItem[]> {
    const response: AxiosResponse<ApiResponse<CourseListItem[]>> = await this.api.post(
      '/courses/nearby',
      nearbyRequest
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch nearby courses');
  }

  // Check if user is within course boundaries
  async checkWithinCourseBounds(courseId: number, latitude: number, longitude: number): Promise<boolean> {
    const response: AxiosResponse<ApiResponse<boolean>> = await this.api.post(
      `/courses/${courseId}/check-bounds`,
      { latitude, longitude }
    );
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to check course boundaries');
  }

  // Get course suggestions based on user preferences
  async getCourseSuggestions(limit = 5): Promise<CourseListItem[]> {
    const response: AxiosResponse<ApiResponse<CourseListItem[]>> = await this.api.get(
      `/courses/suggestions?limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course suggestions');
  }

  // Get course weather information
  async getCourseWeather(courseId: number): Promise<WeatherData> {
    const response: AxiosResponse<ApiResponse<WeatherData>> = await this.api.get(
      `/courses/${courseId}/weather`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course weather');
  }

  // =============================================================================
  // STATISTICS & ANALYTICS METHODS
  // =============================================================================

  // Get comprehensive performance analysis
  async getPerformanceAnalysis(request: StatisticsRequest): Promise<PerformanceAnalysisResponse> {
    const response: AxiosResponse<ApiResponse<PerformanceAnalysisResponse>> = await this.api.post(
      '/statistics/performance-analysis',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch performance analysis');
  }

  // Get handicap trend analysis
  async getHandicapTrend(monthsBack = 6): Promise<HandicapTrendResponse> {
    const response: AxiosResponse<ApiResponse<HandicapTrendResponse>> = await this.api.get(
      `/statistics/handicap-trend?monthsBack=${monthsBack}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch handicap trend');
  }

  // Get course-specific performance analysis
  async getCoursePerformance(courseId: number, request: StatisticsRequest): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      `/statistics/course-performance/${courseId}`,
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course performance');
  }

  // Get scoring trends analysis
  async getScoringTrends(request: StatisticsRequest): Promise<ScoringTrendsResponse> {
    const response: AxiosResponse<ApiResponse<ScoringTrendsResponse>> = await this.api.post(
      '/statistics/scoring-trends',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch scoring trends');
  }

  // Get advanced golf metrics
  async getAdvancedMetrics(request: StatisticsRequest): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      '/statistics/advanced-metrics',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch advanced metrics');
  }

  // Get course comparison analysis
  async getCourseComparison(courseIds: number[], request: StatisticsRequest): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.post(
      '/statistics/course-comparison',
      { ...request, courseIds }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course comparison');
  }

  // Get weather performance analysis
  async getWeatherPerformance(request: StatisticsRequest & { minTemperature?: number; maxTemperature?: number }): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      '/statistics/weather-performance',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch weather performance');
  }

  // Get round performance history
  async getRoundPerformanceHistory(limit = 20): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await this.api.get(
      `/statistics/round-performance-history?limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round performance history');
  }

  // Get enhanced statistics
  async getEnhancedStatistics(request: StatisticsRequest): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      '/statistics/enhanced-statistics',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch enhanced statistics');
  }

  // Get consistency metrics
  async getConsistencyMetrics(request: StatisticsRequest): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.post(
      '/statistics/consistency-metrics',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch consistency metrics');
  }

  // =============================================================================
  // CLUB RECOMMENDATION METHODS
  // =============================================================================

  // Get AI-powered club recommendation
  async getClubRecommendation(request: ClubRecommendationRequest): Promise<ClubRecommendationResponse> {
    const response: AxiosResponse<ApiResponse<ClubRecommendationResponse>> = await this.api.post(
      '/club-recommendation',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get club recommendation');
  }

  // Submit feedback for a club recommendation
  async submitRecommendationFeedback(feedback: RecommendationFeedbackRequest): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.post(
      '/club-recommendation/feedback',
      feedback
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to submit recommendation feedback');
    }
  }

  // Get user's club recommendation history
  async getRecommendationHistory(limit = 20): Promise<ClubRecommendationResponse[]> {
    const response: AxiosResponse<ApiResponse<ClubRecommendationResponse[]>> = await this.api.get(
      `/club-recommendation/history?limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch recommendation history');
  }

  // Get recommendation analytics
  async getRecommendationAnalytics(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(
      '/club-recommendation/analytics'
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch recommendation analytics');
  }

  // Get club usage patterns
  async getClubUsagePatterns(): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(
      '/club-recommendation/club-usage'
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch club usage patterns');
  }

  // =============================================================================
  // CHAT & AI INTEGRATION METHODS
  // =============================================================================

  // Start a new chat session with the golf AI assistant
  async startChatSession(request: ChatSessionRequest): Promise<ChatSessionResponse> {
    const response: AxiosResponse<ApiResponse<ChatSessionResponse>> = await this.api.post(
      '/chat/start-session',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to start chat session');
  }

  // Send a message to the golf AI assistant
  async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response: AxiosResponse<ApiResponse<ChatMessageResponse>> = await this.api.post(
      '/chat/message',
      request
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to send chat message');
  }

  // Get chat session history
  async getChatSessionHistory(sessionId: string): Promise<ChatMessageResponse[]> {
    const response: AxiosResponse<ApiResponse<ChatMessageResponse[]>> = await this.api.get(
      `/chat/session/${sessionId}/history`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch chat session history');
  }

  // =============================================================================
  // ROUND MANAGEMENT METHODS (Future-Ready)
  // =============================================================================
  // NOTE: These methods are prepared for when the Round Management controller is implemented

  // Create a new round
  async createRound(roundData: CreateRoundRequest): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.post(
      '/rounds',
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
      `/rounds/${roundId}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round');
  }

  // Update round details
  async updateRound(roundId: number, updateData: UpdateRoundRequest): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/rounds/${roundId}`,
      updateData
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update round');
  }

  // Start a round
  async startRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/rounds/${roundId}/start`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to start round');
  }

  // Complete a round
  async completeRound(roundId: number): Promise<Round> {
    const response: AxiosResponse<ApiResponse<Round>> = await this.api.put(
      `/rounds/${roundId}/complete`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to complete round');
  }

  // Get user's round history
  async getRoundHistory(page = 1, pageSize = 20): Promise<PaginatedResponse<Round>> {
    const response: AxiosResponse<ApiResponse<PaginatedResponse<Round>>> = await this.api.get(
      `/rounds/history?page=${page}&pageSize=${pageSize}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch round history');
  }

  // Get active round for user
  async getActiveRound(): Promise<Round | null> {
    const response: AxiosResponse<ApiResponse<Round | null>> = await this.api.get(
      '/rounds/active'
    );
    
    if (response.data.success) {
      return response.data.data || null;
    }
    
    throw new Error(response.data.message || 'Failed to fetch active round');
  }

  // Add hole score to round
  async addHoleScore(roundId: number, holeScore: Omit<HoleScore, 'id' | 'roundId'>): Promise<HoleScore> {
    const response: AxiosResponse<ApiResponse<HoleScore>> = await this.api.post(
      `/rounds/${roundId}/hole-scores`,
      holeScore
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to add hole score');
  }
}

export const golfApi = new GolfApiService();
export default golfApi;