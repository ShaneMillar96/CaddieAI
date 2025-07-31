/**
 * Shared API configuration for CaddieAI Mobile App
 */

// Development API configuration
const DEV_CONFIG = {
  API_BASE_URL: 'http://localhost:5277/api',
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Production API configuration (update when deploying)
const PROD_CONFIG = {
  API_BASE_URL: 'https://api.caddieai.com/api', // Update with actual production URL
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Determine which config to use based on environment
const IS_DEV = __DEV__;
export const API_CONFIG = IS_DEV ? DEV_CONFIG : PROD_CONFIG;

// Export individual values for backward compatibility
export const API_BASE_URL = API_CONFIG.API_BASE_URL;
export const API_TIMEOUT = API_CONFIG.API_TIMEOUT;
export const RETRY_ATTEMPTS = API_CONFIG.RETRY_ATTEMPTS;
export const RETRY_DELAY = API_CONFIG.RETRY_DELAY;

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

/**
 * Check if the API endpoint is reachable
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Try the voice AI endpoint since we know it exists
    const testUrl = buildApiUrl('voiceai/location-update');
    const response = await fetch(testUrl, {
      method: 'OPTIONS', // Use OPTIONS to avoid CORS issues and actual processing
      headers: {
        'Content-Type': 'application/json'
      },
      // @ts-ignore - React Native fetch supports timeout
      timeout: 5000, // 5 second timeout for health check
    });
    return response.status !== 404; // Any status except 404 means the endpoint exists
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};

/**
 * Test API connectivity with detailed logging
 */
export const testApiConnection = async (): Promise<{
  isConnected: boolean;
  baseUrl: string;
  error?: string;
}> => {
  const result = {
    isConnected: false,
    baseUrl: API_BASE_URL,
    error: undefined as string | undefined,
  };
  
  try {
    console.log('Testing API connection to:', API_BASE_URL);
    const isHealthy = await checkApiHealth();
    result.isConnected = isHealthy;
    
    if (isHealthy) {
      console.log('✅ API connection successful');
    } else {
      console.log('❌ API connection failed - endpoint not reachable');
      result.error = 'API endpoint not reachable';
    }
  } catch (error: any) {
    console.log('❌ API connection error:', error.message);
    result.error = error.message;
  }
  
  return result;
};

/**
 * Network status helper
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.message?.includes('Network request failed') ||
    error?.message?.includes('fetch') ||
    error?.code === 'NETWORK_ERROR' ||
    error?.name === 'NetworkError'
  );
};

export default API_CONFIG;