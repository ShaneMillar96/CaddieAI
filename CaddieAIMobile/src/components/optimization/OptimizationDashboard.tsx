/**
 * Optimization Dashboard Component
 * 
 * Provides a user interface for monitoring and controlling performance optimization
 * and battery usage settings for the swing analysis system.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ProgressBarAndroid,
  ProgressViewIOS,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { swingOptimizationService } from '../../services/SwingAnalysisOptimizationService';
import { batteryMonitor } from '../../utils/BatteryMonitor';
import type { PerformanceMetrics, OptimizationRecommendation, OptimizationConfig } from '../../services/SwingAnalysisOptimizationService';
import type { BatteryState, PowerProfile } from '../../utils/BatteryMonitor';

interface OptimizationDashboardState {
  metrics: PerformanceMetrics | null;
  recommendations: OptimizationRecommendation[];
  batteryInfo: BatteryState;
  powerProfile: PowerProfile;
  config: OptimizationConfig;
  cacheStats: {
    entries: number;
    totalSize: number;
    hitRatio: number;
  };
  isLoading: boolean;
  lastUpdated: Date | null;
}

export const OptimizationDashboard: React.FC = () => {
  const [state, setState] = useState<OptimizationDashboardState>({
    metrics: null,
    recommendations: [],
    batteryInfo: { level: 1, charging: false, pluggedIn: false },
    powerProfile: batteryMonitor.getCurrentPowerProfile(),
    config: swingOptimizationService.getOptimizationReport().config,
    cacheStats: { entries: 0, totalSize: 0, hitRatio: 0 },
    isLoading: true,
    lastUpdated: null
  });

  useEffect(() => {
    loadOptimizationData();
    
    // Set up battery monitoring
    const batteryUnsubscribe = batteryMonitor.onBatteryStateChange((batteryState) => {
      setState(prev => ({
        ...prev,
        batteryInfo: batteryState,
        powerProfile: batteryMonitor.getCurrentPowerProfile()
      }));
    });

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(loadOptimizationData, 30000);

    return () => {
      batteryUnsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const loadOptimizationData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const report = swingOptimizationService.getOptimizationReport();
      const batteryState = batteryMonitor.getCurrentBatteryState();
      const powerProfile = batteryMonitor.getCurrentPowerProfile();

      setState(prev => ({
        ...prev,
        metrics: report.currentMetrics,
        recommendations: report.recommendations,
        batteryInfo: batteryState,
        powerProfile,
        config: report.config,
        cacheStats: report.cacheStats,
        isLoading: false,
        lastUpdated: new Date()
      }));

    } catch (error) {
      console.error('Failed to load optimization data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateConfiguration = async (updates: Partial<OptimizationConfig>) => {
    try {
      await swingOptimizationService.updateConfiguration(updates);
      await loadOptimizationData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update configuration');
    }
  };

  const setPowerProfile = async (profileName: keyof ReturnType<typeof batteryMonitor.getPowerProfiles>) => {
    try {
      await batteryMonitor.setPowerProfile(profileName);
      await loadOptimizationData();
    } catch (error) {
      Alert.alert('Error', 'Failed to change power profile');
    }
  };

  const resetOptimizations = () => {
    Alert.alert(
      'Reset Optimizations',
      'This will clear all cached data and reset settings to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await swingOptimizationService.resetOptimizations();
            await loadOptimizationData();
          }
        }
      ]
    );
  };

  const renderBatterySection = () => {
    const { batteryInfo, powerProfile } = state;
    const powerRecommendations = batteryMonitor.getPowerRecommendations();
    
    const batteryColor = batteryInfo.level > 0.5 ? '#34C759' : 
                        batteryInfo.level > 0.2 ? '#FF9500' : '#FF3B30';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Battery & Power Management</Text>
        
        <View style={styles.batteryContainer}>
          <View style={styles.batteryHeader}>
            <View style={styles.batteryInfo}>
              <Text style={styles.batteryLevel}>{(batteryInfo.level * 100).toFixed(1)}%</Text>
              <Text style={styles.batteryStatus}>
                {batteryInfo.charging ? '⚡ Charging' : 
                 batteryInfo.pluggedIn ? '🔌 Plugged In' : '🔋 On Battery'}
              </Text>
            </View>
            
            <View style={styles.batteryIcon}>
              <Icon 
                name={batteryInfo.charging ? 'battery-charging-full' : 'battery-std'} 
                size={32} 
                color={batteryColor} 
              />
            </View>
          </View>

          <View style={styles.progressContainer}>
            {Platform.OS === 'ios' ? (
              <ProgressViewIOS 
                progress={batteryInfo.level} 
                progressTintColor={batteryColor}
                style={styles.progressBar}
              />
            ) : (
              <ProgressBarAndroid 
                styleAttr="Horizontal" 
                progress={batteryInfo.level}
                color={batteryColor}
                style={styles.progressBar}
              />
            )}
          </View>

          <View style={styles.powerProfileContainer}>
            <Text style={styles.powerProfileLabel}>Power Profile: {powerProfile.name}</Text>
            <Text style={styles.powerProfileDescription}>{powerProfile.description}</Text>
            
            <View style={styles.powerProfileButtons}>
              {Object.entries(batteryMonitor.getPowerProfiles()).map(([key, profile]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.powerProfileButton,
                    powerProfile.name === profile.name && styles.activePowerProfile
                  ]}
                  onPress={() => setPowerProfile(key as any)}
                >
                  <Text style={[
                    styles.powerProfileButtonText,
                    powerProfile.name === profile.name && styles.activePowerProfileText
                  ]}>
                    {profile.name.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.estimatedTime}>
            Estimated Time: {powerRecommendations.estimatedTimeRemaining}
          </Text>
        </View>
      </View>
    );
  };

  const renderPerformanceSection = () => {
    const { metrics } = state;
    if (!metrics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Icon name="speed" size={24} color="#007AFF" />
            <Text style={styles.metricValue}>{metrics.avgProcessingTime.toFixed(0)}ms</Text>
            <Text style={styles.metricLabel}>Avg Processing</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="memory" size={24} color="#FF9500" />
            <Text style={styles.metricValue}>{metrics.memoryUsage.toFixed(1)}MB</Text>
            <Text style={styles.metricLabel}>Memory Usage</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="trending-up" size={24} color="#34C759" />
            <Text style={styles.metricValue}>{metrics.throughput.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Throughput/min</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Icon name="cached" size={24} color="#5856D6" />
            <Text style={styles.metricValue}>{(metrics.cacheHitRatio * 100).toFixed(0)}%</Text>
            <Text style={styles.metricLabel}>Cache Hit Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCacheSection = () => {
    const { cacheStats } = state;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Statistics</Text>
        
        <View style={styles.cacheStatsContainer}>
          <View style={styles.cacheStatRow}>
            <Text style={styles.cacheStatLabel}>Cached Entries:</Text>
            <Text style={styles.cacheStatValue}>{cacheStats.entries}</Text>
          </View>
          
          <View style={styles.cacheStatRow}>
            <Text style={styles.cacheStatLabel}>Total Size:</Text>
            <Text style={styles.cacheStatValue}>{(cacheStats.totalSize / (1024 * 1024)).toFixed(2)} MB</Text>
          </View>
          
          <View style={styles.cacheStatRow}>
            <Text style={styles.cacheStatLabel}>Hit Ratio:</Text>
            <Text style={styles.cacheStatValue}>{(cacheStats.hitRatio * 100).toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendationsSection = () => {
    const { recommendations } = state;
    
    if (recommendations.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.noRecommendations}>
            <Icon name="check-circle" size={32} color="#34C759" />
            <Text style={styles.noRecommendationsText}>
              All systems optimized! No recommendations at this time.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
        
        {recommendations.map((rec, index) => (
          <View key={index} style={[styles.recommendationCard, styles[`priority${rec.priority}`]]}>
            <View style={styles.recommendationHeader}>
              <Icon 
                name={rec.priority === 'critical' ? 'error' : 
                      rec.priority === 'high' ? 'warning' : 
                      rec.priority === 'medium' ? 'info' : 'lightbulb-outline'} 
                size={20} 
                color={rec.priority === 'critical' ? '#FF3B30' : 
                       rec.priority === 'high' ? '#FF9500' : 
                       rec.priority === 'medium' ? '#007AFF' : '#34C759'} 
              />
              <Text style={styles.recommendationCategory}>{rec.category.toUpperCase()}</Text>
              <Text style={styles.recommendationPriority}>{rec.priority}</Text>
            </View>
            
            <Text style={styles.recommendationMessage}>{rec.message}</Text>
            <Text style={styles.recommendationAction}>Action: {rec.action}</Text>
            <Text style={styles.recommendationImprovement}>
              Expected: {rec.estimatedImprovement}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderConfigurationSection = () => {
    const { config } = state;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        
        <View style={styles.configContainer}>
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Adaptive Processing</Text>
            <Switch
              value={config.enableAdaptiveProcessing}
              onValueChange={(value) => updateConfiguration({ enableAdaptiveProcessing: value })}
            />
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Intelligent Caching</Text>
            <Switch
              value={config.enableIntelligentCaching}
              onValueChange={(value) => updateConfiguration({ enableIntelligentCaching: value })}
            />
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Battery Optimization</Text>
            <Switch
              value={config.enableBatteryOptimization}
              onValueChange={(value) => updateConfiguration({ enableBatteryOptimization: value })}
            />
          </View>
          
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Background Processing</Text>
            <Switch
              value={config.enableBackgroundProcessing}
              onValueChange={(value) => updateConfiguration({ enableBackgroundProcessing: value })}
            />
          </View>
          
          <View style={styles.configValueRow}>
            <Text style={styles.configLabel}>Max Concurrent Analyses</Text>
            <Text style={styles.configValue}>{config.maxConcurrentAnalyses}</Text>
          </View>
          
          <View style={styles.configValueRow}>
            <Text style={styles.configLabel}>Processing Quality</Text>
            <Text style={styles.configValue}>{config.processingQualityMode}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.resetButton} onPress={resetOptimizations}>
          <Icon name="restore" size={20} color="white" />
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={state.isLoading}
          onRefresh={loadOptimizationData}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Performance & Battery</Text>
        <Text style={styles.subtitle}>Swing Analysis Optimization</Text>
        {state.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {state.lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {renderBatterySection()}
      {renderPerformanceSection()}
      {renderCacheSection()}
      {renderRecommendationsSection()}
      {renderConfigurationSection()}
    </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  batteryContainer: {
    gap: 16,
  },
  batteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batteryInfo: {
    flex: 1,
  },
  batteryLevel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  batteryStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  batteryIcon: {
    marginLeft: 16,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
  },
  powerProfileContainer: {
    gap: 8,
  },
  powerProfileLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  powerProfileDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  powerProfileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  powerProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activePowerProfile: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  powerProfileButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  activePowerProfileText: {
    color: 'white',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  cacheStatsContainer: {
    gap: 12,
  },
  cacheStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cacheStatLabel: {
    fontSize: 16,
    color: '#000',
  },
  cacheStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  noRecommendations: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  noRecommendationsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  prioritycritical: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#FF3B30',
  },
  priorityhigh: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9500',
  },
  prioritymedium: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#007AFF',
  },
  prioritylow: {
    backgroundColor: '#E8F5E8',
    borderLeftColor: '#34C759',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  recommendationCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  recommendationMessage: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendationImprovement: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  configContainer: {
    gap: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  configLabel: {
    fontSize: 16,
    color: '#000',
  },
  configValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OptimizationDashboard;