import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Mapbox, { 
  MapView, 
  Camera, 
  PointAnnotation, 
  CircleLayer,
  LineLayer,
  ShapeSource,
} from '@rnmapbox/maps';

import { SimpleLocationData } from '../../services/SimpleLocationService';
import { validateMapboxToken } from '../../utils/mapboxConfig';
import { pinDistanceCalculator } from '../../utils/PinDistanceCalculator';



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
  // Shot placement props
  shotPlacementMode?: boolean;
  shotPlacementLocation?: { latitude: number; longitude: number } | null;
  pinLocation?: { latitude: number; longitude: number } | null;
  onShotPlacementPress?: (coordinate: { latitude: number; longitude: number }) => void;
  showDistanceOverlay?: boolean;
  distanceToPin?: number;
  distanceFromCurrent?: number;
}

export interface GolfCourseFeature {
  id: string;
  type: 'tee' | 'pin' | 'hazard' | 'fairway' | 'green';
  coordinates: [number, number];
  title?: string;
  description?: string;
}

/**
 * MapboxMapView Component - Real Implementation
 * 
 * Golf-optimized Mapbox map with satellite view, GPS tracking,
 * and distance measurement capabilities.
 */
const MapboxMapView: React.FC<MapboxMapViewProps> = ({
  currentLocation,
  onMapPress,
  onLocationUpdate: _onLocationUpdate,
  initialRegion: _initialRegion,
  // showUserLocation = true, // Unused prop
  accessToken,
  // Shot placement props
  shotPlacementMode = false,
  shotPlacementLocation = null,
  pinLocation = null,
  onShotPlacementPress,
  showDistanceOverlay = false,
  // distanceToPin = 0, // Unused prop
  distanceFromCurrent = 0,
}) => {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleUrl, setStyleUrl] = useState<string>(
    validateMapboxToken(accessToken)
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'https://demotiles.maplibre.org/style.json'
  );
  
  // Default center on Faughan Valley Golf Centre
  const defaultCenter = currentLocation ? [currentLocation.longitude, currentLocation.latitude] : [-7.247879, 55.020906];
  const defaultZoom = 15;

  // Initialize Mapbox
  useEffect(() => {
    let isMounted = true;
    
    if (validateMapboxToken(accessToken)) {
      console.log('🗺️ MapboxMapView: Setting access token');
      // Note: setWellKnownTileServer is deprecated in newer Mapbox SDK versions
      Mapbox.setAccessToken(accessToken);
      setMapError(null);
      // Preflight style access to avoid 403 logs; fallback if unauthorized
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          const res = await fetch(
            `https://api.mapbox.com/styles/v1/mapbox/satellite-v9?access_token=${accessToken}`,
            { signal: controller.signal }
          );
          
          clearTimeout(timeoutId);
          
          if (isMounted) {
            if (res.ok) {
              setStyleUrl('mapbox://styles/mapbox/satellite-v9');
            } else {
              console.warn('⚠️ MapboxMapView: Style access check failed, using demo tiles');
              setStyleUrl('https://demotiles.maplibre.org/style.json');
            }
          }
        } catch (error: any) {
          if (isMounted && error.name !== 'AbortError') {
            setStyleUrl('https://demotiles.maplibre.org/style.json');
          }
        }
      })();
    } else {
      // Token not ready yet; avoid hard error to allow later re-init
      console.warn('⚠️ MapboxMapView: Invalid or missing access token');
      setStyleUrl('https://demotiles.maplibre.org/style.json');
    }
    
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  // Handle map ready
  const handleMapReady = useCallback(() => {
    console.log('✅ MapboxMapView: Map is ready');
    setIsMapReady(true);
    setMapError(null);
  }, []);

  // Handle map error
  const handleMapError = useCallback(() => {
    console.error('❌ MapboxMapView: Map error occurred');
    // Fallback to open demo style if Mapbox style fails (e.g., 403)
    setStyleUrl('https://demotiles.maplibre.org/style.json');
    setMapError('Map failed to load, falling back to demo tiles');
  }, []);

  // Handle map press for distance measurement and shot placement
  const handleMapPress = useCallback((feature: any) => {
    if (!feature?.geometry?.coordinates) return;
    
    const [lng, lat] = feature.geometry.coordinates;
    const coordinate = { latitude: lat, longitude: lng };
    
    console.log('🎯 MapboxMapView: Map pressed at:', coordinate);
    
    // Handle shot placement mode separately
    if (shotPlacementMode && onShotPlacementPress) {
      console.log('🏌️ MapboxMapView: Shot placement mode - handling shot placement');
      onShotPlacementPress(coordinate);
      return;
    }
    
    // Handle regular map press
    if (onMapPress) {
      onMapPress(coordinate);
    }
  }, [onMapPress, shotPlacementMode, onShotPlacementPress]);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (!currentLocation || !cameraRef.current) return;
    
    console.log('🎯 MapboxMapView: Centering on user location');
    
    cameraRef.current.setCamera({
      centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
      zoomLevel: 17,
      animationDuration: 1000,
    });
  }, [currentLocation]);

  // Auto-center when location changes (initial load only)
  useEffect(() => {
    if (currentLocation && isMapReady && cameraRef.current) {
      centerOnUser();
    }
  }, [currentLocation, isMapReady, centerOnUser]);

  // Get GPS accuracy status
  const getAccuracyStatus = (accuracy?: number) => {
    if (!accuracy) return { color: '#2196F3', quality: 'GPS Active' };
    if (accuracy <= 5) return { color: '#00C851', quality: 'Excellent' };
    if (accuracy <= 15) return { color: '#4CAF50', quality: 'Good' };
    if (accuracy <= 25) return { color: '#FFBB33', quality: 'Fair' };
    return { color: '#FF4444', quality: 'Poor' };
  };

  // Show error state
  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#ff4444" />
          <Text style={styles.errorTitle}>Map Error</Text>
          <Text style={styles.errorText}>{mapError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setMapError(null)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        styleURL={styleUrl}
        onDidFinishLoadingMap={handleMapReady}
        onDidFailLoadingMap={handleMapError}
        onPress={handleMapPress}
        pitchEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        {/* Camera configuration */}
        <Camera
          ref={cameraRef}
          centerCoordinate={defaultCenter}
          zoomLevel={defaultZoom}
          followUserLocation={false}
        />

        {/* User location display (disabled to avoid native location module crash) */}

        {/* Custom user location marker with accuracy circle */}
        {currentLocation && (
          <>
            <ShapeSource
              id="userLocationAccuracy"
              shape={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [currentLocation.longitude, currentLocation.latitude],
                },
              }}
            >
              <CircleLayer
                id="accuracyCircle"
                style={{
                  circleRadius: Math.max(currentLocation.accuracy || 0, 5),
                  circleColor: 'rgba(70, 130, 180, 0.2)',
                  circleStrokeColor: '#4682B4',
                  circleStrokeWidth: 1,
                }}
              />
            </ShapeSource>

            <PointAnnotation
              id="userLocation"
              coordinate={[currentLocation.longitude, currentLocation.latitude]}
            >
              <View style={styles.userLocationMarker}>
                <View style={[styles.userLocationDot, { backgroundColor: getAccuracyStatus(currentLocation.accuracy).color }]} />
              </View>
            </PointAnnotation>
          </>
        )}

        {/* Pin location marker (green flag) */}
        {pinLocation && (
          <PointAnnotation
            id="pinLocation"
            coordinate={[pinLocation.longitude, pinLocation.latitude]}
          >
            <View style={styles.pinIconContainer}>
              <FontAwesome 
                name="flag" 
                size={32} 
                color="#FF1744" 
                style={styles.pinFlagIcon}
              />
            </View>
          </PointAnnotation>
        )}

        {/* Distance line between current location and shot placement */}
        {shotPlacementLocation && currentLocation && shotPlacementMode && (
          <ShapeSource
            id="shotPlacementLine"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [currentLocation.longitude, currentLocation.latitude],
                  [shotPlacementLocation.longitude, shotPlacementLocation.latitude],
                ],
              },
            }}
          >
            <LineLayer
              id="shotPlacementLineLayer"
              style={{
                lineColor: '#ffffff',
                lineWidth: 2,
                lineOpacity: 0.9,
              }}
            />
          </ShapeSource>
        )}

        {/* Line from shot placement to pin location */}
        {shotPlacementLocation && pinLocation && (
          <ShapeSource
            id="shotToPinLine"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [shotPlacementLocation.longitude, shotPlacementLocation.latitude],
                  [pinLocation.longitude, pinLocation.latitude],
                ],
              },
            }}
          >
            <LineLayer
              id="shotToPinLineLayer"
              style={{
                lineColor: '#4CAF50', // Green line to pin
                lineWidth: 3,
                lineDasharray: [2, 2], // Dashed line to distinguish from user-shot line
                lineOpacity: 0.8,
              }}
            />
          </ShapeSource>
        )}

        {/* Shot-to-pin distance label */}
        {shotPlacementLocation && pinLocation && (
          <PointAnnotation
            id="shotToPinDistance"
            coordinate={[
              (shotPlacementLocation.longitude + pinLocation.longitude) / 2,
              (shotPlacementLocation.latitude + pinLocation.latitude) / 2
            ]}
          >
            <View style={styles.distanceLabelAlongLine}>
              <Text style={styles.distanceLabelText}>
                {(() => {
                  const shotToPinDistance = pinDistanceCalculator.calculateDistance(
                    { latitude: shotPlacementLocation.latitude, longitude: shotPlacementLocation.longitude },
                    { latitude: pinLocation.latitude, longitude: pinLocation.longitude }
                  );
                  return `${shotToPinDistance.distanceYards}y`;
                })()}
              </Text>
            </View>
          </PointAnnotation>
        )}

        {/* Shot placement target marker - cleaner circle design */}
        {shotPlacementLocation && (
          <>
            {/* Target circle */}
            <ShapeSource
              id="shotPlacementTargetCircle"
              shape={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [shotPlacementLocation.longitude, shotPlacementLocation.latitude],
                },
              }}
            >
              <CircleLayer
                id="targetCircleOuter"
                style={{
                  circleRadius: 12,
                  circleColor: '#ffffff',
                  circleOpacity: 0.9,
                  circleStrokeColor: '#000000',
                  circleStrokeWidth: 1,
                  circleStrokeOpacity: 0.3,
                }}
              />
              <CircleLayer
                id="targetCircleInner"
                style={{
                  circleRadius: 4,
                  circleColor: '#FF6B35',
                  circleOpacity: 1,
                }}
              />
            </ShapeSource>

            {/* Distance label along the line */}
            {showDistanceOverlay && distanceFromCurrent > 0 && (() => {
              // Calculate the angle of the line
              const deltaX = shotPlacementLocation.longitude - currentLocation.longitude;
              const deltaY = shotPlacementLocation.latitude - currentLocation.latitude;
              const angleRad = Math.atan2(deltaY, deltaX);
              const angleDeg = angleRad * (180 / Math.PI);
              
              // Calculate offset to position label above the line
              const offsetDistance = 0.00015; // Adjust this value to control distance from line
              const perpAngle = angleRad + Math.PI / 2; // Perpendicular to the line
              const offsetLng = Math.sin(perpAngle) * offsetDistance;
              const offsetLat = Math.cos(perpAngle) * offsetDistance;
              
              return (
                <PointAnnotation
                  id="shotPlacementDistance"
                  coordinate={[
                    (shotPlacementLocation.longitude + currentLocation.longitude) / 2 + offsetLng,
                    (shotPlacementLocation.latitude + currentLocation.latitude) / 2 + offsetLat,
                  ]}
                >
                  <View style={[
                    styles.distanceLabelAlongLine,
                    { transform: [{ rotate: `${angleDeg}deg` }] }
                  ]}>
                    <Text style={styles.distanceLabelText}>
                      {distanceFromCurrent}y
                    </Text>
                  </View>
                </PointAnnotation>
              );
            })()}
          </>
        )}
      </MapView>

      {/* GPS Status Indicator */}
      {currentLocation && (
        <View style={styles.gpsStatus}>
          <Icon 
            name={currentLocation.accuracy && currentLocation.accuracy <= 10 ? 'gps-fixed' : 'gps-not-fixed'} 
            size={14} 
            color={getAccuracyStatus(currentLocation.accuracy).color} 
          />
          <Text style={styles.gpsStatusText}>
            {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'GPS'}
          </Text>
        </View>
      )}

      {/* Loading indicator */}
      {!isMapReady && !mapError && (
        <View style={styles.loadingContainer}>
          <Icon name="map" size={48} color="#ccc" />
          <Text style={styles.loadingText}>Loading Map...</Text>
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
    flex: 1,
  },
  
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a7c59',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading state styles
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },

  // User location marker styles
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4682B4',
  },

  // GPS status indicator styles
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

  // Pin icon container using FontAwesome flag
  pinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // White background for contrast
    borderRadius: 20, // Circular background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FF1744', // Red border to match flag
  },
  pinFlagIcon: {
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Shot placement marker styles (crosshair target)
  shotPlacementMarker: {
    alignItems: 'center',
  },
  shotPlacementTarget: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotPlacementCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  
  // Distance label for shot placement
  distanceLabel: {
    position: 'absolute',
    top: -25,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  distanceLabelAlongLine: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceLabelText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MapboxMapView;