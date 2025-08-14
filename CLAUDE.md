# CaddieAI Development Guide

## Project Context

CaddieAI is an AI-powered golf companion mobile application designed to enhance the solo golf experience. The app provides intelligent conversational AI, real-time course guidance, and personalized recommendations to make golf more engaging and interactive.

### Tech Stack

**Backend (.NET 9.0)**
- ASP.NET Core Web API
- Entity Framework Core with PostgreSQL
- Clean Architecture pattern
- AutoMapper for object mapping
- xUnit for testing
- Docker for containerization

**Frontend (React Native)**
- React Native with TypeScript
- Redux Toolkit for state management
- React Navigation for routing
- Expo for development workflow

**External Services**
- OpenAI GPT-4o Real-time API for AI conversations and voice responses
- Mapbox Search Box API v1 for golf course detection and mapping
- Native GPS for location services (@react-native-community/geolocation)
- PostgreSQL with PostGIS for geospatial data

**Infrastructure**
- Docker & Docker Compose for local development
- Flyway for database migrations
- PostgreSQL with PostGIS extension

## Architecture & Design Principles

### Clean Architecture
- **API Layer**: Controllers handle HTTP requests/responses only
- **Service Layer**: Business logic and domain operations
- **Data Access Layer**: Entity Framework Core repositories and data access
- **Domain Layer**: Core business entities and interfaces

### SOLID Principles
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### Domain-Driven Design
- Rich domain models with behavior
- Domain services for complex business logic
- Repository pattern for data access
- Domain events for cross-cutting concerns

## Backend Development Standards

### Project Structure
```
backend/
├── src/
│   ├── caddie.portal.api/          # Web API controllers and configuration
│   ├── caddie.portal.services/     # Business logic and domain services
│   ├── caddie.portal.dal/          # Data access layer and repositories
│   └── caddie.portal.domain/       # Domain entities and interfaces
├── test/
│   ├── caddie.portal.api.tests/    # API integration tests
│   ├── caddie.portal.services.tests/ # Unit tests for business logic
│   └── caddie.portal.dal.tests/    # Data access tests
└── database/
    └── migrations/                 # Flyway SQL migration scripts
```

### AutoMapper Configuration
- Create specific mapping profiles for each controller and service
- Profile naming convention: `{Controller/Service}MappingProfile`
- Keep profiles focused and single-responsibility
- Use explicit member mapping when needed

```csharp
public class UserControllerMappingProfile : Profile
{
    public UserControllerMappingProfile()
    {
        CreateMap<CreateUserRequest, User>();
        CreateMap<User, UserResponse>();
    }
}
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `UserService`, `GolfRoundRepository`)
- **Methods**: PascalCase (e.g., `GetUserById`, `CreateGolfRound`)
- **Variables**: camelCase (e.g., `userId`, `courseData`)
- **Constants**: UPPER_CASE (e.g., `MAX_HOLES_PER_ROUND`, `DEFAULT_TIMEOUT`)
- **Interfaces**: Prefix with 'I' (e.g., `IUserService`, `IGolfRoundRepository`)

### Constants Management
- Create dedicated Constants classes per domain area (`backend/src/caddie.portal.services/Constants/`)
- Use static readonly for complex constants
- Group related constants together with nested classes
- Avoid magic numbers and strings in code

```csharp
public static class GolfConstants
{
    public static readonly int STANDARD_HOLES_PER_ROUND = 18;
    public static readonly int MAX_PLAYERS_PER_GROUP = 4;
    public static readonly TimeSpan DEFAULT_ROUND_TIMEOUT = TimeSpan.FromHours(6);
    
    public static class ParValues
    {
        public static readonly int PAR_3 = 3;
        public static readonly int PAR_4 = 4;
        public static readonly int PAR_5 = 5;
    }
}
```

**Available Constants Classes:**
- `GolfConstants` - Golf-specific constants (par values, handicaps, distances)
- `RoundConstants` - Round management constants (timeouts, scoring limits)
- `AIConstants` - AI service constants (OpenAI settings, rate limits)
- `ApiConstants` - API constants (HTTP responses, headers, validation limits)

### Enum Development Pattern

**For Database Lookup Values**: Use enums with integer values that map to database lookup tables for type safety and performance.

#### Enum Definition
Create enums in `caddie.portal.dal.Enums` namespace with explicit integer values:

```csharp
namespace caddie.portal.dal.Enums;

