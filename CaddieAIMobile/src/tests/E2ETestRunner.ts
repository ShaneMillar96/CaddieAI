/**
 * E2E Test Runner for Swing Analysis System
 * 
 * This utility provides methods to execute end-to-end tests for the swing analysis
 * system with different configurations and generate detailed reports.
 */

import SwingAnalysisE2ETests, { E2ETestConfig, E2ETestResult } from './SwingAnalysisE2ETests';
import { SwingAnalysisErrorUtils } from '../utils/SwingAnalysisErrorUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TestSuiteConfig {
  suiteName: string;
  config: E2ETestConfig;
  description: string;
}

export interface TestReport {
  suiteResults: {
    suiteName: string;
    config: E2ETestConfig;
    results: E2ETestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      totalDuration: number;
      overallSuccess: boolean;
    };
  }[];
  overallSummary: {
    totalSuites: number;
    successfulSuites: number;
    totalTests: number;
    totalPassedTests: number;
    executionTime: number;
    recommendations: string[];
  };
  timestamp: string;
}

export class E2ETestRunner {
  private testSuites: TestSuiteConfig[] = [
    {
      suiteName: 'FullSystem_WithGarmin',
      description: 'Complete system test with Garmin device connection',
      config: {
        enableGarminDevice: true,
        useMockData: false,
        performanceMonitoring: true,
        batteryMonitoring: true,
        realTimeAnalysis: true,
        skipAIFeedback: false
      }
    },
    {
      suiteName: 'MockData_FastTest',
      description: 'Fast test using mock data only (CI/CD friendly)',
      config: {
        enableGarminDevice: false,
        useMockData: true,
        performanceMonitoring: true,
        batteryMonitoring: false,
        realTimeAnalysis: true,
        skipAIFeedback: false
      }
    },
    {
      suiteName: 'PerformanceOnly',
      description: 'Performance and battery optimization testing',
      config: {
        enableGarminDevice: false,
        useMockData: true,
        performanceMonitoring: true,
        batteryMonitoring: true,
        realTimeAnalysis: false,
        skipAIFeedback: true
      }
    },
    {
      suiteName: 'ErrorHandlingFocus',
      description: 'Focused error handling and recovery testing',
      config: {
        enableGarminDevice: false,
        useMockData: true,
        performanceMonitoring: false,
        batteryMonitoring: false,
        realTimeAnalysis: false,
        skipAIFeedback: true
      }
    },
    {
      suiteName: 'ProductionReadiness',
      description: 'Production readiness validation with all features',
      config: {
        enableGarminDevice: true,
        useMockData: false,
        performanceMonitoring: true,
        batteryMonitoring: true,
        realTimeAnalysis: true,
        skipAIFeedback: false
      }
    }
  ];

