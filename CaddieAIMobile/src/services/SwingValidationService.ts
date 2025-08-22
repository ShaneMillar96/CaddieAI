import { MotionData, SwingDetectionResult, SwingMetrics, SwingPhase } from './SwingDetectionService';
import { PatternMatchResult } from './SwingPatternService';

export interface ValidationContext {
  isRoundActive: boolean;         // Only detect swings during active rounds
  timeOfDay: number;             // Hour of day (0-23) for context
  recentActivity: ActivityLevel; // Recent user activity level
  deviceStability: DeviceStability; // Device stability metrics
  environmentalFactors: EnvironmentalFactors;
}

export interface ActivityLevel {
  walkingDetected: boolean;      // Walking motion detected
  drivingDetected: boolean;      // Driving motion detected
  staticPeriod: number;          // Seconds of static positioning before swing
  averageMotion: number;         // Average motion level in past minute
}

export interface DeviceStability {
  accelerometerVariance: number; // Variance in accelerometer readings
  gyroscopeVariance: number;     // Variance in gyroscope readings
  temperatureDrift: number;      // Temperature-related drift
  signalQuality: number;         // BLE signal quality (0-100)
}

export interface EnvironmentalFactors {
  windLevel: number;             // Estimated wind level (0-10)
  groundStability: number;       // Ground stability estimate (0-100)
  courseType: 'practice' | 'course' | 'simulator' | 'unknown';
}

export interface FalsePositivePattern {
  id: string;
  name: string;
  description: string;
  characteristics: MotionCharacteristics;
  confidencePenalty: number;     // Penalty to apply if pattern matches
}

export interface MotionCharacteristics {
  durationRange: [number, number];     // Duration range in ms
  accelerationPattern: AccelerationPattern;
  frequencyDomain: FrequencyCharacteristics;
  periodicity: PeriodicityPattern;
}

export interface AccelerationPattern {
  averageMagnitude: number;
  peakCount: number;             // Number of acceleration peaks
  smoothness: number;            // Motion smoothness (0-100)
  directionConsistency: number;  // Direction consistency (0-100)
}

export interface FrequencyCharacteristics {
  dominantFrequency: number;     // Hz
  harmonics: number[];           // Harmonic frequencies
  noiseLevel: number;            // Background noise level
}

export interface PeriodicityPattern {
  isRepeating: boolean;          // Is motion repeating?
  repeatInterval: number;        // Interval between repeats (ms)
  repeatConsistency: number;     // Consistency of repeats (0-100)
}

export interface ValidationResult {
  isValid: boolean;
  adjustedConfidence: number;    // Confidence after validation adjustments
  falsePositiveRisk: number;     // Risk of false positive (0-100)
  validationFactors: ValidationFactor[];
  recommendations: string[];
}

export interface ValidationFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;                // Impact weight (0-1)
  description: string;
}

/**
 * SwingValidationService
 * 
 * Advanced validation system to reduce false positives and improve
 * swing detection accuracy through contextual analysis and pattern filtering.
 */
export class SwingValidationService {
  private static instance: SwingValidationService | null = null;
  private falsePositivePatterns: Map<string, FalsePositivePattern> = new Map();
  private validationHistory: SwingDetectionResult[] = [];
  private readonly MAX_HISTORY = 50;

  private constructor() {
    this.initializeFalsePositivePatterns();
  }

  public static getInstance(): SwingValidationService {
    if (!SwingValidationService.instance) {
      SwingValidationService.instance = new SwingValidationService();
    }
    return SwingValidationService.instance;
  }

