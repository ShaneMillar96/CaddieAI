# Golf State Management API Reference

**Frontend Integration Guide**  
**Version**: v1.0.0  
**Last Updated**: July 22, 2025

## Overview

This document provides comprehensive API reference for integrating the Golf State Management Redux slices into React Native components. It covers all available actions, selectors, and usage patterns for course and round management.

## Redux Integration

### Store Setup
```typescript
import { store } from '../store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '../store';

export const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <AppNavigator />
    </PersistGate>
  </Provider>
);
```

### Hook Usage
```typescript
import { useAppDispatch, useAppSelector } from '../hooks/redux';
```

## Course State Management

### Course State Structure
```typescript
interface CourseState {
  courses: CourseListItem[];           // General course list
  selectedCourse: Course | null;       // Currently selected course
  nearbyCourses: CourseListItem[];     // Location-based courses
  searchResults: CourseListItem[];     // Search results
  pagination: PaginationInfo | null;   // Pagination metadata
  isLoading: boolean;                  // General loading state
  isSearching: boolean;                // Search-specific loading
  isLoadingNearby: boolean;            // Nearby search loading
  error: string | null;                // Error message
  searchQuery: string;                 // Current search query
  lastLocation: Location | null;       // Last known location
}
```

### Course Selectors
```typescript
// Get entire course state
const courseState = useAppSelector(state => state.courses);

// Get specific course data
const courses = useAppSelector(state => state.courses.courses);
const selectedCourse = useAppSelector(state => state.courses.selectedCourse);
const nearbyCourses = useAppSelector(state => state.courses.nearbyCourses);
const searchResults = useAppSelector(state => state.courses.searchResults);

// Get loading states
const isLoading = useAppSelector(state => state.courses.isLoading);
const isSearching = useAppSelector(state => state.courses.isSearching);
const isLoadingNearby = useAppSelector(state => state.courses.isLoadingNearby);

// Get error state
const error = useAppSelector(state => state.courses.error);

// Get search state
const searchQuery = useAppSelector(state => state.courses.searchQuery);
const pagination = useAppSelector(state => state.courses.pagination);
```

### Course Actions

#### Fetch Courses (Paginated)
```typescript
const dispatch = useAppDispatch();

// Load first page of courses
dispatch(fetchCourses({ page: 1, pageSize: 20 }));

// Load additional pages (append mode)
dispatch(fetchCourses({ page: 2, pageSize: 20 }));

// Parameters
interface FetchCoursesParams {
  page?: number;     // Page number (default: 1)
  pageSize?: number; // Items per page (default: 20)
}
```

#### Fetch Course by ID
```typescript
// Get detailed course information
dispatch(fetchCourseById(courseId));

// The selected course will be available in:
const selectedCourse = useAppSelector(state => state.courses.selectedCourse);
```

#### Search Courses
```typescript
// Text-based search
dispatch(searchCourses({ 
  query: "Pine Valley Golf Club",
  page: 1,
  pageSize: 20 
}));

// Location-based search with filters
dispatch(searchCourses({
  query: "golf course",
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 25, // kilometers
  courseType: CourseType.Public,
  difficulty: Difficulty.Intermediate,
  page: 1,
  pageSize: 20
}));

// Results available in:
const searchResults = useAppSelector(state => state.courses.searchResults);
```

#### Fetch Nearby Courses
```typescript
// Find courses near current location
dispatch(fetchNearbyCourses({
  latitude: 40.7128,
  longitude: -74.0060,
  radiusKm: 25,
  limit: 10
}));

// Results available in:
const nearbyCourses = useAppSelector(state => state.courses.nearbyCourses);
```

#### Boundary Checking
```typescript
// Check if user is within course boundaries
dispatch(checkWithinCourseBounds({
  courseId: 1,
  latitude: 40.7128,
  longitude: -74.0060
}));

// Result handling via .fulfilled/.rejected
```

#### Course Suggestions
```typescript
// Get personalized course suggestions
dispatch(fetchCourseSuggestions(5)); // limit to 5 suggestions

// Results update the courses list
const courses = useAppSelector(state => state.courses.courses);
```

#### Course Weather
```typescript
// Get weather for specific course
dispatch(fetchCourseWeather(courseId));

// Weather data added to selected course object
const selectedCourse = useAppSelector(state => state.courses.selectedCourse);
const weather = selectedCourse?.weather; // Added dynamically
```

