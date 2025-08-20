/**
 * Enhanced API Service for CaddieAI Mobile App
 * Provides centralized API communication with authentication, error handling, and retry logic
 */

import { buildApiUrl, API_TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY, isNetworkError } from '../config/api';
import TokenStorage from './tokenStorage';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
  requiresAuth?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  errors?: string[];
  timestamp: string;
}

export class ApiService {
  private static instance: ApiService;

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Make an authenticated API request with retry logic and error handling
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_TIMEOUT,
      retryAttempts = RETRY_ATTEMPTS,
      requiresAuth = true
    } = options;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        // Build request headers
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        };

        // Add authentication if required
        if (requiresAuth) {
          const token = await TokenStorage.getAccessToken();
          if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
          } else if (requiresAuth) {
            throw new Error('Authentication required but no token available');
          }
        }

        // Build request options
        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
          // @ts-ignore - React Native fetch supports timeout
          timeout,
        };

        // Add body for non-GET requests
        if (body && method !== 'GET') {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        // Make the request
        const url = buildApiUrl(endpoint);
        console.log(`🌐 ApiService: ${method} ${url} (attempt ${attempt + 1}/${retryAttempts + 1})`);
        
        const response = await fetch(url, requestOptions);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Use the raw error text if JSON parsing fails
            if (errorText) {
              errorMessage = errorText;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Parse response
        const responseText = await response.text();
        let responseData: ApiResponse<T>;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          // Handle non-JSON responses
          responseData = {
            success: true,
            data: responseText as any,
            timestamp: new Date().toISOString()
          };
        }

        console.log(`✅ ApiService: ${method} ${endpoint} successful`);
        return responseData;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ ApiService: ${method} ${endpoint} failed (attempt ${attempt + 1}):`, lastError.message);
        
        // Don't retry on certain errors
        if (
          lastError.message.includes('401') || // Unauthorized
          lastError.message.includes('403') || // Forbidden
          lastError.message.includes('404') || // Not Found
          lastError.message.includes('422') || // Validation Error
          !isNetworkError(lastError) // Non-network errors
        ) {
          console.log(`🚫 ApiService: Not retrying ${endpoint} due to error type: ${lastError.message}`);
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retryAttempts) {
          const delay = RETRY_DELAY * Math.pow(2, attempt);
          console.log(`⏳ ApiService: Retrying ${endpoint} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts failed, return error response
    console.error(`❌ ApiService: ${method} ${endpoint} failed after ${retryAttempts + 1} attempts:`, lastError);
    
    return {
      success: false,
      message: lastError?.message || 'Request failed',
      errorCode: 'API_REQUEST_FAILED',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * Check API health and connectivity
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get('health', { 
        requiresAuth: false,
        timeout: 5000,
        retryAttempts: 1
      });
      return response.success;
    } catch (error) {
      console.warn('ApiService: Health check failed:', error);
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await this.post('auth/refresh', { 
        refreshToken 
      }, { 
        requiresAuth: false,
        retryAttempts: 1
      });

      if (response.success && response.data?.accessToken) {
        await TokenStorage.setAccessToken(response.data.accessToken);
        if (response.data.refreshToken) {
          await TokenStorage.setRefreshToken(response.data.refreshToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('ApiService: Token refresh failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

// Export default
export default apiService;