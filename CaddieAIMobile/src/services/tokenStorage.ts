import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as base64Decode } from 'react-native-base64';

const ACCESS_TOKEN_KEY = 'caddie_access_token';
const REFRESH_TOKEN_KEY = 'caddie_refresh_token';
const USER_DATA_KEY = 'caddie_user_data';

export class TokenStorage {
  // Store access token securely
  static async storeAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store access token');
    }
  }

  // Retrieve access token
  static async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  // Store refresh token securely
  static async storeRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  // Retrieve refresh token
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  // Store both tokens
  static async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        this.storeAccessToken(accessToken),
        this.storeRefreshToken(refreshToken)
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store tokens');
    }
  }

  // Store user data (non-sensitive)
  static async storeUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  // Retrieve user data
  static async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  // Clear access token
  static async clearAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear access token:', error);
    }
  }

  // Clear refresh token
  static async clearRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear refresh token:', error);
    }
  }

  // Clear user data
  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Clear all stored data
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearAccessToken(),
        this.clearRefreshToken(),
        this.clearUserData()
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  // Check if tokens exist
  static async hasTokens(): Promise<boolean> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken()
      ]);
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('Failed to check tokens:', error);
      return false;
    }
  }

  // Check keychain availability (always true for AsyncStorage)
  static async isKeychainAvailable(): Promise<boolean> {
    return true;
  }

  // Base64 URL-safe decode function using reliable library
  private static base64UrlDecode(str: string): string {
    // Convert base64url to base64 by replacing URL-safe characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Use reliable base64 decoding library
    return base64Decode(base64);
  }

  // Validate JWT token format and expiration
  static isTokenValid(token: string): boolean {
    try {
      // Basic token format validation
      if (!token || typeof token !== 'string' || token.trim() === '') {
        console.log('Token validation failed: Token is empty or invalid type');
        return false;
      }

      // Check if token has proper JWT format (3 parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Token validation failed: Invalid JWT format (expected 3 parts, got', parts.length, ')');
        return false;
      }

      // Validate each part is not empty
      if (parts.some(part => !part || part.trim() === '')) {
        console.log('Token validation failed: One or more JWT parts are empty');
        return false;
      }

      // Decode the payload (second part)
      let decodedPayload: string;
      try {
        decodedPayload = this.base64UrlDecode(parts[1]);
      } catch (decodeError) {
        console.log('Token validation failed: Base64 decode error:', decodeError);
        return false;
      }

      // Parse the JSON payload
      let payload: any;
      try {
        payload = JSON.parse(decodedPayload);
      } catch (parseError) {
        console.log('Token validation failed: JSON parse error:', parseError);
        return false;
      }

      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        console.log('Token validation failed: Invalid payload structure');
        return false;
      }
      
      // Check if token has expiration claim
      if (!payload.exp || typeof payload.exp !== 'number') {
        console.log('Token validation failed: Missing or invalid expiration claim');
        return false;
      }

      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp <= currentTime) {
        console.log('Token validation failed: Token expired at', new Date(payload.exp * 1000).toISOString(), 'current time:', new Date(currentTime * 1000).toISOString());
        return false;
      }

      console.log('Token validation successful: Token expires at', new Date(payload.exp * 1000).toISOString());
      return true;
    } catch (error) {
      console.error('Token validation failed with unexpected error:', error);
      return false;
    }
  }

  // Validate both access and refresh tokens
  static async validateStoredTokens(): Promise<boolean> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken()
      ]);

      if (!accessToken || !refreshToken) {
        return false;
      }

      // Validate access token format and expiration
      const isAccessTokenValid = this.isTokenValid(accessToken);
      const isRefreshTokenValid = this.isTokenValid(refreshToken);

      // If either token is invalid, clear all tokens
      if (!isAccessTokenValid || !isRefreshTokenValid) {
        console.log('Invalid tokens found, clearing storage');
        await this.clearAll();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating stored tokens:', error);
      // Clear tokens on validation error
      await this.clearAll();
      return false;
    }
  }

  // Force clear all storage (useful for development/debugging)
  static async forceClearAllStorage(): Promise<void> {
    try {
      // Clear all keys related to the app
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => 
        key.startsWith('caddie_') || 
        key.startsWith('persist:') ||
        key.includes('redux')
      );
      
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
        console.log('Cleared all app storage:', appKeys);
      }
    } catch (error) {
      console.error('Failed to force clear storage:', error);
    }
  }
}

export default TokenStorage;