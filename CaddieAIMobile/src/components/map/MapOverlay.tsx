import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DistanceResult } from '../../utils/DistanceCalculator';
import { LocationData } from '../../services/LocationService';

const { width, height } = Dimensions.get('window');

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
  isLocationTracking: boolean;
  isVoiceInterfaceVisible: boolean;
  onVoiceToggle: () => void;
  onSettingsPress: () => void;
  onRoundControlsPress: () => void;
  roundStatus?: string;
  gpsAccuracy?: number;
}

export interface DistanceBadgeProps {
  distance: DistanceResult;
  isVisible: boolean;
}

const DistanceBadge: React.FC<DistanceBadgeProps> = ({ distance, isVisible }) => {
  if (!isVisible) return null;

  const formatDistance = (dist: DistanceResult): string => {
    if (dist.yards < 1) {
      return `${Math.round(dist.feet)}'`;
    } else if (dist.yards < 100) {
      return `${Math.round(dist.yards)}`;
    } else {
      return `${Math.round(dist.yards)}`;
    }
  };

  return (
    <View style={styles.distanceBadge}>
      <Text style={styles.distanceNumber}>{formatDistance(distance)}</Text>
      <Text style={styles.distanceUnit}>yds</Text>
    </View>
  );
};

const MapOverlay: React.FC<MapOverlayProps> = ({
  courseName,
  currentHole = 1,
  currentLocation,
  targetDistance,
  isLocationTracking,
  isVoiceInterfaceVisible,
  onVoiceToggle,
  onSettingsPress,
  onRoundControlsPress,
  roundStatus,
  gpsAccuracy,
}) => {
  const [showRoundControls, setShowRoundControls] = useState(false);

  // Handle round controls toggle
  const handleRoundControlsToggle = useCallback(() => {
    setShowRoundControls(!showRoundControls);
    onRoundControlsPress();
  }, [showRoundControls, onRoundControlsPress]);

  // Get GPS status info
  const getGPSStatus = () => {
    if (!currentLocation) {
      return { icon: 'location-off', color: '#dc3545', text: 'No GPS' };
    }
    
    const accuracy = gpsAccuracy || currentLocation.accuracy || 999;
    if (accuracy <= 5) {
      return { icon: 'gps-fixed', color: '#28a745', text: 'GPS Excellent' };
    } else if (accuracy <= 10) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'GPS Good' };
    } else {
      return { icon: 'gps-off', color: '#dc3545', text: 'GPS Poor' };
    }
  };

  const gpsStatus = getGPSStatus();

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
        
        <View style={styles.statusInfo}>
          <View style={styles.gpsStatus}>
            <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
            <Text style={[styles.gpsText, { color: gpsStatus.color }]}>
              {gpsStatus.text}
            </Text>
          </View>
        </View>
      </View>

      {/* Distance Badge - Center of screen when target selected */}
      {targetDistance && (
        <View style={styles.distanceBadgeContainer}>
          <DistanceBadge distance={targetDistance} isVisible={true} />
        </View>
      )}

      {/* Voice Interface Button - Always accessible */}
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

      {/* Bottom Control Bar */}
      <View style={styles.bottomBar}>
        {/* Left side - Settings */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Icon name="settings" size={24} color="#4a7c59" />
        </TouchableOpacity>

        {/* Center - Round Status */}
        <View style={styles.roundStatusContainer}>
          <Text style={styles.roundStatus}>
            {roundStatus || 'In Progress'}
          </Text>
          {isLocationTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>Tracking</Text>
            </View>
          )}
        </View>

        {/* Right side - Round Controls */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRoundControlsToggle}
          activeOpacity={0.7}
        >
          <Icon name="more-vert" size={24} color="#4a7c59" />
        </TouchableOpacity>
      </View>

      {/* Target Instructions - Show when no target selected */}
      {!targetDistance && currentLocation && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap anywhere on the map to measure distance
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

  // Voice Button Styles
  voiceButton: {
    position: 'absolute',
    right: 20,
    bottom: 120,
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
    padding: 8,
    borderRadius: 8,
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

  // Instructions Styles
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