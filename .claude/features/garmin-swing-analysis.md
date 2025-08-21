# Garmin Swing Analysis

## Overview
**Priority**: High  
**Complexity**: 5 (1=Simple, 5=Complex)  
**Estimated Timeline**: 12 weeks  
**Dependencies**: Existing AI Caddie screen, Profile screen, Round tracking, Bluetooth capabilities

Integrate Garmin Forerunner 55 motion sensors to automatically detect golf swings during active rounds and provide AI-powered swing analysis with visual feedback and persistent data storage for future statistical features.

## User Stories & Acceptance Criteria

### Primary User Story
As a golfer with a Garmin Forerunner 55, I want my device to automatically detect my golf swings during active rounds and provide detailed swing analysis so I can improve my golf performance through AI-powered feedback and visual swing path comparisons.

### Acceptance Criteria
- [ ] Garmin Forerunner 55 connection via Profile screen using direct Bluetooth
- [ ] Automatic swing detection only during active rounds
- [ ] Capture swing speed and swing angle from motion sensors
- [ ] Mobile device sensor fallback for testing and unsupported devices
- [ ] Swing analysis display exclusively in AI Caddie screen
- [ ] Visual swing path chart comparing actual vs ideal swing templates
- [ ] Text-based AI feedback on swing performance
- [ ] Persistent swing data storage for future statistical analysis
- [ ] Real-time swing analysis triggered automatically after detection

### Additional User Stories
- As a golfer, I want to connect my Garmin device once in settings and have it work automatically during rounds
- As a golfer with an incompatible device, I want to test swing detection using my phone's sensors
- As a golfer, I want to see my swing progression over time for future analytics features

## Functional Requirements

### Core Functionality
- **Garmin Integration**: Direct Bluetooth connection to Forerunner 55 motion sensors
- **Swing Detection**: Automatic detection of golf swings using accelerometer/gyroscope data
- **Motion Analysis**: Extract swing speed (mph) and swing angle (degrees) from sensor data
- **Visual Representation**: Chart displaying swing path with actual vs ideal comparison
- **AI Enhancement**: Integrate swing data with existing OpenAI caddie for personalized feedback
- **Data Persistence**: Store all swing metrics for future dashboard analytics features
- **Active Round Restriction**: Only detect and analyze swings during active rounds

### User Interface Requirements
- **Connection Setup**: Garmin device pairing section in Profile screen
- **Analysis Display**: Swing analysis section in existing AI Caddie screen only
- **Chart Visualization**: Mobile-optimized swing path charts with clear visual indicators
- **Status Indicators**: Clear connection status and swing detection feedback
- **Fallback UI**: Mobile sensor testing mode with calibration instructions

### Business Rules and Validation
- **Round Dependency**: Swing analysis only available during `round.status = 'in_progress'`
- **Device Priority**: Garmin sensors take priority, fallback to mobile sensors when Garmin unavailable
- **Data Validation**: Validate swing metrics are within realistic ranges (speed: 40-150 mph, angles: valid geometry)
- **Connection Management**: Handle Bluetooth disconnections gracefully with user notifications

## Technical Specifications

### Database Changes Required

