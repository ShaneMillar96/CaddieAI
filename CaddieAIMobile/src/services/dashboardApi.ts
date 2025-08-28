/**
 * Dashboard API Service
 * Provides methods for fetching dashboard analytics and insights
 */

import apiService, { ApiResponse } from './ApiService';
import {
  DashboardOverviewResponse,
  UserStatsDto,
  RecentRoundDto,
  PerformanceInsightsDto,
  ShotAnalyticsDto,
  RefreshInsightsResponseDto,
  RefreshInsightsRequestDto
} from '../types/dashboard';

export class DashboardApiService {
  private static instance: DashboardApiService;

  public static getInstance(): DashboardApiService {
    if (!DashboardApiService.instance) {
      DashboardApiService.instance = new DashboardApiService();
    }
    return DashboardApiService.instance;
  }

  /**
   * Get complete dashboard overview with all analytics data
   */
  async getDashboardOverview(): Promise<ApiResponse<DashboardOverviewResponse>> {
    console.log('📊 DashboardApi: Fetching dashboard overview');
    try {
      const response = await apiService.get<DashboardOverviewResponse>('dashboard/overview');
      
      if (response.success) {
        console.log('✅ DashboardApi: Dashboard overview fetched successfully');
        console.log(`📈 DashboardApi: Stats - ${response.data?.recentRounds?.length || 0} recent rounds, handicap: ${response.data?.userStats?.currentHandicap || 'N/A'}`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to fetch dashboard overview:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error fetching dashboard overview:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard overview',
        errorCode: 'DASHBOARD_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get user statistics only
   */
  async getUserStats(): Promise<ApiResponse<UserStatsDto>> {
    console.log('📈 DashboardApi: Fetching user statistics');
    try {
      const response = await apiService.get<UserStatsDto>('dashboard/stats');
      
      if (response.success) {
        console.log('✅ DashboardApi: User stats fetched successfully');
        console.log(`📊 DashboardApi: Handicap: ${response.data?.currentHandicap || 'N/A'}, Avg Score: ${response.data?.scoringAverage || 'N/A'}`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to fetch user stats:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error fetching user stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user statistics',
        errorCode: 'USER_STATS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get recent rounds only
   */
  async getRecentRounds(limit: number = 10): Promise<ApiResponse<RecentRoundDto[]>> {
    console.log(`🏌️ DashboardApi: Fetching recent rounds (limit: ${limit})`);
    try {
      const response = await apiService.get<RecentRoundDto[]>(
        `dashboard/recent-rounds?limit=${limit}`
      );
      
      if (response.success) {
        console.log(`✅ DashboardApi: ${response.data?.length || 0} recent rounds fetched successfully`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to fetch recent rounds:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error fetching recent rounds:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch recent rounds',
        errorCode: 'RECENT_ROUNDS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get performance insights only
   */
  async getPerformanceInsights(): Promise<ApiResponse<PerformanceInsightsDto>> {
    console.log('🧠 DashboardApi: Fetching performance insights');
    try {
      const response = await apiService.get<PerformanceInsightsDto>('dashboard/insights');
      
      if (response.success) {
        console.log('✅ DashboardApi: Performance insights fetched successfully');
        console.log(`💡 DashboardApi: Trend: ${response.data?.trendAnalysis}, Confidence: ${response.data?.confidenceLevel || 0}`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to fetch performance insights:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error fetching performance insights:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch performance insights',
        errorCode: 'INSIGHTS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get shot analytics only
   */
  async getShotAnalytics(): Promise<ApiResponse<ShotAnalyticsDto>> {
    console.log('🎯 DashboardApi: Fetching shot analytics');
    try {
      const response = await apiService.get<ShotAnalyticsDto>('dashboard/shot-analytics');
      
      if (response.success) {
        console.log('✅ DashboardApi: Shot analytics fetched successfully');
        console.log(`🏌️ DashboardApi: Shots analyzed: ${response.data?.totalShotsAnalyzed || 0}, Accuracy: ${response.data?.accuracyPercentage || 0}%`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to fetch shot analytics:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error fetching shot analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch shot analytics',
        errorCode: 'SHOT_ANALYTICS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Refresh AI-generated performance insights
   */
  async refreshInsights(
    forceRefresh: boolean = false
  ): Promise<ApiResponse<RefreshInsightsResponseDto>> {
    console.log(`🔄 DashboardApi: Refreshing insights (force: ${forceRefresh})`);
    try {
      const requestBody: RefreshInsightsRequestDto = { forceRefresh };
      const response = await apiService.post<RefreshInsightsResponseDto>(
        'dashboard/refresh-insights',
        requestBody
      );
      
      if (response.success) {
        console.log('✅ DashboardApi: Insights refresh completed successfully');
        console.log(`🧠 DashboardApi: Refresh result: ${response.data?.success ? 'Success' : 'Failed'} - ${response.data?.message}`);
      } else {
        console.warn('⚠️ DashboardApi: Failed to refresh insights:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ DashboardApi: Error refreshing insights:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh insights',
        errorCode: 'INSIGHTS_REFRESH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if dashboard data is stale and needs refresh
   */
  isDashboardDataStale(lastUpdated: string, maxAgeMinutes: number = 30): boolean {
    const lastUpdateTime = new Date(lastUpdated);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60);
    
    const isStale = ageMinutes > maxAgeMinutes;
    console.log(`📅 DashboardApi: Data age: ${ageMinutes.toFixed(1)} minutes, stale: ${isStale}`);
    
    return isStale;
  }

  /**
   * Format duration from ISO 8601 to readable string
   */
  formatDuration(isoDuration?: string): string {
    if (!isoDuration) return '--';
    
    try {
      // Basic ISO 8601 duration parsing (PT2H30M format)
      const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      if (!match) return '--';
      
      const hours = match[1] ? parseInt(match[1]) : 0;
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return '--';
    }
  }
}

// Export singleton instance
export const dashboardApiService = DashboardApiService.getInstance();

// Export default
export default dashboardApiService;
