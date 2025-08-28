/**
 * Dashboard Redux Slice
 * Manages dashboard state including overview data, loading states, and error handling
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  DashboardOverviewResponse,
  DashboardState,
  RefreshInsightsResponseDto
} from '../../types/dashboard';
import dashboardApiService from '../../services/dashboardApi';

// Initial state
const initialState: DashboardState = {
  overview: null,
  loading: false,
  error: null,
  lastFetched: null,
  refreshingInsights: false,
};

// Async thunks
export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    console.log('📊 DashboardSlice: Fetching dashboard overview');
    try {
      const response = await dashboardApiService.getDashboardOverview();
      
      if (response.success && response.data) {
        console.log('✅ DashboardSlice: Dashboard overview fetched successfully');
        return response.data;
      } else {
        console.warn('⚠️ DashboardSlice: API returned unsuccessful response:', response.message);
        return rejectWithValue(response.message || 'Failed to fetch dashboard overview');
      }
    } catch (error) {
      console.error('❌ DashboardSlice: Error in fetchDashboardOverview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const refreshDashboardInsights = createAsyncThunk(
  'dashboard/refreshInsights',
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    console.log(`🔄 DashboardSlice: Refreshing insights (force: ${forceRefresh})`);
    try {
      const response = await dashboardApiService.refreshInsights(forceRefresh);
      
      if (response.success && response.data) {
        if (response.data.success) {
          console.log('✅ DashboardSlice: Insights refreshed successfully');
          return response.data;
        } else {
          console.warn('⚠️ DashboardSlice: Insights refresh failed:', response.data.message);
          return rejectWithValue(response.data.message);
        }
      } else {
        console.warn('⚠️ DashboardSlice: API returned unsuccessful response:', response.message);
        return rejectWithValue(response.message || 'Failed to refresh insights');
      }
    } catch (error) {
      console.error('❌ DashboardSlice: Error in refreshDashboardInsights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      console.log('🧩 DashboardSlice: Clearing error state');
      state.error = null;
    },
    clearDashboardCache: (state) => {
      console.log('🗋 DashboardSlice: Clearing dashboard cache');
      state.overview = null;
      state.lastFetched = null;
      state.error = null;
    },
    updateLastFetched: (state) => {
      state.lastFetched = new Date().toISOString();
    },
    // Manual update of specific sections for optimistic updates
    updateOverviewSection: (state, action: PayloadAction<{ section: keyof DashboardOverviewResponse; data: any }>) => {
      if (state.overview) {
        console.log(`📝 DashboardSlice: Updating ${action.payload.section} section`);
        (state.overview as any)[action.payload.section] = action.payload.data;
        state.overview.lastUpdated = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Overview
      .addCase(fetchDashboardOverview.pending, (state) => {
        console.log('⏳ DashboardSlice: Loading dashboard overview...');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        console.log('✅ DashboardSlice: Dashboard overview loaded successfully');
        state.loading = false;
        state.overview = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        console.error('❌ DashboardSlice: Failed to load dashboard overview:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Refresh Insights
      .addCase(refreshDashboardInsights.pending, (state) => {
        console.log('⏳ DashboardSlice: Refreshing insights...');
        state.refreshingInsights = true;
      })
      .addCase(refreshDashboardInsights.fulfilled, (state, action) => {
        console.log('✅ DashboardSlice: Insights refreshed successfully');
        state.refreshingInsights = false;
        
        // Update insights in overview if available
        if (state.overview && action.payload.updatedInsights) {
          state.overview.insights = action.payload.updatedInsights;
          state.overview.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(refreshDashboardInsights.rejected, (state, action) => {
        console.error('❌ DashboardSlice: Failed to refresh insights:', action.payload);
        state.refreshingInsights = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { 
  clearDashboardError, 
  clearDashboardCache, 
  updateLastFetched,
  updateOverviewSection 
} = dashboardSlice.actions;

// Export reducer
export default dashboardSlice.reducer;

// Selectors
export const selectDashboard = (state: { dashboard: DashboardState }) => state.dashboard;
export const selectDashboardOverview = (state: { dashboard: DashboardState }) => state.dashboard.overview;
export const selectDashboardLoading = (state: { dashboard: DashboardState }) => state.dashboard.loading;
export const selectDashboardError = (state: { dashboard: DashboardState }) => state.dashboard.error;
export const selectDashboardLastFetched = (state: { dashboard: DashboardState }) => state.dashboard.lastFetched;
export const selectRefreshingInsights = (state: { dashboard: DashboardState }) => state.dashboard.refreshingInsights;

// Composite selectors
export const selectUserStats = (state: { dashboard: DashboardState }) => state.dashboard.overview?.userStats;
export const selectRecentRounds = (state: { dashboard: DashboardState }) => state.dashboard.overview?.recentRounds || [];
export const selectPerformanceInsights = (state: { dashboard: DashboardState }) => state.dashboard.overview?.insights;
export const selectShotAnalytics = (state: { dashboard: DashboardState }) => state.dashboard.overview?.shotAnalytics;

// Utility selectors
export const selectIsDashboardDataStale = (state: { dashboard: DashboardState }, maxAgeMinutes: number = 5) => {
  const lastFetched = state.dashboard.lastFetched;
  if (!lastFetched) return true;
  
  const lastFetchedTime = new Date(lastFetched);
  const now = new Date();
  const ageMinutes = (now.getTime() - lastFetchedTime.getTime()) / (1000 * 60);
  
  return ageMinutes > maxAgeMinutes;
};

export const selectDashboardIsEmpty = (state: { dashboard: DashboardState }) => {
  const overview = state.dashboard.overview;
  if (!overview) return true;
  
  return (
    overview.recentRounds.length === 0 &&
    overview.userStats.roundsAnalyzed === 0
  );
};
