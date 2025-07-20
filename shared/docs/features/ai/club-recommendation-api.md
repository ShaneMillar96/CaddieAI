# Club Recommendation API

## Overview

The Club Recommendation API is an AI-powered system that provides intelligent golf club recommendations based on comprehensive context analysis. This feature leverages OpenAI GPT-4o to analyze distance, weather conditions, course characteristics, player skill level, and historical performance to suggest optimal club selection for any given golf shot.

## Key Features

- **AI-Powered Recommendations**: Uses OpenAI GPT-4o with golf-specific prompts for intelligent club selection
- **Context-Aware Analysis**: Considers multiple factors including distance, weather, lie conditions, and player skill
- **Learning System**: Improves recommendations over time based on user feedback and acceptance rates
- **Confidence Scoring**: Provides confidence levels and alternative club suggestions
- **Performance Analytics**: Tracks recommendation accuracy and user performance metrics
- **Fallback Mechanism**: Basic algorithm backup ensures reliability when AI services are unavailable

## Architecture

### Repository Layer (`caddie.portal.dal`)

**IClubRecommendationRepository**
- CRUD operations for club recommendations
- Advanced querying (by user, round, hole, location)
- Analytics methods (acceptance rates, popular clubs)
- Learning methods (similar situations, historical performance)

**ClubRecommendationRepository**
- Entity Framework Core implementation
- Efficient queries with proper navigation properties
- Statistical analysis methods for recommendation improvement

### Service Layer (`caddie.portal.services`)

**IClubRecommendationService**
- Core recommendation generation with AI integration
- Feedback processing for machine learning
- Analytics and performance tracking
- Historical data analysis for improved accuracy

**ClubRecommendationService**
- OpenAI GPT-4o integration with golf-specific prompts
- Context-aware recommendation algorithms
- Feedback processing and learning system
- Comprehensive error handling with fallback mechanisms

### API Layer (`caddie.portal.api`)

**ClubRecommendationController**
- RESTful API endpoints for all recommendation operations
- Complete request/response DTOs with validation
- Comprehensive error handling and logging
- Authorization and authentication support

## API Endpoints

### Generate Club Recommendation
```http
POST /api/clubrecommendation
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "roundId": 123,
  "holeId": 45,
  "locationId": 789,
  "distanceToTarget": 150.5,
  "weatherConditions": "Light wind, 72°F",
  "lieConditions": "fairway",
  "shotType": "approach",
  "playerNotes": "Slightly uphill shot",
  "additionalContext": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "recommendedClub": "7 Iron",
    "confidenceScore": 0.85,
    "reasoning": "Based on 150 yards to pin, slight uphill lie, and your typical 7-iron distance of 145-155 yards. Wind is minimal, so club up one from your normal 8-iron distance.",
    "alternativeClubs": ["6 Iron", "8 Iron"],
    "strategy": "Aim for center of green, account for 5-yard uphill adjustment",
    "factors": {
      "distance": 150.5,
      "conditions": "Light wind, 72°F",
      "shotType": "approach",
      "skillLevel": "intermediate"
    },
    "createdAt": "2025-01-20T15:30:00Z"
  },
  "message": "Club recommendation generated successfully"
}
```

### Provide Feedback
```http
POST /api/clubrecommendation/{id}/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "wasAccepted": true,
  "actualClubUsed": "7 Iron",
  "playerNotes": "Great recommendation, hit it pin high",
  "shotResult": 5,
  "shotOutcome": "on_target"
}
```

### Get User Analytics
```http
GET /api/clubrecommendation/users/{userId}/analytics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallAcceptanceRate": 0.73,
    "totalRecommendations": 127,
    "acceptedRecommendations": 93,
    "mostRecommendedClubs": [
      {
        "club": "7 Iron",
        "recommendationCount": 28,
        "percentage": 22.05
      }
    ],
    "clubAccuracyRates": [
      {
        "club": "7 Iron",
        "acceptanceRate": 0.82,
        "totalRecommendations": 28,
        "acceptedRecommendations": 23
      }
    ]
  }
}
```

### Additional Endpoints

- `GET /api/clubrecommendation/{id}` - Get recommendation by ID
- `GET /api/clubrecommendation/users/{userId}/history` - User's recommendation history
- `GET /api/clubrecommendation/rounds/{roundId}` - Round-specific recommendations
- `GET /api/clubrecommendation/analytics` - System-wide analytics
- `GET /api/clubrecommendation/users/{userId}/similar` - Similar situation recommendations
- `GET /api/clubrecommendation/users/{userId}/recent` - Most recent recommendation

## Data Models

### ClubRecommendation Entity
```csharp
public class ClubRecommendation
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? RoundId { get; set; }
    public int? HoleId { get; set; }
    public int? LocationId { get; set; }
    public string RecommendedClub { get; set; }
    public decimal? ConfidenceScore { get; set; }
    public decimal? DistanceToTarget { get; set; }
    public string? OpenaiReasoning { get; set; }
    public string? ContextUsed { get; set; }
    public bool? WasAccepted { get; set; }
    public string? ActualClubUsed { get; set; }
    public string? RecommendationMetadata { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; }
    public virtual Round? Round { get; set; }
    public virtual Hole? Hole { get; set; }
    public virtual Location? Location { get; set; }
}
```

