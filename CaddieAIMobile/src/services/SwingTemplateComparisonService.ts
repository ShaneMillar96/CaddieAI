import { SwingAnalysisSummary, SwingMetricsSummary } from '../store/slices/aiCaddieSlice';
import { DetailedSwingMetrics } from './SwingMetricsService';
import { PatternMatchResult } from './SwingPatternService';

export interface SwingTemplate {
  id: string;
  name: string;
  category: 'professional' | 'amateur' | 'beginner';
  golferProfile: {
    name: string;
    handicap: number;
    playingStyle: 'power' | 'control' | 'balanced';
    specialty: string[];
  };
  idealMetrics: {
    clubheadSpeed: { min: number; max: number; optimal: number };
    swingTempo: { min: number; max: number; optimal: number };
    balanceScore: { min: number; max: number; optimal: number };
    backswingAngle: { min: number; max: number; optimal: number };
    impactTiming: { min: number; max: number; optimal: number };
  };
  clubSpecificData: {
    [key in 'driver' | 'iron' | 'wedge' | 'putter']: {
      clubheadSpeed: number;
      launchAngle: number;
      attackAngle: number;
      swingPath: number;
      faceAngle: number;
    };
  };
  swingCharacteristics: {
    addressPosition: string;
    backswingPath: string;
    transitionTiming: string;
    downswingSequence: string;
    impactPosition: string;
    followThrough: string;
  };
  keyTechniques: string[];
  commonIssues: string[];
  trainingTips: string[];
}

export interface TemplateComparison {
  templateId: string;
  templateName: string;
  overallMatch: number;
  categoryMatch: 'excellent' | 'good' | 'fair' | 'poor';
  metricComparisons: {
    metric: string;
    userValue: number;
    templateValue: number;
    deviation: number;
    deviationPercentage: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  }[];
  strengths: string[];
  improvementAreas: string[];
  specificRecommendations: string[];
  practiceRoutine: {
    drill: string;
    description: string;
    duration: string;
    frequency: string;
  }[];
  confidenceScore: number;
}

export interface ComparisonAnalysis {
  userProfile: {
    estimatedHandicap: number;
    playingStyle: 'power' | 'control' | 'balanced';
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    consistencyRating: number;
  };
  bestMatches: TemplateComparison[];
  overallAssessment: {
    strengths: string[];
    primaryWeaknesses: string[];
    improvementPotential: number;
    recommendedFocus: string[];
  };
  progressionPath: {
    currentTemplate: string;
    nextTargetTemplate: string;
    milestones: {
      metric: string;
      currentValue: number;
      targetValue: number;
      timeframe: string;
    }[];
  };
  customRecommendations: string[];
}

export class SwingTemplateComparisonService {
  private templates: SwingTemplate[] = [];
  private userSwingHistory: SwingAnalysisSummary[] = [];

  constructor() {
    this.initializeTemplates();
  }

