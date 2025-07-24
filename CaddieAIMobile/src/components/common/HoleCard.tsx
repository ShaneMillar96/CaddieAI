import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Hole } from '../../types/golf';

interface HoleCardProps {
  hole: Hole;
  style?: ViewStyle;
}

export const HoleCard: React.FC<HoleCardProps> = ({ hole, style }) => {
  const formatYardage = () => {
    if (hole.yardageMen && hole.yardageWomen) {
      return `${hole.yardageMen}/${hole.yardageWomen} yds`;
    } else if (hole.yardageMen) {
      return `${hole.yardageMen} yds`;
    } else if (hole.yardageWomen) {
      return `${hole.yardageWomen} yds`;
    }
    return 'N/A';
  };

  const getParColor = (par: number) => {
    switch (par) {
      case 3:
        return '#4CAF50'; // Green for par 3
      case 4:
        return '#2196F3'; // Blue for par 4
      case 5:
        return '#FF9800'; // Orange for par 5
      default:
        return '#666';
    }
  };

  const getDifficultyIcon = (handicap?: number) => {
    if (!handicap) return null;
    
    if (handicap <= 6) {
      return '●●●'; // Most difficult
    } else if (handicap <= 12) {
      return '●●○'; // Moderate
    } else {
      return '●○○'; // Least difficult
    }
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>Hole {hole.holeNumber}</Text>
          <View style={[styles.parBadge, { backgroundColor: getParColor(hole.par) }]}>
            <Text style={styles.parText}>Par {hole.par}</Text>
          </View>
        </View>
        <View style={styles.yardageContainer}>
          <Text style={styles.yardage}>{formatYardage()}</Text>
          {hole.handicap && (
            <View style={styles.handicapContainer}>
              <Text style={styles.handicapLabel}>HCP</Text>
              <Text style={styles.handicapNumber}>{hole.handicap}</Text>
              <Text style={styles.difficultyIcons}>
                {getDifficultyIcon(hole.handicap)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {hole.description && (
        <Text style={styles.description} numberOfLines={2}>
          {hole.description}
        </Text>
      )}

      {/* Hazards */}
      {hole.hazards && hole.hazards.length > 0 && (
        <View style={styles.hazardsContainer}>
          <Text style={styles.hazardsLabel}>Hazards:</Text>
          <View style={styles.hazardsList}>
            {hole.hazards.map((hazard, index) => (
              <View key={index} style={styles.hazardBadge}>
                <Text style={styles.hazardText}>{hazard}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Playing Tips */}
      {hole.playingTips && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsLabel}>Pro Tip:</Text>
          <Text style={styles.tipsText} numberOfLines={3}>
            {hole.playingTips}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  holeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
    marginRight: 12,
  },
  parBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  parText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  yardageContainer: {
    alignItems: 'flex-end',
  },
  yardage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  handicapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handicapLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  handicapNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c5530',
  },
  difficultyIcons: {
    fontSize: 8,
    color: '#FF6B35',
    marginLeft: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  hazardsContainer: {
    marginBottom: 12,
  },
  hazardsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 6,
  },
  hazardsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hazardBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  hazardText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#f0f8f0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: '#2c5530',
    lineHeight: 18,
  },
});

export default HoleCard;