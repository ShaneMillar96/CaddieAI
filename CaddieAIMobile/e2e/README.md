# CaddieAI Mobile - Detox E2E Testing Setup

This directory contains the end-to-end testing setup using Detox framework for the CaddieAI React Native mobile application.

## Prerequisites

1. **Android Emulator**: Ensure you have an Android emulator running (preferably Pixel_7_Pro_API_33)
2. **ADB**: Android Debug Bridge must be available in your PATH
3. **Node.js**: Version 18 or higher
4. **Dependencies**: All npm dependencies installed

## Installation

```bash
# Install dependencies (from CaddieAIMobile directory)
npm install

# Install Detox CLI globally (optional but recommended)
npm install -g detox-cli
```

## Configuration

The testing setup includes:

- **`.detoxrc.js`**: Main Detox configuration file
- **`e2e/jest.config.js`**: Jest configuration for E2E tests
- **`e2e/init.js`**: Global setup and helper functions
- **`e2e/helpers/adbHelpers.js`**: ADB integration utilities

## Running Tests

### Quick Commands

```bash
# Build app for testing (debug mode)
npm run e2e:build:android

# Run all E2E tests (debug mode)
npm run e2e:test:android

# Build and test release version
npm run e2e:build:android:release
npm run e2e:test:android:release
```

### Detailed Commands

```bash
# Build the app with Detox configuration
detox build --configuration android.emu.debug

# Run specific test file
detox test --configuration android.emu.debug e2e/firstTest.test.js

# Run tests with additional logging
detox test --configuration android.emu.debug --verbose

# Run tests and capture screenshots on failure
detox test --configuration android.emu.debug --take-screenshots=failing
```

## Test Features

### Console Log Monitoring

The testing setup includes real-time console log monitoring using ADB:

```javascript
// Capture console logs during test execution
const consoleLogs = await ADBHelper.captureConsoleLogs(10000, [
  'ReactNativeJS',
  'CaddieAI', 
  'ERROR',
  'WARN'
]);
```

### Network Request Monitoring

Monitor API calls and network requests during tests:

```javascript
// Capture network activity during specific actions
const networkLogs = await captureNetworkLogs(async () => {
  await element(by.id('api-button')).tap();
});
```

### Automated Screenshots

Screenshots are automatically captured:

- Before and after each test
- On test failures
- Manually when needed

### Memory Usage Monitoring

Track app memory consumption during tests:

```javascript
const memoryUsage = ADBHelper.getMemoryUsage();
console.log('Memory usage:', memoryUsage, 'KB');
```

## Test Structure

### Basic Test Example

```javascript
describe('Feature Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Setup monitoring
  });

  it('should test specific feature', async () => {
    // Start log monitoring
    const logPromise = ADBHelper.captureConsoleLogs(5000);
    
    // Perform UI interactions
    await waitFor(element(by.id('my-element'))).toBeVisible();
    await element(by.id('my-button')).tap();
    
    // Analyze results
    const logs = await logPromise;
    expect(logs.filter(l => l.includes('ERROR'))).toHaveLength(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **Emulator Not Detected**
   ```bash
   # Check if emulator is running
   adb devices
   
   # Expected output should show device/emulator
   ```

2. **App Build Issues**
   ```bash
   # Clean and rebuild
   cd android && ./gradlew clean
   detox build --configuration android.emu.debug
   ```

3. **ADB Permission Issues**
   ```bash
   # Restart ADB server
   adb kill-server
   adb start-server
   ```

4. **Test Timeouts**
   - Increase timeout values in jest.config.js
   - Ensure emulator is not running slowly
   - Check if Metro bundler is running

### Debug Mode

Enable verbose logging for debugging:

```bash
# Run tests with maximum verbosity
detox test --configuration android.emu.debug --verbose --loglevel trace
```

## Directory Structure

```
e2e/
├── README.md                 # This file
├── jest.config.js           # Jest configuration for E2E tests
├── init.js                  # Global setup and teardown
├── helpers/
│   └── adbHelpers.js        # ADB integration utilities
├── screenshots/             # Test screenshots
└── firstTest.test.js        # Sample test file
```

## Integration with QA-Tester Agent

The updated `qa-tester.md` agent is now configured to use this Detox setup instead of Playwright. The agent can:

- Run automated UI tests
- Monitor console logs in real-time
- Capture network requests
- Generate detailed test reports
- Take screenshots on failures
- Analyze app performance

## Best Practices

1. **Element Identification**: Use `testID` props in React Native components for reliable element selection
2. **Wait Strategies**: Always use `waitFor()` for elements that may load asynchronously
3. **Log Analysis**: Monitor console logs for JavaScript errors and warnings
4. **Performance**: Check memory usage for potential memory leaks
5. **Screenshots**: Capture screenshots for debugging failed tests
6. **Clean State**: Reload React Native bundle between tests for consistent state

## Next Steps

1. Add more specific test files for different app features
2. Implement visual regression testing
3. Add API response validation
4. Create custom matchers for golf-specific functionality
5. Integrate with CI/CD pipeline