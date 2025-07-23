import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { CourseListItem } from '../../types/golf';

interface CourseCardProps {
  course: CourseListItem;
  onPress?: () => void;
  onSelect?: () => void;
  showDistance?: boolean;
  style?: ViewStyle;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onSelect,
  showDistance = true,
  style,
}) => {
  const handleCardPress = () => {
    onPress?.();
  };

  const handleSelectPress = () => {
    onSelect?.();
  };

  const formatLocation = () => {
    if (course.city && course.state) {
      return `${course.city}, ${course.state}`;
    }
    return course.city || course.state || '';
  };

  const formatDistance = () => {
    if (!course.distance) return '';
    if (course.distance < 1) {
      return `${Math.round(course.distance * 1000)}m away`;
    }
    return `${course.distance.toFixed(1)}km away`;
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

        {/* Action Button */}
        {onSelect && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectPress}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>Select Course</Text>
          </TouchableOpacity>
        )}
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
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CourseCard;