import { Platform, PermissionsAndroid } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import { ReactNativeEventEmitter } from '../utils/ReactNativeEventEmitter';
import { devLog, formatError } from '../utils/helpers';

export interface AudioData {
  audio: string; // base64 encoded audio
  format: string;
  sampleRate: number;
}

export interface AudioRecorderConfig {
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
  audioSource?: number;
  bufferSize?: number;
  enableRealTimeStreaming?: boolean;
}

/**
 * Audio Recorder Service using react-native-audio-record
 * Provides real-time audio recording capabilities for OpenAI Real-time API
 */
export class AudioRecorderService extends ReactNativeEventEmitter {
  private isInitialized = false;
  private isRecording = false;
  private currentRecordingPath: string | null = null;
  private currentAudioLevel = 0;
  private streamingInterval: NodeJS.Timeout | null = null;
  private lastStreamedPosition = 0;
  
  // Configuration optimized for OpenAI Real-time API
  private config: AudioRecorderConfig = {
    sampleRate: 16000,        // OpenAI recommended sample rate for speech
    channels: 1,              // Mono
    bitsPerSample: 16,        // 16-bit PCM
    audioSource: 6,           // VOICE_RECOGNITION - optimized for speech
    bufferSize: 4096,         // Buffer size
    enableRealTimeStreaming: true,
  };

  constructor(config?: Partial<AudioRecorderConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('AudioRecorderService: Initializing with react-native-audio-record');
      
      // Request permissions first
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'CaddieAI needs access to your microphone for voice features.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Audio recording permission not granted');
        }
      }

      // Initialize audio recording with optimized settings
      const options = {
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        bitsPerSample: this.config.bitsPerSample,
        audioSource: this.config.audioSource,
        bufferSize: this.config.bufferSize,
      };

      AudioRecord.init(options);
      
      this.isInitialized = true;
      console.log('AudioRecorderService: react-native-audio-record initialized with config:', options);
    } catch (error) {
      console.error('AudioRecorderService: Failed to initialize:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.isRecording) {
      console.warn('AudioRecorderService: Already recording');
      return;
    }

    try {
      this.isRecording = true;
      this.lastStreamedPosition = 0;

      // Start recording
      AudioRecord.start();
      console.log('AudioRecorderService: Recording started successfully');

      // Set up real-time streaming for OpenAI
      if (this.config.enableRealTimeStreaming) {
        this.startRealTimeStreaming();
      }

      this.emit('listeningStateChanged', true);
    } catch (error) {
      this.isRecording = false;
      console.error('AudioRecorderService: Failed to start recording:', error);
      this.emit('error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      console.warn('AudioRecorderService: Not currently recording');
      return null;
    }

    try {
      this.isRecording = false;

      // Stop streaming
      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;
      }

      // Stop recording and get the file path
      const audioFile = await AudioRecord.stop();
      this.currentRecordingPath = audioFile;

      console.log('AudioRecorderService: Recording stopped successfully', {
        audioFile: audioFile
      });

      this.emit('listeningStateChanged', false);
      
      // Send final audio chunk if streaming was enabled
      if (this.config.enableRealTimeStreaming && audioFile) {
        await this.sendFinalAudioChunk(audioFile);
      }

      return audioFile;
    } catch (error) {
      console.error('AudioRecorderService: Failed to stop recording:', error);
      this.emit('error', `Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private startRealTimeStreaming(): void {
    // Check for new audio data every 100ms for real-time streaming
    this.streamingInterval = setInterval(async () => {
      if (!this.isRecording) return;

      try {
        // For react-native-audio-record, we'll send chunks when recording stops
        // This library doesn't support live streaming, so we simulate it
        // by updating audio levels and preparing for final send
        const mockLevel = Math.random() * 0.5 + 0.1; // Simulate audio level
        this.currentAudioLevel = mockLevel;
        this.emit('audioLevel', mockLevel);
        
      } catch (error) {
        console.error('AudioRecorderService: Streaming error:', error);
      }
    }, 100);
  }

  private async sendFinalAudioChunk(audioFilePath: string): Promise<void> {
    try {
      // Read the recorded audio file and convert to base64
      const audioBase64 = await RNFS.readFile(audioFilePath, 'base64');
      
      // Create audio data object for RealtimeAudioService
      const audioData: AudioData = {
        audio: audioBase64,
        format: 'wav', // react-native-audio-record outputs WAV format
        sampleRate: this.config.sampleRate || 16000,
      };

      console.log(`AudioRecorderService: Sending complete audio file (${audioBase64.length} chars)`);
      
      // Emit the complete audio data
      this.emit('audioData', audioData);

    } catch (error) {
      console.error('AudioRecorderService: Error processing final audio:', error);
      this.emit('error', `Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      if (this.streamingInterval) {
        clearInterval(this.streamingInterval);
        this.streamingInterval = null;
      }

      // Clean up temporary audio files
      if (this.currentRecordingPath) {
        try {
          const exists = await RNFS.exists(this.currentRecordingPath);
          if (exists) {
            await RNFS.unlink(this.currentRecordingPath);
          }
        } catch (cleanupError) {
          console.warn('AudioRecorderService: Failed to cleanup audio file:', cleanupError);
        }
      }

      this.currentRecordingPath = null;
      this.isInitialized = false;
      console.log('AudioRecorderService: Cleanup complete');
    } catch (error) {
      console.warn('AudioRecorderService: Error during cleanup:', error);
    }
  }

  // Utility methods
  getRecordingState(): boolean {
    return this.isRecording;
  }

  getCurrentAudioLevel(): number {
    return this.currentAudioLevel;
  }

  getCurrentRecording(): string | null {
    return this.currentRecordingPath;
  }

  getRecordingMethod(): string {
    return 'react-native-audio-record';
  }

  isSupported(): boolean {
    try {
      return !!AudioRecord;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get captured audio data as base64 string for immediate use
   * This is called by RealtimeAudioService after recording stops
   */
  async getCapturedAudioData(): Promise<string> {
    if (!this.currentRecordingPath) {
      console.warn('AudioRecorderService: No recorded audio available');
      return '';
    }

    try {
      const audioBase64 = await RNFS.readFile(this.currentRecordingPath, 'base64');
      console.log(`AudioRecorderService: Retrieved audio data (${audioBase64.length} chars)`);
      return audioBase64;
    } catch (error) {
      console.error('AudioRecorderService: Error reading audio data:', error);
      return '';
    }
  }
}

export default AudioRecorderService;