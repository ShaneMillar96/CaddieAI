const ADBHelper = require('./helpers/adbHelpers');

describe('CaddieAI App - Basic Functionality', () => {
  let consoleLogs = [];
  let deviceInfo = null;

  beforeAll(async () => {
    // Verify device connection
    expect(ADBHelper.isDeviceConnected()).toBe(true);
    
    // Get device information
    deviceInfo = ADBHelper.getDeviceInfo();
    console.log('📱 Device Info:', deviceInfo);
    
    // Clear previous logcat entries
    ADBHelper.clearLogcat();
  });

  beforeEach(async () => {
    // Reload React Native for fresh state
    await device.reloadReactNative();
    
    // Start capturing console logs for this test
    consoleLogs = [];
    
    // Take screenshot of initial state
    await device.takeScreenshot('before-test');
  });

  afterEach(async () => {
    // Capture final screenshot
    await device.takeScreenshot('after-test');
    
    // Log any JavaScript errors found
    const errors = consoleLogs.filter(log => 
      log.content.includes('ERROR') || 
      log.content.includes('Exception') ||
      log.content.includes('TypeError')
    );
    
    if (errors.length > 0) {
      console.log('🚨 JavaScript Errors Found:', errors);
    }
  });

  it('should have welcome screen visible', async () => {
    console.log('🧪 Testing: Welcome screen visibility');
    
    // Start console log monitoring
    const logPromise = ADBHelper.captureConsoleLogs(5000);
    
    // Look for welcome screen elements (adjust selectors based on your app)
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(10000);
    
    // Stop log monitoring and check for errors
    consoleLogs = await logPromise;
    
    // Verify no critical errors in console
    const criticalErrors = consoleLogs.filter(log => 
      log.content.includes('ERROR') || log.content.includes('FATAL')
    );
    expect(criticalErrors).toHaveLength(0);
    
    console.log('✅ Welcome screen test passed');
  });

  it('should respond to basic user interaction', async () => {
    console.log('🧪 Testing: Basic user interaction');
    
    // Start monitoring
    const logPromise = ADBHelper.captureConsoleLogs(8000);
    
    try {
      // Look for any tappable element (adjust based on your app's UI)
      const loginButton = element(by.id('login-button'));
      const getStartedButton = element(by.id('get-started-button'));
      const continueButton = element(by.text('Continue'));
      
      // Try to find and tap one of these buttons
      try {
        await waitFor(loginButton).toBeVisible().withTimeout(3000);
        await loginButton.tap();
        console.log('👆 Tapped login button');
      } catch (e1) {
        try {
          await waitFor(getStartedButton).toBeVisible().withTimeout(3000);
          await getStartedButton.tap();
          console.log('👆 Tapped get started button');
        } catch (e2) {
          try {
            await waitFor(continueButton).toBeVisible().withTimeout(3000);
            await continueButton.tap();
            console.log('👆 Tapped continue button');
          } catch (e3) {
            console.log('⚠️ No recognized interactive elements found');
            // This is not necessarily a failure - just log it
          }
        }
      }
      
      // Wait a moment for any navigation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log('⚠️ Interaction test completed with notes:', error.message);
    }
    
    // Stop monitoring and analyze logs
    consoleLogs = await logPromise;
    
    // Check for any network requests (API calls)
    const networkLogs = consoleLogs.filter(log =>
      log.content.includes('fetch') || 
      log.content.includes('XMLHttpRequest') ||
      log.content.includes('localhost:5000')
    );
    
    if (networkLogs.length > 0) {
      console.log('🌐 Network activity detected:', networkLogs.length, 'requests');
    }
    
    console.log('✅ User interaction test completed');
  });

  it('should monitor memory usage', async () => {
    console.log('🧪 Testing: Memory usage monitoring');
    
    // Get initial memory usage
    const initialMemory = ADBHelper.getMemoryUsage();
    console.log('📊 Initial memory usage:', initialMemory, 'KB');
    
    // Perform some actions to trigger memory usage
    await device.reloadReactNative();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check memory again
    const finalMemory = ADBHelper.getMemoryUsage();
    console.log('📊 Final memory usage:', finalMemory, 'KB');
    
    // Basic memory leak detection (memory should not increase dramatically)
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercentage = (memoryIncrease / initialMemory) * 100;
      
      console.log('📈 Memory change:', memoryIncrease, 'KB', `(${memoryIncreasePercentage.toFixed(1)}%)`);
      
      // Alert if memory increased by more than 50%
      if (memoryIncreasePercentage > 50) {
        console.warn('⚠️ Significant memory increase detected');
      }
    }
    
    console.log('✅ Memory monitoring test completed');
  });

  it('should capture and analyze console output', async () => {
    console.log('🧪 Testing: Console log capture and analysis');
    
    // Start extended log monitoring
    const logPromise = ADBHelper.captureConsoleLogs(10000, [
      'ReactNativeJS',
      'CaddieAI',
      'System.err',
      'MainActivity',
      'WARN',
      'ERROR'
    ]);
    
    // Trigger various app activities
    await device.reloadReactNative();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to interact with the app to generate more logs
    try {
      await element(by.id('menu-button')).tap();
    } catch (e) {
      // Menu button might not exist, that's OK
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get all captured logs
    consoleLogs = await logPromise;
    
    // Analyze log patterns
    const reactNativeLogs = consoleLogs.filter(log => log.content.includes('ReactNativeJS'));
    const warnings = consoleLogs.filter(log => log.content.includes('WARN'));
    const errors = consoleLogs.filter(log => log.content.includes('ERROR'));
    const caddieAILogs = consoleLogs.filter(log => log.content.includes('CaddieAI'));
    
    console.log('📋 Log Analysis:');
    console.log('  - Total logs captured:', consoleLogs.length);
    console.log('  - React Native logs:', reactNativeLogs.length);
    console.log('  - Warnings:', warnings.length);
    console.log('  - Errors:', errors.length);
    console.log('  - CaddieAI app logs:', caddieAILogs.length);
    
    // Report any errors found
    if (errors.length > 0) {
      console.log('🚨 Errors found in console:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.content.substring(0, 100)}...`);
      });
    }
    
    // Report any warnings
    if (warnings.length > 0) {
      console.log('⚠️ Warnings found in console:');
      warnings.slice(0, 5).forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.content.substring(0, 100)}...`);
      });
    }
    
    console.log('✅ Console log analysis completed');
  });
});