public enum RoundStatus
{
    NotStarted = 1,
    InProgress = 2,
    Paused = 3,
    Completed = 4,
    Abandoned = 5
}
```

#### Database Schema
- Create lookup table with integer primary key matching enum values
- Use foreign key relationship instead of enum column for performance
- Include name and description columns for human readability

```sql
CREATE TABLE RoundStatuses (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO RoundStatuses (id, name, description) VALUES 
(1, 'not_started', 'Round has not been started yet'),
(2, 'in_progress', 'Round is currently being played');
```

#### Entity Configuration
```csharp
public class Round
{
    public int StatusId { get; set; }
    public virtual RoundStatus Status { get; set; } = null!;
}
```

#### Repository Usage
Use enum casting for type-safe queries without FromSqlRaw:

```csharp
// Good: Type-safe enum-based filtering
public async Task<IEnumerable<Round>> GetActiveRoundsAsync()
{
    return await _context.Rounds
        .Include(r => r.Status)
        .Where(r => r.StatusId == (int)RoundStatus.InProgress || 
                   r.StatusId == (int)RoundStatus.Paused)
        .ToListAsync();
}

// Avoid: Raw SQL queries
// FromSqlRaw("SELECT * FROM rounds WHERE status = 'in_progress'")
```

#### Service Layer Enum Handling
```csharp
// Convert between service enum and database ID
private async Task<int> GetStatusIdByNameAsync(string statusName)
{
    var status = await _context.RoundStatuses
        .FirstOrDefaultAsync(s => s.Name == statusName);
    return status?.Id ?? (int)RoundStatus.NotStarted;
}

// Use enum for business logic
if (currentStatus == ServiceRoundStatus.InProgress)
{
    // Business logic here
}
```

#### Benefits of Enum Pattern
- **Type Safety**: Compile-time checking prevents invalid status values
- **Performance**: Integer comparisons faster than string operations
- **IntelliSense**: IDE autocompletion for available values
- **Refactoring**: Easy to rename and track usage across codebase
- **Validation**: Automatic validation of valid enum values

### Entity Framework DAL Model Standards

**IMPORTANT**: All DAL models use Data Annotations for self-documenting, maintainable code. The DbContext OnModelCreating method is minimal and contains only PostgreSQL-specific configurations.

#### Data Annotations Pattern
All entity models must follow this comprehensive Data Annotations pattern:

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries; // Only for PostGIS models

namespace caddie.portal.dal.Models;

/// <summary>
/// Model documentation
/// </summary>
[Table("table_name")] // Always underscore_case
public partial class ModelName
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("required_field")]
    [StringLength(255)]
    public string RequiredField { get; set; } = null!;

    [Column("optional_field")]
    [StringLength(100)]
    public string? OptionalField { get; set; }

    // Foreign keys
    [Column("foreign_key_id")]
    public int ForeignKeyId { get; set; }

    // JSONB columns
    [Column("json_data", TypeName = "jsonb")]
    public string? JsonData { get; set; }

    // PostGIS geometry columns
    [Column("location", TypeName = "geometry(Point,4326)")]
    public Point? Location { get; set; }

    // Decimal precision
    [Column("decimal_value", TypeName = "decimal(10,2)")]
    public decimal? DecimalValue { get; set; }

    // Timestamps
    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ForeignKeyId")]
    public virtual RelatedModel RelatedModel { get; set; } = null!;

    // Inverse properties
    [InverseProperty("ModelName")]
    public virtual ICollection<RelatedModel> RelatedModels { get; set; } = new List<RelatedModel>();
}
```

#### Naming Conventions for DAL Models

**Table Names**: Always use `underscore_case`
- ✅ `[Table("user_sessions")]`
- ✅ `[Table("chat_messages")]`
- ✅ `[Table("club_recommendations")]`
- ❌ `[Table("UserSessions")]`
- ❌ `[Table("chatmessages")]`

**Column Names**: Always use `underscore_case`
- ✅ `[Column("created_at")]`
- ✅ `[Column("user_id")]`
- ✅ `[Column("hole_number")]`
- ❌ `[Column("CreatedAt")]`
- ❌ `[Column("userId")]`

#### Required Data Annotations

**Every model must include:**
1. `[Table("table_name")]` - Database table mapping
2. `[Key]` and `[Column("id")]` - Primary key mapping
3. `[Column("column_name")]` - All property column mappings
4. `[Required]` - Non-nullable database columns
5. `[StringLength(n)]` - String column maximum lengths
6. `[ForeignKey("PropertyName")]` - Foreign key relationships

#### PostgreSQL-Specific Configurations

**JSONB Columns:**
```csharp
[Column("metadata", TypeName = "jsonb")]
public string? Metadata { get; set; }
```

**PostGIS Geometry Types:**
```csharp
// Point geometry
[Column("location", TypeName = "geometry(Point,4326)")]
public Point? Location { get; set; }

// Polygon geometry
[Column("boundary", TypeName = "geometry(Polygon,4326)")]
public Polygon? Boundary { get; set; }

// LineString geometry
[Column("path", TypeName = "geometry(LineString,4326)")]
public LineString? Path { get; set; }
```

**Decimal Precision:**
```csharp
[Column("latitude", TypeName = "decimal(10,7)")]
public decimal Latitude { get; set; }

[Column("confidence_score", TypeName = "decimal(3,2)")]
public decimal? ConfidenceScore { get; set; }
```

#### Lookup Table Pattern

For lookup tables (statuses, levels, types):

```csharp
[Table("round_statuses")]
public partial class RoundStatus
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("name")]
    [StringLength(50)]
    public string Name { get; set; } = null!;

    [Column("description")]
    [StringLength(255)]
    public string? Description { get; set; }

    public virtual ICollection<Round> Rounds { get; set; } = new List<Round>();
}
```

#### DbContext Configuration

The `CaddieAIDbContext.cs` OnModelCreating method should be minimal:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Configure PostgreSQL-specific enums
    modelBuilder
        .HasPostgresEnum("round_status", new[] { "not_started", "in_progress", "paused", "completed", "abandoned" })
        .HasPostgresEnum("message_type", new[] { "user_message", "ai_response", "system_message", "error_message" });

    // Configure PostgreSQL extensions
    modelBuilder
        .HasPostgresExtension("postgis")
        .HasPostgresExtension("uuid-ossp");

    // All entity configuration is now handled via Data Annotations on model classes
    // This significantly improves code maintainability and self-documentation

    OnModelCreatingPartial(modelBuilder);
}
```

#### Adding New DAL Models

When creating new DAL models:

1. **Follow the Data Annotations pattern** exactly as shown above
2. **Add the DbSet** to `CaddieAIDbContext.cs`:
   ```csharp
   public virtual DbSet<NewModel> NewModels { get; set; }
   ```
3. **Use underscore_case** for all table and column names
4. **Include proper navigation properties** with `[ForeignKey]` and `[InverseProperty]`
5. **Add validation attributes** (`[Required]`, `[StringLength]`, `[Range]`)
6. **Test the build** to ensure Data Annotations are correct

#### Benefits of Data Annotations Approach

- **Self-Documenting**: Entity mappings visible directly in model classes
- **Maintainable**: No need to navigate to DbContext to understand entity configuration
- **IntelliSense Support**: IDE autocompletion for all mappings
- **Reduced Complexity**: OnModelCreating method reduced from 940+ lines to ~20 lines
- **Type Safety**: Compile-time validation of mappings
- **Clean Architecture**: Follows project's SOLID principles and separation of concerns

### Error Handling
- Use specific exception types for different error scenarios
- Implement global exception handling middleware
- Return appropriate HTTP status codes
- Log errors with sufficient context

### Dependency Injection
- Register services with appropriate lifetime (Scoped, Transient, Singleton)
- Use interfaces for all service dependencies
- Organize registrations using extension methods in `backend/src/caddie.portal.api/Extensions/`
- Group related service registrations by domain area

**Extension Method Organization:**
```csharp
// Program.cs - Clean and organized
builder.Services.AddDatabase(builder.Configuration);
builder.Services.AddConfigurationSettings(builder.Configuration);
builder.Services.AddRepositories();
builder.Services.AddBusinessServices();
builder.Services.AddOpenAI(builder.Configuration);
builder.Services.AddAutoMapperProfiles();
builder.Services.AddValidation();
```

**Extension Methods:**
- `AddDatabase()` - Entity Framework and database configuration
- `AddConfigurationSettings()` - Application settings with environment variable support
- `AddRepositories()` - All repository interface/implementation pairs
- `AddBusinessServices()` - All service interface/implementation pairs grouped by domain
- `AddOpenAI()` - OpenAI configuration and HTTP client setup
- `AddAutoMapperProfiles()` - All AutoMapper profiles registration
- `AddValidation()` - FluentValidation configuration

### Security Configuration & Environment Variables

**CRITICAL**: Never commit API keys, connection strings, or other secrets to the repository.

**Configuration Hierarchy (highest precedence first):**
1. Environment variables with `CADDIEAI_` prefix
2. Standard ASP.NET Core environment variables (e.g., `ConnectionStrings__DefaultConnection`)
3. `appsettings.Local.json` (excluded from git)
4. `appsettings.{Environment}.json` 
5. `appsettings.json` (template with empty values)

**Environment Variable Naming Convention:**
```bash
# Recommended: Use CADDIEAI_ prefix
CADDIEAI_CONNECTION_STRING=Host=localhost;Database=caddieai_dev;...
CADDIEAI_JWT_SECRET=YourSuperSecretJWTKey...
CADDIEAI_OPENAI_API_KEY=sk-your-openai-key-here

