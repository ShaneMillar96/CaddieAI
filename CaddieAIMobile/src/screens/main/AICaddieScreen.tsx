import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import {
  selectAICaddieState,
  selectVoiceSession,
  selectUserSkillContext,
  selectAdviceHistory,
  initializeVoiceSession,
  fetchUserContext,
  setError,
  clearError,
} from '../../store/slices/aiCaddieSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectActiveRound } from '../../store/slices/roundSlice';
import {
  selectTargetLocation,
  selectDistances,
  selectClubRecommendation,
  selectIsActive as selectIsShotPlacementActive,
  selectCurrentShot,
} from '../../store/slices/shotPlacementSlice';

// Components
import { VoiceAICaddieInterface } from '../../components/ai/VoiceAICaddieInterface';
import { SkillLevelDisplay } from '../../components/ai/SkillLevelDisplay';
import { ShotTypeRecognition } from '../../components/ai/ShotTypeRecognition';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AICaddieScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const activeRound = useSelector(selectActiveRound);
  const aiCaddieState = useSelector(selectAICaddieState);
  const voiceSession = useSelector(selectVoiceSession);
  const userSkillContext = useSelector(selectUserSkillContext);
  const adviceHistory = useSelector(selectAdviceHistory);

  // Shot placement context from ActiveRoundScreen
  const shotPlacementTarget = useSelector(selectTargetLocation);
  const shotDistances = useSelector(selectDistances);
  const clubRecommendation = useSelector(selectClubRecommendation);
  const isShotPlacementActive = useSelector(selectIsShotPlacementActive);
  const currentShot = useSelector(selectCurrentShot);

  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize AI Caddie when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (user && !aiCaddieState.isInitialized) {
        initializeAICaddie();
      }

      return () => {
        // Cleanup when screen loses focus
        dispatch(clearError());
      };
    }, [user, aiCaddieState.isInitialized])
  );

  const initializeAICaddie = async () => {
    if (!user || isInitializing) return;

    setIsInitializing(true);
    dispatch(clearError());

    try {
      // Fetch user skill context
      await dispatch(fetchUserContext(user.id)).unwrap();

      // Initialize voice session
      const sessionParams = {
        userId: user.id,
        roundId: activeRound?.id,
      };

      await dispatch(initializeVoiceSession(sessionParams)).unwrap();

      console.log('✅ AICaddieScreen: AI Caddie initialized successfully');
    } catch (error) {
      console.error('❌ AICaddieScreen: Failed to initialize AI Caddie:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize AI Caddie';
      dispatch(setError(errorMessage));
      
      Alert.alert(
        'AI Caddie Unavailable',
        'Unable to connect to your AI Caddie. You can still access general advice features.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const renderStatusIndicator = () => {
    if (isInitializing) {
      return (
        <View style={styles.statusContainer}>
          <Icon name="sync" size={20} color="#4a7c59" />
          <Text style={styles.statusText}>Initializing AI Caddie...</Text>
        </View>
      );
    }

    if (aiCaddieState.error) {
      return (
        <View style={[styles.statusContainer, styles.errorStatus]}>
          <Icon name="error-outline" size={20} color="#d32f2f" />
          <Text style={[styles.statusText, styles.errorText]}>
            AI Caddie offline - using fallback mode
          </Text>
        </View>
      );
    }

    if (voiceSession.isActive) {
      return (
        <View style={[styles.statusContainer, styles.activeStatus]}>
          <Icon name="mic" size={20} color="#2c5530" />
          <Text style={[styles.statusText, styles.activeText]}>
            AI Caddie ready
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>AI Caddie</Text>
      <Text style={styles.subtitle}>
        {activeRound 
          ? `Voice-powered caddie for your round`
          : 'Your personal golf assistant'
        }
      </Text>
      {renderStatusIndicator()}
    </View>
  );

  const renderSkillContext = () => {
    if (!userSkillContext) return null;

    return (
      <View style={styles.contextSection}>
        <SkillLevelDisplay
          skillLevel={userSkillContext.skillLevel}
          handicap={userSkillContext.handicap}
        />
      </View>
    );
  };

  const renderShotTypeRecognition = () => {
    if (!activeRound) return null;

    return (
      <View style={styles.contextSection}>
        <ShotTypeRecognition />
      </View>
    );
  };

  const renderShotPlacementContext = () => {
    if (!shotPlacementTarget && !isShotPlacementActive) return null;

    return (
      <View style={styles.contextSection}>
        <Text style={styles.sectionTitle}>Current Shot Context</Text>
        
        {shotPlacementTarget && (
          <View style={styles.shotContextCard}>
            <Icon name="place" size={20} color="#2c5530" />
            <View style={styles.shotContextDetails}>
              <Text style={styles.shotContextText}>
                Target Location: {shotDistances.fromCurrent}yd
              </Text>
              {clubRecommendation && (
                <Text style={styles.clubContextText}>
                  Recommended: {clubRecommendation}
                </Text>
              )}
            </View>
          </View>
        )}

        {isShotPlacementActive && (
          <View style={styles.activeIndicator}>
            <Icon name="gps-fixed" size={16} color="#2c5530" />
            <Text style={styles.activeText}>Shot placement mode active</Text>
          </View>
        )}
      </View>
    );
  };

  const renderVoiceInterface = () => (
    <View style={styles.voiceSection}>
      <VoiceAICaddieInterface />
    </View>
  );

  const renderAdviceHistory = () => {
    if (adviceHistory.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recent Advice</Text>
        <ScrollView 
          style={styles.historyScroll}
          showsVerticalScrollIndicator={false}
        >
          {adviceHistory.slice(0, 3).map((advice, index) => (
            <View key={advice.id} style={styles.adviceItem}>
              <View style={styles.adviceHeader}>
                {advice.shotType && (
                  <View style={styles.shotTypeTag}>
                    <Text style={styles.shotTypeText}>
                      {advice.shotType.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.adviceTime}>
                  {new Date(advice.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={styles.adviceMessage}>{advice.message}</Text>
              {advice.clubRecommendation && (
                <Text style={styles.clubRecommendation}>
                  Club: {advice.clubRecommendation}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderInstructions = () => {
    if (voiceSession.isActive && adviceHistory.length > 0) return null;

    return (
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>How to use your AI Caddie:</Text>
        <View style={styles.instructionItem}>
          <Icon name="mic" size={16} color="#4a7c59" />
          <Text style={styles.instructionText}>
            Tap and hold the microphone to ask for advice
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="golf-course" size={16} color="#4a7c59" />
          <Text style={styles.instructionText}>
            Get club recommendations and shot strategy
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="school" size={16} color="#4a7c59" />
          <Text style={styles.instructionText}>
            Receive advice tailored to your skill level
          </Text>
        </View>
        {activeRound && (
          <View style={styles.instructionItem}>
            <Icon name="location-on" size={16} color="#4a7c59" />
            <Text style={styles.instructionText}>
              Shot analysis based on your position
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        backgroundColor="#2c5530" 
        barStyle="light-content" 
        translucent={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderSkillContext()}
        {renderShotPlacementContext()}
        {renderShotTypeRecognition()}
        {renderVoiceInterface()}
        {renderAdviceHistory()}
        {renderInstructions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c5530',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a7c59',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f4f1',
  },
  activeStatus: {
    backgroundColor: '#e8f5e8',
  },
  errorStatus: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 14,
    color: '#4a7c59',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeText: {
    color: '#2c5530',
  },
  errorText: {
    color: '#d32f2f',
  },
  contextSection: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  voiceSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  historySection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  historyScroll: {
    maxHeight: 200,
  },
  adviceItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shotTypeTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shotTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2c5530',
  },
  adviceTime: {
    fontSize: 12,
    color: '#666',
  },
  adviceMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  clubRecommendation: {
    fontSize: 13,
    color: '#4a7c59',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  shotContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  shotContextDetails: {
    marginLeft: 12,
    flex: 1,
  },
  shotContextText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 4,
  },
  clubContextText: {
    fontSize: 13,
    color: '#4a7c59',
    fontStyle: 'italic',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    padding: 8,
  },
  instructionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  generalAdviceSection: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  generalAdviceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  topicText: {
    fontSize: 12,
    color: '#2c5530',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
  },
  modeText: {
    fontSize: 12,
    color: '#2c5530',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AICaddieScreen;