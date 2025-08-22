import { Platform } from 'react-native';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import { Subscription } from 'rxjs';

// Import motion data interface from SwingDetectionService for consistency
import { MotionData as SwingMotionData, SwingCalibration } from './SwingDetectionService';
import SwingDetectionService from './SwingDetectionService';
import SwingValidationService, { ValidationContext, ActivityLevel, DeviceStability, EnvironmentalFactors } from './SwingValidationService';

// Mobile-specific motion data interface
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

export interface MobileSwingDetectionResult {
  detected: boolean;
  confidence: number;
  swingMetrics?: any;
  source: 'mobile_sensors';
  sensorQuality: SensorQuality;
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

export interface SensorQuality {
  accelerometerQuality: number;   // 0-100 quality score
  gyroscopeQuality: number;       // 0-100 quality score
  magnetometerQuality: number;    // 0-100 quality score
  overallQuality: number;         // Combined quality score
  noiseLevel: number;             // Current noise level
  calibrationAccuracy: number;    // Calibration accuracy estimate
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
  private swingDetectionCallbacks: Array<(swingData: MobileSwingDetectionResult) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];
  
  // Advanced swing detection integration
  private swingDetectionService: SwingDetectionService;
  private swingValidationService: SwingValidationService;
  private currentCalibration: SwingCalibration | null = null;
  private isRoundActive: boolean = false;
  
  // Swing detection state
  private swingInProgress: boolean = false;
  private swingStartTime: number = 0;
  private swingData: MotionData[] = [];
  private swingThreshold = {
    acceleration: 15.0, // G-forces above resting (significantly increased for much less sensitivity)
    gyroscope: 8.0,     // Rad/s rotational velocity (increased for less sensitivity)
    duration: { min: 400, max: 2000 } // ms (increased minimum duration)
  };

