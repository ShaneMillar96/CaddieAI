import { SwingAnalysisSummary } from '../store/slices/aiCaddieSlice';
import { DetailedSwingMetrics } from './SwingMetricsService';
import { PatternMatchResult } from './SwingPatternService';
import { MotionData } from './MobileSensorService';

export enum SwingAnalysisErrorType {
  // Data Validation Errors
  INVALID_MOTION_DATA = 'INVALID_MOTION_DATA',
  INSUFFICIENT_DATA_POINTS = 'INSUFFICIENT_DATA_POINTS',
  CORRUPTED_SENSOR_DATA = 'CORRUPTED_SENSOR_DATA',
  TIMESTAMP_OUT_OF_RANGE = 'TIMESTAMP_OUT_OF_RANGE',
  
  // Sensor Hardware Errors
  GARMIN_CONNECTION_LOST = 'GARMIN_CONNECTION_LOST',
  MOBILE_SENSOR_UNAVAILABLE = 'MOBILE_SENSOR_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SENSOR_CALIBRATION_FAILED = 'SENSOR_CALIBRATION_FAILED',
  
  // Analysis Errors
  SWING_DETECTION_FAILED = 'SWING_DETECTION_FAILED',
  PATTERN_MATCHING_FAILED = 'PATTERN_MATCHING_FAILED',
  METRICS_CALCULATION_FAILED = 'METRICS_CALCULATION_FAILED',
  CONFIDENCE_TOO_LOW = 'CONFIDENCE_TOO_LOW',
  
  // AI Service Errors
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  TEMPLATE_COMPARISON_FAILED = 'TEMPLATE_COMPARISON_FAILED',
  FEEDBACK_GENERATION_FAILED = 'FEEDBACK_GENERATION_FAILED',
  VOICE_SYNTHESIS_FAILED = 'VOICE_SYNTHESIS_FAILED',
  
  // Storage and Export Errors
  STORAGE_FULL = 'STORAGE_FULL',
  EXPORT_SIZE_EXCEEDED = 'EXPORT_SIZE_EXCEEDED',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  SHARING_FAILED = 'SHARING_FAILED',
  
  // Network and Connectivity Errors
  NO_INTERNET_CONNECTION = 'NO_INTERNET_CONNECTION',
  API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  
  // User Context Errors
  USER_NOT_AUTHENTICATED = 'USER_NOT_AUTHENTICATED',
  ROUND_NOT_ACTIVE = 'ROUND_NOT_ACTIVE',
  SKILL_LEVEL_UNKNOWN = 'SKILL_LEVEL_UNKNOWN',
  INSUFFICIENT_HISTORY = 'INSUFFICIENT_HISTORY',
  
  // Memory and Performance Errors
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  CONCURRENT_ANALYSIS_LIMIT = 'CONCURRENT_ANALYSIS_LIMIT',
  
  // Unknown Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface SwingAnalysisError {
  type: SwingAnalysisErrorType;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: Record<string, any>;
  recoverable: boolean;
  recoveryAction?: string;
  userMessage: string;
  technicalDetails?: string;
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  retryable: boolean;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => Promise<any>;
  recoverySteps: string[];
}

export interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency?: number;
      errorRate?: number;
      lastError?: SwingAnalysisError;
    };
  };
  recommendations: string[];
}

export class SwingAnalysisErrorHandler {
  private errorHistory: SwingAnalysisError[] = [];
  private readonly maxErrorHistorySize = 100;
  private readonly errorThresholds = {
    highSeverityLimit: 5, // Max high severity errors per hour
    errorRateLimit: 0.2, // Max 20% error rate
    memoryWarningThreshold: 0.8, // Warning at 80% memory usage
  };

  public handleError(
    error: Error | SwingAnalysisError,
    context?: Record<string, any>,
    errorType?: SwingAnalysisErrorType
  ): SwingAnalysisError {
    let swingError: SwingAnalysisError;

    if (this.isSwingAnalysisError(error)) {
      swingError = error;
    } else {
      swingError = this.createSwingAnalysisError(error, errorType, context);
    }

    // Add to error history
    this.addToErrorHistory(swingError);

    // Log error
    this.logError(swingError);

    // Check if error pattern requires intervention
    this.checkErrorPatterns();

    return swingError;
  }

