import { Platform, PermissionsAndroid } from 'react-native';
import { ReactNativeEventEmitter } from '../utils/ReactNativeEventEmitter';
import { AUDIO_CONFIG, ERROR_MESSAGES } from '../utils/constants';
import { devLog, formatError } from '../utils/helpers';

// Import audio recording libraries
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

export interface AudioData {
  audio: string; // base64 encoded audio
  format: string;
  sampleRate: number;
}

export interface AudioRecorderConfig {
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
  format?: 'pcm16' | 'wav';
  enableRealTimeStreaming?: boolean;
}

/**
 * Unified Audio Recorder Service for React Native
 * Combines WebRTC and native audio recording capabilities
 * Automatically selects best available method based on platform and browser support
 */
export class AudioRecorderService extends ReactNativeEventEmitter {
  private isInitialized = false;
  private isRecording = false;
  private recordingTimer: NodeJS.Timeout | null = null;
  private audioLevelTimer: NodeJS.Timeout | null = null;
  private currentAudioLevel = 0;
  
  // WebRTC specific properties
  private mediaRecorder: any = null;
  private audioContext: any = null;
  private mediaStream: any = null;
  private audioWorklet: any = null;
  
  // Native recording specific properties
  private nativeRecorderInitialized = false;
  
  // Configuration
  private config: AudioRecorderConfig = {
    sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
    channels: AUDIO_CONFIG.CHANNELS,
    bitsPerSample: AUDIO_CONFIG.BITS_PER_SAMPLE,
    format: AUDIO_CONFIG.FORMAT,
    enableRealTimeStreaming: true,
  };
  
  private recordingMethod: 'webrtc' | 'native' | null = null;

