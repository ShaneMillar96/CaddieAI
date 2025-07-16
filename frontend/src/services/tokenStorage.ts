import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export default TokenStorage;