  public validateMotionData(motionData: MotionData[]): SwingAnalysisError | null {
    try {
      // Check for null or empty data
      if (!motionData || motionData.length === 0) {
        return this.createValidationError(
          SwingAnalysisErrorType.INSUFFICIENT_DATA_POINTS,
          'No motion data provided',
          { dataLength: 0 }
        );
      }

      // Check minimum data points (need at least 50 for swing analysis)
      if (motionData.length < 50) {
        return this.createValidationError(
          SwingAnalysisErrorType.INSUFFICIENT_DATA_POINTS,
          `Insufficient motion data points: ${motionData.length} (minimum: 50)`,
          { dataLength: motionData.length, minimum: 50 }
        );
      }

      // Validate data structure
      for (let i = 0; i < motionData.length; i++) {
        const data = motionData[i];
        
        if (!this.isValidMotionDataPoint(data)) {
          return this.createValidationError(
            SwingAnalysisErrorType.INVALID_MOTION_DATA,
            `Invalid motion data at index ${i}`,
            { index: i, data }
          );
        }

        // Check for corrupted data (extreme values)
        if (this.isCorruptedMotionData(data)) {
          return this.createValidationError(
            SwingAnalysisErrorType.CORRUPTED_SENSOR_DATA,
            `Corrupted sensor data detected at index ${i}`,
            { index: i, data }
          );
        }
      }

      // Check timestamp ordering
      for (let i = 1; i < motionData.length; i++) {
        if (motionData[i].timestamp <= motionData[i - 1].timestamp) {
          return this.createValidationError(
            SwingAnalysisErrorType.TIMESTAMP_OUT_OF_RANGE,
            `Invalid timestamp ordering at index ${i}`,
            { index: i, current: motionData[i].timestamp, previous: motionData[i - 1].timestamp }
          );
        }
      }

      return null; // Validation passed

    } catch (error) {
      return this.createValidationError(
        SwingAnalysisErrorType.UNKNOWN_ERROR,
        `Motion data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  public validateSwingAnalysis(
    analysis: SwingAnalysisSummary,
    minConfidence: number = 50
  ): SwingAnalysisError | null {
    try {
      // Check required fields
      if (!analysis.timestamp || !analysis.clubType) {
        return this.createValidationError(
          SwingAnalysisErrorType.INVALID_MOTION_DATA,
          'Missing required swing analysis fields',
          { analysis }
        );
      }

      // Check confidence level
      if (analysis.confidence < minConfidence) {
        return this.createValidationError(
          SwingAnalysisErrorType.CONFIDENCE_TOO_LOW,
          `Swing confidence (${analysis.confidence}%) below minimum threshold (${minConfidence}%)`,
          { confidence: analysis.confidence, threshold: minConfidence }
        );
      }

      // Validate metric ranges
      const validationErrors = this.validateMetricRanges(analysis);
      if (validationErrors) {
        return validationErrors;
      }

      return null; // Validation passed

    } catch (error) {
      return this.createValidationError(
        SwingAnalysisErrorType.UNKNOWN_ERROR,
        `Swing analysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  public getRecoveryStrategy(error: SwingAnalysisError): ErrorRecoveryStrategy {
    switch (error.type) {
      case SwingAnalysisErrorType.GARMIN_CONNECTION_LOST:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 3,
          retryDelay: 2000,
          recoverySteps: [
            'Check Garmin device is powered on',
            'Ensure Bluetooth is enabled',
            'Try reconnecting to device',
            'Restart the app if connection fails'
          ]
        };

      case SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 2,
          retryDelay: 1000,
          recoverySteps: [
            'Check device sensor permissions',
            'Ensure device is not in airplane mode',
            'Restart sensor monitoring'
          ]
        };

      case SwingAnalysisErrorType.OPENAI_API_ERROR:
        return {
          canRecover: true,
          retryable: true,
          maxRetries: 3,
          retryDelay: 5000,
          fallbackAction: async () => this.generateFallbackFeedback(),
          recoverySteps: [
            'Check internet connection',
            'Retry API request with backoff',
            'Use cached feedback if available',
            'Generate basic feedback without AI'
          ]
        };

      case SwingAnalysisErrorType.INSUFFICIENT_DATA_POINTS:
        return {
          canRecover: true,
          retryable: false,
          recoverySteps: [
            'Collect more motion data',
            'Ensure proper swing duration (minimum 2 seconds)',
            'Check sensor sampling rate'
          ]
        };

      case SwingAnalysisErrorType.CONFIDENCE_TOO_LOW:
        return {
          canRecover: true,
          retryable: false,
          recoverySteps: [
            'Retry swing analysis',
            'Check sensor positioning',
            'Ensure proper swing execution',
            'Consider recalibration'
          ]
        };

      case SwingAnalysisErrorType.STORAGE_FULL:
        return {
          canRecover: false,
          retryable: false,
          recoverySteps: [
            'Free up device storage',
            'Delete old swing data',
            'Export data and clear cache'
          ]
        };

      default:
        return {
          canRecover: false,
          retryable: true,
          maxRetries: 1,
          recoverySteps: [
            'Restart the feature',
            'Check app permissions',
            'Update the app if available'
          ]
        };
    }
  }

  public async performHealthCheck(): Promise<HealthCheckResult> {
    const serviceChecks = await Promise.allSettled([
      this.checkSensorHealth(),
      this.checkAIServiceHealth(),
      this.checkStorageHealth(),
      this.checkNetworkHealth(),
    ]);

    const services: HealthCheckResult['services'] = {};
    let overallHealthy = true;
    let degradedCount = 0;

    // Process sensor health
    if (serviceChecks[0].status === 'fulfilled') {
      services.sensors = serviceChecks[0].value;
      if (services.sensors.status !== 'healthy') {
        overallHealthy = false;
        if (services.sensors.status === 'degraded') degradedCount++;
      }
    }

    // Process AI service health
    if (serviceChecks[1].status === 'fulfilled') {
      services.aiServices = serviceChecks[1].value;
      if (services.aiServices.status !== 'healthy') {
        overallHealthy = false;
        if (services.aiServices.status === 'degraded') degradedCount++;
      }
    }

    // Process storage health
    if (serviceChecks[2].status === 'fulfilled') {
      services.storage = serviceChecks[2].value;
      if (services.storage.status !== 'healthy') {
        overallHealthy = false;
        if (services.storage.status === 'degraded') degradedCount++;
      }
    }

    // Process network health
    if (serviceChecks[3].status === 'fulfilled') {
      services.network = serviceChecks[3].value;
      if (services.network.status !== 'healthy') {
        overallHealthy = false;
        if (services.network.status === 'degraded') degradedCount++;
      }
    }

    const overall = overallHealthy ? 'healthy' : degradedCount > 0 ? 'degraded' : 'unhealthy';
    const recommendations = this.generateHealthRecommendations(services);

    return {
      overall,
      services,
      recommendations,
    };
  }

  public getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<SwingAnalysisErrorType, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: SwingAnalysisError[];
    errorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    );

