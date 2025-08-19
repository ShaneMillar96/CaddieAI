import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round } from '../../types/golf';
import { HoleScoreCard } from './HoleScoreCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OVERLAY_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width

export interface ScorecardOverlayProps {
  visible: boolean;
  activeRound: Round | null;
  currentHole: number;
  onClose: () => void;
}

/**
 * ScorecardOverlay Component
 * 
 * Main scorecard overlay that displays all hole scores in a slide-in overlay.
 * Provides quick access to round progress and scoring information.
 * 
 * Features:
 * - All 18+ holes displayed in scrollable grid
 * - Real-time score updates from Redux
 * - Live statistics calculation
 * - Color-coded performance indicators
 * - Current hole highlighting
 * - Slide-in animation from right
 */
export const ScorecardOverlay: React.FC<ScorecardOverlayProps> = ({
  visible,
  activeRound,
  currentHole,
  onClose,
}) => {
  // Animation value for slide-in effect
  const slideAnim = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      // Slide in from right with spring animation
      Animated.spring(slideAnim, {
        toValue: SCREEN_WIDTH - OVERLAY_WIDTH,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
        overshootClamping: true,
      }).start();
    } else {
      // Slide out to right with timing animation
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, slideAnim]);

  // Calculate round statistics
  const roundStats = useMemo(() => {
    if (!activeRound?.holeScores || !activeRound?.course?.holes) {
      return {
        totalScore: 0,
        holesCompleted: 0,
        totalPar: 0,
        overUnderPar: 0,
        courseName: activeRound?.course?.name || 'Unknown Course',
        totalHoles: activeRound?.course?.totalHoles || 18,
      };
    }

    const holeScores = activeRound.holeScores;
    const courseHoles = activeRound.course.holes;
    
    const completedHoles = holeScores.length;
    const totalScore = holeScores.reduce((sum, score) => sum + score.score, 0);
    
    // Calculate total par for completed holes only
    const totalPar = holeScores.reduce((sum, score) => {
      const hole = courseHoles.find(h => h.holeNumber === score.holeNumber);
      return sum + (hole?.par || 0);
    }, 0);
    
    const overUnderPar = totalScore - totalPar;

    return {
      totalScore,
      holesCompleted: completedHoles,
      totalPar,
      overUnderPar,
      courseName: activeRound.course.name,
      totalHoles: activeRound.course.totalHoles,
    };
  }, [activeRound]);

  // Create hole data for display
  const holeData = useMemo(() => {
    if (!activeRound?.course?.holes) {
      return [];
    }

    const holes = [];
    const totalHoles = Math.max(activeRound.course.totalHoles, 18);
    
    for (let i = 1; i <= totalHoles; i++) {
      const courseHole = activeRound.course.holes.find(h => h.holeNumber === i);
      const holeScore = activeRound.holeScores?.find(hs => hs.holeNumber === i);
      
      holes.push({
        holeNumber: i,
        par: courseHole?.par || null,
        score: holeScore?.score || null,
        isCurrentHole: i === currentHole,
      });
    }
    
    return holes;
  }, [activeRound, currentHole]);

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Background Overlay */}
      <TouchableOpacity
        style={styles.backgroundOverlay}
        activeOpacity={1}
        onPress={onClose}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close scorecard"
        accessibilityHint="Tap to close the scorecard overlay"
      />
      
      {/* Scorecard Overlay Panel */}
      <Animated.View
        style={[
          styles.overlayPanel,
          {
            left: slideAnim,
            width: OVERLAY_WIDTH,
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon name="golf-course" size={24} color="#4a7c59" />
            <View style={styles.headerText}>
              <Text style={styles.courseName} numberOfLines={1}>
                {roundStats.courseName}
              </Text>
              <Text style={styles.scorecardLabel}>Scorecard</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close scorecard"
            accessibilityHint="Close the scorecard overlay"
          >
            <Icon name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Round Statistics */}
        <View 
          style={styles.statisticsSection}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Round statistics: Total score ${roundStats.totalScore}, ${roundStats.holesCompleted} holes played, ${roundStats.overUnderPar > 0 ? 'over' : roundStats.overUnderPar < 0 ? 'under' : 'even'} par by ${Math.abs(roundStats.overUnderPar)}`}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{roundStats.totalScore}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{roundStats.holesCompleted}</Text>
            <Text style={styles.statLabel}>Holes Played</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[
              styles.statValue,
              roundStats.overUnderPar > 0 ? styles.statValueOver : styles.statValueUnder
            ]}>
              {roundStats.overUnderPar > 0 ? '+' : ''}{roundStats.overUnderPar}
            </Text>
            <Text style={styles.statLabel}>vs Par</Text>
          </View>
        </View>

        {/* Holes Grid */}
        <ScrollView
          style={styles.holesScrollView}
          contentContainerStyle={styles.holesContainer}
          showsVerticalScrollIndicator={true}
          accessible={true}
          accessibilityRole="scrollbar"
          accessibilityLabel={`Scorecard for all ${roundStats.totalHoles} holes`}
          accessibilityHint="Scroll to view all holes in the round"
        >
          <View style={styles.holesGrid}>
            {holeData.map((hole) => (
              <View key={hole.holeNumber} style={styles.holeCardWrapper}>
                <HoleScoreCard
                  holeNumber={hole.holeNumber}
                  par={hole.par}
                  score={hole.score}
                  isCurrentHole={hole.isCurrentHole}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap outside to close
          </Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  overlayPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 1001,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 2,
  },
  scorecardLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statisticsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  statValueOver: {
    color: '#dc2626', // Red for over par
  },
  statValueUnder: {
    color: '#16a34a', // Green for under par
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  holesScrollView: {
    flex: 1,
  },
  holesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  holesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  holeCardWrapper: {
    width: '48%', // Two columns with some spacing
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 20, // Extra padding for safe area
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ScorecardOverlay;