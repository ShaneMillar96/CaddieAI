# Round Management API Endpoints

This document describes all API endpoints for round management functionality in the CaddieAI application.

## Base URL
```
https://api.caddieai.com/api/v1
```

## Authentication
All endpoints require JWT bearer token authentication:
```
Authorization: Bearer {jwt_token}
```

## Round Endpoints

### Get User Rounds
Retrieve all rounds for the authenticated user with optional filtering and pagination.

**Endpoint:** `GET /rounds`

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `pageSize` (optional): Number of items per page (default: 10, max: 50)
- `status` (optional): Filter by round status (`not_started`, `in_progress`, `paused`, `completed`, `abandoned`)
- `startDate` (optional): Filter rounds from this date (format: YYYY-MM-DD)
- `endDate` (optional): Filter rounds to this date (format: YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 123,
      "courseId": 1,
      "roundDate": "2025-07-19",
      "startTime": "2025-07-19T08:00:00Z",
      "endTime": "2025-07-19T12:30:00Z",
      "currentHole": 18,
      "status": "completed",
      "totalScore": 85,
      "notes": "Great round today!",
      "createdAt": "2025-07-19T07:45:00Z"
    }
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Invalid query parameters

---

### Get Round Details
Retrieve detailed information about a specific round.

**Endpoint:** `GET /rounds/{id}`

**Path Parameters:**
- `id`: Round ID (integer)

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": "2025-07-19T12:30:00Z",
  "currentHole": 18,
  "status": "completed",
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Great round today!",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T07:45:00Z",
  "updatedAt": "2025-07-19T12:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist

---

### Create Round
Create a new golf round (but don't start it yet).

**Endpoint:** `POST /rounds`

**Request Body:**
```json
{
  "courseId": 1,
  "roundDate": "2025-07-19",
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Planning an early morning round",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}"
}
```

**Response:** `201 Created`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": null,
  "endTime": null,
  "currentHole": null,
  "status": "not_started",
  "totalScore": null,
  "totalPutts": null,
  "fairwaysHit": null,
  "greensInRegulation": null,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Planning an early morning round",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T07:45:00Z",
  "updatedAt": "2025-07-19T07:45:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Invalid request data or user already has active round
- `404 Not Found`: Course does not exist

---

### Update Round
Update round information and progress.

**Endpoint:** `PUT /rounds/{id}`

**Path Parameters:**
- `id`: Round ID (integer)

**Request Body:**
```json
{
  "currentHole": 15,
  "totalScore": 68,
  "totalPutts": 28,
  "fairwaysHit": 10,
  "greensInRegulation": 8,
  "temperatureCelsius": 24.0,
  "windSpeedKmh": 15.0,
  "notes": "Playing well, improved putting on back nine"
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": null,
  "currentHole": 15,
  "status": "in_progress",
  "totalScore": 68,
  "totalPutts": 28,
  "fairwaysHit": 10,
  "greensInRegulation": 8,
  "temperatureCelsius": 24.0,
  "windSpeedKmh": 15.0,
  "notes": "Playing well, improved putting on back nine",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T07:45:00Z",
  "updatedAt": "2025-07-19T11:15:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist
- `400 Bad Request`: Invalid update data

---

### Start Round
Start a golf round (creates and immediately starts the round).

**Endpoint:** `POST /rounds/start`

**Request Body:**
```json
{
  "courseId": 1,
  "roundDate": "2025-07-19",
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Perfect morning conditions",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}"
}
```

**Response:** `201 Created`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": null,
  "currentHole": 1,
  "status": "in_progress",
  "totalScore": null,
  "totalPutts": null,
  "fairwaysHit": null,
  "greensInRegulation": null,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Perfect morning conditions",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T08:00:00Z",
  "updatedAt": "2025-07-19T08:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: User already has active round or invalid data
- `404 Not Found`: Course does not exist

---

### Pause Round
Temporarily pause an active round.

**Endpoint:** `PUT /rounds/{id}/pause`

**Path Parameters:**
- `id`: Round ID (integer)

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": null,
  "currentHole": 9,
  "status": "paused",
  "totalScore": 42,
  "totalPutts": 18,
  "fairwaysHit": 6,
  "greensInRegulation": 5,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Lunch break",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T08:00:00Z",
  "updatedAt": "2025-07-19T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist
- `400 Bad Request`: Round is not in progress (cannot pause)

---

### Resume Round
Resume a paused round.

**Endpoint:** `PUT /rounds/{id}/resume`

**Path Parameters:**
- `id`: Round ID (integer)

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": null,
  "currentHole": 9,
  "status": "in_progress",
  "totalScore": 42,
  "totalPutts": 18,
  "fairwaysHit": 6,
  "greensInRegulation": 5,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Back from lunch break",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T08:00:00Z",
  "updatedAt": "2025-07-19T11:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist
- `400 Bad Request`: Round is not paused (cannot resume)

---

### Complete Round
Complete a round with final scoring information.

**Endpoint:** `PUT /rounds/{id}/complete`

**Path Parameters:**
- `id`: Round ID (integer)

**Request Body:**
```json
{
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "notes": "Great round! Improved putting significantly."
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": "2025-07-19T12:30:00Z",
  "currentHole": 18,
  "status": "completed",
  "totalScore": 85,
  "totalPutts": 32,
  "fairwaysHit": 12,
  "greensInRegulation": 10,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 10.0,
  "notes": "Great round! Improved putting significantly.",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T08:00:00Z",
  "updatedAt": "2025-07-19T12:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist
- `400 Bad Request`: Round is not in progress/paused or invalid score

---

### Abandon Round
Abandon a round that cannot be completed.

**Endpoint:** `PUT /rounds/{id}/abandon`

**Path Parameters:**
- `id`: Round ID (integer)

**Request Body (optional):**
```json
{
  "reason": "Weather conditions became dangerous"
}
```

**Response:** `200 OK`
```json
{
  "id": 123,
  "userId": 456,
  "courseId": 1,
  "roundDate": "2025-07-19",
  "startTime": "2025-07-19T08:00:00Z",
  "endTime": "2025-07-19T10:15:00Z",
  "currentHole": 7,
  "status": "abandoned",
  "totalScore": null,
  "totalPutts": null,
  "fairwaysHit": null,
  "greensInRegulation": null,
  "temperatureCelsius": 22.5,
  "windSpeedKmh": 35.0,
  "notes": "Abandoned: Weather conditions became dangerous",
  "roundMetadata": "{\"teeType\":\"blue\",\"cart\":true}",
  "createdAt": "2025-07-19T08:00:00Z",
  "updatedAt": "2025-07-19T10:15:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Round belongs to different user
- `404 Not Found`: Round does not exist
- `400 Bad Request`: Round is already completed or abandoned

---

### Get Round Statistics
Retrieve aggregated statistics for a user's rounds.

**Endpoint:** `GET /rounds/statistics`

**Query Parameters:**
- `startDate` (optional): Start date for statistics (format: YYYY-MM-DD)
- `endDate` (optional): End date for statistics (format: YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "totalRounds": 25,
  "averageScore": 87.5,
  "bestScore": 78,
  "worstScore": 102,
  "averagePutts": 33.2,
  "averageFairwaysHit": 9.8,
  "averageGreensInRegulation": 7.5,
  "startDate": "2025-01-01",
  "endDate": "2025-07-19"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Invalid date range

---

## Error Response Format

All error responses follow this standard format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more validation errors occurred.",
    "details": [
      {
        "field": "totalScore",
        "message": "Score must be between 18 and 300"
      }
    ]
  },
  "traceId": "12345678-1234-5678-9012-123456789012"
}
```

## Rate Limiting

All endpoints are subject to rate limiting:
- **Authenticated users**: 1000 requests per hour
- **Burst limit**: 100 requests per minute

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1658239200
```

## Examples

### Complete Round Workflow

1. **Start Round**
```bash
curl -X POST "https://api.caddieai.com/api/v1/rounds/start" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"courseId": 1, "roundDate": "2025-07-19"}'
```

2. **Update Progress**
```bash
curl -X PUT "https://api.caddieai.com/api/v1/rounds/123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"currentHole": 9, "totalScore": 42}'
```

3. **Complete Round**
```bash
curl -X PUT "https://api.caddieai.com/api/v1/rounds/123/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"totalScore": 85, "totalPutts": 32}'
```

---

*This documentation should be updated whenever the Round Management API endpoints are modified.*