import axios, { AxiosInstance, AxiosResponse } from 'axios';
import TokenStorage from './tokenStorage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

// Frontend types for swing analysis
export interface SwingAnalysisRequest {
  userId: number;
  roundId: number;
  holeId?: number;
  garminDeviceId?: number;
  swingSpeedMph?: number;
  swingAngleDegrees?: number;
  backswingAngleDegrees?: number;
  followThroughAngleDegrees?: number;
  detectionSource: 'garmin' | 'mobile';
  deviceModel?: string;
  detectionConfidence?: number;
  rawSensorData?: any;
  latitude?: number;
  longitude?: number;
  clubUsed?: string;
  distanceToPinYards?: number;
  swingQualityScore?: number;
  aiFeedback?: string;
  comparedToTemplate?: string;
}

export interface SwingAnalysisResponse {
  id: number;
  userId: number;
  roundId: number;
  holeId?: number;
  swingSpeedMph?: number;
  swingAngleDegrees?: number;
  backswingAngleDegrees?: number;
  followThroughAngleDegrees?: number;
  detectionSource: string;
  deviceModel?: string;
  detectionConfidence?: number;
  rawSensorData?: any;
  latitude?: number;
  longitude?: number;
  clubUsed?: string;
  distanceToPinYards?: number;
  swingQualityScore?: number;
  aiFeedback?: string;
  comparedToTemplate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  errorCode?: string;
  errors?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  errors?: string[];
  validationErrors?: ValidationError[];
  timestamp?: string;
  path?: string;
}

class SwingApiService {
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
        
        // Extract detailed error information from response
        const errorData = error.response?.data as ApiErrorResponse | undefined;
        const status = error.response?.status;
        
        // Parse validation errors from response
        let validationErrors: ValidationError[] = [];
        if (errorData?.errors) {
          // Check if errors is an object with field names as keys
          if (typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
            validationErrors = Object.entries(errorData.errors).map(([field, messages]) => ({
              field,
              message: Array.isArray(messages) ? messages[0] : messages,
              value: undefined,
              code: undefined
            }));
          }
        }
        
        // Log detailed error information for debugging
        console.error('🚫 SwingApiService: HTTP Error Details:', {
          status,
          url: error.config?.url,
          method: error.config?.method,
          message: errorData?.message || error.message,
          errorCode: errorData?.errorCode,
          errors: errorData?.errors,
          validationErrors: errorData?.validationErrors,
          timestamp: errorData?.timestamp,
          path: errorData?.path,
          requestData: error.config?.data ? JSON.parse(error.config.data) : undefined
        });
        
        // Enhanced error context for debugging
        const enhancedError = new Error(
          errorData?.message || 
          error.message || 
          'An unexpected error occurred'
        );
        
        // Add comprehensive error data for upstream handling
        (enhancedError as any).originalError = error;
        (enhancedError as any).status = status;
        (enhancedError as any).data = errorData;
        (enhancedError as any).validationErrors = validationErrors.length > 0 ? validationErrors : errorData?.validationErrors;
        (enhancedError as any).errorCode = errorData?.errorCode;
        (enhancedError as any).errors = errorData?.errors;
        
