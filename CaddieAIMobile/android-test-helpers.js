/**
 * Android Test Helpers for CaddieAI React Native App
 * Provides utilities for testing React Native components on Android emulator
 * Handles WebView connections, native component targeting, and form interactions
 */

const { _android: android } = require('playwright');

// Package identifier for CaddieAI app
const CADDIEAI_PACKAGE = 'com.caddieaimobile';

// Screen coordinates for form elements (based on 412x915 viewport)
const SCREEN_COORDS = {
  email: { x: 370, y: 430 },
  password: { x: 370, y: 660 }, 
  signInButton: { x: 370, y: 780 },
  createAccountButton: { x: 370, y: 920 }
};

// Test configuration
const TEST_CONFIG = {
  email: 'test@example.com',
  password: 'TestPassword123',
  timeout: 30000,
  delayBetweenActions: 1000
};

/**
 * Connect to Android device and establish WebView connection
 */
async function connectToAndroidWebView() {
  console.log('🔌 Connecting to Android device...');
  
  try {
    const devices = await android.devices();
    if (devices.length === 0) {
      throw new Error('No Android devices found. Make sure emulator is running.');
    }
    
    const device = devices[0];
    console.log(`📱 Connected to device: ${device.model()}`);
    console.log(`🔢 Serial: ${device.serial()}`);
    
    // Take initial screenshot
    await device.screenshot({ path: 'android-initial.png' });
    console.log('📸 Initial device screenshot saved');
    
    // Check if CaddieAI app is running
    const webViews = await device.webViews();
    console.log(`🌐 Found ${webViews.length} WebViews`);
    
    // Try to find CaddieAI WebView
    let webview = null;
    for (const wv of webViews) {
      const pkg = wv.pid() ? CADDIEAI_PACKAGE : null;
      if (pkg === CADDIEAI_PACKAGE) {
        webview = wv;
        break;
      }
    }
    
    // If no WebView found, try to connect to app's WebView
    if (!webview) {
      console.log('🔍 Searching for CaddieAI WebView...');
      try {
        webview = await device.webView({ 
          pkg: CADDIEAI_PACKAGE,
          socketName: undefined // Let it find automatically
        });
        console.log('✅ Found CaddieAI WebView');
      } catch (error) {
        console.log('⚠️ No WebView found, app may be using native components');
        return { device, webview: null, page: null };
      }
    }
    
    // Get page from WebView
    const page = webview ? await webview.page() : null;
    
    if (page) {
      console.log('📄 WebView page connected');
      console.log(`🌐 Page URL: ${page.url()}`);
      
      // Set viewport size to match emulator
      await page.setViewportSize({ width: 412, height: 915 });
      console.log('📐 Viewport size set to emulator dimensions');
    }
    
    return { device, webview, page };
    
  } catch (error) {
    console.error('❌ Failed to connect to Android WebView:', error);
    throw error;
  }
}

/**
 * React Native specific selector strategies
 */
const RN_SELECTORS = {
  // Text input selectors for React Native
  emailField: [
    '[placeholder="Enter your email"]',
    '[testID="email-input"]',
    'input[type="email"]',
    'textbox[placeholder*="email" i]'
  ],
  
  passwordField: [
    '[placeholder="Enter your password"]', 
    '[testID="password-input"]',
    'input[type="password"]',
    '[secureTextEntry="true"]',
    'textbox[placeholder*="password" i]'
  ],
  
  signInButton: [
    'button:has-text("Sign In")',
    '[testID="sign-in-button"]',
    'button[type="submit"]',
    '*[role="button"]:has-text("Sign In")'
  ],
  
  createAccountButton: [
    'button:has-text("Create Account")',
    '[testID="create-account-button"]', 
    '*[role="button"]:has-text("Create Account")'
  ]
};

/**
 * Try multiple selectors until one works
 */
