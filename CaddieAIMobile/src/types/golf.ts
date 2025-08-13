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
 * @deprecated Use Course interface instead - backend CourseResponseDto already includes holes
 * Course detail interface (matches backend CourseDetailDto)
 */
export interface CourseDetail extends Course {
  holes: Hole[];
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

/**
 * Round statistics response (matches backend RoundStatisticsResponseDto)
 */
export interface RoundStatisticsResponse {
  totalRounds: number;
  averageScore?: number;
  bestScore?: number;
  worstScore?: number;
  averagePutts?: number;
  averageFairwaysHit?: number;
  averageGreensInRegulation?: number;
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// STATISTICS TYPES (Aligned with backend StatisticsResponseDtos.cs)
// =============================================================================

/**
 * Performance analysis response (matches backend PerformanceAnalysisResponseDto)
 */
export interface PerformanceAnalysisResponse {
  userId: number;
  totalRounds: number;
  startDate?: string;
  endDate?: string;
  
  // Scoring Performance
  averageScore?: number;
  bestScore?: number;
  worstScore?: number;
  averageScoreToPar?: number;
  scoringTrend?: number;
  
  // Short Game Performance
  averagePutts?: number;
  puttingAverage?: number;
  upAndDownPercentage?: number;
  sandSavePercentage?: number;
  
  // Long Game Performance
  averageFairwaysHit?: number;
  fairwayPercentage?: number;
  averageGreensInRegulation?: number;
  greensInRegulationPercentage?: number;
  
  // Consistency Metrics
  scoreStandardDeviation?: number;
  consistencyRating?: number;
  roundsUnderPar?: number;
  roundsOverPar?: number;
  
  // Performance by Par
  par3Average?: number;
  par4Average?: number;
  par5Average?: number;
}

/**
 * Handicap data point (matches backend HandicapDataPointDto)
 */
export interface HandicapDataPoint {
  date: string;
  handicap?: number;
  score?: number;
  scoreToPar?: number;
}

/**
 * Handicap trend response (matches backend HandicapTrendResponseDto)
 */
export interface HandicapTrendResponse {
  userId: number;
  currentHandicap?: number;
  projectedHandicap?: number;
  handicapTrend?: number;
  monthsAnalyzed: number;
  handicapHistory: HandicapDataPoint[];
  
  // Recent performance indicators
  last5RoundsAverage?: number;
  last10RoundsAverage?: number;
  handicapChange30Days?: number;
  handicapChange90Days?: number;
  
  // Improvement metrics
  isImproving: boolean;
  improvementRate?: number;
  trendDescription?: string;
}

/**
 * Monthly trend data (matches backend MonthlyTrendDataDto)
 */
export interface MonthlyTrendData {
  year: number;
  month: number;
  averageScore?: number;
  roundsPlayed: number;
  improvementFromPreviousMonth?: number;
}

/**
 * Score trend data point (matches backend ScoreTrendDataPointDto)
 */
export interface ScoreTrendDataPoint {
  roundDate: string;
  score: number;
  scoreToPar: number;
  movingAverage?: number;
}

/**
 * Scoring trends response (matches backend ScoringTrendsResponseDto)
 */
export interface ScoringTrendsResponse {
  userId: number;
  startDate?: string;
  endDate?: string;
  
  // Trend analysis
  overallTrend?: number;
  trendConfidence?: number;
  isImproving: boolean;
  
  // Moving averages
  last5RoundsAverage?: number;
  last10RoundsAverage?: number;
  seasonAverage?: number;
  
  // Streak analysis
  currentImprovementStreak?: number;
  longestImprovementStreak?: number;
  consecutiveRoundsUnderAverage?: number;
  
  // Performance patterns
  monthlyTrends: MonthlyTrendData[];
  scoreTrends: ScoreTrendDataPoint[];
}

/**
 * Course performance response (matches backend CoursePerformanceResponseDto)
 */
export interface CoursePerformanceResponse {
  userId: number;
  courseId: number;
  courseName?: string;
  roundsPlayed: number;
  firstPlayed?: string;
  lastPlayed?: string;
  
