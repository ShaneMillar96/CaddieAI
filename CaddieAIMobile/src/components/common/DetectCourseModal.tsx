import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  addUserCourse,
  hideDetectCourseModal,
} from '../../store/slices/userCoursesSlice';
import { AddUserCourseRequest } from '../../types/golf';
import { LoadingSpinner } from '../auth/LoadingSpinner';

interface DetectCourseModalProps {
  visible: boolean;
}

export const DetectCourseModal: React.FC<DetectCourseModalProps> = ({ visible }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    currentDetectedCourse,
    isAdding,
    error,
  } = useSelector((state: RootState) => state.userCourses);

  const handleAddCourse = async () => {
    if (!currentDetectedCourse) return;

    try {
      // Extract address components from the detected course address
      const addressParts = currentDetectedCourse.address.split(', ');
      let city = '';
      let state = '';
      let country = '';
      
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 2] || '';
        const lastPart = addressParts[addressParts.length - 1] || '';
        
        // Simple heuristic to determine if last part contains state/country
        if (lastPart.length <= 5) {
          state = lastPart;
          country = 'US'; // Default to US for short codes
        } else {
          country = lastPart;
        }
      }

      const courseRequest: AddUserCourseRequest = {
        courseName: currentDetectedCourse.name,
        address: currentDetectedCourse.address,
        city: city || undefined,
        state: state || undefined,
        country: country || 'US', // Default to US
        latitude: currentDetectedCourse.latitude,
        longitude: currentDetectedCourse.longitude,
        totalHoles: 18, // Default to 18 holes
      };

      await dispatch(addUserCourse(courseRequest)).unwrap();
      
      Alert.alert(
        'Course Added',
        `${currentDetectedCourse.name} has been added to your courses!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error || 'Failed to add course. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    dispatch(hideDetectCourseModal());
  };

  if (!visible || !currentDetectedCourse) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Icon name="golf-course" size={32} color="#2c5530" />
            <Text style={styles.title}>Course Detected</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.question}>
              Are you currently at this golf course?
            </Text>
            
            <View style={styles.courseInfo}>
              <Text style={styles.courseName} numberOfLines={2}>
                {currentDetectedCourse.name}
              </Text>
              <Text style={styles.courseAddress} numberOfLines={3}>
                {currentDetectedCourse.address}
              </Text>
              
              <View style={styles.metaInfo}>
                <View style={styles.metaItem}>
                  <Icon name="location-on" size={16} color="#666" />
                  <Text style={styles.metaText}>
                    {Math.round(currentDetectedCourse.distance)}m away
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="verified" size={16} color="#666" />
                  <Text style={styles.metaText}>
                    {Math.round(currentDetectedCourse.confidence * 100)}% confidence
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isAdding}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={handleAddCourse}
              disabled={isAdding}
              activeOpacity={0.8}
            >
              {isAdding ? (
                <LoadingSpinner size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="add" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.addButtonText}>Add Course</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 8,
  },
  content: {
    padding: 24,
  },
  question: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  courseInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 8,
  },
  courseAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  addButton: {
    backgroundColor: '#2c5530',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DetectCourseModal;