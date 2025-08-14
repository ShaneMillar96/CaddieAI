import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Text,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppDispatch, RootState } from '../../store';
import { 
  fetchUserCourses,
  checkProximityToUserCourses,
  detectCurrentCourse,
  clearError,
  clearProximityStatus
} from '../../store/slices/userCoursesSlice';
import { 
  fetchActiveRound,
  abandonRound,
  completeRound 
} from '../../store/slices/roundSlice';
import { CourseCard } from '../../components/common/CourseCard';
import { DetectCourseModal } from '../../components/common/DetectCourseModal';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import { UserCourse } from '../../types/golf';
import type { CoursesStackParamList } from '../../navigation/CoursesNavigator';
import { golfLocationService, LocationData } from '../../services/LocationService';
import { verifyMockLocationProximity } from '../../utils/locationTesting';

type MyCoursesScreenNavigationProp = StackNavigationProp<CoursesStackParamList, 'MyCourses'>;

export const MyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<MyCoursesScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const {
    userCourses,
    isLoading,
    isDetecting,
    showDetectModal,
    error,
    proximityStatus,
    isCheckingProximity,
  } = useSelector((state: RootState) => state.userCourses);

  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // Validate and filter userCourses to prevent undefined values
  const validUserCourses = React.useMemo(() => {
    if (!Array.isArray(userCourses)) {
      console.error('❌ userCourses is not an array:', userCourses);
      return [];
    }
    
    console.log('🔍 UserCourses validation - processing', userCourses.length, 'courses');
    
    const filtered = userCourses.filter((course, index) => {
      if (!course) {
        console.warn('⚠️ Found null/undefined course in userCourses array at index:', index);
        return false;
      }
      
      if (typeof course !== 'object') {
        console.warn('⚠️ Found non-object course in userCourses array at index:', index, course);
        return false;
      }
      
      // Log the actual structure of the course for debugging
      console.log(`🔍 Course ${index + 1} structure:`, {
        id: course.id,
        name: course.name,
        courseName: course.courseName,
        latitude: course.latitude,
        longitude: course.longitude,
        allKeys: Object.keys(course)
      });
      
      // Check for required fields - handle both 'name' and 'courseName' fields
      const hasValidId = course.id && (typeof course.id === 'number' || typeof course.id === 'string');
      const hasValidName = course.name || course.courseName; // Accept either field
      const hasValidLatitude = typeof course.latitude === 'number' && !isNaN(course.latitude);
      const hasValidLongitude = typeof course.longitude === 'number' && !isNaN(course.longitude);
      
      if (!hasValidId || !hasValidName || !hasValidLatitude || !hasValidLongitude) {
        console.warn('⚠️ Course failed validation:', {
          index: index + 1,
          hasValidId,
          hasValidName,
          hasValidLatitude,
          hasValidLongitude,
          course: {
            id: course.id,
            name: course.name,
            courseName: course.courseName,
            latitude: course.latitude,
            longitude: course.longitude
          }
        });
        return false;
      }
      
      console.log(`✅ Course ${index + 1} passed validation:`, course.name || course.courseName);
      return true;
    });
    
    console.log(`🔍 Validation results: ${userCourses.length} -> ${filtered.length} courses ${filtered.length !== userCourses.length ? `(removed ${userCourses.length - filtered.length} invalid entries)` : '(all valid)'}`);
    
    return filtered;
  }, [userCourses]);

  // Load user courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 MyCoursesScreen: Screen focused - userCourses.length:', userCourses.length, 'isLoading:', isLoading);
      console.log('📡 MyCoursesScreen: Dispatching fetchUserCourses action on focus');
      dispatch(fetchUserCourses());
      
      // Cleanup function when screen loses focus
      return () => {
        console.log('🏠 MyCoursesScreen: Screen lost focus - clearing proximity status');
        dispatch(clearProximityStatus());
      };
    }, [dispatch])
  );

  // Get user's location and check proximity when userCourses are loaded
  useEffect(() => {
    const fetchUserLocationAndCheckProximity = async () => {
      // Only proceed if we have valid user courses to check against
      if (validUserCourses.length === 0) {
        console.log('🔍 MyCoursesScreen: No valid user courses loaded yet, skipping location check');
        return;
      }

      try {
        console.log('📍 MyCoursesScreen: Starting location acquisition for proximity check');
        const hasPermission = await golfLocationService.requestLocationPermissions();
        if (hasPermission) {
          const location = await golfLocationService.getCurrentPosition();
          if (location) {
            setUserLocation(location);
            console.log('📍 MyCoursesScreen: Location acquired, checking proximity to', validUserCourses.length, 'valid courses');
            
            // Check proximity to user courses using Redux thunk
            dispatch(checkProximityToUserCourses({
              latitude: location.latitude,
              longitude: location.longitude,
            }));
          } else {
            console.warn('📍 MyCoursesScreen: Location permission granted but no location received');
          }
        } else {
          console.warn('📍 MyCoursesScreen: Location permission denied');
        }
      } catch (error) {
        console.error('📍 MyCoursesScreen: Error during location acquisition:', error);
      }
    };

    fetchUserLocationAndCheckProximity();
  }, [dispatch, validUserCourses.length]); // Trigger when valid user courses are loaded

  // Run proximity verification for debugging (moved out of render function)
  useEffect(() => {
    if (validUserCourses.length > 0) {
      validUserCourses.forEach((course) => {
        try {
          const courseName = course.name || course.courseName;
          verifyMockLocationProximity(course.latitude, course.longitude, courseName);
        } catch (error) {
          const courseName = course.name || course.courseName;
          console.error('❌ Error in proximity verification for course:', courseName, error);
        }
      });
    }
  }, [validUserCourses]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('🔄 MyCoursesScreen: Pull-to-refresh initiated');
    
    try {
      // First refresh user courses
      await dispatch(fetchUserCourses()).unwrap();
      console.log('✅ MyCoursesScreen: User courses refreshed successfully');
      
      // Then refresh location and proximity if we have valid courses
      if (validUserCourses.length > 0) {
        const hasPermission = await golfLocationService.requestLocationPermissions();
        if (hasPermission) {
          const location = await golfLocationService.getCurrentPosition();
          if (location) {
            setUserLocation(location);
            console.log('📍 MyCoursesScreen: Location refreshed, updating proximity');
            
            // Check proximity again using Redux
            dispatch(checkProximityToUserCourses({
              latitude: location.latitude,
              longitude: location.longitude,
            }));
          } else {
            console.warn('📍 MyCoursesScreen: Could not get location during refresh');
          }
        }
      }
    } catch (error) {
      console.error('🔄 MyCoursesScreen: Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, validUserCourses.length]);

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

  // Handle course selection for playing golf
  const handlePlayGolf = useCallback((course: UserCourse) => {
    const courseName = course.name || course.courseName;
    const isWithinBounds = proximityStatus[course.id] || false;
    
    if (!isWithinBounds) {
      Alert.alert(
        'Not at Course',
        `You need to be at ${courseName} to start a round. The "Play Golf" button will be enabled when you arrive at the course.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const startNewRound = async () => {
      try {
        // Pre-flight validation
        const roundApi = (await import('../../services/roundApi')).default;
        const validation = await roundApi.validateRoundCreation(course.courseId);
        
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
        await roundApi.createAndStartRound(course.courseId);
        
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
      `Start a new round at ${courseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Round', onPress: startNewRound }
      ]
    );
  }, [navigation, dispatch, handleCleanupActiveRound, proximityStatus]);

  // Handle course details
  const handleCoursePress = useCallback((course: UserCourse) => {
    const courseName = course.name || course.courseName;
    // Navigate to course detail screen if available
    // For now, just show course info
    Alert.alert(
      courseName,
      `Times Played: ${course.timesPlayed}\n` +
      `Average Score: ${course.averageScore ? course.averageScore.toFixed(1) : 'N/A'}\n` +
      `Last Played: ${course.lastPlayedDate ? new Date(course.lastPlayedDate).toLocaleDateString() : 'Never'}`,
      [{ text: 'OK' }]
    );
  }, []);

  // Handle detect course
  const handleDetectCourse = useCallback(async () => {
    if (!userLocation) {
      // Try to get current location
      try {
        const hasPermission = await golfLocationService.requestLocationPermissions();
        if (hasPermission) {
          const location = await golfLocationService.getCurrentPosition();
          if (location) {
            setUserLocation(location);
            dispatch(detectCurrentCourse({
              latitude: location.latitude,
              longitude: location.longitude,
            }));
          } else {
            Alert.alert(
              'Location Required',
              'Unable to get your current location. Please ensure location services are enabled and try again.',
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Location Permission Required',
            'Location permission is required to detect nearby golf courses.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert(
          'Location Error',
          'Failed to get your current location. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // Use existing location
      dispatch(detectCurrentCourse({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }));
    }
  }, [dispatch, userLocation]);

  // Handle course detection errors
  useEffect(() => {
    if (error && !isDetecting) {
      // Clear error after showing user feedback
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 100);

      if (error.includes('No golf course detected')) {
        Alert.alert(
          'No Courses Found',
          'No golf courses detected at your current location. Try moving closer to a golf course and detecting again.',
          [{ text: 'OK' }]
        );
      } else if (error.includes('access token') || error.includes('401')) {
        Alert.alert(
          'Configuration Error', 
          'Golf course detection is temporarily unavailable. Please try again later.',
          [{ text: 'OK' }]
        );
      } else if (error.includes('Failed to detect')) {
        Alert.alert(
          'Detection Failed',
          'Unable to detect golf courses. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Generic error
        Alert.alert(
          'Error',
          error,
          [{ text: 'OK' }]
        );
      }

      return () => clearTimeout(timer);
    }
  }, [error, isDetecting, dispatch]);

  // Handle error retry
  const handleRetry = useCallback(() => {
    dispatch(clearError());
    dispatch(fetchUserCourses());
  }, [dispatch]);

  // Calculate distance to course if user location is available
  const calculateDistance = (courseLat: number, courseLon: number): number | undefined => {
    try {
      if (!userLocation) return undefined;
      
      // Validate input parameters
      if (typeof courseLat !== 'number' || typeof courseLon !== 'number') {
        console.warn('⚠️ Invalid course coordinates for distance calculation:', courseLat, courseLon);
        return undefined;
      }
      
      if (typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
        console.warn('⚠️ Invalid user location for distance calculation:', userLocation);
        return undefined;
      }
      
      const R = 6371000; // Earth's radius in meters
      const dLat = (courseLat - userLocation.latitude) * Math.PI / 180;
      const dLon = (courseLon - userLocation.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(courseLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceInMeters = R * c;
      const distanceInMiles = distanceInMeters * 0.000621371; // Convert to miles
      
      // Validate result
      if (!Number.isFinite(distanceInMiles) || distanceInMiles < 0) {
        console.warn('⚠️ Invalid distance calculation result:', distanceInMiles);
        return undefined;
      }
      
      return distanceInMiles;
    } catch (error) {
      console.error('❌ Error calculating distance:', error, 'courseLat:', courseLat, 'courseLon:', courseLon);
      return undefined;
    }
  };

  // Render course item with Play Golf functionality
  const renderCourseItem = ({ item }: { item: UserCourse }) => {
    // Defensive programming: Check for undefined/null item
    if (!item || typeof item !== 'object') {
      console.error('❌ renderCourseItem: Invalid item passed to renderCourseItem:', item);
      return null;
    }

    // Defensive programming: Check for required properties (handle both name and courseName)
    const itemName = item.name || item.courseName;
    if (!item.id || !itemName || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
      console.error('❌ renderCourseItem: Item missing required properties:', {
        id: item.id,
        name: item.name,
        courseName: item.courseName,
        latitude: item.latitude,
        longitude: item.longitude
      });
      return null;
    }

    try {
      const distance = calculateDistance(item.latitude, item.longitude);
      const isWithinBounds = proximityStatus[item.id] || false;
      
      console.log(`🎯 Render: Course ${itemName} (ID: ${item.id}) - Distance: ${distance ? `${Math.round(distance * 5280)}ft` : 'unknown'}, Within bounds: ${isWithinBounds}`);
    
    return (
      <View style={styles.courseItem}>
        <TouchableOpacity
          style={styles.courseCard}
          onPress={() => handleCoursePress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.courseHeader}>
            <View style={styles.courseInfo}>
              <Text style={styles.courseName} numberOfLines={2}>
                {itemName}
              </Text>
              {item.city && item.state && (
                <Text style={styles.courseLocation} numberOfLines={1}>
                  {item.city}, {item.state}
                </Text>
              )}
              {distance !== undefined && (
                <Text style={styles.courseDistance}>
                  {distance < 0.1 ? 
                    `${Math.round(distance * 5280)} ft away` :
                    `${distance.toFixed(1)} miles away`
                  }
                </Text>
              )}
            </View>
            <View style={styles.courseStats}>
              <Text style={styles.statValue}>{item.totalHoles}</Text>
              <Text style={styles.statLabel}>Holes</Text>
            </View>
          </View>
          
          <View style={styles.courseFooter}>
            <View style={styles.playStats}>
              <Text style={styles.playStatsText}>
                Played {item.timesPlayed} times
                {item.averageScore && ` • Avg: ${item.averageScore.toFixed(1)}`}
              </Text>
              {item.lastPlayedDate && (
                <Text style={styles.lastPlayedText}>
                  Last played: {new Date(item.lastPlayedDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.playGolfButton,
            isWithinBounds ? styles.playGolfButtonEnabled : styles.playGolfButtonDisabled
          ]}
          onPress={() => handlePlayGolf(item)}
          disabled={!isWithinBounds}
          activeOpacity={0.8}
        >
          <Icon 
            name="play-circle-filled" 
            size={20} 
            color={isWithinBounds ? '#fff' : '#ccc'} 
            style={styles.playIcon}
          />
          <Text style={[
            styles.playGolfButtonText,
            isWithinBounds ? styles.playGolfButtonTextEnabled : styles.playGolfButtonTextDisabled
          ]}>
            Play Golf
          </Text>
        </TouchableOpacity>
      </View>
    );
    } catch (error) {
      console.error('❌ renderCourseItem: Error rendering course item:', error, 'Item:', item);
      // Return a fallback UI instead of crashing
      return (
        <View style={styles.courseItem}>
          <View style={styles.courseCard}>
            <Text style={styles.courseName}>Error loading course</Text>
            <Text style={styles.courseLocation}>Please refresh to try again</Text>
          </View>
        </View>
      );
    }
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Icon name="golf-course" size={80} color="#c3e6c3" />
        <Text style={styles.emptyTitle}>No courses yet</Text>
        <Text style={styles.emptyDescription}>
          When you arrive at a golf course, use the "Detect Course" button to automatically 
          add it to your collection.
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, isDetecting && styles.exploreButtonDisabled]}
          onPress={handleDetectCourse}
          disabled={isDetecting}
          activeOpacity={0.8}
        >
          {isDetecting ? (
            <View style={styles.buttonContent}>
              <LoadingSpinner size="small" color="#fff" />
              <Text style={[styles.exploreButtonText, { marginLeft: 8 }]}>
                Detecting...
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Icon name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.exploreButtonText}>Detect Course</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
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
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>My Courses</Text>
            <Text style={styles.headerSubtitle}>
              {validUserCourses.length} course{validUserCourses.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.detectButton, isDetecting && styles.detectButtonDisabled]}
            onPress={handleDetectCourse}
            disabled={isDetecting}
            activeOpacity={0.8}
          >
            {isDetecting ? (
              <LoadingSpinner size="small" color="#fff" />
            ) : (
              <>
                <Icon name="search" size={20} color="#fff" />
                <Text style={styles.detectButtonText}>Detect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Course List */}
      {isLoading && validUserCourses.length === 0 ? (
        <LoadingSpinner message="Loading your courses..." />
      ) : (
        <FlatList
          data={validUserCourses}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          renderItem={renderCourseItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2c5530']}
              tintColor="#2c5530"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={validUserCourses.length === 0 ? styles.emptyContainer : styles.listContainer}
        />
      )}
      
      {/* Detect Course Modal */}
      <DetectCourseModal visible={showDetectModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  courseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  courseCard: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  courseDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4a7c59',
  },
  courseStats: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  courseFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  playStats: {
    marginBottom: 0,
  },
  playStatsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  lastPlayedText: {
    fontSize: 12,
    color: '#666',
  },
  playGolfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  playGolfButtonEnabled: {
    backgroundColor: '#2c5530',
  },
  playGolfButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  playIcon: {
    marginRight: 8,
  },
  playGolfButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  playGolfButtonTextEnabled: {
    color: '#fff',
  },
  playGolfButtonTextDisabled: {
    color: '#ccc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c5530',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  detectButton: {
    backgroundColor: '#2c5530',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  detectButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#2c5530',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MyCoursesScreen;