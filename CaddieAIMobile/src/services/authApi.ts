import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User
} from '../types';
import TokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:5277/api';

class AuthApiService {
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
          // Validate token before using it
          if (TokenStorage.isTokenValid(token)) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            // Token is invalid, clear it and don't add to request
            console.log('Invalid access token detected, clearing storage');
            await TokenStorage.clearAll();
            // Don't add authorization header for invalid token
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized responses
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('Received 401, attempting token refresh...');
          
          try {
            const newToken = await this.refreshToken();
            if (newToken && TokenStorage.isTokenValid(newToken)) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            } else {
              // Refresh token is also invalid or refresh failed
              console.log('Token refresh failed or returned invalid token');
              await TokenStorage.clearAll();
              return Promise.reject(new Error('Authentication failed - please login again'));
            }
          } catch (refreshError) {
            // Refresh failed, clear storage and require re-authentication
            console.log('Token refresh error:', refreshError);
            await TokenStorage.clearAll();
            return Promise.reject(new Error('Authentication failed - please login again'));
          }
        }
        
        // Handle other authentication-related errors
        if (error.response?.status === 403) {
          console.log('Access forbidden - insufficient permissions');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post(
      '/auth/login',
      credentials
    );
    
    if (response.data.success && response.data.data) {
      await TokenStorage.storeTokens(response.data.data.accessToken, response.data.data.refreshToken);
      await TokenStorage.storeUserData(response.data.data.user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post(
      '/auth/register',
      userData
    );
    
    if (response.data.success && response.data.data) {
      await TokenStorage.storeTokens(response.data.data.accessToken, response.data.data.refreshToken);
      await TokenStorage.storeUserData(response.data.data.user);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  async refreshToken(): Promise<string | null> {
    const storedRefreshToken = await TokenStorage.getRefreshToken();
    
    if (!storedRefreshToken) {
      console.log('No refresh token found');
      return null;
    }

    // Validate refresh token before using it
    if (!TokenStorage.isTokenValid(storedRefreshToken)) {
      console.log('Refresh token is invalid or expired, clearing storage');
      await TokenStorage.clearAll();
      return null;
    }

    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.api.post(
        '/auth/refresh',
        { refreshToken: storedRefreshToken }
      );
      
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Validate the new tokens before storing
        if (TokenStorage.isTokenValid(accessToken) && TokenStorage.isTokenValid(newRefreshToken)) {
          await TokenStorage.storeTokens(accessToken, newRefreshToken);
          await TokenStorage.storeUserData(response.data.data.user);
          console.log('Token refresh successful');
          return accessToken;
        } else {
          console.log('Server returned invalid tokens');
          await TokenStorage.clearAll();
          return null;
        }
      }
      
      console.log('Token refresh response was not successful');
      return null;
    } catch (error) {
      console.log('Token refresh failed:', error);
      await TokenStorage.clearAll();
      return null;
    }
  }

  async logout(): Promise<void> {
    const refreshToken = await TokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await this.api.post('/auth/logout', { refreshToken });
      } catch (error) {
        // Ignore errors during logout
      }
    }
    
    await TokenStorage.clearAll();
  }

  async logoutAll(): Promise<void> {
    try {
      await this.api.post('/auth/logout-all');
    } catch (error) {
      // Ignore errors during logout
    }
    
    await TokenStorage.clearAll();
  }

  async forgotPassword(email: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.post(
      '/auth/forgot-password',
      { email }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send reset email');
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.post(
      '/auth/reset-password',
      { token, newPassword, confirmPassword }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reset password');
    }
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.post(
      '/auth/change-password',
      { currentPassword, newPassword, confirmPassword }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await this.api.post(
      '/auth/verify-email',
      { token }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to verify email');
    }
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const response: AxiosResponse<ApiResponse<boolean>> = await this.api.get(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    
    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to check email availability');
  }

  async getUserProfile(): Promise<User> {
    const response: AxiosResponse<ApiResponse<User>> = await this.api.get('/user/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get user profile');
  }

  // Get stored user data
  async getStoredUserData(): Promise<any | null> {
    return await TokenStorage.getUserData();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    return await TokenStorage.hasTokens();
  }
}

export const authApi = new AuthApiService();
export default authApi;