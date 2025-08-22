import { SwingAnalysisSummary, SwingMetricsSummary } from '../store/slices/aiCaddieSlice';
import { ComparisonAnalysis } from './SwingTemplateComparisonService';

export interface ProgressionMetric {
  metric: string;
  values: {
    timestamp: string;
    value: number;
    confidence: number;
  }[];
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  trendConfidence: number;
  currentValue: number;
  bestValue: number;
  averageValue: number;
  improvement: number; // Percentage improvement from first to latest value
  consistencyScore: number; // How consistent the metric is (lower variance = higher score)
}

export interface ProgressionPeriod {
  startDate: string;
  endDate: string;
  totalSwings: number;
  averageMetrics: SwingMetricsSummary;
  skillLevelProgression: {
    startLevel: number;
    endLevel: number;
    confidence: number;
  };
  achievements: Achievement[];
  milestones: Milestone[];
}

export interface Achievement {
  id: string;
  type: 'milestone' | 'consistency' | 'improvement' | 'technique';
  title: string;
  description: string;
  achievedDate: string;
  value?: number;
  threshold?: number;
  icon: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  progress: number; // 0-100
  estimatedCompletion: string;
  category: 'speed' | 'accuracy' | 'consistency' | 'technique';
}

export interface ProgressionAnalysis {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  overallProgress: {
    skillLevelImprovement: number;
    consistencyImprovement: number;
    technicalImprovement: number;
    overallScore: number; // Combined score 0-100
  };
  metricProgression: ProgressionMetric[];
  periodAnalysis: ProgressionPeriod[];
  currentStreak: {
    type: 'improvement' | 'consistency' | 'practice';
    days: number;
    description: string;
  };
  nextGoals: {
    shortTerm: Milestone[]; // 1-4 weeks
    mediumTerm: Milestone[]; // 1-3 months  
    longTerm: Milestone[]; // 3-12 months
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    reasoning: string;
    timeframe: string;
  }[];
  insights: string[];
}

export interface SessionAnalysis {
  sessionDate: string;
  swingCount: number;
  sessionDuration: number; // minutes
  averageQuality: number;
  bestSwing: SwingAnalysisSummary;
  improvements: string[];
  concerns: string[];
  sessionType: 'practice' | 'round' | 'lesson' | 'warmup';
  weatherConditions?: string;
  fatigue: 'low' | 'medium' | 'high';
}

export class SwingProgressionTrackingService {
  private progressionData: Map<string, SwingAnalysisSummary[]> = new Map();
  private achievementsData: Map<string, Achievement[]> = new Map();
  private milestonesData: Map<string, Milestone[]> = new Map();
  private readonly maxHistoryDays = 365; // Store up to 1 year of data

  constructor() {
    this.initializeDefaultMilestones();
  }

  public async trackSwingProgression(
    userId: string,
    swingAnalysis: SwingAnalysisSummary,
    templateComparison?: ComparisonAnalysis
  ): Promise<void> {
    try {
      console.log('📈 SwingProgressionTrackingService: Tracking progression for user:', userId);

      // Add swing to user's history
      this.addSwingToHistory(userId, swingAnalysis);

      // Check for new achievements
      await this.checkForAchievements(userId, swingAnalysis);

      // Update milestones progress
      await this.updateMilestonesProgress(userId, swingAnalysis);

      // Clean old data
      this.cleanOldData(userId);

      console.log('✅ SwingProgressionTrackingService: Progression tracking updated');

    } catch (error) {
      console.error('❌ SwingProgressionTrackingService: Error tracking progression:', error);
    }
  }

