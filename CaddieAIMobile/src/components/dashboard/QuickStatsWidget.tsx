/**
 * Quick Stats Widget Component
 * Displays user's key golf statistics in a compact card format
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QuickStatsWidgetProps } from '../../types/dashboard';

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  stats,
  loading,
}) => {
  const formatHandicap = (handicap?: number): string => {
    if (handicap === undefined || handicap === null) return '--';
    return handicap >= 0 ? `+${handicap.toFixed(1)}` : handicap.toFixed(1);
  };

  const formatHandicapChange = (change: number): { text: string; color: string; icon: string } => {
    if (change === 0) {
      return { text: 'No change', color: '#6b7280', icon: 'trending-flat' };
    }
    if (change > 0) {
      return { text: `+${change.toFixed(1)}`, color: '#ef4444', icon: 'trending-up' };
    }
    return { text: change.toFixed(1), color: '#22c55e', icon: 'trending-down' };
  };

  const formatScore = (score?: number): string => {
    if (score === undefined || score === null) return '--';
    return score.toFixed(1);
  };

  const renderStatItem = (
    label: string,
    value: string,
    iconName: string,
    accent?: { text: string; color: string; icon: string }
  ) => (
    <View style={styles.statItem}>
      <View style={styles.statHeader}>
        <Icon name={iconName} size={18} color="#2c5530" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        {accent && (
          <View style={styles.accentContainer}>
            <Icon name={accent.icon} size={14} color={accent.color} />
            <Text style={[styles.accentText, { color: accent.color }]}>
              {accent.text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="assessment" size={48} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Stats Available</Text>
      <Text style={styles.emptyStateText}>
        Complete some rounds to see your statistics
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2c5530" />
      <Text style={styles.loadingText}>Loading stats...</Text>
    </View>
  );

  const hasValidStats = stats && stats.roundsAnalyzed > 0;
  const handicapChange = stats ? formatHandicapChange(stats.handicapChange) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="assessment" size={20} color="#2c5530" />
          <Text style={styles.title}>Quick Stats</Text>
        </View>
        
        {stats && stats.roundsAnalyzed > 0 && (
          <Text style={styles.roundsCount}>
            {stats.roundsAnalyzed} rounds
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          renderLoadingState()
        ) : !hasValidStats ? (
          renderEmptyState()
        ) : (
          <View style={styles.statsGrid}>
            {/* Top Row */}
            <View style={styles.statsRow}>
              {renderStatItem(
                'Current Handicap',
                formatHandicap(stats.currentHandicap),
                'golf-course',
                handicapChange
              )}
              
              {renderStatItem(
                'Scoring Average',
                formatScore(stats.scoringAverage),
                'trending-up'
              )}
            </View>

            {/* Bottom Row */}
            <View style={styles.statsRow}>
              {renderStatItem(
                'Rounds This Season',
                stats.totalRoundsThisSeason.toString(),
                'event'
              )}
              
              {renderStatItem(
                'Best Score',
                stats.bestScore?.toString() || '--',
                'star'
              )}
            </View>

            {/* Favorite Course (if available) */}
            {stats.favoriteCourse && (
              <View style={styles.favoriteSection}>
                <View style={styles.favoriteHeader}>
                  <Icon name="favorite" size={16} color="#4a7c59" />
                  <Text style={styles.favoriteLabel}>Favorite Course</Text>
                </View>
                <Text style={styles.favoriteValue} numberOfLines={1}>
                  {stats.favoriteCourse}
                </Text>
              </View>
            )}
          </View>
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
  roundsCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  content: {
    minHeight: 160,
  },
  statsGrid: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  accentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accentText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  favoriteSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteLabel: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
    marginLeft: 4,
  },
  favoriteValue: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
});

export default QuickStatsWidget;
