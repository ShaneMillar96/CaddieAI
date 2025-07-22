# Statistics API Endpoints

**Base URL**: `/api/statistics`  
**Authentication**: JWT Bearer Token Required  
**Version**: v1.0.0

## Overview

The Statistics API provides comprehensive golf performance analytics and statistical analysis endpoints. All endpoints require JWT authentication and return data specific to the authenticated user.

## Common Response Format

All endpoints follow the standard API response format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Endpoint-specific response data
  },
  "errors": null,
  "timestamp": "2025-07-22T10:30:00Z"
}
```

## Endpoints

### 1. Performance Analysis

**POST** `/api/statistics/performance-analysis`

Retrieves comprehensive performance analysis including scoring, short game, and long game metrics.

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "totalRounds": 25,
    "startDate": "2025-01-01",
    "endDate": "2025-07-22",
    "averageScore": 84.2,
    "bestScore": 78,
    "worstScore": 92,
    "averageScoreToPar": 12.2,
    "scoringTrend": -0.3,
    "averagePutts": 31.5,
    "puttingAverage": 1.75,
    "averageFairwaysHit": 8.2,
    "fairwayPercentage": 58.6,
    "averageGreensInRegulation": 9.8,
    "greensInRegulationPercentage": 54.4,
    "scoreStandardDeviation": 4.2,
    "consistencyRating": 72.5,
    "roundsUnderPar": 0,
    "roundsOverPar": 25
  }
}
```

### 2. Handicap Trend Analysis

**GET** `/api/statistics/handicap-trend?monthsBack={months}`

Analyzes handicap progression and provides trend projections.

#### Query Parameters
- `monthsBack` (int, optional): Number of months to analyze (1-24, default: 6)

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "currentHandicap": 15.2,
    "projectedHandicap": 14.8,
    "handicapTrend": -0.1,
    "monthsAnalyzed": 6,
    "handicapHistory": [
      {
        "date": "2025-07-22",
        "handicap": 15.2,
        "score": 84,
        "scoreToPar": 12
      }
    ],
    "last5RoundsAverage": 11.8,
    "last10RoundsAverage": 12.2,
    "isImproving": true,
    "improvementRate": 0.1,
    "trendDescription": "Improving"
  }
}
```

### 3. Course Performance Analysis

**POST** `/api/statistics/course-performance/{courseId}`

Provides detailed performance analysis for a specific course.

#### Path Parameters
- `courseId` (int): The course ID to analyze

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "courseId": 1,
    "courseName": "Faughan Valley Golf Centre",
    "roundsPlayed": 8,
    "firstPlayed": "2025-02-15",
    "lastPlayed": "2025-07-20",
    "averageScore": 83.5,
    "bestScore": 79,
    "worstScore": 88,
    "averageScoreToPar": 11.5,
    "improvementTrend": -0.2,
    "familiarityScore": 65.0,
    "isFavoriteCourse": true
  }
}
```

### 4. Scoring Trends

**POST** `/api/statistics/scoring-trends`

Analyzes historical scoring patterns and improvement trends.

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "overallTrend": -0.25,
    "isImproving": true,
    "last5RoundsAverage": 11.2,
    "last10RoundsAverage": 12.0,
    "seasonAverage": 12.5,
    "currentImprovementStreak": 3,
    "longestImprovementStreak": 5,
    "monthlyTrends": [
      {
        "year": 2025,
        "month": 7,
        "averageScore": 11.8,
        "roundsPlayed": 4,
        "improvementFromPreviousMonth": -0.4
      }
    ],
    "scoreTrends": [
      {
        "roundDate": "2025-07-22",
        "score": 84,
        "scoreToPar": 12,
        "movingAverage": 11.8
      }
    ]
  }
}
```

### 5. Advanced Metrics

**POST** `/api/statistics/advanced-metrics`

Provides advanced golf metrics including consistency and completion rates.

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "scoreConsistency": 4.2,
    "puttingConsistency": 2.1,
    "fairwayConsistency": 1.8,
    "greenConsistency": 2.3,
    "averageRoundTime": 245.5,
    "roundsCompleted": 25,
    "roundsAbandoned": 1,
    "completionRate": 96.2
  }
}
```

### 6. Course Comparison

**POST** `/api/statistics/course-comparison`

Compares performance across multiple courses.

#### Request Body
```json
{
  "courseIds": [1, 2, 3],
  "startDate": "2025-01-01",
  "endDate": "2025-07-22",
  "minimumRounds": 2
}
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "courseId": 1,
      "courseName": "Faughan Valley Golf Centre",
      "roundsPlayed": 8,
      "averageScore": 83.5,
      "averageScoreToPar": 11.5,
      "bestScore": 79,
      "difficultyRating": -0.7,
      "improvementRate": -0.2,
      "isFavorite": true
    }
  ]
}
```

