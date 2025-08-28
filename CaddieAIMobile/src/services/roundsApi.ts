/**
 * Rounds API Service
 * Provides methods for fetching round data and scorecards
 */

import apiService, { ApiResponse } from './ApiService';
import { Round, PaginatedResponse } from '../types';

// Round list item for paginated responses
export interface RoundListItem {
  id: number;
  courseId?: number;
  roundDate: string;
  startTime?: string;
  endTime?: string;
  currentHole?: number;
  status: string;
  totalScore?: number;
  notes?: string;
  createdAt?: string;
  courseName?: string; // Added dynamically from course data
}

// Paginated rounds response
export interface PaginatedRoundsResponse {
  items: RoundListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class RoundsApiService {
  private static instance: RoundsApiService;

  public static getInstance(): RoundsApiService {
    if (!RoundsApiService.instance) {
      RoundsApiService.instance = new RoundsApiService();
    }
    return RoundsApiService.instance;
  }

  /**
   * Get paginated history of all user rounds
   */
  async getAllUserRounds(page: number = 1, pageSize: number = 20): Promise<ApiResponse<PaginatedRoundsResponse>> {
    console.log(`🏌️ RoundsApi: Fetching user rounds (page: ${page}, pageSize: ${pageSize})`);
    try {
      const response = await apiService.get<PaginatedRoundsResponse>(
        `round/history?page=${page}&pageSize=${pageSize}`
      );
      
      if (response.success) {
        console.log(`✅ RoundsApi: ${response.data?.items?.length || 0} rounds fetched successfully (page ${page})`);
      } else {
        console.warn('⚠️ RoundsApi: Failed to fetch user rounds:', response.message);
      }
      
      return response;
    } catch (error) {
      console.error('❌ RoundsApi: Error fetching user rounds:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch user rounds',
        errorCode: 'USER_ROUNDS_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed round information including hole scores for scorecard display
   */
  async getRoundScorecard(roundId: number): Promise<ApiResponse<Round>> {
    console.log(`🎯 RoundsApi: Fetching scorecard for round ${roundId}`);
    try {
      const response = await apiService.get<Round>(`round/${roundId}`);
      
      if (response.success) {
        const holeCount = response.data?.holeScores?.length || 0;
        console.log(`✅ RoundsApi: Scorecard fetched successfully for round ${roundId} (${holeCount} holes)`);
      } else {
        console.warn(`⚠️ RoundsApi: Failed to fetch scorecard for round ${roundId}:`, response.message);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ RoundsApi: Error fetching scorecard for round ${roundId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch round scorecard',
        errorCode: 'ROUND_SCORECARD_FETCH_ERROR',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate round statistics from hole scores
   */
  calculateRoundStats(round: Round): {
    totalScore: number;
    totalPar: number;
    scoreToPar: number;
    front9Score: number;
    back9Score: number;
    front9Par: number;
    back9Par: number;
    holesCompleted: number;
  } {
    if (!round.holeScores || !round.course?.holes) {
      return {
        totalScore: round.totalScore || 0,
        totalPar: round.course?.parTotal || 0,
        scoreToPar: (round.totalScore || 0) - (round.course?.parTotal || 0),
        front9Score: 0,
        back9Score: 0,
        front9Par: 0,
        back9Par: 0,
        holesCompleted: 0
      };
    }

    let totalScore = 0;
    let totalPar = 0;
    let front9Score = 0;
    let back9Score = 0;
    let front9Par = 0;
    let back9Par = 0;
    let holesCompleted = 0;

    // Create a map of hole numbers to course holes for par lookup
    const courseHolesMap = round.course.holes.reduce((map, hole) => {
      map[hole.holeNumber] = hole;
      return map;
    }, {} as Record<number, typeof round.course.holes[0]>);

    round.holeScores.forEach(holeScore => {
      if (holeScore.score) {
        const courseHole = courseHolesMap[holeScore.holeNumber];
        const par = courseHole?.par || 4; // Default to par 4 if not found
        
        totalScore += holeScore.score;
        totalPar += par;
        holesCompleted++;

        if (holeScore.holeNumber <= 9) {
          front9Score += holeScore.score;
          front9Par += par;
        } else {
          back9Score += holeScore.score;
          back9Par += par;
        }
      }
    });

    return {
      totalScore,
      totalPar,
      scoreToPar: totalScore - totalPar,
      front9Score,
      back9Score,
      front9Par,
      back9Par,
      holesCompleted
    };
  }

  /**
   * Format round date for display
   */
  formatRoundDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Format round duration for display
   */
  formatRoundDuration(startTime?: string, endTime?: string): string {
    if (!startTime || !endTime) return '--';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMs = end.getTime() - start.getTime();
      
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return '--';
    }
  }
}

// Export singleton instance
export const roundsApiService = RoundsApiService.getInstance();

// Export default
export default roundsApiService;