        return Promise.reject(enhancedError);
      }
    );
  }

  /**
   * Create a new swing analysis
   */
  async createSwingAnalysis(
    request: SwingAnalysisRequest
  ): Promise<SwingAnalysisResponse> {
    try {
      console.log('📊 SwingApiService: Creating swing analysis:', {
        userId: request.userId,
        roundId: request.roundId,
        detectionSource: request.detectionSource,
        detectionConfidence: request.detectionConfidence
      });

      const response: AxiosResponse<ApiResponse<SwingAnalysisResponse>> = 
        await this.api.post('/swing-analysis', request);

      if (response.data.success) {
        console.log('✅ SwingApiService: Swing analysis created successfully:', {
          id: response.data.data.id,
          userId: response.data.data.userId,
          roundId: response.data.data.roundId
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create swing analysis');
      }
    } catch (error: any) {
      // Log comprehensive error details for debugging
      console.error('❌ SwingApiService: Error creating swing analysis:', {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
        errors: error.errors,
        validationErrors: error.validationErrors,
        requestData: {
          userId: request.userId,
          roundId: request.roundId,
          detectionSource: request.detectionSource,
          detectionConfidence: request.detectionConfidence
        }
      });

      // Log validation errors separately for easier debugging
      if (error.validationErrors && error.validationErrors.length > 0) {
        console.error('📋 SwingApiService: Backend validation errors:', 
          error.validationErrors.map((ve: ValidationError) => `${ve.field}: ${ve.message}`)
        );
      }

      // Enhance error with user-friendly message
      if (error.status === 400 && error.validationErrors && error.validationErrors.length > 0) {
        const validationMessages = error.validationErrors.map((ve: ValidationError) => ve.message);
        error.userFriendlyMessage = `Validation failed: ${validationMessages.join(', ')}`;
      } else if (error.status === 500) {
        error.userFriendlyMessage = 'Server error occurred while saving swing analysis';
      } else if (error.status === 401) {
        error.userFriendlyMessage = 'Authentication required. Please log in again.';
      } else if (!error.status) {
        error.userFriendlyMessage = 'Network error. Please check your connection.';
      } else {
        error.userFriendlyMessage = error.message || 'Failed to save swing analysis';
      }

      throw error;
    }
  }

  /**
   * Get swing analyses for a user's round
   */
  async getSwingAnalysesByRound(
    userId: number, 
    roundId: number
  ): Promise<SwingAnalysisResponse[]> {
    try {
      console.log('📊 SwingApiService: Getting swing analyses for round:', {
        userId,
        roundId
      });

      const response: AxiosResponse<ApiResponse<SwingAnalysisResponse[]>> = 
        await this.api.get(`/swing-analysis/user/${userId}/round/${roundId}`);

      if (response.data.success) {
        console.log('✅ SwingApiService: Retrieved swing analyses:', {
          count: response.data.data.length,
          userId,
          roundId
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to retrieve swing analyses');
      }
    } catch (error: any) {
      console.error('❌ SwingApiService: Error getting swing analyses:', {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
        errors: error.errors,
        userId,
        roundId
      });

      // Enhance error with user-friendly message
      if (error.status === 404) {
        error.userFriendlyMessage = 'No swing analyses found for this round';
      } else if (error.status === 500) {
        error.userFriendlyMessage = 'Server error occurred while loading swing analyses';
      } else if (!error.status) {
        error.userFriendlyMessage = 'Network error. Please check your connection.';
      } else {
        error.userFriendlyMessage = error.message || 'Failed to load swing analyses';
      }

      throw error;
    }
  }

  /**
   * Get a specific swing analysis by ID
   */
  async getSwingAnalysisById(id: number): Promise<SwingAnalysisResponse> {
    try {
      console.log('📊 SwingApiService: Getting swing analysis by ID:', { id });

      const response: AxiosResponse<ApiResponse<SwingAnalysisResponse>> = 
        await this.api.get(`/swing-analysis/${id}`);

      if (response.data.success) {
        console.log('✅ SwingApiService: Retrieved swing analysis:', {
          id: response.data.data.id,
          userId: response.data.data.userId,
          roundId: response.data.data.roundId
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to retrieve swing analysis');
      }
    } catch (error: any) {
      console.error('❌ SwingApiService: Error getting swing analysis:', {
        message: error.message,
        status: error.status,
        errorCode: error.errorCode,
        errors: error.errors,
        id
      });

      // Enhance error with user-friendly message
      if (error.status === 404) {
        error.userFriendlyMessage = 'Swing analysis not found';
      } else if (error.status === 500) {
        error.userFriendlyMessage = 'Server error occurred while loading swing analysis';
      } else if (!error.status) {
        error.userFriendlyMessage = 'Network error. Please check your connection.';
      } else {
        error.userFriendlyMessage = error.message || 'Failed to load swing analysis';
      }

      throw error;
    }
  }
}

// Export singleton instance
export const swingApiService = new SwingApiService();
export default swingApiService;