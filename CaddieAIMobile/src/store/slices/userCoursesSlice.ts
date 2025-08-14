import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  UserCoursesState,
  UserCourse,
  CourseDetectionResult,
  AddUserCourseRequest,
} from '../../types/golf';
import { userCoursesApi } from '../../services/userCoursesApi';
import { CourseDetectionService } from '../../services/CourseDetectionService';

const initialState: UserCoursesState = {
  userCourses: [],
  nearbyDetectedCourses: [],
  isLoading: false,
  isDetecting: false,
  isAdding: false,
  error: null,
  currentDetectedCourse: null,
  showCoursePrompt: false,
  showDetectModal: false,
  lastDetectionLocation: null,
};

// Async thunks
export const fetchUserCourses = createAsyncThunk(
  'userCourses/fetchUserCourses',
  async (_, { rejectWithValue }) => {
    console.log('🚀 Redux: fetchUserCourses action dispatched');
    try {
      console.log('🔄 Redux: Calling userCoursesApi.getUserCourses()');
      const userCourses = await userCoursesApi.getUserCourses();
      console.log('✅ Redux: fetchUserCourses successful, received', userCourses.length, 'courses');
      return userCourses;
    } catch (error: any) {
      console.error('❌ Redux: fetchUserCourses failed:', error.message);
      return rejectWithValue(error.message || 'Failed to fetch user courses');
    }
  }
);

export const addUserCourse = createAsyncThunk(
  'userCourses/addUserCourse',
  async (courseRequest: AddUserCourseRequest, { rejectWithValue }) => {
    try {
      const newCourse = await userCoursesApi.addUserCourse(courseRequest);
      return newCourse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add course');
    }
  }
);

export const removeUserCourse = createAsyncThunk(
  'userCourses/removeUserCourse',
  async (courseId: number, { rejectWithValue }) => {
    try {
      await userCoursesApi.removeUserCourse(courseId);
      return courseId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove course');
    }
  }
);

export const detectCurrentCourse = createAsyncThunk(
  'userCourses/detectCurrentCourse',
  async ({ latitude, longitude }: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      const detectionService = new CourseDetectionService();
      const detectedCourse = await detectionService.detectCurrentCourse(latitude, longitude);
      return {
        course: detectedCourse,
        location: { latitude, longitude },
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to detect current course');
    }
  }
);

