import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  GarminBluetoothService, 
  GarminDevice, 
  ConnectionStatus, 
  MotionData,
  getGarminBluetoothService 
} from './GarminBluetoothService';
import { 
  MobileSensorService, 
  SensorStatus,
  getMobileSensorService 
} from './MobileSensorService';
import { ApiService } from './ApiService';
import TokenStorage from './tokenStorage';

// Device preference types
export interface DevicePreferences {
  preferredDeviceId?: string;
  autoConnect: boolean;
  fallbackToMobileSensors: boolean;
  swingDetectionEnabled: boolean;
  batteryAlerts: boolean;
  connectionTimeout: number; // seconds
}

export interface SwingAnalysisData {
  id: string;
  timestamp: number;
  duration: number;
  peakAcceleration: number;
  peakRotation?: number;
  deviceType: 'garmin' | 'mobile';
  deviceId?: string;
  rawData: MotionData[];
  clubRecommendation?: string;
  distanceEstimate?: number;
  swingQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export enum DeviceManagerStatus {
  Initializing = 'initializing',
  Ready = 'ready',
  ConnectingToGarmin = 'connecting_garmin',
  ConnectedToGarmin = 'connected_garmin',
  UsingMobileSensors = 'using_mobile_sensors',
  Error = 'error',
  Offline = 'offline'
}

/**
 * GarminDeviceManager - Orchestrates Garmin device connections and mobile sensor fallback
 * 
 * This service manages the complete lifecycle of motion sensing for swing analysis:
 * - Coordinates between Garmin Bluetooth devices and mobile sensors
 * - Manages device preferences and auto-connection
 * - Integrates with backend APIs for device registration and swing data
 * - Provides unified motion data interface regardless of source
 * - Handles graceful fallback between device types
 */
export class GarminDeviceManager {
  private garminService: GarminBluetoothService;
  private mobileService: MobileSensorService;
  private apiService: ApiService;

  private status: DeviceManagerStatus = DeviceManagerStatus.Initializing;
  private isInitialized: boolean = false;
  private currentDeviceType: 'garmin' | 'mobile' | null = null;
  private activeRoundId: number | null = null;

  // Device preferences (stored locally)
  private preferences: DevicePreferences = {
    autoConnect: true,
    fallbackToMobileSensors: true,
    swingDetectionEnabled: true,
    batteryAlerts: true,
    connectionTimeout: 30, // 30 seconds
  };

  // Motion data collection
  private isRecordingSwings: boolean = false;
  private currentSwingData: MotionData[] = [];
  private swingAnalysisHistory: SwingAnalysisData[] = [];

  // Callbacks for manager events
  private statusChangeCallbacks: Array<(status: DeviceManagerStatus) => void> = [];
  private deviceConnectionCallbacks: Array<(device: GarminDevice | null, deviceType: 'garmin' | 'mobile') => void> = [];
  private swingDetectionCallbacks: Array<(swingData: SwingAnalysisData) => void> = [];
  private motionDataCallbacks: Array<(data: MotionData, source: 'garmin' | 'mobile') => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];

  // Auto-connection and retry logic
  private connectionRetryAttempts: number = 0;
  private maxConnectionRetries: number = 3;
  private connectionRetryDelay: number = 5000; // 5 seconds
  private connectionTimer: NodeJS.Timeout | null = null;

  // Storage keys
  private readonly PREFERENCES_KEY = 'garmin_device_preferences';
  private readonly DEVICE_HISTORY_KEY = 'garmin_device_history';

  constructor() {
    console.log('🔵 GarminDeviceManager: Initializing device manager');
    
    this.garminService = getGarminBluetoothService();
    this.mobileService = getMobileSensorService();
    this.apiService = new ApiService();
  }

