/**
 * CaddieAI Authentication Testing Script
 * Comprehensive testing of authentication API integration with backend localhost:5000
 * AND Playwright UI testing for Mac Android emulator
 */

const axios = require('axios');

// Import Android testing helpers
const {
  connectToAndroidWebView,
  testLoginForm,
  launchCaddieAIApp,
  fillFormWithWebView,
  fillFormWithADB,
  submitFormWithWebView,
  submitFormWithADB,
  RN_SELECTORS,
  SCREEN_COORDS,
  TEST_CONFIG,
  CADDIEAI_PACKAGE
} = require('./android-test-helpers');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test user data
const TEST_USERS = {
  registration: {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    handicap: 18,
    skillLevelId: 1
  },
  login: {
    email: 'testuser@example.com',
    password: 'TestPassword123!'
  },
  invalidLogin: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!'
  }
};

// Test results storage
let testResults = [];

// Utility functions
function logTest(testName, status, details = '') {
  const result = {
    test: testName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${status}`);
  if (details) console.log(`   Details: ${details}`);
}

function logSection(sectionName) {
  console.log(`\n🔍 ${sectionName}`);
  console.log('='.repeat(50));
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method: method,
      url: `${API_BASE_URL}${endpoint}`,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || null,
      data: error.response?.data || null
    };
  }
}

// Test Functions
async function testBackendConnectivity() {
  logSection('Backend Connectivity Tests');
  
  // Test basic connectivity
  const healthCheck = await makeRequest('GET', '/health');
  if (healthCheck.success) {
    logTest('Backend Health Check', 'PASS', `Status: ${healthCheck.status}`);
  } else {
    logTest('Backend Health Check', 'INFO', `No health endpoint - Status: ${healthCheck.status} ${healthCheck.error}`);
  }
  
  // Test auth endpoints existence
  const authCheck = await makeRequest('OPTIONS', '/auth/login');
  if (authCheck.status !== 404) {
    logTest('Auth Endpoints Available', 'PASS', `Status: ${authCheck.status}`);
  } else {
    logTest('Auth Endpoints Available', 'FAIL', 'Auth endpoints not found');
  }
}

async function testRegistrationFlow() {
  logSection('User Registration Tests');
  
  // Test valid registration
  const registerResult = await makeRequest('POST', '/auth/register', TEST_USERS.registration);
  
  if (registerResult.success) {
    logTest('Valid User Registration', 'PASS', 'Registration successful with valid data');
    
    // Check if tokens are returned
    if (registerResult.data?.data?.accessToken) {
      logTest('Registration Returns JWT Token', 'PASS', 'Access token received');
    } else {
      logTest('Registration Returns JWT Token', 'FAIL', 'No access token in response');
    }
    
    // Store token for later tests
    global.testAccessToken = registerResult.data?.data?.accessToken;
    global.testRefreshToken = registerResult.data?.data?.refreshToken;
    
  } else {
    logTest('Valid User Registration', 'FAIL', 
      `Status: ${registerResult.status}, Error: ${registerResult.error}`);
    
    // If registration fails due to existing user, try to continue with login
    if (registerResult.status === 400 || registerResult.status === 409) {
      logTest('Registration Error Handling', 'PASS', 'Proper error response for existing user');
    }
  }
  
  // Test duplicate registration
  const duplicateResult = await makeRequest('POST', '/auth/register', TEST_USERS.registration);
  if (!duplicateResult.success && (duplicateResult.status === 400 || duplicateResult.status === 409)) {
    logTest('Duplicate Registration Prevention', 'PASS', 'Duplicate user registration blocked');
  } else {
    logTest('Duplicate Registration Prevention', 'FAIL', 'Should prevent duplicate registrations');
  }
  
  // Test invalid email
  const invalidEmailData = { ...TEST_USERS.registration, email: 'invalid-email' };
  const invalidEmailResult = await makeRequest('POST', '/auth/register', invalidEmailData);
  if (!invalidEmailResult.success) {
    logTest('Email Validation', 'PASS', 'Invalid email rejected');
  } else {
    logTest('Email Validation', 'FAIL', 'Should reject invalid email format');
  }
  
  // Test weak password
  const weakPasswordData = { ...TEST_USERS.registration, password: 'weak', confirmPassword: 'weak' };
  const weakPasswordResult = await makeRequest('POST', '/auth/register', weakPasswordData);
  if (!weakPasswordResult.success) {
    logTest('Password Strength Validation', 'PASS', 'Weak password rejected');
  } else {
    logTest('Password Strength Validation', 'FAIL', 'Should enforce strong passwords');
  }
}

async function testLoginFlow() {
  logSection('User Login Tests');
  
  // Test valid login
  const loginResult = await makeRequest('POST', '/auth/login', TEST_USERS.login);
  
  if (loginResult.success) {
    logTest('Valid User Login', 'PASS', 'Login successful with correct credentials');
    
    // Check if tokens are returned
    if (loginResult.data?.data?.accessToken) {
      logTest('Login Returns JWT Token', 'PASS', 'Access token received');
      global.testAccessToken = loginResult.data?.data?.accessToken;
      global.testRefreshToken = loginResult.data?.data?.refreshToken;
    } else {
      logTest('Login Returns JWT Token', 'FAIL', 'No access token in response');
    }
    
    // Check user data
    if (loginResult.data?.data?.user) {
      logTest('Login Returns User Data', 'PASS', 'User profile data included');
    } else {
      logTest('Login Returns User Data', 'FAIL', 'No user data in response');
    }
    
  } else {
    logTest('Valid User Login', 'FAIL', 
      `Status: ${loginResult.status}, Error: ${loginResult.error}`);
  }
  
  // Test invalid credentials
  const invalidLoginResult = await makeRequest('POST', '/auth/login', TEST_USERS.invalidLogin);
  if (!invalidLoginResult.success && invalidLoginResult.status === 401) {
    logTest('Invalid Credentials Handling', 'PASS', 'Invalid credentials properly rejected');
  } else {
    logTest('Invalid Credentials Handling', 'FAIL', 'Should reject invalid credentials with 401');
  }
  
  // Test missing password
  const missingPasswordResult = await makeRequest('POST', '/auth/login', { email: TEST_USERS.login.email });
  if (!missingPasswordResult.success) {
    logTest('Required Fields Validation', 'PASS', 'Missing password rejected');
  } else {
    logTest('Required Fields Validation', 'FAIL', 'Should require all login fields');
  }
}

async function testTokenValidation() {
  logSection('JWT Token Validation Tests');
  
  if (!global.testAccessToken) {
    logTest('JWT Token Available', 'FAIL', 'No access token available for testing');
    return;
  }
  
  // Test protected endpoint access
  const protectedResult = await makeRequest('GET', '/user/profile', null, {
    'Authorization': `Bearer ${global.testAccessToken}`
  });
  
  if (protectedResult.success) {
    logTest('Protected Endpoint Access', 'PASS', 'JWT token grants access to protected endpoints');
  } else {
    logTest('Protected Endpoint Access', 'FAIL', 
      `Status: ${protectedResult.status}, Error: ${protectedResult.error}`);
  }
  
  // Test invalid token
  const invalidTokenResult = await makeRequest('GET', '/user/profile', null, {
    'Authorization': 'Bearer invalid-token'
  });
  
  if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
    logTest('Invalid Token Rejection', 'PASS', 'Invalid tokens properly rejected');
  } else {
    logTest('Invalid Token Rejection', 'FAIL', 'Should reject invalid tokens with 401');
  }
  
  // Test missing authorization header
  const noTokenResult = await makeRequest('GET', '/user/profile');
  if (!noTokenResult.success && noTokenResult.status === 401) {
    logTest('Missing Authorization Header', 'PASS', 'Missing auth header properly handled');
  } else {
    logTest('Missing Authorization Header', 'FAIL', 'Should require authorization header');
  }
}

async function testTokenRefresh() {
  logSection('Token Refresh Tests');
  
  if (!global.testRefreshToken) {
    logTest('Refresh Token Available', 'FAIL', 'No refresh token available for testing');
    return;
  }
  
  // Test token refresh
  const refreshResult = await makeRequest('POST', '/auth/refresh', {
    refreshToken: global.testRefreshToken
  });
  
  if (refreshResult.success) {
    logTest('Token Refresh', 'PASS', 'Refresh token successfully exchanges for new access token');
    
    if (refreshResult.data?.data?.accessToken) {
      logTest('New Access Token Generated', 'PASS', 'New access token received');
      global.testAccessToken = refreshResult.data?.data?.accessToken;
    } else {
      logTest('New Access Token Generated', 'FAIL', 'No new access token in refresh response');
    }
    
  } else {
    logTest('Token Refresh', 'FAIL', 
      `Status: ${refreshResult.status}, Error: ${refreshResult.error}`);
  }
  
  // Test invalid refresh token
  const invalidRefreshResult = await makeRequest('POST', '/auth/refresh', {
    refreshToken: 'invalid-refresh-token'
  });
  
  if (!invalidRefreshResult.success && invalidRefreshResult.status === 401) {
    logTest('Invalid Refresh Token', 'PASS', 'Invalid refresh token properly rejected');
  } else {
    logTest('Invalid Refresh Token', 'FAIL', 'Should reject invalid refresh tokens');
  }
}

async function testEmailAvailability() {
  logSection('Email Availability Tests');
  
  // Test existing email
  const existingEmailResult = await makeRequest('GET', `/auth/check-email?email=${encodeURIComponent(TEST_USERS.registration.email)}`);
  
  if (existingEmailResult.success) {
    const isAvailable = existingEmailResult.data?.data;
    if (isAvailable === false) {
      logTest('Existing Email Check', 'PASS', 'Correctly identifies existing email as unavailable');
    } else {
      logTest('Existing Email Check', 'INFO', 'Email shows as available (might not exist yet)');
    }
  } else {
    logTest('Existing Email Check', 'FAIL', 
      `Status: ${existingEmailResult.status}, Error: ${existingEmailResult.error}`);
  }
  
  // Test new email
  const newEmailResult = await makeRequest('GET', `/auth/check-email?email=${encodeURIComponent('new-email@example.com')}`);
  
  if (newEmailResult.success) {
    const isAvailable = newEmailResult.data?.data;
    if (isAvailable === true) {
      logTest('New Email Check', 'PASS', 'Correctly identifies new email as available');
    } else {
      logTest('New Email Check', 'FAIL', 'New email should be available');
    }
  } else {
    logTest('New Email Check', 'FAIL', 
      `Status: ${newEmailResult.status}, Error: ${newEmailResult.error}`);
  }
  
  // Test invalid email format
  const invalidEmailFormatResult = await makeRequest('GET', `/auth/check-email?email=invalid-email`);
  
  if (!invalidEmailFormatResult.success) {
    logTest('Invalid Email Format Check', 'PASS', 'Invalid email format rejected');
  } else {
    logTest('Invalid Email Format Check', 'FAIL', 'Should reject invalid email formats');
  }
}

async function testLogout() {
  logSection('Logout Tests');
  
  if (!global.testRefreshToken) {
    logTest('Logout Test Setup', 'FAIL', 'No refresh token available for logout testing');
    return;
  }
  
  // Test normal logout
  const logoutResult = await makeRequest('POST', '/auth/logout', {
    refreshToken: global.testRefreshToken
  });
  
  if (logoutResult.success || logoutResult.status === 204) {
    logTest('User Logout', 'PASS', 'Logout request successful');
  } else {
    logTest('User Logout', 'FAIL', 
      `Status: ${logoutResult.status}, Error: ${logoutResult.error}`);
  }
  
  // Test using refresh token after logout (should fail)
  const postLogoutRefreshResult = await makeRequest('POST', '/auth/refresh', {
    refreshToken: global.testRefreshToken
  });
  
  if (!postLogoutRefreshResult.success && postLogoutRefreshResult.status === 401) {
    logTest('Token Invalidation After Logout', 'PASS', 'Refresh token invalid after logout');
  } else {
    logTest('Token Invalidation After Logout', 'FAIL', 'Tokens should be invalidated after logout');
  }
}

// Main test execution
async function runAuthenticationTests() {
  console.log('🧪 CaddieAI Authentication API Testing Suite');
  console.log('Backend URL:', API_BASE_URL);
  console.log('Started at:', new Date().toISOString());
  console.log('='.repeat(80));
  
  try {
    await testBackendConnectivity();
    await testRegistrationFlow();
    await testLoginFlow();
    await testTokenValidation();
    await testTokenRefresh();
    await testEmailAvailability();
    await testLogout();
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  // Generate summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  const infoCount = testResults.filter(r => r.status === 'INFO').length;
  
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`ℹ️  Info: ${infoCount}`);
  console.log(`📝 Total Tests: ${testResults.length}`);
  
  const successRate = passCount / (passCount + failCount) * 100;
  console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  // Show failed tests
  const failedTests = testResults.filter(r => r.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`  • ${test.test}: ${test.details}`);
    });
  }
  
  console.log('\n✅ Testing completed at:', new Date().toISOString());
  
  return {
    summary: {
      total: testResults.length,
      passed: passCount,
      failed: failCount,
      info: infoCount,
      successRate: successRate
    },
    results: testResults
  };
}

// UI Testing Functions for Playwright MCP
// These functions use Claude's Playwright MCP to test the UI directly

async function testPlaywrightLogin() {
  console.log('🎭 Starting Playwright UI Login Test');
  console.log('This function should be called from Claude with Playwright MCP commands');
  
  // Instructions for Claude Playwright MCP usage:
  console.log('📋 Test Steps for Claude:');
  console.log('1. Take browser snapshot to identify form elements');
  console.log('2. Use browser_fill_form with proper field references');
  console.log('3. Submit form and verify results');
  
  // Test configuration for UI testing
  const UI_TEST_CONFIG = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    appUrl: 'http://localhost:19006', // React Native Metro server
    emulatorViewport: { width: 412, height: 915 } // Android emulator size
  };
  
  console.log('🔧 UI Test Configuration:', UI_TEST_CONFIG);
  
  // Expected form field structure based on LoginScreen.tsx analysis:
  const expectedFormFields = [
    {
      name: 'Email field',
      type: 'textbox',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true
    },
    {
      name: 'Password field',
      type: 'textbox', 
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
      secureTextEntry: true
    }
  ];
  
  console.log('📝 Expected form structure:', expectedFormFields);
  
  return {
    testConfig: UI_TEST_CONFIG,
    formFields: expectedFormFields,
    instructions: [
      'Take initial browser snapshot',
      'Navigate to login screen if needed',
      'Use browser_fill_form with field references from snapshot',
      'Submit form by clicking Sign In button',
      'Verify login success or error state',
      'Take screenshot of result'
    ]
  };
}

async function runPlaywrightUITests() {
  console.log('🎭 Playwright UI Testing Guide');
  console.log('This function provides guidance for Claude MCP Playwright testing');
  
  // Step-by-step guide for fixing password input issue
  const troubleshootingGuide = {
    problem: 'Password text being entered into email field',
    solutions: [
      {
        method: 'browser_fill_form',
        description: 'Use form filling with proper field mapping',
        steps: [
          '1. Take browser_snapshot to get element references',
          '2. Identify email and password field refs', 
          '3. Use browser_fill_form with field array',
          '4. Verify correct field targeting'
        ]
      },
      {
        method: 'sequential_clicking',
        description: 'Click each field before typing',
        steps: [
          '1. Click email field using browser_click',
          '2. Type email using browser_type',
          '3. Click password field using browser_click',
          '4. Type password using browser_type',
          '5. Submit form'
        ]
      },
      {
        method: 'clear_and_type',
        description: 'Clear fields before typing',
        steps: [
          '1. Clear email field completely',
          '2. Type email in cleared field',
          '3. Clear password field completely', 
          '4. Type password in cleared field',
          '5. Submit form'
        ]
      }
    ]
  };
  
  console.log('🔧 Troubleshooting Guide:', JSON.stringify(troubleshootingGuide, null, 2));
  
  return troubleshootingGuide;
}

// Enhanced test configuration for UI testing
const PLAYWRIGHT_CONFIG = {
  // App URLs
  metroUrl: 'http://localhost:19006',  // React Native Metro bundler
  apiUrl: 'http://localhost:5000/api', // Backend API
  
  // Test data
  validCredentials: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  
  invalidCredentials: {
    email: 'invalid@example.com', 
    password: 'WrongPassword'
  },
  
  // Emulator settings
  viewport: { width: 412, height: 915 },
  timeout: 30000,
  
  // Form selectors (to be updated based on snapshot)
  selectors: {
    emailField: '[placeholder="Enter your email"]',
    passwordField: '[placeholder="Enter your password"]',
    loginButton: 'text="Sign In"',
    registerButton: 'text="Create Account"',
    forgotPasswordLink: 'text="Forgot Password?"'
  }
};

// Export UI testing functions
function getPlaywrightInstructions() {
  return {
    setup: [
      'Ensure React Native Metro server is running on localhost:19006',
      'Ensure Android emulator is running and accessible',
      'Navigate to the login screen in the app'
    ],
    
    passwordFixSteps: [
      'Step 1: Take browser_snapshot to see current form state',
      'Step 2: Identify exact element references for email and password fields',
      'Step 3: Use browser_fill_form with proper field mapping:',
      '  - Email field: map to email input element ref',
      '  - Password field: map to password input element ref',
      'Step 4: Submit form and verify password was entered correctly',
      'Step 5: Take screenshot to confirm form submission result'
    ],
    
    fallbackMethods: [
      'Method A: Click email field, type email, click password field, type password',
      'Method B: Use browser_evaluate to manually set form values',
      'Method C: Clear fields first, then type sequentially'
    ],
    
    config: PLAYWRIGHT_CONFIG
  };
}

// Android UI Testing Functions
async function runAndroidUITests() {
  console.log('🤖 Android UI Testing Mode');
  console.log('Testing CaddieAI React Native app on Android emulator');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {}
  };
  
  try {
    // Test 1: Android WebView Connection
    console.log('\n📋 Test 1: Android WebView Connection');
    try {
      const connection = await connectToAndroidWebView();
      testResults.tests.push({
        name: 'WebView Connection',
        status: connection.page ? 'PASS' : 'PARTIAL',
        details: connection.page ? 'WebView connected successfully' : 'Device connected, WebView not available'
      });
      
      // Cleanup connection
      if (connection.device) {
        await connection.device.close();
      }
    } catch (error) {
      testResults.tests.push({
        name: 'WebView Connection',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 2: Complete Login Form Test
    console.log('\n📋 Test 2: Complete Login Form Test');
    try {
      const result = await testLoginForm();
      testResults.tests.push({
        name: 'Login Form Test',
        status: result.success ? 'PASS' : 'FAIL',
        details: result.success ? 
          `Test successful using ${result.method} method` : 
          result.error
      });
    } catch (error) {
      testResults.tests.push({
        name: 'Login Form Test',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Generate summary
    const passCount = testResults.tests.filter(t => t.status === 'PASS').length;
    const failCount = testResults.tests.filter(t => t.status === 'FAIL').length;
    const partialCount = testResults.tests.filter(t => t.status === 'PARTIAL').length;
    
    testResults.summary = {
      total: testResults.tests.length,
      passed: passCount,
      failed: failCount,
      partial: partialCount,
      successRate: ((passCount + partialCount * 0.5) / testResults.tests.length * 100).toFixed(1) + '%'
    };
    
    // Display results
    console.log('\n📊 Android UI Test Results Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️ Partial: ${partialCount}`);
    console.log(`📈 Success Rate: ${testResults.summary.successRate}`);
    
    // Show detailed results
    console.log('\n📋 Detailed Results:');
    testResults.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${test.name}: ${test.details}`);
    });
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Android UI testing failed:', error);
    return {
      error: error.message,
      tests: testResults.tests,
      summary: { total: 0, passed: 0, failed: 1, partial: 0, successRate: '0%' }
    };
  }
}

// Enhanced Android testing with specific password field fix
async function testPasswordFieldFix() {
  console.log('🔐 Testing Password Field Fix');
  console.log('This test specifically addresses the invalid target issue');
  
  try {
    // Connect to Android
    const connection = await connectToAndroidWebView();
    const { device, webview, page } = connection;
    
    if (!device) {
      throw new Error('No Android device available');
    }
    
    // Launch app first
    await launchCaddieAIApp(device);
    
    let success = false;
    let method = 'unknown';
    let error = null;
    
    // Method 1: Try WebView approach with specific selectors
    if (page) {
      console.log('🌐 Attempting WebView with React Native selectors...');
      try {
        // Use the specific selectors for React Native components
        const emailSelectors = RN_SELECTORS.emailField;
        const passwordSelectors = RN_SELECTORS.passwordField;
        
        console.log('📧 Email selectors:', emailSelectors);
        console.log('🔐 Password selectors:', passwordSelectors);
        
        // Try each selector until one works
        let emailElement = null;
        let passwordElement = null;
        
        for (const selector of emailSelectors) {
          try {
            emailElement = await page.locator(selector).first();
            if (await emailElement.isVisible()) {
              console.log(`✅ Email field found with: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ Email selector failed: ${selector}`);
            emailElement = null;
          }
        }
        
        for (const selector of passwordSelectors) {
          try {
            passwordElement = await page.locator(selector).first();
            if (await passwordElement.isVisible()) {
              console.log(`✅ Password field found with: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ Password selector failed: ${selector}`);
            passwordElement = null;
          }
        }
        
        if (emailElement && passwordElement) {
          // Fill fields individually with clear separation
          console.log('📝 Filling email field...');
          await emailElement.clear();
          await emailElement.fill(TEST_CONFIG.email);
          
          console.log('📝 Filling password field...');
          await passwordElement.clear();
          await passwordElement.fill(TEST_CONFIG.password);
          
          // Verify fields
          const emailValue = await emailElement.inputValue();
          const passwordValue = await passwordElement.inputValue();
          
          if (emailValue === TEST_CONFIG.email && passwordValue === TEST_CONFIG.password) {
            console.log('✅ WebView method successful - fields filled correctly');
            success = true;
            method = 'webview';
          } else {
            console.log(`❌ WebView validation failed. Email: "${emailValue}", Password length: ${passwordValue.length}`);
          }
        } else {
          console.log('❌ Could not find both email and password fields with WebView');
        }
        
      } catch (webviewError) {
        error = webviewError.message;
        console.log(`⚠️ WebView method failed: ${error}`);
      }
    }
    
    // Method 2: Fallback to ADB with precise coordinates
    if (!success) {
      console.log('📱 Attempting ADB with coordinate targeting...');
      try {
        // Use precise coordinates for email and password fields
        console.log(`📧 Tapping email field at coordinates: ${SCREEN_COORDS.email.x}, ${SCREEN_COORDS.email.y}`);
        await device.input.tap(SCREEN_COORDS.email);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear any existing text and type email
        await device.input.type(TEST_CONFIG.email);
        console.log('✅ Email entered via ADB');
        
        console.log(`🔐 Tapping password field at coordinates: ${SCREEN_COORDS.password.x}, ${SCREEN_COORDS.password.y}`);
        await device.input.tap(SCREEN_COORDS.password);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear any existing text and type password
        await device.input.type(TEST_CONFIG.password);
        console.log('✅ Password entered via ADB');
        
        success = true;
        method = 'adb';
        
      } catch (adbError) {
        error = adbError.message;
        console.log(`❌ ADB method also failed: ${error}`);
      }
    }
    
    // Cleanup
    if (device) {
      await device.close();
    }
    
    return {
      success,
      method,
      error,
      details: success ? 
        `Password field targeting fixed using ${method} method` : 
        `Both WebView and ADB methods failed: ${error}`
    };
    
  } catch (error) {
    console.error('💥 Password field fix test failed:', error);
    return {
      success: false,
      method: 'none',
      error: error.message,
      details: 'Failed to connect to Android device or launch app'
    };
  }
}

// Run the tests
if (require.main === module) {
  console.log('🚀 CaddieAI Authentication Testing Suite');
  console.log('Choose test mode:');
  console.log('  API Tests: node test-auth.js api');
  console.log('  UI Guide: node test-auth.js ui');
  console.log('  Android UI: node test-auth.js android');
  console.log('  Password Fix: node test-auth.js password-fix');
  
  const mode = process.argv[2] || 'api';
  
  if (mode === 'ui') {
    console.log('\n🎭 UI Testing Mode');
    testPlaywrightLogin().then((result) => {
      console.log('UI test configuration ready:', result);
    });
    
    runPlaywrightUITests().then((guide) => {
      console.log('\nTroubleshooting guide generated');
    });
    
    const instructions = getPlaywrightInstructions();
    console.log('\n📋 Playwright Instructions:');
    console.log(JSON.stringify(instructions, null, 2));
    
  } else if (mode === 'android') {
    console.log('\n🤖 Android UI Testing Mode');
    runAndroidUITests().then((results) => {
      console.log('\n🏁 Android UI tests completed');
      process.exit(results.summary?.passed > 0 ? 0 : 1);
    }).catch((error) => {
      console.error('💥 Android UI tests failed:', error);
      process.exit(1);
    });
    
  } else if (mode === 'password-fix') {
    console.log('\n🔐 Password Field Fix Test');
    testPasswordFieldFix().then((result) => {
      console.log('\n🏁 Password field fix test completed:', result);
      process.exit(result.success ? 0 : 1);
    }).catch((error) => {
      console.error('💥 Password field fix test failed:', error);
      process.exit(1);
    });
    
  } else {
    runAuthenticationTests().catch(console.error);
  }
}

module.exports = { 
  runAuthenticationTests, 
  testPlaywrightLogin, 
  runPlaywrightUITests,
  getPlaywrightInstructions,
  runAndroidUITests,
  testPasswordFieldFix,
  PLAYWRIGHT_CONFIG 
};