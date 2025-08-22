import { SwingMetrics, SwingCalibration, MotionData } from './SwingDetectionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CalibrationSession {
  id: string;
  userId: number;
  startTime: number;
  endTime?: number;
  calibrationSwings: CalibrationSwing[];
  environmentalConditions: EnvironmentalConditions;
  deviceInfo: DeviceInfo;
  status: 'active' | 'completed' | 'cancelled';
}

export interface CalibrationSwing {
  id: string;
  timestamp: number;
  confirmedSwing: boolean;        // User confirmed this is a valid swing
  clubType: 'driver' | 'iron' | 'wedge' | 'putter';
  metrics: SwingMetrics;
  rawData: MotionData[];
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  ballContact: 'solid' | 'thin' | 'fat' | 'miss';
  shotResult: 'good' | 'okay' | 'poor';
  feltRhythm: 'smooth' | 'rushed' | 'slow';
  confidence: number;             // User confidence in swing (1-10)
}

export interface EnvironmentalConditions {
  temperature: number;            // Celsius
  windLevel: number;              // 0-10 scale
  courseType: 'driving_range' | 'practice_area' | 'course';
  groundCondition: 'firm' | 'soft' | 'wet';
}

export interface DeviceInfo {
  deviceType: 'garmin' | 'mobile';
  model?: string;
  signalStrength: number;         // 0-100
  batteryLevel: number;           // 0-100
  firmwareVersion?: string;
}

export interface PersonalizedThresholds {
  swingSpeedRange: [number, number];      // Personal min/max swing speeds
  backswingAngleRange: [number, number];  // Personal backswing range
  tempoRange: [number, number];           // Personal tempo preferences
  impactTimingRange: [number, number];    // Personal timing range
  confidenceThreshold: number;            // Minimum confidence for auto-detection
}

export interface CalibrationProgress {
  swingsCollected: number;
  targetSwings: number;
  clubsCalibrated: string[];
  accuracyImprovement: number;    // Percentage improvement
  recommendedNextSteps: string[];
}

export interface AdaptiveLearningData {
  userId: number;
  totalSwings: number;
  confirmedSwings: number;
  falsePositives: number;
  accuracy: number;               // Current detection accuracy
  lastUpdated: number;
  learningRate: number;           // How quickly to adapt (0-1)
  stabilityPeriod: number;        // Swings before considering calibration stable
}

/**
 * SwingCalibrationService
 * 
 * Provides personalized calibration and adaptive learning for swing detection.
 * Learns from user feedback to improve accuracy over time.
 */
export class SwingCalibrationService {
  private static instance: SwingCalibrationService | null = null;
  private currentSession: CalibrationSession | null = null;
  private learningData: Map<number, AdaptiveLearningData> = new Map();
  
  // Storage keys
  private readonly CALIBRATION_KEY = 'swing_calibration_';
  private readonly LEARNING_DATA_KEY = 'learning_data_';
  private readonly SESSION_KEY = 'calibration_session_';

  private constructor() {
    this.loadLearningData();
  }

  public static getInstance(): SwingCalibrationService {
    if (!SwingCalibrationService.instance) {
      SwingCalibrationService.instance = new SwingCalibrationService();
    }
    return SwingCalibrationService.instance;
  }

  /**
   * Start a new calibration session
   */
  public async startCalibrationSession(
    userId: number,
    environmentalConditions: EnvironmentalConditions,
    deviceInfo: DeviceInfo
  ): Promise<CalibrationSession> {
    const session: CalibrationSession = {
      id: `calibration_${userId}_${Date.now()}`,
      userId,
      startTime: Date.now(),
      calibrationSwings: [],
      environmentalConditions,
      deviceInfo,
      status: 'active'
    };

    this.currentSession = session;
    await this.saveCalibrationSession(session);

    console.log('🎯 SwingCalibrationService: Started calibration session', {
      sessionId: session.id,
      userId,
      environment: environmentalConditions.courseType
    });

    return session;
  }

