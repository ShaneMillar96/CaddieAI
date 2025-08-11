import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Round, HoleScore } from '../../types/golf';
import { AppDispatch } from '../../store';
import { addHoleScore, updateHoleScore, optimisticUpdateHoleScore } from '../../store/slices/roundSlice';

interface ScorecardComponentProps {
  round: Round;
  currentHole: number;
  holeScores: HoleScore[];
}

const ScorecardComponent: React.FC<ScorecardComponentProps> = ({
  round,
  currentHole,
  holeScores,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Local state
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [modalScore, setModalScore] = useState<Partial<HoleScore>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Get current hole data
  const currentHoleData = round.course?.holes?.find(
    hole => hole.holeNumber === currentHole
  );

  // Get existing score for current hole
  const existingScore = holeScores.find(
    score => score.holeId === currentHoleData?.id
  );

  // Initialize score modal
  const openScoreModal = useCallback((editMode = false) => {
    setIsEditing(editMode);
    if (editMode && existingScore) {
      setModalScore({
        score: existingScore.score,
        putts: existingScore.putts,
        fairwayHit: existingScore.fairwayHit,
        greenInRegulation: existingScore.greenInRegulation,
        notes: existingScore.notes || '',
      });
    } else {
      setModalScore({
        score: currentHoleData?.par || 4,
        putts: 2,
        fairwayHit: false,
        greenInRegulation: false,
        notes: '',
      });
    }
    setShowScoreModal(true);
  }, [existingScore, currentHoleData]);

  // Save hole score
  const saveHoleScore = useCallback(async () => {
    if (!currentHoleData || !modalScore.score) {
      Alert.alert('Error', 'Please enter a valid score.');
      return;
    }

    const scoreData: Omit<HoleScore, 'id' | 'roundId'> = {
      holeId: currentHoleData.id,
      holeNumber: currentHole,
      score: modalScore.score,
      putts: modalScore.putts || 0,
      fairwayHit: modalScore.fairwayHit || false,
      greenInRegulation: modalScore.greenInRegulation || false,
      notes: modalScore.notes || '',
    };

    try {
      if (isEditing && existingScore) {
        // Update existing score
        await dispatch(updateHoleScore({
          roundId: round.id,
          holeScoreId: existingScore.id,
          holeScore: scoreData,
        })).unwrap();
      } else {
        // Add new score with optimistic update
        const optimisticScore: HoleScore = {
          id: Date.now(), // Temporary ID for optimistic update
          roundId: round.id,
          ...scoreData,
        };

        // Optimistic update for immediate UI feedback
        dispatch(optimisticUpdateHoleScore({
          roundId: round.id,
          holeScore: optimisticScore,
        }));

        // Then dispatch the actual API call
        await dispatch(addHoleScore({
          roundId: round.id,
          holeScore: scoreData,
        })).unwrap();
      }

      setShowScoreModal(false);
      setModalScore({});
    } catch (error) {
      Alert.alert('Error', 'Failed to save score. Please try again.');
    }
  }, [dispatch, round.id, currentHole, currentHoleData, modalScore, isEditing, existingScore]);

  // Quick score buttons
  const quickScoreOptions = currentHoleData?.par ? [
    { label: 'Ace', value: 1, color: '#ffd700' },
    { label: 'Eagle', value: currentHoleData.par - 2, color: '#28a745' },
    { label: 'Birdie', value: currentHoleData.par - 1, color: '#17a2b8' },
    { label: 'Par', value: currentHoleData.par, color: '#6c757d' },
    { label: 'Bogey', value: currentHoleData.par + 1, color: '#ffc107' },
    { label: 'Double', value: currentHoleData.par + 2, color: '#fd7e14' },
    { label: 'Triple+', value: currentHoleData.par + 3, color: '#dc3545' },
  ].filter(option => option.value > 0) : [];

  const quickSave = useCallback(async (strokes: number) => {
    if (!currentHoleData) return;

    const scoreData: Omit<HoleScore, 'id' | 'roundId'> = {
      holeId: currentHoleData.id,
      holeNumber: currentHole,
      score: strokes,
      putts: Math.max(1, Math.floor(strokes / 2)), // Estimate putts
      fairwayHit: false,
      greenInRegulation: strokes <= currentHoleData.par,
      notes: '',
    };

    try {
      const optimisticScore: HoleScore = {
        id: Date.now(),
        roundId: round.id,
        ...scoreData,
      };

      dispatch(optimisticUpdateHoleScore({
        roundId: round.id,
        holeScore: optimisticScore,
      }));

      await dispatch(addHoleScore({
        roundId: round.id,
        holeScore: scoreData,
      })).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to save quick score.');
    }
  }, [dispatch, round.id, currentHole, currentHoleData]);

  // Get score display info
  const getScoreInfo = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (strokes === 1) return { name: 'Ace', color: '#ffd700' };
    if (diff <= -2) return { name: 'Eagle', color: '#28a745' };
    if (diff === -1) return { name: 'Birdie', color: '#17a2b8' };
    if (diff === 0) return { name: 'Par', color: '#6c757d' };
    if (diff === 1) return { name: 'Bogey', color: '#ffc107' };
    if (diff === 2) return { name: 'Double', color: '#fd7e14' };
    return { name: 'Triple+', color: '#dc3545' };
  };

  if (!currentHoleData) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Hole data not available</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Hole {currentHole} Scorecard</Text>
          {existingScore && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openScoreModal(true)}
            >
              <Icon name="edit" size={16} color="#4a7c59" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hole info */}
        <View style={styles.holeInfo}>
          <View style={styles.holeInfoItem}>
            <Text style={styles.holeInfoLabel}>Par</Text>
            <Text style={styles.holeInfoValue}>{currentHoleData.par}</Text>
          </View>
          <View style={styles.holeInfoItem}>
            <Text style={styles.holeInfoLabel}>Yards</Text>
            <Text style={styles.holeInfoValue}>
              {currentHoleData.yardageMen || '-'}
            </Text>
          </View>
          <View style={styles.holeInfoItem}>
            <Text style={styles.holeInfoLabel}>Handicap</Text>
            <Text style={styles.holeInfoValue}>
              {currentHoleData.handicap || '-'}
            </Text>
          </View>
        </View>

        {/* Current score display */}
        {existingScore ? (
          <View style={styles.currentScore}>
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>{existingScore.score}</Text>
              <Text
                style={[
                  styles.scoreName,
                  {
                    color: getScoreInfo(existingScore.score, currentHoleData.par)
                      .color,
                  },
                ]}
              >
                {getScoreInfo(existingScore.score, currentHoleData.par).name}
              </Text>
            </View>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetailItem}>
                <Icon name="sports-golf" size={16} color="#6c757d" />
                <Text style={styles.scoreDetailText}>
                  {existingScore.putts} putts
                </Text>
              </View>
              {existingScore.fairwayHit && (
                <View style={styles.scoreDetailItem}>
                  <Icon name="check-circle" size={16} color="#28a745" />
                  <Text style={styles.scoreDetailText}>Fairway</Text>
                </View>
              )}
              {existingScore.greenInRegulation && (
                <View style={styles.scoreDetailItem}>
                  <Icon name="flag" size={16} color="#28a745" />
                  <Text style={styles.scoreDetailText}>GIR</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noScore}>
            <Text style={styles.noScoreText}>No score entered for this hole</Text>
          </View>
        )}

        {/* Quick score buttons */}
        {!existingScore && (
          <View style={styles.quickScoreSection}>
            <Text style={styles.quickScoreLabel}>Quick Score</Text>
            <View style={styles.quickScoreGrid}>
              {quickScoreOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.quickScoreButton,
                    { backgroundColor: option.color },
                  ]}
                  onPress={() => quickSave(option.value)}
                >
                  <Text style={styles.quickScoreButtonText}>
                    {option.value}
                  </Text>
                  <Text style={styles.quickScoreButtonLabel}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Detailed score button */}
        <TouchableOpacity
          style={styles.detailedScoreButton}
          onPress={() => openScoreModal(false)}
        >
          <Icon name="more-horiz" size={20} color="#4a7c59" />
          <Text style={styles.detailedScoreButtonText}>
            {existingScore ? 'Edit Detailed Score' : 'Enter Detailed Score'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Score Entry Modal */}
      <Modal
        visible={showScoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScoreModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowScoreModal(false)}
            >
              <Icon name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Hole {currentHole} - Par {currentHoleData.par}
            </Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={saveHoleScore}
            >
              <Text style={styles.modalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Score input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Score</Text>
              <View style={styles.strokesInput}>
                <TouchableOpacity
                  style={styles.strokesButton}
                  onPress={() =>
                    setModalScore(prev => ({
                      ...prev,
                      score: Math.max(1, (prev.score || 1) - 1),
                    }))
                  }
                >
                  <Icon name="remove" size={20} color="#4a7c59" />
                </TouchableOpacity>
                <Text style={styles.strokesValue}>{modalScore.score || 1}</Text>
                <TouchableOpacity
                  style={styles.strokesButton}
                  onPress={() =>
                    setModalScore(prev => ({
                      ...prev,
                      score: (prev.score || 1) + 1,
                    }))
                  }
                >
                  <Icon name="add" size={20} color="#4a7c59" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Putts input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Putts</Text>
              <View style={styles.strokesInput}>
                <TouchableOpacity
                  style={styles.strokesButton}
                  onPress={() =>
                    setModalScore(prev => ({
                      ...prev,
                      putts: Math.max(0, (prev.putts || 0) - 1),
                    }))
                  }
                >
                  <Icon name="remove" size={20} color="#4a7c59" />
                </TouchableOpacity>
                <Text style={styles.strokesValue}>{modalScore.putts || 0}</Text>
                <TouchableOpacity
                  style={styles.strokesButton}
                  onPress={() =>
                    setModalScore(prev => ({
                      ...prev,
                      putts: (prev.putts || 0) + 1,
                    }))
                  }
                >
                  <Icon name="add" size={20} color="#4a7c59" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Boolean inputs */}
            <View style={styles.checkboxGroup}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setModalScore(prev => ({
                    ...prev,
                    fairwayHit: !prev.fairwayHit,
                  }))
                }
              >
                <Icon
                  name={modalScore.fairwayHit ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#4a7c59"
                />
                <Text style={styles.checkboxLabel}>Fairway Hit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setModalScore(prev => ({
                    ...prev,
                    greenInRegulation: !prev.greenInRegulation,
                  }))
                }
              >
                <Icon
                  name={modalScore.greenInRegulation ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#4a7c59"
                />
                <Text style={styles.checkboxLabel}>Green in Regulation</Text>
              </TouchableOpacity>
            </View>

            {/* Notes input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={modalScore.notes || ''}
                onChangeText={(text) =>
                  setModalScore(prev => ({ ...prev, notes: text }))
                }
                placeholder="Add any notes about this hole..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#4a7c59',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  holeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  holeInfoItem: {
    alignItems: 'center',
  },
  holeInfoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 4,
  },
  holeInfoValue: {
    fontSize: 16,
    color: '#2c5530',
    fontWeight: '700',
  },
  currentScore: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 4,
  },
  scoreName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreDetailText: {
    fontSize: 14,
    color: '#6c757d',
  },
  noScore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noScoreText: {
    fontSize: 16,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  quickScoreSection: {
    marginBottom: 20,
  },
  quickScoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  quickScoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickScoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 60,
  },
  quickScoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickScoreButtonLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  detailedScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4a7c59',
    borderRadius: 8,
    gap: 8,
  },
  detailedScoreButtonText: {
    fontSize: 16,
    color: '#4a7c59',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5530',
  },
  modalSaveButton: {
    backgroundColor: '#4a7c59',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 8,
  },
  strokesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  strokesButton: {
    backgroundColor: '#f8f9fa',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  strokesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c5530',
    minWidth: 40,
    textAlign: 'center',
  },
  checkboxGroup: {
    gap: 16,
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2c5530',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c5530',
    textAlignVertical: 'top',
  },
});

export default ScorecardComponent;