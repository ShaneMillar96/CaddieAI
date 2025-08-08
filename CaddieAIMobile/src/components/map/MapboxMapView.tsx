import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { SimpleLocationData } from '../../services/SimpleLocationService';

const { width, height } = Dimensions.get('window');

export interface MapboxMapViewProps {
  currentLocation: SimpleLocationData | null;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  onLocationUpdate?: (coordinate: { latitude: number; longitude: number }) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showUserLocation?: boolean;
  accessToken: string;
}

export interface GolfCourseFeature {
  id: string;
  type: 'tee' | 'pin' | 'hazard' | 'fairway' | 'green';
  coordinates: [number, number];
  title?: string;
  description?: string;
}

/**
 * MapboxMapView Component - Placeholder
 * 
 * This is a temporary placeholder for the Mapbox map component.
 * The original Mapbox functionality has been temporarily disabled
 * while we resolve compatibility issues with React Native 0.80.2.
 * 
 * TODO: Re-implement with compatible Mapbox version or alternative
 */
const MapboxMapView: React.FC<MapboxMapViewProps> = ({
  currentLocation,
  onMapPress,
  onLocationUpdate,
  initialRegion,
  showUserLocation = true,
  accessToken,
}) => {
  const defaultRegion = initialRegion || {
    latitude: 54.9783,
    longitude: -7.2054,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Get GPS accuracy status
  const getAccuracyStatus = (accuracy?: number) => {
    if (!accuracy) return { color: '#2196F3', quality: 'GPS Active' };
    if (accuracy <= 5) return { color: '#00C851', quality: 'Excellent' };
    if (accuracy <= 15) return { color: '#4CAF50', quality: 'Good' };
    if (accuracy <= 25) return { color: '#FFBB33', quality: 'Fair' };
    return { color: '#FF4444', quality: 'Poor' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Icon name="map" size={64} color="#ccc" />
        <Text style={styles.placeholderTitle}>Map View</Text>
        <Text style={styles.placeholderSubtitle}>
          Mapbox integration temporarily disabled
        </Text>
        <Text style={styles.placeholderDetails}>
          React Native 0.80.2 compatibility in progress
        </Text>
        
        {/* Location Info */}
        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Current Location:</Text>
            <Text style={styles.locationText}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            {currentLocation.accuracy && (
              <Text style={[styles.locationText, { color: getAccuracyStatus(currentLocation.accuracy).color }]}>
                Accuracy: {currentLocation.accuracy.toFixed(1)}m ({getAccuracyStatus(currentLocation.accuracy).quality})
              </Text>
            )}
          </View>
        )}
      </View>

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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderDetails: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 250,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'monospace',
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
});

export default MapboxMapView;