  /**
   * Add a swing to the current calibration session
   */
  public async addCalibrationSwing(
    metrics: SwingMetrics,
    rawData: MotionData[],
    clubType: 'driver' | 'iron' | 'wedge' | 'putter',
    confirmedSwing: boolean = false,
    userFeedback?: UserFeedback
  ): Promise<CalibrationSwing | null> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      console.warn('⚠️ SwingCalibrationService: No active calibration session');
      return null;
    }

    const calibrationSwing: CalibrationSwing = {
      id: `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      confirmedSwing,
      clubType,
      metrics,
      rawData,
      userFeedback
    };

    this.currentSession.calibrationSwings.push(calibrationSwing);
    await this.saveCalibrationSession(this.currentSession);

    // Update learning data
    await this.updateLearningData(this.currentSession.userId, confirmedSwing);

    console.log('📊 SwingCalibrationService: Added calibration swing', {
      swingId: calibrationSwing.id,
      confirmed: confirmedSwing,
      clubType,
      totalSwings: this.currentSession.calibrationSwings.length
    });

    return calibrationSwing;
  }

  /**
   * Complete the current calibration session and generate personalized calibration
   */
  public async completeCalibrationSession(): Promise<SwingCalibration | null> {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      console.warn('⚠️ SwingCalibrationService: No active calibration session to complete');
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.status = 'completed';

    const calibration = await this.generatePersonalizedCalibration(this.currentSession);
    
    if (calibration) {
      await this.saveUserCalibration(calibration);
    }

    await this.saveCalibrationSession(this.currentSession);
    this.currentSession = null;

    console.log('✅ SwingCalibrationService: Calibration session completed', {
      userId: calibration?.userId,
      swingsCollected: this.currentSession?.calibrationSwings.length
    });

    return calibration;
  }

  /**
   * Generate personalized calibration from session data
   */
  private async generatePersonalizedCalibration(session: CalibrationSession): Promise<SwingCalibration | null> {
    const confirmedSwings = session.calibrationSwings.filter(s => s.confirmedSwing);
    
    if (confirmedSwings.length < 5) {
      console.warn('⚠️ SwingCalibrationService: Insufficient confirmed swings for calibration');
      return null;
    }

    // Calculate baseline noise from non-swing data
    const baselineNoise = this.calculateBaselineNoise(session.calibrationSwings);
    
    // Calculate personalized swing threshold
    const swingThreshold = this.calculateSwingThreshold(confirmedSwings);
    
    // Determine handedness from swing patterns
    const handedness = this.determineHandedness(confirmedSwings);
    
    // Get most common club type
    const clubTypes = confirmedSwings.map(s => s.clubType);
    const clubType = this.getMostCommon(clubTypes) || 'iron';
    
    // Calculate personalized thresholds
    const personalizedThresholds = this.calculatePersonalizedThresholds(confirmedSwings);

    const calibration: SwingCalibration = {
      userId: session.userId,
      baselineNoise,
      swingThreshold,
      handedness,
      clubType,
      personalizedThresholds
    };

    console.log('🎯 SwingCalibrationService: Generated personalized calibration', {
      userId: session.userId,
      swingThreshold,
      handedness,
      confirmedSwings: confirmedSwings.length
    });

    return calibration;
  }

  /**
   * Calculate baseline noise level from calibration data
   */
  private calculateBaselineNoise(swings: CalibrationSwing[]): number {
    const nonSwingData: number[] = [];
    
    for (const swing of swings) {
      if (!swing.confirmedSwing) {
        // Use data from non-confirmed swings as noise samples
        for (const dataPoint of swing.rawData) {
          const magnitude = Math.sqrt(
            dataPoint.acceleration.x ** 2 + 
            dataPoint.acceleration.y ** 2 + 
            dataPoint.acceleration.z ** 2
          );
          nonSwingData.push(magnitude);
        }
      }
    }
    
    if (nonSwingData.length === 0) {
      return 0.5; // Default noise level
    }
    
    // Calculate 95th percentile as baseline noise threshold
    nonSwingData.sort((a, b) => a - b);
    const percentile95 = Math.floor(nonSwingData.length * 0.95);
    
    return nonSwingData[percentile95] || 0.5;
  }

  /**
   * Calculate personalized swing detection threshold
   */
  private calculateSwingThreshold(confirmedSwings: CalibrationSwing[]): number {
    const maxSpeeds = confirmedSwings.map(s => s.metrics.maxSpeed);
    const minMaxSpeed = Math.min(...maxSpeeds);
    
    // Set threshold at 80% of minimum confirmed swing speed
    return minMaxSpeed * 0.8;
  }

  /**
   * Determine handedness from swing patterns
   */
  private determineHandedness(confirmedSwings: CalibrationSwing[]): 'right' | 'left' {
    // Analyze swing plane and rotation patterns
    let rightHandedIndicators = 0;
    let leftHandedIndicators = 0;
    
    for (const swing of confirmedSwings) {
      // Simplified handedness detection based on gyroscope patterns
      const avgGyroY = swing.rawData.reduce((sum, point) => sum + point.gyroscope.y, 0) / swing.rawData.length;
      
      if (avgGyroY > 0) {
        rightHandedIndicators++;
      } else {
        leftHandedIndicators++;
      }
    }
    
    return rightHandedIndicators > leftHandedIndicators ? 'right' : 'left';
  }

  /**
   * Calculate personalized detection thresholds
   */
  private calculatePersonalizedThresholds(confirmedSwings: CalibrationSwing[]): PersonalizedThresholds {
    const speeds = confirmedSwings.map(s => s.metrics.maxSpeed);
    const angles = confirmedSwings.map(s => s.metrics.backswingAngle);
    const tempos = confirmedSwings.map(s => s.metrics.swingTempo);
    const timings = confirmedSwings.map(s => s.metrics.impactTiming);
    
    return {
      swingSpeedRange: [Math.min(...speeds) * 0.8, Math.max(...speeds) * 1.2],
      backswingAngleRange: [Math.min(...angles) * 0.9, Math.max(...angles) * 1.1],
      tempoRange: [Math.min(...tempos) * 0.8, Math.max(...tempos) * 1.2],
      impactTimingRange: [Math.min(...timings) * 0.9, Math.max(...timings) * 1.1],
      confidenceThreshold: 75 // Start with 75% confidence requirement
    };
  }

  /**
   * Get most common value from array
   */
  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    
    let maxCount = 0;
    let mostCommon: T | null = null;
    
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    
    return mostCommon;
  }

  /**
   * Update adaptive learning data based on swing feedback
   */
  private async updateLearningData(userId: number, confirmedSwing: boolean): Promise<void> {
    let learningData = this.learningData.get(userId);
    
    if (!learningData) {
      learningData = {
        userId,
        totalSwings: 0,
        confirmedSwings: 0,
        falsePositives: 0,
        accuracy: 0,
        lastUpdated: Date.now(),
        learningRate: 0.1,
        stabilityPeriod: 20
      };
    }
    
    learningData.totalSwings++;
    if (confirmedSwing) {
      learningData.confirmedSwings++;
    } else {
      learningData.falsePositives++;
    }
    
    learningData.accuracy = learningData.confirmedSwings / learningData.totalSwings;
    learningData.lastUpdated = Date.now();
    
    // Decrease learning rate as user gets more stable
    if (learningData.totalSwings > learningData.stabilityPeriod) {
      learningData.learningRate = Math.max(0.05, learningData.learningRate * 0.95);
    }
    
    this.learningData.set(userId, learningData);
    await this.saveLearningData(userId, learningData);
    
    console.log('📈 SwingCalibrationService: Updated learning data', {
      userId,
      totalSwings: learningData.totalSwings,
      accuracy: Math.round(learningData.accuracy * 100) + '%'
    });
  }

  /**
   * Get calibration progress for current session
   */
  public getCalibrationProgress(): CalibrationProgress | null {
    if (!this.currentSession) {
      return null;
    }
    
    const targetSwings = 15; // Target number of calibration swings
    const swingsCollected = this.currentSession.calibrationSwings.length;
    const confirmedSwings = this.currentSession.calibrationSwings.filter(s => s.confirmedSwing);
    
    const clubsCalibrated = [...new Set(confirmedSwings.map(s => s.clubType))];
    
    const learningData = this.learningData.get(this.currentSession.userId);
    const accuracyImprovement = learningData?.accuracy ? (learningData.accuracy - 0.5) * 100 : 0;
    
    const recommendations: string[] = [];
    if (confirmedSwings.length < 5) {
      recommendations.push('Take more practice swings and confirm valid swings');
    }
    if (clubsCalibrated.length < 2) {
      recommendations.push('Try swings with different club types');
    }
    if (swingsCollected < targetSwings) {
      recommendations.push(`Take ${targetSwings - swingsCollected} more swings for better calibration`);
    }
    
    return {
      swingsCollected,
      targetSwings,
      clubsCalibrated,
      accuracyImprovement: Math.round(accuracyImprovement),
      recommendedNextSteps: recommendations
    };
  }

  /**
   * Apply adaptive learning to existing calibration
   */
  public async adaptCalibration(
    userId: number,
    swingMetrics: SwingMetrics,
    wasCorrectDetection: boolean
  ): Promise<SwingCalibration | null> {
    const currentCalibration = await this.loadUserCalibration(userId);
    if (!currentCalibration) {
      console.warn('⚠️ SwingCalibrationService: No calibration found for adaptive learning');
      return null;
    }
    
    const learningData = this.learningData.get(userId);
    if (!learningData) {
      console.warn('⚠️ SwingCalibrationService: No learning data found for user');
      return currentCalibration;
    }
    
    // Adaptive learning with exponential smoothing
    const alpha = learningData.learningRate;
    
    if (wasCorrectDetection) {
      // Gradually adjust thresholds toward this successful swing
      const currentSpeed = swingMetrics.maxSpeed;
      const currentTempo = swingMetrics.swingTempo;
      
      // Update swing threshold (move slightly toward this swing's characteristics)
      if (currentSpeed > currentCalibration.swingThreshold) {
        currentCalibration.swingThreshold = 
          (1 - alpha) * currentCalibration.swingThreshold + alpha * (currentSpeed * 0.8);
      }
      
      // Update personalized thresholds
      if (currentSpeed < currentCalibration.personalizedThresholds.swingSpeedRange[0]) {
        currentCalibration.personalizedThresholds.swingSpeedRange[0] = 
          (1 - alpha) * currentCalibration.personalizedThresholds.swingSpeedRange[0] + alpha * currentSpeed;
      }
      
      if (currentSpeed > currentCalibration.personalizedThresholds.swingSpeedRange[1]) {
        currentCalibration.personalizedThresholds.swingSpeedRange[1] = 
          (1 - alpha) * currentCalibration.personalizedThresholds.swingSpeedRange[1] + alpha * currentSpeed;
      }
      
      console.log('🎯 SwingCalibrationService: Adapted calibration based on correct detection');
    } else {
      // False positive - increase thresholds to be more conservative
      currentCalibration.swingThreshold *= (1 + alpha * 0.1);
      currentCalibration.personalizedThresholds.confidenceThreshold = 
        Math.min(95, currentCalibration.personalizedThresholds.confidenceThreshold + 2);
      
      console.log('⚡ SwingCalibrationService: Adapted calibration to reduce false positives');
    }
    
    await this.saveUserCalibration(currentCalibration);
    return currentCalibration;
  }

  /**
   * Load user calibration from storage
   */
  public async loadUserCalibration(userId: number): Promise<SwingCalibration | null> {
    try {
      const calibrationData = await AsyncStorage.getItem(`${this.CALIBRATION_KEY}${userId}`);
      if (calibrationData) {
        return JSON.parse(calibrationData);
      }
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error loading calibration:', error);
    }
    return null;
  }

  /**
   * Save user calibration to storage
   */
  private async saveUserCalibration(calibration: SwingCalibration): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.CALIBRATION_KEY}${calibration.userId}`, 
        JSON.stringify(calibration)
      );
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error saving calibration:', error);
    }
  }

  /**
   * Save calibration session to storage
   */
  private async saveCalibrationSession(session: CalibrationSession): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.SESSION_KEY}${session.id}`, JSON.stringify(session));
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error saving session:', error);
    }
  }

  /**
   * Load learning data from storage
   */
  private async loadLearningData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const learningKeys = keys.filter(key => key.startsWith(this.LEARNING_DATA_KEY));
      
      for (const key of learningKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const learningData: AdaptiveLearningData = JSON.parse(data);
          this.learningData.set(learningData.userId, learningData);
        }
      }
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error loading learning data:', error);
    }
  }

  /**
   * Save learning data to storage
   */
  private async saveLearningData(userId: number, data: AdaptiveLearningData): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.LEARNING_DATA_KEY}${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error saving learning data:', error);
    }
  }

  /**
   * Get current calibration session
   */
  public getCurrentSession(): CalibrationSession | null {
    return this.currentSession;
  }

  /**
   * Cancel current calibration session
   */
  public async cancelCalibrationSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.status = 'cancelled';
      await this.saveCalibrationSession(this.currentSession);
      this.currentSession = null;
      console.log('❌ SwingCalibrationService: Calibration session cancelled');
    }
  }

  /**
   * Get learning statistics for user
   */
  public getLearningStats(userId: number): AdaptiveLearningData | null {
    return this.learningData.get(userId) || null;
  }

  /**
   * Reset user calibration and learning data
   */
  public async resetUserCalibration(userId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.CALIBRATION_KEY}${userId}`);
      await AsyncStorage.removeItem(`${this.LEARNING_DATA_KEY}${userId}`);
      this.learningData.delete(userId);
      console.log('🔄 SwingCalibrationService: User calibration reset');
    } catch (error) {
      console.error('❌ SwingCalibrationService: Error resetting calibration:', error);
    }
  }
}

export default SwingCalibrationService;