### Request/Response DTOs
- `CreateClubRecommendationRequestDto` - Request for generating recommendations
- `ClubRecommendationFeedbackDto` - User feedback on recommendations
- `ClubRecommendationResponseDto` - AI recommendation response
- `ClubRecommendationAnalyticsResponseDto` - Performance analytics

## AI Integration

### OpenAI Integration
The system uses OpenAI GPT-4o with specialized golf caddie prompts:

```csharp
private static string GetClubRecommendationSystemPrompt()
{
    return @"You are an expert golf caddie AI that provides intelligent club recommendations. 
Analyze the provided golf context, player information, distance, conditions, and historical data to recommend the optimal golf club.

Consider these factors:
- Distance to target (primary factor)
- Player skill level and tendencies
- Weather conditions (wind, temperature, humidity)
- Course conditions and lie
- Historical performance with similar shots
- Hole characteristics and strategy
- Player confidence with different clubs

Respond in JSON format with:
{
  ""recommendedClub"": ""Primary club recommendation"",
  ""confidence"": 0.85,
  ""reasoning"": ""Clear explanation of why this club was chosen"",
  ""alternatives"": [""Alternative club 1"", ""Alternative club 2""],
  ""strategy"": ""Shot strategy and course management advice""
}

Be specific, confident, and helpful. Focus on practical advice that will help the player succeed.";
}
```

### Context Analysis
The AI considers comprehensive context including:
- **Golf Context**: User profile, course information, current hole details
- **Environmental Conditions**: Weather, wind, temperature, humidity
- **Situational Factors**: Distance to target, lie conditions, shot type
- **Historical Performance**: Similar situations, club preferences, success rates
- **Player-Specific Data**: Skill level, handicap, playing style, club distances

### Learning Algorithm
The system continuously improves through:
- **Feedback Processing**: Tracks accepted vs. rejected recommendations
- **Performance Analysis**: Monitors club selection accuracy over time
- **Pattern Recognition**: Identifies successful recommendation patterns
- **Contextual Learning**: Improves recommendations for similar situations

## Performance Analytics

### User Analytics
- Overall acceptance rate for recommendations
- Most recommended clubs and their success rates
- Performance trends over time
- Accuracy by distance ranges and conditions

### System Analytics
- Global recommendation accuracy metrics
- Popular club selections across all users
- Performance by weather conditions and course types
- Improvement trends in AI recommendation quality

### Learning Insights
- Similar situation analysis for pattern recognition
- Club preference mapping by skill level
- Success rate correlation with various factors
- Recommendation confidence vs. actual performance

## Configuration

### OpenAI Settings
```json
{
  "OpenAI": {
    "ApiKey": "your-openai-api-key",
    "Model": "gpt-4o",
    "BaseUrl": "https://api.openai.com/v1",
    "Temperature": 0.7,
    "MaxTokens": 500,
    "TimeoutSeconds": 30
  }
}
```

### Dependency Injection
The feature is fully integrated with the existing DI container:
```csharp
// Repositories
builder.Services.AddScoped<IClubRecommendationRepository, ClubRecommendationRepository>();

// Services
builder.Services.AddScoped<IClubRecommendationService, ClubRecommendationService>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(ClubRecommendationMappingProfile));
```

## Error Handling

### Fallback Mechanisms
- Basic distance-based algorithm when AI fails
- Graceful degradation with reduced feature set
- Comprehensive error logging and monitoring

### Validation
- Request validation using FluentValidation
- Business rule validation in service layer
- Input sanitization and security measures

### Logging
- Comprehensive logging at all layers
- Performance monitoring and metrics
- Error tracking and alerting

## Testing

### Unit Tests
- Repository layer testing with in-memory database
- Service layer testing with mocked dependencies
- Controller testing with integration scenarios

### Integration Tests
- End-to-end API testing
- OpenAI integration testing
- Database integration testing

### Performance Tests
- Load testing for recommendation generation
- Scalability testing for concurrent users
- Response time optimization

## Future Enhancements

### Planned Features
- **Advanced ML Models**: Custom-trained models for golf-specific recommendations
- **Visual Analysis**: Integration with camera for lie condition assessment
- **Real-time Adjustments**: Dynamic recommendations based on shot outcomes
- **Social Learning**: Learn from community feedback and professional insights

### Optimization Opportunities
- **Caching Strategy**: Cache frequent recommendations for improved performance
- **Batch Processing**: Process multiple recommendations simultaneously
- **Edge Computing**: Local processing for reduced latency
- **Predictive Analytics**: Anticipate club needs based on round progression

## Security Considerations

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- User-specific data access controls
- Role-based permissions for analytics endpoints

### Data Privacy
- User data encryption at rest and in transit
- GDPR compliance for EU users
- Data retention policies and user deletion rights

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection prevention
- Cross-site scripting (XSS) protection

## Monitoring & Maintenance

### Performance Monitoring
- Response time tracking
- Success/failure rate monitoring
- OpenAI API usage and cost tracking
- Database performance metrics

### Health Checks
- Service availability monitoring
- Database connectivity checks
- External API dependency monitoring
- Alert configurations for critical failures

### Maintenance Tasks
- Regular model performance reviews
- Feedback data analysis and insights
- System optimization based on usage patterns
- Security updates and vulnerability assessments

---

*This feature was implemented as part of JIRA task ECS-30 and represents a significant advancement in CaddieAI's AI-powered golf assistance capabilities.*