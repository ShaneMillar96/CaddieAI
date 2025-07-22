# Golf API Service Integration Guide

**Frontend Integration Reference**  
**Version**: v1.0.0  
**Last Updated**: July 22, 2025

## Overview

This guide provides comprehensive integration instructions for the Golf API Service in React Native applications. The Golf API Service consolidates all golf-related backend operations into a single, type-safe service that follows established authentication and error handling patterns.

## Quick Start

### Installation and Import
```typescript
// Single import for all golf operations
import golfApi from '../services/golfApi';

// Service is pre-configured with authentication and error handling
// No additional setup required
```

### Basic Usage Example
```typescript
// Example: Load courses and get performance data
const loadGolfData = async () => {
  try {
    // Course discovery
    const courses = await golfApi.getCourses();
    
    // Performance analytics
    const performance = await golfApi.getPerformanceAnalysis({
      startDate: '2025-01-01',
      endDate: '2025-07-22'
    });
    
    // AI-powered club recommendation
    const recommendation = await golfApi.getClubRecommendation({
      distanceToPin: 150,
      lie: 'fairway',
      windSpeed: 10
    });
    
  } catch (error) {
    console.error('Golf API error:', error.message);
  }
};
```

## Service Architecture

### Unified API Structure
```typescript
golfApi = {
  // Course Management (7 methods)
  getCourses(),
  getCourseById(),
  searchCourses(),
  getNearbyCourses(),
  checkWithinCourseBounds(),
  getCourseSuggestions(),
  getCourseWeather(),
  
  // Statistics & Analytics (10 methods)
  getPerformanceAnalysis(),
  getHandicapTrend(),
  getCoursePerformance(),
  getScoringTrends(),
  getAdvancedMetrics(),
  getCourseComparison(),
  getWeatherPerformance(),
  getRoundPerformanceHistory(),
  getEnhancedStatistics(),
  getConsistencyMetrics(),
  
  // Club Recommendations (5 methods)
  getClubRecommendation(),
  submitRecommendationFeedback(),
  getRecommendationHistory(),
  getRecommendationAnalytics(),
  getClubUsagePatterns(),
  
  // Chat & AI Integration (3 methods)
  startChatSession(),
  sendChatMessage(),
  getChatSessionHistory(),
  
  // Round Management (8+ methods) - Future-ready
  createRound(),
  getRoundById(),
  updateRound(),
  startRound(),
  completeRound(),
  getRoundHistory(),
  getActiveRound(),
  addHoleScore()
}
```

### Authentication Integration
The service automatically handles:
- **JWT Token Injection**: Automatic token inclusion in all requests
- **Token Refresh**: Seamless token refresh on expiration
- **Authentication Errors**: Automatic cleanup and redirect on auth failure

### Error Handling
Unified error handling across all methods:
```typescript
try {
  const data = await golfApi.someMethod();
} catch (error) {
  // All methods throw descriptive error messages
  console.error(error.message); // "Failed to fetch courses" etc.
}
```

## Component Integration Examples

### Course Selection Screen
```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity } from 'react-native';
import golfApi from '../services/golfApi';
import { CourseListItem, CourseSearchRequest } from '../types';

const CourseSelectionScreen: React.FC = ({ navigation }) => {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial courses
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async (page = 1) => {
    setLoading(true);
    try {
      const response = await golfApi.getCourses(page, 20);
      setCourses(page === 1 ? response.items : [...courses, ...response.items]);
    } catch (error) {
      console.error('Failed to load courses:', error.message);
      // Show user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  const searchCourses = async (query: string) => {
    if (!query.trim()) {
      loadCourses();
      return;
    }

    setLoading(true);
    try {
      const searchRequest: CourseSearchRequest = {
        query,
        page: 1,
        pageSize: 20
      };
      const response = await golfApi.searchCourses(searchRequest);
      setCourses(response.items);
    } catch (error) {
      console.error('Course search failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const findNearbyCourses = async () => {
    // Get user location (implement location service)
    const location = await getCurrentLocation();
    
    setLoading(true);
    try {
      const nearbyCourses = await golfApi.getNearbyCourses({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: 25
      });
      setCourses(nearbyCourses);
    } catch (error) {
      console.error('Nearby courses search failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (courseId: number) => {
    try {
      const courseDetails = await golfApi.getCourseById(courseId);
      navigation.navigate('CourseDetail', { course: courseDetails });
    } catch (error) {
      console.error('Failed to load course details:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search courses..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchCourses(text);
        }}
      />
      
      <TouchableOpacity onPress={findNearbyCourses} style={styles.nearbyButton}>
        <Text>Find Nearby Courses</Text>
      </TouchableOpacity>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => selectCourse(item.id)}
            style={styles.courseItem}
          >
            <Text style={styles.courseName}>{item.name}</Text>
            <Text>{item.city}, {item.state}</Text>
            <Text>Par {item.totalPar} • {item.difficulty}</Text>
            {item.distance && <Text>{item.distance.toFixed(1)} km away</Text>}
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={() => loadCourses()}
        onEndReached={() => !loading && loadCourses()}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};
```