# Alternative: Standard ASP.NET Core format
ConnectionStrings__DefaultConnection=Host=localhost;Database=caddieai_dev;...
JwtSettings__Secret=YourSuperSecretJWTKey...
OpenAISettings__ApiKey=sk-your-openai-key-here
```

**Required Environment Variables:**
- `CADDIEAI_CONNECTION_STRING` - PostgreSQL connection string
- `CADDIEAI_JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `CADDIEAI_OPENAI_API_KEY` - OpenAI API key for AI features

**Optional Environment Variables:**
- `CADDIEAI_SMTP_HOST` - Email SMTP server
- `CADDIEAI_SMTP_USERNAME` - Email username  
- `CADDIEAI_SMTP_PASSWORD` - Email password
- `CADDIEAI_FROM_EMAIL` - Sender email address

**Configuration Files:**
```bash
# Safe to commit (template with empty values)
backend/src/caddie.portal.api/appsettings.json

# Excluded from git (local overrides with real values)
backend/src/caddie.portal.api/appsettings.Local.json
.env.caddieai

# Mobile configuration (excluded from git)
CaddieAIMobile/mapbox.config.js
CaddieAIMobile/android/gradle.properties
```

**Setup Process:**
1. Copy `appsettings.Local.json.example` to `appsettings.Local.json`
2. Copy `.env.example` to `.env.caddieai` 
3. Configure actual API keys and connection strings
4. Never commit the files with real secrets

### Type-Safe Enum Usage

**Pattern**: Use database enum IDs with type-safe casting instead of string comparisons.

**Good - Type-safe enum casting:**
```csharp
// Repository layer
var activeRounds = await _context.Rounds
    .Where(r => r.StatusId == (int)RoundStatus.InProgress || 
               r.StatusId == (int)RoundStatus.Paused)
    .ToListAsync();

// Service layer  
private int GetStatusIdByEnum(RoundStatus status)
{
    return (int)status;
}

// Usage
round.StatusId = GetStatusIdByEnum(RoundStatus.Completed);
```

**Avoid - Hardcoded strings and database lookups:**
```csharp
// Don't do this
var activeRounds = await _context.Rounds
    .Where(r => r.Status.Name == "in_progress" || r.Status.Name == "paused")
    .ToListAsync();

// Don't do this  
private async Task<int> GetStatusIdByNameAsync(string statusName)
{
    var status = await _context.RoundStatuses
        .FirstOrDefaultAsync(s => s.Name == statusName);
    return status?.Id ?? 1;
}
```

**Benefits:**
- **Type Safety**: Compile-time checking prevents invalid values
- **Performance**: Integer comparisons are faster than string operations  
- **Refactoring**: Easy to rename and track usage across codebase
- **IntelliSense**: IDE autocompletion for available values

## Frontend Development Guidelines

### React Native Android Build Configuration

**IMPORTANT**: React Native 0.80.2 requires specific dependency versions and build configurations for successful Android builds.

#### Required Dependency Versions
- **React Native Reanimated**: `^3.19.1` (minimum for RN 0.80.2 compatibility)
- **Mapbox Maps SDK**: `@rnmapbox/maps@^10.1.41-rc.3` (latest RC with RN 0.80.2 fixes)

#### Critical Build Settings

**babel.config.js**:
```javascript
module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-flow-strip-types',
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      blacklist: null,
      whitelist: null,
      safe: false,
      allowUndefined: true,
    }],
    // Reanimated plugin must be listed last
    'react-native-reanimated/plugin',
  ],
};
```

**android/app/build.gradle**:
```gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += [
            "-Xno-param-assertions",
            "-Xno-call-assertions",
            "-Xno-receiver-assertions"
        ]
    }
    
    // Configuration for react-native-vector-icons
    project.ext.vectoricons = [
        iconFontNames: [ 'MaterialIcons.ttf', 'EvilIcons.ttf', 'FontAwesome.ttf', 'Ionicons.ttf', 'Feather.ttf' ]
    ]
    
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        
        // Additional Mapbox-specific packagingOptions
        pickFirst 'META-INF/AL2.0'
        pickFirst 'META-INF/LGPL2.1'
        pickFirst 'META-INF/DEPENDENCIES'
        pickFirst 'META-INF/LICENSE'
        pickFirst 'META-INF/LICENSE.txt'
        pickFirst 'META-INF/NOTICE'
        pickFirst 'META-INF/NOTICE.txt'
    }
}
```

