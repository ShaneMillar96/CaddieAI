/**
 * Round State Selectors
 * 
 * Efficient selectors for accessing round and navigation state from Redux store
 * These selectors provide computed values and memoized state derivations
 * 
 * @version 1.0.0
 * @author Claude Code Assistant
 * @date August 15, 2025
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { HoleStatus, HoleStatusType, HoleNavigationState, HoleScore } from '../../types';

// =============================================================================
// BASE SELECTORS
// =============================================================================

/**
 * Select the entire round state
 */
export const selectRoundState = (state: RootState) => state.rounds;

/**
 * Select the active round
 */
export const selectActiveRound = (state: RootState) => state.rounds.activeRound;

/**
 * Select the dashboard state
 */
export const selectDashboardState = (state: RootState) => state.rounds.dashboardState;

/**
 * Select round loading states
 */
export const selectRoundLoadingStates = createSelector(
  [selectRoundState],
  (roundState) => ({
    isLoading: roundState.isLoading,
    isStarting: roundState.isStarting,
    isUpdating: roundState.isUpdating,
    isCompleting: roundState.isCompleting,
    error: roundState.error,
  })
);

// =============================================================================
// HOLE NAVIGATION SELECTORS
// =============================================================================

/**
 * Select current hole for GPS/AI features
 */
export const selectCurrentHole = (state: RootState) => 
  state.rounds.dashboardState.currentHole;

/**
 * Select viewing hole for UI display
 */
export const selectViewingHole = (state: RootState) => 
  state.rounds.dashboardState.viewingHole;

/**
 * Select navigation modal states
 */
export const selectNavigationModals = createSelector(
  [selectDashboardState],
  (dashboard) => ({
    showScoreModal: dashboard.showScoreModal,
    showQuickScoreEditor: dashboard.showQuickScoreEditor,
    showHoleSelector: dashboard.showHoleSelector,
  })
);

/**
 * Select whether user is viewing a different hole than current
 */
export const selectIsViewingDifferentHole = createSelector(
  [selectCurrentHole, selectViewingHole],
  (currentHole, viewingHole) => currentHole !== viewingHole
);

/**
 * Select hole navigation state with computed values
 */
export const selectHoleNavigationState = createSelector(
  [selectActiveRound, selectCurrentHole, selectViewingHole],
  (activeRound, currentHole, viewingHole): HoleNavigationState | null => {
    if (!activeRound) return null;

    const totalHoles = activeRound.course?.totalHoles || 18;
    const completedHoles = activeRound.holeScores?.map((hs: HoleScore) => hs.holeNumber) || [];

    return {
      currentHole,
      viewingHole,
      totalHoles,
      completedHoles,
    };
  }
);

/**
 * Select whether navigation is available (has active round)
 */
export const selectCanNavigateHoles = createSelector(
  [selectActiveRound],
  (activeRound) => activeRound !== null
);

/**
 * Select whether user can navigate to next hole
 */
export const selectCanNavigateToNext = createSelector(
  [selectHoleNavigationState],
  (navState) => {
    if (!navState) return false;
    return navState.viewingHole < navState.totalHoles;
  }
);

/**
 * Select whether user can navigate to previous hole
 */
export const selectCanNavigateToPrevious = createSelector(
  [selectViewingHole],
  (viewingHole) => viewingHole > 1
);

// =============================================================================
// HOLE STATUS SELECTORS
// =============================================================================

/**
 * Select hole status for a specific hole number
 */
export const selectHoleStatus = createSelector(
  [selectHoleNavigationState, (_: RootState, holeNumber: number) => holeNumber],
  (navState, holeNumber): HoleStatus | null => {
    if (!navState) return null;

    const isCompleted = navState.completedHoles.includes(holeNumber);
    const isCurrent = holeNumber === navState.currentHole;
    
    let status: HoleStatusType;
    if (isCompleted) {
      status = HoleStatusType.Completed;
    } else if (isCurrent) {
      status = HoleStatusType.Current;
    } else {
      status = HoleStatusType.Upcoming;
    }

    return {
      holeNumber,
      status,
      // Additional computed fields can be added here
    };
  }
);

