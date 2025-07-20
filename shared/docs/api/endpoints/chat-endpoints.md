# Chat API Endpoints

> **Version**: 1.0.0  
> **Base URL**: `/api/chat`  
> **Authentication**: Required (JWT Bearer Token)

## Overview

The Chat API provides endpoints for managing AI-powered conversations with the golf caddie assistant. All endpoints require authentication and follow RESTful conventions.

## Authentication

All chat endpoints require a valid JWT bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Start Chat Session

Creates a new chat session with the AI caddie.

```http
POST /api/chat/sessions
```

#### Request Body
```json
{
  "roundId": 123,           // Optional: Current round ID
  "courseId": 456,          // Optional: Course ID for context
  "sessionName": "string"   // Optional: Custom session name
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Chat session created successfully",
  "data": {
    "success": true,
    "message": "Chat session started successfully",
    "session": {
      "id": 789,
      "userId": 123,
      "roundId": 123,
      "courseId": 456,
      "sessionName": "Golf Session 2025-01-20 14:30",
      "openaiModel": "gpt-4o",
      "temperature": 0.7,
      "maxTokens": 1000,
      "totalMessages": 0,
      "lastMessageAt": null,
      "createdAt": "2025-01-20T14:30:00Z",
      "updatedAt": "2025-01-20T14:30:00Z"
    }
  },
  "timestamp": "2025-01-20T14:30:00Z"
}
```

#### Error Responses
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Referenced round or course not found

---

### Send Message

Sends a message to the AI and receives a response.

```http
POST /api/chat/sessions/{sessionId}/messages
```

#### Path Parameters
- `sessionId` (integer): Chat session ID

#### Request Body
```json
{
  "message": "What club should I use for this 150-yard shot?"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "success": true,
    "message": "Message sent successfully",
    "session": {
      "id": 789,
      "userId": 123,
      "totalMessages": 2,
      "lastMessageAt": "2025-01-20T14:35:00Z"
    },
    "assistantMessage": {
      "id": 1001,
      "sessionId": 789,
      "userId": 123,
      "messageContent": "For a 150-yard shot, I'd recommend a 7-iron. Given the wind conditions and your typical distances, this should give you good control and accuracy. Focus on a smooth tempo and trust your swing!",
      "openaiRole": "assistant",
      "tokensConsumed": 45,
      "openaiModelUsed": "gpt-4o",
      "timestamp": "2025-01-20T14:35:00Z",
      "createdAt": "2025-01-20T14:35:00Z"
    }
  },
  "timestamp": "2025-01-20T14:35:00Z"
}
```

#### Error Responses
- **400 Bad Request**: Invalid message content or validation errors
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Chat session not found or access denied
- **429 Too Many Requests**: Rate limit exceeded

---

### Get Chat Session

Retrieves a chat session with message history.

```http
GET /api/chat/sessions/{sessionId}
```

#### Path Parameters
- `sessionId` (integer): Chat session ID

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Chat session retrieved successfully",
  "data": {
    "id": 789,
    "userId": 123,
    "roundId": 123,
    "courseId": 456,
    "sessionName": "Golf Session 2025-01-20 14:30",
    "openaiModel": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 1000,
    "totalMessages": 4,
    "lastMessageAt": "2025-01-20T14:35:00Z",
    "createdAt": "2025-01-20T14:30:00Z",
    "updatedAt": "2025-01-20T14:35:00Z",
    "messages": [
      {
        "id": 1000,
        "sessionId": 789,
        "userId": 123,
        "messageContent": "What club should I use for this 150-yard shot?",
        "openaiRole": "user",
        "tokensConsumed": null,
        "openaiModelUsed": "gpt-4o",
        "timestamp": "2025-01-20T14:35:00Z",
        "createdAt": "2025-01-20T14:35:00Z"
      },
      {
        "id": 1001,
        "sessionId": 789,
        "userId": 123,
        "messageContent": "For a 150-yard shot, I'd recommend a 7-iron...",
        "openaiRole": "assistant",
        "tokensConsumed": 45,
        "openaiModelUsed": "gpt-4o",
        "timestamp": "2025-01-20T14:35:00Z",
        "createdAt": "2025-01-20T14:35:00Z"
      }
    ],
    "courseName": "Pebble Beach Golf Links",
    "roundStatus": "in_progress"
  },
  "timestamp": "2025-01-20T14:36:00Z"
}
```

#### Error Responses
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Chat session not found or access denied

---

### List User Chat Sessions

Retrieves all chat sessions for the authenticated user.

```http
GET /api/chat/sessions
```

#### Query Parameters
- `includeMessages` (boolean, optional): Include message history. Default: `false`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Chat sessions retrieved successfully",
  "data": [
    {
      "id": 789,
      "sessionName": "Golf Session 2025-01-20 14:30",
      "courseName": "Pebble Beach Golf Links",
      "totalMessages": 4,
      "lastMessageAt": "2025-01-20T14:35:00Z",
      "createdAt": "2025-01-20T14:30:00Z",
      "isActive": true
    },
    {
      "id": 788,
      "sessionName": "Practice Round",
      "courseName": "Augusta National",
      "totalMessages": 12,
      "lastMessageAt": "2025-01-19T16:20:00Z",
      "createdAt": "2025-01-19T15:00:00Z",
      "isActive": false
    }
  ],
  "timestamp": "2025-01-20T14:36:00Z"
}
```