  /**
   * Initialize common false positive patterns
   */
  private initializeFalsePositivePatterns(): void {
    // Walking pattern
    const walkingPattern: FalsePositivePattern = {
      id: 'walking',
      name: 'Walking Motion',
      description: 'Regular walking steps that could be mistaken for swings',
      characteristics: {
        durationRange: [400, 800],
        accelerationPattern: {
          averageMagnitude: 3.0,
          peakCount: 2,
          smoothness: 85,
          directionConsistency: 90
        },
        frequencyDomain: {
          dominantFrequency: 2.0, // ~2 Hz for walking
          harmonics: [1.0, 2.0, 4.0],
          noiseLevel: 0.2
        },
        periodicity: {
          isRepeating: true,
          repeatInterval: 500,
          repeatConsistency: 85
        }
      },
      confidencePenalty: 40
    };

    // Car door/trunk closing
    const carDoorPattern: FalsePositivePattern = {
      id: 'car_door',
      name: 'Car Door Closing',
      description: 'Sharp impact from closing car doors or trunks',
      characteristics: {
        durationRange: [100, 300],
        accelerationPattern: {
          averageMagnitude: 8.0,
          peakCount: 1,
          smoothness: 20,
          directionConsistency: 95
        },
        frequencyDomain: {
          dominantFrequency: 15.0, // High frequency impact
          harmonics: [15.0, 30.0],
          noiseLevel: 0.5
        },
        periodicity: {
          isRepeating: false,
          repeatInterval: 0,
          repeatConsistency: 0
        }
      },
      confidencePenalty: 50
    };

    // Practice swings (without ball contact)
    const practiceSwingPattern: FalsePositivePattern = {
      id: 'practice_swing',
      name: 'Practice Swing',
      description: 'Practice swings without ball contact - less deceleration at impact',
      characteristics: {
        durationRange: [800, 1500],
        accelerationPattern: {
          averageMagnitude: 6.0,
          peakCount: 2,
          smoothness: 75,
          directionConsistency: 80
        },
        frequencyDomain: {
          dominantFrequency: 1.5,
          harmonics: [1.5, 3.0],
          noiseLevel: 0.3
        },
        periodicity: {
          isRepeating: false,
          repeatInterval: 0,
          repeatConsistency: 0
        }
      },
      confidencePenalty: 20 // Less penalty as these are still valid swing motions
    };

    // Putting motion (very different from full swing)
    const puttingPattern: FalsePositivePattern = {
      id: 'putting',
      name: 'Putting Stroke',
      description: 'Putting strokes have very different characteristics than full swings',
      characteristics: {
        durationRange: [200, 600],
        accelerationPattern: {
          averageMagnitude: 2.0,
          peakCount: 1,
          smoothness: 90,
          directionConsistency: 95
        },
        frequencyDomain: {
          dominantFrequency: 0.8,
          harmonics: [0.8],
          noiseLevel: 0.1
        },
        periodicity: {
          isRepeating: false,
          repeatInterval: 0,
          repeatConsistency: 0
        }
      },
      confidencePenalty: 30
    };

    // Store patterns
    this.falsePositivePatterns.set(walkingPattern.id, walkingPattern);
    this.falsePositivePatterns.set(carDoorPattern.id, carDoorPattern);
    this.falsePositivePatterns.set(practiceSwingPattern.id, practiceSwingPattern);
    this.falsePositivePatterns.set(puttingPattern.id, puttingPattern);

    console.log('✅ SwingValidationService: Initialized with', this.falsePositivePatterns.size, 'false positive patterns');
  }

