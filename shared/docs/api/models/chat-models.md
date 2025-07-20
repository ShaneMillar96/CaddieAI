# Chat API Models

> **Version**: 1.0.0  
> **Last Updated**: 2025-01-20

## Overview

This document describes all data models used in the Chat API for OpenAI ChatGPT integration. Models are organized by their usage context and include detailed field descriptions, validation rules, and examples.

## Request Models

### StartChatSessionRequestDto

Used to initiate a new chat session with the AI caddie.

```typescript
interface StartChatSessionRequestDto {
  roundId?: number;      // Optional: Current round ID for context
  courseId?: number;     // Optional: Course ID for context  
  sessionName?: string;  // Optional: Custom session name (max 100 chars)
}
```

#### Validation Rules
- `sessionName`: Maximum 100 characters
- At least one of `roundId` or `courseId` should be provided for optimal context
- `roundId` and `courseId` must reference existing entities if provided

#### Example
```json
{
  "roundId": 123,
  "courseId": 456,
  "sessionName": "Round at Pebble Beach"
}
```

---

### SendMessageRequestDto

Used to send a message to the AI assistant.

```typescript
interface SendMessageRequestDto {
  message: string;  // Required: Message content (1-2000 chars)
}
```

#### Validation Rules
- `message`: Required, minimum 1 character, maximum 2000 characters
- Cannot be empty or whitespace only
- Special characters and emojis allowed

#### Example
```json
{
  "message": "What club should I use for this 150-yard shot with a slight headwind?"
}
```

---

## Response Models

### ChatSessionDto

Basic chat session information without message history.

```typescript
interface ChatSessionDto {
  id: number;                    // Session ID
  userId: number;                // Owner user ID
  roundId?: number;              // Associated round ID
  courseId?: number;             // Associated course ID
  sessionName?: string;          // Session display name
  openaiModel?: string;          // OpenAI model used (e.g., "gpt-4o")
  temperature?: number;          // AI creativity setting (0.0-1.0)
  maxTokens?: number;            // Token limit per response
  totalMessages?: number;        // Total message count in session
  lastMessageAt?: string;        // ISO datetime of last message
  createdAt?: string;            // ISO datetime of creation
  updatedAt?: string;            // ISO datetime of last update
}
```

#### Example
```json
{
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
  "updatedAt": "2025-01-20T14:35:00Z"
}
```

---

### ChatSessionDetailDto

Extended chat session with complete message history and context.

```typescript
interface ChatSessionDetailDto extends ChatSessionDto {
  messages: ChatMessageDto[];    // Complete message history
  courseName?: string;           // Course name for display
  roundStatus?: string;          // Current round status
}
```

#### Example
```json
{
  "id": 789,
  "userId": 123,
  "roundId": 123,
  "courseId": 456,
  "sessionName": "Golf Session 2025-01-20 14:30",
  "openaiModel": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 1000,
  "totalMessages": 2,
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
      "messageContent": "For a 150-yard shot, I'd recommend a 7-iron. Given the current conditions and your typical distances, this should give you good control and accuracy.",
      "openaiRole": "assistant",
      "tokensConsumed": 45,
      "openaiModelUsed": "gpt-4o",
      "timestamp": "2025-01-20T14:35:00Z",
      "createdAt": "2025-01-20T14:35:00Z"
    }
  ],
  "courseName": "Pebble Beach Golf Links",
  "roundStatus": "in_progress"
}
```

---

### ChatSessionSummaryDto

Lightweight session summary for list views.

```typescript
interface ChatSessionSummaryDto {
  id: number;                    // Session ID
  sessionName?: string;          // Session display name
  courseName?: string;           // Course name
  totalMessages?: number;        // Message count
  lastMessageAt?: string;        // ISO datetime of last message
  createdAt?: string;            // ISO datetime of creation
  isActive: boolean;             // Whether session is currently active
}
```

#### Example
```json
{
  "id": 789,
  "sessionName": "Round at Pebble Beach",
  "courseName": "Pebble Beach Golf Links",
  "totalMessages": 4,
  "lastMessageAt": "2025-01-20T14:35:00Z",
  "createdAt": "2025-01-20T14:30:00Z",
  "isActive": true
}
```

---

### ChatMessageDto

Individual message within a conversation.

