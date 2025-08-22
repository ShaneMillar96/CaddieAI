/**
 * Optimization Access Component
 * 
 * Provides access to the performance optimization dashboard from the Profile screen.
 * Shows current optimization status and quick controls.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { swingOptimizationService } from '../../services/SwingAnalysisOptimizationService';
import { batteryMonitor } from '../../utils/BatteryMonitor';
import OptimizationDashboard from './OptimizationDashboard';
import type { PerformanceMetrics } from '../../services/SwingAnalysisOptimizationService';
import type { BatteryState } from '../../utils/BatteryMonitor';

export const OptimizationAccess: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [batteryState, setBatteryState] = useState<BatteryState>({ level: 1, charging: false, pluggedIn: false });
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOptimized, setIsOptimized] = useState(true);

  useEffect(() => {
    updateOptimizationStatus();
    
    // Set up battery monitoring
    const batteryUnsubscribe = batteryMonitor.onBatteryStateChange((newBatteryState) => {
      setBatteryState(newBatteryState);
      updateOptimizationStatus();
    });

    // Update status every 30 seconds
    const updateInterval = setInterval(updateOptimizationStatus, 30000);

    return () => {
      batteryUnsubscribe();
      clearInterval(updateInterval);
    };
  }, []);

  const updateOptimizationStatus = () => {
    try {
      const report = swingOptimizationService.getOptimizationReport();
      const currentBatteryState = batteryMonitor.getCurrentBatteryState();
      
      setMetrics(report.currentMetrics);
      setBatteryState(currentBatteryState);
      
      // Determine if system is well optimized (no high priority recommendations)
      const hasHighPriorityIssues = report.recommendations.some(
        rec => rec.priority === 'critical' || rec.priority === 'high'
      );
      setIsOptimized(!hasHighPriorityIssues);
      
    } catch (error) {
      console.warn('Failed to update optimization status:', error);
    }
  };

  const getStatusIcon = () => {
    if (batteryState.level < 0.2) return '🔋'; // Low battery
    if (!isOptimized) return '⚠️'; // Optimization needed
    if (metrics && metrics.avgProcessingTime > 3000) return '🐌'; // Slow performance
    return '✅'; // All good
  };

  const getStatusText = () => {
    if (batteryState.level < 0.2) return 'Low Battery - Power Save Active';
    if (!isOptimized) return 'Optimization Needed';
    if (metrics && metrics.avgProcessingTime > 3000) return 'Performance Could Be Better';
    return 'System Optimized';
  };

  const getPerformanceSummary = () => {
    if (!metrics) return 'Loading metrics...';
    
    const avgTime = metrics.avgProcessingTime;
    const memoryUsage = metrics.memoryUsage;
    
    return `${avgTime.toFixed(0)}ms avg • ${memoryUsage.toFixed(1)}MB memory`;
  };

  const getBatteryColor = () => {
    if (batteryState.level > 0.5) return '#34C759';
    if (batteryState.level > 0.2) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Performance & Battery</Text>
          <Text style={styles.subtitle}>System Optimization</Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>{getStatusText()}</Text>
              <Text style={styles.statusDetails}>{getPerformanceSummary()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStat}>
            <Icon name="battery-std" size={20} color={getBatteryColor()} />
            <Text style={[styles.quickStatValue, { color: getBatteryColor() }]}>
              {(batteryState.level * 100).toFixed(0)}%
            </Text>
            <Text style={styles.quickStatLabel}>
              {batteryState.charging ? 'Charging' : 'Battery'}
            </Text>
          </View>

          <View style={styles.quickStat}>
            <Icon name="speed" size={20} color="#007AFF" />
            <Text style={styles.quickStatValue}>
              {metrics ? `${metrics.avgProcessingTime.toFixed(0)}ms` : '---'}
            </Text>
            <Text style={styles.quickStatLabel}>Avg Speed</Text>
          </View>

          <View style={styles.quickStat}>
            <Icon name="memory" size={20} color="#FF9500" />
            <Text style={styles.quickStatValue}>
              {metrics ? `${metrics.memoryUsage.toFixed(1)}MB` : '---'}
            </Text>
            <Text style={styles.quickStatLabel}>Memory</Text>
          </View>

          <View style={styles.quickStat}>
            <Icon name="cached" size={20} color="#5856D6" />
            <Text style={styles.quickStatValue}>
              {metrics ? `${(metrics.cacheHitRatio * 100).toFixed(0)}%` : '---'}
            </Text>
            <Text style={styles.quickStatLabel}>Cache</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => setShowDashboard(true)}
        >
          <Icon name="dashboard" size={20} color="white" />
          <Text style={styles.dashboardButtonText}>Open Optimization Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.description}>
          Monitor performance metrics, battery usage, and system optimization settings.
        </Text>
      </View>

      <Modal
        visible={showDashboard}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDashboard(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Optimization Dashboard</Text>
            <View style={styles.closeButtonPlaceholder} />
          </View>
          
          <OptimizationDashboard />
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
  statusDetails: {
    fontSize: 12,
    color: '#666',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  dashboardButtonText: {
    color: 'white',
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

export default OptimizationAccess;