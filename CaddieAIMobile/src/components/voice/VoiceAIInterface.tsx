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
  ShotMarkerData,
  isLocationServiceAvailable, 
  safeLocationServiceCall 
} from '../../services/LocationService';
import { DistanceCalculator, formatGolfDistance } from '../../utils/DistanceCalculator';

const { width, height } = Dimensions.get('window');

export interface VoiceAIInterfaceProps {
  userId: number;
  roundId: number;
  currentHole?: number;
  targetPin?: {
    latitude: number;
    longitude: number;
    distanceYards: number;
    bearing: number;
    timestamp: number;
  } | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    currentHole?: number;
    distanceToPin?: number;
    distanceToTee?: number;
    positionOnHole?: string;
  } | null;
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

export const VoiceAIInterface: React.FC<VoiceAIInterfaceProps> = React.memo(({
  userId,
  roundId,
  currentHole,
  targetPin,
  currentLocation: propCurrentLocation,
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
  const [shotMarkers, setShotMarkers] = useState<ShotMarkerData[]>([]);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  // Update local location state when prop changes
  useEffect(() => {
    if (propCurrentLocation) {
      setCurrentLocation({
        latitude: propCurrentLocation.latitude,
        longitude: propCurrentLocation.longitude,
        accuracy: propCurrentLocation.accuracy || 10,
        timestamp: Date.now(),
      });
    }
  }, [propCurrentLocation]);

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

      // Subscribe to location updates, map context, and shot tracking for comprehensive AI context
      const unsubscribeLocation = golfLocationService.onLocationUpdate((location: LocationData) => {
        setCurrentLocation(location);
      });

      const unsubscribeMapContext = golfLocationService.onMapLocationUpdate((context: MapLocationContext) => {
        setMapLocationContext(context);
        setCurrentLocation(context.userLocation);
      });

      const unsubscribeShotTracking = golfLocationService.onShotTrackingUpdate((shots: ShotMarkerData[]) => {
        setShotMarkers(shots);
        console.log(`🟢 VoiceAI: Updated shot tracking context with ${shots.length} shots`);
      });

      return () => {
        unsubscribeLocation();
        unsubscribeMapContext();
        unsubscribeShotTracking();
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

  // Build enhanced location context for AI with target pin integration
  const buildEnhancedLocationContext = useCallback(() => {
    const activeLocation = propCurrentLocation || currentLocation;
    if (!activeLocation) return undefined;

    const baseContext = {
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
      accuracyMeters: activeLocation.accuracy || 10,
      currentHole: 'currentHole' in activeLocation ? activeLocation.currentHole || currentHole : currentHole,
      distanceToPinMeters: 'distanceToPin' in activeLocation ? activeLocation.distanceToPin : undefined,
      distanceToTeeMeters: 'distanceToTee' in activeLocation ? activeLocation.distanceToTee : undefined,
      positionOnHole: 'positionOnHole' in activeLocation ? activeLocation.positionOnHole : undefined,
      movementSpeedMps: currentLocation?.speed,
      withinCourseBoundaries: true, // This would come from location service
      timestamp: new Date(currentLocation?.timestamp || Date.now()).toISOString(),
    };

    // Add enhanced context with target pin information from props or map context
    const activeTargetPin = targetPin || mapLocationContext?.targetPin;
    
    if (activeTargetPin || mapLocationContext) {
      const enhancedContext = {
        ...baseContext,
        // Add target pin information with club recommendation
        targetPin: activeTargetPin ? {
          latitude: 'coordinate' in activeTargetPin ? activeTargetPin.coordinate.latitude : activeTargetPin.latitude,
          longitude: 'coordinate' in activeTargetPin ? activeTargetPin.coordinate.longitude : activeTargetPin.longitude,
          distanceYards: activeTargetPin.distanceYards,
          bearing: activeTargetPin.bearing,
          recommendedClub: getRecommendedClub(activeTargetPin.distanceYards),
          shotDifficulty: getShotDifficulty(activeTargetPin.distanceYards),
          formattedDistance: formatGolfDistance({
            yards: activeTargetPin.distanceYards,
            meters: activeTargetPin.distanceYards / 1.09361,
            feet: activeTargetPin.distanceYards * 3,
            kilometers: activeTargetPin.distanceYards / 1093.61,
            miles: activeTargetPin.distanceYards / 1760,
          }),
        } : undefined,
        // Add course features if available
        courseFeatures: mapLocationContext?.courseFeatures ? {
          nearbyHazards: mapLocationContext.courseFeatures.nearbyHazards,
          distanceToGreen: mapLocationContext.courseFeatures.distanceToGreen,
          distanceToTee: mapLocationContext.courseFeatures.distanceToTee,
        } : undefined,
        // Add GPS accuracy assessment
        gpsQuality: DistanceCalculator.validateGPSAccuracy(
          activeLocation.accuracy || 10,
          { latitude: activeLocation.latitude, longitude: activeLocation.longitude }
        ),
      };

      return enhancedContext;
    }

    return baseContext;
  }, [propCurrentLocation, currentLocation, mapLocationContext, currentHole, targetPin]);

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

      // Prepare enhanced request with map and target pin context
      const enhancedLocationContext = buildEnhancedLocationContext();
      const activeTargetPin = targetPin || mapLocationContext?.targetPin;
      
      console.log('Processing voice input with enhanced context:', {
        hasLocation: !!enhancedLocationContext,
        hasTargetPin: !!activeTargetPin,
        targetDistance: activeTargetPin?.distanceYards,
        recommendedClub: activeTargetPin ? getRecommendedClub(activeTargetPin.distanceYards) : undefined,
        totalShots: shotMarkers.length,
        lastShotClub: shotMarkers.length > 0 ? shotMarkers[shotMarkers.length - 1].club : null
      });
      
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
        // Add comprehensive context about current golf situation including shot history
        golfContext: {
          hasActiveTarget: !!targetPin,
          currentHole: currentHole || propCurrentLocation?.currentHole,
          shotType: targetPin ? getShotDifficulty(targetPin.distanceYards) : 'general',
        },
        // Add shot history as metadata instead
        metadata: {
          shotHistory: shotMarkers.map((shot, index) => ({
            shotNumber: index + 1,
            distance: shot.distance.yards,
            club: shot.club,
            timestamp: shot.timestamp,
            accuracy: shot.accuracy,
          })),
          totalShots: shotMarkers.length,
          lastShotDistance: shotMarkers.length > 0 ? shotMarkers[shotMarkers.length - 1].distance.yards : null,
          lastShotClub: shotMarkers.length > 0 ? shotMarkers[shotMarkers.length - 1].club : null,
        },
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
      
      let errorResponse = "I'm sorry, I'm having trouble understanding right now. Please try again.";
      
      // Provide contextual error message if we have target info
      if (targetPin) {
        errorResponse = `I couldn't process that, but I can see you've selected a ${targetPin.distanceYards}-yard shot. Would you like a club recommendation?`;
      }
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
      {/* Status Text with Target Context */}
      {(voiceState !== 'idle' || recognizedText || targetPin) && (
        <View style={styles.statusContainer}>
          {recognizedText ? (
            <Text style={styles.recognizedText}>"{recognizedText}"</Text>
          ) : targetPin && voiceState === 'idle' ? (
            <View style={styles.targetContext}>
              <Text style={styles.targetContextText}>
                Target: {targetPin.distanceYards}y • {getRecommendedClub(targetPin.distanceYards)}
              </Text>
              <Text style={styles.targetHint}>Ask me about this shot!</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>
              {voiceState === 'listening' && 'Listening...'}
              {voiceState === 'processing' && 'Analyzing shot...'}
              {voiceState === 'speaking' && 'Speaking...'}
              {voiceState === 'error' && 'Error occurred'}
            </Text>
          )}
        </View>
      )}

      {/* Voice Button with Target Indicator */}
      <Animated.View style={[styles.voiceButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.voiceButton, 
            { backgroundColor: getButtonColor() },
            targetPin && voiceState === 'idle' && styles.voiceButtonWithTarget
          ]}
          onPress={handleVoiceButtonPress}
          disabled={voiceState === 'processing'}
        >
          <Icon name={getButtonIcon()} size={32} color="#fff" />
          {targetPin && voiceState === 'idle' && (
            <View style={styles.targetIndicator}>
              <Icon name="gps-fixed" size={12} color="#4CAF50" />
            </View>
          )}
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
}, (prevProps, nextProps) => {
  // Optimize re-renders by comparing relevant props
  return (
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.userId === nextProps.userId &&
    prevProps.roundId === nextProps.roundId &&
    prevProps.currentHole === nextProps.currentHole &&
    prevProps.targetPin?.distanceYards === nextProps.targetPin?.distanceYards &&
    prevProps.targetPin?.timestamp === nextProps.targetPin?.timestamp &&
    prevProps.currentLocation?.latitude === nextProps.currentLocation?.latitude &&
    prevProps.currentLocation?.longitude === nextProps.currentLocation?.longitude
  );
});

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
  voiceButtonWithTarget: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  targetIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  targetContext: {
    alignItems: 'center',
  },
  targetContextText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  targetHint: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
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

// Helper functions for enhanced AI context
const getRecommendedClub = (yards: number): string => {
  if (yards >= 280) return 'Driver';
  if (yards >= 240) return '3-Wood';
  if (yards >= 210) return '5-Wood';
  if (yards >= 190) return '3-Iron';
  if (yards >= 170) return '4-Iron';
  if (yards >= 160) return '5-Iron';
  if (yards >= 150) return '6-Iron';
  if (yards >= 140) return '7-Iron';
  if (yards >= 130) return '8-Iron';
  if (yards >= 120) return '9-Iron';
  if (yards >= 105) return 'Pitching Wedge';
  if (yards >= 90) return 'Sand Wedge';
  if (yards >= 70) return 'Lob Wedge';
  return 'Short Iron';
};

const getShotDifficulty = (yards: number): string => {
  if (yards < 50) return 'short-game';
  if (yards < 100) return 'wedge-shot';
  if (yards < 150) return 'approach-shot';
  if (yards < 200) return 'mid-iron';
  if (yards < 250) return 'long-iron';
  return 'driver-shot';
};

const calculateWindEffect = (yards: number): string => {
  if (yards < 100) return 'minimal';
  if (yards < 200) return 'moderate';
  return 'significant';
};

const getShotStrategy = (yards: number): string => {
  if (yards < 50) return 'precision-focused';
  if (yards < 100) return 'accuracy-over-distance';
  if (yards < 200) return 'balanced-approach';
  return 'distance-focused';
};

export default VoiceAIInterface;