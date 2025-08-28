/**
 * Round Scorecard Screen
 * Displays detailed hole-by-hole scorecard for a golf round
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchRoundScorecard,
  clearSelectedRoundError,
  selectSelectedRound,
  selectSelectedRoundLoading,
  selectSelectedRoundError,
} from '../../store/slices/roundsSlice';

// Navigation
import { DashboardStackParamList } from '../../navigation/DashboardNavigator';

// Components
import {
  ScorecardHeader,
  HoleScoreRow,
  ScorecardSummary,
} from '../../components/scorecard';

type RoundScorecardRouteProp = RouteProp<DashboardStackParamList, 'RoundScorecard'>;

export const RoundScorecardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute<RoundScorecardRouteProp>();
  
  const { roundId, courseName } = route.params;
  
  // Redux selectors
  const selectedRound = useSelector(selectSelectedRound);
  const loading = useSelector(selectSelectedRoundLoading);
  const error = useSelector(selectSelectedRoundError);
  
  // Local state
  const [showStatistics, setShowStatistics] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load round scorecard on component mount
  useEffect(() => {
    console.log(`🎯 RoundScorecardScreen: Loading scorecard for round ${roundId}`);
    if (!selectedRound || selectedRound.id !== roundId) {
      dispatch(fetchRoundScorecard(roundId));
    }
  }, [dispatch, roundId, selectedRound]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('❌ RoundScorecardScreen: Scorecard error:', error);
      Alert.alert(
        'Error Loading Scorecard',
        error,
        [
          { text: 'Dismiss', onPress: () => dispatch(clearSelectedRoundError()) },
          { text: 'Retry', onPress: () => dispatch(fetchRoundScorecard(roundId)) },
        ]
      );
    }
  }, [error, dispatch, roundId]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    console.log(`🔄 RoundScorecardScreen: Refreshing scorecard for round ${roundId}`);
    setRefreshing(true);
    await dispatch(fetchRoundScorecard(roundId));
    setRefreshing(false);
  }, [dispatch, roundId]);

  // Toggle statistics visibility
  const toggleStatistics = useCallback(() => {
    setShowStatistics(!showStatistics);
  }, [showStatistics]);

  // Separate front 9 and back 9 holes
  const separateNines = () => {
    if (!selectedRound?.holeScores || !selectedRound?.course?.holes) {
      return { front9: [], back9: [] };
    }

    // Create a map for easier lookup
    const holeScoresMap = selectedRound.holeScores.reduce((map, holeScore) => {
      map[holeScore.holeNumber] = holeScore;
      return map;
    }, {} as Record<number, typeof selectedRound.holeScores[0]>);

    const front9 = [];
    const back9 = [];

    // Sort course holes by hole number and separate into nines
    const sortedHoles = [...selectedRound.course.holes].sort((a, b) => a.holeNumber - b.holeNumber);

    for (const hole of sortedHoles) {
      const holeData = {
        hole,
        holeScore: holeScoresMap[hole.holeNumber] || null,
      };

      if (hole.holeNumber <= 9) {
        front9.push(holeData);
      } else {
        back9.push(holeData);
      }
    }

    return { front9, back9 };
  };

  const { front9, back9 } = separateNines();

  // Render loading state
  if (loading && !selectedRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5530" />
          <Text style={styles.loadingText}>Loading scorecard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error && !selectedRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Failed to Load Scorecard</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchRoundScorecard(roundId))}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render no data state
  if (!selectedRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Icon name="golf-course" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Scorecard Data</Text>
          <Text style={styles.emptyMessage}>
            Unable to load scorecard for this round.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Statistics Toggle */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.statisticsToggle, showStatistics && styles.statisticsToggleActive]}
          onPress={toggleStatistics}
        >
          <Icon
            name={showStatistics ? 'analytics' : 'analytics'}
            size={16}
            color={showStatistics ? '#ffffff' : '#2c5530'}
          />
          <Text style={[
            styles.statisticsToggleText,
            showStatistics && styles.statisticsToggleTextActive
          ]}>
            {showStatistics ? 'Hide' : 'Show'} Stats
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2c5530']}
            tintColor="#2c5530"
            title="Pull to refresh"
          />
        }
      >
        {/* Round Header */}
        <ScorecardHeader round={selectedRound} />

        {/* Front 9 */}
        <View style={styles.nineSection}>
          <Text style={styles.nineTitle}>Front 9</Text>
          <View style={styles.scorecardTable}>
            <HoleScoreRow isHeader showStatistics={showStatistics} />
            {front9.map(({ hole, holeScore }, index) => (
              <HoleScoreRow
                key={`front-${hole.holeNumber}-${index}`}
                hole={hole}
                holeScore={holeScore}
                showStatistics={showStatistics}
              />
            ))}
          </View>
        </View>

        {/* Back 9 */}
        {back9.length > 0 && (
          <View style={styles.nineSection}>
            <Text style={styles.nineTitle}>Back 9</Text>
            <View style={styles.scorecardTable}>
              <HoleScoreRow isHeader showStatistics={showStatistics} />
              {back9.map(({ hole, holeScore }, index) => (
                <HoleScoreRow
                  key={`back-${hole.holeNumber}-${index}`}
                  hole={hole}
                  holeScore={holeScore}
                  showStatistics={showStatistics}
                />
              ))}
            </View>
          </View>
        )}

        {/* Round Summary */}
        <ScorecardSummary round={selectedRound} />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  statisticsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c5530',
  },
  statisticsToggleActive: {
    backgroundColor: '#2c5530',
  },
  statisticsToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c5530',
    marginLeft: 4,
  },
  statisticsToggleTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  nineSection: {
    marginBottom: 20,
  },
  nineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  scorecardTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2c5530',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RoundScorecardScreen;