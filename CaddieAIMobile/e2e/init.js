const detox = require('detox');
const config = require('../.detoxrc.js');

beforeAll(async () => {
  await detox.init(config, { initGlobals: false });
}, 300000);

beforeEach(async () => {
  await device.reloadReactNative();
});

afterAll(async () => {
  await detox.cleanup();
});

// Global helpers for console log monitoring
global.consoleLogs = [];

// Helper function to capture console logs via ADB
global.captureConsoleLogs = async (duration = 5000) => {
  const { execSync } = require('child_process');
  
  // Start logcat in background
  const logCommand = `adb logcat -v time | grep -E "(ReactNativeJS|CaddieAI|System.err)"`;
  
  return new Promise((resolve) => {
    const logProcess = require('child_process').spawn('sh', ['-c', logCommand]);
    const logs = [];
    
    logProcess.stdout.on('data', (data) => {
      logs.push(data.toString());
    });
    
    setTimeout(() => {
      logProcess.kill();
      resolve(logs.join(''));
    }, duration);
  });
};

// Helper function to monitor network requests
global.captureNetworkLogs = async (testFunction) => {
  const networkLogs = [];
  
  // Start ADB proxy to monitor network requests
  const startNetworkMonitoring = () => {
    // This would ideally integrate with React Native's network inspector
    console.log('📡 Starting network monitoring...');
  };
  
  const stopNetworkMonitoring = () => {
    console.log('📡 Stopping network monitoring...');
    return networkLogs;
  };
  
  startNetworkMonitoring();
  try {
    await testFunction();
  } finally {
    return stopNetworkMonitoring();
  }
};

// Helper function to take screenshot on test failure
global.takeScreenshotOnFailure = async (testName) => {
  try {
    const screenshot = await device.takeScreenshot(testName);
    console.log(`📸 Screenshot saved: ${screenshot}`);
    return screenshot;
  } catch (error) {
    console.error('Failed to take screenshot:', error);
  }
};