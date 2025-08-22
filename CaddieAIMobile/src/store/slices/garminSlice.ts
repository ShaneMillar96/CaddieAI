import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  GarminDevice, 
  ConnectionStatus 
} from '../../services/GarminBluetoothService';
import { 
  DeviceManagerStatus, 
  SwingAnalysisData, 
  DevicePreferences,
  getGarminDeviceManager 
} from '../../services/GarminDeviceManager';
import { SensorStatus } from '../../services/MobileSensorService';

// Redux state interface
export interface GarminState {
  // Device discovery and connection
  discoveredDevices: GarminDevice[];
  connectedDevice: GarminDevice | null;
  isScanning: boolean;
  connectionStatus: ConnectionStatus;
  
  // Device manager status
  deviceManagerStatus: DeviceManagerStatus;
  currentDeviceType: 'garmin' | 'mobile' | null;
  
  // Mobile sensor status
  mobileSensorStatus: SensorStatus;
  
  // Permissions
  permissions: {
    bluetooth: boolean;
    location: boolean;
    bluetoothScan: boolean;
    bluetoothConnect: boolean;
  };
  
  // Device preferences
  preferences: DevicePreferences;
  
  // Swing analysis
  swingRecordingActive: boolean;
  swingHistory: SwingAnalysisData[];
  latestSwing: SwingAnalysisData | null;
  
  // Battery monitoring
  batteryLevel: number | null;
  batteryAlertShown: boolean;
  
  // Error handling
  isLoading: boolean;
  error: string | null;
  lastError: {
    timestamp: number;
    message: string;
    source: 'garmin' | 'mobile' | 'manager';
  } | null;
  
  // UI state
  showConnectionModal: boolean;
  showDeviceSettings: boolean;
  autoConnectEnabled: boolean;
  fallbackToMobile: boolean;
}

const initialState: GarminState = {
  discoveredDevices: [],
  connectedDevice: null,
  isScanning: false,
  connectionStatus: ConnectionStatus.Disconnected,
  
  deviceManagerStatus: DeviceManagerStatus.Initializing,
  currentDeviceType: null,
  
  mobileSensorStatus: SensorStatus.Inactive,
  
  permissions: {
    bluetooth: false,
    location: false,
    bluetoothScan: false,
    bluetoothConnect: false,
  },
  
  preferences: {
    autoConnect: true,
    fallbackToMobileSensors: true,
    swingDetectionEnabled: true,
    batteryAlerts: true,
    connectionTimeout: 30,
  },
  
  swingRecordingActive: false,
  swingHistory: [],
  latestSwing: null,
  
  batteryLevel: null,
  batteryAlertShown: false,
  
  isLoading: false,
  error: null,
  lastError: null,
  
  showConnectionModal: false,
  showDeviceSettings: false,
  autoConnectEnabled: true,
  fallbackToMobile: true,
};

// Async thunks for device operations
export const initializeGarminManager = createAsyncThunk(
  'garmin/initializeManager',
  async (_, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      await manager.initialize();
      
      return {
        status: manager.getStatus(),
        preferences: manager.getPreferences(),
        currentDevice: manager.getCurrentDevice(),
        currentDeviceType: manager.getCurrentDeviceType(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize Garmin manager');
    }
  }
);

export const scanForGarminDevices = createAsyncThunk(
  'garmin/scanForDevices',
  async (timeoutMs: number = 10000, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      
      // Initialize manager if not already initialized
      if (!manager.isInitialized) {
        await manager.initialize();
      }
      
      const devices = await manager.scanForGarminDevices(timeoutMs);
      return devices;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Device scan failed');
    }
  }
);

export const connectToGarminDevice = createAsyncThunk(
  'garmin/connectToDevice',
  async (deviceId: string, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      
      // Initialize manager if not already initialized
      if (!manager.isInitialized) {
        await manager.initialize();
      }
      
      const success = await manager.connectToGarminDevice(deviceId);
      
      if (success) {
        return {
          device: manager.getCurrentDevice(),
          deviceType: manager.getCurrentDeviceType(),
          status: manager.getStatus(),
        };
      } else {
        throw new Error('Connection failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect to device');
    }
  }
);

