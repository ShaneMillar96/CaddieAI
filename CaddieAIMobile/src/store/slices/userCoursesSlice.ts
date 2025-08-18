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
  proximityStatus: {},
  isCheckingProximity: false,
};

// Async thunks
// Helper function to normalize API response data
const normalizeCourseData = (course: any): UserCourse => {
  // Transform courseName to name for consistency with TypeScript interface
  const normalizedCourse = {
    ...course,
    name: course.name || course.courseName, // Use name if available, fallback to courseName
  };
  
  // Remove courseName field if it exists to avoid confusion
  if (normalizedCourse.courseName) {
    delete normalizedCourse.courseName;
  }
  
  console.log('🔄 Redux: Normalized course data:', {
    original: { name: course.name, courseName: course.courseName },
    normalized: { name: normalizedCourse.name }
  });
  
  return normalizedCourse;
};

export const fetchUserCourses = createAsyncThunk(
  'userCourses/fetchUserCourses',
  async (_, { rejectWithValue }) => {
    console.log('🚀 Redux: fetchUserCourses action dispatched');
    try {
      console.log('🔄 Redux: Calling userCoursesApi.getUserCourses()');
      const rawUserCourses = await userCoursesApi.getUserCourses();
      console.log('✅ Redux: fetchUserCourses successful, received', rawUserCourses.length, 'courses');
      
      // Normalize the course data to ensure consistent field names
      const normalizedUserCourses = rawUserCourses.map(normalizeCourseData);
      console.log('🔄 Redux: Normalized', normalizedUserCourses.length, 'courses with consistent field names');
      
      return normalizedUserCourses;
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
      const rawNewCourse = await userCoursesApi.addUserCourse(courseRequest);
      const normalizedNewCourse = normalizeCourseData(rawNewCourse);
      return normalizedNewCourse;
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
      console.log('🔍 Proximity Check: Starting proximity check at coordinates:', { latitude, longitude });
      
      const state = getState() as any;
      const userCourses: UserCourse[] = state.userCourses.userCourses;
      
      console.log(`🏌️ Proximity Check: Checking against ${userCourses.length} user courses`);
      
      const PROXIMITY_THRESHOLD = 1600; // 1 mile (1600 meters) - reasonable for golf courses
      const proximityResults: { [courseId: number]: boolean } = {};
      
      let nearestCourse: { courseId: number; courseName: string; distance: number } | null = null;
      
      for (const course of userCourses) {
        const distance = calculateDistance(
          latitude,
          longitude,
          course.latitude,
          course.longitude
        );
        
        console.log(`📏 Distance to ${course.name}: ${distance.toFixed(1)}m (threshold: ${PROXIMITY_THRESHOLD}m)`);
        
        const isWithinBounds = distance <= PROXIMITY_THRESHOLD;
        proximityResults[course.id] = isWithinBounds;
        
        if (isWithinBounds && (!nearestCourse || distance < nearestCourse.distance)) {
          nearestCourse = {
            courseId: course.id,
            courseName: course.name,
            distance
          };
        }
      }
      
      const hasAnyCoursesInRange = Object.values(proximityResults).some(inRange => inRange);
      
      console.log('✅ Proximity Check Results:', {
        proximityResults,
        nearestCourse,
        hasAnyCoursesInRange
      });
      
      return {
        proximityStatus: proximityResults,
        nearestCourse: nearestCourse ? {
          courseId: nearestCourse.courseId,
          courseName: nearestCourse.courseName,
          isWithinBounds: true,
          distance: nearestCourse.distance,
        } : {
          courseId: null,
          courseName: null,
          isWithinBounds: false,
          distance: null,
        }
      };
    } catch (error: any) {
      console.error('❌ Proximity Check Error:', error);
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
    clearProximityStatus: (state) => {
      state.proximityStatus = {};
      state.isCheckingProximity = false;
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
    builder.addCase(checkProximityToUserCourses.pending, (state) => {
      state.isCheckingProximity = true;
      state.error = null;
    });
    builder.addCase(checkProximityToUserCourses.fulfilled, (state, action) => {
      state.isCheckingProximity = false;
      state.proximityStatus = action.payload.proximityStatus;
      state.error = null;
      console.log('🔄 Redux: Proximity status updated in store:', action.payload.proximityStatus);
    });
    builder.addCase(checkProximityToUserCourses.rejected, (state, action) => {
      state.isCheckingProximity = false;
      state.error = action.payload as string;
      console.error('❌ Redux: Proximity check failed:', action.payload);
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
  clearProximityStatus,
} = userCoursesSlice.actions;

export default userCoursesSlice.reducer;