### Course State Actions
```typescript
// Clear error messages
dispatch(clearError());

// Clear selected course
dispatch(clearSelectedCourse());

// Clear search results and query
dispatch(clearSearchResults());

// Clear nearby courses and location
dispatch(clearNearbyCourses());

// Set search query (for UI state management)
dispatch(setSearchQuery("Pine Valley"));

// Set last known location
dispatch(setLastLocation({ latitude: 40.7128, longitude: -74.0060 }));

// Reset entire course state
dispatch(resetCourseState());
```

## Round State Management

### Round State Structure
```typescript
interface RoundState {
  activeRound: Round | null;      // Currently active round
  roundHistory: Round[];          // User's round history
  selectedRound: Round | null;    // Selected round for viewing
  isLoading: boolean;             // General loading state
  isStarting: boolean;            // Starting round loading
  isUpdating: boolean;            // Updating round loading
  isCompleting: boolean;          // Completing round loading
  error: string | null;           // Error message
  lastSyncTime: string | null;    // Last sync timestamp
}
```

### Round Selectors
```typescript
// Get entire round state
const roundState = useAppSelector(state => state.rounds);

// Get specific round data
const activeRound = useAppSelector(state => state.rounds.activeRound);
const roundHistory = useAppSelector(state => state.rounds.roundHistory);
const selectedRound = useAppSelector(state => state.rounds.selectedRound);

// Get loading states
const isLoading = useAppSelector(state => state.rounds.isLoading);
const isStarting = useAppSelector(state => state.rounds.isStarting);
const isUpdating = useAppSelector(state => state.rounds.isUpdating);
const isCompleting = useAppSelector(state => state.rounds.isCompleting);

// Get error and sync state
const error = useAppSelector(state => state.rounds.error);
const lastSyncTime = useAppSelector(state => state.rounds.lastSyncTime);
```

### Round Lifecycle Actions

#### Create Round
```typescript
// Create a new round
const result = await dispatch(createRound({
  courseId: 1,
  notes: "Beautiful day for golf!",
  weatherConditions: "Sunny",
  temperature: 22,
  windSpeed: 8
}));

// Access created round
const newRound = result.payload;
```

#### Start Round
```typescript
// Start an existing round
dispatch(startRound(roundId));

// Round status changes to RoundStatus.InProgress
// Available in activeRound state
```

#### Update Round
```typescript
// Update round details
dispatch(updateRound({
  roundId: activeRound.id,
  updateData: {
    totalScore: 85,
    totalPutts: 32,
    fairwaysHit: 8,
    greensInRegulation: 12,
    notes: "Great putting today!"
  }
}));
```

#### Round Status Control
```typescript
// Pause round
dispatch(pauseRound(roundId));

// Resume round
dispatch(resumeRound(roundId));

// Complete round
dispatch(completeRound(roundId));

// Abandon round
dispatch(abandonRound(roundId));
```

### Hole Scoring Actions

#### Add Hole Score
```typescript
// Add score for a hole
dispatch(addHoleScore({
  roundId: activeRound.id,
  holeScore: {
    holeId: 1,
    holeNumber: 1,
    score: 4,
    putts: 2,
    fairwayHit: true,
    greenInRegulation: false,
    notes: "Great drive, missed the green"
  }
}));
```

#### Update Hole Score
```typescript
// Update existing hole score
dispatch(updateHoleScore({
  roundId: activeRound.id,
  holeScoreId: 123,
  holeScore: {
    score: 5, // Changed from 4 to 5
    putts: 3  // Updated putt count
  }
}));
```

#### Optimistic Updates (Offline Support)
```typescript
// For offline scenarios, use optimistic updates
dispatch(optimisticUpdateHoleScore({
  roundId: activeRound.id,
  holeScore: {
    id: Date.now(), // Temporary ID
    roundId: activeRound.id,
    holeId: 1,
    holeNumber: 1,
    score: 4,
    putts: 2
  }
}));

// This immediately updates UI, then sync with server when online
```

### Round Data Actions

#### Fetch Active Round
```typescript
// Get user's currently active round
dispatch(fetchActiveRound());

// Available in activeRound state
const activeRound = useAppSelector(state => state.rounds.activeRound);
```

#### Fetch Round by ID
```typescript
// Get specific round details
dispatch(fetchRoundById(roundId));

// Available in selectedRound state
const selectedRound = useAppSelector(state => state.rounds.selectedRound);
```