  /**
   * Run all predefined test suites
   */
  public async runAllTestSuites(): Promise<TestReport> {
    console.log('🚀 Starting E2E Test Suite Execution');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const startTime = Date.now();
    const suiteResults = [];

    // Clear previous error history
    SwingAnalysisErrorUtils.clearErrorHistory();

    for (const testSuite of this.testSuites) {
      console.log(`\n📦 Executing Test Suite: ${testSuite.suiteName}`);
      console.log(`📝 Description: ${testSuite.description}`);
      console.log('───────────────────────────────────────────────────────────────');

      try {
        const testInstance = new SwingAnalysisE2ETests();
        const results = await testInstance.runCompleteTestSuite(testSuite.config);
        
        const summary = this.calculateSuiteSummary(results);
        
        suiteResults.push({
          suiteName: testSuite.suiteName,
          config: testSuite.config,
          results,
          summary
        });

        console.log(`✅ Test Suite ${testSuite.suiteName} completed: ${summary.passedTests}/${summary.totalTests} passed`);

      } catch (error) {
        console.error(`❌ Test Suite ${testSuite.suiteName} failed:`, error);
        
        suiteResults.push({
          suiteName: testSuite.suiteName,
          config: testSuite.config,
          results: [{
            testName: 'SuiteExecution',
            success: false,
            duration: 0,
            errors: [error instanceof Error ? error.message : 'Unknown suite error'],
            metrics: {
              swingsDetected: 0,
              analysisAccuracy: 0,
              avgResponseTime: 0
            },
            recommendations: ['Fix critical suite execution error']
          }],
          summary: {
            totalTests: 1,
            passedTests: 0,
            failedTests: 1,
            totalDuration: 0,
            overallSuccess: false
          }
        });
      }

      // Brief pause between suites
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const executionTime = Date.now() - startTime;
    const overallSummary = this.calculateOverallSummary(suiteResults, executionTime);

    const testReport: TestReport = {
      suiteResults,
      overallSummary,
      timestamp: new Date().toISOString()
    };

    await this.saveTestReport(testReport);
    this.printFinalReport(testReport);

    return testReport;
  }

  /**
   * Run specific test suite by name
   */
  public async runTestSuite(suiteName: string): Promise<E2ETestResult[]> {
    const testSuite = this.testSuites.find(suite => suite.suiteName === suiteName);
    
    if (!testSuite) {
      throw new Error(`Test suite '${suiteName}' not found. Available suites: ${this.testSuites.map(s => s.suiteName).join(', ')}`);
    }

    console.log(`🎯 Running Single Test Suite: ${testSuite.suiteName}`);
    console.log(`📝 Description: ${testSuite.description}`);

    const testInstance = new SwingAnalysisE2ETests();
    return await testInstance.runCompleteTestSuite(testSuite.config);
  }

  /**
   * Run custom test configuration
   */
  public async runCustomTest(config: E2ETestConfig, description?: string): Promise<E2ETestResult[]> {
    console.log('🛠️ Running Custom Test Configuration');
    if (description) {
      console.log(`📝 Description: ${description}`);
    }
    console.log('📋 Config:', JSON.stringify(config, null, 2));

    const testInstance = new SwingAnalysisE2ETests();
    return await testInstance.runCompleteTestSuite(config);
  }

  /**
   * Quick smoke test for CI/CD pipelines
   */
  public async runSmokeTest(): Promise<boolean> {
    console.log('🔥 Running Quick Smoke Test');
    console.log('───────────────────────────────────────');

    const smokeConfig: E2ETestConfig = {
      enableGarminDevice: false,
      useMockData: true,
      performanceMonitoring: false,
      batteryMonitoring: false,
      realTimeAnalysis: false,
      skipAIFeedback: true
    };

    try {
      const testInstance = new SwingAnalysisE2ETests();
      const results = await testInstance.runCompleteTestSuite(smokeConfig);
      
      const passedTests = results.filter(r => r.success).length;
      const totalTests = results.length;
      const success = passedTests === totalTests;

      console.log(`🔥 Smoke Test Result: ${passedTests}/${totalTests} passed - ${success ? 'PASS' : 'FAIL'}`);
      
      return success;

    } catch (error) {
      console.error('❌ Smoke test failed:', error);
      return false;
    }
  }

  /**
   * Performance benchmark test
   */
  public async runPerformanceBenchmark(): Promise<{
    avgSwingDetectionTime: number;
    avgAIFeedbackTime: number;
    memoryUsage: number;
    throughput: number;
    recommendedOptimizations: string[];
  }> {
    console.log('⚡ Running Performance Benchmark');
    console.log('─────────────────────────────────────');

    const benchmarkConfig: E2ETestConfig = {
      enableGarminDevice: false,
      useMockData: true,
      performanceMonitoring: true,
      batteryMonitoring: true,
      realTimeAnalysis: true,
      skipAIFeedback: false
    };

    const testInstance = new SwingAnalysisE2ETests();
    const results = await testInstance.runCompleteTestSuite(benchmarkConfig);

    // Extract performance metrics
    const performanceResults = results.filter(r => r.testName === 'PerformanceTests')[0];
    const swingDetectionResults = results.filter(r => r.testName === 'SwingDetectionTests')[0];
    const aiResults = results.filter(r => r.testName === 'AIIntegrationTests')[0];

    const avgSwingDetectionTime = swingDetectionResults?.metrics.avgResponseTime || 0;
    const avgAIFeedbackTime = aiResults?.metrics.avgResponseTime || 0;
    const memoryUsage = performanceResults?.metrics.memoryUsage || 0;
    
    // Calculate throughput (swings per minute)
    const totalSwings = results.reduce((sum, r) => sum + r.metrics.swingsDetected, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const throughput = totalSwings > 0 ? (totalSwings / (totalDuration / 60000)) : 0;

    const recommendedOptimizations = [];
    
    if (avgSwingDetectionTime > 2000) {
      recommendedOptimizations.push('Optimize swing detection algorithms for faster processing');
    }
    
    if (avgAIFeedbackTime > 5000) {
      recommendedOptimizations.push('Implement response caching for AI feedback');
    }
    
    if (memoryUsage > 80) {
      recommendedOptimizations.push('Optimize memory usage in motion data processing');
    }
    
    if (throughput < 10) {
      recommendedOptimizations.push('Improve overall system throughput');
    }

    if (recommendedOptimizations.length === 0) {
      recommendedOptimizations.push('Performance is within acceptable ranges');
    }

    const benchmark = {
      avgSwingDetectionTime,
      avgAIFeedbackTime,
      memoryUsage,
      throughput,
      recommendedOptimizations
    };

    console.log('📊 Performance Benchmark Results:');
    console.log(`   🏌️ Avg Swing Detection: ${avgSwingDetectionTime}ms`);
    console.log(`   🤖 Avg AI Feedback: ${avgAIFeedbackTime}ms`);
    console.log(`   💾 Memory Usage: ${memoryUsage}MB`);
    console.log(`   ⚡ Throughput: ${throughput.toFixed(1)} swings/min`);
    console.log('   💡 Optimizations:', recommendedOptimizations);

    return benchmark;
  }

  /**
   * Get list of available test suites
   */
  public getAvailableTestSuites(): TestSuiteConfig[] {
    return this.testSuites;
  }

  /**
   * Get test history from previous runs
   */
  public async getTestHistory(): Promise<TestReport[]> {
    try {
      const historyJson = await AsyncStorage.getItem('e2e_test_history');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.warn('⚠️ Failed to load test history:', error);
      return [];
    }
  }

  /**
   * Clear test history
   */
  public async clearTestHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('e2e_test_history');
      console.log('✅ Test history cleared');
    } catch (error) {
      console.error('❌ Failed to clear test history:', error);
    }
  }

