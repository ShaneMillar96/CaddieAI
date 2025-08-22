import { MotionData, SwingMetrics, SwingPhase } from './SwingDetectionService';

export interface DetailedSwingMetrics extends SwingMetrics {
  // Enhanced timing metrics
  addressDuration: number;            // Time spent at address (ms)
  backswingDuration: number;          // Backswing duration (ms)
  downswingDuration: number;          // Downswing duration (ms)
  followThroughDuration: number;      // Follow-through duration (ms)
  transitionDuration: number;         // Transition pause duration (ms)
  
  // Advanced speed metrics
  backswingSpeed: number;             // Average backswing speed (m/s²)
  downswingSpeed: number;             // Average downswing speed (m/s²)
  speedAcceleration: number;          // Rate of speed increase (m/s³)
  peakSpeedTiming: number;            // When peak speed occurs (% through swing)
  
  // Precision metrics
  swingConsistency: number;           // Motion smoothness (0-100)
  pathDeviation: number;              // Deviation from ideal swing path (degrees)
  faceAngleAtImpact: number;          // Estimated club face angle at impact
  attackAngle: number;                // Angle of approach to ball (degrees)
  
  // Power metrics
  powerTransfer: number;              // Efficiency of power transfer (0-100)
  energyGeneration: number;           // Total energy generated in swing
  impactForce: number;                // Estimated impact force (N)
  
  // Balance and control
  balanceScore: number;               // Swing balance rating (0-100)
  controlFactor: number;              // Swing control rating (0-100)
  rhythmScore: number;                // Rhythm consistency (0-100)
  
  // 3D analysis
  swingPlaneDeviations: PlaneDeviation[]; // Deviations from swing plane
  rotationalVelocity: RotationalMetrics;  // 3D rotational analysis
  linearAcceleration: LinearMetrics;      // Linear acceleration components
}

export interface PlaneDeviation {
  phase: 'backswing' | 'downswing' | 'followthrough';
  deviation: number;                  // Degrees from ideal plane
  severity: 'minor' | 'moderate' | 'major';
}

export interface RotationalMetrics {
  maxRotationRate: number;            // Peak rotation rate (rad/s)
  rotationAcceleration: number;       // Rotation acceleration (rad/s²)
  axisStability: number;              // Consistency of rotation axis (0-100)
  handPath: number[];                 // Hand path coordinates
}

export interface LinearMetrics {
  xAcceleration: number[];            // Acceleration in X direction
  yAcceleration: number[];            // Acceleration in Y direction  
  zAcceleration: number[];            // Acceleration in Z direction
  resultantPath: number[];            // 3D resultant acceleration path
}

export interface SwingEfficiencyMetrics {
  overallEfficiency: number;          // Overall swing efficiency (0-100)
  energyWaste: number;                // Wasted energy percentage
  timingEfficiency: number;           // Timing optimization score
  mechanicalAdvantage: number;        // Mechanical efficiency score
  recommendations: EfficiencyRecommendation[];
}

export interface EfficiencyRecommendation {
  category: 'timing' | 'tempo' | 'power' | 'control' | 'balance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  improvementPotential: number;       // Potential improvement (0-100)
  specificTips: string[];
}

export interface ComparisonMetrics {
  templateName: string;
  overallSimilarity: number;          // Overall similarity to template (0-100)
  strengths: string[];                // Areas where swing excels
  weaknesses: string[];               // Areas needing improvement
  keyDifferences: MetricDifference[];
}

export interface MetricDifference {
  metric: string;
  actualValue: number;
  templateValue: number;
  percentageDiff: number;
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

/**
 * SwingMetricsService
 * 
 * Advanced swing metrics calculation and analysis service.
 * Provides detailed biomechanical analysis of golf swings.
 */
export class SwingMetricsService {
  private static instance: SwingMetricsService | null = null;
  
  // Analysis constants
  private readonly GRAVITY = 9.81;             // m/s²
  private readonly CLUB_LENGTH_AVERAGE = 1.07; // meters (average for irons)
  private readonly SAMPLE_RATE = 50;           // Hz
  
  private constructor() {}

  public static getInstance(): SwingMetricsService {
    if (!SwingMetricsService.instance) {
      SwingMetricsService.instance = new SwingMetricsService();
    }
    return SwingMetricsService.instance;
  }

