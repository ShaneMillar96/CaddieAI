/**
 * QuickScoreEditor Component
 * 
 * A simple, focused modal for quickly editing scores of completed holes during a round.
 * Provides fast score correction without interrupting gameplay - focused on score only.
 * 
 * Features:
 * - Compact single-field modal layout
 * - Score validation (1-15 range)
 * - Real-time validation feedback
 * - Optimistic updates with error rollback
 * - Integration with Redux state and backend API
 * 
 * @version 2.0.0 - Simplified to score-only editing
 * @author Claude Code Assistant  
 * @date August 18, 2025
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
        error: null,
      }));
    } else if (visible) {
      // Reset form for new score
      setFormState(prev => ({
        ...prev,
        score: '',
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

    const quickScoreUpdate: QuickScoreUpdate = {
      roundId,
      holeNumber,
      score: scoreNum,
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
              {/* Score Field - Enhanced for single field layout */}
              <View style={styles.scoreInputContainer}>
                <Text style={styles.scoreInputLabel}>
                  Score <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.scoreInput,
                    formState.error && styles.inputError
                  ]}
                  value={formState.score}
                  onChangeText={(value) => handleInputChange('score', value)}
                  placeholder="Enter strokes (1-15)"
                  keyboardType="number-pad"
                  maxLength={2}
                  returnKeyType="done"
                  editable={!formState.isLoading}
                  autoFocus
                />
                <Text style={styles.scoreHint}>
                  Valid range: 1-15 strokes
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
                  <Text style={styles.saveButtonText}>Save Score</Text>
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
    width: '85%',
    maxWidth: 360,
    maxHeight: '60%',
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  // Enhanced styles for single score input
  scoreInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreInputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#2c5530',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#2c5530',
    textAlign: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  scoreHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Legacy styles (kept for compatibility)
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
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffeaea',
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