#### Known Issues and Solutions

**Issue**: Reanimated WorkletsModule compilation errors
- **Cause**: React Native Reanimated 3.16.2 incompatible with RN 0.80.2
- **Solution**: Update to Reanimated 3.19.1+ and add babel plugin

**Issue**: JVM target mismatch (Java 17 vs Kotlin 1.8)
- **Cause**: Android build system using different JVM targets for Java and Kotlin
- **Solution**: Align both to VERSION_17 in build.gradle

**Issue**: Mapbox Kotlin null safety compilation errors
- **Cause**: Mapbox SDK versions <10.1.41 have Kotlin null safety issues with RN 0.80.2
- **Solution**: Update to @rnmapbox/maps@10.1.41-rc.3 or newer

#### Build Process
```bash
# Clean build cache before major dependency updates
cd CaddieAIMobile/android && ./gradlew clean

# Install dependencies
npm install

# Build and run on Android
npm run android
```

#### Version Compatibility Matrix
| React Native | Reanimated | Mapbox Maps |
|-------------|------------|-------------|
| 0.80.2 | ≥3.19.1 | ≥10.1.41-rc.3 |
| 0.76.x | 3.16.2+ | 10.0.11+ |
| 0.74.x | 3.15.0+ | 10.0.0+ |

### Component Structure
- Use functional components with hooks
- Implement proper TypeScript interfaces for props
- Follow single responsibility principle
- Use composition over inheritance

### State Management
- Use Redux Toolkit for global state
- Local state for component-specific data
- Implement proper action creators and reducers
- Use RTK Query for API state management

### UI Development Standards
- Follow consistent design system
- Use responsive design principles
- Implement proper accessibility features
- Create reusable component library

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` type usage
- Use union types for constrained values

## OpenAI Real-time Audio Integration

### Overview
The CaddieAI application integrates OpenAI's Real-time API to provide immediate, contextual voice responses during golf rounds. This system replaces static text-to-speech with dynamic, AI-powered audio interactions that respond to shot placement, club recommendations, and other golf scenarios.

## AI Token & Cost Efficiency Guidelines

### Critical Cost Management Principles
When developing AI-powered features, prioritize cost efficiency to maintain sustainable operation:

#### 1. Minimize Token Usage
- **Ultra-concise Instructions**: Use minimal AI instructions (< 20 words)
  - Good: `"Brief helpful golf caddie. Keep responses under 10 words."`
  - Bad: `"You are a professional golf caddie with 20+ years experience..."`
- **Streamlined Scenarios**: Only implement essential AI scenarios
  - CaddieAI uses 2 core scenarios: `ShotPlacementWelcome`, `ClubRecommendation`
  - Removed 6+ unnecessary scenarios saving 60% API costs

#### 2. Request Queuing & Deduplication
- **Prevent Simultaneous Calls**: Use request queuing to avoid `conversation_already_has_active_response` errors
- **Eliminate Redundant Requests**: Remove double API calls for same action
  - Before: Welcome + Confirmation + Club recommendation (3 calls)
  - After: Only club recommendation when needed (1 call)

#### 3. Smart Fallback Strategy
- **Static Fallbacks**: Use pre-written messages when AI unavailable
- **Cache Common Responses**: Cache frequent requests (distance-based club recommendations)
- **Timeout Management**: 15-second timeout prevents stuck API calls

#### 4. Context Optimization
- **Minimal Context**: Send only essential data in API requests
  - Distance: `"150 yards club recommendation"`
  - Not: Full golf context with weather, player stats, course details
- **Structured Data**: Use enums/constants instead of descriptive text

#### 5. Response Length Control
- **Token Limits**: Configure AI for brief responses (< 10 words)
- **Temperature Settings**: Use 0.6-0.7 to reduce variability and token usage
- **Voice Optimization**: Audio responses naturally shorter than text

#### Cost Monitoring Examples
```typescript
// Cost-Efficient Pattern
const contextualMessage = scenario === 'ClubRecommendation' 
  ? `${distance} yards` 
  : 'Shot placement activated';

// Expensive Pattern (Avoid)
const contextualMessage = `Player is ${skill} level golfer on hole ${hole} 
  with ${weather} conditions needing club for ${distance} yards considering 
  wind ${windSpeed} and elevation ${elevation}...`;
```

#### Implementation Checklist
- ✅ Use request queuing to prevent simultaneous API calls  
- ✅ Minimize AI instructions to < 20 words
- ✅ Implement only essential scenarios (remove 80% of unnecessary ones)
- ✅ Add static fallbacks for all AI scenarios
- ✅ Configure response length limits (< 10 words)
- ✅ Use caching for repeated requests
- ✅ Monitor token usage in production logs
- ✅ Set API timeouts to prevent cost runaway

#### Expected Savings
Following these guidelines typically reduces OpenAI costs by 60-80%:
- **Fewer API Calls**: Eliminate redundant requests
- **Shorter Requests**: Minimal context and instructions
- **Brief Responses**: Controlled output length
- **Smart Fallbacks**: Reduce API dependency

### Architecture Components

#### 1. RealtimeAudioService (`src/services/RealtimeAudioService.ts`)
**Primary responsibility**: Manages WebSocket connection to OpenAI's Real-time API and handles audio streaming.

**Key Features**:
- WebSocket connection management with auto-reconnection
- PCM16 audio format processing and playback
- Sequential audio buffer management to prevent cutoffs
- Cross-platform audio permissions handling

**Configuration**:
```typescript
interface RealtimeAudioConfig {
  model?: string;              // 'gpt-4o-realtime-preview-2024-12-17'
  voice?: string;              // 'ash' for natural, warm communication
  instructions?: string;       // Golf caddie personality and behavior
  inputAudioFormat?: string;   // 'pcm16'
  outputAudioFormat?: string;  // 'pcm16'
  enableVAD?: boolean;         // Voice Activity Detection
  vadThreshold?: number;       // VAD sensitivity (0.5 default)
  temperature?: number;        // AI response variability (0.7)
}
```

**Audio Processing Pipeline**:
1. **Audio Chunks Received** → Buffered (no immediate playback)
2. **OpenAI Signals Complete** → Triggers audio processing
3. **Chunks Combined** → Single WAV file created using chunked base64 conversion
4. **Sequential Playback** → Complete response plays without interruption

#### 2. DynamicCaddieService (`src/services/DynamicCaddieService.ts`)
**Primary responsibility**: Manages contextual AI responses and request queuing for golf scenarios.

**Request Queuing System**:
- Prevents "conversation_already_has_active_response" errors
- Priority-based queue processing (shot placement = priority 9, club recommendations = priority 8)
- Sequential API calls to avoid simultaneous requests
- Automatic fallback to static responses if OpenAI fails

**Optimized Scenarios** (Cost-Efficient):
```typescript
type CaddieScenario = 
  | 'ShotPlacementWelcome'  // Welcome to shot placement mode
  | 'ClubRecommendation'    // Suggest club for distance  
  | 'ErrorHandling'         // Handle error situations
  | 'GeneralAssistance';    // General golf help
