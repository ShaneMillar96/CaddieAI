# Test Mode Location Override System

## Overview
**Priority**: High  
**Complexity**: 3 (1=Simple, 5=Complex)  
**Estimated Timeline**: 3-4 days  
**Dependencies**: Current location testing system (MAPBOX_GOLF_LOCATION), Redux Toolkit, React Navigation

This feature replaces the current hardcoded `MAPBOX_GOLF_LOCATION` system with a comprehensive test mode that allows developers and testers to set custom location coordinates through a dashboard interface, with a clear visual indicator when test mode is active.

## User Stories & Acceptance Criteria

### Primary User Story
As a developer/tester, I want to enable test mode and set custom location coordinates through the app dashboard so that I can test location-dependent features at any golf course without physical presence.

### Acceptance Criteria
- [ ] Replace `MAPBOX_GOLF_LOCATION` boolean with `TEST_MODE` configuration
- [ ] Add dashboard interface to enable/disable test mode
- [ ] Allow input of custom latitude/longitude coordinates through the app
- [ ] Persist test coordinates across app sessions when test mode is enabled
- [ ] Display purple "Test Mode" indicator on all screens when active
- [ ] Integrate with existing LocationService.ts and locationTesting.ts
- [ ] Ensure all location-dependent features use test coordinates when enabled
- [ ] Provide validation for coordinate inputs (latitude: -90 to 90, longitude: -180 to 180)

### Additional User Stories
- As a developer, I want to quickly toggle test mode on/off without rebuilding the app
- As a tester, I want to select from preset golf course locations for common testing scenarios
- As a developer, I want clear visual feedback when test mode is active to avoid confusion

## Functional Requirements

### Core Functionality
- **Configuration Management**: Replace boolean `MAPBOX_GOLF_LOCATION` with comprehensive `TEST_MODE` object
- **Dynamic Coordinate Setting**: Allow runtime setting of test coordinates through app interface
- **Persistence**: Store test mode state and coordinates in Redux with AsyncStorage persistence
- **Visual Indicator**: Purple capsule/badge showing "Test Mode" on all screens when active
- **Location Override**: Seamlessly integrate with existing `getLocationWithOverride()` function
- **Validation**: Comprehensive input validation for coordinate values and ranges

### User Interface Requirements
- **Settings Interface**: Add test mode section to ProfileScreen/Settings with toggle and coordinate input
- **Coordinate Input**: Numeric input fields for latitude and longitude with validation
- **Preset Locations**: Quick-select buttons for common test locations (Faughan Valley, other courses)
- **Test Mode Indicator**: Small, non-intrusive purple badge on app header/navigation
- **Error Handling**: Clear error messages for invalid coordinates or location service failures

## Technical Specifications

### Database Changes Required
**No database changes required** - All state managed in Redux with AsyncStorage persistence.

### Configuration File Changes
**mapbox.config.js**:
```javascript
// Replace current boolean flag
export const TEST_MODE = {
  enabled: false,  // Runtime configurable through app
  coordinates: {
    latitude: 55.020906,   // Default: Faughan Valley
    longitude: -7.247879
  },
  presets: [
    {
      name: 'Faughan Valley Golf Centre',
      latitude: 55.020906,
      longitude: -7.247879
    },
    {
      name: 'Augusta National (Test)',
      latitude: 33.503,
      longitude: -82.020
    }
  ]
};
```

### Redux State Management

**New Slice: testModeSlice.ts**
```typescript
interface TestModeState {
  enabled: boolean;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  presets: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
  lastUpdated: string;
}

// Actions: enableTestMode, disableTestMode, setTestCoordinates, loadPreset
```

### Location Service Integration

**Enhanced locationTesting.ts**:
```typescript
// Replace hardcoded checks with Redux state
export const isTestModeEnabled = (): boolean => {
  if (!__DEV__) return false;
  
  const store = getStore(); // Access Redux store
  return store.getState().testMode.enabled;
};

export const getTestModeLocation = (): LocationData => {
  const store = getStore();
  const { coordinates } = store.getState().testMode;
  
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accuracy: 5.0,
    altitude: 30,
    heading: undefined,
    speed: 0,
    timestamp: Date.now()
  };
};
```

### UI Components Required

**New Components:**
- `TestModeToggle` - Settings interface for enabling/disabling test mode
- `CoordinateInput` - Validated input fields for latitude/longitude
- `LocationPresets` - Quick-select buttons for preset locations
- `TestModeIndicator` - Purple badge component for header/navigation
- `TestModeSettings` - Complete settings section for ProfileScreen

**Modified Components:**
- `ProfileScreen` - Add test mode settings section
- `AppNavigator` or header component - Add test mode indicator
- `LocationService` integration - Use Redux state instead of config file

### State Management Updates

**store/index.ts modifications:**
```typescript
import testModeReducer from './slices/testModeSlice';

const rootReducer = combineReducers({
  // ... existing reducers
  testMode: testModeReducer,
});

const persistConfig = {
  // ... existing config
  whitelist: ['auth', 'rounds', 'userCourses', 'testMode'], // Persist test mode
};
```

