# Club Recommendation API Endpoints

## Overview

The Club Recommendation API provides intelligent golf club recommendations using AI-powered analysis. All endpoints require authentication and return standardized API responses.

## Base URL
```
https://api.caddieai.com/api/clubrecommendation
```

## Authentication
All endpoints require a valid JWT token:
```http
Authorization: Bearer {your-jwt-token}
```

## Endpoints

### 1. Generate Club Recommendation

**POST** `/api/clubrecommendation`

Generates an AI-powered club recommendation based on comprehensive context analysis.

#### Request Body
```json
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
  "additionalContext": {
    "pinPosition": "back",
    "greenFirmness": "medium"
  }
}
```

#### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | integer | Yes | User requesting the recommendation |
| `roundId` | integer | No | Current golf round ID |
| `holeId` | integer | No | Current hole ID |
| `locationId` | integer | No | Current location ID |
| `distanceToTarget` | decimal | Yes | Distance to target in meters (1-1000) |
| `weatherConditions` | string | No | Current weather description (max 200 chars) |
| `lieConditions` | string | No | Ball lie conditions (max 100 chars) |
| `shotType` | string | No | Type of shot (tee_shot, approach, chip, putt, etc.) |
| `playerNotes` | string | No | Additional player notes (max 500 chars) |
| `additionalContext` | object | No | Additional context data |

#### Response (200 OK)
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
  "message": "Club recommendation generated successfully",
  "timestamp": "2025-01-20T15:30:00Z"
}
```

#### Error Responses
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Invalid or missing authentication
- **500 Internal Server Error**: System error

---

### 2. Provide Recommendation Feedback

**POST** `/api/clubrecommendation/{id}/feedback`

Saves user feedback on a club recommendation for machine learning improvement.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Recommendation ID |

#### Request Body
```json
{
  "wasAccepted": true,
  "actualClubUsed": "7 Iron",
  "playerNotes": "Great recommendation, hit it pin high",
  "shotResult": 5,
  "shotOutcome": "on_target"
}
```

#### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wasAccepted` | boolean | Yes | Whether the recommendation was accepted |
| `actualClubUsed` | string | No | Club actually used (max 50 chars) |
| `playerNotes` | string | No | Player feedback notes (max 500 chars) |
| `shotResult` | integer | No | Shot quality rating (1-5 scale) |
| `shotOutcome` | string | No | Shot outcome (on_target, short, long, left, right) |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Feedback saved successfully",
  "timestamp": "2025-01-20T15:32:00Z"
}
```

#### Error Responses
- **404 Not Found**: Recommendation not found
- **400 Bad Request**: Invalid feedback data

---

### 3. Get Recommendation by ID

**GET** `/api/clubrecommendation/{id}`

Retrieves a specific club recommendation by its ID.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Recommendation ID |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 456,
    "userId": 1,
    "roundId": 123,
    "holeId": 45,
    "locationId": 789,
    "recommendedClub": "7 Iron",
    "confidenceScore": 0.85,
    "distanceToTarget": 150.5,
    "openaiReasoning": "Based on distance and conditions...",
    "contextUsed": "{\"weather\":\"Light wind\"}",
    "wasAccepted": true,
    "actualClubUsed": "7 Iron",
    "recommendationMetadata": "{\"alternatives\":[\"6 Iron\",\"8 Iron\"]}",
    "createdAt": "2025-01-20T15:30:00Z",
    "updatedAt": "2025-01-20T15:32:00Z"
  },
  "message": "Recommendation retrieved successfully"
}
```

---

### 4. Get User Recommendation History

**GET** `/api/clubrecommendation/users/{userId}/history`

Retrieves the recommendation history for a specific user.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | integer | User ID |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Maximum number of results to return |

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "recommendedClub": "7 Iron",
      "confidenceScore": 0.85,
      "distanceToTarget": 150.5,
      "wasAccepted": true,
      "actualClubUsed": "7 Iron",
      "createdAt": "2025-01-20T15:30:00Z"
    }
  ],
  "message": "Recommendation history retrieved successfully"
}
```

---

### 5. Get Round Recommendations

**GET** `/api/clubrecommendation/rounds/{roundId}`

Retrieves all club recommendations for a specific golf round.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `roundId` | integer | Round ID |

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "recommendedClub": "7 Iron",
      "confidenceScore": 0.85,
      "distanceToTarget": 150.5,
      "holeId": 45,
      "wasAccepted": true,
      "createdAt": "2025-01-20T15:30:00Z"
    }
  ],
  "message": "Round recommendations retrieved successfully"
}
```

---

### 6. Get User Analytics

