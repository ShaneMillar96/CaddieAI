# OpenAI API Setup Guide

## Overview
The CaddieAI application now includes improved OpenAI quota management, error handling, and cost optimization features.

## Configuration Changes Made

### 1. Optimized Settings
- **Model**: Changed from `gpt-4o` to `gpt-4o-mini` for cost efficiency
- **MaxTokens**: Reduced from 1000 to 500 for better cost control
- **Fallback Responses**: Enabled fallback responses when OpenAI is unavailable

### 2. Error Handling
- Added specific handling for HTTP 429 (quota exceeded) errors
- Implemented retry logic with exponential backoff for network issues
- Created fallback responses for voice AI when quota is exceeded

### 3. Security Enhancement
- API key now loaded from environment variable for security
- Configuration supports both environment variable and appsettings.json

## Setup Instructions

### Setting the OpenAI API Key

#### Option 1: Environment Variable (Recommended)
```bash
# Linux/macOS
export OPENAI_API_KEY="your-openai-api-key-here"

# Windows Command Prompt
set OPENAI_API_KEY=your-openai-api-key-here

# Windows PowerShell
$env:OPENAI_API_KEY="your-openai-api-key-here"
```

#### Option 2: appsettings.json (Development Only)
Update the `ApiKey` field in `backend/src/caddie.portal.api/appsettings.json`:
```json
{
  "OpenAISettings": {
    "ApiKey": "your-openai-api-key-here"
  }
}
```

### Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Set up billing with appropriate limits

### Recommended OpenAI Account Setup

For cost control and quota management:

1. **Set Usage Limits**:
   - Set a monthly spending limit (e.g., $50/month)
   - Enable email notifications at 75% and 90% of limit

2. **Monitor Usage**:
   - Check usage regularly at https://platform.openai.com/usage
   - Review the Usage Statistics endpoint in the API

3. **Billing**:
   - Start with pay-as-you-go pricing
   - Consider prepaid credits for predictable costs

## Error Handling Features

### Quota Exceeded (HTTP 429)
When OpenAI quota is exceeded:
- Voice AI returns helpful fallback advice
- Chat messages get contextual fallback responses
- Hole completion uses default encouraging commentary
- Users receive clear error messages with retry information

### Network Issues
- Automatic retry with exponential backoff (1s, 2s, 4s delays)
- Retries for timeouts and network errors (502, 503, 504)
- No retries for quota issues to avoid additional charges

### Cost Optimization
- Using `gpt-4o-mini` model (90% cheaper than GPT-4)
- Reduced token limits for voice responses (150 tokens max)
- Conversation history limited to recent 6 messages for voice AI
- Default responses when AI is unavailable

## Testing the Setup

1. **Start the application**:
   ```bash
   cd backend/src/caddie.portal.api
   dotnet run
   ```

2. **Check the logs** for:
   - "OpenAI API key not configured" errors (if not set properly)
   - Successful OpenAI client initialization

3. **Test voice AI endpoints**:
   - `/api/voiceai/golf-conversation` - Should work with valid API key
   - Should return fallback responses when quota exceeded

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure OPENAI_API_KEY environment variable is set
   - Restart the application after setting the variable

2. **"insufficient_quota" errors**
   - Check your OpenAI account billing and usage
   - Add payment method or increase usage limits
   - Fallback responses will be used automatically

3. **High token usage**
   - Monitor usage at https://platform.openai.com/usage
   - Adjust conversation history limits if needed
   - Consider reducing MaxTokens further

### Environment Variable Verification

```bash
# Check if environment variable is set
echo $OPENAI_API_KEY  # Linux/macOS
echo %OPENAI_API_KEY%  # Windows CMD
echo $env:OPENAI_API_KEY  # Windows PowerShell
```

## Cost Estimates

With current optimizations:
- **gpt-4o-mini**: ~$0.00015 per 1K input tokens, ~$0.0006 per 1K output tokens
- **Voice response** (150 tokens): ~$0.0001 per response
- **Chat message** (500 tokens): ~$0.0003 per response
- **Daily estimate** (100 interactions): ~$0.02-0.04

## Support

If you continue to experience issues:
1. Check OpenAI API status at https://status.openai.com
2. Verify your API key has sufficient credits
3. Review application logs for specific error messages
4. Test with a fresh API key if needed