  /**
   * Calculate detailed swing metrics from motion data and phases
   */
  public async calculateDetailedMetrics(
    motionData: MotionData[],
    phases: SwingPhase[],
    basicMetrics: SwingMetrics
  ): Promise<DetailedSwingMetrics> {
    // Calculate enhanced timing metrics
    const timingMetrics = this.calculateTimingMetrics(phases);
    
    // Calculate advanced speed metrics
    const speedMetrics = this.calculateSpeedMetrics(motionData, phases);
    
    // Calculate precision metrics
    const precisionMetrics = this.calculatePrecisionMetrics(motionData, phases);
    
    // Calculate power metrics
    const powerMetrics = this.calculatePowerMetrics(motionData, phases);
    
    // Calculate balance and control metrics
    const balanceMetrics = this.calculateBalanceMetrics(motionData, phases);
    
    // Calculate 3D analysis metrics
    const rotationalMetrics = this.calculateRotationalMetrics(motionData);
    const linearMetrics = this.calculateLinearMetrics(motionData);
    const planeDeviations = this.calculateSwingPlaneDeviations(motionData, phases);

    const detailedMetrics: DetailedSwingMetrics = {
      ...basicMetrics,
      ...timingMetrics,
      ...speedMetrics,
      ...precisionMetrics,
      ...powerMetrics,
      ...balanceMetrics,
      swingPlaneDeviations: planeDeviations,
      rotationalVelocity: rotationalMetrics,
      linearAcceleration: linearMetrics
    };

    console.log('📊 SwingMetricsService: Calculated detailed metrics', {
      powerTransfer: detailedMetrics.powerTransfer,
      balanceScore: detailedMetrics.balanceScore,
      swingConsistency: detailedMetrics.swingConsistency
    });

    return detailedMetrics;
  }

  /**
   * Calculate enhanced timing metrics
   */
  private calculateTimingMetrics(phases: SwingPhase[]): Partial<DetailedSwingMetrics> {
    const addressPhase = phases.find(p => p.phase === 'address');
    const backswingPhase = phases.find(p => p.phase === 'backswing');
    const downswingPhase = phases.find(p => p.phase === 'downswing');
    const followThroughPhase = phases.find(p => p.phase === 'followthrough');
    const transitionPhase = phases.find(p => p.phase === 'transition');

    return {
      addressDuration: addressPhase ? addressPhase.endTime - addressPhase.startTime : 0,
      backswingDuration: backswingPhase ? backswingPhase.endTime - backswingPhase.startTime : 0,
      downswingDuration: downswingPhase ? downswingPhase.endTime - downswingPhase.startTime : 0,
      followThroughDuration: followThroughPhase ? followThroughPhase.endTime - followThroughPhase.startTime : 0,
      transitionDuration: transitionPhase ? transitionPhase.endTime - transitionPhase.startTime : 0
    };
  }

  /**
   * Calculate advanced speed metrics
   */
  private calculateSpeedMetrics(motionData: MotionData[], phases: SwingPhase[]): Partial<DetailedSwingMetrics> {
    const backswingPhase = phases.find(p => p.phase === 'backswing');
    const downswingPhase = phases.find(p => p.phase === 'downswing');
    
    // Calculate phase-specific speeds
    let backswingSpeed = 0;
    let downswingSpeed = 0;
    let peakSpeedTiming = 0;
    let speedAcceleration = 0;

    if (backswingPhase) {
      const backswingData = this.getPhaseData(motionData, backswingPhase);
      backswingSpeed = this.calculateAverageSpeed(backswingData);
    }

    if (downswingPhase) {
      const downswingData = this.getPhaseData(motionData, downswingPhase);
      downswingSpeed = this.calculateAverageSpeed(downswingData);
    }

    // Find peak speed timing
    const speeds = motionData.map(point => this.calculatePointSpeed(point));
    const maxSpeed = Math.max(...speeds);
    const maxSpeedIndex = speeds.indexOf(maxSpeed);
    peakSpeedTiming = (maxSpeedIndex / motionData.length) * 100;

    // Calculate speed acceleration (rate of speed change)
    if (speeds.length > 1) {
      const speedChanges = speeds.slice(1).map((speed, i) => speed - speeds[i]);
      speedAcceleration = Math.max(...speedChanges.map(Math.abs));
    }

    return {
      backswingSpeed,
      downswingSpeed,
      peakSpeedTiming,
      speedAcceleration
    };
  }