```typescript
interface ChatMessageDto {
  id: number;                    // Message ID
  sessionId: number;             // Parent session ID
  userId: number;                // Author user ID
  messageContent: string;        // Message text content
  openaiRole?: string;           // Role: "user", "assistant", "system"
  tokensConsumed?: number;       // Tokens used (for assistant messages)
  openaiModelUsed?: string;      // OpenAI model used
  timestamp?: string;            // ISO datetime of message
  createdAt?: string;            // ISO datetime of creation
}
```

#### OpenAI Roles
- `"user"`: Messages from the human user
- `"assistant"`: Messages from the AI caddie
- `"system"`: System prompts and instructions (usually hidden)

#### Example
```json
{
  "id": 1001,
  "sessionId": 789,
  "userId": 123,
  "messageContent": "For a 150-yard shot, I'd recommend a 7-iron. Given the wind conditions and your typical distances, this should give you good control and accuracy. Focus on a smooth tempo!",
  "openaiRole": "assistant",
  "tokensConsumed": 45,
  "openaiModelUsed": "gpt-4o",
  "timestamp": "2025-01-20T14:35:00Z",
  "createdAt": "2025-01-20T14:35:00Z"
}
```

---

### ChatMessageSummaryDto

Simplified message for quick display.

```typescript
interface ChatMessageSummaryDto {
  id: number;                    // Message ID
  messageContent: string;        // Message text content
  openaiRole?: string;           // Role: "user", "assistant", "system"
  timestamp?: string;            // ISO datetime of message
  isFromUser: boolean;           // Convenience property (role === "user")
  isFromAssistant: boolean;      // Convenience property (role === "assistant")
}
```

#### Example
```json
{
  "id": 1001,
  "messageContent": "For a 150-yard shot, I'd recommend a 7-iron...",
  "openaiRole": "assistant",
  "timestamp": "2025-01-20T14:35:00Z",
  "isFromUser": false,
  "isFromAssistant": true
}
```

---

## Response Wrapper Models

### ChatResponseDto

Response wrapper for successful message exchanges.

```typescript
interface ChatResponseDto {
  success: boolean;              // Operation success status
  message?: string;              // Human-readable status message
  session?: ChatSessionDto;      // Updated session information
  userMessage?: ChatMessageDto;  // Echo of user's message
  assistantMessage?: ChatMessageDto; // AI response message
}
```

#### Example
```json
{
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
    "messageContent": "For a 150-yard shot, I'd recommend a 7-iron...",
    "openaiRole": "assistant",
    "tokensConsumed": 45,
    "openaiModelUsed": "gpt-4o",
    "timestamp": "2025-01-20T14:35:00Z",
    "createdAt": "2025-01-20T14:35:00Z"
  }
}
```

---

### StartChatSessionResponseDto

Response wrapper for session creation.

```typescript
interface StartChatSessionResponseDto {
  success: boolean;              // Operation success status
  message?: string;              // Human-readable status message
  session?: ChatSessionDto;      // Created session information
}
```

#### Example
```json
{
  "success": true,
  "message": "Chat session started successfully",
  "session": {
    "id": 789,
    "userId": 123,
    "roundId": 123,
    "courseId": 456,
    "sessionName": "Round at Pebble Beach",
    "openaiModel": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 1000,
    "totalMessages": 0,
    "lastMessageAt": null,
    "createdAt": "2025-01-20T14:30:00Z",
    "updatedAt": "2025-01-20T14:30:00Z"
  }
}
```

---

### ChatUsageStatsDto

Usage statistics and cost tracking information.

```typescript
interface ChatUsageStatsDto {
  totalTokens: number;           // Total tokens consumed
  totalMessages: number;         // Total messages sent
  estimatedCost: number;         // Estimated cost in USD
  fromDate?: string;             // Start date for statistics (ISO)
  statsGeneratedAt: string;      // ISO datetime when stats were generated
}
```

#### Example
```json
{
  "totalTokens": 5420,
  "totalMessages": 87,
  "estimatedCost": 0.1084,
  "fromDate": "2024-12-21T14:40:00Z",
  "statsGeneratedAt": "2025-01-20T14:40:00Z"
}
```

---

## Standard API Response Wrapper

All API responses use the standard wrapper format:

