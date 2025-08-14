const axios = require('axios');

const API_BASE_URL = 'http://localhost:5277/api';

async function testApiConnection() {
  console.log('🔍 Testing API connection to:', API_BASE_URL);
  
  try {
    // Test basic connection to the API base
    console.log('1. Testing basic API health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ API health check passed:', healthResponse.status);
  } catch (error) {
    console.log('❌ API health check failed:', error.message);
  }
  
  try {
    // Test the user courses endpoint (should return 401 without auth)
    console.log('2. Testing user courses endpoint without auth...');
    const response = await axios.get(`${API_BASE_URL}/user/courses`, {
      timeout: 5000
    });
    console.log('✅ User courses endpoint response:', response.status, response.statusText);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ User courses endpoint accessible (returned 401 as expected without auth)');
    } else {
      console.log('❌ User courses endpoint error:', error.message, 'Status:', error.response?.status);
    }
  }
  
  try {
    // Test if any endpoint exists at the base URL
    console.log('3. Testing base API URL...');
    const response = await axios.get(API_BASE_URL, {
      timeout: 5000
    });
    console.log('✅ Base API URL response:', response.status);
  } catch (error) {
    console.log('❌ Base API URL error:', error.message, 'Status:', error.response?.status);
  }
}

testApiConnection().catch(console.error);