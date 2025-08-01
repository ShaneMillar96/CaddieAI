import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Text,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { 
  fetchCourses, 
  searchCourses, 
  fetchNearbyCourses,
  clearError 
} from '../../store/slices/courseSlice';
import { 
  fetchActiveRound,
  abandonRound,
  completeRound 
} from '../../store/slices/roundSlice';
import { CourseCard } from '../../components/common/CourseCard';
import { CourseSearchBar } from '../../components/common/CourseSearchBar';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { CourseListItem } from '../../types/golf';
import { CoursesStackParamList } from '../../navigation/CoursesNavigator';

type CoursesScreenNavigationProp = StackNavigationProp<CoursesStackParamList, 'CoursesList'>;
type CoursesScreenRouteProp = RouteProp<CoursesStackParamList, 'CoursesList'>;

export const CoursesScreen: React.FC = () => {
  const navigation = useNavigation<CoursesScreenNavigationProp>();
  const route = useRoute<CoursesScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const {
    courses,
    nearbyCourses,
    searchResults,
    isLoading,
    isSearching,
    isLoadingNearby,
    error,
    pagination,
  } = useSelector((state: RootState) => state.courses);

  // Check if user came from "Start New Round" flow
  const fromActiveRound = route.params?.fromActiveRound || false;

  const hasMore = pagination?.hasNextPage ?? false;

  const [searchTerm, setSearchTerm] = useState('');
  const [showingNearby, setShowingNearby] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial courses on mount
  useEffect(() => {
    if (courses.length === 0 && !isLoading) {
      dispatch(fetchCourses({ page: 1, pageSize: 20 }));
    }
  }, [dispatch, courses.length, isLoading]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setShowingNearby(false);
    
    if (term.trim()) {
      dispatch(searchCourses({
        query: term.trim(),
        page: 1,
        pageSize: 20,
      }));
    } else {
      // Clear search, show all courses
      if (courses.length === 0) {
        dispatch(fetchCourses({ page: 1, pageSize: 20 }));
      }
    }
  }, [dispatch, courses.length]);

  // Handle nearby courses
  const handleNearbyPress = useCallback(() => {
    // For now, use a default location (Faughan Valley Golf Centre area)
    // TODO: Integrate with actual location service
    const defaultLocation = {
      latitude: 55.0461,
      longitude: -7.3267,
      radiusKm: 50,
    };

    Alert.alert(
      'Location Access',
      'This feature will find courses near you. Using demo location for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Find Nearby',
          onPress: () => {
            setSearchTerm('');
            setShowingNearby(true);
            dispatch(fetchNearbyCourses(defaultLocation));
          },
        },
      ]
    );
  }, [dispatch]);

  // Handle pull to refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    
    if (showingNearby) {
      // Refresh nearby courses
      const defaultLocation = {
        latitude: 55.0461,
        longitude: -7.3267,
        radiusKm: 50,
      };
      dispatch(fetchNearbyCourses(defaultLocation))
        .finally(() => setRefreshing(false));
    } else if (searchTerm.trim()) {
      // Refresh search results
      dispatch(searchCourses({
        query: searchTerm.trim(),
        page: 1,
        pageSize: 20,
      })).finally(() => setRefreshing(false));
    } else {
      // Refresh all courses
      dispatch(fetchCourses({ page: 1, pageSize: 20 }))
        .finally(() => setRefreshing(false));
    }
  }, [dispatch, showingNearby, searchTerm]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading || showingNearby || searchTerm.trim()) {
      return; // Don't paginate for search results or nearby courses
    }

    const nextPage = Math.floor(courses.length / (pagination?.pageSize || 20)) + 1;
    dispatch(fetchCourses({ 
      page: nextPage, 
      pageSize: pagination?.pageSize || 20 
    }));
  }, [dispatch, hasMore, isLoading, showingNearby, searchTerm, courses.length, pagination]);

  // Handle active round cleanup
  const handleCleanupActiveRound = useCallback(async (activeRound: any, onComplete: () => void) => {
    Alert.alert(
      'Active Round Detected',
      `You have an active round in progress at ${activeRound.course?.name || 'Unknown Course'}. What would you like to do?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Round',
          onPress: async () => {
            try {
              await dispatch(completeRound(activeRound.id)).unwrap();
              Alert.alert('Round Completed', 'Your previous round has been completed.', [
                { text: 'OK', onPress: onComplete }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to complete previous round. Please try again.');
            }
          }
        },
        {
          text: 'Abandon Round',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(abandonRound(activeRound.id)).unwrap();
              Alert.alert('Round Abandoned', 'Your previous round has been abandoned.', [
                { text: 'OK', onPress: onComplete }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to abandon previous round. Please try again.');
            }
          }
        }
      ]
    );
  }, [dispatch]);

  // Handle course selection with proper validation and error handling
  const handleCourseSelect = useCallback((course: CourseListItem) => {
    const startNewRound = async () => {
      try {
        // Pre-flight validation
        const roundApi = (await import('../../services/roundApi')).default;
        const validation = await roundApi.validateRoundCreation(course.id);
        
        if (!validation.canCreate) {
          if (validation.activeRound) {
            // Handle existing active round
            handleCleanupActiveRound(validation.activeRound, () => startNewRound());
            return;
          } else {
            // Generic validation failure
            Alert.alert('Unable to Start Round', validation.reason || 'Please try again later.');
            return;
          }
        }

        // Proceed with round creation
        await roundApi.createAndStartRound(course.id);
        
        // Update Redux state
        await dispatch(fetchActiveRound());
        
        // Navigate to Active Round screen
        navigation.navigate('ActiveRound' as never);
        
      } catch (error: any) {
        console.error('Failed to start round:', error);
        
        // Handle specific error types
        if (error.response?.status === 409) {
          // 409 Conflict - likely existing active round
          Alert.alert(
            'Round Creation Conflict',
            'You may already have an active round. Please check your active round or try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Check Active Round', onPress: () => navigation.navigate('ActiveRound' as never) }
            ]
          );
        } else if (error.response?.status >= 500) {
          // Server error
          Alert.alert(
            'Server Error',
            'There was a problem with the server. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          // Generic error
          Alert.alert(
            'Error Starting Round',
            error.message || 'Failed to start round. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    Alert.alert(
      'Start New Round',
      `Start a new round at ${course.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Round', onPress: startNewRound }
      ]
    );
  }, [navigation, dispatch, handleCleanupActiveRound]);

  // Handle course details
  const handleCoursePress = useCallback((course: CourseListItem) => {
    navigation.navigate('CourseDetail', { 
      courseId: course.id, 
      courseName: course.name 
    });
  }, [navigation]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    dispatch(clearError());
    
    if (showingNearby) {
      handleNearbyPress();
    } else if (searchTerm.trim()) {
      handleSearch(searchTerm);
    } else {
      dispatch(fetchCourses({ page: 1, pageSize: 20 }));
    }
  }, [dispatch, showingNearby, searchTerm, handleNearbyPress, handleSearch]);

  // Determine which course list to show
  const getCourseList = (): CourseListItem[] => {
    if (showingNearby) return nearbyCourses;
    if (searchTerm.trim()) return searchResults;
    return courses;
  };

  const courseList = getCourseList();
  const isCurrentlyLoading = showingNearby ? isLoadingNearby : (searchTerm.trim() ? isSearching : isLoading);

  // Render course item
  const renderCourseItem = ({ item }: { item: CourseListItem }) => (
    <CourseCard
      course={item}
      onPress={() => handleCoursePress(item)}
      onSelect={() => handleCourseSelect(item)}
      showDistance={showingNearby}
    />
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isCurrentlyLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {searchTerm.trim() ? 'No courses found' : 
           showingNearby ? 'No nearby courses' : 'No courses available'}
        </Text>
        <Text style={styles.emptyDescription}>
          {searchTerm.trim() ? 'Try a different search term' :
           showingNearby ? 'Try expanding your search radius' :
           'Pull down to refresh or try searching'}
        </Text>
      </View>
    );
  };

  // Render footer
  const renderFooter = () => {
    if (!hasMore || showingNearby || searchTerm.trim()) return null;
    
    return (
      <View style={styles.footerLoading}>
        <LoadingSpinner size="small" />
        <Text style={styles.footerText}>Loading more courses...</Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <CourseSearchBar
          onSearch={handleSearch}
          onLocationPress={handleNearbyPress}
          isLocationLoading={isLoadingNearby}
        />
        <ErrorMessage 
          message={error} 
          onRetry={handleRetry}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Contextual Header for Start New Round Flow */}
      {fromActiveRound && (
        <View style={styles.contextualHeader}>
          <Text style={styles.contextualHeaderText}>
            Select a course below to start your new round
          </Text>
        </View>
      )}
      
      {/* Search Bar */}
      <CourseSearchBar
        onSearch={handleSearch}
        onLocationPress={handleNearbyPress}
        isLocationLoading={isLoadingNearby}
      />

      {/* Course List */}
      {isCurrentlyLoading && courseList.length === 0 ? (
        <LoadingSpinner message="Loading courses..." />
      ) : (
        <FlatList
          data={courseList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCourseItem}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2c5530']}
              tintColor="#2c5530"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={courseList.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contextualHeader: {
    backgroundColor: '#e8f5e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#c3e6c3',
  },
  contextualHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoading: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default CoursesScreen;