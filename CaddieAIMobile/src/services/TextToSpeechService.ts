import Tts from 'react-native-tts';

export interface TextToSpeechConfig {
  language: string;
  pitch: number;
  rate: number;
  volume: number;
  voiceId?: string;
  ignoreSilentSwitch?: boolean;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  quality: number;
}

export enum SpeechState {
  READY = 'ready',
  SPEAKING = 'speaking',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

const DEFAULT_CONFIG: TextToSpeechConfig = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.5,
  volume: 0.8,
  ignoreSilentSwitch: true,
};

export class TextToSpeechService {
  private config: TextToSpeechConfig = DEFAULT_CONFIG;
  private currentState: SpeechState = SpeechState.READY;
  private isInitialized: boolean = false;
  private listeners: Array<(state: SpeechState, utterance?: string) => void> = [];
  private speechQueue: Array<{ text: string; priority: number }> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the TTS engine and set up event listeners
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔊 TextToSpeechService: Initializing TTS engine...');

      // Set initial configuration
      await this.updateConfiguration(this.config);

      // Set up event listeners
      Tts.addEventListener('tts-start', this.handleSpeechStart);
      Tts.addEventListener('tts-finish', this.handleSpeechFinish);
      Tts.addEventListener('tts-cancel', this.handleSpeechCancel);
      Tts.addEventListener('tts-error', this.handleSpeechError);
      Tts.addEventListener('tts-progress', this.handleSpeechProgress);

      this.isInitialized = true;
      this.setState(SpeechState.READY);
      