```

#### 3. Audio Buffer Management
**Critical Fix**: Sequential audio playback prevents response cutoffs.

**Problem Solved**: Previous implementation played audio chunks immediately as they arrived, causing overlapping playback that cut off responses prematurely.

**Solution Implemented**:
```typescript
// Audio state management
private isAudioResponseComplete = false;
private pendingPlayback = false;

// Buffer chunks until complete
private async playAudioDelta(audioData: string) {
  this.audioBuffer.push(buffer);
  
  // Only trigger playback when response is complete
  if (this.isAudioResponseComplete && !this.isPlayingAudio && !this.pendingPlayback) {
    this.pendingPlayback = true;
    setTimeout(() => this.processAudioBuffer(), 100);
  }
}

// Process complete audio response
case 'response.audio.done':
  this.isAudioResponseComplete = true;
  if (this.audioBuffer.length > 0 && !this.isPlayingAudio) {
    this.processAudioBuffer();
  }
```

#### 4. Chunked Base64 Conversion
**Critical Fix**: Prevents stack overflow errors with large audio data.

**Problem Solved**: `String.fromCharCode.apply(null, largeArray)` exceeded maximum call stack size.

**Solution Implemented**:
```typescript
private arrayBufferToBase64(buffer: Uint8Array): string {
  const chunkSize = 8192; // Process 8KB chunks
  let result = '';
  
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize);
    const chunkStr = String.fromCharCode.apply(null, Array.from(chunk));
    result += chunkStr;
  }
  
  return btoa(result);
}
```

### Integration with Shot Placement

The real-time audio system is tightly integrated with the shot placement feature:

1. **Shot Placement Welcome**: Activates when user enters shot placement mode
2. **Shot Confirmation**: Confirms target selection with encouraging advice
3. **Club Recommendation**: Provides club suggestions based on distance and conditions
4. **Sequential Processing**: Ensures responses play in correct order without overlap

**Optimized Flow** (Single Call):
```typescript
// Only club recommendation when shot location selected
await dynamicCaddieService.generateResponse(
  'ClubRecommendation', 
  buildCaddieContext(),
  userId,
  roundId,
  undefined,
  8 // High priority
);
```

### Configuration and Setup

#### Required Dependencies
```json
{
  "react-native-sound": "^0.12.0",
  "react-native-fs": "^2.20.0", 
  "react-native-audio-record": "^0.2.2",
  "react-native-audio-recorder-player": "^3.6.12"
}
```

#### OpenAI Configuration
```typescript
// src/config/openai.ts
export const OPENAI_CONFIG = {
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'ash',
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY // Never hardcode
};
```

#### Backend WebSocket Endpoint
```csharp
// RealtimeAudioController.cs
[Route("api/realtimeaudio")]
public class RealtimeAudioController : ControllerBase
{
    [HttpGet("connect/{roundId}")]
    public async Task<IActionResult> Connect(int roundId, string token)
    {
        // WebSocket connection handling
        // Validates JWT token and round access
        // Proxies to OpenAI Real-time API
    }
}
```

### Error Handling and Fallbacks

#### Connection Issues
- **Auto-reconnection**: Up to 3 attempts with exponential backoff
- **Fallback Responses**: Static messages if OpenAI unavailable
- **User Feedback**: Clear connection status indicators

#### Audio Issues
- **Permission Handling**: Cross-platform audio permission requests
- **Playback Fallback**: Graceful handling of audio system failures
- **Buffer Management**: Automatic cleanup of temporary audio files

#### API Rate Limits
- **Request Queuing**: Prevents simultaneous API calls
- **Priority System**: Critical responses (shot confirmation) get priority
- **Timeout Handling**: 15-second timeout with queue continuation

### Performance Optimizations

1. **Chunked Processing**: 8KB chunks prevent memory issues with large audio
2. **Buffer Management**: Efficient combination of audio chunks before playback
3. **File Cleanup**: Automatic removal of temporary WAV files
4. **State Reset**: Proper cleanup between responses to prevent memory leaks

### Testing and Debugging

#### Key Fixes & Monitoring
- **Audio Cutoffs**: Sequential buffer processing prevents interruptions
- **Stack Overflow**: Chunked base64 conversion (8KB chunks)
- **API Conflicts**: Request queuing prevents simultaneous calls
- **Cost Control**: Monitor token usage and response lengths

## Golf Course Detection System

### Overview
The golf course detection system enables real-time identification of nearby golf courses using Mapbox Search Box API v1. The system includes location testing utilities for development and provides high-accuracy course detection with rich metadata.

### Core Components

#### 1. CourseDetectionService (`src/services/CourseDetectionService.ts`)
**Primary responsibility**: Detects nearby golf courses using Mapbox Search Box API with intelligent filtering.

**Key Features**:
- **Multi-Query Search Strategy**: Uses targeted queries (`Faughan Valley Golf Centre`, `golf course`, `golf club`)
- **Country-Specific Filtering**: `country=GB` parameter for UK-focused results
- **Smart POI Filtering**: Enhanced logic to identify authentic golf courses vs. shops/equipment stores
- **Distance-Based Confidence**: Proximity-weighted confidence scoring (90%+ for courses within 200m)
- **Rich Metadata Extraction**: Phone numbers, websites, operating hours, full addresses

**API Configuration**:
```typescript
const url = `https://api.mapbox.com/search/searchbox/v1/forward?` +
  `q=${encodeURIComponent(query)}&` +
  `proximity=${longitude},${latitude}&` +
  `types=poi&` +
  `country=GB&` +
  `limit=10&` +
  `access_token=${mapboxToken}`;
