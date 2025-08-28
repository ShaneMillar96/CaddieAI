/**
 * All Rounds Screen
 * Displays a paginated list of all user's golf rounds with search and filter functionality
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchAllRounds,
  clearRoundsError,
  selectAllRounds,
  selectRoundsLoading,
  selectRoundsError,
  selectHasNextPage,
  selectCurrentPage,
  selectTotalCount,
  selectIsRoundsDataStale,
  selectRoundsIsEmpty,
} from '../../store/slices/roundsSlice';

// Navigation
import { DashboardStackParamList } from '../../navigation/DashboardNavigator';

// Types
import { RoundListItem } from '../../services/roundsApi';
import roundsApiService from '../../services/roundsApi';

type NavigationProp = StackNavigationProp<DashboardStackParamList, 'AllRounds'>;

// Round item component
const RoundItem: React.FC<{
  round: RoundListItem;
  onPress: (roundId: number, courseName?: string) => void;
}> = ({ round, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'paused': return '#f59e0b';
      case 'abandoned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'play-circle-filled';
      case 'paused': return 'pause-circle-filled';
      case 'abandoned': return 'cancel';
      default: return 'radio-button-unchecked';
    }
  };

  const formatScore = (score?: number, status?: string) => {
    if (!score && status?.toLowerCase() !== 'completed') return '--';
    return score?.toString() || '--';
  };

  const scoreToPar = (score?: number, courseId?: number) => {
    // This would require course data to calculate par
    // For now, just return score
    if (!score) return null;
    
    // Assuming average par of 72 for display purposes
    const estimatedPar = 72;
    const diff = score - estimatedPar;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <TouchableOpacity
      style={styles.roundItem}
      onPress={() => onPress(round.id, round.courseName)}
      activeOpacity={0.7}
    >
      <View style={styles.roundHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {round.courseName || `Course ${round.courseId}`}
          </Text>
          <Text style={styles.roundDate}>
            {roundsApiService.formatRoundDate(round.roundDate)}
          </Text>
        </View>
        
        <View style={styles.scoreSection}>
          <Text style={styles.score}>
            {formatScore(round.totalScore, round.status)}
          </Text>
          {round.totalScore && (
            <Text style={styles.scoreToPar}>
              {scoreToPar(round.totalScore)}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.roundDetails}>
        <View style={styles.statusContainer}>
          <Icon
            name={getStatusIcon(round.status)}
            size={16}
            color={getStatusColor(round.status)}
          />
          <Text style={[styles.status, { color: getStatusColor(round.status) }]}>
            {round.status}
          </Text>
        </View>
        
        {round.currentHole && round.status.toLowerCase() === 'in_progress' && (
          <Text style={styles.currentHole}>
            Hole {round.currentHole}
          </Text>
        )}
        
        {round.startTime && round.endTime && (
          <Text style={styles.duration}>
            {roundsApiService.formatRoundDuration(round.startTime, round.endTime)}
          </Text>
        )}
      </View>
      
      {round.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {round.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const AllRoundsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();
  
  // Redux selectors
  const allRounds = useSelector(selectAllRounds);
  const loading = useSelector(selectRoundsLoading);
  const error = useSelector(selectRoundsError);
  const hasNextPage = useSelector(selectHasNextPage);
  const currentPage = useSelector(selectCurrentPage);
  const totalCount = useSelector(selectTotalCount);
  const isDataStale = useSelector((state: any) => selectIsRoundsDataStale(state, 10)); // 10 minutes
  const isEmpty = useSelector(selectRoundsIsEmpty);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Load rounds on component mount
  useEffect(() => {
    console.log('🏌️ AllRoundsScreen: Component mounted, checking data...');
    if (allRounds.length === 0 || isDataStale) {
      console.log('🔄 AllRoundsScreen: Loading rounds data...');
      dispatch(fetchAllRounds({ page: 1, refresh: true }));
    } else {
      console.log('✅ AllRoundsScreen: Using cached rounds data');
    }
  }, [dispatch, allRounds.length, isDataStale]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('❌ AllRoundsScreen: Rounds error:', error);
      Alert.alert(
        'Error Loading Rounds',
        error,
        [
          { text: 'Dismiss', onPress: () => dispatch(clearRoundsError()) },
          { text: 'Retry', onPress: () => dispatch(fetchAllRounds({ page: 1, refresh: true })) },
        ]
      );
    }
  }, [error, dispatch]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    console.log('🔄 AllRoundsScreen: Pull-to-refresh triggered');
    dispatch(fetchAllRounds({ page: 1, refresh: true }));
  }, [dispatch]);

  // Load more rounds (pagination)
  const loadMore = useCallback(async () => {
    if (hasNextPage && !loading && !loadingMore) {
      console.log(`📄 AllRoundsScreen: Loading page ${currentPage + 1}`);
      setLoadingMore(true);
      await dispatch(fetchAllRounds({ page: currentPage + 1 }));
      setLoadingMore(false);
    }
  }, [hasNextPage, loading, loadingMore, currentPage, dispatch]);

  // Handle round selection
  const handleRoundPress = useCallback((roundId: number, courseName?: string) => {
    console.log(`📄 AllRoundsScreen: Opening scorecard for round ${roundId}`);
    navigation.navigate('RoundScorecard', { roundId, courseName });
  }, [navigation]);

  // Filter rounds based on search query
  const filteredRounds = searchQuery
    ? allRounds.filter(round =>
        (round.courseName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (round.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (round.roundDate.includes(searchQuery))
      )
    : allRounds;

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="golf-course" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Rounds Yet</Text>
      <Text style={styles.emptyMessage}>
        Start playing golf rounds to see your history here.
      </Text>
    </View>
  );

  // Render load more footer
  const renderLoadMore = () => {
    if (!hasNextPage) return null;
    
    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color="#2c5530" />
        ) : (
          <Text style={styles.loadMoreText}>Load More Rounds</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rounds..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Rounds Count */}
      {totalCount > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {searchQuery ? `${filteredRounds.length} of ` : ''}{totalCount} rounds
          </Text>
        </View>
      )}

      {/* Rounds List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && currentPage <= 1}
            onRefresh={onRefresh}
            colors={['#2c5530']}
            tintColor="#2c5530"
            title="Pull to refresh"
          />
        }
        onScroll={({ nativeEvent }) => {
          // Load more when near bottom
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {isEmpty && !loading ? (
          renderEmptyState()
        ) : (
          <>
            {filteredRounds.map((round, index) => (
              <RoundItem
                key={`${round.id}-${index}`}
                round={round}
                onPress={handleRoundPress}
              />
            ))}
            
            {renderLoadMore()}
            
            {/* Bottom spacing for navigation */}
            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  roundItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseInfo: {
    flex: 1,
    marginRight: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  roundDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreSection: {
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  scoreToPar: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  roundDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  currentHole: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  loadMoreButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c5530',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AllRoundsScreen;