/**
 * Rounds Redux Slice
 * Manages rounds state including all rounds list and selected round details
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Round } from '../../types';
import roundsApiService, { RoundListItem, PaginatedRoundsResponse } from '../../services/roundsApi';

// State interface
export interface RoundsState {
  // All rounds list
  allRounds: RoundListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  
  // Selected round for scorecard
  selectedRound: Round | null;
  selectedRoundLoading: boolean;
  selectedRoundError: string | null;
}

// Initial state
const initialState: RoundsState = {
  allRounds: [],
  totalCount: 0,
  currentPage: 0,
  totalPages: 0,
  hasNextPage: false,
  loading: false,
  error: null,
  lastFetched: null,
  selectedRound: null,
  selectedRoundLoading: false,
  selectedRoundError: null,
};

// Async thunks
export const fetchAllRounds = createAsyncThunk(
  'rounds/fetchAll',
  async (params: { page?: number; pageSize?: number; refresh?: boolean } = {}, { rejectWithValue, getState }) => {
    const { page = 1, pageSize = 20, refresh = false } = params;
    
    console.log(`🏌️ RoundsSlice: Fetching rounds (page: ${page}, refresh: ${refresh})`);
    
    try {
      const response = await roundsApiService.getAllUserRounds(page, pageSize);
      
      if (response.success && response.data) {
        console.log(`✅ RoundsSlice: ${response.data.items.length} rounds fetched successfully`);
        return { ...response.data, refresh, page };
      } else {
        console.warn('⚠️ RoundsSlice: API returned unsuccessful response:', response.message);
        return rejectWithValue(response.message || 'Failed to fetch rounds');
      }
    } catch (error) {
      console.error('❌ RoundsSlice: Error in fetchAllRounds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchRoundScorecard = createAsyncThunk(
  'rounds/fetchScorecard',
  async (roundId: number, { rejectWithValue }) => {
    console.log(`🎯 RoundsSlice: Fetching scorecard for round ${roundId}`);
    
    try {
      const response = await roundsApiService.getRoundScorecard(roundId);
      
      if (response.success && response.data) {
        console.log(`✅ RoundsSlice: Scorecard fetched successfully for round ${roundId}`);
        return response.data;
      } else {
        console.warn(`⚠️ RoundsSlice: API returned unsuccessful response for round ${roundId}:`, response.message);
        return rejectWithValue(response.message || 'Failed to fetch round scorecard');
      }
    } catch (error) {
      console.error(`❌ RoundsSlice: Error in fetchRoundScorecard for round ${roundId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return rejectWithValue(errorMessage);
    }
  }
);

// Rounds History slice
const roundsHistorySlice = createSlice({
  name: 'roundsHistory',
  initialState,
  reducers: {
    clearRoundsError: (state) => {
      console.log('🧩 RoundsSlice: Clearing error state');
      state.error = null;
    },
    
    clearSelectedRoundError: (state) => {
      console.log('🧩 RoundsSlice: Clearing selected round error state');
      state.selectedRoundError = null;
    },
    
    clearRoundsCache: (state) => {
      console.log('🗋 RoundsSlice: Clearing rounds cache');
      state.allRounds = [];
      state.totalCount = 0;
      state.currentPage = 0;
      state.totalPages = 0;
      state.hasNextPage = false;
      state.lastFetched = null;
      state.error = null;
    },
    
    clearSelectedRound: (state) => {
      console.log('🗋 RoundsSlice: Clearing selected round');
      state.selectedRound = null;
      state.selectedRoundError = null;
    },
    
    updateLastFetched: (state) => {
      state.lastFetched = new Date().toISOString();
    },
    
    // Optimistic update for when a round is updated elsewhere
    updateRoundInList: (state, action: PayloadAction<{ roundId: number; updates: Partial<RoundListItem> }>) => {
      const { roundId, updates } = action.payload;
      const index = state.allRounds.findIndex(round => round.id === roundId);
      if (index !== -1) {
        console.log(`📝 RoundsSlice: Updating round ${roundId} in list`);
        state.allRounds[index] = { ...state.allRounds[index], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Rounds
      .addCase(fetchAllRounds.pending, (state, action) => {
        const { page = 1 } = action.meta.arg;
        console.log(`⏳ RoundsSlice: Loading rounds (page ${page})...`);
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRounds.fulfilled, (state, action) => {
        const { items, totalCount, page, pageSize, totalPages, hasNextPage, refresh } = action.payload;
        console.log(`✅ RoundsSlice: Rounds loaded successfully (page ${page})`);
        
        state.loading = false;
        state.error = null;
        state.currentPage = page;
        state.totalCount = totalCount;
        state.totalPages = totalPages;
        state.hasNextPage = hasNextPage;
        state.lastFetched = new Date().toISOString();
        
        if (refresh || page === 1) {
          // Replace all data for refresh or first page
          state.allRounds = items;
        } else {
          // Append data for pagination (load more)
          state.allRounds = [...state.allRounds, ...items];
        }
      })
      .addCase(fetchAllRounds.rejected, (state, action) => {
        console.error('❌ RoundsSlice: Failed to load rounds:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Round Scorecard
      .addCase(fetchRoundScorecard.pending, (state) => {
        console.log('⏳ RoundsSlice: Loading round scorecard...');
        state.selectedRoundLoading = true;
        state.selectedRoundError = null;
      })
      .addCase(fetchRoundScorecard.fulfilled, (state, action) => {
        console.log('✅ RoundsSlice: Round scorecard loaded successfully');
        state.selectedRoundLoading = false;
        state.selectedRound = action.payload;
        state.selectedRoundError = null;
      })
      .addCase(fetchRoundScorecard.rejected, (state, action) => {
        console.error('❌ RoundsSlice: Failed to load round scorecard:', action.payload);
        state.selectedRoundLoading = false;
        state.selectedRoundError = action.payload as string;
      });
  },
});

// Export actions
export const { 
  clearRoundsError, 
  clearSelectedRoundError,
  clearRoundsCache, 
  clearSelectedRound,
  updateLastFetched,
  updateRoundInList 
} = roundsHistorySlice.actions;

// Export reducer
export default roundsHistorySlice.reducer;

// Selectors
export const selectRoundsHistory = (state: { roundsHistory: RoundsState }) => state.roundsHistory;
export const selectAllRounds = (state: { roundsHistory: RoundsState }) => state.roundsHistory.allRounds;
export const selectRoundsLoading = (state: { roundsHistory: RoundsState }) => state.roundsHistory.loading;
export const selectRoundsError = (state: { roundsHistory: RoundsState }) => state.roundsHistory.error;
export const selectHasNextPage = (state: { roundsHistory: RoundsState }) => state.roundsHistory.hasNextPage;
export const selectCurrentPage = (state: { roundsHistory: RoundsState }) => state.roundsHistory.currentPage;
export const selectTotalCount = (state: { roundsHistory: RoundsState }) => state.roundsHistory.totalCount;

export const selectSelectedRound = (state: { roundsHistory: RoundsState }) => state.roundsHistory.selectedRound;
export const selectSelectedRoundLoading = (state: { roundsHistory: RoundsState }) => state.roundsHistory.selectedRoundLoading;
export const selectSelectedRoundError = (state: { roundsHistory: RoundsState }) => state.roundsHistory.selectedRoundError;

// Utility selectors
export const selectIsRoundsDataStale = (state: { roundsHistory: RoundsState }, maxAgeMinutes: number = 10) => {
  const lastFetched = state.roundsHistory.lastFetched;
  if (!lastFetched) return true;
  
  const lastFetchedTime = new Date(lastFetched);
  const now = new Date();
  const ageMinutes = (now.getTime() - lastFetchedTime.getTime()) / (1000 * 60);
  
  return ageMinutes > maxAgeMinutes;
};

export const selectRoundsIsEmpty = (state: { roundsHistory: RoundsState }) => {
  return state.roundsHistory.allRounds.length === 0 && !state.roundsHistory.loading;
};