### Performance Analytics Screen
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import golfApi from '../services/golfApi';
import { PerformanceAnalysisResponse, HandicapTrendResponse } from '../types';

const PerformanceScreen: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceAnalysisResponse | null>(null);
  const [handicapTrend, setHandicapTrend] = useState<HandicapTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const [performanceData, handicapData] = await Promise.all([
        golfApi.getPerformanceAnalysis({
          startDate: '2025-01-01',
          endDate: new Date().toISOString().split('T')[0]
        }),
        golfApi.getHandicapTrend(12)
      ]);

      setPerformance(performanceData);
      setHandicapTrend(handicapData);
    } catch (error) {
      console.error('Failed to load performance data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Golf Performance Analysis</Text>
      
      {performance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <Text>Rounds Played: {performance.totalRounds}</Text>
          <Text>Average Score: {performance.averageScore?.toFixed(1)}</Text>
          <Text>Best Score: {performance.bestScore}</Text>
          <Text>Score to Par: +{performance.averageScoreToPar?.toFixed(1)}</Text>
          <Text>
            Trend: {performance.scoringTrend && performance.scoringTrend < 0 ? 'Improving' : 'Declining'}
          </Text>
        </View>
      )}

      {handicapTrend && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handicap Trend</Text>
          <Text>Current Handicap: {handicapTrend.currentHandicap}</Text>
          <Text>Projected Handicap: {handicapTrend.projectedHandicap}</Text>
          <Text>Status: {handicapTrend.isImproving ? 'Improving' : 'Stable'}</Text>
          <Text>Trend Description: {handicapTrend.trendDescription}</Text>
        </View>
      )}

      <TouchableOpacity 
        onPress={() => loadCourseSpecificPerformance()}
        style={styles.button}
      >
        <Text>View Course Performance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const loadCourseSpecificPerformance = async (courseId: number) => {
  try {
    const coursePerformance = await golfApi.getCoursePerformance(courseId, {
      startDate: '2025-01-01',
      endDate: new Date().toISOString().split('T')[0]
    });
    // Handle course-specific performance data
  } catch (error) {
    console.error('Failed to load course performance:', error.message);
  }
};
```

### AI Club Recommendation Screen
```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import golfApi from '../services/golfApi';
import { ClubRecommendationRequest, ClubRecommendationResponse } from '../types';

