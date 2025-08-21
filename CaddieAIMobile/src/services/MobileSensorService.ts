import { Platform } from 'react-native';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import { Subscription } from 'rxjs';

// Import motion data interface from GarminBluetoothService
export interface MotionData {
  timestamp: number;
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope?: {
    x: number;
    y: number;
    z: number;
  };
  magnetometer?: {
    x: number;
    y: number;
    z: number;
  };
  activity?: {
    stepCount?: number;
    heartRate?: number;
    cadence?: number;
    power?: number;
  };
}

export enum SensorStatus {
  Inactive = 'inactive',
  Starting = 'starting',
  Active = 'active',
  Error = 'error',
  Calibrating = 'calibrating'
}

export interface SensorCalibration {
  accelerometer: {
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
  };
  gyroscope: {
    offsetX: number;
    offsetY: number;
    offsetZ: number;
  };
  magnetometer: {
    offsetX: number;
    offsetY: number;
    offsetZ: number;
  };
}

export interface SensorConfig {
  sampleRate: number;      // Hz - samples per second
  filterEnabled: boolean;  // Low-pass filter to reduce noise
  calibrationEnabled: boolean;
  swingDetectionEnabled: boolean;
  dataBufferSize: number;  // Number of samples to keep in buffer
}

/**
 * MobileSensorService - Fallback motion sensing using device's built-in sensors
 * 
 * This service provides swing analysis capabilities using the mobile device's
 * accelerometer, gyroscope, and magnetometer when a Garmin device is not available.
 * 
 * Key features:
 * - Multi-sensor data fusion (accelerometer, gyroscope, magnetometer)
 * - Real-time motion data processing
 * - Sensor calibration for improved accuracy
 * - Swing detection algorithms
 * - Data filtering and noise reduction
 * - Cross-platform compatibility (iOS/Android)
 */
export class MobileSensorService {
  private accelerometerSubscription: Subscription | null = null;
  private gyroscopeSubscription: Subscription | null = null;
  private magnetometerSubscription: Subscription | null = null;
  
  private sensorStatus: SensorStatus = SensorStatus.Inactive;
  private isMonitoring: boolean = false;
  private lastSensorReading: MotionData | null = null;
  
  // Sensor data buffers for analysis
  private accelerometerBuffer: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
  private gyroscopeBuffer: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
  private magnetometerBuffer: Array<{ x: number; y: number; z: number; timestamp: number }> = [];
  
  // Calibration data
  private calibration: SensorCalibration = {
    accelerometer: { offsetX: 0, offsetY: 0, offsetZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 },
    gyroscope: { offsetX: 0, offsetY: 0, offsetZ: 0 },
    magnetometer: { offsetX: 0, offsetY: 0, offsetZ: 0 },
  };
  
  // Configuration
  private config: SensorConfig = {
    sampleRate: 50, // 50 Hz - good for golf swing analysis
    filterEnabled: true,
    calibrationEnabled: true,
    swingDetectionEnabled: true,
    dataBufferSize: 1000, // 20 seconds at 50Hz
  };
  
