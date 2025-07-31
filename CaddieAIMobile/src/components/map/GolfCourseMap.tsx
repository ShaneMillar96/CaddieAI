import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
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
}

export interface TargetPin {
  coordinate: Coordinate;
  distance: DistanceResult;
  timestamp: number;
}

const GolfCourseMap: React.FC<GolfCourseMapProps> = ({
  currentLocation,
  onTargetSelected,
  onLocationUpdate,
  courseId,
  courseName,
  initialRegion,
  showSatellite = true,
  enableTargetPin = true,
  mapType = 'satellite',
}) => {
  // State management
  const [targetPin, setTargetPin] = useState<TargetPin | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<string>(() => {
    switch (mapType) {
      case 'satellite': return 'satellite';
      case 'hybrid': return 'hybrid';
      case 'terrain': return 'terrain';
      default: return 'standard';
    }
  });

  // Refs
  const mapRef = useRef<MapView>(null);
  const lastLocationUpdateRef = useRef<number>(0);

  // Default region (should be updated based on course location)
  const defaultRegion: Region = initialRegion || {
    latitude: 54.9783, // Faughan Valley Golf Centre coordinates
    longitude: -7.2054,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Update map region when current location changes
  useEffect(() => {
    if (currentLocation && isMapReady) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Closer zoom for golf
        longitudeDelta: 0.005,
      };

      // Only update if location has changed significantly
      const now = Date.now();
      const timeSinceLastUpdate = now - lastLocationUpdateRef.current;
      
      if (timeSinceLastUpdate > 2000) { // Update max every 2 seconds
        setMapRegion(newRegion);
        lastLocationUpdateRef.current = now;
        
        // Notify parent of location update
        onLocationUpdate({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
    }
  }, [currentLocation, isMapReady, onLocationUpdate]);

  // Handle map press for target pin placement
  const handleMapPress = useCallback((event: MapPressEvent) => {
    if (!enableTargetPin || !currentLocation) return;

    const coordinate = event.nativeEvent.coordinate;
    
    // Calculate distance to target
    const distance = DistanceCalculator.calculateDistance(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      coordinate
    );

    // Validate if target is within reasonable golf range
    if (distance.yards > 500) {
      Alert.alert(
        'Target Too Far',
        'Please select a target within 500 yards for accurate golf distance measurement.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Create new target pin
    const newTargetPin: TargetPin = {
      coordinate,
      distance,
      timestamp: Date.now(),
    };

    setTargetPin(newTargetPin);
    onTargetSelected(coordinate, distance);
  }, [currentLocation, enableTargetPin, onTargetSelected]);

  // Handle long press for recentering map
  const handleLongPress = useCallback(() => {
    if (currentLocation && mapRef.current) {
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current.animateToRegion(region, 1000);
    }
  }, [currentLocation]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    
    // If we have initial region, use it; otherwise use current location
    if (initialRegion) {
      setMapRegion(initialRegion);
    } else if (currentLocation) {
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
    } else {
      setMapRegion(defaultRegion);
    }
  }, [initialRegion, currentLocation, defaultRegion]);

  // Custom marker for user location
  const renderUserLocationMarker = () => {
    if (!currentLocation) return null;

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        title="Your Location"
        description={`Accuracy: ${currentLocation.accuracy?.toFixed(1)}m`}
      >
        <View style={styles.userLocationMarker}>
          <View style={styles.userLocationInner} />
          <View style={styles.userLocationPulse} />
        </View>
      </Marker>
    );
  };

  // Custom marker for target pin
  const renderTargetMarker = () => {
    if (!targetPin) return null;

    return (
      <Marker
        coordinate={targetPin.coordinate}
        anchor={{ x: 0.5, y: 1.0 }}
        title="Target"
        description={`${DistanceCalculator.formatGolfDistance(targetPin.distance)}`}
      >
        <View style={styles.targetMarker}>
          <Icon name="place" size={30} color="#ff4444" />
        </View>
      </Marker>
    );
  };

  // Get map provider based on platform
  const getMapProvider = () => {
    return Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={getMapProvider()}
        style={styles.map}
        mapType={currentMapType as any}
        region={mapRegion || defaultRegion}
        onPress={handleMapPress}
        onLongPress={handleLongPress}
        onMapReady={handleMapReady}
        showsUserLocation={false} // We use custom marker
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false} // Disable 3D tilt for golf
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        onRegionChangeComplete={setMapRegion}
        // Golf-optimized settings
        minZoomLevel={12} // Prevent zooming out too far
        maxZoomLevel={20} // Allow detailed course view
      >
        {renderUserLocationMarker()}
        {renderTargetMarker()}
      </MapView>

      {/* Map type toggle (could be moved to overlay) */}
      <View style={styles.mapTypeContainer}>
        <Icon 
          name={currentMapType === 'satellite' ? 'satellite' : 'map'} 
          size={24} 
          color="#4a7c59" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4a7c59',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(74, 124, 89, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(74, 124, 89, 0.5)',
  },
  targetMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default GolfCourseMap;