import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  Text,
  Animated,
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

const { width, height } = Dimensions.get('window');

export interface GolfCourseMapProps {
  currentLocation: LocationData | {
    latitude: number;
    longitude: number;
    accuracy?: number;
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
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
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

const GolfCourseMap: React.FC<GolfCourseMapProps> = React.memo(({
  currentLocation,
  onTargetSelected,
  onLocationUpdate,
  courseId,
  courseName,
  initialRegion,
  showSatellite = true,
  enableTargetPin = true,
  mapType = 'satellite', // Default to satellite for better green visibility
  // Shot placement props
  shotMarkers = [],
  isPlacingShotMode = false,
  onShotPlaced,
  onShotRemoved,
}) => {
  // State management
  const [targetPin, setTargetPin] = useState<TargetPin | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const [mapInitTimeout, setMapInitTimeout] = useState(false);
  const [hasMapRef, setHasMapRef] = useState(false); // Track ref state for useEffects
  const [currentMapType, setCurrentMapType] = useState<string>(() => {
    switch (mapType) {
      case 'satellite': return 'satellite';
      case 'hybrid': return 'hybrid';
      case 'terrain': return 'terrain'; // Ensure terrain mode is properly supported
      default: return 'standard';
    }
  });

  // Update map type when prop changes
  useEffect(() => {
    const newMapType = (() => {
      switch (mapType) {
        case 'satellite': return 'satellite';
        case 'hybrid': return 'hybrid';
        case 'terrain': return 'terrain';
        default: return 'standard';
      }
    })();
    setCurrentMapType(newMapType);
  }, [mapType]);

  // Map initialization timeout - force map ready if it takes too long
  useEffect(() => {
    console.log('🟠 GolfCourseMap: Setting up map initialization timeout...');
    
    // Clear any existing timeout
    if (mapInitTimeoutRef.current) {
      clearTimeout(mapInitTimeoutRef.current);
    }
    
    // Set a 10-second timeout for map initialization
    mapInitTimeoutRef.current = setTimeout(() => {
      if (!isMapReady) {
        console.log('⚠️ GolfCourseMap: Map initialization timeout reached - forcing map ready state');
        setMapInitTimeout(true);
        setIsMapReady(true);
        setIsMapLoading(false);
        
        // Try to initialize with available region
        if (currentLocation) {
          const region: Region = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setMapRegion(region);
          console.log('🟠 GolfCourseMap: Timeout - set region to current location:', region);
          
          // If we have a mapRef, try to animate to the region immediately
          if (hasMapRef && mapRef.current) {
            try {
              console.log('🟠 GolfCourseMap: Timeout - attempting immediate animation to region');
              mapRef.current.animateToRegion(region, 1000);
              console.log('🟢 GolfCourseMap: Timeout - successfully animated to current location');
            } catch (error) {
              console.error('🔴 GolfCourseMap: Timeout - error animating to region:', error);
            }
          }
        } else if (initialRegion) {
          setMapRegion(initialRegion);
          console.log('🟠 GolfCourseMap: Timeout - set region to initial region:', initialRegion);
        }
      }
    }, 10000); // 10 second timeout
    
    // Cleanup timeout on unmount or when map becomes ready
    return () => {
      if (mapInitTimeoutRef.current) {
        clearTimeout(mapInitTimeoutRef.current);
        mapInitTimeoutRef.current = null;
      }
    };
  }, [isMapReady]); // Reduced dependencies to prevent loops

  // Clear timeout when map becomes ready
  useEffect(() => {
    if (isMapReady && mapInitTimeoutRef.current) {
      console.log('🟠 GolfCourseMap: Map became ready - clearing timeout');
      clearTimeout(mapInitTimeoutRef.current);
      mapInitTimeoutRef.current = null;
    }
  }, [isMapReady]);

  // Handle immediate location centering when mapRef becomes available
  useEffect(() => {
    if (hasMapRef && isMapReady && currentLocation && mapRef.current) {
      console.log('🟠 GolfCourseMap: MapRef became available - attempting immediate location centering');
      
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      try {
        console.log('🟠 GolfCourseMap: MapRef available - animating to current location:', region);
        mapRef.current.animateToRegion(region, 2000); // 2 second animation
        console.log('🟢 GolfCourseMap: MapRef available - successfully animated to location');
        
        // Update map region state
        setMapRegion(region);
        
        // Reset the timing ref to allow future updates
        lastLocationUpdateRef.current = Date.now();
      } catch (error) {
        console.error('🔴 GolfCourseMap: MapRef available - error animating to location:', error);
      }
    }
  }, [hasMapRef, isMapReady]); // Reduced dependencies to prevent loops

  // Refs
  const mapRef = useRef<MapView>(null);
  const lastLocationUpdateRef = useRef<number>(0);
  const mapInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Animation ref for user location pulse
  const pulseAnimation = useRef(new Animated.Value(1)).current;

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

  // Update map region when current location changes with auto-zoom
  useEffect(() => {
    console.log('🟠 GolfCourseMap: Location/Map state change useEffect triggered');
    console.log('🟠 GolfCourseMap: Location/Map state change:', {
      hasCurrentLocation: !!currentLocation,
      isMapReady,
      hasMapRef, // Use state instead of direct ref check
      hasMapRefDirect: !!mapRef.current,
      currentLocation: currentLocation ? {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        fullObject: currentLocation
      } : null
    });
    
    if (currentLocation && isMapReady && hasMapRef && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Closer zoom for golf (approximately 500m radius)
        longitudeDelta: 0.005,
      };

      // Only update if location has changed significantly or it's the first location
      const now = Date.now();
      const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
      const isFirstLocation = lastLocationUpdateRef.current === 0;
      
      console.log('GolfCourseMap: Location update timing:', {
        isFirstLocation,
        timeSinceLastUpdate,
        willUpdate: isFirstLocation || timeSinceLastUpdate > 3000
      });
      
      if (isFirstLocation || timeSinceLastUpdate > 3000) { // Update max every 3 seconds, immediate for first location
        console.log('🟠 GolfCourseMap: About to set map region and animate to:', newRegion);
        setMapRegion(newRegion);
        
        // Auto-zoom to user location with smooth animation
        try {
          console.log('🟠 GolfCourseMap: Calling animateToRegion with mapRef.current:', mapRef.current);
          mapRef.current.animateToRegion(newRegion, 1500); // 1.5 second animation
          console.log('🟢 GolfCourseMap: Successfully called animateToRegion');
        } catch (error) {
          console.error('🔴 GolfCourseMap: Error calling animateToRegion:', error);
        }
        
        lastLocationUpdateRef.current = now;
        
        console.log('🟢 GolfCourseMap: Updated map region and animated to user location');
        
        // Notify parent of location update - but don't include callback in deps
        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
        }
      }
    } else {
      console.log('🟠 GolfCourseMap: Cannot update location - missing requirements:', {
        hasCurrentLocation: !!currentLocation,
        isMapReady,
        hasMapRef,
        hasMapRefCurrent: !!mapRef.current
      });
    }
  }, [currentLocation, isMapReady, hasMapRef]); // Removed onLocationUpdate to prevent infinite loops

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

  // Handle map ready with improved initial positioning
  const handleMapReady = useCallback(() => {
    console.log('🟢 GolfCourseMap.handleMapReady: **MAP READY EVENT TRIGGERED**');
    console.log('🟢 GolfCourseMap.handleMapReady: Map ready event triggered', {
      hasCurrentLocation: !!currentLocation,
      hasInitialRegion: !!initialRegion,
      hasMapRef: !!mapRef.current,
      mapRefCurrent: mapRef.current,
      currentLocation: currentLocation ? {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        accuracy: currentLocation.accuracy
      } : null,
      initialRegion,
      defaultRegion
    });
    
    console.log('🟢 GolfCourseMap.handleMapReady: Setting map state to ready...');
    setIsMapReady(true);
    setIsMapLoading(false);
    setMapError(null); // Clear any previous errors
    console.log('🟢 GolfCourseMap.handleMapReady: Map state updated to ready=true, loading=false');
    
    // Priority order: current location > initial region > default region
    if (currentLocation && mapRef.current) {
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Golf-appropriate zoom level
        longitudeDelta: 0.005,
      };
      setMapRegion(region);
      setHasInitialLocation(true);
      // Immediately animate to user location
      mapRef.current.animateToRegion(region, 1000);
      console.log('GolfCourseMap: Map ready - positioned at user location:', region);
    } else if (initialRegion && mapRef.current) {
      setMapRegion(initialRegion);
      mapRef.current.animateToRegion(initialRegion, 1000);
      console.log('GolfCourseMap: Map ready - positioned at initial region:', initialRegion);
    } else {
      setMapRegion(defaultRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(defaultRegion, 1000);
      }
      console.log('GolfCourseMap: Map ready - positioned at default region (Faughan Valley):', defaultRegion);
    }
  }, []); // Empty deps - use current values at time of execution

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
    console.log('🟠 GolfCourseMap: renderUserLocationMarker called', {
      hasCurrentLocation: !!currentLocation,
      location: currentLocation ? {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        accuracy: currentLocation.accuracy
      } : null
    });
    
