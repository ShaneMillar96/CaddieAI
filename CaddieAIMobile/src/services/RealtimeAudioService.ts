import { ReactNativeEventEmitter } from '../utils/ReactNativeEventEmitter';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { AudioRecorderService, AudioData as RecorderAudioData } from './AudioRecorderService';

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
        const host = __DEV__ ? 'localhost:5000' : 'api.caddieai.com';
        const wsUrl = `${protocol}://${host}/api/realtimeaudio/connect/${roundId}?token=${encodeURIComponent(authToken)}`;

        console.log('Connecting to WebSocket:', wsUrl);
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
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

  private handleWebSocketMessage(event: any) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'session.created':
          console.log('OpenAI session created');
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          if (data.transcript) {
            this.emit('transcript', data.transcript, true);
          }
          break;
          
        case 'conversation.item.input_audio_transcription.partial':
          if (data.transcript) {
            this.emit('transcript', data.transcript, false);
          }
          break;
          
        case 'response.audio.delta':
          if (data.delta) {
            this.playAudioDelta(data.delta);
          }
          break;
          
        case 'response.text.delta':
          if (data.delta) {
            this.emit('assistantTextDelta', data.delta);
          }
          break;
          
        case 'response.text.done':
          if (data.text) {
            this.emit('assistantMessage', data.text);
          }
          break;
          
        case 'input_audio_buffer.speech_started':
          this.emit('listeningStateChanged', true);
          break;
          
        case 'input_audio_buffer.speech_stopped':
          this.emit('listeningStateChanged', false);
          break;
          
        case 'response.audio.started':
          this.emit('speakingStateChanged', true);
          break;
          
        case 'response.audio.done':
          this.emit('speakingStateChanged', false);
          break;
          
        case 'error':
          console.error('OpenAI error:', data);
          this.emit('error', data.error?.message || 'Unknown OpenAI error');
          break;
          
        default:
          console.log('Unhandled message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private async playAudioDelta(audioData: string) {
    // TODO: Implement audio playback
    // This would typically involve converting the base64 audio data
    // and playing it through the device speakers
    console.log('Playing audio delta (not implemented)');
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

    if (this.websocket) {
      this.websocket.close(1000, 'User disconnected');
      this.websocket = null;
    }

    if (this.audioRecorder) {
      await this.audioRecorder.cleanup();
    }

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