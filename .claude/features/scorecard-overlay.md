# Scorecard Overlay

## Overview
**Priority**: Medium  
**Complexity**: 2 (1=Simple, 5=Complex)  
**Estimated Timeline**: 3-4 days  
**Dependencies**: ActiveRoundScreen, MapboxMapOverlay, existing Redux roundSlice

Quick view scorecard overlay that displays all 18 hole scores in a single view without navigation, accessible via a dedicated map overlay icon. Provides instant access to round progress and scoring information during active golf rounds.

## User Stories & Acceptance Criteria

### Primary User Story
As a golfer playing a round, I want to quickly see all my hole scores and round progress without leaving the map view so that I can track my performance throughout the round.

### Acceptance Criteria
- [ ] Scorecard overlay accessible via dedicated icon on right side of MapboxMapOverlay
- [ ] All 18 holes displayed in single scrollable view
- [ ] Shows hole number, par, and score for each hole
- [ ] Uncompleted holes display score as '-'
- [ ] Current hole is visually highlighted differently
- [ ] Color coding based on score performance (birdie, eagle, bogey, etc.)
- [ ] Live statistics: total score, holes completed, over/under par
- [ ] Overlay style presentation (not modal like round controls)
- [ ] Disabled during shot placement and pin flag placement modes
- [ ] Quick close action to return to map view

### Additional User Stories
- As a golfer, I want to see my current position relative to par so I can understand my performance
- As a golfer, I want visual indicators for exceptional scores (eagles, birdies) so I can easily spot my best holes
- As a golfer, I want the scorecard to update automatically when I complete holes so the information is always current

## Functional Requirements

### Core Functionality
- **Overlay Presentation**: Slide-in overlay from right side of screen (similar to shot placement panel style)
- **Data Display**: Read-only view of all hole scores from `activeRound.holeScores[]` array
- **Real-time Updates**: Automatically refresh when new hole scores are added via Redux updates
- **Par Information**: Display known par values from `activeRound.course.holes[]`, show '-' for first-time holes
- **Score Calculations**: Live calculation of total score, holes completed, and performance relative to par
- **Color Coding**: Visual indicators for score performance (eagle, birdie, par, bogey, double bogey+)
- **Current Hole Highlighting**: Visual emphasis on the hole currently being played

### User Interface Requirements
- **Access Method**: Dedicated scorecard icon on right side controls of MapboxMapOverlay
- **Presentation**: Overlay style that covers approximately 80% of screen width, slides from right
- **Layout**: Vertical list/grid showing all 18 holes with hole info and score
- **Scrolling**: Handle courses with more than standard 18 holes via vertical scroll
- **Close Action**: Tap outside overlay or dedicated close button to dismiss
- **Responsive**: Adapt to different screen sizes while maintaining readability

### Business Rules and Validation
- **Mode Restrictions**: Disabled during `shotPlacementMode` and `isPinPlacementMode`
- **Data Requirements**: Only show when `activeRound` exists and has course information
- **Par Display Logic**: Show actual par if available from course data, otherwise show '-'
- **Score Display Logic**: Show actual score if hole completed, otherwise show '-'
- **Performance Calculation**: Calculate relative to known par values only

## Technical Specifications

### Database Changes Required
**No database changes required** - Uses existing data structures:
- `rounds` table (existing)
- `hole_scores` table (existing)
- `holes` table (existing)

### API Endpoints Required
**No new API endpoints required** - Uses existing endpoints:
- Uses data already loaded by `fetchActiveRound()`
- Uses data from `fetchHoleScores(roundId)`

### Mobile App Changes

**New Components:**
- `ScorecardOverlay.tsx` - Main scorecard overlay component with hole grid/list
- `HoleScoreCard.tsx` - Individual hole score display component with color coding

**Modified Components:**
- `MapboxMapOverlay.tsx` - Add scorecard icon button and overlay integration
- `ActiveRoundScreen.tsx` - Integrate scorecard overlay state management

**State Management:**
- New Redux state: `showScorecardOverlay: boolean` in roundSlice dashboardState
- New Redux action: `setShowScorecardOverlay(boolean)`
- Selector integration with existing round data

### Integration Points
- **MapboxMapOverlay Integration**: Add scorecard icon alongside existing right-side controls
- **Redux Integration**: Subscribe to activeRound and holeScores updates for real-time data
- **Mode Management**: Respect existing shot placement and pin placement mode restrictions
- **Existing UI Patterns**: Follow established overlay styling from shot placement and round controls

## Implementation Plan

### Recommended Agents & Sequence

