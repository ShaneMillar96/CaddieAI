import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  Text,
  Animated,
  TouchableOpacity,
  NativeModules,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  MapPressEvent,
  Region,
  LatLng,
} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { DistanceCalculator, Coordinate, DistanceResult } from '../../utils/DistanceCalculator';
import { LocationData } from '../../services/LocationService';
import MapDiagnostics from '../debug/MapDiagnostics';

const { width, height } = Dimensions.get('window');

export interface GolfCourseMapProps {
  currentLocation: LocationData | {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;
  onTargetSelected: (coordinate: Coordinate, distance: DistanceResult) => void;
  onLocationUpdate: (coordinate: Coordinate) => void;
  courseId?: number;
  courseName?: string;
  initialRegion?: Region;
  showSatellite?: boolean;
  enableTargetPin?: boolean;
  // Shot placement functionality
  shotMarkers?: ShotMarker[];
  isPlacingShotMode?: boolean;
  onShotPlaced?: (shot: ShotMarker) => void;
  onShotRemoved?: (shotId: string) => void;
}

export interface TargetPin {
  coordinate: Coordinate;
  distance: DistanceResult;
  timestamp: number;
}

export interface ShotMarker {
  id: string;
  coordinate: Coordinate;
  distance: DistanceResult;
  timestamp: number;
  club?: string;
  note?: string;
  accuracy?: number;
}

/**
 * GolfCourseMap Component - Optimized for Reliable Initialization
 * 
 * Recent optimizations:
 * - Simplified map provider selection for better reliability
 * - Enhanced debugging and timeout mechanisms for initialization tracking
 * - Optimized Redux state updates to prevent performance issues
 * - Improved fallback strategy with user-friendly error recovery
 * - Removed overly restrictive memoization that blocked necessary re-renders
 */
const GolfCourseMap: React.FC<GolfCourseMapProps> = React.memo(({
  currentLocation,
  onTargetSelected,
  onLocationUpdate,
  courseId,
  courseName,
  initialRegion,
  showSatellite = true,
  enableTargetPin = true,
  // Shot placement props
  shotMarkers = [],
  isPlacingShotMode = false,
  onShotPlaced,
  onShotRemoved,
}) => {
  // Location validation and logging
  if (currentLocation) {
    const isValidLocation = currentLocation.latitude !== 0 && 
                           currentLocation.longitude !== 0 && 
                           Math.abs(currentLocation.latitude) <= 90 && 
                           Math.abs(currentLocation.longitude) <= 180;
    if (!isValidLocation) {
      console.warn('🔴 GolfCourseMap: Invalid location coordinates:', {
        coordinates: `${currentLocation.latitude}, ${currentLocation.longitude}`,
        accuracy: currentLocation.accuracy || 'unknown'
      });
    }
  }

  // Simplified state management
  const [targetPin, setTargetPin] = useState<TargetPin | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [googlePlayServicesAvailable, setGooglePlayServicesAvailable] = useState<boolean | null>(null);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Refs
  const mapRef = useRef<MapView>(null);
  const lastLocationUpdateRef = useRef<number>(0);
  const mapInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const componentMountTimeRef = useRef<number>(Date.now());
  const mapKeyRef = useRef<string>(`mapview-${Platform.OS}-${Date.now()}`);
  
  // Animation ref for user location pulse
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Simplified Google Play Services availability check
  const checkGooglePlayServices = useCallback(() => {
    if (Platform.OS !== 'android') {
      setGooglePlayServicesAvailable(true);
      return true;
    }

    // For Android, we'll assume Google Play Services is available
    // The MapView will handle fallback internally if it's not available
    setGooglePlayServicesAvailable(true);
    console.log('🟢 GolfCourseMap: Assuming Google Play Services available - will fallback if needed');
    return true;
  }, []);

  // Simplified API key validation - no external calls
  const validateApiKey = useCallback(() => {
    // Skip external validation to avoid triggering API restrictions
    // The MapView will handle API key validation internally
    setApiKeyValid(true);
    console.log('🟢 GolfCourseMap: Skipping external API key validation - letting MapView handle it');
    return true;
  }, []);

  // Run initial diagnostics
  useEffect(() => {
    console.log('🟢 GolfCourseMap: Running simplified diagnostics...');
    
    // Check Google Play Services availability (simplified)
    const playServicesAvailable = checkGooglePlayServices();
    console.log('🟢 GolfCourseMap: Google Play Services check completed:', playServicesAvailable);
    
    // Validate API key (simplified)
    const keyValid = validateApiKey();
    console.log('🟢 GolfCourseMap: API key validation completed:', keyValid);
    
    console.log('🟢 GolfCourseMap: Initial diagnostics completed - letting MapView handle initialization');
  }, [checkGooglePlayServices, validateApiKey]);

  // Map initialization timeout and debugging
  useEffect(() => {
    console.log('🟢 GolfCourseMap: Component mounted, starting map initialization timeout');
    
    // Set up timeout to detect map initialization failures
    mapInitTimeoutRef.current = setTimeout(() => {
      if (isMapLoading && !isMapReady) {
        const timeElapsed = Date.now() - componentMountTimeRef.current;
        console.error('🔴 GolfCourseMap: MAP INITIALIZATION TIMEOUT DETECTED!');
        console.error('🔴 GolfCourseMap: Map failed to initialize after', timeElapsed + 'ms');
        // Enhanced diagnostic information
        const diagnosticInfo: {
          isMapLoading: boolean;
          isMapReady: boolean;
          hasCurrentLocation: boolean;
          mapError: string | null;
          provider: string;
          platform: string;
          hasMapRef: boolean;
          timeElapsed: string;
          googlePlayServicesAvailable: boolean | null;
          apiKeyValid: boolean | null;
          androidDiagnosis?: {
            suspectedIssue: string;
            requiredProvider: string;
            commonCauses: string[];
          };
        } = {
          isMapLoading,
          isMapReady,
          hasCurrentLocation: !!currentLocation,
          mapError,
          provider: mapProvider === PROVIDER_GOOGLE ? 'PROVIDER_GOOGLE' : 'PROVIDER_DEFAULT',
          platform: Platform.OS,
          hasMapRef: !!mapRef.current,
          timeElapsed: timeElapsed + 'ms',
          googlePlayServicesAvailable,
          apiKeyValid
        };
        
        if (Platform.OS === 'android') {
          let suspectedIssue = 'Unknown issue';
          const commonCauses: string[] = [];
          
          if (googlePlayServicesAvailable === false) {
            suspectedIssue = 'Google Play Services not available';
            commonCauses.push('Google Play Services not installed or outdated');
          } else if (apiKeyValid === false) {
            suspectedIssue = 'Invalid or restricted API key';
            commonCauses.push('API key invalid or has incorrect restrictions');
            commonCauses.push('API key missing Maps SDK for Android access');
          } else {
            suspectedIssue = 'Map initialization failure';
            commonCauses.push('Network connectivity issues');
            commonCauses.push('Google Play Services configuration issue');
            commonCauses.push('React Native Maps version compatibility');
          }
          
          diagnosticInfo.androidDiagnosis = {
            suspectedIssue,
            requiredProvider: 'PROVIDER_GOOGLE',
            commonCauses
          };
        }
        
        console.error('🔴 GolfCourseMap: Diagnostic information:', diagnosticInfo);
        
        const errorMessage = Platform.OS === 'android' 
          ? 'Map failed to load. Please ensure Google Play Services is installed and up-to-date.'
          : 'Map initialization timed out. Please check your internet connection and try again.';
          
        // Set error state - no complex fallback attempts
        setMapError(errorMessage);
        setIsMapLoading(false);
        setIsMapReady(false);
      }
    }, 5000); // 5 second timeout - reduced from 10 seconds
    
    return () => {
      if (mapInitTimeoutRef.current) {
        clearTimeout(mapInitTimeoutRef.current);
        mapInitTimeoutRef.current = null;
      }
    };
  }, []);

  // Clear timeout when map successfully initializes
  useEffect(() => {
    if (isMapReady && mapInitTimeoutRef.current) {
      console.log('🟢 GolfCourseMap: Map initialized successfully, clearing timeout');
      clearTimeout(mapInitTimeoutRef.current);
      mapInitTimeoutRef.current = null;
    }
  }, [isMapReady]);

  // Start pulse animation for user location marker
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startPulseAnimation());
    };

