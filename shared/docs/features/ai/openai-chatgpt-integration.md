# OpenAI ChatGPT Integration

> **Feature ID**: ECS-29  
> **Version**: 1.0.0  
> **Status**: ✅ Implemented  
> **Last Updated**: 2025-01-20

## Overview

The OpenAI ChatGPT Integration provides intelligent conversational AI capabilities to the CaddieAI application, acting as a virtual golf caddie that can provide personalized advice, course insights, and engaging conversation during golf rounds.

## Features

### Core Capabilities
- **GPT-4o Integration**: High-quality AI responses using OpenAI's latest model
- **Golf-Specific Context**: AI understands current course, round status, and user profile
- **Multiple Personalities**: Different caddie styles (Encouraging, Professional, Beginner-friendly, Advanced)
- **Situational Awareness**: AI adapts to pressure situations, struggling rounds, or excellent play
- **Club Recommendations**: Distance-based suggestions with confidence scoring
- **Rate Limiting**: Per-user request limits to prevent API abuse
- **Token Tracking**: Usage monitoring and cost estimation

### AI Personalities

#### 1. Encouraging Caddie (Default)
- Positive, supportive tone
- Celebrates good shots, provides comfort during difficult moments
- Focuses on enjoyment and confidence building
- Suitable for recreational golfers

#### 2. Professional Caddie
- Data-driven, analytical approach
- Tournament-level strategic thinking
- Precise recommendations with detailed reasoning
- Ideal for competitive players

#### 3. Beginner-Friendly
- Simple language and explanations
- Patient instruction and encouragement
- Focus on fundamentals and etiquette
- Perfect for new golfers

#### 4. Advanced Player
- Complex strategy discussions
- Detailed shot shaping recommendations
- Risk/reward analysis
- For skilled golfers seeking optimization

## Technical Architecture

### Components

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Chat Controller   │───▶│   IOpenAIService    │───▶│  OpenAI GPT-4o API │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           
           ▼                           ▼                           
┌─────────────────────┐    ┌─────────────────────┐                
│    Chat DTOs        │    │ IGolfContextService │                
└─────────────────────┘    └─────────────────────┘                
           │                           │                           
           ▼                           ▼                           
┌─────────────────────┐    ┌─────────────────────┐                
│  AutoMapper Profile │    │   System Prompts    │                
└─────────────────────┘    └─────────────────────┘                
           │                           │                           
           ▼                           ▼                           
┌─────────────────────┐    ┌─────────────────────┐                
│  Chat Repositories  │    │   Golf Context      │                
└─────────────────────┘    └─────────────────────┘                
```

### Database Schema

The integration uses existing database models:

- **ChatSession**: Stores conversation sessions with AI configuration
- **ChatMessage**: Individual messages with token tracking
- **User**: Golf profile and preferences for personalization
- **Course**: Course information for context
- **Round**: Current round status for situational awareness

### Service Layer

#### IOpenAIService
Core service for OpenAI integration:
- Session management
- Message processing
- Rate limiting
- Usage tracking

#### IGolfContextService  
Golf-specific context generation:
- User profile compilation
- Course information gathering
- Round status analysis
- Weather integration (planned)

## API Endpoints

### Chat Session Management

#### Start New Chat Session
```http
POST /api/chat/sessions
Content-Type: application/json

{
  "roundId": 123,
  "courseId": 456,
  "sessionName": "Round at Pebble Beach"
}
```

#### Send Message
```http
POST /api/chat/sessions/{sessionId}/messages
Content-Type: application/json

