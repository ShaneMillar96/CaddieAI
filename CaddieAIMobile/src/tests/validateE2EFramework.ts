/**
 * E2E Test Framework Validation
 * 
 * This script validates that the E2E test framework is properly configured
 * and all dependencies are available before running actual tests.
 */

import { SwingAnalysisErrorUtils, PerformanceMonitor } from '../utils/SwingAnalysisErrorUtils';
import { testRunner } from './E2ETestRunner';

interface ValidationResult {
  category: string;
  checks: {
    name: string;
    passed: boolean;
    error?: string;
    recommendation?: string;
  }[];
  overallPassed: boolean;
}

export class E2EFrameworkValidator {

  /**
   * Run complete framework validation
   */
  public static async validateFramework(): Promise<ValidationResult[]> {
    console.log('🔍 Validating E2E Test Framework');
    console.log('═══════════════════════════════════════');

    const results: ValidationResult[] = [];

    // Test 1: Dependencies Validation
    results.push(await this.validateDependencies());

    // Test 2: Service Layer Validation
    results.push(await this.validateServices());

    // Test 3: Test Framework Validation
    results.push(await this.validateTestFramework());

    // Test 4: Mock Data Validation
    results.push(await this.validateMockData());

    // Test 5: Performance Monitoring Validation
    results.push(await this.validatePerformanceMonitoring());

    // Print summary
    this.printValidationSummary(results);

    return results;
  }

  /**
   * Quick validation for essential components only
   */
  public static async quickValidation(): Promise<boolean> {
    try {
      const results = await this.validateFramework();
      const allPassed = results.every(r => r.overallPassed);
      
      console.log(`\n🏁 Quick Validation Result: ${allPassed ? 'PASSED' : 'FAILED'}`);
      
      return allPassed;
    } catch (error) {
      console.error('❌ Quick validation failed:', error);
      return false;
    }
  }

  // Private validation methods

  private static async validateDependencies(): Promise<ValidationResult> {
    const checks = [];

    // Check AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('test-key', 'test-value');
      await AsyncStorage.removeItem('test-key');
      checks.push({ name: 'AsyncStorage', passed: true });
    } catch (error) {
      checks.push({
        name: 'AsyncStorage',
        passed: false,
        error: 'AsyncStorage not available',
        recommendation: 'Install @react-native-async-storage/async-storage'
      });
    }

    // Check React Native components
    try {
      const { Alert } = require('react-native');
      checks.push({ name: 'React Native Alert', passed: !!Alert });
    } catch (error) {
      checks.push({
        name: 'React Native Alert',
        passed: false,
        error: 'React Native components not available'
      });
    }

    // Check Vector Icons
    try {
      const Icon = require('react-native-vector-icons/MaterialIcons');
      checks.push({ name: 'Vector Icons', passed: !!Icon });
    } catch (error) {
      checks.push({
        name: 'Vector Icons',
        passed: false,
        error: 'Vector icons not available',
        recommendation: 'Install and configure react-native-vector-icons'
      });
    }

