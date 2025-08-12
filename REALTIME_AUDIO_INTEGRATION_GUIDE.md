# Real-time Audio Integration Guide

## Overview

This guide documents the integration of OpenAI's Real-time Audio API into the CaddieAI mobile application, enabling voice conversations with an AI golf caddie.

## Architecture

### Backend Components

#### RealtimeAudioController.cs
- **Location**: `backend/src/caddie.portal.api/Controllers/RealtimeAudioController.cs`
- **Purpose**: WebSocket relay between React Native client and OpenAI Realtime API
- **Key Features**:
  - Secure authentication via JWT tokens
  - Round ownership validation
  - WebSocket message relay
  - Golf-specific AI configuration
  - Error handling and reconnection support

#### RealtimeAudioService.cs
- **Location**: `backend/src/caddie.portal.services/Services/RealtimeAudioService.cs`
- **Purpose**: Session management and business logic for real-time audio
- **Key Features**:
  - Session lifecycle management
  - Golf-optimized configuration
  - Usage statistics tracking
  - Rate limiting protection

### Frontend Components

#### VoiceChatModalV2.tsx
- **Location**: `CaddieAIMobile/src/components/voice/VoiceChatModalV2.tsx`
- **Purpose**: Main UI component for real-time voice chat
- **Features**:
  - Real-time audio visualization
  - Conversation history display
  - Connection status indicators
  - Voice activity detection
  - Error handling and reconnection

#### RealtimeAudioServiceV2.ts
- **Location**: `CaddieAIMobile/src/services/RealtimeAudioServiceV2.ts`
- **Purpose**: Client-side WebSocket and audio management
- **Features**:
  - WebSocket connection management
  - Audio recording coordination
  - Event-driven architecture
  - Automatic reconnection logic

#### Audio Recording Services
- **WebRTCAudioRecorder.ts**: Modern web-based audio recording
- **NativeAudioRecorder.ts**: React Native native audio recording fallback

## Configuration

### Environment Variables

#### Frontend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

#### Backend (appsettings.json)
```json
{
  "OpenAI": {
    "ApiKey": "your_openai_api_key_here",
    "Model": "gpt-4o-realtime-preview-2024-12-17",
    "MaxTokens": 150,
    "Temperature": 0.7
  }
}
```

### Golf-Specific AI Configuration

The AI is configured with golf caddie-specific instructions:
- Brief, encouraging responses (under 30 words)
- Professional caddie tone
- Club recommendations and strategic advice
- Voice optimized for natural conversation

## Security Features

### Authentication
- JWT token validation for WebSocket connections
- Round ownership verification
- User session management

### API Key Protection
- Environment variable storage
- Backend-only API key usage
- No client-side API key exposure

## Usage

### Accessing Voice Chat
1. Start an active golf round
2. Open Round Controls menu
3. Select "AI Voice Chat"
4. Grant microphone permissions
5. Begin conversation with AI caddie

### Voice Commands
- **"Hello"** - Start conversation
- **Distance questions** - "How far to the pin?"
- **Club selection** - "What club should I use?"
- **Course strategy** - "How should I play this hole?"

## Development Setup

### Prerequisites
- Node.js 18+
- .NET 9.0 SDK
- React Native development environment
- OpenAI API key with Realtime API access

### Installation
```bash
# Install frontend dependencies
cd CaddieAIMobile
npm install

# Install backend dependencies
cd ../backend
dotnet restore
```

### Environment Setup
1. Copy `.env.example` to `.env` in `CaddieAIMobile/`
2. Add your OpenAI API key to the `.env` file
3. Configure backend `appsettings.Development.json` with API settings

### Running the Application
```bash
# Start backend API
cd backend/src/caddie.portal.api
dotnet watch run

# Start React Native app
cd CaddieAIMobile
npm start
npm run android  # or npm run ios
```

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails
- Verify backend is running and accessible
- Check network security configuration (Android)
- Confirm JWT token is valid

#### Audio Recording Issues
- Grant microphone permissions
- Check device audio capabilities
- Verify audio recorder initialization

#### API Key Errors
- Confirm OpenAI API key is valid
- Ensure Realtime API access is enabled
- Check environment variable configuration

### Debug Logging
Enable detailed logging by setting:
```javascript
// In RealtimeAudioServiceV2.ts
console.log('Debug mode enabled');
```

## Performance Considerations

### Audio Quality
- 16kHz PCM16 format for optimal quality/bandwidth balance
- Real-time streaming with 100ms chunks
- Voice Activity Detection to reduce bandwidth

### Connection Management
- Automatic reconnection with exponential backoff
- Session cleanup on disconnect
- Maximum 2-hour session duration

## Future Enhancements

### Planned Features
- Audio playback of AI responses
- Voice command shortcuts
- Session history and replay
- Advanced audio processing

### Integration Opportunities
- Club recommendation system integration
- Shot placement voice commands
- Course strategy voice guidance
- Real-time coaching feedback

## Support

For technical issues or questions about the real-time audio integration:
1. Check console logs for error details
2. Verify environment configuration
3. Test with simplified audio setup
4. Review OpenAI API documentation

## API References

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [React Native Audio Recording](https://github.com/mmazzarolo/react-native-audio-record)
- [WebRTC Audio Processing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)