/**
 * Select all hole statuses for the current round
 */
export const selectAllHoleStatuses = createSelector(
  [selectActiveRound, selectHoleNavigationState],
  (activeRound, navState): HoleStatus[] => {
    if (!activeRound || !navState) return [];

    const totalHoles = navState.totalHoles;
    const holeStatuses: HoleStatus[] = [];

    for (let holeNumber = 1; holeNumber <= totalHoles; holeNumber++) {
      const isCompleted = navState.completedHoles.includes(holeNumber);
      const isCurrent = holeNumber === navState.currentHole;
      const holeScore = activeRound.holeScores?.find((hs: HoleScore) => hs.holeNumber === holeNumber);
      const hole = activeRound.course?.holes?.find((h: any) => h.holeNumber === holeNumber);
      
      let status: HoleStatusType;
      if (isCompleted) {
        status = HoleStatusType.Completed;
      } else if (isCurrent) {
        status = HoleStatusType.Current;
      } else {
        status = HoleStatusType.Upcoming;
      }

      const holeStatus: HoleStatus = {
        holeNumber,
        status,
        score: holeScore?.score,
        par: hole?.par,
        strokesOverPar: holeScore && hole ? holeScore.score - hole.par : undefined,
      };

      holeStatuses.push(holeStatus);
    }

    return holeStatuses;
  }
);

/**
 * Select completed holes with scores
 */
export const selectCompletedHolesWithScores = createSelector(
  [selectActiveRound],
  (activeRound) => {
    if (!activeRound || !activeRound.holeScores) return [];
    
    return activeRound.holeScores
      .filter((hs: HoleScore) => hs.score > 0)
      .sort((a: HoleScore, b: HoleScore) => a.holeNumber - b.holeNumber);
  }
);

// =============================================================================
// QUICK SCORE EDITING SELECTORS
// =============================================================================

/**
 * Select whether a hole can be quick-edited (is completed)
 */
export const selectCanQuickEditHole = createSelector(
  [selectHoleNavigationState, (_: RootState, holeNumber: number) => holeNumber],
  (navState, holeNumber) => {
    if (!navState) return false;
    return navState.completedHoles.includes(holeNumber);
  }
);

/**
 * Select hole score for quick editing by hole number
 */
export const selectHoleScoreForEditing = createSelector(
  [selectActiveRound, (_: RootState, holeNumber: number) => holeNumber],
  (activeRound, holeNumber) => {
    if (!activeRound || !activeRound.holeScores) return null;
    
    return activeRound.holeScores.find((hs: HoleScore) => hs.holeNumber === holeNumber) || null;
  }
);

/**
 * Select hole score by hole number (alias for consistency)
 */
export const selectHoleScoreByNumber = selectHoleScoreForEditing;

// =============================================================================
// FEATURE FLAG SELECTORS
// =============================================================================

/**
 * Select whether GPS/AI features should be disabled
 * (when viewing a different hole than current)
 */
export const selectShouldDisableGpsFeatures = createSelector(
  [selectIsViewingDifferentHole],
  (isViewingDifferent) => isViewingDifferent
);

/**
 * Select whether shot placement should be disabled
 * (when viewing a different hole than current)
 */
export const selectShouldDisableShotPlacement = createSelector(
  [selectIsViewingDifferentHole],
  (isViewingDifferent) => isViewingDifferent
);

// =============================================================================
// ROUND PROGRESS SELECTORS
// =============================================================================

/**
 * Select round progress information
 */
export const selectRoundProgress = createSelector(
  [selectActiveRound, selectHoleNavigationState],
  (activeRound, navState) => {
    if (!activeRound || !navState) {
      return {
        completedHoles: 0,
        totalHoles: 18,
        currentHole: 1,
        progressPercentage: 0,
        totalScore: 0,
      };
    }

    const completedHoles = navState.completedHoles.length;
    const totalHoles = navState.totalHoles;
    const progressPercentage = Math.round((completedHoles / totalHoles) * 100);

    return {
      completedHoles,
      totalHoles,
      currentHole: navState.currentHole,
      progressPercentage,
      totalScore: activeRound.totalScore || 0,
    };
  }
);