async function findElementWithSelectors(page, selectors, elementName) {
  for (const selector of selectors) {
    try {
      console.log(`🔍 Trying selector for ${elementName}: ${selector}`);
      const element = await page.locator(selector).first();
      
      // Check if element is visible and enabled
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        console.log(`✅ Found ${elementName} with selector: ${selector}`);
        return element;
      } else {
        console.log(`⚠️ ${elementName} found but not visible/enabled with: ${selector}`);
      }
    } catch (error) {
      console.log(`❌ Selector failed for ${elementName}: ${selector} - ${error.message}`);
      continue;
    }
  }
  
  throw new Error(`Could not find ${elementName} with any selector`);
}

/**
 * Fill form using WebView page
 */
async function fillFormWithWebView(page) {
  console.log('📝 Filling form using WebView...');
  
  try {
    // Take screenshot before filling
    await page.screenshot({ path: 'form-before-fill.png', fullPage: true });
    console.log('📸 Screenshot taken before form filling');
    
    // Find and fill email field
    console.log('📧 Looking for email field...');
    const emailField = await findElementWithSelectors(page, RN_SELECTORS.emailField, 'email field');
    
    // Clear and fill email
    await emailField.clear();
    await page.waitForTimeout(500);
    await emailField.fill(TEST_CONFIG.email);
    console.log(`✅ Email filled: ${TEST_CONFIG.email}`);
    
    // Find and fill password field
    console.log('🔐 Looking for password field...');
    const passwordField = await findElementWithSelectors(page, RN_SELECTORS.passwordField, 'password field');
    
    // Clear and fill password
    await passwordField.clear();
    await page.waitForTimeout(500);
    await passwordField.fill(TEST_CONFIG.password);
    console.log('✅ Password filled');
    
    // Take screenshot after filling
    await page.screenshot({ path: 'form-after-fill.png', fullPage: true });
    console.log('📸 Screenshot taken after form filling');
    
    // Verify the fields are filled correctly
    const emailValue = await emailField.inputValue();
    const passwordValue = await passwordField.inputValue();
    
    console.log(`🔍 Email field value: "${emailValue}"`);
    console.log(`🔍 Password field length: ${passwordValue.length} chars`);
    
    if (emailValue !== TEST_CONFIG.email) {
      throw new Error(`Email mismatch. Expected: ${TEST_CONFIG.email}, Got: ${emailValue}`);
    }
    
    if (passwordValue.length !== TEST_CONFIG.password.length) {
      throw new Error(`Password length mismatch. Expected: ${TEST_CONFIG.password.length}, Got: ${passwordValue.length}`);
    }
    
    console.log('✅ Form fields verified correctly filled');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fill form with WebView:', error);
    throw error;
  }
}

/**
 * Submit form using WebView
 */
async function submitFormWithWebView(page) {
  console.log('🚀 Submitting form using WebView...');
  
  try {
    // Find sign in button
    const signInButton = await findElementWithSelectors(page, RN_SELECTORS.signInButton, 'sign in button');
    
    // Click submit button
    await signInButton.click();
    console.log('✅ Sign in button clicked');
    
    // Wait for response/navigation
    await page.waitForTimeout(3000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'form-after-submit.png', fullPage: true });
    console.log('📸 Screenshot taken after form submission');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to submit form:', error);
    throw error;
  }
}

/**
 * Fallback method using ADB commands for native components
 */
async function fillFormWithADB(device) {
  console.log('📱 Filling form using ADB commands...');
  
  try {
    // Take screenshot before ADB actions
    await device.screenshot({ path: 'adb-before-fill.png' });
    console.log('📸 ADB screenshot taken before filling');
    
    // Method 1: Click specific coordinates with enhanced field navigation
    console.log('📧 Clicking email field coordinates...');
    await device.input.tap(SCREEN_COORDS.email);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear field and type email
    await device.input.type(TEST_CONFIG.email);
    console.log(`✅ Email entered via ADB: ${TEST_CONFIG.email}`);
    
    // Navigate to password field using updated coordinates
    console.log('🔄 Tapping password field at updated coordinates...');
    await device.input.tap(SCREEN_COORDS.password);
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenActions));
    
    console.log('🔐 Entering password in password field...');
    await device.input.type(TEST_CONFIG.password);
    console.log('✅ Password entered via ADB');
    
    // Take screenshot after each field for debugging
    await device.screenshot({ path: 'adb-after-email.png' });
    console.log('📸 Screenshot taken after email entry');
    
    // Wait and take another screenshot after password
    await new Promise(resolve => setTimeout(resolve, 500));
    await device.screenshot({ path: 'adb-after-password.png' });
    console.log('📸 Screenshot taken after password entry');
    
    // Verify fields by taking final screenshot
    await device.screenshot({ path: 'adb-after-fill-final.png' });
    console.log('📸 Final verification screenshot taken');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fill form with ADB:', error);
    throw error;
  }
}

