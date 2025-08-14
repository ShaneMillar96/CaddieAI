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
  clearError 
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
  } = useSelector((state: RootState) => state.userCourses);

  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [proximityStatus, setProximityStatus] = useState<{ [courseId: number]: boolean }>({});

  // Load user courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 MyCoursesScreen: Screen focused - userCourses.length:', userCourses.length, 'isLoading:', isLoading);
      console.log('📡 MyCoursesScreen: Dispatching fetchUserCourses action on focus');
      dispatch(fetchUserCourses());
    }, [dispatch])
  );

  // Get user's location on mount
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const hasPermission = await golfLocationService.requestLocationPermissions();
        if (hasPermission) {
          const location = await golfLocationService.getCurrentPosition();
          if (location) {
            setUserLocation(location);
            console.log('User location acquired:', location.latitude, location.longitude);
            
            // Check proximity to user courses
            const result = await dispatch(checkProximityToUserCourses({
              latitude: location.latitude,
              longitude: location.longitude,
            })).unwrap();
            
            if (result.isWithinBounds && result.courseId) {
              setProximityStatus({ [result.courseId]: true });
            }
          }
        }
      } catch (error) {
        console.log('Could not get user location:', error);
      }
    };

    fetchUserLocation();
  }, [dispatch]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Refresh user location
    try {
      const hasPermission = await golfLocationService.requestLocationPermissions();
      if (hasPermission) {
        const location = await golfLocationService.getCurrentPosition();
        if (location) {
          setUserLocation(location);
          
          // Check proximity again
          const result = await dispatch(checkProximityToUserCourses({
            latitude: location.latitude,
            longitude: location.longitude,
          })).unwrap();
          
          if (result.isWithinBounds && result.courseId) {
            setProximityStatus({ [result.courseId]: true });
          } else {
            setProximityStatus({});
          }
        }
      }
    } catch (error) {
      console.log('Could not refresh user location:', error);
    }
    
    // Refresh user courses
    console.log('🔄 MyCoursesScreen: Pull-to-refresh dispatching fetchUserCourses');
    dispatch(fetchUserCourses())
      .finally(() => setRefreshing(false));
  }, [dispatch]);

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
    const isWithinBounds = proximityStatus[course.id] || false;
    
    if (!isWithinBounds) {
      Alert.alert(
        'Not at Course',
        `You need to be at ${course.name} to start a round. The "Play Golf" button will be enabled when you arrive at the course.`,
        [{ text: 'OK' }]
      );
      return;
    }

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
  }, [navigation, dispatch, handleCleanupActiveRound, proximityStatus]);

  // Handle course details
  const handleCoursePress = useCallback((course: UserCourse) => {
    // Navigate to course detail screen if available
    // For now, just show course info
    Alert.alert(
      course.name,
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

  // Handle error retry
  const handleRetry = useCallback(() => {
    dispatch(clearError());
    dispatch(fetchUserCourses());
  }, [dispatch]);

  // Calculate distance to course if user location is available
  const calculateDistance = (courseLat: number, courseLon: number): number | undefined => {
    if (!userLocation) return undefined;
    
    const R = 6371000; // Earth's radius in meters
    const dLat = (courseLat - userLocation.latitude) * Math.PI / 180;
    const dLon = (courseLon - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(courseLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceInMeters = R * c;
    return distanceInMeters * 0.000621371; // Convert to miles
  };

  // Render course item with Play Golf functionality
  const renderCourseItem = ({ item }: { item: UserCourse }) => {
    const distance = calculateDistance(item.latitude, item.longitude);
    const isWithinBounds = proximityStatus[item.id] || false;
    
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
                {item.name}
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
              {userCourses.length} course{userCourses.length !== 1 ? 's' : ''}
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
      {isLoading && userCourses.length === 0 ? (
        <LoadingSpinner message="Loading your courses..." />
      ) : (
        <FlatList
          data={userCourses}
          keyExtractor={(item) => item.id.toString()}
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
          contentContainerStyle={userCourses.length === 0 ? styles.emptyContainer : styles.listContainer}
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