    return {
      category: 'Dependencies',
      checks,
      overallPassed: checks.every(c => c.passed)
    };
  }

  private static async validateServices(): Promise<ValidationResult> {
    const checks = [];

    // Check SwingAnalysisErrorUtils
    try {
      const testResult = await SwingAnalysisErrorUtils.withErrorHandling(
        async () => 'test-success',
        { testContext: 'FrameworkValidation' },
        { showUserAlert: false, logToConsole: false, retryOnFailure: false }
      );
      
      checks.push({
        name: 'SwingAnalysisErrorUtils',
        passed: testResult === 'test-success'
      });
    } catch (error) {
      checks.push({
        name: 'SwingAnalysisErrorUtils',
        passed: false,
        error: 'Error handling utility failed',
        recommendation: 'Check SwingAnalysisErrorUtils implementation'
      });
    }

    // Check Health Check System
    try {
      const healthResult = await SwingAnalysisErrorUtils.performHealthCheck();
      checks.push({
        name: 'Health Check System',
        passed: typeof healthResult === 'boolean'
      });
    } catch (error) {
      checks.push({
        name: 'Health Check System',
        passed: false,
        error: 'Health check system failed'
      });
    }

    // Check Error Summary
    try {
      const errorSummary = SwingAnalysisErrorUtils.getErrorSummary();
      checks.push({
        name: 'Error Summary System',
        passed: errorSummary && typeof errorSummary.hasRecentErrors === 'boolean'
      });
    } catch (error) {
      checks.push({
        name: 'Error Summary System',
        passed: false,
        error: 'Error summary system failed'
      });
    }

    return {
      category: 'Service Layer',
      checks,
      overallPassed: checks.every(c => c.passed)
    };
  }

  private static async validateTestFramework(): Promise<ValidationResult> {
    const checks = [];

    // Check Test Runner Instantiation
    try {
      const availableSuites = testRunner.getAvailableTestSuites();
      checks.push({
        name: 'Test Runner Initialization',
        passed: availableSuites && availableSuites.length > 0
      });
    } catch (error) {
      checks.push({
        name: 'Test Runner Initialization',
        passed: false,
        error: 'Test runner failed to initialize'
      });
    }

    // Check Test Suite Configurations
    try {
      const availableSuites = testRunner.getAvailableTestSuites();
      const expectedSuites = [
        'FullSystem_WithGarmin',
        'MockData_FastTest',
        'PerformanceOnly',
        'ErrorHandlingFocus',
        'ProductionReadiness'
      ];
      
      const hasAllSuites = expectedSuites.every(expected => 
        availableSuites.some(suite => suite.suiteName === expected)
      );
      
      checks.push({
        name: 'Test Suite Configurations',
        passed: hasAllSuites,
        error: hasAllSuites ? undefined : 'Missing expected test suites'
      });
    } catch (error) {
      checks.push({
        name: 'Test Suite Configurations',
        passed: false,
        error: 'Failed to validate test suite configurations'
      });
    }

    // Check Test History Access
    try {
      const history = await testRunner.getTestHistory();
      checks.push({
        name: 'Test History System',
        passed: Array.isArray(history)
      });
    } catch (error) {
      checks.push({
        name: 'Test History System',
        passed: false,
        error: 'Test history system failed'
      });
    }

    return {
      category: 'Test Framework',
      checks,
      overallPassed: checks.every(c => c.passed)
    };
  }

  private static async validateMockData(): Promise<ValidationResult> {
    const checks = [];

    // Import test class to check mock data generation
    try {
      const { default: SwingAnalysisE2ETests } = await import('./SwingAnalysisE2ETests');
      const testInstance = new SwingAnalysisE2ETests();
      
      // Access private method through any (for testing purposes)
      const mockDataMethod = (testInstance as any).generateMockSwingData;
      
      if (typeof mockDataMethod === 'function') {
        const mockData = mockDataMethod.call(testInstance);
        
        checks.push({
          name: 'Mock Data Generation',
          passed: Array.isArray(mockData) && mockData.length > 0
        });

        // Validate mock data structure
        const firstMock = mockData[0];
        const hasRequiredFields = firstMock && 
          firstMock.accelerometerData && 
          firstMock.gyroscopeData && 
          firstMock.timestampMs && 
          firstMock.expectedSwingType && 
          firstMock.expectedMetrics;

        checks.push({
          name: 'Mock Data Structure',
          passed: hasRequiredFields
        });

        // Validate swing types
        const swingTypes = mockData.map((d: any) => d.expectedSwingType);
        const expectedTypes = ['driver', 'iron', 'wedge', 'putter'];
        const hasAllTypes = expectedTypes.every(type => swingTypes.includes(type));

        checks.push({
          name: 'Swing Type Coverage',
          passed: hasAllTypes
        });

      } else {
        checks.push({
          name: 'Mock Data Generation',
          passed: false,
          error: 'Mock data generation method not found'
        });
      }

    } catch (error) {
      checks.push({
        name: 'Mock Data Generation',
        passed: false,
        error: 'Failed to validate mock data generation'
      });
    }

    return {
      category: 'Mock Data',
      checks,
      overallPassed: checks.every(c => c.passed)
    };
  }

  private static async validatePerformanceMonitoring(): Promise<ValidationResult> {
    const checks = [];

    // Test Performance Monitor
    try {
      const stopTimer = PerformanceMonitor.startMeasurement('ValidationTest');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      stopTimer();
      
      const stats = PerformanceMonitor.getPerformanceStats('ValidationTest');
      
      checks.push({
        name: 'Performance Measurement',
        passed: stats !== null && stats.average > 0
      });

      // Test record measurement
      PerformanceMonitor.recordMeasurement('DirectTest', 150);
      const directStats = PerformanceMonitor.getPerformanceStats('DirectTest');
      
      checks.push({
        name: 'Direct Performance Recording',
        passed: directStats !== null && directStats.average === 150
      });

    } catch (error) {
      checks.push({
        name: 'Performance Measurement',
        passed: false,
        error: 'Performance monitoring failed'
      });
    }

    return {
      category: 'Performance Monitoring',
      checks,
      overallPassed: checks.every(c => c.passed)
    };
  }

  private static printValidationSummary(results: ValidationResult[]): void {
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════');

    let totalChecks = 0;
    let passedChecks = 0;

    results.forEach(result => {
      const status = result.overallPassed ? '✅' : '❌';
      console.log(`${status} ${result.category}`);

      result.checks.forEach(check => {
        const checkStatus = check.passed ? '  ✓' : '  ✗';
        console.log(`${checkStatus} ${check.name}`);
        
        if (check.error) {
          console.log(`    ⚠️ ${check.error}`);
        }
        
        if (check.recommendation) {
          console.log(`    💡 ${check.recommendation}`);
        }
        
        totalChecks++;
        if (check.passed) passedChecks++;
      });
      
      console.log('');
    });

    const overallSuccess = passedChecks === totalChecks;
    const successIcon = overallSuccess ? '🎉' : '🚨';
    
    console.log(`${successIcon} OVERALL: ${passedChecks}/${totalChecks} checks passed`);
    
    if (!overallSuccess) {
      console.log('\n💡 RECOMMENDATIONS:');
      results.forEach(result => {
        result.checks
          .filter(check => !check.passed && check.recommendation)
          .forEach(check => {
            console.log(`   • ${check.recommendation}`);
          });
      });
    } else {
      console.log('\n✅ Framework is ready for E2E testing!');
    }
    
    console.log('═══════════════════════════════════════');
  }
}

// Export convenience functions
export const validateE2EFramework = () => E2EFrameworkValidator.validateFramework();
export const quickValidateE2E = () => E2EFrameworkValidator.quickValidation();