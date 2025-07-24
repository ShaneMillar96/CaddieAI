import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round, HoleScore } from '../../types/golf';

interface RoundStatsWidgetProps {
  round: Round;
  holeScores: HoleScore[];
}

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const RoundStatsWidget: React.FC<RoundStatsWidgetProps> = ({
  round,
  holeScores,
}) => {
  // Calculate statistics from hole scores
  const stats = calculateRoundStats(round, holeScores);

  const statItems: StatItem[] = [
    {
      label: 'Score',
      value: stats.totalScore,
      icon: 'sports-golf',
      color: '#2c5530',
      trend: getScoreTrend(stats.totalScore, stats.expectedScore),
    },
    {
      label: 'To Par',
      value: formatScoreToPar(stats.scoreToPar),
      icon: 'flag',
      color: getScoreColor(stats.scoreToPar),
    },
    {
      label: 'Putts',
      value: stats.totalPutts,
      icon: 'golf-course',
      color: '#4a7c59',
    },
    {
      label: 'Fairways',
      value: `${stats.fairwaysHit}/${stats.holesPlayed}`,
      icon: 'landscape',
      color: '#28a745',
    },
    {
      label: 'GIR',
      value: `${stats.greensInRegulation}/${stats.holesPlayed}`,
      icon: 'center-focus-strong',
      color: '#17a2b8',
    },
    {
      label: 'Avg Putts',
      value: stats.averagePutts.toFixed(1),
      icon: 'timeline',
      color: '#6f42c1',
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Round Statistics</Text>
        <TouchableOpacity style={styles.detailsButton}>
          <Icon name="analytics" size={16} color="#4a7c59" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {statItems.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <View style={styles.statHeader}>
              <Icon name={stat.icon} size={20} color={stat.color} />
              {stat.trend && (
                <Icon
                  name={getTrendIcon(stat.trend)}
                  size={16}
                  color={getTrendColor(stat.trend)}
                />
              )}
            </View>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Performance Indicators */}
      <View style={styles.performanceSection}>
        <Text style={styles.performanceTitle}>Performance</Text>
        <View style={styles.performanceIndicators}>
          {/* Scoring Performance */}
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Scoring</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceFill,
                  {
                    width: `${Math.min(100, Math.max(0, 100 - (stats.scoreToPar * 10)))}%`,
                    backgroundColor: getPerformanceColor(stats.scoreToPar),
                  },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {getPerformanceRating(stats.scoreToPar)}
            </Text>
          </View>

          {/* Putting Performance */}
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Putting</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceFill,
                  {
                    width: `${Math.min(100, Math.max(0, (2.5 - stats.averagePutts) * 40))}%`,
                    backgroundColor: getPuttingColor(stats.averagePutts),
                  },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {getPuttingRating(stats.averagePutts)}
            </Text>
          </View>

          {/* Accuracy Performance */}
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Accuracy</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceFill,
                  {
                    width: `${stats.fairwayPercentage}%`,
                    backgroundColor: getAccuracyColor(stats.fairwayPercentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {getAccuracyRating(stats.fairwayPercentage)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Insights */}
      {stats.holesPlayed >= 3 && (
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Quick Insights</Text>
          <View style={styles.insights}>
            {getInsights(stats).map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Icon
                  name={insight.icon}
                  size={16}
                  color={insight.color}
                  style={styles.insightIcon}
                />
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// Helper functions
const calculateRoundStats = (round: Round, holeScores: HoleScore[]) => {
  const holesPlayed = holeScores.length;
  const totalScore = holeScores.reduce((sum, score) => sum + score.score, 0);
  const totalPutts = holeScores.reduce((sum, score) => sum + (score.putts || 0), 0);
  const fairwaysHit = holeScores.filter(score => score.fairwayHit).length;
  const greensInRegulation = holeScores.filter(score => score.greenInRegulation).length;

  // Calculate expected par for played holes
  const expectedScore = round.course?.holes
    ?.slice(0, holesPlayed)
    .reduce((sum, hole) => sum + hole.par, 0) || holesPlayed * 4;

  const scoreToPar = totalScore - expectedScore;
  const averagePutts = holesPlayed > 0 ? totalPutts / holesPlayed : 0;
  const fairwayPercentage = holesPlayed > 0 ? (fairwaysHit / holesPlayed) * 100 : 0;
  const girPercentage = holesPlayed > 0 ? (greensInRegulation / holesPlayed) * 100 : 0;

  return {
    holesPlayed,
    totalScore,
    totalPutts,
    fairwaysHit,
    greensInRegulation,
    expectedScore,
    scoreToPar,
    averagePutts,
    fairwayPercentage,
    girPercentage,
  };
};

const formatScoreToPar = (scoreToPar: number): string => {
  if (scoreToPar === 0) return 'E';
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
};

const getScoreColor = (scoreToPar: number): string => {
  if (scoreToPar < 0) return '#28a745'; // Under par - green
  if (scoreToPar === 0) return '#007bff'; // Even par - blue
  if (scoreToPar <= 3) return '#ffc107'; // 1-3 over - yellow
  return '#dc3545'; // 4+ over - red
};

const getScoreTrend = (current: number, expected: number): 'up' | 'down' | 'neutral' => {
  if (current < expected) return 'down'; // Better than expected
  if (current > expected) return 'up'; // Worse than expected
  return 'neutral';
};

const getTrendIcon = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up': return 'trending-up';
    case 'down': return 'trending-down';
    default: return 'trending-flat';
  }
};

const getTrendColor = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up': return '#dc3545'; // Red for worse
    case 'down': return '#28a745'; // Green for better
    default: return '#6c757d'; // Gray for neutral
  }
};

const getPerformanceColor = (scoreToPar: number): string => {
  if (scoreToPar <= -2) return '#28a745'; // Excellent
  if (scoreToPar <= 0) return '#17a2b8'; // Good
  if (scoreToPar <= 3) return '#ffc107'; // Average
  return '#dc3545'; // Needs improvement
};

const getPerformanceRating = (scoreToPar: number): string => {
  if (scoreToPar <= -2) return 'Excellent';
  if (scoreToPar <= 0) return 'Good';
  if (scoreToPar <= 3) return 'Average';
  return 'Poor';
};

const getPuttingColor = (avgPutts: number): string => {
  if (avgPutts <= 1.8) return '#28a745'; // Excellent
  if (avgPutts <= 2.2) return '#17a2b8'; // Good
  if (avgPutts <= 2.5) return '#ffc107'; // Average
  return '#dc3545'; // Needs improvement
};

const getPuttingRating = (avgPutts: number): string => {
  if (avgPutts <= 1.8) return 'Excellent';
  if (avgPutts <= 2.2) return 'Good';
  if (avgPutts <= 2.5) return 'Average';
  return 'Poor';
};

const getAccuracyColor = (percentage: number): string => {
  if (percentage >= 70) return '#28a745'; // Excellent
  if (percentage >= 50) return '#17a2b8'; // Good
  if (percentage >= 30) return '#ffc107'; // Average
  return '#dc3545'; // Needs improvement
};

const getAccuracyRating = (percentage: number): string => {
  if (percentage >= 70) return 'Excellent';
  if (percentage >= 50) return 'Good';
  if (percentage >= 30) return 'Average';
  return 'Poor';
};

const getInsights = (stats: any) => {
  const insights = [];

  // Scoring insights
  if (stats.scoreToPar <= -2) {
    insights.push({
      icon: 'star',
      color: '#28a745',
      text: 'Excellent scoring performance today!',
    });
  } else if (stats.scoreToPar >= 5) {
    insights.push({
      icon: 'trending-up',
      color: '#dc3545',
      text: 'Focus on course management to improve scoring.',
    });
  }

  // Putting insights
  if (stats.averagePutts <= 1.8) {
    insights.push({
      icon: 'emoji-events',
      color: '#ffd700',
      text: 'Your putting is on fire today!',
    });
  } else if (stats.averagePutts >= 2.5) {
    insights.push({
      icon: 'golf-course',
      color: '#17a2b8',
      text: 'Work on your putting for lower scores.',
    });
  }

  // Accuracy insights
  if (stats.fairwayPercentage >= 70) {
    insights.push({
      icon: 'center-focus-strong',
      color: '#28a745',
      text: 'Great accuracy off the tee!',
    });
  } else if (stats.fairwayPercentage <= 30) {
    insights.push({
      icon: 'my-location',
      color: '#ffc107',
      text: 'Focus on finding more fairways.',
    });
  }

  // GIR insights
  if (stats.girPercentage >= 60) {
    insights.push({
      icon: 'flag',
      color: '#28a745',
      text: 'Solid approach play today!',
    });
  }

  return insights.slice(0, 3); // Limit to 3 insights
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
  },
  performanceSection: {
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  performanceIndicators: {
    gap: 12,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
    width: 70,
  },
  performanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  insightsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  insights: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightIcon: {
    width: 20,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
});

export default RoundStatsWidget;