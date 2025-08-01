import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DistanceResult } from '../../utils/DistanceCalculator';
import { LocationData } from '../../services/LocationService';

const { width, height } = Dimensions.get('window');

// Enhanced interfaces
export interface ShotMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  distance?: DistanceResult;
  club?: string;
  note?: string;
}

export interface MapOverlayProps {
  courseName?: string;
  currentHole?: number;
  currentLocation: LocationData | {
    latitude: number;
    longitude: number;
    accuracy?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;
  targetDistance: DistanceResult | null;
  targetPin?: {
    latitude: number;
    longitude: number;
    distanceYards: number;
    bearing: number;
    timestamp: number;
  } | null;
  shotMarkers?: ShotMarker[];
  isLocationTracking: boolean;
  isVoiceInterfaceVisible: boolean;
  isPlacingShotMode?: boolean;
  onVoiceToggle: () => void;
  onRoundControlsPress: () => void;
  onClearTarget: () => void;
  onToggleShotMode?: () => void;
  onCenterOnUser?: () => void;
  onRemoveShotMarker?: (markerId: string) => void;
  roundStatus?: string;
  gpsAccuracy?: number;
}

// Enhanced GPS Status Component
const GPSStatusIndicator: React.FC<{
  currentLocation: any;
  gpsAccuracy?: number;
}> = React.memo(({ currentLocation, gpsAccuracy }) => {
  const gpsStatus = useMemo(() => {
    if (!currentLocation) {
      return { icon: 'location-off', color: '#dc3545', text: 'No GPS' };
    }
    
    const accuracy = gpsAccuracy || currentLocation.accuracy;
    
    if (accuracy === undefined || accuracy === null) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'Searching...' };
    }
    
    if (accuracy <= 8) {
      return { icon: 'gps-fixed', color: '#28a745', text: 'Excellent' };
    } else if (accuracy <= 15) {
      return { icon: 'gps-fixed', color: '#28a745', text: 'Good' };
    } else if (accuracy <= 25) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'Fair' };
    } else if (accuracy <= 50) {
      return { icon: 'gps-off', color: '#ff6b35', text: 'Poor' };
    } else {
      return { icon: 'gps-off', color: '#dc3545', text: 'Very Poor' };
    }
  }, [currentLocation, gpsAccuracy]);

  return (
    <View style={styles.gpsStatus}>
      <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
      <Text style={[styles.gpsText, { color: gpsStatus.color }]}>
        {gpsStatus.text}
      </Text>
      {gpsAccuracy && (
        <Text style={styles.accuracyText}>
          ±{Math.round(gpsAccuracy)}m
        </Text>
      )}
    </View>
  );
});

// Enhanced Distance Badge Component
const DistanceBadge: React.FC<{
  distance: DistanceResult;
  isVisible: boolean;
}> = React.memo(({ distance, isVisible }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnimation]);

  const formatDistance = useCallback((dist: DistanceResult): string => {
    if (dist.yards < 1) {
      return `${Math.round(dist.feet)}'`;
    } else if (dist.yards < 100) {
      return `${Math.round(dist.yards)}`;
    } else {
      return `${Math.round(dist.yards)}`;
    }
  }, []);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.distanceBadge,
        { opacity: fadeAnimation }
      ]}
    >
      <Text style={styles.distanceNumber}>{formatDistance(distance)}</Text>
      <Text style={styles.distanceUnit}>yds</Text>
    </Animated.View>
  );
});