  public async compareSwingToTemplates(
    swingAnalysis: SwingAnalysisSummary,
    detailedMetrics?: DetailedSwingMetrics,
    userSkillLevel: number = 2,
    recentSwings: SwingAnalysisSummary[] = []
  ): Promise<ComparisonAnalysis> {
    try {
      console.log('🔍 SwingTemplateComparisonService: Analyzing swing against templates:', {
        clubType: swingAnalysis.clubType,
        confidence: swingAnalysis.confidence,
        templatesAvailable: this.templates.length
      });

      // Update user swing history
      this.updateSwingHistory(swingAnalysis, recentSwings);

      // Create user profile based on recent performance
      const userProfile = this.createUserProfile(swingAnalysis, recentSwings, userSkillLevel);

      // Find best matching templates
      const relevantTemplates = this.filterRelevantTemplates(userProfile, swingAnalysis.clubType);
      const templateComparisons = await this.compareAgainstTemplates(
        swingAnalysis,
        detailedMetrics,
        relevantTemplates
      );

      // Sort by match percentage
      const bestMatches = templateComparisons
        .sort((a, b) => b.overallMatch - a.overallMatch)
        .slice(0, 3);

      // Generate overall assessment
      const overallAssessment = this.generateOverallAssessment(
        swingAnalysis,
        bestMatches,
        recentSwings
      );

      // Create progression path
      const progressionPath = this.createProgressionPath(
        userProfile,
        bestMatches[0],
        swingAnalysis
      );

      // Generate custom recommendations
      const customRecommendations = this.generateCustomRecommendations(
        swingAnalysis,
        bestMatches,
        userProfile
      );

      const analysis: ComparisonAnalysis = {
        userProfile,
        bestMatches,
        overallAssessment,
        progressionPath,
        customRecommendations,
      };

      console.log('✅ SwingTemplateComparisonService: Analysis completed:', {
        bestMatch: bestMatches[0]?.templateName,
        overallMatch: bestMatches[0]?.overallMatch,
        userSkillLevel: userProfile.skillLevel,
        improvementPotential: overallAssessment.improvementPotential
      });

      return analysis;

    } catch (error) {
      console.error('❌ SwingTemplateComparisonService: Error comparing swing to templates:', error);
      return this.generateFallbackAnalysis(swingAnalysis, userSkillLevel);
    }
  }

