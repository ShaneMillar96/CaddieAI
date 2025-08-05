import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  MapPressEvent,
  Region,
} from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { SimpleLocationData } from '../../services/SimpleLocationService';

const { width, height } = Dimensions.get('window');

export interface SimpleMapViewProps {
  currentLocation: SimpleLocationData | null;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onLocationUpdate?: (coordinate: { latitude: number; longitude: number }) => void;
  initialRegion?: Region;
  showUserLocation?: boolean;
}

/**
 * SimpleMapView Component
 * 
 * Clean, minimal map implementation focused on core functionality:
 * - Satellite map display
 * - Current location marker
 * - Basic map interactions
 * - Simple error handling
 */
const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  currentLocation,
  onMapPress,
  onLocationUpdate,
  initialRegion,
  showUserLocation = true,
}) => {
  // Simple state management
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState<string>(`map-${Date.now()}`);
  
  // Refs
  const mapRef = useRef<MapView>(null);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  // Default region (Faughan Valley Golf Centre)
  const defaultRegion: Region = initialRegion || {
    latitude: 54.9783,
    longitude: -7.2054,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Map provider selection with fallback
  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  // Start pulse animation for user location
  useEffect(() => {
    const startPulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => startPulse());
    };

    if (currentLocation && showUserLocation) {
      startPulse();
    }
  }, [currentLocation, showUserLocation, pulseAnimation]);

  // Update map region when location changes
  useEffect(() => {
    if (currentLocation && isMapReady && mapRef.current) {
      const newRegion: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.005, // Tight zoom for golf
        longitudeDelta: 0.005,
      };

      setMapRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 1000);
      
      // Notify parent of location update
      onLocationUpdate?.({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, isMapReady, onLocationUpdate]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    console.log('Map ready');
    setIsMapReady(true);
    setMapError(null);
    
    // Set initial region
    const regionToUse = currentLocation ? {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    } : defaultRegion;
    
    setMapRegion(regionToUse);
  }, [currentLocation, defaultRegion]);

  // Handle map press
  const handleMapPress = useCallback((event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    onMapPress?.(coordinate);
  }, [onMapPress]);

  // Handle map errors with specific Google Play Services handling
  const handleMapError = useCallback((error: any) => {
    console.error('Map error:', error);
    
    let errorMessage = 'Map failed to load';
    let suggestion = '';
    
    if (Platform.OS === 'android') {
      const errorString = error?.message || error?.toString() || '';
      
      // Check for specific Google Play Services errors
      if (errorString.includes('NETWORK_ERROR') || errorString.includes('network')) {
        errorMessage = 'Map network error';
        suggestion = 'Please check your internet connection and try again.';
      } else if (errorString.includes('API_KEY') || errorString.includes('authentication')) {
        errorMessage = 'Map authentication error';
        suggestion = 'Google Maps configuration issue. Please contact support.';
      } else if (errorString.includes('SERVICE_') || errorString.includes('GooglePlayServices')) {
        errorMessage = 'Google Play Services error';
        suggestion = 'Please update Google Play Services from the Play Store and restart the app.';
      } else if (errorString.includes('LinkedList') || errorString.includes('NullPointer') || errorString.includes('isEmpty')) {
        errorMessage = 'Map initialization error';
        suggestion = 'Internal map error detected. Retrying...';
        
        // Auto-retry for LinkedList/NPE errors after a short delay
        setTimeout(() => {
          console.log('Auto-retrying map initialization after NPE error');
          setMapError(null);
          setIsMapReady(false);
          setMapKey(`map-retry-${Date.now()}`);
        }, 2000);
        return;
      } else {
        errorMessage = 'Google Maps initialization failed';
        suggestion = 'Try restarting the app or updating Google Play Services.';
      }
    } else {
      errorMessage = 'Map initialization failed';
      suggestion = 'Please check your internet connection and try again.';
    }
    
    const fullErrorMessage = `${errorMessage}\n\n${suggestion}`;
    setMapError(fullErrorMessage);
    
    // Don't crash the app - GPS and distance measurement still work
    console.log('🟡 Map failed to load, but GPS functionality remains available');
  }, []);

  // Get GPS accuracy status
  const getAccuracyStatus = (accuracy?: number) => {
    if (!accuracy) return { color: '#2196F3', quality: 'GPS Active' };
    if (accuracy <= 5) return { color: '#00C851', quality: 'Excellent' };
    if (accuracy <= 15) return { color: '#4CAF50', quality: 'Good' };
    if (accuracy <= 25) return { color: '#FFBB33', quality: 'Fair' };
    return { color: '#FF4444', quality: 'Poor' };
  };

  // Render user location marker
  const renderUserLocationMarker = () => {
    if (!currentLocation || !showUserLocation) return null;

    const accuracyStatus = getAccuracyStatus(currentLocation.accuracy);

    return (
      <Marker
        coordinate={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
        title="Your Position"
        description={`GPS: ${currentLocation.accuracy?.toFixed(1)}m • ${accuracyStatus.quality}`}
        zIndex={1000}
      >
        <View style={styles.userLocationContainer}>
          {/* Animated pulse ring */}
          <Animated.View 
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnimation }],
                backgroundColor: `${accuracyStatus.color}20`,
                borderColor: `${accuracyStatus.color}50`,
              }
            ]} 
          />
          
          {/* Main location marker */}
          <View style={[
            styles.userLocationMarker,
            { 
              backgroundColor: accuracyStatus.color,
              shadowColor: accuracyStatus.color,
            }
          ]}>
            <Icon name="my-location" size={16} color="#fff" />
          </View>
          
          {/* Accuracy indicator */}
          <View style={[
            styles.accuracyIndicator,
            { backgroundColor: accuracyStatus.color }
          ]}>
            <Icon name="gps-fixed" size={10} color="#fff" />
          </View>
        </View>
      </Marker>
    );
  };

  // Render error state with actionable solutions
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="warning" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Map Service Issue</Text>
        <Text style={styles.errorMessage}>{mapError}</Text>
        
        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              console.log('Manual map retry requested');
              setMapError(null);
              setIsMapReady(false);
              setMapKey(`map-manual-retry-${Date.now()}`);
            }}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Map</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.gpsStillWorking}>
          <Icon name="location-on" size={20} color="#28a745" />
          <Text style={styles.gpsWorkingText}>
            GPS location tracking is still active and working normally.
            Distance measurements and voice AI are fully functional.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        key={mapKey}
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={defaultRegion}
        region={mapRegion || defaultRegion}
        onMapReady={handleMapReady}
        onPress={handleMapPress}
        // onError={handleMapError} // Temporarily disabled due to type issues
        mapType="satellite"
        showsUserLocation={false} // We use custom marker
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor="#4a7c59"
        loadingBackgroundColor="#f5f5f5"
        // Add additional props to help prevent NPE issues
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        cacheEnabled={true}
      >
        {isMapReady && renderUserLocationMarker()}
      </MapView>

      {/* GPS Status Indicator */}
      {currentLocation && (
        <View style={styles.gpsStatus}>
          <Icon 
            name={currentLocation.accuracy && currentLocation.accuracy <= 10 ? 'gps-fixed' : 'gps-not-fixed'} 
            size={14} 
            color={currentLocation.accuracy && currentLocation.accuracy <= 10 ? '#4CAF50' : '#ff9800'} 
          />
          <Text style={styles.gpsStatusText}>
            {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'GPS'}
          </Text>
        </View>
      )}
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
  userLocationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  userLocationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accuracyIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  gpsStatus: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  gpsStatusText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 320,
  },
  errorActions: {
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a7c59',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  gpsStillWorking: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    maxWidth: 320,
  },
  gpsWorkingText: {
    flex: 1,
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default SimpleMapView;