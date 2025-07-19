# Course Management API Endpoints

**Version**: v1.0.0  
**Base URL**: `/api/course`  
**Authentication**: JWT Bearer Token (for protected endpoints)

## Overview

The Course Management API provides endpoints for managing golf course data, including course discovery, search, and administrative operations. All endpoints return responses wrapped in the standard `ApiResponse<T>` format.

## Common Response Format

All endpoints return responses in the following format:

```json
{
  "success": true|false,
  "data": { /* response data */ },
  "message": "Success message",
  "errorCode": "ERROR_CODE",
  "errors": ["Error message 1", "Error message 2"],
  "timestamp": "2025-01-19T10:00:00Z"
}
```

## Public Endpoints

### Get Courses (Paginated)

Retrieve a paginated list of courses with optional search functionality.

**Endpoint**: `GET /api/course`

**Parameters**:
- `page` (query, optional): Page number (default: 1)
- `pageSize` (query, optional): Items per page (default: 10, max: 100)
- `searchTerm` (query, optional): Search term for filtering courses

**Example Request**:
```http
GET /api/course?page=1&pageSize=10&searchTerm=championship
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Augusta National Golf Club",
        "description": "Famous championship golf course",
        "city": "Augusta",
        "state": "Georgia",
        "country": "United States",
        "totalHoles": 18,
        "parTotal": 72,
        "greenFeeRange": "$500-$1000",
        "isActive": true,
        "latitude": 33.5030,
        "longitude": -82.0199
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "message": "Courses retrieved successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success
- `400`: Invalid parameters

---

### Get Course by ID

Retrieve detailed information about a specific course, including holes.

**Endpoint**: `GET /api/course/{id}`

**Parameters**:
- `id` (path, required): Course ID

**Example Request**:
```http
GET /api/course/1
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Augusta National Golf Club",
    "description": "Famous championship golf course home to The Masters",
    "address": "2604 Washington Road",
    "city": "Augusta",
    "state": "Georgia",
    "country": "United States",
    "phone": "+1-706-667-6000",
    "website": "https://www.augusta.com",
    "totalHoles": 18,
    "parTotal": 72,
    "slopeRating": 137,
    "courseRating": 76.2,
    "yardageTotal": 7435,
    "greenFeeRange": "Private Club",
    "timezone": "America/New_York",
    "isActive": true,
    "amenities": {
      "drivingRange": true,
      "puttingGreen": true,
      "restaurant": true,
      "proShop": true
    },
    "latitude": 33.5030,
    "longitude": -82.0199,
    "holes": [
      {
        "id": 1,
        "holeNumber": 1,
        "par": 4,
        "yardageMen": 445,
        "yardageWomen": 400,
        "handicap": 10,
        "description": "A demanding par 4 to start the round"
      }
    ],
    "createdAt": "2025-01-19T10:00:00Z",
    "updatedAt": "2025-01-19T10:00:00Z"
  },
  "message": "Course retrieved successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success
- `404`: Course not found

---

### Get Course by Name

Retrieve course information by name.

**Endpoint**: `GET /api/course/name/{name}`

**Parameters**:
- `name` (path, required): Course name

**Example Request**:
```http
GET /api/course/name/Augusta%20National%20Golf%20Club
```

**Response**: Same format as Get Course by ID

**Response Codes**:
- `200`: Success
- `404`: Course not found

---

### Find Nearby Courses

Find courses within a specified radius of a location.

**Endpoint**: `POST /api/course/nearby`

**Request Body**:
```json
{
  "latitude": 33.5030,
  "longitude": -82.0199,
  "radiusKm": 50.0
}
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Augusta National Golf Club",
      "description": "Famous championship golf course",
      "city": "Augusta",
      "state": "Georgia",
      "country": "United States",
      "totalHoles": 18,
      "parTotal": 72,
      "greenFeeRange": "Private Club",
      "isActive": true,
      "latitude": 33.5030,
      "longitude": -82.0199
    }
  ],
  "message": "Nearby courses retrieved successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success
- `400`: Invalid coordinates or radius

---

### Find Courses by Region

Find courses in a specific city, state, or country.

**Endpoint**: `POST /api/course/region`

**Request Body**:
```json
{
  "region": "Georgia"
}
```

**Response**: Array of CourseListResponseDto (same format as nearby search)

**Response Codes**:
- `200`: Success
- `400`: Invalid region

---

### Check Course Name Availability

Check if a course name is available for registration.

**Endpoint**: `GET /api/course/check-name/{name}`

**Parameters**:
- `name` (path, required): Course name to check

**Example Request**:
```http
GET /api/course/check-name/New%20Golf%20Course
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "message": "Course name is available"
  },
  "message": "Name availability checked successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success

---

### Check Location Within Course

Check if a specific location is within course boundaries.

**Endpoint**: `POST /api/course/{id}/check-location`

**Parameters**:
- `id` (path, required): Course ID

**Request Body**:
```json
{
  "latitude": 33.5030,
  "longitude": -82.0199
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "isWithinCourse": true,
    "message": "Location is within course boundaries"
  },
  "message": "Location check completed successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success
- `400`: Invalid coordinates
- `404`: Course not found

---

### Calculate Distance to Course

Calculate the distance from a location to a course.

**Endpoint**: `POST /api/course/{id}/distance`

**Parameters**:
- `id` (path, required): Course ID

**Request Body**:
```json
{
  "latitude": 33.5030,
  "longitude": -82.0199
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "distanceKm": 2.34,
    "message": "Distance to course is 2.34 kilometers"
  },
  "message": "Distance calculated successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Success
- `400`: Invalid coordinates
- `404`: Course not found

---

## Protected Endpoints

**Authentication Required**: All protected endpoints require a valid JWT Bearer token.

### Create Course

Create a new golf course.

**Endpoint**: `POST /api/course`  
**Authentication**: Required

**Request Body**:
```json
{
  "name": "Pine Valley Golf Club",
  "description": "Championship golf course designed by George Crump",
  "address": "Stock Road",
  "city": "Pine Valley",
  "state": "New Jersey",
  "country": "United States",
  "phone": "+1-856-783-3000",
  "website": "https://www.pinevalley.com",
  "email": "info@pinevalley.com",
  "totalHoles": 18,
  "parTotal": 72,
  "slopeRating": 155,
  "courseRating": 76.8,
  "yardageTotal": 7057,
  "greenFeeRange": "Private Club",
  "timezone": "America/New_York",
  "isActive": true,
  "amenities": {
    "drivingRange": true,
    "puttingGreen": true,
    "restaurant": true,
    "proShop": true,
    "lodging": true
  },
  "latitude": 39.7849,
  "longitude": -74.9371,
  "holes": [
    {
      "holeNumber": 1,
      "par": 4,
      "yardageMen": 427,
      "yardageWomen": 380,
      "handicap": 15,
      "description": "Sharp dogleg right with bunkers guarding the corner"
    }
  ]
}
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Pine Valley Golf Club",
    "description": "Championship golf course designed by George Crump",
    // ... full course details
  },
  "message": "Course created successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `201`: Created successfully
- `400`: Validation errors
- `401`: Unauthorized
- `409`: Course name already exists

---

### Update Course

Update an existing course.

**Endpoint**: `PUT /api/course/{id}`  
**Authentication**: Required

**Parameters**:
- `id` (path, required): Course ID

**Request Body**: Same format as Create Course (without holes array)

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Course Name",
    // ... updated course details
  },
  "message": "Course updated successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Updated successfully
- `400`: Validation errors
- `401`: Unauthorized
- `404`: Course not found
- `409`: Course name already exists

---

### Delete Course

Delete a golf course.

**Endpoint**: `DELETE /api/course/{id}`  
**Authentication**: Required

**Parameters**:
- `id` (path, required): Course ID

**Example Response**:
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

**Response Codes**:
- `200`: Deleted successfully
- `401`: Unauthorized
- `404`: Course not found

---

## Error Responses

### Validation Errors

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    "Name is required",
    "Latitude must be between -90 and 90",
    "Total holes must be between 9 and 27"
  ],
  "timestamp": "2025-01-19T10:00:00Z"
}
```

### Authentication Errors

```json
{
  "success": false,
  "message": "Authentication required",
  "errorCode": "UNAUTHORIZED",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

### Not Found Errors

```json
{
  "success": false,
  "message": "Course with ID 999 not found",
  "errorCode": "COURSE_NOT_FOUND",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

### Conflict Errors

```json
{
  "success": false,
  "message": "A course with the name 'Augusta National Golf Club' already exists",
  "errorCode": "COURSE_EXISTS",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

---

## Rate Limiting

- **Public Endpoints**: 100 requests per minute per IP
- **Protected Endpoints**: 200 requests per minute per authenticated user
- **Search Endpoints**: 50 requests per minute per IP (due to computational complexity)

## SDK Examples

### C# SDK Usage

```csharp
// Get nearby courses
var nearbyRequest = new NearbyCourseSearchRequestDto
{
    Latitude = 33.5030,
    Longitude = -82.0199,
    RadiusKm = 50.0
};

var response = await httpClient.PostAsJsonAsync("/api/course/nearby", nearbyRequest);
var result = await response.Content.ReadFromJsonAsync<ApiResponse<IEnumerable<CourseListResponseDto>>>();

// Create new course
var createRequest = new CreateCourseRequestDto { /* course data */ };
var createResponse = await httpClient.PostAsJsonAsync("/api/course", createRequest);
```

### JavaScript/TypeScript Usage

```javascript
// Search courses
const searchParams = new URLSearchParams({
  page: '1',
  pageSize: '10',
  searchTerm: 'championship'
});

const response = await fetch(`/api/course?${searchParams}`);
const result = await response.json();

// Find nearby courses
const nearbyResponse = await fetch('/api/course/nearby', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    latitude: 33.5030,
    longitude: -82.0199,
    radiusKm: 50.0
  })
});
```

---

*This API documentation is automatically generated and should be kept in sync with the implementation.*