/**
 * Performance Insights Widget Component
 * Displays AI-generated performance insights, trends, and recommendations
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PerformanceInsightsWidgetProps } from '../../types/dashboard';

export const PerformanceInsightsWidget: React.FC<PerformanceInsightsWidgetProps> = ({
  insights,
  loading,
  onRefreshPress,
}) => {
  const formatGeneratedDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend.toLowerCase()) {
      case 'improving':
        return 'trending-up';
      case 'declining':
        return 'trending-down';
      case 'stable':
      default:
        return 'trending-flat';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend.toLowerCase()) {
      case 'improving':
        return '#22c55e';
      case 'declining':
        return '#ef4444';
      case 'stable':
      default:
        return '#3b82f6';
    }
  };

  const renderListSection = (title: string, items: string[], iconName: string, color: string) => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Icon name={iconName} size={16} color={color} />
          <Text style={[styles.listTitle, { color }]}>{title}</Text>
        </View>
        {items.slice(0, 3).map((item, index) => ( // Show max 3 items
          <View key={index} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="insights" size={48} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Insights Available</Text>
      <Text style={styles.emptyStateText}>
        Play a few rounds to get AI-powered insights about your game
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2c5530" />
      <Text style={styles.loadingText}>Generating insights...</Text>
    </View>
  );

  const hasValidInsights = insights && (
    insights.strengths.length > 0 || 
    insights.improvementAreas.length > 0 || 
    insights.recommendations.length > 0 ||
    insights.motivationalMessage
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="insights" size={20} color="#2c5530" />
          <Text style={styles.title}>Performance Insights</Text>
        </View>
        
        <TouchableOpacity
          onPress={onRefreshPress}
          style={styles.refreshButton}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Icon 
            name="refresh" 
            size={18} 
            color={loading ? "#9ca3af" : "#4a7c59"} 
            style={loading ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          renderLoadingState()
        ) : !hasValidInsights ? (
          renderEmptyState()
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {/* Trend Analysis */}
            {insights.trendAnalysis && (
              <View style={styles.trendSection}>
                <View style={styles.trendContainer}>
                  <Icon 
                    name={getTrendIcon(insights.trendAnalysis)} 
                    size={20} 
                    color={getTrendColor(insights.trendAnalysis)} 
                  />
                  <Text style={styles.trendText}>
                    Your game is <Text style={[styles.trendValue, { color: getTrendColor(insights.trendAnalysis) }]}>
                      {insights.trendAnalysis}
                    </Text>
                  </Text>
                </View>
                
                <View style={styles.metaInfo}>
                  <Text style={styles.metaText}>
                    Based on {insights.roundsAnalyzed} rounds
                  </Text>
                  <Text style={styles.metaText}>
                    {formatGeneratedDate(insights.generatedAt)}
                  </Text>
                </View>
              </View>
            )}

            {/* Motivational Message */}
            {insights.motivationalMessage && (
              <View style={styles.motivationalSection}>
                <Text style={styles.motivationalMessage}>
                  "{insights.motivationalMessage}"
                </Text>
              </View>
            )}

            {/* Strengths */}
            {renderListSection(
              'Strengths',
              insights.strengths,
              'star',
              '#22c55e'
            )}

            {/* Improvement Areas */}
            {renderListSection(
              'Areas to Improve',
              insights.improvementAreas,
              'flag',
              '#f59e0b'
            )}

            {/* Recommendations */}
            {renderListSection(
              'Recommendations',
              insights.recommendations,
              'lightbulb',
              '#3b82f6'
            )}

            {/* Confidence Level */}
            {insights.confidenceLevel > 0 && (
              <View style={styles.confidenceSection}>
                <Text style={styles.confidenceText}>
                  Insight confidence: {Math.round(insights.confidenceLevel * 100)}%
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    minHeight: 180,
  },
  scrollView: {
    maxHeight: 300, // Limit height for dashboard widget
  },
  trendSection: {
    marginBottom: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  trendValue: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  motivationalSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  motivationalMessage: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listSection: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
    marginTop: 1,
  },
  listItemText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
    lineHeight: 18,
  },
  confidenceSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});

export default PerformanceInsightsWidget;
