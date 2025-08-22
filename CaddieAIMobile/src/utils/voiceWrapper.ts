import { Platform } from 'react-native';

// Safe Voice module wrapper to suppress NativeEventEmitter warnings
let VoiceModule: any = null;
let voiceInitialized = false;

// Suppress console warnings for NativeEventEmitter during Voice module initialization
const originalConsoleWarn = console.warn;

const initializeVoiceModule = () => {
  if (voiceInitialized) {
    return VoiceModule;
  }

  try {
    // Temporarily suppress NativeEventEmitter warnings
    console.warn = (message: string, ...args: any[]) => {
      if (typeof message === 'string' && 
          message.includes('NativeEventEmitter') && 
          (message.includes('addListener') || message.includes('removeListeners'))) {
        // Suppress the specific NativeEventEmitter warnings
        return;
      }
      originalConsoleWarn(message, ...args);
    };

    // Import Voice module
    const Voice = require('@react-native-voice/voice').default;
    VoiceModule = Voice;
    voiceInitialized = true;

    // Restore original console.warn after a brief delay
    setTimeout(() => {
      console.warn = originalConsoleWarn;
    }, 1000);

    console.log('Voice module initialized successfully with warning suppression');
    return VoiceModule;
  } catch (error) {
    // Restore console.warn on error
    console.warn = originalConsoleWarn;
    console.error('Failed to initialize Voice module:', error);
    return null;
  }
};

// Export safe Voice module access
export const safeVoice = {
  get module() {
    return initializeVoiceModule();
  },
  
  isAvailable() {
    const voice = initializeVoiceModule();
    return voice !== null && typeof voice.start === 'function';
  },
  
  async start(locale: string = 'en-US') {
    const voice = initializeVoiceModule();
    if (voice && typeof voice.start === 'function') {
      return await voice.start(locale);
    }
    throw new Error('Voice module not available');
  },
  
  async stop() {
    const voice = initializeVoiceModule();
    if (voice && typeof voice.stop === 'function') {
      return await voice.stop();
    }
  },
  
  async destroy() {
    const voice = initializeVoiceModule();
    if (voice && typeof voice.destroy === 'function') {
      return await voice.destroy();
    }
  },
  
  // Event handler setters
  setOnSpeechStart(handler: () => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechStart = handler;
    }
  },
  
  setOnSpeechRecognized(handler: () => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechRecognized = handler;
    }
  },
  
  setOnSpeechEnd(handler: () => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechEnd = handler;
    }
  },
  
  setOnSpeechError(handler: (error: any) => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechError = handler;
    }
  },
  
  setOnSpeechResults(handler: (event: any) => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechResults = handler;
    }
  },
  
  setOnSpeechPartialResults(handler: (event: any) => void) {
    const voice = initializeVoiceModule();
    if (voice) {
      voice.onSpeechPartialResults = handler;
    }
  }
};