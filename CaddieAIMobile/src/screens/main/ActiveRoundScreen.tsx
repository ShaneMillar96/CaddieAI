import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  NativeModules,
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
import {
  createShotPlacement,
  activateShotPlacement,
  cancelShotPlacement,
  setPlacingShot,
  setPreviewDistance,
  clearPreview,
  updateFromService,
  selectShotPlacementState,
  selectCurrentShot,
  selectIsActive,
  selectTargetLocation,
  selectDistances,
  selectClubRecommendation,
  selectServiceState,
  selectIsPlacingShot,
} from '../../store/slices/shotPlacementSlice';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import VoiceAIInterface from '../../components/voice/VoiceAIInterface';
import MapboxMapView from '../../components/map/MapboxMapView';
import MapboxMapOverlay from '../../components/map/MapboxMapOverlay';
import MapErrorBoundary from '../../components/map/MapErrorBoundary';
import { 
  simpleLocationService, 
  SimpleLocationData,
  isLocationServiceAvailable 
} from '../../services/SimpleLocationService';
import { mapboxService } from '../../services/MapboxService';
import { 
  shotPlacementService, 
  ShotPlacementState as ServiceShotPlacementState 
} from '../../services/ShotPlacementService';
import { textToSpeechService, golfTTSHelper } from '../../services/TextToSpeechService';
import voiceAIApiService from '../../services/voiceAIApi';

// Navigation types
type MainStackParamList = {
  Home: undefined;
  Courses: undefined;
  CourseDetail: { courseId: number; courseName?: string };
  AIChat: undefined;
};

type ActiveRoundScreenNavigationProp = StackNavigationProp<MainStackParamList>;

