import { RealtimeClient } from '@openai/realtime-api-beta';
import { buildWebSocketUrl, buildWebSocketUrls } from '../config/api';
import TokenStorage from './tokenStorage';
import NetInfo from '@react-native-community/netinfo';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useCallback, useRef } from 'react';
import Sound from 'react-native-sound';
import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

export interface RealtimeAudioConfig {
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  temperature?: number;
  enableTranscription?: boolean;
  turnDetection?: 'server_vad';
}

export interface RealtimeSessionInfo {
  sessionId: string;
  userId: number;
  roundId: number;
  startedAt: string;
  isActive: boolean;
}

export interface AudioEvent {
  type: 'audio_started' | 'audio_ended' | 'transcript_received' | 'response_received' | 'error';
  data?: any;
  timestamp: string;
}

/**
 * React Native service for OpenAI Realtime Audio API integration
 * Provides natural voice conversation with AI golf caddie
 */
export class RealtimeAudioService {
  private client: RealtimeClient | null = null;
  private currentSession: RealtimeSessionInfo | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private eventListeners: Array<(event: AudioEvent) => void> = [];
  
  // Audio context and processing
  private audioContext: any | null = null;
  private mediaStream: any | null = null;
  private isRecording: boolean = false;
  
  // Audio playback
  private audioQueue: string[] = [];
  private isPlayingAudio: boolean = false;
  private currentSound: Sound | null = null;
  private audioBufferCount: number = 0;

  constructor() {
    console.log('🎙️ RealtimeAudioService: Initialized');
  }

  /**
   * Connect to realtime audio session via backend WebSocket relay
   * Enhanced with react-use-websocket for better reliability
   */
  async connect(userId: number, roundId: number, config?: RealtimeAudioConfig): Promise<boolean> {
    if (this.isConnecting || this.isConnected) {
      console.warn('⚠️ RealtimeAudioService: Already connecting or connected');
      return this.isConnected;
    }

    this.isConnecting = true;

    try {
      console.log('🔌 RealtimeAudioService: Starting enhanced WebSocket connection...');

      // Check network connectivity before attempting connection
      const networkState = await NetInfo.fetch();
      console.log('📶 RealtimeAudioService: Network state:', {
        type: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable,
        details: networkState.details
      });

      if (!networkState.isConnected) {
        throw new Error('Device is not connected to network');
      }

      // Get auth token
      const token = await TokenStorage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Get WebSocket URLs for fallback
      const wsUrls = buildWebSocketUrls(`api/RealtimeAudio/connect/${roundId}`);
      
      // Try each URL with enhanced connection logic
      let connectionSuccessful = false;
      let successfulUrl = '';

      for (const baseUrl of wsUrls) {
        const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;
        console.log(`🌐 RealtimeAudioService: Trying WebSocket URL: ${wsUrl}`);

        try {
          // Create enhanced WebSocket connection with better error handling
          const testResult = await this.testWebSocketConnection(wsUrl);
          
          if (testResult.success) {
            console.log(`✅ RealtimeAudioService: Successfully connected to ${wsUrl}`);
            successfulUrl = wsUrl;
            connectionSuccessful = true;
            
            // Store the working URL for future use
            this.workingUrl = wsUrl;
            break;
          } else {
            console.log(`❌ RealtimeAudioService: Failed to connect to ${wsUrl}: ${testResult.error}`);
          }
        } catch (error: any) {
          console.log(`❌ RealtimeAudioService: Exception with URL ${wsUrl}:`, error.message);
          continue;
        }
      }

      if (!connectionSuccessful) {
        const errorMsg = `All WebSocket URLs failed. Tried: ${wsUrls.join(', ')}`;
        console.warn('⚠️ RealtimeAudioService: WebSocket connection failed - backend may not be running');
        throw new Error(errorMsg);
      }

      // Set up the persistent WebSocket connection
      await this.setupPersistentConnection(successfulUrl);

      // Connection successful
      this.isConnected = true;
      this.isConnecting = false;
      this.currentSession = {
        sessionId: `session-${Date.now()}`,
        userId,
        roundId,
        startedAt: new Date().toISOString(),
        isActive: true
      };

      console.log('✅ RealtimeAudioService: Enhanced WebSocket connection established');
      this.emitEvent({ type: 'audio_started', timestamp: new Date().toISOString() });
      return true;

    } catch (error: any) {
      console.error('❌ RealtimeAudioService: Connection failed:', error.message);
      
      this.isConnecting = false;
      this.cleanup();
      
      this.emitEvent({ 
        type: 'error', 
        data: { message: `Enhanced connection failed: ${error.message}` }, 
        timestamp: new Date().toISOString() 
      });
      
      return false;
    }
  }

