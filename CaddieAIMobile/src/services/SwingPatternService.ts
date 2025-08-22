import { SwingMetrics, SwingPhase, MotionData } from './SwingDetectionService';

export interface SwingTemplate {
  id: string;
  name: string;
  clubType: 'driver' | 'iron' | 'wedge' | 'putter';
  description: string;
  idealMetrics: SwingMetrics;
  tolerances: SwingTolerances;
  phasePattern: SwingPhaseTemplate[];
}

export interface SwingTolerances {
  maxSpeedRange: [number, number];      // Acceptable speed range
  backswingAngleRange: [number, number]; // Acceptable backswing angle range
  tempoRange: [number, number];         // Acceptable tempo range
  timingTolerance: number;              // Timing deviation tolerance (ms)
}

export interface SwingPhaseTemplate {
  phase: 'address' | 'backswing' | 'transition' | 'downswing' | 'impact' | 'followthrough';
  expectedDuration: number;             // Expected duration in ms
  durationTolerance: number;            // Tolerance in ms
  expectedAcceleration: number;         // Expected peak acceleration
  accelerationTolerance: number;        // Tolerance for acceleration
  criticalPhase: boolean;               // Whether this phase is critical for pattern matching
}

export interface PatternMatchResult {
  templateId: string;
  templateName: string;
  overallMatch: number;                 // Overall match percentage (0-100)
  phaseMatches: PhaseMatchResult[];
  deviations: SwingDeviation[];
  recommendations: string[];
}

export interface PhaseMatchResult {
  phase: string;
  matchPercentage: number;
  actualValue: number;
  expectedValue: number;
  withinTolerance: boolean;
}

export interface SwingDeviation {
  metric: string;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'minor' | 'moderate' | 'major';
  impact: string;
}

/**
 * SwingPatternService
 * 
 * Provides golf-specific swing pattern recognition and comparison
 * against ideal swing templates for different club types.
 */
export class SwingPatternService {
  private static instance: SwingPatternService | null = null;
  private swingTemplates: Map<string, SwingTemplate> = new Map();

  private constructor() {
    this.initializeSwingTemplates();
  }

  public static getInstance(): SwingPatternService {
    if (!SwingPatternService.instance) {
      SwingPatternService.instance = new SwingPatternService();
    }
    return SwingPatternService.instance;
  }

