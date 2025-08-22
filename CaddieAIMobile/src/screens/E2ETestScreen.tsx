/**
 * E2E Test Screen Component
 * 
 * Provides a user interface for running end-to-end tests on the swing analysis system.
 * Useful for development, testing, and validating system performance.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  SafeAreaView,
} from 'react-native';
import { testRunner, E2ETestRunner } from '../tests/E2ETestRunner';
import { E2ETestConfig, E2ETestResult, TestReport } from '../tests/E2ETestRunner';

interface TestStatus {
  isRunning: boolean;
  currentTest: string;
  progress: number;
  results: E2ETestResult[] | null;
  error: string | null;
}

export const E2ETestScreen: React.FC = () => {
  const [testStatus, setTestStatus] = useState<TestStatus>({
    isRunning: false,
    currentTest: '',
    progress: 0,
    results: null,
    error: null
  });

  const [testHistory, setTestHistory] = useState<TestReport[]>([]);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [customConfig, setCustomConfig] = useState<E2ETestConfig>({
    enableGarminDevice: false,
    useMockData: true,
    performanceMonitoring: true,
    batteryMonitoring: false,
    realTimeAnalysis: true,
    skipAIFeedback: false
  });

  useEffect(() => {
    loadTestHistory();
  }, []);

  const loadTestHistory = async () => {
    try {
      const history = await testRunner.getTestHistory();
      setTestHistory(history);
    } catch (error) {
      console.warn('Failed to load test history:', error);
    }
  };

  const runTest = async (testType: 'smoke' | 'performance' | 'all' | 'quick' | 'production' | 'custom') => {
    setTestStatus({
      isRunning: true,
      currentTest: testType,
      progress: 0,
      results: null,
      error: null
    });

    try {
      let results: E2ETestResult[] | TestReport | boolean;

      switch (testType) {
        case 'smoke':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running Smoke Test...' }));
          const smokeResult = await testRunner.runSmokeTest();
          results = [{
            testName: 'SmokeTest',
            success: smokeResult,
            duration: 0,
            errors: smokeResult ? [] : ['Smoke test failed'],
            metrics: {
              swingsDetected: 0,
              analysisAccuracy: smokeResult ? 100 : 0,
              avgResponseTime: 0
            },
            recommendations: smokeResult ? ['System passed smoke test'] : ['Review system configuration']
          }];
          break;

        case 'performance':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running Performance Benchmark...' }));
          const perfResult = await testRunner.runPerformanceBenchmark();
          results = [{
            testName: 'PerformanceBenchmark',
            success: perfResult.recommendedOptimizations.includes('Performance is within acceptable ranges'),
            duration: 0,
            errors: [],
            metrics: {
              swingsDetected: 0,
              analysisAccuracy: 100,
              avgResponseTime: perfResult.avgSwingDetectionTime,
              memoryUsage: perfResult.memoryUsage
            },
            recommendations: perfResult.recommendedOptimizations
          }];
          break;

        case 'all':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running All Test Suites...' }));
          const allResults = await testRunner.runAllTestSuites();
          results = allResults;
          break;

        case 'quick':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running Quick Test...' }));
          results = await testRunner.runTestSuite('MockData_FastTest');
          break;

        case 'production':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running Production Readiness Test...' }));
          results = await testRunner.runTestSuite('ProductionReadiness');
          break;

        case 'custom':
          setTestStatus(prev => ({ ...prev, currentTest: 'Running Custom Configuration...' }));
          results = await testRunner.runCustomTest(customConfig, 'Custom Test Configuration');
          break;

        default:
          throw new Error('Unknown test type');
      }

      setTestStatus(prev => ({
        ...prev,
        isRunning: false,
        results: Array.isArray(results) ? results : (results as TestReport).suiteResults.flatMap(s => s.results),
        progress: 100
      }));

      // Reload test history after completion
      await loadTestHistory();

    } catch (error) {
      setTestStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        progress: 0
      }));
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear Test History',
      'Are you sure you want to clear all test history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await testRunner.clearTestHistory();
            setTestHistory([]);
          }
        }
      ]
    );
  };

  const renderTestButton = (
    title: string,
    description: string,
    testType: 'smoke' | 'performance' | 'all' | 'quick' | 'production' | 'custom',
    color: string = '#007AFF'
  ) => (
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: color }]}
      onPress={() => runTest(testType)}
      disabled={testStatus.isRunning}
    >
      <Text style={styles.testButtonTitle}>{title}</Text>
      <Text style={styles.testButtonDescription}>{description}</Text>
    </TouchableOpacity>
  );

  const renderTestResults = () => {
    if (!testStatus.results) return null;

    const totalTests = testStatus.results.length;
    const passedTests = testStatus.results.filter(r => r.success).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results</Text>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {passedTests}/{totalTests} tests passed ({successRate.toFixed(1)}%)
          </Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: successRate === 100 ? '#34C759' : successRate > 80 ? '#FF9500' : '#FF3B30' }
          ]}>
            <Text style={styles.statusText}>
              {successRate === 100 ? 'PASS' : successRate > 80 ? 'WARN' : 'FAIL'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.resultsList}>
          {testStatus.results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={[
                  styles.resultTitle,
                  { color: result.success ? '#34C759' : '#FF3B30' }
                ]}>
                  {result.success ? '✅' : '❌'} {result.testName}
                </Text>
                <Text style={styles.resultDuration}>
                  {(result.duration / 1000).toFixed(1)}s
                </Text>
              </View>

              {result.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  {result.errors.map((error, errorIndex) => (
                    <Text key={errorIndex} style={styles.errorText}>
                      ⚠️ {error}
                    </Text>
                  ))}
                </View>
              )}

              {result.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  {result.recommendations.map((rec, recIndex) => (
                    <Text key={recIndex} style={styles.recommendationText}>
                      💡 {rec}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.metricsContainer}>
                <Text style={styles.metricText}>
                  Swings: {result.metrics.swingsDetected}
                </Text>
                <Text style={styles.metricText}>
                  Accuracy: {result.metrics.analysisAccuracy.toFixed(1)}%
                </Text>
                <Text style={styles.metricText}>
                  Avg Time: {result.metrics.avgResponseTime.toFixed(0)}ms
                </Text>
                {result.metrics.memoryUsage && (
                  <Text style={styles.metricText}>
                    Memory: {result.metrics.memoryUsage.toFixed(1)}MB
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCustomConfigModal = () => (
    <Modal
      visible={showCustomConfig}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCustomConfig(false)}>
            <Text style={styles.modalCloseButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Custom Test Configuration</Text>
          <TouchableOpacity onPress={() => {
            setShowCustomConfig(false);
            runTest('custom');
          }}>
            <Text style={styles.modalRunButton}>Run</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.configContainer}>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Enable Garmin Device</Text>
            <Switch
              value={customConfig.enableGarminDevice}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, enableGarminDevice: value }))}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Use Mock Data</Text>
            <Switch
              value={customConfig.useMockData}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, useMockData: value }))}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Performance Monitoring</Text>
            <Switch
              value={customConfig.performanceMonitoring}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, performanceMonitoring: value }))}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Battery Monitoring</Text>
            <Switch
              value={customConfig.batteryMonitoring}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, batteryMonitoring: value }))}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Real-time Analysis</Text>
            <Switch
              value={customConfig.realTimeAnalysis}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, realTimeAnalysis: value }))}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Skip AI Feedback</Text>
            <Switch
              value={customConfig.skipAIFeedback}
              onValueChange={(value) => setCustomConfig(prev => ({ ...prev, skipAIFeedback: value }))}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderTestHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Test History</Text>
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.historyList}>
        {testHistory.length === 0 ? (
          <Text style={styles.noHistoryText}>No test history available</Text>
        ) : (
          testHistory.map((report, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(report.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.historySummary}>
                {report.overallSummary.totalPassedTests}/{report.overallSummary.totalTests} tests passed
              </Text>
              <Text style={styles.historyDuration}>
                {(report.overallSummary.executionTime / 1000 / 60).toFixed(1)} min
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>E2E Test Suite</Text>
        <Text style={styles.subtitle}>Swing Analysis System Testing</Text>
      </View>

      <ScrollView style={styles.content}>
        {testStatus.isRunning && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.progressText}>{testStatus.currentTest}</Text>
          </View>
        )}

        {testStatus.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Test Error</Text>
            <Text style={styles.errorMessage}>{testStatus.error}</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          {renderTestButton(
            'Smoke Test',
            'Quick validation of core functionality',
            'smoke',
            '#34C759'
          )}

          {renderTestButton(
            'Performance Test',
            'Benchmark system performance and memory usage',
            'performance',
            '#FF9500'
          )}

          {renderTestButton(
            'Quick Test',
            'Fast test using mock data only',
            'quick',
            '#007AFF'
          )}

          {renderTestButton(
            'Production Test',
            'Complete production readiness validation',
            'production',
            '#5856D6'
          )}

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#8E8E93' }]}
            onPress={() => setShowCustomConfig(true)}
            disabled={testStatus.isRunning}
          >
            <Text style={styles.testButtonTitle}>Custom Test</Text>
            <Text style={styles.testButtonDescription}>Configure custom test parameters</Text>
          </TouchableOpacity>

          {renderTestButton(
            'Full Test Suite',
            'Run all test suites (may take 10+ minutes)',
            'all',
            '#FF3B30'
          )}
        </View>

        {renderTestResults()}
        {renderTestHistory()}
      </ScrollView>

      {renderCustomConfigModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
  },
  progressText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  testButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  testButtonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultDuration: {
    fontSize: 12,
    color: '#8E8E93',
  },
  errorsContainer: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 2,
  },
  recommendationsContainer: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricText: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyList: {
    maxHeight: 200,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    flex: 2,
  },
  historySummary: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  historyDuration: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    color: '#8E8E93',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalRunButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  configContainer: {
    flex: 1,
    padding: 16,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 16,
    color: '#333',
  },
});

export default E2ETestScreen;