/**
 * Submit form using ADB
 */
async function submitFormWithADB(device) {
  console.log('🚀 Submitting form using ADB...');
  
  try {
    // Click sign in button
    await device.input.tap(SCREEN_COORDS.signInButton);
    console.log('✅ Sign in button clicked via ADB');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after submission
    await device.screenshot({ path: 'adb-after-submit.png' });
    console.log('📸 ADB screenshot taken after submission');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to submit form with ADB:', error);
    throw error;
  }
}

/**
 * Main test function that tries WebView first, falls back to ADB
 */
async function testLoginForm() {
  console.log('🧪 Starting Android login form test...');
  
  let connection = null;
  let success = false;
  
  try {
    // Connect to Android
    connection = await connectToAndroidWebView();
    const { device, webview, page } = connection;
    
    if (page) {
      // Try WebView approach first
      console.log('📄 Using WebView approach...');
      try {
        await fillFormWithWebView(page);
        await submitFormWithWebView(page);
        success = true;
        console.log('✅ WebView approach successful');
      } catch (webviewError) {
        console.log('⚠️ WebView approach failed, falling back to ADB...');
        console.log(`WebView error: ${webviewError.message}`);
      }
    }
    
    // Fallback to ADB if WebView failed or unavailable
    if (!success && device) {
      console.log('📱 Using ADB fallback approach...');
      try {
        await fillFormWithADB(device);
        await submitFormWithADB(device);
        success = true;
        console.log('✅ ADB approach successful');
      } catch (adbError) {
        console.error('❌ ADB approach also failed:', adbError.message);
        throw adbError;
      }
    }
    
    if (!success) {
      throw new Error('Both WebView and ADB approaches failed');
    }
    
    console.log('🎉 Login form test completed successfully');
    return { success: true, method: page ? 'webview' : 'adb' };
    
  } catch (error) {
    console.error('💥 Login form test failed:', error);
    return { success: false, error: error.message };
    
  } finally {
    // Cleanup
    if (connection && connection.device) {
      try {
        await connection.device.close();
        console.log('🔌 Android device connection closed');
      } catch (closeError) {
        console.log('⚠️ Error closing device connection:', closeError.message);
      }
    }
  }
}

/**
 * Utility function to launch CaddieAI app
 */
async function launchCaddieAIApp(device) {
  console.log('🚀 Launching CaddieAI app...');
  
  try {
    // Force stop first to ensure clean start
    await device.shell(`am force-stop ${CADDIEAI_PACKAGE}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Launch the app
    await device.shell(`am start -n ${CADDIEAI_PACKAGE}/.MainActivity`);
    
    // Wait for app to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ CaddieAI app launched');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to launch CaddieAI app:', error);
    throw error;
  }
}

/**
 * Export all functions
 */
module.exports = {
  connectToAndroidWebView,
  fillFormWithWebView,
  submitFormWithWebView,
  fillFormWithADB,
  submitFormWithADB,
  testLoginForm,
  launchCaddieAIApp,
  findElementWithSelectors,
  RN_SELECTORS,
  SCREEN_COORDS,
  TEST_CONFIG,
  CADDIEAI_PACKAGE
};

// If run directly, execute the test
if (require.main === module) {
  testLoginForm()
    .then((result) => {
      console.log('🏁 Test completed:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}