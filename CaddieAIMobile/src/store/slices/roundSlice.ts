import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  RoundState,
  CreateRoundRequest,
  UpdateRoundRequest,
  HoleScore,
  RoundStatus,
  HoleCompletionRequest,
} from '../../types';
import roundApi from '../../services/roundApi';

const initialState: RoundState = {
  activeRound: null,
  roundHistory: [],
  selectedRound: null,
  isLoading: false,
  isStarting: false,
  isUpdating: false,
  isCompleting: false,
  error: null,
  lastSyncTime: null,
  // Dashboard-specific state
  dashboardState: {
    currentHole: 1,
    showScoreModal: false,
    isLocationTracking: false,
    lastLocationUpdate: null,
    roundTimer: null,
  },
};

// Async thunks
export const createRound = createAsyncThunk(
  'rounds/createRound',
  async (roundData: CreateRoundRequest, { rejectWithValue }) => {
    try {
      const round = await roundApi.createRound(roundData);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create round');
    }
  }
);

export const startRound = createAsyncThunk(
  'rounds/startRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.startRound(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start round');
    }
  }
);

export const updateRound = createAsyncThunk(
  'rounds/updateRound',
  async ({ roundId, updateData }: { roundId: number; updateData: UpdateRoundRequest }, { rejectWithValue }) => {
    try {
      const round = await roundApi.updateRound(roundId, updateData);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update round');
    }
  }
);

export const pauseRound = createAsyncThunk(
  'rounds/pauseRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.pauseRound(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to pause round');
    }
  }
);

export const resumeRound = createAsyncThunk(
  'rounds/resumeRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.resumeRound(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resume round');
    }
  }
);

export const completeRound = createAsyncThunk(
  'rounds/completeRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.completeRound(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete round');
    }
  }
);

export const abandonRound = createAsyncThunk(
  'rounds/abandonRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.abandonRound(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to abandon round');
    }
  }
);

export const fetchRoundById = createAsyncThunk(
  'rounds/fetchRoundById',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const round = await roundApi.getRoundById(roundId);
      return round;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch round');
    }
  }
);

export const fetchActiveRound = createAsyncThunk(
  'rounds/fetchActiveRound',
  async (_, { rejectWithValue }) => {
    try {
      const round = await roundApi.getActiveRound();
      return round;
    } catch (error: any) {
      // If it's a 404 or "no active round" error, treat it as success with null result
      if (error.message?.includes('404') || error.message?.includes('No active round') || error.response?.status === 404) {
        return null;
      }
      return rejectWithValue(error.message || 'Failed to fetch active round');
    }
  }
);

export const fetchRoundHistory = createAsyncThunk(
  'rounds/fetchRoundHistory',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await roundApi.getRoundHistory(page, pageSize);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch round history');
    }
  }
);

export const fetchRoundsByStatus = createAsyncThunk(
  'rounds/fetchRoundsByStatus',
  async ({ status, page = 1, pageSize = 20 }: { status: RoundStatus; page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await roundApi.getRoundsByStatus(status, page, pageSize);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rounds by status');
    }
  }
);

export const addHoleScore = createAsyncThunk(
  'rounds/addHoleScore',
  async ({ roundId, holeScore }: { roundId: number; holeScore: Omit<HoleScore, 'id' | 'roundId'> }, { rejectWithValue }) => {
    try {
      const score = await roundApi.addHoleScore(roundId, holeScore);
      return { roundId, holeScore: score };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add hole score');
    }
  }
);

export const updateHoleScore = createAsyncThunk(
  'rounds/updateHoleScore',
  async ({ roundId, holeScoreId, holeScore }: { roundId: number; holeScoreId: number; holeScore: Partial<HoleScore> }, { rejectWithValue }) => {
    try {
      const score = await roundApi.updateHoleScore(roundId, holeScoreId, holeScore);
      return { roundId, holeScore: score };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update hole score');
    }
  }
);

export const fetchHoleScores = createAsyncThunk(
  'rounds/fetchHoleScores',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const scores = await roundApi.getHoleScores(roundId);
      return { roundId, scores };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch hole scores');
    }
  }
);

export const deleteRound = createAsyncThunk(
  'rounds/deleteRound',
  async (roundId: number, { rejectWithValue }) => {
    try {
      await roundApi.deleteRound(roundId);
      return roundId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete round');
    }
  }
);

export const createAndStartRound = createAsyncThunk(
  'rounds/createAndStartRound',
  async (courseId: number, { rejectWithValue }) => {
    try {
      // Pre-flight validation
      const validation = await roundApi.validateRoundCreation(courseId);
      
      if (!validation.canCreate) {
        return rejectWithValue({
          message: validation.reason || 'Cannot create new round',
          code: 409,
          activeRound: validation.activeRound
        });
      }

      // Proceed with round creation
      const round = await roundApi.createAndStartRound(courseId);
      return round;
    } catch (error: any) {
      const errorPayload = {
        message: error.message || 'Failed to create and start round',
        code: error.response?.status || 500
      };
      return rejectWithValue(errorPayload);
    }
  }
);