{
  "message": "What club should I use for this 150-yard shot?"
}
```

#### Get Session History
```http
GET /api/chat/sessions/{sessionId}
```

#### List User Sessions
```http
GET /api/chat/sessions?includeMessages=false
```

#### Get Usage Statistics
```http
GET /api/chat/usage?days=30
```

See [Chat API Endpoints](../../api/endpoints/chat-endpoints.md) for complete documentation.

## Configuration

### OpenAI Settings (appsettings.json)
```json
{
  "OpenAISettings": {
    "ApiKey": "your-openai-api-key",
    "Model": "gpt-4o",
    "BaseUrl": "https://api.openai.com/v1",
    "MaxTokens": 1000,
    "Temperature": 0.7,
    "MaxRequestsPerMinute": 60,
    "MaxTokensPerMinute": 150000,
    "TimeoutSeconds": 30,
    "MaxRetries": 3
  }
}
```

### Rate Limiting
- **Requests per minute**: 60 (configurable)
- **Tokens per minute**: 150,000 (configurable)
- **Per-user tracking**: Prevents individual abuse
- **Graceful degradation**: Clear error messages when limits exceeded

### Cost Management
- **Token usage tracking**: All requests logged with token counts
- **Usage statistics**: Per-user consumption reports
- **Cost estimation**: Approximate pricing calculations
- **Configurable limits**: Adjustable per environment

## Context Generation

### Golf Context Components

#### User Profile
```json
{
  "userId": 123,
  "name": "John Doe",
  "handicap": 15.2,
  "skillLevel": "intermediate",
  "playingStyle": "conservative",
  "preferences": {
    "preferredClubs": ["driver", "7-iron", "sand-wedge"],
    "gameGoals": ["consistency", "lower-scores"]
  }
}
```

#### Course Context
```json
{
  "courseId": 456,
  "name": "Pebble Beach Golf Links",
  "location": "Pebble Beach, CA, USA",
  "totalHoles": 18,
  "parTotal": 72,
  "difficulty": "Very Challenging",
  "features": {
    "oceanViews": true,
    "windyConditions": true,
    "firmGreens": true
  }
}
```

#### Round Context
```json
{
  "roundId": 789,
  "startTime": "2025-01-20T09:00:00Z",
  "currentHole": 7,
  "status": "in_progress",
  "elapsedTime": "02:15:00",
  "performance": {
    "currentScore": 42,
    "relativeToPar": 6
  }
}
```

## Security & Privacy

### API Key Management
- **Environment variables**: API keys stored securely
- **No logging**: API keys never logged or exposed
- **Rotation support**: Easy key rotation process

### Data Privacy
- **User consent**: Clear terms for AI interaction
- **Data retention**: Configurable message retention periods
- **Anonymization**: Option to anonymize chat data
- **GDPR compliance**: User data deletion capabilities

### Rate Limiting
- **DDoS protection**: Prevents API abuse
- **Fair usage**: Ensures service availability for all users
- **Graceful degradation**: Meaningful error messages

## Error Handling

### Common Scenarios
- **API key invalid**: Clear configuration instructions
- **Rate limit exceeded**: Helpful retry guidance
- **Network timeouts**: Automatic retry with backoff
- **Invalid requests**: Detailed validation errors
- **Service unavailable**: Fallback messaging

### Logging
- **Structured logging**: JSON format with correlation IDs
- **Error tracking**: Full exception details
- **Performance metrics**: Response times and token usage
- **Security auditing**: Authentication and authorization events

## Testing

### Unit Tests
- **Service layer**: 95% code coverage
- **Context generation**: All scenarios tested
- **Rate limiting**: Edge cases covered
- **Error handling**: Exception paths verified

### Integration Tests
- **API endpoints**: Full request/response cycle
- **Database operations**: CRUD operations tested
- **OpenAI integration**: Mock API responses
- **Authentication**: JWT token validation

### Test Data
- **Mock conversations**: Realistic golf scenarios
- **Edge cases**: Error conditions and limits
- **Performance tests**: Load testing with concurrent users

## Performance

### Optimization Strategies
- **Context caching**: Reduce repeated context generation
- **Message batching**: Efficient database operations
- **Connection pooling**: HTTP client reuse
- **Response streaming**: Real-time message delivery

### Metrics
- **Response time**: Target <2 seconds for typical responses
- **Token efficiency**: Optimize context size vs. quality
- **Database queries**: Minimize N+1 query problems
- **Memory usage**: Efficient object lifecycle management

## Deployment

### Environment Configuration
```bash
# Required environment variables
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000
```

### Health Checks
- **API connectivity**: Verify OpenAI service availability
- **Database health**: Check chat repositories
- **Rate limiting**: Validate counter services
- **Configuration**: Ensure all settings present

### Monitoring
- **Token usage**: Track API costs
- **Response times**: Performance monitoring
- **Error rates**: Service reliability
- **User satisfaction**: Conversation quality metrics

## Future Enhancements

### Planned Features (v1.1)
- **Voice integration**: Speech-to-text and text-to-speech
- **Image analysis**: Course condition assessment via camera
- **Weather integration**: Real-time condition adjustments
- **Multi-language**: International user support

### Advanced Capabilities (v2.0)
- **Fine-tuned models**: Golf-specific training data
- **Personalized learning**: AI adapts to individual preferences
- **Group conversations**: Multiple player interactions
- **Tournament mode**: Competition-specific features

## Troubleshooting

### Common Issues

#### "Rate limit exceeded" errors
- Check `MaxRequestsPerMinute` configuration
- Verify user-specific rate limiting
- Consider upgrading OpenAI plan

#### Poor AI responses
- Review system prompt configuration
- Check context data quality
- Verify user profile completeness

#### High token usage
- Optimize context size
- Adjust `MaxTokens` setting
- Review conversation history limits

### Debug Tools
- **Context inspector**: View generated context data
- **Token calculator**: Estimate usage before requests
- **Response analyzer**: Quality metrics and feedback

## Related Documentation

- [Chat API Endpoints](../../api/endpoints/chat-endpoints.md)
- [Chat Models](../../api/models/chat-models.md)
- [Database Schema](../database/schema.md)
- [Authentication Guide](../../api/authentication/README.md)
- [Development Setup](../../development/setup.md)

## Change Log

### v1.0.0 (2025-01-20)
- ✅ Initial implementation with GPT-4o
- ✅ Golf context generation
- ✅ Multiple AI personalities
- ✅ Rate limiting and cost management
- ✅ RESTful API endpoints
- ✅ Comprehensive error handling
- ✅ Database integration with existing models

---

*Built with ❤️ for the CaddieAI golf community*