export const disconnectGarminDevice = createAsyncThunk(
  'garmin/disconnectDevice',
  async (_, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      await manager.disconnectGarminDevice();
      
      return {
        status: manager.getStatus(),
        deviceType: manager.getCurrentDeviceType(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect device');
    }
  }
);

export const activateMobileSensors = createAsyncThunk(
  'garmin/activateMobileSensors',
  async (_, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      
      // Initialize manager if not already initialized
      if (!manager.isInitialized) {
        await manager.initialize();
      }
      
      const success = await manager.activateMobileSensors();
      
      if (success) {
        return {
          status: manager.getStatus(),
          deviceType: manager.getCurrentDeviceType(),
        };
      } else {
        throw new Error('Mobile sensors activation failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to activate mobile sensors');
    }
  }
);

export const startSwingRecording = createAsyncThunk(
  'garmin/startSwingRecording',
  async (roundId: number, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      await manager.startSwingRecording(roundId);
      return roundId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start swing recording');
    }
  }
);

export const stopSwingRecording = createAsyncThunk(
  'garmin/stopSwingRecording',
  async (_, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      await manager.stopSwingRecording();
      return manager.getSwingHistory();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to stop swing recording');
    }
  }
);

export const updateDevicePreferences = createAsyncThunk(
  'garmin/updatePreferences',
  async (preferences: Partial<DevicePreferences>, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      await manager.updatePreferences(preferences);
      return manager.getPreferences();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update preferences');
    }
  }
);

export const requestBluetoothPermissions = createAsyncThunk(
  'garmin/requestPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const manager = getGarminDeviceManager();
      const bluetoothService = (manager as any).garminService; // Access private service
      const hasPermissions = await bluetoothService.requestPermissions();
      
      return {
        bluetooth: hasPermissions,
        location: hasPermissions, // Bluetooth scanning requires location on Android
        bluetoothScan: hasPermissions,
        bluetoothConnect: hasPermissions,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Permission request failed');
    }
  }
);