    if (!currentLocation) {
      console.warn('🔴 GolfCourseMap: No currentLocation available for user marker');
      return null;
    }

    const accuracyText = currentLocation.accuracy 
      ? `GPS: ${currentLocation.accuracy.toFixed(1)}m` 
      : 'GPS: Unknown';
    
    const speedText = ('speed' in currentLocation && currentLocation.speed) 
      ? ` • Speed: ${(currentLocation.speed * 3.6).toFixed(1)} km/h` 
      : '';

    // Determine GPS accuracy color and status
    const getAccuracyStatus = (accuracy?: number) => {
      if (!accuracy) return { color: '#999', status: 'unknown', icon: 'gps-not-fixed' };
      if (accuracy <= 5) return { color: '#4CAF50', status: 'excellent', icon: 'gps-fixed' };
      if (accuracy <= 10) return { color: '#8BC34A', status: 'good', icon: 'gps-fixed' };
      if (accuracy <= 20) return { color: '#FFC107', status: 'fair', icon: 'gps-not-fixed' };
      return { color: '#FF5722', status: 'poor', icon: 'gps-off' };
    };

    const accuracyStatus = getAccuracyStatus(currentLocation.accuracy);
    
    console.log('🟢 GolfCourseMap: Rendering user marker with coordinates:', {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracyColor: accuracyStatus.color,
      accuracyStatus: accuracyStatus.status
    });

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        title="Your Position"
        description={`${accuracyText}${speedText}`}
        flat={false}
        zIndex={1000}
      >
        <View style={styles.userLocationContainer}>
          {/* Animated outer pulse ring */}
          <Animated.View 
            style={[
              styles.userLocationOuterPulse,
              {
                transform: [{ scale: pulseAnimation }],
                backgroundColor: `${accuracyStatus.color}20`,
                borderColor: `${accuracyStatus.color}40`,
              }
            ]} 
          />
          
