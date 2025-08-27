import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// =============================================================================
// INTERFACES
// =============================================================================

export interface WeatherConditions {
  conditions: string;
  windSpeed: number;
  windDirection: string;
  temperature: number;
}

export interface ShotAnalysis {
  recommendedClub: string;
  shotTips: string[];
  weatherConditions?: WeatherConditions;
  confidenceScore?: number;
}

export interface AIAnalysisBoxProps {
  visible: boolean;
  analysis: ShotAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onClose?: () => void;
  distance?: number; // Distance in yards for context
  style?: ViewStyle;
}

// =============================================================================
// LOADING STATE COMPONENT
// =============================================================================

const LoadingState: React.FC = React.memo(() => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingHeader}>
      <ActivityIndicator size="small" color="#4a7c59" />
      <Text style={styles.loadingText}>Analyzing shot...</Text>
    </View>
    <View style={styles.shimmerContainer}>
      {/* Shimmer effect for content areas */}
      <View style={[styles.shimmerLine, styles.shimmerClub]} />
      <View style={styles.shimmerTips}>
        <View style={[styles.shimmerLine, styles.shimmerTip]} />
        <View style={[styles.shimmerLine, styles.shimmerTip]} />
        <View style={[styles.shimmerLine, styles.shimmerTip]} />
      </View>
    </View>
  </View>
));

// =============================================================================
// ERROR STATE COMPONENT
// =============================================================================

const ErrorState: React.FC<{ 
  error: string; 
  distance?: number;
  onRetry?: () => void; 
}> = React.memo(({ error, distance, onRetry }) => {
  // Fallback distance-based advice
  const getFallbackAdvice = (yards?: number): { club: string; tips: string[] } => {
    if (!yards || yards <= 0) {
      return {
        club: 'Select Club',
        tips: ['• Check target location', '• Ensure GPS accuracy', '• Try again']
      };
    }

    let club: string;
    const tips: string[] = [];

    // Basic club selection
    if (yards >= 200) {
      club = 'Driver/3-Wood';
      tips.push('• Use full swing tempo');
      tips.push('• Focus on center contact');
    } else if (yards >= 150) {
      club = '7-Iron';
      tips.push('• Take one extra club in wind');
      tips.push('• Aim for center of green');
    } else if (yards >= 100) {
      club = 'Wedge';
      tips.push('• Control distance with swing length');
      tips.push('• Check pin position');
    } else {
      club = 'Putter/Wedge';
      tips.push('• Short controlled swing');
      tips.push('• Focus on accuracy');
    }

    tips.push('• Assess lie and conditions');

    return { club, tips };
  };

  const fallback = getFallbackAdvice(distance);

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorHeader}>
        <Icon name="warning" size={16} color="#ff6b35" />
        <Text style={styles.errorText}>AI Analysis Unavailable</Text>
      </View>
      
      {/* Fallback recommendation */}
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackClub}>{fallback.club}</Text>
        <View style={styles.fallbackTips}>
          {fallback.tips.map((tip, index) => (
            <Text key={index} style={styles.fallbackTip}>
              {tip}
            </Text>
          ))}
        </View>
      </View>

      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Icon name="refresh" size={14} color="#4a7c59" />
          <Text style={styles.retryText}>Retry AI Analysis</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// =============================================================================
// SUCCESS STATE COMPONENT
// =============================================================================

