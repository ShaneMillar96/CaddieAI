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

  // Get user's saved courses
  async getUserCourses(): Promise<UserCourse[]> {
    const response: AxiosResponse<ApiResponse<UserCourse[]>> = await this.api.get(
      '/user/courses'
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch user courses');
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