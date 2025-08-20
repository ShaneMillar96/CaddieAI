import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { AppDispatch } from '../../store';
import {
  selectVoiceSession,
  selectUserSkillContext,
  selectCurrentShotType,
  setVoiceListening,
  setVoiceProcessing,
  setVoiceSpeaking,
  setVoiceError,
  addAdvice,
  analyzeShot,
  AICaddieAdvice,
} from '../../store/slices/aiCaddieSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectActiveRound } from '../../store/slices/roundSlice';
import {
  selectTargetLocation,
  selectDistances,
  selectClubRecommendation,
  selectIsActive as selectIsShotPlacementActive,
} from '../../store/slices/shotPlacementSlice';

import { RealtimeAudioService } from '../../services/RealtimeAudioService';
import { skillBasedAdviceEngine } from '../../services/SkillBasedAdviceEngine';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import { CaddieVoiceControls } from './CaddieVoiceControls';
import TokenStorage from '../../services/tokenStorage';

export interface VoiceAICaddieInterfaceProps {
  onAdviceReceived?: (advice: any) => void;
  compact?: boolean;
}

export const VoiceAICaddieInterface: React.FC<VoiceAICaddieInterfaceProps> = ({
  onAdviceReceived,
  compact = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const activeRound = useSelector(selectActiveRound);
  const voiceSession = useSelector(selectVoiceSession);
  const userSkillContext = useSelector(selectUserSkillContext);
  const currentShotType = useSelector(selectCurrentShotType);

  // Shot placement context from ActiveRoundScreen
  const shotPlacementTarget = useSelector(selectTargetLocation);
  const shotDistances = useSelector(selectDistances);
  const clubRecommendationFromPlacement = useSelector(selectClubRecommendation);
  const isShotPlacementActive = useSelector(selectIsShotPlacementActive);

  const [realtimeService] = useState(() => new RealtimeAudioService());
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [lastAdviceTime, setLastAdviceTime] = useState<number>(0);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Animation values
  const pulseAnimation = useState(new Animated.Value(1))[0];
  const recordingAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkAudioPermissions();
    setupRealtimeService(); // async function, but we don't await here
    
    return () => {
      cleanupRealtimeService();
    };
  }, []);

  useEffect(() => {
    if (voiceSession.isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [voiceSession.isListening]);

  const checkAudioPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'AI Caddie Audio Permission',
            message: 'AI Caddie needs access to your microphone to provide voice assistance.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasPermissions(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS permissions are handled by the audio recording service
        setHasPermissions(true);
      }
    } catch (error) {
      console.error('VoiceAICaddieInterface: Permission check failed:', error);
      setHasPermissions(false);
    }
  };

  const setupRealtimeService = async () => {
    try {
      // Set up event listeners first
      realtimeService.on('connected', handleServiceConnected);
      realtimeService.on('disconnected', handleServiceDisconnected);
      realtimeService.on('audio_response', handleAudioResponse);
      realtimeService.on('transcription', handleTranscription);
      realtimeService.on('error', handleServiceError);

      // Get auth token and round info for connection
      const authToken = await TokenStorage.getAccessToken();
      const roundId = activeRound?.id || 0; // Use 0 for general advice mode

      if (!authToken) {
        console.warn('🔗 VoiceAICaddieInterface: No auth token available, skipping WebSocket connection');
        dispatch(setVoiceError('Authentication required for voice features'));
        return;
      }

      // Establish WebSocket connection
      console.log('🔗 VoiceAICaddieInterface: Connecting to realtime service...', {
        roundId,
        hasToken: !!authToken
      });

      await realtimeService.connect(roundId, authToken);
      console.log('✅ VoiceAICaddieInterface: Successfully connected to realtime service');
      
    } catch (error) {
      console.error('❌ VoiceAICaddieInterface: Failed to setup realtime service:', error);
      dispatch(setVoiceError(`Failed to connect to voice service: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const cleanupRealtimeService = () => {
    try {
      realtimeService.removeAllListeners();
      if (isRecording) {
        realtimeService.stopRecording();
      }
      realtimeService.disconnect();
      
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }
    } catch (error) {
      console.warn('VoiceAICaddieInterface: Cleanup error (non-critical):', error);
    }
  };

  const handleServiceConnected = () => {
    console.log('✅ VoiceAICaddieInterface: Realtime service connected');
  };

  const handleServiceDisconnected = () => {
    console.log('🔌 VoiceAICaddieInterface: Realtime service disconnected');
    dispatch(setVoiceError('Voice service disconnected'));
  };

  const handleAudioResponse = async (audioData: any) => {
    console.log('🎵 VoiceAICaddieInterface: Received audio response');
    
    dispatch(setVoiceSpeaking(true));
    
    try {
      // Process the audio response
      if (audioData.transcript) {
        const advice: AICaddieAdvice = {
          id: `voice_advice_${Date.now()}`,
          message: audioData.transcript,
          timestamp: new Date().toISOString(),
          shotType: currentShotType || undefined,
          confidence: 0.9,
          audioUrl: audioData.audioUrl,
        };

        dispatch(addAdvice(advice));
        
        if (onAdviceReceived) {
          onAdviceReceived(advice);
        }
      }
    } catch (error) {
      console.error('VoiceAICaddieInterface: Failed to process audio response:', error);
    } finally {
      setTimeout(() => {
        dispatch(setVoiceSpeaking(false));
      }, 2000); // Assume 2 seconds for audio playback
    }
  };

  const handleTranscription = (transcription: any) => {
    console.log('📝 VoiceAICaddieInterface: Received transcription:', transcription.transcript);
    
    if (transcription.isFinal) {
      dispatch(setVoiceProcessing(true));
      dispatch(setVoiceListening(false));
    }
  };

  const handleServiceError = async (error: any) => {
    console.error('❌ VoiceAICaddieInterface: Service error:', error);
    
    const errorMessage = error.message || 'Voice service error';
    
    // Handle specific error types for better UX
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      await handleNetworkError();
    } else if (errorMessage.includes('permission') || errorMessage.includes('microphone')) {
      await handlePermissionError();
    } else if (errorMessage.includes('timeout')) {
      await handleTimeoutError();
    } else if (errorMessage.includes('buffer too small') || 
               errorMessage.includes('conversation_already_has_active_response') ||
               errorMessage.includes('invalid_request_error')) {
      // These are normal OpenAI API errors, don't trigger service recovery
      console.log('🔄 Normal OpenAI API error, not triggering recovery:', errorMessage);
      dispatch(setVoiceError(errorMessage));
      
      // Clear error after 3 seconds for these temporary errors
      setTimeout(() => {
        dispatch(setVoiceError(null));
      }, 3000);
    } else {
      // General error handling - only retry for actual connection issues
      dispatch(setVoiceError(errorMessage));
      
      // Auto-retry for certain errors (only connection-related)
      if (connectionRetries < 3 && !isRetrying && 
          (errorMessage.includes('WebSocket') || errorMessage.includes('Failed to connect'))) {
        setTimeout(() => {
          attemptServiceRecovery();
        }, 2000);
      }
    }
    
    // Reset states
    dispatch(setVoiceListening(false));
    dispatch(setVoiceProcessing(false));
    setIsRecording(false);
    
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  const startVoiceInteraction = async () => {
    try {
      console.log('🎯 VoiceAICaddieInterface: Starting voice interaction', {
        userId: user?.id,
        roundId: activeRound?.id,
        hasPermissions,
        sessionActive: voiceSession.isActive,
        shotPlacementActive: isShotPlacementActive,
        shotPlacementTarget: !!shotPlacementTarget,
        distances: shotDistances,
        clubRec: clubRecommendationFromPlacement,
        skillContext: userSkillContext
      });

      // Enhanced permission checking
      if (!hasPermissions) {
        await checkAudioPermissions();
        if (!hasPermissions) {
          Alert.alert(
            'Microphone Permission Required',
            'AI Caddie needs microphone access for voice features. Please check your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => openAppSettings() }
            ]
          );
          return;
        }
      }

      if (!voiceSession.isActive) {
        dispatch(setVoiceError('Voice session not active. Initializing...'));
        await attemptServiceRecovery();
        return;
      }

      // Prevent rapid successive requests with progressive delay
      const now = Date.now();
      const minDelay = connectionRetries > 0 ? 3000 : 2000;
      if (now - lastAdviceTime < minDelay) {
        return;
      }
      setLastAdviceTime(now);

      // Clear any existing timeout
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }

      dispatch(setVoiceListening(true));
      dispatch(setVoiceError(null));
      setIsRecording(true);

      // Start recording with enhanced error handling
      await realtimeService.startRecording();
      console.log('🎤 VoiceAICaddieInterface: Recording started successfully');

      // Set timeout for maximum recording duration (30 seconds) with cleanup
      const timeout = setTimeout(() => {
        if (isRecording) {
          console.log('⏰ VoiceAICaddieInterface: Recording timeout reached');
          stopVoiceInteraction();
        }
      }, 30000);
      setRecordingTimeout(timeout);

    } catch (error) {
      console.error('VoiceAICaddieInterface: Failed to start voice interaction:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice recording';
      dispatch(setVoiceError(`Recording failed: ${errorMessage}`));
      dispatch(setVoiceListening(false));
      setIsRecording(false);
      
      // Attempt recovery for network/connection errors
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        setTimeout(() => attemptServiceRecovery(), 1000);
      }
    }
  };

  const stopVoiceInteraction = async () => {
    try {
      console.log('🛑 VoiceAICaddieInterface: Stopping voice interaction');
      
      dispatch(setVoiceListening(false));
      setIsRecording(false);
      
      // Clear recording timeout
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
        setRecordingTimeout(null);
      }

      // Stop recording with timeout protection
      const stopPromise = realtimeService.stopRecording();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stop recording timeout')), 5000)
      );
      
      await Promise.race([stopPromise, timeoutPromise]);
      console.log('🎤 VoiceAICaddieInterface: Recording stopped successfully');
      
      // Enhanced shot analysis - only for active rounds with context
      if (activeRound && user && userSkillContext) {
        // Active round mode: Use full shot analysis
        dispatch(setVoiceProcessing(true));
        
        try {
          // Use shot placement data if available, otherwise use current shot type
          const position = shotPlacementTarget || 
                          currentShotType?.position || 
                          { latitude: 55.020906, longitude: -7.247879 }; // Faughan Valley default
          
          // Auto-create a shot type if none exists but shot placement is active
          let effectiveShotType = currentShotType;
          if (!effectiveShotType && isShotPlacementActive && shotDistances?.fromCurrent) {
            const distance = shotDistances.fromCurrent;
            let shotTypeGuess: 'tee_shot' | 'approach' | 'chip' | 'putt' = 'approach';
            
            if (distance > 200) shotTypeGuess = 'tee_shot';
            else if (distance < 50) shotTypeGuess = 'chip';
            else if (distance < 10) shotTypeGuess = 'putt';
            
            effectiveShotType = {
              type: shotTypeGuess,
              confidence: 0.7,
              distance: distance,
              position: position,
              conditions: { wind: 'Light' }
            };
            
            console.log('🎯 VoiceAICaddieInterface: Auto-created shot type for analysis:', effectiveShotType);
          }
          
          const shotContext = {
            shotType: effectiveShotType,
            skillLevel: userSkillContext.skillLevel,
            handicap: userSkillContext.handicap,
            // Include shot placement context
            targetDistance: shotDistances?.fromCurrent || 0,
            clubRecommendation: clubRecommendationFromPlacement,
            shotPlacementActive: isShotPlacementActive,
          };

          const analysisPromise = dispatch(analyzeShot({
            userId: user.id,
            roundId: activeRound.id,
            position: position,
            shotContext: shotContext,
          })).unwrap();
          
          const analysisTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Shot analysis timeout')), 10000)
          );
          
          await Promise.race([analysisPromise, analysisTimeout]);
          console.log('✅ VoiceAICaddieInterface: Shot analysis completed');
          
        } catch (error) {
          console.error('VoiceAICaddieInterface: Shot analysis failed:', error);
          
          // Provide fallback advice for active rounds
          try {
            const fallbackAdvice: AICaddieAdvice = {
              id: `fallback_advice_${Date.now()}`,
              message: 'Keep focusing on smooth contact and follow-through.',
              timestamp: new Date().toISOString(),
              shotType: currentShotType || undefined,
              confidence: 0.7
            };
            
            dispatch(addAdvice(fallbackAdvice));
            console.log('💡 VoiceAICaddieInterface: Fallback advice provided');
          } catch (fallbackError) {
            console.error('VoiceAICaddieInterface: Fallback advice also failed:', fallbackError);
          }
        } finally {
          dispatch(setVoiceProcessing(false));
        }
      } else {
        // General advice mode: WebSocket already handles the conversation
        console.log('🎙️ VoiceAICaddieInterface: General advice mode - using WebSocket conversation');
        // The audio response will be handled by the WebSocket connection
        // No need for shot analysis in general advice mode
      }

    } catch (error) {
      console.error('VoiceAICaddieInterface: Failed to stop voice interaction:', error);
      dispatch(setVoiceError(`Stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      dispatch(setVoiceProcessing(false));
    }
  };

  const handleVoiceButtonPress = () => {
    // Prevent button press during certain states
    if (isRetrying || (!hasPermissions && !voiceSession.isActive)) {
      return;
    }
    
    if (voiceSession.isListening || isRecording) {
      stopVoiceInteraction();
    } else {
      startVoiceInteraction();
    }
  };
  
  // New helper functions for enhanced error handling
  const handleNetworkError = async () => {
    dispatch(setVoiceError('Network connection lost. Attempting to reconnect...'));
    setTimeout(() => attemptServiceRecovery(), 2000);
  };
  
  const handlePermissionError = async () => {
    setHasPermissions(false);
    dispatch(setVoiceError('Microphone permission required'));
    await checkAudioPermissions();
  };
  
  const handleTimeoutError = async () => {
    dispatch(setVoiceError('Request timed out. Please try again.'));
    cleanupRealtimeService();
    setTimeout(() => setupRealtimeService(), 1000);
  };
  
  const attemptServiceRecovery = async () => {
    if (isRetrying || connectionRetries >= 3) {
      dispatch(setVoiceError('Unable to connect to voice service. Please check your connection.'));
      return;
    }
    
    // Prevent multiple simultaneous recovery attempts
    if (isRetrying) {
      console.log('🔄 Recovery already in progress, skipping...');
      return;
    }
    
    setIsRetrying(true);
    setConnectionRetries(prev => prev + 1);
    
    try {
      console.log(`🔄 VoiceAICaddieInterface: Attempting service recovery (${connectionRetries + 1}/3)`);
      
      cleanupRealtimeService();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      setupRealtimeService();
      
      // Test connection with auth token
      const authToken = await TokenStorage.getAccessToken();
      await realtimeService.connect(activeRound?.id || 0, authToken || '');
      
      dispatch(setVoiceError(null));
      setConnectionRetries(0);
      console.log('✅ VoiceAICaddieInterface: Service recovery successful');
      
    } catch (error) {
      console.error('VoiceAICaddieInterface: Service recovery failed:', error);
      dispatch(setVoiceError('Recovery failed. Please restart the app if issues persist.'));
    } finally {
      setIsRetrying(false);
    }
  };
  
  const openAppSettings = () => {
    // This would need platform-specific implementation
    if (Platform.OS === 'ios') {
      Alert.alert('Settings', 'Please open Settings > Privacy & Security > Microphone > CaddieAI and enable access.');
    } else {
      Alert.alert('Settings', 'Please open Settings > Apps > CaddieAI > Permissions > Microphone and enable access.');
    }
  };

  const getVoiceButtonStyle = () => {
    const baseStyle = {
      ...styles.voiceButton,
    };
    
    if (voiceSession.isSpeaking) {
      return [baseStyle, styles.speakingButton, compact && styles.compactButton];
    } else if (voiceSession.isProcessing) {
      return [baseStyle, styles.processingButton, compact && styles.compactButton];
    } else if (voiceSession.isListening || isRecording) {
      return [baseStyle, styles.listeningButton, compact && styles.compactButton];
    } else if (voiceSession.error) {
      return [baseStyle, styles.errorButton, compact && styles.compactButton];
    } else if (!hasPermissions) {
      return [baseStyle, styles.disabledButton, compact && styles.compactButton];
    } else if (isRetrying) {
      return [baseStyle, styles.retryingButton, compact && styles.compactButton];
    } else {
      return [baseStyle, styles.readyButton, compact && styles.compactButton];
    }
  };

  const getVoiceButtonIcon = () => {
    if (voiceSession.isSpeaking) return 'volume-up';
    if (voiceSession.isProcessing) return 'sync';
    if (voiceSession.isListening || isRecording) return 'mic';
    if (voiceSession.error) return 'error';
    return 'mic-none';
  };

  const renderVoiceButton = () => (
    <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
      <TouchableOpacity
        style={getVoiceButtonStyle()}
        onPress={handleVoiceButtonPress}
        disabled={!voiceSession.isActive || voiceSession.isProcessing || voiceSession.isSpeaking || isRetrying || (!hasPermissions && !voiceSession.isActive)}
        activeOpacity={0.8}
      >
        <Icon 
          name={getVoiceButtonIcon()} 
          size={compact ? 32 : 48} 
          color="#ffffff" 
        />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStatusText = () => {
    if (voiceSession.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{voiceSession.error}</Text>
          {connectionRetries > 0 && (
            <Text style={styles.retryText}>Retrying... ({connectionRetries}/3)</Text>
          )}
        </View>
      );
    }
    
    if (isRetrying) {
      return <Text style={styles.statusText}>Reconnecting voice service...</Text>;
    }
    
    if (voiceSession.isSpeaking) {
      return <Text style={styles.statusText}>🎵 AI Caddie is speaking...</Text>;
    }
    
    if (voiceSession.isProcessing) {
      return <Text style={styles.statusText}>🤔 Processing your request...</Text>;
    }
    
    if (voiceSession.isListening || isRecording) {
      return <Text style={styles.statusText}>👂 Listening... Tap to stop</Text>;
    }
    
    if (!hasPermissions) {
      return <Text style={styles.warningText}>Microphone permission required</Text>;
    }
    
    return (
      <Text style={styles.instructionText}>
        {compact ? '🎤 Tap for advice' : '🎤 Tap to ask your AI Caddie'}
      </Text>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {renderVoiceButton()}
        <VoiceStatusIndicator compact />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VoiceStatusIndicator />
      
      <View style={styles.voiceButtonContainer}>
        {renderVoiceButton()}
      </View>
      
      <View style={styles.statusContainer}>
        {renderStatusText()}
      </View>

      {userSkillContext && (
        <View style={styles.contextHint}>
          <Text style={styles.contextText}>
            Tailored for {userSkillContext.skillLevel === 1 ? 'Beginner' : 
                          userSkillContext.skillLevel === 2 ? 'Intermediate' :
                          userSkillContext.skillLevel === 3 ? 'Advanced' : 'Professional'} level
          </Text>
        </View>
      )}

      <CaddieVoiceControls 
        onEmergencyStop={stopVoiceInteraction}
        showEmergencyStop={voiceSession.isListening || voiceSession.isProcessing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  voiceButtonContainer: {
    marginBottom: 16,
  },
  voiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  readyButton: {
    backgroundColor: '#2c5530',
  },
  listeningButton: {
    backgroundColor: '#4CAF50',
  },
  processingButton: {
    backgroundColor: '#FF9800',
  },
  speakingButton: {
    backgroundColor: '#2196F3',
  },
  errorButton: {
    backgroundColor: '#f44336',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  retryingButton: {
    backgroundColor: '#FFC107',
  },
  compactButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusContainer: {
    alignItems: 'center',
    minHeight: 40,
  },
  statusText: {
    fontSize: 16,
    color: '#2c5530',
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contextHint: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f0f4f1',
    borderRadius: 12,
  },
  contextText: {
    fontSize: 12,
    color: '#4a7c59',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
});

export default VoiceAICaddieInterface;