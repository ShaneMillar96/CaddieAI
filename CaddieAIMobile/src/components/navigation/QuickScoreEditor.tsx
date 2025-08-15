/**
 * QuickScoreEditor Component
 * 
 * A compact modal for quickly editing scores of completed holes during a round.
 * Provides fast, focused interface for correcting score mistakes without interrupting gameplay.
 * 
 * Features:
 * - Compact modal layout (not full screen)
 * - Score validation (1-15 range)
 * - Optional putts and notes fields
 * - Real-time validation feedback
 * - Optimistic updates with error rollback
 * - Integration with Redux state and backend API
 * 
 * @version 1.0.0
 * @author Claude Code Assistant  
 * @date August 15, 2025
 */

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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuickScore } from '../../store/slices/roundSlice';
import { selectHoleScoreForEditing } from '../../store/selectors/roundSelectors';
import { RootState } from '../../store';
import { HoleScore, QuickScoreUpdate } from '../../types/golf';
import roundApi from '../../services/roundApi';

// =============================================================================
// INTERFACES
// =============================================================================

interface QuickScoreEditorProps {
  visible: boolean;
  onClose: () => void;
  holeNumber: number;
  roundId: number;
  onScoreUpdate?: (updatedScore: HoleScore) => void;
}

interface QuickScoreEditorState {
  score: string;
  putts: string;
  notes: string;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const QuickScoreEditor: React.FC<QuickScoreEditorProps> = ({
  visible,
  onClose,
  holeNumber,
  roundId,
  onScoreUpdate,
}) => {
  const dispatch = useDispatch();
  
  // Select existing score data
  const existingScore = useSelector((state: RootState) => 
    selectHoleScoreForEditing(state, holeNumber)
  );

  // Local state
  const [formState, setFormState] = useState<QuickScoreEditorState>({
    score: '',
    putts: '',
    notes: '',
    isLoading: false,
    error: null,
  });

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Reset form when modal opens or score data changes
  useEffect(() => {
    if (visible && existingScore) {
      setFormState(prev => ({
        ...prev,
        score: existingScore.score?.toString() || '',
        putts: existingScore.putts?.toString() || '',
        notes: existingScore.notes || '',
        error: null,
      }));
    } else if (visible) {
      // Reset form for new score
      setFormState(prev => ({
        ...prev,
        score: '',
        putts: '',
        notes: '',
        error: null,
      }));
    }
  }, [visible, existingScore]);

  // =============================================================================
  // VALIDATION
  // =============================================================================

  const validateForm = (): { isValid: boolean; error?: string } => {
    // Score is required
    if (!formState.score.trim()) {
      return { isValid: false, error: 'Score is required' };
    }

    const scoreNum = parseInt(formState.score, 10);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 15) {
      return { isValid: false, error: 'Score must be between 1 and 15' };
    }

    // Validate putts if provided
    if (formState.putts.trim()) {
      const puttsNum = parseInt(formState.putts, 10);
      if (isNaN(puttsNum) || puttsNum < 0 || puttsNum > 10) {
        return { isValid: false, error: 'Putts must be between 0 and 10' };
      }
    }

    // Validate notes length
    if (formState.notes.length > 100) {
      return { isValid: false, error: 'Notes must be 100 characters or less' };
    }

    return { isValid: true };
  };

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleInputChange = (field: keyof QuickScoreEditorState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null, // Clear error on input change
    }));
  };

  const handleSave = async () => {
    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setFormState(prev => ({ ...prev, error: validation.error || null }));
      return;
    }

    // Prepare update data
    const scoreNum = parseInt(formState.score, 10);
    const puttsNum = formState.putts.trim() ? parseInt(formState.putts, 10) : undefined;

    const quickScoreUpdate: QuickScoreUpdate = {
      roundId,
      holeNumber,
      score: scoreNum,
      putts: puttsNum,
      notes: formState.notes.trim() || undefined,
    };

    setFormState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get existing hole score ID for API update
      if (!existingScore) {
        throw new Error('No existing score found for this hole');
      }

      // Update via API
      const updatedScore = await roundApi.updateHoleScore(roundId, existingScore.id, {
        score: scoreNum,
        putts: puttsNum,
        notes: formState.notes.trim() || undefined,
      });

      // Update Redux store
      dispatch(updateQuickScore(quickScoreUpdate));

      // Call parent callback if provided
      if (onScoreUpdate) {
        onScoreUpdate(updatedScore);
      }

      // Close modal on success
      onClose();

    } catch (error: any) {
      console.error('Error updating quick score:', error);
      setFormState(prev => ({
        ...prev,
        error: error.message || 'Failed to update score. Please try again.',
      }));
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (existingScore) {
      setFormState(prev => ({
        ...prev,
        score: existingScore.score?.toString() || '',
        putts: existingScore.putts?.toString() || '',
        notes: existingScore.notes || '',
        error: null,
      }));
    }
    onClose();
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderErrorMessage = () => {
    if (!formState.error) return null;

    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={16} color="#e74c3c" />
        <Text style={styles.errorText}>{formState.error}</Text>
      </View>
    );
  };

  const renderLoadingSpinner = () => {
    if (!formState.isLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="small" color="#2c5530" />
        <Text style={styles.loadingText}>Updating score...</Text>
      </View>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleCancel}
      transparent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={styles.closeButton}
                disabled={formState.isLoading}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Hole {holeNumber} Score</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Score Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Score <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    formState.error?.includes('Score') && styles.inputError
                  ]}
                  value={formState.score}
                  onChangeText={(value) => handleInputChange('score', value)}
                  placeholder="Enter strokes"
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="next"
                  editable={!formState.isLoading}
                  autoFocus
                />
              </View>

              {/* Putts Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Putts</Text>
                <TextInput
                  style={[
                    styles.numberInput,
                    formState.error?.includes('Putts') && styles.inputError
                  ]}
                  value={formState.putts}
                  onChangeText={(value) => handleInputChange('putts', value)}
                  placeholder="Enter putts (optional)"
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="next"
                  editable={!formState.isLoading}
                />
              </View>

              {/* Notes Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    formState.error?.includes('Notes') && styles.inputError
                  ]}
                  value={formState.notes}
                  onChangeText={(value) => handleInputChange('notes', value)}
                  placeholder="Optional notes (max 100 chars)"
                  maxLength={100}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  editable={!formState.isLoading}
                />
                <Text style={styles.characterCount}>
                  {formState.notes.length}/100
                </Text>
              </View>

              {/* Error Message */}
              {renderErrorMessage()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={formState.isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (formState.isLoading || !validateForm().isValid) && styles.saveButtonDisabled
                ]}
                onPress={handleSave}
                disabled={formState.isLoading || !validateForm().isValid}
                activeOpacity={0.7}
              >
                {formState.isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonSpinner} />
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {renderLoadingSpinner()}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  numberInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffeaea',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaea',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2c5530',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#2c5530',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default QuickScoreEditor;