  /**
   * Initialize standard swing templates for different club types
   */
  private initializeSwingTemplates(): void {
    // Driver Template - Power and distance focused
    const driverTemplate: SwingTemplate = {
      id: 'driver_standard',
      name: 'Standard Driver Swing',
      clubType: 'driver',
      description: 'Optimal driver swing for maximum distance and accuracy',
      idealMetrics: {
        maxSpeed: 15.0,
        backswingAngle: 90,
        downswingAngle: 85,
        impactTiming: 1200,
        followThroughAngle: 110,
        swingTempo: 3.0,
        swingPlane: 45,
        clubheadSpeed: 95
      },
      tolerances: {
        maxSpeedRange: [12.0, 18.0],
        backswingAngleRange: [75, 105],
        tempoRange: [2.5, 4.0],
        timingTolerance: 200
      },
      phasePattern: [
        {
          phase: 'address',
          expectedDuration: 500,
          durationTolerance: 200,
          expectedAcceleration: 1.0,
          accelerationTolerance: 0.5,
          criticalPhase: false
        },
        {
          phase: 'backswing',
          expectedDuration: 800,
          durationTolerance: 150,
          expectedAcceleration: 3.0,
          accelerationTolerance: 1.0,
          criticalPhase: true
        },
        {
          phase: 'transition',
          expectedDuration: 100,
          durationTolerance: 50,
          expectedAcceleration: 2.0,
          accelerationTolerance: 1.0,
          criticalPhase: true
        },
        {
          phase: 'downswing',
          expectedDuration: 300,
          durationTolerance: 75,
          expectedAcceleration: 12.0,
          accelerationTolerance: 3.0,
          criticalPhase: true
        },
        {
          phase: 'impact',
          expectedDuration: 50,
          durationTolerance: 25,
          expectedAcceleration: 15.0,
          accelerationTolerance: 2.0,
          criticalPhase: true
        },
        {
          phase: 'followthrough',
          expectedDuration: 600,
          durationTolerance: 150,
          expectedAcceleration: 8.0,
          accelerationTolerance: 2.0,
          criticalPhase: false
        }
      ]
    };

    // Iron Template - Accuracy and control focused
    const ironTemplate: SwingTemplate = {
      id: 'iron_standard',
      name: 'Standard Iron Swing',
      clubType: 'iron',
      description: 'Controlled iron swing for accuracy and consistent ball striking',
      idealMetrics: {
        maxSpeed: 12.0,
        backswingAngle: 85,
        downswingAngle: 80,
        impactTiming: 1000,
        followThroughAngle: 95,
        swingTempo: 2.8,
        swingPlane: 50,
        clubheadSpeed: 75
      },
      tolerances: {
        maxSpeedRange: [9.0, 15.0],
        backswingAngleRange: [70, 95],
        tempoRange: [2.3, 3.5],
        timingTolerance: 150
      },
      phasePattern: [
        {
          phase: 'address',
          expectedDuration: 400,
          durationTolerance: 150,
          expectedAcceleration: 1.0,
          accelerationTolerance: 0.5,
          criticalPhase: false
        },
        {
          phase: 'backswing',
          expectedDuration: 700,
          durationTolerance: 100,
          expectedAcceleration: 2.5,
          accelerationTolerance: 0.8,
          criticalPhase: true
        },
        {
          phase: 'transition',
          expectedDuration: 80,
          durationTolerance: 30,
          expectedAcceleration: 1.8,
          accelerationTolerance: 0.7,
          criticalPhase: true
        },
        {
          phase: 'downswing',
          expectedDuration: 250,
          durationTolerance: 50,
          expectedAcceleration: 10.0,
          accelerationTolerance: 2.0,
          criticalPhase: true
        },
        {
          phase: 'impact',
          expectedDuration: 40,
          durationTolerance: 20,
          expectedAcceleration: 12.0,
          accelerationTolerance: 1.5,
          criticalPhase: true
        },
        {
          phase: 'followthrough',
          expectedDuration: 500,
          durationTolerance: 100,
          expectedAcceleration: 6.0,
          accelerationTolerance: 1.5,
          criticalPhase: false
        }
      ]
    };

    // Wedge Template - Precision and spin focused
    const wedgeTemplate: SwingTemplate = {
      id: 'wedge_standard',
      name: 'Standard Wedge Swing',
      clubType: 'wedge',
      description: 'Precise wedge swing for short game accuracy and spin control',
      idealMetrics: {
        maxSpeed: 8.0,
        backswingAngle: 70,
        downswingAngle: 65,
        impactTiming: 800,
        followThroughAngle: 75,
        swingTempo: 2.5,
        swingPlane: 55,
        clubheadSpeed: 50
      },
      tolerances: {
        maxSpeedRange: [6.0, 10.0],
        backswingAngleRange: [55, 80],
        tempoRange: [2.0, 3.2],
        timingTolerance: 100
      },
      phasePattern: [
        {
          phase: 'address',
          expectedDuration: 350,
          durationTolerance: 100,
          expectedAcceleration: 0.8,
          accelerationTolerance: 0.3,
          criticalPhase: false
        },
        {
          phase: 'backswing',
          expectedDuration: 500,
          durationTolerance: 80,
          expectedAcceleration: 2.0,
          accelerationTolerance: 0.6,
          criticalPhase: true
        },
        {
          phase: 'transition',
          expectedDuration: 60,
          durationTolerance: 25,
          expectedAcceleration: 1.5,
          accelerationTolerance: 0.5,
          criticalPhase: true
        },
        {
          phase: 'downswing',
          expectedDuration: 200,
          durationTolerance: 40,
          expectedAcceleration: 6.0,
          accelerationTolerance: 1.5,
          criticalPhase: true
        },
        {
          phase: 'impact',
          expectedDuration: 35,
          durationTolerance: 15,
          expectedAcceleration: 8.0,
          accelerationTolerance: 1.0,
          criticalPhase: true
        },
        {
          phase: 'followthrough',
          expectedDuration: 400,
          durationTolerance: 80,
          expectedAcceleration: 4.0,
          accelerationTolerance: 1.0,
          criticalPhase: false
        }
      ]
    };

    // Store templates
    this.swingTemplates.set(driverTemplate.id, driverTemplate);
    this.swingTemplates.set(ironTemplate.id, ironTemplate);
    this.swingTemplates.set(wedgeTemplate.id, wedgeTemplate);

    console.log('🏌️ SwingPatternService: Initialized with', this.swingTemplates.size, 'swing templates');
  }