          {/* Inner pulse ring */}
          <View style={[
            styles.userLocationPulse,
            {
              backgroundColor: `${accuracyStatus.color}30`,
              borderColor: `${accuracyStatus.color}60`,
            }
          ]} />
          
          {/* Main location marker - made more visible */}
          <View style={[
            styles.userLocationMarker,
            { 
              backgroundColor: accuracyStatus.color,
              borderWidth: 4,
              borderColor: '#ffffff',
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
          {currentLocation.heading !== undefined && currentLocation.heading !== null && (
            <View style={[
              styles.directionIndicator,
              {
                transform: [{ rotate: `${currentLocation.heading}deg` }]
              }
            ]}>
              <Icon name="navigation" size={14} color={accuracyStatus.color} />
            </View>
          )}
        </View>
      </Marker>
    );
  };

  // Enhanced custom marker for target pin with better visuals
  const renderTargetMarker = () => {
    if (!targetPin) return null;

    const formattedDistance = DistanceCalculator.formatGolfDistance(targetPin.distance);
    const recommendedClub = getRecommendedClub(targetPin.distance.yards);

    return (
      <Marker
        coordinate={targetPin.coordinate}
        anchor={{ x: 0.5, y: 1.0 }}
        title="Shot Target"
        description={`${formattedDistance} • ${recommendedClub}`}
      >
        <View style={styles.targetMarkerContainer}>
          {/* Target pin with distance badge */}
          <View style={styles.targetMarker}>
            <Icon name="golf-course" size={24} color="#fff" />
          </View>
          {/* Distance badge */}
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{targetPin.distance.yards}y</Text>
          </View>
          {/* Crosshair effect */}
          <View style={styles.crosshair}>
            <View style={[styles.crosshairLine, styles.crosshairHorizontal]} />
            <View style={[styles.crosshairLine, styles.crosshairVertical]} />
          </View>
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
          {/* Shot marker with distance label matching reference image */}
          <View style={styles.shotMarker}>
            <Text style={styles.shotMarkerNumber}>{index + 1}</Text>
          </View>
          {/* Distance badge similar to reference "120" style */}
          <View style={styles.shotDistanceBadge}>
            <Text style={styles.shotDistanceText}>{shot.distance.yards}</Text>
          </View>
          {/* Club indicator */}
          {shot.club && (
            <View style={styles.shotClubBadge}>
              <Text style={styles.shotClubText}>{shot.club}</Text>
            </View>
          )}
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

  // Get map provider based on platform
  const getMapProvider = () => {
    return Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
  };

  // Handle map loading errors
  const handleMapError = useCallback((error: unknown) => {
    console.error('Map loading error:', error);
    setIsMapLoading(false);
    setIsMapReady(false);
    
    let errorMessage = 'Unable to load map. Please check your internet connection and try again.';
    
    // Provide more specific error messages
    const errorObj = error as any;
    if (errorObj?.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error: Please check your internet connection.';
    } else if (errorObj?.code === 'API_KEY_ERROR') {
      errorMessage = 'Map service configuration error. Please contact support.';
    } else if (errorObj?.message?.includes('location')) {
      errorMessage = 'Location services error. Please enable GPS and try again.';
    }
    
    setMapError(errorMessage);
  }, []);

  // Loading component for map initialization
  const renderMapLoading = () => (
    <View style={styles.loadingContainer}>
      <Icon name="golf-course" size={48} color="#4a7c59" />
      <Text style={styles.loadingTitle}>Loading Golf Course Map</Text>
      <Text style={styles.loadingMessage}>
        {currentLocation ? 'Centering on your location...' : 'Initializing course view...'}
      </Text>
    </View>
  );

  // Fallback component when map fails to loadclaude 
  const renderMapFallback = () => (
    <View style={styles.fallbackContainer}>
      <Icon name="map-off" size={48} color="#ccc" />
      <Text style={styles.fallbackTitle}>Map Unavailable</Text>
      <Text style={styles.fallbackMessage}>
        {mapError || 'The map could not be loaded. Golf features will work with location data only.'}
      </Text>
      {currentLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Current Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          {currentLocation.accuracy && (
            <Text style={styles.accuracyText}>
              GPS Accuracy: {currentLocation.accuracy.toFixed(1)}m
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Error boundary wrapper for map rendering
  const renderMapContent = () => {
    try {
      if (mapError) {
        return renderMapFallback();
      }
      
      if (isMapLoading) {
        return renderMapLoading();
      }

      return (
        <>
          <MapView
            ref={(ref) => {
              console.log('🟠 GolfCourseMap: MapView ref callback triggered', { ref, refExists: !!ref });
              mapRef.current = ref;
              setHasMapRef(!!ref); // Update ref state for useEffects
              console.log('🟠 GolfCourseMap: Updated hasMapRef state to:', !!ref);
            }}
            provider={getMapProvider()}
            style={styles.map}
            mapType={currentMapType as any}
            region={(() => {
              const regionToUse = mapRegion || defaultRegion;
              console.log('🟠 GolfCourseMap: Using region for MapView:', regionToUse);
              
              // Validate region data
              if (!regionToUse || 
                  typeof regionToUse.latitude !== 'number' || 
                  typeof regionToUse.longitude !== 'number' || 
                  Math.abs(regionToUse.latitude) > 90 || 
                  Math.abs(regionToUse.longitude) > 180) {
                console.warn('🟡 GolfCourseMap: Invalid region detected, using default:', regionToUse);
                return defaultRegion;
              }
              
              return regionToUse;
            })()}
            onPress={handleMapPress}
            onLongPress={handleLongPress}
            onDoublePress={handleDoubleTap}
            onMapReady={() => {
              console.log('🟠 GolfCourseMap: onMapReady callback triggered - calling handleMapReady');
              handleMapReady();
            }}
            onLayout={(event) => {
              console.log('🟠 GolfCourseMap: MapView onLayout triggered:', event.nativeEvent.layout);
            }}
            showsUserLocation={false} // We use custom marker
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsTraffic={false} // Disable traffic for golf courses
            showsBuildings={currentMapType === 'satellite' || currentMapType === 'hybrid'} // Show buildings on satellite view
            showsIndoors={false} // Disable indoor maps
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            pitchEnabled={false} // Disable 3D tilt for golf
            toolbarEnabled={false}
            moveOnMarkerPress={false}
            onRegionChangeComplete={(region) => {
              console.log('🟠 GolfCourseMap: onRegionChangeComplete triggered:', region);
              setMapRegion(region);
            }}
            // Golf-optimized settings
            minZoomLevel={12} // Prevent zooming out too far
            maxZoomLevel={20} // Allow detailed course view
            // Performance optimizations
            cacheEnabled={true}
            loadingEnabled={true}
            loadingIndicatorColor="#4a7c59"
            loadingBackgroundColor="#f5f5f5"
          >
            {renderUserLocationMarker()}
            {renderTargetMarker()}
            {renderShotMarkers()}
          </MapView>

          {/* Enhanced map controls with smooth transitions */}
          <View style={styles.mapControlsContainer}>
            {/* Map type indicator */}
            <View style={styles.mapTypeContainer}>
              <Icon 
                name={getMapTypeIcon(currentMapType)} 
                size={20} 
                color="#4a7c59" 
              />
              <Text style={styles.mapTypeText}>{getMapTypeLabel(currentMapType)}</Text>
            </View>
            
            {/* Distance display for target with smooth appearance */}
            {targetPin && (
              <View style={[styles.distanceDisplay, styles.fadeInAnimation]}>
                <Icon name="straighten" size={16} color="#4a7c59" />
                <Text style={styles.distanceDisplayText}>
                  {targetPin.distance.yards}y
                </Text>
                <Text style={styles.clubRecommendation}>
                  {getRecommendedClub(targetPin.distance.yards)}
                </Text>
              </View>
            )}
            
            {/* GPS status indicator */}
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
        </>
      );
    } catch (error) {
      console.error('Error rendering map:', error);
      return renderMapFallback();
    }
  };

  // Helper functions for map controls
  const getMapTypeIcon = (mapType: string) => {
    switch (mapType) {
      case 'satellite': return 'satellite';
      case 'hybrid': return 'layers';
      case 'terrain': return 'terrain';
      default: return 'map';
    }
  };

  const getMapTypeLabel = (mapType: string) => {
    switch (mapType) {
      case 'satellite': return 'Satellite';
      case 'hybrid': return 'Hybrid';
      case 'terrain': return 'Terrain';
      default: return 'Standard';
    }
  };

  return (
    <View style={styles.container}>
      {renderMapContent()}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance optimization
  return (
    prevProps.currentLocation?.latitude === nextProps.currentLocation?.latitude &&
    prevProps.currentLocation?.longitude === nextProps.currentLocation?.longitude &&
    prevProps.currentLocation?.accuracy === nextProps.currentLocation?.accuracy &&
    prevProps.mapType === nextProps.mapType &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.enableTargetPin === nextProps.enableTargetPin
  );
});

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
    width: 80,
    height: 80,
  },
  userLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3', // Bright blue for visibility
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    position: 'relative',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(33, 150, 243, 0.3)', // Blue with transparency
    borderWidth: 2,
    borderColor: 'rgba(33, 150, 243, 0.5)',
    zIndex: 2,
  },
  userLocationOuterPulse: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(33, 150, 243, 0.2)', // Blue with transparency
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
    top: -12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 2,
  },
  targetMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  distanceBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#2c5530',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  distanceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  crosshair: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairLine: {
    backgroundColor: 'rgba(255, 68, 68, 0.6)',
    position: 'absolute',
  },
  crosshairHorizontal: {
    width: 60,
    height: 2,
  },
  crosshairVertical: {
    width: 2,
    height: 60,
  },
  
  // Shot marker styles (matching reference design)
  shotMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3', // Blue color for shot markers
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
    fontSize: 14,
    fontWeight: '700',
  },
  shotDistanceBadge: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  shotDistanceText: {
    color: '#fff',
    fontSize: 14,
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
  mapControlsContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  distanceDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  distanceDisplayText: {
    color: '#2c5530',
    fontSize: 14,
    fontWeight: '600',
  },
  clubRecommendation: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  mapTypeText: {
    color: '#4a7c59',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  fadeInAnimation: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  gpsStatusContainer: {
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
  mapTypeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  locationInfo: {
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 11,
    color: '#666',
  },
});

export default GolfCourseMap;