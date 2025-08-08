/**
 * Mapbox Configuration Utility
 * 
 * Provides access to Mapbox access token from Android BuildConfig
 * and iOS configuration for React Native applications.
 */

import { NativeModules, Platform } from 'react-native';

interface MapboxConfig {
  accessToken: string;
}

/**
 * Get Mapbox configuration from native platform
 */
export const getMapboxConfig = (): MapboxConfig => {
  let accessToken = '';

  if (Platform.OS === 'android') {
    // On Android, read from BuildConfig
    try {
      const BuildConfig = NativeModules.BuildConfig || {};
      accessToken = BuildConfig.MAPBOX_ACCESS_TOKEN || '';
      
      if (!accessToken) {
        console.warn('⚠️ Mapbox: No access token found in Android BuildConfig');
        accessToken = 'pk.your_mapbox_access_token_here'; // Fallback
      }
    } catch (error) {
      console.error('❌ Mapbox: Error reading BuildConfig:', error);
      accessToken = 'pk.your_mapbox_access_token_here'; // Fallback
    }
  } else if (Platform.OS === 'ios') {
    // On iOS, we'll need to implement native module or use a different approach
    // For now, use a fallback - this should be improved for production
    console.warn('⚠️ Mapbox: iOS token configuration not implemented yet');
    accessToken = 'pk.your_mapbox_access_token_here'; // Fallback
  }

  console.log('🗺️ Mapbox Config:', {
    platform: Platform.OS,
    hasToken: !!accessToken && accessToken !== 'pk.your_mapbox_access_token_here',
    tokenPrefix: accessToken.substring(0, 15) + '...'
  });

  return { accessToken };
};

/**
 * Validate Mapbox access token format
 */
export const validateMapboxToken = (token: string): boolean => {
  return token.startsWith('pk.') && token.length > 20;
};