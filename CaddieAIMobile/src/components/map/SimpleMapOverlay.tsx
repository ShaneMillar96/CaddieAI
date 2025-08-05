import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SimpleLocationData } from '../../services/SimpleLocationService';

const { width } = Dimensions.get('window');

export interface SimpleMapOverlayProps {
  courseName?: string;
  currentHole?: number;
  currentLocation: SimpleLocationData | null;
  isLocationTracking: boolean;
  isVoiceInterfaceVisible: boolean;
  roundStatus?: string;
  onVoiceToggle: () => void;
  onRoundControlsPress: () => void;
  onCenterOnUser?: () => void;
}

/**
 * SimpleMapOverlay Component
 * 
 * Clean overlay UI for map controls and information display:
 * - Course and hole information
 * - GPS status display
 * - Voice interface toggle
 * - Round controls access
 * - User location centering
 */
const SimpleMapOverlay: React.FC<SimpleMapOverlayProps> = ({
  courseName,
  currentHole = 1,
  currentLocation,
  isLocationTracking,
  isVoiceInterfaceVisible,
  roundStatus,
  onVoiceToggle,
  onRoundControlsPress,
  onCenterOnUser,
}) => {
  
  // Get GPS status for display
  const getGPSStatus = () => {
    if (!currentLocation) {
      return { icon: 'location-off', color: '#dc3545', text: 'No GPS' };
    }
    
    const accuracy = currentLocation.accuracy;
    if (!accuracy) {
      return { icon: 'gps-not-fixed', color: '#ffc107', text: 'Searching' };
    }
    
    if (accuracy <= 5) {
      return { icon: 'gps-fixed', color: '#00C851', text: 'Excellent' };
    } else if (accuracy <= 15) {
      return { icon: 'gps-fixed', color: '#4CAF50', text: 'Good' };
    } else if (accuracy <= 25) {
      return { icon: 'gps-not-fixed', color: '#FFBB33', text: 'Fair' };
    } else {
      return { icon: 'gps-off', color: '#FF4444', text: 'Poor' };
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
        
        <View style={styles.gpsStatusContainer}>
          <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
          <Text style={[styles.gpsStatusText, { color: gpsStatus.color }]}>
            {gpsStatus.text}
          </Text>
          {currentLocation?.accuracy && (
            <Text style={styles.accuracyText}>
              ±{Math.round(currentLocation.accuracy)}m
            </Text>
          )}
        </View>
      </View>

      {/* Right Side Controls */}
      <View style={styles.rightControls}>
        {/* Center on User Button */}
        {currentLocation && onCenterOnUser && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onCenterOnUser}
            activeOpacity={0.8}
          >
            <Icon name="my-location" size={24} color="#4a7c59" />
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

      {/* Bottom Control Bar */}
      <View style={styles.bottomBar}>
        {/* Left side - GPS Status Details */}
        <View style={styles.gpsDetails}>
          {isLocationTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>GPS Active</Text>
            </View>
          )}
        </View>

        {/* Center - Round Status */}
        <View style={styles.roundStatusContainer}>
          <Text style={styles.roundStatus}>
            {roundStatus || 'In Progress'}
          </Text>
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

      {/* Instructions for new users */}
      {currentLocation && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap map to measure distance • Use voice for AI assistance
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
  gpsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  gpsStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accuracyText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
    fontFamily: 'monospace',
  },

  // Right Controls
  rightControls: {
    position: 'absolute',
    right: 20,
    top: '35%',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
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
  gpsDetails: {
    minWidth: 80,
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
  roundStatusContainer: {
    alignItems: 'center',
    flex: 1,
  },
  roundStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  controlButtonLabel: {
    fontSize: 10,
    color: '#4a7c59',
    fontWeight: '500',
    marginTop: 2,
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

export default SimpleMapOverlay;