  /**
   * Calculate precision metrics
   */
  private calculatePrecisionMetrics(motionData: MotionData[], phases: SwingPhase[]): Partial<DetailedSwingMetrics> {
    // Swing consistency (smoothness of motion)
    const swingConsistency = this.calculateMotionSmoothness(motionData);
    
    // Path deviation from ideal swing plane
    const pathDeviation = this.calculatePathDeviation(motionData);
    
    // Face angle estimation (simplified)
    const faceAngleAtImpact = this.estimateFaceAngle(motionData, phases);
    
    // Attack angle estimation
    const attackAngle = this.estimateAttackAngle(motionData, phases);

    return {
      swingConsistency,
      pathDeviation,
      faceAngleAtImpact,
      attackAngle
    };
  }

  /**
   * Calculate power metrics
   */
  private calculatePowerMetrics(motionData: MotionData[], phases: SwingPhase[]): Partial<DetailedSwingMetrics> {
    // Power transfer efficiency
    const powerTransfer = this.calculatePowerTransfer(motionData, phases);
    
    // Energy generation
    const energyGeneration = this.calculateEnergyGeneration(motionData);
    
    // Impact force estimation
    const impactForce = this.estimateImpactForce(motionData, phases);

    return {
      powerTransfer,
      energyGeneration,
      impactForce
    };
  }

  /**
   * Calculate balance and control metrics
   */
  private calculateBalanceMetrics(motionData: MotionData[], phases: SwingPhase[]): Partial<DetailedSwingMetrics> {
    const balanceScore = this.calculateBalanceScore(motionData);
    const controlFactor = this.calculateControlFactor(motionData, phases);
    const rhythmScore = this.calculateRhythmScore(phases);

    return {
      balanceScore,
      controlFactor,
      rhythmScore
    };
  }

  /**
   * Calculate rotational metrics
   */
  private calculateRotationalMetrics(motionData: MotionData[]): RotationalMetrics {
    const rotationRates: number[] = [];
    const handPath: number[] = [];
    
    for (const point of motionData) {
      const rotationRate = Math.sqrt(
        point.gyroscope.x ** 2 + 
        point.gyroscope.y ** 2 + 
        point.gyroscope.z ** 2
      );
      rotationRates.push(rotationRate);
      handPath.push(rotationRate); // Simplified hand path
    }
    
    const maxRotationRate = Math.max(...rotationRates);
    
    // Calculate rotation acceleration
    const rotationAccelerations: number[] = [];
    for (let i = 1; i < rotationRates.length; i++) {
      rotationAccelerations.push(Math.abs(rotationRates[i] - rotationRates[i - 1]) * this.SAMPLE_RATE);
    }
    const rotationAcceleration = Math.max(...rotationAccelerations);
    
    // Axis stability (consistency of rotation direction)
    const axisStability = this.calculateAxisStability(motionData);

    return {
      maxRotationRate,
      rotationAcceleration,
      axisStability,
      handPath
    };
  }

  /**
   * Calculate linear acceleration metrics
   */
  private calculateLinearMetrics(motionData: MotionData[]): LinearMetrics {
    const xAcceleration: number[] = [];
    const yAcceleration: number[] = [];
    const zAcceleration: number[] = [];
    const resultantPath: number[] = [];
    
    for (const point of motionData) {
      xAcceleration.push(point.acceleration.x);
      yAcceleration.push(point.acceleration.y);
      zAcceleration.push(point.acceleration.z);
      
      const resultant = Math.sqrt(
        point.acceleration.x ** 2 + 
        point.acceleration.y ** 2 + 
        point.acceleration.z ** 2
      );
      resultantPath.push(resultant);
    }

    return {
      xAcceleration,
      yAcceleration,
      zAcceleration,
      resultantPath
    };
  }

  /**
   * Calculate swing plane deviations
   */
  private calculateSwingPlaneDeviations(motionData: MotionData[], phases: SwingPhase[]): PlaneDeviation[] {
    const deviations: PlaneDeviation[] = [];
    
    const criticalPhases = phases.filter(p => 
      ['backswing', 'downswing', 'followthrough'].includes(p.phase)
    );
    
    for (const phase of criticalPhases) {
      const phaseData = this.getPhaseData(motionData, phase);
      const deviation = this.calculatePlaneDeviation(phaseData);
      
      let severity: 'minor' | 'moderate' | 'major' = 'minor';
      if (deviation > 15) severity = 'major';
      else if (deviation > 8) severity = 'moderate';
      
      deviations.push({
        phase: phase.phase as 'backswing' | 'downswing' | 'followthrough',
        deviation,
        severity
      });
    }
    
    return deviations;
  }

