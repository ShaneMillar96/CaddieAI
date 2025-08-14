import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CourseDetectionResult } from '../../types/golf';

interface CourseDetectionBannerProps {
  detectedCourse: CourseDetectionResult | null;
  visible: boolean;
  onAddCourse: (course: CourseDetectionResult) => void;
  onDismiss: () => void;
  isAdding: boolean;
}

export const CourseDetectionBanner: React.FC<CourseDetectionBannerProps> = ({
  detectedCourse,
  visible,
  onAddCourse,
  onDismiss,
  isAdding = false,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const { width } = Dimensions.get('window');

  React.useEffect(() => {
    if (visible && detectedCourse) {
      // Slide in from top
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to top
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, detectedCourse, slideAnim]);

  if (!detectedCourse || !visible) {
    return null;
  }

  const handleAddCourse = () => {
    onAddCourse(detectedCourse);
  };

  const formatDistance = (distanceMeters: number): string => {
    if (distanceMeters < 100) {
      return `${Math.round(distanceMeters)}m away`;
    } else if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters / 10) * 10}m away`;
    } else {
      const km = distanceMeters / 1000;
      return `${km.toFixed(1)}km away`;
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4CAF50'; // Green - high confidence
    if (confidence >= 0.6) return '#FF9800'; // Orange - medium confidence
    return '#F44336'; // Red - low confidence
  };

  const getPlaceTypeIcon = (placeType: string): string => {
    switch (placeType) {
      case 'country_club': return 'business';
      case 'resort': return 'hotel';
      default: return 'golf-course';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          width: width - 32,
        }
      ]}
    >
      <View style={styles.content}>
        {/* Course Info Section */}
        <View style={styles.courseInfo}>
          <View style={styles.courseHeader}>
            <Icon 
              name={getPlaceTypeIcon(detectedCourse.placeType)} 
              size={20} 
              color="#2c5530" 
              style={styles.courseIcon}
            />
            <Text style={styles.courseName} numberOfLines={1}>
              {detectedCourse.name}
            </Text>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(detectedCourse.confidence) }
            ]}>
              <Text style={styles.confidenceText}>
                {Math.round(detectedCourse.confidence * 100)}%
              </Text>
            </View>
          </View>
          
          <Text style={styles.courseAddress} numberOfLines={1}>
            {detectedCourse.address}
          </Text>
          
          <Text style={styles.courseDistance}>
            {formatDistance(detectedCourse.distance)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.addButtonDisabled]}
            onPress={handleAddCourse}
            disabled={isAdding}
            activeOpacity={0.7}
          >
            {isAdding ? (
              <>
                <Icon name="hourglass-empty" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addButtonText}>Adding...</Text>
              </>
            ) : (
              <>
                <Icon name="add" size={16} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addButtonText}>Add Course</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Detection Message */}
      <View style={styles.detectionMessage}>
        <Icon name="location-on" size={16} color="#4a7c59" />
        <Text style={styles.detectionText}>
          You're at a golf course! Add it to your collection?
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar and any headers
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseIcon: {
    marginRight: 6,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c5530',
    flex: 1,
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  courseAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  courseDistance: {
    fontSize: 12,
    color: '#4a7c59',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  addButton: {
    backgroundColor: '#2c5530',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detectionMessage: {
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8f5e8',
  },
  detectionText: {
    fontSize: 13,
    color: '#4a7c59',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
});

export default CourseDetectionBanner;