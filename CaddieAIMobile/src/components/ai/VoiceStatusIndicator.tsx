import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { selectVoiceSession } from '../../store/slices/aiCaddieSlice';

export interface VoiceStatusIndicatorProps {
  compact?: boolean;
  showText?: boolean;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  compact = false,
  showText = true,
}) => {
  const voiceSession = useSelector(selectVoiceSession);
  const [waveAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (voiceSession.isListening) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
  }, [voiceSession.isListening]);

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopWaveAnimation = () => {
    waveAnimation.stopAnimation();
    waveAnimation.setValue(0);
  };

  const getStatusColor = () => {
    if (voiceSession.error) return '#f44336';
    if (voiceSession.isSpeaking) return '#2196F3';
    if (voiceSession.isProcessing) return '#FF9800';
    if (voiceSession.isListening) return '#4CAF50';
    if (voiceSession.isActive) return '#2c5530';
    return '#9e9e9e';
  };

  const getStatusIcon = () => {
    if (voiceSession.error) return 'error';
    if (voiceSession.isSpeaking) return 'volume-up';
    if (voiceSession.isProcessing) return 'hourglass-empty';
    if (voiceSession.isListening) return 'graphic-eq';
    if (voiceSession.isActive) return 'check-circle';
    return 'radio-button-unchecked';
  };

  const getStatusText = () => {
    if (voiceSession.error) return 'Error';
    if (voiceSession.isSpeaking) return 'Speaking';
    if (voiceSession.isProcessing) return 'Processing';
    if (voiceSession.isListening) return 'Listening';
    if (voiceSession.isActive) return 'Ready';
    return 'Offline';
  };

  const renderWaveForm = () => {
    if (!voiceSession.isListening) return null;

    return (
      <View style={styles.waveContainer}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                transform: [{
                  scaleY: waveAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1 + Math.random() * 0.5],
                  }),
                }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        {voiceSession.isListening && renderWaveForm()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Icon name={getStatusIcon()} size={16} color="#ffffff" />
        </View>
        
        {showText && (
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        )}
      </View>
      
      {voiceSession.isListening && renderWaveForm()}
      
      {voiceSession.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{voiceSession.error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    marginLeft: 0,
  },
  waveBar: {
    width: 3,
    height: 16,
    backgroundColor: '#4CAF50',
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    maxWidth: 280,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
  },
});

export default VoiceStatusIndicator;