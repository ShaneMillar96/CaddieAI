/**
 * Playwright Android Configuration for CaddieAI React Native App
 * Provides configuration for Android WebView testing and device emulation
 */

// Android device configuration for Playwright
const ANDROID_CONFIG = {
  // Device specifications (matching Android Emulator)
  device: {
    name: 'Android Emulator',
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86 wm) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.185 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },
  
  // WebView connection settings
  webView: {
    packageName: 'com.caddieaimobile',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000
  },
  
  // Selector strategies for React Native components
  selectors: {
    // Email field selectors (prioritized order)
    email: [
      '[testID="email-input"]',           // Recommended: testID prop
      '[placeholder="Enter your email"]', // Placeholder text
      'input[type="email"]',              // HTML input type
      '[accessibilityLabel*="Email"]',    // Accessibility label
      '[accessibilityLabel*="email" i]', // Case insensitive
      '*[role="textbox"][placeholder*="email" i]', // ARIA role + placeholder
      'TextInput:has-text("Email")',      // React Native TextInput with label
    ],
    
    // Password field selectors (prioritized order)  
    password: [
      '[testID="password-input"]',           // Recommended: testID prop
      '[placeholder="Enter your password"]', // Placeholder text
      'input[type="password"]',              // HTML input type
      '[secureTextEntry="true"]',            // React Native secureTextEntry
      '[accessibilityLabel*="Password"]',    // Accessibility label
      '[accessibilityLabel*="password" i]', // Case insensitive
      '*[role="textbox"][placeholder*="password" i]', // ARIA role + placeholder
      'TextInput:has-text("Password")',      // React Native TextInput with label
    ],
    
    // Button selectors
    signIn: [
      '[testID="sign-in-button"]',
      'button:has-text("Sign In")',
      '*[role="button"]:has-text("Sign In")',
      'TouchableOpacity:has-text("Sign In")',
      '[accessibilityLabel*="Sign In"]'
    ],
    
    createAccount: [
      '[testID="create-account-button"]',
      'button:has-text("Create Account")', 
      '*[role="button"]:has-text("Create Account")',
      'TouchableOpacity:has-text("Create Account")',
      '[accessibilityLabel*="Create Account"]'
    ]
  },
  
  // Screen coordinates for ADB fallback (412x915 viewport)
  coordinates: {
    email: { x: 370, y: 430 },
    password: { x: 370, y: 560 },
    signInButton: { x: 370, y: 700 },
    createAccountButton: { x: 370, y: 845 },
    // Relative coordinates (percentage-based for different screen sizes)
    emailPercent: { x: 0.899, y: 0.470 },    // 370/412, 430/915
    passwordPercent: { x: 0.899, y: 0.612 }, // 370/412, 560/915
    signInPercent: { x: 0.899, y: 0.765 },   // 370/412, 700/915
  },
  
  // Test data
  testData: {
    validLogin: {
      email: 'test@example.com',
      password: 'TestPassword123!'
    },
    invalidLogin: {
      email: 'invalid@example.com',
      password: 'WrongPassword'
    },
    registration: {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    }
  },
  
  // Timing configuration
  timing: {
    elementTimeout: 10000,        // Wait for elements to appear
    actionDelay: 1000,           // Delay between actions
    pageLoadTimeout: 30000,      // Wait for page/screen to load
    networkTimeout: 15000,       // Wait for network requests
    inputDelay: 500,             // Delay after typing
    clickDelay: 500,             // Delay after clicking
    screenshotDelay: 1000        // Delay before taking screenshots
  },
  
  // Playwright browser options for Android testing
  browserOptions: {
    headless: false,  // Show browser for debugging
    slowMo: 500,      // Slow down actions for debugging
    devtools: true,   // Open DevTools
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ]
  },
  
  // Context options for mobile emulation
  contextOptions: {
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.185 Mobile Safari/537.36',
    permissions: ['camera', 'microphone', 'geolocation'],
    geolocation: { latitude: 55.020906, longitude: -7.247879 }, // Faughan Valley Golf Course
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },
  
  // Screenshot configuration
  screenshots: {
    enabled: true,
    path: './screenshots/',
    format: 'png',
    quality: 90,
    fullPage: true,
    animations: 'disabled'
  },
  
  // Error handling configuration
  errorHandling: {
    maxRetries: 3,
    retryDelay: 2000,
    screenshotOnError: true,
    videoOnError: false,
    continueOnError: false
  },
  
  // Debugging configuration
  debug: {
    slowMo: 1000,           // Slow down for debugging
    video: false,           // Record video
    trace: true,            // Enable tracing
    console: true,          // Log console messages
    network: true,          // Log network requests
    verbose: true           // Verbose logging
  }
};

/**
 * Get device-specific coordinates based on screen size
 */
