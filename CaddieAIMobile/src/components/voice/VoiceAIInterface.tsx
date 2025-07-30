import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { voiceAIApiService, VoiceAIRequest } from '../../services/voiceAIApi';
import { golfLocationService, LocationData } from '../../services/LocationService';

const { width, height } = Dimensions.get('window');

export interface VoiceAIInterfaceProps {
  userId: number;
  roundId: number;
  currentHole?: number;
  isVisible: boolean;
  onToggle: () => void;
  onConversationUpdate: (conversation: ConversationMessage[]) => void;
}

export interface ConversationMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isVoice: boolean;
  confidence?: number;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export const VoiceAIInterface: React.FC<VoiceAIInterfaceProps> = ({
  userId,
  roundId,
  currentHole,
  isVisible,
  onToggle,
  onConversationUpdate,
}) => {
  // State management
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Initialize voice services
  useEffect(() => {
    initializeVoiceServices();
    setupLocationTracking();
    
    return () => {
      cleanupVoiceServices();
    };
  }, []);

  // Show/hide animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Pulse animation when listening
  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const initializeVoiceServices = async () => {
    try {
      // Request microphone permissions
      const microphonePermission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.MICROPHONE 
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const permissionResult = await request(microphonePermission);
      
      if (permissionResult !== RESULTS.GRANTED) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access to use voice features.',
          [{ text: 'OK' }]
        );
        return;
      }

      setHasPermissions(true);

      // Initialize Voice
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechRecognized = onSpeechRecognized;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;

      // Initialize TTS
      Tts.addEventListener('tts-start', onTtsStart);
      Tts.addEventListener('tts-finish', onTtsFinish);
      Tts.addEventListener('tts-cancel', onTtsCancel);

      // Set TTS options
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);

      console.log('Voice services initialized successfully');
    } catch (error) {
      console.error('Error initializing voice services:', error);
      setVoiceState('error');
    }
  };

  const setupLocationTracking = () => {
    const unsubscribe = golfLocationService.onLocationUpdate((location: LocationData) => {
      setCurrentLocation(location);
    });

    return unsubscribe;
  };

  const cleanupVoiceServices = async () => {
    try {
      await Voice.destroy();
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    } catch (error) {
      console.error('Error cleaning up voice services:', error);
    }
  };

  // Voice recognition event handlers
  const onSpeechStart = () => {
    console.log('Speech recognition started');
    setVoiceState('listening');
    setIsListening(true);
  };

  const onSpeechRecognized = () => {
    console.log('Speech recognized');
  };

  const onSpeechEnd = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    if (voiceState === 'listening') {
      setVoiceState('processing');
    }
  };

  const onSpeechError = (error: SpeechErrorEvent) => {
    console.error('Speech recognition error:', error);
    setIsListening(false);
    setVoiceState('error');
    
    let errorMessage = 'Voice recognition failed';
    if (error.error?.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.error?.message?.includes('no-speech')) {
      errorMessage = 'No speech detected. Please try again.';
    }

    Alert.alert('Voice Error', errorMessage);
    
    // Reset to idle after error
    setTimeout(() => setVoiceState('idle'), 2000);
  };

  const onSpeechResults = (event: SpeechResultsEvent) => {
    if (event.value && event.value.length > 0) {
      const spokenText = event.value[0];
      console.log('Speech results:', spokenText);
      setRecognizedText(spokenText);
      processVoiceInput(spokenText);
    }
  };

  const onSpeechPartialResults = (event: SpeechResultsEvent) => {
    if (event.value && event.value.length > 0) {
      setRecognizedText(event.value[0]);
    }
  };

  // TTS event handlers
  const onTtsStart = () => {
    console.log('TTS started');
    setVoiceState('speaking');
  };

  const onTtsFinish = () => {
    console.log('TTS finished');
    setVoiceState('idle');
  };

  const onTtsCancel = () => {
    console.log('TTS cancelled');
    setVoiceState('idle');
  };

  // Process voice input with AI
  const processVoiceInput = async (spokenText: string) => {
    try {
      setVoiceState('processing');

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: Date.now().toString() + '_user',
        content: spokenText,
        role: 'user',
        timestamp: new Date(),
        isVoice: true,
      };

      const updatedHistory = [...conversationHistory, userMessage];
      setConversationHistory(updatedHistory);

      // Prepare request
      const request: VoiceAIRequest = {
        userId,
        roundId,
        voiceInput: spokenText,
        locationContext: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracyMeters: currentLocation.accuracy,
          currentHole,
          movementSpeedMps: currentLocation.speed,
          withinCourseBoundaries: true, // This would come from location service
          timestamp: new Date(currentLocation.timestamp).toISOString(),
        } : undefined,
        conversationHistory: conversationHistory.slice(-6).map(msg => ({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp.toISOString(),
        })),
      };

      // Get AI response
      const aiResponse = await voiceAIApiService.processVoiceInput(request);

      // Add AI message to conversation
      const aiMessage: ConversationMessage = {
        id: aiResponse.responseId,
        content: aiResponse.message,
        role: 'assistant',
        timestamp: new Date(aiResponse.generatedAt),
        isVoice: true,
        confidence: aiResponse.confidenceScore,
      };

      const finalHistory = [...updatedHistory, aiMessage];
      setConversationHistory(finalHistory);
      setLastResponse(aiResponse.message);

      // Notify parent component
      onConversationUpdate(finalHistory);

      // Speak the response
      await speakResponse(aiResponse.message);

    } catch (error: any) {
      console.error('Error processing voice input:', error);
      setVoiceState('error');
      
      const errorResponse = "I'm sorry, I'm having trouble understanding right now. Please try again.";
      await speakResponse(errorResponse);
      
      setTimeout(() => setVoiceState('idle'), 2000);
    }
  };

  // Speak AI response using TTS
  const speakResponse = async (text: string) => {
    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('Error speaking response:', error);
      setVoiceState('idle');
    }
  };

  // Start voice recognition
  const startListening = async () => {
    try {
      if (!hasPermissions) {
        Alert.alert('Permission Required', 'Please enable microphone access to use voice features.');
        return;
      }

      setRecognizedText('');
      setVoiceState('listening');
      
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setVoiceState('error');
    }
  };

  // Stop voice recognition
  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Stop TTS
  const stopSpeaking = async () => {
    try {
      await Tts.stop();
      setVoiceState('idle');
    } catch (error) {
      console.error('Error stopping TTS:', error);
    }
  };

  // Animation functions
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle voice button press
  const handleVoiceButtonPress = async () => {
    switch (voiceState) {
      case 'idle':
        await startListening();
        break;
      case 'listening':
        await stopListening();
        break;
      case 'speaking':
        await stopSpeaking();
        break;
      case 'processing':
        // Can't interrupt processing
        break;
      case 'error':
        setVoiceState('idle');
        break;
    }
  };

  // Get button icon based on state
  const getButtonIcon = () => {
    switch (voiceState) {
      case 'listening':
        return 'mic';
      case 'processing':
        return 'hourglass-empty';
      case 'speaking':
        return 'volume-up';
      case 'error':
        return 'error';
      default:
        return 'mic-none';
    }
  };

  // Get button color based on state
  const getButtonColor = () => {
    switch (voiceState) {
      case 'listening':
        return '#ff4444';
      case 'processing':
        return '#ffa500';
      case 'speaking':
        return '#4CAF50';
      case 'error':
        return '#ff6b6b';
      default:
        return '#4a7c59';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Status Text */}
      {(voiceState !== 'idle' || recognizedText) && (
        <View style={styles.statusContainer}>
          {recognizedText ? (
            <Text style={styles.recognizedText}>"{recognizedText}"</Text>
          ) : (
            <Text style={styles.statusText}>
              {voiceState === 'listening' && 'Listening...'}
              {voiceState === 'processing' && 'Processing...'}
              {voiceState === 'speaking' && 'Speaking...'}
              {voiceState === 'error' && 'Error occurred'}
            </Text>
          )}
        </View>
      )}

      {/* Voice Button */}
      <Animated.View style={[styles.voiceButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: getButtonColor() }]}
          onPress={handleVoiceButtonPress}
          disabled={voiceState === 'processing'}
        >
          <Icon name={getButtonIcon()} size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Last Response */}
      {lastResponse && voiceState === 'idle' && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText} numberOfLines={2}>
            {lastResponse}
          </Text>
        </View>
      )}

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onToggle}>
        <Icon name="close" size={20} color="#666" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: width - 80,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  recognizedText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voiceButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    maxWidth: width - 80,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  responseText: {
    color: '#2c5530',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default VoiceAIInterface;