  private initializeTemplates(): void {
    this.templates = [
      // Professional Templates
      {
        id: 'rory_mcilroy_driver',
        name: 'Rory McIlroy - Power Driver',
        category: 'professional',
        golferProfile: {
          name: 'Rory McIlroy',
          handicap: -8,
          playingStyle: 'power',
          specialty: ['long drives', 'aggressive play', 'high clubhead speed'],
        },
        idealMetrics: {
          clubheadSpeed: { min: 115, max: 125, optimal: 120 },
          swingTempo: { min: 2.8, max: 3.2, optimal: 3.0 },
          balanceScore: { min: 85, max: 95, optimal: 90 },
          backswingAngle: { min: 70, max: 80, optimal: 75 },
          impactTiming: { min: 950, max: 1050, optimal: 1000 },
        },
        clubSpecificData: {
          driver: { clubheadSpeed: 120, launchAngle: 12, attackAngle: 3, swingPath: -1, faceAngle: 0.5 },
          iron: { clubheadSpeed: 95, launchAngle: 18, attackAngle: -4, swingPath: -2, faceAngle: 0 },
          wedge: { clubheadSpeed: 75, launchAngle: 45, attackAngle: -6, swingPath: 0, faceAngle: 2 },
          putter: { clubheadSpeed: 20, launchAngle: 0, attackAngle: 0, swingPath: 0, faceAngle: 0 },
        },
        swingCharacteristics: {
          addressPosition: 'Athletic setup with slight forward lean',
          backswingPath: 'Wide, powerful backswing with full shoulder turn',
          transitionTiming: 'Aggressive transition with strong hip drive',
          downswingSequence: 'Ground-up power sequence',
          impactPosition: 'Strong impact with forward shaft lean',
          followThrough: 'High, balanced finish',
        },
        keyTechniques: ['Hip rotation', 'Lag creation', 'Ground force utilization'],
        commonIssues: ['Over-swinging', 'Loss of balance', 'Timing issues'],
        trainingTips: ['Focus on tempo', 'Build core strength', 'Practice balance drills'],
      },
      {
        id: 'justin_thomas_iron',
        name: 'Justin Thomas - Precision Iron',
        category: 'professional',
        golferProfile: {
          name: 'Justin Thomas',
          handicap: -8,
          playingStyle: 'control',
          specialty: ['iron accuracy', 'short game', 'precision'],
        },
        idealMetrics: {
          clubheadSpeed: { min: 85, max: 95, optimal: 90 },
          swingTempo: { min: 2.6, max: 3.0, optimal: 2.8 },
          balanceScore: { min: 88, max: 96, optimal: 92 },
          backswingAngle: { min: 65, max: 75, optimal: 70 },
          impactTiming: { min: 900, max: 950, optimal: 925 },
        },
        clubSpecificData: {
          driver: { clubheadSpeed: 112, launchAngle: 11, attackAngle: 2, swingPath: 0, faceAngle: 0 },
          iron: { clubheadSpeed: 90, launchAngle: 20, attackAngle: -5, swingPath: -1, faceAngle: 0 },
          wedge: { clubheadSpeed: 78, launchAngle: 48, attackAngle: -8, swingPath: 2, faceAngle: 1 },
          putter: { clubheadSpeed: 18, launchAngle: 0, attackAngle: 0, swingPath: 0, faceAngle: 0 },
        },
        swingCharacteristics: {
          addressPosition: 'Balanced setup with slight knee flex',
          backswingPath: 'Compact, controlled backswing',
          transitionTiming: 'Smooth transition with gradual acceleration',
          downswingSequence: 'Arms and body in sync',
          impactPosition: 'Crisp contact with divot after ball',
          followThrough: 'Controlled finish with good balance',
        },
        keyTechniques: ['Weight transfer', 'Ball-first contact', 'Consistent tempo'],
        commonIssues: ['Inconsistent contact', 'Direction control', 'Distance gaps'],
        trainingTips: ['Practice ball striking', 'Work on alignment', 'Tempo training'],
      },
      // Amateur Templates
      {
        id: 'amateur_balanced',
        name: 'Skilled Amateur - Balanced',
        category: 'amateur',
        golferProfile: {
          name: 'Club Champion',
          handicap: 5,
          playingStyle: 'balanced',
          specialty: ['consistent play', 'course management', 'solid fundamentals'],
        },
        idealMetrics: {
          clubheadSpeed: { min: 95, max: 105, optimal: 100 },
          swingTempo: { min: 2.8, max: 3.4, optimal: 3.1 },
          balanceScore: { min: 75, max: 85, optimal: 80 },
          backswingAngle: { min: 70, max: 80, optimal: 75 },
          impactTiming: { min: 1000, max: 1100, optimal: 1050 },
        },
        clubSpecificData: {
          driver: { clubheadSpeed: 100, launchAngle: 13, attackAngle: 1, swingPath: 0, faceAngle: 1 },
          iron: { clubheadSpeed: 80, launchAngle: 22, attackAngle: -3, swingPath: -1, faceAngle: 0 },
          wedge: { clubheadSpeed: 65, launchAngle: 50, attackAngle: -5, swingPath: 1, faceAngle: 2 },
          putter: { clubheadSpeed: 16, launchAngle: 0, attackAngle: 0, swingPath: 0, faceAngle: 0 },
        },
        swingCharacteristics: {
          addressPosition: 'Solid, athletic setup',
          backswingPath: 'Three-quarter backswing with good width',
          transitionTiming: 'Gradual transition with good sequencing',
          downswingSequence: 'Coordinated body and arm movement',
          impactPosition: 'Solid contact with slight forward lean',
          followThrough: 'Balanced finish position',
        },
        keyTechniques: ['Fundamentals', 'Consistency', 'Smart course management'],
        commonIssues: ['Occasional mishits', 'Distance control', 'Pressure situations'],
        trainingTips: ['Consistent practice routine', 'Mental game work', 'Short game focus'],
      },
      // Beginner Templates
      {
        id: 'beginner_basic',
        name: 'Beginner - Foundation',
        category: 'beginner',
        golferProfile: {
          name: 'New Golfer',
          handicap: 25,
          playingStyle: 'control',
          specialty: ['learning basics', 'building fundamentals'],
        },
        idealMetrics: {
          clubheadSpeed: { min: 70, max: 85, optimal: 77 },
          swingTempo: { min: 3.0, max: 4.0, optimal: 3.5 },
          balanceScore: { min: 60, max: 75, optimal: 68 },
          backswingAngle: { min: 60, max: 75, optimal: 68 },
          impactTiming: { min: 1200, max: 1400, optimal: 1300 },
        },
        clubSpecificData: {
          driver: { clubheadSpeed: 77, launchAngle: 15, attackAngle: -2, swingPath: 2, faceAngle: 3 },
          iron: { clubheadSpeed: 65, launchAngle: 25, attackAngle: -2, swingPath: 0, faceAngle: 2 },
          wedge: { clubheadSpeed: 55, launchAngle: 55, attackAngle: -3, swingPath: 2, faceAngle: 3 },
          putter: { clubheadSpeed: 12, launchAngle: 0, attackAngle: 0, swingPath: 0, faceAngle: 1 },
        },
        swingCharacteristics: {
          addressPosition: 'Basic setup with focus on posture',
          backswingPath: 'Simple, compact backswing',
          transitionTiming: 'Slow, controlled transition',
          downswingSequence: 'Focus on making contact',
          impactPosition: 'Attempting solid contact',
          followThrough: 'Balanced finish as goal',
        },
        keyTechniques: ['Setup fundamentals', 'Basic grip', 'Simple swing thoughts'],
        commonIssues: ['Inconsistent contact', 'Direction issues', 'Distance control'],
        trainingTips: ['Focus on fundamentals', 'Take lessons', 'Practice basic drills'],
      },
    ];

    console.log('✅ SwingTemplateComparisonService: Initialized with', this.templates.length, 'templates');
  }

