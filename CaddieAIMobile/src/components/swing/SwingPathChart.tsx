import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// Temporarily disable victory-native components due to import issues
// import {
//   VictoryChart,
//   VictoryLine,
//   VictoryArea,
//   VictoryAxis,
//   VictoryTheme,
//   VictoryTooltip,
//   VictoryScatter,
//   VictoryLabel,
//   VictoryContainer,
// } from 'victory-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { LinearMetrics } from '../../services/SwingMetricsService';
import { PatternMatchResult } from '../../services/SwingPatternService';

export interface SwingPathChartProps {
  swingData: LinearMetrics;
  patternData?: PatternMatchResult;
  width: number;
  height: number;
  showIdealComparison?: boolean;
  interactive?: boolean;
}

type ChartMode = 'acceleration' | 'velocity' | 'path';

export const SwingPathChart: React.FC<SwingPathChartProps> = ({
  swingData,
  patternData,
  width,
  height,
  showIdealComparison = true,
  interactive = true,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('acceleration');
  const [showIdeal, setShowIdeal] = useState(showIdealComparison);

  // Process swing data for visualization
  const processSwingData = () => {
    const timePoints = swingData.xAcceleration.map((_, index) => index * 20); // 20ms intervals
    
    let actualData: Array<{x: number, y: number}> = [];
    let idealData: Array<{x: number, y: number}> = [];

    switch (chartMode) {
      case 'acceleration':
        actualData = swingData.resultantPath.map((value, index) => ({
          x: timePoints[index],
          y: value
        }));
        idealData = generateIdealAccelerationPath(timePoints);
        break;
        
      case 'velocity':
        // Calculate velocity from acceleration (simplified integration)
        let velocity = 0;
        actualData = swingData.resultantPath.map((acceleration, index) => {
          velocity += (acceleration - 9.81) * 0.02; // Remove gravity, integrate with dt=0.02s
          return {
            x: timePoints[index],
            y: Math.max(0, velocity) // Velocity should be positive for golf swing
          };
        });
        idealData = generateIdealVelocityPath(timePoints);
        break;
        
      case 'path':
        // 3D swing path projection (X-Z plane)
        actualData = swingData.xAcceleration.map((x, index) => ({
          x: x * 10, // Scale for visualization
          y: swingData.zAcceleration[index] - 9.81 // Remove gravity
        }));
        idealData = generateIdealSwingPath();
        break;
    }

    return { actualData, idealData };
  };

  const generateIdealAccelerationPath = (timePoints: number[]) => {
    return timePoints.map((time) => {
      const t = time / timePoints[timePoints.length - 1]; // Normalize time 0-1
      let idealAccel = 9.81; // Base gravity
      
      if (t < 0.6) {
        // Backswing - gradual acceleration increase
        idealAccel += Math.sin(t / 0.6 * Math.PI) * 4;
      } else if (t < 0.8) {
        // Downswing - rapid acceleration
        const downswingProgress = (t - 0.6) / 0.2;
        idealAccel += 4 + Math.sin(downswingProgress * Math.PI) * 12;
      } else {
        // Follow-through - deceleration
        const followProgress = (t - 0.8) / 0.2;
        idealAccel += 16 * (1 - followProgress) + Math.sin(followProgress * Math.PI) * 6;
      }
      
      return { x: time, y: idealAccel };
    });
  };

  const generateIdealVelocityPath = (timePoints: number[]) => {
    return timePoints.map((time) => {
      const t = time / timePoints[timePoints.length - 1];
      let velocity = 0;
      
      if (t < 0.6) {
        // Gradual velocity increase in backswing
        velocity = Math.sin(t / 0.6 * Math.PI * 0.5) * 2;
      } else if (t < 0.8) {
        // Rapid velocity increase in downswing
        const downswingProgress = (t - 0.6) / 0.2;
        velocity = 2 + Math.sin(downswingProgress * Math.PI) * 8;
      } else {
        // Velocity decrease in follow-through
        const followProgress = (t - 0.8) / 0.2;
        velocity = 10 * (1 - followProgress * 0.7);
      }
      
      return { x: time, y: Math.max(0, velocity) };
    });
  };

  const generateIdealSwingPath = () => {
    // Generate ideal swing path in X-Z plane
    const points: Array<{x: number, y: number}> = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = (t - 0.5) * Math.PI; // -π/2 to π/2
      points.push({
        x: Math.sin(angle) * 30, // 30 unit radius
        y: Math.cos(angle) * 20 - 5 // Elliptical path
      });
    }
    return points;
  };

  const { actualData, idealData } = processSwingData();

  const getYAxisLabel = () => {
    switch (chartMode) {
      case 'acceleration': return 'Acceleration (m/s²)';
      case 'velocity': return 'Velocity (m/s)';
      case 'path': return 'Z Position';
    }
  };

  const getXAxisLabel = () => {
    switch (chartMode) {
      case 'acceleration':
      case 'velocity': 
        return 'Time (ms)';
      case 'path': 
        return 'X Position';
    }
  };

  const getChartTitle = () => {
    switch (chartMode) {
      case 'acceleration': return 'Swing Acceleration Profile';
      case 'velocity': return 'Swing Velocity Profile';
      case 'path': return 'Swing Path (Side View)';
    }
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          chartMode === 'acceleration' && styles.modeButtonActive
        ]}
        onPress={() => setChartMode('acceleration')}
      >
        <Text style={[
          styles.modeButtonText,
          chartMode === 'acceleration' && styles.modeButtonTextActive
        ]}>
          Acceleration
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.modeButton,
          chartMode === 'velocity' && styles.modeButtonActive
        ]}
        onPress={() => setChartMode('velocity')}
      >
        <Text style={[
          styles.modeButtonText,
          chartMode === 'velocity' && styles.modeButtonTextActive
        ]}>
          Velocity
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.modeButton,
          chartMode === 'path' && styles.modeButtonActive
        ]}
        onPress={() => setChartMode('path')}
      >
        <Text style={[
          styles.modeButtonText,
          chartMode === 'path' && styles.modeButtonTextActive
        ]}>
          Path
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartControls = () => (
    <View style={styles.chartControls}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setShowIdeal(!showIdeal)}
      >
        <Icon 
          name={showIdeal ? 'visibility' : 'visibility-off'} 
          size={20} 
          color={showIdeal ? '#2c5530' : '#666'} 
        />
        <Text style={[
          styles.controlButtonText,
          { color: showIdeal ? '#2c5530' : '#666' }
        ]}>
          Ideal Comparison
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSwingPhaseMarkers = () => {
    if (chartMode === 'path') return null;
    
    const totalTime = actualData[actualData.length - 1]?.x || 1000;
    const markers = [
      { phase: 'Backswing', time: totalTime * 0.6, color: '#ff9800' },
      { phase: 'Impact', time: totalTime * 0.75, color: '#f44336' },
      { phase: 'Follow Through', time: totalTime * 0.9, color: '#4caf50' }
    ];

    return (
      <View style={styles.phaseMarkers}>
        {markers.map((marker, index) => (
          <View key={marker.phase} style={styles.phaseMarker}>
            <View style={[styles.phaseIndicator, { backgroundColor: marker.color }]} />
            <Text style={styles.phaseText}>{marker.phase}</Text>
            <Text style={styles.phaseTime}>{marker.time.toFixed(0)}ms</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPatternMatchInfo = () => {
    if (!patternData) return null;

    return (
      <View style={styles.patternInfo}>
        <Text style={styles.patternTitle}>Pattern Analysis</Text>
        <View style={styles.patternMetrics}>
          <View style={styles.patternMetric}>
            <Text style={styles.patternLabel}>Template Match</Text>
            <Text style={styles.patternValue}>{patternData.overallMatch}%</Text>
          </View>
          <View style={styles.patternMetric}>
            <Text style={styles.patternLabel}>Template</Text>
            <Text style={styles.patternValue}>{patternData.templateName}</Text>
          </View>
        </View>
        
        {patternData.deviations.length > 0 && (
          <View style={styles.deviations}>
            <Text style={styles.deviationsTitle}>Key Deviations</Text>
            {patternData.deviations.slice(0, 2).map((deviation, index) => (
              <Text key={index} style={styles.deviationText}>
                • {deviation.metric}: {deviation.deviation.toFixed(1)} 
                ({deviation.severity})
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{getChartTitle()}</Text>
        {interactive && renderChartControls()}
      </View>
      
      {interactive && renderModeSelector()}
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartPlaceholder}>
          📊 Swing Analysis Chart
        </Text>
        <Text style={styles.chartData}>
          {getChartTitle()}
        </Text>
        <View style={styles.dataDisplay}>
          <Text style={styles.dataLabel}>{getYAxisLabel()}: </Text>
          <Text style={styles.dataValue}>
            {actualData.length > 0 
              ? `Peak: ${Math.max(...actualData.map(d => d.y)).toFixed(1)}`
              : 'No data'
            }
          </Text>
        </View>
        <View style={styles.dataDisplay}>
          <Text style={styles.dataLabel}>{getXAxisLabel()}: </Text>
          <Text style={styles.dataValue}>
            {actualData.length > 0 
              ? `Duration: ${Math.max(...actualData.map(d => d.x)).toFixed(0)}${chartMode === 'path' ? '' : 'ms'}`
              : 'No data'
            }
          </Text>
        </View>
        {actualData.length > 0 && (
          <View style={styles.dataDisplay}>
            <Text style={styles.dataLabel}>Data Points: </Text>
            <Text style={styles.dataValue}>{actualData.length} samples</Text>
          </View>
        )}
        
        {/* Swing phase markers */}
        {renderSwingPhaseMarkers()}
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2c5530' }]} />
          <Text style={styles.legendText}>Actual Swing</Text>
        </View>
        {showIdeal && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.legendText}>Ideal Pattern</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Peak Point</Text>
        </View>
      </View>
      
      {renderPatternMatchInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2c5530',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  chartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  controlButtonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    padding: 16,
    minHeight: 200,
  },
  chartPlaceholder: {
    fontSize: 18,
    color: '#2c5530',
    fontWeight: '600',
    marginBottom: 8,
  },
  chartData: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  dataDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 12,
    color: '#2c5530',
    fontWeight: '600',
  },
  phaseMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  phaseMarker: {
    alignItems: 'center',
  },
  phaseIndicator: {
    width: 12,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  phaseText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  phaseTime: {
    fontSize: 9,
    color: '#999',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 3,
    borderRadius: 1,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  patternInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
  },
  patternMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patternMetric: {
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  patternValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c5530',
  },
  deviations: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  deviationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b35',
    marginBottom: 4,
  },
  deviationText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
});

export default SwingPathChart;