/**
 * Utility helper functions for the React Native app
 */

/**
 * Generate a unique ID combining timestamp and random string
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to ensure function is called at most once per delay period
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Check if a value is a valid string and not empty
 */
export const isValidString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T = any>(jsonString: string): T | null => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return null;
  }
};

/**
 * Convert ArrayBuffer to Base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert Float32Array to PCM16 ArrayBuffer
 */
export const convertFloat32ToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample * 0x7FFF, true);
  }
  
  return buffer;
};

/**
 * Calculate audio level from audio data
 */
export const calculateAudioLevel = (audioData: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
};

/**
 * Clamp a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Format error message for display
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Check if code is running in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__;
};

/**
 * Log only in development mode
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (isDevelopment()) {
    console.log(`[DEV] ${message}`, ...args);
  }
};

/**
 * Create a promise that resolves after a specified delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      devLog(`Retry attempt ${attempt} failed, retrying in ${delayMs}ms`, error);
      await delay(delayMs);
    }
  }
  throw new Error('Retry attempts exhausted');
};

export default {
  generateUniqueId,
  formatTimestamp,
  debounce,
  throttle,
  isValidString,
  safeJsonParse,
  arrayBufferToBase64,
  convertFloat32ToPCM16,
  calculateAudioLevel,
  clamp,
  formatError,
  isDevelopment,
  devLog,
  delay,
  retryWithBackoff,
};