```

**Golf Course Filtering Logic**:
```typescript
private isGolfCourseSearchBox(feature: MapboxSearchBoxFeature): boolean {
  const golfKeywords = ['golf course', 'golf club', 'country club', 'golf resort'];
  const excludeKeywords = ['golf shop', 'golf store', 'mini golf', 'driving range'];
  const golfPoiCategories = ['recreation', 'golf', 'sport', 'sports'];
  
  // Combine all searchable text fields
  const searchableText = [name, placeFormatted, fullAddress].join(' ');
  
  // Exclude non-course facilities
  if (excludeKeywords.some(keyword => searchableText.includes(keyword))) {
    return false;
  }
  
  // Check POI categories and keywords
  return golfPoiCategories.some(cat => poiCategories.includes(cat)) && 
         searchableText.includes('golf');
}
```

#### 2. Location Testing Framework (`src/utils/locationTesting.ts`)
**Primary responsibility**: Provides development location override for testing course detection without physical presence.

**Key Features**:
- **Development Mode Detection**: Only active when `__DEV__ = true`
- **Configuration-Based Toggle**: Uses `MAPBOX_GOLF_LOCATION` flag in `mapbox.config.js`
- **Faughan Valley Coordinates**: Mock location at `(55.020906, -7.247879)` for testing
- **Transparent Logging**: Clear indicators when mock location is active

**Usage Pattern**:
```typescript
// LocationService integration
export const getLocationWithOverride = async (
  actualLocationCallback: () => Promise<LocationData | null>
): Promise<LocationData | null> => {
  if (isLocationOverrideEnabled()) {
    const mockLocation = getFaughanValleyMockLocation();
    console.log('🧪 DEVELOPMENT: Using mock location override');
    return mockLocation;
  }
  return actualLocationCallback();
};
```

#### 3. Enhanced Location Service (`src/services/LocationService.ts`)
**Primary responsibility**: Provides location data with seamless development override integration.

**Integration with Testing Framework**:
```typescript
async getCurrentPosition(): Promise<LocationData | null> {
  return getLocationWithOverride(async () => {
    // Actual GPS location retrieval logic
    const position = await Geolocation.getCurrentPosition(options);
    return this.transformPosition(position);
  });
}
```

### API Response Structure

**Mapbox Search Box API v1 Response** (Actual format):
```typescript
interface MapboxSearchBoxFeature {
  type: 'Feature';
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;                    // "Faughan Valley Golf Centre"
    place_formatted: string;         // "Londonderry, BT47 3JH, United Kingdom"
    full_address: string;           // "8 Carmoney Rd, Londonderry, BT47 3JH, United Kingdom"
    poi_category: string[];         // ["golf course", "outdoors"]
    maki: string;                   // "golf"
    coordinates: {
      latitude: number;
      longitude: number;
    };
    metadata: {
      phone: string;                // "+442871860707"
      website: string;              // "http://faughanvalleygolfclub.co.uk/"
      open_hours: object;          // Full operating schedule
    };
    context: {
      country: { name: string; country_code: string; };
      place: { name: string; };
      postcode: { name: string; };
    };
  };
}
```

### Configuration & Setup

#### Required Configuration Files:
```javascript
// mapbox.config.js
export const MAPBOX_GOLF_LOCATION = true; // Enable for testing
export const FAUGHAN_VALLEY_LOCATION = {
  latitude: 55.020906,
  longitude: -7.247879
};
```

#### Environment Variables:
```bash
# Mapbox access token (required)
MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoic2hhbmUyODk2...
```

### Detection Accuracy Results

**Successful Detection Example**:
- **Course**: Faughan Valley Golf Centre
- **Distance**: 22m from mock coordinates
- **Confidence**: 90%
- **Address**: Londonderry, BT47 3JH, United Kingdom
- **Metadata**: Phone, website, operating hours included
- **Response Time**: <500ms for 3 API queries

### Key Improvements Implemented

#### 1. Removed Restrictive POI Filtering
- **Before**: `poi_category=recreation` excluded many valid courses
- **After**: `types=poi&country=GB` for comprehensive UK results

#### 2. Enhanced Response Parsing
- **Before**: Used non-existent `full_address` field
- **After**: Uses actual `place_formatted` field from API responses

#### 3. Country-Specific Search
- **Before**: Global results from Nevada, France, Uganda
- **After**: UK-focused results using `country=GB` parameter

#### 4. Multi-Field Filtering
- **Before**: Only searched `name` field
- **After**: Combined search across `name`, `place_formatted`, `full_address`

#### 5. Expanded POI Categories
- **Before**: Only `recreation` category
- **After**: `['recreation', 'golf', 'sport', 'sports']`

### Error Handling & Debugging

#### Comprehensive Logging:
```typescript
console.log(`🔍 CourseDetectionService: Searching for: "${query}" near:`, {latitude, longitude});
console.log(`🌐 CourseDetectionService: API URL:`, url.replace(token, 'TOKEN_HIDDEN'));
console.log(`✅ CourseDetectionService: API response: ${features.length} features received`);
console.log(`🏌️ CourseDetectionService: Filtered to ${golfFeatures.length} golf-related features`);
console.log(`🎯 CourseDetectionService: Current course detected:`, {name, distance, confidence});
```

#### Fallback Handling:
- **API Failures**: Returns empty array without crashing
- **No Courses Found**: Clear user messaging through Redux state
- **Low Confidence**: Only shows courses with >60% confidence for on-course detection

### Testing Strategy

#### Development Testing:
1. **Enable Mock Location**: Set `MAPBOX_GOLF_LOCATION = true`
2. **Verify Override**: Check console logs for mock location confirmation
3. **Test Detection**: Tap "Detect Course" button
4. **Validate Results**: Confirm Faughan Valley detection with 90% confidence

#### Production Testing:
1. **Disable Mock Location**: Set `MAPBOX_GOLF_LOCATION = false`
2. **Real GPS Testing**: Test at actual golf course locations
3. **Accuracy Validation**: Verify distance calculations and confidence scores
4. **Edge Case Testing**: Test in areas with no nearby courses

## Infrastructure & DevOps

### Docker Setup
Create `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: caddieai_dev
      POSTGRES_USER: caddieai
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  api:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=caddieai_dev;Username=caddieai;Password=dev_password

