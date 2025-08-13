import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SimpleLocationData, simpleLocationService } from '../../services/SimpleLocationService';

// const { width } = Dimensions.get('window'); // Unused for now

export interface MapboxMapOverlayProps {
  courseName?: string;
  currentHole?: number;
  currentLocation: SimpleLocationData | null;
  isLocationTracking: boolean;
  isVoiceInterfaceVisible: boolean;
  roundStatus?: string;
  locationError?: string | null;
  isRequestingLocation?: boolean;
  onVoiceToggle: () => void;
  onRoundControlsPress: () => void;
  onCenterOnUser?: () => void;
  onRetryLocation?: () => void;
  // Shot placement props
  shotPlacementMode?: boolean;
  shotPlacementActive?: boolean;
  shotPlacementDistance?: number;
  clubRecommendation?: string | null;
  onShotPlacementToggle?: () => void;
  onActivateShot?: () => void;
  onCancelShotPlacement?: () => void;
  shotPlacementState?: 'inactive' | 'placement' | 'in_progress' | 'completed';
}

/**
 * MapboxMapOverlay Component
 * 
 * Enhanced overlay UI for Mapbox maps with golf-specific features:
 * - Course and hole information display
 * - Advanced GPS status with Mapbox-specific indicators
 * - Voice interface integration
 * - Golf round controls and navigation
 * - Distance measurement tools
 * - Real-time location tracking status
 */
