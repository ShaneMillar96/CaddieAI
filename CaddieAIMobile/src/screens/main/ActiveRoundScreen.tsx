import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppDispatch, RootState } from '../../store';
import {
  fetchActiveRound,
  pauseRound,
  resumeRound,
  completeRound,
  abandonRound,
  fetchHoleScores,
} from '../../store/slices/roundSlice';
import {
  toggleVoiceInterface,
  startVoiceSession,
  endVoiceSession,
  updateCurrentLocation,
} from '../../store/slices/voiceSlice';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import RoundProgressCard from '../../components/common/RoundProgressCard';
import ScorecardComponent from '../../components/common/ScorecardComponent';
import RoundStatsWidget from '../../components/common/RoundStatsWidget';
import HoleNavigator from '../../components/common/HoleNavigator';
import VoiceAIInterface, { ConversationMessage } from '../../components/voice/VoiceAIInterface';
import { golfLocationService, LocationData } from '../../services/LocationService';

// Navigation types
type MainStackParamList = {
  Home: undefined;
  Courses: undefined;
  CourseDetail: { courseId: number; courseName?: string };
  AIChat: undefined;
};

type ActiveRoundScreenNavigationProp = StackNavigationProp<MainStackParamList>;

export const ActiveRoundScreen: React.FC = () => {
  const navigation = useNavigation<ActiveRoundScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const {
    activeRound,
    isLoading,
    isUpdating,
    isCompleting,
    error,
  } = useSelector((state: RootState) => state.rounds);

  const {
    isVoiceInterfaceVisible,
    currentLocation,
    conversationHistory,
  } = useSelector((state: RootState) => state.voice);

  const { user } = useSelector((state: RootState) => state.auth);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Load active round and hole scores on component mount
  useEffect(() => {
    const loadRoundData = async () => {
      try {
        const result = await dispatch(fetchActiveRound()).unwrap();
        if (result) {
          setCurrentHole(result.currentHole || 1);
          // Load hole scores for the active round
          dispatch(fetchHoleScores(result.id));
          
          // Start voice session for this round
          if (user?.id) {
            dispatch(startVoiceSession({ roundId: result.id }));
            
            // Start location tracking
            await startLocationTracking(result.id, result.courseId);
          }
        }
      } catch (error) {
        console.log('Error loading active round:', error);
      }
    };

    loadRoundData();
    
    // Cleanup on unmount
    return () => {
      if (activeRound?.id) {
        dispatch(endVoiceSession());
        stopLocationTracking();
      }
    };
  }, [dispatch, user?.id]);

  // Start location tracking for the round
  const startLocationTracking = async (roundId: number, courseId: number) => {
    try {
      const hasPermission = await golfLocationService.requestLocationPermissions();
      if (!hasPermission) {
        setLocationPermissionGranted(false);
        return;
      }

      setLocationPermissionGranted(true);
      
      const trackingStarted = await golfLocationService.startRoundTracking(roundId, courseId);
      if (trackingStarted) {
        setIsLocationTracking(true);
        
        // Subscribe to location updates
        const unsubscribeLocation = golfLocationService.onLocationUpdate(handleLocationUpdate);
        const unsubscribeContext = golfLocationService.onContextUpdate(handleContextUpdate);
        const unsubscribeShots = golfLocationService.onShotDetection(handleShotDetection);
        
        // Store unsubscribe functions for cleanup
        return () => {
          unsubscribeLocation();
          unsubscribeContext();
          unsubscribeShots();
        };
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Location Error', 'Failed to start GPS tracking. Some features may not work properly.');
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    golfLocationService.stopRoundTracking();
    setIsLocationTracking(false);
  };

  // Handle location updates from GPS service
  const handleLocationUpdate = useCallback((location: LocationData) => {
    // Update Redux state with current location
    dispatch(updateCurrentLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    }));
  }, [dispatch]);

  // Handle course context updates (hole detection, distances)
  const handleContextUpdate = useCallback((context: any) => {
    // Update current hole if detected
    if (context.currentHole && context.currentHole !== currentHole) {
      setCurrentHole(context.currentHole);
    }
    
    // Update location context in Redux
    dispatch(updateCurrentLocation({
      latitude: currentLocation?.latitude || 0,
      longitude: currentLocation?.longitude || 0,
      currentHole: context.currentHole,
      distanceToPin: context.distanceToPin,
      distanceToTee: context.distanceToTee,
      positionOnHole: context.positionOnHole,
    }));
  }, [dispatch, currentHole, currentLocation]);

  // Handle shot detection events
  const handleShotDetection = useCallback((shotData: any) => {
    if (shotData.detected) {
      console.log('Shot detected:', shotData);
      // Could show a notification or update UI to reflect shot
      Alert.alert(
        'Shot Detected',
        `Detected a ${shotData.distance?.toFixed(0)}m shot with ${shotData.estimatedClub}`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle voice conversation updates
  const handleConversationUpdate = useCallback((conversation: ConversationMessage[]) => {
    // Conversation is already managed by the VoiceAIInterface component
    // and stored in Redux state
    console.log('Conversation updated:', conversation.length, 'messages');
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await dispatch(fetchActiveRound()).unwrap();
      if (result) {
        dispatch(fetchHoleScores(result.id));
      }
    } catch (error) {
      console.log('Error refreshing round data');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Handle round control actions
  const handlePauseRound = useCallback(async () => {
    if (!activeRound) return;

    try {
      await dispatch(pauseRound(activeRound.id)).unwrap();
      Alert.alert('Round Paused', 'Your round has been paused successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to pause round. Please try again.');
    }
  }, [dispatch, activeRound]);

  const handleResumeRound = useCallback(async () => {
    if (!activeRound) return;

    try {
      await dispatch(resumeRound(activeRound.id)).unwrap();
      Alert.alert('Round Resumed', 'Your round has been resumed successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resume round. Please try again.');
    }
  }, [dispatch, activeRound]);

  const handleCompleteRound = useCallback(async () => {
    if (!activeRound) return;

    Alert.alert(
      'Complete Round',
      'Are you sure you want to complete this round? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await dispatch(completeRound(activeRound.id)).unwrap();
              Alert.alert(
                'Round Complete',
                'Congratulations! Your round has been completed successfully.',
                [
                  {
                    text: 'View Summary',
                    onPress: () => navigation.navigate('Home'),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to complete round. Please try again.');
            }
          },
        },
      ]
    );
  }, [dispatch, activeRound, navigation]);

  const handleAbandonRound = useCallback(async () => {
    if (!activeRound) return;

    Alert.alert(
      'Abandon Round',
      'Are you sure you want to abandon this round? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(abandonRound(activeRound.id)).unwrap();
              Alert.alert('Round Abandoned', 'Your round has been abandoned.');
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', 'Failed to abandon round. Please try again.');
            }
          },
        },
      ]
    );
  }, [dispatch, activeRound, navigation]);

  // Handle hole navigation
  const handleHoleChange = useCallback((holeNumber: number) => {
    setCurrentHole(holeNumber);
  }, []);

  // Navigate to AI Chat
  const handleAIChatPress = useCallback(() => {
    navigation.navigate('AIChat');
  }, [navigation]);

  // Toggle voice interface
  const handleVoiceToggle = useCallback(() => {
    dispatch(toggleVoiceInterface());
  }, [dispatch]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchActiveRound())}
        />
      </SafeAreaView>
    );
  }

  // No active round state
  if (!activeRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="golf-course" size={80} color="#4a7c59" />
          <Text style={styles.emptyTitle}>No Active Round</Text>
          <Text style={styles.emptyDescription}>
            Start a new round to begin tracking your game with GPS location tracking,
            score keeping, and AI-powered recommendations.
          </Text>
          <TouchableOpacity
            style={styles.startRoundButton}
            onPress={() => navigation.navigate('Courses' as any, { 
              screen: 'CoursesList', 
              params: { fromActiveRound: true } 
            })}
          >
            <Icon name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startRoundButtonText}>Start New Round</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Round control buttons based on status
  const renderRoundControls = () => {
    const isPaused = activeRound.status === 'Paused';
    const isInProgress = activeRound.status === 'InProgress';

    return (
      <View style={styles.controlsContainer}>
        {isPaused && (
          <TouchableOpacity
            style={[styles.controlButton, styles.resumeButton]}
            onPress={handleResumeRound}
            disabled={isUpdating}
          >
            <Icon name="play-arrow" size={20} color="#fff" />
            <Text style={styles.controlButtonText}>Resume</Text>
          </TouchableOpacity>
        )}

        {isInProgress && (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={handlePauseRound}
            disabled={isUpdating}
          >
            <Icon name="pause" size={20} color="#fff" />
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, styles.completeButton]}
          onPress={handleCompleteRound}
          disabled={isCompleting}
        >
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.controlButtonText}>Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.abandonButton]}
          onPress={handleAbandonRound}
          disabled={isUpdating}
        >
          <Icon name="close" size={20} color="#fff" />
          <Text style={styles.controlButtonText}>Abandon</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Round Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {activeRound.course?.name || 'Unknown Course'}
            </Text>
            {/* Location Status */}
            {currentLocation && (
              <Text style={styles.locationStatus}>
                📍 {currentLocation.distanceToPin ? `${currentLocation.distanceToPin.toFixed(0)}m to pin` : 'GPS Active'}
              </Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, isVoiceInterfaceVisible && styles.activeButton]}
              onPress={handleVoiceToggle}
            >
              <Icon name="mic" size={24} color={isVoiceInterfaceVisible ? "#fff" : "#4a7c59"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAIChatPress}
            >
              <Icon name="chat" size={24} color="#4a7c59" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Round Progress Card */}
        <RoundProgressCard
          round={activeRound}
          currentHole={currentHole}
          onHolePress={handleHoleChange}
        />

        {/* Hole Navigator */}
        <HoleNavigator
          totalHoles={18}
          currentHole={currentHole}
          onHoleSelect={handleHoleChange}
          holeScores={activeRound.holeScores || []}
        />

        {/* Current Hole Scorecard */}
        <ScorecardComponent
          round={activeRound}
          currentHole={currentHole}
          holeScores={activeRound.holeScores || []}
        />

        {/* Round Statistics */}
        <RoundStatsWidget
          round={activeRound}
          holeScores={activeRound.holeScores || []}
        />

        {/* Round Controls */}
        {renderRoundControls()}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Voice AI Interface */}
      {activeRound && user && (
        <VoiceAIInterface
          userId={Number(user.id)}
          roundId={activeRound.id}
          currentHole={currentHole}
          isVisible={isVoiceInterfaceVisible}
          onToggle={handleVoiceToggle}
          onConversationUpdate={handleConversationUpdate}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 30,
  },
  startRoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a7c59',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startRoundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4a7c59',
    fontWeight: '500',
  },
  locationStatus: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#4a7c59',
    borderColor: '#4a7c59',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: '#28a745',
  },
  pauseButton: {
    backgroundColor: '#ffc107',
  },
  completeButton: {
    backgroundColor: '#007bff',
  },
  abandonButton: {
    backgroundColor: '#dc3545',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ActiveRoundScreen;