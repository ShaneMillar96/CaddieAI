import { ReactNativeEventEmitter } from '../utils/ReactNativeEventEmitter';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { AudioRecorderService, AudioData as RecorderAudioData } from './AudioRecorderService';
import Sound from 'react-native-sound';

export interface RealtimeAudioConfig {
  model?: string;
  voice?: string;
  instructions?: string;
  inputAudioFormat?: string;
  outputAudioFormat?: string;
  enableVAD?: boolean;
  vadThreshold?: number;
  temperature?: number;
}

export interface AudioData {
  audio: string; // base64 encoded audio
  format: string;
  sampleRate: number;
}

export interface TranscriptionData {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export class RealtimeAudioService extends ReactNativeEventEmitter {
  private websocket: WebSocket | null = null;
  private audioRecorder: AudioRecorderService | null = null;
  private isConnected = false;
  private isRecording = false;
  private roundId: number | null = null;
  private authToken: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;

  private config: RealtimeAudioConfig = {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'echo',
    instructions: 'You are a helpful golf caddie assistant. Provide brief, encouraging advice.',
    inputAudioFormat: 'pcm16',
    outputAudioFormat: 'pcm16',
    enableVAD: true,
    vadThreshold: 0.5,
    temperature: 0.7,
  };

  constructor(config?: Partial<RealtimeAudioConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setupAudioRecorder();
  }

