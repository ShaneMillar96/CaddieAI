import { DeviceMotion } from 'react-native-sensors';

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}

export interface SwingMetrics {
  maxSpeed: number;           // Peak acceleration magnitude (m/s²)
  backswingAngle: number;     // Maximum backswing angle (degrees)
  downswingAngle: number;     // Maximum downswing angle (degrees)
  impactTiming: number;       // Time from backswing peak to impact (ms)
  followThroughAngle: number; // Maximum follow-through angle (degrees)
  swingTempo: number;         // Ratio of backswing to downswing time
  swingPlane: number;         // Swing plane angle (degrees)
  clubheadSpeed: number;      // Estimated clubhead speed (mph)
}

export interface SwingDetectionResult {
  isSwing: boolean;
  confidence: number;         // 0-100% confidence score
  metrics?: SwingMetrics;
  swingPhases?: SwingPhase[];
  rawData: MotionData[];
}

export interface SwingPhase {
  phase: 'address' | 'backswing' | 'transition' | 'downswing' | 'impact' | 'followthrough';
  startTime: number;
  endTime: number;
  peakAcceleration?: number;
  peakAngularVelocity?: number;
}

export interface SwingCalibration {
  userId: number;
  baselineNoise: number;      // Baseline noise level for filtering
  swingThreshold: number;     // Minimum acceleration for swing detection
  handedness: 'right' | 'left'; // Player handedness
  clubType: 'driver' | 'iron' | 'wedge' | 'putter'; // Last known club
  personalizedThresholds: {
    minBackswingAngle: number;
    minDownswingSpeed: number;
    expectedTempo: number;
  };
}

/**
 * SwingDetectionService
 * 
 * Analyzes motion sensor data to detect golf swings with high accuracy.
 * Implements advanced algorithms for pattern recognition, noise filtering,
 * and swing phase detection.
 */
export class SwingDetectionService {
  private static instance: SwingDetectionService | null = null;
  private motionBuffer: MotionData[] = [];
  private isAnalyzing = false;
  private calibration: SwingCalibration | null = null;
  
  // Detection constants
  private readonly BUFFER_SIZE = 200; // 4 seconds at 50Hz
  private readonly SWING_WINDOW_MS = 3000; // 3-second analysis window
  private readonly NOISE_THRESHOLD = 0.5; // Base noise threshold (m/s²)
  private readonly SWING_MIN_DURATION = 800; // Minimum swing duration (ms)
  private readonly SWING_MAX_DURATION = 2500; // Maximum swing duration (ms)
  
  // Swing phase thresholds
  private readonly BACKSWING_THRESHOLD = 2.0; // Minimum acceleration for backswing
  private readonly DOWNSWING_THRESHOLD = 5.0; // Minimum acceleration for downswing
  private readonly IMPACT_THRESHOLD = 12.0; // Minimum acceleration for impact
  private readonly GYRO_THRESHOLD = 200; // Minimum angular velocity (deg/s)

  private constructor() {}

  public static getInstance(): SwingDetectionService {
    if (!SwingDetectionService.instance) {
      SwingDetectionService.instance = new SwingDetectionService();
    }
    return SwingDetectionService.instance;
  }

  /**
   * Initialize swing detection with user calibration data
   */
  public async initialize(calibration: SwingCalibration): Promise<void> {
    this.calibration = calibration;
    this.motionBuffer = [];
    this.isAnalyzing = false;
    
    console.log('🏌️ SwingDetectionService: Initialized with calibration:', {
      userId: calibration.userId,
      handedness: calibration.handedness,
      swingThreshold: calibration.swingThreshold
    });
  }

  /**
   * Add motion data point to the analysis buffer
   */
  public addMotionData(data: MotionData): void {
    if (!this.calibration) {
      console.warn('⚠️ SwingDetectionService: Not initialized with calibration');
      return;
    }

    // Add to circular buffer
    this.motionBuffer.push(data);
    if (this.motionBuffer.length > this.BUFFER_SIZE) {
      this.motionBuffer.shift();
    }

    // Trigger analysis if buffer is sufficient
    if (this.motionBuffer.length >= 50 && !this.isAnalyzing) {
      this.triggerSwingAnalysis();
    }
  }

