import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { 
  shotPlacementService, 
  ShotPlacementData, 
  ShotPlacementState as ServiceShotPlacementState,
  ShotPlacementCoordinates
} from '../../services/ShotPlacementService';
import { SkillLevel, WeatherData } from '../../types';
import { getSkillBasedDistanceSuggestions, validateDistanceForSkillLevel } from '../../services/SkillBasedAdviceEngine';
import { dynamicCaddieService } from '../../services/DynamicCaddieService';
import type { RootState } from '../index';

// =============================================================================
// AI ANALYSIS INTERFACES
// =============================================================================

/**
 * Weather conditions interface for shot analysis
 */
export interface WeatherConditions {
  conditions: string;
  windSpeed: number;
  windDirection: string;
  temperature: number;
}

/**
 * Shot analysis interface for AI-powered recommendations
 */
export interface ShotAnalysis {
  recommendedClub: string;
  shotTips: string[];
  weatherConditions?: WeatherConditions;
  confidenceScore?: number;
}

// =============================================================================
// REDUX STATE INTERFACE
// =============================================================================

/**
 * Enhanced shot placement state with AI analysis capabilities
 */
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
  distanceToPin: number; // Distance to pin in yards
  distanceFromCurrentLocation: number; // Distance from current location in yards
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
  
  // Skill-based suggestions
  skillSuggestions: {
    suggestedDistances: number[];
    clubSuggestions: string[];
    validationMessage: string | null;
    isDistanceRealistic: boolean;
  } | null;
  
  // AI Analysis state
  aiAnalysis: ShotAnalysis | null;
  isAnalysisLoading: boolean;
  analysisError: string | null;
  showAnalysisBox: boolean;
  
  // Weather data cache
  weatherData: WeatherConditions | null;
  weatherLastUpdated: number | null;
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
  skillSuggestions: null,
  // AI Analysis initial state
  aiAnalysis: null,
  isAnalysisLoading: false,
  analysisError: null,
  showAnalysisBox: false,
  // Weather data initial state
  weatherData: null,
  weatherLastUpdated: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Create a new shot placement with skill-based validation and AI integration
 */