volumes:
  postgres_data:
```

### Database Migrations
- Use Flyway for database schema management
- Migration naming: `V{version}__{description}.sql`
- Keep migrations small and focused
- Test migrations in both directions

### Development Environment Commands
```bash
# Start local infrastructure
docker-compose up -d

# Run database migrations
cd backend && dotnet ef database update

# Build and test backend
cd backend && dotnet build && dotnet test

# Start frontend development
cd CaddieAIMobile && npm start
```

## Code Quality Standards

### Self-Documenting Code
- Write code that explains itself through proper naming
- Use meaningful variable and method names
- Structure code logically with clear flow
- Comments only when absolutely necessary for complex business logic

### Testing Requirements
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: All API endpoints
- **Component Tests**: All React components
- **End-to-End Tests**: Critical user workflows

### Testing Patterns
```csharp
// Arrange
var user = new User { Id = 1, Name = "John Doe" };
var mockRepository = new Mock<IUserRepository>();
mockRepository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);

// Act
var result = await userService.GetUserByIdAsync(1);

// Assert
Assert.Equal(user.Name, result.Name);
```

### Code Review Guidelines
- Review for SOLID principles adherence
- Check for proper error handling
- Verify test coverage for new features
- Ensure consistent coding standards
- Validate security considerations

## Development Workflow

### JIRA Integration

The project uses JIRA for task tracking and project management:

- **JIRA Board**: https://caddieaiapp.atlassian.net/jira/software/projects/ECS/boards/1
- **MCP Integration**: Configured for direct JIRA integration through Claude MCP
- **Task Tracking**: All location tracking features are tracked as ECS tasks (ECS-1 through ECS-12)
- **Story Points**: Tasks estimated using 1-5 point scale for planning
- **Sprint Planning**: Tasks organized in sprints with clear dependencies

### Location Tracking Implementation Plan

**Phase 1: Foundation (ECS-1 to ECS-4)**
- Install React Native location dependencies
- Configure platform permissions
- Build location service wrapper
- Create permission handling UI

**Phase 2: Backend API (ECS-5 to ECS-6)**
- Create location tracking controller
- Implement location tracking endpoints
- Add location validation and storage

**Phase 3: Frontend Features (ECS-7 to ECS-9)**
- Build course selection screens
- Add nearby course detection
- Implement real-time location tracking

**Phase 4: Advanced Features (ECS-10 to ECS-12)**
- Add distance calculations
- Create round management interface
- Build location history and analytics

### Local Development Setup

1. **Prerequisites**:
   - .NET 9.0 SDK
   - Node.js 18+
   - Docker Desktop
   - Git

2. **Initial Setup**:
   ```bash
   # Clone repository
   git clone https://github.com/ShaneMillar96/CaddieAI.git
   cd CaddieAI
   
   # Start database infrastructure
   docker-compose up -d postgres flyway
   
   # Verify database is running
   docker-compose logs postgres
   
   # Setup backend
   cd backend
   dotnet restore
   dotnet build
   
   # Setup frontend
   cd ../CaddieAIMobile
   npm install
   ```

3. **Development Commands**:
   ```bash
   # Start all services (database, pgAdmin, Redis)
   docker-compose up -d
   
   # Backend development
   cd backend/src/caddie.portal.api && dotnet watch run
   
   # Frontend development
   cd CaddieAIMobile && npm start
   
   # Run tests
   cd backend && dotnet test
   cd CaddieAIMobile && npm test
   
   # Stop all services
   docker-compose down
   ```

### Docker Development Environment

The project uses Docker Compose for local development infrastructure:

#### Services:
- **PostgreSQL 16 + PostGIS**: Main database on port 5432
- **Flyway**: Automatic database migrations
- **pgAdmin**: Database management UI on port 8080
- **Redis**: Caching layer on port 6379

#### Docker Commands:
```bash
# Start all services
docker-compose up -d

# View service logs
docker-compose logs -f postgres
docker-compose logs -f flyway

# Connect to database
docker-compose exec postgres psql -U caddieai_user -d caddieai_dev

# Run migrations manually
docker-compose run --rm flyway migrate

# Stop services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

#### Environment Configuration:
- Copy `.env.example` to `.env` for custom configuration
- Default database: `caddieai_dev`
- Default user: `caddieai_user`
- Default password: `caddieai_password`
- pgAdmin: http://localhost:8080 (admin@caddieai.com / admin)

### Database Operations

#### Using Docker (Recommended):
```bash
# Start database and run migrations
docker-compose up -d postgres flyway

# Run migrations manually
docker-compose run --rm flyway migrate

# Connect to database directly
docker-compose exec postgres psql -U caddieai_user -d caddieai_dev

# View migration status
docker-compose run --rm flyway info

# Reset database (removes all data)
docker-compose down -v postgres && docker-compose up -d postgres flyway
```

#### Using Entity Framework (Alternative):
```bash
# Create new migration
dotnet ef migrations add {MigrationName}

# Update database
dotnet ef database update

# Reset database
dotnet ef database drop && dotnet ef database update
```

#### Common Database Tasks:
```bash
# Backup database
docker-compose exec postgres pg_dump -U caddieai_user caddieai_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U caddieai_user caddieai_dev < backup.sql

# Monitor database logs
docker-compose logs -f postgres

# Check database health
docker-compose exec postgres pg_isready -U caddieai_user -d caddieai_dev
```