#### Fetch Round History
```typescript
// Get user's round history with pagination
dispatch(fetchRoundHistory({ page: 1, pageSize: 20 }));

// Load more history (appends to existing)
dispatch(fetchRoundHistory({ page: 2, pageSize: 20 }));

// Available in roundHistory state
const history = useAppSelector(state => state.rounds.roundHistory);
```

#### Fetch Rounds by Status
```typescript
// Get rounds by specific status
dispatch(fetchRoundsByStatus({ 
  status: RoundStatus.InProgress, 
  page: 1, 
  pageSize: 10 
}));

// Results update roundHistory
```

#### Fetch Hole Scores
```typescript
// Get all hole scores for a round
dispatch(fetchHoleScores(roundId));

// Scores added to the round object
const round = useAppSelector(state => state.rounds.selectedRound);
const holeScores = round?.holeScores;
```

### Round State Actions
```typescript
// Clear error messages
dispatch(clearError());

// Clear active round
dispatch(clearActiveRound());

// Clear selected round
dispatch(clearSelectedRound());

// Clear round history
dispatch(clearRoundHistory());

// Set last sync time
dispatch(setLastSyncTime(new Date().toISOString()));

// Reset entire round state
dispatch(resetRoundState());
```

## Complete Integration Examples

### Course Selection Screen
```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { 
  fetchCourses, 
  searchCourses, 
  fetchNearbyCourses,
  clearSearchResults 
} from '../store/slices/courseSlice';

const CourseSelectionScreen = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { 
    courses, 
    searchResults, 
    nearbyCourses, 
    isLoading, 
    isSearching,
    searchQuery,
    error 
  } = useAppSelector(state => state.courses);

  const [searchText, setSearchText] = useState('');

  // Load initial courses
  useEffect(() => {
    dispatch(fetchCourses({ page: 1, pageSize: 20 }));
  }, [dispatch]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchText(query);
    if (query.length > 0) {
      dispatch(searchCourses({ query, page: 1, pageSize: 20 }));
    } else {
      dispatch(clearSearchResults());
    }
  };

  // Location-based search
  const findNearbyCourses = async () => {
    // Get user location (using location service)
    const location = await getCurrentLocation();
    dispatch(fetchNearbyCourses({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: 25,
      limit: 10
    }));
  };

  // Select course and navigate
  const selectCourse = (courseId: number) => {
    navigation.navigate('CourseDetail', { courseId });
  };

  // Determine which courses to display
  const displayCourses = searchQuery ? searchResults : courses;

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={handleSearch}
        placeholder="Search courses..."
      />
      
      <TouchableOpacity onPress={findNearbyCourses}>
        <Text>Find Nearby Courses</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={displayCourses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => selectCourse(item.id)}
            style={styles.courseItem}
          >
            <Text style={styles.courseName}>{item.name}</Text>
            <Text>{item.city}, {item.state}</Text>
            <Text>Par {item.totalPar} • {item.numberOfHoles} holes</Text>
          </TouchableOpacity>
        )}
        refreshing={isLoading || isSearching}
        onRefresh={() => dispatch(fetchCourses({ page: 1, pageSize: 20 }))}
      />
    </View>
  );
};
```

### Active Round Screen
```typescript
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { 
  fetchActiveRound,
  addHoleScore,
  updateRound,
  pauseRound,
  completeRound
} from '../store/slices/roundSlice';

const ActiveRoundScreen = () => {
  const dispatch = useAppDispatch();
  const { 
    activeRound, 
    isLoading, 
    isUpdating, 
    isCompleting,
    error 
  } = useAppSelector(state => state.rounds);

  // Load active round on mount
  useEffect(() => {
    dispatch(fetchActiveRound());
  }, [dispatch]);

  // Add hole score
  const recordScore = (holeId: number, holeNumber: number, score: number) => {
    if (activeRound) {
      dispatch(addHoleScore({
        roundId: activeRound.id,
        holeScore: {
          holeId,
          holeNumber,
          score,
          putts: 2, // Example - would come from UI input
          fairwayHit: true,
          greenInRegulation: score <= par
        }
      }));
    }
  };

  // Update round totals
  const updateRoundTotals = () => {
    if (activeRound) {
      const totalScore = activeRound.holeScores?.reduce((sum, hole) => sum + hole.score, 0) || 0;
      const totalPutts = activeRound.holeScores?.reduce((sum, hole) => sum + (hole.putts || 0), 0) || 0;
      
      dispatch(updateRound({
        roundId: activeRound.id,
        updateData: { totalScore, totalPutts }
      }));
    }
  };

  // Pause round
  const handlePauseRound = () => {
    if (activeRound) {
      dispatch(pauseRound(activeRound.id));
    }
  };

  // Complete round
  const handleCompleteRound = () => {
    if (activeRound) {
      dispatch(completeRound(activeRound.id));
    }
  };

  if (isLoading) return <Text>Loading active round...</Text>;
  if (!activeRound) return <Text>No active round found</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activeRound.course?.name}</Text>
      <Text>Status: {activeRound.status}</Text>
      <Text>Current Score: {activeRound.totalScore || 0}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.controls}>
        <TouchableOpacity 
          onPress={handlePauseRound}
          disabled={isUpdating}
        >
          <Text>Pause Round</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleCompleteRound}
          disabled={isCompleting}
        >
          <Text>{isCompleting ? 'Completing...' : 'Complete Round'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeRound.course?.holes || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const holeScore = activeRound.holeScores?.find(score => score.holeId === item.id);
          return (
            <View style={styles.holeItem}>
              <Text>Hole {item.holeNumber} - Par {item.par}</Text>
              <Text>Yardage: {item.yardage}</Text>
              {holeScore ? (
                <Text>Score: {holeScore.score}</Text>
              ) : (
                <TouchableOpacity 
                  onPress={() => recordScore(item.id, item.holeNumber, item.par)}
                >
                  <Text>Record Score</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};
```