export const createShotPlacement = createAsyncThunk(
  'shotPlacement/createShotPlacement',
  async (payload: {
    coordinates: { latitude: number; longitude: number };
    pinLocation?: { latitude: number; longitude: number };
    currentHole?: number;
    skillLevel?: SkillLevel;
    userId?: number;
    roundId?: number;
  }, { rejectWithValue, getState }) => {
    try {
      const { coordinates, pinLocation, currentHole, skillLevel, userId, roundId } = payload;
      
      // Create shot placement through service
      const shotData = await shotPlacementService.createShotPlacement(
        coordinates, 
        pinLocation, 
        currentHole
      );
      
      // Trigger AI analysis if user context is available
      if (userId && skillLevel && shotData.distanceFromCurrentLocation > 0) {
        // Validate distance for skill level
        const validation = validateDistanceForSkillLevel(
          Math.round(shotData.distanceFromCurrentLocation * 1.094), // Convert meters to yards
          skillLevel,
          'approach'
        );
        
        // Generate AI club recommendation with voice
        try {
          await dynamicCaddieService.generateClubRecommendation(
            userId,
            roundId || 0,
            Math.round(shotData.distanceFromCurrentLocation * 1.094), // Convert meters to yards
            undefined, // conditions
            currentHole,
            undefined, // player club distances
            8 // High priority for shot placement
          );
        } catch (aiError) {
          console.warn('AI club recommendation failed:', aiError);
        }
        
        return {
          ...shotData,
          skillValidation: validation
        };
      }
      
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
 * Generate AI-powered shot analysis
 */
export const generateShotAnalysis = createAsyncThunk(
  'shotPlacement/generateShotAnalysis',
  async (payload: {
    distanceYards: number;
    location: { latitude: number; longitude: number };
    userId: number;
    roundId: number;
    currentHole: number;
    skillLevel?: string;
  }, { rejectWithValue, getState }) => {
    try {
      const { distanceYards, location, userId, roundId, currentHole, skillLevel } = payload;
      const state = getState() as RootState;
      
      // Get weather conditions from cache or use defaults
      const weatherData = state.shotPlacement.weatherData;
      const conditions = weatherData ? {
        windSpeedMph: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        temperature: weatherData.temperature
      } : undefined;
      
      console.log('🧠 generateShotAnalysis: Calling DynamicCaddieService with enhanced analysis');
      
      // Call enhanced shot analysis method from DynamicCaddieService
      const analysis = await dynamicCaddieService.generateShotAnalysis(
        distanceYards,
        location,
        skillLevel || 'intermediate',
        roundId,
        userId,
        currentHole,
        conditions
      );
      
      console.log('✅ generateShotAnalysis: Analysis completed:', analysis);
      return analysis;
      
    } catch (error: any) {
      console.error('❌ generateShotAnalysis: Error occurred:', error);
      
      // Provide fallback analysis if AI fails
      const fallbackAnalysis: ShotAnalysis = {
        recommendedClub: payload.distanceYards > 150 ? '7-Iron' : 'Pitching Wedge',
        shotTips: [
          `${payload.distanceYards} yards to target`,
          'Aim for center of green',
          'Check wind and pin position'
        ],
        confidenceScore: 0.75
      };
      
      return fallbackAnalysis;
    }
  }
);

/**
 * Fetch weather data for shot analysis
 */
export const fetchWeatherData = createAsyncThunk(
  'shotPlacement/fetchWeatherData',
  async (location: { latitude: number; longitude: number }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const { weatherData, weatherLastUpdated } = state.shotPlacement;
      
      // Check if cached weather data is still valid (5 minutes)
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = Date.now();
      
      if (weatherData && weatherLastUpdated && (now - weatherLastUpdated) < CACHE_DURATION) {
        return weatherData;
      }
      
      // TODO: Replace with actual weather API integration
      // For now, return mock weather data
      const mockWeatherData: WeatherConditions = {
        conditions: 'Partly Cloudy',
        windSpeed: 8,
        windDirection: 'SW',
        temperature: 22
      };
      
      return mockWeatherData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weather data');
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
      state.skillSuggestions = null;
      // Clear AI analysis when resetting shot placement
      state.aiAnalysis = null;
      state.analysisError = null;
      state.showAnalysisBox = false;
      state.isAnalysisLoading = false;
    },
    
    // Quick distance calculation for preview with skill-based suggestions
    setPreviewDistance: (state, action: PayloadAction<{
      distanceFromCurrent: number;
      distanceToPin: number;
      coordinates: { latitude: number; longitude: number };
      skillLevel?: SkillLevel;
    }>) => {
      const { distanceFromCurrent, distanceToPin, coordinates, skillLevel } = action.payload;
      
      state.distanceFromCurrentLocation = distanceFromCurrent;
      state.distanceToPin = distanceToPin;
      
      // Set preview target location
      state.targetLocation = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timestamp: Date.now(),
      };
      
      // Generate skill-based suggestions if skill level provided
      if (skillLevel && distanceFromCurrent > 0) {
        const distanceYards = Math.round(distanceFromCurrent * 1.094); // Convert meters to yards
        const suggestions = getSkillBasedDistanceSuggestions(skillLevel, 'approach');
        const validation = validateDistanceForSkillLevel(distanceYards, skillLevel, 'approach');
        
        state.skillSuggestions = {
          suggestedDistances: suggestions.typical,
          clubSuggestions: suggestions.clubSuggestions,
          validationMessage: validation.suggestion || null,
          isDistanceRealistic: validation.isRealistic
        };
      }
    },
    
    clearPreview: (state) => {
      if (!state.currentShot) {
        state.targetLocation = null;
        state.distanceFromCurrentLocation = 0;
        state.distanceToPin = 0;
        state.skillSuggestions = null;
      }
    },
    
    // Update skill suggestions manually
    updateSkillSuggestions: (state, action: PayloadAction<{
      skillLevel: SkillLevel;
      distance: number;
      shotType?: 'tee' | 'approach' | 'short';
    }>) => {
      const { skillLevel, distance, shotType = 'approach' } = action.payload;
      
      const suggestions = getSkillBasedDistanceSuggestions(skillLevel, shotType);
      const validation = validateDistanceForSkillLevel(distance, skillLevel, shotType);
      
      state.skillSuggestions = {
        suggestedDistances: suggestions.typical,
        clubSuggestions: suggestions.clubSuggestions,
        validationMessage: validation.suggestion || null,
        isDistanceRealistic: validation.isRealistic
      };
    },
    
    clearSkillSuggestions: (state) => {
      state.skillSuggestions = null;
    },
    
    // AI Analysis actions
    setShowAnalysisBox: (state, action: PayloadAction<boolean>) => {
      state.showAnalysisBox = action.payload;
    },
    
    clearAnalysis: (state) => {
      state.aiAnalysis = null;
      state.analysisError = null;
      state.showAnalysisBox = false;
    },
    
    setAnalysisError: (state, action: PayloadAction<string>) => {
      state.analysisError = action.payload;
      state.isAnalysisLoading = false;
    },
    
    cacheWeatherData: (state, action: PayloadAction<WeatherConditions>) => {
      state.weatherData = action.payload;
      state.weatherLastUpdated = Date.now();
    },
    
    clearWeatherCache: (state) => {
      state.weatherData = null;
      state.weatherLastUpdated = null;
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
      
      // Handle enhanced payload with skill validation
      const payload = action.payload as any;
      const shotData = payload.skillValidation ? 
        { ...payload, skillValidation: undefined } : payload;
        
      state.currentShot = shotData;
      state.serviceState = ServiceShotPlacementState.SHOT_PLACEMENT;
      state.isActive = true;
      
      // Update UI state
      state.distanceToPin = shotData.distanceToPin;
      state.distanceFromCurrentLocation = shotData.distanceFromCurrentLocation;
      state.clubRecommendation = shotData.clubRecommendation || null;
      
      state.targetLocation = {
        latitude: shotData.coordinates.latitude,
        longitude: shotData.coordinates.longitude,
        timestamp: shotData.coordinates.timestamp,
        accuracy: shotData.coordinates.accuracy,
      };
      
      // Update skill validation message if available
      if (payload.skillValidation) {
        const validation = payload.skillValidation;
        if (state.skillSuggestions) {
          state.skillSuggestions.validationMessage = validation.suggestion || null;
          state.skillSuggestions.isDistanceRealistic = validation.isRealistic;
        }
      }
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
      // Clear AI analysis when cancelling shot placement
      state.aiAnalysis = null;
      state.analysisError = null;
      state.showAnalysisBox = false;
      state.isAnalysisLoading = false;
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
    
    // Generate shot analysis
    builder.addCase(generateShotAnalysis.pending, (state) => {
      state.isAnalysisLoading = true;
      state.analysisError = null;
    });
    
    builder.addCase(generateShotAnalysis.fulfilled, (state, action) => {
      state.isAnalysisLoading = false;
      state.aiAnalysis = action.payload;
      state.showAnalysisBox = true;
    });
    
    builder.addCase(generateShotAnalysis.rejected, (state, action) => {
      state.isAnalysisLoading = false;
      state.analysisError = action.payload as string;
      // Show analysis box with error for user feedback
      state.showAnalysisBox = true;
    });
    
    // Fetch weather data
    builder.addCase(fetchWeatherData.fulfilled, (state, action) => {
      state.weatherData = action.payload;
      state.weatherLastUpdated = Date.now();
      
      // Update existing analysis with weather data if available
      if (state.aiAnalysis) {
        state.aiAnalysis = {
          ...state.aiAnalysis,
          weatherConditions: action.payload
        };
      }
    });
    
    builder.addCase(fetchWeatherData.rejected, (state, action) => {
      // Weather fetch failure doesn't break the flow
      console.warn('Weather fetch failed:', action.payload);
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
  updateSkillSuggestions,
  clearSkillSuggestions,
  // AI Analysis actions
  setShowAnalysisBox,
  clearAnalysis,
  setAnalysisError,
  cacheWeatherData,
  clearWeatherCache,
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

export const selectSkillSuggestions = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.skillSuggestions;

// AI Analysis selectors
export const selectAIAnalysis = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.aiAnalysis;

export const selectIsAnalysisLoading = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.isAnalysisLoading;

export const selectAnalysisError = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.analysisError;

export const selectShowAnalysisBox = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.showAnalysisBox;

export const selectWeatherData = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.weatherData;

export const selectWeatherLastUpdated = (state: { shotPlacement: ShotPlacementState }) => 
  state.shotPlacement.weatherLastUpdated;

// Enhanced selector for skill-aware shot placement
export const selectSkillAwareShotPlacement = createSelector(
  [
    (state: RootState) => state.shotPlacement.currentShot,
    (state: RootState) => state.shotPlacement.skillSuggestions,
    (state: RootState) => state.shotPlacement.distanceFromCurrentLocation,
    (state: RootState) => state.aiCaddie.userSkillContext?.skillLevel
  ],
  (currentShot, skillSuggestions, distance, skillLevel) => ({
    currentShot,
    skillSuggestions,
    distance,
    skillLevel,
    hasSkillValidation: !!skillSuggestions,
    isDistanceAppropriate: skillSuggestions?.isDistanceRealistic ?? true,
  })
);

// Enhanced AI analysis selector with complete context
export const selectAIAnalysisWithContext = createSelector(
  [
    (state: RootState) => state.shotPlacement.aiAnalysis,
    (state: RootState) => state.shotPlacement.isAnalysisLoading,
    (state: RootState) => state.shotPlacement.analysisError,
    (state: RootState) => state.shotPlacement.showAnalysisBox,
    (state: RootState) => state.shotPlacement.weatherData,
    (state: RootState) => state.shotPlacement.distanceFromCurrentLocation
  ],
  (analysis, isLoading, error, showBox, weather, distance) => ({
    analysis,
    isLoading,
    error,
    showBox,
    weatherData: weather,
    distanceYards: Math.round(distance * 1.094), // Convert meters to yards
    hasAnalysis: !!analysis,
    isReady: !isLoading && !error && !!analysis
  })
);

// Weather cache validity selector
export const selectIsWeatherCacheValid = createSelector(
  [
    (state: RootState) => state.shotPlacement.weatherData,
    (state: RootState) => state.shotPlacement.weatherLastUpdated
  ],
  (weatherData, lastUpdated) => {
    if (!weatherData || !lastUpdated) return false;
    
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    return (now - lastUpdated) < CACHE_DURATION;
  }
);