import { SwingAnalysisSummary, SwingMetricsSummary } from '../store/slices/aiCaddieSlice';
import { ProgressionAnalysis, Achievement, Milestone } from './SwingProgressionTrackingService';
import { SwingFeedbackResponse } from './SwingFeedbackService';
import { ComparisonAnalysis } from './SwingTemplateComparisonService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeSwingData: boolean;
  includeProgressionAnalysis: boolean;
  includeFeedbackHistory: boolean;
  includeAchievements: boolean;
  includeMilestones: boolean;
  includeTemplateComparisons: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  clubTypes?: ('driver' | 'iron' | 'wedge' | 'putter')[];
}

export interface ExportData {
  exportInfo: {
    userId: string;
    exportDate: string;
    exportVersion: string;
    dataRange: {
      startDate: string;
      endDate: string;
      totalSwings: number;
    };
    exportOptions: ExportOptions;
  };
  swingData?: {
    swings: SwingAnalysisSummary[];
    summary: {
      totalSwings: number;
      averageMetrics: SwingMetricsSummary;
      clubTypeBreakdown: Record<string, number>;
      sourceBreakdown: Record<string, number>;
    };
  };
  progressionAnalysis?: ProgressionAnalysis;
  feedbackHistory?: SwingFeedbackResponse[];
  achievements?: Achievement[];
  milestones?: Milestone[];
  templateComparisons?: {
    comparisons: ComparisonAnalysis[];
    summary: {
      bestTemplateMatch: string;
      averageMatchScore: number;
      commonRecommendations: string[];
    };
  };
  analytics?: {
    practiceFrequency: {
      dailyAverage: number;
      weeklyAverage: number;
      monthlyAverage: number;
    };
    improvementMetrics: {
      skillLevelGrowth: number;
      consistencyGrowth: number;
      speedGrowth: number;
      accuracyGrowth: number;
    };
    trends: {
      mostImprovedMetric: string;
      mostConsistentMetric: string;
      areasNeedingFocus: string[];
    };
  };
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  shareUrl?: string;
  error?: string;
}

export class SwingDataExportService {
  private readonly exportVersion = '1.0.0';
  private readonly maxExportSize = 50 * 1024 * 1024; // 50MB limit

