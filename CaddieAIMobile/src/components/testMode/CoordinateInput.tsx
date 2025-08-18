import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setTestLatitude, setTestLongitude, setTestCoordinates } from '../../store/slices/testModeSlice';

interface CoordinateInputProps {
  label?: string;
  showApplyButton?: boolean;
  onCoordinatesChanged?: (latitude: number, longitude: number) => void;
}

export const CoordinateInput: React.FC<CoordinateInputProps> = ({
  label = 'Test Coordinates',
  showApplyButton = true,
  onCoordinatesChanged,
}) => {
  const dispatch = useAppDispatch();
  const { coordinates } = useAppSelector(state => state.testMode);
  
  const [localLatitude, setLocalLatitude] = useState(coordinates.latitude.toString());
  const [localLongitude, setLocalLongitude] = useState(coordinates.longitude.toString());
  const [latitudeError, setLatitudeError] = useState<string | null>(null);
  const [longitudeError, setLongitudeError] = useState<string | null>(null);

  // Update local state when Redux coordinates change
  useEffect(() => {
    setLocalLatitude(coordinates.latitude.toString());
    setLocalLongitude(coordinates.longitude.toString());
  }, [coordinates]);

  const validateLatitude = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setLatitudeError('Must be a valid number');
      return false;
    }
    if (num < -90 || num > 90) {
      setLatitudeError('Must be between -90 and 90');
      return false;
    }
    setLatitudeError(null);
    return true;
  };

  const validateLongitude = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setLongitudeError('Must be a valid number');
      return false;
    }
    if (num < -180 || num > 180) {
      setLongitudeError('Must be between -180 and 180');
      return false;
    }
    setLongitudeError(null);
    return true;
  };

  const handleLatitudeChange = (value: string) => {
    setLocalLatitude(value);
    if (validateLatitude(value) && !showApplyButton) {
      const latitude = parseFloat(value);
      dispatch(setTestLatitude(latitude));
      onCoordinatesChanged?.(latitude, coordinates.longitude);
    }
  };

  const handleLongitudeChange = (value: string) => {
    setLocalLongitude(value);
    if (validateLongitude(value) && !showApplyButton) {
      const longitude = parseFloat(value);
      dispatch(setTestLongitude(longitude));
      onCoordinatesChanged?.(coordinates.latitude, longitude);
    }
  };

  const handleApplyCoordinates = () => {
    const latValid = validateLatitude(localLatitude);
    const lngValid = validateLongitude(localLongitude);
    
    if (latValid && lngValid) {
      const latitude = parseFloat(localLatitude);
      const longitude = parseFloat(localLongitude);
      
      dispatch(setTestCoordinates({ latitude, longitude }));
      onCoordinatesChanged?.(latitude, longitude);
    }
  };

  const isValid = !latitudeError && !longitudeError && 
    localLatitude.trim() !== '' && localLongitude.trim() !== '';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Latitude</Text>
          <TextInput
            style={[styles.input, latitudeError && styles.inputError]}
            value={localLatitude}
            onChangeText={handleLatitudeChange}
            placeholder="-90 to 90"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {latitudeError && (
            <Text style={styles.errorText}>{latitudeError}</Text>
          )}
        </View>
        
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Longitude</Text>
          <TextInput
            style={[styles.input, longitudeError && styles.inputError]}
            value={localLongitude}
            onChangeText={handleLongitudeChange}
            placeholder="-180 to 180"
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {longitudeError && (
            <Text style={styles.errorText}>{longitudeError}</Text>
          )}
        </View>
      </View>
      
      {showApplyButton && (
        <TouchableOpacity
          style={[styles.applyButton, !isValid && styles.applyButtonDisabled]}
          onPress={handleApplyCoordinates}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyButtonText, !isValid && styles.applyButtonTextDisabled]}>
            Apply Coordinates
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: 'monospace',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
  },
  applyButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonTextDisabled: {
    color: '#999',
  },
});

export default CoordinateInput;