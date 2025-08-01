import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
} from '../../store/slices/voiceSlice';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import VoiceAIInterface, { ConversationMessage } from '../../components/voice/VoiceAIInterface';
import GolfCourseMap from '../../components/map/GolfCourseMap';
import MapOverlay from '../../components/map/MapOverlay';
import { 
  golfLocationService, 
  LocationData, 
  isLocationServiceAvailable, 
  safeLocationServiceCall 
} from '../../services/LocationService';
import { DistanceCalculator, Coordinate, DistanceResult } from '../../utils/DistanceCalculator';

// Enhanced interfaces
interface ShotMarker {
  id: string;
  coordinate: Coordinate;
  timestamp: number;
  distance?: DistanceResult;
  club?: string;
  note?: string;
}

interface MapState {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  userLocation: LocationData | null;
  shotMarkers: ShotMarker[];
  isPlacingShotMode: boolean;
}
import { MapErrorBoundary, VoiceErrorBoundary } from '../../components/common/ErrorBoundary';

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
    mapState,
  } = useSelector((state: RootState) => state.voice);

  const { user } = useSelector((state: RootState) => state.auth);

  // Enhanced local state
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [, setLocationPermissionGranted] = useState(false);
  const [targetDistance, setTargetDistance] = useState<DistanceResult | null>(null);
  const [showRoundControls, setShowRoundControls] = useState(false);
  
  // Enhanced map state
  const [mapStateLocal, setMapStateLocal] = useState<MapState>({
    region: null,
    userLocation: null,
    shotMarkers: [],
    isPlacingShotMode: false,
  });

  // Refs for cleanup and map control
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const mapRef = useRef<any>(null);
  const componentMountedRef = useRef(false);
  const locationTrackingInitializedRef = useRef(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Enhanced location update handler with improved state management
  const handleLocationUpdate = useCallback((location: LocationData) => {
    // Validate location data
    if (!location.latitude || !location.longitude || 
        Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
      console.warn('🟡 Invalid location data, skipping update');
      return;
    }
    
    // Update Redux state
    dispatch(updateCurrentLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    }));

    // Update local map state
    setMapStateLocal(prev => ({
      ...prev,
      userLocation: location,
      region: prev.region || {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }
    }));

    // Center map on user location if this is the first location update
    if (!mapStateLocal.region && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 1000);
    }
  }, [dispatch]); // Stable dependencies only


  // Shot placement mode controls
  const toggleShotPlacementMode = useCallback(() => {
    setMapStateLocal(prev => ({
      ...prev,
      isPlacingShotMode: !prev.isPlacingShotMode,
    }));
  }, []);

  // Remove shot marker
  const removeShotMarker = useCallback((markerId: string) => {
    setMapStateLocal(prev => ({
      ...prev,
      shotMarkers: prev.shotMarkers.filter(marker => marker.id !== markerId),
    }));
  }, []);

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 1000);
    }
  }, [currentLocation]);

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

  // Enhanced location tracking setup with proper lifecycle management
  const startLocationTracking = useCallback(async (roundId: number, courseId: number) => {
    try {
      if (!isLocationServiceAvailable()) {
        console.warn('Location service not available in ActiveRoundScreen');
        setLocationPermissionGranted(false);
        Alert.alert(
          'Location Service Unavailable', 
          'GPS tracking is currently unavailable. Please ensure location permissions are granted and restart the app.',
          [
            { text: 'OK' },
            { text: 'Try Again', onPress: () => startLocationTracking(roundId, courseId) }
          ]
        );
        return;
      }

      const hasPermission = await safeLocationServiceCall(
        (service) => service.requestLocationPermissions(),
        false
      );
      
      if (!hasPermission) {
        setLocationPermissionGranted(false);
        Alert.alert(
          'Location Permission Required',
          'GPS tracking enhances your golf experience with accurate distance measurements and shot analysis. Please grant location permission to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => startLocationTracking(roundId, courseId) }
          ]
        );
        return;
      }

      setLocationPermissionGranted(true);
      
      // CRITICAL: Register callbacks BEFORE starting GPS tracking
      console.log('🟢 ActiveRoundScreen: Registering location callbacks before starting GPS...');
      const unsubscribeLocation = golfLocationService.onLocationUpdate(handleLocationUpdate);
      const unsubscribeContext = golfLocationService.onContextUpdate(handleContextUpdate);
      const unsubscribeShots = golfLocationService.onShotDetection(handleShotDetection);
      
      // Store cleanup functions immediately
      cleanupFunctionsRef.current.push(unsubscribeLocation);
      cleanupFunctionsRef.current.push(unsubscribeContext);
      cleanupFunctionsRef.current.push(unsubscribeShots);
      
      console.log('🟢 ActiveRoundScreen: Location callbacks registered, now starting GPS tracking...');
      
      const trackingStarted = await safeLocationServiceCall(
        (service) => service.startRoundTracking(roundId, courseId),
        false
      );
      
      if (trackingStarted) {
        setIsLocationTracking(true);
        console.log(`🟢 ActiveRoundScreen: GPS tracking started successfully for round ${roundId}`);
        
        // Get initial location
        const currentPos = golfLocationService.getCurrentLocation();
        if (currentPos) {
          handleLocationUpdate(currentPos);
        }
      } else {
        console.warn('Failed to start location tracking, cleaning up callbacks');
        // Clean up callbacks if GPS tracking failed
        cleanupFunctionsRef.current.forEach(cleanup => cleanup());
        cleanupFunctionsRef.current = [];
        
        Alert.alert(
          'GPS Tracking Issue',
          'Unable to start GPS tracking. The app will still work, but distance measurements may be limited.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationPermissionGranted(false);
      
      // Clean up any callbacks that may have been registered
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    }
  }, [handleLocationUpdate, handleContextUpdate, handleShotDetection]);

  // Memoized round control handlers to prevent re-renders
  const roundControlHandlers = useMemo(() => ({
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
  }), [activeRound, dispatch, navigation]);



  // Handle voice conversation updates
  const handleConversationUpdate = useCallback((conversation: ConversationMessage[]) => {
    // Conversation is already managed by the VoiceAIInterface component
    // and stored in Redux state
    console.log('Conversation updated:', conversation.length, 'messages');
  }, []);

  // Enhanced target selection handler (defined early to avoid hoisting issues)
  const handleTargetSelected = useCallback((coordinate: Coordinate, distance: DistanceResult) => {
    if (distance.yards === 0) {
      setTargetDistance(null);
      dispatch(clearTargetPin());
      return;
    }

    setTargetDistance(distance);
    
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

    if (isLocationServiceAvailable()) {
      golfLocationService.setMapTargetPin(
        coordinate.latitude,
        coordinate.longitude,
        distance.yards,
        bearing
      );
    }

    console.log(`Target selected: ${distance.yards} yards, bearing ${bearing.toFixed(0)}°`);
  }, [dispatch, currentLocation]);

  // Enhanced map press handler for shot placement and target selection
  const handleMapPress = useCallback((coordinate: Coordinate) => {
    if (!currentLocation) return;

    const distance = DistanceCalculator.calculateDistance(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      coordinate
    );

    if (mapStateLocal.isPlacingShotMode) {
      // Add shot marker
      const newMarker: ShotMarker = {
        id: `shot-${Date.now()}`,
        coordinate,
        timestamp: Date.now(),
        distance,
      };

      setMapStateLocal(prev => ({
        ...prev,
        shotMarkers: [...prev.shotMarkers, newMarker],
        isPlacingShotMode: false,
      }));

      Alert.alert(
        'Shot Placed',
        `Shot marker placed at ${distance.yards} yards`,
        [{ text: 'OK' }]
      );
    } else {
      // Set target pin for distance measurement
      handleTargetSelected(coordinate, distance);
    }
  }, [currentLocation, mapStateLocal.isPlacingShotMode, handleTargetSelected]);

  // Enhanced initialization with better cleanup and mount tracking
  useEffect(() => {
    componentMountedRef.current = true;
    let isActiveEffect = true;
    
    const initializeRound = async () => {
      try {
        const result = await dispatch(fetchActiveRound()).unwrap();
        if (result && isActiveEffect && componentMountedRef.current) {
          setCurrentHole(result.currentHole || 1);
          dispatch(fetchHoleScores(result.id));
          
          // Set map to satellite view by default
          dispatch(setMapType('satellite'));
        }
      } catch (error) {
        console.error('Error loading active round:', error);
      }
    };

    initializeRound();
    
    return () => {
      isActiveEffect = false;
      componentMountedRef.current = false;
    };
  }, [dispatch]);

  // Separate effect for location tracking initialization with mount state protection
  useEffect(() => {
    if (activeRound?.id && user?.id && !isLocationTracking && !locationTrackingInitializedRef.current && componentMountedRef.current) {
      locationTrackingInitializedRef.current = true;
      
      const initializeLocationTracking = async () => {
        try {
          if (!componentMountedRef.current) return;
          
          dispatch(startVoiceSession({ roundId: activeRound.id }));
          await startLocationTracking(activeRound.id, activeRound.courseId);
        } catch (error) {
          console.error('Error initializing location tracking:', error);
          locationTrackingInitializedRef.current = false;
        }
      };
      
      // Debounce initialization to prevent rapid start/stop cycles
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(initializeLocationTracking, 300);
      
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      };
    }
    
    return () => {
      // Enhanced cleanup coordination with atomic operations
      if (!componentMountedRef.current) {
        console.log('🟡 ActiveRoundScreen: Component unmounting, cleaning up location tracking...');
        
        // Cancel any pending debounced initialization
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        
        // Atomic cleanup: First unregister callbacks, then stop GPS
        cleanupFunctionsRef.current.forEach((cleanup, index) => {
          try {
            cleanup();
          } catch (error) {
            console.error(`Cleanup error for subscription ${index}:`, error);
          }
        });
        cleanupFunctionsRef.current = [];
        
        // Then stop GPS tracking (which also clears any remaining callbacks)
        if (isLocationServiceAvailable()) {
          golfLocationService.stopRoundTracking();
        }
        
        // End voice session
        if (activeRound?.id) {
          dispatch(endVoiceSession());
        }
        
        // Reset component state
        setIsLocationTracking(false);
        locationTrackingInitializedRef.current = false;
        
        console.log('🟢 ActiveRoundScreen: Cleanup completed');
      }
    };
  }, [activeRound?.id, user?.id]);

  // Optimized callback handlers
  const handleVoiceToggle = useCallback(() => {
    dispatch(toggleVoiceInterface());
  }, [dispatch]);

  const handleSettingsPress = useCallback(() => {
    const mapTypes = ['standard', 'satellite', 'terrain', 'hybrid'] as const;
    const currentIndex = mapTypes.indexOf(mapState.mapType as any);
    const nextIndex = (currentIndex + 1) % mapTypes.length;
    const newMapType = mapTypes[nextIndex];
    
    dispatch(setMapType(newMapType));
    console.log(`Map type changed to: ${newMapType}`);
  }, [mapState.mapType, dispatch]);

  // Memoized course region calculation for better performance
  const courseRegion = useMemo(() => {
    // Priority: current location > course region > default
    if (currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.003, // Tighter zoom for user location
        longitudeDelta: 0.003,
      };
    }
    
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
  }, [currentLocation, mapState.courseRegion]); // Stable object references

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
            score keeping, and AI-powered recommendations.
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


  // Render active round interface
  return (
    <SafeAreaView style={styles.container}>
      {/* Map View - Full Screen with Error Boundary */}
      <MapErrorBoundary>
        <GolfCourseMap
          currentLocation={currentLocation}
          onTargetSelected={handleTargetSelected}
          onLocationUpdate={(coordinate) => {
            // Handle location updates if needed
            console.log('Location update from map:', coordinate);
          }}
          courseId={activeRound?.courseId}
          courseName={activeRound?.course?.name}
          initialRegion={courseRegion}
          mapType={mapState.mapType || 'satellite'}
          enableTargetPin={true}
        />
      </MapErrorBoundary>

      {/* Map Overlay - Floating UI Controls */}
      <MapOverlay
        courseName={activeRound?.course?.name}
        currentHole={currentHole}
        currentLocation={currentLocation}
        targetDistance={targetDistance}
        targetPin={mapState.targetPin}
        shotMarkers={mapStateLocal.shotMarkers}
        isLocationTracking={isLocationTracking}
        isVoiceInterfaceVisible={isVoiceInterfaceVisible}
        isPlacingShotMode={mapStateLocal.isPlacingShotMode}
        onVoiceToggle={handleVoiceToggle}
        onSettingsPress={handleSettingsPress}
        onRoundControlsPress={() => setShowRoundControls(!showRoundControls)}
        onClearTarget={() => handleTargetSelected({ latitude: 0, longitude: 0 }, { yards: 0, meters: 0, feet: 0, kilometers: 0, miles: 0 })}
        onToggleShotMode={toggleShotPlacementMode}
        onCenterOnUser={centerOnUserLocation}
        onRemoveShotMarker={removeShotMarker}
        roundStatus={activeRound?.status}
        gpsAccuracy={currentLocation?.accuracy}
        mapType={mapState.mapType}
      />

      {/* Round Controls Modal (when requested) */}
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

      {/* Voice AI Interface - Positioned by the interface itself with Error Boundary */}
      {activeRound && user && (
        <VoiceErrorBoundary>
          <VoiceAIInterface
            userId={Number(user.id)}
            roundId={activeRound.id}
            currentHole={currentHole}
            targetPin={mapState.targetPin}
            currentLocation={currentLocation}
            isVisible={isVoiceInterfaceVisible}
            onToggle={handleVoiceToggle}
            onConversationUpdate={handleConversationUpdate}
          />
        </VoiceErrorBoundary>
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