  /**
   * Calculate swing efficiency metrics
   */
  public async calculateEfficiencyMetrics(
    detailedMetrics: DetailedSwingMetrics,
    phases: SwingPhase[]
  ): Promise<SwingEfficiencyMetrics> {
    const recommendations: EfficiencyRecommendation[] = [];
    
    // Overall efficiency based on multiple factors
    let efficiencyScore = 0;
    let factors = 0;
    
    // Timing efficiency
    const timingEfficiency = this.calculateTimingEfficiency(detailedMetrics, phases);
    efficiencyScore += timingEfficiency;
    factors++;
    
    // Power efficiency
    const powerEfficiency = Math.min(100, detailedMetrics.powerTransfer);
    efficiencyScore += powerEfficiency;
    factors++;
    
    // Control efficiency
    const controlEfficiency = (detailedMetrics.balanceScore + detailedMetrics.controlFactor) / 2;
    efficiencyScore += controlEfficiency;
    factors++;
    
    const overallEfficiency = factors > 0 ? efficiencyScore / factors : 0;
    
    // Calculate energy waste
    const energyWaste = 100 - detailedMetrics.powerTransfer;
    
    // Generate recommendations
    if (timingEfficiency < 70) {
      recommendations.push({
        category: 'timing',
        severity: 'high',
        description: 'Swing timing needs improvement',
        improvementPotential: 100 - timingEfficiency,
        specificTips: ['Focus on smooth transition', 'Practice tempo drills', 'Work on timing consistency']
      });
    }
    
    if (detailedMetrics.balanceScore < 70) {
      recommendations.push({
        category: 'balance',
        severity: 'medium',
        description: 'Balance throughout swing could be improved',
        improvementPotential: 100 - detailedMetrics.balanceScore,
        specificTips: ['Focus on stable base', 'Practice balance drills', 'Maintain spine angle']
      });
    }
    
    if (detailedMetrics.powerTransfer < 70) {
      recommendations.push({
        category: 'power',
        severity: 'medium',
        description: 'Power transfer efficiency is below optimal',
        improvementPotential: 100 - detailedMetrics.powerTransfer,
        specificTips: ['Improve hip rotation', 'Focus on sequential motion', 'Work on kinetic chain']
      });
    }

    return {
      overallEfficiency: Math.round(overallEfficiency),
      energyWaste: Math.round(energyWaste),
      timingEfficiency: Math.round(timingEfficiency),
      mechanicalAdvantage: Math.round(controlEfficiency),
      recommendations
    };
  }

  // Helper methods for calculations

  private getPhaseData(motionData: MotionData[], phase: SwingPhase): MotionData[] {
    return motionData.filter(point => 
      point.timestamp >= phase.startTime && point.timestamp <= phase.endTime
    );
  }

  private calculatePointSpeed(point: MotionData): number {
    return Math.sqrt(
      point.acceleration.x ** 2 + 
      point.acceleration.y ** 2 + 
      point.acceleration.z ** 2
    );
  }

  private calculateAverageSpeed(data: MotionData[]): number {
    if (data.length === 0) return 0;
    
    const totalSpeed = data.reduce((sum, point) => sum + this.calculatePointSpeed(point), 0);
    return totalSpeed / data.length;
  }

  private calculateMotionSmoothness(motionData: MotionData[]): number {
    if (motionData.length < 2) return 100;
    
    let totalVariation = 0;
    let measurements = 0;
    
    for (let i = 1; i < motionData.length; i++) {
      const prev = motionData[i - 1];
      const curr = motionData[i];
      
      const accelVariation = Math.abs(
        this.calculatePointSpeed(curr) - this.calculatePointSpeed(prev)
      );
      
      totalVariation += accelVariation;
      measurements++;
    }
    
    const averageVariation = measurements > 0 ? totalVariation / measurements : 0;
    const smoothness = Math.max(0, 100 - (averageVariation * 10));
    
    return Math.min(100, smoothness);
  }

  private calculatePathDeviation(motionData: MotionData[]): number {
    // Simplified calculation - would need more sophisticated 3D analysis in production
    const yVariations: number[] = [];
    
    for (let i = 1; i < motionData.length; i++) {
      yVariations.push(Math.abs(motionData[i].acceleration.y - motionData[i-1].acceleration.y));
    }
    
    const averageVariation = yVariations.reduce((sum, v) => sum + v, 0) / yVariations.length;
    return Math.min(45, averageVariation * 5); // Convert to degrees
  }