1. **react-native-ui-developer** - Complete scorecard overlay implementation
   - Create ScorecardOverlay and HoleScoreCard components
   - Integrate with MapboxMapOverlay for access control
   - Add Redux state management for overlay visibility
   - Implement responsive design and color coding
   - Add proper accessibility and mode restrictions

### Implementation Phases

**Phase 1: Component Development (Day 1-2)**
- [ ] Create `ScorecardOverlay.tsx` with basic layout and styling
- [ ] Create `HoleScoreCard.tsx` for individual hole display
- [ ] Implement color coding system for score performance
- [ ] Add responsive grid/list layout for all holes

**Phase 2: Integration & State Management (Day 2-3)**
- [ ] Integrate scorecard icon in MapboxMapOverlay right controls
- [ ] Add Redux state and actions for overlay visibility
- [ ] Connect components to existing activeRound data
- [ ] Implement real-time updates from hole score changes

**Phase 3: Polish & Testing (Day 3-4)**
- [ ] Add proper overlay animations (slide from right)
- [ ] Implement mode restrictions (shot placement, pin placement)
- [ ] Add accessibility features and proper touch targets
- [ ] Test with different course configurations and hole counts
- [ ] Optimize performance for frequent data updates

## Testing Strategy

### Component Testing
- Unit tests for ScorecardOverlay component with mock data
- Color coding accuracy for different score scenarios
- Responsive layout testing across device sizes
- Accessibility testing for screen readers

### Integration Testing
- MapboxMapOverlay integration and icon placement
- Redux state management and real-time updates
- Mode restriction enforcement during shot/pin placement
- Overlay animation and dismiss functionality

### User Experience Testing
- Quick access during round - tap scorecard icon, view scores, close overlay
- Performance impact during active rounds
- Visual clarity and readability on golf courses
- Touch target accessibility with gloves

## Success Metrics

### Technical Metrics
- Overlay render time < 200ms
- Smooth slide animations (60fps)
- No performance impact on map rendering
- Zero crashes during overlay operations

### User Experience Metrics
- Quick access to scorecard (1 tap to open, 1 tap/gesture to close)
- Clear visual distinction between completed and uncompleted holes
- Accurate real-time score calculations
- Intuitive color coding that matches golf scoring conventions

## Golf Scoring Color Coding System

### Score Performance Colors
- **Eagle (-2)**: Gold `#FFD700`
- **Birdie (-1)**: Green `#22c55e`
- **Par (0)**: Blue `#3b82f6`
- **Bogey (+1)**: Orange `#f59e0b`
- **Double Bogey (+2)**: Red `#ef4444`
- **Triple Bogey+ (+3)**: Dark Red `#dc2626`

### Visual Design Elements
- **Current Hole**: Highlighted border and subtle background
- **Completed Holes**: Full color coding based on performance
- **Uncompleted Holes**: Gray background with '-' score display
- **Par Display**: Consistent styling with course hole information

## Component Structure

```typescript
// ScorecardOverlay.tsx
interface ScorecardOverlayProps {
  visible: boolean;
  activeRound: Round | null;
  currentHole: number;
  onClose: () => void;
}

// HoleScoreCard.tsx
interface HoleScoreCardProps {
  holeNumber: number;
  par: number | null;
  score: number | null;
  isCurrentHole: boolean;
  isShotPlacementActive: boolean;
}
```

## Risks & Considerations

### Technical Risks
- **Performance Impact**: Frequent re-renders during score updates
  - Mitigation: Use React.memo and selective re-rendering
- **Overlay Z-index Conflicts**: Potential conflicts with shot placement overlays
  - Mitigation: Proper z-index management and mode restrictions

### User Experience Risks
- **Information Overload**: Too much information in limited screen space
  - Mitigation: Clean, minimal design with clear visual hierarchy
- **Accidental Activation**: Scorecard icon too close to other controls
  - Mitigation: Appropriate spacing and touch target sizing

### Golf-Specific Considerations
- **Variable Course Lengths**: Courses with different hole counts (9, 18, 27 holes)
  - Mitigation: Flexible layout that adapts to course configuration
- **Unknown Par Values**: First-time course play without hole information
  - Mitigation: Graceful handling of missing par data with '-' display

## Notes

This scorecard overlay feature enhances the solo golf experience by providing quick access to scoring information without disrupting the map-based round management. The implementation follows established CaddieAI UI patterns and integrates seamlessly with existing shot placement and pin location features.

The feature prioritizes read-only viewing to maintain simplicity and avoid conflicts with the existing QuickScoreEditor functionality. Users can view their progress instantly and return to the map-based round management without navigation complexity.

Key success factors:
- Fast, responsive overlay access
- Clear visual presentation of all hole information
- Proper integration with existing CaddieAI features
- Minimal performance impact on core GPS and mapping functionality