export const detectNearbyCourses = createAsyncThunk(
  'userCourses/detectNearbyCourses',
  async ({ latitude, longitude }: { latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      const detectionService = new CourseDetectionService();
      const detectedCourses = await detectionService.detectNearbyGolfCourses(latitude, longitude);
      return {
        courses: detectedCourses,
        location: { latitude, longitude },
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to detect nearby courses');
    }
  }
);

export const checkProximityToUserCourses = createAsyncThunk(
  'userCourses/checkProximity',
  async ({ latitude, longitude }: { latitude: number; longitude: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const userCourses: UserCourse[] = state.userCourses.userCourses;
      
      const PROXIMITY_THRESHOLD = 100; // 100 meters
      
      for (const course of userCourses) {
        const distance = calculateDistance(
          latitude,
          longitude,
          course.latitude,
          course.longitude
        );
        
        if (distance <= PROXIMITY_THRESHOLD) {
          return {
            courseId: course.id,
            courseName: course.name,
            isWithinBounds: true,
            distance,
          };
        }
      }
      
      return {
        courseId: null,
        courseName: null,
        isWithinBounds: false,
        distance: null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check proximity');
    }
  }
);

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};

const userCoursesSlice = createSlice({
  name: 'userCourses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDetectedCourse: (state, action: PayloadAction<CourseDetectionResult | null>) => {
      state.currentDetectedCourse = action.payload;
      state.showCoursePrompt = action.payload !== null;
    },
    dismissCoursePrompt: (state) => {
      state.showCoursePrompt = false;
      state.currentDetectedCourse = null;
    },
    showDetectCourseModal: (state, action: PayloadAction<CourseDetectionResult>) => {
      state.currentDetectedCourse = action.payload;
      state.showDetectModal = true;
    },
    hideDetectCourseModal: (state) => {
      state.showDetectModal = false;
      state.currentDetectedCourse = null;
    },
    clearDetectedCourses: (state) => {
      state.nearbyDetectedCourses = [];
      state.currentDetectedCourse = null;
      state.showCoursePrompt = false;
      state.showDetectModal = false;
      state.lastDetectionLocation = null;
    },
    updateCoursePlayCount: (state, action: PayloadAction<{ courseId: number; score?: number }>) => {
      const { courseId, score } = action.payload;
      const course = state.userCourses.find(c => c.id === courseId);
      if (course) {
        course.timesPlayed += 1;
        course.lastPlayedDate = new Date().toISOString();
        if (score !== undefined) {
          // Calculate running average score
          if (course.averageScore) {
            course.averageScore = ((course.averageScore * (course.timesPlayed - 1)) + score) / course.timesPlayed;
          } else {
            course.averageScore = score;
          }
        }
      }
    },
    resetUserCoursesState: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    // Fetch user courses
    builder.addCase(fetchUserCourses.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchUserCourses.fulfilled, (state, action) => {
      state.isLoading = false;
      state.userCourses = action.payload;
    });
    builder.addCase(fetchUserCourses.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Add user course
    builder.addCase(addUserCourse.pending, (state) => {
      state.isAdding = true;
      state.error = null;
    });
    builder.addCase(addUserCourse.fulfilled, (state, action) => {
      state.isAdding = false;
      state.userCourses.push(action.payload);
      state.showCoursePrompt = false;
      state.showDetectModal = false;
      state.currentDetectedCourse = null;
    });
    builder.addCase(addUserCourse.rejected, (state, action) => {
      state.isAdding = false;
      state.error = action.payload as string;
    });

    // Remove user course
    builder.addCase(removeUserCourse.fulfilled, (state, action) => {
      state.userCourses = state.userCourses.filter(course => course.id !== action.payload);
    });
    builder.addCase(removeUserCourse.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Detect current course
    builder.addCase(detectCurrentCourse.pending, (state) => {
      state.isDetecting = true;
      state.error = null;
    });
    builder.addCase(detectCurrentCourse.fulfilled, (state, action) => {
      state.isDetecting = false;
      state.lastDetectionLocation = action.payload.location;
      
      if (action.payload.course) {
        state.currentDetectedCourse = action.payload.course;
        state.showDetectModal = true;
      } else {
        state.error = 'No golf course detected at your current location';
      }
    });
    builder.addCase(detectCurrentCourse.rejected, (state, action) => {
      state.isDetecting = false;
      state.error = action.payload as string;
    });

    // Detect nearby courses
    builder.addCase(detectNearbyCourses.pending, (state) => {
      state.isDetecting = true;
      state.error = null;
    });
    builder.addCase(detectNearbyCourses.fulfilled, (state, action) => {
      state.isDetecting = false;
      state.nearbyDetectedCourses = action.payload.courses;
      state.lastDetectionLocation = action.payload.location;
      
      // If we found a course with high confidence, set it as current detected course
      const highConfidenceCourse = action.payload.courses.find(
        course => course.confidence > 0.8 && course.distance < 50
      );
      if (highConfidenceCourse) {
        state.currentDetectedCourse = highConfidenceCourse;
        state.showCoursePrompt = true;
      }
    });
    builder.addCase(detectNearbyCourses.rejected, (state, action) => {
      state.isDetecting = false;
      state.error = action.payload as string;
    });

    // Check proximity to user courses
    builder.addCase(checkProximityToUserCourses.fulfilled, (state) => {
      // Update handled in components that need proximity info
      state.error = null;
    });
    builder.addCase(checkProximityToUserCourses.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export const {
  clearError,
  setCurrentDetectedCourse,
  dismissCoursePrompt,
  showDetectCourseModal,
  hideDetectCourseModal,
  clearDetectedCourses,
  updateCoursePlayCount,
  resetUserCoursesState,
} = userCoursesSlice.actions;

export default userCoursesSlice.reducer;