  private estimateFaceAngle(motionData: MotionData[], phases: SwingPhase[]): number {
    const impactPhase = phases.find(p => p.phase === 'impact');
    if (!impactPhase) return 0;
    
    const impactData = this.getPhaseData(motionData, impactPhase);
    if (impactData.length === 0) return 0;
    
    // Simplified face angle estimation based on rotation at impact
    const impactPoint = impactData[0];
    const rotationY = impactPoint.gyroscope.y;
    
    return Math.max(-20, Math.min(20, rotationY / 10)); // Convert to degrees (-20 to +20)
  }

  private estimateAttackAngle(motionData: MotionData[], phases: SwingPhase[]): number {
    const downswingPhase = phases.find(p => p.phase === 'downswing');
    if (!downswingPhase) return 0;
    
    const downswingData = this.getPhaseData(motionData, downswingPhase);
    if (downswingData.length < 2) return 0;
    
    // Calculate vertical component change during downswing
    const startZ = downswingData[0].acceleration.z;
    const endZ = downswingData[downswingData.length - 1].acceleration.z;
    
    const attackAngle = Math.atan((endZ - startZ) / downswingData.length) * (180 / Math.PI);
    return Math.max(-10, Math.min(5, attackAngle)); // Typical range for attack angles
  }

  private calculatePowerTransfer(motionData: MotionData[], phases: SwingPhase[]): number {
    // Measure how efficiently energy is transferred from backswing to impact
    const backswingPhase = phases.find(p => p.phase === 'backswing');
    const impactPhase = phases.find(p => p.phase === 'impact');
    
    if (!backswingPhase || !impactPhase) return 50;
    
    const backswingEnergy = this.calculatePhaseEnergy(motionData, backswingPhase);
    const impactEnergy = this.calculatePhaseEnergy(motionData, impactPhase);
    
    if (backswingEnergy === 0) return 50;
    
    const transferEfficiency = (impactEnergy / backswingEnergy) * 100;
    return Math.min(100, Math.max(0, transferEfficiency));
  }

  private calculatePhaseEnergy(motionData: MotionData[], phase: SwingPhase): number {
    const phaseData = this.getPhaseData(motionData, phase);
    let totalEnergy = 0;
    
    for (const point of phaseData) {
      const kineticEnergy = 0.5 * Math.pow(this.calculatePointSpeed(point), 2);
      totalEnergy += kineticEnergy;
    }
    
    return totalEnergy;
  }

  private calculateEnergyGeneration(motionData: MotionData[]): number {
    let totalEnergy = 0;
    
    for (const point of motionData) {
      const linearEnergy = 0.5 * Math.pow(this.calculatePointSpeed(point), 2);
      const rotationalEnergy = 0.5 * Math.pow(Math.sqrt(
        point.gyroscope.x ** 2 + point.gyroscope.y ** 2 + point.gyroscope.z ** 2
      ), 2);
      
      totalEnergy += linearEnergy + rotationalEnergy;
    }
    
    return totalEnergy;
  }

  private estimateImpactForce(motionData: MotionData[], phases: SwingPhase[]): number {
    const impactPhase = phases.find(p => p.phase === 'impact');
    if (!impactPhase) return 0;
    
    const impactData = this.getPhaseData(motionData, impactPhase);
    if (impactData.length === 0) return 0;
    
    const maxAcceleration = Math.max(...impactData.map(point => this.calculatePointSpeed(point)));
    
    // Estimate force using F = ma (simplified, assuming average mass)
    const estimatedMass = 0.5; // kg (club + hands approximation)
    return maxAcceleration * estimatedMass * 9.81; // Convert to Newtons
  }

  private calculateBalanceScore(motionData: MotionData[]): number {
    // Measure stability of motion (less variation = better balance)
    const centerOfMotion = this.calculateCenterOfMotion(motionData);
    let totalDeviation = 0;
    
    for (const point of motionData) {
      const deviation = Math.sqrt(
        Math.pow(point.acceleration.x - centerOfMotion.x, 2) +
        Math.pow(point.acceleration.y - centerOfMotion.y, 2) +
        Math.pow(point.acceleration.z - centerOfMotion.z, 2)
      );
      totalDeviation += deviation;
    }
    
    const averageDeviation = totalDeviation / motionData.length;
    const balanceScore = Math.max(0, 100 - (averageDeviation * 5));
    
    return Math.min(100, balanceScore);
  }

