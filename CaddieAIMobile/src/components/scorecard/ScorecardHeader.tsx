/**
 * Scorecard Header Component
 * Displays round and course information at the top of the scorecard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round } from '../../types';
import roundsApiService from '../../services/roundsApi';

interface ScorecardHeaderProps {
  round: Round;
}

export const ScorecardHeader: React.FC<ScorecardHeaderProps> = ({ round }) => {
  const stats = roundsApiService.calculateRoundStats(round);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#22c55e';
      case 'in_progress': return '#3b82f6';
      case 'paused': return '#f59e0b';
      case 'abandoned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'check-circle';
      case 'in_progress': return 'play-circle-filled';
      case 'paused': return 'pause-circle-filled';
      case 'abandoned': return 'cancel';
      default: return 'radio-button-unchecked';
    }
  };

  const formatScoreToPar = (score: number, par: number) => {
    const diff = score - par;
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  return (
    <View style={styles.container}>
      {/* Course Info */}
      <View style={styles.courseSection}>
        <Text style={styles.courseName}>
          {round.course?.name || `Course ${round.courseId}`}
        </Text>
        <Text style={styles.roundDate}>
          {roundsApiService.formatRoundDate(round.roundDate)}
        </Text>
        {round.course?.city && (
          <Text style={styles.courseLocation}>
            {round.course.city}
            {round.course.state && `, ${round.course.state}`}
          </Text>
        )}
      </View>

      {/* Round Status */}
      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(round.status) }]}>
          <Icon
            name={getStatusIcon(round.status)}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.statusText}>
            {round.status}
          </Text>
        </View>
      </View>

      {/* Score Summary */}
      <View style={styles.scoreSection}>
        <View style={styles.totalScoreContainer}>
          <Text style={styles.totalScore}>
            {stats.totalScore || '--'}
          </Text>
          <Text style={styles.totalPar}>
            Par {stats.totalPar}
          </Text>
          {stats.totalScore > 0 && stats.totalPar > 0 && (
            <Text style={styles.scoreToPar}>
              {formatScoreToPar(stats.totalScore, stats.totalPar)}
            </Text>
          )}
        </View>

        {/* Front/Back 9 */}
        <View style={styles.nineBreakdown}>
          <View style={styles.nineSection}>
            <Text style={styles.nineLabel}>Front 9</Text>
            <Text style={styles.nineScore}>
              {stats.front9Score || '--'}/{stats.front9Par}
            </Text>
          </View>
          <View style={styles.nineSeparator} />
          <View style={styles.nineSection}>
            <Text style={styles.nineLabel}>Back 9</Text>
            <Text style={styles.nineScore}>
              {stats.back9Score || '--'}/{stats.back9Par}
            </Text>
          </View>
        </View>
      </View>

      {/* Round Details */}
      <View style={styles.detailsSection}>
        {round.startTime && round.endTime && (
          <View style={styles.detailItem}>
            <Icon name="access-time" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {roundsApiService.formatRoundDuration(round.startTime, round.endTime)}
            </Text>
          </View>
        )}
        
        {stats.holesCompleted > 0 && (
          <View style={styles.detailItem}>
            <Icon name="golf-course" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {stats.holesCompleted}/{round.course?.totalHoles || 18} holes
            </Text>
          </View>
        )}

        {round.temperatureCelsius && (
          <View style={styles.detailItem}>
            <Icon name="thermostat" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {Math.round(round.temperatureCelsius)}°C
            </Text>
          </View>
        )}

        {round.windSpeedKmh && (
          <View style={styles.detailItem}>
            <Icon name="air" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {Math.round(round.windSpeedKmh)} km/h
            </Text>
          </View>
        )}
      </View>

      {/* Round Notes */}
      {round.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{round.notes}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseSection: {
    marginBottom: 16,
  },
  courseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  roundDate: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 2,
  },
  courseLocation: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusSection: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  scoreSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 16,
  },
  totalScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalScore: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f2937',
  },
  totalPar: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  scoreToPar: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginTop: 4,
  },
  nineBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  nineSection: {
    alignItems: 'center',
    flex: 1,
  },
  nineSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  nineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  nineScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default ScorecardHeader;