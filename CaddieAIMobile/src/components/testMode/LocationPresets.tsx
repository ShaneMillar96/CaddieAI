import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { loadPreset, removePreset } from '../../store/slices/testModeSlice';

interface LocationPresetsProps {
  title?: string;
  onPresetSelected?: (presetIndex: number) => void;
  showRemoveButton?: boolean;
  maxHeight?: number;
}

export const LocationPresets: React.FC<LocationPresetsProps> = ({
  title = 'Quick Locations',
  onPresetSelected,
  showRemoveButton = false,
  maxHeight = 200,
}) => {
  const dispatch = useAppDispatch();
  const { presets, coordinates } = useAppSelector(state => state.testMode);

  const handlePresetPress = (index: number) => {
    dispatch(loadPreset(index));
    onPresetSelected?.(index);
  };

  const handleRemovePreset = (index: number, presetName: string) => {
    Alert.alert(
      'Remove Preset',
      `Are you sure you want to remove "${presetName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removePreset(index)),
        },
      ]
    );
  };

  const isCurrentLocation = (preset: { latitude: number; longitude: number }) => {
    return (
      Math.abs(preset.latitude - coordinates.latitude) < 0.000001 &&
      Math.abs(preset.longitude - coordinates.longitude) < 0.000001
    );
  };

  if (presets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.emptyText}>No preset locations available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView 
        style={[styles.presetsContainer, { maxHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {presets.map((preset, index) => {
          const isCurrent = isCurrentLocation(preset);
          
          return (
            <View key={index} style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  isCurrent && styles.presetButtonActive,
                ]}
                onPress={() => handlePresetPress(index)}
                activeOpacity={0.7}
              >
                <View style={styles.presetContent}>
                  <Text style={[
                    styles.presetName,
                    isCurrent && styles.presetNameActive,
                  ]}>
                    {preset.name}
                  </Text>
                  <Text style={[
                    styles.presetCoordinates,
                    isCurrent && styles.presetCoordinatesActive,
                  ]}>
                    {preset.latitude.toFixed(6)}, {preset.longitude.toFixed(6)}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.currentIndicator}>
                    <Text style={styles.currentIndicatorText}>CURRENT</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {showRemoveButton && index >= 4 && ( // Don't allow removing default presets
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePreset(index, preset.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  presetsContainer: {
    maxHeight: 200,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  presetNameActive: {
    color: '#fff',
  },
  presetCoordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  presetCoordinatesActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removeButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    backgroundColor: '#dc3545',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default LocationPresets;