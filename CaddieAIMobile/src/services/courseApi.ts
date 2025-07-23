import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ApiResponse,
  Course,
  CourseListItem,
  CourseSearchRequest,
  NearbyCoursesRequest,
  PaginatedResponse
} from '../types';
import TokenStorage from './tokenStorage';

const API_BASE_URL = 'http://localhost:5277/api';

class CourseApiService {
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
  async getNearby(nearbyRequest: NearbyCoursesRequest): Promise<CourseListItem[]> {
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
  async checkWithinBounds(courseId: number, latitude: number, longitude: number): Promise<boolean> {
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
  async getSuggestions(limit = 5): Promise<CourseListItem[]> {
    const response: AxiosResponse<ApiResponse<CourseListItem[]>> = await this.api.get(
      `/courses/suggestions?limit=${limit}`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course suggestions');
  }

  // Get course weather information
  async getCourseWeather(courseId: number): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await this.api.get(
      `/courses/${courseId}/weather`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch course weather');
  }
}

export const courseApi = new CourseApiService();
export default courseApi;