  /**
   * Initialize the device manager - load preferences and set up services
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔵 GarminDeviceManager: Starting initialization...');
      this.setStatus(DeviceManagerStatus.Initializing);

      // Load preferences from storage
      await this.loadPreferences();

      // Set up service event handlers
      this.setupServiceHandlers();

      this.isInitialized = true;
      this.setStatus(DeviceManagerStatus.Ready);

      console.log('✅ GarminDeviceManager: Initialization completed');

      // Attempt auto-connection if enabled
      if (this.preferences.autoConnect && this.preferences.preferredDeviceId) {
        setTimeout(() => {
          this.attemptAutoConnection();
        }, 2000); // Give UI time to set up
      } else if (this.preferences.fallbackToMobileSensors) {
        // Start with mobile sensors if no preferred device
        setTimeout(() => {
          this.activateMobileSensors();
        }, 1000);
      }

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Initialization failed:', error);
      this.setStatus(DeviceManagerStatus.Error);
      this.notifyError(`Initialization failed: ${(error as Error).message}`);
      throw error;
    }
  }

  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (stored) {
        const loadedPrefs = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...loadedPrefs };
        console.log('🔧 GarminDeviceManager: Loaded preferences:', this.preferences);
      }
    } catch (error) {
      console.warn('⚠️ GarminDeviceManager: Could not load preferences:', error);
      // Use defaults
    }
  }

  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(this.preferences));
      console.log('💾 GarminDeviceManager: Preferences saved');
    } catch (error) {
      console.warn('⚠️ GarminDeviceManager: Could not save preferences:', error);
    }
  }

  private setupServiceHandlers(): void {
    // Garmin service handlers
    this.garminService.onConnectionStatusChange((status, deviceId) => {
      console.log(`🔵 GarminDeviceManager: Garmin connection status: ${status} for device ${deviceId}`);
      this.handleGarminConnectionChange(status, deviceId);
    });

    this.garminService.onMotionData((data, deviceId) => {
      this.handleMotionData(data, 'garmin', deviceId);
    });

    this.garminService.onError((error) => {
      console.error('🔴 GarminDeviceManager: Garmin service error:', error);
      this.handleGarminError(error);
    });

    // Mobile sensor service handlers
    this.mobileService.onStatusChange((status) => {
      console.log(`🔵 GarminDeviceManager: Mobile sensor status: ${status}`);
      this.handleMobileSensorStatusChange(status);
    });

    this.mobileService.onMotionData((data) => {
      this.handleMotionData(data, 'mobile');
    });

    this.mobileService.onSwingDetection((swingData) => {
      this.handleSwingDetection(swingData, 'mobile');
    });

    this.mobileService.onError((error) => {
      console.error('🔴 GarminDeviceManager: Mobile sensor error:', error);
      this.handleMobileSensorError(error);
    });

    console.log('✅ GarminDeviceManager: Service handlers configured');
  }

  /**
   * Scan for available Garmin devices
   */
  async scanForGarminDevices(timeoutMs: number = 10000): Promise<GarminDevice[]> {
    try {
      console.log(`🔍 GarminDeviceManager: Scanning for Garmin devices (${timeoutMs}ms)...`);
      
      if (!this.isInitialized) {
        throw new Error('Device manager not initialized');
      }

      const devices = await this.garminService.scanForDevices(timeoutMs);
      console.log(`📱 GarminDeviceManager: Found ${devices.length} Garmin devices`);
      
      // Store discovered devices for future reference
      await this.updateDeviceHistory(devices);
      
      return devices;

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Device scan failed:', error);
      this.notifyError(`Device scan failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Connect to a specific Garmin device
   */
  async connectToGarminDevice(deviceId: string): Promise<boolean> {
    try {
      console.log(`🔵 GarminDeviceManager: Connecting to Garmin device ${deviceId}...`);
      
      this.setStatus(DeviceManagerStatus.ConnectingToGarmin);
      
      // Stop mobile sensors if active
      if (this.currentDeviceType === 'mobile') {
        await this.deactivateMobileSensors();
      }

      // Set connection timeout
      this.setConnectionTimeout();

      const success = await this.garminService.connectToDevice(deviceId);
      
      if (success) {
        this.currentDeviceType = 'garmin';
        this.preferences.preferredDeviceId = deviceId;
        await this.savePreferences();
        
        // Register device with backend
        await this.registerDeviceWithBackend(deviceId);
        
        this.connectionRetryAttempts = 0; // Reset retry counter
        console.log('✅ GarminDeviceManager: Garmin device connected successfully');
        return true;
      } else {
        throw new Error('Connection failed');
      }

    } catch (error) {
      console.error(`🔴 GarminDeviceManager: Failed to connect to Garmin device ${deviceId}:`, error);
      this.handleConnectionFailure(error);
      return false;
    } finally {
      this.clearConnectionTimeout();
    }
  }

  /**
   * Disconnect from current Garmin device
   */
  async disconnectGarminDevice(): Promise<void> {
    try {
      console.log('🔵 GarminDeviceManager: Disconnecting from Garmin device...');
      
      await this.garminService.disconnectDevice();
      
      // Fall back to mobile sensors if enabled
      if (this.preferences.fallbackToMobileSensors) {
        await this.activateMobileSensors();
      } else {
        this.currentDeviceType = null;
        this.setStatus(DeviceManagerStatus.Ready);
      }

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Error disconnecting Garmin device:', error);
      this.notifyError(`Disconnect failed: ${(error as Error).message}`);
    }
  }

  /**
   * Activate mobile sensors as fallback
   */
  async activateMobileSensors(): Promise<boolean> {
    try {
      console.log('🔵 GarminDeviceManager: Activating mobile sensors...');
      
      // Disconnect Garmin if connected
      if (this.currentDeviceType === 'garmin') {
        await this.garminService.disconnectDevice();
      }

      await this.mobileService.startSensorMonitoring();
      this.currentDeviceType = 'mobile';
      this.setStatus(DeviceManagerStatus.UsingMobileSensors);
      
      console.log('✅ GarminDeviceManager: Mobile sensors activated');
      return true;

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Failed to activate mobile sensors:', error);
      this.notifyError(`Mobile sensors failed: ${(error as Error).message}`);
      this.setStatus(DeviceManagerStatus.Error);
      return false;
    }
  }

  /**
   * Deactivate mobile sensors
   */
  async deactivateMobileSensors(): Promise<void> {
    try {
      console.log('🔵 GarminDeviceManager: Deactivating mobile sensors...');
      await this.mobileService.stopSensorMonitoring();
      console.log('✅ GarminDeviceManager: Mobile sensors deactivated');
    } catch (error) {
      console.error('🔴 GarminDeviceManager: Error deactivating mobile sensors:', error);
    }
  }

  /**
   * Start swing recording for active round
   */
  async startSwingRecording(roundId: number): Promise<void> {
    try {
      console.log(`🏌️ GarminDeviceManager: Starting swing recording for round ${roundId}`);
      
      this.activeRoundId = roundId;
      this.isRecordingSwings = true;
      this.currentSwingData = [];
      
      // Enable swing detection on active service
      if (this.currentDeviceType === 'mobile') {
        const config = this.mobileService.getConfiguration();
        this.mobileService.updateConfiguration({ 
          ...config, 
          swingDetectionEnabled: true 
        });
      }
      
      console.log('✅ GarminDeviceManager: Swing recording started');

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Failed to start swing recording:', error);
      this.notifyError(`Failed to start swing recording: ${(error as Error).message}`);
    }
  }

  /**
   * Stop swing recording
   */
  async stopSwingRecording(): Promise<void> {
    try {
      console.log('🔵 GarminDeviceManager: Stopping swing recording...');
      
      this.isRecordingSwings = false;
      this.activeRoundId = null;
      
      // Disable swing detection on mobile service
      if (this.currentDeviceType === 'mobile') {
        const config = this.mobileService.getConfiguration();
        this.mobileService.updateConfiguration({ 
          ...config, 
          swingDetectionEnabled: false 
        });
      }
      
      // Save any remaining swing data
      if (this.currentSwingData.length > 0) {
        await this.finalizeCurrentSwing();
      }
      
      console.log('✅ GarminDeviceManager: Swing recording stopped');

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Error stopping swing recording:', error);
    }
  }

  // Event handlers for service callbacks
  private handleGarminConnectionChange(status: ConnectionStatus, deviceId?: string): void {
    switch (status) {
      case ConnectionStatus.Connected:
        this.setStatus(DeviceManagerStatus.ConnectedToGarmin);
        this.currentDeviceType = 'garmin';
        
        // Notify connection callbacks
        const device = this.garminService.getSelectedDevice();
        this.deviceConnectionCallbacks.forEach(callback => {
          try {
            callback(device, 'garmin');
          } catch (error) {
            console.error('🔴 GarminDeviceManager: Error in connection callback:', error);
          }
        });
        break;
        
      case ConnectionStatus.Disconnected:
        if (this.currentDeviceType === 'garmin') {
          // Attempt fallback to mobile sensors
          if (this.preferences.fallbackToMobileSensors) {
            setTimeout(() => {
              this.activateMobileSensors();
            }, 1000);
          } else {
            this.setStatus(DeviceManagerStatus.Ready);
            this.currentDeviceType = null;
          }
        }
        break;
        
      case ConnectionStatus.Error:
        this.handleConnectionFailure(new Error('Garmin connection error'));
        break;
    }
  }

  private handleMobileSensorStatusChange(status: SensorStatus): void {
    if (this.currentDeviceType === 'mobile') {
      switch (status) {
        case SensorStatus.Active:
          this.setStatus(DeviceManagerStatus.UsingMobileSensors);
          
          // Notify connection callbacks
          this.deviceConnectionCallbacks.forEach(callback => {
            try {
              callback(null, 'mobile');
            } catch (error) {
              console.error('🔴 GarminDeviceManager: Error in connection callback:', error);
            }
          });
          break;
          
        case SensorStatus.Error:
          this.setStatus(DeviceManagerStatus.Error);
          this.notifyError('Mobile sensor error');
          break;
      }
    }
  }

  private handleMotionData(data: MotionData, source: 'garmin' | 'mobile', deviceId?: string): void {
    // Forward motion data to callbacks
    this.motionDataCallbacks.forEach(callback => {
      try {
        callback(data, source);
      } catch (error) {
        console.error('🔴 GarminDeviceManager: Error in motion data callback:', error);
      }
    });

    // Collect swing data if recording
    if (this.isRecordingSwings) {
      this.currentSwingData.push(data);
      
      // Limit swing data buffer size
      if (this.currentSwingData.length > 1000) { // ~20 seconds at 50Hz
        this.currentSwingData = this.currentSwingData.slice(-500); // Keep last 10 seconds
      }
    }
  }

  private handleSwingDetection(swingData: any, source: 'garmin' | 'mobile'): void {
    console.log(`🏌️ GarminDeviceManager: Swing detected from ${source} source`);
    
    if (this.isRecordingSwings) {
      this.processDetectedSwing(swingData, source);
    }
  }

  private async processDetectedSwing(rawSwingData: any, source: 'garmin' | 'mobile'): Promise<void> {
    try {
      // Create standardized swing analysis data
      const swingAnalysis: SwingAnalysisData = {
        id: `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        duration: rawSwingData.duration || 1000,
        peakAcceleration: rawSwingData.peakAcceleration || 0,
        peakRotation: rawSwingData.peakRotation,
        deviceType: source,
        deviceId: source === 'garmin' ? this.garminService.getSelectedDevice()?.id : undefined,
        rawData: rawSwingData.swingData || this.currentSwingData.slice(-100), // Last 2 seconds
        swingQuality: this.analyzeSwingQuality(rawSwingData),
      };

      // Add to history
      this.swingAnalysisHistory.push(swingAnalysis);
      
      // Limit history size
      if (this.swingAnalysisHistory.length > 50) {
        this.swingAnalysisHistory = this.swingAnalysisHistory.slice(-25);
      }

      console.log(`📊 GarminDeviceManager: Processed swing analysis:`, {
        id: swingAnalysis.id,
        duration: swingAnalysis.duration,
        peakAccel: swingAnalysis.peakAcceleration,
        quality: swingAnalysis.swingQuality,
        source: swingAnalysis.deviceType
      });

      // Send to backend if round is active
      if (this.activeRoundId) {
        await this.submitSwingAnalysisToBackend(swingAnalysis);
      }

      // Notify callbacks
      this.swingDetectionCallbacks.forEach(callback => {
        try {
          callback(swingAnalysis);
        } catch (error) {
          console.error('🔴 GarminDeviceManager: Error in swing detection callback:', error);
        }
      });

      // Clear current swing data buffer after processing
      this.currentSwingData = [];

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Error processing swing detection:', error);
    }
  }

