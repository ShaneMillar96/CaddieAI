import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { voiceAIApiService, VoiceAIRequest } from '../../services/voiceAIApi';

export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isVoice: boolean;
  confidence?: number;
}

export interface VoiceState {
  // Voice interface state
  isVoiceInterfaceVisible: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentRecognizedText: string;
  lastError: string | null;

  // Conversation state
  conversationHistory: ConversationMessage[];
  currentSessionId: string | null;
  lastResponse: string | null;
  responseConfidence: number;

  // Location context
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;

  // Map-specific state
  mapState: {
    targetPin: {
      latitude: number;
      longitude: number;
      distanceYards: number;
      bearing: number;
      timestamp: number;
    } | null;
    mapType: 'standard' | 'satellite' | 'hybrid' | 'terrain';
    showDistanceBadge: boolean;
    lastTargetUpdate: string | null;
    courseRegion: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    } | null;
  };

  // Usage statistics
  sessionStartTime: string | null;
  totalTokensUsed: number;
  totalMessagesExchanged: number;
  estimatedSessionCost: number;

  // Settings
  voiceSettings: {
    autoPlayResponses: boolean;
    speechRate: number;
    speechPitch: number;
    language: string;
    maxConversationHistory: number;
  };

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const initialState: VoiceState = {
  // Voice interface state
  isVoiceInterfaceVisible: false,
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  currentRecognizedText: '',
  lastError: null,

  // Conversation state
  conversationHistory: [],
  currentSessionId: null,
  lastResponse: null,
  responseConfidence: 0,

  // Location context
  currentLocation: null,

  // Map-specific state
  mapState: {
    targetPin: null,
    mapType: 'satellite',
    showDistanceBadge: false,
    lastTargetUpdate: null,
    courseRegion: null,
  },

  // Usage statistics
  sessionStartTime: null,
  totalTokensUsed: 0,
  totalMessagesExchanged: 0,
  estimatedSessionCost: 0,

  // Settings
  voiceSettings: {
    autoPlayResponses: true,
    speechRate: 0.5,
    speechPitch: 1.0,
    language: 'en-US',
    maxConversationHistory: 20,
  },

  // Loading states
  isLoading: false,
  error: null,
};