  public async exportSwingData(
    userId: string,
    swingData: SwingAnalysisSummary[],
    progressionAnalysis?: ProgressionAnalysis,
    feedbackHistory?: SwingFeedbackResponse[],
    achievements?: Achievement[],
    milestones?: Milestone[],
    templateComparisons?: ComparisonAnalysis[],
    options: ExportOptions = this.getDefaultExportOptions()
  ): Promise<ExportResult> {
    try {
      console.log('📤 SwingDataExportService: Starting export for user:', userId, {
        format: options.format,
        swingCount: swingData.length,
        includeAnalysis: options.includeProgressionAnalysis
      });

      // Filter data based on options
      const filteredData = this.filterDataByOptions(
        swingData,
        progressionAnalysis,
        feedbackHistory,
        achievements,
        milestones,
        templateComparisons,
        options
      );

      // Build export data structure
      const exportData = this.buildExportData(userId, filteredData, options);

      // Validate export size
      const estimatedSize = this.estimateExportSize(exportData);
      if (estimatedSize > this.maxExportSize) {
        throw new Error(`Export size (${Math.round(estimatedSize / 1024 / 1024)}MB) exceeds limit (50MB)`);
      }

      // Generate export file
      let result: ExportResult;
      switch (options.format) {
        case 'json':
          result = await this.exportToJSON(exportData, userId);
          break;
        case 'csv':
          result = await this.exportToCSV(exportData, userId);
          break;
        case 'pdf':
          result = await this.exportToPDF(exportData, userId);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      console.log('✅ SwingDataExportService: Export completed:', {
        success: result.success,
        fileName: result.fileName,
        fileSize: result.fileSize
      });

      return result;

    } catch (error) {
      console.error('❌ SwingDataExportService: Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  public async shareExportData(
    exportResult: ExportResult,
    title: string = 'CaddieAI Swing Analysis Export'
  ): Promise<boolean> {
    try {
      if (!exportResult.success || !exportResult.filePath) {
        throw new Error('Invalid export result for sharing');
      }

      const shareOptions = {
        title,
        message: 'Here is my CaddieAI swing analysis data export',
        url: `file://${exportResult.filePath}`,
        type: this.getShareMimeType(exportResult.fileName || ''),
      };

      await Share.open(shareOptions);
      console.log('✅ SwingDataExportService: Data shared successfully');
      return true;

    } catch (error) {
      console.error('❌ SwingDataExportService: Share failed:', error);
      return false;
    }
  }

  public async getExportPreview(
    swingData: SwingAnalysisSummary[],
    options: ExportOptions
  ): Promise<{
    estimatedFileSize: string;
    dataPoints: number;
    exportSections: string[];
    estimatedExportTime: string;
  }> {
    const filteredSwings = this.filterSwingsByDateRange(swingData, options.dateRange);
    const estimatedSize = this.estimateExportSizeFromSwings(filteredSwings, options);
    
    const sections: string[] = [];
    if (options.includeSwingData) sections.push('Swing Data');
    if (options.includeProgressionAnalysis) sections.push('Progression Analysis');
    if (options.includeFeedbackHistory) sections.push('AI Feedback History');
    if (options.includeAchievements) sections.push('Achievements');
    if (options.includeMilestones) sections.push('Milestones');
    if (options.includeTemplateComparisons) sections.push('Template Comparisons');

    return {
      estimatedFileSize: this.formatFileSize(estimatedSize),
      dataPoints: filteredSwings.length,
      exportSections: sections,
      estimatedExportTime: this.estimateExportTime(estimatedSize),
    };
  }

  public getDefaultExportOptions(): ExportOptions {
    return {
      format: 'json',
      includeSwingData: true,
      includeProgressionAnalysis: true,
      includeFeedbackHistory: true,
      includeAchievements: true,
      includeMilestones: true,
      includeTemplateComparisons: true,
    };
  }

  public getSupportedFormats(): { format: string; description: string; extension: string }[] {
    return [
      {
        format: 'json',
        description: 'Complete structured data with all details',
        extension: '.json'
      },
      {
        format: 'csv',
        description: 'Spreadsheet-compatible swing data',
        extension: '.csv'
      },
      {
        format: 'pdf',
        description: 'Professional report with charts and analysis',
        extension: '.pdf'
      }
    ];
  }

  private filterDataByOptions(
    swingData: SwingAnalysisSummary[],
    progressionAnalysis?: ProgressionAnalysis,
    feedbackHistory?: SwingFeedbackResponse[],
    achievements?: Achievement[],
    milestones?: Milestone[],
    templateComparisons?: ComparisonAnalysis[],
    options: ExportOptions
  ): {
    swings: SwingAnalysisSummary[];
    progressionAnalysis?: ProgressionAnalysis;
    feedbackHistory?: SwingFeedbackResponse[];
    achievements?: Achievement[];
    milestones?: Milestone[];
    templateComparisons?: ComparisonAnalysis[];
  } {
    // Filter swings by date range and club types
    let filteredSwings = this.filterSwingsByDateRange(swingData, options.dateRange);
    
    if (options.clubTypes && options.clubTypes.length > 0) {
      filteredSwings = filteredSwings.filter(swing => 
        options.clubTypes!.includes(swing.clubType)
      );
    }

    // Filter feedback history by date range
    let filteredFeedback = feedbackHistory;
    if (options.dateRange && feedbackHistory) {
      const startDate = new Date(options.dateRange.startDate);
      const endDate = new Date(options.dateRange.endDate);
      filteredFeedback = feedbackHistory.filter(feedback => {
        const feedbackDate = new Date(feedback.timestamp);
        return feedbackDate >= startDate && feedbackDate <= endDate;
      });
    }

    return {
      swings: filteredSwings,
      progressionAnalysis: options.includeProgressionAnalysis ? progressionAnalysis : undefined,
      feedbackHistory: options.includeFeedbackHistory ? filteredFeedback : undefined,
      achievements: options.includeAchievements ? achievements : undefined,
      milestones: options.includeMilestones ? milestones : undefined,
      templateComparisons: options.includeTemplateComparisons ? templateComparisons : undefined,
    };
  }

  private filterSwingsByDateRange(
    swings: SwingAnalysisSummary[],
    dateRange?: { startDate: string; endDate: string }
  ): SwingAnalysisSummary[] {
    if (!dateRange) return swings;

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return swings.filter(swing => {
      const swingDate = new Date(swing.timestamp);
      return swingDate >= startDate && swingDate <= endDate;
    });
  }

  private buildExportData(
    userId: string,
    filteredData: {
      swings: SwingAnalysisSummary[];
      progressionAnalysis?: ProgressionAnalysis;
      feedbackHistory?: SwingFeedbackResponse[];
      achievements?: Achievement[];
      milestones?: Milestone[];
      templateComparisons?: ComparisonAnalysis[];
    },
    options: ExportOptions
  ): ExportData {
    const swings = filteredData.swings;
    const exportData: ExportData = {
      exportInfo: {
        userId,
        exportDate: new Date().toISOString(),
        exportVersion: this.exportVersion,
        dataRange: {
          startDate: swings[swings.length - 1]?.timestamp || new Date().toISOString(),
          endDate: swings[0]?.timestamp || new Date().toISOString(),
          totalSwings: swings.length,
        },
        exportOptions: options,
      },
    };

    // Add swing data if requested
    if (options.includeSwingData && swings.length > 0) {
      exportData.swingData = {
        swings,
        summary: this.buildSwingDataSummary(swings),
      };
    }

    // Add other data sections
    if (options.includeProgressionAnalysis) {
      exportData.progressionAnalysis = filteredData.progressionAnalysis;
    }

    if (options.includeFeedbackHistory) {
      exportData.feedbackHistory = filteredData.feedbackHistory;
    }

    if (options.includeAchievements) {
      exportData.achievements = filteredData.achievements;
    }

    if (options.includeMilestones) {
      exportData.milestones = filteredData.milestones;
    }

    if (options.includeTemplateComparisons && filteredData.templateComparisons) {
      exportData.templateComparisons = this.buildTemplateComparisonSummary(filteredData.templateComparisons);
    }

    // Add analytics
    exportData.analytics = this.buildAnalytics(swings, filteredData.progressionAnalysis);

    return exportData;
  }

  private buildSwingDataSummary(swings: SwingAnalysisSummary[]): ExportData['swingData']['summary'] {
    if (swings.length === 0) {
      return {
        totalSwings: 0,
        averageMetrics: {
          avgClubheadSpeed: 0,
          avgSwingTempo: 0,
          avgBalanceScore: 0,
          avgPatternMatch: 0,
          swingCount: 0,
          consistency: 0,
        },
        clubTypeBreakdown: {},
        sourceBreakdown: {},
      };
    }

    // Calculate average metrics
    const averageMetrics: SwingMetricsSummary = {
      avgClubheadSpeed: swings.reduce((sum, s) => sum + s.clubheadSpeed, 0) / swings.length,
      avgSwingTempo: swings.reduce((sum, s) => sum + s.swingTempo, 0) / swings.length,
      avgBalanceScore: swings.reduce((sum, s) => sum + s.balanceScore, 0) / swings.length,
      avgPatternMatch: swings.reduce((sum, s) => sum + s.patternMatch, 0) / swings.length,
      swingCount: swings.length,
      consistency: swings.reduce((sum, s) => sum + s.confidence, 0) / swings.length,
    };

    // Build breakdowns
    const clubTypeBreakdown: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};

    swings.forEach(swing => {
      clubTypeBreakdown[swing.clubType] = (clubTypeBreakdown[swing.clubType] || 0) + 1;
      sourceBreakdown[swing.source] = (sourceBreakdown[swing.source] || 0) + 1;
    });

    return {
      totalSwings: swings.length,
      averageMetrics,
      clubTypeBreakdown,
      sourceBreakdown,
    };
  }

  private buildTemplateComparisonSummary(comparisons: ComparisonAnalysis[]): ExportData['templateComparisons'] {
    if (comparisons.length === 0) {
      return {
        comparisons,
        summary: {
          bestTemplateMatch: 'None',
          averageMatchScore: 0,
          commonRecommendations: [],
        },
      };
    }

    const bestMatches = comparisons.map(c => c.bestMatches[0]).filter(Boolean);
    const averageMatchScore = bestMatches.reduce((sum, match) => sum + match.overallMatch, 0) / bestMatches.length;
    const bestTemplateMatch = bestMatches.reduce((best, current) => 
      current.overallMatch > best.overallMatch ? current : best
    ).templateName;

    // Extract common recommendations
    const allRecommendations = bestMatches.flatMap(match => match.specificRecommendations);
    const recommendationCounts = allRecommendations.reduce((counts, rec) => {
      counts[rec] = (counts[rec] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const commonRecommendations = Object.entries(recommendationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([rec]) => rec);

    return {
      comparisons,
      summary: {
        bestTemplateMatch,
        averageMatchScore,
        commonRecommendations,
      },
    };
  }

  private buildAnalytics(
    swings: SwingAnalysisSummary[],
    progressionAnalysis?: ProgressionAnalysis
  ): ExportData['analytics'] {
    if (swings.length === 0) {
      return {
        practiceFrequency: { dailyAverage: 0, weeklyAverage: 0, monthlyAverage: 0 },
        improvementMetrics: { skillLevelGrowth: 0, consistencyGrowth: 0, speedGrowth: 0, accuracyGrowth: 0 },
        trends: { mostImprovedMetric: 'None', mostConsistentMetric: 'None', areasNeedingFocus: [] },
      };
    }

    // Calculate practice frequency
    const swingDates = [...new Set(swings.map(s => new Date(s.timestamp).toDateString()))];
    const totalDays = swingDates.length;
    const totalWeeks = Math.ceil(totalDays / 7);
    const totalMonths = Math.ceil(totalDays / 30);

    const practiceFrequency = {
      dailyAverage: swings.length / Math.max(1, totalDays),
      weeklyAverage: swings.length / Math.max(1, totalWeeks),
      monthlyAverage: swings.length / Math.max(1, totalMonths),
    };

    // Calculate improvement metrics
    const improvementMetrics = this.calculateImprovementMetrics(swings, progressionAnalysis);

    // Analyze trends
    const trends = this.analyzeTrends(swings, progressionAnalysis);

    return {
      practiceFrequency,
      improvementMetrics,
      trends,
    };
  }

  private calculateImprovementMetrics(
    swings: SwingAnalysisSummary[],
    progressionAnalysis?: ProgressionAnalysis
  ): ExportData['analytics']['improvementMetrics'] {
    if (swings.length < 5) {
      return { skillLevelGrowth: 0, consistencyGrowth: 0, speedGrowth: 0, accuracyGrowth: 0 };
    }

    const chronological = [...swings].reverse();
    const early = chronological.slice(0, Math.ceil(chronological.length / 3));
    const recent = chronological.slice(-Math.ceil(chronological.length / 3));

    const calculateGrowth = (metric: keyof SwingAnalysisSummary) => {
      const earlyAvg = early.reduce((sum, s) => sum + (s[metric] as number), 0) / early.length;
      const recentAvg = recent.reduce((sum, s) => sum + (s[metric] as number), 0) / recent.length;
      return ((recentAvg - earlyAvg) / earlyAvg) * 100;
    };

    return {
      skillLevelGrowth: progressionAnalysis?.overallProgress.skillLevelImprovement || 0,
      consistencyGrowth: calculateGrowth('confidence'),
      speedGrowth: calculateGrowth('clubheadSpeed'),
      accuracyGrowth: calculateGrowth('balanceScore'),
    };
  }

  private analyzeTrends(
    swings: SwingAnalysisSummary[],
    progressionAnalysis?: ProgressionAnalysis
  ): ExportData['analytics']['trends'] {
    const metrics = ['clubheadSpeed', 'swingTempo', 'balanceScore', 'confidence', 'patternMatch'];
    let mostImprovedMetric = 'None';
    let mostConsistentMetric = 'None';
    let maxImprovement = -Infinity;
    let minVariation = Infinity;

    if (progressionAnalysis?.metricProgression) {
      progressionAnalysis.metricProgression.forEach(metric => {
        if (metric.improvement > maxImprovement) {
          maxImprovement = metric.improvement;
          mostImprovedMetric = metric.metric;
        }
        if (metric.consistencyScore < minVariation) {
          minVariation = metric.consistencyScore;
          mostConsistentMetric = metric.metric;
        }
      });
    }

    const areasNeedingFocus = progressionAnalysis?.overallAssessment.primaryWeaknesses || [];

    return {
      mostImprovedMetric,
      mostConsistentMetric,
      areasNeedingFocus,
    };
  }

  private async exportToJSON(exportData: ExportData, userId: string): Promise<ExportResult> {
    try {
      const fileName = `caddieai-swing-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      await RNFS.writeFile(filePath, jsonContent, 'utf8');

      const fileStats = await RNFS.stat(filePath);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: fileStats.size,
      };

    } catch (error) {
      console.error('❌ SwingDataExportService: JSON export failed:', error);
      return {
        success: false,
        error: `JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async exportToCSV(exportData: ExportData, userId: string): Promise<ExportResult> {
    try {
      const fileName = `caddieai-swing-data-${userId}-${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      let csvContent = '';

      // Export swing data as CSV
      if (exportData.swingData?.swings) {
        csvContent += 'Swing Data\n';
        csvContent += 'timestamp,clubType,confidence,clubheadSpeed,swingTempo,balanceScore,patternMatch,source\n';
        
        exportData.swingData.swings.forEach(swing => {
          csvContent += `${swing.timestamp},${swing.clubType},${swing.confidence},${swing.clubheadSpeed},${swing.swingTempo},${swing.balanceScore},${swing.patternMatch},${swing.source}\n`;
        });

        csvContent += '\n';
      }

      // Add summary statistics
      if (exportData.swingData?.summary) {
        csvContent += 'Summary Statistics\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Swings,${exportData.swingData.summary.totalSwings}\n`;
        csvContent += `Average Clubhead Speed,${exportData.swingData.summary.averageMetrics.avgClubheadSpeed.toFixed(1)}\n`;
        csvContent += `Average Swing Tempo,${exportData.swingData.summary.averageMetrics.avgSwingTempo.toFixed(1)}\n`;
        csvContent += `Average Balance Score,${exportData.swingData.summary.averageMetrics.avgBalanceScore.toFixed(1)}\n`;
        csvContent += `Average Pattern Match,${exportData.swingData.summary.averageMetrics.avgPatternMatch.toFixed(1)}\n`;
        csvContent += `Consistency,${exportData.swingData.summary.averageMetrics.consistency.toFixed(1)}\n`;
      }

      await RNFS.writeFile(filePath, csvContent, 'utf8');

      const fileStats = await RNFS.stat(filePath);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: fileStats.size,
      };

    } catch (error) {
      console.error('❌ SwingDataExportService: CSV export failed:', error);
      return {
        success: false,
        error: `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async exportToPDF(exportData: ExportData, userId: string): Promise<ExportResult> {
    // Note: PDF export would require a PDF generation library like react-native-html-to-pdf
    // For now, we'll return a placeholder implementation
    try {
      const fileName = `caddieai-swing-report-${userId}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // This would generate a comprehensive PDF report with:
      // - Executive summary
      // - Swing progression charts
      // - Template comparison analysis
      // - Achievement highlights
      // - Recommendation summary
      
      return {
        success: false,
        error: 'PDF export not yet implemented. Please use JSON or CSV format.'
      };

    } catch (error) {
      console.error('❌ SwingDataExportService: PDF export failed:', error);
      return {
        success: false,
        error: `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private estimateExportSize(exportData: ExportData): number {
    // Rough estimation based on JSON serialization
    const jsonString = JSON.stringify(exportData);
    return jsonString.length * 2; // Account for formatting and metadata
  }

  private estimateExportSizeFromSwings(swings: SwingAnalysisSummary[], options: ExportOptions): number {
    let estimatedSize = 0;
    
    // Base size per swing (JSON format)
    estimatedSize += swings.length * 400; // ~400 bytes per swing
    
    // Additional data
    if (options.includeProgressionAnalysis) estimatedSize += 50000; // ~50KB
    if (options.includeFeedbackHistory) estimatedSize += swings.length * 800; // ~800 bytes per feedback
    if (options.includeAchievements) estimatedSize += 10000; // ~10KB
    if (options.includeMilestones) estimatedSize += 5000; // ~5KB
    if (options.includeTemplateComparisons) estimatedSize += 100000; // ~100KB
    
    return estimatedSize;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private estimateExportTime(size: number): string {
    // Rough estimation based on file size
    if (size < 100 * 1024) return '< 1 second';
    if (size < 1024 * 1024) return '1-3 seconds';
    if (size < 10 * 1024 * 1024) return '3-10 seconds';
    return '10+ seconds';
  }

  private getShareMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'pdf': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }
}