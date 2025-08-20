import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppDispatch } from '../../store';
import {
  selectShotTypeRecognition,
  selectUserSkillContext,
  startShotDetection,
  setShotType,
  clearShotType,
  analyzeShot,
} from '../../store/slices/aiCaddieSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectActiveRound } from '../../store/slices/roundSlice';
import type { ShotType } from '../../store/slices/aiCaddieSlice';

export interface ShotTypeRecognitionProps {
  onShotTypeDetected?: (shotType: ShotType) => void;
  compact?: boolean;
  autoDetect?: boolean;
}

export const ShotTypeRecognition: React.FC<ShotTypeRecognitionProps> = ({
  onShotTypeDetected,
  compact = false,
  autoDetect = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const activeRound = useSelector(selectActiveRound);
  const shotTypeRecognition = useSelector(selectShotTypeRecognition);
  const userSkillContext = useSelector(selectUserSkillContext);

  const { currentShot, isDetecting, history } = shotTypeRecognition;

  useEffect(() => {
    if (currentShot && onShotTypeDetected) {
      onShotTypeDetected(currentShot);
    }
  }, [currentShot, onShotTypeDetected]);

  const getShotTypeInfo = (shotType: ShotType['type']) => {
    switch (shotType) {
      case 'tee_shot':
        return {
          label: 'Tee Shot',
          icon: 'golf-course',
          color: '#4CAF50',
          backgroundColor: '#e8f5e8',
          description: 'Drive from the tee',
        };
      case 'approach':
        return {
          label: 'Approach',
          icon: 'flag',
          color: '#2196F3',
          backgroundColor: '#e3f2fd',
          description: 'Shot to the green',
        };
      case 'chip':
        return {
          label: 'Chip Shot',
          icon: 'sports-golf',
          color: '#FF9800',
          backgroundColor: '#fff3e0',
          description: 'Short game around green',
        };
      case 'bunker':
        return {
          label: 'Bunker Shot',
          icon: 'landscape',
          color: '#795548',
          backgroundColor: '#efebe9',
          description: 'Shot from sand trap',
        };
      case 'putt':
        return {
          label: 'Putt',
          icon: 'adjust',
          color: '#9C27B0',
          backgroundColor: '#f3e5f5',
          description: 'Rolling on the green',
        };
      default:
        return {
          label: 'Unknown',
          icon: 'help',
          color: '#9e9e9e',
          backgroundColor: '#f5f5f5',
          description: 'Shot type unknown',
        };
    }
  };

  const handleDetectShot = async () => {
    if (!user || !userSkillContext) return;

    dispatch(startShotDetection());

    try {
      // Mock shot detection based on context
      // In real implementation, this would use GPS, course data, etc.
      const mockPosition = { latitude: 55.020906, longitude: -7.247879 };
      
      await dispatch(analyzeShot({
        userId: user.id,
        roundId: activeRound?.id,
        position: mockPosition,
        shotContext: {
          skillLevel: userSkillContext.skillLevel,
          handicap: userSkillContext.handicap,
        },
      })).unwrap();

    } catch (error) {
      console.error('ShotTypeRecognition: Failed to detect shot type:', error);
      
      // Fallback: simulate a shot type based on round context
      const fallbackShotType: ShotType = {
        type: 'approach',
        confidence: 0.6,
        distance: 150,
        position: { latitude: 55.020906, longitude: -7.247879 },
      };
      
      dispatch(setShotType(fallbackShotType));
    }
  };

  const handleClearShot = () => {
    dispatch(clearShotType());
  };

  const renderShotTypeCard = () => {
    if (!currentShot) return null;

    const shotInfo = getShotTypeInfo(currentShot.type);

    return (
      <View style={[styles.shotCard, { backgroundColor: shotInfo.backgroundColor }]}>
        <View style={styles.shotHeader}>
          <View style={[styles.shotIcon, { backgroundColor: shotInfo.color }]}>
            <Icon name={shotInfo.icon} size={20} color="#ffffff" />
          </View>
          <View style={styles.shotInfo}>
            <Text style={[styles.shotLabel, { color: shotInfo.color }]}>
              {shotInfo.label}
            </Text>
            <Text style={styles.shotDescription}>{shotInfo.description}</Text>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              {Math.round(currentShot.confidence * 100)}%
            </Text>
          </View>
        </View>

        {currentShot.distance && (
          <View style={styles.shotDetails}>
            <View style={styles.detailItem}>
              <Icon name="straighten" size={16} color="#666" />
              <Text style={styles.detailText}>{currentShot.distance} yards</Text>
            </View>
            {currentShot.conditions?.wind && (
              <View style={styles.detailItem}>
                <Icon name="air" size={16} color="#666" />
                <Text style={styles.detailText}>{currentShot.conditions.wind}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearShot}
          activeOpacity={0.7}
        >
          <Icon name="clear" size={16} color="#666" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDetectionButton = () => (
    <TouchableOpacity
      style={styles.detectButton}
      onPress={handleDetectShot}
      disabled={isDetecting || !activeRound}
      activeOpacity={0.7}
    >
      {isDetecting ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Icon name="search" size={20} color="#ffffff" />
      )}
      <Text style={styles.detectButtonText}>
        {isDetecting ? 'Analyzing...' : 'Detect Shot'}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentShots = () => {
    if (history.length === 0 || compact) return null;

    return (
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Shots</Text>
        <View style={styles.historyList}>
          {history.slice(0, 3).map((shot, index) => {
            const shotInfo = getShotTypeInfo(shot.type);
            return (
              <View key={index} style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: shotInfo.color }]}>
                  <Icon name={shotInfo.icon} size={12} color="#ffffff" />
                </View>
                <Text style={styles.historyText}>{shotInfo.label}</Text>
                {shot.distance && (
                  <Text style={styles.historyDistance}>{shot.distance}y</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {currentShot ? renderShotTypeCard() : renderDetectionButton()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="track-changes" size={20} color="#2c5530" />
        <Text style={styles.title}>Shot Analysis</Text>
        {!activeRound && (
          <Text style={styles.inactiveText}>(Requires active round)</Text>
        )}
      </View>

      {currentShot ? renderShotTypeCard() : renderDetectionButton()}
      {renderRecentShots()}

      {!activeRound && (
        <View style={styles.inactiveContainer}>
          <Text style={styles.inactiveMessage}>
            Start a round to enable automatic shot detection and analysis
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  compactContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
    flex: 1,
  },
  inactiveText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  shotCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  shotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shotIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shotInfo: {
    flex: 1,
  },
  shotLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  shotDescription: {
    fontSize: 12,
    color: '#666',
  },
  confidenceContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c5530',
  },
  shotDetails: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5530',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  detectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  historyContainer: {
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c5530',
    marginBottom: 8,
  },
  historyList: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  historyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  historyText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  historyDistance: {
    fontSize: 10,
    color: '#999',
  },
  inactiveContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
  },
  inactiveMessage: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});

export default ShotTypeRecognition;