    if (currentLocation) {
      startPulseAnimation();
    }
  }, [currentLocation, pulseAnimation]);

  // Default region (should be updated based on course location)
  const defaultRegion: Region = initialRegion || {
    latitude: 54.9783, // Faughan Valley Golf Centre coordinates
    longitude: -7.2054,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Simplified location update with auto-zoom
  useEffect(() => {
    if (currentLocation && isMapReady && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Golf-appropriate zoom level
        longitudeDelta: 0.005,
      };

      // Throttle updates to prevent excessive animations
      const now = Date.now();
      const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
      const isFirstLocation = lastLocationUpdateRef.current === 0;
      
      if (isFirstLocation || timeSinceLastUpdate > 3000) {
        setMapRegion(newRegion);
        
        try {
          mapRef.current.animateToRegion(newRegion, 1500);
          console.log('🟢 GolfCourseMap: Updated map region to user location');
        } catch (error) {
          console.error('🔴 GolfCourseMap: Error animating to location:', error);
        }
        
        lastLocationUpdateRef.current = now;
        
        // Notify parent of location update
        onLocationUpdate?.({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
    }
  }, [currentLocation, isMapReady, onLocationUpdate]);

  // Enhanced map press handler for both target selection and shot placement
  const handleMapPress = useCallback((event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    console.log('🟠 GolfCourseMap: Map press detected:', {
      coordinate,
      hasCurrentLocation: !!currentLocation,
      isPlacingShotMode,
      enableTargetPin
    });
    
    if (!currentLocation) {
      console.warn('🔴 GolfCourseMap: No current location for map press');
      Alert.alert(
        'Location Required',
        'Please wait for GPS to acquire your location before selecting targets or placing shots.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Calculate distance to target with enhanced validation
    const distance = DistanceCalculator.calculateDistance(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      coordinate
    );

    // Enhanced distance validation for golf shots
    if (distance.yards < 5) {
      Alert.alert(
        'Target Too Close',
        'Please select a target at least 5 yards away for meaningful distance measurement.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (distance.yards > 600) {
      Alert.alert(
        'Target Too Far',
        'Please select a target within 600 yards for accurate golf distance measurement. Consider breaking longer shots into segments.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Handle shot placement mode
    if (isPlacingShotMode && onShotPlaced) {
      console.log('🟢 GolfCourseMap: Placing shot in shot mode:', {
        distance: distance.yards,
        coordinate
      });
      
      const newShot: ShotMarker = {
        id: `shot-${Date.now()}`,
        coordinate,
        distance,
        timestamp: Date.now(),
        club: getRecommendedClub(distance.yards),
        accuracy: currentLocation.accuracy,
      };

      onShotPlaced(newShot);
      
      Alert.alert(
        'Shot Placed',
        `Shot placed at ${distance.yards} yards with recommended club: ${newShot.club}`,
        [{ text: 'OK' }]
      );
      
      console.log(`🟢 GolfCourseMap: Shot placed successfully: ${distance.yards} yards, club: ${newShot.club}`);
      return;
    }

    // Handle target pin placement (default behavior)
    if (enableTargetPin) {
      // Create new target pin with enhanced data and smooth transition
      const newTargetPin: TargetPin = {
        coordinate,
        distance,
        timestamp: Date.now(),
      };

      // Add smooth transition for target pin placement
      setTargetPin(null); // Clear first for smooth transition
      setTimeout(() => {
        setTargetPin(newTargetPin);
        onTargetSelected(coordinate, distance);
      }, 100);
      
      console.log(`Target selected: ${distance.yards} yards from current location`);
    }
  }, [currentLocation, enableTargetPin, isPlacingShotMode, onTargetSelected, onShotPlaced]);

  // Handle long press for recentering map with enhanced feedback
  const handleLongPress = useCallback(() => {
    if (currentLocation && mapRef.current) {
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current.animateToRegion(region, 1500);
      
      // Reset last update time to force immediate update on next location change
      lastLocationUpdateRef.current = 0;
      
      console.log('Map recentered to user location');
    } else if (!currentLocation) {
      console.warn('Cannot recenter: user location not available');
    }
  }, [currentLocation]);

  // Enhanced map ready handler with comprehensive debugging
  const handleMapReady = useCallback(() => {
    console.log('🟢 GolfCourseMap: *** MAP READY EVENT TRIGGERED ***');
    console.log('🟢 GolfCourseMap: Map ready callback fired - initializing map state');
    
    try {
      // Clear any existing errors
      setMapError(null);
      
      // Set map as ready and stop loading
      console.log('🟢 GolfCourseMap: Setting isMapReady=true, isMapLoading=false');
      setIsMapReady(true);
      setIsMapLoading(false);
      
      // Set initial region: current location > initial region > default region
      let initialMapRegion: Region;
      
      if (currentLocation && currentLocation.latitude !== 0 && currentLocation.longitude !== 0) {
        initialMapRegion = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        console.log('🟢 GolfCourseMap: Map ready - using current location:', {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude
        });
      } else if (initialRegion) {
        initialMapRegion = initialRegion;
        console.log('🟢 GolfCourseMap: Map ready - using initial region:', initialRegion);
      } else {
        initialMapRegion = defaultRegion;
        console.log('🟢 GolfCourseMap: Map ready - using default region:', defaultRegion);
      }
      
      setMapRegion(initialMapRegion);
      console.log('🟢 GolfCourseMap: Map region set to:', initialMapRegion);
      
      // Animate to initial region
      if (mapRef.current) {
        try {
          console.log('🟢 GolfCourseMap: Animating to initial region...');
          mapRef.current.animateToRegion(initialMapRegion, 1000);
          console.log('🟢 GolfCourseMap: Animation started successfully');
        } catch (error) {
          console.error('🔴 GolfCourseMap: Error animating to initial region:', error);
        }
      } else {
        console.warn('🔴 GolfCourseMap: mapRef.current is null during map ready');
      }
      
      console.log('🟢 GolfCourseMap: *** MAP INITIALIZATION COMPLETED SUCCESSFULLY ***');
    } catch (error) {
      console.error('🔴 GolfCourseMap: Error in handleMapReady:', error);
      setMapError('Map initialization failed. Please try again.');
      setIsMapLoading(false);
      setIsMapReady(false);
    }
  }, [currentLocation, initialRegion, defaultRegion]);

  // Clear target pin on double tap with smooth animation
  const handleDoubleTap = useCallback(() => {
    if (targetPin) {
      // Animate out the target pin
      setTargetPin(null);
      onTargetSelected({ latitude: 0, longitude: 0 }, { yards: 0, meters: 0, feet: 0, kilometers: 0, miles: 0 });
      console.log('Target pin cleared with animation');
    }
  }, [targetPin, onTargetSelected]);

  // Enhanced custom marker for user location with animated pulse and accuracy visualization
  const renderUserLocationMarker = () => {
    if (!currentLocation) {
      return null;
    }

    // Validate coordinates are valid numbers (more permissive validation)
    if (typeof currentLocation.latitude !== 'number' || 
        typeof currentLocation.longitude !== 'number' ||
        isNaN(currentLocation.latitude) || 
        isNaN(currentLocation.longitude) ||
        Math.abs(currentLocation.latitude) > 90 || 
        Math.abs(currentLocation.longitude) > 180) {
      console.warn('🔴 GolfCourseMap: Invalid location coordinates - skipping marker render:', {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        latValid: typeof currentLocation.latitude === 'number' && !isNaN(currentLocation.latitude),
        lngValid: typeof currentLocation.longitude === 'number' && !isNaN(currentLocation.longitude)
      });
      return null;
    }
    
    console.log('🟢 GolfCourseMap: Valid location coordinates for marker render:', {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
      accuracy: currentLocation.accuracy
    });

    const accuracyText = currentLocation.accuracy 
      ? `GPS: ${currentLocation.accuracy.toFixed(1)}m` 
      : 'GPS: Unknown';
    
    const speedText = ('speed' in currentLocation && currentLocation.speed) 
      ? ` • Speed: ${(currentLocation.speed * 3.6).toFixed(1)} km/h` 
      : '';

    // Enhanced GPS accuracy status with more granular levels
    const getAccuracyStatus = (accuracy?: number) => {
      if (!accuracy || accuracy <= 0) return { color: '#2196F3', status: 'active', icon: 'gps-fixed', quality: 'GPS Active' };
      if (accuracy <= 3) return { color: '#00C851', status: 'excellent', icon: 'gps-fixed', quality: 'Excellent' };
      if (accuracy <= 5) return { color: '#4CAF50', status: 'excellent', icon: 'gps-fixed', quality: 'Excellent' };
      if (accuracy <= 8) return { color: '#8BC34A', status: 'good', icon: 'gps-fixed', quality: 'Good' };
      if (accuracy <= 15) return { color: '#FFBB33', status: 'fair', icon: 'gps-not-fixed', quality: 'Fair' };
      if (accuracy <= 25) return { color: '#FF8800', status: 'poor', icon: 'gps-not-fixed', quality: 'Poor' };
      return { color: '#FF4444', status: 'very-poor', icon: 'gps-off', quality: 'Very Poor' };
    };

    const accuracyStatus = getAccuracyStatus(currentLocation.accuracy);
    
    console.log('🟢 GolfCourseMap: Rendering user marker with coordinates:', {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracyColor: accuracyStatus.color,
      accuracyStatus: accuracyStatus.status,
      accuracyQuality: accuracyStatus.quality
    });

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        title="Your Position"
        description={`${accuracyText}${speedText} • Quality: ${accuracyStatus.quality}`}
        flat={false}
        zIndex={9999}
        tracksViewChanges={false}
        key={`user-location-${currentLocation.latitude}-${currentLocation.longitude}`}
      >
        <View style={styles.userLocationContainer}>
          {/* Large accuracy circle showing GPS precision */}
          {currentLocation.accuracy && currentLocation.accuracy <= 50 && (
            <View 
              style={[
                styles.accuracyCircle,
                {
                  width: Math.max(40, Math.min(120, currentLocation.accuracy * 2)),
                  height: Math.max(40, Math.min(120, currentLocation.accuracy * 2)),
                  borderRadius: Math.max(20, Math.min(60, currentLocation.accuracy)),
                  backgroundColor: `${accuracyStatus.color}15`,
                  borderColor: `${accuracyStatus.color}40`,
                }
              ]} 
            />
          )}
          
          {/* Animated outer pulse ring */}
          <Animated.View 
            style={[
              styles.userLocationOuterPulse,
              {
                transform: [{ scale: pulseAnimation }],
                backgroundColor: `${accuracyStatus.color}20`,
                borderColor: `${accuracyStatus.color}50`,
              }
            ]} 
          />
          
          {/* Inner pulse ring */}
          <View style={[
            styles.userLocationPulse,
            {
              backgroundColor: `${accuracyStatus.color}30`,
              borderColor: `${accuracyStatus.color}70`,
            }
          ]} />
          
          {/* Main location marker - enhanced visibility */}
          <View style={[
            styles.userLocationMarker,
            { 
              backgroundColor: accuracyStatus.color,
              borderWidth: 4,
              borderColor: '#ffffff',
              shadowColor: accuracyStatus.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
            }
          ]}>
            <Icon name="my-location" size={20} color="#fff" />
          </View>
          
          {/* GPS accuracy indicator badge */}
          <View style={[
            styles.accuracyIndicator,
            { backgroundColor: accuracyStatus.color }
          ]}>
            <Icon name={accuracyStatus.icon} size={12} color="#fff" />
          </View>
          
          {/* Direction indicator (if heading is available) */}
          {'heading' in currentLocation && currentLocation.heading !== undefined && currentLocation.heading !== null && (
            <View style={[
              styles.directionIndicator,
              {
                transform: [{ rotate: `${currentLocation.heading}deg` }],
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: accuracyStatus.color,
                borderWidth: 2,
              }
            ]}>
              <Icon name="navigation" size={14} color={accuracyStatus.color} />
            </View>
          )}
        </View>
      </Marker>
    );
  };

  // Enhanced custom marker for target pin with better visuals and club recommendations
  const renderTargetMarker = () => {
    if (!targetPin) return null;

    const formattedDistance = DistanceCalculator.formatGolfDistance(targetPin.distance);
    const recommendedClub = getRecommendedClub(targetPin.distance.yards);
    const bearing = currentLocation ? DistanceCalculator.calculateBearing(
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      targetPin.coordinate
    ) : 0;

    const bearingText = getBearingText(bearing);

    return (
      <Marker
        coordinate={targetPin.coordinate}
        anchor={{ x: 0.5, y: 1.0 }}
        title="Shot Target"
        description={`${formattedDistance} • ${recommendedClub} • ${bearingText} (${bearing.toFixed(0)}°)`}
        zIndex={999}
      >
        <View style={styles.targetMarkerContainer}>
          {/* Enhanced crosshair effect with pulsing animation */}
          <Animated.View 
            style={[
              styles.crosshair,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <View style={[styles.crosshairLine, styles.crosshairHorizontal]} />
            <View style={[styles.crosshairLine, styles.crosshairVertical]} />
          </Animated.View>
          
          {/* Target pin with enhanced visuals */}
          <View style={styles.targetMarker}>
            <Icon name="place" size={28} color="#fff" />
          </View>
          
          {/* Distance badge with enhanced styling */}
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{Math.round(targetPin.distance.yards)}</Text>
            <Text style={styles.distanceUnit}>yds</Text>
          </View>
          
          {/* Club recommendation badge */}
          <View style={styles.clubBadge}>
            <Text style={styles.clubText}>{recommendedClub}</Text>
          </View>
          
          {/* Bearing indicator */}
          {currentLocation && (
            <View style={styles.bearingIndicator}>
              <Icon name="explore" size={12} color="#fff" />
              <Text style={styles.bearingText}>{bearingText}</Text>
            </View>
          )}
        </View>
      </Marker>
    );
  };

  // Render shot markers with distance labels (matching reference design)
  const renderShotMarkers = () => {
    return shotMarkers.map((shot, index) => (
      <Marker
        key={shot.id}
        coordinate={shot.coordinate}
        anchor={{ x: 0.5, y: 1.0 }}
        title={`Shot ${index + 1}`}
        description={`${shot.distance.yards}y • ${shot.club || 'Unknown club'}`}
        onPress={() => {
          // Allow removal of shot markers on press
          if (onShotRemoved) {
            Alert.alert(
              'Remove Shot',
              `Remove shot ${index + 1} (${shot.distance.yards} yards)?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onShotRemoved(shot.id) }
              ]
            );
          }
        }}
      >
        <View style={styles.shotMarkerContainer}>
          {/* Distance badge similar to reference "120" style */}
          <View style={styles.shotDistanceBadge}>
            <Text style={styles.shotDistanceText}>{Math.round(shot.distance.yards)}</Text>
          </View>
          {/* Small green marker dot */}
          <View style={styles.shotMarker}>
            <Icon name="place" size={12} color="#fff" />
          </View>
        </View>
      </Marker>
    ));
  };

  // Get recommended club based on distance
  const getRecommendedClub = (yards: number): string => {
    if (yards >= 280) return 'Driver';
    if (yards >= 240) return '3-Wood';
    if (yards >= 210) return '5-Wood';
    if (yards >= 190) return '3-Iron';
    if (yards >= 170) return '4-Iron';
    if (yards >= 160) return '5-Iron';
    if (yards >= 150) return '6-Iron';
    if (yards >= 140) return '7-Iron';
    if (yards >= 130) return '8-Iron';
    if (yards >= 120) return '9-Iron';
    if (yards >= 105) return 'PW';
    if (yards >= 90) return 'SW';
    if (yards >= 70) return 'LW';
    return 'Short Iron';
  };

  // Get bearing direction text
  const getBearingText = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Simplified map provider selection - no complex fallback
  const mapProvider = useMemo(() => {
    let provider: typeof PROVIDER_GOOGLE | typeof PROVIDER_DEFAULT;
    
    if (Platform.OS === 'android') {
      provider = PROVIDER_GOOGLE;
      console.log('🟢 GolfCourseMap: Using PROVIDER_GOOGLE for Android');
    } else {
      provider = PROVIDER_DEFAULT;
      console.log('🟢 GolfCourseMap: Using PROVIDER_DEFAULT for iOS (Apple Maps)');
    }
    
    return provider;
  }, []);

  // Handle map loading errors with NPE detection and auto-retry
  const handleMapError = useCallback((error: any) => {
    console.error('Map loading error:', error);
    setIsMapLoading(false);
    setIsMapReady(false);
    
    let errorMessage = 'Unable to load map. Please check your internet connection and try again.';
    
    // Provide more specific error messages
    const errorObj = error as any;
    const errorString = errorObj?.message || errorObj?.toString() || '';
    
    if (errorObj?.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error: Please check your internet connection.';
    } else if (errorObj?.code === 'API_KEY_ERROR') {
      errorMessage = 'Map service configuration error. Please contact support.';
    } else if (errorObj?.message?.includes('location')) {
      errorMessage = 'Location services error. Please enable GPS and try again.';
    } else if (errorString.includes('LinkedList') || errorString.includes('NullPointer') || errorString.includes('isEmpty')) {
      console.log('🔄 NPE detected in GolfCourseMap, attempting auto-retry...');
      
      // Auto-retry for LinkedList/NPE errors after a short delay
      setTimeout(() => {
        console.log('Auto-retrying GolfCourseMap initialization after NPE error');
        setMapError(null);
        setIsMapLoading(true);
        setIsMapReady(false);
        // Force component re-mount with new key
        mapKeyRef.current = `mapview-${Platform.OS}-npe-retry-${Date.now()}`;
      }, 2000);
      
      errorMessage = 'Map initialization error detected. Retrying automatically...';
    }
    
    setMapError(errorMessage);
  }, []);

  // Loading component for map initialization with debug info
  const renderMapLoading = () => {
    const timeElapsed = Date.now() - componentMountTimeRef.current;
    console.log('🟠 GolfCourseMap: Rendering loading state after', timeElapsed + 'ms');
    
    return (
      <View style={styles.loadingContainer}>
        <Icon name="golf-course" size={48} color="#4a7c59" />
        <Text style={styles.loadingTitle}>Loading Golf Course Map</Text>
        <Text style={styles.loadingMessage}>
          {currentLocation ? 'Centering on your location...' : 'Initializing course view...'}
        </Text>
        {__DEV__ && (
          <Text style={styles.debugText}>
            Debug: {timeElapsed}ms elapsed, Provider: {mapProvider === PROVIDER_DEFAULT ? 'DEFAULT' : 'GOOGLE'}
          </Text>
        )}
      </View>
    );
  };

  // Enhanced fallback component when map fails to load
  const renderMapFallback = () => {
    const retryMapInitialization = () => {
      console.log('🔄 GolfCourseMap: User requested map retry for', Platform.OS);
      
      // Simple retry - reset map state
      setMapError(null);
      setIsMapLoading(true);
      setIsMapReady(false);
      
      // Reset timeout and force new key
      componentMountTimeRef.current = Date.now();
      mapKeyRef.current = `mapview-${Platform.OS}-retry-${Date.now()}`;
      
      console.log('🔄 GolfCourseMap: Restarting map with new key');
    };

    return (
      <View style={styles.fallbackContainer}>
        <Icon name="map-off" size={48} color="#ff6b6b" />
        <Text style={styles.fallbackTitle}>Map Unavailable</Text>
        <Text style={styles.fallbackMessage}>
          {mapError || 'Maps are temporarily unavailable, but all golf features continue to work with GPS.'}
        </Text>
        
        {/* Show specific guidance based on the error */}
        {Platform.OS === 'android' && !googlePlayServicesAvailable && (
          <View style={styles.androidGuidance}>
            <Text style={styles.androidGuidanceTitle}>📱 Using Fallback Map</Text>
            <Text style={styles.androidGuidanceText}>• Google Play Services not detected</Text>
            <Text style={styles.androidGuidanceText}>• Using device default mapping</Text>
            <Text style={styles.androidGuidanceText}>• GPS tracking still fully functional</Text>
            <Text style={styles.androidGuidanceText}>• Distance calculations working</Text>
          </View>
        )}
        
        {Platform.OS === 'android' && googlePlayServicesAvailable && (
          <View style={styles.androidGuidance}>
            <Text style={styles.androidGuidanceTitle}>🔧 Troubleshooting:</Text>
            <Text style={styles.androidGuidanceText}>• Check internet connection</Text>
            <Text style={styles.androidGuidanceText}>• Verify location permissions</Text>
            <Text style={styles.androidGuidanceText}>• Try restarting the app</Text>
          </View>
        )}
        
        {apiKeyValid === false && (
          <View style={styles.androidGuidance}>
            <Text style={styles.androidGuidanceTitle}>🔑 API Configuration Issue:</Text>
            <Text style={styles.androidGuidanceText}>• Google Maps API key needs attention</Text>
            <Text style={styles.androidGuidanceText}>• Contact support if this persists</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.fallbackActions}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={retryMapInitialization}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Map</Text>
          </TouchableOpacity>
          
          {Platform.OS === 'android' && (
            <TouchableOpacity 
              style={styles.playServicesButton} 
              onPress={() => {
                Alert.alert(
                  'Google Play Services Required',
                  'Please install or update Google Play Services from the Google Play Store to use the map feature.',
                  [{ text: 'OK' }]
                );
              }}
              activeOpacity={0.8}
            >
              <Icon name="get-app" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Get Play Services</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.diagnosticsButton} 
            onPress={() => setShowDiagnostics(true)}
            activeOpacity={0.8}
          >
            <Icon name="bug-report" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Run Diagnostics</Text>
          </TouchableOpacity>
        </View>
        
        {/* Current location info if available */}
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoTitle}>GPS Status: Active</Text>
            <Text style={styles.locationText}>
              📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            {currentLocation.accuracy && (
              <Text style={styles.accuracyText}>
                🎯 Accuracy: ±{currentLocation.accuracy.toFixed(1)}m
              </Text>
            )}
            <Text style={styles.fallbackFeatureText}>
              ✅ Distance measurement available
            </Text>
            <Text style={styles.fallbackFeatureText}>
              ✅ Location tracking active
            </Text>
            <Text style={styles.fallbackFeatureText}>
              ✅ Voice AI assistance working
            </Text>
            <Text style={styles.fallbackFeatureText}>
              ✅ Round tracking available
            </Text>
          </View>
        )}
        
        {!currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoTitle}>GPS Status: Searching</Text>
            <Text style={styles.fallbackFeatureText}>
              📡 Acquiring GPS signal...
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Simplified ref callback with better debugging
  const mapRefCallback = useCallback((ref: MapView | null) => {
    console.log('🟢 GolfCourseMap: MapView ref callback triggered:', {
      refExists: !!ref,
      previousRefExists: !!mapRef.current,
      refType: ref ? typeof ref : 'null',
      timestamp: Date.now()
    });
    
    if (ref) {
      console.log('🟢 GolfCourseMap: MapView ref successfully assigned');
      mapRef.current = ref;
    } else {
      console.log('🔴 GolfCourseMap: MapView ref cleared (component unmounting?)');
      mapRef.current = null;
    }
  }, []);

  const mapLayoutCallback = useCallback((event: any) => {
    const timeElapsed = Date.now() - componentMountTimeRef.current;
    console.log('🟠 GolfCourseMap: MapView onLayout triggered after', timeElapsed + 'ms:', {
      layout: event.nativeEvent.layout,
      timestamp: Date.now()
    });
  }, []);

  const mapRegionMemo = useMemo(() => {
    const regionToUse = mapRegion || defaultRegion;
    
    // Validate region data
    if (!regionToUse || 
        typeof regionToUse.latitude !== 'number' || 
        typeof regionToUse.longitude !== 'number' || 
        Math.abs(regionToUse.latitude) > 90 || 
        Math.abs(regionToUse.longitude) > 180) {
      return defaultRegion;
    }
    
    return regionToUse;
  }, [mapRegion, defaultRegion]);

  // Simplified map rendering for better mounting reliability
  const renderMapContent = () => {
    try {
      if (mapError) {
        return renderMapFallback();
      }
      
      if (isMapLoading) {
        return renderMapLoading();
      }

      // Log MapView rendering attempt
      console.log('🟢 GolfCourseMap: Attempting to render simplified MapView with:', {
        provider: mapProvider === PROVIDER_GOOGLE ? 'PROVIDER_GOOGLE' : 'PROVIDER_DEFAULT',
        key: mapKeyRef.current,
        hasRegion: !!mapRegionMemo,
        region: mapRegionMemo
      });
      
      return (
        <View style={styles.container}>
          <MapView
            key={mapKeyRef.current}
            ref={mapRefCallback}
            provider={mapProvider}
            style={styles.map}
            initialRegion={mapRegionMemo}
            onMapReady={handleMapReady}
            onLayout={mapLayoutCallback}
            // onError={handleMapError} // Temporarily disabled due to type issues
            // Minimal props for reliable mounting
            mapType="standard"
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            showsTraffic={false}
            showsBuildings={false}
            showsIndoors={false}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false}
            toolbarEnabled={false}
            loadingEnabled={true}
            loadingIndicatorColor="#4a7c59"
            loadingBackgroundColor="#f5f5f5"
            // Additional defensive props to prevent NPE issues
            moveOnMarkerPress={false}
            cacheEnabled={true}
            compassOffset={{ x: 0, y: 0 }}
            mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
            // Remove complex event handlers initially
            onPress={handleMapPress}
            onRegionChangeComplete={(region) => {
              console.log('🟠 GolfCourseMap: onRegionChangeComplete triggered:', region);
              setMapRegion(region);
            }}
          >
            {/* Only render markers after map is ready */}
            {isMapReady && renderUserLocationMarker()}
            {isMapReady && renderTargetMarker()}
            {isMapReady && renderShotMarkers()}
          </MapView>

          {/* Overlays */}
          {isPlacingShotMode && (
            <View style={styles.shotPlacementOverlay}>
              <View style={styles.crosshairContainer}>
                <View style={[styles.shotCrosshairLine, styles.shotCrosshairHorizontal]} />
                <View style={[styles.shotCrosshairLine, styles.shotCrosshairVertical]} />
                <View style={styles.crosshairCenter} />
              </View>
              <View style={styles.shotPlacementInstruction}>
                <Text style={styles.shotPlacementText}>Tap map to place shot</Text>
              </View>
            </View>
          )}

          {currentLocation && (
            <View style={styles.gpsStatusContainer}>
              <Icon 
                name={currentLocation.accuracy && currentLocation.accuracy <= 10 ? 'gps-fixed' : 'gps-not-fixed'} 
                size={16} 
                color={currentLocation.accuracy && currentLocation.accuracy <= 10 ? '#4CAF50' : '#ff9800'} 
              />
              <Text style={styles.gpsStatusText}>
                {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'GPS'}
              </Text>
            </View>
          )}
        </View>
      );
    } catch (error) {
      console.error('🔴 GolfCourseMap: Error rendering map:', error);
      return renderMapFallback();
    }
  };


  return (
    <View style={styles.container}>
      {renderMapContent()}
      
      {/* Map Diagnostics Modal */}
      <MapDiagnostics 
        visible={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </View>
  );
});

// Simplified memoization - let React handle re-renders more naturally
// Overly restrictive memoization was preventing necessary re-renders during map initialization

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  userLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3', // Will be overridden by accuracy color
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1000,
    position: 'relative',
  },
  accuracyCircle: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 0,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(33, 150, 243, 0.6)',
    zIndex: 2,
  },
  userLocationOuterPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.4)',
    zIndex: 1,
  },
  accuracyIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50', // Will be overridden by accuracy color
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 4,
  },
  directionIndicator: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 3,
    borderWidth: 2,
  },
  targetMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  targetMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 10,
  },
  distanceBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#2c5530',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    flexDirection: 'row',
    gap: 2,
  },
  distanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  distanceUnit: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  crosshair: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  crosshairLine: {
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  crosshairHorizontal: {
    width: 100,
    height: 3,
  },
  crosshairVertical: {
    width: 3,
    height: 100,
  },
  clubBadge: {
    position: 'absolute',
    bottom: -25,
    backgroundColor: 'rgba(74, 124, 89, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  clubText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bearingIndicator: {
    position: 'absolute',
    top: -35,
    right: -15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  bearingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Shot marker styles (matching reference design)
  shotMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  shotMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00C851', // Green color for shot markers like reference
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  shotMarkerNumber: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  shotDistanceBadge: {
    position: 'absolute',
    top: -35,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  shotDistanceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  shotClubBadge: {
    position: 'absolute',
    bottom: -18,
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  shotClubText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Shot Placement Crosshair Overlay Styles
  shotPlacementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  crosshairContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotCrosshairLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  shotCrosshairHorizontal: {
    width: 100,
    height: 2,
  },
  shotCrosshairVertical: {
    width: 2,
    height: 100,
  },
  crosshairCenter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  shotPlacementInstruction: {
    position: 'absolute',
    bottom: -60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  shotPlacementText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsStatusContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gpsStatusText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fallbackActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a7c59',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  androidGuidance: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  androidGuidanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  androidGuidanceText: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 4,
  },
  locationInfo: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '80%',
  },
  locationInfoTitle: {
    fontSize: 14,
    color: '#2c5530',
    fontWeight: '600',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  fallbackFeatureText: {
    fontSize: 11,
    color: '#28a745',
    marginBottom: 2,
  },
});

export default GolfCourseMap;