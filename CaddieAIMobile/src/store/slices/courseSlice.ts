import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CourseState,
  Course,
  CourseListItem,
  CourseSearchRequest,
  NearbyCoursesRequest,
  PaginatedResponse
} from '../../types';
import courseApi from '../../services/courseApi';

const initialState: CourseState = {
  courses: [],
  selectedCourse: null,
  nearbyCourses: [],
  searchResults: [],
  pagination: null,
  isLoading: false,
  isSearching: false,
  isLoadingNearby: false,
  error: null,
  searchQuery: '',
  lastLocation: null,
};

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }, { rejectWithValue }) => {
    try {
      const response = await courseApi.getCourses(page, pageSize);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch courses');
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const course = await courseApi.getCourseById(courseId);
      return course;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch course details');
    }
  }
);


export const searchCourses = createAsyncThunk(
  'courses/searchCourses',
  async (searchRequest: CourseSearchRequest, { rejectWithValue }) => {
    try {
      const response = await courseApi.searchCourses(searchRequest);
      return { response, query: searchRequest.query || '' };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search courses');
    }
  }
);

export const fetchNearbyCourses = createAsyncThunk(
  'courses/fetchNearbyCourses',
  async (nearbyRequest: NearbyCoursesRequest, { rejectWithValue }) => {
    try {
      const courses = await courseApi.getNearby(nearbyRequest);
      return { courses, location: { latitude: nearbyRequest.latitude, longitude: nearbyRequest.longitude } };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch nearby courses');
    }
  }
);

export const checkWithinCourseBounds = createAsyncThunk(
  'courses/checkWithinBounds',
  async ({ courseId, latitude, longitude }: { courseId: number; latitude: number; longitude: number }, { rejectWithValue }) => {
    try {
      const isWithinBounds = await courseApi.checkWithinBounds(courseId, latitude, longitude);
      return { courseId, isWithinBounds };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check course boundaries');
    }
  }
);

export const fetchCourseSuggestions = createAsyncThunk(
  'courses/fetchSuggestions',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const suggestions = await courseApi.getSuggestions(limit || 5);
      return suggestions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch course suggestions');
    }
  }
);


const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    clearNearbyCourses: (state) => {
      state.nearbyCourses = [];
      state.lastLocation = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLastLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.lastLocation = action.payload;
    },
    resetCourseState: (state) => {
      state.courses = [];
      state.selectedCourse = null;
      state.nearbyCourses = [];
      state.searchResults = [];
      state.pagination = null;
      state.isLoading = false;
      state.isSearching = false;
      state.isLoadingNearby = false;
      state.error = null;
      state.searchQuery = '';
      state.lastLocation = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch courses
    builder.addCase(fetchCourses.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCourses.fulfilled, (state, action) => {
      state.isLoading = false;
      const { items, ...paginationInfo } = action.payload;
      
      if (paginationInfo.pageNumber === 1) {
        // First page - replace existing courses
        state.courses = items;
      } else {
        // Subsequent pages - append to existing courses
        state.courses = [...state.courses, ...items];
      }
      
      state.pagination = paginationInfo;
    });
    builder.addCase(fetchCourses.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch course by ID
    builder.addCase(fetchCourseById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCourseById.fulfilled, (state, action) => {
      state.isLoading = false;
      // Create a new course object to avoid immutability issues
      const courseData = action.payload;
      state.selectedCourse = {
        id: courseData.id,
        name: courseData.name,
        description: courseData.description,
        address: courseData.address,
        city: courseData.city,
        state: courseData.state,
        country: courseData.country,
        phone: courseData.phone,
        website: courseData.website,
        email: courseData.email,
        totalHoles: courseData.totalHoles,
        parTotal: courseData.parTotal,
        slopeRating: courseData.slopeRating,
        courseRating: courseData.courseRating,
        yardageTotal: courseData.yardageTotal,
        greenFeeRange: courseData.greenFeeRange,
        timezone: courseData.timezone,
        isActive: courseData.isActive,
        amenities: courseData.amenities ? { ...courseData.amenities } : undefined,
        latitude: courseData.latitude,
        longitude: courseData.longitude,
        holes: courseData.holes ? courseData.holes.map(hole => ({
          id: hole.id,
          holeNumber: hole.holeNumber,
          par: hole.par,
          yardageMen: hole.yardageMen,
          yardageWomen: hole.yardageWomen,
          handicap: hole.handicap,
          description: hole.description,
          courseId: courseData.id,
          teeBoxLocation: hole.teeBoxLocation,
          pinLocation: hole.pinLocation,
          hazards: hole.hazards,
          playingTips: hole.playingTips,
          isActive: hole.isActive
        })) : [],
        createdAt: courseData.createdAt,
        updatedAt: courseData.updatedAt,
        distance: courseData.distance
      };
    });
    builder.addCase(fetchCourseById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });


    // Search courses
    builder.addCase(searchCourses.pending, (state) => {
      state.isSearching = true;
      state.error = null;
    });
    builder.addCase(searchCourses.fulfilled, (state, action) => {
      state.isSearching = false;
      const { response, query } = action.payload;
      const { items, ...paginationInfo } = response;
      
      if (paginationInfo.pageNumber === 1) {
        // First page - replace existing search results
        state.searchResults = items;
      } else {
        // Subsequent pages - append to existing search results
        state.searchResults = [...state.searchResults, ...items];
      }
      
      state.pagination = paginationInfo;
      state.searchQuery = query;
    });
    builder.addCase(searchCourses.rejected, (state, action) => {
      state.isSearching = false;
      state.error = action.payload as string;
    });

    // Fetch nearby courses
    builder.addCase(fetchNearbyCourses.pending, (state) => {
      state.isLoadingNearby = true;
      state.error = null;
    });
    builder.addCase(fetchNearbyCourses.fulfilled, (state, action) => {
      state.isLoadingNearby = false;
      state.nearbyCourses = action.payload.courses;
      state.lastLocation = action.payload.location;
    });
    builder.addCase(fetchNearbyCourses.rejected, (state, action) => {
      state.isLoadingNearby = false;
      state.error = action.payload as string;
    });

    // Check within course bounds
    builder.addCase(checkWithinCourseBounds.fulfilled, (state, action) => {
      // You might want to update the selected course or store this info somewhere
      // For now, just clear any errors
      state.error = null;
    });
    builder.addCase(checkWithinCourseBounds.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Fetch course suggestions
    builder.addCase(fetchCourseSuggestions.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCourseSuggestions.fulfilled, (state, action) => {
      state.isLoading = false;
      // You might want to store suggestions in a separate field
      // For now, we'll update the courses list
      state.courses = action.payload;
    });
    builder.addCase(fetchCourseSuggestions.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

  },
});

export const {
  clearError,
  clearSelectedCourse,
  clearSearchResults,
  clearNearbyCourses,
  setSearchQuery,
  setLastLocation,
  resetCourseState,
} = courseSlice.actions;

export default courseSlice.reducer;