  public async generateProgressionAnalysis(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ProgressionAnalysis> {
    try {
      console.log('📊 SwingProgressionTrackingService: Generating progression analysis:', { userId, timeframe });

      const userSwings = this.getUserSwings(userId);
      const filteredSwings = this.filterSwingsByTimeframe(userSwings, timeframe);

      if (filteredSwings.length === 0) {
        return this.generateEmptyAnalysis(timeframe);
      }

      // Generate metric progression
      const metricProgression = this.analyzeMetricProgression(filteredSwings);

      // Analyze periods (weekly/monthly chunks)
      const periodAnalysis = this.analyzePeriods(filteredSwings, timeframe);

      // Calculate overall progress
      const overallProgress = this.calculateOverallProgress(metricProgression, periodAnalysis);

      // Analyze current streak
      const currentStreak = this.analyzeCurrentStreak(userSwings);

      // Generate goals and milestones
      const nextGoals = this.generateNextGoals(userId, metricProgression);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metricProgression, overallProgress);

      // Generate insights
      const insights = this.generateInsights(metricProgression, periodAnalysis, overallProgress);

      const analysis: ProgressionAnalysis = {
        timeframe,
        overallProgress,
        metricProgression,
        periodAnalysis,
        currentStreak,
        nextGoals,
        recommendations,
        insights,
      };

      console.log('✅ SwingProgressionTrackingService: Analysis generated:', {
        overallScore: overallProgress.overallScore,
        metricsAnalyzed: metricProgression.length,
        periods: periodAnalysis.length
      });

      return analysis;

    } catch (error) {
      console.error('❌ SwingProgressionTrackingService: Error generating analysis:', error);
      return this.generateEmptyAnalysis(timeframe);
    }
  }

  public async getSessionAnalysis(
    userId: string,
    sessionDate: string
  ): Promise<SessionAnalysis | null> {
    try {
      const userSwings = this.getUserSwings(userId);
      const sessionStart = new Date(sessionDate);
      const sessionEnd = new Date(sessionStart.getTime() + 24 * 60 * 60 * 1000); // Next day

      const sessionSwings = userSwings.filter(swing => {
        const swingDate = new Date(swing.timestamp);
        return swingDate >= sessionStart && swingDate < sessionEnd;
      });

      if (sessionSwings.length === 0) {
        return null;
      }

      return this.analyzeSession(sessionSwings, sessionDate);

    } catch (error) {
      console.error('❌ SwingProgressionTrackingService: Error getting session analysis:', error);
      return null;
    }
  }

  public getUserAchievements(userId: string): Achievement[] {
    return this.achievementsData.get(userId) || [];
  }

  public getUserMilestones(userId: string): Milestone[] {
    return this.milestonesData.get(userId) || [];
  }