  private updateSwingHistory(
    newSwing: SwingAnalysisSummary,
    recentSwings: SwingAnalysisSummary[]
  ): void {
    this.userSwingHistory = [newSwing, ...recentSwings].slice(0, 20);
  }

  private createUserProfile(
    currentSwing: SwingAnalysisSummary,
    recentSwings: SwingAnalysisSummary[],
    userSkillLevel: number
  ): ComparisonAnalysis['userProfile'] {
    const allSwings = [currentSwing, ...recentSwings];
    
    // Calculate average metrics
    const avgSpeed = allSwings.reduce((sum, s) => sum + s.clubheadSpeed, 0) / allSwings.length;
    const avgTempo = allSwings.reduce((sum, s) => sum + s.swingTempo, 0) / allSwings.length;
    const avgBalance = allSwings.reduce((sum, s) => sum + s.balanceScore, 0) / allSwings.length;
    const avgConfidence = allSwings.reduce((sum, s) => sum + s.confidence, 0) / allSwings.length;

    // Determine playing style based on metrics
    let playingStyle: 'power' | 'control' | 'balanced' = 'balanced';
    if (avgSpeed > 100 && avgTempo < 3.0) {
      playingStyle = 'power';
    } else if (avgBalance > 85 && avgConfidence > 80) {
      playingStyle = 'control';
    }

    // Estimate handicap based on consistency and skill level
    const consistencyRating = Math.min(100, avgConfidence);
    const estimatedHandicap = Math.max(0, 30 - (userSkillLevel * 5) - (consistencyRating - 50) / 5);

    // Determine skill level category
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional' = 'intermediate';
    if (estimatedHandicap > 20) skillLevel = 'beginner';
    else if (estimatedHandicap > 10) skillLevel = 'intermediate';
    else if (estimatedHandicap > 5) skillLevel = 'advanced';
    else skillLevel = 'professional';

    return {
      estimatedHandicap,
      playingStyle,
      skillLevel,
      consistencyRating,
    };
  }

  private filterRelevantTemplates(
    userProfile: ComparisonAnalysis['userProfile'],
    clubType: string
  ): SwingTemplate[] {
    return this.templates.filter(template => {
      // Match skill level category
      const skillMatch = 
        (userProfile.skillLevel === 'beginner' && template.category === 'beginner') ||
        (userProfile.skillLevel === 'intermediate' && ['amateur', 'beginner'].includes(template.category)) ||
        (userProfile.skillLevel === 'advanced' && ['professional', 'amateur'].includes(template.category)) ||
        (userProfile.skillLevel === 'professional' && template.category === 'professional');

      // Prefer templates that match playing style or are balanced
      const styleMatch = 
        template.golferProfile.playingStyle === userProfile.playingStyle ||
        template.golferProfile.playingStyle === 'balanced';

      return skillMatch && (styleMatch || template.category === 'beginner');
    });
  }