## Implementation Plan

### Recommended Agents & Sequence

1. **react-native-ui-developer** - Frontend implementation
   - Create new Redux slice for test mode state management
   - Build test mode settings interface components
   - Implement test mode indicator across navigation
   - Update ProfileScreen with settings section
   - Add coordinate validation and error handling

2. **react-native-ui-developer** - Location service integration
   - Enhance locationTesting.ts to use Redux state
   - Update mapbox.config.js structure
   - Integrate with existing LocationService.ts
   - Test location override functionality

3. **general-purpose** - Integration testing and validation
   - End-to-end testing of test mode workflow
   - Validation of coordinate persistence
   - Cross-platform compatibility testing

### Implementation Phases

**Phase 1: Redux State Management**
- [ ] Create testModeSlice.ts with actions and reducers
- [ ] Update store configuration to include testMode slice
- [ ] Add testMode to persistence whitelist
- [ ] Create selectors for test mode state

**Phase 2: Configuration & Location Service Updates**
- [ ] Update mapbox.config.js structure for TEST_MODE
- [ ] Enhance locationTesting.ts to use Redux state
- [ ] Integrate with existing LocationService.ts
- [ ] Add coordinate validation utilities

**Phase 3: UI Components**
- [ ] Create TestModeIndicator component
- [ ] Build CoordinateInput with validation
- [ ] Create LocationPresets quick-select component
- [ ] Build TestModeSettings section

**Phase 4: Integration & Testing**
- [ ] Add test mode settings to ProfileScreen
- [ ] Integrate test mode indicator in navigation
- [ ] End-to-end testing of location override
- [ ] Cross-platform testing (iOS/Android)

## Testing Strategy

### Component Testing
- Unit tests for testModeSlice actions and reducers
- Component tests for CoordinateInput validation
- Integration tests for Redux state persistence
- Location service override functionality tests

### User Acceptance Testing
- Toggle test mode on/off through dashboard
- Set custom coordinates and verify location override
- Test coordinate persistence across app restarts
- Validate test mode indicator appears on all screens
- Test preset location quick-select functionality

### Edge Case Testing
- Invalid coordinate inputs (out of range, non-numeric)
- Location service failures in test mode
- App behavior when switching between test and real GPS
- Memory management with coordinate history

## Success Metrics

### Technical Metrics
- Test mode toggle response time < 200ms
- Coordinate input validation accuracy 100%
- Location override success rate > 99%
- No memory leaks with repeated toggling

### User Experience Metrics
- Settings interface usability (easy coordinate input)
- Clear visual indication of test mode status
- Smooth transition between test and real GPS modes
- Intuitive preset location selection

## Risks & Considerations

### Technical Risks
- **Redux State Complexity**: Ensure test mode state doesn't interfere with other location features
- **Location Service Integration**: Seamless integration with existing LocationService.ts without breaking changes
- **Performance Impact**: Test mode indicator on all screens shouldn't affect performance

### User Experience Risks
- **Developer Confusion**: Clear indication of test mode to prevent confusion with real GPS
- **Coordinate Input Errors**: Robust validation to prevent invalid location settings
- **Accidental Test Mode**: Clear toggle interface to prevent unintended activation

### Mitigation Strategies
- **Comprehensive Testing**: Thorough testing of location override in various scenarios
- **Clear UI Feedback**: Prominent test mode indicator and clear settings interface
- **Fallback Mechanisms**: Graceful fallback to real GPS if test mode fails
- **Documentation**: Clear developer documentation for test mode usage

## Implementation Files Structure

```
CaddieAIMobile/src/
├── store/slices/
│   └── testModeSlice.ts                 # Redux slice for test mode state
├── components/testMode/
│   ├── TestModeIndicator.tsx            # Purple badge indicator
│   ├── TestModeSettings.tsx             # Complete settings section
│   ├── CoordinateInput.tsx              # Validated coordinate inputs
│   └── LocationPresets.tsx              # Quick-select preset locations
├── utils/
│   └── locationTesting.ts               # Enhanced with Redux integration
├── screens/main/
│   └── ProfileScreen.tsx                # Updated with test mode settings
└── mapbox.config.js                     # Updated configuration structure
```

## Notes

### Development Workflow
- Test mode only available in `__DEV__ = true` environment for safety
- Redux DevTools integration for debugging test mode state changes
- Clear logging for test mode activation/deactivation

### Future Enhancements
- **Map Interface**: Allow coordinate selection through map interface
- **Location History**: Track and save frequently used test locations
- **Team Sharing**: Share test locations between team members
- **Course Database Integration**: Auto-populate coordinates from golf course database

### Security Considerations
- Test mode disabled in production builds
- No sensitive location data stored in test mode state
- Clear user indication when location data is mocked

This implementation provides a comprehensive replacement for the current MAPBOX_GOLF_LOCATION system while maintaining backward compatibility and enhancing the developer/tester experience with flexible location testing capabilities.