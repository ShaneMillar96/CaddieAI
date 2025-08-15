import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  completeHole,
  setShowHoleSelector,
  setShowQuickScoreEditor,
} from '../../store/slices/roundSlice';
import {
  selectCurrentHole,
  selectViewingHole,
  selectNavigationModals,
  selectIsViewingDifferentHole,
  selectShouldDisableShotPlacement,
  selectShouldDisableGpsFeatures,
} from '../../store/selectors/roundSelectors';
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
import { VoiceChatModal } from '../../components/voice/VoiceChatModal';
import { HoleCompletionModal } from '../../components/common/HoleCompletionModal';
import { HoleNavigationModal, QuickScoreEditor } from '../../components/navigation';
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
import { HoleCompletionRequest } from '../../types/golf';
import { CaddieContext } from '../../services/TextToSpeechService';
import { dynamicCaddieService } from '../../services/DynamicCaddieService';
import voiceAIApiService from '../../services/voiceAIApi';
import { pinDistanceCalculator, PinDistances, Coordinate } from '../../utils/PinDistanceCalculator';
// RealtimeAudioServiceV2 is now managed by VoiceChatModalV2 component

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
    dashboardState,
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

  // Hole navigation state from Redux selectors
  const currentHole = useSelector(selectCurrentHole);
  const viewingHole = useSelector(selectViewingHole);
  const navigationModals = useSelector(selectNavigationModals);
  const isViewingDifferentHole = useSelector(selectIsViewingDifferentHole);
  const shouldDisableShotPlacement = useSelector(selectShouldDisableShotPlacement);
  const shouldDisableGpsFeatures = useSelector(selectShouldDisableGpsFeatures);
  
  // Local state - keep it simple
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [showRoundControls, setShowRoundControls] = useState(false);
  const [isMapboxReady, setIsMapboxReady] = useState(false);
  
  // Shot placement mode state
  const [shotPlacementModeEnabled, setShotPlacementModeEnabled] = useState(false);
  const [serviceSyncInitialized, setServiceSyncInitialized] = useState(false);
  
  // Voice chat modal state
  const [isVoiceChatModalVisible, setIsVoiceChatModalVisible] = useState(false);
  
  // Pin location state
  const [pinLocation, setPinLocation] = useState<Coordinate | null>(null);
  const [isPinPlacementMode, setIsPinPlacementMode] = useState(false);
  const [pinDistances, setPinDistances] = useState<PinDistances>({ userToPin: null, shotToPin: null });
  
  // Hole completion modal state
  const [isHoleCompletionModalVisible, setIsHoleCompletionModalVisible] = useState(false);
  
  
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
    
    if (!isLocationServiceAvailable()) {
      console.error('❌ ActiveRoundScreen: Location service not available');
      setLocationError('Location service not available');
      setIsRequestingLocation(false);
      return;
    }

    try {
      console.log('📡 ActiveRoundScreen: Setting up location subscriptions...');
      
      // Start voice session and realtime audio connection
      if (activeRound?.id && user?.id) {
        console.log('🎙️ ActiveRoundScreen: Starting voice session for round', activeRound.id);
        dispatch(startVoiceSession({ roundId: activeRound.id }));
        
        // Note: Realtime audio is now managed by VoiceChatModalV2 component
        console.log('✅ ActiveRoundScreen: Voice session started (realtime audio handled by VoiceChatModalV2)');
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
        
        // Note: Realtime audio cleanup is now handled by VoiceChatModalV2
        console.log('🔌 ActiveRoundScreen: Voice session cleanup complete');
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
    if (!user?.id || !activeRound?.id) {
      console.warn('Missing user or round context for caddie response');
      return;
    }

    // Build enhanced context for dynamic caddie responses
    const buildCaddieContext = (): CaddieContext => ({
      location: currentLocation ? {
        currentHole: currentLocation.currentHole || activeRound.currentHole,
        distanceToPinMeters: currentLocation.distanceToPin,
        distanceToTeeMeters: currentLocation.distanceToTee,
        positionOnHole: currentLocation.positionOnHole,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracyMeters: currentLocation.accuracy || 10,
        withinCourseBoundaries: true,
        timestamp: new Date().toISOString(),
      } : undefined,
      golfContext: {
        currentHole: activeRound.currentHole,
        targetDistanceYards: distances.fromCurrent,
        recommendedClub: clubRecommendation || getRecommendedClub(distances.fromCurrent),
        shotType: determineShotType(distances.fromCurrent),
        shotPlacementActive: true,
        positionOnHole: currentLocation?.positionOnHole || 'unknown',
        currentScore: activeRound.totalScore || 0,
        holePar: 4, // Default par - could be enhanced with hole data
        strategicNotes: `${distances.fromCurrent}yd ${determineShotType(distances.fromCurrent)} on hole ${activeRound.currentHole}`,
      },
      player: {
        skillLevel: 'intermediate', // Could be enhanced with user profile data
        communicationStyle: 'encouraging',
        currentRoundStats: {
          currentScore: activeRound.totalScore || 0,
          relativeToPar: (activeRound.totalScore || 0) - (((activeRound.currentHole || 1) - 1) * 4), // Rough calculation
          holesCompleted: Math.max(0, (activeRound.currentHole || 1) - 1),
        },
        clubDistances: {
          'Driver': 250,
          '3 Wood': 220,
          '5 Iron': 180,
          '7 Iron': 150,
          '9 Iron': 120,
          'Wedge': 80,
          // Could be enhanced with user's actual club distances
        }
      },
      conditions: {
        temperatureFahrenheit: 72, // Could be enhanced with weather API
        courseCondition: 'good',
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
        weatherDescription: 'Pleasant golfing conditions',
      },
      metadata: {
        roundId: activeRound.id,
        courseName: activeRound.course?.name,
        serviceState: state,
        shotPlacementMode: true,
        timestamp: new Date().toISOString(),
      }
    });

    try {
      switch (state) {
        case ServiceShotPlacementState.SHOT_PLACEMENT:
          // Only send club recommendation when shot location is selected
          if (distances.fromCurrent > 0) {
            await dynamicCaddieService.generateResponse(
              'ClubRecommendation',
              buildCaddieContext(),
              Number(user.id),
              activeRound.id,
              undefined,
              8 // High priority for club recommendation
            );
          }
          break;
          
        // Remove AI responses for intermediate states - no audio feedback needed
        case ServiceShotPlacementState.SHOT_IN_PROGRESS:
        case ServiceShotPlacementState.MOVEMENT_DETECTED:
        case ServiceShotPlacementState.SHOT_COMPLETED:
          // These states are handled by the UI/visual feedback only
          break;
      }
    } catch (error) {
      console.error('Error generating dynamic caddie response:', error);
      // Error is already handled within DynamicCaddieService with fallback messages
      // No need for additional TTS fallbacks here
    }
  }, [distances.fromCurrent, user?.id, activeRound?.id, currentLocation, clubRecommendation]);

  // Helper function to get recommended club based on distance
  const getRecommendedClub = useCallback((distanceYards: number): string => {
    if (distanceYards < 80) return 'Wedge';
    if (distanceYards < 120) return '9 Iron';
    if (distanceYards < 150) return '7 Iron';
    if (distanceYards < 170) return '5 Iron';
    if (distanceYards < 200) return 'Hybrid';
    return 'Driver';
  }, []);

  // Calculate pin distances when location, shot location, or pin location changes
  useEffect(() => {
    if (pinLocation) {
      const currentCoord = simpleLocationData ? {
        latitude: simpleLocationData.latitude,
        longitude: simpleLocationData.longitude
      } : null;
      
      const shotCoord = targetLocation ? {
        latitude: targetLocation.latitude,
        longitude: targetLocation.longitude
      } : null;
      
      const newDistances = pinDistanceCalculator.calculatePinDistances(
        currentCoord,
        shotCoord,
        pinLocation
      );
      
      setPinDistances(newDistances);
    } else {
      setPinDistances({ userToPin: null, shotToPin: null });
    }
  }, [pinLocation, simpleLocationData, targetLocation]);

  // Helper function to determine shot type based on distance
  const determineShotType = useCallback((distanceYards: number): string => {
    if (distanceYards < 50) return 'short-game';
    if (distanceYards < 100) return 'wedge-shot';
    if (distanceYards < 150) return 'approach-shot';
    if (distanceYards < 200) return 'mid-iron';
    if (distanceYards < 250) return 'long-iron';
    return 'driver-shot';
  }, []);

  // Note: Club recommendation is now handled directly in handleShotPlacementStateChange
  // to ensure sequential processing and prevent simultaneous API calls

  // Toggle shot placement mode
  const handleShotPlacementToggle = useCallback(async () => {
    // Disable shot placement if viewing different hole
    if (shouldDisableShotPlacement) {
      Alert.alert(
        'Shot Placement Unavailable',
        `Shot placement is only available for the current hole (${currentHole}). You are viewing hole ${viewingHole}.`,
        [
          { text: 'OK' },
          { 
            text: 'Go to Current Hole', 
            onPress: () => {
              // Reset viewing hole to current hole will be handled by navigation component
              handleHoleNavigationToggle();
            }
          }
        ]
      );
      return;
    }

    const newMode = !shotPlacementModeEnabled;
    setShotPlacementModeEnabled(newMode);
    
    if (newMode) {
      // Enable shot placement mode
      dispatch(setPlacingShot(true));
      
      // Use dynamic caddie service for welcome message
      if (user?.id && activeRound?.id) {
        const context: CaddieContext = {
          golfContext: {
            currentHole: activeRound.currentHole,
            shotPlacementActive: true,
            shotType: 'general',
          },
          player: {
            skillLevel: 'intermediate',
            communicationStyle: 'encouraging',
          }
        };
        
        await dynamicCaddieService.generateResponse(
          'ShotPlacementWelcome',
          context,
          Number(user.id),
          activeRound.id,
          undefined,
          10 // High priority for welcome
        );
      } else {
        // Fallback handled by DynamicCaddieService
        console.log('⚠️ ActiveRoundScreen: No user/round context for welcome message');
      }
      
      console.log('🎯 ActiveRoundScreen: Shot placement mode enabled');
    } else {
      // Disable shot placement mode
      dispatch(cancelShotPlacement());
      dispatch(setPlacingShot(false));
      
      // Use dynamic caddie service for disabled message
      if (user?.id && activeRound?.id) {
        const context: CaddieContext = {
          golfContext: {
            currentHole: activeRound.currentHole,
            shotPlacementActive: false,
            shotType: 'general',
          },
          player: {
            skillLevel: 'intermediate',
            communicationStyle: 'encouraging',
          }
        };
        
        await dynamicCaddieService.generateResponse(
          'GeneralAssistance',
          context,
          Number(user.id),
          activeRound.id,
          'Shot placement mode disabled',
          5
        );
      } else {
        // Fallback handled by DynamicCaddieService
        console.log('⚠️ ActiveRoundScreen: No user/round context for disable message');
      }
      
      console.log('🎯 ActiveRoundScreen: Shot placement mode disabled');
    }
  }, [shotPlacementModeEnabled, dispatch, user?.id, activeRound?.id]);

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
      
      // Use dynamic caddie service for cancellation message
      if (user?.id && activeRound?.id) {
        const context: CaddieContext = {
          golfContext: {
            currentHole: activeRound.currentHole,
            shotPlacementActive: false,
            shotType: 'general',
          },
          player: {
            skillLevel: 'intermediate',
            communicationStyle: 'encouraging',
          }
        };
        
        await dynamicCaddieService.generateResponse(
          'GeneralAssistance',
          context,
          Number(user.id),
          activeRound.id,
          'Shot placement cancelled',
          5
        );
      } else {
        // Fallback handled by DynamicCaddieService
        console.log('⚠️ ActiveRoundScreen: No user/round context for cancellation message');
      }
    } catch (error) {
      console.error('❌ ActiveRoundScreen: Cancel shot error:', error);
    }
  }, [dispatch, user?.id, activeRound?.id]);

  // Handle voice toggle
  const handleVoiceToggle = useCallback(() => {
    dispatch(toggleVoiceInterface());
  }, [dispatch]);

  // Handle voice chat modal
  const handleVoiceChatModalToggle = useCallback(() => {
    setIsVoiceChatModalVisible(prev => !prev);
  }, []);

  // Handle hole completion modal
  const handleHoleCompletionToggle = useCallback(() => {
    setIsHoleCompletionModalVisible(prev => !prev);
  }, []);

  // Handle hole navigation modal
  const handleHoleNavigationToggle = useCallback(() => {
    dispatch(setShowHoleSelector(!navigationModals.showHoleSelector));
  }, [dispatch, navigationModals.showHoleSelector]);

  // Handle quick score editor modal
  const handleQuickScoreEditorToggle = useCallback(() => {
    dispatch(setShowQuickScoreEditor(!navigationModals.showQuickScoreEditor));
  }, [dispatch, navigationModals.showQuickScoreEditor]);

  // Handle hole completion submission
  const handleHoleCompletion = useCallback(async (completion: HoleCompletionRequest) => {
    try {
      const result = await dispatch(completeHole(completion)).unwrap();
      setIsHoleCompletionModalVisible(false);
      
      // Refresh the active round data to get the latest state
      if (activeRound?.id) {
        await dispatch(fetchActiveRound());
      }
      
      // Check if this was the last hole
      const totalHoles = activeRound?.course?.totalHoles || 18;
      const completedHolesAfter = (activeRound?.holeScores?.length || 0) + 1;
      
      if (completedHolesAfter >= totalHoles) {
        // All holes completed - show completion dialog
        Alert.alert(
          'Round Complete!', 
          `Congratulations! You've completed all ${totalHoles} holes. Your final score is ${(activeRound?.totalScore || 0) + completion.score}.`,
          [
            {
              text: 'Finish Round',
              onPress: async () => {
                try {
                  await dispatch(completeRound(activeRound?.id || 0)).unwrap();
                  navigation.navigate('Home');
                } catch (error) {
                  console.error('Error completing round:', error);
                }
              }
            },
            {
              text: 'Continue',
              style: 'cancel'
            }
          ]
        );
      } else {
        // Regular hole completion - show next hole info
        const nextHole = completion.holeNumber + 1;
        Alert.alert(
          'Hole Completed!', 
          `Great job on hole ${completion.holeNumber}! Ready for hole ${nextHole}.`
        );
      }
    } catch (error) {
      console.error('Error completing hole:', error);
      Alert.alert(
        'Error',
        'Failed to complete hole. Please try again.'
      );
    }
  }, [dispatch, activeRound, navigation]);

  // Handle pin placement mode toggle
  const handleTogglePinPlacementMode = useCallback(() => {
    setIsPinPlacementMode(prev => {
      const newMode = !prev;
      console.log(`🚩 ActiveRoundScreen: Pin placement mode ${newMode ? 'enabled' : 'disabled'}`);
      
      // If disabling, clear any existing pin placement mode
      if (!newMode) {
        // Keep the pin location but exit placement mode
        console.log('🚩 ActiveRoundScreen: Exiting pin placement mode');
      }
      
      return newMode;
    });
  }, []);

  // Handle pin location placement
  const handlePinLocationPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (!isPinPlacementMode) return;
    
    const newPinLocation: Coordinate = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    };
    
    // Validate pin location if user location is available
    if (simpleLocationData) {
      const isValid = pinDistanceCalculator.isValidPinLocation(
        newPinLocation,
        simpleLocationData,
        600 // Max 600 yards from user
      );
      
      if (!isValid) {
        Alert.alert(
          'Invalid Pin Location',
          'Pin location should be between 10-600 yards from your current position.'
        );
        return;
      }
    }
    
    setPinLocation(newPinLocation);
    setIsPinPlacementMode(false);
    
    console.log('🚩 ActiveRoundScreen: Pin location set:', newPinLocation);
    
    // Provide feedback to user
    Alert.alert(
      'Pin Location Set',
      `Pin placed ${pinDistances.userToPin ? 
        `${pinDistances.userToPin.distanceYards} yards away` : 
        'on the map'}`
    );
  }, [isPinPlacementMode, simpleLocationData, pinDistances.userToPin]);

  // Clear pin location
  const handleClearPinLocation = useCallback(() => {
    setPinLocation(null);
    setIsPinPlacementMode(false);
    console.log('🚩 ActiveRoundScreen: Pin location cleared');
  }, []);

  // Handle map press for shot placement and pin placement
  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (!currentLocation) {
      Alert.alert(
        'GPS Required',
        'Please wait for GPS to acquire your location.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Handle pin location placement first (higher priority)
    if (isPinPlacementMode) {
      handlePinLocationPress(coordinate);
      return;
    }

    // Handle shot placement mode
    if (shotPlacementModeEnabled && isPlacingShot) {
      handleShotPlacementPress(coordinate);
      return;
    }
    
    // Default: do nothing if no mode is active
  }, [currentLocation, isPinPlacementMode, shotPlacementModeEnabled, isPlacingShot, handlePinLocationPress]);

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
      
      const completedHolesCount = activeRound.holeScores?.length || 0;
      const totalHoles = activeRound.course?.totalHoles || 18;
      
      let message = 'Are you sure you want to complete this round?';
      if (completedHolesCount < totalHoles) {
        message = `You have completed ${completedHolesCount} out of ${totalHoles} holes. Completing the round now will save your current progress. Are you sure?`;
      }
      
      Alert.alert(
        'Complete Round',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                await dispatch(completeRound(activeRound.id)).unwrap();
                Alert.alert(
                  'Round Complete', 
                  `Congratulations! You completed ${completedHolesCount} holes with a score of ${activeRound.totalScore || 0}.`
                );
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
          // Pin location props
          pinLocation={pinLocation}
        />
      </MapErrorBoundary>
      )}

      {/* Enhanced Mapbox Map Overlay */}
      <MapboxMapOverlay
        courseName={activeRound?.course?.name}
        currentHole={currentHole}
        viewingHole={viewingHole}
        isViewingDifferentHole={isViewingDifferentHole}
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
        // Pin location props
        pinLocation={pinLocation}
        isPinPlacementMode={isPinPlacementMode}
        pinDistances={pinDistances}
        onTogglePinPlacement={handleTogglePinPlacementMode}
        onClearPinLocation={handleClearPinLocation}
        // Hole completion props
        onCompleteHole={handleHoleCompletionToggle}
        completedHoles={activeRound?.holeScores?.map(hs => hs.holeNumber) || []}
        totalHoles={activeRound?.course?.totalHoles || 18}
        // Hole navigation props
        onShowHoleNavigation={handleHoleNavigationToggle}
        onShowQuickScoreEditor={handleQuickScoreEditorToggle}
      />

      {/* Premium Round Controls Modal */}
      {showRoundControls && (
        <TouchableOpacity 
          style={styles.roundControlsModal}
          onPress={() => setShowRoundControls(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.roundControlsContent}
            activeOpacity={1}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.roundControlsTitle}>Round Controls</Text>
              <TouchableOpacity
                onPress={() => setShowRoundControls(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={28} color="#2c5530" />
              </TouchableOpacity>
            </View>

            {/* Round Progress Section */}
            <View style={styles.roundProgressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Round Progress</Text>
                <Text style={styles.progressStats}>
                  {activeRound?.holeScores?.length || 0}/{activeRound?.course?.totalHoles || 18} holes completed
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.round(((activeRound?.holeScores?.length || 0) / (activeRound?.course?.totalHoles || 18)) * 100)}%` }
                  ]} 
                />
              </View>
              {activeRound?.totalScore !== undefined && (
                <View style={styles.scoreInfo}>
                  <Icon name="sports-golf" size={16} color="#4a7c59" />
                  <Text style={styles.currentScore}>Current Score: {activeRound.totalScore}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.controlsContainer}>
              {activeRound?.status === 'Paused' && (
                <TouchableOpacity
                  style={[styles.controlButton, styles.resumeButton]}
                  onPress={roundControlHandlers.resume}
                  disabled={isUpdating}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <View style={[styles.iconContainer, styles.resumeIconBg]}>
                      <Icon name="play-arrow" size={28} color="#fff" />
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Resume Round</Text>
                      <Text style={styles.buttonSubtitle}>Continue playing</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#28a745" />
                  </View>
                </TouchableOpacity>
              )}

              {activeRound?.status === 'InProgress' && (
                <TouchableOpacity
                  style={[styles.controlButton, styles.pauseButton]}
                  onPress={roundControlHandlers.pause}
                  disabled={isUpdating}
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <View style={[styles.iconContainer, styles.pauseIconBg]}>
                      <Icon name="pause" size={28} color="#fff" />
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Pause Round</Text>
                      <Text style={styles.buttonSubtitle}>Take a break</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#f59e0b" />
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.controlButton, styles.completeButton]}
                onPress={roundControlHandlers.complete}
                disabled={isCompleting}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <View style={[styles.iconContainer, styles.completeIconBg]}>
                    <Icon name="check" size={28} color="#fff" />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Complete Round</Text>
                    <Text style={styles.buttonSubtitle}>Finish and save score</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#3b82f6" />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.controlButton, styles.abandonButton]}
                onPress={roundControlHandlers.abandon}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <View style={[styles.iconContainer, styles.abandonIconBg]}>
                    <Icon name="close" size={28} color="#fff" />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={[styles.buttonTitle, styles.abandonText]}>Abandon Round</Text>
                    <Text style={styles.buttonSubtitle}>Exit without saving</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#ef4444" />
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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

      {/* Voice Chat Modal V2 (Real-time Audio) */}
      {activeRound && (
        <VoiceChatModal
          visible={isVoiceChatModalVisible}
          onClose={handleVoiceChatModalToggle}
          roundId={activeRound.id}
        />
      )}

      {/* Hole Completion Modal */}
      {activeRound && (
        <HoleCompletionModal
          visible={isHoleCompletionModalVisible}
          onClose={handleHoleCompletionToggle}
          onSubmit={handleHoleCompletion}
          roundId={activeRound.id}
          holeNumber={viewingHole}
          isFirstTimePlayingHole={!activeRound.course?.holes?.find(h => h.holeNumber === viewingHole)?.par}
          existingPar={activeRound.course?.holes?.find(h => h.holeNumber === viewingHole)?.par}
          isLoading={isUpdating}
        />
      )}

      {/* Hole Navigation Modal */}
      <HoleNavigationModal
        visible={navigationModals.showHoleSelector}
        onClose={handleHoleNavigationToggle}
      />

      {/* Quick Score Editor Modal */}
      {activeRound && (
        <QuickScoreEditor
          visible={navigationModals.showQuickScoreEditor}
          onClose={handleQuickScoreEditorToggle}
          holeNumber={viewingHole}
          roundId={activeRound.id}
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
  },
  startRoundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Premium Round Controls Modal Styles
  roundControlsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  roundControlsContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  roundControlsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundProgressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  progressStats: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e1e1e1',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4a7c59',
    borderRadius: 3,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  controlButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  resumeButton: {
    borderColor: '#dcfce7',
  },
  resumeIconBg: {
    backgroundColor: '#22c55e',
  },
  pauseButton: {
    borderColor: '#fef3c7',
  },
  pauseIconBg: {
    backgroundColor: '#f59e0b',
  },
  completeButton: {
    borderColor: '#dbeafe',
  },
  completeIconBg: {
    backgroundColor: '#3b82f6',
  },
  abandonButton: {
    borderColor: '#fee2e2',
  },
  abandonIconBg: {
    backgroundColor: '#ef4444',
  },
  abandonText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
    marginHorizontal: 4,
  },
});

export default ActiveRoundScreen;