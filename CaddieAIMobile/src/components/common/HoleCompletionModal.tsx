import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HoleCompletionRequest } from '../../types/golf';

interface HoleCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (completion: HoleCompletionRequest) => Promise<void>;
  roundId: number;
  holeNumber: number;
  isFirstTimePlayingHole: boolean;
  existingPar?: number;
  isLoading?: boolean;
}

export const HoleCompletionModal: React.FC<HoleCompletionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  roundId,
  holeNumber,
  isFirstTimePlayingHole,
  existingPar,
  isLoading = false,
}) => {
  const [par, setPar] = useState<string>(existingPar?.toString() || '');
  const [score, setScore] = useState<string>('');
  const [putts, setPutts] = useState<string>('');
  const [fairwayHit, setFairwayHit] = useState<boolean | null>(null);
  const [greenInRegulation, setGreenInRegulation] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setPar(existingPar?.toString() || '');
      setScore('');
      setPutts('');
      setFairwayHit(null);
      setGreenInRegulation(null);
      setNotes('');
    }
  }, [visible, existingPar]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!score.trim()) {
      Alert.alert('Required Field', 'Please enter your score for this hole.');
      return;
    }

    if (isFirstTimePlayingHole && !par.trim()) {
      Alert.alert('Required Field', 'Please enter the par for this hole since this is your first time playing it.');
      return;
    }

    const scoreNum = parseInt(score, 10);
    const parNum = par.trim() ? parseInt(par, 10) : undefined;
    const puttsNum = putts.trim() ? parseInt(putts, 10) : undefined;

    // Validate numeric inputs
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 15) {
      Alert.alert('Invalid Score', 'Please enter a valid score between 1 and 15.');
      return;
    }

    if (parNum !== undefined && (isNaN(parNum) || parNum < 3 || parNum > 6)) {
      Alert.alert('Invalid Par', 'Please enter a valid par between 3 and 6.');
      return;
    }

    if (puttsNum !== undefined && (isNaN(puttsNum) || puttsNum < 0 || puttsNum > 10)) {
      Alert.alert('Invalid Putts', 'Please enter a valid number of putts between 0 and 10.');
      return;
    }

    // Validate putts vs score
    if (puttsNum !== undefined && puttsNum > scoreNum) {
      Alert.alert('Invalid Putts', 'Number of putts cannot be greater than your total score.');
      return;
    }

    const completion: HoleCompletionRequest = {
      roundId,
      holeNumber,
      score: scoreNum,
      par: parNum,
      putts: puttsNum,
      fairwayHit: fairwayHit ?? undefined,
      greenInRegulation: greenInRegulation ?? undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(completion);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error submitting hole completion:', error);
    }
  };

  const renderQuickScoreButtons = () => {
    const quickScores = existingPar ? 
      [existingPar - 2, existingPar - 1, existingPar, existingPar + 1, existingPar + 2].filter(s => s > 0) :
      [3, 4, 5, 6, 7];

    return (
      <View style={styles.quickButtonsContainer}>
        <Text style={styles.quickButtonsLabel}>Quick Score:</Text>
        <View style={styles.quickButtons}>
          {quickScores.map((quickScore) => (
            <TouchableOpacity
              key={quickScore}
              style={[
                styles.quickButton,
                score === quickScore.toString() && styles.quickButtonSelected
              ]}
              onPress={() => setScore(quickScore.toString())}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.quickButtonText,
                score === quickScore.toString() && styles.quickButtonTextSelected
              ]}>
                {quickScore}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBooleanOption = (
    label: string,
    value: boolean | null,
    onPress: (val: boolean | null) => void,
    trueLabel = 'Yes',
    falseLabel = 'No'
  ) => (
    <View style={styles.booleanOptionContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.booleanOptions}>
        <TouchableOpacity
          style={[
            styles.booleanOption,
            value === true && styles.booleanOptionSelected
          ]}
          onPress={() => onPress(value === true ? null : true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.booleanOptionText,
            value === true && styles.booleanOptionTextSelected
          ]}>
            {trueLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.booleanOption,
            value === false && styles.booleanOptionSelected
          ]}
          onPress={() => onPress(value === false ? null : false)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.booleanOptionText,
            value === false && styles.booleanOptionTextSelected
          ]}>
            {falseLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Hole {holeNumber} Completion</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Par Input (only for first time playing hole) */}
          {isFirstTimePlayingHole && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Par for Hole {holeNumber} <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.inputDescription}>
                This is your first time playing this hole. Please set the par value.
              </Text>
              <TextInput
                style={styles.numberInput}
                value={par}
                onChangeText={setPar}
                placeholder="e.g., 4"
                keyboardType="numeric"
                maxLength={1}
              />
            </View>
          )}

          {/* Score Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Your Score <Text style={styles.required}>*</Text>
            </Text>
            {existingPar && renderQuickScoreButtons()}
            <TextInput
              style={styles.numberInput}
              value={score}
              onChangeText={setScore}
              placeholder="Enter your score"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* Putts Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Number of Putts (optional)</Text>
            <TextInput
              style={styles.numberInput}
              value={putts}
              onChangeText={setPutts}
              placeholder="e.g., 2"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* Fairway Hit */}
          {renderBooleanOption(
            'Hit Fairway? (optional)',
            fairwayHit,
            setFairwayHit
          )}

          {/* Green in Regulation */}
          {renderBooleanOption(
            'Green in Regulation? (optional)',
            greenInRegulation,
            setGreenInRegulation
          )}

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this hole..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{notes.length}/200</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Complete Hole</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  inputDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  numberInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  quickButtonsContainer: {
    marginBottom: 12,
  },
  quickButtonsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  quickButtonSelected: {
    backgroundColor: '#2c5530',
    borderColor: '#2c5530',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  quickButtonTextSelected: {
    color: '#fff',
  },
  booleanOptionContainer: {
    marginBottom: 16,
  },
  booleanOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  booleanOptionSelected: {
    backgroundColor: '#2c5530',
    borderColor: '#2c5530',
  },
  booleanOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  booleanOptionTextSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2c5530',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HoleCompletionModal;