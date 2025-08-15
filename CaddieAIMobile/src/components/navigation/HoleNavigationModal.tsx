/**
 * HoleNavigationModal Component
 * 
 * A full-screen modal that allows golfers to navigate between holes during their round.
 * Features a grid-based hole selector with visual status indicators and quick navigation actions.
 * 
 * Features:
 * - Grid layout displaying all holes (1-18) in 3-column format
 * - Visual status indicators (Completed/Current/Upcoming)
 * - Quick navigation buttons (Previous/Next/Return to Current)
 * - Score display for completed holes
 * - Integration with Redux hole navigation state
 * 
 * @version 1.0.0
 * @author Claude Code Assistant  
 * @date August 15, 2025
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentHole,
  selectViewingHole,
  selectActiveRound,
  selectAllHoleStatuses,
  selectCanNavigateToNext,
  selectCanNavigateToPrevious,
  selectIsViewingDifferentHole,
} from '../../store/selectors/roundSelectors';
import {
  setViewingHole,
  navigateToNextHole,
  navigateToPreviousHole,
  resetToCurrentHole,
  setShowQuickScoreEditor,
} from '../../store/slices/roundSlice';
import { HoleStatus, HoleStatusType } from '../../types/golf';

// =============================================================================
// INTERFACES
// =============================================================================

interface HoleNavigationModalProps {
  visible: boolean;
  onClose: () => void;
}

interface HoleGridItemProps {
  holeStatus: HoleStatus;
  isViewing: boolean;
  onPress: (holeNumber: number) => void;
  onEditScore?: (holeNumber: number) => void;
}

// =============================================================================
// HOLE GRID ITEM COMPONENT
// =============================================================================

const HoleGridItem: React.FC<HoleGridItemProps> = ({ holeStatus, isViewing, onPress, onEditScore }) => {
  const { holeNumber, status, score } = holeStatus;
  
  const getHoleStyles = () => {
    if (isViewing) {
      return [styles.holeGridItem, styles.holeGridItemViewing];
    }
    
    switch (status) {
      case HoleStatusType.Completed:
        return [styles.holeGridItem, styles.holeGridItemCompleted];
      case HoleStatusType.Current:
        return [styles.holeGridItem, styles.holeGridItemCurrent];
      case HoleStatusType.Upcoming:
      default:
        return [styles.holeGridItem, styles.holeGridItemUpcoming];
    }
  };

  const getHoleTextStyles = () => {
    if (isViewing) {
      return [styles.holeGridNumber, styles.holeGridTextViewing];
    }
    
    switch (status) {
      case HoleStatusType.Completed:
      case HoleStatusType.Current:
        return [styles.holeGridNumber, styles.holeGridTextLight];
      case HoleStatusType.Upcoming:
      default:
        return [styles.holeGridNumber, styles.holeGridTextDark];
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case HoleStatusType.Completed:
        return <Icon name="check" size={16} color="#fff" />;
      case HoleStatusType.Current:
        return <Icon name="location-on" size={16} color="#fff" />;
      default:
        return null;
    }
  };

  const getSubtitle = () => {
    if (isViewing) return 'Viewing';
    if (status === HoleStatusType.Completed && score) return score.toString();
    if (status === HoleStatusType.Current) return 'Current';
    return null;
  };

  const handleEditPress = (e: any) => {
    e.stopPropagation(); // Prevent navigation when edit button is pressed
    if (onEditScore) {
      onEditScore(holeNumber);
    }
  };

  return (
    <TouchableOpacity
      style={getHoleStyles()}
      onPress={() => onPress(holeNumber)}
      activeOpacity={0.7}
    >
      <View style={styles.holeGridContent}>
        <View style={styles.holeGridHeader}>
          <Text style={getHoleTextStyles()}>{holeNumber}</Text>
          <View style={styles.holeGridIcons}>
            {getStatusIcon()}
            {status === HoleStatusType.Completed && onEditScore && (
              <TouchableOpacity
                style={styles.editScoreButton}
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <Icon name="edit" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {getSubtitle() && (
          <Text style={[styles.holeGridSubtitle, getHoleTextStyles()]}>
            {getSubtitle()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const HoleNavigationModal: React.FC<HoleNavigationModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  
  // Selectors
  const currentHole = useSelector(selectCurrentHole);
  const viewingHole = useSelector(selectViewingHole);
  const activeRound = useSelector(selectActiveRound);
  const holeStatuses = useSelector(selectAllHoleStatuses);
  const canNavigateNext = useSelector(selectCanNavigateToNext);
  const canNavigatePrevious = useSelector(selectCanNavigateToPrevious);
  const isViewingDifferentHole = useSelector(selectIsViewingDifferentHole);

  // Early return if no active round
  if (!activeRound) {
    return null;
  }

  const totalHoles = activeRound.course?.totalHoles || 18;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleNavigateToHole = (holeNumber: number) => {
    dispatch(setViewingHole(holeNumber));
    onClose();
  };

  const handleNextHole = () => {
    dispatch(navigateToNextHole());
  };

  const handlePreviousHole = () => {
    dispatch(navigateToPreviousHole());
  };

  const handleReturnToCurrent = () => {
    dispatch(resetToCurrentHole());
  };

  const handleEditScore = (holeNumber: number) => {
    // Set the viewing hole to the hole being edited
    dispatch(setViewingHole(holeNumber));
    // Close the navigation modal
    onClose();
    // Show the quick score editor
    dispatch(setShowQuickScoreEditor(true));
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderHoleGrid = () => {
    const rows: HoleStatus[][] = [];
    
    // Group holes into rows of 3
    for (let i = 0; i < holeStatuses.length; i += 3) {
      rows.push(holeStatuses.slice(i, i + 3));
    }

    return (
      <View style={styles.holeGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.holeGridRow}>
            {row.map((holeStatus) => (
              <HoleGridItem
                key={holeStatus.holeNumber}
                holeStatus={holeStatus}
                isViewing={holeStatus.holeNumber === viewingHole}
                onPress={handleNavigateToHole}
                onEditScore={handleEditScore}
              />
            ))}
            {/* Fill empty cells in last row if needed */}
            {row.length < 3 && rowIndex === rows.length - 1 && 
              Array.from({ length: 3 - row.length }, (_, index) => (
                <View key={`empty-${index}`} style={styles.holeGridItemEmpty} />
              ))
            }
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={[styles.quickActionButton, !canNavigatePrevious && styles.quickActionButtonDisabled]}
        onPress={handlePreviousHole}
        disabled={!canNavigatePrevious}
        activeOpacity={0.7}
      >
        <Icon name="keyboard-arrow-left" size={24} color={canNavigatePrevious ? "#4a7c59" : "#ccc"} />
        <Text style={[styles.quickActionText, !canNavigatePrevious && styles.quickActionTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickActionButton, !canNavigateNext && styles.quickActionButtonDisabled]}
        onPress={handleNextHole}
        disabled={!canNavigateNext}
        activeOpacity={0.7}
      >
        <Text style={[styles.quickActionText, !canNavigateNext && styles.quickActionTextDisabled]}>
          Next
        </Text>
        <Icon name="keyboard-arrow-right" size={24} color={canNavigateNext ? "#4a7c59" : "#ccc"} />
      </TouchableOpacity>

      {isViewingDifferentHole && (
        <TouchableOpacity
          style={styles.returnToCurrentButton}
          onPress={handleReturnToCurrent}
          activeOpacity={0.7}
        >
          <Icon name="my-location" size={20} color="#fff" />
          <Text style={styles.returnToCurrentText}>
            Return to Current (Hole {currentHole})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Hole Navigation</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Course Info */}
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{activeRound.course?.name}</Text>
            <Text style={styles.courseDetails}>
              {totalHoles} holes • Currently viewing Hole {viewingHole}
            </Text>
            {isViewingDifferentHole && (
              <View style={styles.viewingNotice}>
                <Icon name="info" size={16} color="#f39c12" />
                <Text style={styles.viewingNoticeText}>
                  You're viewing a different hole than your current position (Hole {currentHole})
                </Text>
              </View>
            )}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Legend:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.legendIconCompleted]}>
                  <Icon name="check" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.legendIconCurrent]}>
                  <Icon name="location-on" size={12} color="#fff" />
                </View>
                <Text style={styles.legendText}>Current</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.legendIconUpcoming]} />
                <Text style={styles.legendText}>Upcoming</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.legendIconViewing]} />
                <Text style={styles.legendText}>Viewing</Text>
              </View>
            </View>
          </View>

          {/* Hole Grid */}
          {renderHoleGrid()}
        </ScrollView>

        {/* Quick Actions */}
        {renderQuickActions()}
      </SafeAreaView>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

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
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  courseInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  viewingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9c4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  viewingNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#d68910',
    marginLeft: 8,
    lineHeight: 18,
  },
  legend: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendIconCompleted: {
    backgroundColor: '#22c55e',
  },
  legendIconCurrent: {
    backgroundColor: '#3b82f6',
  },
  legendIconUpcoming: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  legendIconViewing: {
    backgroundColor: '#8b5cf6',
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  holeGrid: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  holeGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  holeGridItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 64,
  },
  holeGridItemCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  holeGridItemCurrent: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  holeGridItemUpcoming: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  holeGridItemViewing: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  holeGridItemEmpty: {
    flex: 1,
    marginHorizontal: 4,
  },
  holeGridContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  holeGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  holeGridIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  holeGridNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  holeGridTextLight: {
    color: '#fff',
  },
  holeGridTextDark: {
    color: '#374151',
  },
  holeGridTextViewing: {
    color: '#fff',
  },
  holeGridSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  quickActions: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a7c59',
  },
  quickActionTextDisabled: {
    color: '#ccc',
  },
  returnToCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5530',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  returnToCurrentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  editScoreButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});

export default HoleNavigationModal;