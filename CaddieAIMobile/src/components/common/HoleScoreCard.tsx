import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface HoleScoreCardProps {
  holeNumber: number;
  par: number | null;
  score: number | null;
  isCurrentHole: boolean;
}

/**
 * HoleScoreCard Component
 * 
 * Individual hole display component for the scorecard overlay.
 * Shows hole number, par, score, and uses color coding based on golf scoring performance.
 * 
 * Color coding system:
 * - Eagle (-2): Gold
 * - Birdie (-1): Green  
 * - Par (0): Blue
 * - Bogey (+1): Orange
 * - Double Bogey (+2): Red
 * - Triple Bogey+ (+3+): Dark Red
 */
export const HoleScoreCard: React.FC<HoleScoreCardProps> = ({
  holeNumber,
  par,
  score,
  isCurrentHole,
}) => {
  // Calculate score performance relative to par
  const getScorePerformance = (): {
    difference: number | null;
    color: string;
    backgroundColor: string;
    label: string;
  } => {
    if (!score || !par) {
      return {
        difference: null,
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        label: 'No Score',
      };
    }

    const diff = score - par;

    switch (diff) {
      case -2: // Eagle
        return {
          difference: diff,
          color: '#ffffff',
          backgroundColor: '#FFD700',
          label: 'Eagle',
        };
      case -1: // Birdie
        return {
          difference: diff,
          color: '#ffffff',
          backgroundColor: '#22c55e',
          label: 'Birdie',
        };
      case 0: // Par
        return {
          difference: diff,
          color: '#ffffff',
          backgroundColor: '#3b82f6',
          label: 'Par',
        };
      case 1: // Bogey
        return {
          difference: diff,
          color: '#ffffff',
          backgroundColor: '#f59e0b',
          label: 'Bogey',
        };
      case 2: // Double Bogey
        return {
          difference: diff,
          color: '#ffffff',
          backgroundColor: '#ef4444',
          label: 'Double Bogey',
        };
      default: // Triple Bogey or worse
        if (diff >= 3) {
          return {
            difference: diff,
            color: '#ffffff',
            backgroundColor: '#dc2626',
            label: `+${diff}`,
          };
        } else if (diff <= -3) {
          // Albatross or better (very rare)
          return {
            difference: diff,
            color: '#000000',
            backgroundColor: '#fbbf24',
            label: `${diff}`,
          };
        }
        return {
          difference: diff,
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          label: 'Unknown',
        };
    }
  };

  const performance = getScorePerformance();

  return (
    <View
      style={[
        styles.card,
        isCurrentHole && styles.currentHoleCard,
      ]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Hole ${holeNumber}, Par ${par || 'unknown'}, Score ${score || 'not recorded'}${isCurrentHole ? ', current hole' : ''}`}
      accessibilityHint={`Shows scoring information for hole ${holeNumber}`}
    >
      {/* Hole Number */}
      <View style={styles.holeNumberContainer}>
        <Text style={[
          styles.holeNumber,
          isCurrentHole && styles.currentHoleNumber,
        ]}>
          {holeNumber}
        </Text>
      </View>

      {/* Par Display */}
      <View style={styles.parContainer}>
        <Text style={styles.parLabel}>PAR</Text>
        <Text style={styles.parValue}>
          {par !== null ? par : '-'}
        </Text>
      </View>

      {/* Score Display with Color Coding */}
      <View
        style={[
          styles.scoreContainer,
          { backgroundColor: performance.backgroundColor }
        ]}
      >
        <Text style={[
          styles.scoreValue,
          { color: performance.color }
        ]}>
          {score !== null ? score : '-'}
        </Text>
      </View>

      {/* Performance Label (for completed holes with good/bad scores) */}
      {score && par && performance.difference !== 0 && (
        <View style={styles.performanceLabelContainer}>
          <Text style={[
            styles.performanceLabel,
            performance.difference && performance.difference < 0 
              ? styles.performanceLabelGood 
              : styles.performanceLabelBad
          ]}>
            {performance.difference !== null ? (performance.difference > 0 ? `+${performance.difference}` : performance.difference) : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currentHoleCard: {
    borderColor: '#4a7c59',
    borderWidth: 2,
    backgroundColor: '#f0fff4',
    shadowColor: '#4a7c59',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.02 }], // Slightly larger for emphasis
  },
  holeNumberContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  holeNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
  },
  currentHoleNumber: {
    color: '#4a7c59',
    fontSize: 22,
  },
  parContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  parLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  parValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  performanceLabelContainer: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  performanceLabelGood: {
    color: '#16a34a',
  },
  performanceLabelBad: {
    color: '#dc2626',
  },
});

export default HoleScoreCard;