/**
 * Golf Domain TypeScript Interfaces
 * 
 * This file contains comprehensive TypeScript interfaces for all golf-related
 * domain objects and API interactions, aligned with backend DTO structures.
 * 
 * @version 1.0.0
 * @author Claude Code Assistant
 * @date July 23, 2025
 */

// =============================================================================
// GOLF ENUMS
// =============================================================================

/**
 * Round status enumeration (matches backend RoundStatus enum)
 */
export enum RoundStatus {
  NotStarted = 1,
  InProgress = 2,
  Paused = 3,
  Completed = 4,
  Abandoned = 5
}

/**
 * Course type enumeration
 */
export enum CourseType {
  Public = 'Public',
  Private = 'Private',
  Resort = 'Resort',
  Municipal = 'Municipal'
}

/**
 * Course difficulty enumeration
 */
export enum Difficulty {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Championship = 4
}

/**
 * Player skill level enumeration
 */
export enum SkillLevel {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Professional = 4
}

// =============================================================================
// LOCATION & GEOMETRY TYPES
// =============================================================================

/**
 * Location interface (matches backend LocationDto)
 */
export interface Location {
  id: number;
  userId: number;
  roundId?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  coursePosition?: string;
  recordedAt?: string;
}

/**
 * Geographic bounds for course boundaries
 */
export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// =============================================================================
// COURSE TYPES (Aligned with backend CourseDto.cs)
// =============================================================================

/**
 * Hole interface (matches backend HoleResponseDto)
 */
export interface Hole {
  id: number;
  courseId?: number;
  holeNumber: number;
  par: number;
  yardageMen?: number;
  yardageWomen?: number;
  handicap?: number;
  description?: string | null;
  teeBoxLocation?: any; // GeoJSON point
  pinLocation?: any; // GeoJSON point
  hazards?: string[];
  playingTips?: string;
  isActive?: boolean;
}

/**
 * Course interface (matches backend CourseResponseDto)
 */
export interface Course {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  totalHoles: number;
  parTotal: number;
  slopeRating?: number | null;
  courseRating?: number | null;
  yardageTotal?: number | null;
  greenFeeRange?: string | null;
  timezone?: string | null;
  isActive?: boolean | null;
  amenities?: Record<string, any> | null;
  latitude?: number | null;
  longitude?: number | null;
  holes: Hole[]; // Included in CourseResponseDto
  createdAt?: string | null;
  updatedAt?: string | null;
  distance?: number; // Distance from user location (added dynamically)
}


/**
 * Course list item for simplified course listings
 */
export interface CourseListItem {
  id: number;
  name: string;
  city?: string;
  state?: string;
  parTotal: number;
  totalHoles: number;
  difficulty?: Difficulty;
  courseType?: CourseType;
  distance?: number;
  latitude?: number | null;
  longitude?: number | null;
}

// =============================================================================
// ROUND TYPES (Aligned with backend RoundResponseDto.cs)
// =============================================================================

/**
 * Hole score interface
 */
export interface HoleScore {
  id: number;
  roundId: number;
  holeId: number;
  holeNumber: number;
  score: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  notes?: string;
}

/**
 * Round interface (matches backend RoundResponseDto)
 */
export interface Round {
  id: number;
  userId: number;
  courseId: number;
  roundDate: string; // DateOnly in backend
  startTime?: string;
  endTime?: string;
  currentHole?: number;
  status: string;
  totalScore?: number;
  totalPutts?: number;
  fairwaysHit?: number;
  greensInRegulation?: number;
  temperatureCelsius?: number;
  windSpeedKmh?: number;
  notes?: string;
  roundMetadata?: string;
  createdAt?: string;
  updatedAt?: string;
  course?: Course;
  holeScores?: HoleScore[];
}

/**
 * Round list item for simplified round listings (matches backend RoundListResponseDto)
 */
export interface RoundListItem {
  id: number;
  courseId: number;
  roundDate: string;
  startTime?: string;
  endTime?: string;
  currentHole?: number;
  status: string;
  totalScore?: number;
  notes?: string;
  createdAt?: string;
}


// Note: Advanced statistics interfaces have been removed as they are not currently
// used by any active APIs. These can be re-added if statistics features are implemented.

// =============================================================================
// CLUB RECOMMENDATION TYPES (Aligned with backend ClubRecommendationDto.cs)
// =============================================================================

/**
 * Club recommendation interface (matches backend ClubRecommendationDto)
 */
