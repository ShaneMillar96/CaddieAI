/**
 * E2E Test Access Component
 * 
 * Provides access to the E2E test suite from the Profile screen.
 * Only visible in development mode.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { testRunner } from '../../tests/E2ETestRunner';
import { TestReport } from '../../tests/E2ETestRunner';
import E2ETestScreen from '../../screens/E2ETestScreen';

export const E2ETestAccess: React.FC = () => {
  const [showTestScreen, setShowTestScreen] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<TestReport | null>(null);
  const [isRunningQuickTest, setIsRunningQuickTest] = useState(false);

  useEffect(() => {
    loadLastTestResult();
  }, []);

  const loadLastTestResult = async () => {
    try {
      const history = await testRunner.getTestHistory();
      if (history.length > 0) {
        setLastTestResult(history[0]);
      }
    } catch (error) {
      console.warn('Failed to load test history:', error);
    }
  };

  const runQuickSmokeTest = async () => {
    setIsRunningQuickTest(true);
    
    try {
      const result = await testRunner.runSmokeTest();
      
      Alert.alert(
        'Smoke Test Complete',
        result 
          ? '✅ All core functionality is working correctly'
          : '❌ Some core functionality failed. Check the full test suite for details.',
        [
          { text: 'OK' },
          { text: 'View Details', onPress: () => setShowTestScreen(true) }
        ]
      );
      
      await loadLastTestResult();
      
    } catch (error) {
      Alert.alert(
        'Test Error',
        `Failed to run smoke test: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsRunningQuickTest(false);
    }
  };

  const showTestOptions = () => {
    Alert.alert(
      'E2E Test Options',
      'Choose a test option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quick Smoke Test', onPress: runQuickSmokeTest },
        { text: 'Full Test Suite', onPress: () => setShowTestScreen(true) }
      ]
    );
  };

  const getLastTestStatusIcon = () => {
    if (!lastTestResult) return '🔍';
    
    const successRate = lastTestResult.overallSummary.totalTests > 0 
      ? (lastTestResult.overallSummary.totalPassedTests / lastTestResult.overallSummary.totalTests) * 100 
      : 0;
    
    if (successRate === 100) return '✅';
    if (successRate > 80) return '⚠️';
    return '❌';
  };

  const getLastTestSummary = () => {
    if (!lastTestResult) return 'No tests run yet';
    
    const { totalPassedTests, totalTests } = lastTestResult.overallSummary;
    const date = new Date(lastTestResult.timestamp).toLocaleDateString();
    
    return `${totalPassedTests}/${totalTests} passed on ${date}`;
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>E2E Test Suite</Text>
          <Text style={styles.subtitle}>System Testing & Validation</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{getLastTestStatusIcon()}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>Last Test Result</Text>
              <Text style={styles.statusSubtitle}>{getLastTestSummary()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runQuickSmokeTest}
            disabled={isRunningQuickTest}
          >
            <Icon name="speed" size={20} color="white" />
            <Text style={styles.primaryButtonText}>
              {isRunningQuickTest ? 'Running...' : 'Quick Test'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowTestScreen(true)}
          >
            <Icon name="assessment" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Full Test Suite</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description}>
          Run automated tests to validate swing analysis, AI feedback, and Garmin integration.
        </Text>
      </View>

      <Modal
        visible={showTestScreen}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTestScreen(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>E2E Test Suite</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>
          
          <E2ETestScreen />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButtonPlaceholder: {
    width: 32,
  },
});

export default E2ETestAccess;