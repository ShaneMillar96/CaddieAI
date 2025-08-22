import { SwingAnalysisError, SwingAnalysisErrorType, swingAnalysisErrorHandler } from '../services/SwingAnalysisErrorHandler';
import { Alert } from 'react-native';

export interface ErrorHandlingOptions {
  showUserAlert: boolean;
  logToConsole: boolean;
  retryOnFailure: boolean;
  fallbackValue?: any;
  onError?: (error: SwingAnalysisError) => void;
}

export class SwingAnalysisErrorUtils {
  public static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Record<string, any> = {},
    options: ErrorHandlingOptions = this.getDefaultOptions()
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const swingError = swingAnalysisErrorHandler.handleError(
        error as Error,
        context
      );

      // Execute custom error handler if provided
      if (options.onError) {
        options.onError(swingError);
      }

      // Show user alert if requested
      if (options.showUserAlert) {
        this.showErrorAlert(swingError);
      }

      // Attempt recovery if error is recoverable and retry is enabled
      if (options.retryOnFailure && swingError.recoverable) {
        const recoveryStrategy = swingAnalysisErrorHandler.getRecoveryStrategy(swingError);
        
        if (recoveryStrategy.retryable && recoveryStrategy.maxRetries) {
          return await this.retryWithBackoff(
            operation,
            recoveryStrategy.maxRetries,
            recoveryStrategy.retryDelay || 1000
          );
        }
      }

      // Return fallback value if provided
      if (options.fallbackValue !== undefined) {
        return options.fallbackValue;
      }