export interface ClubRecommendation {
  id: number;
  userId: number;
  roundId?: number;
  holeId?: number;
  locationId?: number;
  recommendedClub: string;
  confidenceScore?: number;
  distanceToTarget?: number;
  openaiReasoning?: string;
  contextUsed?: string;
  wasAccepted?: boolean;
  actualClubUsed?: string;
  recommendationMetadata?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Navigation properties
  hole?: Hole;
  location?: Location;
}

/**
 * Club recommendation detail (matches backend ClubRecommendationDetailDto)
 */
export interface ClubRecommendationDetail extends ClubRecommendation {
  alternativeClubs: string[];
  strategy?: string;
  factors: Record<string, any>;
}

/**
 * Club recommendation response (API response format)
 */
export interface ClubRecommendationResponse {
  id: number;
  recommendedClub: string;
  confidence: number;
  reasoning: string;
  alternativeClubs?: string[];
  considerations?: string[];
  createdAt: string;
}

// Note: Chat interfaces have been removed as they are not currently used by any
// active APIs. These can be re-added if chat features are implemented.

// =============================================================================
// WEATHER TYPES
// =============================================================================

/**
 * Weather data interface
 */
export interface WeatherData {
  temperature?: number;
  windSpeed?: number;
  windDirection?: string;
  humidity?: number;
  precipitation?: number;
  conditions?: string;
  timestamp: string;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================


/**
 * Course search request interface
 */
export interface CourseSearchRequest {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  courseType?: CourseType;
  difficulty?: Difficulty;
  page?: number;
  pageSize?: number;
}

/**
 * Nearby courses request interface
 */
export interface NearbyCoursesRequest {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}

/**
 * Create round request interface
 */
export interface CreateRoundRequest {
  courseId: number;
  notes?: string;
  weatherConditions?: string;
  temperature?: number;
  windSpeed?: number;
}

/**
 * Update round request interface
 */
export interface UpdateRoundRequest {
  statusId?: number;
  totalScore?: number;
  totalPutts?: number;
  fairwaysHit?: number;
  greensInRegulation?: number;
  temperature?: number;
  windSpeed?: number;
  weatherConditions?: string;
  notes?: string;
}



// =============================================================================
// RESPONSE WRAPPER TYPES
// =============================================================================
// Note: PaginatedResponse<T> is exported from main index.ts as it's shared

// =============================================================================
// REDUX STATE TYPES
// =============================================================================

/**
 * Course Redux state interface
 */
export interface CourseState {
  courses: CourseListItem[];
  selectedCourse: Course | null;
  nearbyCourses: CourseListItem[];
  searchResults: CourseListItem[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  isLoading: boolean;
  isSearching: boolean;
  isLoadingNearby: boolean;
  error: string | null;
  searchQuery: string;
  lastLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Round Redux state interface
 */
export interface RoundState {
  activeRound: Round | null;
  roundHistory: Round[];
  selectedRound: Round | null;
  isLoading: boolean;
  isStarting: boolean;
  isUpdating: boolean;
  isCompleting: boolean;
  error: string | null;
  lastSyncTime: string | null;
  dashboardState: {
    currentHole: number;
    showScoreModal: boolean;
    isLocationTracking: boolean;
    lastLocationUpdate: string | null;
    roundTimer: string | null;
  };
}

// =============================================================================
// USER COURSES TYPES (User-Driven Course Management)
// =============================================================================

/**
 * User's saved course interface - minimal data for user's course collection
 */
export interface UserCourse {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  totalHoles: number;
  parTotal: number;
  timesPlayed: number;
  lastPlayedDate?: string;
  averageScore?: number;
  addedAt: string;
  userPars?: { [holeNumber: number]: number }; // User-defined par values for holes
}

/**
 * Course detection result from Mapbox Places API
 */
export interface CourseDetectionResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  confidence: number;
  distance: number; // meters from user
  placeType: 'golf_course' | 'country_club' | 'resort';
}

/**
 * Add course request interface
 */
export interface AddUserCourseRequest {
  courseName: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  totalHoles?: number;
  parTotal?: number;
}

/**
 * User courses Redux state interface
 */
export interface UserCoursesState {
  userCourses: UserCourse[];
  nearbyDetectedCourses: CourseDetectionResult[];
  isLoading: boolean;
  isDetecting: boolean;
  isAdding: boolean;
  error: string | null;
  currentDetectedCourse: CourseDetectionResult | null;
  showCoursePrompt: boolean;
  showDetectModal: boolean;
  lastDetectionLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Hole completion request interface
 */
export interface HoleCompletionRequest {
  roundId: number;
  holeNumber: number;
  par?: number; // Only provided first time playing this hole
  score: number;
  putts?: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  notes?: string;
}