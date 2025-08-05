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
  onAdjustGPS?: () => void;
  onRefreshGPS?: () => void;
  roundStatus?: string;
  gpsAccuracy?: number;
}

// Enhanced GPS Status Component
// Enhanced GPS Status Component with detailed information
const GPSStatusIndicator: React.FC<{
  currentLocation: any;
  gpsAccuracy?: number;
  isExpanded?: boolean;
}> = React.memo(({ currentLocation, gpsAccuracy, isExpanded = false }) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const gpsStatus = useMemo(() => {
    if (!currentLocation) {
      return { 
        icon: 'location-off', 
        color: '#dc3545', 
        text: 'No GPS', 
        quality: 'No Signal',
        recommendation: 'Enable location services'
      };
    }
    
    const accuracy = gpsAccuracy || currentLocation.accuracy;
    
    if (accuracy === undefined || accuracy === null) {
      return { 
        icon: 'gps-not-fixed', 
        color: '#ffc107', 
        text: 'Searching...', 
        quality: 'Acquiring',
        recommendation: 'Move to open area'
      };
    }
    
    if (accuracy <= 3) {
      return { 
        icon: 'gps-fixed', 
        color: '#00C851', 
        text: 'Excellent', 
        quality: 'Tournament Level',
        recommendation: 'Perfect for precision shots'
      };
    } else if (accuracy <= 8) {
      return { 
        icon: 'gps-fixed', 
        color: '#28a745', 
        text: 'Excellent', 
        quality: 'Professional',
        recommendation: 'Ideal for golf measurements'
      };
    } else if (accuracy <= 15) {
      return { 
        icon: 'gps-fixed', 
        color: '#4CAF50', 
        text: 'Good', 
        quality: 'Recreational',
        recommendation: 'Good for most golf needs'
      };
    } else if (accuracy <= 25) {
      return { 
        icon: 'gps-not-fixed', 
        color: '#FFBB33', 
        text: 'Fair', 
        quality: 'Basic',
        recommendation: 'Consider moving to open area'
      };
    } else if (accuracy <= 50) {
      return { 
        icon: 'gps-off', 
        color: '#FF8800', 
        text: 'Poor', 
        quality: 'Limited',
        recommendation: 'Move away from obstructions'
      };
    } else {
      return { 
        icon: 'gps-off', 
        color: '#FF4444', 
        text: 'Very Poor', 
        quality: 'Unreliable',
        recommendation: 'Find better signal location'
      };
    }
  }, [currentLocation, gpsAccuracy]);

  // Pulse animation for searching state
  useEffect(() => {
    if (gpsStatus.text === 'Searching...') {
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start(() => startPulse());
      };
      startPulse();
    }
  }, [gpsStatus.text, pulseAnimation]);

  return (
    <View style={[styles.gpsStatus, isExpanded && styles.gpsStatusExpanded]}>
      <Animated.View style={{ opacity: pulseAnimation }}>
        <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
      </Animated.View>
      
      <View style={styles.gpsStatusTextContainer}>
        <Text style={[styles.gpsText, { color: gpsStatus.color }]}>
          {gpsStatus.text}
        </Text>
        {gpsAccuracy && (
          <Text style={styles.accuracyText}>
            ±{Math.round(gpsAccuracy)}m
          </Text>
        )}
      </View>
      
      {isExpanded && (
        <View style={styles.gpsStatusDetails}>
          <Text style={styles.gpsQualityText}>{gpsStatus.quality}</Text>
          <Text style={styles.gpsRecommendationText}>{gpsStatus.recommendation}</Text>
          {currentLocation && (
            <View style={styles.gpsCoordinates}>
              <Text style={styles.coordinateText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// Enhanced Distance Badge Component with club recommendation
const DistanceBadge: React.FC<{
  distance: DistanceResult;
  isVisible: boolean;
  targetPin?: any;
  currentLocation?: any;
}> = React.memo(({ distance, isVisible, targetPin, currentLocation }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible, fadeAnimation, scaleAnimation]);

  const formatDistance = useCallback((dist: DistanceResult): string => {
    if (dist.yards < 1) {
      return `${Math.round(dist.feet)}'`;
    } else if (dist.yards < 100) {
      return `${Math.round(dist.yards)}`;
    } else {
      return `${Math.round(dist.yards)}`;
    }
  }, []);

  // Enhanced club recommendation
  const getRecommendedClub = useCallback((yards: number): string => {
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
    return 'Putter';
  }, []);

  // Calculate bearing if we have both locations
  const bearing = useMemo(() => {
    if (!currentLocation || !targetPin) return null;
    const lat1 = currentLocation.latitude * Math.PI / 180;
    const lat2 = targetPin.latitude * Math.PI / 180;
    const deltaLng = (targetPin.longitude - currentLocation.longitude) * Math.PI / 180;
    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    const bearingRad = Math.atan2(y, x);
    const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
    return bearingDeg;
  }, [currentLocation, targetPin]);

  const getBearingText = useCallback((degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }, []);

  if (!isVisible) return null;

  const recommendedClub = getRecommendedClub(distance.yards);

  return (
    <Animated.View 
      style={[
        styles.distanceBadge,
        { 
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }]
        }
      ]}
    >
      <View style={styles.distanceMainContainer}>
        <Text style={styles.distanceNumber}>{formatDistance(distance)}</Text>
        <Text style={styles.distanceUnit}>yds</Text>
      </View>
      
      <View style={styles.distanceMetaContainer}>
        <View style={styles.clubContainer}>
          <Icon name="golf-course" size={14} color="#fff" />
          <Text style={styles.clubText}>{recommendedClub}</Text>
        </View>
        
        {bearing !== null && (
          <View style={styles.bearingContainer}>
            <Icon name="explore" size={14} color="#fff" />
            <Text style={styles.bearingText}>
              {getBearingText(bearing)} ({Math.round(bearing)}°)
            </Text>
          </View>
        )}
        
        <View style={styles.metersContainer}>
          <Text style={styles.metersText}>{Math.round(distance.meters)}m</Text>
        </View>
      </View>
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
  onAdjustGPS,
  onRefreshGPS,
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
          activeOpacity={0.8}
        >
          <GPSStatusIndicator 
            currentLocation={currentLocation} 
            gpsAccuracy={gpsAccuracy}
            isExpanded={showLocationInfo}
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

      {/* Enhanced Distance Badge - Center of screen when target selected */}
      {targetDistance && (
        <View style={styles.distanceBadgeContainer}>
          <DistanceBadge 
            distance={targetDistance} 
            isVisible={true} 
            targetPin={targetPin}
            currentLocation={currentLocation}
          />
          <TouchableOpacity
            style={styles.clearTargetButton}
            onPress={onClearTarget}
            activeOpacity={0.8}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.clearTargetText}>Clear Target</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Shot Placement Mode Indicator with GPS Controls */}
      {isPlacingShotMode && (
        <View style={styles.shotModeContainer}>
          <View style={styles.shotModeIndicator}>
            <Icon name="my-location" size={20} color="#fff" />
            <Text style={styles.shotModeText}>Move the green marker to aim shot</Text>
          </View>
          
          {/* GPS Control Buttons matching reference design */}
          <View style={styles.gpsControlsContainer}>
            <TouchableOpacity
              style={styles.gpsControlButton}
              onPress={onAdjustGPS}
              activeOpacity={0.8}
            >
              <Text style={styles.gpsControlButtonText}>Adjust GPS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.gpsControlButton}
              onPress={onRefreshGPS}
              activeOpacity={0.8}
            >
              <Text style={styles.gpsControlButtonText}>Refresh GPS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.gpsControlButton, styles.doneButton]}
              onPress={onToggleShotMode}
              activeOpacity={0.8}
            >
              <Text style={[styles.gpsControlButtonText, styles.doneButtonText]}>Done</Text>
            </TouchableOpacity>
          </View>
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
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gpsStatusExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  gpsStatusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accuracyText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontFamily: 'monospace',
  },
  gpsStatusDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  gpsQualityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  gpsRecommendationText: {
    color: '#ccc',
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  gpsCoordinates: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordinateText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'monospace',
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

  // Enhanced Distance Badge Styles
  distanceBadgeContainer: {
    position: 'absolute',
    top: height * 0.2, // 20% from top for better visibility
    left: 20,
    right: 20,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  distanceBadge: {
    backgroundColor: 'rgba(44, 85, 48, 0.98)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  distanceMainContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  distanceNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  distanceUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
    opacity: 0.9,
  },
  distanceMetaContainer: {
    alignItems: 'center',
    gap: 6,
  },
  clubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  clubText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bearingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.9,
  },
  bearingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  metersContainer: {
    opacity: 0.8,
  },
  metersText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  clearTargetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearTargetText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Shot Mode Indicator and Controls
  shotModeContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  shotModeIndicator: {
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
  gpsControlsContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  gpsControlButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gpsControlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  doneButtonText: {
    fontWeight: '700',
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