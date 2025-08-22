import { SwingAnalysisSummary, SwingMetricsSummary, SwingAnalysisContext } from '../store/slices/aiCaddieSlice';
import { DetailedSwingMetrics } from './SwingMetricsService';
import { PatternMatchResult } from './SwingPatternService';
import { SwingDetectionResult } from './SwingDetectionService';
import { DynamicCaddieService } from './DynamicCaddieService';
import { SwingTemplateComparisonService, ComparisonAnalysis } from './SwingTemplateComparisonService';

export interface SwingFeedbackRequest {
  userId: number;
  roundId?: number;
  swingAnalysis: SwingAnalysisSummary;
  detailedMetrics?: DetailedSwingMetrics;
  patternMatch?: PatternMatchResult;
  userSkillLevel: number;
  recentSwings?: SwingAnalysisSummary[];
  courseContext?: {
    holePar: number;
    holeDistance: number;
    weatherConditions?: string;
  };
}

export interface SwingFeedbackResponse {
  feedback: string;
  audioUrl?: string;
  recommendations: string[];
  strengths: string[];
  improvementAreas: string[];
  nextSwingTips: string[];
  confidence: number;
  timestamp: string;
  templateComparison?: ComparisonAnalysis;
}

export interface SwingTrendAnalysis {
  improvementAreas: string[];
  progressingAreas: string[];
  consistencyMetrics: {
    clubheadSpeed: number;
    swingTempo: number;
    balanceScore: number;
    patternMatch: number;
  };
  averageMetrics: SwingMetricsSummary;
  totalSwings: number;
  sessionStartTime: string;
}

interface SwingFeedbackContext {
  swingQuality: 'excellent' | 'good' | 'average' | 'needs_improvement';
  keyStrengths: string[];
  primaryIssues: string[];
  skillLevelAdjustment: string;
  comparisonToIdeal: string;
  progressFeedback?: string;
}

export class SwingFeedbackService {
  private dynamicCaddieService: DynamicCaddieService;
  private templateComparisonService: SwingTemplateComparisonService;
  private feedbackHistory: SwingFeedbackResponse[] = [];
  private readonly maxHistorySize = 20;

  constructor(dynamicCaddieService: DynamicCaddieService) {
    this.dynamicCaddieService = dynamicCaddieService;
    this.templateComparisonService = new SwingTemplateComparisonService();
  }

  public async generateSwingFeedback(request: SwingFeedbackRequest): Promise<SwingFeedbackResponse> {
    try {
      console.log('🔄 SwingFeedbackService: Generating feedback for swing:', {
        clubType: request.swingAnalysis.clubType,
        confidence: request.swingAnalysis.confidence,
        clubheadSpeed: request.swingAnalysis.clubheadSpeed,
        userSkillLevel: request.userSkillLevel
      });

      // Analyze swing quality and context
      const feedbackContext = this.analyzeFeedbackContext(request);
      
      // Generate template comparison analysis
      const templateComparison = await this.templateComparisonService.compareSwingToTemplates(
        request.swingAnalysis,
        request.detailedMetrics,
        request.userSkillLevel,
        request.recentSwings || []
      );
      
      // Enhanced feedback message with template insights
      const feedbackMessage = this.buildEnhancedFeedbackMessage(request, feedbackContext, templateComparison);
      
      // Get AI-powered detailed feedback
      const aiResponse = await this.getAIFeedback(feedbackMessage, request);
      
      // Extract recommendations and improvement areas using template comparison
      const recommendations = this.extractEnhancedRecommendations(request, feedbackContext, templateComparison);
      const improvementAreas = this.extractEnhancedImprovementAreas(request, feedbackContext, templateComparison);
      const strengths = this.extractEnhancedStrengths(request, feedbackContext, templateComparison);
      const nextSwingTips = this.generateEnhancedNextSwingTips(request, feedbackContext, templateComparison);

      const feedback: SwingFeedbackResponse = {
        feedback: aiResponse?.message || this.generateFallbackFeedback(request, feedbackContext),
        audioUrl: aiResponse?.audioUrl,
        recommendations,
        strengths,
        improvementAreas,
        nextSwingTips,
        confidence: this.calculateFeedbackConfidence(request),
        timestamp: new Date().toISOString(),
        templateComparison,
      };

      // Store in history
      this.addToHistory(feedback);

      console.log('✅ SwingFeedbackService: Generated feedback:', {
        feedbackLength: feedback.feedback.length,
        recommendations: feedback.recommendations.length,
        confidence: feedback.confidence
      });

      return feedback;

    } catch (error) {
      console.error('❌ SwingFeedbackService: Error generating swing feedback:', error);
      return this.generateErrorFallback(request);
    }
  }

