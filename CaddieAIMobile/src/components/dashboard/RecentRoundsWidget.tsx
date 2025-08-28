/**
 * Recent Rounds Widget Component
 * Displays user's recent golf rounds with scores and course information
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RecentRoundsWidgetProps, RecentRoundDto } from '../../types/dashboard';

export const RecentRoundsWidget: React.FC<RecentRoundsWidgetProps> = ({
  rounds,
  loading,
  onRoundPress,
  onViewAllPress,
}) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatParDifferential = (differential: number): string => {
    if (differential === 0) return 'E';
    if (differential > 0) return `+${differential}`;
    return differential.toString();
  };

  const getParDifferentialColor = (differential: number): string => {
    if (differential < 0) return '#22c55e'; // Green for under par
    if (differential === 0) return '#3b82f6'; // Blue for even
    return '#ef4444'; // Red for over par
  };

  const renderRoundItem = ({ item }: { item: RecentRoundDto }) => (
    <TouchableOpacity
      style={styles.roundItem}
      onPress={() => onRoundPress(item.roundId, item.courseName)}
      activeOpacity={0.7}
    >
      <View style={styles.roundHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {item.courseName}
          </Text>
          <Text style={styles.dateText}>
            {formatDate(item.datePlayed)}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.totalScore}>
            {item.totalScore}
          </Text>
          <Text 
            style={[
              styles.parDifferential,
              { color: getParDifferentialColor(item.parDifferential) }
            ]}
          >
            {formatParDifferential(item.parDifferential)}
          </Text>
        </View>
      </View>
      
      <View style={styles.roundDetails}>
        <View style={styles.detailItem}>
          <Icon name="flag" size={14} color="#6b7280" />
          <Text style={styles.detailText}>Par {item.parTotal}</Text>
        </View>
        
        {item.duration && (
          <View style={styles.detailItem}>
            <Icon name="schedule" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              {/* Format duration from ISO 8601 */}
              {item.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Completed' ? '#dcfce7' : '#fef3c7' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.status === 'Completed' ? '#16a34a' : '#d97706' }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="golf-course" size={48} color="#d1d5db" />
      <Text style={styles.emptyStateTitle}>No Recent Rounds</Text>
      <Text style={styles.emptyStateText}>
        Start playing to see your recent rounds here
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2c5530" />
      <Text style={styles.loadingText}>Loading recent rounds...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="history" size={20} color="#2c5530" />
          <Text style={styles.title}>Recent Rounds</Text>
        </View>
        
        {rounds.length > 0 && (
          <TouchableOpacity
            onPress={onViewAllPress}
            style={styles.viewAllButton}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={16} color="#4a7c59" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          renderLoadingState()
        ) : rounds.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={rounds}
            renderItem={renderRoundItem}
            keyExtractor={(item) => item.roundId.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false} // Disable internal scrolling for widget
          />
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '500',
    marginRight: 4,
  },
  content: {
    minHeight: 120,
  },
  roundItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  totalScore: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  parDifferential: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  roundDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
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

export default RecentRoundsWidget;