/**
 * ActiveRoundScreen - Mapbox Implementation
 * 
 * Enhanced functionality:
 * - Mapbox satellite map with vector overlays
 * - Real-time GPS tracking with accuracy indicators
 * - Golf-specific distance measurements
 * - Enhanced location permissions handling
 * - Professional map styling for golf courses
 * - Advanced voice interface integration
 * - Comprehensive round control access
 */
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
  } = useSelector((state: RootState) => state.voice);

  const { user } = useSelector((state: RootState) => state.auth);

  // Shot placement Redux state
  const shotPlacementState = useSelector(selectShotPlacementState);
  const currentShot = useSelector(selectCurrentShot);
  const isActiveShotPlacement = useSelector(selectIsActive);
  const targetLocation = useSelector(selectTargetLocation);
  const distances = useSelector(selectDistances);
  const clubRecommendation = useSelector(selectClubRecommendation);
  const serviceState = useSelector(selectServiceState);
  const isPlacingShot = useSelector(selectIsPlacingShot);

  // Local state - keep it simple
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showRoundControls, setShowRoundControls] = useState(false);
  const [isMapboxReady, setIsMapboxReady] = useState(false);
  
  // Shot placement mode state
  const [shotPlacementModeEnabled, setShotPlacementModeEnabled] = useState(false);
  const [serviceSyncInitialized, setServiceSyncInitialized] = useState(false);
  
  
  // Convert Redux currentLocation to SimpleLocationData format with stable reference
  const simpleLocationData: SimpleLocationData | null = useMemo(() => {
    if (!currentLocation || 
        typeof currentLocation.latitude !== 'number' || 
        typeof currentLocation.longitude !== 'number' ||
        currentLocation.latitude === 0 && currentLocation.longitude === 0) {
      return null;
    }
    
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy || 0,
      timestamp: Date.now(), // Only set timestamp when location actually changes
    };
  }, [currentLocation?.latitude, currentLocation?.longitude, currentLocation?.accuracy]);


  // Initialize active round
  useEffect(() => {
    const initializeRound = async () => {
      try {
        const result = await dispatch(fetchActiveRound()).unwrap();
        if (result) {
          setCurrentHole(result.currentHole || 1);
          dispatch(fetchHoleScores(result.id));
        }
      } catch (error) {
        console.error('Error loading active round:', error);
      }
    };

    initializeRound();
  }, [dispatch]);

  // Sync Redux state with shot placement service
  useEffect(() => {
    if (shotPlacementModeEnabled && !serviceSyncInitialized) {
      console.log('🎯 ActiveRoundScreen: Initializing shot placement service sync');
      const unsubscribe = shotPlacementService.onShotPlacementUpdate(
        (shotData, state) => {
          console.log('🔄 ActiveRoundScreen: Service state update:', state, shotData);
          dispatch(updateFromService({ shotData, serviceState: state }));
        }
      );
      
      setServiceSyncInitialized(true);
      
      // Cleanup on unmount or mode disable
      return () => {
        unsubscribe();
        setServiceSyncInitialized(false);
      };
    }
  }, [shotPlacementModeEnabled, dispatch]);

  // Handle shot placement service state changes for voice feedback
  useEffect(() => {
    if (shotPlacementModeEnabled && serviceState) {
      handleShotPlacementStateChange(serviceState);
    }
  }, [serviceState, distances.fromCurrent, clubRecommendation, shotPlacementModeEnabled]);

  // Initialize Mapbox service
  useEffect(() => {
    console.log('🗺️ ActiveRoundScreen: Initializing Mapbox service');
    
    // Import mapbox config utility dynamically to avoid loading issues
    const initializeMapbox = async () => {
      try {
        const { getMapboxConfig } = await import('../../utils/mapboxConfig');
        const config = getMapboxConfig();
        console.log('🗺️ ActiveRoundScreen: Loaded Mapbox config:', {
          hasToken: !!config.accessToken,
          tokenPrefix: config.accessToken.substring(0, 15) + '...'
        });
        mapboxService.initialize(config.accessToken);
        setIsMapboxReady(mapboxService.isConfigured());
      } catch (error) {
        console.error('❌ ActiveRoundScreen: Failed to load Mapbox config:', error);
        // Fallback to placeholder if config loading fails
        mapboxService.initialize('pk.your_mapbox_access_token_here');
        setIsMapboxReady(false);
      }
    };
    
    initializeMapbox();
  }, []);

  // Start location tracking when round is available
  useEffect(() => {
    console.log('🔍 ActiveRoundScreen: Location tracking effect triggered', {
      hasActiveRound: !!activeRound?.id,
      hasUser: !!user?.id,
      isLocationTracking,
      roundId: activeRound?.id,
      userId: user?.id
    });

    if (activeRound?.id && user?.id && !isLocationTracking) {
      console.log('✅ ActiveRoundScreen: Starting location tracking for round', activeRound.id);
      startLocationTracking();
    } else {
      console.log('⚠️ ActiveRoundScreen: Not starting location tracking:', {
        reason: !activeRound?.id ? 'no active round' : 
                !user?.id ? 'no user' : 
                isLocationTracking ? 'already tracking' : 'unknown'
      });
    }

    // Cleanup on unmount
    return () => {
      if (isLocationTracking) {
        console.log('🧹 ActiveRoundScreen: Cleaning up location tracking');
        stopLocationTracking();
      }
    };
  }, [activeRound?.id, user?.id]);

  // Start GPS tracking
  const startLocationTracking = useCallback(async () => {
    console.log('🚀 ActiveRoundScreen: Starting location tracking...');
    setIsRequestingLocation(true);
    
    // Mapbox readiness check
    try {
      const isMapboxConfigured = mapboxService.isConfigured();
      console.log('🗺️ Mapbox Service Status:', {
        configured: isMapboxConfigured,
        accessToken: mapboxService.getAccessToken().substring(0, 20) + '...'
      });
      
      if (!isMapboxConfigured) {
        console.warn('⚠️ Mapbox not properly configured, using placeholder token');
      }
    } catch (error) {
      console.log('ℹ️ Mapbox service check:', error);
    }
    
    if (!isLocationServiceAvailable()) {
      console.error('❌ ActiveRoundScreen: Location service not available');
      setLocationError('Location service not available');
      setIsRequestingLocation(false);
      return;
    }

    try {
      console.log('📡 ActiveRoundScreen: Setting up location subscriptions...');
      
      // Start voice session
      if (activeRound?.id) {
        console.log('🎙️ ActiveRoundScreen: Starting voice session for round', activeRound.id);
        dispatch(startVoiceSession({ roundId: activeRound.id }));
      }

      // Subscribe to location updates
      const unsubscribeLocation = simpleLocationService.onLocationUpdate(
        (location: SimpleLocationData) => {
          console.log('📍 ActiveRoundScreen: Location update received:', {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          });
          
          // Update Redux store
          dispatch(updateCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }));
          
          // Clear loading state once we get first location
          setIsRequestingLocation(false);
        }
      );

      // Subscribe to location errors
      const unsubscribeError = simpleLocationService.onLocationError(
        (error: string) => {
          console.error('❌ ActiveRoundScreen: Location error received:', error);
          setLocationError(error);
          setIsRequestingLocation(false);
        }
      );

      console.log('🎯 ActiveRoundScreen: Starting GPS tracking service...');
      
      // Start GPS tracking
      const success = await simpleLocationService.startTracking();
      
      console.log('🔍 ActiveRoundScreen: GPS tracking start result:', success);
      
      if (success) {
        setIsLocationTracking(true);
        setLocationError(null);
        console.log('✅ ActiveRoundScreen: GPS tracking started successfully');
        
        // Try to get immediate location
        console.log('⚡ ActiveRoundScreen: Attempting to get current location immediately...');
        const currentLoc = await simpleLocationService.getCurrentLocation();
        if (currentLoc) {
          console.log('🎯 ActiveRoundScreen: Got immediate location:', currentLoc);
          dispatch(updateCurrentLocation({
            latitude: currentLoc.latitude,
            longitude: currentLoc.longitude,
            accuracy: currentLoc.accuracy,
          }));
          setIsRequestingLocation(false);
        } else {
          console.log('⏳ ActiveRoundScreen: No immediate location, waiting for GPS...');
          // Keep loading state until we get location from watch
        }
      } else {
        console.error('❌ ActiveRoundScreen: Failed to start GPS tracking');
        setLocationError('Failed to start GPS tracking - check permissions');
        setIsRequestingLocation(false);
      }

      // Store cleanup functions
      return () => {
        console.log('🧹 ActiveRoundScreen: Cleaning up location subscriptions');
        unsubscribeLocation();
        unsubscribeError();
      };
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Error starting location tracking:', error);
      setLocationError('Error starting GPS tracking');
      setIsRequestingLocation(false);
    }
  }, [activeRound?.id, dispatch]);

  // Stop GPS tracking
  const stopLocationTracking = useCallback(() => {
    if (isLocationServiceAvailable()) {
      simpleLocationService.stopTracking();
    }
    
    setIsLocationTracking(false);
    dispatch(endVoiceSession());
    console.log('GPS tracking stopped');
  }, [dispatch]);

  // Handle shot placement service state changes
  const handleShotPlacementStateChange = useCallback(async (state: ServiceShotPlacementState) => {
    switch (state) {
      case ServiceShotPlacementState.SHOT_PLACEMENT:
        if (distances.fromCurrent > 0) {
          await golfTTSHelper.confirmShotPlacement(distances.fromCurrent);
          
          // Request club recommendation
          if (distances.fromCurrent > 0 && user?.id && activeRound?.id) {
            requestClubRecommendation(distances.fromCurrent);
          }
        }
        break;
        
      case ServiceShotPlacementState.SHOT_IN_PROGRESS:
        await golfTTSHelper.shotInProgress();
        break;
        
      case ServiceShotPlacementState.MOVEMENT_DETECTED:
        await golfTTSHelper.movementDetected();
        break;
        
      case ServiceShotPlacementState.SHOT_COMPLETED:
        await golfTTSHelper.shotCompleted();
        break;
    }
  }, [distances.fromCurrent, user?.id, activeRound?.id]);

  // Request club recommendation from Voice AI
  const requestClubRecommendation = useCallback(async (distanceYards: number) => {
    if (!user?.id || !activeRound?.id) return;
    
    try {
      const response = await voiceAIApiService.requestClubRecommendation({
        userId: Number(user.id),
        roundId: activeRound.id,
        distanceYards,
        currentHole,
        locationContext: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracyMeters: currentLocation.accuracy,
        } : undefined,
      });
      
      // Announce club recommendation
      await golfTTSHelper.announceClubRecommendation(
        response.message.toLowerCase().includes('iron') ? response.message : 'the recommended club',
        distanceYards
      );
      
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Club recommendation error:', error);
    }
  }, [user?.id, activeRound?.id, currentHole, currentLocation]);

  // Toggle shot placement mode
  const handleShotPlacementToggle = useCallback(() => {
    const newMode = !shotPlacementModeEnabled;
    setShotPlacementModeEnabled(newMode);
    
    if (newMode) {
      // Enable shot placement mode
      dispatch(setPlacingShot(true));
      golfTTSHelper.generalAssistance("Shot placement mode enabled. Tap the map to set your target.");
      console.log('🎯 ActiveRoundScreen: Shot placement mode enabled');
    } else {
      // Disable shot placement mode
      dispatch(cancelShotPlacement());
      dispatch(setPlacingShot(false));
      golfTTSHelper.generalAssistance("Shot placement mode disabled.");
      console.log('🎯 ActiveRoundScreen: Shot placement mode disabled');
    }
  }, [shotPlacementModeEnabled, dispatch]);

  // Activate shot placement (user ready to take shot)
  const handleActivateShot = useCallback(async () => {
    try {
      await dispatch(activateShotPlacement());
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Activate shot error:', error);
      Alert.alert('Activation Error', 'Failed to activate shot tracking');
    }
  }, [dispatch]);

  // Cancel shot placement
  const handleCancelShotPlacement = useCallback(async () => {
    try {
      await dispatch(cancelShotPlacement());
      golfTTSHelper.generalAssistance("Shot placement cancelled.");
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Cancel shot error:', error);
    }
  }, [dispatch]);

  // Handle voice toggle
  const handleVoiceToggle = useCallback(() => {
    dispatch(toggleVoiceInterface());
  }, [dispatch]);

  // Handle map press for distance measurement or shot placement
  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (!currentLocation) {
      Alert.alert(
        'GPS Required',
        'Please wait for GPS to acquire your location before measuring distances.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Shot placement mode
    if (shotPlacementModeEnabled && isPlacingShot) {
      handleShotPlacementPress(coordinate);
      return;
    }

    // Regular distance measurement mode
    const yards = mapboxService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      coordinate.latitude,
      coordinate.longitude,
      'yards'
    );
    
    const meters = mapboxService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      coordinate.latitude,
      coordinate.longitude,
      'meters'
    );

    if (yards < 5) {
      Alert.alert('Target Too Close', 'Please select a target at least 5 yards away.');
      return;
    }

    Alert.alert(
      'Golf Distance Measurement',
      `Distance: ${mapboxService.formatDistance(yards, 'yards')} (${mapboxService.formatDistance(meters, 'meters')})\n\nSuggested club: ${yards < 100 ? 'Wedge' : yards < 150 ? 'Short Iron' : yards < 200 ? 'Mid Iron' : 'Long Iron/Driver'}`,
      [{ text: 'OK' }]
    );
  }, [currentLocation, shotPlacementModeEnabled, isPlacingShot]);

  // Handle shot placement press
  const handleShotPlacementPress = useCallback(async (coordinate: { latitude: number; longitude: number }) => {
    if (!currentLocation || !activeRound?.id || !user?.id) {
      Alert.alert('Error', 'Current location, round, and user information are required for shot placement');
      return;
    }

    try {
      console.log('🎯 ActiveRoundScreen: Placing shot at:', coordinate);
      
      // Calculate distances using Mapbox service
      const distanceFromCurrent = Math.round(mapboxService.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        coordinate.latitude,
        coordinate.longitude,
        'yards'
      ));
      
      // Create shot placement
      const result = await dispatch(createShotPlacement({
        coordinates: coordinate,
        pinLocation: undefined, // Can be enhanced later with hole pin data
        currentHole,
      }));

      if (createShotPlacement.fulfilled.match(result)) {
        console.log('✅ ActiveRoundScreen: Shot placement created successfully');
        // Disable placing mode after successful placement
        dispatch(setPlacingShot(false));
      }
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Shot placement error:', error);
      Alert.alert('Shot Placement Error', 'Failed to create shot placement');
    }
  }, [currentLocation, activeRound?.id, user?.id, currentHole, dispatch]);

  // Center map on user location
  const handleCenterOnUser = useCallback(() => {
    console.log('🎯 ActiveRoundScreen: Manual center on user requested');
    
    if (!currentLocation) {
      console.warn('⚠️ ActiveRoundScreen: Cannot center - no current location');
      return;
    }
    
    console.log('🔄 ActiveRoundScreen: Triggering map center');
    // The map should automatically center when simpleLocationData changes
  }, [currentLocation]);

  // Handle map retry - simplified
  const handleMapRetry = useCallback(() => {
    console.log('🔄 ActiveRoundScreen: Map retry requested');
    // Simple retry - the map component will handle its own retry logic
  }, []);

  // Round control handlers
  const roundControlHandlers = {
    pause: async () => {
      if (!activeRound) return;
      try {
        await dispatch(pauseRound(activeRound.id)).unwrap();
        Alert.alert('Round Paused', 'Your round has been paused successfully.');
      } catch (error) {
        Alert.alert('Error', 'Failed to pause round. Please try again.');
      }
    },
    resume: async () => {
      if (!activeRound) return;
      try {
        await dispatch(resumeRound(activeRound.id)).unwrap();
        Alert.alert('Round Resumed', 'Your round has been resumed successfully.');
      } catch (error) {
        Alert.alert('Error', 'Failed to resume round. Please try again.');
      }
    },
    complete: async () => {
      if (!activeRound) return;
      Alert.alert(
        'Complete Round',
        'Are you sure you want to complete this round?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                await dispatch(completeRound(activeRound.id)).unwrap();
                Alert.alert('Round Complete', 'Congratulations!');
                navigation.navigate('Home');
              } catch (error) {
                Alert.alert('Error', 'Failed to complete round.');
              }
            },
          },
        ]
      );
    },
    abandon: async () => {
      if (!activeRound) return;
      Alert.alert(
        'Abandon Round',
        'Are you sure you want to abandon this round?',
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
                Alert.alert('Error', 'Failed to abandon round.');
              }
            },
          },
        ]
      );
    },
  };

  // Show location error if present
  useEffect(() => {
    if (locationError) {
      Alert.alert('GPS Error', locationError, [
        { text: 'OK' },
        { text: 'Retry', onPress: startLocationTracking }
      ]);
    }
  }, [locationError, startLocationTracking]);


  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  // Render error state
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

  // Render no active round state
  if (!activeRound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="golf-course" size={80} color="#4a7c59" />
          <Text style={styles.emptyTitle}>No Active Round</Text>
          <Text style={styles.emptyDescription}>
            Start a new round to begin tracking your game with GPS location tracking,
            distance measurements, and AI-powered recommendations.
          </Text>
          <TouchableOpacity
            style={styles.startRoundButton}
            onPress={() => navigation.navigate('Courses' as any)}
          >
            <Icon name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startRoundButtonText}>Start New Round</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // Main render - Active round with robust map handling
  return (
    <SafeAreaView style={styles.container}>
      {/* Mapbox Map - Enhanced Golf Experience */}
      {isMapboxReady && (
      <MapErrorBoundary
        currentLocation={simpleLocationData}
        onMapPress={handleMapPress}
        onRetryMap={handleMapRetry}
        fallbackMode="gps-only"
      >
        <MapboxMapView
          currentLocation={simpleLocationData}
          onMapPress={handleMapPress}
          onShotPlacementPress={shotPlacementModeEnabled ? handleShotPlacementPress : undefined}
          onLocationUpdate={(coord) => {
            console.log('🎯 Map location update:', coord);
          }}
          showUserLocation={true}
          accessToken={mapboxService.getAccessToken()}
          // Shot placement props
          shotPlacementMode={shotPlacementModeEnabled}
          shotPlacementLocation={targetLocation}
          showDistanceOverlay={Boolean(targetLocation)}
          distanceToPin={distances.toPin}
          distanceFromCurrent={distances.fromCurrent}
        />
      </MapErrorBoundary>
      )}

      {/* Enhanced Mapbox Map Overlay */}
      <MapboxMapOverlay
        courseName={activeRound?.course?.name}
        currentHole={currentHole}
        currentLocation={simpleLocationData}
        isLocationTracking={isLocationTracking}
        isVoiceInterfaceVisible={isVoiceInterfaceVisible}
        roundStatus={activeRound?.status}
        locationError={locationError}
        isRequestingLocation={isRequestingLocation}
        onVoiceToggle={handleVoiceToggle}
        onRoundControlsPress={() => setShowRoundControls(!showRoundControls)}
        onCenterOnUser={handleCenterOnUser}
        onRetryLocation={startLocationTracking}
        // Shot placement props
        shotPlacementMode={shotPlacementModeEnabled}
        shotPlacementActive={isActiveShotPlacement}
        shotPlacementDistance={distances.fromCurrent}
        clubRecommendation={clubRecommendation}
        onShotPlacementToggle={handleShotPlacementToggle}
        onActivateShot={handleActivateShot}
        onCancelShotPlacement={handleCancelShotPlacement}
        shotPlacementState={serviceState === ServiceShotPlacementState.INACTIVE ? 'inactive' : 
                          serviceState === ServiceShotPlacementState.SHOT_PLACEMENT ? 'placement' :
                          serviceState === ServiceShotPlacementState.SHOT_IN_PROGRESS ? 'in_progress' : 'completed'}
      />

      {/* Round Controls Modal */}
      {showRoundControls && (
        <View style={styles.roundControlsModal}>
          <View style={styles.roundControlsContent}>
            <Text style={styles.roundControlsTitle}>Round Controls</Text>
            
            {activeRound?.status === 'Paused' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.resumeButton]}
                onPress={roundControlHandlers.resume}
                disabled={isUpdating}
              >
                <Icon name="play-arrow" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Resume Round</Text>
              </TouchableOpacity>
            )}

            {activeRound?.status === 'InProgress' && (
              <TouchableOpacity
                style={[styles.modalButton, styles.pauseButton]}
                onPress={roundControlHandlers.pause}
                disabled={isUpdating}
              >
                <Icon name="pause" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Pause Round</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.completeButton]}
              onPress={roundControlHandlers.complete}
              disabled={isCompleting}
            >
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Complete Round</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.abandonButton]}
              onPress={roundControlHandlers.abandon}
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

      {/* Voice AI Interface */}
      {activeRound && user && (
        <VoiceAIInterface
          userId={Number(user.id)}
          roundId={activeRound.id}
          currentHole={currentHole}
          targetPin={null}
          currentLocation={currentLocation}
          isVisible={isVoiceInterfaceVisible}
          onToggle={handleVoiceToggle}
          onConversationUpdate={() => {}}
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

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