  // Private helper methods

  private calculateSuiteSummary(results: E2ETestResult[]) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const overallSuccess = failedTests === 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      overallSuccess
    };
  }

  private calculateOverallSummary(suiteResults: any[], executionTime: number) {
    const totalSuites = suiteResults.length;
    const successfulSuites = suiteResults.filter(s => s.summary.overallSuccess).length;
    const totalTests = suiteResults.reduce((sum, s) => sum + s.summary.totalTests, 0);
    const totalPassedTests = suiteResults.reduce((sum, s) => sum + s.summary.passedTests, 0);

    const recommendations = [];
    
    if (successfulSuites === totalSuites) {
      recommendations.push('All test suites passed - system is ready for production');
    } else {
      recommendations.push(`${totalSuites - successfulSuites} test suite(s) failed - review failing tests`);
    }

    const successRate = totalTests > 0 ? (totalPassedTests / totalTests) * 100 : 0;
    
    if (successRate > 95) {
      recommendations.push('Excellent test coverage and success rate');
    } else if (successRate > 85) {
      recommendations.push('Good test success rate - minor improvements needed');
    } else {
      recommendations.push('Test success rate needs improvement - review failing scenarios');
    }

    if (executionTime > 600000) { // 10 minutes
      recommendations.push('Consider optimizing test execution time');
    }

    return {
      totalSuites,
      successfulSuites,
      totalTests,
      totalPassedTests,
      executionTime,
      recommendations
    };
  }

  private async saveTestReport(report: TestReport): Promise<void> {
    try {
      const history = await this.getTestHistory();
      history.unshift(report); // Add latest report to beginning
      
      // Keep only last 10 reports
      const limitedHistory = history.slice(0, 10);
      
      await AsyncStorage.setItem('e2e_test_history', JSON.stringify(limitedHistory));
      console.log('💾 Test report saved to history');
      
    } catch (error) {
      console.warn('⚠️ Failed to save test report:', error);
    }
  }

  private printFinalReport(report: TestReport): void {
    console.log('\n\n🏁 FINAL E2E TEST REPORT');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📅 Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`⏱️ Total Execution Time: ${(report.overallSummary.executionTime / 1000 / 60).toFixed(1)} minutes`);
    console.log('');

    console.log('📊 OVERALL SUMMARY:');
    console.log(`   🎯 Test Suites: ${report.overallSummary.successfulSuites}/${report.overallSummary.totalSuites} passed`);
    console.log(`   🧪 Individual Tests: ${report.overallSummary.totalPassedTests}/${report.overallSummary.totalTests} passed`);
    console.log(`   📈 Success Rate: ${((report.overallSummary.totalPassedTests/report.overallSummary.totalTests)*100).toFixed(1)}%`);
    console.log('');

    console.log('📋 SUITE BREAKDOWN:');
    report.suiteResults.forEach(suite => {
      const status = suite.summary.overallSuccess ? '✅' : '❌';
      console.log(`   ${status} ${suite.suiteName}: ${suite.summary.passedTests}/${suite.summary.totalTests} (${(suite.summary.totalDuration/1000).toFixed(1)}s)`);
    });
    console.log('');

    console.log('💡 RECOMMENDATIONS:');
    report.overallSummary.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
    console.log('');

    const overallStatus = report.overallSummary.successfulSuites === report.overallSummary.totalSuites ? 'PASSED' : 'FAILED';
    const statusIcon = overallStatus === 'PASSED' ? '🎉' : '🚨';
    
    console.log(`${statusIcon} OVERALL STATUS: ${overallStatus}`);
    console.log('═══════════════════════════════════════════════════════════════');
  }
}

// Default test runner instance
export const testRunner = new E2ETestRunner();

// Convenience functions for common test scenarios
export const runSmokeTest = () => testRunner.runSmokeTest();
export const runPerformanceBenchmark = () => testRunner.runPerformanceBenchmark();
export const runAllTests = () => testRunner.runAllTestSuites();
export const runQuickTest = () => testRunner.runTestSuite('MockData_FastTest');
export const runProductionTest = () => testRunner.runTestSuite('ProductionReadiness');