**New Tables:**
```sql
-- V1.20.0__Create_Swing_Analysis_Tables.sql

-- Main swing analysis data table
CREATE TABLE swing_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    hole_id INTEGER REFERENCES holes(id) ON DELETE SET NULL,
    
    -- Swing metrics from Garmin/mobile sensors
    swing_speed_mph DECIMAL(5,2) CHECK (swing_speed_mph >= 20 AND swing_speed_mph <= 200),
    swing_angle_degrees DECIMAL(6,2) CHECK (swing_angle_degrees >= -180 AND swing_angle_degrees <= 180),
    backswing_angle_degrees DECIMAL(6,2),
    follow_through_angle_degrees DECIMAL(6,2),
    
    -- Raw sensor data for future analysis
    raw_sensor_data JSONB DEFAULT '{}',
    
    -- Device and detection info
    detection_source VARCHAR(20) CHECK (detection_source IN ('garmin', 'mobile')) NOT NULL,
    device_model VARCHAR(100),
    detection_confidence DECIMAL(3,2) CHECK (detection_confidence >= 0 AND detection_confidence <= 1),
    
    -- Analysis results
    swing_quality_score DECIMAL(3,2) CHECK (swing_quality_score >= 0 AND swing_quality_score <= 10),
    ai_feedback TEXT,
    compared_to_template VARCHAR(50) DEFAULT 'standard_driver',
    
    -- GPS context
    shot_location GEOMETRY(POINT, 4326),
    club_used VARCHAR(50),
    distance_to_pin_yards INTEGER,
    
    -- Audit fields
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Garmin device connections table
CREATE TABLE garmin_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    bluetooth_address VARCHAR(17) NOT NULL, -- MAC address format
    connection_status VARCHAR(20) CHECK (connection_status IN ('connected', 'disconnected', 'pairing', 'error')) DEFAULT 'disconnected',
    last_connected_at TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    firmware_version VARCHAR(50),
    
    -- Connection settings
    auto_connect BOOLEAN DEFAULT TRUE,
    preferred_device BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    paired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, bluetooth_address)
);

-- Apply updated_at triggers
CREATE TRIGGER update_swing_analyses_updated_at 
    BEFORE UPDATE ON swing_analyses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_garmin_devices_updated_at 
    BEFORE UPDATE ON garmin_devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

**Performance Indexes:**
```sql
-- Swing analyses indexes
CREATE INDEX idx_swing_analyses_user_id ON swing_analyses(user_id);
CREATE INDEX idx_swing_analyses_round_id ON swing_analyses(round_id);
CREATE INDEX idx_swing_analyses_hole_id ON swing_analyses(hole_id);
CREATE INDEX idx_swing_analyses_user_round ON swing_analyses(user_id, round_id);
CREATE INDEX idx_swing_analyses_detected_at ON swing_analyses(detected_at);
CREATE INDEX idx_swing_analyses_detection_source ON swing_analyses(detection_source);
CREATE INDEX idx_swing_analyses_shot_location ON swing_analyses USING GIST(shot_location);

-- Garmin devices indexes  
CREATE INDEX idx_garmin_devices_user_id ON garmin_devices(user_id);
CREATE INDEX idx_garmin_devices_connection_status ON garmin_devices(connection_status);
CREATE INDEX idx_garmin_devices_bluetooth_address ON garmin_devices(bluetooth_address);
```

### API Endpoints Required

**Backend (.NET) Controllers:**
```csharp
// SwingAnalysisController.cs
[ApiController]
[Route("api/swing-analysis")]
public class SwingAnalysisController : ControllerBase
{
    // GET api/swing-analysis/user/{userId}/round/{roundId}
    [HttpGet("user/{userId}/round/{roundId}")]
    public async Task<IActionResult> GetSwingAnalysesByRound(int userId, int roundId);
    
    // POST api/swing-analysis
    [HttpPost]
    public async Task<IActionResult> CreateSwingAnalysis([FromBody] CreateSwingAnalysisRequest request);
    
    // GET api/swing-analysis/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSwingAnalysisById(int id);
}

// GarminDeviceController.cs
[ApiController]
[Route("api/garmin-devices")]
public class GarminDeviceController : ControllerBase
{
    // GET api/garmin-devices/user/{userId}
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserGarminDevices(int userId);
    
    // POST api/garmin-devices
    [HttpPost]
    public async Task<IActionResult> RegisterGarminDevice([FromBody] RegisterGarminDeviceRequest request);
    
    // PUT api/garmin-devices/{id}/status
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateConnectionStatus(int id, [FromBody] UpdateConnectionStatusRequest request);
    
