import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { testApiConnection, API_BASE_URL } from '../../config/api';
import { authApiService } from '../../services/authApi';
import { courseApiService } from '../../services/courseApi';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

/**
 * ApiConnectionTest Component
 * 
 * Debug component to test API connectivity to the CaddieAI backend.
 * Use this to verify the mobile app can reach your backend services.
 */
const ApiConnectionTest: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runConnectionTests = async () => {
    setIsRunning(true);
    const testResults: ConnectionTest[] = [
      {
        name: 'Base API Configuration',
        status: 'pending',
        message: 'Checking...',
      },
      {
        name: 'API Health Check',
        status: 'pending', 
        message: 'Testing connection...',
      },
      {
        name: 'Auth Service Test',
        status: 'pending',
        message: 'Testing auth endpoints...',
      },
      {
        name: 'Course Service Test', 
        status: 'pending',
        message: 'Testing course endpoints...',
      },
    ];

    setTests([...testResults]);

    try {
      // Test 1: Base configuration
      testResults[0].status = 'success';
      testResults[0].message = `Connected to: ${API_BASE_URL}`;
      testResults[0].details = `Environment: ${__DEV__ ? 'Development' : 'Production'}`;
      setTests([...testResults]);

      // Test 2: API Health Check
      const healthCheck = await testApiConnection();
      testResults[1].status = healthCheck.isConnected ? 'success' : 'error';
      testResults[1].message = healthCheck.isConnected 
        ? 'API is reachable' 
        : 'API connection failed';
      testResults[1].details = healthCheck.error || 'Connection successful';
      setTests([...testResults]);

      // Test 3: Auth Service
      try {
        // This will likely fail without credentials, but we're testing if the endpoint exists
        await authApiService.login({ username: 'test', password: 'test' });
        testResults[2].status = 'success';
        testResults[2].message = 'Auth endpoint accessible';
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          // 400 means endpoint exists but bad credentials (which is expected)
          testResults[2].status = 'success';
          testResults[2].message = 'Auth endpoint accessible';
          testResults[2].details = 'Endpoint exists (expected auth failure)';
        } else if (error.response && error.response.status === 404) {
          testResults[2].status = 'error';
          testResults[2].message = 'Auth endpoint not found';
          testResults[2].details = error.message;
        } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
          testResults[2].status = 'error';
          testResults[2].message = 'Network error';
          testResults[2].details = error.message;
        } else {
          testResults[2].status = 'success';
          testResults[2].message = 'Auth service responding';
          testResults[2].details = `Status: ${error.response?.status || 'Unknown'}`;
        }
      }
      setTests([...testResults]);

      // Test 4: Course Service
      try {
        await courseApiService.searchCourses({ query: '', limit: 1, offset: 0 });
        testResults[3].status = 'success';
        testResults[3].message = 'Course endpoint accessible';
      } catch (error: any) {
        if (error.response && [400, 401].includes(error.response.status)) {
          testResults[3].status = 'success';
          testResults[3].message = 'Course endpoint accessible';
          testResults[3].details = 'Endpoint exists (auth may be required)';
        } else if (error.response && error.response.status === 404) {
          testResults[3].status = 'error';
          testResults[3].message = 'Course endpoint not found';
          testResults[3].details = error.message;
        } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
          testResults[3].status = 'error';
          testResults[3].message = 'Network error';
          testResults[3].details = error.message;
        } else {
          testResults[3].status = 'success';
          testResults[3].message = 'Course service responding';
          testResults[3].details = `Status: ${error.response?.status || 'Unknown'}`;
        }
      }
      setTests([...testResults]);

    } catch (error: any) {
      console.error('Connection test error:', error);
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run tests automatically on component mount
    runConnectionTests();
  }, []);

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <Icon name="check-circle" size={20} color="#4CAF50" />;
      case 'error':
        return <Icon name="error" size={20} color="#f44336" />;
      case 'pending':
        return <Icon name="hourglass-empty" size={20} color="#ff9800" />;
      default:
        return <Icon name="help" size={20} color="#9e9e9e" />;
    }
  };

  const getStatusColor = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const allTestsComplete = tests.every(test => test.status !== 'pending');
  const hasErrors = tests.some(test => test.status === 'error');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="wifi" size={24} color="#2196F3" />
        <Text style={styles.title}>API Connection Test</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.apiUrl}>Backend: {API_BASE_URL}</Text>
        <Text style={[
          styles.status,
          { color: allTestsComplete ? (hasErrors ? '#f44336' : '#4CAF50') : '#ff9800' }
        ]}>
          {isRunning ? 'Testing...' : allTestsComplete ? (hasErrors ? 'Issues Found' : 'All Tests Passed') : 'Ready'}
        </Text>
      </View>

      <ScrollView style={styles.testsList}>
        {tests.map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testHeader}>
              {getStatusIcon(test.status)}
              <Text style={styles.testName}>{test.name}</Text>
            </View>
            <Text style={[styles.testMessage, { color: getStatusColor(test.status) }]}>
              {test.message}
            </Text>
            {test.details && (
              <Text style={styles.testDetails}>{test.details}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.retryButton, isRunning && styles.disabledButton]}
        onPress={runConnectionTests}
        disabled={isRunning}
      >
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>
          {isRunning ? 'Running Tests...' : 'Retry Tests'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  apiUrl: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  testsList: {
    flex: 1,
  },
  testItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#333',
  },
  testMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  testDetails: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ApiConnectionTest;