  /**
   * Compare a swing against all available templates and return best matches
   */
  public async compareSwing(
    metrics: SwingMetrics,
    phases: SwingPhase[],
    motionData: MotionData[],
    clubType?: 'driver' | 'iron' | 'wedge' | 'putter'
  ): Promise<PatternMatchResult[]> {
    const results: PatternMatchResult[] = [];

    // Filter templates by club type if specified
    const templatesToCheck = clubType 
      ? Array.from(this.swingTemplates.values()).filter(t => t.clubType === clubType)
      : Array.from(this.swingTemplates.values());

    for (const template of templatesToCheck) {
      const matchResult = await this.compareAgainstTemplate(metrics, phases, template);
      results.push(matchResult);
    }

    // Sort by overall match percentage (best first)
    results.sort((a, b) => b.overallMatch - a.overallMatch);

    console.log('📊 SwingPatternService: Pattern analysis complete', {
      templatesChecked: templatesToCheck.length,
      bestMatch: results[0]?.templateName,
      bestMatchScore: results[0]?.overallMatch
    });

    return results;
  }

  /**
   * Compare swing against a specific template
   */
  private async compareAgainstTemplate(
    metrics: SwingMetrics,
    phases: SwingPhase[],
    template: SwingTemplate
  ): Promise<PatternMatchResult> {
    const phaseMatches: PhaseMatchResult[] = [];
    const deviations: SwingDeviation[] = [];
    let overallScore = 0;
    let totalWeight = 0;

    // Step 1: Compare swing metrics
    const metricsScore = this.compareMetrics(metrics, template.idealMetrics, template.tolerances, deviations);
    overallScore += metricsScore * 0.6; // 60% weight for metrics
    totalWeight += 0.6;

    // Step 2: Compare phase patterns
    const phaseScore = this.comparePhases(phases, template.phasePattern, phaseMatches);
    overallScore += phaseScore * 0.4; // 40% weight for phases
    totalWeight += 0.4;

    // Calculate final percentage
    const overallMatch = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0;

    // Generate recommendations based on deviations
    const recommendations = this.generateRecommendations(deviations, template);

    return {
      templateId: template.id,
      templateName: template.name,
      overallMatch,
      phaseMatches,
      deviations,
      recommendations
    };
  }

  /**
   * Compare actual metrics against ideal template metrics
   */
  private compareMetrics(
    actual: SwingMetrics,
    ideal: SwingMetrics,
    tolerances: SwingTolerances,
    deviations: SwingDeviation[]
  ): number {
    let totalScore = 0;
    let metricCount = 0;

    // Max Speed
    const speedMatch = this.calculateMetricMatch(
      actual.maxSpeed, ideal.maxSpeed, tolerances.maxSpeedRange
    );
    totalScore += speedMatch;
    metricCount++;
    
    if (speedMatch < 80) {
      deviations.push({
        metric: 'Max Speed',
        actualValue: actual.maxSpeed,
        expectedValue: ideal.maxSpeed,
        deviation: Math.abs(actual.maxSpeed - ideal.maxSpeed),
        severity: speedMatch < 50 ? 'major' : speedMatch < 70 ? 'moderate' : 'minor',
        impact: 'Affects swing power and clubhead speed'
      });
    }

    // Backswing Angle
    const backswingMatch = this.calculateMetricMatch(
      actual.backswingAngle, ideal.backswingAngle, tolerances.backswingAngleRange
    );
    totalScore += backswingMatch;
    metricCount++;

    if (backswingMatch < 80) {
      deviations.push({
        metric: 'Backswing Angle',
        actualValue: actual.backswingAngle,
        expectedValue: ideal.backswingAngle,
        deviation: Math.abs(actual.backswingAngle - ideal.backswingAngle),
        severity: backswingMatch < 50 ? 'major' : backswingMatch < 70 ? 'moderate' : 'minor',
        impact: 'Affects swing arc and power generation'
      });
    }

    // Swing Tempo
    const tempoMatch = this.calculateMetricMatch(
      actual.swingTempo, ideal.swingTempo, tolerances.tempoRange
    );
    totalScore += tempoMatch;
    metricCount++;

    if (tempoMatch < 80) {
      deviations.push({
        metric: 'Swing Tempo',
        actualValue: actual.swingTempo,
        expectedValue: ideal.swingTempo,
        deviation: Math.abs(actual.swingTempo - ideal.swingTempo),
        severity: tempoMatch < 50 ? 'major' : tempoMatch < 70 ? 'moderate' : 'minor',
        impact: 'Affects timing and consistency'
      });
    }

    // Impact Timing
    const timingMatch = this.calculateTimingMatch(
      actual.impactTiming, ideal.impactTiming, tolerances.timingTolerance
    );
    totalScore += timingMatch;
    metricCount++;

    if (timingMatch < 80) {
      deviations.push({
        metric: 'Impact Timing',
        actualValue: actual.impactTiming,
        expectedValue: ideal.impactTiming,
        deviation: Math.abs(actual.impactTiming - ideal.impactTiming),
        severity: timingMatch < 50 ? 'major' : timingMatch < 70 ? 'moderate' : 'minor',
        impact: 'Affects ball striking and accuracy'
      });
    }

    return metricCount > 0 ? totalScore / metricCount : 0;
  }

