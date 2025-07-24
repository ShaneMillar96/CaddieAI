import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HoleScore } from '../../types/golf';

interface HoleNavigatorProps {
  totalHoles: number;
  currentHole: number;
  onHoleSelect: (holeNumber: number) => void;
  holeScores: HoleScore[];
}

const HoleNavigator: React.FC<HoleNavigatorProps> = ({
  totalHoles,
  currentHole,
  onHoleSelect,
  holeScores,
}) => {
  // Create array of hole numbers
  const holes = Array.from({ length: totalHoles }, (_, i) => i + 1);

  // Get score for a specific hole
  const getHoleScore = (holeNumber: number): HoleScore | undefined => {
    return holeScores.find(score => {
      // We'll need to match by hole number since we don't have a direct hole ID mapping
      // This is a temporary solution until we have proper hole data
      return score.holeId === holeNumber; // This would need to be adjusted based on actual data structure
    });
  };

  // Get hole status and styling
  const getHoleStatus = (holeNumber: number) => {
    const score = getHoleScore(holeNumber);
    const isCurrent = holeNumber === currentHole;
    const isCompleted = !!score;

    if (isCurrent) {
      return {
        backgroundColor: '#4a7c59',
        borderColor: '#4a7c59',
        textColor: '#fff',
        icon: null,
      };
    }

    if (isCompleted && score) {
      // Determine score color based on performance
      const par = 4; // Default par, would come from hole data in real implementation
      const scoreToPar = score.score - par;
      
      let backgroundColor = '#e9ecef';
      let borderColor = '#dee2e6';
      
      if (scoreToPar <= -2) {
        backgroundColor = '#28a745'; // Eagle or better
        borderColor = '#28a745';
      } else if (scoreToPar === -1) {
        backgroundColor = '#17a2b8'; // Birdie
        borderColor = '#17a2b8';
      } else if (scoreToPar === 0) {
        backgroundColor = '#6c757d'; // Par
        borderColor = '#6c757d';
      } else if (scoreToPar === 1) {
        backgroundColor = '#ffc107'; // Bogey
        borderColor = '#ffc107';
      } else if (scoreToPar >= 2) {
        backgroundColor = '#dc3545'; // Double bogey or worse
        borderColor = '#dc3545';
      }

      return {
        backgroundColor,
        borderColor,
        textColor: '#fff',
        icon: 'check',
      };
    }

    // Not played yet
    return {
      backgroundColor: '#fff',
      borderColor: '#dee2e6',
      textColor: '#6c757d',
      icon: null,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hole Navigator</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4a7c59' }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6c757d' }]} />
            <Text style={styles.legendText}>Played</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dee2e6' }]} />
            <Text style={styles.legendText}>Unplayed</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.holesContainer}
        style={styles.scrollView}
      >
        {holes.map((holeNumber) => {
          const status = getHoleStatus(holeNumber);
          const score = getHoleScore(holeNumber);

          return (
            <TouchableOpacity
              key={holeNumber}
              style={[
                styles.holeButton,
                {
                  backgroundColor: status.backgroundColor,
                  borderColor: status.borderColor,
                },
              ]}
              onPress={() => onHoleSelect(holeNumber)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.holeNumber,
                  { color: status.textColor },
                ]}
              >
                {holeNumber}
              </Text>
              
              {status.icon && (
                <Icon
                  name={status.icon}
                  size={12}
                  color={status.textColor}
                  style={styles.holeIcon}
                />
              )}

              {score && (
                <Text
                  style={[
                    styles.holeScore,
                    { color: status.textColor },
                  ]}
                >
                  {score.score}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Quick navigation buttons */}
      <View style={styles.quickNav}>
        <TouchableOpacity
          style={[
            styles.quickNavButton,
            currentHole === 1 && styles.quickNavButtonDisabled,
          ]}
          onPress={() => onHoleSelect(Math.max(1, currentHole - 1))}
          disabled={currentHole === 1}
        >
          <Icon name="chevron-left" size={20} color={currentHole === 1 ? '#ccc' : '#4a7c59'} />
          <Text style={[
            styles.quickNavText,
            { color: currentHole === 1 ? '#ccc' : '#4a7c59' },
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.currentHoleDisplay}>
          <Text style={styles.currentHoleLabel}>Current Hole</Text>
          <Text style={styles.currentHoleNumber}>{currentHole}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.quickNavButton,
            currentHole === totalHoles && styles.quickNavButtonDisabled,
          ]}
          onPress={() => onHoleSelect(Math.min(totalHoles, currentHole + 1))}
          disabled={currentHole === totalHoles}
        >
          <Text style={[
            styles.quickNavText,
            { color: currentHole === totalHoles ? '#ccc' : '#4a7c59' },
          ]}>
            Next
          </Text>
          <Icon name="chevron-right" size={20} color={currentHole === totalHoles ? '#ccc' : '#4a7c59'} />
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(holeScores.length / totalHoles) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {holeScores.length} of {totalHoles} holes completed
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  scrollView: {
    marginBottom: 16,
  },
  holesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  holeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  holeNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  holeIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  holeScore: {
    position: 'absolute',
    bottom: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  quickNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  quickNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  quickNavButtonDisabled: {
    backgroundColor: '#f8f9fa',
  },
  quickNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentHoleDisplay: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  currentHoleLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
  },
  currentHoleNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a7c59',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
});

export default HoleNavigator;