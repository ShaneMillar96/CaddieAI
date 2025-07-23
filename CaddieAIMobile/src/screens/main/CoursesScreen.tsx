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
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { 
  fetchCourses, 
  searchCourses, 
  fetchNearbyCourses,
  clearError 
} from '../../store/slices/courseSlice';
import { CourseCard } from '../../components/common/CourseCard';
import { CourseSearchBar } from '../../components/common/CourseSearchBar';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { CourseListItem } from '../../types/golf';

export const CoursesScreen: React.FC = () => {
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

  // Handle course selection
  const handleCourseSelect = useCallback((course: CourseListItem) => {
    Alert.alert(
      'Course Selected',
      `You selected ${course.name}. This will start a new round.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Round', onPress: () => {
          // TODO: Navigate to round setup or start round
          console.log('Starting round at:', course.name);
        }},
      ]
    );
  }, []);

  // Handle course details
  const handleCoursePress = useCallback((course: CourseListItem) => {
    Alert.alert(
      'Course Details',
      `View detailed information about ${course.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Details', onPress: () => {
          // TODO: Navigate to course details screen
          console.log('Viewing details for:', course.name);
        }},
      ]
    );
  }, []);

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