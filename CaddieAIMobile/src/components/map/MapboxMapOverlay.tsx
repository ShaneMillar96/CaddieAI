import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SimpleLocationData, simpleLocationService } from '../../services/SimpleLocationService';

// const { width } = Dimensions.get('window'); // Unused for now

export interface MapboxMapOverlayProps {
  courseName?: string;
  currentHole?: number;
  viewingHole?: number;
  isViewingDifferentHole?: boolean;
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
  // Pin location props
  pinLocation?: { latitude: number; longitude: number } | null;
  isPinPlacementMode?: boolean;
  pinDistances?: { userToPin: any; shotToPin: any };
  onTogglePinPlacement?: () => void;
  onClearPinLocation?: () => void;
  // Hole completion props
  onCompleteHole?: () => void;
  completedHoles?: number[];
  totalHoles?: number;
  onShowQuickScoreEditor?: () => void;
  // Navigation actions
  onNavigateToNextHole?: () => void;
  onNavigateToPreviousHole?: () => void;
  // Hole data props
  activeRound?: any;
  // Enhanced navigation props
  enhancedHoleNavigation?: boolean;
  pinDistanceInfo?: { userToPin: any; shotToPin: any };
  onCompleteRound?: () => void;
  onAbandonRound?: () => void;
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
  courseName: _courseName,
  currentHole: _currentHole = 1,
  viewingHole = 1,
  isViewingDifferentHole: _isViewingDifferentHole = false,
  currentLocation,
  isLocationTracking,
  isVoiceInterfaceVisible: _isVoiceInterfaceVisible,
  roundStatus,
  locationError,
  isRequestingLocation = false,
  onVoiceToggle: _onVoiceToggle,
  onRoundControlsPress,
  onCenterOnUser,
  onRetryLocation: _onRetryLocation,
  // Shot placement props
  shotPlacementMode = false,
  // shotPlacementActive = false, // Unused prop
  shotPlacementDistance: _shotPlacementDistance = 0,
  clubRecommendation: _clubRecommendation = null,
  onShotPlacementToggle,
  onActivateShot: _onActivateShot,
  onCancelShotPlacement: _onCancelShotPlacement,
  shotPlacementState: _shotPlacementState = 'inactive',
  // Pin location props
  pinLocation,
  isPinPlacementMode = false,
  pinDistances: _pinDistances,
  onTogglePinPlacement,
  onClearPinLocation: _onClearPinLocation,
  // Hole completion props
  onCompleteHole,
  completedHoles = [],
  totalHoles = 18,
  onShowQuickScoreEditor,
  // Navigation actions
  onNavigateToNextHole,
  onNavigateToPreviousHole,
  // Hole data props
  activeRound,
  // Enhanced navigation props
  enhancedHoleNavigation = false,
  pinDistanceInfo,
  onCompleteRound,
  onAbandonRound,
}) => {
  
  // Get current hole data for display
  const getCurrentHoleData = () => {
    if (!activeRound?.course?.holes) {
      return {
        par: null,
        handicap: 1,
        yardage: 350,
        distance: '350y to green',
        needsParInput: true
      };
    }

    const hole = activeRound.course.holes.find((h: any) => h.holeNumber === viewingHole);
    if (!hole) {
      return {
        par: null,
        handicap: 1,
        yardage: 350,
        distance: '350y to green',
        needsParInput: true
      };
    }

    const yardage = hole.yardageMen || hole.yardageWomen || 350;
    return {
      par: hole.par || null,
      handicap: hole.handicap || 1,
      yardage,
      distance: `${yardage}y to green`,
      needsParInput: !hole.par
    };
  };

  const currentHoleData = getCurrentHoleData();

  // Remove unused variables and functions to satisfy linter
  // const calculateDistanceToPin = (): string => {
  //   return currentLocation ? '150y' : '--';
  // };
  // const calculateDistanceToTee = (): string => {
  //   return currentLocation ? '285y' : '--';
  // };
  // const getShotPlacementStatusColor = (state: string): string => {
  //   switch (state) {
  //     case 'placement': return '#FF6B35';
  //     case 'in_progress': return '#28a745';
  //     case 'completed': return '#007bff';
  //     default: return '#6c757d';
  //   }
  // };
  // const getShotPlacementStatusText = (state: string): string => {
  //   switch (state) {
  //     case 'placement': return 'Ready';
  //     case 'in_progress': return 'Active';
  //     case 'completed': return 'Complete';
  //     default: return 'Inactive';
  //   }
  // };

  return (
    <View style={styles.container} pointerEvents="box-none">

      {/* Left Side Round Controls */}
      <View style={styles.leftControls}>
        {/* Complete Round Button */}
        {onCompleteRound && (
          <TouchableOpacity
            style={[styles.controlButton, styles.completeControlButton]}
            onPress={onCompleteRound}
            activeOpacity={0.8}
          >
            <Icon name="check-circle" size={24} color="#3b82f6" />
            <Text style={styles.controlButtonLabel}>Complete</Text>
          </TouchableOpacity>
        )}
        
        {/* Abandon Round Button */}
        {onAbandonRound && (
          <TouchableOpacity
            style={[styles.controlButton, styles.abandonControlButton]}
            onPress={onAbandonRound}
            activeOpacity={0.8}
          >
            <Icon name="cancel" size={24} color="#ef4444" />
            <Text style={styles.controlButtonLabel}>Abandon</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right Side Enhanced Controls */}
      <View style={styles.rightControls}>

        {/* Score Hole Button */}
        {onCompleteHole && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              completedHoles.includes(viewingHole) && styles.scoreCompletedButton
            ]}
            onPress={completedHoles.includes(viewingHole) ? onShowQuickScoreEditor : onCompleteHole}
            activeOpacity={0.8}
          >
            <Icon 
              name={completedHoles.includes(viewingHole) ? "edit" : "add-circle"} 
              size={24} 
              color={completedHoles.includes(viewingHole) ? "#28a745" : "#4a7c59"} 
            />
            <Text style={[
              styles.controlButtonLabel,
              completedHoles.includes(viewingHole) && styles.scoreCompletedLabel
            ]}>
              {completedHoles.includes(viewingHole) ? 'Edit' : 'Score'}
            </Text>
          </TouchableOpacity>
        )}

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

        {/* Pin Location Mode Toggle */}
        {onTogglePinPlacement && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              isPinPlacementMode && styles.controlButtonActive
            ]}
            onPress={onTogglePinPlacement}
            activeOpacity={0.8}
          >
            <Icon name="flag" size={24} color={isPinPlacementMode ? "#ffffff" : "#4a7c59"} />
            <Text style={[
              styles.controlButtonLabel,
              isPinPlacementMode && styles.controlButtonLabelActive
            ]}>Pin</Text>
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


      {/* Minimal Instructions - Only show in active placement modes */}
      {currentLocation && shotPlacementMode && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Tap to place shot target
          </Text>
        </View>
      )}

      {/* Pin Placement Mode Instructions */}
      {isPinPlacementMode && (
        <View style={styles.instructionsContainer}>
          <Icon name="flag" size={16} color="#ffffff" />
          <Text style={styles.instructionsText}>
            Tap to place pin location
          </Text>
        </View>
      )}

      {/* Enhanced Hole Navigation Footer */}
      {enhancedHoleNavigation && (
        <View style={styles.enhancedHoleNavigation}>
          <View style={styles.navigationCard}>
            {/* Hole Info Section */}
            <View style={styles.enhancedHoleInfoSection}>
              <View style={styles.enhancedHoleNumber}>
                <Text style={styles.enhancedHoleNumberText}>HOLE</Text>
                <Text style={styles.enhancedHoleNumberValue}>{viewingHole || 1}</Text>
              </View>
              <View style={styles.enhancedParInfo}>
                <Text style={styles.enhancedParLabel}>PAR</Text>
                <Text style={styles.enhancedParValue}>{currentHoleData?.par || '-'}</Text>
              </View>
              {/* Score Display (when hole is completed) */}
              {activeRound?.holeScores?.find(
                (hs: any) => hs.holeNumber === viewingHole && hs.roundId === activeRound.id
              ) && (
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreLabel}>SCORE</Text>
                  <Text style={styles.scoreValue}>
                    {activeRound.holeScores.find(
                      (hs: any) => hs.holeNumber === viewingHole && hs.roundId === activeRound.id
                    )?.score || '-'}
                  </Text>
                </View>
              )}
              {/* Pin Distance (when pin is placed) */}
              {pinLocation && pinDistanceInfo?.userToPin && (
                <View style={styles.pinInfo}>
                  <Text style={styles.pinLabel}>🚩 PIN</Text>
                  <Text style={styles.pinDistance}>{Math.round(pinDistanceInfo.userToPin.distanceYards)}y</Text>
                </View>
              )}
            </View>
            
            {/* Navigation Controls */}
            <View style={styles.navigationControls}>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={onNavigateToPreviousHole}
                disabled={viewingHole === 1}
              >
                <Icon name="chevron-left" size={24} color={viewingHole === 1 ? "#cccccc" : "#4a7c59"} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navButton}
                onPress={onNavigateToNextHole}
                disabled={viewingHole === totalHoles}
              >
                <Icon name="chevron-right" size={24} color={viewingHole === totalHoles ? "#cccccc" : "#4a7c59"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Fallback - Original Navigation (when enhanced navigation is disabled) */}
      {!enhancedHoleNavigation && (
        <View style={styles.bottomNavigationCard}>
          <TouchableOpacity 
            style={[styles.navArrow, viewingHole <= 1 && styles.navArrowDisabled]}
            onPress={() => viewingHole > 1 && onNavigateToPreviousHole?.()}
            disabled={viewingHole <= 1}
          >
            <Icon name="chevron-left" size={24} color={viewingHole <= 1 ? "#cccccc" : "#4a7c59"} />
          </TouchableOpacity>

          <View style={styles.holeInfoSectionOriginal}>
            <Text style={styles.holeNumberLarge}>{String(viewingHole).padStart(2, '0')}</Text>
            <View style={styles.holeDetails}>
              <Text style={styles.parText}>Par {currentHoleData.par} • Handicap {currentHoleData.handicap}</Text>
              <Text style={styles.distanceText}>{currentHoleData.distance}</Text>
              {completedHoles.includes(viewingHole) ? (
                <TouchableOpacity style={styles.scoreDisplay} onPress={() => onShowQuickScoreEditor?.()}>
                  <Icon name="edit" size={12} color="#28a745" />
                  <Text style={styles.scoreText}>{activeRound?.holeScores?.find((hs: any) => hs.holeNumber === viewingHole)?.score || 'N/A'}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noScoreText}>No score</Text>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.navArrow, viewingHole >= totalHoles && styles.navArrowDisabled]}
            onPress={() => viewingHole < totalHoles && onNavigateToNextHole?.()}
            disabled={viewingHole >= totalHoles}
          >
            <Icon name="chevron-right" size={24} color={viewingHole >= totalHoles ? "#cccccc" : "#4a7c59"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  scoreHoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    marginLeft: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHoleButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  holeCompletedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  holeCompletedText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
  },
  viewingIndicator: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  viewingIndicatorText: {
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

  // Modern Left Controls
  leftControls: {
    position: 'absolute',
    left: 20,
    top: '40%',
    alignItems: 'center',
    gap: 12,
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
  completeControlButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  abandonControlButton: {
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
  },
  scoreCompletedButton: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  scoreCompletedLabel: {
    color: '#28a745',
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
  

  // Bottom Navigation Card Styles
  bottomNavigationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34, // Extra padding for safe area
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowDisabled: {
    backgroundColor: '#f0f0f0',
  },
  holeInfoSectionOriginal: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  holeNumberLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  holeDetails: {
    alignItems: 'center',
  },
  parText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a7c59',
    marginBottom: 6,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  noScoreText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  
  // Enhanced hole navigation styles
  enhancedHoleNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  
  navigationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  enhancedHoleInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  enhancedHoleNumber: {
    alignItems: 'center',
    marginRight: 24,
  },
  
  enhancedHoleNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  
  enhancedHoleNumberValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 2,
  },
  
  enhancedParInfo: {
    alignItems: 'center',
    marginRight: 24,
  },
  
  enhancedParLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  
  enhancedParValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4a7c59',
    marginTop: 2,
  },
  
  scoreInfo: {
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  
  pinInfo: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  pinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369a1',
  },
  
  pinDistance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
    marginTop: 2,
  },
  
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  
});

export default MapboxMapOverlay;