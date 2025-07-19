# Course API Models

**Version**: v1.0.0  
**Last Updated**: 2025-01-19

## Overview

This document describes all data models used in the Course Management API, including request DTOs, response DTOs, and validation rules.

## Response Models

### CourseResponseDto

Complete course information with all details and holes.

```typescript
interface CourseResponseDto {
  id: number;                           // Unique course identifier
  name: string;                         // Course name (required)
  description?: string;                 // Course description
  address?: string;                     // Street address
  city?: string;                        // City name
  state?: string;                       // State/province
  country: string;                      // Country name (required)
  phone?: string;                       // Contact phone number
  website?: string;                     // Official website URL
  email?: string;                       // Contact email address
  totalHoles: number;                   // Number of holes (9, 18, 27, etc.)
  parTotal: number;                     // Total par for the course
  slopeRating?: number;                 // USGA slope rating (55-155)
  courseRating?: number;                // USGA course rating
  yardageTotal?: number;                // Total yardage
  greenFeeRange?: string;               // Price range description
  timezone?: string;                    // IANA timezone identifier
  isActive?: boolean;                   // Whether course is active
  amenities?: Record<string, any>;      // Available amenities (JSON)
  latitude?: number;                    // GPS latitude (-90 to 90)
  longitude?: number;                   // GPS longitude (-180 to 180)
  holes: HoleResponseDto[];             // Course holes information
  createdAt?: string;                   // ISO 8601 timestamp
  updatedAt?: string;                   // ISO 8601 timestamp
}
```

**Validation Rules**:
- `name`: Required, max 200 characters
- `country`: Required, max 100 characters
- `totalHoles`: Required, 9-27 range
- `parTotal`: Required, 54-90 range
- `slopeRating`: Optional, 55-155 range
- `courseRating`: Optional, 50.0-80.0 range
- `yardageTotal`: Optional, 3000-8000 range
- `latitude`: Optional, -90.0 to 90.0 range
- `longitude`: Optional, -180.0 to 180.0 range

---

### CourseListResponseDto

Simplified course information for list views and search results.

```typescript
interface CourseListResponseDto {
  id: number;                           // Unique course identifier
  name: string;                         // Course name
  description?: string;                 // Brief description
  city?: string;                        // City name
  state?: string;                       // State/province
  country: string;                      // Country name
  totalHoles: number;                   // Number of holes
  parTotal: number;                     // Total par
  greenFeeRange?: string;               // Price range
  isActive?: boolean;                   // Active status
  latitude?: number;                    // GPS latitude
  longitude?: number;                   // GPS longitude
}
```

---

### HoleResponseDto

Individual hole information within a course.

```typescript
interface HoleResponseDto {
  id: number;                           // Unique hole identifier
  holeNumber: number;                   // Hole number (1-27)
  par: number;                          // Par value (3-6)
  yardageMen?: number;                  // Men's tee yardage
  yardageWomen?: number;                // Women's tee yardage
  handicap?: number;                    // Stroke index (1-18)
  description?: string;                 // Hole description/tips
}
```

**Validation Rules**:
- `holeNumber`: Required, 1-27 range
- `par`: Required, 3-6 range
- `yardageMen`: Optional, 100-700 range
- `yardageWomen`: Optional, 50-600 range
- `handicap`: Optional, 1-18 range
- `description`: Optional, max 500 characters

---

### PaginatedCourseResponseDto

Paginated response wrapper for course lists.

```typescript
interface PaginatedCourseResponseDto {
  data: CourseListResponseDto[];        // Array of courses
  totalCount: number;                   // Total number of courses
  page: number;                         // Current page number (1-based)
  pageSize: number;                     // Items per page
  totalPages: number;                   // Total number of pages
  hasNextPage: boolean;                 // Whether next page exists
  hasPreviousPage: boolean;             // Whether previous page exists
}
```

---

## Request Models

### CreateCourseRequestDto

Request model for creating a new golf course.

```typescript
interface CreateCourseRequestDto {
  name: string;                         // Course name (required)
  description?: string;                 // Course description
  address?: string;                     // Street address
  city?: string;                        // City name
  state?: string;                       // State/province
  country: string;                      // Country name (required)
  phone?: string;                       // Contact phone
  website?: string;                     // Website URL
  email?: string;                       // Email address
  totalHoles: number;                   // Number of holes (required)
  parTotal: number;                     // Total par (required)
  slopeRating?: number;                 // USGA slope rating
  courseRating?: number;                // USGA course rating
  yardageTotal?: number;                // Total yardage
  greenFeeRange?: string;               // Price range
  timezone?: string;                    // Timezone
  isActive: boolean;                    // Active status (default: true)
  amenities?: Record<string, any>;      // Amenities JSON
  latitude: number;                     // GPS latitude (required)
  longitude: number;                    // GPS longitude (required)
  holes: CreateHoleRequestDto[];        // Holes array
}
```

**Validation Attributes**:
```csharp
[Required]
[StringLength(200)]
public string Name { get; set; }

[Required]
[StringLength(100)]
public string Country { get; set; }

[Required]
[Range(9, 27)]
public int TotalHoles { get; set; }

[Required]
[Range(54, 90)]
public int ParTotal { get; set; }

[Range(55, 155)]
public int? SlopeRating { get; set; }

[Range(50.0, 80.0)]
public decimal? CourseRating { get; set; }

[Range(3000, 8000)]
public int? YardageTotal { get; set; }

[Required]
[Range(-90.0, 90.0)]
public double Latitude { get; set; }

[Required]
[Range(-180.0, 180.0)]
public double Longitude { get; set; }

[StringLength(1000)]
public string? Description { get; set; }

[StringLength(500)]
public string? Address { get; set; }

[StringLength(100)]
public string? City { get; set; }

[StringLength(100)]
public string? State { get; set; }

[StringLength(20)]
public string? Phone { get; set; }

[StringLength(200)]
public string? Website { get; set; }

[StringLength(100)]
[EmailAddress]
public string? Email { get; set; }

[StringLength(200)]
public string? GreenFeeRange { get; set; }

[StringLength(50)]
public string? Timezone { get; set; }
```

---

### CreateHoleRequestDto

Request model for creating holes within a course.

```typescript
interface CreateHoleRequestDto {
  holeNumber: number;                   // Hole number (required)
  par: number;                          // Par value (required)
  yardageMen?: number;                  // Men's tee yardage
  yardageWomen?: number;                // Women's tee yardage
  handicap?: number;                    // Stroke index
  description?: string;                 // Hole description
}
```

**Validation Attributes**:
```csharp
[Required]
[Range(1, 27)]
public int HoleNumber { get; set; }

[Required]
[Range(3, 6)]
public int Par { get; set; }

[Range(100, 700)]
public int? YardageMen { get; set; }

[Range(50, 600)]
public int? YardageWomen { get; set; }

[Range(1, 18)]
public int? Handicap { get; set; }

[StringLength(500)]
public string? Description { get; set; }
```

---

### UpdateCourseRequestDto

Request model for updating an existing course. Same structure as `CreateCourseRequestDto` but without the holes array.

```typescript
interface UpdateCourseRequestDto {
  name: string;                         // Course name (required)
  description?: string;                 // Course description
  address?: string;                     // Street address
  city?: string;                        // City name
  state?: string;                       // State/province
  country: string;                      // Country name (required)
  phone?: string;                       // Contact phone
  website?: string;                     // Website URL
  email?: string;                       // Email address
  totalHoles: number;                   // Number of holes (required)
  parTotal: number;                     // Total par (required)
  slopeRating?: number;                 // USGA slope rating
  courseRating?: number;                // USGA course rating
  yardageTotal?: number;                // Total yardage
  greenFeeRange?: string;               // Price range
  timezone?: string;                    // Timezone
  isActive: boolean;                    // Active status
  amenities?: Record<string, any>;      // Amenities JSON
  latitude: number;                     // GPS latitude (required)
  longitude: number;                    // GPS longitude (required)
}
```

---

## Search Request Models

### CourseSearchRequestDto

Request model for paginated course search.

```typescript
interface CourseSearchRequestDto {
  searchTerm?: string;                  // Search term (optional)
  page: number;                         // Page number (default: 1)
  pageSize: number;                     // Items per page (default: 10, max: 100)
}
```

**Validation Attributes**:
```csharp
[Range(1, int.MaxValue)]
public int Page { get; set; } = 1;

[Range(1, 100)]
public int PageSize { get; set; } = 10;
```

---

### NearbyCourseSearchRequestDto

Request model for finding courses near a location.

```typescript
interface NearbyCourseSearchRequestDto {
  latitude: number;                     // GPS latitude (required)
  longitude: number;                    // GPS longitude (required)
  radiusKm: number;                     // Search radius in kilometers (required)
}
```

**Validation Attributes**:
```csharp
[Required]
[Range(-90.0, 90.0)]
public double Latitude { get; set; }

[Required]
[Range(-180.0, 180.0)]
public double Longitude { get; set; }

[Required]
[Range(0.1, 100.0)]
public double RadiusKm { get; set; } = 10.0;
```

---

### RegionCourseSearchRequestDto

Request model for finding courses by region.

```typescript
interface RegionCourseSearchRequestDto {
  region: string;                       // Region name (city, state, or country)
}
```

**Validation Attributes**:
```csharp
[Required]
[StringLength(100)]
public string Region { get; set; }
```

---

### LocationWithinCourseRequestDto

Request model for checking if a location is within course boundaries.

```typescript
interface LocationWithinCourseRequestDto {
  latitude: number;                     // GPS latitude (required)
  longitude: number;                    // GPS longitude (required)
}
```

**Validation Attributes**:
```csharp
[Required]
[Range(-90.0, 90.0)]
public double Latitude { get; set; }

[Required]
[Range(-180.0, 180.0)]
public double Longitude { get; set; }
```

---

### DistanceToCourseRequestDto

Request model for calculating distance to a course.

```typescript
interface DistanceToCourseRequestDto {
  latitude: number;                     // GPS latitude (required)
  longitude: number;                    // GPS longitude (required)
}
```

**Validation Attributes**: Same as `LocationWithinCourseRequestDto`

---

## Utility Response Models

### CourseNameAvailabilityResponseDto

Response model for course name availability check.

```typescript
interface CourseNameAvailabilityResponseDto {
  isAvailable: boolean;                 // Whether the name is available
  message: string;                      // Descriptive message
}
```

---

### LocationWithinCourseResponseDto

Response model for location boundary check.

```typescript
interface LocationWithinCourseResponseDto {
  isWithinCourse: boolean;              // Whether location is within boundaries
  message: string;                      // Descriptive message
}
```

---

### DistanceToCourseResponseDto

Response model for distance calculation.

```typescript
interface DistanceToCourseResponseDto {
  distanceKm: number;                   // Distance in kilometers
  message: string;                      // Descriptive message with distance
}
```

---

## Common Data Types

### Amenities Object

The amenities field supports flexible JSON structure. Common properties include:

```typescript
interface CourseAmenities {
  drivingRange?: boolean;               // Driving range available
  puttingGreen?: boolean;               // Putting green available
  restaurant?: boolean;                 // Restaurant on-site
  proShop?: boolean;                   // Pro shop available
  lodging?: boolean;                   // Lodging available
  spa?: boolean;                       // Spa services available
  clubRental?: boolean;                // Club rental available
  cartRental?: boolean;                // Cart rental available
  caddieService?: boolean;             // Caddie service available
  dressCode?: string;                  // Dress code requirements
  wheelchairAccessible?: boolean;       // Accessibility features
  parkingAvailable?: boolean;          // Parking availability
  publicTransport?: boolean;           // Public transport access
  [key: string]: any;                  // Additional custom amenities
}
```

### Error Codes

Common error codes returned by the Course Management API:

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `COURSE_NOT_FOUND` | Course does not exist |
| `COURSE_EXISTS` | Course name already taken |
| `UNAUTHORIZED` | Authentication required |
| `INTERNAL_ERROR` | Server error occurred |

### HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized |
| `404` | Not Found |
| `409` | Conflict (duplicate name) |
| `500` | Internal Server Error |

---

## Model Relationships

```
Course (1) ──────── (N) Hole
  │
  ├── Basic Info (name, description, location)
  ├── Golf Data (par, rating, yardage)
  ├── Contact Info (phone, email, website)
  ├── Amenities (JSON object)
  └── Geospatial (latitude, longitude, boundary)

Hole
  ├── Basic Info (number, par, description)
  ├── Yardage (men's, women's, various tees)
  ├── Difficulty (handicap/stroke index)
  └── Geospatial (tee location, pin location)
```

---

## Example Usage Patterns

### Complete Course Creation

```json
{
  "name": "Pebble Beach Golf Links",
  "description": "Iconic oceanside golf course in Monterey",
  "address": "1700 17 Mile Drive",
  "city": "Pebble Beach",
  "state": "California",
  "country": "United States",
  "phone": "+1-831-624-3811",
  "website": "https://www.pebblebeach.com",
  "email": "golf@pebblebeach.com",
  "totalHoles": 18,
  "parTotal": 72,
  "slopeRating": 145,
  "courseRating": 75.5,
  "yardageTotal": 6828,
  "greenFeeRange": "$500-$600",
  "timezone": "America/Los_Angeles",
  "isActive": true,
  "amenities": {
    "drivingRange": true,
    "puttingGreen": true,
    "restaurant": true,
    "proShop": true,
    "lodging": true,
    "spa": true,
    "oceanView": true,
    "dressCode": "Collared shirts required"
  },
  "latitude": 36.5694,
  "longitude": -121.9425,
  "holes": [
    {
      "holeNumber": 1,
      "par": 4,
      "yardageMen": 377,
      "yardageWomen": 329,
      "handicap": 15,
      "description": "A relatively easy start with ocean views"
    },
    {
      "holeNumber": 18,
      "par": 5,
      "yardageMen": 543,
      "yardageWomen": 477,
      "handicap": 9,
      "description": "Famous finishing hole along the Pacific Ocean"
    }
  ]
}
```

---

*This model documentation is maintained in sync with the API implementation and should be updated when models change.*