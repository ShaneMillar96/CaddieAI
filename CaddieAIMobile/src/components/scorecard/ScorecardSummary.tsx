/**
 * Scorecard Summary Component
 * Displays summary statistics and totals for the round
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round } from '../../types';
import roundsApiService from '../../services/roundsApi';

interface ScorecardSummaryProps {
  round: Round;
}

export const ScorecardSummary: React.FC<ScorecardSummaryProps> = ({ round }) => {
  const stats = roundsApiService.calculateRoundStats(round);
  
  // Calculate detailed statistics from hole scores
  const calculateDetailedStats = () => {
    if (!round.holeScores || !round.course?.holes) {
      return {
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeys: 0,
        others: 0,
        totalPutts: round.totalPutts || 0,
        fairwaysHit: round.fairwaysHit || 0,
        greensInRegulation: round.greensInRegulation || 0,
        fairwaysTotal: 0,
        greensTotal: 0,
      };
    }

    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let doubleBogeys = 0;
    let others = 0;
    let totalPutts = 0;
    let fairwaysHit = 0;
    let greensInRegulation = 0;
    let fairwaysTotal = 0;
    let greensTotal = 0;

    // Create a map of hole numbers to course holes for par lookup
    const courseHolesMap = round.course.holes.reduce((map, hole) => {
      map[hole.holeNumber] = hole;
      return map;
    }, {} as Record<number, typeof round.course.holes[0]>);

    round.holeScores.forEach(holeScore => {
      if (holeScore.score) {
        const courseHole = courseHolesMap[holeScore.holeNumber];
        const par = courseHole?.par || 4;
        const diff = holeScore.score - par;

        // Score distribution
        if (diff <= -2) others++; // Eagle or better
        else if (diff === -1) birdies++;
        else if (diff === 0) pars++;
        else if (diff === 1) bogeys++;
        else if (diff === 2) doubleBogeys++;
        else others++; // Triple bogey or worse

        // Statistics
        if (holeScore.putts) totalPutts += holeScore.putts;
        
        // Only count driving holes (Par 4 and 5) for fairway stats
        if (par >= 4) {
          fairwaysTotal++;
          if (holeScore.fairwayHit) fairwaysHit++;
        }
        
        // All holes count for GIR
        greensTotal++;
        if (holeScore.greenInRegulation) greensInRegulation++;
      }
    });

    return {
      birdies,
      pars,
      bogeys,
      doubleBogeys,
      others,
      totalPutts,
      fairwaysHit,
      greensInRegulation,
      fairwaysTotal,
      greensTotal,
    };
  };

  const detailedStats = calculateDetailedStats();

  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  const formatScoreToPar = (score: number, par: number) => {
    const diff = score - par;
    if (diff === 0) return 'Even Par';
    return diff > 0 ? `${diff} Over Par` : `${Math.abs(diff)} Under Par`;
  };

  return (
    <View style={styles.container}>
      {/* Total Score Summary */}
      <View style={styles.totalSection}>
        <Text style={styles.sectionTitle}>Round Summary</Text>
        
        <View style={styles.totalRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalScore}>{stats.totalScore || 0}</Text>
            <Text style={styles.totalLabel}>Total Score</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.totalItem}>
            <Text style={styles.totalPar}>{stats.totalPar}</Text>
            <Text style={styles.totalLabel}>Course Par</Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.totalItem}>
            <Text style={styles.scoreToPar}>
              {stats.totalScore > 0 && stats.totalPar > 0 
                ? formatScoreToPar(stats.totalScore, stats.totalPar)
                : '--'
              }
            </Text>
            <Text style={styles.totalLabel}>To Par</Text>
          </View>
        </View>
      </View>

      {/* Score Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score Distribution</Text>
        
        <View style={styles.distributionGrid}>
          <View style={styles.distributionItem}>
            <Icon name="flight" size={20} color="#dc2626" />
            <Text style={styles.distributionCount}>{detailedStats.others}</Text>
            <Text style={styles.distributionLabel}>Eagles+</Text>
          </View>
          
          <View style={styles.distributionItem}>
            <Icon name="favorite" size={20} color="#ea580c" />
            <Text style={styles.distributionCount}>{detailedStats.birdies}</Text>
            <Text style={styles.distributionLabel}>Birdies</Text>
          </View>
          
          <View style={styles.distributionItem}>
            <Icon name="radio-button-unchecked" size={20} color="#059669" />
            <Text style={styles.distributionCount}>{detailedStats.pars}</Text>
            <Text style={styles.distributionLabel}>Pars</Text>
          </View>
          
          <View style={styles.distributionItem}>
            <Icon name="remove" size={20} color="#0891b2" />
            <Text style={styles.distributionCount}>{detailedStats.bogeys}</Text>
            <Text style={styles.distributionLabel}>Bogeys</Text>
          </View>
          
          <View style={styles.distributionItem}>
            <Icon name="remove" size={20} color="#7c3aed" />
            <Text style={styles.distributionCount}>{detailedStats.doubleBogeys}</Text>
            <Text style={styles.distributionLabel}>Double+</Text>
          </View>
        </View>
      </View>

      {/* Round Statistics */}
      {(detailedStats.totalPutts > 0 || detailedStats.fairwaysTotal > 0 || detailedStats.greensTotal > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Statistics</Text>
          
          <View style={styles.statsGrid}>
            {detailedStats.totalPutts > 0 && (
              <View style={styles.statItem}>
                <Icon name="golf-course" size={24} color="#2c5530" />
                <Text style={styles.statValue}>{detailedStats.totalPutts}</Text>
                <Text style={styles.statLabel}>Total Putts</Text>
                <Text style={styles.statAverage}>
                  {(detailedStats.totalPutts / stats.holesCompleted).toFixed(1)} avg
                </Text>
              </View>
            )}
            
            {detailedStats.fairwaysTotal > 0 && (
              <View style={styles.statItem}>
                <Icon name="timeline" size={24} color="#2c5530" />
                <Text style={styles.statValue}>
                  {detailedStats.fairwaysHit}/{detailedStats.fairwaysTotal}
                </Text>
                <Text style={styles.statLabel}>Fairways Hit</Text>
                <Text style={styles.statPercentage}>
                  {formatPercentage(detailedStats.fairwaysHit, detailedStats.fairwaysTotal)}
                </Text>
              </View>
            )}
            
            {detailedStats.greensTotal > 0 && (
              <View style={styles.statItem}>
                <Icon name="flag" size={24} color="#2c5530" />
                <Text style={styles.statValue}>
                  {detailedStats.greensInRegulation}/{detailedStats.greensTotal}
                </Text>
                <Text style={styles.statLabel}>Greens in Regulation</Text>
                <Text style={styles.statPercentage}>
                  {formatPercentage(detailedStats.greensInRegulation, detailedStats.greensTotal)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Playing Conditions */}
      {(round.temperatureCelsius || round.windSpeedKmh) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playing Conditions</Text>
          
          <View style={styles.conditionsRow}>
            {round.temperatureCelsius && (
              <View style={styles.conditionItem}>
                <Icon name="thermostat" size={20} color="#6b7280" />
                <Text style={styles.conditionText}>
                  {Math.round(round.temperatureCelsius)}°C
                </Text>
              </View>
            )}
            
            {round.windSpeedKmh && (
              <View style={styles.conditionItem}>
                <Icon name="air" size={20} color="#6b7280" />
                <Text style={styles.conditionText}>
                  {Math.round(round.windSpeedKmh)} km/h wind
                </Text>
              </View>
            )}
          </View>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 20,
  },
  totalSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  totalItem: {
    alignItems: 'center',
    flex: 1,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  totalScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  totalPar: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6b7280',
  },
  scoreToPar: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  distributionItem: {
    alignItems: 'center',
    minWidth: 60,
    marginVertical: 8,
  },
  distributionCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  distributionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 100,
    marginVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  statAverage: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  statPercentage: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  conditionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
});

export default ScorecardSummary;