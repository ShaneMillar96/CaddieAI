/**
 * Mapbox Configuration Utility
 * 
 * Provides access to Mapbox access token from multiple sources:
 * - Android: BuildConfig 
 * - iOS/Fallback: Static configuration
 * - JavaScript config file fallback
 */

import { NativeModules, Platform } from 'react-native';

interface MapboxConfig {
  accessToken: string;
}

/**
 * Get Mapbox configuration from native platform or fallback
 */
export const getMapboxConfig = (): MapboxConfig => {
  let accessToken = '';

  if (Platform.OS === 'android') {
    // On Android, read from BuildConfig
    try {
      const BuildConfig = NativeModules.BuildConfig || {};
      accessToken = BuildConfig.MAPBOX_ACCESS_TOKEN || '';
      
      if (!accessToken) {
        console.warn('⚠️ Mapbox: No access token found in Android BuildConfig, using fallback');
        accessToken = getJavaScriptFallbackToken();
      }
    } catch (error) {
      console.error('❌ Mapbox: Error reading BuildConfig, using fallback:', error);
      accessToken = getJavaScriptFallbackToken();
    }
  } else if (Platform.OS === 'ios') {
    // On iOS, use JavaScript fallback token
    console.log('🍎 Mapbox: Using JavaScript fallback token for iOS');
    accessToken = getJavaScriptFallbackToken();
  }

  const isValidToken = validateMapboxToken(accessToken);
  
  console.log('🗺️ Mapbox Config:', {
    platform: Platform.OS,
    hasValidToken: isValidToken,
    tokenPrefix: accessToken.substring(0, 15) + '...'
  });

  return { accessToken };
};

/**
 * Get fallback token from JavaScript configuration
 */
const getJavaScriptFallbackToken = (): string => {
  try {
    // Import the token from our config file
    const { MAPBOX_ACCESS_TOKEN } = require('../../mapbox.config.js');
    return MAPBOX_ACCESS_TOKEN || 'pk.your_mapbox_access_token_here';
  } catch (error) {
    console.warn('⚠️ Mapbox: Could not load JavaScript config, using placeholder');
    return 'pk.your_mapbox_access_token_here';
  }
};

/**
 * Validate Mapbox access token format
 */
export const validateMapboxToken = (token: string): boolean => {
  return token.startsWith('pk.') && token.length > 20;
};