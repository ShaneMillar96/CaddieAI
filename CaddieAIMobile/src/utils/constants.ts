/**
 * Application-wide constants for React Native app
 */

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BITS_PER_SAMPLE: 16,
  FORMAT: 'pcm16' as const,
  AUDIO_LEVEL_UPDATE_INTERVAL: 50,
  AUDIO_DATA_CAPTURE_INTERVAL: 100,
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  LOCAL_HOST: 'localhost:5000',
  PRODUCTION_HOST: 'api.caddieai.com',
  CONNECTION_TIMEOUT: 10000,
  MAX_RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000,
} as const;

// OpenAI Realtime API Configuration
export const OPENAI_CONFIG = {
  MODEL: 'gpt-4o-realtime-preview-2024-12-17',
  VOICE: 'echo' as const,
  INPUT_AUDIO_FORMAT: 'pcm16' as const,
  OUTPUT_AUDIO_FORMAT: 'pcm16' as const,
  TEMPERATURE: 0.7,
  VAD_THRESHOLD: 0.5,
  VAD_PREFIX_PADDING_MS: 300,
  VAD_SILENCE_DURATION_MS: 200,
} as const;

// UI Constants
export const UI_CONFIG = {
  LOADING_SPINNER_SIZE: 'small' as const,
  ANIMATION_DURATION: 250,
  DEBOUNCE_DELAY: 300,
  AUTO_SCROLL_DELAY: 100,
  AUDIO_VISUALIZER_BARS: 5,
  AUDIO_VISUALIZER_UPDATE_INTERVAL: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  CONNECTION_FAILED: 'Connection failed',
  RECORDING_NOT_INITIALIZED: 'Audio recorder not initialized',
  NOT_CONNECTED: 'Not connected to realtime service',
  WEBSOCKET_CONNECTION_FAILED: 'WebSocket connection failed',
  CONNECTION_TIMEOUT: 'Connection timeout',
  MAX_RECONNECT_ATTEMPTS: 'Max reconnection attempts reached',
  AUDIO_PERMISSION_DENIED: 'Microphone permission denied',
  AUDIO_SETUP_FAILED: 'Failed to setup audio',
  WEBRTC_NOT_SUPPORTED: 'WebRTC not supported in this environment',
} as const;

// Color Scheme
export const COLORS = {
  // Primary Colors
  PRIMARY: '#2196F3',
  PRIMARY_DARK: '#1976D2',
  SECONDARY: '#4CAF50',
  
  // Status Colors
  SUCCESS: '#4CAF50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196F3',
  
  // Neutral Colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_LIGHT: '#f5f5f5',
  GRAY: '#666666',
  GRAY_DARK: '#333333',
  BORDER: '#e0e0e0',
  PLACEHOLDER: '#ccc',
  
  // Audio Visualizer
  LISTENING: '#4CAF50',
  SPEAKING: '#2196F3',
  INACTIVE: '#ddd',
} as const;

// Layout Constants
export const LAYOUT = {
  PADDING_SMALL: 8,
  PADDING_MEDIUM: 16,
  PADDING_LARGE: 20,
  MARGIN_SMALL: 8,
  MARGIN_MEDIUM: 12,
  MARGIN_LARGE: 20,
  BORDER_RADIUS_SMALL: 8,
  BORDER_RADIUS_MEDIUM: 12,
  BORDER_RADIUS_LARGE: 25,
  BORDER_WIDTH: 1,
  BORDER_WIDTH_THICK: 3,
  ICON_SIZE_SMALL: 16,
  ICON_SIZE_MEDIUM: 24,
  ICON_SIZE_LARGE: 32,
  BUTTON_HEIGHT: 50,
  BUTTON_HEIGHT_LARGE: 70,
} as const;

// Message Types
export type MessageType = 'user' | 'assistant' | 'system';

// Connection States
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Audio Recorder States
export type RecorderState = 'idle' | 'initializing' | 'recording' | 'processing' | 'error';

export default {
  AUDIO_CONFIG,
  WEBSOCKET_CONFIG,
  OPENAI_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  COLORS,
  LAYOUT,
};