  constructor() {
    console.log('🔵 MobileSensorService: Initializing mobile sensor service');
    this.swingDetectionService = SwingDetectionService.getInstance();
    this.swingValidationService = SwingValidationService.getInstance();
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
   * Advanced swing detection using SwingDetectionService
   */
  private async analyzeForSwing(motionData: MotionData): Promise<void> {
    try {
      // Convert mobile sensor data to swing detection format
      const swingMotionData: SwingMotionData = {
        acceleration: motionData.accelerometer,
        gyroscope: motionData.gyroscope || { x: 0, y: 0, z: 0 },
        timestamp: motionData.timestamp
      };
      
      // Add data to swing detection service
      if (this.currentCalibration) {
        this.swingDetectionService.addMotionData(swingMotionData);
        
        // Check if we have enough data for analysis
        if (this.swingData.length >= 50) { // Minimum 1 second of data at 50Hz
          await this.performAdvancedSwingDetection();
        }
      } else {
        // Use simple threshold-based detection as fallback
        await this.analyzeForSwingFallback(motionData);
      }
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error in advanced swing analysis:', error);
      // Fallback to simple detection
      await this.analyzeForSwingFallback(motionData);
    }
  }

  /**
   * Perform advanced swing detection using machine learning algorithms
   */
  private async performAdvancedSwingDetection(): Promise<void> {
    try {
      // Convert accumulated motion data for swing detection
      const swingMotionData: SwingMotionData[] = this.swingData.map(data => ({
        acceleration: data.accelerometer,
        gyroscope: data.gyroscope || { x: 0, y: 0, z: 0 },
        timestamp: data.timestamp
      }));

      // Run swing detection
      const detectionResult = await this.swingDetectionService.detectSwing(swingMotionData);
      
      if (detectionResult.isSwing) {
        // Create validation context
        const validationContext = this.createValidationContext();
        
        // Validate the swing detection
        const validationResult = await this.swingValidationService.validateSwing(
          detectionResult,
          validationContext
        );

        if (validationResult.isValid) {
          console.log('🎯 MobileSensorService: Advanced swing detection successful', {
            confidence: validationResult.adjustedConfidence,
            falsePositiveRisk: validationResult.falsePositiveRisk
          });
          
          await this.processAdvancedSwingDetection(detectionResult, validationResult.adjustedConfidence);
        } else {
          console.log('⚠️ MobileSensorService: Swing detection failed validation', {
            confidence: validationResult.adjustedConfidence,
            risk: validationResult.falsePositiveRisk
          });
        }
      }

      // Reset swing data collection
      this.swingData = this.swingData.slice(-25); // Keep last 0.5 seconds
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error in advanced swing detection:', error);
    }
  }

  /**
   * Fallback swing detection algorithm
   */
  private async analyzeForSwingFallback(motionData: MotionData): Promise<void> {
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
          
          console.log('🏌️ MobileSensorService: Fallback swing detected - starting capture');
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
          
          console.log(`🏌️ MobileSensorService: Fallback swing completed - duration: ${swingDuration}ms, samples: ${this.swingData.length}`);
          await this.processFallbackSwing();
          
          // Reset swing detection
          this.swingInProgress = false;
          this.swingData = [];
          this.swingStartTime = 0;
        }
      }
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error in fallback swing analysis:', error);
    }
  }

  /**
   * Process advanced swing detection result
   */
  private async processAdvancedSwingDetection(detectionResult: any, confidence: number): Promise<void> {
    try {
      const sensorQuality = this.calculateSensorQuality();
      
      const mobileSwingResult: MobileSwingDetectionResult = {
        detected: true,
        confidence,
        swingMetrics: detectionResult.metrics,
        source: 'mobile_sensors',
        sensorQuality
      };
      
      console.log('📊 MobileSensorService: Advanced swing analysis completed', {
        confidence,
        maxSpeed: detectionResult.metrics?.maxSpeed,
        backswingAngle: detectionResult.metrics?.backswingAngle,
        sensorQuality: sensorQuality.overallQuality
      });
      
      // Notify callbacks with mobile swing result
      this.notifySwingDetection(mobileSwingResult);
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error processing advanced swing detection:', error);
    }
  }

  /**
   * Process fallback swing detection
   */
  private async processFallbackSwing(): Promise<void> {
    if (this.swingData.length === 0) return;
    
    try {
      const sensorQuality = this.calculateSensorQuality();
      
      // Create basic swing metrics from fallback analysis
      const swingAnalysis = {
        duration: Date.now() - this.swingStartTime,
        sampleCount: this.swingData.length,
        peakAcceleration: this.calculatePeakAcceleration(),
        peakRotation: this.calculatePeakRotation(),
        swingData: this.swingData,
        timestamp: Date.now(),
      };
      
      // Estimate confidence based on swing characteristics
      const confidence = this.estimateSwingConfidence(swingAnalysis);
      
      const mobileSwingResult: MobileSwingDetectionResult = {
        detected: true,
        confidence,
        swingMetrics: swingAnalysis,
        source: 'mobile_sensors',
        sensorQuality
      };
      
      console.log('📊 MobileSensorService: Fallback swing analysis:', {
        duration: swingAnalysis.duration,
        samples: swingAnalysis.sampleCount,
        peakAccel: swingAnalysis.peakAcceleration?.toFixed(2),
        peakRotation: swingAnalysis.peakRotation?.toFixed(2),
        confidence
      });
      
      // Notify callbacks
      this.notifySwingDetection(mobileSwingResult);
      
    } catch (error) {
      console.error('🔴 MobileSensorService: Error processing fallback swing:', error);
    }
  }

  /**
   * Create validation context for swing detection
   */
  private createValidationContext(): ValidationContext {
    const now = new Date();
    const currentTime = now.getHours();
    
    // Calculate recent activity level
    const activityLevel: ActivityLevel = {
      walkingDetected: this.detectWalkingActivity(),
      drivingDetected: this.detectDrivingActivity(),
      staticPeriod: this.calculateStaticPeriod(),
      averageMotion: this.calculateAverageMotionLevel()
    };
    
    // Calculate device stability
    const deviceStability: DeviceStability = {
      accelerometerVariance: this.calculateAccelerometerVariance(),
      gyroscopeVariance: this.calculateGyroscopeVariance(),
      temperatureDrift: 0, // Not available from mobile sensors
      signalQuality: 100 // Mobile sensors are always connected
    };
    
    // Environmental factors (simplified for mobile)
    const environmentalFactors: EnvironmentalFactors = {
      windLevel: 0, // Not detectable from mobile sensors
      groundStability: 85, // Assume reasonable stability
      courseType: this.isRoundActive ? 'course' : 'practice'
    };
    
    return {
      isRoundActive: this.isRoundActive,
      timeOfDay: currentTime,
      recentActivity: activityLevel,
      deviceStability: deviceStability,
      environmentalFactors: environmentalFactors
    };
  }

  /**
   * Calculate current sensor quality metrics
   */
  private calculateSensorQuality(): SensorQuality {
    const accelerometerQuality = this.calculateAccelerometerQuality();
    const gyroscopeQuality = this.calculateGyroscopeQuality();
    const magnetometerQuality = this.calculateMagnetometerQuality();
    
    const overallQuality = (accelerometerQuality * 0.5 + gyroscopeQuality * 0.4 + magnetometerQuality * 0.1);
    const noiseLevel = this.calculateCurrentNoiseLevel();
    const calibrationAccuracy = this.estimateCalibrationAccuracy();
    
    return {
      accelerometerQuality,
      gyroscopeQuality,
      magnetometerQuality,
      overallQuality,
      noiseLevel,
      calibrationAccuracy
    };
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

  onSwingDetection(callback: (swingData: MobileSwingDetectionResult) => void): () => void {
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

  // Helper methods for validation context

  private detectWalkingActivity(): boolean {
    // Simple walking detection based on regular motion patterns
    if (this.accelerometerBuffer.length < 20) return false;
    
    const recentData = this.accelerometerBuffer.slice(-20);
    let stepCount = 0;
    
    for (let i = 1; i < recentData.length; i++) {
      const magnitude = Math.sqrt(
        recentData[i].x ** 2 + recentData[i].y ** 2 + recentData[i].z ** 2
      );
      if (magnitude > 11 && magnitude < 13) { // Typical walking acceleration
        stepCount++;
      }
    }
    
    return stepCount > 5; // At least 5 step-like motions in recent data
  }

  private detectDrivingActivity(): boolean {
    // Driving detection based on consistent horizontal motion
    if (this.accelerometerBuffer.length < 30) return false;
    
    const recentData = this.accelerometerBuffer.slice(-30);
    let consistentMotion = 0;
    
    for (const data of recentData) {
      const horizontalMagnitude = Math.sqrt(data.x ** 2 + data.y ** 2);
      if (horizontalMagnitude > 1 && horizontalMagnitude < 3) {
        consistentMotion++;
      }
    }
    
    return consistentMotion > 20; // Consistent low-level horizontal motion
  }

  private calculateStaticPeriod(): number {
    // Calculate how long device has been relatively static
    if (this.accelerometerBuffer.length < 10) return 0;
    
    const recentData = this.accelerometerBuffer.slice(-50); // Last 1 second
    let staticSamples = 0;
    
    for (const data of recentData) {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      if (Math.abs(magnitude - 9.81) < 0.5) { // Close to gravity only
        staticSamples++;
      }
    }
    
    return (staticSamples / recentData.length) * (recentData.length / this.config.sampleRate);
  }

  private calculateAverageMotionLevel(): number {
    if (this.accelerometerBuffer.length === 0) return 0;
    
    const recentData = this.accelerometerBuffer.slice(-100); // Last 2 seconds
    let totalMotion = 0;
    
    for (const data of recentData) {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      totalMotion += Math.abs(magnitude - 9.81); // Remove gravity component
    }
    
    return totalMotion / recentData.length;
  }

  // Sensor quality calculations

  private calculateAccelerometerQuality(): number {
    if (this.accelerometerBuffer.length < 10) return 50;
    
    const variance = this.calculateAccelerometerVariance();
    const quality = Math.max(0, 100 - (variance * 10));
    return Math.min(100, quality);
  }

  private calculateGyroscopeQuality(): number {
    if (this.gyroscopeBuffer.length < 10) return 50;
    
    const variance = this.calculateGyroscopeVariance();
    const quality = Math.max(0, 100 - (variance * 5));
    return Math.min(100, quality);
  }

  private calculateMagnetometerQuality(): number {
    if (this.magnetometerBuffer.length < 10) return 0; // Often not available
    
    // Simple quality based on data availability
    return 75;
  }

  private calculateAccelerometerVariance(): number {
    if (this.accelerometerBuffer.length < 2) return 0;
    
    const data = this.accelerometerBuffer.slice(-20);
    const magnitudes = data.map(d => Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2));
    const mean = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
    
    let variance = 0;
    for (const magnitude of magnitudes) {
      variance += Math.pow(magnitude - mean, 2);
    }
    
    return variance / magnitudes.length;
  }

  private calculateGyroscopeVariance(): number {
    if (this.gyroscopeBuffer.length < 2) return 0;
    
    const data = this.gyroscopeBuffer.slice(-20);
    const magnitudes = data.map(d => Math.sqrt(d.x ** 2 + d.y ** 2 + d.z ** 2));
    const mean = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
    
    let variance = 0;
    for (const magnitude of magnitudes) {
      variance += Math.pow(magnitude - mean, 2);
    }
    
    return variance / magnitudes.length;
  }

  private calculateCurrentNoiseLevel(): number {
    const accelVariance = this.calculateAccelerometerVariance();
    const gyroVariance = this.calculateGyroscopeVariance();
    
    return (accelVariance + gyroVariance) / 2;
  }

  private estimateCalibrationAccuracy(): number {
    // Estimate how accurate the current calibration is
    // This is simplified - in production would compare against known reference
    const noiseLevel = this.calculateCurrentNoiseLevel();
    const accuracy = Math.max(0, 100 - (noiseLevel * 20));
    return Math.min(100, accuracy);
  }

  private estimateSwingConfidence(swingAnalysis: any): number {
    let confidence = 40; // Lower base confidence
    
    // Duration check - golf swings are typically 600ms to 1800ms
    const duration = swingAnalysis.duration;
    if (duration >= 600 && duration <= 1800) {
      // Optimal duration range
      confidence += 25;
    } else if (duration >= 400 && duration < 600) {
      // Quick swing - still valid but lower confidence
      confidence += 15;
    } else if (duration > 1800 && duration <= 2500) {
      // Slower swing - possible but lower confidence
      confidence += 10;
    }
    
    // Sample count check - more samples = better data
    const sampleCount = swingAnalysis.sampleCount;
    if (sampleCount >= 30) {
      confidence += 15;
    } else if (sampleCount >= 20) {
      confidence += 10;
    } else if (sampleCount >= 15) {
      confidence += 5;
    }
    
    // Peak acceleration check - golf swings should have significant acceleration
    const peakAccel = swingAnalysis.peakAcceleration || 0;
    if (peakAccel > 50) {
      // Very strong swing
      confidence += 20;
    } else if (peakAccel > 30) {
      // Strong swing
      confidence += 15;
    } else if (peakAccel > 20) {
      // Moderate swing
      confidence += 10;
    } else if (peakAccel > this.swingThreshold.acceleration) {
      // Meets threshold but weak
      confidence += 5;
    }
    
    // Peak rotation check - golf swings involve significant rotation
    const peakRotation = swingAnalysis.peakRotation || 0;
    if (peakRotation > 15) {
      confidence += 10;
    } else if (peakRotation > 10) {
      confidence += 7;
    } else if (peakRotation > this.swingThreshold.gyroscope) {
      confidence += 3;
    }
    
    // Consistency penalty - if acceleration is way too high, it might be false positive
    if (peakAccel > 100) {
      confidence -= 20; // Probably dropped the phone or similar
    } else if (peakAccel > 80) {
      confidence -= 10; // Very suspicious
    }
    
    return Math.max(30, Math.min(95, confidence)); // Keep between 30-95%
  }

  private notifySwingDetection(result: MobileSwingDetectionResult): void {
    this.swingDetectionCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('🔴 MobileSensorService: Error in swing detection callback:', error);
      }
    });
  }

  // Public methods for integration

  /**
   * Set swing detection calibration
   */
  public setSwingCalibration(calibration: SwingCalibration): void {
    this.currentCalibration = calibration;
    
    // Initialize swing detection service with calibration
    this.swingDetectionService.initialize(calibration);
    
    console.log('🎯 MobileSensorService: Swing calibration applied', {
      userId: calibration.userId,
      handedness: calibration.handedness
    });
  }

  /**
   * Set round active status for context validation
   */
  public setRoundActive(isActive: boolean): void {
    this.isRoundActive = isActive;
    console.log('⛳ MobileSensorService: Round active status updated:', isActive);
  }

  /**
   * Get current sensor quality assessment
   */
  public getCurrentSensorQuality(): SensorQuality {
    return this.calculateSensorQuality();
  }

  /**
   * Get detection statistics
   */
  public getDetectionStats(): {
    sessionsActive: boolean,
    dataBufferSize: number,
    sensorQuality: SensorQuality,
    calibrationStatus: string
  } {
    return {
      sessionsActive: this.isMonitoring,
      dataBufferSize: this.accelerometerBuffer.length,
      sensorQuality: this.calculateSensorQuality(),
      calibrationStatus: this.currentCalibration ? 'calibrated' : 'not_calibrated'
    };
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