// Async thunks
export const processVoiceInput = createAsyncThunk(
  'voice/processVoiceInput',
  async (request: VoiceAIRequest, { rejectWithValue }) => {
    try {
      const response = await voiceAIApiService.processVoiceInput(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to process voice input');
    }
  }
);

export const generateHoleCompletion = createAsyncThunk(
  'voice/generateHoleCompletion',
  async (
    request: { userId: number; roundId: number; holeNumber: number; score: number; par: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await voiceAIApiService.generateHoleCompletion(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate hole completion');
    }
  }
);

export const updateLocationContext = createAsyncThunk(
  'voice/updateLocationContext',
  async (
    request: {
      userId: number;
      roundId: number;
      locationContext: {
        latitude: number;
        longitude: number;
        accuracyMeters?: number;
        currentHole?: number;
        distanceToPinMeters?: number;
        distanceToTeeMeters?: number;
        positionOnHole?: string;
        movementSpeedMps?: number;
        withinCourseBoundaries: boolean;
        timestamp: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      await voiceAIApiService.updateLocationContext(request);
      return request.locationContext;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update location context');
    }
  }
);

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    // Voice interface controls
    toggleVoiceInterface: (state) => {
      state.isVoiceInterfaceVisible = !state.isVoiceInterfaceVisible;
      if (state.isVoiceInterfaceVisible && !state.sessionStartTime) {
        state.sessionStartTime = new Date().toISOString();
      }
    },
    
    showVoiceInterface: (state) => {
      state.isVoiceInterfaceVisible = true;
      if (!state.sessionStartTime) {
        state.sessionStartTime = new Date().toISOString();
      }
    },
    
    hideVoiceInterface: (state) => {
      state.isVoiceInterfaceVisible = false;
    },

    // Voice recognition states
    setListening: (state, action: PayloadAction<boolean>) => {
      state.isListening = action.payload;
      if (action.payload) {
        state.currentRecognizedText = '';
        state.lastError = null;
      }
    },

    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },

    setSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isSpeaking = action.payload;
    },

    setRecognizedText: (state, action: PayloadAction<string>) => {
      state.currentRecognizedText = action.payload;
    },

    // Conversation management
    addUserMessage: (state, action: PayloadAction<{
      content: string;
      isVoice: boolean;
    }>) => {
      const message: ConversationMessage = {
        id: `${Date.now()}_user`,
        content: action.payload.content,
        role: 'user',
        timestamp: new Date().toISOString(),
        isVoice: action.payload.isVoice,
      };

      state.conversationHistory.push(message);
      state.totalMessagesExchanged += 1;

      // Limit conversation history
      if (state.conversationHistory.length > state.voiceSettings.maxConversationHistory) {
        state.conversationHistory = state.conversationHistory.slice(-state.voiceSettings.maxConversationHistory);
      }
    },

    addAssistantMessage: (state, action: PayloadAction<{
      content: string;
      confidence: number;
      responseId: string;
      tokenUsage?: number;
      estimatedCost?: number;
    }>) => {
      const message: ConversationMessage = {
        id: action.payload.responseId,
        content: action.payload.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isVoice: true,
        confidence: action.payload.confidence,
      };

      state.conversationHistory.push(message);
      state.lastResponse = action.payload.content;
      state.responseConfidence = action.payload.confidence;
      state.totalMessagesExchanged += 1;

      // Update usage statistics
      if (action.payload.tokenUsage) {
        state.totalTokensUsed += action.payload.tokenUsage;
      }
      if (action.payload.estimatedCost) {
        state.estimatedSessionCost += action.payload.estimatedCost;
      }
    },

    clearConversationHistory: (state) => {
      state.conversationHistory = [];
      state.lastResponse = null;
      state.responseConfidence = 0;
    },

    // Location updates
    updateCurrentLocation: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      accuracy?: number;
      currentHole?: number;
      distanceToPin?: number;
      distanceToTee?: number;
      positionOnHole?: string;
    }>) => {
      console.log('🟣 Redux voiceSlice.updateCurrentLocation: REDUCER TRIGGERED');
      console.log('🟣 Redux voiceSlice.updateCurrentLocation: Action received:', {
        type: action.type,
        payload: action.payload
      });
      console.log('🟣 Redux voiceSlice.updateCurrentLocation: Previous location state:', state.currentLocation);
      console.log('🟣 Redux voiceSlice.updateCurrentLocation: State object before update:', JSON.stringify(state.currentLocation));
      
      // Update the state
      state.currentLocation = action.payload;
      
      console.log('🟢 Redux voiceSlice.updateCurrentLocation: Location state updated to:', state.currentLocation);
      console.log('🟢 Redux voiceSlice.updateCurrentLocation: State object after update:', JSON.stringify(state.currentLocation));
      console.log('🟢 Redux voiceSlice.updateCurrentLocation: Coordinates set to:', {
        latitude: state.currentLocation?.latitude,
        longitude: state.currentLocation?.longitude,
        accuracy: state.currentLocation?.accuracy
      });
    },

    // Map state management
    setTargetPin: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      distanceYards: number;
      bearing: number;
    }>) => {
      state.mapState.targetPin = {
        ...action.payload,
        timestamp: Date.now(),
      };
      state.mapState.showDistanceBadge = true;
      state.mapState.lastTargetUpdate = new Date().toISOString();
    },

    clearTargetPin: (state) => {
      state.mapState.targetPin = null;
      state.mapState.showDistanceBadge = false;
      state.mapState.lastTargetUpdate = null;
    },

    setMapType: (state, action: PayloadAction<'standard' | 'satellite' | 'hybrid' | 'terrain'>) => {
      state.mapState.mapType = action.payload;
    },

    setCourseRegion: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }>) => {
      state.mapState.courseRegion = action.payload;
    },

    toggleDistanceBadge: (state) => {
      state.mapState.showDistanceBadge = !state.mapState.showDistanceBadge;
    },

    // Settings
    updateVoiceSettings: (state, action: PayloadAction<Partial<VoiceState['voiceSettings']>>) => {
      state.voiceSettings = { ...state.voiceSettings, ...action.payload };
    },

    // Session management
    startVoiceSession: (state, action: PayloadAction<{ roundId: number }>) => {
      state.currentSessionId = `session_${action.payload.roundId}_${Date.now()}`;
      state.sessionStartTime = new Date().toISOString();
      state.conversationHistory = [];
      state.totalTokensUsed = 0;
      state.totalMessagesExchanged = 0;
      state.estimatedSessionCost = 0;
      state.error = null;
    },

    endVoiceSession: (state) => {
      state.currentSessionId = null;
      state.sessionStartTime = null;
      state.isVoiceInterfaceVisible = false;
      state.isListening = false;
      state.isProcessing = false;
      state.isSpeaking = false;
    },

    // Error handling
    setVoiceError: (state, action: PayloadAction<string>) => {
      state.lastError = action.payload;
      state.error = action.payload;
      state.isProcessing = false;
      state.isListening = false;
    },

    clearVoiceError: (state) => {
      state.lastError = null;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Process voice input
    builder
      .addCase(processVoiceInput.pending, (state) => {
        state.isLoading = true;
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processVoiceInput.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isProcessing = false;
        
        const response = action.payload;
        
        // Add assistant message
        const message: ConversationMessage = {
          id: response.responseId,
          content: response.message,
          role: 'assistant',
          timestamp: response.generatedAt,
          isVoice: true,
          confidence: response.confidenceScore,
        };

        state.conversationHistory.push(message);
        state.lastResponse = response.message;
        state.responseConfidence = response.confidenceScore;
        state.totalMessagesExchanged += 1;

        // Update usage statistics if available
        if (response.tokenUsage) {
          state.totalTokensUsed += response.tokenUsage.totalTokens;
          state.estimatedSessionCost += response.tokenUsage.estimatedCost;
        }
      })
      .addCase(processVoiceInput.rejected, (state, action) => {
        state.isLoading = false;
        state.isProcessing = false;
        state.error = action.payload as string;
        state.lastError = action.payload as string;
      });

    // Generate hole completion
    builder
      .addCase(generateHoleCompletion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generateHoleCompletion.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const response = action.payload;
        
        // Add hole completion message to conversation
        const message: ConversationMessage = {
          id: `hole_completion_${Date.now()}`,
          content: response.commentary,
          role: 'assistant',
          timestamp: response.generatedAt,
          isVoice: true,
          confidence: 0.9, // High confidence for hole completion
        };

        state.conversationHistory.push(message);
        state.lastResponse = response.commentary;
      })
      .addCase(generateHoleCompletion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update location context
    builder
      .addCase(updateLocationContext.fulfilled, (state, action) => {
        const locationData = action.payload;
        state.currentLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracyMeters,
          currentHole: locationData.currentHole,
          distanceToPin: locationData.distanceToPinMeters,
          distanceToTee: locationData.distanceToTeeMeters,
          positionOnHole: locationData.positionOnHole,
        };
      });
  },
});

export const {
  toggleVoiceInterface,
  showVoiceInterface,
  hideVoiceInterface,
  setListening,
  setProcessing,
  setSpeaking,
  setRecognizedText,
  addUserMessage,
  addAssistantMessage,
  clearConversationHistory,
  updateCurrentLocation,
  setTargetPin,
  clearTargetPin,
  setMapType,
  setCourseRegion,
  toggleDistanceBadge,
  updateVoiceSettings,
  startVoiceSession,
  endVoiceSession,
  setVoiceError,
  clearVoiceError,
} = voiceSlice.actions;

export default voiceSlice.reducer;