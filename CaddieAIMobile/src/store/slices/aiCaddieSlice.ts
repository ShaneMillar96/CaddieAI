import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { apiService } from '../../services/ApiService';

// AI Caddie related types
export interface ShotType {
  type: 'tee_shot' | 'approach' | 'chip' | 'bunker' | 'putt';
  confidence: number;
  distance?: number;
  position?: {
    latitude: number;
    longitude: number;
  };
  conditions?: {
    wind?: string;
    weather?: string;
    elevation?: number;
  };
}

export interface VoiceSessionState {
  sessionId: string | null;
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export interface UserSkillContext {
  skillLevel: number;
  handicap?: number;
  preferences?: Record<string, any>;
  playingStyle?: Record<string, any>;
}

export interface AICaddieAdvice {
  id: string;
  message: string;
  timestamp: string;
  shotType?: ShotType;
  clubRecommendation?: string;
  confidence: number;
  audioUrl?: string;
}

export interface AICaddieState {
  voiceSession: VoiceSessionState;
  shotTypeRecognition: {
    currentShot: ShotType | null;
    isDetecting: boolean;
    history: ShotType[];
  };
  userSkillContext: UserSkillContext | null;
  adviceHistory: AICaddieAdvice[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AICaddieState = {
  voiceSession: {
    sessionId: null,
    isActive: false,
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    error: null,
  },
  shotTypeRecognition: {
    currentShot: null,
    isDetecting: false,
    history: [],
  },
  userSkillContext: null,
  adviceHistory: [],
  isInitialized: false,
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const initializeVoiceSession = createAsyncThunk(
  'aiCaddie/initializeVoiceSession',
  async (params: { userId: string; roundId?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('ai-caddie/voice-session', params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initialize voice session');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const analyzeShot = createAsyncThunk(
  'aiCaddie/analyzeShot',
  async (params: {
    userId: string;
    roundId?: number;
    position: { latitude: number; longitude: number };
    shotContext?: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('ai-caddie/analyze-shot', params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to analyze shot');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchUserContext = createAsyncThunk(
  'aiCaddie/fetchUserContext',
  async (userId: string, { rejectWithValue }) => {
    try {
      console.log('🔄 fetchUserContext: Requesting user context for userId:', userId);
      const response = await apiService.get(`ai-caddie/user-context/${userId}`);

      console.log('🔄 fetchUserContext: API response:', response);

      if (!response.success) {
        console.warn('⚠️ fetchUserContext: API returned unsuccessful response:', response.message);
        throw new Error(response.message || 'Failed to fetch user context');
      }

      // Validate and normalize the response data
      const userData = response.data;
      if (!userData) {
        console.warn('⚠️ fetchUserContext: No data in response, using defaults');
        return createDefaultUserContext();
      }

      console.log('🔍 fetchUserContext: Raw API response data structure:', {
        hasSkillLevel: !!userData.skillLevel,
        skillLevelType: typeof userData.skillLevel,
        skillLevelValue: userData.skillLevel,
        skillLevelId: userData.skillLevel?.id,
        skillLevelName: userData.skillLevel?.name,
        handicap: userData.handicap,
        preferences: userData.preferences
      });

      // Extract skill level ID - handle both nested object and direct number formats
      let extractedSkillLevel: number;
      if (typeof userData.skillLevel === 'object' && userData.skillLevel !== null) {
        // API returns skillLevel as object with id property (SkillLevelDto)
        extractedSkillLevel = userData.skillLevel.id;
        console.log('🎯 fetchUserContext: Extracted skill level from nested object:', extractedSkillLevel);
      } else if (typeof userData.skillLevel === 'number') {
        // API returns skillLevel as direct number
        extractedSkillLevel = userData.skillLevel;
        console.log('🎯 fetchUserContext: Using direct skill level number:', extractedSkillLevel);
      } else {
        // Fallback to default
        extractedSkillLevel = 2; // Default to Intermediate
        console.warn('⚠️ fetchUserContext: Unable to extract skill level, using default:', extractedSkillLevel);
      }

      // Validate skill level
      const validSkillLevels = [1, 2, 3, 4]; // Beginner, Intermediate, Advanced, Professional
      const normalizedData: UserSkillContext = {
        skillLevel: validSkillLevels.includes(extractedSkillLevel) ? extractedSkillLevel : 2, // Default to Intermediate if invalid
        handicap: typeof userData.handicap === 'number' ? userData.handicap : 15, // Default handicap
        preferences: userData.preferences || {},
        playingStyle: userData.playingStyle || {},
      };

      console.log('✅ fetchUserContext: Normalized user context:', normalizedData);
      return normalizedData;

    } catch (error) {
      console.error('❌ fetchUserContext: Error fetching user context:', error);
      
      // Return default context instead of rejecting to prevent UI from breaking
      const defaultContext = createDefaultUserContext();
      console.log('🔄 fetchUserContext: Using default context due to error:', defaultContext);
      return defaultContext;
    }
  }
);

// Helper function to create default user context
function createDefaultUserContext(): UserSkillContext {
  return {
    skillLevel: 2, // Intermediate
    handicap: 15, // Average handicap
    preferences: {},
    playingStyle: {},
  };
}

const aiCaddieSlice = createSlice({
  name: 'aiCaddie',
  initialState,
  reducers: {
    // Voice session actions
    startVoiceSession: (state, action: PayloadAction<string>) => {
      state.voiceSession.sessionId = action.payload;
      state.voiceSession.isActive = true;
      state.voiceSession.error = null;
    },
    endVoiceSession: (state) => {
      state.voiceSession.sessionId = null;
      state.voiceSession.isActive = false;
      state.voiceSession.isListening = false;
      state.voiceSession.isProcessing = false;
      state.voiceSession.isSpeaking = false;
    },
    setVoiceListening: (state, action: PayloadAction<boolean>) => {
      state.voiceSession.isListening = action.payload;
      if (action.payload) {
        state.voiceSession.isProcessing = false;
        state.voiceSession.isSpeaking = false;
      }
    },
    setVoiceProcessing: (state, action: PayloadAction<boolean>) => {
      state.voiceSession.isProcessing = action.payload;
      if (action.payload) {
        state.voiceSession.isListening = false;
        state.voiceSession.isSpeaking = false;
      }
    },
    setVoiceSpeaking: (state, action: PayloadAction<boolean>) => {
      state.voiceSession.isSpeaking = action.payload;
      if (action.payload) {
        state.voiceSession.isListening = false;
        state.voiceSession.isProcessing = false;
      }
    },
    setVoiceError: (state, action: PayloadAction<string | null>) => {
      state.voiceSession.error = action.payload;
    },

    // Shot type recognition actions
    startShotDetection: (state) => {
      state.shotTypeRecognition.isDetecting = true;
      state.shotTypeRecognition.currentShot = null;
    },
    setShotType: (state, action: PayloadAction<ShotType>) => {
      state.shotTypeRecognition.currentShot = action.payload;
      state.shotTypeRecognition.isDetecting = false;
      state.shotTypeRecognition.history.push(action.payload);
      
      // Keep only last 10 shots in history
      if (state.shotTypeRecognition.history.length > 10) {
        state.shotTypeRecognition.history = state.shotTypeRecognition.history.slice(-10);
      }
    },
    clearShotType: (state) => {
      state.shotTypeRecognition.currentShot = null;
      state.shotTypeRecognition.isDetecting = false;
    },

    // User skill context actions
    setUserSkillContext: (state, action: PayloadAction<UserSkillContext>) => {
      state.userSkillContext = action.payload;
    },

    // Advice history actions
    addAdvice: (state, action: PayloadAction<AICaddieAdvice>) => {
      state.adviceHistory.unshift(action.payload);
      
      // Keep only last 50 advice entries
      if (state.adviceHistory.length > 50) {
        state.adviceHistory = state.adviceHistory.slice(0, 50);
      }
    },
    clearAdviceHistory: (state) => {
      state.adviceHistory = [];
    },

    // General actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.voiceSession.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize voice session
    builder
      .addCase(initializeVoiceSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeVoiceSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.voiceSession.sessionId = action.payload.sessionId;
        state.voiceSession.isActive = true;
        state.isInitialized = true;
      })
      .addCase(initializeVoiceSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Analyze shot
    builder
      .addCase(analyzeShot.pending, (state) => {
        state.shotTypeRecognition.isDetecting = true;
      })
      .addCase(analyzeShot.fulfilled, (state, action) => {
        const { shotType, advice } = action.payload;
        
        if (shotType) {
          state.shotTypeRecognition.currentShot = shotType;
          state.shotTypeRecognition.history.push(shotType);
          
          if (state.shotTypeRecognition.history.length > 10) {
            state.shotTypeRecognition.history = state.shotTypeRecognition.history.slice(-10);
          }
        }
        
        if (advice) {
          state.adviceHistory.unshift(advice);
          
          if (state.adviceHistory.length > 50) {
            state.adviceHistory = state.adviceHistory.slice(0, 50);
          }
        }
        
        state.shotTypeRecognition.isDetecting = false;
      })
      .addCase(analyzeShot.rejected, (state, action) => {
        state.shotTypeRecognition.isDetecting = false;
        state.error = action.payload as string;
      });

    // Fetch user context
    builder
      .addCase(fetchUserContext.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserContext.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSkillContext = action.payload;
        state.error = null; // Clear any previous errors
        console.log('✅ aiCaddieSlice: User context updated:', action.payload);
      })
      .addCase(fetchUserContext.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Set fallback context even on rejection to prevent UI breaking
        state.userSkillContext = {
          skillLevel: 2, // Intermediate
          handicap: 15, // Average handicap
          preferences: {},
          playingStyle: {},
        };
        console.warn('⚠️ aiCaddieSlice: User context fetch rejected, using fallback:', state.userSkillContext);
      });
  },
});

// Export actions
export const {
  startVoiceSession,
  endVoiceSession,
  setVoiceListening,
  setVoiceProcessing,
  setVoiceSpeaking,
  setVoiceError,
  startShotDetection,
  setShotType,
  clearShotType,
  setUserSkillContext,
  addAdvice,
  clearAdviceHistory,
  setError,
  setInitialized,
  clearError,
} = aiCaddieSlice.actions;

// Selectors
export const selectAICaddieState = (state: RootState) => state.aiCaddie;
export const selectVoiceSession = (state: RootState) => state.aiCaddie.voiceSession;
export const selectShotTypeRecognition = (state: RootState) => state.aiCaddie.shotTypeRecognition;
export const selectUserSkillContext = (state: RootState) => state.aiCaddie.userSkillContext;
export const selectAdviceHistory = (state: RootState) => state.aiCaddie.adviceHistory;
export const selectIsVoiceActive = (state: RootState) => state.aiCaddie.voiceSession.isActive;
export const selectCurrentShotType = (state: RootState) => state.aiCaddie.shotTypeRecognition.currentShot;

export default aiCaddieSlice.reducer;