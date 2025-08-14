import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CourseListItem } from '../../types/golf';

interface CourseCardProps {
  course: CourseListItem;
  onPress?: () => void;
  onSelect?: () => void;
  onPlayGolf?: () => void;
  showDistance?: boolean;
  showPlayGolf?: boolean;
  isWithinBounds?: boolean;
  playGolfDisabled?: boolean;
  playGolfText?: string;
  selectButtonText?: string;
  style?: ViewStyle;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onSelect,
  onPlayGolf,
  showDistance = true,
  showPlayGolf = false,
  isWithinBounds = false,
  playGolfDisabled = false,
  playGolfText = "Play Golf",
  selectButtonText = "Select Course",
  style,
}) => {
  const handleCardPress = () => {
    onPress?.();
  };

  const handleSelectPress = () => {
    onSelect?.();
  };

  const handlePlayGolfPress = () => {
    onPlayGolf?.();
  };

  const formatLocation = () => {
    if (course.city && course.state) {
      return `${course.city}, ${course.state}`;
    }
    return course.city || course.state || '';
  };

  const formatDistance = () => {
    if (!course.distance) return '';
    // Distance is already in miles from CoursesScreen
    if (course.distance < 0.1) {
      // Very close - show in feet
      const feet = Math.round(course.distance * 5280);
      return `${feet} ft away`;
    } else if (course.distance < 1) {
      // Less than 1 mile - show with 1 decimal
      return `${course.distance.toFixed(1)} miles away`;
    } else {
      // 1 mile or more - show with appropriate precision
      if (course.distance < 10) {
        return `${course.distance.toFixed(1)} miles away`;
      } else {
        return `${Math.round(course.distance)} miles away`;
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Course Header */}
        <View style={styles.header}>
          <Text style={styles.courseName} numberOfLines={2}>
            {course.name}
          </Text>
          {showDistance && course.distance && (
            <Text style={styles.distance}>{formatDistance()}</Text>
          )}
        </View>

        {/* Course Location */}
        {formatLocation() && (
          <Text style={styles.location} numberOfLines={1}>
            {formatLocation()}
          </Text>
        )}

        {/* Course Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{course.totalHoles}</Text>
            <Text style={styles.statLabel}>Holes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Par {course.parTotal}</Text>
            <Text style={styles.statLabel}>Par</Text>
          </View>
          {course.difficulty && (
            <View style={[styles.statItem, styles.difficultyBadge]}>
              <Text style={styles.difficultyText}>
                {course.difficulty === 1 ? 'Beginner' :
                 course.difficulty === 2 ? 'Intermediate' :
                 course.difficulty === 3 ? 'Advanced' : 'Championship'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {onSelect && (
            <TouchableOpacity
              style={[styles.selectButton, showPlayGolf && styles.selectButtonSecondary]}
              onPress={handleSelectPress}
              activeOpacity={0.8}
            >
              <Text style={[styles.selectButtonText, showPlayGolf && styles.selectButtonTextSecondary]}>
                {selectButtonText}
              </Text>
            </TouchableOpacity>
          )}
          
          {showPlayGolf && onPlayGolf && (
            <TouchableOpacity
              style={[
                styles.playGolfButton,
                (playGolfDisabled || !isWithinBounds) ? styles.playGolfButtonDisabled : styles.playGolfButtonEnabled
              ]}
              onPress={handlePlayGolfPress}
              disabled={playGolfDisabled || !isWithinBounds}
              activeOpacity={0.8}
            >
              <Icon 
                name="play-circle-filled" 
                size={18} 
                color={(playGolfDisabled || !isWithinBounds) ? '#ccc' : '#fff'} 
                style={styles.playIcon}
              />
              <Text style={[
                styles.playGolfButtonText,
                (playGolfDisabled || !isWithinBounds) ? styles.playGolfButtonTextDisabled : styles.playGolfButtonTextEnabled
              ]}>
                {playGolfText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4a7c59',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  difficultyBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a7c59',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    backgroundColor: '#2c5530',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  selectButtonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2c5530',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextSecondary: {
    color: '#2c5530',
  },
  playGolfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  playGolfButtonEnabled: {
    backgroundColor: '#2c5530',
  },
  playGolfButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  playIcon: {
    marginRight: 6,
  },
  playGolfButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  playGolfButtonTextEnabled: {
    color: '#fff',
  },
  playGolfButtonTextDisabled: {
    color: '#ccc',
  },
});

export default CourseCard;