```typescript
interface ApiResponse<T> {
  success: boolean;              // Operation success status
  data?: T;                      // Response data (null for errors)
  message?: string;              // Human-readable status/error message
  errorCode?: string;            // Machine-readable error code
  errors?: string[];             // Detailed validation errors
  timestamp: string;             // ISO datetime of response
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "id": 789,
    "sessionName": "Round at Pebble Beach"
  },
  "message": "Chat session created successfully",
  "timestamp": "2025-01-20T14:30:00Z"
}
```

### Error Response Example
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    "Message content is required",
    "Message cannot exceed 2000 characters"
  ],
  "timestamp": "2025-01-20T14:30:00Z"
}
```

---

## Context Models

### GolfContext

Internal model representing complete golf context for AI conversations.

```typescript
interface GolfContext {
  user: UserGolfProfile;           // User's golf profile
  course?: CourseContext;          // Current course information
  round?: RoundContext;            // Current round status
  currentHole?: HoleContext;       // Current hole details
  location?: LocationContext;      // GPS location data
  weather?: WeatherContext;        // Weather conditions
  performance: PerformanceContext; // Performance metrics
  customData: Record<string, any>; // Additional context data
  generatedAt: string;             // ISO datetime of context generation
}
```

### UserGolfProfile

```typescript
interface UserGolfProfile {
  userId: number;                  // User ID
  name?: string;                   // Display name
  handicap?: number;               // Golf handicap
  skillLevel?: string;             // Skill level (beginner, intermediate, advanced)
  playingStyle?: string;           // Playing style (aggressive, conservative, etc.)
  preferredClubs?: string;         // Preferred club selection
  preferences?: Record<string, any>; // User preferences
}
```

### CourseContext

```typescript
interface CourseContext {
  courseId: number;                // Course ID
  name: string;                    // Course name
  description?: string;            // Course description
  location?: string;               // Geographic location
  totalHoles: number;              // Number of holes
  parTotal: number;                // Total par
  courseRating?: number;           // USGA course rating
  slopeRating?: number;            // USGA slope rating
  difficulty?: string;             // Difficulty description
  features?: Record<string, any>;  // Course features and amenities
}
```

### RoundContext

```typescript
interface RoundContext {
  roundId: number;                 // Round ID
  startTime: string;               // ISO datetime of round start
  currentHole?: number;            // Current hole number
  status?: string;                 // Round status
  elapsedTime?: string;            // Time elapsed (duration format)
  currentScore?: number;           // Current score
  pace?: number;                   // Pace of play
}
```

## Validation Rules

### Message Content
- **Length**: 1-2000 characters
- **Content**: All Unicode characters allowed
- **Encoding**: UTF-8
- **Trimming**: Leading/trailing whitespace removed

### Session Names
- **Length**: 1-100 characters
- **Optional**: Auto-generated if not provided
- **Format**: Free text, no special restrictions

### Token Limits
- **Per message**: 1000 tokens maximum (configurable)
- **Per minute**: 150,000 tokens per user
- **Context size**: Automatically managed to fit within limits

### Rate Limits
- **Messages per minute**: 60 per user
- **Concurrent sessions**: 10 per user maximum
- **Message history**: 50 messages per session in API responses

## Error Codes

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `MESSAGE_TOO_LONG`: Message exceeds length limit
- `MESSAGE_EMPTY`: Message content is empty
- `INVALID_SESSION_NAME`: Session name validation failed

### Business Logic Errors
- `SESSION_NOT_FOUND`: Chat session not found
- `ROUND_NOT_FOUND`: Referenced round not found
- `COURSE_NOT_FOUND`: Referenced course not found
- `UNAUTHORIZED_SESSION`: User cannot access session

### Rate Limiting
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `TOKEN_LIMIT_EXCEEDED`: Token usage limit exceeded
- `CONCURRENT_LIMIT_EXCEEDED`: Too many active sessions

### System Errors
- `OPENAI_ERROR`: OpenAI API error
- `CONTEXT_GENERATION_ERROR`: Failed to generate golf context
- `INTERNAL_ERROR`: General server error

## Related Documentation

- [Chat API Endpoints](../endpoints/chat-endpoints.md)
- [OpenAI Integration Feature](../../features/ai/openai-chatgpt-integration.md)
- [Authentication Models](../authentication/models.md)
- [Database Schema](../../features/database/schema.md)

---

*Last updated: 2025-01-20*