export const completeHole = createAsyncThunk(
  'rounds/completeHole',
  async (holeCompletion: HoleCompletionRequest, { rejectWithValue }) => {
    try {
      const holeScore = await roundApi.completeHole(holeCompletion);
      return { 
        holeScore,
        roundId: holeCompletion.roundId,
        holeNumber: holeCompletion.holeNumber,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete hole');
    }
  }
);

export const updateHolePar = createAsyncThunk(
  'rounds/updateHolePar',
  async ({ courseId, holeNumber, par }: { courseId: number; holeNumber: number; par: number }, { rejectWithValue }) => {
    try {
      await roundApi.updateHolePar(courseId, holeNumber, par);
      return { courseId, holeNumber, par };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update hole par');
    }
  }
);

const roundSlice = createSlice({
  name: 'rounds',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearActiveRound: (state) => {
      state.activeRound = null;
    },
    clearSelectedRound: (state) => {
      state.selectedRound = null;
    },
    clearRoundHistory: (state) => {
      state.roundHistory = [];
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    resetRoundState: (state) => {
      state.activeRound = null;
      state.roundHistory = [];
      state.selectedRound = null;
      state.isLoading = false;
      state.isStarting = false;
      state.isUpdating = false;
      state.isCompleting = false;
      state.error = null;
      state.lastSyncTime = null;
      state.dashboardState = {
        currentHole: 1,
        showScoreModal: false,
        isLocationTracking: false,
        lastLocationUpdate: null,
        roundTimer: null,
      };
    },
    // Enhanced error handling actions
    setErrorWithContext: (state, action: PayloadAction<{ error: string; context?: string; errorCode?: number }>) => {
      const { error, context, errorCode } = action.payload;
      state.error = context ? `${context}: ${error}` : error;
      
      // Handle specific error codes
      if (errorCode === 409) {
        // Conflict error - likely active round exists, trigger refresh
        state.error = 'Active round conflict detected. Please refresh and try again.';
      } else if (errorCode && errorCode >= 500) {
        state.error = 'Server error occurred. Please try again later.';
      }
    },
    clearErrorAndRefresh: (state) => {
      state.error = null;
      state.isLoading = false;
      state.isStarting = false;
      state.isUpdating = false;
      state.isCompleting = false;
    },
    // Force refresh active round state
    forceRefreshActiveRound: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    // Dashboard-specific actions
    setCurrentHole: (state, action: PayloadAction<number>) => {
      state.dashboardState.currentHole = action.payload;
    },
    setShowScoreModal: (state, action: PayloadAction<boolean>) => {
      state.dashboardState.showScoreModal = action.payload;
    },
    setLocationTracking: (state, action: PayloadAction<boolean>) => {
      state.dashboardState.isLocationTracking = action.payload;
    },
    setLastLocationUpdate: (state, action: PayloadAction<string>) => {
      state.dashboardState.lastLocationUpdate = action.payload;
    },
    setRoundTimer: (state, action: PayloadAction<string>) => {
      state.dashboardState.roundTimer = action.payload;
    },
    // Optimistic update for hole score (for offline support)
    optimisticUpdateHoleScore: (state, action: PayloadAction<{ roundId: number; holeScore: HoleScore }>) => {
      const { roundId, holeScore } = action.payload;
      
      // Update active round if it matches
      if (state.activeRound && state.activeRound.id === roundId) {
        if (!state.activeRound.holeScores) {
          state.activeRound.holeScores = [];
        }
        const existingIndex = state.activeRound.holeScores.findIndex(
          score => score.holeId === holeScore.holeId
        );
        if (existingIndex >= 0) {
          state.activeRound.holeScores[existingIndex] = holeScore;
        } else {
          state.activeRound.holeScores.push(holeScore);
        }
      }
      
      // Update selected round if it matches
      if (state.selectedRound && state.selectedRound.id === roundId) {
        if (!state.selectedRound.holeScores) {
          state.selectedRound.holeScores = [];
        }
        const existingIndex = state.selectedRound.holeScores.findIndex(
          score => score.holeId === holeScore.holeId
        );
        if (existingIndex >= 0) {
          state.selectedRound.holeScores[existingIndex] = holeScore;
        } else {
          state.selectedRound.holeScores.push(holeScore);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Create round
    builder.addCase(createRound.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createRound.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeRound = action.payload;
    });
    builder.addCase(createRound.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Start round
    builder.addCase(startRound.pending, (state) => {
      state.isStarting = true;
      state.error = null;
    });
    builder.addCase(startRound.fulfilled, (state, action) => {
      state.isStarting = false;
      state.activeRound = action.payload;
    });
    builder.addCase(startRound.rejected, (state, action) => {
      state.isStarting = false;
      state.error = action.payload as string;
    });

    // Update round
    builder.addCase(updateRound.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(updateRound.fulfilled, (state, action) => {
      state.isUpdating = false;
      const updatedRound = action.payload;
      
      // Update active round if it matches
      if (state.activeRound && state.activeRound.id === updatedRound.id) {
        state.activeRound = updatedRound;
      }
      
      // Update selected round if it matches
      if (state.selectedRound && state.selectedRound.id === updatedRound.id) {
        state.selectedRound = updatedRound;
      }
      
      // Update in history if it exists
      const historyIndex = state.roundHistory.findIndex(round => round.id === updatedRound.id);
      if (historyIndex >= 0) {
        state.roundHistory[historyIndex] = updatedRound;
      }
    });
    builder.addCase(updateRound.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload as string;
    });

    // Pause round
    builder.addCase(pauseRound.fulfilled, (state, action) => {
      const updatedRound = action.payload;
      if (state.activeRound && state.activeRound.id === updatedRound.id) {
        state.activeRound = updatedRound;
      }
    });
    builder.addCase(pauseRound.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Resume round
    builder.addCase(resumeRound.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(resumeRound.fulfilled, (state, action) => {
      state.isUpdating = false;
      const updatedRound = action.payload;
      if (state.activeRound && state.activeRound.id === updatedRound.id) {
        state.activeRound = updatedRound;
      }
    });
    builder.addCase(resumeRound.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload as string;
    });

    // Complete round
    builder.addCase(completeRound.pending, (state) => {
      state.isCompleting = true;
      state.error = null;
    });
    builder.addCase(completeRound.fulfilled, (state, action) => {
      state.isCompleting = false;
      const completedRound = action.payload;
      
      // Move from active to history
      state.activeRound = null;
      
      // Add to history if not already there
      const existingIndex = state.roundHistory.findIndex(round => round.id === completedRound.id);
      if (existingIndex >= 0) {
        state.roundHistory[existingIndex] = completedRound;
      } else {
        state.roundHistory.unshift(completedRound); // Add to beginning
      }
    });
    builder.addCase(completeRound.rejected, (state, action) => {
      state.isCompleting = false;
      state.error = action.payload as string;
    });

    // Abandon round
    builder.addCase(abandonRound.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(abandonRound.fulfilled, (state, action) => {
      state.isUpdating = false;
      const abandonedRound = action.payload;
      
      // Clear active round
      if (state.activeRound && state.activeRound.id === abandonedRound.id) {
        state.activeRound = null;
      }
      
      // Add to history
      const existingIndex = state.roundHistory.findIndex(round => round.id === abandonedRound.id);
      if (existingIndex >= 0) {
        state.roundHistory[existingIndex] = abandonedRound;
      } else {
        state.roundHistory.unshift(abandonedRound);
      }
    });
    builder.addCase(abandonRound.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload as string;
    });

    // Fetch round by ID
    builder.addCase(fetchRoundById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRoundById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedRound = action.payload;
    });
    builder.addCase(fetchRoundById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch active round
    builder.addCase(fetchActiveRound.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActiveRound.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeRound = action.payload;
    });
    builder.addCase(fetchActiveRound.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch round history
    builder.addCase(fetchRoundHistory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRoundHistory.fulfilled, (state, action) => {
      state.isLoading = false;
      const { items, pageNumber } = action.payload;
      
      if (pageNumber === 1) {
        // First page - replace existing history
        state.roundHistory = items;
      } else {
        // Subsequent pages - append to existing history
        state.roundHistory = [...state.roundHistory, ...items];
      }
    });
    builder.addCase(fetchRoundHistory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add hole score
    builder.addCase(addHoleScore.fulfilled, (state, action) => {
      const { roundId, holeScore } = action.payload;
      
      // Update active round
      if (state.activeRound && state.activeRound.id === roundId) {
        if (!state.activeRound.holeScores) {
          state.activeRound.holeScores = [];
        }
        state.activeRound.holeScores.push(holeScore);
      }
      
      // Update selected round
      if (state.selectedRound && state.selectedRound.id === roundId) {
        if (!state.selectedRound.holeScores) {
          state.selectedRound.holeScores = [];
        }
        state.selectedRound.holeScores.push(holeScore);
      }
    });
    builder.addCase(addHoleScore.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Update hole score
    builder.addCase(updateHoleScore.fulfilled, (state, action) => {
      const { roundId, holeScore } = action.payload;
      
      // Update in active round
      if (state.activeRound && state.activeRound.id === roundId && state.activeRound.holeScores) {
        const index = state.activeRound.holeScores.findIndex(score => score.id === holeScore.id);
        if (index >= 0) {
          state.activeRound.holeScores[index] = holeScore;
        }
      }
      
      // Update in selected round
      if (state.selectedRound && state.selectedRound.id === roundId && state.selectedRound.holeScores) {
        const index = state.selectedRound.holeScores.findIndex(score => score.id === holeScore.id);
        if (index >= 0) {
          state.selectedRound.holeScores[index] = holeScore;
        }
      }
    });
    builder.addCase(updateHoleScore.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Fetch hole scores
    builder.addCase(fetchHoleScores.fulfilled, (state, action) => {
      const { roundId, scores } = action.payload;
      
      // Update active round
      if (state.activeRound && state.activeRound.id === roundId) {
        state.activeRound.holeScores = scores;
      }
      
      // Update selected round
      if (state.selectedRound && state.selectedRound.id === roundId) {
        state.selectedRound.holeScores = scores;
      }
    });
    builder.addCase(fetchHoleScores.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Delete round
    builder.addCase(deleteRound.fulfilled, (state, action) => {
      const deletedRoundId = action.payload;
      
      // Clear active round if it was deleted
      if (state.activeRound && state.activeRound.id === deletedRoundId) {
        state.activeRound = null;
      }
      
      // Clear selected round if it was deleted
      if (state.selectedRound && state.selectedRound.id === deletedRoundId) {
        state.selectedRound = null;
      }
      
      // Remove from history
      state.roundHistory = state.roundHistory.filter(round => round.id !== deletedRoundId);
    });
    builder.addCase(deleteRound.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Create and start round (enhanced)
    builder.addCase(createAndStartRound.pending, (state) => {
      state.isStarting = true;
      state.error = null;
    });
    builder.addCase(createAndStartRound.fulfilled, (state, action) => {
      state.isStarting = false;
      state.activeRound = action.payload;
      state.error = null;
    });
    builder.addCase(createAndStartRound.rejected, (state, action) => {
      state.isStarting = false;
      const payload = action.payload as any;
      
      if (payload?.code === 409) {
        state.error = 'You already have an active round. Please complete or abandon it first.';
      } else if (payload?.code && payload.code >= 500) {
        state.error = 'Server error occurred. Please try again later.';
      } else {
        state.error = payload?.message || 'Failed to create and start round';
      }
    });

    // Complete hole
    builder.addCase(completeHole.pending, (state) => {
      state.isUpdating = true;
      state.error = null;
    });
    builder.addCase(completeHole.fulfilled, (state, action) => {
      state.isUpdating = false;
      const { holeScore, roundId } = action.payload;
      
      // Update active round if it matches
      if (state.activeRound && state.activeRound.id === roundId) {
        if (!state.activeRound.holeScores) {
          state.activeRound.holeScores = [];
        }
        
        // Remove existing hole score for this hole if it exists
        state.activeRound.holeScores = state.activeRound.holeScores.filter(
          hs => hs.holeNumber !== holeScore.holeNumber
        );
        
        // Add the new hole score
        state.activeRound.holeScores.push(holeScore);
        
        // Update current hole to next hole
        const maxHoles = state.activeRound.course?.totalHoles || 18;
        if (holeScore.holeNumber < maxHoles) {
          state.dashboardState.currentHole = holeScore.holeNumber + 1;
        }
        
        // Recalculate total score
        state.activeRound.totalScore = state.activeRound.holeScores.reduce(
          (total, hs) => total + hs.score, 0
        );
      }
    });
    builder.addCase(completeHole.rejected, (state, action) => {
      state.isUpdating = false;
      state.error = action.payload as string;
    });

    // Update hole par
    builder.addCase(updateHolePar.fulfilled, (state, action) => {
      const { courseId, holeNumber, par } = action.payload;
      
      // Update hole par in active round if it matches the course
      if (state.activeRound && state.activeRound.courseId === courseId) {
        const hole = state.activeRound.course?.holes?.find(h => h.holeNumber === holeNumber);
        if (hole) {
          hole.par = par;
        }
      }
    });
    builder.addCase(updateHolePar.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const {
  clearError,
  clearActiveRound,
  clearSelectedRound,
  clearRoundHistory,
  setLastSyncTime,
  resetRoundState,
  setErrorWithContext,
  clearErrorAndRefresh,
  forceRefreshActiveRound,
  optimisticUpdateHoleScore,
  setCurrentHole,
  setShowScoreModal,
  setLocationTracking,
  setLastLocationUpdate,
  setRoundTimer,
} = roundSlice.actions;

export default roundSlice.reducer;