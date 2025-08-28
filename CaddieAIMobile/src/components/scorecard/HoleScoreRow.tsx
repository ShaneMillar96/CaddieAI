/**
 * Hole Score Row Component
 * Displays individual hole score information in the scorecard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HoleScore, Hole } from '../../types';

interface HoleScoreRowProps {
  holeScore?: HoleScore;
  hole?: Hole;
  isHeader?: boolean;
  showStatistics?: boolean;
}

export const HoleScoreRow: React.FC<HoleScoreRowProps> = ({
  holeScore,
  hole,
  isHeader = false,
  showStatistics = false,
}) => {
  if (isHeader) {
    return (
      <View style={[styles.container, styles.headerContainer]}>
        <Text style={[styles.cell, styles.headerCell, styles.holeCell, styles.headerText]}>Hole</Text>
        <Text style={[styles.cell, styles.headerCell, styles.parCell, styles.headerText]}>Par</Text>
        <Text style={[styles.cell, styles.headerCell, styles.scoreCell, styles.headerText]}>Score</Text>
        <Text style={[styles.cell, styles.headerCell, styles.diffCell, styles.headerText]}>+/-</Text>
        {showStatistics && (
          <>
            <Text style={[styles.cell, styles.headerCell, styles.puttsCell, styles.headerText]}>Putts</Text>
            <Text style={[styles.cell, styles.headerCell, styles.statCell, styles.headerText]}>FIR</Text>
            <Text style={[styles.cell, styles.headerCell, styles.statCell, styles.headerText]}>GIR</Text>
          </>
        )}
        <Text style={[styles.cell, styles.headerCell, styles.notesCell, styles.headerText]}>Notes</Text>
      </View>
    );
  }

  const holeNumber = holeScore?.holeNumber || hole?.holeNumber || 0;
  const par = hole?.par || 4;
  const score = holeScore?.score || null;
  const scoreDiff = score ? score - par : null;
  
  const getScoreColor = (diff: number | null) => {
    if (diff === null) return '#6b7280';
    if (diff <= -2) return '#dc2626'; // Eagle or better - red
    if (diff === -1) return '#ea580c'; // Birdie - orange
    if (diff === 0) return '#059669'; // Par - green
    if (diff === 1) return '#0891b2'; // Bogey - blue
    if (diff === 2) return '#7c3aed'; // Double bogey - purple
    return '#be123c'; // Triple bogey or worse - dark red
  };

  const formatScoreDiff = (diff: number | null) => {
    if (diff === null) return '--';
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  };

  const getScoreIcon = (diff: number | null) => {
    if (diff === null) return null;
    if (diff <= -2) return 'flight'; // Eagle
    if (diff === -1) return 'favorite'; // Birdie
    if (diff === 0) return 'radio-button-unchecked'; // Par
    if (diff >= 1) return 'remove'; // Bogey or worse
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.cell, styles.holeCell, styles.centeredCell]}>
        <Text style={styles.holeNumber}>{holeNumber}</Text>
      </View>
      
      <View style={[styles.cell, styles.parCell, styles.centeredCell]}>
        <Text style={styles.parText}>{par}</Text>
      </View>
      
      <View style={[styles.cell, styles.scoreCell, styles.centeredCell]}>
        <View style={styles.scoreContainer}>
          {getScoreIcon(scoreDiff) && (
            <Icon
              name={getScoreIcon(scoreDiff)!}
              size={14}
              color={getScoreColor(scoreDiff)}
              style={styles.scoreIcon}
            />
          )}
          <Text style={[styles.scoreText, { color: getScoreColor(scoreDiff) }]}>
            {score || '--'}
          </Text>
        </View>
      </View>
      
      <View style={[styles.cell, styles.diffCell, styles.centeredCell]}>
        <Text style={[styles.diffText, { color: getScoreColor(scoreDiff) }]}>
          {formatScoreDiff(scoreDiff)}
        </Text>
      </View>
      
      {showStatistics && (
        <>
          <View style={[styles.cell, styles.puttsCell, styles.centeredCell]}>
            <Text style={styles.puttsText}>
              {holeScore?.putts || '--'}
            </Text>
          </View>
          
          <View style={[styles.cell, styles.statCell, styles.centeredCell]}>
            <View style={styles.statIndicator}>
              {holeScore?.fairwayHit === true && (
                <Icon name="check" size={14} color="#22c55e" />
              )}
              {holeScore?.fairwayHit === false && (
                <Icon name="close" size={14} color="#ef4444" />
              )}
              {holeScore?.fairwayHit === null && (
                <Text style={styles.statText}>--</Text>
              )}
            </View>
          </View>
          
          <View style={[styles.cell, styles.statCell, styles.centeredCell]}>
            <View style={styles.statIndicator}>
              {holeScore?.greenInRegulation === true && (
                <Icon name="check" size={14} color="#22c55e" />
              )}
              {holeScore?.greenInRegulation === false && (
                <Icon name="close" size={14} color="#ef4444" />
              )}
              {holeScore?.greenInRegulation === null && (
                <Text style={styles.statText}>--</Text>
              )}
            </View>
          </View>
        </>
      )}
      
      <View style={[styles.cell, styles.notesCell]}>
        {holeScore?.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {holeScore.notes}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#f9fafb',
    minHeight: 44,
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  centeredCell: {
    alignItems: 'center',
  },
  headerCell: {
    paddingVertical: 12,
  },
  holeCell: {
    width: 50,
  },
  parCell: {
    width: 40,
  },
  scoreCell: {
    width: 60,
  },
  diffCell: {
    width: 50,
  },
  puttsCell: {
    width: 50,
  },
  statCell: {
    width: 40,
  },
  notesCell: {
    flex: 1,
    paddingLeft: 8,
  },
  holeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  parText: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreIcon: {
    marginRight: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  diffText: {
    fontSize: 14,
    fontWeight: '500',
  },
  puttsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statIndicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
});

export default HoleScoreRow;