    // DELETE api/garmin-devices/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGarminDevice(int id);
}
```

**Request/Response DTOs:**
```csharp
public class CreateSwingAnalysisRequest
{
    public int UserId { get; set; }
    public int RoundId { get; set; }
    public int? HoleId { get; set; }
    public decimal SwingSpeedMph { get; set; }
    public decimal SwingAngleDegrees { get; set; }
    public decimal? BackswingAngleDegrees { get; set; }
    public decimal? FollowThroughAngleDegrees { get; set; }
    public string DetectionSource { get; set; }
    public string? DeviceModel { get; set; }
    public decimal DetectionConfidence { get; set; }
    public object? RawSensorData { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? ClubUsed { get; set; }
    public int? DistanceToPinYards { get; set; }
}

public class SwingAnalysisResponse
{
    public int Id { get; set; }
    public decimal SwingSpeedMph { get; set; }
    public decimal SwingAngleDegrees { get; set; }
    public decimal? SwingQualityScore { get; set; }
    public string? AiFeedback { get; set; }
    public string DetectionSource { get; set; }
    public DateTime DetectedAt { get; set; }
    public string? ClubUsed { get; set; }
    public int? DistanceToPinYards { get; set; }
}
```

### Mobile App Changes

**New Services:**
```typescript
// GarminBluetoothService.ts - Direct Bluetooth connection to Forerunner 55
interface GarminBluetoothService {
  scanForDevices(): Promise<GarminDevice[]>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnectDevice(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  subscribeBatteryLevel(callback: (level: number) => void): void;
  subscribeMotionData(callback: (data: MotionData) => void): void;
}

// SwingDetectionService.ts - Analyze motion data for swing detection  
interface SwingDetectionService {
  startSwingMonitoring(source: 'garmin' | 'mobile'): Promise<void>;
  stopSwingMonitoring(): Promise<void>;
  processMotionData(data: MotionData): SwingDetectionResult | null;
  calibrateDevice(): Promise<CalibrationResult>;
}

// SwingAnalysisService.ts - Process swing metrics and generate feedback
interface SwingAnalysisService {
  analyzeSwing(swingData: SwingDetectionResult): Promise<SwingAnalysis>;
  compareToTemplate(swing: SwingData, template: 'driver' | 'iron' | 'wedge'): SwingComparison;
  generateAIFeedback(analysis: SwingAnalysis): Promise<string>;
  saveSwingAnalysis(analysis: SwingAnalysis): Promise<number>;
}

// MobileSensorService.ts - Fallback using device sensors
interface MobileSensorService {
  startSensorMonitoring(): Promise<void>;
  stopSensorMonitoring(): Promise<void>;
  calibrateSensors(): Promise<void>;
  getAccelerometerData(): AccelerometerData;
  getGyroscopeData(): GyroscopeData;
}
```

**New Components:**
```typescript
// Profile screen integration
interface GarminConnectionSection {
  connectedDevices: GarminDevice[];
  connectionStatus: ConnectionStatus;
  onScanDevices: () => void;
  onConnectDevice: (device: GarminDevice) => void;
  onDisconnectDevice: (deviceId: string) => void;
  onTestMobileSensors: () => void;
}

// AI Caddie screen integration  
interface SwingAnalysisSection {
  latestSwing: SwingAnalysis | null;
  isAnalyzing: boolean;
  showSwingChart: boolean;
  onViewSwingChart: () => void;
  onRequestFeedback: () => void;
}

// Swing visualization
interface SwingPathChart {
  swingData: SwingData;
  templateData: SwingTemplateData;
  showComparison: boolean;
  chartType: 'path' | 'speed' | 'angle';
  onChartTypeChange: (type: string) => void;
}
```

**Required Dependencies:**
```json
{
  "react-native-ble-plx": "^3.0.2",
  "react-native-sensors": "^7.3.6", 
  "victory-native": "^36.8.4",
  "react-native-svg": "^13.9.0",
  "react-native-chart-kit": "^6.12.0"
}
```

### Integration Points
- **Profile Screen**: Add Garmin device connection section with pairing and status management
- **AI Caddie Screen**: Display swing analysis results with charts and AI feedback
- **Round Management**: Only enable swing detection during active rounds (`round.status = 'in_progress'`)
- **OpenAI Integration**: Enhance existing AI caddie with swing performance context
- **Redux State**: Manage Garmin connection status, swing detection state, and analysis results
- **Background Services**: Handle Bluetooth connection and motion data processing

## Implementation Plan

### Phase 1: Foundation & Database (Weeks 1-2)
**Objective**: Establish database schema and backend API foundation

**Tasks:**
- [ ] Create database migration V1.20.0 for swing analysis tables
- [ ] Implement SwingAnalysisController with CRUD operations
- [ ] Implement GarminDeviceController for device management
- [ ] Create AutoMapper profiles for swing analysis DTOs
- [ ] Add validation and error handling for swing data
- [ ] Create unit tests for controllers and services

**Deliverables:**
- Database tables: `swing_analyses`, `garmin_devices`
- Backend APIs: SwingAnalysis and GarminDevice controllers
- Data validation and business logic
- Unit test coverage >80%

### Phase 2: Garmin Bluetooth Integration (Weeks 3-5)
**Objective**: Establish direct Bluetooth connection with Forerunner 55

**Tasks:**
- [ ] Research Forerunner 55 Bluetooth services and characteristics
- [ ] Implement GarminBluetoothService for device connection
- [ ] Add device scanning and pairing functionality
- [ ] Implement motion data subscription and parsing
- [ ] Add connection status management and error handling
- [ ] Create Profile screen Garmin connection section
- [ ] Test with actual Forerunner 55 device

**Deliverables:**
- Working Bluetooth connection to Forerunner 55
- Real-time motion data streaming
- Profile screen device management UI
- Connection reliability and error recovery

### Phase 3: Swing Detection Algorithm (Weeks 6-7)
**Objective**: Develop swing detection logic from motion sensor data

**Tasks:**
- [ ] Implement SwingDetectionService with motion analysis algorithms
- [ ] Create swing pattern recognition for golf-specific movements
- [ ] Add confidence scoring and false positive filtering
- [ ] Implement calibration process for accurate detection
- [ ] Add swing metrics extraction (speed, angle, timing)
- [ ] Create mobile sensor fallback implementation
- [ ] Test detection accuracy with various swing styles

**Deliverables:**
- Accurate swing detection algorithm (>85% accuracy)
- Swing speed and angle calculation
- Mobile sensor fallback system
- Calibration and confidence scoring

### Phase 4: UI Components & Visualization (Weeks 8-9)
**Objective**: Create swing analysis UI and chart visualization

**Tasks:**
- [ ] Implement SwingAnalysisSection in AI Caddie screen
- [ ] Create SwingPathChart component with Victory Native
- [ ] Add swing metrics display with performance indicators
- [ ] Implement actual vs ideal swing comparison charts
- [ ] Add responsive design for different device sizes
- [ ] Create loading states and error handling UI
- [ ] Add accessibility features and touch optimizations

**Deliverables:**
- Swing analysis UI integrated in AI Caddie screen
- Interactive swing path charts
- Performance metrics visualization
- Mobile-optimized responsive design

### Phase 5: AI Integration & Advanced Features (Weeks 10-12)
**Objective**: Enhance AI caddie with swing analysis and add advanced features

**Tasks:**
- [ ] Integrate swing data with existing OpenAI caddie context
- [ ] Implement AI-powered swing feedback generation
- [ ] Add swing template comparison system
- [ ] Create swing progression tracking for future analytics
- [ ] Implement data export functionality
- [ ] Add comprehensive error handling and edge cases
- [ ] Perform end-to-end testing with real golf rounds
- [ ] Optimize performance and battery usage

**Deliverables:**
- AI-enhanced swing feedback
- Swing template comparison system
- Complete feature integration testing
- Performance optimization
- User acceptance testing

## Testing Strategy

### Component Testing
- Unit tests for all swing analysis services and utilities
- Bluetooth service mocking for reliable testing
- Chart component rendering tests with mock data
- Profile and AI Caddie screen integration tests

### Integration Testing
- End-to-end Bluetooth connection and data flow testing
- Real device testing with Forerunner 55
- Mobile sensor fallback testing on various devices
- API integration tests for swing data persistence

### User Experience Testing
- Golf course field testing during actual rounds
- Battery life impact assessment
- Connection reliability in outdoor environments
- Swing detection accuracy across different users and swing styles

## Success Metrics

### Technical Metrics
- Swing detection accuracy >85%
- Bluetooth connection reliability >95%
- API response times <200ms
- Battery impact <10% additional drain per round
- Chart rendering performance <100ms

### User Experience Metrics
- Device pairing success rate >90%
- Swing analysis availability >95% during rounds
- User satisfaction with AI feedback quality
- Feature adoption rate among Garmin users
- Retention improvement for users with connected devices

## Risks & Considerations

### Technical Risks
- **Bluetooth Connectivity**: Outdoor golf course environments may affect Bluetooth reliability
  - Mitigation: Implement robust reconnection logic and graceful degradation
- **Motion Sensor Accuracy**: Forerunner 55 sensors may not provide golf-specific precision
  - Mitigation: Extensive testing and algorithm tuning, mobile sensor fallback
- **Battery Impact**: Continuous Bluetooth and sensor monitoring may drain device batteries
  - Mitigation: Optimize polling frequency and implement smart power management

### User Experience Risks
- **Device Compatibility**: Limited to specific Garmin models initially
  - Mitigation: Clear communication about supported devices, mobile fallback
- **Setup Complexity**: Bluetooth pairing may be challenging for some users
  - Mitigation: Detailed onboarding flow and troubleshooting guides
- **Performance Expectations**: Users may expect professional-grade swing analysis
  - Mitigation: Set appropriate expectations and focus on trend analysis over precision

### Golf-Specific Considerations
- **Environmental Factors**: Weather, course conditions may affect sensor accuracy
  - Mitigation: Environmental data context and confidence scoring
- **Swing Variation**: Different clubs and shot types produce different swing patterns
  - Mitigation: Multiple swing templates and club-specific analysis
- **Practice vs Real Swings**: Detecting actual shots vs practice swings
  - Mitigation: GPS movement correlation and user confirmation options

## Future Enhancements

### Dashboard Analytics (Future Feature)
- Swing progression tracking over time
- Performance correlation with course conditions
- Club-specific swing analysis and recommendations
- Comparative analysis with other golfers

### Advanced AI Features
- Personalized coaching based on swing patterns
- Real-time swing correction suggestions
- Integration with pro shop recommendations
- Video analysis enhancement (future camera integration)

### Device Expansion
- Support for additional Garmin models (Fenix, Approach series)
- Apple Watch integration
- Integration with other fitness wearables
- Custom golf swing sensors

## Notes

This Garmin swing analysis feature represents a significant enhancement to CaddieAI's AI-powered golf companion capabilities. By integrating motion sensor data from Garmin devices, we provide golfers with objective, data-driven insights into their swing mechanics while maintaining the app's focus on enhancing the solo golf experience.

Key success factors:
- Reliable Bluetooth connectivity in outdoor golf environments
- Accurate swing detection that distinguishes real shots from practice swings
- Meaningful AI feedback that helps golfers improve their performance
- Seamless integration with existing round tracking and AI caddie features
- Persistent data storage that enables future statistical analysis and trends

The implementation leverages CaddieAI's existing OpenAI integration to provide contextual, personalized feedback while building a foundation for advanced analytics features in future releases.