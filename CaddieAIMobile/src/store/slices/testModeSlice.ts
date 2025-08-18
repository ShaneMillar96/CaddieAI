import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';

// Test Mode Types
export interface TestModeCoordinates {
  latitude: number;
  longitude: number;
}

export interface TestModePreset {
  name: string;
  latitude: number;
  longitude: number;
}

export interface TestModeState {
  enabled: boolean;
  coordinates: TestModeCoordinates;
  presets: TestModePreset[];
  lastUpdated: string;
}

// Default test mode presets
const DEFAULT_PRESETS: TestModePreset[] = [
  {
    name: 'Faughan Valley Golf Centre',
    latitude: 55.020906,
    longitude: -7.247879
  },
  {
    name: 'Augusta National Golf Club',
    latitude: 33.503,
    longitude: -82.020
  },
  {
    name: 'St Andrews Old Course',
    latitude: 56.348,
    longitude: -2.837
  },
  {
    name: 'Royal County Down',
    latitude: 54.269,
    longitude: -5.848
  }
];

const initialState: TestModeState = {
  enabled: false,  // Runtime configurable through app
  coordinates: {
    latitude: 55.020906,   // Default: Faughan Valley
    longitude: -7.247879
  },
  presets: DEFAULT_PRESETS,
  lastUpdated: new Date().toISOString(),
};