    const errorsByType: Record<SwingAnalysisErrorType, number> = {} as any;
    const errorsBySeverity: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10), // Last 10 recent errors
      errorRate: recentErrors.length / Math.max(1, this.errorHistory.length),
    };
  }

  public clearErrorHistory(): void {
    this.errorHistory = [];
    console.log('🧹 SwingAnalysisErrorHandler: Error history cleared');
  }

  private isSwingAnalysisError(error: any): error is SwingAnalysisError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  private createSwingAnalysisError(
    error: Error,
    type?: SwingAnalysisErrorType,
    context?: Record<string, any>
  ): SwingAnalysisError {
    const errorType = type || this.inferErrorType(error);
    const severity = this.determineSeverity(errorType);
    const userMessage = this.generateUserMessage(errorType, error.message);

    return {
      type: errorType,
      message: error.message,
      severity,
      timestamp: new Date().toISOString(),
      context,
      recoverable: this.isRecoverable(errorType),
      recoveryAction: this.getRecoveryAction(errorType),
      userMessage,
      technicalDetails: error.stack,
    };
  }

  private createValidationError(
    type: SwingAnalysisErrorType,
    message: string,
    context?: Record<string, any>
  ): SwingAnalysisError {
    return {
      type,
      message,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context,
      recoverable: true,
      userMessage: this.generateUserMessage(type, message),
    };
  }

  private isValidMotionDataPoint(data: MotionData): boolean {
    return (
      data &&
      typeof data.timestamp === 'number' &&
      typeof data.x === 'number' &&
      typeof data.y === 'number' &&
      typeof data.z === 'number' &&
      !isNaN(data.x) &&
      !isNaN(data.y) &&
      !isNaN(data.z) &&
      isFinite(data.x) &&
      isFinite(data.y) &&
      isFinite(data.z)
    );
  }

  private isCorruptedMotionData(data: MotionData): boolean {
    // Check for extreme acceleration values (beyond reasonable limits)
    const maxAcceleration = 50; // m/s² (reasonable max for golf swing)
    
    return (
      Math.abs(data.x) > maxAcceleration ||
      Math.abs(data.y) > maxAcceleration ||
      Math.abs(data.z) > maxAcceleration ||
      // Check for zero variance (stuck sensor)
      (data.x === 0 && data.y === 0 && data.z === 0)
    );
  }

  private validateMetricRanges(analysis: SwingAnalysisSummary): SwingAnalysisError | null {
    // Validate clubhead speed (reasonable range: 20-150 mph)
    if (analysis.clubheadSpeed < 20 || analysis.clubheadSpeed > 150) {
      return this.createValidationError(
        SwingAnalysisErrorType.INVALID_MOTION_DATA,
        `Invalid clubhead speed: ${analysis.clubheadSpeed} mph`,
        { metric: 'clubheadSpeed', value: analysis.clubheadSpeed, range: '20-150 mph' }
      );
    }

    // Validate swing tempo (reasonable range: 0.5-10 seconds)
    if (analysis.swingTempo < 0.5 || analysis.swingTempo > 10) {
      return this.createValidationError(
        SwingAnalysisErrorType.INVALID_MOTION_DATA,
        `Invalid swing tempo: ${analysis.swingTempo} seconds`,
        { metric: 'swingTempo', value: analysis.swingTempo, range: '0.5-10 seconds' }
      );
    }

    // Validate balance score (0-100 range)
    if (analysis.balanceScore < 0 || analysis.balanceScore > 100) {
      return this.createValidationError(
        SwingAnalysisErrorType.INVALID_MOTION_DATA,
        `Invalid balance score: ${analysis.balanceScore}`,
        { metric: 'balanceScore', value: analysis.balanceScore, range: '0-100' }
      );
    }

    // Validate confidence (0-100 range)
    if (analysis.confidence < 0 || analysis.confidence > 100) {
      return this.createValidationError(
        SwingAnalysisErrorType.INVALID_MOTION_DATA,
        `Invalid confidence: ${analysis.confidence}`,
        { metric: 'confidence', value: analysis.confidence, range: '0-100' }
      );
    }

    return null;
  }

  private inferErrorType(error: Error): SwingAnalysisErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission')) return SwingAnalysisErrorType.PERMISSION_DENIED;
    if (message.includes('network') || message.includes('fetch')) return SwingAnalysisErrorType.NO_INTERNET_CONNECTION;
    if (message.includes('timeout')) return SwingAnalysisErrorType.REQUEST_TIMEOUT;
    if (message.includes('memory') || message.includes('heap')) return SwingAnalysisErrorType.MEMORY_LIMIT_EXCEEDED;
    if (message.includes('storage') || message.includes('disk')) return SwingAnalysisErrorType.STORAGE_FULL;
    if (message.includes('openai') || message.includes('api')) return SwingAnalysisErrorType.OPENAI_API_ERROR;
    if (message.includes('bluetooth') || message.includes('garmin')) return SwingAnalysisErrorType.GARMIN_CONNECTION_LOST;
    if (message.includes('sensor')) return SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE;
    
    return SwingAnalysisErrorType.UNKNOWN_ERROR;
  }

  private determineSeverity(type: SwingAnalysisErrorType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalErrors = [
      SwingAnalysisErrorType.MEMORY_LIMIT_EXCEEDED,
      SwingAnalysisErrorType.STORAGE_FULL,
      SwingAnalysisErrorType.CORRUPTED_SENSOR_DATA,
    ];

    const highErrors = [
      SwingAnalysisErrorType.GARMIN_CONNECTION_LOST,
      SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE,
      SwingAnalysisErrorType.PERMISSION_DENIED,
      SwingAnalysisErrorType.SERVER_UNAVAILABLE,
    ];

    const mediumErrors = [
      SwingAnalysisErrorType.SWING_DETECTION_FAILED,
      SwingAnalysisErrorType.PATTERN_MATCHING_FAILED,
      SwingAnalysisErrorType.OPENAI_API_ERROR,
      SwingAnalysisErrorType.NO_INTERNET_CONNECTION,
    ];

    if (criticalErrors.includes(type)) return 'critical';
    if (highErrors.includes(type)) return 'high';
    if (mediumErrors.includes(type)) return 'medium';
    return 'low';
  }

  private generateUserMessage(type: SwingAnalysisErrorType, technicalMessage: string): string {
    switch (type) {
      case SwingAnalysisErrorType.GARMIN_CONNECTION_LOST:
        return 'Lost connection to your Garmin device. Please check that it\'s powered on and nearby.';
      
      case SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE:
        return 'Unable to access device sensors. Please check permissions and try again.';
      
      case SwingAnalysisErrorType.INSUFFICIENT_DATA_POINTS:
        return 'Not enough swing data captured. Please ensure a complete swing motion.';
      
      case SwingAnalysisErrorType.CONFIDENCE_TOO_LOW:
        return 'Swing analysis confidence is low. Try a more controlled swing or check sensor positioning.';
      
      case SwingAnalysisErrorType.OPENAI_API_ERROR:
        return 'AI analysis temporarily unavailable. Basic feedback will be provided instead.';
      
      case SwingAnalysisErrorType.NO_INTERNET_CONNECTION:
        return 'No internet connection. Some features may be limited until connection is restored.';
      
      case SwingAnalysisErrorType.STORAGE_FULL:
        return 'Device storage is full. Please free up space to continue saving swing data.';
      
      case SwingAnalysisErrorType.PERMISSION_DENIED:
        return 'App permissions are required for swing analysis. Please enable in device settings.';
      
      default:
        return 'An error occurred during swing analysis. Please try again.';
    }
  }

  private isRecoverable(type: SwingAnalysisErrorType): boolean {
    const unrecoverableErrors = [
      SwingAnalysisErrorType.STORAGE_FULL,
      SwingAnalysisErrorType.PERMISSION_DENIED,
      SwingAnalysisErrorType.MEMORY_LIMIT_EXCEEDED,
    ];
    
    return !unrecoverableErrors.includes(type);
  }

  private getRecoveryAction(type: SwingAnalysisErrorType): string | undefined {
    switch (type) {
      case SwingAnalysisErrorType.GARMIN_CONNECTION_LOST:
        return 'Reconnect to Garmin device';
      case SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE:
        return 'Restart sensor monitoring';
      case SwingAnalysisErrorType.OPENAI_API_ERROR:
        return 'Use offline analysis mode';
      case SwingAnalysisErrorType.NO_INTERNET_CONNECTION:
        return 'Enable offline mode';
      default:
        return undefined;
    }
  }

  private addToErrorHistory(error: SwingAnalysisError): void {
    this.errorHistory.unshift(error);
    
    // Trim history to max size
    if (this.errorHistory.length > this.maxErrorHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistorySize);
    }
  }

  private logError(error: SwingAnalysisError): void {
    const logLevel = error.severity === 'critical' ? 'error' : 
                    error.severity === 'high' ? 'error' :
                    error.severity === 'medium' ? 'warn' : 'info';

    console[logLevel](`❌ SwingAnalysisError [${error.type}]:`, {
      message: error.message,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      userMessage: error.userMessage
    });
  }

  private checkErrorPatterns(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    );

    // Check for high severity error threshold
    const highSeverityErrors = recentErrors.filter(e => 
      e.severity === 'high' || e.severity === 'critical'
    );

    if (highSeverityErrors.length >= this.errorThresholds.highSeverityLimit) {
      console.warn('⚠️ SwingAnalysisErrorHandler: High severity error threshold exceeded:', {
        count: highSeverityErrors.length,
        limit: this.errorThresholds.highSeverityLimit
      });
    }

    // Check for error rate threshold
    const totalAnalyses = this.estimateAnalysisCount();
    const errorRate = recentErrors.length / Math.max(1, totalAnalyses);
    
    if (errorRate > this.errorThresholds.errorRateLimit) {
      console.warn('⚠️ SwingAnalysisErrorHandler: Error rate threshold exceeded:', {
        errorRate: errorRate.toFixed(3),
        limit: this.errorThresholds.errorRateLimit
      });
    }
  }

  private estimateAnalysisCount(): number {
    // Rough estimate based on typical usage patterns
    return this.errorHistory.length * 5; // Assume ~80% success rate
  }

  private async checkSensorHealth(): Promise<HealthCheckResult['services'][string]> {
    try {
      // Check sensor availability and responsiveness
      const startTime = Date.now();
      
      // Simulate sensor check (in real implementation, would actually test sensors)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const latency = Date.now() - startTime;
      const recentSensorErrors = this.errorHistory.filter(e => 
        [SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE, 
         SwingAnalysisErrorType.GARMIN_CONNECTION_LOST].includes(e.type)
      );

      const errorRate = recentSensorErrors.length / Math.max(1, this.errorHistory.length);
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (errorRate > 0.3) status = 'unhealthy';
      else if (errorRate > 0.1 || latency > 500) status = 'degraded';
      else status = 'healthy';

      return {
        status,
        latency,
        errorRate,
        lastError: recentSensorErrors[0],
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: this.handleError(error as Error, {}, SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE),
      };
    }
  }

  private async checkAIServiceHealth(): Promise<HealthCheckResult['services'][string]> {
    try {
      const startTime = Date.now();
      
      // Simulate AI service check
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const latency = Date.now() - startTime;
      const recentAIErrors = this.errorHistory.filter(e => 
        [SwingAnalysisErrorType.OPENAI_API_ERROR, 
         SwingAnalysisErrorType.FEEDBACK_GENERATION_FAILED].includes(e.type)
      );

      const errorRate = recentAIErrors.length / Math.max(1, this.errorHistory.length);
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (errorRate > 0.2) status = 'unhealthy';
      else if (errorRate > 0.05 || latency > 2000) status = 'degraded';
      else status = 'healthy';

      return {
        status,
        latency,
        errorRate,
        lastError: recentAIErrors[0],
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: this.handleError(error as Error, {}, SwingAnalysisErrorType.OPENAI_API_ERROR),
      };
    }
  }

  private async checkStorageHealth(): Promise<HealthCheckResult['services'][string]> {
    try {
      // Check storage availability
      // In real implementation, would check actual storage space
      const storageErrors = this.errorHistory.filter(e => 
        [SwingAnalysisErrorType.STORAGE_FULL, 
         SwingAnalysisErrorType.FILE_WRITE_FAILED].includes(e.type)
      );

      const errorRate = storageErrors.length / Math.max(1, this.errorHistory.length);
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (errorRate > 0.1) status = 'unhealthy';
      else if (errorRate > 0.02) status = 'degraded';
      else status = 'healthy';

      return {
        status,
        errorRate,
        lastError: storageErrors[0],
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: this.handleError(error as Error, {}, SwingAnalysisErrorType.STORAGE_FULL),
      };
    }
  }

  private async checkNetworkHealth(): Promise<HealthCheckResult['services'][string]> {
    try {
      const startTime = Date.now();
      
      // Simulate network check
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const latency = Date.now() - startTime;
      const networkErrors = this.errorHistory.filter(e => 
        [SwingAnalysisErrorType.NO_INTERNET_CONNECTION, 
         SwingAnalysisErrorType.SERVER_UNAVAILABLE].includes(e.type)
      );

      const errorRate = networkErrors.length / Math.max(1, this.errorHistory.length);
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (errorRate > 0.3) status = 'unhealthy';
      else if (errorRate > 0.1 || latency > 1000) status = 'degraded';
      else status = 'healthy';

      return {
        status,
        latency,
        errorRate,
        lastError: networkErrors[0],
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        lastError: this.handleError(error as Error, {}, SwingAnalysisErrorType.NO_INTERNET_CONNECTION),
      };
    }
  }

  private generateHealthRecommendations(services: HealthCheckResult['services']): string[] {
    const recommendations: string[] = [];

    if (services.sensors?.status !== 'healthy') {
      recommendations.push('Check sensor permissions and device connectivity');
    }

    if (services.aiServices?.status !== 'healthy') {
      recommendations.push('Verify internet connection for AI services');
    }

    if (services.storage?.status !== 'healthy') {
      recommendations.push('Free up device storage space');
    }

    if (services.network?.status !== 'healthy') {
      recommendations.push('Check internet connection and try again');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally');
    }

    return recommendations;
  }

  private async generateFallbackFeedback(): Promise<string> {
    return 'Great swing! Keep practicing to improve your technique.';
  }
}

// Singleton instance for global error handling
export const swingAnalysisErrorHandler = new SwingAnalysisErrorHandler();