import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppSelector } from '../../hooks/redux';

interface TestModeIndicatorProps {
  onPress?: () => void;
  showCoordinates?: boolean;
}

export const TestModeIndicator: React.FC<TestModeIndicatorProps> = ({
  onPress,
  showCoordinates = false,
}) => {
  const { enabled, coordinates, presets } = useAppSelector(state => state.testMode);

  // Only show in development mode when test mode is enabled
  if (!__DEV__ || !enabled) {
    return null;
  }

  // Find current preset name if coordinates match a preset
  const currentPreset = presets.find(preset => 
    preset.latitude === coordinates.latitude && 
    preset.longitude === coordinates.longitude
  );
  
  const locationName = currentPreset ? currentPreset.name : 'Custom Location';

  const IndicatorContent = (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>TEST MODE</Text>
      </View>
      {showCoordinates && (
        <View style={styles.details}>
          <Text style={styles.locationText}>{locationName}</Text>
          <Text style={styles.coordinatesText}>
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {IndicatorContent}
      </TouchableOpacity>
    );
  }

  return IndicatorContent;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  badge: {
    backgroundColor: '#7C3AED', // Purple background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  details: {
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  locationText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  coordinatesText: {
    color: '#7C3AED',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

export default TestModeIndicator;