  // Course-specific scoring
  averageScore?: number;
  bestScore?: number;
  worstScore?: number;
  averageScoreToPar?: number;
  improvementTrend?: number;
  
  // Course familiarity metrics
  familiarityScore?: number;
  isFavoriteCourse: boolean;
  
  // Performance breakdown by hole type
  par3Performance?: number;
  par4Performance?: number;
  par5Performance?: number;
  
  // Weather impact on this course
  averageScoreGoodWeather?: number;
  averageScorePoorWeather?: number;
}

/**
 * Advanced metrics response (matches backend AdvancedMetricsResponseDto)
 */
export interface AdvancedMetricsResponse {
  userId: number;
  startDate?: string;
  endDate?: string;
  
  // Consistency metrics
  scoreConsistency?: number;
  puttingConsistency?: number;
  fairwayConsistency?: number;
  greenConsistency?: number;
  
  // Performance ratios
  scoringEfficiency?: number;
  recoveryRate?: number;
  pressurePerformance?: number;
  
  // Strokes gained approximation
  strokesGainedPutting?: number;
  strokesGainedApproach?: number;
  strokesGainedTeeToGreen?: number;
  
  // Round completion metrics
  averageRoundTime?: number;
  roundsCompleted?: number;
  roundsAbandoned?: number;
  completionRate?: number;
}

/**
 * Course comparison response (matches backend CourseComparisonResponseDto)
 */
export interface CourseComparisonResponse {
  courseId: number;
  courseName: string;
  roundsPlayed: number;
  averageScore?: number;
  averageScoreToPar?: number;
  bestScore?: number;
  difficultyRating?: number;
  improvementRate?: number;
  isFavorite: boolean;
}

/**
 * Weather data point (matches backend WeatherDataPointDto)
 */
export interface WeatherDataPoint {
  conditions?: string;
  roundsPlayed: number;
  averageScore?: number;
  averageTemperature?: number;
  averageWindSpeed?: number;
}

/**
 * Weather performance response (matches backend WeatherPerformanceResponseDto)
 */
export interface WeatherPerformanceResponse {
  userId: number;
  startDate?: string;
  endDate?: string;
  
  // Temperature performance
  averageScoreGoodWeather?: number;
  averageScoreBadWeather?: number;
  temperatureImpact?: number;
  
  // Wind performance  
  averageScoreLowWind?: number;
  averageScoreHighWind?: number;
  windImpact?: number;
  
  // Weather adaptation
  weatherAdaptability?: number;
  preferredConditions?: string;
  
  weatherBreakdown: WeatherDataPoint[];
}

/**
 * Round performance response (matches backend RoundPerformanceResponseDto)
 */
export interface RoundPerformanceResponse {
  roundId: number;
  roundDate: string;
  courseName?: string;
  totalScore?: number;
  scoreToPar?: number;
  
  // Performance metrics for this round
  totalPutts?: number;
  puttingAverage?: number;
  fairwaysHit?: number;
  fairwayPercentage?: number;
  greensInRegulation?: number;
  girPercentage?: number;
  
  // Round context
  temperature?: number;
  windSpeed?: number;
  roundDuration?: string; // TimeSpan converted to string
  notes?: string;
  
  // Performance rating for this round
  performanceRating?: number;
  performanceCategory?: string;
}

/**
 * Enhanced round statistics response (matches backend EnhancedRoundStatisticsResponseDto)
 */
export interface EnhancedRoundStatisticsResponse {
  // Base statistics
  totalRounds: number;
  averageScore?: number;
  bestScore?: number;
  worstScore?: number;
  averagePutts?: number;
  averageFairwaysHit?: number;
  averageGreensInRegulation?: number;
  startDate?: string;
  endDate?: string;
  
  // Enhanced metrics
  medianScore?: number;
  scoreStandardDeviation?: number;
  consistencyRating?: number;
  
