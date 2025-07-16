# CaddieAI

A comprehensive golf caddie application built with .NET 9.0 backend and React Native frontend.

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

## Technologies Used

### Backend
- **.NET 9.0** with C# 12
- **ASP.NET Core Web API** for REST API
- **Entity Framework Core** for data access
- **xUnit** for testing
- **Clean Architecture** with proper separation of concerns

### Frontend
- **React Native** for cross-platform mobile development
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Redux Toolkit** for state management
- **Axios** for API communication

### Database
- **PostgreSQL** (recommended) or SQL Server
- **Flyway** for database migrations
- **Entity Framework Core** for ORM

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js (v18 or higher)
- React Native development environment
- PostgreSQL or SQL Server

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
- Use dependency injection
- Implement proper error handling
- Write unit tests for all business logic
- Use async/await for all database operations

### Frontend
- Use TypeScript for all components
- Follow React hooks patterns
- Implement proper error boundaries
- Use Redux for global state management
- Write unit tests for components and services

## Database Schema

The application uses the following core entities:
- **Users**: User authentication and profile information
- **Golf Courses**: Golf course details and metadata
- **Golf Rounds**: Individual golf round records
- **Hole Scores**: Detailed hole-by-hole scoring information

## API Endpoints

The API will provide endpoints for:
- User authentication and management
- Golf course data
- Round tracking and scoring
- Statistics and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.