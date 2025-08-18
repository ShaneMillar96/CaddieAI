import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  toggleTestMode,
  resetToDefaults,
  addCustomPreset,
} from '../../store/slices/testModeSlice';
import { TestModeIndicator } from './TestModeIndicator';
import { CoordinateInput } from './CoordinateInput';
import { LocationPresets } from './LocationPresets';

interface TestModeSettingsProps {
  showTitle?: boolean;
  compact?: boolean;
}

export const TestModeSettings: React.FC<TestModeSettingsProps> = ({
  showTitle = true,
  compact = false,
}) => {
  const dispatch = useAppDispatch();
  const { enabled, coordinates, lastUpdated } = useAppSelector(state => state.testMode);
  
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  const handleToggleTestMode = (value: boolean) => {
    dispatch(toggleTestMode());
    
    if (value) {
      Alert.alert(
        'Test Mode Enabled',
        'Location will be overridden with test coordinates. This is for development only.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Test Mode',
      'This will reset all test mode settings to defaults. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => dispatch(resetToDefaults()),
        },
      ]
    );
  };

  const handleAddPreset = () => {
    if (newPresetName.trim().length === 0) {
      Alert.alert('Error', 'Please enter a name for the preset');
      return;
    }

    dispatch(addCustomPreset({
      name: newPresetName.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }));

    setNewPresetName('');
    setShowAddPresetModal(false);
    
    Alert.alert('Success', `Preset "${newPresetName.trim()}" has been added`);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <TestModeIndicator showCoordinates={enabled} />
          <Switch
            value={enabled}
            onValueChange={handleToggleTestMode}
            trackColor={{ false: '#767577', true: '#7C3AED' }}
            thumbColor={enabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
        
        {enabled && (
          <View style={styles.compactContent}>
            <LocationPresets maxHeight={120} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Test Mode Settings</Text>}
      
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabelContainer}>
            <Text style={styles.switchLabel}>Enable Test Mode</Text>
            <Text style={styles.switchDescription}>
              Override GPS location with custom coordinates
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggleTestMode}
            trackColor={{ false: '#767577', true: '#7C3AED' }}
            thumbColor={enabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
        
        {enabled && <TestModeIndicator showCoordinates={true} />}
      </View>

      {enabled && (
        <>
          <View style={styles.section}>
            <LocationPresets 
              onPresetSelected={() => {
                // Preset was selected, no additional action needed
              }}
            />
          </View>

          <View style={styles.section}>
            <CoordinateInput />
          </View>

          <View style={styles.section}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowAddPresetModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Save as Preset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleResetToDefaults}
                activeOpacity={0.8}
              >
                <Text style={styles.dangerButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{formatDate(lastUpdated)}</Text>
          </View>
        </>
      )}

      {/* Add Preset Modal */}
      <Modal
        visible={showAddPresetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddPresetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Preset</Text>
            <Text style={styles.modalDescription}>
              Save current coordinates as a preset location
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={newPresetName}
              onChangeText={setNewPresetName}
              placeholder="Enter preset name..."
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
            
            <Text style={styles.modalCoordinates}>
              {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setNewPresetName('');
                  setShowAddPresetModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  newPresetName.trim().length === 0 && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleAddPreset}
                disabled={newPresetName.trim().length === 0}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.modalSaveText,
                  newPresetName.trim().length === 0 && styles.modalSaveTextDisabled,
                ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactContent: {
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalCoordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 20,
    padding: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#999',
  },
});

export default TestModeSettings;