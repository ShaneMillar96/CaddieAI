# Hole Navigation System

## Overview
**Priority**: High  
**Complexity**: 3 (1=Simple, 5=Complex)  
**Estimated Timeline**: 1-2 weeks  
**Dependencies**: Existing Redux roundSlice, ActiveRoundScreen, HoleCompletionModal

A comprehensive hole navigation system that allows golfers to navigate between holes during an active round, enabling quick score editing for previous holes and hole skipping when needed. The system maintains separation between the current hole (for GPS/AI features) and the viewing hole (for UI display).

## User Stories & Acceptance Criteria

### Primary User Story
As a golfer during an active round, I want to easily navigate between holes so that I can check previous scores, correct mistakes, and skip holes when course conditions require it.

### Acceptance Criteria
- [ ] Hole selector dropdown/modal accessible from any screen during active round
- [ ] Navigation available at all times during active round (not just after hole completion)
- [ ] Map always centers on user location regardless of hole navigation
- [ ] Previous holes show quick score editor (not full completion modal)
- [ ] Shot placement and AI features only work for current/active hole
- [ ] Visual indicators for completed vs current vs upcoming holes
- [ ] Quick navigation to next/previous hole with swipe gestures
- [ ] Validation prevents editing of holes beyond the current hole

### Additional User Stories
- As a golfer, I want to skip holes ahead when there are slow players so I can maintain my round pace
- As a golfer, I want to go back and check my score on hole 7 without affecting my current position on hole 12
- As a golfer, I want to correct a score entry mistake on a previous hole

## Functional Requirements

### Core Functionality
- **Dual Hole State Management**: Separate `currentHole` (GPS/AI features) from `viewingHole` (UI display)
- **Hole Selector Modal**: Dropdown list showing all 18 holes with status indicators
- **Quick Score Editor**: Simplified score editing component for completed holes
- **Navigation Controls**: Next/previous hole buttons and swipe gesture support
- **State Persistence**: Navigation state persists during round but resets between rounds

### User Interface Requirements
- **Hole Status Indicators**:
  - Completed holes: Green checkmark with score
  - Current hole: Blue indicator with "Current" label
  - Upcoming holes: Gray indicator with hole number
- **Quick Score Editor Fields**:
  - Score (required)
  - Putts (optional)
  - Notes (optional, max 100 characters)
- **Navigation Accessibility**: Large touch targets, clear visual hierarchy
- **Map Behavior**: Map always centers on user location regardless of viewing hole

### Business Rules
- Only completed holes can be edited via quick score editor
- Current hole requires full HoleCompletionModal for initial completion
- Shot placement and AI features disabled when viewing non-current hole
- Cannot navigate beyond total holes (18) or below hole 1
- Navigation state resets to current hole when round starts/resumes

## Technical Specifications

### Redux State Changes Required

**Enhanced RoundSlice State:**
```typescript
interface DashboardState {
  currentHole: number;        // Actual hole for GPS/AI features (existing)
  viewingHole: number;        // Hole displayed in UI (new)
  showScoreModal: boolean;    // Full completion modal (existing)
  showQuickScoreEditor: boolean; // Quick score editor (new)
  showHoleSelector: boolean;  // Hole navigation modal (new)
  isLocationTracking: boolean; // (existing)
  lastLocationUpdate: string | null; // (existing)
  roundTimer: string | null;  // (existing)
}
```

**New Actions:**
```typescript
// Navigation actions
setViewingHole: (state, action: PayloadAction<number>) => void;
setShowHoleSelector: (state, action: PayloadAction<boolean>) => void;
setShowQuickScoreEditor: (state, action: PayloadAction<boolean>) => void;
navigateToNextHole: (state) => void;
navigateToPreviousHole: (state) => void;
resetToCurrentHole: (state) => void;

// Quick score editing actions
updateQuickScore: (state, action: PayloadAction<QuickScoreUpdate>) => void;
```

### New API Endpoints Required

**Quick Score Updates:**
- `PATCH /api/rounds/{roundId}/holes/{holeNumber}/quick-score` - Update score for completed hole
  - Request: `{ score: number, putts?: number, notes?: string }`
  - Response: `HoleScore`

**Validation Endpoint:**
- `GET /api/rounds/{roundId}/holes/{holeNumber}/can-edit` - Check if hole can be edited
  - Response: `{ canEdit: boolean, reason?: string }`

### Mobile App Changes

**New Components:**
- `HoleNavigationModal` - Main hole selector interface
- `QuickScoreEditor` - Simplified score editing component  
- `HoleStatusIndicator` - Visual indicator for hole completion status
- `HoleNavigationControls` - Next/previous navigation buttons

**Modified Components:**
- `ActiveRoundScreen` - Integration with navigation system
- `MapboxMapOverlay` - Add hole navigation trigger button
- `HoleCompletionModal` - Differentiate between new completion and editing

**New Types:**
```typescript
interface QuickScoreUpdate {
  roundId: number;
  holeNumber: number;
  score: number;
  putts?: number;
  notes?: string;
}

interface HoleNavigationState {
  currentHole: number;
  viewingHole: number;
  totalHoles: number;
  completedHoles: number[];
}

interface HoleStatus {
  holeNumber: number;
  status: 'completed' | 'current' | 'upcoming';
  score?: number;
  par?: number;
}
```

### Integration Points

**Shot Placement Integration:**
- Disable shot placement when `viewingHole !== currentHole`
- Show warning message when user tries to use shot placement on non-current hole
- Automatically return to current hole when shot placement activated

**AI Features Integration:**
- All AI features (voice, club recommendations) only work for current hole
- Clear context indicators when viewing non-current hole
- Seamless transition back to current hole for AI interactions

**Map Integration:**
- Map always centers on user location regardless of viewing hole
- No automatic map panning to hole locations
- User responsible for being at correct physical location

## Implementation Plan

### Recommended Agents & Sequence

1. **react-native-ui-developer** - Frontend implementation
   - Create new navigation components
   - Implement Redux state management updates
   - Integrate with existing ActiveRoundScreen
   - Add navigation controls to MapboxMapOverlay

2. **dotnet-middleware-engineer** - Backend API updates (if needed)
   - Add quick score update endpoint
   - Implement hole edit validation logic
   - Ensure proper error handling for score updates

### Implementation Phases

**Phase 1: Redux State Architecture (2 days)**
- [ ] Extend dashboardState with navigation fields
- [ ] Add new actions for hole navigation
- [ ] Update existing components to use viewingHole vs currentHole
- [ ] Implement state selectors for navigation logic

**Phase 2: Core Navigation Components (3 days)**
- [ ] Create HoleNavigationModal with hole selector
- [ ] Build QuickScoreEditor component
- [ ] Implement HoleStatusIndicator visual components
- [ ] Add swipe gesture support for navigation

**Phase 3: Integration & Polish (2 days)**
- [ ] Integrate navigation controls into MapboxMapOverlay
- [ ] Update ActiveRoundScreen with navigation logic
- [ ] Disable shot placement/AI for non-current holes
- [ ] Add navigation trigger button to overlay

**Phase 4: Backend API (1 day)**
- [ ] Create quick score update endpoint
- [ ] Add validation for hole editing permissions
- [ ] Update existing score endpoints for consistency

**Phase 5: Testing & Refinement (2 days)**
- [ ] Component unit tests
- [ ] Navigation flow testing
- [ ] Integration testing with existing features
- [ ] Performance optimization and bug fixes

## Testing Strategy

### Component Testing
- HoleNavigationModal renders correctly with hole statuses
- QuickScoreEditor validates input and submits properly
- Navigation controls respond to user interactions
- State management updates correctly with Redux actions

### Integration Testing
- Navigation works seamlessly with existing round flow
- Shot placement correctly disabled for non-current holes
- Map behavior remains consistent during navigation
- Score updates sync properly with backend

### User Acceptance Testing
- Golfer can quickly navigate to check previous hole scores
- Navigation feels natural and intuitive on golf course
- Performance remains smooth with large numbers of holes
- No interference with core golf features (GPS, AI, shot placement)

## Success Metrics

### Technical Metrics
- Navigation response time < 300ms
- Zero impact on existing map performance
- 100% test coverage for new navigation components
- No regressions in shot placement or AI features

### User Experience Metrics
- Average navigation task completion time < 5 seconds
- User error rate for hole navigation < 2%
- Zero complaints about map centering behavior
- Positive feedback on score correction workflow

## Risks & Considerations

### Technical Risks
- **State Complexity**: Managing dual hole state (current vs viewing) could create confusion
- **Performance Impact**: Additional Redux state updates might affect map performance
- **Integration Conflicts**: Navigation might interfere with existing shot placement logic

### User Experience Risks
- **User Confusion**: Users might not understand difference between current and viewing hole
- **Workflow Disruption**: Navigation could interrupt natural golf round flow
- **GPS Accuracy**: Users might forget they're viewing a different hole than their physical location

### Mitigation Strategies

**For State Complexity:**
- Clear naming conventions (currentHole vs viewingHole)
- Comprehensive TypeScript interfaces
- Extensive unit tests for state management
- Visual indicators to show current vs viewing hole

**For Performance:**
- Lazy loading of navigation components
- Efficient Redux selectors to prevent unnecessary re-renders
- Memoization of expensive calculations
- Performance monitoring during testing

**For User Experience:**
- Clear visual indicators for navigation state
- "Return to Current Hole" button always visible
- Contextual help text explaining navigation
- Automatic return to current hole after inactivity

## Notes

### Architecture Decisions
- **Separation of Concerns**: currentHole handles GPS/AI features, viewingHole handles UI display
- **Conservative Map Behavior**: Map always centers on user location for safety and clarity
- **Progressive Enhancement**: Navigation enhances existing workflow without replacing core features

### Golf-Specific Considerations
- Navigation designed for solo golf experience (CaddieAI's focus)
- Quick access prioritized for common golf scenarios (checking scores, skipping holes)
- Minimal disruption to natural golf round rhythm
- Integration with existing hole completion workflow

### Future Enhancements
- Hole-specific notes and statistics
- Visual hole layout when navigating
- Integration with course hole information
- Advanced score analytics per hole