  public async analyzeSwingTrends(
    recentSwings: SwingAnalysisSummary[],
    timeframeHours: number = 2
  ): Promise<SwingTrendAnalysis> {
    const cutoffTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
    const sessionSwings = recentSwings.filter(
      swing => new Date(swing.timestamp) > cutoffTime
    );

    if (sessionSwings.length === 0) {
      return this.getEmptyTrendAnalysis();
    }

    const consistencyMetrics = this.calculateConsistencyMetrics(sessionSwings);
    const averageMetrics = this.calculateAverageMetrics(sessionSwings);
    const improvementAreas = this.identifyImprovementAreas(sessionSwings, consistencyMetrics);
    const progressingAreas = this.identifyProgressingAreas(sessionSwings);

    return {
      improvementAreas,
      progressingAreas,
      consistencyMetrics,
      averageMetrics,
      totalSwings: sessionSwings.length,
      sessionStartTime: sessionSwings[0]?.timestamp || new Date().toISOString(),
    };
  }

  private analyzeFeedbackContext(request: SwingFeedbackRequest): SwingFeedbackContext {
    const { swingAnalysis, detailedMetrics, patternMatch, userSkillLevel } = request;
    
    // Determine swing quality based on multiple factors
    const qualityScore = this.calculateSwingQualityScore(swingAnalysis, patternMatch);
    const swingQuality = this.getQualityRating(qualityScore);
    
    // Extract key strengths
    const keyStrengths = this.identifyKeyStrengths(swingAnalysis, detailedMetrics, patternMatch);
    
    // Identify primary issues
    const primaryIssues = this.identifyPrimaryIssues(swingAnalysis, detailedMetrics, patternMatch);
    
    // Adjust feedback for skill level
    const skillLevelAdjustment = this.getSkillLevelAdjustment(userSkillLevel);
    
    // Compare to ideal swing
    const comparisonToIdeal = this.getIdealComparison(swingAnalysis, patternMatch);
    
    // Add progress feedback if we have recent swings
    const progressFeedback = request.recentSwings 
      ? this.getProgressFeedback(request.recentSwings, swingAnalysis)
      : undefined;

    return {
      swingQuality,
      keyStrengths,
      primaryIssues,
      skillLevelAdjustment,
      comparisonToIdeal,
      progressFeedback,
    };
  }

  private calculateSwingQualityScore(
    swing: SwingAnalysisSummary, 
    patternMatch?: PatternMatchResult
  ): number {
    let score = 0;
    
    // Base confidence score (0-40 points)
    score += Math.min(swing.confidence * 0.4, 40);
    
    // Pattern match score (0-30 points)
    if (patternMatch) {
      score += Math.min(patternMatch.overallMatch * 0.3, 30);
    }
    
    // Balance score (0-15 points)
    score += Math.min(swing.balanceScore * 0.15, 15);
    
    // Swing tempo score (0-15 points)
    const idealTempo = this.getIdealTempo(swing.clubType);
    const tempoDeviation = Math.abs(swing.swingTempo - idealTempo) / idealTempo;
    const tempoScore = Math.max(0, (1 - tempoDeviation) * 15);
    score += tempoScore;
    
    return Math.min(score, 100);
  }