  /**
   * Compare actual swing phases against template phase pattern
   */
  private comparePhases(
    actualPhases: SwingPhase[],
    templatePhases: SwingPhaseTemplate[],
    phaseMatches: PhaseMatchResult[]
  ): number {
    let totalScore = 0;
    let criticalPhasesScore = 0;
    let criticalPhasesCount = 0;

    for (const templatePhase of templatePhases) {
      const actualPhase = actualPhases.find(p => p.phase === templatePhase.phase);
      
      if (actualPhase) {
        // Calculate phase duration match
        const actualDuration = actualPhase.endTime - actualPhase.startTime;
        const durationMatch = this.calculateDurationMatch(
          actualDuration, templatePhase.expectedDuration, templatePhase.durationTolerance
        );
        
        // Calculate acceleration match if available
        let accelerationMatch = 100;
        if (actualPhase.peakAcceleration !== undefined) {
          accelerationMatch = this.calculateAccelerationMatch(
            actualPhase.peakAcceleration, 
            templatePhase.expectedAcceleration, 
            templatePhase.accelerationTolerance
          );
        }

        // Combined phase match
        const phaseMatch = (durationMatch + accelerationMatch) / 2;
        
        phaseMatches.push({
          phase: templatePhase.phase,
          matchPercentage: Math.round(phaseMatch),
          actualValue: actualDuration,
          expectedValue: templatePhase.expectedDuration,
          withinTolerance: Math.abs(actualDuration - templatePhase.expectedDuration) <= templatePhase.durationTolerance
        });

        // Weight critical phases more heavily
        if (templatePhase.criticalPhase) {
          criticalPhasesScore += phaseMatch;
          criticalPhasesCount++;
        }

        totalScore += phaseMatch;
      } else {
        // Missing phase - significant penalty
        phaseMatches.push({
          phase: templatePhase.phase,
          matchPercentage: 0,
          actualValue: 0,
          expectedValue: templatePhase.expectedDuration,
          withinTolerance: false
        });
      }
    }

    // Calculate weighted score (critical phases count double)
    const regularPhasesCount = templatePhases.length - criticalPhasesCount;
    const weightedTotal = (criticalPhasesScore * 2) + (totalScore - criticalPhasesScore);
    const weightedMax = (criticalPhasesCount * 2 + regularPhasesCount) * 100;

    return weightedMax > 0 ? (weightedTotal / weightedMax) * 100 : 0;
  }