## Error Handling Patterns

### Component Error Boundaries
```typescript
const ErrorBoundaryComponent = () => {
  const error = useAppSelector(state => state.courses.error || state.rounds.error);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (error) {
      // Show error toast/alert
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => {
          dispatch(clearError()); // Clear course error
          // dispatch(clearError()); // Clear round error
        }}
      ]);
    }
  }, [error, dispatch]);

  return null; // This would be your actual component content
};
```

### Async Action Error Handling
```typescript
const handleAsyncAction = async () => {
  try {
    const result = await dispatch(fetchCourses({ page: 1, pageSize: 20 }));
    if (fetchCourses.fulfilled.match(result)) {
      // Success handling
      console.log('Courses loaded:', result.payload);
    } else if (fetchCourses.rejected.match(result)) {
      // Error handling
      console.error('Failed to load courses:', result.payload);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};
```

## Performance Best Practices

### Selector Optimization
```typescript
import { createSelector } from '@reduxjs/toolkit';

// Create memoized selectors for derived state
const selectCourseState = (state: RootState) => state.courses;

const selectCoursesByDistance = createSelector(
  [selectCourseState],
  (courseState) => 
    courseState.courses
      .filter(course => course.distance !== undefined)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
);

// Use in components
const sortedCourses = useAppSelector(selectCoursesByDistance);
```

### Pagination Management
```typescript
const CourseListWithPagination = () => {
  const dispatch = useAppDispatch();
  const { courses, pagination, isLoading } = useAppSelector(state => state.courses);

  const loadNextPage = () => {
    if (pagination && pagination.hasNextPage && !isLoading) {
      dispatch(fetchCourses({ 
        page: pagination.pageNumber + 1, 
        pageSize: pagination.pageSize 
      }));
    }
  };

  return (
    <FlatList
      data={courses}
      onEndReached={loadNextPage}
      onEndReachedThreshold={0.1}
      ListFooterComponent={isLoading ? <LoadingSpinner /> : null}
    />
  );
};
```

## Testing Integration

### Component Testing with Redux
```typescript
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import courseReducer from '../store/slices/courseSlice';
import CourseListScreen from '../screens/CourseListScreen';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      courses: courseReducer,
    },
    preloadedState: initialState,
  });
};

test('renders course list correctly', () => {
  const store = createTestStore({
    courses: {
      courses: [
        { id: 1, name: 'Test Course', city: 'Test City', state: 'TS' }
      ],
      isLoading: false,
      error: null,
    }
  });

  render(
    <Provider store={store}>
      <CourseListScreen />
    </Provider>
  );

  expect(screen.getByText('Test Course')).toBeTruthy();
});
```

## Migration Guide

### From Existing State Management
If migrating from existing state management solutions:

1. **Replace existing course/round state** with Redux slices
2. **Update component imports** to use new selectors and actions
3. **Migrate local state** to Redux where appropriate
4. **Update navigation** to pass data through Redux instead of params
5. **Test persistence** functionality with app restarts

### Breaking Changes
- Component prop interfaces may need updating
- Navigation parameters may change
- Local storage patterns replaced with Redux persist

---

*This API reference should be updated whenever the Golf State Management implementation is modified.*