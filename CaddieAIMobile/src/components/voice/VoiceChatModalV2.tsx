import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RealtimeAudioServiceV2 } from '../../services/RealtimeAudioServiceV2';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface VoiceChatModalV2Props {
  visible: boolean;
  onClose: () => void;
  roundId: number;
}

interface AudioVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, isSpeaking, audioLevel }) => {
  const [animatedBars, setAnimatedBars] = useState<number[]>([1, 1, 1, 1, 1]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAnimatedBars(prev => prev.map(() => 
          Math.random() * (audioLevel || 0.5) + 0.3
        ));
      }, 100);
    } else {
      setAnimatedBars([1, 1, 1, 1, 1]);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, isSpeaking, audioLevel]);

  return (
    <View style={styles.visualizer}>
      {animatedBars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.visualizerBar,
            {
              height: height * 30,
              backgroundColor: isListening 
                ? '#4CAF50' 
                : isSpeaking 
                ? '#2196F3' 
                : '#ddd',
            },
          ]}
        />
      ))}
    </View>
  );
};

export const VoiceChatModalV2: React.FC<VoiceChatModalV2Props> = ({
  visible,
  onClose,
  roundId,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    id: string;
    type: 'user' | 'assistant' | 'system';
    text: string;
    timestamp: Date;
  }>>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const realtimeServiceRef = useRef<RealtimeAudioServiceV2 | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const authToken = useSelector((state: RootState) => state.auth.token);

  const addMessage = useCallback((type: 'user' | 'assistant' | 'system', text: string) => {
    const message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, message]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const initializeRealtimeService = useCallback(async () => {
    if (!authToken) {
      setConnectionError('Authentication required');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      realtimeServiceRef.current = new RealtimeAudioServiceV2();
      
      // Set up event listeners
      realtimeServiceRef.current.on('connected', () => {
        console.log('Realtime audio connected');
        setIsConnected(true);
        setIsConnecting(false);
        addMessage('system', 'Connected to AI caddie. Say "Hello" to start the conversation.');
      });

      realtimeServiceRef.current.on('disconnected', () => {
        console.log('Realtime audio disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        addMessage('system', 'Disconnected from AI caddie.');
      });

      realtimeServiceRef.current.on('error', (error: string) => {
        console.error('Realtime audio error:', error);
        setConnectionError(error);
        setIsConnecting(false);
        setIsConnected(false);
        addMessage('system', `Error: ${error}`);
      });

      realtimeServiceRef.current.on('audioLevelUpdate', (level: number) => {
        setAudioLevel(level);
      });

      realtimeServiceRef.current.on('transcript', (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          if (transcript.trim()) {
            addMessage('user', transcript);
          }
          setCurrentTranscript('');
        } else {
          setCurrentTranscript(transcript);
        }
      });

      realtimeServiceRef.current.on('assistantMessage', (message: string) => {
        addMessage('assistant', message);
      });

      realtimeServiceRef.current.on('listeningStateChanged', (listening: boolean) => {
        setIsListening(listening);
      });

      realtimeServiceRef.current.on('speakingStateChanged', (speaking: boolean) => {
        setIsSpeaking(speaking);
      });

      // Connect to the service
      await realtimeServiceRef.current.connect(roundId, authToken);
      
    } catch (error) {
      console.error('Failed to initialize realtime service:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [authToken, roundId, addMessage]);

  const handleStartStopRecording = useCallback(async () => {
    if (!realtimeServiceRef.current || !isConnected) return;

    try {
      if (isListening) {
        await realtimeServiceRef.current.stopRecording();
      } else {
        await realtimeServiceRef.current.startRecording();
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      Alert.alert('Error', 'Failed to toggle recording');
    }
  }, [isConnected, isListening]);

  const handleInterrupt = useCallback(async () => {
    if (!realtimeServiceRef.current || !isConnected) return;

    try {
      await realtimeServiceRef.current.interrupt();
      addMessage('system', 'Interrupted AI response');
    } catch (error) {
      console.error('Error interrupting:', error);
    }
  }, [isConnected, addMessage]);

  const cleanup = useCallback(async () => {
    if (realtimeServiceRef.current) {
      await realtimeServiceRef.current.disconnect();
      realtimeServiceRef.current.removeAllListeners();
      realtimeServiceRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    setConversation([]);
    setCurrentTranscript('');
    setAudioLevel(0);
    setConnectionError(null);
  }, []);

  // Initialize when modal opens
  useEffect(() => {
    if (visible && !isConnected && !isConnecting) {
      initializeRealtimeService();
    }
  }, [visible, isConnected, isConnecting, initializeRealtimeService]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!visible) {
      cleanup();
    }
  }, [visible, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Caddie Voice Chat</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          {isConnecting && (
            <View style={styles.statusItem}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.statusText}>Connecting...</Text>
            </View>
          )}
          
          {isConnected && (
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>Connected</Text>
            </View>
          )}
          
          {connectionError && (
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#f44336' }]} />
              <Text style={[styles.statusText, { color: '#f44336' }]}>
                Error: {connectionError}
              </Text>
            </View>
          )}
        </View>

        {/* Conversation */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.conversation}
          contentContainerStyle={styles.conversationContent}
          showsVerticalScrollIndicator={false}
        >
          {conversation.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' && styles.userMessage,
                message.type === 'assistant' && styles.assistantMessage,
                message.type === 'system' && styles.systemMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.type === 'user' && styles.userMessageText,
                message.type === 'assistant' && styles.assistantMessageText,
                message.type === 'system' && styles.systemMessageText,
              ]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))}
          
          {/* Current transcript */}
          {currentTranscript && (
            <View style={[styles.messageContainer, styles.userMessage, styles.transcriptMessage]}>
              <Text style={[styles.messageText, styles.userMessageText, styles.transcriptText]}>
                {currentTranscript}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Audio Visualizer */}
        <View style={styles.visualizerContainer}>
          <AudioVisualizer 
            isListening={isListening} 
            isSpeaking={isSpeaking}
            audioLevel={audioLevel}
          />
          <Text style={styles.visualizerStatus}>
            {isListening ? 'Listening...' : isSpeaking ? 'AI Speaking...' : 'Ready'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isListening && styles.recordButtonActive,
              !isConnected && styles.recordButtonDisabled,
            ]}
            onPress={handleStartStopRecording}
            disabled={!isConnected}
          >
            <Icon 
              name={isListening ? "mic" : "mic-none"} 
              size={32} 
              color={isListening ? "#fff" : (isConnected ? "#2196F3" : "#ccc")} 
            />
          </TouchableOpacity>

          {isSpeaking && (
            <TouchableOpacity
              style={styles.interruptButton}
              onPress={handleInterrupt}
            >
              <Icon name="stop" size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {!isConnected && !isConnecting && (
            <TouchableOpacity
              style={styles.reconnectButton}
              onPress={initializeRealtimeService}
            >
              <Icon name="refresh" size={24} color="#fff" />
              <Text style={styles.reconnectText}>Reconnect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 60, // Account for status bar
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  statusContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  conversation: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conversationContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  transcriptMessage: {
    opacity: 0.7,
    borderStyle: 'dashed',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  systemMessageText: {
    color: '#856404',
    fontSize: 14,
  },
  transcriptText: {
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  visualizerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    marginBottom: 8,
  },
  visualizerBar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
    minHeight: 4,
  },
  visualizerStatus: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  recordButtonDisabled: {
    borderColor: '#ccc',
  },
  interruptButton: {
    marginLeft: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reconnectButton: {
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },
  reconnectText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default VoiceChatModalV2;