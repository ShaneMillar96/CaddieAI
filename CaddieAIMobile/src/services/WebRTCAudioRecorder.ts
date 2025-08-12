import { EventEmitter } from 'events';

export interface AudioData {
  audio: string; // base64 encoded audio
  format: string;
  sampleRate: number;
}

export class WebRTCAudioRecorder extends EventEmitter {
  private mediaRecorder: any = null;
  private audioContext: any = null;
  private mediaStream: any = null;
  private isInitialized = false;
  private isRecording = false;
  private audioWorklet: any = null;

  async initialize(): Promise<void> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this environment');
      }

      // Get audio stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      // Create media stream source
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create audio worklet for real-time processing
      try {
        await this.audioContext.audioWorklet.addModule(this.getAudioWorkletCode());
        this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-recorder-processor');
        
        this.audioWorklet.port.onmessage = (event: any) => {
          if (event.data.type === 'audioData') {
            this.emit('audioData', {
              audio: event.data.audio,
              format: 'pcm16',
              sampleRate: 16000,
            });
          } else if (event.data.type === 'audioLevel') {
            this.emit('audioLevel', event.data.level);
          }
        };

        source.connect(this.audioWorklet);
        this.audioWorklet.connect(this.audioContext.destination);
      } catch (error) {
        console.warn('AudioWorklet not supported, falling back to ScriptProcessor:', error);
        this.setupScriptProcessor(source);
      }

      this.isInitialized = true;
      console.log('WebRTC audio recorder initialized');
    } catch (error) {
      console.error('Failed to initialize WebRTC audio recorder:', error);
      throw error;
    }
  }

  private setupScriptProcessor(source: any) {
    // Fallback to deprecated ScriptProcessorNode
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event: any) => {
      if (!this.isRecording) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const audioData = this.convertFloat32ToPCM16(inputData);
      const base64Audio = this.arrayBufferToBase64(audioData);
      
      this.emit('audioData', {
        audio: base64Audio,
        format: 'pcm16',
        sampleRate: 16000,
      });

      // Calculate audio level
      const level = this.calculateAudioLevel(inputData);
      this.emit('audioLevel', level);
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
    this.audioWorklet = processor;
  }

  private getAudioWorkletCode(): string {
    return URL.createObjectURL(new Blob([`
      class AudioRecorderProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.bufferSize = 4096;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const inputData = input[0];
            
            for (let i = 0; i < inputData.length; i++) {
              this.buffer[this.bufferIndex] = inputData[i];
              this.bufferIndex++;
              
              if (this.bufferIndex >= this.bufferSize) {
                // Convert to PCM16 and send
                const pcm16Data = this.convertFloat32ToPCM16(this.buffer);
                const base64Audio = this.arrayBufferToBase64(pcm16Data);
                
                this.port.postMessage({
                  type: 'audioData',
                  audio: base64Audio
                });

                // Calculate and send audio level
                const level = this.calculateAudioLevel(this.buffer);
                this.port.postMessage({
                  type: 'audioLevel',
                  level: level
                });

                this.bufferIndex = 0;
              }
            }
          }
          return true;
        }

        convertFloat32ToPCM16(float32Array) {
          const buffer = new ArrayBuffer(float32Array.length * 2);
          const view = new DataView(buffer);
          
          for (let i = 0; i < float32Array.length; i++) {
            const sample = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, sample * 0x7FFF, true);
          }
          
          return buffer;
        }

        arrayBufferToBase64(buffer) {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        }

        calculateAudioLevel(audioData) {
          let sum = 0;
          for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
          }
          return Math.sqrt(sum / audioData.length);
        }
      }

      registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
    `], { type: 'application/javascript' }));
  }

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

  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.isRecording) {
      return;
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isRecording = true;
      console.log('WebRTC recording started');
    } catch (error) {
      console.error('Failed to start WebRTC recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    console.log('WebRTC recording stopped');
  }

  async cleanup(): Promise<void> {
    this.isRecording = false;

    if (this.audioWorklet) {
      try {
        this.audioWorklet.disconnect();
      } catch (error) {
        console.warn('Error disconnecting audio worklet:', error);
      }
      this.audioWorklet = null;
    }

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('Error closing audio context:', error);
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
    console.log('WebRTC audio recorder cleaned up');
  }

  getRecordingState(): boolean {
    return this.isRecording;
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              (window.AudioContext || (window as any).webkitAudioContext));
  }
}