  /**
   * Calculate match percentage for a metric within tolerance range
   */
  private calculateMetricMatch(actual: number, ideal: number, toleranceRange: [number, number]): number {
    const [min, max] = toleranceRange;
    
    if (actual >= min && actual <= max) {
      // Within tolerance - calculate how close to ideal
      const deviation = Math.abs(actual - ideal);
      const maxDeviation = Math.max(ideal - min, max - ideal);
      return Math.max(80, 100 - (deviation / maxDeviation) * 20);
    } else {
      // Outside tolerance - penalty based on how far outside
      const deviation = actual < min ? min - actual : actual - max;
      const toleranceWidth = max - min;
      const penaltyRatio = Math.min(1, deviation / toleranceWidth);
      return Math.max(0, 80 - (penaltyRatio * 80));
    }
  }

  /**
   * Calculate timing match with tolerance
   */
  private calculateTimingMatch(actual: number, ideal: number, tolerance: number): number {
    const deviation = Math.abs(actual - ideal);
    
    if (deviation <= tolerance) {
      return Math.max(80, 100 - (deviation / tolerance) * 20);
    } else {
      const excessDeviation = deviation - tolerance;
      const penaltyRatio = Math.min(1, excessDeviation / tolerance);
      return Math.max(0, 80 - (penaltyRatio * 80));
    }
  }

  /**
   * Calculate duration match for swing phases
   */
  private calculateDurationMatch(actual: number, expected: number, tolerance: number): number {
    const deviation = Math.abs(actual - expected);
    
    if (deviation <= tolerance) {
      return Math.max(85, 100 - (deviation / tolerance) * 15);
    } else {
      const excessDeviation = deviation - tolerance;
      const penaltyRatio = Math.min(1, excessDeviation / expected);
      return Math.max(0, 85 - (penaltyRatio * 85));
    }
  }

  /**
   * Calculate acceleration match for swing phases
   */
  private calculateAccelerationMatch(actual: number, expected: number, tolerance: number): number {
    const deviation = Math.abs(actual - expected);
    
    if (deviation <= tolerance) {
      return Math.max(85, 100 - (deviation / tolerance) * 15);
    } else {
      const excessDeviation = deviation - tolerance;
      const penaltyRatio = Math.min(1, excessDeviation / expected);
      return Math.max(0, 85 - (penaltyRatio * 85));
    }
  }

  /**
   * Generate actionable recommendations based on swing deviations
   */
  private generateRecommendations(deviations: SwingDeviation[], template: SwingTemplate): string[] {
    const recommendations: string[] = [];
    
    for (const deviation of deviations) {
      switch (deviation.metric) {
        case 'Max Speed':
          if (deviation.actualValue < deviation.expectedValue) {
            recommendations.push('Try to accelerate more through the downswing for increased power');
          } else {
            recommendations.push('Focus on control - you may be swinging too hard');
          }
          break;
          
        case 'Backswing Angle':
          if (deviation.actualValue < deviation.expectedValue) {
            recommendations.push('Work on getting a fuller shoulder turn in your backswing');
          } else {
            recommendations.push('Your backswing may be too long - focus on a more compact swing');
          }
          break;
          
        case 'Swing Tempo':
          if (deviation.actualValue < deviation.expectedValue) {
            recommendations.push('Slow down your backswing to improve timing and consistency');
          } else {
            recommendations.push('Try to accelerate more in your downswing relative to your backswing');
          }
          break;
          
        case 'Impact Timing':
          recommendations.push('Work on your transition timing between backswing and downswing');
          break;
      }
    }
    
    // Add club-specific recommendations
    switch (template.clubType) {
      case 'driver':
        if (deviations.some(d => d.severity === 'major')) {
          recommendations.push('For driver swings, focus on smooth tempo and full extension');
        }
        break;
      case 'iron':
        if (deviations.some(d => d.severity === 'major')) {
          recommendations.push('Iron swings require more control - focus on solid ball-first contact');
        }
        break;
      case 'wedge':
        if (deviations.some(d => d.severity === 'major')) {
          recommendations.push('Wedge shots need precise timing - practice your short game tempo');
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Get available swing templates
   */
  public getAvailableTemplates(): SwingTemplate[] {
    return Array.from(this.swingTemplates.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): SwingTemplate | undefined {
    return this.swingTemplates.get(templateId);
  }

  /**
   * Add or update a custom swing template
   */
  public addCustomTemplate(template: SwingTemplate): void {
    this.swingTemplates.set(template.id, template);
    console.log('📝 SwingPatternService: Added custom template:', template.name);
  }
}

export default SwingPatternService;