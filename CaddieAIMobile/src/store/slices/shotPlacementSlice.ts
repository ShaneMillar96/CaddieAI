import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { 
  shotPlacementService, 
  ShotPlacementData, 
  ShotPlacementState as ServiceShotPlacementState,
  ShotPlacementCoordinates
} from '../../services/ShotPlacementService';

// Redux state interface
export interface ShotPlacementState {
  // Current shot placement data
  currentShot: ShotPlacementData | null;
  
  // Service state
  serviceState: ServiceShotPlacementState;
  
  // UI state
  isActive: boolean;
  isPlacingShot: boolean;
  showDistanceMeasurement: boolean;
  
  // Target and distance information  
  targetLocation: ShotPlacementCoordinates | null;
  distanceToPin: number;
  distanceFromCurrentLocation: number;
  clubRecommendation: string | null;
  
  // Round progression context
  currentHole: number;
  pinLocation: { latitude: number; longitude: number } | null;
  
  // Loading states
  isCreatingShot: boolean;
  isActivatingShot: boolean;
  
  // Error handling
  error: string | null;
  
  // Configuration
  config: {
    movementThresholdMeters: number;
    shotCompletionTimeoutMs: number;
    showYardageOverlay: boolean;
    voiceGuidanceEnabled: boolean;
  };
}

const initialState: ShotPlacementState = {
  currentShot: null,
  serviceState: ServiceShotPlacementState.INACTIVE,
  isActive: false,
  isPlacingShot: false,
  showDistanceMeasurement: true,
  targetLocation: null,
  distanceToPin: 0,
  distanceFromCurrentLocation: 0,
  clubRecommendation: null,
  currentHole: 1,
  pinLocation: null,
  isCreatingShot: false,
  isActivatingShot: false,
  error: null,
  config: {
    movementThresholdMeters: 10,
    shotCompletionTimeoutMs: 30000,
    showYardageOverlay: true,
    voiceGuidanceEnabled: true,
  },
};

// Async thunks for shot placement operations

/**
 * Create a new shot placement at the specified coordinates
 */
export const createShotPlacement = createAsyncThunk(
  'shotPlacement/createShotPlacement',
  async (payload: {
    coordinates: { latitude: number; longitude: number };
    pinLocation?: { latitude: number; longitude: number };
    currentHole?: number;
  }, { rejectWithValue }) => {
    try {
      const { coordinates, pinLocation, currentHole } = payload;
      const shotData = await shotPlacementService.createShotPlacement(
        coordinates, 
        pinLocation, 
        currentHole
      );
      return shotData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create shot placement');
    }
  }
);

/**
 * Activate the current shot placement (user is ready to take shot)
 */
export const activateShotPlacement = createAsyncThunk(
  'shotPlacement/activateShotPlacement',
  async (_, { rejectWithValue }) => {
    try {
      shotPlacementService.activateShotPlacement();
      return shotPlacementService.getCurrentShotPlacement();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to activate shot placement');
    }
  }
);

/**
 * Cancel the current shot placement
 */
export const cancelShotPlacement = createAsyncThunk(
  'shotPlacement/cancelShotPlacement',
  async (_, { rejectWithValue }) => {
    try {
      shotPlacementService.cancelShotPlacement();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel shot placement');
    }
  }
);

/**
 * Update service configuration
 */
export const updateShotPlacementConfig = createAsyncThunk(
  'shotPlacement/updateConfig',
  async (configUpdate: Partial<ShotPlacementState['config']>, { rejectWithValue }) => {
    try {
      // Update service configuration if applicable
      const serviceConfig: any = {};
      if (configUpdate.movementThresholdMeters !== undefined) {
        serviceConfig.movementThresholdMeters = configUpdate.movementThresholdMeters;
      }
      if (configUpdate.shotCompletionTimeoutMs !== undefined) {
        serviceConfig.shotCompletionTimeoutMs = configUpdate.shotCompletionTimeoutMs;
      }
      
      if (Object.keys(serviceConfig).length > 0) {
        shotPlacementService.updateConfig(serviceConfig);
      }
      
      return configUpdate;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update configuration');
    }
  }
);