const ClubRecommendationScreen: React.FC = () => {
  const [distance, setDistance] = useState('');
  const [lie, setLie] = useState('fairway');
  const [windSpeed, setWindSpeed] = useState('');
  const [recommendation, setRecommendation] = useState<ClubRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const getRecommendation = async () => {
    if (!distance) return;

    setLoading(true);
    try {
      const request: ClubRecommendationRequest = {
        distanceToPin: parseInt(distance),
        lie,
        windSpeed: windSpeed ? parseInt(windSpeed) : undefined,
        windDirection: 'headwind', // Could be from user input
        temperature: 22, // Could be from weather service
        courseConditions: 'normal'
      };

      const result = await golfApi.getClubRecommendation(request);
      setRecommendation(result);
    } catch (error) {
      console.error('Failed to get club recommendation:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (wasHelpful: boolean) => {
    if (!recommendation) return;

    try {
      await golfApi.submitRecommendationFeedback({
        recommendationId: recommendation.id,
        wasHelpful,
        actualClubUsed: 'User selected club', // From user input
        actualResult: 'Shot result', // From user input
        comments: 'Optional user comments'
      });
      
      // Show success message
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Club Recommendation</Text>
      
      <View style={styles.inputGroup}>
        <Text>Distance to Pin (yards):</Text>
        <TextInput
          style={styles.input}
          value={distance}
          onChangeText={setDistance}
          keyboardType="numeric"
          placeholder="150"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text>Lie:</Text>
        <Picker
          selectedValue={lie}
          onValueChange={setLie}
        >
          <Picker.Item label="Fairway" value="fairway" />
          <Picker.Item label="Rough" value="rough" />
          <Picker.Item label="Sand" value="sand" />
        </Picker>
      </View>

      <View style={styles.inputGroup}>
        <Text>Wind Speed (mph):</Text>
        <TextInput
          style={styles.input}
          value={windSpeed}
          onChangeText={setWindSpeed}
          keyboardType="numeric"
          placeholder="10"
        />
      </View>

      <TouchableOpacity
        onPress={getRecommendation}
        style={styles.button}
        disabled={loading || !distance}
      >
        <Text>{loading ? 'Getting Recommendation...' : 'Get Recommendation'}</Text>
      </TouchableOpacity>

      {recommendation && (
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendedClub}>Recommended: {recommendation.recommendedClub}</Text>
          <Text>Confidence: {(recommendation.confidence * 100).toFixed(0)}%</Text>
          <Text style={styles.reasoning}>{recommendation.reasoning}</Text>
          
          {recommendation.alternativeClubs && (
            <View>
              <Text>Alternatives: {recommendation.alternativeClubs.join(', ')}</Text>
            </View>
          )}

          <View style={styles.feedbackButtons}>
            <TouchableOpacity 
              onPress={() => submitFeedback(true)}
              style={[styles.button, styles.helpfulButton]}
            >
              <Text>Helpful</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => submitFeedback(false)}
              style={[styles.button, styles.notHelpfulButton]}
            >
              <Text>Not Helpful</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
```

### Golf AI Chat Screen
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import golfApi from '../services/golfApi';
import { ChatMessageResponse, ChatSessionResponse } from '../types';

const GolfChatScreen: React.FC = ({ route }) => {
  const { courseId, roundId } = route.params || {};
  const [session, setSession] = useState<ChatSessionResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const newSession = await golfApi.startChatSession({
        context: 'Golf assistance session',
        courseId,
        roundId
      });
      
      setSession(newSession);
      
      // Load existing chat history if available
      if (newSession.sessionId) {
        const history = await golfApi.getChatSessionHistory(newSession.sessionId);
        setMessages(history);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error.message);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !session) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const response = await golfApi.sendChatMessage({
        sessionId: session.sessionId,
        message: userMessage,
        context: `Course: ${courseId}, Round: ${roundId}`
      });

      // Add the new message and response to the list
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error.message);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessageResponse }) => (
    <View style={styles.messageContainer}>
      <View style={[styles.message, styles.userMessage]}>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <View style={[styles.message, styles.aiMessage]}>
        <Text style={styles.messageText}>{item.response}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Golf AI Assistant</Text>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ask your golf question..."
          multiline
          editable={!loading}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={loading || !inputMessage.trim()}
        >
          <Text>{loading ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

## Redux Integration

### Service Integration with Redux Toolkit
```typescript
// Redux slice using Golf API Service
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import golfApi from '../services/golfApi';
import { CourseListItem, PerformanceAnalysisResponse } from '../types';

// Async thunk using golf API service
export const fetchCourses = createAsyncThunk(
  'golf/fetchCourses',
  async (params: { page: number; pageSize: number }) => {
    const response = await golfApi.getCourses(params.page, params.pageSize);
    return response;
  }
);

export const fetchPerformanceData = createAsyncThunk(
  'golf/fetchPerformanceData',
  async (dateRange: { startDate: string; endDate: string }) => {
    const response = await golfApi.getPerformanceAnalysis(dateRange);
    return response;
  }
);

// Redux slice
const golfSlice = createSlice({
  name: 'golf',
  initialState: {
    courses: [] as CourseListItem[],
    performance: null as PerformanceAnalysisResponse | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload.items;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch courses';
      })
      .addCase(fetchPerformanceData.fulfilled, (state, action) => {
        state.performance = action.payload;
      });
  },
});
```

### Component Integration with Redux
```typescript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, fetchPerformanceData } from '../store/golfSlice';

const GolfDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { courses, performance, loading, error } = useSelector(state => state.golf);

  useEffect(() => {
    dispatch(fetchCourses({ page: 1, pageSize: 20 }));
    dispatch(fetchPerformanceData({
      startDate: '2025-01-01',
      endDate: new Date().toISOString().split('T')[0]
    }));
  }, [dispatch]);

  // Render component with data from Redux store
  return (
    <View>
      {/* Dashboard content using courses and performance data */}
    </View>
  );
};
```

## Advanced Integration Patterns

### Parallel API Calls
```typescript
// Load multiple data types in parallel
const loadDashboardData = async () => {
  try {
    const [courses, performance, handicapTrend, recommendations] = await Promise.all([
      golfApi.getCourses(1, 5), // Recent courses
      golfApi.getPerformanceAnalysis({ startDate: '2025-01-01' }),
      golfApi.getHandicapTrend(6),
      golfApi.getRecommendationHistory(5)
    ]);

    // Handle all data together
    setDashboardData({ courses, performance, handicapTrend, recommendations });
  } catch (error) {
    console.error('Dashboard load failed:', error.message);
  }
};
```

### Conditional API Calls
```typescript
// Load data based on user location and preferences
const loadContextualData = async (userLocation: Location) => {
  try {
    // Always load basic performance data
    const performance = await golfApi.getPerformanceAnalysis({
      startDate: '2025-01-01'
    });

    // Load nearby courses if location available
    let nearbyCourses = [];
    if (userLocation) {
      nearbyCourses = await golfApi.getNearbyCourses({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: 25
      });
    }

    // Load course-specific data if user has played courses
    let coursePerformance = null;
    if (performance.totalRounds > 0) {
      // Get performance for most played course
      coursePerformance = await golfApi.getCoursePerformance(
        mostPlayedCourseId, 
        { startDate: '2025-01-01' }
      );
    }

    return { performance, nearbyCourses, coursePerformance };
  } catch (error) {
    console.error('Contextual data load failed:', error.message);
  }
};
```

### Caching and Optimization
```typescript
// Implement simple caching for frequently accessed data
class GolfDataCache {
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getCachedData<T>(
    key: string, 
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}

const cache = new GolfDataCache();

// Usage with caching
const getCachedCourses = () => 
  cache.getCachedData('courses', () => golfApi.getCourses());

const getCachedPerformance = () =>
  cache.getCachedData('performance', () => 
    golfApi.getPerformanceAnalysis({ startDate: '2025-01-01' })
  );
```

## Error Handling Best Practices

### Centralized Error Handling
```typescript
// Create centralized error handler
const handleGolfApiError = (error: Error, context: string) => {
  console.error(`Golf API Error in ${context}:`, error.message);
  
  // Different handling based on error type
  if (error.message.includes('401')) {
    // Authentication error - redirect to login
    navigationRef.navigate('Login');
  } else if (error.message.includes('network')) {
    // Network error - show retry option
    showNetworkError();
  } else {
    // General error - show user-friendly message
    showErrorMessage(`Failed to ${context}. Please try again.`);
  }
};

// Usage in components
const loadCourses = async () => {
  try {
    const courses = await golfApi.getCourses();
    setCourses(courses.items);
  } catch (error) {
    handleGolfApiError(error, 'load courses');
  }
};
```

### Retry Logic
```typescript
// Implement retry logic for failed requests
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Usage with retry logic
const loadCoursesWithRetry = () =>
  withRetry(() => golfApi.getCourses());
```

### User-Friendly Error Messages
```typescript
// Map API errors to user-friendly messages
const getErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('timeout')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  
  if (message.includes('courses')) {
    return 'Unable to load courses. Please try again.';
  }
  
  if (message.includes('performance')) {
    return 'Unable to load your performance data.';
  }
  
  if (message.includes('recommendation')) {
    return 'Unable to get club recommendation. Please try again.';
  }
  
  return 'Something went wrong. Please try again.';
};
```

## Testing Strategies

### Service Mocking for Tests
```typescript
// Mock the entire golf API service
jest.mock('../services/golfApi', () => ({
  getCourses: jest.fn(),
  getPerformanceAnalysis: jest.fn(),
  getClubRecommendation: jest.fn(),
  searchCourses: jest.fn(),
  // ... mock all methods
}));

// Type-safe mocking
import golfApi from '../services/golfApi';
const mockGolfApi = golfApi as jest.Mocked<typeof golfApi>;

// Test setup
beforeEach(() => {
  mockGolfApi.getCourses.mockResolvedValue({
    items: [{ id: 1, name: 'Test Course' }],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
});
```

### Component Testing with Service
```typescript
import { render, screen, waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import CourseListScreen from '../screens/CourseListScreen';

test('loads and displays courses', async () => {
  render(<CourseListScreen />);
  
  await waitFor(() => {
    expect(screen.getByText('Test Course')).toBeTruthy();
  });
  
  expect(mockGolfApi.getCourses).toHaveBeenCalledWith(1, 20);
});

test('handles course search', async () => {
  render(<CourseListScreen />);
  
  const searchInput = screen.getByPlaceholderText('Search courses...');
  fireEvent.changeText(searchInput, 'championship');
  
  await waitFor(() => {
    expect(mockGolfApi.searchCourses).toHaveBeenCalledWith({
      query: 'championship',
      page: 1,
      pageSize: 20
    });
  });
});
```

### Integration Testing
```typescript
// Test service integration with Redux
import { configureStore } from '@reduxjs/toolkit';
import golfReducer, { fetchCourses } from '../store/golfSlice';

test('fetches courses through Redux', async () => {
  const store = configureStore({
    reducer: { golf: golfReducer }
  });

  await store.dispatch(fetchCourses({ page: 1, pageSize: 20 }));
  
  const state = store.getState().golf;
  expect(state.courses).toHaveLength(1);
  expect(state.courses[0].name).toBe('Test Course');
});
```

## Performance Optimization

### Request Batching
```typescript
// Batch related requests when possible
const loadRoundContext = async (roundId: number) => {
  const round = await golfApi.getRoundById(roundId);
  
  // Batch related data requests
  const [courseDetails, performance, weather] = await Promise.all([
    golfApi.getCourseById(round.courseId),
    golfApi.getCoursePerformance(round.courseId, {
      startDate: round.createdAt.split('T')[0]
    }),
    golfApi.getCourseWeather(round.courseId)
  ]);
  
  return { round, courseDetails, performance, weather };
};
```

### Lazy Loading
```typescript
// Implement lazy loading for expensive operations
const useLazyPerformanceData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadData = async () => {
    if (data || loading) return; // Already loaded or loading
    
    setLoading(true);
    try {
      const performance = await golfApi.getPerformanceAnalysis({
        startDate: '2025-01-01'
      });
      setData(performance);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, loadData };
};
```

### Memory Management
```typescript
// Clean up data when components unmount
useEffect(() => {
  return () => {
    // Clean up large data objects
    setCourses([]);
    setPerformanceData(null);
    // Cancel pending requests if possible
  };
}, []);
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **TypeScript compilation errors**
   ```typescript
   // Ensure proper imports
   import { CourseListItem, PerformanceAnalysisResponse } from '../types';
   
   // Use proper type assertions when necessary
   const courses = response.data as CourseListItem[];
   ```

2. **Authentication errors**
   ```typescript
   // The service handles authentication automatically
   // If seeing 401 errors, check token storage
   import TokenStorage from '../services/tokenStorage';
   
   const checkAuth = async () => {
     const hasTokens = await TokenStorage.hasTokens();
     console.log('Has valid tokens:', hasTokens);
   };
   ```

3. **Network timeout issues**
   ```typescript
   // Service uses 10-second timeout by default
   // For slower networks, consider implementing retry logic
   const loadWithRetry = async () => {
     try {
       return await golfApi.getCourses();
     } catch (error) {
       if (error.message.includes('timeout')) {
         // Implement retry with exponential backoff
       }
       throw error;
     }
   };
   ```

4. **Response data validation errors**
   ```typescript
   // Validate response data before using
   const validateResponse = <T>(data: T): T => {
     if (!data) throw new Error('No data received');
     return data;
   };
   
   const courses = validateResponse(await golfApi.getCourses());
   ```

### Debug Mode
```typescript
// Enable debug logging for development
const DEBUG = __DEV__;

const debugLog = (operation: string, data: any) => {
  if (DEBUG) {
    console.log(`Golf API ${operation}:`, data);
  }
};

// Use in components
const loadCourses = async () => {
  debugLog('Loading courses', { page: 1, pageSize: 20 });
  
  try {
    const response = await golfApi.getCourses();
    debugLog('Courses loaded', response);
  } catch (error) {
    debugLog('Courses load failed', error);
  }
};
```

## Migration from Separate Services

### If migrating from courseApi.ts and roundApi.ts:

1. **Update imports**
   ```typescript
   // Before
   import courseApi from '../services/courseApi';
   import roundApi from '../services/roundApi';
   
   // After
   import golfApi from '../services/golfApi';
   ```

2. **Update method calls**
   ```typescript
   // Before
   const courses = await courseApi.getCourses();
   const rounds = await roundApi.getRoundHistory();
   
   // After
   const courses = await golfApi.getCourses();
   const rounds = await golfApi.getRoundHistory();
   ```

3. **Consolidate error handling**
   ```typescript
   // Single error handler for all golf operations
   const handleError = (error: Error) => {
     console.error('Golf API error:', error.message);
   };
   ```

This comprehensive integration guide provides everything needed to successfully implement the Golf API Service in React Native applications. The service provides a unified, type-safe, and maintainable approach to all golf-related API operations.

---

*Last Updated: July 22, 2025*