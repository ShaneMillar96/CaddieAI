import TokenStorage from './tokenStorage';

/**
 * Authentication Debug Utilities
 * 
 * These utilities are for development and debugging purposes to help
 * troubleshoot authentication issues and test the authentication flow.
 */

export class AuthDebugUtils {
  /**
   * Clear all authentication data and storage
   * Useful for testing fresh authentication flow
   */
  static async clearAllAuthData(): Promise<void> {
    console.log('🔧 DEBUG: Clearing all authentication data...');
    
    try {
      // Use the enhanced force clear method
      await TokenStorage.forceClearAllStorage();
      console.log('✅ DEBUG: All authentication data cleared successfully');
    } catch (error) {
      console.error('❌ DEBUG: Error clearing authentication data:', error);
    }
  }

  /**
   * Check current authentication state
   */
  static async checkAuthState(): Promise<void> {
    console.log('🔍 DEBUG: Checking current authentication state...');
    
    try {
      const hasTokens = await TokenStorage.hasTokens();
      console.log('📋 DEBUG: Has tokens:', hasTokens);
      
      if (hasTokens) {
        const accessToken = await TokenStorage.getAccessToken();
        const refreshToken = await TokenStorage.getRefreshToken();
        const userData = await TokenStorage.getUserData();
        
        console.log('🔑 DEBUG: Access token exists:', !!accessToken);
        console.log('🔄 DEBUG: Refresh token exists:', !!refreshToken);
        console.log('👤 DEBUG: User data exists:', !!userData);
        
        if (accessToken) {
          console.log('🔍 DEBUG: Testing access token validation...');
          const isAccessTokenValid = TokenStorage.isTokenValid(accessToken);
          console.log('✅ DEBUG: Access token valid:', isAccessTokenValid);
        }
        
        if (refreshToken) {
          console.log('🔍 DEBUG: Testing refresh token validation...');
          const isRefreshTokenValid = TokenStorage.isTokenValid(refreshToken);
          console.log('✅ DEBUG: Refresh token valid:', isRefreshTokenValid);
        }
        
        console.log('🔍 DEBUG: Testing overall token validation...');
        const areTokensValid = await TokenStorage.validateStoredTokens();
        console.log('✅ DEBUG: Overall tokens valid:', areTokensValid);
      }
    } catch (error) {
      console.error('❌ DEBUG: Error checking auth state:', error);
    }
  }

  /**
   * Test JWT token validation with sample tokens
   * Useful for debugging token parsing issues
   */
  static testTokenValidation(): void {
    console.log('🧪 DEBUG: Testing JWT token validation...');
    
    // Test with invalid tokens
    const invalidTokens = [
      '',
      'invalid-token',
      'header.payload', // Missing signature
      'too.many.parts.here', // Too many parts
      'invalid.invalid.invalid' // Invalid base64
    ];
    
    invalidTokens.forEach((token, index) => {
      console.log(`🧪 DEBUG: Testing invalid token ${index + 1}:`, token.substring(0, 20) + '...');
      const isValid = TokenStorage.isTokenValid(token);
      console.log(`✅ DEBUG: Result (should be false):`, isValid);
    });
    
    console.log('🧪 DEBUG: Token validation tests completed');
  }

  /**
   * Force a clean authentication state for testing
   */
  static async resetToCleanState(): Promise<void> {
    console.log('🔄 DEBUG: Resetting to clean authentication state...');
    
    await this.clearAllAuthData();
    await this.checkAuthState();
    
    console.log('✨ DEBUG: Clean state reset complete - app should now require authentication');
    console.log('📱 DEBUG: Please restart the app to see the authentication flow');
  }

  /**
   * Clear Redux Persist storage specifically
   */
  static async clearReduxPersistStorage(): Promise<void> {
    console.log('🗑️ DEBUG: Clearing Redux Persist storage...');
    
    try {
      // Import AsyncStorage dynamically to avoid module issues
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Get all keys and find persist keys
      const allKeys = await AsyncStorage.getAllKeys();
      const persistKeys = allKeys.filter((key: string) => 
        key.startsWith('persist:') || 
        key === 'root' ||
        key.includes('redux')
      );
      
      if (persistKeys.length > 0) {
        await AsyncStorage.multiRemove(persistKeys);
        console.log('✅ DEBUG: Cleared Redux Persist keys:', persistKeys);
      } else {
        console.log('📋 DEBUG: No Redux Persist keys found');
      }
    } catch (error) {
      console.error('❌ DEBUG: Error clearing Redux Persist storage:', error);
    }
  }
}

export default AuthDebugUtils;