/**
 * Dashboard type definitions matching backend DTOs
 */

// Complete dashboard overview response
export interface DashboardOverviewResponse {
  userStats: UserStatsDto;
  recentRounds: RecentRoundDto[];
  insights: PerformanceInsightsDto;
  shotAnalytics: ShotAnalyticsDto;
  lastUpdated: string;
}

// User statistics and golf performance summary
export interface UserStatsDto {
  currentHandicap?: number;
  handicapChange: number;
  scoringAverage: number;
  totalRoundsThisSeason: number;
  favoriteCourse?: string;
  bestScore?: number;
  roundsAnalyzed: number;
}

// Recent round summary for dashboard display
export interface RecentRoundDto {
  roundId: number;
  courseName: string;
  datePlayed: string;
  totalScore: number;
  parTotal: number;
  parDifferential: number;
  duration?: string; // ISO 8601 duration format
  bestHole?: number;
  worstHole?: number;
  status: string;
}

// AI-generated performance insights and recommendations
export interface PerformanceInsightsDto {
  trendAnalysis: string; // "improving", "stable", "declining"
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  motivationalMessage: string;
  generatedAt: string;
  confidenceLevel: number; // 0.0 - 1.0
  roundsAnalyzed: number;
}

// Shot analytics including club usage and performance metrics
export interface ShotAnalyticsDto {
  clubUsage: Record<string, number>;
  averageDistances: Record<string, number>;
  accuracyPercentage: number;
  totalShotsAnalyzed: number;
  favoriteClub?: string;
  mostAccurateClub?: string;
  greensInRegulation?: number;
  averagePutts?: number;
}

// Response for insights refresh operation
export interface RefreshInsightsResponseDto {
  success: boolean;
  updatedInsights?: PerformanceInsightsDto;
  message: string;
  refreshedAt: string;
}

// Request DTO for refreshing dashboard insights
export interface RefreshInsightsRequestDto {
  forceRefresh?: boolean;
}

// Dashboard widget component props interfaces
export interface RecentRoundsWidgetProps {
  rounds: RecentRoundDto[];
  loading: boolean;
  onRoundPress: (roundId: number, courseName?: string) => void;
  onViewAllPress: () => void;
}

export interface PerformanceInsightsWidgetProps {
  insights: PerformanceInsightsDto;
  loading: boolean;
  onRefreshPress: () => void;
}

export interface QuickStatsWidgetProps {
  stats: UserStatsDto;
  loading: boolean;
}

export interface QuickActionsWidgetProps {
  onStartRound: () => void;
  onViewCourses: () => void;
  onOpenChat: () => void;
}

// Dashboard state management
export interface DashboardState {
  overview: DashboardOverviewResponse | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  refreshingInsights: boolean;
}