const garminSlice = createSlice({
  name: 'garmin',
  initialState,
  reducers: {
    // Device discovery updates
    setDiscoveredDevices: (state, action: PayloadAction<GarminDevice[]>) => {
      state.discoveredDevices = action.payload;
    },
    
    addDiscoveredDevice: (state, action: PayloadAction<GarminDevice>) => {
      const existingIndex = state.discoveredDevices.findIndex(d => d.id === action.payload.id);
      if (existingIndex >= 0) {
        state.discoveredDevices[existingIndex] = action.payload;
      } else {
        state.discoveredDevices.push(action.payload);
      }
    },
    
    // Connection status updates
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    
    setConnectedDevice: (state, action: PayloadAction<GarminDevice | null>) => {
      state.connectedDevice = action.payload;
      if (action.payload) {
        state.currentDeviceType = 'garmin';
      }
    },
    
    // Device manager status
    setDeviceManagerStatus: (state, action: PayloadAction<DeviceManagerStatus>) => {
      state.deviceManagerStatus = action.payload;
    },
    
    setCurrentDeviceType: (state, action: PayloadAction<'garmin' | 'mobile' | null>) => {
      state.currentDeviceType = action.payload;
      if (action.payload === null) {
        state.connectedDevice = null;
      }
    },
    
    // Mobile sensor status
    setMobileSensorStatus: (state, action: PayloadAction<SensorStatus>) => {
      state.mobileSensorStatus = action.payload;
    },
    
    // Scanning state
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
      if (!action.payload) {
        // Clear error when scanning stops successfully
        if (state.error && state.error.includes('scan')) {
          state.error = null;
        }
      }
    },
    
    // Permissions
    setPermissions: (state, action: PayloadAction<Partial<GarminState['permissions']>>) => {
      state.permissions = { ...state.permissions, ...action.payload };
    },
    
    // Preferences
    setPreferences: (state, action: PayloadAction<DevicePreferences>) => {
      state.preferences = action.payload;
      state.autoConnectEnabled = action.payload.autoConnect;
      state.fallbackToMobile = action.payload.fallbackToMobileSensors;
    },
    
    // Swing analysis
    addSwingAnalysis: (state, action: PayloadAction<SwingAnalysisData>) => {
      state.swingHistory.unshift(action.payload); // Add to beginning
      state.latestSwing = action.payload;
      
      // Limit history size
      if (state.swingHistory.length > 50) {
        state.swingHistory = state.swingHistory.slice(0, 25);
      }
    },
    
    clearSwingHistory: (state) => {
      state.swingHistory = [];
      state.latestSwing = null;
    },
    
    // Battery monitoring
    setBatteryLevel: (state, action: PayloadAction<{ level: number; deviceId: string }>) => {
      state.batteryLevel = action.payload.level;
      
      // Show battery alert for low levels
      if (action.payload.level < 20 && !state.batteryAlertShown && state.preferences.batteryAlerts) {
        state.batteryAlertShown = true;
      }
      
      // Reset alert when battery is charged
      if (action.payload.level > 30) {
        state.batteryAlertShown = false;
      }
    },
    
    dismissBatteryAlert: (state) => {
      state.batteryAlertShown = false;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.lastError = {
        timestamp: Date.now(),
        message: action.payload,
        source: 'manager', // Default source
      };
    },
    
    setDetailedError: (state, action: PayloadAction<{
      message: string;
      source: 'garmin' | 'mobile' | 'manager';
    }>) => {
      state.error = action.payload.message;
      state.lastError = {
        timestamp: Date.now(),
        message: action.payload.message,
        source: action.payload.source,
      };
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // UI state management
    showConnectionModal: (state) => {
      state.showConnectionModal = true;
    },
    
    hideConnectionModal: (state) => {
      state.showConnectionModal = false;
    },
    
    showDeviceSettings: (state) => {
      state.showDeviceSettings = true;
    },
    
    hideDeviceSettings: (state) => {
      state.showDeviceSettings = false;
    },
    
    // Quick toggles
    toggleAutoConnect: (state) => {
      state.autoConnectEnabled = !state.autoConnectEnabled;
      state.preferences.autoConnect = state.autoConnectEnabled;
    },
    
    toggleFallbackToMobile: (state) => {
      state.fallbackToMobile = !state.fallbackToMobile;
      state.preferences.fallbackToMobileSensors = state.fallbackToMobile;
    },
    
    // Reset state
    resetGarminState: (state) => {
      return {
        ...initialState,
        preferences: state.preferences, // Preserve preferences
      };
    },
  },
  extraReducers: (builder) => {
    // Initialize Garmin Manager
    builder.addCase(initializeGarminManager.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(initializeGarminManager.fulfilled, (state, action) => {
      state.isLoading = false;
      state.deviceManagerStatus = action.payload.status;
      state.preferences = action.payload.preferences;
      state.connectedDevice = action.payload.currentDevice;
      state.currentDeviceType = action.payload.currentDeviceType;
      state.autoConnectEnabled = action.payload.preferences.autoConnect;
      state.fallbackToMobile = action.payload.preferences.fallbackToMobileSensors;
    });
    builder.addCase(initializeGarminManager.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.deviceManagerStatus = DeviceManagerStatus.Error;
    });
    
    // Scan for devices
    builder.addCase(scanForGarminDevices.pending, (state) => {
      state.isScanning = true;
      state.error = null;
      state.discoveredDevices = []; // Clear previous results
    });
    builder.addCase(scanForGarminDevices.fulfilled, (state, action) => {
      state.isScanning = false;
      state.discoveredDevices = action.payload;
    });
    builder.addCase(scanForGarminDevices.rejected, (state, action) => {
      state.isScanning = false;
      state.error = action.payload as string;
      state.lastError = {
        timestamp: Date.now(),
        message: action.payload as string,
        source: 'garmin',
      };
    });
    
    // Connect to device
    builder.addCase(connectToGarminDevice.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.connectionStatus = ConnectionStatus.Connecting;
    });
    builder.addCase(connectToGarminDevice.fulfilled, (state, action) => {
      state.isLoading = false;
      state.connectedDevice = action.payload.device;
      state.currentDeviceType = action.payload.deviceType;
      state.deviceManagerStatus = action.payload.status;
      state.connectionStatus = ConnectionStatus.Connected;
      
      // Update preferences with connected device
      if (action.payload.device) {
        state.preferences.preferredDeviceId = action.payload.device.id;
      }
    });
    builder.addCase(connectToGarminDevice.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.connectionStatus = ConnectionStatus.Error;
      state.lastError = {
        timestamp: Date.now(),
        message: action.payload as string,
        source: 'garmin',
      };
    });
    
    // Disconnect device
    builder.addCase(disconnectGarminDevice.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(disconnectGarminDevice.fulfilled, (state, action) => {
      state.isLoading = false;
      state.connectedDevice = null;
      state.connectionStatus = ConnectionStatus.Disconnected;
      state.deviceManagerStatus = action.payload.status;
      state.currentDeviceType = action.payload.deviceType;
      state.batteryLevel = null;
    });
    builder.addCase(disconnectGarminDevice.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Activate mobile sensors
    builder.addCase(activateMobileSensors.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(activateMobileSensors.fulfilled, (state, action) => {
      state.isLoading = false;
      state.deviceManagerStatus = action.payload.status;
      state.currentDeviceType = action.payload.deviceType;
      state.mobileSensorStatus = SensorStatus.Active;
    });
    builder.addCase(activateMobileSensors.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.mobileSensorStatus = SensorStatus.Error;
      state.lastError = {
        timestamp: Date.now(),
        message: action.payload as string,
        source: 'mobile',
      };
    });
    
    // Start swing recording
    builder.addCase(startSwingRecording.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(startSwingRecording.fulfilled, (state) => {
      state.isLoading = false;
      state.swingRecordingActive = true;
    });
    builder.addCase(startSwingRecording.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      state.swingRecordingActive = false;
    });
    
    // Stop swing recording
    builder.addCase(stopSwingRecording.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(stopSwingRecording.fulfilled, (state, action) => {
      state.isLoading = false;
      state.swingRecordingActive = false;
      state.swingHistory = action.payload;
    });
    builder.addCase(stopSwingRecording.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Update preferences
    builder.addCase(updateDevicePreferences.fulfilled, (state, action) => {
      state.preferences = action.payload;
      state.autoConnectEnabled = action.payload.autoConnect;
      state.fallbackToMobile = action.payload.fallbackToMobileSensors;
    });
    
    // Request permissions
    builder.addCase(requestBluetoothPermissions.fulfilled, (state, action) => {
      state.permissions = action.payload;
    });
    builder.addCase(requestBluetoothPermissions.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const {
  // Device discovery
  setDiscoveredDevices,
  addDiscoveredDevice,
  
  // Connection status
  setConnectionStatus,
  setConnectedDevice,
  
  // Device manager
  setDeviceManagerStatus,
  setCurrentDeviceType,
  
  // Mobile sensors
  setMobileSensorStatus,
  
  // Scanning
  setScanning,
  
  // Permissions
  setPermissions,
  
  // Preferences
  setPreferences,
  
  // Swing analysis
  addSwingAnalysis,
  clearSwingHistory,
  
  // Battery
  setBatteryLevel,
  dismissBatteryAlert,
  
  // Error handling
  setError,
  setDetailedError,
  clearError,
  
  // UI state
  showConnectionModal,
  hideConnectionModal,
  showDeviceSettings,
  hideDeviceSettings,
  
  // Quick toggles
  toggleAutoConnect,
  toggleFallbackToMobile,
  
  // Reset
  resetGarminState,
} = garminSlice.actions;

// Selectors
export const selectGarminState = (state: any) => state.garmin as GarminState;
export const selectDiscoveredDevices = (state: any) => state.garmin.discoveredDevices;
export const selectConnectedDevice = (state: any) => state.garmin.connectedDevice;
export const selectConnectionStatus = (state: any) => state.garmin.connectionStatus;
export const selectDeviceManagerStatus = (state: any) => state.garmin.deviceManagerStatus;
export const selectCurrentDeviceType = (state: any) => state.garmin.currentDeviceType;
export const selectMobileSensorStatus = (state: any) => state.garmin.mobileSensorStatus;
export const selectIsScanning = (state: any) => state.garmin.isScanning;
export const selectPermissions = (state: any) => state.garmin.permissions;
export const selectPreferences = (state: any) => state.garmin.preferences;
export const selectSwingRecordingActive = (state: any) => state.garmin.swingRecordingActive;
export const selectSwingHistory = (state: any) => state.garmin.swingHistory;
export const selectLatestSwing = (state: any) => state.garmin.latestSwing;
export const selectBatteryLevel = (state: any) => state.garmin.batteryLevel;
export const selectGarminError = (state: any) => state.garmin.error;
export const selectGarminLoading = (state: any) => state.garmin.isLoading;
export const selectShowConnectionModal = (state: any) => state.garmin.showConnectionModal;
export const selectShowDeviceSettings = (state: any) => state.garmin.showDeviceSettings;

// Complex selectors
export const selectIsDeviceConnected = (state: any) => {
  const garminState = selectGarminState(state);
  return garminState.currentDeviceType !== null && 
         (garminState.connectionStatus === ConnectionStatus.Connected || 
          garminState.mobileSensorStatus === SensorStatus.Active);
};

export const selectCanStartSwingRecording = (state: any) => {
  const garminState = selectGarminState(state);
  return selectIsDeviceConnected(state) && 
         !garminState.swingRecordingActive &&
         garminState.preferences.swingDetectionEnabled;
};

export const selectDeviceStatusSummary = (state: any) => {
  const garminState = selectGarminState(state);
  
  if (garminState.currentDeviceType === 'garmin' && garminState.connectedDevice) {
    return {
      type: 'garmin' as const,
      name: garminState.connectedDevice.name,
      batteryLevel: garminState.batteryLevel,
      isRecording: garminState.swingRecordingActive,
    };
  } else if (garminState.currentDeviceType === 'mobile') {
    return {
      type: 'mobile' as const,
      name: 'Mobile Sensors',
      batteryLevel: null,
      isRecording: garminState.swingRecordingActive,
    };
  } else {
    return {
      type: null,
      name: 'No Device',
      batteryLevel: null,
      isRecording: false,
    };
  }
};

export default garminSlice.reducer;