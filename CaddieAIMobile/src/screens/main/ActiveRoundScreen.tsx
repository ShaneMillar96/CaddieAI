import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
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
  setTargetPin,
  clearTargetPin,
  setMapType,
  setCourseRegion,
} from '../../store/slices/voiceSlice';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import VoiceAIInterface, { ConversationMessage } from '../../components/voice/VoiceAIInterface';
import GolfCourseMap from '../../components/map/GolfCourseMap';
import MapOverlay from '../../components/map/MapOverlay';
import { 
  golfLocationService, 
  LocationData, 
  MapLocationContext,
  isLocationServiceAvailable, 
  safeLocationServiceCall 
} from '../../services/LocationService';
import { DistanceCalculator, Coordinate, DistanceResult } from '../../utils/DistanceCalculator';

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
    mapState,
  } = useSelector((state: RootState) => state.voice);

  const { user } = useSelector((state: RootState) => state.auth);

  // Local state
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [targetDistance, setTargetDistance] = useState<DistanceResult | null>(null);
  const [showRoundControls, setShowRoundControls] = useState(false);

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
      if (!isLocationServiceAvailable()) {
        console.warn('Location service not available in ActiveRoundScreen');
        setLocationPermissionGranted(false);
        Alert.alert(
          'Location Service Unavailable', 
          'GPS tracking is currently unavailable. Please ensure location permissions are granted and restart the app.'
        );
        return;
      }

      const hasPermission = await safeLocationServiceCall(
        (service) => service.requestLocationPermissions(),
        false
      );
      
      if (!hasPermission) {
        setLocationPermissionGranted(false);
        return;
      }

      setLocationPermissionGranted(true);
      
      const trackingStarted = await safeLocationServiceCall(
        (service) => service.startRoundTracking(roundId, courseId),
        false
      );
      
      if (trackingStarted) {
        setIsLocationTracking(true);
        
        // Subscribe to location updates with safe calls
        const unsubscribeLocation = golfLocationService.onLocationUpdate(handleLocationUpdate);
        const unsubscribeContext = golfLocationService.onContextUpdate(handleContextUpdate);
        const unsubscribeShots = golfLocationService.onShotDetection(handleShotDetection);
        
        // Store unsubscribe functions for cleanup
        return () => {
          try {
            unsubscribeLocation();
            unsubscribeContext();
            unsubscribeShots();
          } catch (error) {
            console.error('Error unsubscribing from location updates:', error);
          }
        };
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Location Error', 'Failed to start GPS tracking. Some features may not work properly.');
    }
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    try {
      if (isLocationServiceAvailable()) {
        golfLocationService.stopRoundTracking();
      }
      setIsLocationTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      setIsLocationTracking(false);
    }
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

  // Handle target selection on map
  const handleTargetSelected = useCallback((coordinate: Coordinate, distance: DistanceResult) => {
    setTargetDistance(distance);
    
    // Update Redux state with target pin data
    const bearing = currentLocation ? DistanceCalculator.calculateBearing(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      coordinate
    ) : 0;

    dispatch(setTargetPin({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      distanceYards: distance.yards,
      bearing,
    }));

    // Update location service
    if (isLocationServiceAvailable()) {
      golfLocationService.setMapTargetPin(
        coordinate.latitude,
        coordinate.longitude,
        distance.yards,
        bearing
      );
    }
  }, [dispatch, currentLocation]);

  // Handle map location updates
  const handleMapLocationUpdate = useCallback((coordinate: Coordinate) => {
    // Update Redux with current map location
    dispatch(updateCurrentLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      accuracy: currentLocation?.accuracy,
      currentHole,
    }));
  }, [dispatch, currentLocation, currentHole]);

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

  // Handle settings press (could open a settings modal)
  const handleSettingsPress = useCallback(() => {
    // For now, just toggle map type between satellite and standard
    const newMapType = mapState.mapType === 'satellite' ? 'standard' : 'satellite';
    dispatch(setMapType(newMapType));
  }, [mapState.mapType, dispatch]);

  // Handle round controls press
  const handleRoundControlsPress = useCallback(() => {
    setShowRoundControls(!showRoundControls);
  }, [showRoundControls]);

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

  // Get course region for map initialization
  const getCourseRegion = useCallback(() => {
    if (mapState.courseRegion) {
      return mapState.courseRegion;
    }
    
    // Default to Faughan Valley Golf Centre coordinates
    return {
      latitude: 54.9783,
      longitude: -7.2054,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [mapState.courseRegion]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View - Full Screen */}
      <GolfCourseMap
        currentLocation={currentLocation}
        onTargetSelected={handleTargetSelected}
        onLocationUpdate={handleMapLocationUpdate}
        courseId={activeRound?.courseId}
        courseName={activeRound?.course?.name}
        initialRegion={getCourseRegion()}
        mapType={mapState.mapType}
        enableTargetPin={true}
      />

      {/* Map Overlay - Floating UI Controls */}
      <MapOverlay
        courseName={activeRound?.course?.name}
        currentHole={currentHole}
        currentLocation={currentLocation}
        targetDistance={targetDistance}
        isLocationTracking={isLocationTracking}
        isVoiceInterfaceVisible={isVoiceInterfaceVisible}
        onVoiceToggle={handleVoiceToggle}
        onSettingsPress={handleSettingsPress}
        onRoundControlsPress={handleRoundControlsPress}
        roundStatus={activeRound?.status}
        gpsAccuracy={currentLocation?.accuracy}
      />

      {/* Round Controls Modal (when requested) */}
      {showRoundControls && (
        <View style={styles.roundControlsModal}>
          <View style={styles.roundControlsContent}>
            <Text style={styles.roundControlsTitle}>Round Controls</Text>
            
            {activeRound?.status === 'Paused' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.resumeButton]}
                onPress={handleResumeRound}
                disabled={isUpdating}
              >
                <Icon name="play-arrow" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Resume Round</Text>
              </TouchableOpacity>
            )}

            {activeRound?.status === 'InProgress' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.pauseButton]}
                onPress={handlePauseRound}
                disabled={isUpdating}
              >
                <Icon name="pause" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Pause Round</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.completeButton]}
              onPress={handleCompleteRound}
              disabled={isCompleting}
            >
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Complete Round</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.abandonButton]}
              onPress={handleAbandonRound}
              disabled={isUpdating}
            >
              <Icon name="close" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Abandon Round</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowRoundControls(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Voice AI Interface - Positioned by the interface itself */}
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for map
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
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
  
  // Round Controls Modal Styles
  roundControlsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  roundControlsContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  roundControlsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6c757d',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActiveRoundScreen;