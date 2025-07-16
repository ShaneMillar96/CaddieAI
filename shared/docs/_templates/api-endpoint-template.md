# API Endpoint: [Endpoint Name]

**Endpoint**: `[METHOD] /api/v1/endpoint-path`  
**Version**: [API Version]  
**Status**: [Active / Deprecated / Beta]  
**Authentication**: [Required / Optional / None]

## Overview

Brief description of what this endpoint does and its purpose in the application.

## Request

### HTTP Method
`[GET | POST | PUT | DELETE | PATCH]`

### URL
```
[BASE_URL]/api/v1/endpoint-path
```

### Authentication
```http
Authorization: Bearer [JWT_TOKEN]
```

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Accept` | No | `application/json` |
| `Authorization` | Yes | Bearer token for authentication |

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier |
| `category` | `string` | No | Category filter |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `integer` | No | `1` | Page number for pagination |
| `limit` | `integer` | No | `10` | Items per page |
| `sortBy` | `string` | No | `created_at` | Sort field |
| `sortOrder` | `string` | No | `desc` | Sort order (`asc` or `desc`) |

### Request Body
```json
{
  "requiredField": "string",
  "optionalField": "string",
  "nestedObject": {
    "property1": "value1",
    "property2": "value2"
  },
  "arrayField": ["item1", "item2"]
}
```

### Request Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "requiredField": {
      "type": "string",
      "description": "Description of required field"
    },
    "optionalField": {
      "type": "string",
      "description": "Description of optional field"
    }
  },
  "required": ["requiredField"]
}
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field1": "value1",
    "field2": "value2",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "requiredField",
        "message": "This field is required"
      }
    ]
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal server error occurred"
  }
}
```

## Examples

### cURL Example
```bash
curl -X POST "https://api.caddieai.com/api/v1/endpoint-path" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requiredField": "example_value",
    "optionalField": "optional_value"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/v1/endpoint-path', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    requiredField: 'example_value',
    optionalField: 'optional_value'
  })
});

const data = await response.json();
```

### C# Example
```csharp
var client = new HttpClient();
client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue("Bearer", token);

var request = new
{
    RequiredField = "example_value",
    OptionalField = "optional_value"
};

var json = JsonSerializer.Serialize(request);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync("/api/v1/endpoint-path", content);
var responseData = await response.Content.ReadAsStringAsync();
```

## Validation Rules

### Request Validation
- `requiredField`: Must be non-empty string, max 255 characters
- `optionalField`: If provided, must be valid email format
- `nestedObject.property1`: Must be one of: ["value1", "value2", "value3"]

### Business Rules
- User must have appropriate permissions
- Resource must exist and be accessible
- Rate limiting: 100 requests per minute per user

## Rate Limiting

- **Limit**: 100 requests per minute per authenticated user
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Caching

- **Cache-Control**: `private, max-age=300`
- **ETag**: Supported for conditional requests
- **Last-Modified**: Included in response headers

## Performance

- **Average Response Time**: < 200ms
- **95th Percentile**: < 500ms
- **Timeout**: 30 seconds

## Security

### Authentication
- JWT Bearer token required
- Token must be valid and not expired

### Authorization
- User must have `read` permission for GET requests
- User must have `write` permission for POST/PUT/PATCH requests
- User must have `delete` permission for DELETE requests

### Data Validation
- All input is validated and sanitized
- SQL injection protection via parameterized queries
- XSS protection via output encoding

## Testing

### Unit Tests
- Request validation tests
- Business logic tests
- Error handling tests

### Integration Tests
- End-to-end API tests
- Database integration tests
- Authentication tests

### Load Tests
- Performance under normal load
- Stress testing with high concurrency
- Rate limiting behavior

## Monitoring

### Metrics
- Request count
- Response time
- Error rate
- Success rate by status code

### Logging
- All requests logged with correlation ID
- Error details logged for debugging
- Performance metrics logged

### Alerts
- Error rate > 5%
- Response time > 1 second
- Rate limit exceeded frequently

## Changelog

### v1.0.0 (YYYY-MM-DD)
- Initial implementation
- Basic CRUD operations

### v1.1.0 (YYYY-MM-DD)
- Added pagination support
- Improved error handling
- Added request validation

---

*This documentation should be updated whenever the endpoint is modified.*