  private analyzeSwingQuality(rawSwingData: any): SwingAnalysisData['swingQuality'] {
    // Simple swing quality analysis based on acceleration and timing
    const peakAccel = rawSwingData.peakAcceleration || 0;
    const duration = rawSwingData.duration || 0;
    
    // Basic quality thresholds (would be refined with more data)
    if (peakAccel > 20 && duration > 500 && duration < 1500) {
      return 'excellent';
    } else if (peakAccel > 15 && duration > 400 && duration < 2000) {
      return 'good';
    } else if (peakAccel > 10 && duration > 300 && duration < 2500) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private async submitSwingAnalysisToBackend(swingData: SwingAnalysisData): Promise<void> {
    try {
      const token = await TokenStorage.getAccessToken();
      if (!token || !this.activeRoundId) {
        console.warn('⚠️ GarminDeviceManager: Cannot submit swing data - no auth token or active round');
        return;
      }

      // Prepare data for backend
      const payload = {
        roundId: this.activeRoundId,
        deviceType: swingData.deviceType,
        deviceId: swingData.deviceId,
        swingTimestamp: new Date(swingData.timestamp).toISOString(),
        duration: swingData.duration,
        peakAcceleration: swingData.peakAcceleration,
        peakRotation: swingData.peakRotation,
        swingQuality: swingData.swingQuality,
        motionDataSummary: {
          sampleCount: swingData.rawData.length,
          startTime: swingData.rawData[0]?.timestamp,
          endTime: swingData.rawData[swingData.rawData.length - 1]?.timestamp,
        }
        // Note: Full raw data might be too large for API - send summary instead
      };

      await this.apiService.post('swing-analyses', payload);
      console.log('✅ GarminDeviceManager: Swing analysis submitted to backend');

    } catch (error) {
      console.warn('⚠️ GarminDeviceManager: Failed to submit swing analysis to backend:', error);
      // Don't throw - this is not critical for app function
    }
  }

  // Device management helpers
  private async attemptAutoConnection(): Promise<void> {
    if (!this.preferences.preferredDeviceId || !this.preferences.autoConnect) {
      return;
    }

    console.log(`🔄 GarminDeviceManager: Attempting auto-connection to ${this.preferences.preferredDeviceId}`);
    
    const success = await this.connectToGarminDevice(this.preferences.preferredDeviceId);
    if (!success && this.preferences.fallbackToMobileSensors) {
      console.log('🔄 GarminDeviceManager: Auto-connection failed, falling back to mobile sensors');
      await this.activateMobileSensors();
    }
  }

  private handleConnectionFailure(error: Error): void {
    console.error('🔴 GarminDeviceManager: Connection failure:', error);
    
    this.connectionRetryAttempts++;
    
    if (this.connectionRetryAttempts <= this.maxConnectionRetries) {
      console.log(`🔄 GarminDeviceManager: Scheduling retry ${this.connectionRetryAttempts}/${this.maxConnectionRetries}`);
      
      setTimeout(() => {
        if (this.preferences.preferredDeviceId) {
          this.connectToGarminDevice(this.preferences.preferredDeviceId);
        }
      }, this.connectionRetryDelay);
      
    } else {
      console.log('❌ GarminDeviceManager: Max connection retries reached');
      this.connectionRetryAttempts = 0;
      
      // Fall back to mobile sensors
      if (this.preferences.fallbackToMobileSensors) {
        this.activateMobileSensors();
      } else {
        this.setStatus(DeviceManagerStatus.Error);
        this.notifyError('Failed to connect to Garmin device');
      }
    }
  }

  private handleGarminError(error: string): void {
    console.error('🔴 GarminDeviceManager: Garmin service error:', error);
    
    if (this.preferences.fallbackToMobileSensors && this.currentDeviceType === 'garmin') {
      console.log('🔄 GarminDeviceManager: Garmin error - falling back to mobile sensors');
      this.activateMobileSensors();
    } else {
      this.notifyError(`Garmin device error: ${error}`);
    }
  }

  private handleMobileSensorError(error: string): void {
    console.error('🔴 GarminDeviceManager: Mobile sensor error:', error);
    
    if (this.currentDeviceType === 'mobile') {
      this.setStatus(DeviceManagerStatus.Error);
      this.notifyError(`Mobile sensor error: ${error}`);
    }
  }

  // Backend integration
  private async registerDeviceWithBackend(deviceId: string): Promise<void> {
    try {
      const token = await TokenStorage.getAccessToken();
      if (!token) return;

      const device = this.garminService.getSelectedDevice();
      if (!device) return;

      const payload = {
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.deviceType,
        manufacturer: device.manufacturer || 'Garmin',
        modelNumber: device.modelNumber,
        firmwareVersion: device.firmwareVersion,
        serialNumber: device.serialNumber,
        isActive: true,
        connectionType: 'bluetooth_le',
      };

      await this.apiService.post('garmin-devices', payload);
      console.log('✅ GarminDeviceManager: Device registered with backend');

    } catch (error) {
      console.warn('⚠️ GarminDeviceManager: Failed to register device with backend:', error);
      // Non-critical error - don't throw
    }
  }

  private async updateDeviceHistory(devices: GarminDevice[]): Promise<void> {
    try {
      const history = {
        lastScanTime: Date.now(),
        devices: devices.map(device => ({
          id: device.id,
          name: device.name,
          deviceType: device.deviceType,
          lastSeen: device.lastSeen,
        }))
      };

      await AsyncStorage.setItem(this.DEVICE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('⚠️ GarminDeviceManager: Could not save device history:', error);
    }
  }

  // Connection timeout management
  private setConnectionTimeout(): void {
    this.connectionTimer = setTimeout(() => {
      console.warn('⏰ GarminDeviceManager: Connection timeout reached');
      this.handleConnectionFailure(new Error('Connection timeout'));
    }, this.preferences.connectionTimeout * 1000);
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private async finalizeCurrentSwing(): Promise<void> {
    if (this.currentSwingData.length === 0) return;

    try {
      // Create a final swing analysis from buffered data
      const swingAnalysis: SwingAnalysisData = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        duration: this.currentSwingData.length > 0 ? 
          this.currentSwingData[this.currentSwingData.length - 1].timestamp - this.currentSwingData[0].timestamp : 0,
        peakAcceleration: this.calculatePeakAcceleration(this.currentSwingData),
        peakRotation: this.calculatePeakRotation(this.currentSwingData),
        deviceType: this.currentDeviceType || 'mobile',
        rawData: [...this.currentSwingData],
        swingQuality: 'fair', // Default for manual finalization
      };

      this.swingAnalysisHistory.push(swingAnalysis);

      if (this.activeRoundId) {
        await this.submitSwingAnalysisToBackend(swingAnalysis);
      }

      console.log('📊 GarminDeviceManager: Finalized current swing data');

    } catch (error) {
      console.error('🔴 GarminDeviceManager: Error finalizing swing:', error);
    }
  }

  private calculatePeakAcceleration(motionData: MotionData[]): number {
    let peak = 0;
    motionData.forEach(data => {
      const accel = data.accelerometer;
      const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
      if (magnitude > peak) peak = magnitude;
    });
    return peak;
  }

  private calculatePeakRotation(motionData: MotionData[]): number {
    let peak = 0;
    motionData.forEach(data => {
      if (data.gyroscope) {
        const gyro = data.gyroscope;
        const magnitude = Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
        if (magnitude > peak) peak = magnitude;
      }
    });
    return peak;
  }

  // Public getters and configuration
  getStatus(): DeviceManagerStatus {
    return this.status;
  }

  getCurrentDeviceType(): 'garmin' | 'mobile' | null {
    return this.currentDeviceType;
  }

  getPreferences(): DevicePreferences {
    return { ...this.preferences };
  }

  async updatePreferences(newPreferences: Partial<DevicePreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    await this.savePreferences();
    console.log('🔧 GarminDeviceManager: Preferences updated:', this.preferences);
  }

  getSwingHistory(): SwingAnalysisData[] {
    return [...this.swingAnalysisHistory];
  }

  getCurrentDevice(): GarminDevice | null {
    return this.currentDeviceType === 'garmin' ? this.garminService.getSelectedDevice() : null;
  }

  isRecording(): boolean {
    return this.isRecordingSwings;
  }

  // Subscription methods
  onStatusChange(callback: (status: DeviceManagerStatus) => void): () => void {
    this.statusChangeCallbacks.push(callback);
    return () => {
      const index = this.statusChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusChangeCallbacks.splice(index, 1);
      }
    };
  }

  onDeviceConnection(callback: (device: GarminDevice | null, deviceType: 'garmin' | 'mobile') => void): () => void {
    this.deviceConnectionCallbacks.push(callback);
    return () => {
      const index = this.deviceConnectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.deviceConnectionCallbacks.splice(index, 1);
      }
    };
  }