---

### Get Active Session for Round

Retrieves the active chat session for a specific round.

```http
GET /api/chat/sessions/round/{roundId}
```

#### Path Parameters
- `roundId` (integer): Round ID

#### Response (200 OK)
Same format as [Get Chat Session](#get-chat-session)

#### Error Responses
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: No active chat session found for this round

---

### Get Conversation History

Retrieves message history for a chat session.

```http
GET /api/chat/sessions/{sessionId}/messages
```

#### Path Parameters
- `sessionId` (integer): Chat session ID

#### Query Parameters
- `limit` (integer, optional): Maximum number of messages to return. Default: `50`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Conversation history retrieved successfully",
  "data": [
    {
      "id": 1000,
      "sessionId": 789,
      "userId": 123,
      "messageContent": "What club should I use for this 150-yard shot?",
      "openaiRole": "user",
      "tokensConsumed": null,
      "openaiModelUsed": "gpt-4o",
      "timestamp": "2025-01-20T14:35:00Z",
      "createdAt": "2025-01-20T14:35:00Z"
    },
    {
      "id": 1001,
      "sessionId": 789,
      "userId": 123,
      "messageContent": "For a 150-yard shot, I'd recommend a 7-iron...",
      "openaiRole": "assistant",
      "tokensConsumed": 45,
      "openaiModelUsed": "gpt-4o",
      "timestamp": "2025-01-20T14:35:00Z",
      "createdAt": "2025-01-20T14:35:00Z"
    }
  ],
  "timestamp": "2025-01-20T14:36:00Z"
}
```

---

### End Chat Session

Marks a chat session as ended.

```http
DELETE /api/chat/sessions/{sessionId}
```

#### Path Parameters
- `sessionId` (integer): Chat session ID

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Chat session ended successfully",
  "timestamp": "2025-01-20T14:40:00Z"
}
```

#### Error Responses
- **401 Unauthorized**: Missing or invalid JWT token
- **404 Not Found**: Chat session not found or access denied

---

### Get Usage Statistics

Retrieves usage statistics for the authenticated user.

```http
GET /api/chat/usage
```

#### Query Parameters
- `days` (integer, optional): Number of days to look back. Default: `30`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Usage statistics retrieved successfully",
  "data": {
    "totalTokens": 5420,
    "totalMessages": 87,
    "estimatedCost": 0.1084,
    "fromDate": "2024-12-21T14:40:00Z",
    "statsGeneratedAt": "2025-01-20T14:40:00Z"
  },
  "timestamp": "2025-01-20T14:40:00Z"
}
```

## Rate Limiting

### Limits
- **Requests per minute**: 60 requests per user
- **Tokens per minute**: 150,000 tokens per user

### Rate Limit Headers
All responses include rate limiting headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642694400
```

### Rate Limit Exceeded Response (429)
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please wait before sending another message.",
  "errorCode": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2025-01-20T14:40:00Z"
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
  "timestamp": "2025-01-20T14:40:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `INVALID_REQUEST`: Malformed request data
- `SESSION_NOT_FOUND`: Chat session not found
- `RATE_LIMIT_EXCEEDED`: Rate limiting triggered
- `INTERNAL_ERROR`: Server error

## Examples

### Complete Conversation Flow

#### 1. Start Session
```bash
curl -X POST "https://api.caddieai.com/api/chat/sessions" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roundId": 123,
    "courseId": 456,
    "sessionName": "Round at Pebble Beach"
  }'
```

#### 2. Send Message
```bash
curl -X POST "https://api.caddieai.com/api/chat/sessions/789/messages" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the best strategy for this par 4?"
  }'
```

#### 3. Get History
```bash
curl -X GET "https://api.caddieai.com/api/chat/sessions/789/messages?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 4. End Session
```bash
curl -X DELETE "https://api.caddieai.com/api/chat/sessions/789" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { CaddieAIClient } from '@caddieai/sdk';

const client = new CaddieAIClient({
  apiKey: 'your-jwt-token',
  baseUrl: 'https://api.caddieai.com'
});

// Start session
const session = await client.chat.startSession({
  roundId: 123,
  courseId: 456
});

// Send message
const response = await client.chat.sendMessage(session.id, {
  message: "What club should I use here?"
});

console.log(response.assistantMessage.messageContent);
```

### Python
```python
from caddieai_sdk import CaddieAIClient

client = CaddieAIClient(
    api_key="your-jwt-token",
    base_url="https://api.caddieai.com"
)

# Start session
session = client.chat.start_session(
    round_id=123,
    course_id=456
)

# Send message
response = client.chat.send_message(
    session_id=session.id,
    message="What club should I use here?"
)

print(response.assistant_message.message_content)
```

## Related Documentation

- [Chat Models](../models/chat-models.md)
- [Authentication](../authentication/README.md)
- [OpenAI Integration Feature](../../features/ai/openai-chatgpt-integration.md)
- [Rate Limiting Guide](../guides/rate-limiting.md)

---

*Last updated: 2025-01-20*