function getCoordinatesForDevice(deviceWidth, deviceHeight) {
  const coords = ANDROID_CONFIG.coordinates;
  return {
    email: {
      x: Math.round(coords.emailPercent.x * deviceWidth),
      y: Math.round(coords.emailPercent.y * deviceHeight)
    },
    password: {
      x: Math.round(coords.passwordPercent.x * deviceWidth), 
      y: Math.round(coords.passwordPercent.y * deviceHeight)
    },
    signInButton: {
      x: Math.round(coords.signInPercent.x * deviceWidth),
      y: Math.round(coords.signInPercent.y * deviceHeight)
    }
  };
}

/**
 * Create Playwright context with Android emulation
 */
async function createAndroidContext(browser) {
  const context = await browser.newContext({
    ...ANDROID_CONFIG.contextOptions,
    recordVideo: ANDROID_CONFIG.debug.video ? { 
      dir: './videos/',
      size: ANDROID_CONFIG.device.viewport
    } : undefined
  });
  
  return context;
}

/**
 * Enhanced selector strategy with fallbacks
 */
class AndroidSelectorStrategy {
  constructor(page) {
    this.page = page;
    this.config = ANDROID_CONFIG;
  }
  
  async findElement(selectorType, timeout = null) {
    const selectors = this.config.selectors[selectorType] || [];
    const elementTimeout = timeout || this.config.timing.elementTimeout;
    
    console.log(`🔍 Finding ${selectorType} element with ${selectors.length} selectors`);
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      console.log(`  Trying selector ${i + 1}/${selectors.length}: ${selector}`);
      
      try {
        const element = this.page.locator(selector).first();
        
        // Wait for element to be visible
        await element.waitFor({ 
          state: 'visible', 
          timeout: i === 0 ? elementTimeout : 2000 // Full timeout only for first selector
        });
        
        // Double-check that element is really interactable
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();
        
        if (isVisible && isEnabled) {
          console.log(`  ✅ Found ${selectorType} with: ${selector}`);
          return element;
        } else {
          console.log(`  ⚠️ Element found but not interactable: ${selector}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Selector failed: ${selector} - ${error.message}`);
      }
    }
    
    throw new Error(`Could not find ${selectorType} element with any of ${selectors.length} selectors`);
  }
  
  async fillField(selectorType, value, options = {}) {
    const element = await this.findElement(selectorType);
    const { clear = true, verify = true } = options;
    
    try {
      // Focus the element first
      await element.focus();
      await this.page.waitForTimeout(this.config.timing.inputDelay);
      
      // Clear existing content if requested
      if (clear) {
        await element.clear();
        await this.page.waitForTimeout(this.config.timing.inputDelay);
      }
      
      // Fill the field
      await element.fill(value);
      await this.page.waitForTimeout(this.config.timing.inputDelay);
      
      // Verify the value was entered correctly if requested
      if (verify) {
        const actualValue = await element.inputValue();
        if (actualValue !== value) {
          throw new Error(`Value verification failed. Expected: "${value}", Actual: "${actualValue}"`);
        }
      }
      
      console.log(`✅ Successfully filled ${selectorType} field`);
      return true;
      
    } catch (error) {
      console.log(`❌ Failed to fill ${selectorType} field: ${error.message}`);
      throw error;
    }
  }
  
  async clickButton(selectorType) {
    const element = await this.findElement(selectorType);
    
    try {
      await element.click();
      await this.page.waitForTimeout(this.config.timing.clickDelay);
      console.log(`✅ Successfully clicked ${selectorType} button`);
      return true;
      
    } catch (error) {
      console.log(`❌ Failed to click ${selectorType} button: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Utility functions for Android testing
 */
const AndroidTestUtils = {
  // Take screenshot with timestamp
  async takeScreenshot(page, name = 'screenshot') {
    if (!ANDROID_CONFIG.screenshots.enabled) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${ANDROID_CONFIG.screenshots.path}${name}-${timestamp}.${ANDROID_CONFIG.screenshots.format}`;
    
    await page.screenshot({
      path: filename,
      fullPage: ANDROID_CONFIG.screenshots.fullPage,
      animations: ANDROID_CONFIG.screenshots.animations,
      quality: ANDROID_CONFIG.screenshots.quality
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  },
  
  // Wait with logging
  async wait(ms, reason = '') {
    const message = reason ? ` (${reason})` : '';
    console.log(`⏳ Waiting ${ms}ms${message}`);
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Retry function with exponential backoff
  async retry(fn, options = {}) {
    const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === maxRetries) break;
        
        const waitTime = delay * Math.pow(backoff, i);
        console.log(`⚠️ Attempt ${i + 1} failed, retrying in ${waitTime}ms: ${error.message}`);
        await this.wait(waitTime, `retry ${i + 1}`);
      }
    }
    
    throw lastError;
  }
};

module.exports = {
  ANDROID_CONFIG,
  AndroidSelectorStrategy,
  AndroidTestUtils,
  createAndroidContext,
  getCoordinatesForDevice
};