  public async exportProgressionData(
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const userSwings = this.getUserSwings(userId);
      const achievements = this.getUserAchievements(userId);
      const milestones = this.getUserMilestones(userId);

      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        totalSwings: userSwings.length,
        swingData: userSwings,
        achievements,
        milestones,
        summary: {
          dateRange: {
            start: userSwings[userSwings.length - 1]?.timestamp,
            end: userSwings[0]?.timestamp,
          },
          averageMetrics: this.calculateAverageMetrics(userSwings),
        },
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else {
        return this.convertToCSV(exportData);
      }

    } catch (error) {
      console.error('❌ SwingProgressionTrackingService: Error exporting data:', error);
      throw error;
    }
  }

  private addSwingToHistory(userId: string, swing: SwingAnalysisSummary): void {
    if (!this.progressionData.has(userId)) {
      this.progressionData.set(userId, []);
    }

    const userSwings = this.progressionData.get(userId)!;
    userSwings.unshift(swing); // Add to beginning (most recent first)

    // Keep only data within the max history period
    const cutoffDate = new Date(Date.now() - this.maxHistoryDays * 24 * 60 * 60 * 1000);
    const filteredSwings = userSwings.filter(s => new Date(s.timestamp) > cutoffDate);
    
    this.progressionData.set(userId, filteredSwings);
  }

  private async checkForAchievements(
    userId: string,
    newSwing: SwingAnalysisSummary
  ): Promise<void> {
    const userSwings = this.getUserSwings(userId);
    const achievements = this.getUserAchievements(userId);
    const newAchievements: Achievement[] = [];

    // Check various achievement conditions
    this.checkSpeedAchievements(newSwing, userSwings, achievements, newAchievements);
    this.checkConsistencyAchievements(userSwings, achievements, newAchievements);
    this.checkMilestoneAchievements(newSwing, userSwings, achievements, newAchievements);
    this.checkStreakAchievements(userSwings, achievements, newAchievements);

    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      this.achievementsData.set(userId, updatedAchievements);
    }
  }

  private checkSpeedAchievements(
    newSwing: SwingAnalysisSummary,
    userSwings: SwingAnalysisSummary[],
    achievements: Achievement[],
    newAchievements: Achievement[]
  ): void {
    const speedThresholds = [
      { speed: 80, title: 'Speed Demon', description: 'Achieved 80+ mph clubhead speed' },
      { speed: 90, title: 'Power Player', description: 'Achieved 90+ mph clubhead speed' },
      { speed: 100, title: 'Tour Level Speed', description: 'Achieved 100+ mph clubhead speed' },
    ];

    speedThresholds.forEach(threshold => {
      const achievementId = `speed_${threshold.speed}`;
      const hasAchievement = achievements.some(a => a.id === achievementId);
      
      if (!hasAchievement && newSwing.clubheadSpeed >= threshold.speed) {
        newAchievements.push({
          id: achievementId,
          type: 'milestone',
          title: threshold.title,
          description: threshold.description,
          achievedDate: new Date().toISOString(),
          value: newSwing.clubheadSpeed,
          threshold: threshold.speed,
          icon: '⚡',
        });
      }
    });
  }

  private checkConsistencyAchievements(
    userSwings: SwingAnalysisSummary[],
    achievements: Achievement[],
    newAchievements: Achievement[]
  ): void {
    if (userSwings.length < 10) return;

    const recent10 = userSwings.slice(0, 10);
    const avgConfidence = recent10.reduce((sum, s) => sum + s.confidence, 0) / recent10.length;

    if (avgConfidence >= 85) {
      const achievementId = 'consistency_master';
      const hasAchievement = achievements.some(a => a.id === achievementId);
      
      if (!hasAchievement) {
        newAchievements.push({
          id: achievementId,
          type: 'consistency',
          title: 'Consistency Master',
          description: 'Maintained 85%+ confidence over 10 consecutive swings',
          achievedDate: new Date().toISOString(),
          value: avgConfidence,
          threshold: 85,
          icon: '🎯',
        });
      }
    }
  }

  private checkMilestoneAchievements(
    newSwing: SwingAnalysisSummary,
    userSwings: SwingAnalysisSummary[],
    achievements: Achievement[],
    newAchievements: Achievement[]
  ): void {
    const milestones = [
      { count: 10, title: 'Getting Started', description: 'Completed 10 swing analyses' },
      { count: 50, title: 'Dedicated Golfer', description: 'Completed 50 swing analyses' },
      { count: 100, title: 'Swing Analyst', description: 'Completed 100 swing analyses' },
      { count: 500, title: 'Data Master', description: 'Completed 500 swing analyses' },
    ];

    milestones.forEach(milestone => {
      const achievementId = `swings_${milestone.count}`;
      const hasAchievement = achievements.some(a => a.id === achievementId);
      
      if (!hasAchievement && userSwings.length >= milestone.count) {
        newAchievements.push({
          id: achievementId,
          type: 'milestone',
          title: milestone.title,
          description: milestone.description,
          achievedDate: new Date().toISOString(),
          value: userSwings.length,
          threshold: milestone.count,
          icon: '📊',
        });
      }
    });
  }

  private checkStreakAchievements(
    userSwings: SwingAnalysisSummary[],
    achievements: Achievement[],
    newAchievements: Achievement[]
  ): void {
    const streak = this.calculateCurrentStreak(userSwings);
    
    if (streak.days >= 7) {
      const achievementId = 'week_streak';
      const hasAchievement = achievements.some(a => a.id === achievementId);
      
      if (!hasAchievement) {
        newAchievements.push({
          id: achievementId,
          type: 'consistency',
          title: 'Week Warrior',
          description: 'Practiced for 7 consecutive days',
          achievedDate: new Date().toISOString(),
          value: streak.days,
          threshold: 7,
          icon: '🔥',
        });
      }
    }
  }

  private async updateMilestonesProgress(
    userId: string,
    newSwing: SwingAnalysisSummary
  ): Promise<void> {
    const milestones = this.getUserMilestones(userId);
    const userSwings = this.getUserSwings(userId);
    
    milestones.forEach(milestone => {
      const currentValue = this.calculateMilestoneProgress(milestone, userSwings);
      milestone.currentValue = currentValue;
      milestone.progress = Math.min(100, (currentValue / milestone.targetValue) * 100);
      
      // Update estimated completion
      if (milestone.progress > 0 && milestone.progress < 100) {
        milestone.estimatedCompletion = this.estimateMilestoneCompletion(milestone, userSwings);
      }
    });

    this.milestonesData.set(userId, milestones);
  }

  private calculateMilestoneProgress(milestone: Milestone, userSwings: SwingAnalysisSummary[]): number {
    switch (milestone.category) {
      case 'speed':
        return Math.max(...userSwings.map(s => s.clubheadSpeed));
      case 'accuracy':
        return Math.max(...userSwings.map(s => s.balanceScore));
      case 'consistency':
        if (userSwings.length < 10) return 0;
        const recent10 = userSwings.slice(0, 10);
        return recent10.reduce((sum, s) => sum + s.confidence, 0) / recent10.length;
      case 'technique':
        return Math.max(...userSwings.map(s => s.patternMatch));
      default:
        return 0;
    }
  }

  private estimateMilestoneCompletion(milestone: Milestone, userSwings: SwingAnalysisSummary[]): string {
    if (userSwings.length < 5) return 'Insufficient data';

    const recent5 = userSwings.slice(0, 5);
    const older5 = userSwings.slice(5, 10);
    
    if (older5.length === 0) return '2-4 weeks';

    const recentAvg = this.calculateMilestoneProgress(milestone, recent5);
    const olderAvg = this.calculateMilestoneProgress(milestone, older5);
    
    const improvement = recentAvg - olderAvg;
    const remaining = milestone.targetValue - milestone.currentValue;
    
    if (improvement <= 0) return '6+ months';
    
    const weeksNeeded = Math.ceil((remaining / improvement) * 5); // 5 swings = ~1 week
    
    if (weeksNeeded <= 2) return '1-2 weeks';
    if (weeksNeeded <= 4) return '2-4 weeks';
    if (weeksNeeded <= 12) return '1-3 months';
    return '3-6 months';
  }

  private initializeDefaultMilestones(): void {
    // Default milestones will be created when a user first tracks swings
  }

  private createDefaultMilestones(userId: string): Milestone[] {
    return [
      {
        id: 'speed_85',
        title: 'Power Boost',
        description: 'Achieve 85 mph clubhead speed',
        targetValue: 85,
        currentValue: 0,
        progress: 0,
        estimatedCompletion: '4-8 weeks',
        category: 'speed',
      },
      {
        id: 'consistency_80',
        title: 'Reliable Swing',
        description: 'Maintain 80% consistency score',
        targetValue: 80,
        currentValue: 0,
        progress: 0,
        estimatedCompletion: '6-12 weeks',
        category: 'consistency',
      },
      {
        id: 'balance_85',
        title: 'Balance Master',
        description: 'Achieve 85 balance score',
        targetValue: 85,
        currentValue: 0,
        progress: 0,
        estimatedCompletion: '4-8 weeks',
        category: 'accuracy',
      },
      {
        id: 'technique_75',
        title: 'Technical Progress',
        description: 'Achieve 75% pattern match',
        targetValue: 75,
        currentValue: 0,
        progress: 0,
        estimatedCompletion: '8-16 weeks',
        category: 'technique',
      },
    ];
  }

  private getUserSwings(userId: string): SwingAnalysisSummary[] {
    return this.progressionData.get(userId) || [];
  }

  private filterSwingsByTimeframe(
    swings: SwingAnalysisSummary[], 
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ): SwingAnalysisSummary[] {
    const now = new Date();
    let cutoffDate: Date;

    switch (timeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return swings.filter(swing => new Date(swing.timestamp) > cutoffDate);
  }

  private analyzeMetricProgression(swings: SwingAnalysisSummary[]): ProgressionMetric[] {
    const metrics = ['clubheadSpeed', 'swingTempo', 'balanceScore', 'confidence', 'patternMatch'];
    const progressionMetrics: ProgressionMetric[] = [];

    metrics.forEach(metricName => {
      const values = swings.map(swing => ({
        timestamp: swing.timestamp,
        value: this.getMetricValue(swing, metricName),
        confidence: swing.confidence,
      })).reverse(); // Chronological order

      if (values.length === 0) return;

      const trend = this.calculateTrend(values.map(v => v.value));
      const currentValue = values[values.length - 1].value;
      const bestValue = Math.max(...values.map(v => v.value));
      const averageValue = values.reduce((sum, v) => sum + v.value, 0) / values.length;
      const improvement = values.length > 1 ? 
        ((currentValue - values[0].value) / values[0].value) * 100 : 0;
      const consistencyScore = this.calculateConsistencyScore(values.map(v => v.value));

      progressionMetrics.push({
        metric: metricName,
        values,
        trend,
        trendConfidence: this.calculateTrendConfidence(values.map(v => v.value)),
        currentValue,
        bestValue,
        averageValue,
        improvement,
        consistencyScore,
      });
    });

    return progressionMetrics;
  }

  private getMetricValue(swing: SwingAnalysisSummary, metricName: string): number {
    switch (metricName) {
      case 'clubheadSpeed': return swing.clubheadSpeed;
      case 'swingTempo': return swing.swingTempo;
      case 'balanceScore': return swing.balanceScore;
      case 'confidence': return swing.confidence;
      case 'patternMatch': return swing.patternMatch;
      default: return 0;
    }
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (values.length < 5) return 'insufficient_data';

    // Simple linear regression slope
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  private calculateTrendConfidence(values: number[]): number {
    if (values.length < 5) return 0;

    // Calculate R² for trend confidence
    const n = values.length;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;
    
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = values.reduce((sum, val, idx) => {
      const predicted = meanY; // Simplified
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    return Math.max(0, Math.min(100, rSquared * 100));
  }

  private calculateConsistencyScore(values: number[]): number {
    if (values.length < 3) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100; // Coefficient of variation

    // Convert to 0-100 score (lower CV = higher consistency)
    return Math.max(0, 100 - cv);
  }

  private analyzePeriods(
    swings: SwingAnalysisSummary[], 
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ): ProgressionPeriod[] {
    const periods: ProgressionPeriod[] = [];
    const periodDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 
                     timeframe === 'quarter' ? 90 : 365;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    // For simplicity, create one period for the entire timeframe
    const periodSwings = swings.filter(swing => {
      const swingDate = new Date(swing.timestamp);
      return swingDate >= startDate && swingDate <= now;
    });

    if (periodSwings.length > 0) {
      periods.push({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalSwings: periodSwings.length,
        averageMetrics: this.calculateAverageMetrics(periodSwings),
        skillLevelProgression: this.calculateSkillLevelProgression(periodSwings),
        achievements: [], // Would be populated with period-specific achievements
        milestones: [], // Would be populated with period-specific milestones
      });
    }

    return periods;
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

    return {
      avgClubheadSpeed: swings.reduce((sum, s) => sum + s.clubheadSpeed, 0) / swings.length,
      avgSwingTempo: swings.reduce((sum, s) => sum + s.swingTempo, 0) / swings.length,
      avgBalanceScore: swings.reduce((sum, s) => sum + s.balanceScore, 0) / swings.length,
      avgPatternMatch: swings.reduce((sum, s) => sum + s.patternMatch, 0) / swings.length,
      swingCount: swings.length,
      consistency: swings.reduce((sum, s) => sum + s.confidence, 0) / swings.length,
    };
  }

  private calculateSkillLevelProgression(swings: SwingAnalysisSummary[]): {
    startLevel: number;
    endLevel: number;
    confidence: number;
  } {
    if (swings.length < 5) {
      return { startLevel: 2, endLevel: 2, confidence: 50 };
    }

    const chronological = [...swings].reverse();
    const early = chronological.slice(0, Math.ceil(chronological.length / 3));
    const recent = chronological.slice(-Math.ceil(chronological.length / 3));

    const earlyLevel = this.estimateSkillLevel(early);
    const recentLevel = this.estimateSkillLevel(recent);

    return {
      startLevel: earlyLevel,
      endLevel: recentLevel,
      confidence: Math.min(95, swings.length * 2), // More swings = higher confidence
    };
  }

  private estimateSkillLevel(swings: SwingAnalysisSummary[]): number {
    const avgMetrics = this.calculateAverageMetrics(swings);
    
    // Simple heuristic based on metrics
    let level = 1; // Beginner
    
    if (avgMetrics.avgClubheadSpeed > 85 && avgMetrics.consistency > 70) level = 2; // Intermediate
    if (avgMetrics.avgClubheadSpeed > 95 && avgMetrics.consistency > 80) level = 3; // Advanced
    if (avgMetrics.avgClubheadSpeed > 105 && avgMetrics.consistency > 90) level = 4; // Professional
    
    return level;
  }

  private calculateOverallProgress(
    metricProgression: ProgressionMetric[],
    periodAnalysis: ProgressionPeriod[]
  ): ProgressionAnalysis['overallProgress'] {
    if (metricProgression.length === 0) {
      return {
        skillLevelImprovement: 0,
        consistencyImprovement: 0,
        technicalImprovement: 0,
        overallScore: 0,
      };
    }

    // Calculate improvements
    const skillLevelImprovement = periodAnalysis[0]?.skillLevelProgression ? 
      (periodAnalysis[0].skillLevelProgression.endLevel - periodAnalysis[0].skillLevelProgression.startLevel) * 25 : 0;

    const consistencyMetric = metricProgression.find(m => m.metric === 'confidence');
    const consistencyImprovement = consistencyMetric ? consistencyMetric.improvement : 0;

    const technicalMetrics = metricProgression.filter(m => 
      ['clubheadSpeed', 'balanceScore', 'patternMatch'].includes(m.metric)
    );
    const technicalImprovement = technicalMetrics.length > 0 ? 
      technicalMetrics.reduce((sum, m) => sum + m.improvement, 0) / technicalMetrics.length : 0;

    const overallScore = Math.max(0, Math.min(100, 
      (skillLevelImprovement + consistencyImprovement + technicalImprovement) / 3 + 50
    ));

    return {
      skillLevelImprovement,
      consistencyImprovement,
      technicalImprovement,
      overallScore,
    };
  }

  private analyzeCurrentStreak(swings: SwingAnalysisSummary[]): ProgressionAnalysis['currentStreak'] {
    return this.calculateCurrentStreak(swings);
  }

  private calculateCurrentStreak(swings: SwingAnalysisSummary[]): ProgressionAnalysis['currentStreak'] {
    if (swings.length === 0) {
      return { type: 'practice', days: 0, description: 'No recent activity' };
    }

    // Calculate consecutive days with practice
    const swingDates = swings.map(s => new Date(s.timestamp).toDateString());
    const uniqueDates = [...new Set(swingDates)].sort().reverse();
    
    let streakDays = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      
      if (uniqueDates.includes(checkDate.toDateString())) {
        streakDays++;
      } else {
        break;
      }
    }

    let type: 'improvement' | 'consistency' | 'practice' = 'practice';
    let description = `${streakDays} days of practice`;

    // Check if it's an improvement or consistency streak
    if (streakDays >= 3) {
      const recentSwings = swings.slice(0, streakDays * 2); // Approximate swings in streak
      const improvements = this.analyzeMetricProgression(recentSwings)
        .filter(m => m.trend === 'improving').length;
      
      if (improvements > 2) {
        type = 'improvement';
        description = `${streakDays} days of improving performance`;
      } else {
        type = 'consistency';
        description = `${streakDays} days of consistent practice`;
      }
    }

    return { type, days: streakDays, description };
  }

  private generateNextGoals(
    userId: string, 
    metricProgression: ProgressionMetric[]
  ): ProgressionAnalysis['nextGoals'] {
    const shortTerm: Milestone[] = [];
    const mediumTerm: Milestone[] = [];
    const longTerm: Milestone[] = [];

    // Generate goals based on current metrics and progression
    metricProgression.forEach(metric => {
      if (metric.trend === 'improving' || metric.trend === 'stable') {
        const currentValue = metric.currentValue;
        
        // Short term: 5-10% improvement
        shortTerm.push({
          id: `${metric.metric}_short`,
          title: `Improve ${metric.metric}`,
          description: `Reach ${Math.round(currentValue * 1.05)} from ${Math.round(currentValue)}`,
          targetValue: currentValue * 1.05,
          currentValue,
          progress: 0,
          estimatedCompletion: '2-4 weeks',
          category: this.getMetricCategory(metric.metric),
        });

        // Medium term: 15-25% improvement
        mediumTerm.push({
          id: `${metric.metric}_medium`,
          title: `Advance ${metric.metric}`,
          description: `Reach ${Math.round(currentValue * 1.2)} from ${Math.round(currentValue)}`,
          targetValue: currentValue * 1.2,
          currentValue,
          progress: 0,
          estimatedCompletion: '6-12 weeks',
          category: this.getMetricCategory(metric.metric),
        });

        // Long term: 30-50% improvement
        longTerm.push({
          id: `${metric.metric}_long`,
          title: `Master ${metric.metric}`,
          description: `Reach ${Math.round(currentValue * 1.4)} from ${Math.round(currentValue)}`,
          targetValue: currentValue * 1.4,
          currentValue,
          progress: 0,
          estimatedCompletion: '3-6 months',
          category: this.getMetricCategory(metric.metric),
        });
      }
    });

    return {
      shortTerm: shortTerm.slice(0, 3),
      mediumTerm: mediumTerm.slice(0, 3),
      longTerm: longTerm.slice(0, 3),
    };
  }

  private getMetricCategory(metricName: string): 'speed' | 'accuracy' | 'consistency' | 'technique' {
    switch (metricName) {
      case 'clubheadSpeed': return 'speed';
      case 'balanceScore': return 'accuracy';
      case 'confidence': return 'consistency';
      case 'patternMatch': return 'technique';
      default: return 'technique';
    }
  }

  private generateRecommendations(
    metricProgression: ProgressionMetric[],
    overallProgress: ProgressionAnalysis['overallProgress']
  ): ProgressionAnalysis['recommendations'] {
    const recommendations: ProgressionAnalysis['recommendations'] = [];

    // High priority recommendations
    const decliningMetrics = metricProgression.filter(m => m.trend === 'declining');
    decliningMetrics.forEach(metric => {
      recommendations.push({
        priority: 'high',
        category: 'Performance Issue',
        action: `Focus on improving ${metric.metric}`,
        reasoning: `${metric.metric} has been declining recently`,
        timeframe: '1-2 weeks',
      });
    });

    // Medium priority recommendations
    const lowConsistencyMetrics = metricProgression.filter(m => m.consistencyScore < 60);
    lowConsistencyMetrics.forEach(metric => {
      recommendations.push({
        priority: 'medium',
        category: 'Consistency',
        action: `Work on ${metric.metric} consistency`,
        reasoning: `${metric.metric} shows high variability`,
        timeframe: '3-4 weeks',
      });
    });

    // Low priority recommendations
    if (overallProgress.overallScore > 75) {
      recommendations.push({
        priority: 'low',
        category: 'Advanced Training',
        action: 'Consider advanced technique refinement',
        reasoning: 'Strong overall progress suggests readiness for advanced training',
        timeframe: '1-3 months',
      });
    }

    return recommendations.slice(0, 5);
  }

  private generateInsights(
    metricProgression: ProgressionMetric[],
    periodAnalysis: ProgressionPeriod[],
    overallProgress: ProgressionAnalysis['overallProgress']
  ): string[] {
    const insights: string[] = [];

    // Progress insights
    if (overallProgress.overallScore > 80) {
      insights.push('Excellent overall progress! You\'re showing consistent improvement across multiple areas.');
    } else if (overallProgress.overallScore > 60) {
      insights.push('Good progress overall with room for focused improvement in specific areas.');
    } else {
      insights.push('Building foundation skills. Consistency in practice will accelerate your progress.');
    }

    // Metric-specific insights
    const improvingMetrics = metricProgression.filter(m => m.trend === 'improving');
    if (improvingMetrics.length > 2) {
      insights.push(`Strong improvement trends in ${improvingMetrics.map(m => m.metric).join(', ')}.`);
    }

    const consistentMetrics = metricProgression.filter(m => m.consistencyScore > 80);
    if (consistentMetrics.length > 1) {
      insights.push(`Excellent consistency in ${consistentMetrics.map(m => m.metric).join(' and ')}.`);
    }

    // Practice frequency insights
    if (periodAnalysis.length > 0 && periodAnalysis[0].totalSwings > 20) {
      insights.push('High practice frequency is contributing to your improvement rate.');
    }

    return insights.slice(0, 4);
  }

  private analyzeSession(swings: SwingAnalysisSummary[], sessionDate: string): SessionAnalysis {
    const sessionMetrics = this.calculateAverageMetrics(swings);
    const bestSwing = swings.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Analyze improvements and concerns
    const improvements: string[] = [];
    const concerns: string[] = [];

    if (sessionMetrics.consistency > 80) {
      improvements.push('Excellent consistency throughout session');
    }
    if (sessionMetrics.avgClubheadSpeed > 85) {
      improvements.push('Strong clubhead speed generation');
    }
    if (sessionMetrics.avgBalanceScore > 80) {
      improvements.push('Good balance and control');
    }

    if (sessionMetrics.consistency < 60) {
      concerns.push('Inconsistent swing quality');
    }
    if (sessionMetrics.avgClubheadSpeed < 70) {
      concerns.push('Low clubhead speed');
    }

    return {
      sessionDate,
      swingCount: swings.length,
      sessionDuration: this.estimateSessionDuration(swings),
      averageQuality: sessionMetrics.consistency,
      bestSwing,
      improvements,
      concerns,
      sessionType: this.classifySessionType(swings),
      fatigue: this.analyzeFatigue(swings),
    };
  }

  private estimateSessionDuration(swings: SwingAnalysisSummary[]): number {
    if (swings.length < 2) return 15; // Minimum session time

    const timestamps = swings.map(s => new Date(s.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    return Math.max(15, Math.round((maxTime - minTime) / (1000 * 60))); // Convert to minutes
  }

  private classifySessionType(swings: SwingAnalysisSummary[]): 'practice' | 'round' | 'lesson' | 'warmup' {
    if (swings.length < 5) return 'warmup';
    if (swings.length > 30) return 'practice';
    if (swings.length > 15) return 'round';
    return 'practice';
  }

  private analyzeFatigue(swings: SwingAnalysisSummary[]): 'low' | 'medium' | 'high' {
    if (swings.length < 5) return 'low';

    const chronological = [...swings].reverse();
    const firstHalf = chronological.slice(0, Math.ceil(chronological.length / 2));
    const secondHalf = chronological.slice(Math.ceil(chronological.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.confidence, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.confidence, 0) / secondHalf.length;

    const decline = firstHalfAvg - secondHalfAvg;

    if (decline > 15) return 'high';
    if (decline > 5) return 'medium';
    return 'low';
  }

  private convertToCSV(data: any): string {
    const swingData = data.swingData;
    const headers = ['timestamp', 'clubType', 'confidence', 'clubheadSpeed', 'swingTempo', 'balanceScore', 'patternMatch', 'source'];
    
    let csv = headers.join(',') + '\n';
    
    swingData.forEach((swing: SwingAnalysisSummary) => {
      const row = [
        swing.timestamp,
        swing.clubType,
        swing.confidence,
        swing.clubheadSpeed,
        swing.swingTempo,
        swing.balanceScore,
        swing.patternMatch,
        swing.source
      ].join(',');
      csv += row + '\n';
    });

    return csv;
  }

  private cleanOldData(userId: string): void {
    const cutoffDate = new Date(Date.now() - this.maxHistoryDays * 24 * 60 * 60 * 1000);
    
    // Clean swing data
    const userSwings = this.getUserSwings(userId);
    const filteredSwings = userSwings.filter(s => new Date(s.timestamp) > cutoffDate);
    this.progressionData.set(userId, filteredSwings);

    // Note: Achievements and milestones are kept permanently
  }

  private generateEmptyAnalysis(timeframe: 'week' | 'month' | 'quarter' | 'year'): ProgressionAnalysis {
    return {
      timeframe,
      overallProgress: {
        skillLevelImprovement: 0,
        consistencyImprovement: 0,
        technicalImprovement: 0,
        overallScore: 0,
      },
      metricProgression: [],
      periodAnalysis: [],
      currentStreak: { type: 'practice', days: 0, description: 'No recent activity' },
      nextGoals: { shortTerm: [], mediumTerm: [], longTerm: [] },
      recommendations: [{
        priority: 'high',
        category: 'Getting Started',
        action: 'Complete your first swing analysis',
        reasoning: 'Need data to provide personalized recommendations',
        timeframe: 'This week',
      }],
      insights: ['Start tracking your swings to receive personalized insights and recommendations'],
    };
  }
}