const AnalysisContent: React.FC<{
  analysis: ShotAnalysis;
  distance?: number;
}> = React.memo(({ analysis, distance }) => {
  const formatWindDirection = (direction: string): string => {
    const directionMap: { [key: string]: string } = {
      'N': '↑', 'NE': '↗', 'E': '→', 'SE': '↘',
      'S': '↓', 'SW': '↙', 'W': '←', 'NW': '↖'
    };
    return directionMap[direction.toUpperCase()] || direction;
  };

  return (
    <View style={styles.analysisContent}>
      {/* Header with icon */}
      <View style={styles.analysisHeader}>
        <Icon name="golf-course" size={16} color="#2c5530" />
        <Text style={styles.analysisTitle}>SHOT ANALYSIS</Text>
        {analysis.confidenceScore && (
          <Text style={styles.confidenceScore}>
            {Math.round(analysis.confidenceScore)}%
          </Text>
        )}
      </View>

      {/* Club Recommendation */}
      <View style={styles.clubSection}>
        <Text style={styles.clubLabel}>Recommended:</Text>
        <Text style={styles.clubName}>{analysis.recommendedClub}</Text>
      </View>

      {/* Shot Tips */}
      {analysis.shotTips && analysis.shotTips.length > 0 && (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsLabel}>Tips:</Text>
          <View style={styles.tipsList}>
            {analysis.shotTips.slice(0, 3).map((tip, index) => (
              <Text key={index} style={styles.tipText}>
                • {tip}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Weather Conditions */}
      {analysis.weatherConditions && (
        <View style={styles.weatherSection}>
          <Text style={styles.weatherText}>
            {analysis.weatherConditions.conditions}, {analysis.weatherConditions.windSpeed}mph{' '}
            {formatWindDirection(analysis.weatherConditions.windDirection)}
          </Text>
        </View>
      )}

      {/* Distance context */}
      {distance && (
        <View style={styles.distanceContext}>
          <Text style={styles.distanceText}>{distance} yards</Text>
        </View>
      )}
    </View>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AIAnalysisBox: React.FC<AIAnalysisBoxProps> = ({
  visible,
  analysis,
  isLoading,
  error,
  onClose,
  distance,
  style,
}) => {
  // Animation refs
  const translateY = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  // Entry animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity, scale]);

  if (!visible) return null;

  const handleRetry = () => {
    // Trigger retry logic if provided
    if (onClose) {
      onClose();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
        style,
      ]}
    >
      {/* Close button */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={16} color="#666" />
        </TouchableOpacity>
      )}

      {/* Content based on state */}
      {isLoading && <LoadingState />}
      {error && !isLoading && (
        <ErrorState 
          error={error} 
          distance={distance}
          onRetry={handleRetry}
        />
      )}
      {analysis && !isLoading && !error && (
        <AnalysisContent analysis={analysis} distance={distance} />
      )}
    </Animated.View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(44, 85, 48, 0.1)',
  },

  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  // Loading State Styles
  loadingContainer: {
    alignItems: 'center',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '500',
  },
  shimmerContainer: {
    width: '100%',
  },
  shimmerLine: {
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginVertical: 2,
  },
  shimmerClub: {
    width: '60%',
    height: 16,
    marginBottom: 8,
  },
  shimmerTips: {
    gap: 4,
  },
  shimmerTip: {
    width: '80%',
    height: 10,
  },

  // Error State Styles
  errorContainer: {
    alignItems: 'center',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#ff6b35',
    fontWeight: '600',
  },
  fallbackContent: {
    width: '100%',
    alignItems: 'center',
  },
  fallbackClub: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
    marginBottom: 8,
  },
  fallbackTips: {
    width: '100%',
  },
  fallbackTip: {
    fontSize: 12,
    color: '#4a7c59',
    marginBottom: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#4a7c59',
  },
  retryText: {
    fontSize: 11,
    color: '#4a7c59',
    fontWeight: '500',
  },

  // Analysis Content Styles
  analysisContent: {
    width: '100%',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c5530',
    letterSpacing: 0.5,
    flex: 1,
  },
  confidenceScore: {
    fontSize: 11,
    color: '#4a7c59',
    fontWeight: '600',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Club Section
  clubSection: {
    marginBottom: 12,
  },
  clubLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  clubName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5530',
  },

  // Tips Section
  tipsSection: {
    marginBottom: 12,
  },
  tipsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  tipsList: {
    gap: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#4a7c59',
    lineHeight: 16,
  },

  // Weather Section
  weatherSection: {
    backgroundColor: 'rgba(74, 124, 89, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  weatherText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Distance Context
  distanceContext: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});

export default AIAnalysisBox;