  private async compareAgainstTemplates(
    swingAnalysis: SwingAnalysisSummary,
    detailedMetrics: DetailedSwingMetrics | undefined,
    templates: SwingTemplate[]
  ): Promise<TemplateComparison[]> {
    const comparisons: TemplateComparison[] = [];

    for (const template of templates) {
      const comparison = await this.compareSwingToTemplate(
        swingAnalysis,
        detailedMetrics,
        template
      );
      comparisons.push(comparison);
    }

    return comparisons;
  }

  private async compareSwingToTemplate(
    swingAnalysis: SwingAnalysisSummary,
    detailedMetrics: DetailedSwingMetrics | undefined,
    template: SwingTemplate
  ): Promise<TemplateComparison> {
    const metricComparisons = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Compare clubhead speed
    const speedComparison = this.compareMetric(
      'Clubhead Speed',
      swingAnalysis.clubheadSpeed,
      template.idealMetrics.clubheadSpeed.optimal,
      template.idealMetrics.clubheadSpeed.min,
      template.idealMetrics.clubheadSpeed.max,
      3.0 // High weight
    );
    metricComparisons.push(speedComparison);
    totalScore += speedComparison.score * 3.0;
    totalWeight += 3.0;

    // Compare swing tempo
    const tempoComparison = this.compareMetric(
      'Swing Tempo',
      swingAnalysis.swingTempo,
      template.idealMetrics.swingTempo.optimal,
      template.idealMetrics.swingTempo.min,
      template.idealMetrics.swingTempo.max,
      2.5
    );
    metricComparisons.push(tempoComparison);
    totalScore += tempoComparison.score * 2.5;
    totalWeight += 2.5;

    // Compare balance score
    const balanceComparison = this.compareMetric(
      'Balance Score',
      swingAnalysis.balanceScore,
      template.idealMetrics.balanceScore.optimal,
      template.idealMetrics.balanceScore.min,
      template.idealMetrics.balanceScore.max,
      2.0
    );
    metricComparisons.push(balanceComparison);
    totalScore += balanceComparison.score * 2.0;
    totalWeight += 2.0;

    // Add detailed metrics comparisons if available
    if (detailedMetrics) {
      const backswingComparison = this.compareMetric(
        'Backswing Angle',
        detailedMetrics.backswingAngle,
        template.idealMetrics.backswingAngle.optimal,
        template.idealMetrics.backswingAngle.min,
        template.idealMetrics.backswingAngle.max,
        1.5
      );
      metricComparisons.push(backswingComparison);
      totalScore += backswingComparison.score * 1.5;
      totalWeight += 1.5;

      const impactComparison = this.compareMetric(
        'Impact Timing',
        detailedMetrics.impactTiming,
        template.idealMetrics.impactTiming.optimal,
        template.idealMetrics.impactTiming.min,
        template.idealMetrics.impactTiming.max,
        1.5
      );
      metricComparisons.push(impactComparison);
      totalScore += impactComparison.score * 1.5;
      totalWeight += 1.5;
    }

    const overallMatch = Math.round((totalScore / totalWeight) * 100);
    const categoryMatch = this.getCategoryMatch(overallMatch);

    // Generate specific recommendations
    const strengths = this.extractStrengths(metricComparisons, template);
    const improvementAreas = this.extractImprovementAreas(metricComparisons, template);
    const specificRecommendations = this.generateSpecificRecommendations(
      metricComparisons,
      template,
      swingAnalysis.clubType
    );
    const practiceRoutine = this.generatePracticeRoutine(improvementAreas, template);

    return {
      templateId: template.id,
      templateName: template.name,
      overallMatch,
      categoryMatch,
      metricComparisons: metricComparisons.map(mc => ({
        metric: mc.metric,
        userValue: mc.userValue,
        templateValue: mc.templateValue,
        deviation: mc.deviation,
        deviationPercentage: mc.deviationPercentage,
        status: mc.status,
      })),
      strengths,
      improvementAreas,
      specificRecommendations,
      practiceRoutine,
      confidenceScore: Math.min(95, overallMatch + swingAnalysis.confidence / 10),
    };
  }