  // Performance distribution
  roundsUnderPar: number;
  roundsAtPar: number;
  roundsOverPar: number;
  percentageUnderPar?: number;
  
  // Improvement metrics
  improvementTrend?: number;
  monthOverMonthChange?: number;
  
  // Course variety
  uniqueCourses: number;
  mostPlayedCourse?: string;
  averageRoundDuration?: number;
  
  // Weather impact
  averageScoreGoodWeather?: number;
  averageScoreBadWeather?: number;
}

/**
 * Consistency breakdown (matches backend ConsistencyBreakdownDto)
 */
export interface ConsistencyBreakdown {
  category: string;
  consistencyScore: number;
  standardDeviation: number;
  consistencyLevel: string;
}

/**
 * Consistency metrics response (matches backend ConsistencyMetricsResponseDto)
 */
export interface ConsistencyMetricsResponse {
  userId: number;
  startDate?: string;
  endDate?: string;
  
  // Overall consistency scores (0-100, higher = more consistent)
  overallConsistency?: number;
  scoringConsistency?: number;
  puttingConsistency?: number;
  fairwayConsistency?: number;
  greenConsistency?: number;
  
  // Variability metrics
  scoreVariance?: number;
  scoreStandardDeviation?: number;
  coefficientOfVariation?: number;
  
  // Streak analysis
  longestConsistentStreak?: number;
  currentConsistentStreak?: number;
  streakThreshold?: number;
  
  // Performance stability
  stabilityIndex?: number;
  isImprovingConsistency: boolean;
  consistencyTrend?: number;
  
  // Breakdown by performance area
  consistencyBreakdown: ConsistencyBreakdown[];
}

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

// =============================================================================
// CHAT TYPES (Aligned with backend ChatSessionDto.cs)
// =============================================================================

/**
 * Chat message interface (matches backend ChatMessageDto)
 */
export interface ChatMessage {
  id: number;
  sessionId: string;
  message: string;
  response: string;
  timestamp: string;
  context?: string;
}

/**
 * Chat session interface (matches backend ChatSessionDto)
 */
export interface ChatSession {
  id: number;
  userId: number;
  roundId?: number;
  courseId?: number;
  sessionName?: string;
  openaiModel?: string;
  temperature?: number;
  maxTokens?: number;
  totalMessages?: number;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Chat session detail (matches backend ChatSessionDetailDto)
 */
export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  courseName?: string;
  roundStatus?: string;
}

/**
 * Chat session summary (matches backend ChatSessionSummaryDto)
 */
export interface ChatSessionSummary {
  id: number;
  sessionName?: string;
  courseName?: string;
  totalMessages?: number;
  lastMessageAt?: string;
  createdAt?: string;
  isActive: boolean;
}

/**
 * Chat session response (API response format)
 */
export interface ChatSessionResponse {
  sessionId: string;
  context?: string;
  createdAt: string;
  isActive: boolean;
}

/**
 * Chat message response (API response format)
 */
export interface ChatMessageResponse {
  id: number;
  sessionId: string;
  message: string;
  response: string;
  timestamp: string;
  context?: string;
}

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
 * Statistics request interface
 */
export interface StatisticsRequest {
  startDate?: string;
  endDate?: string;
}

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

/**
 * Club recommendation request interface
 */
export interface ClubRecommendationRequest {
  distanceToPin: number;
  lie: string;
  windSpeed?: number;
  windDirection?: string;
  elevation?: number;
  temperature?: number;
  courseConditions?: string;
  playerNotes?: string;
}

/**
 * Recommendation feedback request interface
 */
export interface RecommendationFeedbackRequest {
  recommendationId: number;
  wasHelpful: boolean;
  actualClubUsed?: string;
  actualResult?: string;
  comments?: string;
}

/**
 * Chat session request interface
 */
export interface ChatSessionRequest {
  context?: string;
  courseId?: number;
  roundId?: number;
}

/**
 * Chat message request interface
 */
export interface ChatMessageRequest {
  sessionId: string;
  message: string;
  context?: string;
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