// Shot History Component
const ShotHistoryPanel: React.FC<{
  shotMarkers: ShotMarker[];
  onRemoveShot: (id: string) => void;
  isVisible: boolean;
}> = React.memo(({ shotMarkers, onRemoveShot, isVisible }) => {
  if (!isVisible || shotMarkers.length === 0) return null;

  return (
    <View style={styles.shotHistoryPanel}>
      <Text style={styles.shotHistoryTitle}>Shot History</Text>
      <ScrollView style={styles.shotHistoryList} showsVerticalScrollIndicator={false}>
        {shotMarkers.map((shot, index) => (
          <View key={shot.id} style={styles.shotHistoryItem}>
            <View style={styles.shotInfo}>
              <Text style={styles.shotNumber}>Shot {index + 1}</Text>
              {shot.distance && (
                <Text style={styles.shotDistance}>
                  {Math.round(shot.distance.yards)} yds
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeShotButton}
              onPress={() => onRemoveShot(shot.id)}
            >
              <Icon name="close" size={16} color="#dc3545" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

// Main MapOverlay Component
const MapOverlay: React.FC<MapOverlayProps> = ({
  courseName,
  currentHole = 1,
  currentLocation,
  targetDistance,
  targetPin,
  shotMarkers = [],
  isLocationTracking,
  isVoiceInterfaceVisible,
  isPlacingShotMode = false,
  onVoiceToggle,
  onRoundControlsPress,
  onClearTarget,
  onToggleShotMode,
  onCenterOnUser,
  onRemoveShotMarker,
  roundStatus,
  gpsAccuracy,
}) => {
  const [showShotHistory, setShowShotHistory] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  
  // Enhanced control handlers
  const handleShotModeToggle = useCallback(() => {
    onToggleShotMode?.();
  }, [onToggleShotMode]);

  const handleCenterOnUser = useCallback(() => {
    onCenterOnUser?.();
  }, [onCenterOnUser]);

  const handleRemoveShot = useCallback((shotId: string) => {
    onRemoveShotMarker?.(shotId);
  }, [onRemoveShotMarker]);

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      {/* Top Information Bar */}
      <View style={styles.topBar}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={1}>
            {courseName || 'Golf Course'}
          </Text>
          <Text style={styles.holeInfo}>Hole {currentHole}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.locationInfoButton}
          onPress={() => setShowLocationInfo(!showLocationInfo)}
        >
          <GPSStatusIndicator 
            currentLocation={currentLocation} 
            gpsAccuracy={gpsAccuracy} 
          />
        </TouchableOpacity>
      </View>

      {/* Location Details Panel */}
      {showLocationInfo && currentLocation && (
        <View style={styles.locationDetailsPanel}>
          <Text style={styles.locationDetailsTitle}>Location Details</Text>
          <Text style={styles.locationDetail}>
            Lat: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationDetail}>
            Lng: {currentLocation.longitude.toFixed(6)}
          </Text>
          {gpsAccuracy && (
            <Text style={styles.locationDetail}>
              Accuracy: ±{Math.round(gpsAccuracy)}m
            </Text>
          )}
        </View>
      )}

      {/* Distance Badge - Center of screen when target selected */}
      {targetDistance && (
        <View style={styles.distanceBadgeContainer}>
          <DistanceBadge distance={targetDistance} isVisible={true} />
          <TouchableOpacity
            style={styles.clearTargetButton}
            onPress={onClearTarget}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.clearTargetText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Shot Placement Mode Indicator */}
      {isPlacingShotMode && (
        <View style={styles.shotModeIndicator}>
          <Icon name="my-location" size={20} color="#fff" />
          <Text style={styles.shotModeText}>Tap map to place shot</Text>
        </View>
      )}

      {/* Right Side Controls */}
      <View style={styles.rightControls}>
        {/* Center on User Button */}
        {currentLocation && (
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={handleCenterOnUser}
            activeOpacity={0.8}
          >
            <Icon name="my-location" size={24} color="#4a7c59" />
          </TouchableOpacity>
        )}

        {/* Shot Mode Toggle */}
        <TouchableOpacity
          style={[
            styles.mapControlButton,
            isPlacingShotMode && styles.mapControlButtonActive
          ]}
          onPress={handleShotModeToggle}
          activeOpacity={0.8}
        >
          <Icon 
            name="place" 
            size={24} 
            color={isPlacingShotMode ? "#fff" : "#4a7c59"} 
          />
        </TouchableOpacity>

        {/* Shot History Toggle */}
        {shotMarkers.length > 0 && (
          <TouchableOpacity
            style={[
              styles.mapControlButton,
              showShotHistory && styles.mapControlButtonActive
            ]}
            onPress={() => setShowShotHistory(!showShotHistory)}
            activeOpacity={0.8}
          >
            <Icon 
              name="history" 
              size={24} 
              color={showShotHistory ? "#fff" : "#4a7c59"} 
            />
            <View style={styles.shotCountBadge}>
              <Text style={styles.shotCountText}>{shotMarkers.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Voice Interface Button */}
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isVoiceInterfaceVisible && styles.voiceButtonActive
          ]}
          onPress={onVoiceToggle}
          activeOpacity={0.8}
        >
          <Icon 
            name="mic" 
            size={28} 
            color={isVoiceInterfaceVisible ? "#fff" : "#4a7c59"} 
          />
        </TouchableOpacity>
      </View>

      {/* Shot History Panel */}
      <ShotHistoryPanel
        shotMarkers={shotMarkers}
        onRemoveShot={handleRemoveShot}
        isVisible={showShotHistory}
      />

      {/* Bottom Control Bar - Simplified without map controls */}
      <View style={styles.bottomBar}>
        {/* Left side - Empty spacer for balance */}
        <View style={styles.controlSpacer} />

        {/* Center - Round Status */}
        <View style={styles.roundStatusContainer}>
          <Text style={styles.roundStatus}>
            {roundStatus || 'In Progress'}
          </Text>
          {isLocationTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>GPS Active</Text>
            </View>
          )}
        </View>

        {/* Right side - Round Controls */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onRoundControlsPress}
          activeOpacity={0.7}
        >
          <Icon name="more-vert" size={24} color="#4a7c59" />
          <Text style={styles.controlButtonLabel}>Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Target Instructions */}
      {!targetDistance && !isPlacingShotMode && currentLocation && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap map to measure distance • Use controls for shot placement
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  
  // Top Bar Styles
  topBar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 2,
  },
  holeInfo: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '500',
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  accuracyText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  locationInfoButton: {
    padding: 4,
  },

  // Location Details Panel
  locationDetailsPanel: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    minWidth: 160,
  },
  locationDetailsTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationDetail: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },

  // Distance Badge Styles
  distanceBadgeContainer: {
    position: 'absolute',
    top: height * 0.25, // 25% from top
    left: 20,
    right: 20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  distanceBadge: {
    backgroundColor: 'rgba(74, 124, 89, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  distanceNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  distanceUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 4,
  },
  clearTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  clearTargetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Shot Mode Indicator
  shotModeIndicator: {
    position: 'absolute',
    top: height * 0.15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  shotModeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Right Controls
  rightControls: {
    position: 'absolute',
    right: 20,
    top: height * 0.3,
    alignItems: 'center',
    gap: 12,
  },
  mapControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#4a7c59',
  },
  mapControlButtonActive: {
    backgroundColor: '#4a7c59',
    borderColor: '#2c5530',
  },
  shotCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Voice Button
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4a7c59',
  },
  voiceButtonActive: {
    backgroundColor: '#4a7c59',
    borderColor: '#2c5530',
  },

  // Shot History Panel
  shotHistoryPanel: {
    position: 'absolute',
    right: 80,
    top: height * 0.3,
    width: 200,
    maxHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shotHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
  },
  shotHistoryList: {
    maxHeight: 140,
  },
  shotHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shotInfo: {
    flex: 1,
  },
  shotNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4a7c59',
  },
  shotDistance: {
    fontSize: 11,
    color: '#666',
  },
  removeShotButton: {
    padding: 4,
  },

  // Bottom Bar Styles
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 50,
  },
  controlSpacer: {
    minWidth: 50, // Same as controlButton for balance
  },
  controlButtonLabel: {
    fontSize: 10,
    color: '#4a7c59',
    fontWeight: '500',
    marginTop: 2,
  },
  roundStatusContainer: {
    alignItems: 'center',
    flex: 1,
  },
  roundStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 2,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
  },
  trackingText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MapOverlay;