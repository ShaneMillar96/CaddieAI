import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { SkillLevel } from '../../types';

export interface SkillLevelDisplayProps {
  skillLevel: SkillLevel;
  handicap?: number;
  compact?: boolean;
  showHandicap?: boolean;
}

export const SkillLevelDisplay: React.FC<SkillLevelDisplayProps> = ({
  skillLevel,
  handicap,
  compact = false,
  showHandicap = true,
}) => {
  const getSkillLevelInfo = () => {
    switch (skillLevel) {
      case SkillLevel.Beginner:
        return {
          label: 'Beginner',
          description: 'Learning the basics',
          icon: 'school',
          color: '#4CAF50',
          backgroundColor: '#e8f5e8',
        };
      case SkillLevel.Intermediate:
        return {
          label: 'Intermediate',
          description: 'Building consistency',
          icon: 'trending-up',
          color: '#2196F3',
          backgroundColor: '#e3f2fd',
        };
      case SkillLevel.Advanced:
        return {
          label: 'Advanced',
          description: 'Skilled player',
          icon: 'star',
          color: '#FF9800',
          backgroundColor: '#fff3e0',
        };
      case SkillLevel.Professional:
        return {
          label: 'Professional',
          description: 'Expert level',
          icon: 'emoji-events',
          color: '#9C27B0',
          backgroundColor: '#f3e5f5',
        };
      default:
        return {
          label: 'Unknown',
          description: 'Skill level not set',
          icon: 'help',
          color: '#9e9e9e',
          backgroundColor: '#f5f5f5',
        };
    }
  };

  const skillInfo = getSkillLevelInfo();

  const formatHandicap = (handicap?: number) => {
    if (handicap === undefined || handicap === null) return 'No handicap';
    if (handicap === 0) return 'Scratch';
    if (handicap > 0) return `+${handicap}`;
    return `${Math.abs(handicap)}`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactIcon, { backgroundColor: skillInfo.backgroundColor }]}>
          <Icon name={skillInfo.icon} size={16} color={skillInfo.color} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactLabel}>{skillInfo.label}</Text>
          {showHandicap && handicap !== undefined && (
            <Text style={styles.compactHandicap}>{formatHandicap(handicap)}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: skillInfo.backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name={skillInfo.icon} size={24} color={skillInfo.color} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.skillLabel, { color: skillInfo.color }]}>
            {skillInfo.label}
          </Text>
          <Text style={styles.skillDescription}>{skillInfo.description}</Text>
        </View>
      </View>

      {showHandicap && (
        <View style={styles.handicapContainer}>
          <Icon name="golf-course" size={16} color="#666" />
          <Text style={styles.handicapLabel}>Handicap:</Text>
          <Text style={styles.handicapValue}>{formatHandicap(handicap)}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          AI advice tailored to your skill level
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
  },
  skillLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c5530',
  },
  skillDescription: {
    fontSize: 14,
    color: '#666',
  },
  handicapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
  },
  handicapLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 8,
  },
  handicapValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
  },
  compactHandicap: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default SkillLevelDisplay;