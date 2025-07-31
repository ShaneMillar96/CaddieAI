import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { 
  golfLocationService, 
  LocationData, 
  MapLocationContext,
  isLocationServiceAvailable, 
  safeLocationServiceCall 
} from '../../services/LocationService';
import { DistanceCalculator, formatGolfDistance } from '../../utils/DistanceCalculator';

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
  const [mapLocationContext, setMapLocationContext] = useState<MapLocationContext | null>(null);
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
      // Check if react-native-permissions module is available
      if (!check || !request || !PERMISSIONS || !RESULTS) {
        console.warn('react-native-permissions module not available, skipping permission check');
        Alert.alert(
          'Voice Features Unavailable',
          'Voice features require app rebuild after installing permissions. Voice functionality will be limited.',
          [{ text: 'OK' }]
        );
        return;
      }

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

      // Initialize Voice with error handling
      if (Voice) {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechRecognized = onSpeechRecognized;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
      } else {
        console.warn('Voice module not available');
      }

      // Initialize TTS with error handling
      if (Tts) {
        Tts.addEventListener('tts-start', onTtsStart);
        Tts.addEventListener('tts-finish', onTtsFinish);
        Tts.addEventListener('tts-cancel', onTtsCancel);

        // Set TTS options
        await Tts.setDefaultRate(0.5);
        await Tts.setDefaultPitch(1.0);
      } else {
        console.warn('TTS module not available');
      }

      console.log('Voice services initialized successfully');
    } catch (error) {
      console.error('Error initializing voice services:', error);
      setVoiceState('error');
      
      // Show user-friendly error message
      Alert.alert(
        'Voice Setup Error',
        'There was an issue setting up voice features. Please restart the app or contact support if the issue persists.',
        [{ text: 'OK' }]
      );
    }
  };

  const setupLocationTracking = () => {
    try {
      // Check if location service modules are available
      if (!isLocationServiceAvailable) {
        console.warn('Location service function not available - module may not be properly linked');
        return () => {}; // Return empty unsubscribe function
      }

      if (!isLocationServiceAvailable()) {
        console.warn('Location service not available in VoiceAIInterface');
        return () => {}; // Return empty unsubscribe function
      }
      
      // Check if golfLocationService is available
      if (!golfLocationService || typeof golfLocationService.onLocationUpdate !== 'function') {
        console.warn('GolfLocationService not properly initialized');
        return () => {}; // Return empty unsubscribe function
      }

      // Subscribe to both regular location updates and enhanced map context
      const unsubscribeLocation = golfLocationService.onLocationUpdate((location: LocationData) => {
        setCurrentLocation(location);
      });

      const unsubscribeMapContext = golfLocationService.onMapLocationUpdate((context: MapLocationContext) => {
        setMapLocationContext(context);
        setCurrentLocation(context.userLocation);
      });

      return () => {
        unsubscribeLocation();
        unsubscribeMapContext();
      };
    } catch (error) {
      console.error('Error setting up location tracking in VoiceAIInterface:', error);
      
      // Show user-friendly warning for location issues
      if (error instanceof Error && error.message && error.message.includes('geolocation')) {
        Alert.alert(
          'Location Service Warning',
          'Location tracking may not work properly. Please restart the app after ensuring location permissions are granted.',
          [{ text: 'OK' }]
        );
      }
      
      return () => {}; // Return empty unsubscribe function
    }
  };

  const cleanupVoiceServices = async () => {
    try {
      if (Voice && typeof Voice.destroy === 'function') {
        await Voice.destroy();
      }
      
      if (Tts && typeof Tts.removeAllListeners === 'function') {
        Tts.removeAllListeners('tts-start');
        Tts.removeAllListeners('tts-finish');
        Tts.removeAllListeners('tts-cancel');
      }
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

  // Build enhanced location context for AI
  const buildEnhancedLocationContext = useCallback(() => {
    if (!currentLocation) return undefined;

    const baseContext = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracyMeters: currentLocation.accuracy || 10,
      currentHole,
      movementSpeedMps: currentLocation.speed,
      withinCourseBoundaries: true, // This would come from location service
      timestamp: new Date(currentLocation.timestamp).toISOString(),
    };

    // Add enhanced context from map if available
    if (mapLocationContext) {
      const enhancedContext = {
        ...baseContext,
        // Add target pin information
        targetPin: mapLocationContext.targetPin ? {
          latitude: mapLocationContext.targetPin.coordinate.latitude,
          longitude: mapLocationContext.targetPin.coordinate.longitude,
          distanceYards: mapLocationContext.targetPin.distanceYards,
          bearing: mapLocationContext.targetPin.bearing,
          recommendedClub: DistanceCalculator.recommendClub(mapLocationContext.targetPin.distanceYards),
          formattedDistance: formatGolfDistance({
            yards: mapLocationContext.targetPin.distanceYards,
            meters: mapLocationContext.targetPin.distanceYards / 1.09361,
            feet: mapLocationContext.targetPin.distanceYards * 3,
            kilometers: mapLocationContext.targetPin.distanceYards / 1093.61,
            miles: mapLocationContext.targetPin.distanceYards / 1760,
          }),
        } : undefined,
        // Add course features if available
        courseFeatures: mapLocationContext.courseFeatures ? {
          nearbyHazards: mapLocationContext.courseFeatures.nearbyHazards,
          distanceToGreen: mapLocationContext.courseFeatures.distanceToGreen,
          distanceToTee: mapLocationContext.courseFeatures.distanceToTee,
        } : undefined,
        // Add GPS accuracy assessment
        gpsQuality: DistanceCalculator.validateGPSAccuracy(
          currentLocation.accuracy || 10,
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
        ),
      };

      return enhancedContext;
    }

    return baseContext;
  }, [currentLocation, mapLocationContext, currentHole]);

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

      // Prepare enhanced request with map context
      const enhancedLocationContext = buildEnhancedLocationContext();
      
      const request: VoiceAIRequest = {
        userId,
        roundId,
        voiceInput: spokenText,
        locationContext: enhancedLocationContext,
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
      if (Tts && typeof Tts.speak === 'function') {
        await Tts.speak(text);
      } else {
        console.warn('TTS module not available, skipping speech');
        setVoiceState('idle');
      }
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

      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert('Voice Recognition Unavailable', 'Voice recognition module is not available. Please restart the app.');
        return;
      }

      setRecognizedText('');
      setVoiceState('listening');
      
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setVoiceState('error');
      
      Alert.alert(
        'Voice Recognition Error',
        'Unable to start voice recognition. Please check your microphone permissions and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Stop voice recognition
  const stopListening = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  // Stop TTS
  const stopSpeaking = async () => {
    try {
      if (Tts && typeof Tts.stop === 'function') {
        await Tts.stop();
      }
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