const shotPlacementSlice = createSlice({
  name: 'shotPlacement',
  initialState,
  reducers: {
    // UI state management
    setPlacingShot: (state, action: PayloadAction<boolean>) => {
      state.isPlacingShot = action.payload;
    },
    
    setShowDistanceMeasurement: (state, action: PayloadAction<boolean>) => {
      state.showDistanceMeasurement = action.payload;
    },
    
    // Target and hole context
    setTargetLocation: (state, action: PayloadAction<ShotPlacementCoordinates>) => {
      state.targetLocation = action.payload;
    },
    
    setPinLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.pinLocation = action.payload;
    },
    
    setCurrentHole: (state, action: PayloadAction<number>) => {
      state.currentHole = action.payload;
    },
    
    // Club recommendation
    setClubRecommendation: (state, action: PayloadAction<string | null>) => {
      state.clubRecommendation = action.payload;
    },
    
    // Service state synchronization
    updateFromService: (state, action: PayloadAction<{
      shotData: ShotPlacementData | null;
      serviceState: ServiceShotPlacementState;
    }>) => {
      const { shotData, serviceState } = action.payload;
      
      state.currentShot = shotData;
      state.serviceState = serviceState;
      state.isActive = serviceState !== ServiceShotPlacementState.INACTIVE;
      
      // Update derived state
      if (shotData) {
        state.distanceToPin = shotData.distanceToPin;
        state.distanceFromCurrentLocation = shotData.distanceFromCurrentLocation;
        state.clubRecommendation = shotData.clubRecommendation || null;
        
        state.targetLocation = {
          latitude: shotData.coordinates.latitude,
          longitude: shotData.coordinates.longitude,
          timestamp: shotData.coordinates.timestamp,
          accuracy: shotData.coordinates.accuracy,
        };
      } else {
        state.distanceToPin = 0;
        state.distanceFromCurrentLocation = 0;
        state.clubRecommendation = null;
        state.targetLocation = null;
      }
      
      // Clear loading states when shot is completed or cancelled
      if (serviceState === ServiceShotPlacementState.SHOT_COMPLETED || 
          serviceState === ServiceShotPlacementState.INACTIVE) {
        state.isCreatingShot = false;
        state.isActivatingShot = false;
        state.isPlacingShot = false;
      }
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    
    // Configuration updates (local only)
    updateConfig: (state, action: PayloadAction<Partial<ShotPlacementState['config']>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    
    // Reset state
    resetShotPlacement: (state) => {
      state.currentShot = null;
      state.serviceState = ServiceShotPlacementState.INACTIVE;
      state.isActive = false;
      state.isPlacingShot = false;
      state.targetLocation = null;
      state.distanceToPin = 0;
      state.distanceFromCurrentLocation = 0;
      state.clubRecommendation = null;
      state.isCreatingShot = false;
      state.isActivatingShot = false;
      state.error = null;
    },
    
    // Quick distance calculation for preview (before creating shot)
    setPreviewDistance: (state, action: PayloadAction<{
      distanceFromCurrent: number;
      distanceToPin: number;
      coordinates: { latitude: number; longitude: number };
    }>) => {
      const { distanceFromCurrent, distanceToPin, coordinates } = action.payload;
      
      state.distanceFromCurrentLocation = distanceFromCurrent;
      state.distanceToPin = distanceToPin;
      
      // Set preview target location
      state.targetLocation = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timestamp: Date.now(),
      };
    },
    
    clearPreview: (state) => {
      if (!state.currentShot) {
        state.targetLocation = null;
        state.distanceFromCurrentLocation = 0;
        state.distanceToPin = 0;
      }
    },
  },
  
  extraReducers: (builder) => {
    // Create shot placement
    builder.addCase(createShotPlacement.pending, (state) => {
      state.isCreatingShot = true;
      state.error = null;
    });
    
    builder.addCase(createShotPlacement.fulfilled, (state, action) => {
      state.isCreatingShot = false;
      state.currentShot = action.payload;
      state.serviceState = ServiceShotPlacementState.SHOT_PLACEMENT;
      state.isActive = true;
      
      // Update UI state
      state.distanceToPin = action.payload.distanceToPin;
      state.distanceFromCurrentLocation = action.payload.distanceFromCurrentLocation;
      state.clubRecommendation = action.payload.clubRecommendation || null;
      
      state.targetLocation = {
        latitude: action.payload.coordinates.latitude,
        longitude: action.payload.coordinates.longitude,
        timestamp: action.payload.coordinates.timestamp,
        accuracy: action.payload.coordinates.accuracy,
      };
    });
    
    builder.addCase(createShotPlacement.rejected, (state, action) => {
      state.isCreatingShot = false;
      state.error = action.payload as string;
    });
    
    // Activate shot placement
    builder.addCase(activateShotPlacement.pending, (state) => {
      state.isActivatingShot = true;
      state.error = null;
    });
    
    builder.addCase(activateShotPlacement.fulfilled, (state, action) => {
      state.isActivatingShot = false;
      state.serviceState = ServiceShotPlacementState.SHOT_IN_PROGRESS;
      
      if (action.payload) {
        state.currentShot = action.payload;
      }
    });
    
    builder.addCase(activateShotPlacement.rejected, (state, action) => {
      state.isActivatingShot = false;
      state.error = action.payload as string;
    });
    
    // Cancel shot placement
    builder.addCase(cancelShotPlacement.fulfilled, (state) => {
      state.currentShot = null;
      state.serviceState = ServiceShotPlacementState.INACTIVE;
      state.isActive = false;
      state.isPlacingShot = false;
      state.targetLocation = null;
      state.distanceToPin = 0;
      state.distanceFromCurrentLocation = 0;
      state.clubRecommendation = null;
      state.isCreatingShot = false;
      state.isActivatingShot = false;
    });
    
    builder.addCase(cancelShotPlacement.rejected, (state, action) => {
      state.error = action.payload as string;
    });
    
    // Update configuration
    builder.addCase(updateShotPlacementConfig.fulfilled, (state, action) => {
      state.config = { ...state.config, ...action.payload };
    });
    
    builder.addCase(updateShotPlacementConfig.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

// Export actions
export const {
  setPlacingShot,
  setShowDistanceMeasurement,
  setTargetLocation,
  setPinLocation,
  setCurrentHole,
  setClubRecommendation,
  updateFromService,
  clearError,
  setError,
  updateConfig,
  resetShotPlacement,
  setPreviewDistance,
  clearPreview,
} = shotPlacementSlice.actions;

// Export reducer
export default shotPlacementSlice.reducer;

// Selectors
export const selectShotPlacementState = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement;

export const selectCurrentShot = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.currentShot;

export const selectIsActive = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.isActive;

export const selectTargetLocation = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.targetLocation;

export const selectDistances = createSelector(
  [(state: { shotPlacement: ShotPlacementState }) => state.shotPlacement.distanceToPin,
   (state: { shotPlacement: ShotPlacementState }) => state.shotPlacement.distanceFromCurrentLocation],
  (toPin, fromCurrent) => ({
    toPin,
    fromCurrent,
  })
);

export const selectClubRecommendation = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.clubRecommendation;

export const selectIsPlacingShot = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.isPlacingShot;

export const selectServiceState = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.serviceState;

export const selectShotPlacementConfig = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.config;