const testModeSlice = createSlice({
  name: 'testMode',
  initialState,
  reducers: {
    enableTestMode: (state) => {
      state.enabled = true;
      state.lastUpdated = new Date().toISOString();
    },
    
    disableTestMode: (state) => {
      state.enabled = false;
      state.lastUpdated = new Date().toISOString();
    },
    
    toggleTestMode: (state) => {
      state.enabled = !state.enabled;
      state.lastUpdated = new Date().toISOString();
    },
    
    setTestCoordinates: (state, action: PayloadAction<TestModeCoordinates>) => {
      const { latitude, longitude } = action.payload;
      
      // Validate coordinate ranges
      if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        state.coordinates = { latitude, longitude };
        state.lastUpdated = new Date().toISOString();
      } else {
        console.warn('⚠️ TestMode: Invalid coordinates provided:', { latitude, longitude });
      }
    },
    
    setTestLatitude: (state, action: PayloadAction<number>) => {
      const latitude = action.payload;
      
      // Validate latitude range
      if (latitude >= -90 && latitude <= 90) {
        state.coordinates.latitude = latitude;
        state.lastUpdated = new Date().toISOString();
      } else {
        console.warn('⚠️ TestMode: Invalid latitude provided:', latitude);
      }
    },
    
    setTestLongitude: (state, action: PayloadAction<number>) => {
      const longitude = action.payload;
      
      // Validate longitude range
      if (longitude >= -180 && longitude <= 180) {
        state.coordinates.longitude = longitude;
        state.lastUpdated = new Date().toISOString();
      } else {
        console.warn('⚠️ TestMode: Invalid longitude provided:', longitude);
      }
    },
    
    loadPreset: (state, action: PayloadAction<number>) => {
      const presetIndex = action.payload;
      
      if (presetIndex >= 0 && presetIndex < state.presets.length) {
        const preset = state.presets[presetIndex];
        state.coordinates = {
          latitude: preset.latitude,
          longitude: preset.longitude
        };
        state.lastUpdated = new Date().toISOString();
        
        console.log(`📍 TestMode: Loaded preset "${preset.name}" at ${preset.latitude}, ${preset.longitude}`);
      } else {
        console.warn('⚠️ TestMode: Invalid preset index:', presetIndex);
      }
    },
    
    addCustomPreset: (state, action: PayloadAction<TestModePreset>) => {
      const preset = action.payload;
      
      // Validate coordinates
      if (preset.latitude >= -90 && preset.latitude <= 90 && 
          preset.longitude >= -180 && preset.longitude <= 180 &&
          preset.name && preset.name.trim().length > 0) {
        
        // Check if preset with same name already exists
        const existingIndex = state.presets.findIndex(p => p.name === preset.name);
        
        if (existingIndex >= 0) {
          // Update existing preset
          state.presets[existingIndex] = preset;
          console.log(`📍 TestMode: Updated preset "${preset.name}"`);
        } else {
          // Add new preset
          state.presets.push(preset);
          console.log(`📍 TestMode: Added new preset "${preset.name}"`);
        }
        
        state.lastUpdated = new Date().toISOString();
      } else {
        console.warn('⚠️ TestMode: Invalid preset data:', preset);
      }
    },
    
    removePreset: (state, action: PayloadAction<number>) => {
      const presetIndex = action.payload;
      
      if (presetIndex >= 0 && presetIndex < state.presets.length) {
        const preset = state.presets[presetIndex];
        state.presets.splice(presetIndex, 1);
        state.lastUpdated = new Date().toISOString();
        
        console.log(`📍 TestMode: Removed preset "${preset.name}"`);
      } else {
        console.warn('⚠️ TestMode: Invalid preset index for removal:', presetIndex);
      }
    },
    
    resetToDefaults: (state) => {
      state.enabled = false;
      state.coordinates = {
        latitude: 55.020906,   // Default: Faughan Valley
        longitude: -7.247879
      };
      state.presets = DEFAULT_PRESETS;
      state.lastUpdated = new Date().toISOString();
      
      console.log('📍 TestMode: Reset to default settings');
    },
  },
  
  extraReducers: (builder) => {
    // Handle Redux Persist rehydration
    builder.addMatcher(
      (action) => action.type === REHYDRATE,
      (state, action: any) => {
        console.log('🔄 Redux Persist: Rehydrating test mode state');
        
        if (action.payload?.testMode) {
          const rehydratedTestMode = action.payload.testMode;
          
          console.log('🔄 Redux Persist: Rehydrated test mode state:', {
            enabled: rehydratedTestMode.enabled,
            coordinates: rehydratedTestMode.coordinates,
            presetCount: rehydratedTestMode.presets?.length || 0,
            lastUpdated: rehydratedTestMode.lastUpdated
          });
          
          // Validate rehydrated coordinates
          if (rehydratedTestMode.coordinates) {
            const { latitude, longitude } = rehydratedTestMode.coordinates;
            if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
              state.coordinates = rehydratedTestMode.coordinates;
            } else {
              console.warn('⚠️ Redux Persist: Invalid rehydrated coordinates, using defaults');
            }
          }
          
          // Preserve enabled state
          if (typeof rehydratedTestMode.enabled === 'boolean') {
            state.enabled = rehydratedTestMode.enabled;
          }
          
          // Validate and restore presets
          if (Array.isArray(rehydratedTestMode.presets)) {
            const validPresets = rehydratedTestMode.presets.filter((preset: any) => 
              preset && 
              typeof preset.name === 'string' && 
              typeof preset.latitude === 'number' && 
              typeof preset.longitude === 'number' &&
              preset.latitude >= -90 && preset.latitude <= 90 &&
              preset.longitude >= -180 && preset.longitude <= 180
            );
            
            if (validPresets.length > 0) {
              state.presets = validPresets;
            } else {
              console.warn('⚠️ Redux Persist: No valid presets found, using defaults');
              state.presets = DEFAULT_PRESETS;
            }
          }
          
          // Preserve lastUpdated
          if (rehydratedTestMode.lastUpdated) {
            state.lastUpdated = rehydratedTestMode.lastUpdated;
          }
        }
      }
    );
  },
});

export const {
  enableTestMode,
  disableTestMode,
  toggleTestMode,
  setTestCoordinates,
  setTestLatitude,
  setTestLongitude,
  loadPreset,
  addCustomPreset,
  removePreset,
  resetToDefaults,
} = testModeSlice.actions;

export default testModeSlice.reducer;