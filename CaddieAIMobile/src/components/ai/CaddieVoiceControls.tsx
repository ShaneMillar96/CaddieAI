import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export interface CaddieVoiceControlsProps {
  onEmergencyStop?: () => void;
  showEmergencyStop?: boolean;
  onVolumeToggle?: () => void;
  isMuted?: boolean;
}

export const CaddieVoiceControls: React.FC<CaddieVoiceControlsProps> = ({
  onEmergencyStop,
  showEmergencyStop = false,
  onVolumeToggle,
  isMuted = false,
}) => {
  if (!showEmergencyStop && !onVolumeToggle) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showEmergencyStop && onEmergencyStop && (
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={onEmergencyStop}
          activeOpacity={0.7}
        >
          <Icon name="stop" size={20} color="#ffffff" />
          <Text style={styles.emergencyText}>Stop</Text>
        </TouchableOpacity>
      )}
      
      {onVolumeToggle && (
        <TouchableOpacity
          style={styles.volumeButton}
          onPress={onVolumeToggle}
          activeOpacity={0.7}
        >
          <Icon 
            name={isMuted ? 'volume-off' : 'volume-up'} 
            size={20} 
            color="#4a7c59" 
          />
          <Text style={styles.volumeText}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  volumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f4f1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  volumeText: {
    color: '#4a7c59',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default CaddieVoiceControls;