**GET** `/api/clubrecommendation/users/{userId}/analytics`

Retrieves performance analytics for a user's club recommendations.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | integer | User ID |

#### Response (200 OK)
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
      },
      {
        "club": "Driver",
        "recommendationCount": 25,
        "percentage": 19.69
      }
    ],
    "clubAccuracyRates": [
      {
        "club": "7 Iron",
        "acceptanceRate": 0.82,
        "totalRecommendations": 28,
        "acceptedRecommendations": 23
      }
    ],
    "acceptanceRateByDistance": {
      "50-100m": 0.89,
      "100-150m": 0.75,
      "150-200m": 0.68
    },
    "acceptanceRateByConditions": {
      "calm": 0.81,
      "windy": 0.65,
      "rainy": 0.58
    },
    "analyticsGeneratedAt": "2025-01-20T15:35:00Z"
  },
  "message": "User analytics retrieved successfully"
}
```

---

### 7. Get System Analytics

**GET** `/api/clubrecommendation/analytics`

Retrieves system-wide analytics for all club recommendations.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "overallAcceptanceRate": 0.68,
    "totalRecommendations": 15847,
    "acceptedRecommendations": 10776,
    "mostRecommendedClubs": [
      {
        "club": "Driver",
        "recommendationCount": 2341,
        "percentage": 14.77
      },
      {
        "club": "7 Iron",
        "recommendationCount": 1923,
        "percentage": 12.13
      }
    ],
    "clubAccuracyRates": [
      {
        "club": "Pitching Wedge",
        "acceptanceRate": 0.84,
        "totalRecommendations": 1456,
        "acceptedRecommendations": 1223
      }
    ],
    "analyticsGeneratedAt": "2025-01-20T15:35:00Z"
  },
  "message": "System analytics retrieved successfully"
}
```

---

### 8. Get Similar Situation Recommendations

**GET** `/api/clubrecommendation/users/{userId}/similar`

Finds recommendations from similar situations for learning purposes.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | integer | User ID |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `distanceToTarget` | decimal | Yes | Distance to target in meters |
| `holeId` | integer | No | Specific hole ID for context |

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "recommendedClub": "7 Iron",
      "confidenceScore": 0.78,
      "distanceToTarget": 148.2,
      "wasAccepted": true,
      "actualClubUsed": "7 Iron",
      "createdAt": "2025-01-15T14:20:00Z"
    }
  ],
  "message": "Similar situation recommendations retrieved successfully"
}
```

---

### 9. Get Most Recent Recommendation

**GET** `/api/clubrecommendation/users/{userId}/recent`

Retrieves the user's most recent club recommendation.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | integer | User ID |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 456,
    "recommendedClub": "7 Iron",
    "confidenceScore": 0.85,
    "distanceToTarget": 150.5,
    "wasAccepted": true,
    "actualClubUsed": "7 Iron",
    "createdAt": "2025-01-20T15:30:00Z"
  },
  "message": "Most recent recommendation retrieved successfully"
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "No recommendations found for user 123",
  "errorCode": "NO_RECOMMENDATIONS_FOUND",
  "timestamp": "2025-01-20T15:35:00Z"
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": ["Detailed error messages"],
  "timestamp": "2025-01-20T15:35:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `RECOMMENDATION_NOT_FOUND` - Recommendation ID not found
- `NO_RECOMMENDATIONS_FOUND` - No recommendations exist for user
- `INVALID_DISTANCE` - Distance parameter out of valid range
- `UNAUTHORIZED` - Authentication required or invalid
- `INTERNAL_ERROR` - System error occurred

### HTTP Status Codes
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - System error

## Rate Limiting

### Limits
- **Generation**: 10 recommendations per minute per user
- **Feedback**: 100 feedback submissions per minute per user
- **Analytics**: 50 requests per minute per user
- **History**: 100 requests per minute per user

### Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642694400
```

## Examples

### Complete Recommendation Flow

1. **Generate Recommendation**
```bash
curl -X POST "https://api.caddieai.com/api/clubrecommendation" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "distanceToTarget": 150.5,
    "weatherConditions": "Light wind",
    "shotType": "approach"
  }'
```

2. **Provide Feedback**
```bash
curl -X POST "https://api.caddieai.com/api/clubrecommendation/456/feedback" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wasAccepted": true,
    "actualClubUsed": "7 Iron",
    "shotResult": 5
  }'
```

3. **Check Analytics**
```bash
curl -X GET "https://api.caddieai.com/api/clubrecommendation/users/1/analytics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

*For more detailed information about the Club Recommendation system, see the [Club Recommendation API Documentation](../features/ai/club-recommendation-api.md).*