### Git Workflow
- Use feature branches for development
- Create descriptive commit messages
- Squash commits before merging
- Use pull requests for code review

## Do Not

### Backend
- Do not use `var` for non-obvious types
- Do not catch and ignore exceptions
- Do not use magic strings or numbers
- Do not create god classes or methods
- Do not skip unit tests for business logic

### Frontend
- Do not use `any` type in TypeScript
- Do not mutate state directly
- Do not create large component files
- Do not skip prop validation
- Do not hardcode API endpoints

### General
- Do not commit secrets or API keys
- Do not skip code reviews
- Do not deploy without tests passing
- Do not create features without proper documentation
- Do not violate SOLID principles

## Implemented Features

### Database Foundation (V1.0.0 - V1.4.0)
- **PostGIS Integration**: Full geospatial support for course mapping and GPS tracking
- **User Management**: Complete user profiles with golf-specific data (handicap, skill level, preferences)
- **Course Management**: Comprehensive course information with geospatial boundaries
- **Hole Details**: Individual hole layouts, hazards, and playing characteristics
- **Round Tracking**: Complete golf round management with performance metrics
- **AI Features**: Chat sessions, club recommendations, and user feedback system
- **Faughan Valley Golf Centre**: Complete course data for MVP development

### Real-time AI Audio Features (V1.5.0 - Optimized)
- **OpenAI Real-time API Integration**: WebSocket-based audio streaming for immediate AI responses
- **Dynamic Caddie Service**: Contextual, personalized golf advice generated in real-time
- **Cost-Optimized Scenarios**: Reduced from 8+ to 2 core scenarios (60% cost reduction)
- **Request Queuing System**: Prevents API conflicts with priority-based processing
- **Streamlined Shot Placement**: Single club recommendation call (eliminates redundant requests)
- **Cross-platform Audio**: Native audio recording and playback on iOS and Android
- **Smart Fallback System**: Static messages reduce API dependency
- **Audio Buffer Optimization**: Chunked processing prevents memory issues and stack overflows

### Golf Course Detection (V1.6.0 - Implemented)
- **Mapbox Search Box API Integration**: Real-time course detection using Mapbox Search Box API v1
- **Location Testing Framework**: Mock location override system for development with Faughan Valley coordinates
- **Smart Filtering Logic**: Enhanced golf course identification with multiple POI categories
- **Country-Specific Search**: UK-focused results using `country=GB` parameter
- **High Accuracy Detection**: 90% confidence course detection within 22m accuracy
- **Development Mode**: `MAPBOX_GOLF_LOCATION` flag for testing with mock coordinates
- **Rich Course Data**: Phone numbers, websites, operating hours, addresses from API responses
- **Cross-Platform Location**: GPS tracking with @react-native-community/geolocation and permission handling

### Current Database Schema
- **12 Tables**: Users, courses, holes, rounds, locations, chat sessions, etc.
- **12 Enum Types**: For data consistency and validation
- **54 Indexes**: Including GIN and GIST indexes for performance
- **Auto-updating Triggers**: Automatic timestamp management
- **Geospatial Capabilities**: PostGIS for course mapping and GPS features

### Architecture Decisions
- **Custom Course Data**: Using Faughan Valley Golf Centre for MVP (cost-effective approach)
- **API-Ready Schema**: Designed for future GolfAPI.io integration
- **Clean Architecture**: Proper separation of concerns across layers
- **PostgreSQL with PostGIS**: Geospatial database capabilities

### Testing Strategy
- **Unit Tests**: Minimum 80% code coverage for backend
- **Integration Tests**: All API endpoints and database operations
- **Component Tests**: All React components and UI interactions
- **End-to-End Tests**: Critical user workflows and scenarios

### Documentation System
- **Comprehensive Documentation**: Feature-specific docs with templates
- **Migration Tracking**: Complete database change history
- **API Documentation**: Endpoint and model documentation
- **Development Guides**: Setup, testing, and deployment procedures
- **Change Management**: Architecture decision records and feature logs

## Key Files & Directories

### Backend
- `backend/src/caddie.portal.api/Program.cs` - Application startup and configuration
- `backend/src/caddie.portal.services/` - Business logic layer
- `backend/src/caddie.portal.dal/` - Data access layer
- `backend/database/migrations/` - Database schema migrations (V1.0.0-V1.4.0)

### Frontend
- `CaddieAIMobile/src/components/` - Reusable UI components
- `CaddieAIMobile/src/screens/` - Screen components  
- `CaddieAIMobile/src/services/` - API service layer
- `CaddieAIMobile/src/services/RealtimeAudioService.ts` - OpenAI real-time audio integration
- `CaddieAIMobile/src/services/DynamicCaddieService.ts` - AI-powered golf caddie responses
- `CaddieAIMobile/src/services/AudioRecorderService.ts` - Cross-platform audio recording
- `CaddieAIMobile/src/services/LocationService.ts` - Location tracking service with mock override support
- `CaddieAIMobile/src/services/CourseDetectionService.ts` - Mapbox golf course detection with Search Box API v1
- `CaddieAIMobile/src/utils/locationTesting.ts` - Development location override utilities
- `CaddieAIMobile/src/components/voice/VoiceChatModal.tsx` - Voice chat interface
- `CaddieAIMobile/src/store/` - Redux store configuration

### Documentation
- `shared/docs/` - Comprehensive project documentation
- `shared/docs/features/` - Feature-specific documentation
- `shared/docs/api/` - API documentation and models
- `shared/docs/changelog/` - Change tracking and decision records
- `shared/docs/_templates/` - Documentation templates

### Configuration
- `backend/src/caddie.portal.api/appsettings.json` - Application configuration
- `CaddieAIMobile/package.json` - Frontend dependencies and scripts
- `docker-compose.yml` - Local development infrastructure

## Success Metrics

- **Code Coverage**: >80% for backend, >70% for frontend
- **Build Time**: <5 minutes for full solution
- **Test Execution**: <2 minutes for unit tests
- **Code Review**: <24 hours response time
- **Deployment**: Zero-downtime deployments

---

*This guide should be updated as the project evolves and new patterns are established.*