  // Callbacks for motion data and events
  private motionDataCallbacks: Array<(data: MotionData) => void> = [];
  private statusChangeCallbacks: Array<(status: SensorStatus) => void> = [];
  private swingDetectionCallbacks: Array<(swingData: any) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];
  
  // Swing detection state
  private swingInProgress: boolean = false;
  private swingStartTime: number = 0;
  private swingData: MotionData[] = [];
  private swingThreshold = {
    acceleration: 2.0, // G-forces above resting
    gyroscope: 3.0,    // Rad/s rotational velocity
    duration: { min: 200, max: 2000 } // ms
  };

  constructor() {
    console.log('🔵 MobileSensorService: Initializing mobile sensor service');
    this.setupSensorConfiguration();
  }

  private setupSensorConfiguration(): void {
    // Configure sensor update intervals based on our sample rate
    const intervalMs = 1000 / this.config.sampleRate;
    
    setUpdateIntervalForType(SensorTypes.accelerometer, intervalMs);
    setUpdateIntervalForType(SensorTypes.gyroscope, intervalMs);
    setUpdateIntervalForType(SensorTypes.magnetometer, intervalMs);
    
    console.log(`🔵 MobileSensorService: Configured sensors for ${this.config.sampleRate}Hz (${intervalMs}ms interval)`);
  }

  /**
   * Start monitoring all available sensors
   */
  async startSensorMonitoring(): Promise<void> {
    try {
      console.log('🔵 MobileSensorService: Starting sensor monitoring...');
      
      if (this.isMonitoring) {
        console.log('🟡 MobileSensorService: Already monitoring, stopping previous session');
        await this.stopSensorMonitoring();
      }

      this.setStatus(SensorStatus.Starting);
      
      // Clear existing data
      this.clearSensorBuffers();
      
      // Start accelerometer monitoring
      await this.startAccelerometer();
      
      // Start gyroscope monitoring
      await this.startGyroscope();
      
      // Start magnetometer monitoring (may not be available on all devices)
      await this.startMagnetometer();
      
      this.isMonitoring = true;
      this.setStatus(SensorStatus.Active);
      
      console.log('✅ MobileSensorService: Sensor monitoring started successfully');
      
      // Start processing loop
      this.startDataProcessing();
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Failed to start sensor monitoring:', error);
      this.setStatus(SensorStatus.Error);
      this.notifyError(`Failed to start sensors: ${(error as Error).message}`);
      throw error;
    }
  }

  private async startAccelerometer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.accelerometerSubscription = accelerometer.subscribe({
          next: (data) => {
            const timestamp = Date.now();
            const calibratedData = this.applyCalibratedAccelerometer(data.x, data.y, data.z);
            
            // Add to buffer
            this.addToAccelerometerBuffer({
              ...calibratedData,
              timestamp
            });
            
            // Process immediately for real-time updates
            this.processLatestSensorData();
          },
          error: (error) => {
            console.error('🔴 MobileSensorService: Accelerometer error:', error);
            reject(error);
          },
        });
        
        console.log('✅ MobileSensorService: Accelerometer monitoring started');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async startGyroscope(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.gyroscopeSubscription = gyroscope.subscribe({
          next: (data) => {
            const timestamp = Date.now();
            const calibratedData = this.applyCalibratedGyroscope(data.x, data.y, data.z);
            
            // Add to buffer
            this.addToGyroscopeBuffer({
              ...calibratedData,
              timestamp
            });
          },
          error: (error) => {
            console.error('🔴 MobileSensorService: Gyroscope error:', error);
            reject(error);
          },
        });
        
        console.log('✅ MobileSensorService: Gyroscope monitoring started');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async startMagnetometer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.magnetometerSubscription = magnetometer.subscribe({
          next: (data) => {
            const timestamp = Date.now();
            const calibratedData = this.applyCalibratedMagnetometer(data.x, data.y, data.z);
            
            // Add to buffer
            this.addToMagnetometerBuffer({
              ...calibratedData,
              timestamp
            });
          },
          error: (error) => {
            console.warn('⚠️ MobileSensorService: Magnetometer error (may not be available):', error);
            // Magnetometer is optional - don't reject
            resolve();
          },
        });
        
        console.log('✅ MobileSensorService: Magnetometer monitoring started');
        resolve();
      } catch (error) {
        console.warn('⚠️ MobileSensorService: Magnetometer not available:', error);
        // Magnetometer is optional
        resolve();
      }
    });
  }

  /**
   * Stop all sensor monitoring
   */
  async stopSensorMonitoring(): Promise<void> {
    try {
      console.log('🔵 MobileSensorService: Stopping sensor monitoring...');
      
      // Stop all subscriptions
      if (this.accelerometerSubscription) {
        this.accelerometerSubscription.unsubscribe();
        this.accelerometerSubscription = null;
      }
      
      if (this.gyroscopeSubscription) {
        this.gyroscopeSubscription.unsubscribe();
        this.gyroscopeSubscription = null;
      }
      
      if (this.magnetometerSubscription) {
        this.magnetometerSubscription.unsubscribe();
        this.magnetometerSubscription = null;
      }
      
      this.isMonitoring = false;
      this.setStatus(SensorStatus.Inactive);
      
      // Clear data
      this.clearSensorBuffers();
      this.lastSensorReading = null;
      
      console.log('✅ MobileSensorService: Sensor monitoring stopped');
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error stopping sensor monitoring:', error);
      this.notifyError(`Failed to stop sensors: ${(error as Error).message}`);
    }
  }

  /**
   * Calibrate sensors by collecting baseline readings
   */
  async calibrateSensors(durationMs: number = 3000): Promise<void> {
    try {
      console.log(`🔵 MobileSensorService: Starting sensor calibration for ${durationMs}ms...`);
      
      this.setStatus(SensorStatus.Calibrating);
      
      // Clear existing calibration
      this.resetCalibration();
      
      // Collect calibration samples
      const calibrationData = {
        accelerometer: { x: [], y: [], z: [] } as any,
        gyroscope: { x: [], y: [], z: [] } as any,
        magnetometer: { x: [], y: [], z: [] } as any,
      };
      
      const startTime = Date.now();
      const sampleInterval = 50; // 20Hz sampling for calibration
      
      const calibrationInterval = setInterval(() => {
        // Collect current sensor readings
        if (this.accelerometerBuffer.length > 0) {
          const latest = this.accelerometerBuffer[this.accelerometerBuffer.length - 1];
          calibrationData.accelerometer.x.push(latest.x);
          calibrationData.accelerometer.y.push(latest.y);
          calibrationData.accelerometer.z.push(latest.z);
        }
        
        if (this.gyroscopeBuffer.length > 0) {
          const latest = this.gyroscopeBuffer[this.gyroscopeBuffer.length - 1];
          calibrationData.gyroscope.x.push(latest.x);
          calibrationData.gyroscope.y.push(latest.y);
          calibrationData.gyroscope.z.push(latest.z);
        }
        
        if (this.magnetometerBuffer.length > 0) {
          const latest = this.magnetometerBuffer[this.magnetometerBuffer.length - 1];
          calibrationData.magnetometer.x.push(latest.x);
          calibrationData.magnetometer.y.push(latest.y);
          calibrationData.magnetometer.z.push(latest.z);
        }
      }, sampleInterval);
      
      // Wait for calibration period
      await new Promise(resolve => setTimeout(resolve, durationMs));
      clearInterval(calibrationInterval);
      
      // Calculate calibration offsets
      this.calculateCalibrationOffsets(calibrationData);
      
      this.setStatus(SensorStatus.Active);
      console.log('✅ MobileSensorService: Sensor calibration completed');
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Calibration failed:', error);
      this.setStatus(SensorStatus.Error);
      this.notifyError(`Calibration failed: ${(error as Error).message}`);
    }
  }

  private calculateCalibrationOffsets(data: any): void {
    // Calculate mean offsets for gyroscope (should be zero when stationary)
    if (data.gyroscope.x.length > 0) {
      this.calibration.gyroscope.offsetX = data.gyroscope.x.reduce((a: number, b: number) => a + b, 0) / data.gyroscope.x.length;
      this.calibration.gyroscope.offsetY = data.gyroscope.y.reduce((a: number, b: number) => a + b, 0) / data.gyroscope.y.length;
      this.calibration.gyroscope.offsetZ = data.gyroscope.z.reduce((a: number, b: number) => a + b, 0) / data.gyroscope.z.length;
    }
    
    // For accelerometer, we expect gravity (9.81 m/s²) on one axis when stationary
    // This is more complex and would require knowing device orientation
    // For now, use simple offset calibration
    if (data.accelerometer.x.length > 0) {
      this.calibration.accelerometer.offsetX = data.accelerometer.x.reduce((a: number, b: number) => a + b, 0) / data.accelerometer.x.length;
      this.calibration.accelerometer.offsetY = data.accelerometer.y.reduce((a: number, b: number) => a + b, 0) / data.accelerometer.y.length;
      this.calibration.accelerometer.offsetZ = data.accelerometer.z.reduce((a: number, b: number) => a + b, 0) / data.accelerometer.z.length - 9.81; // Remove gravity
    }
    
    console.log('🔧 MobileSensorService: Calibration offsets calculated:', this.calibration);
  }

  private resetCalibration(): void {
    this.calibration = {
      accelerometer: { offsetX: 0, offsetY: 0, offsetZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1 },
      gyroscope: { offsetX: 0, offsetY: 0, offsetZ: 0 },
      magnetometer: { offsetX: 0, offsetY: 0, offsetZ: 0 },
    };
  }

  /**
   * Apply calibration to sensor readings
   */
  private applyCalibratedAccelerometer(x: number, y: number, z: number) {
    return {
      x: (x - this.calibration.accelerometer.offsetX) * this.calibration.accelerometer.scaleX,
      y: (y - this.calibration.accelerometer.offsetY) * this.calibration.accelerometer.scaleY,
      z: (z - this.calibration.accelerometer.offsetZ) * this.calibration.accelerometer.scaleZ,
    };
  }

  private applyCalibratedGyroscope(x: number, y: number, z: number) {
    return {
      x: x - this.calibration.gyroscope.offsetX,
      y: y - this.calibration.gyroscope.offsetY,
      z: z - this.calibration.gyroscope.offsetZ,
    };
  }

  private applyCalibratedMagnetometer(x: number, y: number, z: number) {
    return {
      x: x - this.calibration.magnetometer.offsetX,
      y: y - this.calibration.magnetometer.offsetY,
      z: z - this.calibration.magnetometer.offsetZ,
    };
  }

  /**
   * Data processing and fusion
   */
  private startDataProcessing(): void {
    // This would run a processing loop to combine sensor data
    // For now, we process data as it arrives
  }

  private processLatestSensorData(): void {
    try {
      const timestamp = Date.now();
      
      // Get latest readings from each sensor
      const latestAccel = this.accelerometerBuffer.length > 0 ? 
        this.accelerometerBuffer[this.accelerometerBuffer.length - 1] : null;
      const latestGyro = this.gyroscopeBuffer.length > 0 ? 
        this.gyroscopeBuffer[this.gyroscopeBuffer.length - 1] : null;
      const latestMag = this.magnetometerBuffer.length > 0 ? 
        this.magnetometerBuffer[this.magnetometerBuffer.length - 1] : null;
      
      if (!latestAccel) return; // Need at least accelerometer data
      
      // Create combined motion data
      const motionData: MotionData = {
        timestamp,
        accelerometer: {
          x: latestAccel.x,
          y: latestAccel.y,
          z: latestAccel.z,
        },
        gyroscope: latestGyro ? {
          x: latestGyro.x,
          y: latestGyro.y,
          z: latestGyro.z,
        } : undefined,
        magnetometer: latestMag ? {
          x: latestMag.x,
          y: latestMag.y,
          z: latestMag.z,
        } : undefined,
      };
      
      this.lastSensorReading = motionData;
      
      // Notify motion data callbacks
      this.motionDataCallbacks.forEach(callback => {
        try {
          callback(motionData);
        } catch (error) {
          console.error('🔴 MobileSensorService: Error in motion data callback:', error);
        }
      });
      
      // Check for swing detection
      if (this.config.swingDetectionEnabled) {
        this.analyzeForSwing(motionData);
      }
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error processing sensor data:', error);
    }
  }

  /**
   * Simple swing detection algorithm
   */
  private analyzeForSwing(motionData: MotionData): void {
    try {
      // Calculate total acceleration magnitude
      const accel = motionData.accelerometer;
      const totalAcceleration = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
      
      // Calculate rotational velocity magnitude if available
      let totalRotation = 0;
      if (motionData.gyroscope) {
        const gyro = motionData.gyroscope;
        totalRotation = Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
      }
      
      const now = Date.now();
      
      // Detect swing start
      if (!this.swingInProgress) {
        if (totalAcceleration > (9.81 + this.swingThreshold.acceleration) || // Above gravity + threshold
            totalRotation > this.swingThreshold.gyroscope) {
          
          console.log('🏌️ MobileSensorService: Swing detected - starting capture');
          this.swingInProgress = true;
          this.swingStartTime = now;
          this.swingData = [motionData];
        }
      } else {
        // Collect swing data
        this.swingData.push(motionData);
        
        const swingDuration = now - this.swingStartTime;
        
        // Check for swing end or timeout
        if (swingDuration > this.swingThreshold.duration.max || 
            (swingDuration > this.swingThreshold.duration.min && 
             totalAcceleration < (9.81 + this.swingThreshold.acceleration * 0.3))) {
          
          console.log(`🏌️ MobileSensorService: Swing completed - duration: ${swingDuration}ms, samples: ${this.swingData.length}`);
          this.processCompletedSwing();
          
          // Reset swing detection
          this.swingInProgress = false;
          this.swingData = [];
          this.swingStartTime = 0;
        }
      }
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error in swing analysis:', error);
    }
  }

  private processCompletedSwing(): void {
    if (this.swingData.length === 0) return;
    
    try {
      // Analyze swing characteristics
      const swingAnalysis = {
        duration: Date.now() - this.swingStartTime,
        sampleCount: this.swingData.length,
        peakAcceleration: this.calculatePeakAcceleration(),
        peakRotation: this.calculatePeakRotation(),
        swingData: this.swingData,
        timestamp: Date.now(),
      };
      
      console.log('📊 MobileSensorService: Swing analysis:', {
        duration: swingAnalysis.duration,
        samples: swingAnalysis.sampleCount,
        peakAccel: swingAnalysis.peakAcceleration?.toFixed(2),
        peakRotation: swingAnalysis.peakRotation?.toFixed(2),
      });
      
      // Notify swing detection callbacks
      this.swingDetectionCallbacks.forEach(callback => {
        try {
          callback(swingAnalysis);
        } catch (error) {
          console.error('🔴 MobileSensorService: Error in swing detection callback:', error);
        }
      });
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error processing completed swing:', error);
    }
  }

  private calculatePeakAcceleration(): number {
    let peak = 0;
    this.swingData.forEach(data => {
      const accel = data.accelerometer;
      const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
      if (magnitude > peak) peak = magnitude;
    });
    return peak;
  }

  private calculatePeakRotation(): number {
    let peak = 0;
    this.swingData.forEach(data => {
      if (data.gyroscope) {
        const gyro = data.gyroscope;
        const magnitude = Math.sqrt(gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z);
        if (magnitude > peak) peak = magnitude;
      }
    });
    return peak;
  }

  // Buffer management
  private addToAccelerometerBuffer(data: { x: number; y: number; z: number; timestamp: number }): void {
    this.accelerometerBuffer.push(data);
    if (this.accelerometerBuffer.length > this.config.dataBufferSize) {
      this.accelerometerBuffer.shift(); // Remove oldest
    }
  }

  private addToGyroscopeBuffer(data: { x: number; y: number; z: number; timestamp: number }): void {
    this.gyroscopeBuffer.push(data);
    if (this.gyroscopeBuffer.length > this.config.dataBufferSize) {
      this.gyroscopeBuffer.shift(); // Remove oldest
    }
  }

  private addToMagnetometerBuffer(data: { x: number; y: number; z: number; timestamp: number }): void {
    this.magnetometerBuffer.push(data);
    if (this.magnetometerBuffer.length > this.config.dataBufferSize) {
      this.magnetometerBuffer.shift(); // Remove oldest
    }
  }

  private clearSensorBuffers(): void {
    this.accelerometerBuffer = [];
    this.gyroscopeBuffer = [];
    this.magnetometerBuffer = [];
  }

  // Public getters
  getStatus(): SensorStatus {
    return this.sensorStatus;
  }

  isActivelyMonitoring(): boolean {
    return this.isMonitoring;
  }

  getLastReading(): MotionData | null {
    return this.lastSensorReading;
  }

  getConfiguration(): SensorConfig {
    return { ...this.config };
  }

  updateConfiguration(config: Partial<SensorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 MobileSensorService: Configuration updated:', this.config);
    
    if (this.isMonitoring) {
      // Restart with new configuration
      this.stopSensorMonitoring().then(() => {
        this.setupSensorConfiguration();
        this.startSensorMonitoring();
      });
    }
  }

  // Subscription methods
  onMotionData(callback: (data: MotionData) => void): () => void {
    this.motionDataCallbacks.push(callback);
    return () => {
      const index = this.motionDataCallbacks.indexOf(callback);
      if (index > -1) {
        this.motionDataCallbacks.splice(index, 1);
      }
    };
  }

  onStatusChange(callback: (status: SensorStatus) => void): () => void {
    this.statusChangeCallbacks.push(callback);
    return () => {
      const index = this.statusChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusChangeCallbacks.splice(index, 1);
      }
    };
  }

  onSwingDetection(callback: (swingData: any) => void): () => void {
    this.swingDetectionCallbacks.push(callback);
    return () => {
      const index = this.swingDetectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.swingDetectionCallbacks.splice(index, 1);
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
  private setStatus(status: SensorStatus): void {
    if (this.sensorStatus !== status) {
      this.sensorStatus = status;
      console.log(`🔵 MobileSensorService: Status changed to ${status}`);
      
      this.statusChangeCallbacks.forEach(callback => {
        try {
          callback(status);
        } catch (error) {
          console.error('🔴 MobileSensorService: Error in status change callback:', error);
        }
      });
    }
  }

  private notifyError(error: string): void {
    console.error(`🔴 MobileSensorService: ${error}`);
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('🔴 MobileSensorService: Error in error callback:', err);
      }
    });
  }

  /**
   * Clean up service resources
   */
  cleanup(): void {
    console.log('🔵 MobileSensorService: Cleaning up service resources');
    
    // Stop monitoring
    this.stopSensorMonitoring();
    
    // Clear callbacks
    this.motionDataCallbacks = [];
    this.statusChangeCallbacks = [];
    this.swingDetectionCallbacks = [];
    this.errorCallbacks = [];
    
    // Clear data
    this.clearSensorBuffers();
    this.lastSensorReading = null;
    this.swingData = [];
  }
}

// Export singleton instance
let _mobileSensorService: MobileSensorService | null = null;

export const getMobileSensorService = (): MobileSensorService => {
  if (!_mobileSensorService) {
    _mobileSensorService = new MobileSensorService();
  }
  return _mobileSensorService;
};

export const mobileSensorService = getMobileSensorService();