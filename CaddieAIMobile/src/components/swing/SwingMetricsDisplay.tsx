import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { DetailedSwingMetrics } from '../../services/SwingMetricsService';
import { PatternMatchResult } from '../../services/SwingPatternService';

export interface SwingMetricsDisplayProps {
  metrics: DetailedSwingMetrics;
  patternMatch?: PatternMatchResult;
  showAdvanced?: boolean;
  compact?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  progress?: number; // 0-100 for progress indicator
  benchmark?: number; // Reference value for comparison
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  progress,
  benchmark,
  trend,
  subtitle,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress || 0,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const getProgressColor = () => {
    if (!progress) return '#e0e0e0';
    if (progress >= 80) return '#4caf50';
    if (progress >= 60) return '#ff9800';
    return '#f44336';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'trending-flat';
      default: return null;
    }
  };

  const formatValue = () => {
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(1);
    }
    return value;
  };

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle}>{title}</Text>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </View>
        {trend && (
          <Icon 
            name={getTrendIcon()!} 
            size={16} 
            color={trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#666'} 
          />
        )}
      </View>
      
      <View style={styles.metricValue}>
        <Text style={styles.valueText}>
          {formatValue()}
          {unit && <Text style={styles.unitText}> {unit}</Text>}
        </Text>
        
        {benchmark && (
          <Text style={styles.benchmarkText}>
            vs {benchmark}{unit} avg
          </Text>
        )}
      </View>
      
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: animatedValue.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: getProgressColor(),
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

export const SwingMetricsDisplay: React.FC<SwingMetricsDisplayProps> = ({
  metrics,
  patternMatch,
  showAdvanced = false,
  compact = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'power' | 'timing' | 'control' | 'efficiency'>('power');

  const calculateEfficiencyScore = (metric: number, ideal: number, tolerance: number = 0.2): number => {
    const deviation = Math.abs(metric - ideal) / ideal;
    return Math.max(0, Math.min(100, (1 - deviation / tolerance) * 100));
  };

  const getPowerMetrics = (): MetricCardProps[] => [
    {
      title: 'Clubhead Speed',
      value: Math.round(metrics.clubheadSpeed),
      unit: 'mph',
      icon: 'speed',
      color: '#f44336',
      progress: Math.min(100, (metrics.clubheadSpeed / 120) * 100),
      benchmark: 95,
      trend: metrics.clubheadSpeed > 95 ? 'up' : 'down',
    },
    {
      title: 'Peak Acceleration',
      value: metrics.maxSpeed.toFixed(1),
      unit: 'm/s²',
      icon: 'flash-on',
      color: '#ff9800',
      progress: Math.min(100, (metrics.maxSpeed / 20) * 100),
      benchmark: 15,
    },
    {
      title: 'Power Transfer',
      value: Math.round(metrics.powerTransfer),
      unit: '%',
      icon: 'battery-charging-full',
      color: '#4caf50',
      progress: metrics.powerTransfer,
      benchmark: 85,
      subtitle: 'Energy efficiency',
    },
    {
      title: 'Impact Force',
      value: Math.round(metrics.impactForce),
      unit: 'N',
      icon: 'gps-fixed',
      color: '#9c27b0',
      progress: Math.min(100, (metrics.impactForce / 500) * 100),
      benchmark: 350,
    },
  ];

  const getTimingMetrics = (): MetricCardProps[] => [
    {
      title: 'Swing Tempo',
      value: metrics.swingTempo.toFixed(1),
      unit: ':1',
      icon: 'timer',
      color: '#2196f3',
      progress: calculateEfficiencyScore(metrics.swingTempo, 3.0, 0.3),
      benchmark: 3.0,
      trend: metrics.swingTempo > 3.2 ? 'up' : metrics.swingTempo < 2.8 ? 'down' : 'stable',
      subtitle: 'Backswing:Downswing ratio',
    },
    {
      title: 'Backswing Time',
      value: Math.round(metrics.backswingDuration),
      unit: 'ms',
      icon: 'rotate-left',
      color: '#ff9800',
      progress: calculateEfficiencyScore(metrics.backswingDuration, 800, 0.25),
      benchmark: 800,
    },
    {
      title: 'Downswing Time',
      value: Math.round(metrics.downswingDuration),
      unit: 'ms',
      icon: 'rotate-right',
      color: '#f44336',
      progress: calculateEfficiencyScore(metrics.downswingDuration, 250, 0.3),
      benchmark: 250,
    },
    {
      title: 'Rhythm Score',
      value: Math.round(metrics.rhythmScore),
      unit: '%',
      icon: 'music-note',
      color: '#9c27b0',
      progress: metrics.rhythmScore,
      benchmark: 85,
      subtitle: 'Timing consistency',
    },
  ];

  const getControlMetrics = (): MetricCardProps[] => [
    {
      title: 'Swing Consistency',
      value: Math.round(metrics.swingConsistency),
      unit: '%',
      icon: 'track-changes',
      color: '#4caf50',
      progress: metrics.swingConsistency,
      benchmark: 80,
      subtitle: 'Motion smoothness',
    },
    {
      title: 'Balance Score',
      value: Math.round(metrics.balanceScore),
      unit: '%',
      icon: 'accessibility',
      color: '#2196f3',
      progress: metrics.balanceScore,
      benchmark: 85,
      subtitle: 'Stability throughout swing',
    },
    {
      title: 'Path Deviation',
      value: metrics.pathDeviation.toFixed(1),
      unit: '°',
      icon: 'my-location',
      color: '#ff9800',
      progress: Math.max(0, 100 - (metrics.pathDeviation / 15) * 100),
      benchmark: 5,
      trend: metrics.pathDeviation < 8 ? 'up' : 'down',
    },
    {
      title: 'Face Angle',
      value: metrics.faceAngleAtImpact.toFixed(1),
      unit: '°',
      icon: 'straighten',
      color: '#9c27b0',
      progress: Math.max(0, 100 - (Math.abs(metrics.faceAngleAtImpact) / 10) * 100),
      benchmark: 0,
      subtitle: 'Club face at impact',
    },
  ];

  const getEfficiencyMetrics = (): MetricCardProps[] => [
    {
      title: 'Overall Efficiency',
      value: Math.round((metrics.powerTransfer + metrics.balanceScore + metrics.swingConsistency) / 3),
      unit: '%',
      icon: 'eco',
      color: '#4caf50',
      progress: (metrics.powerTransfer + metrics.balanceScore + metrics.swingConsistency) / 3,
      benchmark: 85,
      subtitle: 'Combined performance',
    },
    {
      title: 'Energy Generation',
      value: Math.round(metrics.energyGeneration),
      unit: 'J',
      icon: 'flash-on',
      color: '#ff9800',
      progress: Math.min(100, (metrics.energyGeneration / 1000) * 100),
      benchmark: 750,
    },
    {
      title: 'Attack Angle',
      value: metrics.attackAngle.toFixed(1),
      unit: '°',
      icon: 'trending-down',
      color: '#2196f3',
      progress: calculateEfficiencyScore(Math.abs(metrics.attackAngle), 3, 0.5),
      benchmark: -3,
      subtitle: 'Angle of approach',
    },
    {
      title: 'Control Factor',
      value: Math.round(metrics.controlFactor),
      unit: '%',
      icon: 'tune',
      color: '#9c27b0',
      progress: metrics.controlFactor,
      benchmark: 80,
      subtitle: 'Precision rating',
    },
  ];

  const getCurrentMetrics = (): MetricCardProps[] => {
    switch (selectedCategory) {
      case 'power': return getPowerMetrics();
      case 'timing': return getTimingMetrics();
      case 'control': return getControlMetrics();
      case 'efficiency': return getEfficiencyMetrics();
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      {[
        { key: 'power', label: 'Power', icon: 'flash-on' },
        { key: 'timing', label: 'Timing', icon: 'timer' },
        { key: 'control', label: 'Control', icon: 'tune' },
        { key: 'efficiency', label: 'Efficiency', icon: 'eco' },
      ].map((category) => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.categoryButton,
            selectedCategory === category.key && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(category.key as any)}
        >
          <Icon 
            name={category.icon} 
            size={16} 
            color={selectedCategory === category.key ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.key && styles.categoryButtonTextActive
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPatternMatchSummary = () => {
    if (!patternMatch) return null;

    return (
      <View style={styles.patternSummary}>
        <View style={styles.patternHeader}>
          <Icon name="pattern" size={20} color="#2c5530" />
          <Text style={styles.patternTitle}>Pattern Analysis</Text>
        </View>
        
        <View style={styles.patternMetrics}>
          <View style={styles.patternMetric}>
            <Text style={styles.patternLabel}>Template Match</Text>
            <View style={styles.patternValueContainer}>
              <Text style={[
                styles.patternValue,
                { color: patternMatch.overallMatch >= 80 ? '#4caf50' : 
                         patternMatch.overallMatch >= 60 ? '#ff9800' : '#f44336' }
              ]}>
                {patternMatch.overallMatch}%
              </Text>
            </View>
          </View>
          
          <View style={styles.patternMetric}>
            <Text style={styles.patternLabel}>Template</Text>
            <Text style={styles.patternTemplateName}>{patternMatch.templateName}</Text>
          </View>
        </View>

        {patternMatch.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
            {patternMatch.recommendations.slice(0, 2).map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>
                • {rec}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCompactView = () => {
    const keyMetrics = [
      {
        title: 'Speed',
        value: `${Math.round(metrics.clubheadSpeed)} mph`,
        color: '#f44336',
        progress: Math.min(100, (metrics.clubheadSpeed / 120) * 100),
      },
      {
        title: 'Tempo',
        value: `${metrics.swingTempo.toFixed(1)}:1`,
        color: '#2196f3',
        progress: calculateEfficiencyScore(metrics.swingTempo, 3.0, 0.3),
      },
      {
        title: 'Control',
        value: `${Math.round(metrics.balanceScore)}%`,
        color: '#4caf50',
        progress: metrics.balanceScore,
      },
    ];

    return (
      <View style={styles.compactContainer}>
        {keyMetrics.map((metric, index) => (
          <View key={index} style={styles.compactMetric}>
            <Text style={styles.compactTitle}>{metric.title}</Text>
            <Text style={[styles.compactValue, { color: metric.color }]}>
              {metric.value}
            </Text>
            <View style={styles.compactProgress}>
              <View 
                style={[
                  styles.compactProgressBar,
                  { 
                    width: `${metric.progress}%`,
                    backgroundColor: metric.color,
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (compact) {
    return renderCompactView();
  }

  return (
    <View style={styles.container}>
      {renderPatternMatchSummary()}
      {!showAdvanced && renderCategorySelector()}
      
      <ScrollView 
        style={styles.metricsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsGrid}>
          {getCurrentMetrics().map((metric, index) => (
            <MetricCard key={`${selectedCategory}-${index}`} {...metric} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#2c5530',
  },
  categoryButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  metricsContainer: {
    maxHeight: 400,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
  },
  metricSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  benchmarkText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    minWidth: 32,
    textAlign: 'right',
  },
  patternSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patternMetric: {
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  patternValueContainer: {
    alignItems: 'center',
  },
  patternValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  patternTemplateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
  },
  recommendations: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    gap: 16,
  },
  compactMetric: {
    flex: 1,
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  compactProgress: {
    width: '100%',
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  compactProgressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default SwingMetricsDisplay;