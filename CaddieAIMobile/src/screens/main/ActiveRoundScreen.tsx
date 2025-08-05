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
} from '../../store/slices/roundSlice';
import {
  toggleVoiceInterface,
  startVoiceSession,
  endVoiceSession,
  updateCurrentLocation,
} from '../../store/slices/voiceSlice';
import { LoadingSpinner } from '../../components/auth/LoadingSpinner';
import { ErrorMessage } from '../../components/auth/ErrorMessage';
import VoiceAIInterface from '../../components/voice/VoiceAIInterface';
import SimpleMapView from '../../components/map/SimpleMapView';
import SimpleMapOverlay from '../../components/map/SimpleMapOverlay';
import MapErrorBoundary from '../../components/map/MapErrorBoundary';
import { 
  simpleLocationService, 
  SimpleLocationData,
  isLocationServiceAvailable 
} from '../../services/SimpleLocationService';
import { useGPSStabilization, useGPSStabilityPresets } from '../../hooks/useGPSStabilization';

// Navigation types
type MainStackParamList = {
  Home: undefined;
  Courses: undefined;
  CourseDetail: { courseId: number; courseName?: string };
  AIChat: undefined;
};

type ActiveRoundScreenNavigationProp = StackNavigationProp<MainStackParamList>;

/**
 * ActiveRoundScreen - Clean Implementation
 * 
 * Core functionality:
 * - Display satellite map view
 * - Show current location with GPS marker
 * - Handle location permissions
 * - Provide loading and error states
 * - Basic voice interface integration
 * - Round control access
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

  // Local state - keep it simple
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showRoundControls, setShowRoundControls] = useState(false);
  
  // Map stability and lifecycle management
  const [mapMountingAllowed, setMapMountingAllowed] = useState(false);
  const [mapRetryCount, setMapRetryCount] = useState(0);
  const [lastMapRetryTime, setLastMapRetryTime] = useState(0);
  
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

  // GPS stabilization configuration
  const stabilityPresets = useGPSStabilityPresets();
  const gpsStability = useGPSStabilization(simpleLocationData, stabilityPresets.balanced);

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

  // Monitor GPS stability and control map mounting
  useEffect(() => {
    const canMount = gpsStability.canRenderMap && isLocationTracking && !locationError;
    
    if (canMount !== mapMountingAllowed) {
      if (canMount) {
        console.log('✅ GPS Stabilization: GPS is stable, allowing map mounting');
        console.log(`🟠 GPS Status: Accuracy: ${gpsStability.currentAccuracy?.toFixed(1)}m, Quality: ${gpsStability.qualityLevel}, Progress: ${gpsStability.stabilityProgress.toFixed(0)}%`);
      } else {
        console.log('🟡 GPS Stabilization: GPS not stable enough for map mounting');
        console.log(`🟠 GPS Status: Accuracy: ${gpsStability.currentAccuracy?.toFixed(1) || 'unknown'}m, Quality: ${gpsStability.qualityLevel}, Stable: ${gpsStability.isStable}`);
      }
      
      setMapMountingAllowed(canMount);
    }
  }, [gpsStability, isLocationTracking, locationError, mapMountingAllowed]);

  // Start location tracking when round is available
  useEffect(() => {
    if (activeRound?.id && user?.id && !isLocationTracking) {
      startLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      if (isLocationTracking) {
        stopLocationTracking();
      }
    };
  }, [activeRound?.id, user?.id]);

  // Start GPS tracking
  const startLocationTracking = useCallback(async () => {
    if (!isLocationServiceAvailable()) {
      setLocationError('Location service not available');
      return;
    }

    try {
      // Start voice session
      if (activeRound?.id) {
        dispatch(startVoiceSession({ roundId: activeRound.id }));
      }

      // Subscribe to location updates
      const unsubscribeLocation = simpleLocationService.onLocationUpdate(
        (location: SimpleLocationData) => {
          // Update Redux store
          dispatch(updateCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }));
        }
      );

      // Subscribe to location errors
      const unsubscribeError = simpleLocationService.onLocationError(
        (error: string) => {
          setLocationError(error);
        }
      );

      // Start GPS tracking
      const success = await simpleLocationService.startTracking();
      if (success) {
        setIsLocationTracking(true);
        setLocationError(null);
        console.log('GPS tracking started successfully');
      } else {
        setLocationError('Failed to start GPS tracking');
      }

      // Store cleanup functions
      return () => {
        unsubscribeLocation();
        unsubscribeError();
      };
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationError('Error starting GPS tracking');
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

  // Handle voice toggle
  const handleVoiceToggle = useCallback(() => {
    dispatch(toggleVoiceInterface());
  }, [dispatch]);

  // Handle map press for distance measurement
  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    if (!currentLocation) {
      Alert.alert(
        'GPS Required',
        'Please wait for GPS to acquire your location before measuring distances.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Simple distance calculation (basic Haversine formula)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = currentLocation.latitude * Math.PI/180;
    const φ2 = coordinate.latitude * Math.PI/180;
    const Δφ = (coordinate.latitude - currentLocation.latitude) * Math.PI/180;
    const Δλ = (coordinate.longitude - currentLocation.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in meters
    const yards = distance * 1.09361; // Convert to yards

    if (yards < 5) {
      Alert.alert('Target Too Close', 'Please select a target at least 5 yards away.');
      return;
    }

    Alert.alert(
      'Distance Measurement',
      `Distance: ${Math.round(yards)} yards (${Math.round(distance)} meters)`,
      [{ text: 'OK' }]
    );
  }, [currentLocation]);

  // Center map on user location
  const handleCenterOnUser = useCallback(() => {
    // This will be handled by the SimpleMapView component automatically
    // when currentLocation updates
  }, []);

  // Handle map retry with exponential backoff
  const handleMapRetry = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRetry = now - lastMapRetryTime;
    const minRetryInterval = Math.min(2000 * Math.pow(2, mapRetryCount), 30000); // Max 30 seconds

    if (timeSinceLastRetry < minRetryInterval) {
      console.log(`🔄 Map retry too soon, waiting ${Math.ceil((minRetryInterval - timeSinceLastRetry) / 1000)}s`);
      return;
    }

    console.log(`🔄 Map retry requested - Attempt #${mapRetryCount + 1}`);
    setMapRetryCount(prev => prev + 1);
    setLastMapRetryTime(now);
    
    // Reset map mounting to force re-evaluation
    setMapMountingAllowed(false);
    
    // Re-evaluate mounting after a short delay
    setTimeout(() => {
      const canMount = gpsStability.canRenderMap && isLocationTracking && !locationError;
      setMapMountingAllowed(canMount);
    }, 1000);
  }, [mapRetryCount, lastMapRetryTime, gpsStability.canRenderMap, isLocationTracking, locationError]);

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

  // Render GPS stabilization loading
  const renderGPSStabilizationScreen = () => {
    return (
      <View style={styles.gpsStabilizationContainer}>
        <Icon name="gps-fixed" size={64} color="#4a7c59" />
        <Text style={styles.gpsStabilizationTitle}>
          Stabilizing GPS Signal
        </Text>
        <Text style={styles.gpsStabilizationSubtitle}>
          Waiting for accurate location before loading map...
        </Text>
        
        {/* GPS Status Info */}
        <View style={styles.gpsStabilizationInfo}>
          <View style={styles.gpsInfoRow}>
            <Text style={styles.gpsInfoLabel}>Current Accuracy:</Text>
            <Text style={[
              styles.gpsInfoValue,
              { color: gpsStability.currentAccuracy && gpsStability.currentAccuracy <= 15 ? '#28a745' : '#ffc107' }
            ]}>
              {gpsStability.currentAccuracy ? `±${gpsStability.currentAccuracy.toFixed(1)}m` : 'Searching...'}
            </Text>
          </View>
          
          <View style={styles.gpsInfoRow}>
            <Text style={styles.gpsInfoLabel}>Signal Quality:</Text>
            <Text style={[
              styles.gpsInfoValue,
              { 
                color: gpsStability.qualityLevel === 'excellent' ? '#28a745' : 
                       gpsStability.qualityLevel === 'good' ? '#4CAF50' : 
                       gpsStability.qualityLevel === 'fair' ? '#ffc107' : '#ff6b6b'
              }
            ]}>
              {gpsStability.qualityLevel.toUpperCase()}
            </Text>
          </View>
          
          {gpsStability.isStabilizing && (
            <View style={styles.gpsInfoRow}>
              <Text style={styles.gpsInfoLabel}>Stability Progress:</Text>
              <Text style={styles.gpsInfoValue}>
                {gpsStability.stabilityProgress.toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {gpsStability.isStabilizing && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${gpsStability.stabilityProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressBarText}>
              {gpsStability.stabilityProgress >= 100 ? 'Ready!' : 'Stabilizing...'}
            </Text>
          </View>
        )}

        {/* Available Features */}
        <View style={styles.availableFeaturesContainer}>
          <Text style={styles.availableFeaturesTitle}>Available Now:</Text>
          <View style={styles.availableFeaturesList}>
            <View style={styles.availableFeatureItem}>
              <Icon name="check-circle" size={16} color="#28a745" />
              <Text style={styles.availableFeatureText}>GPS Location Tracking</Text>
            </View>
            <View style={styles.availableFeatureItem}>
              <Icon name="check-circle" size={16} color="#28a745" />
              <Text style={styles.availableFeatureText}>Voice AI Assistant</Text>
            </View>
            <View style={styles.availableFeatureItem}>
              <Icon name="check-circle" size={16} color="#28a745" />
              <Text style={styles.availableFeatureText}>Round Management</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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

  // Show GPS stabilization screen if GPS not ready for map
  if (isLocationTracking && !mapMountingAllowed) {
    return (
      <SafeAreaView style={styles.container}>
        {renderGPSStabilizationScreen()}
        
        {/* Voice AI Interface still available during GPS stabilization */}
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
  }

  // Main render - Active round with robust map handling
  return (
    <SafeAreaView style={styles.container}>
      {/* Map with Error Boundary and Stabilization */}
      <MapErrorBoundary
        currentLocation={simpleLocationData}
        onMapPress={handleMapPress}
        onRetryMap={handleMapRetry}
        fallbackMode="gps-only"
      >
        {mapMountingAllowed ? (
          <SimpleMapView
            currentLocation={simpleLocationData}
            onMapPress={handleMapPress}
            showUserLocation={true}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Icon name="map" size={48} color="#6c757d" />
            <Text style={styles.mapPlaceholderText}>
              Map loading... GPS stabilizing
            </Text>
          </View>
        )}
      </MapErrorBoundary>

      {/* Simple Map Overlay */}
      <SimpleMapOverlay
        courseName={activeRound?.course?.name}
        currentHole={currentHole}
        currentLocation={simpleLocationData}
        isLocationTracking={isLocationTracking}
        isVoiceInterfaceVisible={isVoiceInterfaceVisible}
        roundStatus={activeRound?.status}
        onVoiceToggle={handleVoiceToggle}
        onRoundControlsPress={() => setShowRoundControls(!showRoundControls)}
        onCenterOnUser={handleCenterOnUser}
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
  
  // GPS Stabilization Screen Styles
  gpsStabilizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  gpsStabilizationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  gpsStabilizationSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    maxWidth: 300,
  },
  gpsStabilizationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  gpsInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4a7c59',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    fontWeight: '500',
  },
  availableFeaturesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  availableFeaturesList: {
    gap: 8,
  },
  availableFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableFeatureText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
  
  // Map Placeholder Styles
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ActiveRoundScreen;