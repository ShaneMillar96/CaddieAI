# CaddieAI Playwright Testing Commands

## Overview

This directory contains Claude commands for automated UI and API testing using Playwright MCP for the CaddieAI mobile application.

## Available Commands

### @playwright-ui-test.md

**Purpose**: Comprehensive UI and API testing for CaddieAI React Native mobile app using Google Pixel emulator

**Usage Pattern**:
```
@playwright-ui-test.md "test description"
```

**Examples**:
- `@playwright-ui-test.md "test the active course screen functionality to ensure it is working as expected"`
- `@playwright-ui-test.md "verify login authentication flow"`
- `@playwright-ui-test.md "test round scoring and statistics"`
- `@playwright-ui-test.md "validate AI chat interface and voice recognition"`

## What the Command Does

When you reference `@playwright-ui-test.md` with a description, Claude will:

1. **Load the comprehensive testing prompt** with full context about:
   - CaddieAI app architecture and features
   - Testing methodology and best practices
   - Error detection patterns
   - Structured reporting format

2. **Execute targeted testing** based on your description:
   - Navigate through relevant UI screens
   - Test specific functionality
   - Monitor API calls and responses
   - Capture console errors and performance issues

3. **Provide detailed test reports** including:
   - ✅ Successful tests and working features
   - ❌ Issues discovered with reproduction steps
   - 🔍 Recommendations for improvements
   - Technical details (API calls, response times, console logs)

## Prerequisites

Before using the command, ensure:
- Google Pixel emulator is running
- CaddieAI backend API is accessible (localhost:5000)
- PostgreSQL database is running
- CaddieAI mobile app is installed on emulator

## Test Coverage Areas

The command can test any aspect of the CaddieAI app:

### Authentication & User Management
- Login/register flows
- Password reset functionality
- User profile management
- Session handling

### Course Management
- Course listing and search
- Course details and information
- Location services and GPS tracking
- Weather integration

### Golf Round Features
- Round creation and setup
- Live scoring and statistics
- Hole-by-hole tracking
- Round completion and history

### AI Features
- Chat interface and conversations
- Voice AI integration
- Club recommendations
- Contextual golf advice

### Performance & Integration
- API response times and reliability
- UI responsiveness and smooth navigation
- Error handling and recovery
- Cross-feature integration testing

## Example Usage Session

```
User: @playwright-ui-test.md "test the active course screen functionality to ensure it is working as expected"

Claude: [Loads comprehensive testing prompt and executes]
- Takes app snapshot
- Navigates to courses screen
- Tests course loading, search, and selection
- Monitors API calls to /api/courses/*
- Captures any errors or performance issues
- Provides detailed test report with findings
```

## Benefits

- **Comprehensive Testing**: Full coverage of UI, API, and integration testing
- **Standardized Process**: Consistent testing methodology across all features
- **Detailed Reporting**: Structured findings with actionable recommendations
- **Performance Monitoring**: Identifies slow responses and resource issues
- **Error Detection**: Captures console errors, network failures, and crashes
- **Documentation**: Automatic screenshot and log capture for issues

## Notes

- Each test session generates a comprehensive report
- Screenshots are automatically captured for any issues found
- API calls are monitored and validated for proper responses
- Console logs are reviewed for JavaScript errors
- Performance metrics are tracked and reported
- Recommendations are provided for any issues discovered

This command system enables thorough, automated testing of the CaddieAI mobile application with minimal setup and maximum insight into app functionality and performance.