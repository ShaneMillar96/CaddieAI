# CaddieAI

> *Your AI-powered golf companion for solo rounds*

## Product Overview

CaddieAI is a mobile application designed to transform the solo golf experience by providing an intelligent, conversational AI companion that accompanies golfers throughout their rounds. The app leverages real-time location data, course information, and advanced AI to deliver personalized club recommendations, course insights, and engaging conversation that makes solo golf more enjoyable and less isolating.

**Mission**: To make solo golfing more engaging, interactive, and enjoyable by providing an AI companion that acts like a knowledgeable friend and caddie.

**Target Audience**: Golf enthusiasts who frequently play solo rounds and want to enhance their on-course experience with intelligent guidance and companionship.

## Problem Definition

### The Challenge
- **Loneliness on the Course**: Solo golf can feel isolating and less engaging without the social interaction of playing partners
- **Lack of Course Knowledge**: Many golfers lack detailed knowledge about course layouts, hazards, and optimal strategies
- **Club Selection Uncertainty**: Players often struggle with club selection based on distance, conditions, and personal performance
- **Missed Learning Opportunities**: Without feedback and guidance, golfers miss opportunities to improve their game

### The Solution
CaddieAI addresses these challenges by providing:
- Real-time conversational AI that responds to course situations
- Intelligent club recommendations based on location and player data
- Contextual course information and hazard awareness
- Encouraging feedback and positive reinforcement during play

## MoSCoW Priorities (Version 1)

### Must Have 🔴
- **Core AI Chat Functionality**: Natural language conversation about golf and course conditions
- **GPS Location Integration**: Real-time position tracking on golf courses
- **Basic Club Recommendations**: Distance-based club suggestions using player preferences
- **Course Layout Database**: Access to hole layouts, par information, and basic course data
- **Mobile App (iOS/Android)**: Cross-platform React Native application

### Should Have 🟡
- **Voice Interaction**: Voice-to-text and text-to-voice capabilities for hands-free operation
- **Hazard Mapping**: Visual representation of course hazards and obstacles
- **Shot Feedback**: Contextual responses to shots ("Great shot!", "Tough luck")
- **Weather Integration**: Real-time weather data affecting play recommendations
- **Personalized AI Context**: AI that remembers player preferences and playing style

### Could Have 🟢
- **Camera Integration**: Visual analysis of course conditions and setup
- **Advanced Analytics**: Detailed performance tracking and insights
- **Social Features**: Share rounds and achievements with other players
- **Multiple Course Support**: Extensive database of golf courses worldwide
- **Offline Mode**: Basic functionality without internet connectivity

### Won't Have (Version 1) ⚫
- **Tournament Management**: Complex scoring and tournament organization
- **Swing Analysis**: Detailed biomechanical swing assessment
- **Booking Integration**: Tee time booking and course reservations
- **Equipment Marketplace**: Club and equipment purchasing features
- **Live Streaming**: Real-time video sharing of rounds

## Technical Architecture

### Core Technologies

**Backend (.NET 9.0)**
- ASP.NET Core Web API for REST services
- Entity Framework Core for data persistence
- Clean Architecture with proper separation of concerns

**Frontend (React Native)**
- Cross-platform mobile development
- TypeScript for type safety
- Redux Toolkit for state management

**AI & Integration Services**
- **OpenAI GPT-4o**: Primary AI engine with fine-tuning for golf context
- **Garmin Golf API**: Primary course data provider (preferred)
- **Mapbox SDK**: Alternative mapping and location services
- **Custom Course Database**: GeoJSON-based or PostGIS for course layouts

**Location & Mapping**
- **Native GPS**: iOS Core Location / Android Location Services
- **Geospatial Processing**: Haversine formula or Turf.js for distance calculations
- **Course Mapping**: Custom polygons or OSM-imported hazard data

**Database**
- **PostgreSQL** with PostGIS for geospatial data
- **Entity Framework Core** for ORM
- **Flyway** for database migrations

## Domain Model

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │     Course      │    │      Round      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - UserId        │    │ - CourseId      │    │ - RoundId       │
│ - Name          │───┐│ - Name          │    │ - UserId        │
│ - Handicap      │   ││ - Location      │    │ - CourseId      │
│ - Preferences   │   ││ - ParTotal      │    │ - StartTime     │
│ - PlayingStyle  │   ││ - Rating        │    │ - CurrentHole   │
└─────────────────┘   │└─────────────────┘    │ - Status        │
                      │        │               └─────────────────┘
                      │        │
                      │        ▼