  private async setupAudioRecorder() {
    try {
      // Request permissions first
      await this.requestAudioPermissions();

      // Suppress NativeEventEmitter warnings during AudioRecorderService initialization
      const originalConsoleWarn = console.warn;
      console.warn = (message, ...args) => {
        if (typeof message === 'string' && message.includes('NativeEventEmitter')) {
          return; // Suppress NativeEventEmitter warnings
        }
        originalConsoleWarn(message, ...args);
      };

      // Initialize unified audio recorder service
      this.audioRecorder = new AudioRecorderService({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        format: 'pcm16',
        enableRealTimeStreaming: true
      });
      
      await this.audioRecorder.initialize();
      console.log(`RealtimeAudioService: Using ${this.audioRecorder.getRecordingMethod()} audio recorder`);

      // Restore original console.warn
      console.warn = originalConsoleWarn;

      // Set up audio recorder event listeners
      this.audioRecorder.on('audioData', (audioData: RecorderAudioData) => {
        this.sendAudioData(audioData);
      });

      this.audioRecorder.on('audioLevel', (level: number) => {
        this.emit('audioLevelUpdate', level);
      });

      this.audioRecorder.on('error', (error: Error) => {
        console.error('RealtimeAudioService: Audio recorder error:', error);
        this.emit('error', `Audio recording error: ${error.message}`);
      });

    } catch (error) {
      console.error('RealtimeAudioService: Failed to setup audio recorder:', error);
      this.emit('error', `Failed to setup audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async requestAudioPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'CaddieAI needs access to your microphone to enable voice chat with the AI caddie.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS permissions handled in Info.plist
  }

  async connect(roundId: number, authToken: string): Promise<void> {
    this.roundId = roundId;
    this.authToken = authToken;

    return new Promise((resolve, reject) => {
      try {
        // Use HTTP for local development, HTTPS for production
        const protocol = __DEV__ ? 'ws' : 'wss';
        const host = __DEV__ ? 'localhost:5277' : 'api.caddieai.com';
        const wsUrl = `${protocol}://${host}/api/realtimeaudio/connect/${roundId}?token=${encodeURIComponent(authToken)}`;

        console.log('Connecting to WebSocket:', wsUrl);
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send initial session configuration for audio-only responses
          this.configureAudioOnlySession();
          
          this.emit('connected');
          resolve();
        };

        this.websocket.onmessage = (event: any) => {
          this.handleWebSocketMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected');
          
          // Attempt reconnection if not explicitly closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', 'WebSocket connection failed');
          reject(new Error('WebSocket connection failed'));
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', 'Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(async () => {
      try {
        if (this.roundId && this.authToken) {
          await this.connect(this.roundId, this.authToken);
        }
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.emit('error', `Reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Configure the OpenAI session for audio-only responses (no function calls)
   */
  private configureAudioOnlySession(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log('🎛️ Configuring OpenAI session for audio-only responses');

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'], // Enable both text and audio
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: this.config.inputAudioFormat,
        output_audio_format: this.config.outputAudioFormat,
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: this.config.enableVAD ? {
          type: 'server_vad',
          threshold: this.config.vadThreshold,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        } : null,
        tools: [], // Explicitly set no tools to prevent function calls
        tool_choice: 'none', // Disable function calling
        temperature: this.config.temperature,
        max_response_output_tokens: 4096,
      }
    };

    console.log('🎛️ Sending session configuration:', JSON.stringify(sessionConfig, null, 2));
    this.websocket.send(JSON.stringify(sessionConfig));
  }

  private handleWebSocketMessage(event: any) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        // Session management
        case 'session.created':
          console.log('✅ OpenAI session created', data.session ? {
            model: data.session.model,
            modalities: data.session.modalities,
            voice: data.session.voice,
            input_audio_format: data.session.input_audio_format,
            output_audio_format: data.session.output_audio_format,
            tools: data.session.tools?.length || 0,
            tool_choice: data.session.tool_choice
          } : 'No session data');
          this.emit('sessionCreated');
          break;
          
        case 'session.updated':
          console.log('🔄 OpenAI session updated', data.session ? {
            modalities: data.session.modalities,
            voice: data.session.voice,
            tools: data.session.tools?.length || 0,
            tool_choice: data.session.tool_choice
          } : 'No session data');
          this.emit('sessionUpdated', data.session);
          break;
          
        // Conversation and response management
        case 'conversation.item.created':
          console.log('📝 Conversation item created:', data.item?.type || 'unknown');
          this.emit('conversationItemCreated', data.item);
          break;
          
        case 'response.created':
          console.log('🎯 Response created:', data.response?.id);
          this.emit('responseCreated', data.response);
          break;
          
        case 'response.output_item.added':
          console.log('📤 Response output item added:', data.item?.type);
          if (data.item?.type === 'function_call') {
            console.warn('⚠️ OpenAI returned function_call instead of audio - check session configuration');
          }
          this.emit('responseOutputItemAdded', data.item);
          break;
          
        case 'response.output_item.done':
          console.log('✅ Response output item completed');
          this.emit('responseOutputItemDone', data.item);
          break;
          
        case 'response.content_part.added':
          console.log('📄 Response content part added:', data.part?.type);
          this.emit('responseContentPartAdded', data.part);
          break;
          
        case 'response.content_part.done':
          console.log('✅ Response content part completed');
          this.emit('responseContentPartDone', data.part);
          break;
          
        case 'response.done':
          console.log('🏁 Response completed');
          this.emit('responseCompleted', data.response);
          break;
          
        // Audio transcription
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            console.log('📝 Audio transcription completed:', data.transcript);
            this.emit('transcript', data.transcript, true);
          }
          break;
          
        case 'conversation.item.input_audio_transcription.partial':
          if (data.transcript) {
            this.emit('transcript', data.transcript, false);
          }
          break;
          
        case 'response.audio_transcript.delta':
          if (data.delta) {
            this.emit('audioTranscriptDelta', data.delta);
          }
          break;
          
        case 'response.audio_transcript.done':
          console.log('📝 Audio transcript completed:', data.transcript);
          this.emit('audioTranscriptComplete', data.transcript);
          break;
          
        // Audio playback
        case 'response.audio.delta':
          if (data.delta) {
            console.log('🎵 Received audio delta:', data.delta.length, 'bytes');
            this.playAudioDelta(data.delta);
          } else {
            console.warn('⚠️ Received empty audio delta');
          }
          break;
          
        case 'response.audio.started':
          console.log('🎵 Audio response started - resetting audio buffer');
          this.isAudioResponseComplete = false;
          this.pendingPlayback = false;
          // Clear any previous audio buffer for new response
          this.audioBuffer = [];
          this.emit('speakingStateChanged', true);
          break;
          
        case 'response.audio.done':
          console.log('🎵 Audio response completed - triggering final playback');
          this.isAudioResponseComplete = true;
          this.emit('speakingStateChanged', false);
          
          // Trigger playback of all buffered audio now that response is complete
          if (this.audioBuffer.length > 0 && !this.isPlayingAudio && !this.pendingPlayback) {
            this.pendingPlayback = true;
            setTimeout(() => this.processAudioBuffer(), 100);
          }
          break;
          
        // Function calling
        case 'response.function_call_arguments.delta':
          if (data.delta) {
            this.emit('functionCallArgumentsDelta', data.delta);
          }
          break;
          
        case 'response.function_call_arguments.done':
          console.log('⚙️ Function call arguments completed:', data.arguments);
          this.emit('functionCallArgumentsComplete', data.arguments);
          break;
          
        // Text responses
        case 'response.text.delta':
          if (data.delta) {
            this.emit('assistantTextDelta', data.delta);
          }
          break;
          
        case 'response.text.done':
          if (data.text) {
            console.log('💬 Text response completed:', data.text);
            this.emit('assistantMessage', data.text);
          }
          break;
          
        // Input audio buffer
        case 'input_audio_buffer.speech_started':
          console.log('🎤 Speech detection started');
          this.emit('listeningStateChanged', true);
          break;
          
        case 'input_audio_buffer.speech_stopped':
          console.log('🎤 Speech detection stopped');
          this.emit('listeningStateChanged', false);
          break;
          
        // Rate limits and errors
        case 'rate_limits.updated':
          console.log('⚡ Rate limits updated:', data.rate_limits);
          this.emit('rateLimitsUpdated', data.rate_limits);
          break;
          
        case 'error':
          console.error('❌ OpenAI error:', {
            type: data.error?.type,
            code: data.error?.code, 
            message: data.error?.message,
            param: data.error?.param,
            event_id: data.event_id
          });
          this.emit('error', data.error?.message || 'Unknown OpenAI error');
          break;
          
        default:
          console.log('❓ Unhandled message type:', data.type, data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private audioBuffer: ArrayBuffer[] = [];
  private isPlayingAudio = false;
  private audioQueue: Sound[] = [];
  private currentlyPlaying: Sound | null = null;
  private isAudioResponseComplete = false;
  private pendingPlayback = false;

  private async playAudioDelta(audioData: string) {
    try {
      // Convert base64 audio data to ArrayBuffer
      const binaryString = atob(audioData);
      const buffer = new ArrayBuffer(binaryString.length);
      const view = new Uint8Array(buffer);
      
      for (let i = 0; i < binaryString.length; i++) {
        view[i] = binaryString.charCodeAt(i);
      }
      
      // Always add to buffer, but don't start playback immediately
      this.audioBuffer.push(buffer);
      console.log(`🎵 Audio chunk added to buffer. Buffer size: ${this.audioBuffer.length} chunks`);
      
      // Only trigger playback if audio response is complete and we're not already playing
      if (this.isAudioResponseComplete && !this.isPlayingAudio && !this.pendingPlayback) {
        this.pendingPlayback = true;
        // Small delay to ensure all chunks are buffered
        setTimeout(() => this.processAudioBuffer(), 100);
      }
      
    } catch (error) {
      console.error('Error processing audio delta:', error);
    }
  }

  private async processAudioBuffer() {
    // Check if we should process the buffer
    if (this.isPlayingAudio || this.audioBuffer.length === 0) {
      console.log(`🎵 Skipping buffer processing: isPlaying=${this.isPlayingAudio}, bufferLength=${this.audioBuffer.length}`);
      this.pendingPlayback = false;
      return;
    }

    // Only process if audio response is complete or if we have a significant buffer
    if (!this.isAudioResponseComplete && this.audioBuffer.length < 10) {
      console.log(`🎵 Waiting for more audio chunks or completion signal. Buffer: ${this.audioBuffer.length} chunks, Complete: ${this.isAudioResponseComplete}`);
      this.pendingPlayback = false;
      return;
    }

    this.isPlayingAudio = true;
    this.pendingPlayback = false;

    try {
      console.log(`🎵 Processing complete audio response: ${this.audioBuffer.length} chunks`);
      
      // Combine all audio chunks into a single buffer for complete playback
      const totalLength = this.audioBuffer.reduce((sum, buffer) => sum + buffer.byteLength, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      
      // Process all buffered chunks at once
      const chunksToProcess = [...this.audioBuffer]; // Copy array to avoid modification during iteration
      this.audioBuffer = []; // Clear buffer immediately
      
      for (const audioData of chunksToProcess) {
        const view = new Uint8Array(audioData);
        combinedBuffer.set(view, offset);
        offset += view.length;
      }
      
      console.log(`🎵 Combined ${chunksToProcess.length} chunks into ${combinedBuffer.byteLength} bytes`);
      
      // Convert PCM16 to WAV format for playback
      const wavBuffer = this.pcm16ToWav(combinedBuffer, 24000, 1); // 24kHz, mono
      
      // Create temporary file path for audio playback
      const tempFilePath = await this.createTempAudioFile(wavBuffer);
      
      if (tempFilePath) {
        await this.playWavFile(tempFilePath);
      } else {
        // Fallback: just emit events for UI feedback
        this.emit('audioPlaying', {
          bufferSize: combinedBuffer.byteLength,
          remainingChunks: 0
        });
        
        // Simulate playback duration based on audio length
        const estimatedDurationMs = (combinedBuffer.byteLength / 2 / 24000) * 1000; // PCM16 @ 24kHz
        await new Promise(resolve => setTimeout(resolve, Math.max(1000, estimatedDurationMs)));
      }

      console.log('✅ Complete audio playback sequence finished');
      this.emit('audioPlaybackComplete');
      
    } catch (error) {
      console.error('Error processing audio buffer:', error);
      this.emit('error', `Audio playback error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isPlayingAudio = false;
      this.isAudioResponseComplete = false; // Reset for next response
    }
  }

  /**
   * Convert PCM16 audio data to WAV format
   */
  private pcm16ToWav(pcmData: Uint8Array, sampleRate: number, channels: number): Uint8Array {
    const dataLength = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true); // byte rate
    view.setUint16(32, channels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Copy PCM data
    const wavData = new Uint8Array(buffer);
    wavData.set(pcmData, 44);
    
    return wavData;
  }

  /**
   * Create temporary audio file for playback
   */
  private async createTempAudioFile(audioData: Uint8Array): Promise<string | null> {
    try {
      const RNFS = require('react-native-fs');
      const tempPath = `${RNFS.CachesDirectoryPath}/temp_audio_${Date.now()}.wav`;
      
      // Convert Uint8Array to base64 string using chunked approach to avoid stack overflow
      const base64Audio = this.arrayBufferToBase64(audioData);
      
      await RNFS.writeFile(tempPath, base64Audio, 'base64');
      return tempPath;
      
    } catch (error) {
      console.error('Error creating temp audio file:', error);
      return null;
    }
  }

  /**
   * Convert ArrayBuffer/Uint8Array to base64 string using chunked approach
   * to prevent stack overflow with large audio data
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    const chunkSize = 8192; // Process 8KB chunks to avoid stack overflow
    let result = '';
    
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      const chunkStr = String.fromCharCode.apply(null, Array.from(chunk));
      result += chunkStr;
    }
    
    return btoa(result);
  }

  /**
   * Play WAV file using react-native-sound
   */
  private async playWavFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Initialize sound system
        Sound.setCategory('Playback');
        
        const sound = new Sound(filePath, '', (error) => {
          if (error) {
            console.error('Failed to load sound:', error);
            reject(error);
            return;
          }

          console.log('🎵 Playing AI audio response');
          this.emit('speakingStateChanged', true);
          
          sound.play((success) => {
            this.emit('speakingStateChanged', false);
            
            if (success) {
              console.log('✅ Audio playback completed successfully');
            } else {
              console.warn('⚠️ Audio playback failed');
            }
            
            // Clean up
            sound.release();
            this.cleanupTempFile(filePath);
            resolve();
          });
        });
        
        // Set volume to maximum
        sound.setVolume(1.0);
        
      } catch (error) {
        console.error('Error playing audio file:', error);
        this.emit('speakingStateChanged', false);
        this.cleanupTempFile(filePath);
        reject(error);
      }
    });
  }

  /**
   * Clean up temporary audio file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const RNFS = require('react-native-fs');
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('🧹 Cleaned up temp audio file');
      }
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to realtime service');
    }

    if (!this.audioRecorder) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.isRecording) {
      return; // Already recording
    }

    try {
      await this.audioRecorder.startRecording();
      this.isRecording = true;
      this.emit('listeningStateChanged', true);
      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.audioRecorder) {
      return;
    }

    try {
      await this.audioRecorder.stopRecording();
      this.isRecording = false;
      this.emit('listeningStateChanged', false);
      console.log('Stopped recording');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  private sendAudioData(audioData: RecorderAudioData) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'input_audio_buffer.append',
      audio: audioData.audio
    };

    this.websocket.send(JSON.stringify(message));
  }

  async interrupt(): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'response.cancel'
    };

    this.websocket.send(JSON.stringify(message));
    this.emit('speakingStateChanged', false);
  }

  async sendTextMessage(text: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to realtime service');
    }

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    this.websocket.send(JSON.stringify(message));
    
    // Trigger response
    const responseMessage = {
      type: 'response.create'
    };
    
    this.websocket.send(JSON.stringify(responseMessage));
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    
    if (this.isRecording) {
      await this.stopRecording();
    }

    // Stop any current audio playback
    if (this.currentlyPlaying) {
      this.currentlyPlaying.stop(() => {
        this.currentlyPlaying?.release();
        this.currentlyPlaying = null;
      });
    }

    // Clean up audio queue
    this.audioQueue.forEach(sound => {
      sound.stop(() => sound.release());
    });
    this.audioQueue = [];

    if (this.websocket) {
      this.websocket.close(1000, 'User disconnected');
      this.websocket = null;
    }

    if (this.audioRecorder) {
      await this.audioRecorder.cleanup();
    }

    // Clear audio buffer and reset state
    this.audioBuffer = [];
    this.isPlayingAudio = false;
    this.isAudioResponseComplete = false;
    this.pendingPlayback = false;

    console.log('Disconnected from realtime service');
  }

  updateConfig(newConfig: Partial<RealtimeAudioConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const sessionUpdate = {
        type: 'session.update',
        session: {
          instructions: this.config.instructions,
          voice: this.config.voice,
          input_audio_format: this.config.inputAudioFormat,
          output_audio_format: this.config.outputAudioFormat,
          temperature: this.config.temperature,
          turn_detection: this.config.enableVAD ? {
            type: 'server_vad',
            threshold: this.config.vadThreshold,
            prefix_padding_ms: 300,
            silence_duration_ms: 200
          } : null
        }
      };
      
      this.websocket.send(JSON.stringify(sessionUpdate));
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }
}