  private compareMetric(
    metricName: string,
    userValue: number,
    templateOptimal: number,
    templateMin: number,
    templateMax: number,
    weight: number
  ): {
    metric: string;
    userValue: number;
    templateValue: number;
    deviation: number;
    deviationPercentage: number;
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    score: number;
  } {
    const deviation = Math.abs(userValue - templateOptimal);
    const deviationPercentage = (deviation / templateOptimal) * 100;
    
    let status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    let score: number;

    if (userValue >= templateMin && userValue <= templateMax) {
      if (deviationPercentage <= 5) {
        status = 'excellent';
        score = 1.0;
      } else if (deviationPercentage <= 15) {
        status = 'good';
        score = 0.8;
      } else {
        status = 'needs_improvement';
        score = 0.6;
      }
    } else {
      status = 'critical';
      score = 0.3;
    }

    return {
      metric: metricName,
      userValue,
      templateValue: templateOptimal,
      deviation,
      deviationPercentage,
      status,
      score,
    };
  }

  private getCategoryMatch(overallMatch: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (overallMatch >= 85) return 'excellent';
    if (overallMatch >= 70) return 'good';
    if (overallMatch >= 55) return 'fair';
    return 'poor';
  }

  private extractStrengths(metricComparisons: any[], template: SwingTemplate): string[] {
    const strengths = metricComparisons
      .filter(mc => mc.status === 'excellent' || mc.status === 'good')
      .map(mc => `${mc.metric} is well-matched to template`)
      .slice(0, 3);

    // Add template-specific strengths
    if (strengths.length < 3) {
      template.keyTechniques.forEach(technique => {
        if (strengths.length < 3) {
          strengths.push(`Showing ${technique.toLowerCase()} characteristics`);
        }
      });
    }

    return strengths;
  }

  private extractImprovementAreas(metricComparisons: any[], template: SwingTemplate): string[] {
    const areas = metricComparisons
      .filter(mc => mc.status === 'needs_improvement' || mc.status === 'critical')
      .map(mc => mc.metric)
      .slice(0, 3);

    return areas;
  }

  private generateSpecificRecommendations(
    metricComparisons: any[],
    template: SwingTemplate,
    clubType: string
  ): string[] {
    const recommendations: string[] = [];
    
    metricComparisons.forEach(mc => {
      if (mc.status === 'needs_improvement' || mc.status === 'critical') {
        switch (mc.metric) {
          case 'Clubhead Speed':
            if (mc.userValue < mc.templateValue) {
              recommendations.push('Focus on generating more clubhead speed through improved rotation');
            } else {
              recommendations.push('Work on controlled tempo to maintain accuracy');
            }
            break;
          case 'Swing Tempo':
            if (mc.userValue < mc.templateValue) {
              recommendations.push('Slow down your tempo for better control and timing');
            } else {
              recommendations.push('Work on quicker tempo while maintaining balance');
            }
            break;
          case 'Balance Score':
            recommendations.push('Practice balance drills to improve stability throughout swing');
            break;
        }
      }
    });

    // Add template-specific training tips
    template.trainingTips.forEach(tip => {
      if (recommendations.length < 4) {
        recommendations.push(tip);
      }
    });

    return recommendations.slice(0, 4);
  }