  /**
   * Validate swing detection result with contextual analysis
   */
  public async validateSwing(
    swingResult: SwingDetectionResult,
    context: ValidationContext,
    patternMatch?: PatternMatchResult
  ): Promise<ValidationResult> {
    const validationFactors: ValidationFactor[] = [];
    let adjustedConfidence = swingResult.confidence;
    let falsePositiveRisk = 0;

    // Step 1: Context validation
    const contextValidation = this.validateContext(context);
    validationFactors.push(...contextValidation.factors);
    adjustedConfidence *= contextValidation.confidenceMultiplier;
    falsePositiveRisk += contextValidation.riskIncrease;

    // Step 2: False positive pattern matching
    const patternValidation = await this.checkFalsePositivePatterns(swingResult);
    validationFactors.push(...patternValidation.factors);
    adjustedConfidence -= patternValidation.confidencePenalty;
    falsePositiveRisk += patternValidation.riskIncrease;

    // Step 3: Historical consistency check
    const historyValidation = this.validateAgainstHistory(swingResult);
    validationFactors.push(...historyValidation.factors);
    adjustedConfidence *= historyValidation.confidenceMultiplier;
    falsePositiveRisk += historyValidation.riskIncrease;

    // Step 4: Pattern match consistency (if available)
    if (patternMatch) {
      const matchValidation = this.validatePatternMatch(patternMatch, swingResult);
      validationFactors.push(...matchValidation.factors);
      adjustedConfidence *= matchValidation.confidenceMultiplier;
      falsePositiveRisk += matchValidation.riskIncrease;
    }

    // Step 5: Device stability check
    const stabilityValidation = this.validateDeviceStability(context.deviceStability);
    validationFactors.push(...stabilityValidation.factors);
    adjustedConfidence *= stabilityValidation.confidenceMultiplier;
    falsePositiveRisk += stabilityValidation.riskIncrease;

    // Ensure confidence stays within bounds
    adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence));
    falsePositiveRisk = Math.max(0, Math.min(100, falsePositiveRisk));

    // Add to history if confidence is reasonable
    if (adjustedConfidence > 30) {
      this.addToHistory(swingResult);
    }

    const isValid = adjustedConfidence > 60 && falsePositiveRisk < 40;
    const recommendations = this.generateValidationRecommendations(validationFactors, context);

    console.log('🔍 SwingValidationService: Validation complete', {
      originalConfidence: swingResult.confidence,
      adjustedConfidence: Math.round(adjustedConfidence),
      falsePositiveRisk: Math.round(falsePositiveRisk),
      isValid
    });

    return {
      isValid,
      adjustedConfidence: Math.round(adjustedConfidence),
      falsePositiveRisk: Math.round(falsePositiveRisk),
      validationFactors,
      recommendations
    };
  }

  /**
   * Validate context factors that affect swing detection reliability
   */
  private validateContext(context: ValidationContext): {
    factors: ValidationFactor[],
    confidenceMultiplier: number,
    riskIncrease: number
  } {
    const factors: ValidationFactor[] = [];
    let confidenceMultiplier = 1.0;
    let riskIncrease = 0;

    // Round activity validation
    if (!context.isRoundActive) {
      factors.push({
        factor: 'Round Status',
        impact: 'negative',
        weight: 0.3,
        description: 'No active golf round detected - increases false positive risk'
      });
      confidenceMultiplier *= 0.7;
      riskIncrease += 25;
    } else {
      factors.push({
        factor: 'Round Status',
        impact: 'positive',
        weight: 0.2,
        description: 'Active golf round provides context for swing detection'
      });
    }

    // Recent activity validation
    if (context.recentActivity.walkingDetected) {
      factors.push({
        factor: 'Walking Activity',
        impact: 'negative',
        weight: 0.2,
        description: 'Recent walking activity may cause false positives'
      });
      confidenceMultiplier *= 0.85;
      riskIncrease += 15;
    }

    if (context.recentActivity.drivingDetected) {
      factors.push({
        factor: 'Driving Activity',
        impact: 'negative',
        weight: 0.3,
        description: 'Driving activity strongly suggests false positive'
      });
      confidenceMultiplier *= 0.6;
      riskIncrease += 35;
    }

    // Static period validation
    if (context.recentActivity.staticPeriod > 5) {
      factors.push({
        factor: 'Pre-swing Stability',
        impact: 'positive',
        weight: 0.2,
        description: 'Good pre-swing stability increases confidence'
      });
      confidenceMultiplier *= 1.1;
    } else {
      factors.push({
        factor: 'Pre-swing Stability',
        impact: 'negative',
        weight: 0.1,
        description: 'Limited pre-swing stability period'
      });
      riskIncrease += 10;
    }

    // Time of day factor
    if (context.timeOfDay >= 6 && context.timeOfDay <= 18) {
      factors.push({
        factor: 'Time of Day',
        impact: 'positive',
        weight: 0.1,
        description: 'Typical golf playing hours'
      });
    } else {
      factors.push({
        factor: 'Time of Day',
        impact: 'negative',
        weight: 0.1,
        description: 'Unusual time for golf - may indicate false positive'
      });
      riskIncrease += 5;
    }

    return { factors, confidenceMultiplier, riskIncrease };
  }

  /**
   * Check swing against known false positive patterns
   */
  private async checkFalsePositivePatterns(swingResult: SwingDetectionResult): Promise<{
    factors: ValidationFactor[],
    confidencePenalty: number,
    riskIncrease: number
  }> {
    const factors: ValidationFactor[] = [];
    let confidencePenalty = 0;
    let riskIncrease = 0;

    for (const pattern of this.falsePositivePatterns.values()) {
      const match = await this.matchesPattern(swingResult, pattern);
      
      if (match.matches) {
        factors.push({
          factor: `False Positive: ${pattern.name}`,
          impact: 'negative',
          weight: match.matchStrength,
          description: `Motion matches ${pattern.description}`
        });
        
        const penalty = pattern.confidencePenalty * match.matchStrength;
        confidencePenalty += penalty;
        riskIncrease += penalty * 0.8;

        console.log('⚠️ SwingValidationService: False positive pattern detected:', {
          pattern: pattern.name,
          matchStrength: match.matchStrength,
          penalty
        });
      }
    }

    return { factors, confidencePenalty, riskIncrease };
  }

  /**
   * Check if swing matches a false positive pattern
   */
  private async matchesPattern(
    swingResult: SwingDetectionResult, 
    pattern: FalsePositivePattern
  ): Promise<{ matches: boolean, matchStrength: number }> {
    let matchScore = 0;
    let totalChecks = 0;

    // Duration check
    const swingDuration = this.calculateSwingDuration(swingResult.swingPhases || []);
    const [minDur, maxDur] = pattern.characteristics.durationRange;
    if (swingDuration >= minDur && swingDuration <= maxDur) {
      matchScore += 0.3;
    }
    totalChecks += 0.3;

    // Acceleration pattern check
    if (swingResult.metrics) {
      const accelMatch = this.checkAccelerationPattern(
        swingResult.rawData, 
        pattern.characteristics.accelerationPattern
      );
      matchScore += accelMatch * 0.4;
    }
    totalChecks += 0.4;

    // Frequency domain check (simplified)
    const freqMatch = this.checkFrequencyPattern(
      swingResult.rawData, 
      pattern.characteristics.frequencyDomain
    );
    matchScore += freqMatch * 0.3;
    totalChecks += 0.3;

    const matchStrength = totalChecks > 0 ? matchScore / totalChecks : 0;
    const matches = matchStrength > 0.6; // 60% threshold for pattern match

    return { matches, matchStrength };
  }

  /**
   * Calculate swing duration from phases
   */
  private calculateSwingDuration(phases: SwingPhase[]): number {
    if (phases.length === 0) return 0;
    
    const firstPhase = phases[0];
    const lastPhase = phases[phases.length - 1];
    
    return lastPhase.endTime - firstPhase.startTime;
  }

  /**
   * Check if motion data matches acceleration pattern characteristics
   */
  private checkAccelerationPattern(data: MotionData[], pattern: AccelerationPattern): number {
    if (data.length === 0) return 0;

    // Calculate average magnitude
    const averageMag = data.reduce((sum, point) => {
      return sum + Math.sqrt(
        point.acceleration.x ** 2 + 
        point.acceleration.y ** 2 + 
        point.acceleration.z ** 2
      );
    }, 0) / data.length;

    // Simple pattern matching (could be enhanced with more sophisticated analysis)
    const magMatch = Math.max(0, 1 - Math.abs(averageMag - pattern.averageMagnitude) / pattern.averageMagnitude);
    
    return Math.min(1, magMatch);
  }

  /**
   * Check frequency characteristics (simplified implementation)
   */
  private checkFrequencyPattern(data: MotionData[], pattern: FrequencyCharacteristics): number {
    if (data.length < 10) return 0;

    // Calculate approximate dominant frequency using zero crossings
    let zeroCrossings = 0;
    const accelerations = data.map(point => 
      Math.sqrt(point.acceleration.x ** 2 + point.acceleration.y ** 2 + point.acceleration.z ** 2)
    );
    
    const average = accelerations.reduce((sum, val) => sum + val, 0) / accelerations.length;
    
    for (let i = 1; i < accelerations.length; i++) {
      if ((accelerations[i] - average) * (accelerations[i - 1] - average) < 0) {
        zeroCrossings++;
      }
    }

    const duration = (data[data.length - 1].timestamp - data[0].timestamp) / 1000; // Convert to seconds
    const estimatedFreq = zeroCrossings / (2 * duration); // Approximate frequency

    const freqMatch = Math.max(0, 1 - Math.abs(estimatedFreq - pattern.dominantFrequency) / pattern.dominantFrequency);
    
    return Math.min(1, freqMatch);
  }

  /**
   * Validate swing against historical data
   */
  private validateAgainstHistory(swingResult: SwingDetectionResult): {
    factors: ValidationFactor[],
    confidenceMultiplier: number,
    riskIncrease: number
  } {
    const factors: ValidationFactor[] = [];
    let confidenceMultiplier = 1.0;
    let riskIncrease = 0;

    if (this.validationHistory.length === 0) {
      factors.push({
        factor: 'Historical Data',
        impact: 'neutral',
        weight: 0.1,
        description: 'No historical swing data available for comparison'
      });
      return { factors, confidenceMultiplier, riskIncrease };
    }

    // Check consistency with recent swings
    const recentSwings = this.validationHistory.slice(-5); // Last 5 swings
    const avgConfidence = recentSwings.reduce((sum, swing) => sum + swing.confidence, 0) / recentSwings.length;
    
    if (swingResult.confidence > avgConfidence * 1.5) {
      factors.push({
        factor: 'Historical Consistency',
        impact: 'negative',
        weight: 0.2,
        description: 'Swing confidence unusually high compared to recent history'
      });
      confidenceMultiplier *= 0.9;
      riskIncrease += 10;
    } else if (swingResult.confidence < avgConfidence * 0.5) {
      factors.push({
        factor: 'Historical Consistency',
        impact: 'negative',
        weight: 0.1,
        description: 'Swing confidence unusually low compared to recent history'
      });
      confidenceMultiplier *= 0.95;
      riskIncrease += 5;
    } else {
      factors.push({
        factor: 'Historical Consistency',
        impact: 'positive',
        weight: 0.1,
        description: 'Swing confidence consistent with recent history'
      });
    }

    return { factors, confidenceMultiplier, riskIncrease };
  }

  /**
   * Validate pattern match consistency
   */
  private validatePatternMatch(
    patternMatch: PatternMatchResult, 
    swingResult: SwingDetectionResult
  ): {
    factors: ValidationFactor[],
    confidenceMultiplier: number,
    riskIncrease: number
  } {
    const factors: ValidationFactor[] = [];
    let confidenceMultiplier = 1.0;
    let riskIncrease = 0;

    if (patternMatch.overallMatch > 80) {
      factors.push({
        factor: 'Pattern Match Quality',
        impact: 'positive',
        weight: 0.3,
        description: `Excellent match with ${patternMatch.templateName} (${patternMatch.overallMatch}%)`
      });
      confidenceMultiplier *= 1.2;
    } else if (patternMatch.overallMatch < 50) {
      factors.push({
        factor: 'Pattern Match Quality',
        impact: 'negative',
        weight: 0.2,
        description: `Poor match with ${patternMatch.templateName} (${patternMatch.overallMatch}%)`
      });
      confidenceMultiplier *= 0.8;
      riskIncrease += 15;
    }

    return { factors, confidenceMultiplier, riskIncrease };
  }

  /**
   * Validate device stability factors
   */
  private validateDeviceStability(stability: DeviceStability): {
    factors: ValidationFactor[],
    confidenceMultiplier: number,
    riskIncrease: number
  } {
    const factors: ValidationFactor[] = [];
    let confidenceMultiplier = 1.0;
    let riskIncrease = 0;

    if (stability.signalQuality < 70) {
      factors.push({
        factor: 'Signal Quality',
        impact: 'negative',
        weight: 0.2,
        description: `Low BLE signal quality (${stability.signalQuality}%)`
      });
      confidenceMultiplier *= 0.85;
      riskIncrease += 15;
    }

    if (stability.accelerometerVariance > 2.0) {
      factors.push({
        factor: 'Sensor Stability',
        impact: 'negative',
        weight: 0.1,
        description: 'High accelerometer variance may affect accuracy'
      });
      confidenceMultiplier *= 0.9;
      riskIncrease += 10;
    }

    return { factors, confidenceMultiplier, riskIncrease };
  }

  /**
   * Add swing to validation history
   */
  private addToHistory(swingResult: SwingDetectionResult): void {
    this.validationHistory.push(swingResult);
    
    if (this.validationHistory.length > this.MAX_HISTORY) {
      this.validationHistory.shift();
    }
  }

  /**
   * Generate validation recommendations
   */
  private generateValidationRecommendations(
    factors: ValidationFactor[], 
    context: ValidationContext
  ): string[] {
    const recommendations: string[] = [];
    
    const negativeFactors = factors.filter(f => f.impact === 'negative');
    
    if (negativeFactors.some(f => f.factor.includes('Round Status'))) {
      recommendations.push('Start a golf round for more accurate swing detection');
    }
    
    if (negativeFactors.some(f => f.factor.includes('Walking') || f.factor.includes('Driving'))) {
      recommendations.push('Ensure device is stable before swinging');
    }
    
    if (negativeFactors.some(f => f.factor.includes('Signal Quality'))) {
      recommendations.push('Check Bluetooth connection and move closer to device');
    }
    
    if (negativeFactors.some(f => f.factor.includes('False Positive'))) {
      recommendations.push('Consider manual confirmation for swing detection');
    }

    return recommendations;
  }

  /**
   * Get validation statistics
   */
  public getValidationStats(): {
    totalValidations: number,
    averageConfidence: number,
    falsePositiveRate: number
  } {
    const totalValidations = this.validationHistory.length;
    const averageConfidence = totalValidations > 0 
      ? this.validationHistory.reduce((sum, swing) => sum + swing.confidence, 0) / totalValidations
      : 0;
    
    // Estimate false positive rate based on very low confidence swings
    const lowConfidenceSwings = this.validationHistory.filter(swing => swing.confidence < 40).length;
    const falsePositiveRate = totalValidations > 0 ? (lowConfidenceSwings / totalValidations) * 100 : 0;

    return {
      totalValidations,
      averageConfidence: Math.round(averageConfidence),
      falsePositiveRate: Math.round(falsePositiveRate)
    };
  }

  /**
   * Clear validation history
   */
  public clearHistory(): void {
    this.validationHistory = [];
    console.log('🔄 SwingValidationService: History cleared');
  }
}

export default SwingValidationService;