  private workingUrl: string = '';
  private nativeWebSocket: WebSocket | null = null;

  /**
   * Test WebSocket connection with better error handling
   */
  private testWebSocketConnection(url: string): Promise<{success: boolean, error?: string}> {
    return new Promise((resolve) => {
      const timeoutMs = 3000; // Reduced to 3 second timeout per URL for faster fallback
      let isResolved = false;
      let testSocket: WebSocket | null = null;

      const cleanup = () => {
        if (testSocket && testSocket.readyState === WebSocket.OPEN) {
          testSocket.close();
        }
        testSocket = null;
      };

      try {
        testSocket = new WebSocket(url);

        testSocket.onopen = () => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({ success: true });
          }
        };

        testSocket.onerror = (error: any) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({ success: false, error: error.message || 'Connection refused' });
          }
        };

        testSocket.onclose = (event) => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({ success: false, error: `Connection closed (code: ${event.code})` });
          }
        };

        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve({ success: false, error: 'Connection timeout' });
          }
        }, timeoutMs);

      } catch (error: any) {
        if (!isResolved) {
          isResolved = true;
          resolve({ success: false, error: error.message });
        }
      }
    });
  }

  /**
   * Set up persistent WebSocket connection with reconnection logic
   */
  private async setupPersistentConnection(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.nativeWebSocket = new WebSocket(url);

        this.nativeWebSocket.onopen = () => {
          console.log('🎉 RealtimeAudioService: Persistent WebSocket connection opened');
          
          // Create RealtimeClient wrapper
          this.client = this.createRealtimeClientWrapper(this.nativeWebSocket!);
          
          // Set up event handlers
          this.setupWebSocketHandlers(this.nativeWebSocket!);
          
          resolve();
        };

        this.nativeWebSocket.onerror = (error: any) => {
          console.error('❌ RealtimeAudioService: Persistent WebSocket error:', error);
          reject(new Error('Failed to establish persistent connection'));
        };

        this.nativeWebSocket.onclose = (event) => {
          console.log(`🔌 RealtimeAudioService: Persistent WebSocket closed (code: ${event.code})`);
          this.handleConnectionLoss();
        };

      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Handle connection loss with automatic reconnection
   */
  private handleConnectionLoss(): void {
    if (this.isConnected) {
      this.isConnected = false;
      this.emitEvent({
        type: 'error',
        data: { message: 'WebSocket connection lost' },
        timestamp: new Date().toISOString()
      });
      
      // Attempt reconnection after a delay
      setTimeout(() => {
        if (this.workingUrl && this.currentSession) {
          console.log('🔄 RealtimeAudioService: Attempting to reconnect...');
          this.connect(this.currentSession.userId, this.currentSession.roundId);
        }
      }, 3000);
    }
  }

  /**
   * Disconnect from realtime audio session
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 RealtimeAudioService: Disconnecting...');

      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }

      this.cleanup();
      
      console.log('✅ RealtimeAudioService: Disconnected successfully');
      this.emitEvent({ type: 'audio_ended', timestamp: new Date().toISOString() });

    } catch (error) {
      console.error('❌ RealtimeAudioService: Error during disconnect:', error);
    }
  }

  /**
   * Send text message to AI caddie
   */
  async sendTextMessage(message: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to realtime audio session');
    }

    try {
      console.log('💬 RealtimeAudioService: Sending text message:', message);
      this.client.sendUserMessageContent([{ type: 'input_text', text: message }]);
    } catch (error) {
      console.error('❌ RealtimeAudioService: Error sending text message:', error);
      throw error;
    }
  }

  /**
   * Send audio data to AI caddie
   */
  async sendAudioData(audioData: Int16Array): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to realtime audio session');
    }

    try {
      console.log('🎵 RealtimeAudioService: Sending audio data, length:', audioData.length);
      this.client.appendInputAudio(audioData);
    } catch (error) {
      console.error('❌ RealtimeAudioService: Error sending audio:', error);
      throw error;
    }
  }

  /**
   * Request club recommendation for specific distance
   */
  async requestClubRecommendation(distanceYards: number, currentHole?: number, conditions?: string): Promise<void> {
    const message = `I need a club recommendation for ${distanceYards} yards${currentHole ? ` on hole ${currentHole}` : ''}${conditions ? ` with ${conditions} conditions` : ''}`;
    await this.sendTextMessage(message);
  }

  /**
   * Announce shot placement status
   */
  async announceShotStatus(status: 'placed' | 'activated' | 'in_progress' | 'completed', distanceYards?: number): Promise<void> {
    let message = '';
    switch (status) {
      case 'placed':
        message = `Shot target placed${distanceYards ? ` at ${distanceYards} yards` : ''}. Ready for your shot.`;
        break;
      case 'activated':
        message = 'Shot tracking activated. Take your shot when ready.';
        break;
      case 'in_progress':
        message = 'Shot in progress. Looking good!';
        break;
      case 'completed':
        message = 'Nice shot! Ready for your next target.';
        break;
    }
    await this.sendTextMessage(message);
  }

  /**
   * Check if currently connected
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get current session info
   */
  getCurrentSession(): RealtimeSessionInfo | null {
    return this.currentSession;
  }

  /**
   * Subscribe to audio events
   */
  onAudioEvent(callback: (event: AudioEvent) => void): () => void {
    this.eventListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Setup event handlers for RealtimeClient
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Handle conversation updates
    this.client.on('conversation.updated', ({ item, delta }: any) => {
      console.log('🔄 RealtimeAudioService: Conversation updated:', item.type);
      
      if (item.type === 'message' && item.role === 'assistant') {
        if (delta?.transcript) {
          this.emitEvent({
            type: 'transcript_received',
            data: { transcript: delta.transcript, item },
            timestamp: new Date().toISOString()
          });
        }
        
        if (delta?.audio) {
          this.emitEvent({
            type: 'response_received', 
            data: { audio: delta.audio, item },
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Handle conversation completion
    this.client.on('conversation.item.completed', ({ item }: any) => {
      console.log('✅ RealtimeAudioService: Item completed:', item.type);
      
      if (item.type === 'message' && item.role === 'assistant') {
        this.emitEvent({
          type: 'response_received',
          data: { item, completed: true },
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle interruptions
    this.client.on('conversation.interrupted', () => {
      console.log('⏸️ RealtimeAudioService: Conversation interrupted');
      this.emitEvent({
        type: 'audio_ended',
        data: { reason: 'interrupted' },
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    this.client.on('error', (event: any) => {
      console.error('❌ RealtimeAudioService: Client error:', event);
      this.emitEvent({
        type: 'error',
        data: { error: event },
        timestamp: new Date().toISOString()
      });
    });

    // Handle all raw events for debugging
    this.client.on('realtime.event', ({ source, event }: any) => {
      console.log(`📡 RealtimeAudioService: ${source} event:`, event.type);
    });
  }

  /**
   * Build golf-specific instructions for the AI caddie
   */
  private buildGolfInstructions(): string {
    return `You are an expert golf caddie AI assistant for CaddieAI. Provide brief, encouraging, and professional golf advice optimized for voice delivery.

COMMUNICATION STYLE:
- Keep responses under 30 words for natural conversation flow
- Use warm, encouraging tone like a professional caddie
- Speak naturally as if you're walking the course together
- Avoid technical jargon unless specifically requested

GOLF EXPERTISE:
- Provide club recommendations based on distance and conditions
- Offer strategic course management advice
- Give shot placement guidance with positive reinforcement
- Share encouragement during challenging moments

RESPONSE GUIDELINES:
- Be concise but personable
- Focus on actionable advice
- Maintain professional caddie demeanor
- Adapt communication to the golfer's skill level`;
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: AudioEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in audio event listener:', error);
      }
    });
  }

  /**
   * Create a RealtimeClient-compatible wrapper around WebSocket
   */
  private createRealtimeClientWrapper(webSocket: WebSocket): any {
    return {
      disconnect: () => {
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.close();
        }
      },
      
      sendUserMessageContent: (content: Array<{ type: string; text: string }>) => {
        const message = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: content
          }
        };
        
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(JSON.stringify(message));
        }
      },
      
      appendInputAudio: (audioData: Int16Array) => {
        const message = {
          type: 'input_audio_buffer.append',
          audio: this.arrayBufferToBase64(audioData.buffer as ArrayBuffer)
        };
        
        if (webSocket.readyState === WebSocket.OPEN) {
          webSocket.send(JSON.stringify(message));
        }
      },
      
      on: (eventType: string, callback: (data: any) => void) => {
        // Store event listeners for WebSocket message handling
        // This will be handled by setupWebSocketHandlers
      }
    };
  }

  /**
   * Setup WebSocket event handlers to mimic RealtimeClient events
   */
  private setupWebSocketHandlers(webSocket: WebSocket): void {
    webSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 RealtimeAudioService: Received WebSocket message:', data.type);
        
        // Handle different OpenAI Realtime API message types
        switch (data.type) {
          case 'session.created':
            console.log('🎉 RealtimeAudioService: OpenAI session created:', data.session?.id);
            this.emitEvent({
              type: 'audio_started',
              data: { session: data.session },
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'session.updated':
            console.log('🔄 RealtimeAudioService: OpenAI session updated');
            break;
            
          case 'conversation.item.created':
            console.log('💬 RealtimeAudioService: Conversation item created:', data.item?.type, 'role:', data.item?.role);
            if (data.item?.role === 'assistant') {
              this.emitEvent({
                type: 'response_received',
                data: { item: data.item },
                timestamp: new Date().toISOString()
              });
            }
            break;
            
          case 'response.created':
            console.log('🎯 RealtimeAudioService: Response created:', data.response?.id);
            break;
            
          case 'response.output_item.added':
            console.log('➕ RealtimeAudioService: Response output item added:', data.item?.type);
            break;
            
          case 'response.content_part.added':
            console.log('🔤 RealtimeAudioService: Content part added:', data.part?.type);
            break;
            
          case 'response.audio.delta':
            console.log('🎵 RealtimeAudioService: Audio delta received, size:', data.delta?.length || 0);
            this.handleAudioDelta(data.delta);
            this.emitEvent({
              type: 'response_received',
              data: { audio: data.delta, audioData: data },
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'response.audio.done':
            console.log('🎵 RealtimeAudioService: Audio response completed');
            this.emitEvent({
              type: 'response_received',
              data: { audioComplete: true },
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'response.done':
            console.log('✅ RealtimeAudioService: Response completed');
            break;
            
          case 'conversation.item.input_audio_transcription.completed':
            console.log('📝 RealtimeAudioService: Audio transcription completed:', data.transcript);
            this.emitEvent({
              type: 'transcript_received',
              data: { transcript: data.transcript, item: data },
              timestamp: new Date().toISOString()
            });
            break;
            
          case 'error':
            console.error('❌ RealtimeAudioService: OpenAI API error:', data);
            this.emitEvent({
              type: 'error',
              data: { error: data },
              timestamp: new Date().toISOString()
            });
            break;
            
          default:
            console.log('📡 RealtimeAudioService: Unhandled message type:', data.type);
            break;
        }
      } catch (error) {
        console.error('❌ RealtimeAudioService: Error parsing WebSocket message:', error);
      }
    };

    webSocket.onclose = (event) => {
      console.log('🔌 RealtimeAudioService: WebSocket closed:', event.code, event.reason);
      this.cleanup();
      this.emitEvent({
        type: 'audio_ended',
        data: { code: event.code, reason: event.reason },
        timestamp: new Date().toISOString()
      });
    };

    webSocket.onerror = (error) => {
      console.error('❌ RealtimeAudioService: WebSocket error:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'WebSocket connection error' },
        timestamp: new Date().toISOString()
      });
    };
  }

  /**
   * Handle audio delta data from OpenAI
   */
  private handleAudioDelta(audioBase64: string): void {
    if (!audioBase64) {
      console.warn('⚠️ RealtimeAudioService: Empty audio delta received');
      return;
    }

    try {
      console.log('🎵 RealtimeAudioService: Processing audio delta, size:', audioBase64.length, 'bytes');
      
      // Add audio data to queue for playback
      this.audioQueue.push(audioBase64);
      this.audioBufferCount++;
      
      console.log(`📥 RealtimeAudioService: Added audio chunk to queue (${this.audioQueue.length} chunks, buffer #${this.audioBufferCount})`);
      
      // Start playback if not already playing
      if (!this.isPlayingAudio) {
        this.startAudioPlayback();
      }
      
    } catch (error) {
      console.error('❌ RealtimeAudioService: Error processing audio delta:', error);
    }
  }

  /**
   * Start audio playback from the queue
   */
  private async startAudioPlayback(): Promise<void> {
    if (this.isPlayingAudio || this.audioQueue.length === 0) {
      return;
    }

    this.isPlayingAudio = true;
    console.log('🎧 RealtimeAudioService: Starting audio playback');

    try {
      // Initialize Sound library
      Sound.setCategory('Playback');
      
      while (this.audioQueue.length > 0) {
        const audioBase64 = this.audioQueue.shift();
        if (audioBase64) {
          await this.playAudioChunk(audioBase64);
        }
      }
    } catch (error) {
      console.error('❌ RealtimeAudioService: Error in audio playback:', error);
    } finally {
      this.isPlayingAudio = false;
      console.log('🎧 RealtimeAudioService: Audio playback completed');
    }
  }

  /**
   * Play a single audio chunk
   */
  private async playAudioChunk(audioBase64: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Convert base64 to temporary file for playback
        const tempFileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
        const tempFilePath = `${RNFS.CachesDirectoryPath}/${tempFileName}`;
        
        console.log('💾 RealtimeAudioService: Creating temporary audio file:', tempFileName);
        
        // Create a simple WAV header for PCM16 data
        const wavHeader = this.createWavHeader(audioBase64.length * 0.75); // Approximate PCM size
        const wavData = wavHeader + audioBase64;
        
        // Write audio file
        await RNFS.writeFile(tempFilePath, wavData, 'base64');
        
        console.log('🎵 RealtimeAudioService: Playing audio chunk from:', tempFilePath);
        
        // Play the audio file
        const sound = new Sound(tempFilePath, '', (error) => {
          if (error) {
            console.error('❌ RealtimeAudioService: Failed to load sound:', error);
            this.cleanupTempFile(tempFilePath);
            reject(error);
            return;
          }
          
          // Store reference to current sound
          this.currentSound = sound;
          
          sound.play((success) => {
            if (success) {
              console.log('✅ RealtimeAudioService: Audio chunk played successfully');
            } else {
              console.warn('⚠️ RealtimeAudioService: Audio playback failed');
            }
            
            // Cleanup
            sound.release();
            this.currentSound = null;
            this.cleanupTempFile(tempFilePath);
            resolve();
          });
        });
        
      } catch (error) {
        console.error('❌ RealtimeAudioService: Error playing audio chunk:', error);
        reject(error);
      }
    });
  }

  /**
   * Create a simple WAV header for PCM16 audio data
   */
  private createWavHeader(dataLength: number): string {
    // This is a basic WAV header for 24kHz, 16-bit, mono PCM
    // OpenAI Realtime API uses PCM16 format at 24kHz
    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    const fileSize = 36 + dataLength;
    
    // Create WAV header as base64
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, fileSize, true); // File size
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, channels, true); // Channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    
    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true); // Data size
    
    // Convert to base64
    const bytes = new Uint8Array(header);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Cleanup temporary audio file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      const exists = await RNFS.exists(filePath);
      if (exists) {
        await RNFS.unlink(filePath);
        console.log('🗑️ RealtimeAudioService: Cleaned up temp file:', filePath);
      }
    } catch (error) {
      console.warn('⚠️ RealtimeAudioService: Failed to cleanup temp file:', error);
    }
  }

  /**
   * Stop current audio playback
   */
  public stopAudioPlayback(): void {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.release();
      this.currentSound = null;
    }
    
    // Clear the audio queue
    this.audioQueue = [];
    this.isPlayingAudio = false;
    
    console.log('⏹️ RealtimeAudioService: Audio playback stopped');
  }

  /**
   * Convert ArrayBuffer to Base64 for audio data transmission
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.currentSession = null;
    this.workingUrl = '';
    
    // Stop audio playback
    this.stopAudioPlayback();
    
    if (this.nativeWebSocket) {
      try {
        this.nativeWebSocket.close();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.nativeWebSocket = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track: any) => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isRecording = false;
  }
}

// Export singleton instance
export const realtimeAudioService = new RealtimeAudioService();
export default realtimeAudioService;