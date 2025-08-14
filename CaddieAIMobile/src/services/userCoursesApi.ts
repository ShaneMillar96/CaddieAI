import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  UserCourse,
  AddUserCourseRequest,
} from '../types';
import TokenStorage from './tokenStorage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

class UserCoursesApiService {
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
        console.log('🔐 UserCoursesApi: Request interceptor - token available:', !!token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🎫 UserCoursesApi: Added Bearer token to request headers');
        } else {
          console.warn('⚠️ UserCoursesApi: No auth token available for request');
        }
        console.log('📤 UserCoursesApi: Making request to:', config.url, 'with method:', config.method);
        return config;
      },
      (error) => {
        console.error('💥 UserCoursesApi: Request interceptor error:', error);
        return Promise.reject(error);
      }
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

  // Get user's saved courses
  async getUserCourses(): Promise<UserCourse[]> {
    console.log('🔵 UserCoursesApi: Starting getUserCourses request to:', `${API_BASE_URL}/user/courses`);
    
    try {
      const response: AxiosResponse<ApiResponse<UserCourse[]>> = await this.api.get(
        '/user/courses'
      );
      
      console.log('✅ UserCoursesApi: getUserCourses response received:', {
        status: response.status,
        statusText: response.statusText,
        success: response.data.success,
        dataLength: response.data.data?.length || 0,
        message: response.data.message
      });
      
      if (response.data.success && response.data.data) {
        console.log('🎯 UserCoursesApi: Returning', response.data.data.length, 'user courses');
        return response.data.data;
      }
      
      console.warn('❌ UserCoursesApi: API returned unsuccessful response:', response.data);
      throw new Error(response.data.message || 'Failed to fetch user courses');
    } catch (error: any) {
      console.error('💥 UserCoursesApi: Error in getUserCourses:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      throw error;
    }
  }

  // Add a new course to user's collection
  async addUserCourse(courseRequest: AddUserCourseRequest): Promise<UserCourse> {
    const response: AxiosResponse<ApiResponse<UserCourse>> = await this.api.post(
      '/user/courses',
      courseRequest
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to add course');
  }

  // Remove a course from user's collection
  async removeUserCourse(courseId: number): Promise<void> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(
      `/user/courses/${courseId}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove course');
    }
  }

}

export const userCoursesApi = new UserCoursesApiService();
export default userCoursesApi;