  private generatePracticeRoutine(
    improvementAreas: string[],
    template: SwingTemplate
  ): TemplateComparison['practiceRoutine'] {
    const routines: TemplateComparison['practiceRoutine'] = [];

    improvementAreas.forEach(area => {
      switch (area) {
        case 'Clubhead Speed':
          routines.push({
            drill: 'Speed Training Swings',
            description: 'Practice swings with focus on generating maximum speed while maintaining control',
            duration: '15 minutes',
            frequency: '3 times per week',
          });
          break;
        case 'Swing Tempo':
          routines.push({
            drill: 'Metronome Training',
            description: 'Practice swings to a metronome beat to develop consistent tempo',
            duration: '10 minutes',
            frequency: 'Daily',
          });
          break;
        case 'Balance Score':
          routines.push({
            drill: 'Balance Board Practice',
            description: 'Practice swings on a balance board to improve stability',
            duration: '10 minutes',
            frequency: '4 times per week',
          });
          break;
      }
    });

    // Add general template-based routine
    if (routines.length < 3) {
      routines.push({
        drill: 'Template Visualization',
        description: `Visualize and practice ${template.name} swing characteristics`,
        duration: '5 minutes',
        frequency: 'Before each practice session',
      });
    }

    return routines;
  }

  private generateOverallAssessment(
    swingAnalysis: SwingAnalysisSummary,
    bestMatches: TemplateComparison[],
    recentSwings: SwingAnalysisSummary[]
  ): ComparisonAnalysis['overallAssessment'] {
    const allSwings = [swingAnalysis, ...recentSwings];
    
    // Extract common strengths and weaknesses
    const allStrengths = bestMatches.flatMap(match => match.strengths);
    const allWeaknesses = bestMatches.flatMap(match => match.improvementAreas);
    
    const strengths = [...new Set(allStrengths)].slice(0, 3);
    const primaryWeaknesses = [...new Set(allWeaknesses)].slice(0, 3);

    // Calculate improvement potential based on consistency
    const consistencyVariance = this.calculateConsistencyVariance(allSwings);
    const improvementPotential = Math.max(20, 100 - consistencyVariance);

    // Determine recommended focus areas
    const recommendedFocus = this.determineRecommendedFocus(bestMatches, swingAnalysis);

    return {
      strengths,
      primaryWeaknesses,
      improvementPotential,
      recommendedFocus,
    };
  }