### 7. Weather Performance

**POST** `/api/statistics/weather-performance`

Analyzes performance under different weather conditions.

#### Request Body
```json
{
  "minTemperature": 10,
  "maxTemperature": 30,
  "minWindSpeed": 0,
  "maxWindSpeed": 20,
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "averageScoreGoodWeather": 83.2,
    "averageScoreBadWeather": 86.1,
    "preferredConditions": "Good Weather",
    "weatherBreakdown": [
      {
        "conditions": "Good Weather",
        "roundsPlayed": 18,
        "averageScore": 83.2,
        "averageTemperature": 22.0,
        "averageWindSpeed": 8.5
      },
      {
        "conditions": "Poor Weather",
        "roundsPlayed": 7,
        "averageScore": 86.1,
        "averageTemperature": 15.2,
        "averageWindSpeed": 25.0
      }
    ]
  }
}
```

### 8. Round Performance History

**GET** `/api/statistics/round-performance-history?limit={limit}`

Retrieves detailed performance data for recent rounds.

#### Query Parameters
- `limit` (int, optional): Maximum rounds to return (1-50, default: 20)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "roundId": 45,
      "roundDate": "2025-07-22",
      "courseName": "Faughan Valley Golf Centre",
      "totalScore": 84,
      "scoreToPar": 12,
      "totalPutts": 30,
      "puttingAverage": 1.67,
      "fairwaysHit": 9,
      "fairwayPercentage": 64.3,
      "greensInRegulation": 11,
      "girPercentage": 61.1,
      "temperature": 22.5,
      "windSpeed": 8.0,
      "roundDuration": "03:45:00",
      "notes": "Great putting round!"
    }
  ]
}
```

### 9. Enhanced Statistics

**POST** `/api/statistics/enhanced-statistics`

Provides enhanced round statistics with distribution analysis.

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "totalRounds": 25,
    "averageScore": 84.2,
    "bestScore": 78,
    "worstScore": 92,
    "medianScore": 84.0,
    "scoreStandardDeviation": 4.2,
    "consistencyRating": 72.5,
    "roundsUnderPar": 0,
    "roundsAtPar": 0,
    "roundsOverPar": 25,
    "percentageUnderPar": 0.0,
    "uniqueCourses": 3,
    "mostPlayedCourse": "Faughan Valley Golf Centre",
    "averageRoundDuration": 245.5
  }
}
```

### 10. Consistency Metrics

**POST** `/api/statistics/consistency-metrics`

Analyzes consistency and variability across all performance areas.

#### Request Body
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-07-22"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "overallConsistency": 68.5,
    "scoringConsistency": 72.3,
    "puttingConsistency": 75.2,
    "fairwayConsistency": 62.1,
    "greenConsistency": 64.8,
    "scoreVariance": 17.6,
    "scoreStandardDeviation": 4.2,
    "coefficientOfVariation": 0.05,
    "longestConsistentStreak": 4,
    "currentConsistentStreak": 2,
    "streakThreshold": 3.0,
    "stabilityIndex": 71.2,
    "isImprovingConsistency": true,
    "consistencyTrend": 0.15,
    "consistencyBreakdown": [
      {
        "category": "Scoring",
        "consistencyScore": 72.3,
        "standardDeviation": 4.2,
        "consistencyLevel": "Consistent"
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "End date must be after start date",
    "Months back must be between 1 and 24"
  ],
  "errorCode": "VALIDATION_ERROR"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "data": null,
  "errors": null,
  "errorCode": "UNAUTHORIZED"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "No performance data found for the specified period",
  "data": null,
  "errors": null,
  "errorCode": "NO_DATA"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "data": null,
  "errors": null,
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An error occurred while processing the request",
  "data": null,
  "errors": null,
  "errorCode": "INTERNAL_ERROR"
}
```

## Rate Limiting

All statistics endpoints are subject to rate limiting:
- **Rate**: 60 requests per minute per user
- **Burst**: Up to 10 requests per second
- **Headers**: Rate limit status returned in response headers

## Caching

- **Response Caching**: Statistics are cached for 5 minutes
- **Cache Invalidation**: Cache invalidated when new rounds are completed
- **Headers**: Cache status included in response headers

## Performance Notes

- **Response Time**: Typical response time 200-500ms for most endpoints
- **Complex Queries**: Course comparison and trend analysis may take up to 2 seconds
- **Optimization**: Queries are optimized with proper database indexing
- **Pagination**: Round performance history supports pagination for large datasets

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The user ID is extracted from the JWT token claims to ensure data isolation and security.

---

*Last Updated: July 22, 2025*