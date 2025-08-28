/**
 * Dashboard Home Screen
 * Main dashboard screen displaying user's golf analytics, recent rounds, and quick actions
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Text,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchDashboardOverview,
  refreshDashboardInsights,
  clearDashboardError,
  selectDashboard,
  selectDashboardOverview,
  selectDashboardLoading,
  selectDashboardError,
  selectUserStats,
  selectRecentRounds,
  selectPerformanceInsights,
  selectRefreshingInsights,
  selectIsDashboardDataStale,
} from '../../store/slices/dashboardSlice';

// Components
import {
  RecentRoundsWidget,
  PerformanceInsightsWidget,
  QuickStatsWidget,
  QuickActionsWidget,
} from '../../components/dashboard';

// Navigation
import { DashboardStackParamList } from '../../navigation/DashboardNavigator';
import { MainTabParamList } from '../../types';

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  StackNavigationProp<MainTabParamList>
>;

export const DashboardHomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp>();

  // Redux selectors
  const dashboardState = useSelector(selectDashboard);
  const overview = useSelector(selectDashboardOverview);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const userStats = useSelector(selectUserStats);
  const recentRounds = useSelector(selectRecentRounds);
  const insights = useSelector(selectPerformanceInsights);
  const refreshingInsights = useSelector(selectRefreshingInsights);
  const isDataStale = useSelector((state: any) => selectIsDashboardDataStale(state, 5)); // 5 minutes

  // Load dashboard data on component mount
  useEffect(() => {
    console.log('🏠 DashboardHomeScreen: Component mounted, checking data...');
    if (!overview || isDataStale) {
      console.log('🔄 DashboardHomeScreen: Loading dashboard data...');
      dispatch(fetchDashboardOverview());
    } else {
      console.log('✅ DashboardHomeScreen: Using cached dashboard data');
    }
  }, [dispatch, overview, isDataStale]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('❌ DashboardHomeScreen: Dashboard error:', error);
      Alert.alert(
        'Dashboard Error',
        error,
        [
          { text: 'Dismiss', onPress: () => dispatch(clearDashboardError()) },
          { text: 'Retry', onPress: () => dispatch(fetchDashboardOverview()) },
        ]
      );
    }
  }, [error, dispatch]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    console.log('🔄 DashboardHomeScreen: Pull-to-refresh triggered');
    dispatch(fetchDashboardOverview());
  }, [dispatch]);

  // Navigation handlers
  const handleStartRound = useCallback(() => {
    console.log('🏌️ DashboardHomeScreen: Starting new round...');
    // Note: This would typically navigate to a course selection or round setup screen
    // For now, we'll show an alert
    Alert.alert(
      'Start New Round',
      'This feature will take you through course selection and round setup.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleViewCourses = useCallback(() => {
    console.log('🏌️ DashboardHomeScreen: Navigating to courses...');
    navigation.navigate('Courses' as any);
  }, [navigation]);

  const handleOpenChat = useCallback(() => {
    console.log('🤖 DashboardHomeScreen: Opening AI chat...');
    navigation.navigate('AIChat' as any);
  }, [navigation]);

  const handleRoundPress = useCallback((roundId: number, courseName?: string) => {
    console.log(`📄 DashboardHomeScreen: Opening scorecard for round ${roundId}`);
    navigation.navigate('RoundScorecard', { roundId, courseName });
  }, [navigation]);

  const handleViewAllRounds = useCallback(() => {
    console.log('📄 DashboardHomeScreen: Navigating to All Rounds screen...');
    navigation.navigate('AllRounds');
  }, [navigation]);

  const handleRefreshInsights = useCallback(() => {
    console.log('🧠 DashboardHomeScreen: Refreshing performance insights...');
    dispatch(refreshDashboardInsights(false)); // Don't force refresh unless explicitly requested
  }, [dispatch]);

  // Render dashboard content
  const renderDashboardContent = () => {
    const isEmpty = !userStats || (userStats.roundsAnalyzed === 0 && recentRounds.length === 0);
    
    if (isEmpty && !loading) {
      return (
        <View style={styles.emptyDashboard}>
          <Text style={styles.emptyTitle}>Welcome to CaddieAI!</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your golf rounds to see personalized insights and statistics.
          </Text>
          
          {/* Show Quick Actions even when empty */}
          <View style={styles.emptyActionsContainer}>
            <QuickActionsWidget
              onStartRound={handleStartRound}
              onViewCourses={handleViewCourses}
              onOpenChat={handleOpenChat}
            />
          </View>
        </View>
      );
    }

    return (
      <>
        {/* Quick Actions - Always show at top */}
        <QuickActionsWidget
          onStartRound={handleStartRound}
          onViewCourses={handleViewCourses}
          onOpenChat={handleOpenChat}
        />

        {/* Quick Stats */}
        {userStats && (
          <QuickStatsWidget
            stats={userStats}
            loading={loading}
          />
        )}

        {/* Recent Rounds */}
        <RecentRoundsWidget
          rounds={recentRounds}
          loading={loading}
          onRoundPress={handleRoundPress}
          onViewAllPress={handleViewAllRounds}
        />

        {/* Performance Insights */}
        {insights && (
          <PerformanceInsightsWidget
            insights={insights}
            loading={refreshingInsights}
            onRefreshPress={handleRefreshInsights}
          />
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dashboard Content - No custom header, using navigation header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={['#2c5530']}
            tintColor="#2c5530"
            title="Pull to refresh dashboard"
          />
        }
      >
        {renderDashboardContent()}

        {/* Bottom spacing for tab navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyDashboard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionsContainer: {
    width: '100%',
  },
  bottomSpacing: {
    height: 20, // Extra space for bottom tab navigation
  },
});

export default DashboardHomeScreen;