const MapboxMapOverlay: React.FC<MapboxMapOverlayProps> = ({
  courseName,
  currentHole = 1,
  currentLocation,
  isLocationTracking,
  isVoiceInterfaceVisible,
  roundStatus,
  locationError,
  isRequestingLocation = false,
  onVoiceToggle,
  onRoundControlsPress,
  onCenterOnUser,
  onRetryLocation,
  // Shot placement props
  shotPlacementMode = false,
  // shotPlacementActive = false, // Unused prop
  shotPlacementDistance = 0,
  clubRecommendation = null,
  onShotPlacementToggle,
  onActivateShot,
  onCancelShotPlacement,
  shotPlacementState = 'inactive',
}) => {
  
  // Get enhanced GPS status for Mapbox
  const getGPSStatus = () => {
    if (locationError) {
      return { 
        icon: 'location-off', 
        color: '#dc3545', 
        text: locationError.includes('permission') ? 'No Permission' : 'GPS Error',
        description: 'Location services unavailable'
      };
    }
    
    if (isRequestingLocation || !currentLocation) {
      return { 
        icon: isRequestingLocation ? 'gps-not-fixed' : 'location-off', 
        color: '#ffc107', 
        text: isRequestingLocation ? 'Acquiring GPS' : 'No GPS',
        description: isRequestingLocation ? 'Searching for satellites' : 'GPS not active'
      };
    }
    
    const accuracy = currentLocation.accuracy;
    const isUsingFallback = simpleLocationService.isUsingFallbackLocation();
    
    // Special handling for fallback location
    if (isUsingFallback) {
      return { 
        icon: 'golf-course', 
        color: '#9C27B0', 
        text: 'Test Mode',
        description: 'Using Faughan Valley fallback location'
      };
    }
    
    if (!accuracy) {
      return { 
        icon: 'gps-not-fixed', 
        color: '#ffc107', 
        text: 'Searching',
        description: 'Acquiring GPS fix'
      };
    }
    
    // Enhanced accuracy classification for golf
    if (accuracy <= 3) {
      return { 
        icon: 'gps-fixed', 
        color: '#00C851', 
        text: 'Excellent',
        description: 'Tournament-grade accuracy'
      };
    } else if (accuracy <= 5) {
      return { 
        icon: 'gps-fixed', 
        color: '#28a745', 
        text: 'Superb',
        description: 'Perfect for distance measurements'
      };
    } else if (accuracy <= 10) {
      return { 
        icon: 'gps-fixed', 
        color: '#4CAF50', 
        text: 'Good',
        description: 'Suitable for golf navigation'
      };
    } else if (accuracy <= 15) {
      return { 
        icon: 'gps-not-fixed', 
        color: '#FFBB33', 
        text: 'Fair',
        description: 'Adequate for general use'
      };
    } else if (accuracy <= 25) {
      return { 
        icon: 'gps-not-fixed', 
        color: '#FF9800', 
        text: 'Poor',
        description: 'Consider moving to open area'
      };
    } else {
      return { 
        icon: 'gps-off', 
        color: '#FF4444', 
        text: 'Very Poor',
        description: 'GPS signal obstructed'
      };
    }
  };

  const gpsStatus = getGPSStatus();

  // Calculate distance to course features (placeholder for future implementation)
  const calculateDistanceToPin = (): string => {
    // TODO: Implement distance calculation to pin location
    // This would use the current location and pin coordinates
    return currentLocation ? '150y' : '--';
  };

  const calculateDistanceToTee = (): string => {
    // TODO: Implement distance calculation to tee
    return currentLocation ? '285y' : '--';
  };

  // Helper functions for shot placement status
  const getShotPlacementStatusColor = (state: string): string => {
    switch (state) {
      case 'placement': return '#FF6B35';
      case 'in_progress': return '#28a745';
      case 'completed': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getShotPlacementStatusText = (state: string): string => {
    switch (state) {
      case 'placement': return 'Ready';
      case 'in_progress': return 'Active';
      case 'completed': return 'Complete';
      default: return 'Inactive';
    }
  };

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      {/* Enhanced Top Information Bar */}
      <View style={styles.topBar}>
        <View style={styles.courseInfo}>
          <View style={styles.courseHeader}>
            <Icon name="golf-course" size={20} color="#2c5530" />
            <Text style={styles.courseName} numberOfLines={1}>
              {courseName || 'Golf Course'}
            </Text>
          </View>
          <View style={styles.holeInfo}>
            <Text style={styles.holeNumber}>Hole {currentHole}</Text>
            <View style={styles.parInfo}>
              <Text style={styles.parLabel}>Par 4</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.gpsStatusContainer, { backgroundColor: `${gpsStatus.color}15` }]}
          onPress={locationError || (!currentLocation && !isRequestingLocation) ? onRetryLocation : undefined}
          disabled={isRequestingLocation}
        >
          <Icon name={gpsStatus.icon} size={16} color={gpsStatus.color} />
          <View style={styles.gpsStatusText}>
            <Text style={[styles.gpsMainText, { color: gpsStatus.color }]}>
              {gpsStatus.text}
            </Text>
            {currentLocation?.accuracy && (
              <Text style={styles.accuracyText}>
                {simpleLocationService.isUsingFallbackLocation() 
                  ? 'Faughan Valley' 
                  : `±${Math.round(currentLocation.accuracy)}m`}
              </Text>
            )}
          </View>
          {(locationError || (!currentLocation && !isRequestingLocation)) && onRetryLocation && (
            <Icon name="refresh" size={12} color={gpsStatus.color} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Minimal Shot Placement Indicator - Show only club recommendation */}
      {shotPlacementMode && clubRecommendation && (
        <View style={styles.minimalistShotInfo}>
          <Icon name="golf-course" size={14} color="#ffffff" />
          <Text style={styles.shotClubText}>{clubRecommendation}</Text>
        </View>
      )}

      {/* Minimal Distance Information - Hole19 Style */}
      {currentLocation && !shotPlacementMode && (
        <View style={styles.minimalistDistanceInfo}>
          <Text style={styles.distanceInfoText}>📍 {calculateDistanceToPin()}</Text>
        </View>
      )}

      {/* Right Side Enhanced Controls */}
      <View style={styles.rightControls}>
        {/* Center on User Button */}
        {currentLocation && onCenterOnUser && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onCenterOnUser}
            activeOpacity={0.8}
          >
            <Icon name="my-location" size={24} color="#4a7c59" />
            <Text style={styles.controlButtonLabel}>Center</Text>
          </TouchableOpacity>
        )}

        {/* Shot Placement Mode Toggle */}
        {onShotPlacementToggle && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              shotPlacementMode && styles.controlButtonActive
            ]}
            onPress={onShotPlacementToggle}
            activeOpacity={0.8}
          >
            <Icon name="golf-course" size={24} color={shotPlacementMode ? "#ffffff" : "#4a7c59"} />
            <Text style={[
              styles.controlButtonLabel,
              shotPlacementMode && styles.controlButtonLabelActive
            ]}>Shot</Text>
          </TouchableOpacity>
        )}


      </View>

      {/* Modern Bottom Control Bar */}
      <View style={styles.bottomBar}>
        {/* Tracking Status */}
        {isLocationTracking && (
          <View style={styles.trackingPill}>
            <View style={styles.trackingDot} />
            <Text style={styles.trackingText}>Tracking</Text>
          </View>
        )}

        {/* Round Status */}
        <View style={styles.roundStatusPill}>
          <Icon name="sports-golf" size={14} color="#4a7c59" />
          <Text style={styles.roundStatus}>
            {roundStatus || 'InProgress'}
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onRoundControlsPress}
          activeOpacity={0.7}
        >
          <Icon name="more-horiz" size={24} color="#4a7c59" />
        </TouchableOpacity>
      </View>

      {/* Minimal Instructions - Only show in shot placement mode */}
      {currentLocation && shotPlacementMode && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap to place shot target
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
  
  // Enhanced Top Bar Styles
  topBar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    flex: 1,
  },
  holeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holeNumber: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '500',
  },
  parInfo: {
    backgroundColor: '#4a7c59',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  parLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  gpsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 80,
  },
  gpsStatusText: {
    alignItems: 'center',
  },
  gpsMainText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accuracyText: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 1,
  },

  // Golf Distance Bar
  distanceBar: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 124, 89, 0.9)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  distanceSeparator: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  distanceLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    marginLeft: 4,
  },

  // Modern Right Controls
  rightControls: {
    position: 'absolute',
    right: 20,
    top: '40%',
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
  controlButtonLabel: {
    fontSize: 8,
    color: '#4a7c59',
    fontWeight: '600',
    marginTop: 2,
  },
  controlButtonActive: {
    backgroundColor: '#4a7c59',
    borderColor: '#2c5530',
  },
  controlButtonLabelActive: {
    color: '#ffffff',
  },

  // Modern Bottom Bar Styles
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  trackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '600',
  },
  roundStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c5530',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    right: 0,
  },

  // Minimal Instructions
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  instructionsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Shot Placement Panel Styles
  shotPlacementPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shotPlacementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  shotPlacementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    flex: 1,
  },
  shotPlacementStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  shotPlacementStatusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  shotPlacementDistance: {
    alignItems: 'center',
    marginBottom: 12,
  },
  shotPlacementDistanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  shotPlacementDistanceLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  clubRecommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  clubRecommendationText: {
    fontSize: 14,
    color: '#2c5530',
    fontWeight: '500',
    flex: 1,
  },
  shotPlacementActions: {
    flexDirection: 'row',
    gap: 12,
  },
  activateShotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activateShotButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelShotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc3545',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelShotButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Minimalist Hole19-style UI Components
  minimalistShotInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shotDistanceText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  shotClubText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  minimalistDistanceInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  distanceInfoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapboxMapOverlay;