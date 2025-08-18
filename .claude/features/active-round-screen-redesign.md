# ActiveRoundScreen Redesign Feature Plan

## Overview
Redesign the ActiveRoundScreen to create a more immersive, modern golf experience by removing clutter and enhancing the hole navigation system with richer information display.

## Current State Analysis

### Issues Identified
1. **Header clutter**: White header bar reduces map immersion
2. **Distance overlay clutter**: "150y" black yardage box overlaps map content
3. **Basic hole navigation**: Current footer is plain and lacks information
4. **Handicap in navigation**: Unnecessary display of handicap score
5. **Limited round controls**: Complete/Abandon only in modal, not easily accessible

### Current Architecture
- `ActiveRoundScreen.tsx`: Main screen component with MapboxMapView
- `MapboxMapOverlay.tsx`: Handles all UI elements over the map
- Pin placement system with `pinLocation` and `pinDistances` state
- Round controls currently in modal popup only

## Requirements

### Elements to Remove
- [ ] Header bar (SafeAreaView with header styling)
- [ ] Yardage overlay box ("150y" distance indicator)
- [ ] Handicap score from hole navigation
- [ ] **Exclude**: Hazards and strategic notes (not requested)

### Elements to Enhance
- [ ] Hole navigation footer with modern card design
- [ ] Add more golf-relevant information to navigation
- [ ] Pin distance integration when pin is placed
- [ ] Complete/Abandon Round buttons in map overlay
- [ ] Overall design modernization with golf aesthetics

### Information to Display in Enhanced Hole Navigation
- [ ] Hole number and par value
- [ ] Current score for the hole (if available)
- [ ] Pin distance when pin is placed (e.g., "🚩 142y")
- [ ] Previous/Next hole navigation
- [ ] Clean, modern visual design

## Technical Implementation Plan

### 1. ActiveRoundScreen.tsx Modifications

#### Remove Header (Lines 1050-1123)
```tsx
// BEFORE: SafeAreaView with header styles
<SafeAreaView style={styles.container}>

// AFTER: Direct View for full immersion
<View style={styles.container}>
```

#### Add New Props for Enhanced Navigation
```tsx
// Add to MapboxMapOverlay props (around line 1081)
enhancedHoleNavigation={true}
pinDistanceInfo={pinDistances}
onCompleteRound={roundControlHandlers.complete}
onAbandonRound={roundControlHandlers.abandon}
```

### 2. MapboxMapOverlay.tsx Enhancements

#### Remove Yardage Overlay
```tsx
// Remove distance display overlay
{/* REMOVE: Distance overlay box */}
{shotPlacementDistance > 0 && (
  <View style={styles.distanceOverlay}>
    <Text style={styles.distanceText}>{shotPlacementDistance}y</Text>
  </View>
)}
```

#### Enhanced Hole Navigation Card
```tsx
// NEW: Enhanced hole navigation footer
<View style={styles.enhancedHoleNavigation}>
  <View style={styles.navigationCard}>
    {/* Hole Info Section */}
    <View style={styles.holeInfoSection}>
      <View style={styles.holeNumber}>
        <Text style={styles.holeNumberText}>HOLE</Text>
        <Text style={styles.holeNumberValue}>{currentHole}</Text>
      </View>
      <View style={styles.parInfo}>
        <Text style={styles.parLabel}>PAR</Text>
        <Text style={styles.parValue}>{getHolePar(currentHole)}</Text>
      </View>
      {/* Pin Distance (when pin is placed) */}
      {pinLocation && pinDistances.userToPin && (
        <View style={styles.pinInfo}>
          <Text style={styles.pinLabel}>🚩 PIN</Text>
          <Text style={styles.pinDistance}>{pinDistances.userToPin.distanceYards}y</Text>
        </View>
      )}
    </View>
    
    {/* Navigation Controls */}
    <View style={styles.navigationControls}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNavigateToPreviousHole}
        disabled={currentHole === 1}
      >
        <Icon name="chevron-left" size={24} color="#4a7c59" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNavigateToNextHole}
        disabled={currentHole === totalHoles}
      >
        <Icon name="chevron-right" size={24} color="#4a7c59" />
      </TouchableOpacity>
    </View>
    
    {/* Round Action Buttons */}
    <View style={styles.roundActions}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.completeButton]}
        onPress={onCompleteRound}
      >
        <Icon name="check" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Complete</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.abandonButton]}
        onPress={onAbandonRound}
      >
        <Icon name="close" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Abandon</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
```

### 3. New Styling Definitions

```tsx
const styles = StyleSheet.create({
  // Enhanced hole navigation
  enhancedHoleNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  
  navigationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  holeInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  holeNumber: {
    alignItems: 'center',
    marginRight: 24,
  },
  
  holeNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  
  holeNumberValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginTop: 2,
  },
  
  parInfo: {
    alignItems: 'center',
    marginRight: 24,
  },
  
  parLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  
  parValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4a7c59',
    marginTop: 2,
  },
  
  pinInfo: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  pinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369a1',
  },
  
  pinDistance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0369a1',
    marginTop: 2,
  },
  
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  
  roundActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  
  abandonButton: {
    backgroundColor: '#ef4444',
  },
  
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

## Props Interface Updates

### MapboxMapOverlay Props Addition
```tsx
interface MapboxMapOverlayProps {
  // Existing props...
  
  // New props for enhanced navigation
  enhancedHoleNavigation?: boolean;
  pinDistanceInfo?: PinDistances;
  onCompleteRound?: () => void;
  onAbandonRound?: () => void;
}
```

## Implementation Steps

### Phase 1: Remove Header and Yardage Overlay
1. [ ] Modify ActiveRoundScreen.tsx container structure
2. [ ] Remove yardage overlay from MapboxMapOverlay
3. [ ] Test full-screen map experience

### Phase 2: Enhance Hole Navigation
1. [ ] Implement enhanced navigation card component
2. [ ] Add hole info, par, and navigation controls
3. [ ] Style with modern golf aesthetics
4. [ ] Test hole navigation functionality

### Phase 3: Pin Integration
1. [ ] Add pin distance display logic
2. [ ] Show/hide pin info based on pin placement
3. [ ] Test pin distance accuracy

### Phase 4: Round Control Integration  
1. [ ] Add Complete/Abandon buttons to overlay
2. [ ] Connect to existing round control handlers
3. [ ] Test round completion flow

### Phase 5: Polish and Testing
1. [ ] Refine styling and animations
2. [ ] Test on different screen sizes
3. [ ] Verify all existing functionality works
4. [ ] Performance testing

## Success Criteria
- [ ] Header successfully removed for full-screen immersion
- [ ] Yardage overlay eliminated from map
- [ ] Enhanced hole navigation displays hole number, par, and pin distance
- [ ] Complete/Abandon functionality accessible from map overlay
- [ ] Modern golf UI maintains aesthetic consistency
- [ ] All existing functionality preserved
- [ ] No performance degradation

## Testing Plan
1. **Visual Testing**: Verify header removal and enhanced navigation design
2. **Functional Testing**: Test hole navigation, pin placement, and round controls
3. **Integration Testing**: Ensure all existing features continue working
4. **Performance Testing**: Check map rendering performance after changes
5. **Cross-Platform Testing**: Verify design works on iOS and Android

## Dependencies
- Existing MapboxMapView and MapboxMapOverlay components
- Pin placement system (pinLocation, pinDistances)
- Round control handlers (complete, abandon)
- Redux state management for hole navigation
- React Native Vector Icons for enhanced UI

## Risks and Mitigation
- **Risk**: Removing header might affect safe area handling
  - **Mitigation**: Ensure proper padding for device status bars
- **Risk**: Enhanced navigation might interfere with map interaction
  - **Mitigation**: Proper touch handling and z-index management
- **Risk**: Pin distance integration complexity
  - **Mitigation**: Thorough testing of pin placement and distance calculations

## Future Enhancements (Out of Scope)
- Weather integration in navigation
- Advanced statistics display
- Hole strategy recommendations
- Social features integration