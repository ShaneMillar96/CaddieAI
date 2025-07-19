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
- OpenAI GPT-4o for AI conversations
- Garmin Golf API / Mapbox SDK for course data
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
- Create dedicated Constants classes per domain area
- Use static readonly for complex constants
- Group related constants together
- Avoid magic numbers and strings in code

```csharp
public static class GolfConstants
{
    public static readonly int STANDARD_HOLES_PER_ROUND = 18;
    public static readonly int MAX_PLAYERS_PER_GROUP = 4;
    public static readonly TimeSpan DEFAULT_ROUND_TIMEOUT = TimeSpan.FromHours(6);
}
```

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

### Error Handling
- Use specific exception types for different error scenarios
- Implement global exception handling middleware
- Return appropriate HTTP status codes
- Log errors with sufficient context

### Dependency Injection
- Register services with appropriate lifetime (Scoped, Transient, Singleton)
- Use interfaces for all service dependencies
- Configure AutoMapper profiles in DI container
- Group related service registrations

## Frontend Development Guidelines

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

### Location Tracking Architecture (V1.5.0 - Planned)
- **React Native Location Services**: GPS tracking with @react-native-community/geolocation
- **Location Permissions**: Cross-platform permission handling for iOS and Android
- **Real-time Tracking**: Continuous location updates during golf rounds
- **Course Detection**: Automatic detection of nearby courses and course boundaries
- **Distance Calculations**: Real-time distance to tee, pin, and course features
- **Location History**: Breadcrumb tracking and round replay functionality
- **Battery Optimization**: Efficient background location tracking

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
- `CaddieAIMobile/src/services/LocationService.ts` - Location tracking service (planned)
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