  onSwingDetection(callback: (swingData: SwingAnalysisData) => void): () => void {
    this.swingDetectionCallbacks.push(callback);
    return () => {
      const index = this.swingDetectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.swingDetectionCallbacks.splice(index, 1);
      }
    };
  }

  onMotionData(callback: (data: MotionData, source: 'garmin' | 'mobile') => void): () => void {
    this.motionDataCallbacks.push(callback);
    return () => {
      const index = this.motionDataCallbacks.indexOf(callback);
      if (index > -1) {
        this.motionDataCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Private helper methods
  private setStatus(status: DeviceManagerStatus): void {
    if (this.status !== status) {
      this.status = status;
      console.log(`🔵 GarminDeviceManager: Status changed to ${status}`);
      
      this.statusChangeCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('🔴 GarminDeviceManager: Error in status change callback:', error);
        }
      });
    }
  }

  private notifyError(error: string): void {
    console.error(`🔴 GarminDeviceManager: ${error}`);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('🔴 GarminDeviceManager: Error in error callback:', err);
      }
    });
  }

  /**
   * Clean up service resources
   */
  cleanup(): void {
    console.log('🔵 GarminDeviceManager: Cleaning up device manager');
    
    // Clear timers
    this.clearConnectionTimeout();
    
    // Stop recording
    this.stopSwingRecording();
    
    // Cleanup services
    this.garminService.cleanup();
    this.mobileService.cleanup();
    
    // Clear callbacks
    this.statusChangeCallbacks = [];
    this.deviceConnectionCallbacks = [];
    this.swingDetectionCallbacks = [];
    this.motionDataCallbacks = [];
    this.errorCallbacks = [];
    
    // Clear state
    this.isInitialized = false;
    this.currentDeviceType = null;
    this.activeRoundId = null;
    this.swingAnalysisHistory = [];
    this.currentSwingData = [];
  }
}

// Export singleton instance
let _garminDeviceManager: GarminDeviceManager | null = null;

export const getGarminDeviceManager = (): GarminDeviceManager => {
  if (!_garminDeviceManager) {
    _garminDeviceManager = new GarminDeviceManager();
  }
  return _garminDeviceManager;
};

// Remove eager initialization to prevent errors during module loading
// Use getGarminDeviceManager() when needed instead