import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppDispatch, RootState } from '../../store';
import { fetchCourseById } from '../../store/slices/courseSlice';
import { 
  fetchActiveRound,
  abandonRound,
  completeRound 
} from '../../store/slices/roundSlice';
import { WeatherData } from '../../types/golf';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import HoleCard from '../../components/common/HoleCard';
import WeatherWidget from '../../components/common/WeatherWidget';
import courseApi from '../../services/courseApi';

// Navigation types - this would normally be defined in a navigation types file
type MainStackParamList = {
  CourseDetail: { courseId: number; courseName?: string };
  // Add other screens as needed
};

type CourseDetailScreenRouteProp = RouteProp<MainStackParamList, 'CourseDetail'>;
type CourseDetailScreenNavigationProp = StackNavigationProp<MainStackParamList, 'CourseDetail'>;

export const CourseDetailScreen: React.FC = () => {
  const route = useRoute<CourseDetailScreenRouteProp>();
  const navigation = useNavigation<CourseDetailScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { courseId, courseName } = route.params;

  // Redux state with deep copy to avoid immutability issues
  const {
    selectedCourse: reduxSelectedCourse,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.courses);

  // Create a mutable copy of the selected course
  const selectedCourse = reduxSelectedCourse ? JSON.parse(JSON.stringify(reduxSelectedCourse)) : null;

  // Local state for weather and refresh control
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set navigation title
  useEffect(() => {
    if (courseName) {
      try {
        navigation.setOptions({ title: courseName });
      } catch (error) {
        console.warn('Failed to set navigation title:', error);
      }
    }
  }, [navigation, courseName]);

  // Update navigation title when course data loads
  useEffect(() => {
    if (selectedCourse && selectedCourse.name && selectedCourse.name !== courseName) {
      try {
        navigation.setOptions({ title: selectedCourse.name });
      } catch (error) {
        console.warn('Failed to update navigation title:', error);
      }
    }
  }, [navigation, selectedCourse, courseName]);

  // Load weather data
  const loadWeather = useCallback(async () => {
    try {
      const weatherData = await courseApi.getCourseWeather(courseId);
      setWeather(weatherData);
    } catch (err) {
      console.warn('Failed to load weather data:', err);
      // Weather failure is not critical, so we don't show error
    } finally {
      setIsLoadingWeather(false);
    }
  }, [courseId]);

  // Load course data
  useEffect(() => {
    if (courseId) {
      dispatch(fetchCourseById(courseId));
      loadWeather();
    }
  }, [dispatch, courseId, loadWeather]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchCourseById(courseId)),
      loadWeather()
    ]).finally(() => setRefreshing(false));
  }, [dispatch, courseId, loadWeather]);

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

  // Handle start round with proper validation and error handling
  const handleStartRound = useCallback(() => {
    if (!selectedCourse) return;

    const startNewRound = async () => {
      try {
        // Pre-flight validation
        const roundApi = (await import('../../services/roundApi')).default;
        const validation = await roundApi.validateRoundCreation(selectedCourse.id);
        
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
        const newRound = await roundApi.createAndStartRound(selectedCourse.id);
        
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
      `Start a new round at ${selectedCourse.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Round', onPress: startNewRound }
      ]
    );
  }, [selectedCourse, navigation, dispatch, handleCleanupActiveRound]);

  // Handle retry
  const handleRetry = useCallback(() => {
    dispatch(fetchCourseById(courseId));
    setIsLoadingWeather(true);
    loadWeather();
  }, [dispatch, courseId, loadWeather]);

  if (isLoading) {
    return <LoadingSpinner message="Loading course details..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={handleRetry} />
      </View>
    );
  }

  if (!selectedCourse) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message="Course details not found" 
          onRetry={handleRetry} 
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#2c5530']}
          tintColor="#2c5530"
        />
      }
    >
      {/* Course Header */}
      <View style={styles.header}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{selectedCourse.name}</Text>
          <View style={styles.locationContainer}>
            <Icon name="place" size={16} color="#666" />
            <Text style={styles.location}>
              {[selectedCourse.city, selectedCourse.state, selectedCourse.country]
                .filter(item => item !== null && item !== undefined && item !== '')
                .join(', ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Course Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{selectedCourse.totalHoles}</Text>
          <Text style={styles.statLabel}>Holes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>Par {selectedCourse.parTotal}</Text>
          <Text style={styles.statLabel}>Par</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {selectedCourse.yardageTotal ? `${selectedCourse.yardageTotal}` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Yards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {selectedCourse.courseRating ? selectedCourse.courseRating.toFixed(1) : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Course Description */}
      {selectedCourse.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.description}>{selectedCourse.description}</Text>
        </View>
      )}

      {/* Weather Widget */}
      {weather && !isLoadingWeather && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Current Weather</Text>
          <WeatherWidget weather={weather} />
        </View>
      )}

      {/* Course Amenities */}
      {selectedCourse.amenities && typeof selectedCourse.amenities === 'object' && Object.keys(selectedCourse.amenities).length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {Object.entries(selectedCourse.amenities).map(([key, value]) => (
              value && (
                <View key={key} style={styles.amenityItem}>
                  <Icon name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.amenityText}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                </View>
              )
            ))}
          </View>
        </View>
      )}

      {/* Holes Section */}
      {selectedCourse.holes && selectedCourse.holes.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Hole-by-Hole Layout ({selectedCourse.holes.length} holes)
          </Text>
          {selectedCourse.holes
            .sort((a, b) => a.holeNumber - b.holeNumber)
            .map((hole) => (
              <HoleCard key={hole.id} hole={hole} />
            ))}
        </View>
      )}

      {/* Contact Information */}
      {(selectedCourse.phone || selectedCourse.website || selectedCourse.email) && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactContainer}>
            {selectedCourse.phone && (
              <View style={styles.contactItem}>
                <Icon name="phone" size={16} color="#666" />
                <Text style={styles.contactText}>{selectedCourse.phone}</Text>
              </View>
            )}
            {selectedCourse.website && (
              <View style={styles.contactItem}>
                <Icon name="language" size={16} color="#666" />
                <Text style={styles.contactText}>{selectedCourse.website}</Text>
              </View>
            )}
            {selectedCourse.email && (
              <View style={styles.contactItem}>
                <Icon name="email" size={16} color="#666" />
                <Text style={styles.contactText}>{selectedCourse.email}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Start Round Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startRoundButton}
          onPress={handleStartRound}
          activeOpacity={0.8}
        >
          <Icon name="golf-course" size={24} color="#fff" />
          <Text style={styles.startRoundText}>Start Round</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  courseInfo: {
    alignItems: 'center',
  },
  courseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  amenitiesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  contactContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
    marginTop: 24,
  },
  startRoundButton: {
    backgroundColor: '#2c5530',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startRoundText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default CourseDetailScreen;