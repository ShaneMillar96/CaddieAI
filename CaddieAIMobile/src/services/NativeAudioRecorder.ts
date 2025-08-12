import { EventEmitter } from 'events';
import { NativeModules, Platform } from 'react-native';

// Import audio recording libraries
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';

export interface AudioData {
  audio: string; // base64 encoded audio
  format: string;
  sampleRate: number;
}

export class NativeAudioRecorder extends EventEmitter {
  private isInitialized = false;
  private isRecording = false;
  private recordingTimer: NodeJS.Timeout | null = null;
  private audioLevelTimer: NodeJS.Timeout | null = null;
  private currentAudioLevel = 0;

  async initialize(): Promise<void> {
    try {
      // Configure audio recording options
      const options = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // VOICE_RECOGNITION on Android
        wavFile: 'temp_audio.wav',
      };

      AudioRecord.init(options);

      // Initialize Sound for playback (if needed)
      Sound.setCategory('PlayAndRecord');

      this.isInitialized = true;
      console.log('Native audio recorder initialized');
    } catch (error) {
      console.error('Failed to initialize native audio recorder:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.isRecording) {
      return;
    }

    try {
      AudioRecord.start();
      this.isRecording = true;

      // Start periodic audio data capture
      this.startAudioCapture();
      
      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      console.log('Native recording started');
    } catch (error) {
      console.error('Failed to start native recording:', error);
      throw error;
    }
  }

  private startAudioCapture() {
    // Capture audio data every 100ms for real-time streaming
    this.recordingTimer = setInterval(async () => {
      if (!this.isRecording) return;

      try {
        // Get current audio data
        const audioData = await this.getCapturedAudioData();
        if (audioData && audioData.length > 0) {
          this.emit('audioData', {
            audio: audioData,
            format: 'pcm16',
            sampleRate: 16000,
          });
        }
      } catch (error) {
        console.error('Error capturing audio data:', error);
      }
    }, 100);
  }

  private startAudioLevelMonitoring() {
    // Monitor audio level for visual feedback
    this.audioLevelTimer = setInterval(() => {
      if (!this.isRecording) return;

      // Simulate audio level (in real implementation, this would come from actual audio analysis)
      const level = Math.random() * 0.5 + 0.1; // Random level between 0.1 and 0.6
      this.currentAudioLevel = level;
      this.emit('audioLevel', level);
    }, 50);
  }

  private async getCapturedAudioData(): Promise<string> {
    try {
      // In a real implementation, this would capture the current audio buffer
      // For now, we'll return an empty string as AudioRecord doesn't provide
      // real-time buffer access in its current API
      
      // This is a placeholder - actual implementation would need:
      // 1. Custom native module to provide real-time audio buffers
      // 2. Or use react-native-audio-recorder-player with streaming
      // 3. Or implement WebRTC-based solution

      return '';
    } catch (error) {
      console.error('Error getting audio data:', error);
      return '';
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      AudioRecord.stop();
      this.isRecording = false;

      // Clear timers
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      if (this.audioLevelTimer) {
        clearInterval(this.audioLevelTimer);
        this.audioLevelTimer = null;
      }

      console.log('Native recording stopped');
    } catch (error) {
      console.error('Failed to stop native recording:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording();
    }

    // Clear any remaining timers
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.audioLevelTimer) {
      clearInterval(this.audioLevelTimer);
      this.audioLevelTimer = null;
    }

    this.isInitialized = false;
    console.log('Native audio recorder cleaned up');
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  getCurrentAudioLevel(): number {
    return this.currentAudioLevel;
  }

  // Utility method to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Utility method to convert Float32Array to PCM16
  private convertFloat32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7FFF, true);
    }
    
    return buffer;
  }

  isSupported(): boolean {
    // Check if the required native modules are available
    try {
      return AudioRecord && Sound;
    } catch (error) {
      return false;
    }
  }
}

// Note: This implementation is a basic skeleton. For production use, you would need:
// 1. A proper real-time audio streaming solution
// 2. Custom native modules for iOS/Android audio capture
// 3. Or use libraries like react-native-audio-recorder-player with streaming capabilities
// 4. Proper audio format conversion and buffering
// 5. Error handling for different device capabilities

export default NativeAudioRecorder;