      return null;
    }
  }

  public static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    baseDelay: number = 1000
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`🔄 Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
          await this.delay(delay);
        }
      }
    }

    // All retries failed
    if (lastError) {
      swingAnalysisErrorHandler.handleError(
        lastError,
        { attempts: maxRetries, operation: operation.name }
      );
    }

    return null;
  }

  public static showErrorAlert(error: SwingAnalysisError): void {
    const title = this.getErrorTitle(error.type);
    const message = error.userMessage;
    const buttons = this.getErrorButtons(error);

    Alert.alert(title, message, buttons);
  }

  public static validateAndThrow(
    condition: boolean,
    errorType: SwingAnalysisErrorType,
    message: string,
    context?: Record<string, any>
  ): void {
    if (!condition) {
      const error = new Error(message);
      throw swingAnalysisErrorHandler.handleError(error, context, errorType);
    }
  }

  public static async safeAsyncOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    errorMessage: string = 'Operation failed'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.warn(`⚠️ ${errorMessage}:`, error);
      swingAnalysisErrorHandler.handleError(
        error as Error,
        { operation: operation.name, fallback }
      );
      return fallback;
    }
  }

  public static createErrorBoundary<T>(
    operation: (params: T) => Promise<any>,
    errorType: SwingAnalysisErrorType
  ) {
    return async (params: T) => {
      try {
        return await operation(params);
      } catch (error) {
        const swingError = swingAnalysisErrorHandler.handleError(
          error as Error,
          { params },
          errorType
        );
        
        // Re-throw as SwingAnalysisError for consistent handling
        throw swingError;
      }
    };
  }

  public static async performHealthCheck(): Promise<boolean> {
    try {
      const healthCheck = await swingAnalysisErrorHandler.performHealthCheck();
      
      if (healthCheck.overall === 'unhealthy') {
        Alert.alert(
          'System Health Warning',
          'Some swing analysis features may not work properly. Please check your device settings.',
          [
            { text: 'OK', style: 'default' },
            { text: 'View Details', onPress: () => this.showHealthDetails(healthCheck) }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  public static getErrorSummary(): {
    hasRecentErrors: boolean;
    criticalErrorCount: number;
    mostCommonError: SwingAnalysisErrorType | null;
    recommendations: string[];
  } {
    const stats = swingAnalysisErrorHandler.getErrorStatistics();
    const criticalErrors = stats.recentErrors.filter(e => e.severity === 'critical');
    
    // Find most common error type
    const errorTypeCounts = Object.entries(stats.errorsByType);
    const mostCommonError = errorTypeCounts.length > 0 
      ? errorTypeCounts.reduce((a, b) => a[1] > b[1] ? a : b)[0] as SwingAnalysisErrorType
      : null;

    // Generate recommendations based on error patterns
    const recommendations: string[] = [];
    
    if (criticalErrors.length > 0) {
      recommendations.push('Address critical system errors immediately');
    }
    
    if (stats.errorRate > 0.2) {
      recommendations.push('Error rate is high - consider restarting the app');
    }
    
    if (mostCommonError) {
      const strategy = swingAnalysisErrorHandler.getRecoveryStrategy({
        type: mostCommonError,
        message: '',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        recoverable: true,
        userMessage: ''
      });
      recommendations.push(...strategy.recoverySteps.slice(0, 2));
    }

    return {
      hasRecentErrors: stats.recentErrors.length > 0,
      criticalErrorCount: criticalErrors.length,
      mostCommonError,
      recommendations: recommendations.slice(0, 3),
    };
  }

  public static clearErrorHistory(): void {
    swingAnalysisErrorHandler.clearErrorHistory();
    console.log('✅ Error history cleared');
  }

  private static getDefaultOptions(): ErrorHandlingOptions {
    return {
      showUserAlert: false,
      logToConsole: true,
      retryOnFailure: false,
    };
  }

  private static getErrorTitle(errorType: SwingAnalysisErrorType): string {
    switch (errorType) {
      case SwingAnalysisErrorType.GARMIN_CONNECTION_LOST:
        return 'Device Connection Lost';
      case SwingAnalysisErrorType.MOBILE_SENSOR_UNAVAILABLE:
        return 'Sensor Unavailable';
      case SwingAnalysisErrorType.PERMISSION_DENIED:
        return 'Permission Required';
      case SwingAnalysisErrorType.STORAGE_FULL:
        return 'Storage Full';
      case SwingAnalysisErrorType.NO_INTERNET_CONNECTION:
        return 'No Internet Connection';
      case SwingAnalysisErrorType.OPENAI_API_ERROR:
        return 'AI Service Unavailable';
      default:
        return 'Analysis Error';
    }
  }

  private static getErrorButtons(error: SwingAnalysisError): any[] {
    const buttons = [{ text: 'OK', style: 'default' }];

    if (error.recoverable) {
      const strategy = swingAnalysisErrorHandler.getRecoveryStrategy(error);
      
      if (strategy.canRecover) {
        buttons.unshift({
          text: 'Retry',
          style: 'default',
          onPress: () => {
            // Trigger retry logic - would need to be implemented by the calling component
            console.log('🔄 User requested retry for:', error.type);
          }
        });
      }
    }

    return buttons;
  }

  private static showHealthDetails(healthCheck: any): void {
    const details = Object.entries(healthCheck.services)
      .map(([service, status]: [string, any]) => `${service}: ${status.status}`)
      .join('\n');

    Alert.alert(
      'System Health Details',
      `Overall: ${healthCheck.overall}\n\n${details}\n\nRecommendations:\n${healthCheck.recommendations.join('\n')}`,
      [{ text: 'OK' }]
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Decorator function for automatic error handling
export function withSwingErrorHandling(
  errorType?: SwingAnalysisErrorType,
  options: Partial<ErrorHandlingOptions> = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fullOptions: ErrorHandlingOptions = {
        ...SwingAnalysisErrorUtils.getDefaultOptions(),
        ...options
      };

      return SwingAnalysisErrorUtils.withErrorHandling(
        () => method.apply(this, args),
        { 
          className: target.constructor.name,
          methodName: propertyName,
          arguments: args 
        },
        fullOptions
      );
    };

    return descriptor;
  };
}

// Type guards for error handling
export function isSwingAnalysisError(error: any): error is SwingAnalysisError {
  return error && typeof error === 'object' && 'type' in error && 'severity' in error;
}

export function isCriticalError(error: SwingAnalysisError): boolean {
  return error.severity === 'critical';
}

export function isRecoverableError(error: SwingAnalysisError): boolean {
  return error.recoverable === true;
}

// Error reporting utility
export class ErrorReporter {
  private static reportedErrors = new Set<string>();

  public static async reportError(
    error: SwingAnalysisError,
    userFeedback?: string
  ): Promise<void> {
    try {
      // Create unique error signature to avoid duplicate reports
      const errorSignature = `${error.type}-${error.message.substring(0, 50)}`;
      
      if (this.reportedErrors.has(errorSignature)) {
        return; // Already reported
      }

      const errorReport = {
        type: error.type,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp,
        context: error.context,
        userFeedback,
        deviceInfo: await this.getDeviceInfo(),
        appVersion: this.getAppVersion(),
      };

      // In production, this would send to error reporting service
      console.log('📊 Error Report:', errorReport);
      
      this.reportedErrors.add(errorSignature);
      
      // Clean up old reported errors (keep last 100)
      if (this.reportedErrors.size > 100) {
        const entries = Array.from(this.reportedErrors);
        this.reportedErrors = new Set(entries.slice(-100));
      }

    } catch (reportingError) {
      console.error('❌ Failed to report error:', reportingError);
    }
  }

  private static async getDeviceInfo(): Promise<object> {
    // In real implementation, would get actual device info
    return {
      platform: 'react-native',
      version: '0.80.2',
      // Add other device info
    };
  }

  private static getAppVersion(): string {
    // In real implementation, would get actual app version
    return '1.0.0';
  }
}

// Performance monitoring for error-prone operations
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  public static startMeasurement(operationName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordMeasurement(operationName, duration);
    };
  }

  public static recordMeasurement(operationName: string, duration: number): void {
    if (!this.measurements.has(operationName)) {
      this.measurements.set(operationName, []);
    }
    
    const measurements = this.measurements.get(operationName)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100);
    }
    
    // Log warning for slow operations
    if (duration > 5000) { // 5 seconds
      console.warn(`⚠️ Slow operation detected: ${operationName} took ${duration}ms`);
    }
  }

  public static getPerformanceStats(operationName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.measurements.get(operationName);
    
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const average = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return {
      average: Math.round(average),
      min,
      max,
      count: measurements.length,
    };
  }
}