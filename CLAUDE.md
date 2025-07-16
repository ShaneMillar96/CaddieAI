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
- Native GPS for location services
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
cd frontend && npm start
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

### Local Development Setup
1. **Prerequisites**:
   - .NET 9.0 SDK
   - Node.js 18+
   - Docker Desktop
   - PostgreSQL client tools

2. **Initial Setup**:
   ```bash
   # Clone repository
   git clone https://github.com/ShaneMillar96/CaddieAI.git
   cd CaddieAI
   
   # Start infrastructure
   docker-compose up -d
   
   # Setup backend
   cd backend
   dotnet restore
   dotnet ef database update
   
   # Setup frontend
   cd ../frontend
   npm install
   ```

3. **Development Commands**:
   ```bash
   # Backend development
   cd backend/src/caddie.portal.api && dotnet watch run
   
   # Frontend development
   cd frontend && npm start
   
   # Run tests
   cd backend && dotnet test
   cd frontend && npm test
   ```

### Database Operations
```bash
# Create new migration
dotnet ef migrations add {MigrationName}

# Update database
dotnet ef database update

# Reset database
dotnet ef database drop && dotnet ef database update
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

## Key Files & Directories

### Backend
- `backend/src/caddie.portal.api/Program.cs` - Application startup and configuration
- `backend/src/caddie.portal.services/` - Business logic layer
- `backend/src/caddie.portal.dal/` - Data access layer
- `backend/database/migrations/` - Database schema migrations

### Frontend
- `frontend/src/components/` - Reusable UI components
- `frontend/src/screens/` - Screen components
- `frontend/src/services/` - API service layer
- `frontend/src/store/` - Redux store configuration

### Configuration
- `backend/src/caddie.portal.api/appsettings.json` - Application configuration
- `frontend/package.json` - Frontend dependencies and scripts
- `docker-compose.yml` - Local development infrastructure

## Success Metrics

- **Code Coverage**: >80% for backend, >70% for frontend
- **Build Time**: <5 minutes for full solution
- **Test Execution**: <2 minutes for unit tests
- **Code Review**: <24 hours response time
- **Deployment**: Zero-downtime deployments

---

*This guide should be updated as the project evolves and new patterns are established.*