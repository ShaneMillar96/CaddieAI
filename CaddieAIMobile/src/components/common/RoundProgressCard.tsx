import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round } from '../../types/golf';

interface RoundProgressCardProps {
  round: Round;
  currentHole: number;
  onHolePress?: (holeNumber: number) => void;
}

const RoundProgressCard: React.FC<RoundProgressCardProps> = ({
  round,
  currentHole,
  onHolePress,
}) => {
  // Calculate current progress
  const totalHoles = 18;
  const completedHoles = round.holeScores?.length || 0;
  const progressPercentage = (completedHoles / totalHoles) * 100;

  // Calculate current score relative to par
  const currentScore = round.totalScore || 0;
  const currentPar = calculateCurrentPar(round, completedHoles);
  const scoreToPar = currentScore - currentPar;

  // Get current hole information
  const currentHoleData = round.course?.holes?.find(
    hole => hole.holeNumber === currentHole
  );

  // Format time elapsed
  const timeElapsed = calculateTimeElapsed(round.startTime);

  // Get round status display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'InProgress':
        return '#28a745';
      case 'Paused':
        return '#ffc107';
      case 'Completed':
        return '#007bff';
      case 'Abandoned':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'InProgress':
        return 'play-arrow';
      case 'Paused':
        return 'pause';
      case 'Completed':
        return 'check-circle';
      case 'Abandoned':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const formatScoreToPar = (score: number) => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
  };

  return (
    <View style={styles.card}>
      {/* Header with status and time */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Icon
            name={getStatusIcon(round.status)}
            size={16}
            color={getStatusColor(round.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(round.status) }]}>
            {round.status}
          </Text>
        </View>
        <Text style={styles.timeText}>{timeElapsed}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Current hole info */}
        <TouchableOpacity
          style={styles.currentHole}
          onPress={() => onHolePress?.(currentHole)}
          activeOpacity={0.7}
        >
          <View style={styles.holeNumberContainer}>
            <Text style={styles.holeNumber}>{currentHole}</Text>
            <Text style={styles.holeLabel}>HOLE</Text>
          </View>
          <View style={styles.holeDetails}>
            <View style={styles.holeInfoRow}>
              <Text style={styles.holeInfoLabel}>Par</Text>
              <Text style={styles.holeInfoValue}>
                {currentHoleData?.par || '-'}
              </Text>
            </View>
            <View style={styles.holeInfoRow}>
              <Text style={styles.holeInfoLabel}>Yards</Text>
              <Text style={styles.holeInfoValue}>
                {currentHoleData?.yardageMen || '-'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Score summary */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{currentScore}</Text>
            <Text style={styles.scoreLabel}>Total</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text
              style={[
                styles.scoreValue,
                {
                  color: scoreToPar === 0 ? '#28a745' : scoreToPar > 0 ? '#dc3545' : '#007bff'
                }
              ]}
            >
              {formatScoreToPar(scoreToPar)}
            </Text>
            <Text style={styles.scoreLabel}>To Par</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{completedHoles}</Text>
            <Text style={styles.scoreLabel}>Holes</Text>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Round Progress</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedHoles} of {totalHoles} holes completed
        </Text>
      </View>

      {/* Quick stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Icon name="golf-course" size={16} color="#4a7c59" />
          <Text style={styles.statText}>
            {round.fairwaysHit || 0} fairways
          </Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="flag" size={16} color="#4a7c59" />
          <Text style={styles.statText}>
            {round.greensInRegulation || 0} GIR
          </Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="sports-golf" size={16} color="#4a7c59" />
          <Text style={styles.statText}>
            {round.totalPutts || 0} putts
          </Text>
        </View>
      </View>
    </View>
  );
};

// Helper functions
const calculateCurrentPar = (round: Round, holesCompleted: number): number => {
  if (!round.course?.holes) return holesCompleted * 4; // Assume par 4 average
  
  return round.course.holes
    .slice(0, holesCompleted)
    .reduce((total, hole) => total + hole.par, 0);
};

const calculateTimeElapsed = (startTime?: string): string => {
  if (!startTime) return '0:00';

  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  content: {
    marginBottom: 20,
  },
  currentHole: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  holeNumberContainer: {
    alignItems: 'center',
    marginRight: 20,
  },
  holeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
  },
  holeLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  holeDetails: {
    flex: 1,
    gap: 8,
  },
  holeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holeInfoLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  holeInfoValue: {
    fontSize: 16,
    color: '#2c5530',
    fontWeight: '600',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a7c59',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default RoundProgressCard;