  constructor(config?: Partial<AudioRecorderConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  async initialize(): Promise<void> {
    try {
      // Request permissions first
      await this.requestAudioPermissions();
      
      // Try WebRTC first (better for real-time streaming), fall back to native
      if (this.isWebRTCSupported()) {
        try {
          await this.initializeWebRTC();
          this.recordingMethod = 'webrtc';
          console.log('AudioRecorderService: Using WebRTC audio recording');
        } catch (error) {
          console.warn('AudioRecorderService: WebRTC failed, falling back to native:', error);
          await this.initializeNative();
          this.recordingMethod = 'native';
          console.log('AudioRecorderService: Using native audio recording');
        }
      } else {
        await this.initializeNative();
        this.recordingMethod = 'native';
        console.log('AudioRecorderService: Using native audio recording (WebRTC not supported)');
      }

      this.isInitialized = true;
      console.log('AudioRecorderService: Initialization complete');
    } catch (error) {
      console.error('AudioRecorderService: Failed to initialize:', error);
      throw error;
    }
  }

  private async requestAudioPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
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
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('AudioRecorderService: Permission request error:', err);
        return false;
      }
    }
    return true; // iOS permissions handled in Info.plist
  }

  private isWebRTCSupported(): boolean {
    // WebRTC is not natively supported in React Native environment
    // Return false to use native recording instead
    return false;
  }

  private async initializeWebRTC(): Promise<void> {
    // WebRTC is not supported in React Native environment
    // This method is kept for potential future web compatibility
    throw new Error('WebRTC not available in React Native environment');
  }

  private async initializeNative(): Promise<void> {
    // Configure native audio recording
    const options = {
      sampleRate: this.config.sampleRate || 16000,
      channels: this.config.channels || 1,
      bitsPerSample: this.config.bitsPerSample || 16,
      audioSource: 6, // VOICE_RECOGNITION on Android
      wavFile: 'temp_audio.wav',
    };

    AudioRecord.init(options);
    
    // Initialize Sound for playback if needed
    Sound.setCategory('PlayAndRecord');
    
    this.nativeRecorderInitialized = true;
  }

  private async setupAudioWorklet(source: any): Promise<void> {
    // AudioWorklet is not available in React Native
    throw new Error('AudioWorklet not supported in React Native environment');
  }

  private setupScriptProcessor(source: any): void {
    // ScriptProcessor is not available in React Native
    throw new Error('ScriptProcessor not supported in React Native environment');
  }

  private getAudioWorkletCode(): string {
    // Not used in React Native environment
    throw new Error('AudioWorklet code not available in React Native');
  }

  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.isRecording) {
      return;
    }

    try {
      this.isRecording = true;

      if (this.recordingMethod === 'webrtc') {
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } else if (this.recordingMethod === 'native') {
        AudioRecord.start();
        this.startNativeAudioCapture();
      }

      // Start audio level monitoring for both methods
      this.startAudioLevelMonitoring();

      console.log(`AudioRecorderService: Recording started (${this.recordingMethod})`);
    } catch (error) {
      this.isRecording = false;
      console.error('AudioRecorderService: Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      this.isRecording = false;

      if (this.recordingMethod === 'native') {
        AudioRecord.stop();
      }

      // Clear timers
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      if (this.audioLevelTimer) {
        clearInterval(this.audioLevelTimer);
        this.audioLevelTimer = null;
      }

      console.log(`AudioRecorderService: Recording stopped (${this.recordingMethod})`);
    } catch (error) {
      console.error('AudioRecorderService: Failed to stop recording:', error);
      throw error;
    }
  }

  private startNativeAudioCapture(): void {
    // For native recording, we need periodic audio data capture
    this.recordingTimer = setInterval(async () => {
      if (!this.isRecording) return;

      try {
        // Note: react-native-audio-record doesn't provide real-time buffer access
        // This is a placeholder - actual implementation would need custom native modules
        const audioData = await this.getCapturedAudioData();
        if (audioData && audioData.length > 0) {
          this.emit('audioData', {
            audio: audioData,
            format: this.config.format,
            sampleRate: this.config.sampleRate,
          });
        }
      } catch (error) {
        console.error('AudioRecorderService: Error capturing native audio:', error);
      }
    }, 100);
  }

  private async getCapturedAudioData(): Promise<string> {
    // Placeholder for native audio buffer capture
    // In production, this would require custom native modules
    return '';
  }

  private startAudioLevelMonitoring(): void {
    if (this.recordingMethod === 'native') {
      // For native recording, simulate audio level
      this.audioLevelTimer = setInterval(() => {
        if (!this.isRecording) return;

        const level = Math.random() * 0.5 + 0.1;
        this.currentAudioLevel = level;
        this.emit('audioLevel', level);
      }, 50);
    }
    // WebRTC audio level is handled by the audio worklet/processor
  }

  async cleanup(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording();
    }

    // Clean up timers
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.audioLevelTimer) {
      clearInterval(this.audioLevelTimer);
      this.audioLevelTimer = null;
    }

    // Clean up WebRTC resources
    if (this.audioWorklet) {
      try {
        this.audioWorklet.disconnect();
      } catch (error) {
        console.warn('AudioRecorderService: Error disconnecting worklet:', error);
      }
      this.audioWorklet = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('AudioRecorderService: Error closing audio context:', error);
      }
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.mediaStream = null;
    }

    this.isInitialized = false;
    this.recordingMethod = null;
    console.log('AudioRecorderService: Cleanup complete');
  }

  // Utility methods
  getRecordingState(): boolean {
    return this.isRecording;
  }

  getCurrentAudioLevel(): number {
    return this.currentAudioLevel;
  }

  getRecordingMethod(): 'webrtc' | 'native' | null {
    return this.recordingMethod;
  }

  isSupported(): boolean {
    return this.isWebRTCSupported() || this.isNativeRecordingAvailable();
  }

  private isNativeRecordingAvailable(): boolean {
    try {
      return !!(AudioRecord && Sound);
    } catch (error) {
      return false;
    }
  }

  // Helper methods for audio processing
  private convertFloat32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private calculateAudioLevel(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }
}

export default AudioRecorderService;