      console.log('✅ TextToSpeechService: TTS engine initialized successfully');
    } catch (error) {
      console.error('❌ TextToSpeechService: Failed to initialize TTS engine:', error);
      this.setState(SpeechState.ERROR);
    }
  }

  /**
   * Speak text with optional priority (higher number = higher priority)
   */
  async speak(text: string, priority: number = 0): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ TextToSpeechService: TTS not initialized, queueing speech');
      this.speechQueue.push({ text, priority });
      return;
    }

    if (!text || text.trim().length === 0) {
      console.warn('⚠️ TextToSpeechService: Empty text provided for speech');
      return;
    }

    // Add to queue with priority
    this.speechQueue.push({ text: text.trim(), priority });
    
    // Sort queue by priority (higher priority first)
    this.speechQueue.sort((a, b) => b.priority - a.priority);

    console.log(`🎤 TextToSpeechService: Queued speech (priority ${priority}): "${text.substring(0, 50)}..."`);

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processQueue();
    }
  }

  /**
   * Process the speech queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.speechQueue.length > 0) {
      const nextSpeech = this.speechQueue.shift();
      if (!nextSpeech) continue;

      try {
        console.log(`🗣️ TextToSpeechService: Speaking: "${nextSpeech.text}"`);
        await this.speakNow(nextSpeech.text);
        
        // Wait for speech to finish
        await this.waitForSpeechCompletion();
      } catch (error) {
        console.error('❌ TextToSpeechService: Error speaking text:', error);
        this.setState(SpeechState.ERROR);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Speak text immediately (bypasses queue)
   */
  private async speakNow(text: string): Promise<void> {
    if (this.currentState === SpeechState.SPEAKING) {
      await this.stop();
    }

    try {
      this.setState(SpeechState.SPEAKING, text);
      await Tts.speak(text);
    } catch (error) {
      console.error('❌ TextToSpeechService: Failed to speak text:', error);
      this.setState(SpeechState.ERROR);
      throw error;
    }
  }

  /**
   * Wait for current speech to complete
   */
  private waitForSpeechCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (this.currentState !== SpeechState.SPEAKING) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }

  /**
   * Stop current speech and clear queue
   */
  async stop(): Promise<void> {
    try {
      await Tts.stop();
      this.speechQueue = [];
      this.isProcessingQueue = false;
      this.setState(SpeechState.STOPPED);
      console.log('🛑 TextToSpeechService: Speech stopped and queue cleared');
    } catch (error) {
      console.error('❌ TextToSpeechService: Error stopping speech:', error);
    }
  }

  /**
   * Pause current speech
   */
  async pause(): Promise<void> {
    try {
      // Note: react-native-tts doesn't support pause/resume, so we stop instead
      await Tts.stop();
      this.setState(SpeechState.PAUSED);
      console.log('⏸️ TextToSpeechService: Speech paused (stopped)');
    } catch (error) {
      console.error('❌ TextToSpeechService: Error pausing speech:', error);
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<VoiceInfo[]> {
    try {
      const voices = await Tts.voices();
      return voices.map(voice => ({
        id: voice.id,
        name: voice.name,
        language: voice.language,
        quality: voice.quality
      }));
    } catch (error) {
      console.error('❌ TextToSpeechService: Error getting voices:', error);
      return [];
    }
  }

  /**
   * Update TTS configuration
   */
  async updateConfiguration(newConfig: Partial<TextToSpeechConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };

      // Apply configuration to TTS engine
      if (this.config.language) {
        await Tts.setDefaultLanguage(this.config.language);
      }
      
      if (this.config.rate !== undefined) {
        await Tts.setDefaultRate(this.config.rate);
      }
      
      if (this.config.pitch !== undefined) {
        await Tts.setDefaultPitch(this.config.pitch);
      }

      if (this.config.voiceId) {
        await Tts.setDefaultVoice(this.config.voiceId);
      }

      if (this.config.ignoreSilentSwitch !== undefined) {
        await Tts.setIgnoreSilentSwitch(this.config.ignoreSilentSwitch ? 'ignore' : 'obey');
      }

      console.log('⚙️ TextToSpeechService: Configuration updated:', this.config);
    } catch (error) {
      console.error('❌ TextToSpeechService: Error updating configuration:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): TextToSpeechConfig {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  getCurrentState(): SpeechState {
    return this.currentState;
  }

  /**
   * Check if TTS is currently speaking
   */
  isSpeaking(): boolean {
    return this.currentState === SpeechState.SPEAKING;
  }

  /**
   * Check if TTS is ready to speak
   */
  isReady(): boolean {
    return this.isInitialized && this.currentState === SpeechState.READY;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.speechQueue.length;
  }

  /**
   * Clear speech queue
   */
  clearQueue(): void {
    this.speechQueue = [];
    console.log('🗑️ TextToSpeechService: Speech queue cleared');
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: SpeechState, utterance?: string) => void): () => void {
    this.listeners.push(callback);
    
    // Send current state immediately
    callback(this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Set internal state and notify listeners
   */
  private setState(newState: SpeechState, utterance?: string): void {
    if (this.currentState !== newState) {
      console.log(`🔄 TextToSpeechService: State change: ${this.currentState} → ${newState}`);
      this.currentState = newState;
      
      this.listeners.forEach(callback => {
        try {
          callback(newState, utterance);
        } catch (error) {
          console.error('Error in TTS state change listener:', error);
        }
      });
    }
  }

  /**
   * Event handlers for TTS events
   */
  private handleSpeechStart = (event: any) => {
    console.log('🎤 TextToSpeechService: Speech started:', event);
    this.setState(SpeechState.SPEAKING, event.utteranceId);
  };

  private handleSpeechFinish = (event: any) => {
    console.log('✅ TextToSpeechService: Speech finished:', event);
    this.setState(SpeechState.READY);
  };

  private handleSpeechCancel = (event: any) => {
    console.log('❌ TextToSpeechService: Speech cancelled:', event);
    this.setState(SpeechState.STOPPED);
  };

  private handleSpeechError = (event: any) => {
    console.error('❌ TextToSpeechService: Speech error:', event);
    this.setState(SpeechState.ERROR);
  };

  private handleSpeechProgress = (event: any) => {
    // Optional: handle progress events for UI feedback
    console.log('📈 TextToSpeechService: Speech progress:', event);
  };

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    this.listeners = [];
    this.speechQueue = [];
    
    // Remove event listeners
    Tts.removeAllListeners('tts-start');
    Tts.removeAllListeners('tts-finish');
    Tts.removeAllListeners('tts-cancel');
    Tts.removeAllListeners('tts-error');
    Tts.removeAllListeners('tts-progress');
    
    this.isInitialized = false;
    console.log('🧹 TextToSpeechService: Service cleaned up');
  }
}

// Export singleton instance
let _textToSpeechService: TextToSpeechService | null = null;

export const getTextToSpeechService = (): TextToSpeechService => {
  if (!_textToSpeechService) {
    _textToSpeechService = new TextToSpeechService();
  }
  return _textToSpeechService;
};

// Export default instance
export const textToSpeechService = getTextToSpeechService();

// Helper function to check if service is available
export const isTextToSpeechServiceAvailable = (): boolean => {
  try {
    return getTextToSpeechService() != null;
  } catch (error) {
    console.error('Text-to-Speech service is not available:', error);
    return false;
  }
};

// Golf-specific TTS helper functions
export const golfTTSHelper = {
  /**
   * Welcome message for shot placement mode
   */
  welcomeToShotPlacement: (): Promise<void> => {
    return textToSpeechService.speak(
      "Welcome to shot placement mode. Tap anywhere on the map to select your target location.",
      10 // High priority
    );
  },

  /**
   * Club recommendation announcement
   */
  announceClubRecommendation: (club: string, distance: number): Promise<void> => {
    return textToSpeechService.speak(
      `Based on ${distance} yards, I recommend using a ${club}.`,
      8 // High priority
    );
  },

  /**
   * Shot placement confirmation
   */
  confirmShotPlacement: (distance: number): Promise<void> => {
    return textToSpeechService.speak(
      `Target placed at ${distance} yards. When you're ready, tap 'Take Shot' to begin.`,
      7
    );
  },

  /**
   * Shot in progress notification
   */
  shotInProgress: (): Promise<void> => {
    return textToSpeechService.speak(
      "Shot tracking active. Take your shot when ready.",
      6
    );
  },

  /**
   * Shot completed notification
   */
  shotCompleted: (): Promise<void> => {
    return textToSpeechService.speak(
      "Good shot! Select your next target location or move to the next hole.",
      5
    );
  },

  /**
   * Movement detected notification
   */
  movementDetected: (): Promise<void> => {
    return textToSpeechService.speak(
      "Movement detected. Shot tracking complete.",
      6
    );
  },

  /**
   * Error notifications
   */
  error: (message: string): Promise<void> => {
    return textToSpeechService.speak(
      `Error: ${message}. Please try again.`,
      9 // High priority for errors
    );
  },

  /**
   * Distance measurement
   */
  announceDistance: (distance: number, target: string = 'target'): Promise<void> => {
    return textToSpeechService.speak(
      `Distance to ${target}: ${distance} yards.`,
      4
    );
  },

  /**
   * General golf assistance
   */
  generalAssistance: (message: string): Promise<void> => {
    return textToSpeechService.speak(message, 3);
  }
};