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
  const [isEditingPar, setIsEditingPar] = useState<boolean>(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setPar(existingPar?.toString() || '');
      setScore('');
      setIsEditingPar(false); // Reset edit mode when modal opens
    }
  }, [visible, existingPar]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!score.trim()) {
      Alert.alert('Required Field', 'Please enter your score for this hole.');
      return;
    }

    if ((isFirstTimePlayingHole || isEditingPar) && !par.trim()) {
      Alert.alert('Required Field', 'Please enter the par for this hole.');
      return;
    }

    const scoreNum = parseInt(score, 10);
    const parNum = par.trim() ? parseInt(par, 10) : undefined;

    // Validate numeric inputs
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 15) {
      Alert.alert('Invalid Score', 'Please enter a valid score between 1 and 15.');
      return;
    }

    if (parNum !== undefined && (isNaN(parNum) || parNum < 3 || parNum > 6)) {
      Alert.alert('Invalid Par', 'Please enter a valid par between 3 and 6.');
      return;
    }

    const completion: HoleCompletionRequest = {
      roundId,
      holeNumber,
      score: scoreNum,
      par: parNum,
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
          <Text style={styles.title}>Score for Hole {holeNumber}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Par Section */}
          {(isFirstTimePlayingHole || existingPar) && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Par for Hole {holeNumber} <Text style={styles.required}>*</Text>
              </Text>
              
              {isFirstTimePlayingHole ? (
                <>
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
                </>
              ) : existingPar && !isEditingPar ? (
                <View style={styles.parDisplayContainer}>
                  <View style={styles.parDisplay}>
                    <Text style={styles.parDisplayText}>Par {existingPar}</Text>
                    <TouchableOpacity
                      style={styles.editParButton}
                      onPress={() => setIsEditingPar(true)}
                      activeOpacity={0.7}
                    >
                      <Icon name="edit" size={16} color="#4a7c59" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.parDisplayDescription}>
                    Tap the edit icon if the par value is incorrect
                  </Text>
                </View>
              ) : (
                <View style={styles.parEditContainer}>
                  <Text style={styles.inputDescription}>
                    Edit the par value for this hole:
                  </Text>
                  <View style={styles.parEditRow}>
                    <TextInput
                      style={[styles.numberInput, styles.parEditInput]}
                      value={par}
                      onChangeText={setPar}
                      placeholder="e.g., 4"
                      keyboardType="numeric"
                      maxLength={1}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={() => {
                        setPar(existingPar?.toString() || '');
                        setIsEditingPar(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelEditButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
              <Text style={styles.submitButtonText}>Saving Score...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Save Score</Text>
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
  // Par display styles
  parDisplayContainer: {
    marginBottom: 12,
  },
  parDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  parDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  editParButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4a7c59',
  },
  parDisplayDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  // Par edit styles
  parEditContainer: {
    marginBottom: 12,
  },
  parEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parEditInput: {
    flex: 1,
  },
  cancelEditButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});

export default HoleCompletionModal;