┌─────────────────┐   │┌─────────────────┐    ┌─────────────────┐
│  ChatSession    │   ││      Hole       │    │    Location     │
├─────────────────┤   │├─────────────────┤    ├─────────────────┤
│ - SessionId     │   ││ - HoleId        │    │ - LocationId    │
│ - UserId        │◄──┘│ - CourseId      │    │ - Latitude      │
│ - RoundId       │    │ - HoleNumber    │    │ - Longitude     │
│ - Messages      │    │ - Par           │    │ - Accuracy      │
│ - Context       │    │ - Distance      │    │ - Timestamp     │
└─────────────────┘    │ - Hazards       │    │ - CoursePosition│
                       └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │ClubRecommendation│
                       ├─────────────────┤
                       │ - RecommendationId│
                       │ - HoleId        │
                       │ - Club          │
                       │ - Reasoning     │
                       │ - Confidence    │
                       └─────────────────┘
```

### Entity Descriptions

**User**: Represents a golfer using the app, storing personal information, handicap, playing preferences, and historical data to personalize the AI experience.

**Course**: Contains comprehensive golf course information including layout, metadata, rating, and geospatial data for accurate positioning and recommendations.

**Round**: Tracks an active or completed golf round, linking a user to a specific course with timing, progress, and session state information.

**Hole**: Detailed information about individual holes including par, distance, hazard locations, and layout data used for tactical recommendations.

**ChatSession**: Manages the conversational AI context, storing message history and maintaining conversation state throughout a round for personalized interactions.

**Location**: Real-time GPS positioning data that enables course-aware features like distance calculation, hazard warnings, and contextual recommendations.

**ClubRecommendation**: AI-generated club suggestions based on location, hole characteristics, weather conditions, and player history with confidence scoring.

## Version 1 Scope

### Core Features
- **Conversational AI Companion**: Natural language interaction about golf, course conditions, and strategy
- **GPS-Based Club Recommendations**: Real-time suggestions based on distance to pin and player preferences
- **Course Awareness**: Basic hole information, par, and distance data
- **Voice Interaction**: Hands-free conversation via speech-to-text and text-to-speech
- **Shot Feedback**: Encouraging responses and contextual commentary during play

### Technical Implementation
- React Native mobile app for iOS and Android
- .NET backend with OpenAI GPT-4o integration
- PostgreSQL database with basic course data
- GPS location services for course positioning
- RESTful API architecture

### Future Roadmap
- **Version 2**: Camera integration for course condition analysis
- **Version 3**: Advanced swing analysis and improvement suggestions
- **Version 4**: Social features and community sharing
- **Version 5**: AR overlay for enhanced course visualization

## Project Structure

```
CaddieAI/
├── backend/                        # .NET 9.0 Backend
│   ├── src/
│   │   ├── caddie.portal.api/       # Web API Layer
│   │   ├── caddie.portal.services/  # Business Logic Layer
│   │   └── caddie.portal.dal/       # Data Access Layer
│   ├── test/
│   │   ├── caddie.portal.api.tests/
│   │   └── caddie.portal.services.tests/
│   ├── database/
│   │   └── migrations/              # SQL Migration Scripts
│   ├── CaddieAI.sln                # Solution file
│   ├── global.json                 # .NET version specification
│   └── Directory.Build.props       # Common build properties
├── frontend/                       # React Native Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── screens/                # Screen components
│   │   ├── navigation/             # Navigation configuration
│   │   ├── services/               # API services
│   │   ├── store/                  # State management
│   │   ├── utils/                  # Utility functions
│   │   ├── hooks/                  # Custom hooks
│   │   └── types/                  # TypeScript type definitions
│   ├── assets/                     # Images, fonts, etc.
│   ├── __tests__/                  # Test files
│   ├── android/                    # Android-specific code
│   ├── ios/                        # iOS-specific code
│   └── package.json
├── shared/                         # Shared resources
│   ├── docs/                       # Documentation
│   └── scripts/                    # Build/deployment scripts
└── README.md                       # This file
```

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js (v18 or higher)
- React Native development environment
- PostgreSQL with PostGIS extension
- OpenAI API key
- Garmin Golf API access (or Mapbox API key)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the solution:
   ```bash
   dotnet build
   ```

4. Run the API:
   ```bash
   cd src/caddie.portal.api
   dotnet run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React Native packager:
   ```bash
   npm start
   ```

4. Run on iOS:
   ```bash
   npm run ios
   ```

5. Run on Android:
   ```bash
   npm run android
   ```

## Development Guidelines

### Backend
- Follow clean architecture principles
- Use dependency injection for service management
- Implement proper error handling and logging
- Write comprehensive unit tests for all business logic
- Use async/await for all I/O operations

### Frontend
- Use TypeScript for all components and services
- Follow React hooks patterns and best practices
- Implement proper error boundaries
- Use Redux for global state management
- Write unit tests for components and services

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the development guidelines
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the golf community*