  private getQualityRating(score: number): 'excellent' | 'good' | 'average' | 'needs_improvement' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'average';
    return 'needs_improvement';
  }

  private identifyKeyStrengths(
    swing: SwingAnalysisSummary,
    detailedMetrics?: DetailedSwingMetrics,
    patternMatch?: PatternMatchResult
  ): string[] {
    const strengths: string[] = [];
    
    // High confidence swing
    if (swing.confidence >= 85) {
      strengths.push('Consistent swing pattern');
    }
    
    // Good balance
    if (swing.balanceScore >= 80) {
      strengths.push('Excellent balance throughout swing');
    }
    
    // Good clubhead speed for club type
    const idealSpeed = this.getIdealClubheadSpeed(swing.clubType);
    if (swing.clubheadSpeed >= idealSpeed * 0.9) {
      strengths.push('Good clubhead speed');
    }
    
    // Good tempo
    const idealTempo = this.getIdealTempo(swing.clubType);
    if (Math.abs(swing.swingTempo - idealTempo) <= idealTempo * 0.1) {
      strengths.push('Smooth swing tempo');
    }
    
    // Pattern match strengths
    if (patternMatch && patternMatch.overallMatch >= 80) {
      strengths.push(`Strong ${swing.clubType} technique`);
    }

    return strengths.slice(0, 3); // Limit to top 3 strengths
  }

  private identifyPrimaryIssues(
    swing: SwingAnalysisSummary,
    detailedMetrics?: DetailedSwingMetrics,
    patternMatch?: PatternMatchResult
  ): string[] {
    const issues: string[] = [];
    
    // Low confidence
    if (swing.confidence < 60) {
      issues.push('Inconsistent swing pattern');
    }
    
    // Poor balance
    if (swing.balanceScore < 60) {
      issues.push('Balance needs improvement');
    }
    
    // Clubhead speed issues
    const idealSpeed = this.getIdealClubheadSpeed(swing.clubType);
    if (swing.clubheadSpeed < idealSpeed * 0.7) {
      issues.push('Low clubhead speed');
    } else if (swing.clubheadSpeed > idealSpeed * 1.3) {
      issues.push('Overswinging');
    }
    
    // Tempo issues
    const idealTempo = this.getIdealTempo(swing.clubType);
    if (swing.swingTempo < idealTempo * 0.8) {
      issues.push('Swing too fast');
    } else if (swing.swingTempo > idealTempo * 1.2) {
      issues.push('Swing too slow');
    }
    
    // Pattern match issues
    if (patternMatch && patternMatch.deviations) {
      const significantDeviations = patternMatch.deviations
        .filter(d => d.severity === 'high' || d.severity === 'critical')
        .slice(0, 2);
      
      significantDeviations.forEach(deviation => {
        issues.push(`${deviation.metric} needs attention`);
      });
    }

    return issues.slice(0, 3); // Limit to top 3 issues
  }

  private buildFeedbackMessage(request: SwingFeedbackRequest, context: SwingFeedbackContext): string {
    const { swingAnalysis, userSkillLevel, courseContext } = request;
    
    let message = `${swingAnalysis.clubType} swing analysis. `;
    message += `Quality: ${context.swingQuality}. `;
    
    if (context.keyStrengths.length > 0) {
      message += `Strengths: ${context.keyStrengths.join(', ')}. `;
    }
    
    if (context.primaryIssues.length > 0) {
      message += `Areas to improve: ${context.primaryIssues.join(', ')}. `;
    }
    
    message += context.skillLevelAdjustment;
    
    if (courseContext) {
      message += ` Playing par ${courseContext.holePar}, ${courseContext.holeDistance} yards.`;
    }
    
    return message;
  }

  private buildEnhancedFeedbackMessage(
    request: SwingFeedbackRequest, 
    context: SwingFeedbackContext,
    templateComparison: ComparisonAnalysis
  ): string {
    const { swingAnalysis, userSkillLevel, courseContext } = request;
    const bestMatch = templateComparison.bestMatches[0];
    
    let message = `${swingAnalysis.clubType} swing analysis comparing to ${bestMatch.templateName}. `;
    message += `Match: ${bestMatch.overallMatch}%. `;
    message += `Quality: ${context.swingQuality}. `;
    
    // Add template-specific insights
    if (bestMatch.overallMatch >= 80) {
      message += `Excellent match to professional template. `;
    } else if (bestMatch.overallMatch >= 65) {
      message += `Good foundation, room for refinement. `;
    } else {
      message += `Significant improvement opportunities identified. `;
    }
    
    // Include top template recommendation
    if (bestMatch.specificRecommendations.length > 0) {
      message += `Key focus: ${bestMatch.specificRecommendations[0]}. `;
    }
    
    message += context.skillLevelAdjustment;
    
    if (courseContext) {
      message += ` Playing par ${courseContext.holePar}, ${courseContext.holeDistance} yards.`;
    }
    
    return message;
  }

  private async getAIFeedback(
    message: string, 
    request: SwingFeedbackRequest
  ): Promise<{ message: string; audioUrl?: string } | null> {
    try {
      const response = await this.dynamicCaddieService.generateResponse(
        'SwingAnalysis',
        message,
        request.userId,
        request.roundId,
        undefined,
        7 // High priority for swing feedback
      );
      
      return {
        message: response.message,
        audioUrl: response.audioUrl
      };
    } catch (error) {
      console.warn('⚠️ SwingFeedbackService: AI feedback failed, using fallback:', error);
      return null;
    }
  }

  private extractRecommendations(request: SwingFeedbackRequest, context: SwingFeedbackContext): string[] {
    const recommendations: string[] = [];
    
    // Technical recommendations based on issues
    if (context.primaryIssues.includes('Balance needs improvement')) {
      recommendations.push('Focus on maintaining stable lower body during swing');
    }
    
    if (context.primaryIssues.includes('Low clubhead speed')) {
      recommendations.push('Work on hip rotation and wrist release for more power');
    }
    
    if (context.primaryIssues.includes('Swing too fast')) {
      recommendations.push('Practice with slower tempo drills to improve timing');
    }
    
    if (context.primaryIssues.includes('Overswinging')) {
      recommendations.push('Focus on controlled 3/4 swings for better accuracy');
    }
    
    // Skill level specific recommendations
    if (request.userSkillLevel <= 2) { // Beginner/Intermediate
      recommendations.push('Practice basic swing fundamentals regularly');
    } else {
      recommendations.push('Focus on fine-tuning your swing mechanics');
    }
    
    return recommendations.slice(0, 4);
  }

  private extractImprovementAreas(request: SwingFeedbackRequest, context: SwingFeedbackContext): string[] {
    return context.primaryIssues.slice(0, 3);
  }

  private extractStrengths(request: SwingFeedbackRequest, context: SwingFeedbackContext): string[] {
    return context.keyStrengths.slice(0, 3);
  }

  private generateNextSwingTips(request: SwingFeedbackRequest, context: SwingFeedbackContext): string[] {
    const tips: string[] = [];
    
    if (context.swingQuality === 'excellent') {
      tips.push('Maintain this swing rhythm');
      tips.push('Trust your technique');
    } else if (context.swingQuality === 'good') {
      tips.push('Keep the same tempo');
      tips.push('Focus on balance through impact');
    } else {
      tips.push('Take a practice swing to feel the tempo');
      tips.push('Focus on one improvement at a time');
    }
    
    if (context.primaryIssues.length > 0) {
      tips.push(`Work on: ${context.primaryIssues[0]}`);
    }
    
    return tips.slice(0, 3);
  }

  private calculateFeedbackConfidence(request: SwingFeedbackRequest): number {
    let confidence = request.swingAnalysis.confidence;
    
    // Boost confidence if we have pattern match data
    if (request.patternMatch) {
      confidence = Math.min(confidence + 10, 95);
    }
    
    // Boost confidence if we have detailed metrics
    if (request.detailedMetrics) {
      confidence = Math.min(confidence + 5, 95);
    }
    
    return confidence;
  }

  private generateFallbackFeedback(request: SwingFeedbackRequest, context: SwingFeedbackContext): string {
    const { swingAnalysis } = request;
    
    let feedback = `Nice ${swingAnalysis.clubType} swing! `;
    
    if (context.swingQuality === 'excellent') {
      feedback += 'That was a really solid swing with great technique.';
    } else if (context.swingQuality === 'good') {
      feedback += 'Good swing with room for small improvements.';
    } else if (context.swingQuality === 'average') {
      feedback += 'Decent swing, but we can work on some areas.';
    } else {
      feedback += 'Let\'s focus on improving a few key areas.';
    }
    
    if (context.keyStrengths.length > 0) {
      feedback += ` Your ${context.keyStrengths[0].toLowerCase()} looked great.`;
    }
    
    return feedback;
  }

  private generateErrorFallback(request: SwingFeedbackRequest): SwingFeedbackResponse {
    return {
      feedback: `Good ${request.swingAnalysis.clubType} swing! Keep working on your technique.`,
      recommendations: ['Keep practicing your swing fundamentals'],
      strengths: ['Consistent effort'],
      improvementAreas: ['General technique'],
      nextSwingTips: ['Focus on balance and tempo'],
      confidence: 50,
      timestamp: new Date().toISOString(),
    };
  }

  // Enhanced extraction methods using template comparison
  private extractEnhancedRecommendations(
    request: SwingFeedbackRequest, 
    context: SwingFeedbackContext,
    templateComparison: ComparisonAnalysis
  ): string[] {
    const recommendations: string[] = [];
    const bestMatch = templateComparison.bestMatches[0];
    
    // Use template-specific recommendations first
    if (bestMatch.specificRecommendations.length > 0) {
      recommendations.push(...bestMatch.specificRecommendations.slice(0, 2));
    }
    
    // Add overall assessment recommendations
    if (templateComparison.overallAssessment.recommendedFocus.length > 0) {
      templateComparison.overallAssessment.recommendedFocus.forEach(focus => {
        if (recommendations.length < 4) {
          recommendations.push(`Focus on ${focus.toLowerCase()}`);
        }
      });
    }
    
    // Add custom recommendations
    if (templateComparison.customRecommendations.length > 0) {
      templateComparison.customRecommendations.forEach(rec => {
        if (recommendations.length < 4) {
          recommendations.push(rec);
        }
      });
    }
    
    // Fallback to original method if not enough recommendations
    if (recommendations.length < 3) {
      const originalRecommendations = this.extractRecommendations(request, context);
      originalRecommendations.forEach(rec => {
        if (recommendations.length < 4 && !recommendations.includes(rec)) {
          recommendations.push(rec);
        }
      });
    }
    
    return recommendations.slice(0, 4);
  }

  private extractEnhancedImprovementAreas(
    request: SwingFeedbackRequest, 
    context: SwingFeedbackContext,
    templateComparison: ComparisonAnalysis
  ): string[] {
    const areas: string[] = [];
    const bestMatch = templateComparison.bestMatches[0];
    
    // Use template improvement areas
    if (bestMatch.improvementAreas.length > 0) {
      areas.push(...bestMatch.improvementAreas.slice(0, 2));
    }
    
    // Add overall assessment weaknesses
    if (templateComparison.overallAssessment.primaryWeaknesses.length > 0) {
      templateComparison.overallAssessment.primaryWeaknesses.forEach(weakness => {
        if (areas.length < 3 && !areas.includes(weakness)) {
          areas.push(weakness);
        }
      });
    }
    
    // Fallback to original method
    if (areas.length < 2) {
      const originalAreas = this.extractImprovementAreas(request, context);
      originalAreas.forEach(area => {
        if (areas.length < 3 && !areas.includes(area)) {
          areas.push(area);
        }
      });
    }
    
    return areas.slice(0, 3);
  }

  private extractEnhancedStrengths(
    request: SwingFeedbackRequest, 
    context: SwingFeedbackContext,
    templateComparison: ComparisonAnalysis
  ): string[] {
    const strengths: string[] = [];
    const bestMatch = templateComparison.bestMatches[0];
    
    // Use template strengths
    if (bestMatch.strengths.length > 0) {
      strengths.push(...bestMatch.strengths.slice(0, 2));
    }
    
    // Add overall assessment strengths
    if (templateComparison.overallAssessment.strengths.length > 0) {
      templateComparison.overallAssessment.strengths.forEach(strength => {
        if (strengths.length < 3 && !strengths.includes(strength)) {
          strengths.push(strength);
        }
      });
    }
    
    // Fallback to original method
    if (strengths.length < 2) {
      const originalStrengths = this.extractStrengths(request, context);
      originalStrengths.forEach(strength => {
        if (strengths.length < 3 && !strengths.includes(strength)) {
          strengths.push(strength);
        }
      });
    }
    
    return strengths.slice(0, 3);
  }

  private generateEnhancedNextSwingTips(
    request: SwingFeedbackRequest, 
    context: SwingFeedbackContext,
    templateComparison: ComparisonAnalysis
  ): string[] {
    const tips: string[] = [];
    const bestMatch = templateComparison.bestMatches[0];
    
    // Generate tips based on template comparison match level
    if (bestMatch.overallMatch >= 80) {
      tips.push('Maintain your current technique');
      tips.push('Fine-tune for consistency');
    } else if (bestMatch.overallMatch >= 65) {
      tips.push('Focus on your strongest elements');
      tips.push(`Work on ${bestMatch.improvementAreas[0] || 'overall technique'}`);
    } else {
      tips.push('Take it one improvement at a time');
      tips.push('Focus on fundamentals');
    }
    
    // Add practice routine tip if available
    if (bestMatch.practiceRoutine.length > 0) {
      const drill = bestMatch.practiceRoutine[0];
      tips.push(`Try: ${drill.drill} for ${drill.duration}`);
    }
    
    // Fallback to original method if needed
    if (tips.length < 3) {
      const originalTips = this.generateNextSwingTips(request, context);
      originalTips.forEach(tip => {
        if (tips.length < 3 && !tips.includes(tip)) {
          tips.push(tip);
        }
      });
    }
    
    return tips.slice(0, 3);
  }

  // Helper methods for calculations
  private getIdealClubheadSpeed(clubType: string): number {
    switch (clubType) {
      case 'driver': return 100; // mph
      case 'iron': return 85;
      case 'wedge': return 75;
      case 'putter': return 20;
      default: return 85;
    }
  }

  private getIdealTempo(clubType: string): number {
    switch (clubType) {
      case 'driver': return 3.0; // seconds
      case 'iron': return 2.8;
      case 'wedge': return 2.5;
      case 'putter': return 1.5;
      default: return 2.8;
    }
  }

  private getSkillLevelAdjustment(skillLevel: number): string {
    if (skillLevel === 1) return 'For beginners, focus on fundamentals. ';
    if (skillLevel === 2) return 'Building on your foundation skills. ';
    if (skillLevel === 3) return 'Advanced techniques to refine. ';
    if (skillLevel === 4) return 'Professional level adjustments. ';
    return 'Keep developing your technique. ';
  }

  private getIdealComparison(swing: SwingAnalysisSummary, patternMatch?: PatternMatchResult): string {
    if (!patternMatch) return '';
    
    if (patternMatch.overallMatch >= 80) {
      return 'Very close to ideal swing pattern. ';
    } else if (patternMatch.overallMatch >= 60) {
      return 'Good swing pattern with room for improvement. ';
    } else {
      return 'Significant deviation from ideal pattern. ';
    }
  }

  private getProgressFeedback(recentSwings: SwingAnalysisSummary[], currentSwing: SwingAnalysisSummary): string {
    if (recentSwings.length < 2) return '';
    
    const avgPrevious = recentSwings.slice(0, -1).reduce((sum, swing) => sum + swing.confidence, 0) / (recentSwings.length - 1);
    const improvement = currentSwing.confidence - avgPrevious;
    
    if (improvement > 5) {
      return 'Great improvement from your recent swings! ';
    } else if (improvement < -5) {
      return 'Let\'s get back to your previous form. ';
    } else {
      return 'Maintaining consistent swing quality. ';
    }
  }

  // Trend analysis helper methods
  private calculateConsistencyMetrics(swings: SwingAnalysisSummary[]): {
    clubheadSpeed: number;
    swingTempo: number;
    balanceScore: number;
    patternMatch: number;
  } {
    if (swings.length === 0) {
      return { clubheadSpeed: 0, swingTempo: 0, balanceScore: 0, patternMatch: 0 };
    }

    const speeds = swings.map(s => s.clubheadSpeed);
    const tempos = swings.map(s => s.swingTempo);
    const balances = swings.map(s => s.balanceScore);
    const patterns = swings.map(s => s.patternMatch);

    return {
      clubheadSpeed: this.calculateVariationCoefficient(speeds),
      swingTempo: this.calculateVariationCoefficient(tempos),
      balanceScore: this.calculateVariationCoefficient(balances),
      patternMatch: this.calculateVariationCoefficient(patterns),
    };
  }

  private calculateVariationCoefficient(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean === 0 ? 0 : (stdDev / mean) * 100;
  }

  private calculateAverageMetrics(swings: SwingAnalysisSummary[]): SwingMetricsSummary {
    if (swings.length === 0) {
      return {
        avgClubheadSpeed: 0,
        avgSwingTempo: 0,
        avgBalanceScore: 0,
        avgPatternMatch: 0,
        swingCount: 0,
        consistency: 0,
      };
    }

    const avgClubheadSpeed = swings.reduce((sum, s) => sum + s.clubheadSpeed, 0) / swings.length;
    const avgSwingTempo = swings.reduce((sum, s) => sum + s.swingTempo, 0) / swings.length;
    const avgBalanceScore = swings.reduce((sum, s) => sum + s.balanceScore, 0) / swings.length;
    const avgPatternMatch = swings.reduce((sum, s) => sum + s.patternMatch, 0) / swings.length;
    
    const consistencyMetrics = this.calculateConsistencyMetrics(swings);
    const consistency = 100 - ((consistencyMetrics.clubheadSpeed + consistencyMetrics.swingTempo + 
                               consistencyMetrics.balanceScore + consistencyMetrics.patternMatch) / 4);

    return {
      avgClubheadSpeed,
      avgSwingTempo,
      avgBalanceScore,
      avgPatternMatch,
      swingCount: swings.length,
      consistency: Math.max(0, consistency),
    };
  }

  private identifyImprovementAreas(
    swings: SwingAnalysisSummary[], 
    consistencyMetrics: any
  ): string[] {
    const areas: string[] = [];
    
    // Check for consistency issues
    if (consistencyMetrics.clubheadSpeed > 20) {
      areas.push('Clubhead speed consistency');
    }
    if (consistencyMetrics.swingTempo > 15) {
      areas.push('Swing tempo consistency');
    }
    if (consistencyMetrics.balanceScore > 25) {
      areas.push('Balance stability');
    }
    
    // Check for low average performance
    const avgMetrics = this.calculateAverageMetrics(swings);
    if (avgMetrics.avgBalanceScore < 70) {
      areas.push('Overall balance');
    }
    if (avgMetrics.avgPatternMatch < 70) {
      areas.push('Swing technique');
    }
    
    return areas.slice(0, 3);
  }

  private identifyProgressingAreas(swings: SwingAnalysisSummary[]): string[] {
    if (swings.length < 3) return [];
    
    const recentSwings = swings.slice(-3);
    const earlierSwings = swings.slice(0, -3);
    
    if (earlierSwings.length === 0) return [];
    
    const recentAvg = this.calculateAverageMetrics(recentSwings);
    const earlierAvg = this.calculateAverageMetrics(earlierSwings);
    
    const areas: string[] = [];
    
    if (recentAvg.avgClubheadSpeed > earlierAvg.avgClubheadSpeed * 1.05) {
      areas.push('Clubhead speed');
    }
    if (recentAvg.avgBalanceScore > earlierAvg.avgBalanceScore * 1.05) {
      areas.push('Balance control');
    }
    if (recentAvg.avgPatternMatch > earlierAvg.avgPatternMatch * 1.05) {
      areas.push('Swing technique');
    }
    
    return areas;
  }

  private getEmptyTrendAnalysis(): SwingTrendAnalysis {
    return {
      improvementAreas: [],
      progressingAreas: [],
      consistencyMetrics: {
        clubheadSpeed: 0,
        swingTempo: 0,
        balanceScore: 0,
        patternMatch: 0,
      },
      averageMetrics: {
        avgClubheadSpeed: 0,
        avgSwingTempo: 0,
        avgBalanceScore: 0,
        avgPatternMatch: 0,
        swingCount: 0,
        consistency: 0,
      },
      totalSwings: 0,
      sessionStartTime: new Date().toISOString(),
    };
  }

  private addToHistory(feedback: SwingFeedbackResponse): void {
    this.feedbackHistory.unshift(feedback);
    if (this.feedbackHistory.length > this.maxHistorySize) {
      this.feedbackHistory = this.feedbackHistory.slice(0, this.maxHistorySize);
    }
  }

  public getFeedbackHistory(): SwingFeedbackResponse[] {
    return [...this.feedbackHistory];
  }

  public clearFeedbackHistory(): void {
    this.feedbackHistory = [];
  }
}