  private calculateConsistencyVariance(swings: SwingAnalysisSummary[]): number {
    if (swings.length < 2) return 50;

    const speedVariance = this.calculateVariance(swings.map(s => s.clubheadSpeed));
    const tempoVariance = this.calculateVariance(swings.map(s => s.swingTempo));
    const balanceVariance = this.calculateVariance(swings.map(s => s.balanceScore));

    return (speedVariance + tempoVariance + balanceVariance) / 3;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private determineRecommendedFocus(
    bestMatches: TemplateComparison[],
    swingAnalysis: SwingAnalysisSummary
  ): string[] {
    const focus: string[] = [];
    
    // Focus on the most critical improvement areas from best match
    if (bestMatches.length > 0) {
      const criticalAreas = bestMatches[0].metricComparisons
        .filter(mc => mc.status === 'critical')
        .map(mc => mc.metric);
      
      focus.push(...criticalAreas.slice(0, 2));
    }

    // Add general focus areas based on club type
    switch (swingAnalysis.clubType) {
      case 'driver':
        if (!focus.includes('Clubhead Speed')) focus.push('Power generation');
        break;
      case 'iron':
        if (!focus.includes('Balance Score')) focus.push('Consistency');
        break;
      case 'wedge':
        focus.push('Touch and feel');
        break;
    }

    return focus.slice(0, 3);
  }

  private createProgressionPath(
    userProfile: ComparisonAnalysis['userProfile'],
    bestMatch: TemplateComparison,
    swingAnalysis: SwingAnalysisSummary
  ): ComparisonAnalysis['progressionPath'] {
    // Find next target template based on skill progression
    const currentTemplate = bestMatch.templateName;
    let nextTargetTemplate = currentTemplate;

    // Suggest progression to higher skill level template if performance is good
    if (bestMatch.overallMatch > 80) {
      const nextLevelTemplates = this.templates.filter(t => 
        t.category === this.getNextSkillCategory(userProfile.skillLevel)
      );
      if (nextLevelTemplates.length > 0) {
        nextTargetTemplate = nextLevelTemplates[0].name;
      }
    }

    // Create specific milestones based on improvement areas
    const milestones = bestMatch.improvementAreas.slice(0, 3).map(area => {
      const metric = bestMatch.metricComparisons.find(mc => mc.metric === area);
      if (metric) {
        return {
          metric: area,
          currentValue: metric.userValue,
          targetValue: metric.templateValue,
          timeframe: this.estimateTimeframe(metric.deviationPercentage),
        };
      }
      return {
        metric: area,
        currentValue: 0,
        targetValue: 100,
        timeframe: '3-6 months',
      };
    });

    return {
      currentTemplate,
      nextTargetTemplate,
      milestones,
    };
  }

  private getNextSkillCategory(currentSkill: string): 'professional' | 'amateur' | 'beginner' {
    switch (currentSkill) {
      case 'beginner': return 'amateur';
      case 'intermediate': return 'amateur';
      case 'advanced': return 'professional';
      default: return 'professional';
    }
  }

  private estimateTimeframe(deviationPercentage: number): string {
    if (deviationPercentage < 10) return '2-4 weeks';
    if (deviationPercentage < 20) return '1-3 months';
    if (deviationPercentage < 40) return '3-6 months';
    return '6-12 months';
  }

  private generateCustomRecommendations(
    swingAnalysis: SwingAnalysisSummary,
    bestMatches: TemplateComparison[],
    userProfile: ComparisonAnalysis['userProfile']
  ): string[] {
    const recommendations: string[] = [];

    // Add skill-level specific recommendations
    switch (userProfile.skillLevel) {
      case 'beginner':
        recommendations.push('Focus on fundamental setup and grip before working on advanced techniques');
        recommendations.push('Consider taking lessons with a PGA professional');
        break;
      case 'intermediate':
        recommendations.push('Work on consistency before trying to increase distance');
        recommendations.push('Develop a pre-shot routine for better performance');
        break;
      case 'advanced':
        recommendations.push('Fine-tune specific aspects rather than major swing changes');
        recommendations.push('Focus on course management and mental game');
        break;
    }

    // Add playing style specific recommendations
    switch (userProfile.playingStyle) {
      case 'power':
        recommendations.push('Work on accuracy to complement your power');
        break;
      case 'control':
        recommendations.push('Consider adding controlled distance to your accuracy');
        break;
      case 'balanced':
        recommendations.push('Maintain your balanced approach while refining weak areas');
        break;
    }

    return recommendations.slice(0, 4);
  }

  private generateFallbackAnalysis(
    swingAnalysis: SwingAnalysisSummary,
    userSkillLevel: number
  ): ComparisonAnalysis {
    return {
      userProfile: {
        estimatedHandicap: Math.max(5, 25 - userSkillLevel * 4),
        playingStyle: 'balanced',
        skillLevel: userSkillLevel <= 1 ? 'beginner' : userSkillLevel <= 2 ? 'intermediate' : 'advanced',
        consistencyRating: swingAnalysis.confidence,
      },
      bestMatches: [{
        templateId: 'fallback',
        templateName: 'General Template',
        overallMatch: 65,
        categoryMatch: 'fair',
        metricComparisons: [],
        strengths: ['Attempting to improve'],
        improvementAreas: ['Overall technique'],
        specificRecommendations: ['Practice regularly', 'Focus on fundamentals'],
        practiceRoutine: [],
        confidenceScore: 50,
      }],
      overallAssessment: {
        strengths: ['Consistent effort'],
        primaryWeaknesses: ['Technical development needed'],
        improvementPotential: 75,
        recommendedFocus: ['Fundamentals', 'Consistency'],
      },
      progressionPath: {
        currentTemplate: 'General Template',
        nextTargetTemplate: 'Beginner Foundation',
        milestones: [],
      },
      customRecommendations: [
        'Continue practicing regularly',
        'Consider professional instruction',
        'Focus on basic fundamentals',
      ],
    };
  }

  public getAvailableTemplates(): SwingTemplate[] {
    return [...this.templates];
  }

  public getTemplateById(templateId: string): SwingTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }
}