  /**
   * Analyze motion data for swing detection
   */
  private async triggerSwingAnalysis(): Promise<void> {
    if (this.isAnalyzing || this.motionBuffer.length < 50) {
      return;
    }

    this.isAnalyzing = true;

    try {
      const result = await this.detectSwing(this.motionBuffer);
      
      if (result.isSwing && result.confidence > 70) {
        console.log('🎯 SwingDetectionService: Swing detected!', {
          confidence: result.confidence,
          maxSpeed: result.metrics?.maxSpeed,
          backswingAngle: result.metrics?.backswingAngle
        });
        
        // Clear buffer after successful detection to prevent duplicate detections
        this.motionBuffer = this.motionBuffer.slice(-25); // Keep last 0.5 seconds
      }
    } catch (error) {
      console.error('❌ SwingDetectionService: Analysis error:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Core swing detection algorithm
   */
  public async detectSwing(motionData: MotionData[]): Promise<SwingDetectionResult> {
    if (!this.calibration) {
      throw new Error('SwingDetectionService not initialized');
    }

    // Step 1: Noise filtering and smoothing
    const filteredData = this.applyNoiseFilter(motionData);
    
    // Step 2: Calculate motion magnitudes
    const magnitudes = this.calculateMotionMagnitudes(filteredData);
    
    // Step 3: Identify swing candidates
    const swingCandidates = this.identifySwingCandidates(magnitudes, filteredData);
    
    // Step 4: Analyze each candidate
    let bestSwing: SwingDetectionResult = {
      isSwing: false,
      confidence: 0,
      rawData: filteredData
    };

    for (const candidate of swingCandidates) {
      const analysis = await this.analyzeSwingCandidate(candidate, filteredData);
      
      if (analysis.confidence > bestSwing.confidence) {
        bestSwing = analysis;
      }
    }

    return bestSwing;
  }

  /**
   * Apply noise filtering to motion data
   */
  private applyNoiseFilter(data: MotionData[]): MotionData[] {
    if (!this.calibration) return data;
    
    const filtered: MotionData[] = [];
    const windowSize = 3; // Simple moving average
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
      const window = data.slice(start, end);
      
      // Calculate moving average
      const avgAccel = {
        x: window.reduce((sum, d) => sum + d.acceleration.x, 0) / window.length,
        y: window.reduce((sum, d) => sum + d.acceleration.y, 0) / window.length,
        z: window.reduce((sum, d) => sum + d.acceleration.z, 0) / window.length,
      };
      
      const avgGyro = {
        x: window.reduce((sum, d) => sum + d.gyroscope.x, 0) / window.length,
        y: window.reduce((sum, d) => sum + d.gyroscope.y, 0) / window.length,
        z: window.reduce((sum, d) => sum + d.gyroscope.z, 0) / window.length,
      };
      
      // Apply noise threshold
      const magnitude = Math.sqrt(avgAccel.x ** 2 + avgAccel.y ** 2 + avgAccel.z ** 2);
      
      if (magnitude > this.calibration.baselineNoise) {
        filtered.push({
          acceleration: avgAccel,
          gyroscope: avgGyro,
          timestamp: data[i].timestamp
        });
      }
    }
    
    return filtered;
  }

  /**
   * Calculate motion magnitudes for swing detection
   */
  private calculateMotionMagnitudes(data: MotionData[]): number[] {
    return data.map(point => {
      const accelMag = Math.sqrt(
        point.acceleration.x ** 2 + 
        point.acceleration.y ** 2 + 
        point.acceleration.z ** 2
      );
      
      const gyroMag = Math.sqrt(
        point.gyroscope.x ** 2 + 
        point.gyroscope.y ** 2 + 
        point.gyroscope.z ** 2
      );
      
      // Combine acceleration and gyroscope for swing signature
      return accelMag + (gyroMag / 100); // Scale gyro appropriately
    });
  }

  /**
   * Identify potential swing periods in the data
   */
  private identifySwingCandidates(magnitudes: number[], data: MotionData[]): Array<{start: number, end: number}> {
    if (!this.calibration) return [];
    
    const candidates: Array<{start: number, end: number}> = [];
    const threshold = this.calibration.swingThreshold;
    
    let inSwing = false;
    let swingStart = 0;
    
    for (let i = 0; i < magnitudes.length; i++) {
      if (!inSwing && magnitudes[i] > threshold) {
        // Potential swing start
        inSwing = true;
        swingStart = i;
      } else if (inSwing && magnitudes[i] < threshold * 0.3) {
        // Swing end (drop below 30% of threshold)
        const swingEnd = i;
        const duration = data[swingEnd].timestamp - data[swingStart].timestamp;
        
        // Validate swing duration
        if (duration >= this.SWING_MIN_DURATION && duration <= this.SWING_MAX_DURATION) {
          candidates.push({ start: swingStart, end: swingEnd });
        }
        
        inSwing = false;
      }
    }
    
    return candidates;
  }

  /**
   * Analyze a swing candidate for pattern matching
   */
  private async analyzeSwingCandidate(
    candidate: {start: number, end: number}, 
    data: MotionData[]
  ): Promise<SwingDetectionResult> {
    const swingData = data.slice(candidate.start, candidate.end);
    
    // Step 1: Detect swing phases
    const phases = this.detectSwingPhases(swingData);
    
    // Step 2: Calculate swing metrics
    const metrics = this.calculateSwingMetrics(swingData, phases);
    
    // Step 3: Calculate confidence score
    const confidence = this.calculateConfidenceScore(swingData, phases, metrics);
    
    return {
      isSwing: confidence > 60, // 60% minimum confidence
      confidence,
      metrics,
      swingPhases: phases,
      rawData: swingData
    };
  }

  /**
   * Detect swing phases (backswing, downswing, impact, follow-through)
   */
  private detectSwingPhases(data: MotionData[]): SwingPhase[] {
    const phases: SwingPhase[] = [];
    const magnitudes = this.calculateMotionMagnitudes(data);
    
    // Find key transition points
    const peakAccelIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const midPoint = Math.floor(data.length / 2);
    
    // Address phase (first 10% or until movement starts)
    let addressEnd = 0;
    for (let i = 0; i < Math.min(data.length * 0.1, 10); i++) {
      if (magnitudes[i] > this.BACKSWING_THRESHOLD) break;
      addressEnd = i;
    }
    
    if (addressEnd > 0) {
      phases.push({
        phase: 'address',
        startTime: data[0].timestamp,
        endTime: data[addressEnd].timestamp
      });
    }
    
    // Backswing phase (from address end to midpoint)
    const backswingStart = addressEnd;
    const backswingEnd = Math.min(midPoint, peakAccelIndex - 5);
    
    if (backswingEnd > backswingStart) {
      const backswingData = magnitudes.slice(backswingStart, backswingEnd);
      const peakBackswingAccel = Math.max(...backswingData);
      
      phases.push({
        phase: 'backswing',
        startTime: data[backswingStart].timestamp,
        endTime: data[backswingEnd].timestamp,
        peakAcceleration: peakBackswingAccel
      });
    }
    
    // Transition phase (brief pause at top)
    const transitionStart = backswingEnd;
    const transitionEnd = Math.min(transitionStart + 3, peakAccelIndex - 2);
    
    if (transitionEnd > transitionStart) {
      phases.push({
        phase: 'transition',
        startTime: data[transitionStart].timestamp,
        endTime: data[transitionEnd].timestamp
      });
    }
    
    // Downswing phase (from transition to peak acceleration)
    const downswingStart = transitionEnd;
    const downswingEnd = peakAccelIndex;
    
    if (downswingEnd > downswingStart) {
      const downswingData = magnitudes.slice(downswingStart, downswingEnd);
      const peakDownswingAccel = Math.max(...downswingData);
      
      phases.push({
        phase: 'downswing',
        startTime: data[downswingStart].timestamp,
        endTime: data[downswingEnd].timestamp,
        peakAcceleration: peakDownswingAccel
      });
    }
    
    // Impact phase (at peak acceleration)
    phases.push({
      phase: 'impact',
      startTime: data[peakAccelIndex].timestamp,
      endTime: data[Math.min(peakAccelIndex + 2, data.length - 1)].timestamp,
      peakAcceleration: magnitudes[peakAccelIndex]
    });
    
    // Follow-through phase (after impact to end)
    const followThroughStart = peakAccelIndex + 2;
    if (followThroughStart < data.length) {
      const followThroughData = magnitudes.slice(followThroughStart);
      const peakFollowThrough = Math.max(...followThroughData);
      
      phases.push({
        phase: 'followthrough',
        startTime: data[followThroughStart].timestamp,
        endTime: data[data.length - 1].timestamp,
        peakAcceleration: peakFollowThrough
      });
    }
    
    return phases;
  }

  /**
   * Calculate comprehensive swing metrics
   */
  private calculateSwingMetrics(data: MotionData[], phases: SwingPhase[]): SwingMetrics {
    const magnitudes = this.calculateMotionMagnitudes(data);
    const maxSpeed = Math.max(...magnitudes);
    
    // Find phase-specific metrics
    const backswingPhase = phases.find(p => p.phase === 'backswing');
    const downswingPhase = phases.find(p => p.phase === 'downswing');
    const impactPhase = phases.find(p => p.phase === 'impact');
    const followThroughPhase = phases.find(p => p.phase === 'followthrough');
    
    // Calculate angles (simplified - would need more complex 3D analysis)
    const backswingAngle = this.calculateSwingAngle(data, backswingPhase);
    const downswingAngle = this.calculateSwingAngle(data, downswingPhase);
    const followThroughAngle = this.calculateSwingAngle(data, followThroughPhase);
    
    // Calculate timing metrics
    const impactTiming = backswingPhase && impactPhase 
      ? impactPhase.startTime - backswingPhase.startTime
      : 0;
    
    const backswingTime = backswingPhase 
      ? backswingPhase.endTime - backswingPhase.startTime 
      : 1;
    const downswingTime = downswingPhase 
      ? downswingPhase.endTime - downswingPhase.startTime 
      : 1;
    
    const swingTempo = backswingTime / downswingTime;
    
    // Estimate clubhead speed (simplified calculation)
    const clubheadSpeed = this.estimateClubheadSpeed(maxSpeed, swingTempo);
    
    // Calculate swing plane (simplified)
    const swingPlane = this.calculateSwingPlane(data);
    
    return {
      maxSpeed,
      backswingAngle,
      downswingAngle,
      impactTiming,
      followThroughAngle,
      swingTempo,
      swingPlane,
      clubheadSpeed
    };
  }

  /**
   * Calculate swing angle for a specific phase
   */
  private calculateSwingAngle(data: MotionData[], phase?: SwingPhase): number {
    if (!phase) return 0;
    
    // Find data points in this phase
    const phaseData = data.filter(d => 
      d.timestamp >= phase.startTime && d.timestamp <= phase.endTime
    );
    
    if (phaseData.length < 2) return 0;
    
    // Calculate angle using gyroscope data (simplified)
    const totalRotation = phaseData.reduce((sum, point) => {
      return sum + Math.abs(point.gyroscope.y); // Primary swing plane rotation
    }, 0);
    
    const avgRotation = totalRotation / phaseData.length;
    const duration = (phase.endTime - phase.startTime) / 1000; // Convert to seconds
    
    // Convert angular velocity to approximate angle
    return Math.min(180, avgRotation * duration);
  }

  /**
   * Estimate clubhead speed from sensor data
   */
  private estimateClubheadSpeed(maxAcceleration: number, tempo: number): number {
    // Simplified estimation - would need calibration with actual clubhead speed data
    // Based on research correlating wrist acceleration to clubhead speed
    
    const baseSpeed = maxAcceleration * 4.5; // Empirical scaling factor
    const tempoAdjustment = Math.max(0.8, Math.min(1.2, 3.0 / tempo)); // Optimal tempo around 3:1
    
    return Math.round(baseSpeed * tempoAdjustment);
  }

  /**
   * Calculate swing plane angle
   */
  private calculateSwingPlane(data: MotionData[]): number {
    // Calculate dominant motion plane using acceleration vectors
    let xzMotion = 0;
    let yzMotion = 0;
    
    for (const point of data) {
      xzMotion += Math.abs(point.acceleration.x) + Math.abs(point.acceleration.z);
      yzMotion += Math.abs(point.acceleration.y) + Math.abs(point.acceleration.z);
    }
    
    // Return angle from vertical (0 = vertical, 90 = horizontal)
    const planeRatio = xzMotion / (yzMotion + 0.1); // Avoid division by zero
    return Math.min(90, Math.atan(planeRatio) * (180 / Math.PI));
  }

  /**
   * Calculate confidence score for swing detection
   */
  private calculateConfidenceScore(
    data: MotionData[], 
    phases: SwingPhase[], 
    metrics: SwingMetrics
  ): number {
    let confidence = 0;
    
    // Phase detection quality (40 points max)
    const expectedPhases = ['backswing', 'downswing', 'impact'];
    const detectedPhases = phases.map(p => p.phase);
    const phaseScore = expectedPhases.filter(p => detectedPhases.includes(p)).length;
    confidence += (phaseScore / expectedPhases.length) * 40;
    
    // Acceleration pattern quality (30 points max)
    if (metrics.maxSpeed > this.IMPACT_THRESHOLD) {
      confidence += 20; // Strong impact signature
    } else if (metrics.maxSpeed > this.DOWNSWING_THRESHOLD) {
      confidence += 10; // Moderate swing signature
    }
    
    if (metrics.swingTempo > 1.5 && metrics.swingTempo < 5.0) {
      confidence += 10; // Realistic swing tempo
    }
    
    // Swing characteristics (30 points max)
    if (metrics.backswingAngle > 30 && metrics.backswingAngle < 120) {
      confidence += 10; // Realistic backswing angle
    }
    
    if (metrics.followThroughAngle > 20) {
      confidence += 10; // Follow-through present
    }
    
    if (metrics.clubheadSpeed > 20 && metrics.clubheadSpeed < 150) {
      confidence += 10; // Realistic clubhead speed
    }
    
    // Apply calibration adjustments
    if (this.calibration) {
      // Reduce confidence if swing doesn't match user's typical patterns
      if (Math.abs(metrics.swingTempo - this.calibration.personalizedThresholds.expectedTempo) > 2.0) {
        confidence *= 0.9; // 10% penalty for unusual tempo
      }
    }
    
    return Math.min(100, Math.max(0, Math.round(confidence)));
  }

  /**
   * Get current calibration settings
   */
  public getCalibration(): SwingCalibration | null {
    return this.calibration;
  }

  /**
   * Update calibration based on confirmed swings
   */
  public updateCalibration(confirmedSwing: SwingMetrics): void {
    if (!this.calibration) return;
    
    // Update expected tempo with exponential smoothing
    const alpha = 0.1; // Learning rate
    this.calibration.personalizedThresholds.expectedTempo = 
      (1 - alpha) * this.calibration.personalizedThresholds.expectedTempo + 
      alpha * confirmedSwing.swingTempo;
    
    console.log('📊 SwingDetectionService: Calibration updated', {
      newExpectedTempo: this.calibration.personalizedThresholds.expectedTempo
    });
  }

  /**
   * Reset motion buffer and analysis state
   */
  public reset(): void {
    this.motionBuffer = [];
    this.isAnalyzing = false;
    console.log('🔄 SwingDetectionService: Reset');
  }
}

export default SwingDetectionService;