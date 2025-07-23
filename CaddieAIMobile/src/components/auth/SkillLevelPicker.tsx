import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SkillLevel } from '../../types';

interface SkillLevelPickerProps {
  selectedLevel: SkillLevel;
  onLevelChange: (level: SkillLevel) => void;
  label?: string;
  error?: string;
  style?: ViewStyle;
}

const skillLevels = [
  { value: SkillLevel.Beginner, label: 'Beginner', description: 'New to golf' },
  { value: SkillLevel.Intermediate, label: 'Intermediate', description: 'Some experience' },
  { value: SkillLevel.Advanced, label: 'Advanced', description: 'Skilled player' },
  { value: SkillLevel.Professional, label: 'Professional', description: 'Expert level' },
];

export const SkillLevelPicker: React.FC<SkillLevelPickerProps> = ({
  selectedLevel,
  onLevelChange,
  label,
  error,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {skillLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.option,
              selectedLevel === level.value && styles.selectedOption,
            ]}
            onPress={() => onLevelChange(level.value)}
          >
            <Text
              style={[
                styles.optionText,
                selectedLevel === level.value && styles.selectedOptionText,
              ]}
            >
              {level.label}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                selectedLevel === level.value && styles.selectedOptionDescription,
              ]}
            >
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedOptionDescription: {
    color: '#007AFF',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
});

export default SkillLevelPicker;