  private calculateCenterOfMotion(motionData: MotionData[]): {x: number, y: number, z: number} {
    let sumX = 0, sumY = 0, sumZ = 0;
    
    for (const point of motionData) {
      sumX += point.acceleration.x;
      sumY += point.acceleration.y;
      sumZ += point.acceleration.z;
    }
    
    const count = motionData.length;
    return {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count
    };
  }

  private calculateControlFactor(motionData: MotionData[], phases: SwingPhase[]): number {
    // Measure precision and repeatability
    const consistencyScore = this.calculateMotionSmoothness(motionData);
    const tempoScore = this.calculateTempoConsistency(phases);
    
    return (consistencyScore + tempoScore) / 2;
  }

  private calculateRhythmScore(phases: SwingPhase[]): number {
    if (phases.length < 3) return 50;
    
    const durations = phases.map(p => p.endTime - p.startTime);
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    let rhythmVariation = 0;
    for (const duration of durations) {
      rhythmVariation += Math.abs(duration - averageDuration);
    }
    
    const averageVariation = rhythmVariation / durations.length;
    const rhythmScore = Math.max(0, 100 - (averageVariation / averageDuration) * 100);
    
    return Math.min(100, rhythmScore);
  }

  private calculateAxisStability(motionData: MotionData[]): number {
    // Measure consistency of rotation axis
    const rotationVectors: {x: number, y: number, z: number}[] = [];
    
    for (const point of motionData) {
      const magnitude = Math.sqrt(
        point.gyroscope.x ** 2 + point.gyroscope.y ** 2 + point.gyroscope.z ** 2
      );
      
      if (magnitude > 0) {
        rotationVectors.push({
          x: point.gyroscope.x / magnitude,
          y: point.gyroscope.y / magnitude,
          z: point.gyroscope.z / magnitude
        });
      }
    }
    
    if (rotationVectors.length < 2) return 100;
    
    // Calculate variance in rotation axis
    const avgVector = {
      x: rotationVectors.reduce((sum, v) => sum + v.x, 0) / rotationVectors.length,
      y: rotationVectors.reduce((sum, v) => sum + v.y, 0) / rotationVectors.length,
      z: rotationVectors.reduce((sum, v) => sum + v.z, 0) / rotationVectors.length
    };
    
    let totalVariation = 0;
    for (const vector of rotationVectors) {
      const variation = Math.sqrt(
        Math.pow(vector.x - avgVector.x, 2) +
        Math.pow(vector.y - avgVector.y, 2) +
        Math.pow(vector.z - avgVector.z, 2)
      );
      totalVariation += variation;
    }
    
    const averageVariation = totalVariation / rotationVectors.length;
    const stability = Math.max(0, 100 - (averageVariation * 50));
    
    return Math.min(100, stability);
  }

  private calculatePlaneDeviation(phaseData: MotionData[]): number {
    if (phaseData.length < 2) return 0;
    
    // Simplified plane deviation calculation
    const yVariations: number[] = [];
    
    for (let i = 1; i < phaseData.length; i++) {
      const yDiff = Math.abs(phaseData[i].acceleration.y - phaseData[i-1].acceleration.y);
      yVariations.push(yDiff);
    }
    
    const averageVariation = yVariations.reduce((sum, v) => sum + v, 0) / yVariations.length;
    return Math.min(30, averageVariation * 3); // Convert to degrees
  }

  private calculateTimingEfficiency(metrics: DetailedSwingMetrics, phases: SwingPhase[]): number {
    // Evaluate timing based on ideal ratios
    const backswingTime = metrics.backswingDuration;
    const downswingTime = metrics.downswingDuration;
    
    if (backswingTime === 0 || downswingTime === 0) return 50;
    
    const tempo = backswingTime / downswingTime;
    const idealTempo = 3.0; // 3:1 ratio is often considered ideal
    
    const tempoDeviation = Math.abs(tempo - idealTempo) / idealTempo;
    const timingScore = Math.max(0, 100 - (tempoDeviation * 50));
    
    return Math.min(100, timingScore);
  }

  private calculateTempoConsistency(phases: SwingPhase[]): number {
    if (phases.length < 2) return 100;
    
    const durations = phases.map(p => p.endTime - p.startTime);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    let variance = 0;
    for (const duration of durations) {
      variance += Math.pow(duration - mean, 2);
    }
    variance /= durations.length;
    
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;
    
    const consistencyScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    return Math.min(100, consistencyScore);
  }
}

export default SwingMetricsService;