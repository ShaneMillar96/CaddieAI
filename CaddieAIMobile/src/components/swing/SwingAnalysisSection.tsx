import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import { selectActiveRound } from '../../store/slices/roundSlice';
import { selectUser } from '../../store/slices/authSlice';
import { selectGarminState } from '../../store/slices/garminSlice';
import { 
  selectUserSkillContext, 
  selectSwingAnalysisContext,
  processSwingAnalysis,
  addSwingAnalysis,
  updateSwingAnalysisMetrics,
  SwingAnalysisSummary 
} from '../../store/slices/aiCaddieSlice';

// Swing analysis services
import SwingDetectionService from '../../services/SwingDetectionService';
import SwingPatternService, { PatternMatchResult } from '../../services/SwingPatternService';
import SwingMetricsService, { DetailedSwingMetrics } from '../../services/SwingMetricsService';
import swingApiService, { SwingAnalysisRequest, ValidationError } from '../../services/swingApi';
import { mobileSensorService } from '../../services/MobileSensorService';
import { SwingFeedbackService, SwingFeedbackResponse } from '../../services/SwingFeedbackService';
import { DynamicCaddieService } from '../../services/DynamicCaddieService';
import { swingAnalysisErrorHandler, SwingAnalysisErrorType } from '../../services/SwingAnalysisErrorHandler';
import { ErrorMessage } from '../auth/ErrorMessage';

// Components
import { SwingMetricsDisplay } from './SwingMetricsDisplay';
import { SwingPathChart } from './SwingPathChart';

const { width: screenWidth } = Dimensions.get('window');

export interface SwingAnalysisData {
  id: string;
  timestamp: number;
  metrics: DetailedSwingMetrics;
  patternMatch: PatternMatchResult;
  confidence: number;
  source: 'garmin' | 'mobile_sensors';
  clubType?: 'driver' | 'iron' | 'wedge' | 'putter';
}

export interface SwingAnalysisProps {
  onSwingDetected?: (analysis: SwingAnalysisData) => void;
  showDetailedMetrics?: boolean;
  enableAutoDetection?: boolean;
}

export const SwingAnalysisSection: React.FC<SwingAnalysisProps> = ({
  onSwingDetected,
  showDetailedMetrics = true,
  enableAutoDetection = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const activeRound = useSelector(selectActiveRound);
  const garminState = useSelector(selectGarminState);
  const userSkillContext = useSelector(selectUserSkillContext);
  const swingAnalysisContext = useSelector(selectSwingAnalysisContext);

  // Component state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentSwings, setRecentSwings] = useState<SwingAnalysisData[]>([]);
  const [selectedSwing, setSelectedSwing] = useState<SwingAnalysisData | null>(null);
  const [sensorStatus, setSensorStatus] = useState<'inactive' | 'active' | 'error'>('inactive');
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(enableAutoDetection);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<SwingFeedbackResponse | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Services
  const [swingDetectionService] = useState(() => SwingDetectionService.getInstance());
  const [swingPatternService] = useState(() => SwingPatternService.getInstance());
  const [swingMetricsService] = useState(() => SwingMetricsService.getInstance());
  const [dynamicCaddieService] = useState(() => new DynamicCaddieService());
  const [swingFeedbackService] = useState(() => new SwingFeedbackService(dynamicCaddieService));

  useEffect(() => {
    initializeSwingAnalysis();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (autoDetectionEnabled && activeRound) {
      startSwingDetection();
    } else {
      stopSwingDetection();
    }
  }, [autoDetectionEnabled, activeRound]);

  const initializeSwingAnalysis = async () => {
    if (!user) return;

    try {
      console.log('🏌️ SwingAnalysisSection: Initializing swing analysis');

      // Set up swing detection callbacks
      if (garminState.connectedDevice) {
        // Use Garmin device if available
        console.log('📱 SwingAnalysisSection: Using Garmin device for swing detection');
        setSensorStatus('active');
      } else {
        // Use mobile sensors as fallback
        console.log('📱 SwingAnalysisSection: Using mobile sensors for swing detection');
        
        const unsubscribe = mobileSensorService.onSwingDetection(handleMobileSwingDetection);
        mobileSensorService.setRoundActive(!!activeRound);
        setSensorStatus('active');

        return () => unsubscribe();
      }
    } catch (error) {
      console.error('❌ SwingAnalysisSection: Failed to initialize swing analysis:', error);
      setSensorStatus('error');
    }
  };

  const handleMobileSwingDetection = async (result: any) => {
    if (!result.detected || result.confidence < 60) return;

    try {
      setIsAnalyzing(true);
      console.log('🎯 SwingAnalysisSection: Processing mobile swing detection', {
        confidence: result.confidence,
        source: result.source
      });

      // Create swing analysis data
      const swingAnalysis = await processSwingDetection({
        metrics: result.swingMetrics,
        confidence: result.confidence,
        source: 'mobile_sensors',
        timestamp: Date.now()
      });

      if (swingAnalysis) {
        addSwingToHistory(swingAnalysis);
        
        // Convert to Redux format and dispatch to store
        const swingAnalysisSummary: SwingAnalysisSummary = {
          timestamp: new Date(swingAnalysis.timestamp).toISOString(),
          clubType: swingAnalysis.clubType || 'iron',
          confidence: swingAnalysis.confidence,
          clubheadSpeed: swingAnalysis.metrics.clubheadSpeed,
          swingTempo: swingAnalysis.metrics.swingTempo,
          balanceScore: swingAnalysis.patternMatch?.overallMatch || 75,
          patternMatch: swingAnalysis.patternMatch?.overallMatch || 75,
          source: swingAnalysis.source,
        };
        
        // Dispatch to Redux store
        dispatch(addSwingAnalysis(swingAnalysisSummary));
        
        // Generate AI feedback if user context is available
        if (user && userSkillContext) {
          generateSwingFeedback(swingAnalysis, swingAnalysisSummary);
        }
        
        onSwingDetected?.(swingAnalysis);
      }
    } catch (error) {
      console.error('❌ SwingAnalysisSection: Error processing swing detection:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processSwingDetection = async (detectionData: {
    metrics: any;
    confidence: number;
    source: 'garmin' | 'mobile_sensors';
    timestamp: number;
  }): Promise<SwingAnalysisData | null> => {
    try {
      // Convert basic metrics to detailed metrics if needed
      let detailedMetrics: DetailedSwingMetrics;
      
      if (detectionData.source === 'mobile_sensors') {
        // For mobile sensors, we need to enhance the basic metrics
        detailedMetrics = await enhanceBasicMetrics(detectionData.metrics);
      } else {
        detailedMetrics = detectionData.metrics as DetailedSwingMetrics;
      }

      // Run pattern matching
      const patternResults = await swingPatternService.compareSwing(
        detailedMetrics,
        [], // Phases would be available from detection service
        [], // Motion data would be available from detection service
        detailedMetrics.clubheadSpeed > 80 ? 'driver' : 'iron' // Estimate club type
      );

      const bestMatch = patternResults[0]; // Get best pattern match

      const swingAnalysis: SwingAnalysisData = {
        id: `swing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: detectionData.timestamp,
        metrics: detailedMetrics,
        patternMatch: bestMatch,
        confidence: detectionData.confidence,
        source: detectionData.source,
        clubType: bestMatch ? bestMatch.templateId.includes('driver') ? 'driver' : 
                             bestMatch.templateId.includes('iron') ? 'iron' :
                             bestMatch.templateId.includes('wedge') ? 'wedge' : 'iron' : 'iron'
      };

      console.log('✅ SwingAnalysisSection: Swing analysis completed', {
        swingId: swingAnalysis.id,
        confidence: swingAnalysis.confidence,
        patternMatch: bestMatch?.overallMatch,
        clubType: swingAnalysis.clubType
      });

      return swingAnalysis;
    } catch (error) {
      console.error('❌ SwingAnalysisSection: Error processing swing detection:', error);
      return null;
    }
  };

  const enhanceBasicMetrics = async (basicMetrics: any): Promise<DetailedSwingMetrics> => {
    // Convert mobile sensor basic metrics to detailed metrics format
    const enhanced: DetailedSwingMetrics = {
      // Basic metrics from detection
      maxSpeed: basicMetrics.peakAcceleration || 10,
      backswingAngle: 75, // Estimated
      downswingAngle: 70, // Estimated
      impactTiming: basicMetrics.duration * 0.7 || 1000, // Estimated
      followThroughAngle: 80, // Estimated
      swingTempo: basicMetrics.duration / 800 || 2.5, // Estimated
      swingPlane: 45, // Estimated
      clubheadSpeed: (basicMetrics.peakAcceleration || 10) * 5, // Rough conversion

      // Enhanced timing metrics
      addressDuration: 500,
      backswingDuration: (basicMetrics.duration || 1500) * 0.6,
      downswingDuration: (basicMetrics.duration || 1500) * 0.25,
      followThroughDuration: (basicMetrics.duration || 1500) * 0.15,
      transitionDuration: 100,

      // Advanced speed metrics
      backswingSpeed: (basicMetrics.peakAcceleration || 10) * 0.3,
      downswingSpeed: (basicMetrics.peakAcceleration || 10) * 0.8,
      speedAcceleration: basicMetrics.peakAcceleration || 10,
      peakSpeedTiming: 75,

      // Precision metrics
      swingConsistency: Math.min(100, (basicMetrics.confidence || 60) + 20),
      pathDeviation: Math.random() * 10 + 5, // Estimated
      faceAngleAtImpact: (Math.random() - 0.5) * 10, // Estimated
      attackAngle: (Math.random() - 0.5) * 6, // Estimated

      // Power metrics
      powerTransfer: Math.min(100, (basicMetrics.confidence || 60) + 15),
      energyGeneration: (basicMetrics.peakAcceleration || 10) * 50,
      impactForce: (basicMetrics.peakAcceleration || 10) * 25,

      // Balance and control
      balanceScore: Math.min(100, (basicMetrics.confidence || 60) + 10),
      controlFactor: Math.min(100, (basicMetrics.confidence || 60) + 5),
      rhythmScore: Math.min(100, (basicMetrics.confidence || 60)),

      // 3D analysis (simplified for mobile)
      swingPlaneDeviations: [
        { phase: 'backswing', deviation: Math.random() * 8, severity: 'minor' as const },
        { phase: 'downswing', deviation: Math.random() * 6, severity: 'minor' as const }
      ],
      rotationalVelocity: {
        maxRotationRate: (basicMetrics.peakRotation || 5) * 20,
        rotationAcceleration: basicMetrics.peakRotation || 5,
        axisStability: 85,
        handPath: [0, 1, 2, 3, 4, 3, 2, 1, 0]
      },
      linearAcceleration: {
        xAcceleration: [0, 2, 4, 6, 8, 10, 8, 6, 4, 2, 0],
        yAcceleration: [0, 1, 3, 5, 7, 9, 7, 5, 3, 1, 0],
        zAcceleration: [9.81, 10, 11, 12, 15, 18, 15, 12, 11, 10, 9.81],
        resultantPath: [9.81, 10.2, 11.8, 13.9, 17.7, 21.5, 17.9, 14.2, 12.1, 10.4, 9.81]
      }
    };

    return enhanced;
  };

  const addSwingToHistory = async (swing: SwingAnalysisData) => {
    // Add to local state first for immediate UI update
    setRecentSwings(prev => {
      const updated = [swing, ...prev].slice(0, 10); // Keep last 10 swings
      if (!selectedSwing) {
        setSelectedSwing(swing); // Auto-select first swing
      }
      return updated;
    });

    // Clear any previous save errors when adding new swing
    setSaveError(null);
    setRetryCount(0);

    // Save to backend if user and round are available
    if (user && activeRound) {
      await saveSwingToBackend(swing);
    } else {
      console.warn('⚠️ SwingAnalysisSection: Cannot save swing to backend - missing user or active round:', {
        hasUser: !!user,
        hasActiveRound: !!activeRound,
        swingId: swing.id
      });
    }
  };

  const saveSwingToBackend = async (swing: SwingAnalysisData, isRetry: boolean = false) => {
    if (!user || !activeRound) return;

    try {
      setIsSaving(true);
      
      if (!isRetry) {
        console.log('💾 SwingAnalysisSection: Saving swing to backend:', {
          swingId: swing.id,
          userId: user.id,
          roundId: activeRound.id,
          confidence: swing.confidence,
          source: swing.source
        });
      } else {
        console.log('🔄 SwingAnalysisSection: Retrying swing save to backend:', {
          swingId: swing.id,
          retryCount: retryCount + 1
        });
      }

      const swingRequest: SwingAnalysisRequest = {
        userId: user.id,
        roundId: activeRound.id,
        holeId: activeRound.currentHole?.id || undefined,
        garminDeviceId: swing.source === 'garmin' && garminState.connectedDevice?.id ? 
          parseInt(garminState.connectedDevice.id, 10) : undefined,
        swingSpeedMph: swing.metrics.clubheadSpeed ? 
          Math.min(150, Math.max(40, Math.round(swing.metrics.clubheadSpeed))) : undefined, // Cap between 40-150 mph
        swingAngleDegrees: swing.metrics.swingPlane || undefined,
        backswingAngleDegrees: swing.metrics.backswingAngle || undefined,
        followThroughAngleDegrees: swing.metrics.followThroughAngle || undefined,
        detectionSource: swing.source === 'mobile_sensors' ? 'mobile' : 'garmin',
        deviceModel: swing.source === 'mobile_sensors' ? 'Mobile Device Sensors' : 
                     garminState.connectedDevice?.name || undefined,
        detectionConfidence: swing.confidence / 100, // Convert percentage to decimal
        rawSensorData: swing.metrics.linearAcceleration ? {
          xAcceleration: swing.metrics.linearAcceleration.xAcceleration,
          yAcceleration: swing.metrics.linearAcceleration.yAcceleration,
          zAcceleration: swing.metrics.linearAcceleration.zAcceleration,
          resultantPath: swing.metrics.linearAcceleration.resultantPath,
          timestamp: swing.timestamp
        } : undefined,
        clubUsed: swing.clubType || undefined,
        swingQualityScore: swing.patternMatch ? swing.patternMatch.overallMatch / 10 : undefined, // Convert to 0-10 scale
        aiFeedback: swing.patternMatch?.templateName || undefined,
        comparedToTemplate: swing.patternMatch?.templateName || undefined
      };

      // Log the values being sent for debugging
      console.log('🏌️ SwingAnalysisSection: Sending swing data to backend:', {
        originalClubheadSpeed: swing.metrics.clubheadSpeed,
        cappedSwingSpeedMph: swingRequest.swingSpeedMph,
        detectionSource: swingRequest.detectionSource,
        confidence: swingRequest.detectionConfidence,
        garminDeviceId: swingRequest.garminDeviceId,
        deviceModel: swingRequest.deviceModel
      });

      const savedSwing = await swingApiService.createSwingAnalysis(swingRequest);
      
      console.log('✅ SwingAnalysisSection: Swing saved successfully to backend:', {
        backendId: savedSwing.id,
        localId: swing.id,
        userId: user.id,
        roundId: activeRound.id
      });

      // Clear error state on successful save
      setSaveError(null);
      setRetryCount(0);

    } catch (error: any) {
      // Handle error using the error handler service
      const swingError = swingAnalysisErrorHandler.handleError(
        error,
        {
          swingId: swing.id,
          userId: user?.id,
          roundId: activeRound?.id,
          operation: 'saveSwingToBackend'
        },
        SwingAnalysisErrorType.SERVER_UNAVAILABLE
      );

      console.error('❌ SwingAnalysisSection: Error saving swing to backend:', {
        errorType: swingError.type,
        message: swingError.message,
        userMessage: swingError.userMessage,
        swingId: swing.id,
        userId: user?.id,
        roundId: activeRound?.id,
        validationErrors: error.validationErrors
      });

      // Set user-friendly error message for UI display
      setSaveError(error.userFriendlyMessage || swingError.userMessage);
      setRetryCount(prev => prev + 1);

      // Log validation errors separately for debugging
      if (error.validationErrors && error.validationErrors.length > 0) {
        console.error('📋 SwingAnalysisSection: Backend validation errors:', 
          error.validationErrors.map((ve: ValidationError) => `${ve.field}: ${ve.message}`)
        );
      }

      // Don't block the UI - swing is still available locally
      console.warn('⚠️ SwingAnalysisSection: Swing saved locally but not to backend. User can retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const startSwingDetection = async () => {
    try {
      if (garminState.connectedDevice) {
        // Start Garmin swing detection
        console.log('🎯 SwingAnalysisSection: Starting Garmin swing detection');
        // Garmin detection would be handled by GarminBluetoothService
      } else {
        // Start mobile sensor detection
        console.log('📱 SwingAnalysisSection: Starting mobile sensor swing detection');
        await mobileSensorService.startSensorMonitoring();
      }
    } catch (error) {
      console.error('❌ SwingAnalysisSection: Failed to start swing detection:', error);
      setSensorStatus('error');
    }
  };

  const stopSwingDetection = async () => {
    try {
      console.log('⏹️ SwingAnalysisSection: Stopping swing detection');
      
      if (!garminState.connectedDevice) {
        await mobileSensorService.stopSensorMonitoring();
      }
      
      setSensorStatus('inactive');
    } catch (error) {
      console.error('❌ SwingAnalysisSection: Error stopping swing detection:', error);
    }
  };

  const toggleAutoDetection = () => {
    if (!activeRound) {
      Alert.alert(
        'Round Required',
        'Swing detection is only available during active rounds.',
        [{ text: 'OK' }]
      );
      return;
    }

    setAutoDetectionEnabled(!autoDetectionEnabled);
  };

  const cleanup = () => {
    stopSwingDetection();
  };

  const retrySwingSave = () => {
    if (recentSwings.length > 0 && user && activeRound) {
      const latestSwing = recentSwings[0];
      setSaveError(null);
      saveSwingToBackend(latestSwing, true);
    }
  };

  const dismissSaveError = () => {
    setSaveError(null);
    setRetryCount(0);
  };

  const generateSwingFeedback = async (
    swingAnalysis: SwingAnalysisData, 
    swingAnalysisSummary: SwingAnalysisSummary
  ) => {
    if (!user || !userSkillContext || isGeneratingFeedback) return;

    try {
      setIsGeneratingFeedback(true);
      console.log('🤖 SwingAnalysisSection: Generating AI feedback for swing:', {
        clubType: swingAnalysisSummary.clubType,
        confidence: swingAnalysisSummary.confidence,
        userId: user.id
      });

      // Build course context if available
      const courseContext = activeRound ? {
        holePar: activeRound.currentHole?.par || 4,
        holeDistance: activeRound.currentHole?.distance || 150,
        weatherConditions: 'Fair', // Could be enhanced with weather service
      } : undefined;

      // Generate AI-powered feedback
      const feedback = await swingFeedbackService.generateSwingFeedback({
        swingAnalysis: swingAnalysisSummary,
        userId: user.id,
        roundId: activeRound?.id,
        userSkillLevel: userSkillContext.skillLevel,
        detailedMetrics: swingAnalysis.metrics,
        patternMatch: swingAnalysis.patternMatch,
        recentSwings: swingAnalysisContext?.recentSwings || [],
        courseContext,
      });

      setCurrentFeedback(feedback);

      // Update Redux store with feedback insights
      if (feedback.improvementAreas.length > 0 || feedback.strengths.length > 0) {
        dispatch(updateSwingAnalysisMetrics({
          improvementAreas: feedback.improvementAreas,
          strengths: feedback.strengths,
        }));
      }

      console.log('✅ SwingAnalysisSection: AI feedback generated:', {
        feedbackLength: feedback.feedback.length,
        recommendations: feedback.recommendations.length,
        confidence: feedback.confidence
      });

    } catch (error) {
      // Handle AI feedback generation error
      const feedbackError = swingAnalysisErrorHandler.handleError(
        error as Error,
        {
          userId: user.id,
          roundId: activeRound?.id,
          clubType: swingAnalysisSummary.clubType,
          operation: 'generateSwingFeedback'
        },
        SwingAnalysisErrorType.FEEDBACK_GENERATION_FAILED
      );

      console.error('❌ SwingAnalysisSection: Error generating swing feedback:', {
        errorType: feedbackError.type,
        message: feedbackError.message,
        userMessage: feedbackError.userMessage
      });

      // Set fallback feedback
      setCurrentFeedback({
        feedback: `Nice ${swingAnalysisSummary.clubType} swing! Keep working on your technique.`,
        recommendations: ['Keep practicing your swing fundamentals'],
        strengths: ['Consistent effort'],
        improvementAreas: ['General technique'],
        nextSwingTips: ['Focus on balance and tempo'],
        confidence: 50,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon name="timeline" size={24} color="#2c5530" />
        <Text style={styles.title}>Swing Analysis</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          autoDetectionEnabled && styles.toggleButtonActive
        ]}
        onPress={toggleAutoDetection}
      >
        <Icon 
          name={autoDetectionEnabled ? 'stop' : 'play-arrow'} 
          size={20} 
          color={autoDetectionEnabled ? '#fff' : '#2c5530'} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderStatusIndicator = () => {
    let statusColor = '#666';
    let statusText = 'Inactive';
    let iconName = 'pause-circle-outline';

    if (isAnalyzing) {
      statusColor = '#ff9800';
      statusText = 'Analyzing swing...';
      iconName = 'sync';
    } else if (sensorStatus === 'active' && autoDetectionEnabled) {
      statusColor = '#4caf50';
      statusText = garminState.connectedDevice ? 'Garmin connected' : 'Mobile sensors active';
      iconName = 'sensors';
    } else if (sensorStatus === 'error') {
      statusColor = '#f44336';
      statusText = 'Sensor error';
      iconName = 'error-outline';
    }

    return (
      <View style={styles.statusContainer}>
        <Icon name={iconName} size={16} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        {isAnalyzing && <ActivityIndicator size="small" color="#ff9800" style={styles.spinner} />}
      </View>
    );
  };

  const renderSaveErrorMessage = () => {
    if (!saveError) return null;

    return (
      <ErrorMessage
        message={saveError}
        onRetry={retryCount < 3 ? retrySwingSave : undefined}
        style={styles.saveErrorMessage}
      />
    );
  };

  const renderSwingHistory = () => {
    if (recentSwings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="golf-course" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>
            {autoDetectionEnabled 
              ? 'Take a swing to see analysis' 
              : 'Enable detection to analyze swings'
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <View style={styles.historySectionHeader}>
          <Text style={styles.sectionTitle}>Recent Swings ({recentSwings.length})</Text>
          {isSaving && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color="#2c5530" />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          )}
        </View>
        {renderSaveErrorMessage()}
        <View style={styles.swingsList}>
          {recentSwings.slice(0, 3).map((swing) => (
            <TouchableOpacity
              key={swing.id}
              style={[
                styles.swingItem,
                selectedSwing?.id === swing.id && styles.swingItemSelected
              ]}
              onPress={() => setSelectedSwing(swing)}
            >
              <View style={styles.swingItemHeader}>
                <View style={styles.swingItemInfo}>
                  <Text style={styles.swingTime}>
                    {new Date(swing.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <View style={styles.swingItemBadges}>
                    <View style={[styles.clubBadge, styles[`${swing.clubType || 'driver'}Badge` as keyof typeof styles]]}>
                      <Text style={styles.clubBadgeText}>
                        {swing.clubType?.toUpperCase() || 'DRIVER'}
                      </Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceBadgeText}>
                        {Math.round(swing.confidence)}%
                      </Text>
                    </View>
                  </View>
                </View>
                <Icon 
                  name={swing.source === 'garmin' ? 'watch' : 'phone-android'} 
                  size={16} 
                  color="#666" 
                />
              </View>
              <View style={styles.swingItemMetrics}>
                <Text style={styles.metricText}>
                  Speed: {Math.round(swing.metrics.clubheadSpeed)} mph
                </Text>
                <Text style={styles.metricText}>
                  Tempo: {swing.metrics.swingTempo.toFixed(1)}
                </Text>
                {swing.patternMatch && (
                  <Text style={styles.metricText}>
                    Match: {swing.patternMatch.overallMatch}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSwingAnalysis = () => {
    if (!selectedSwing) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.sectionTitle}>Swing Details</Text>
        
        {showDetailedMetrics && (
          <SwingMetricsDisplay 
            metrics={selectedSwing.metrics}
            patternMatch={selectedSwing.patternMatch}
          />
        )}

        {selectedSwing?.metrics?.linearAcceleration && (
          <SwingPathChart 
            swingData={selectedSwing.metrics.linearAcceleration}
            patternData={selectedSwing.patternMatch}
            width={screenWidth - 40}
            height={200}
          />
        )}
      </View>
    );
  };

  // Don't render if no user or not in a round
  if (!user || !activeRound) {
    return (
      <View style={styles.container}>
        <View style={styles.disabledState}>
          <Icon name="golf-course" size={48} color="#ccc" />
          <Text style={styles.disabledStateText}>
            Swing analysis is available during active rounds
          </Text>
        </View>
      </View>
    );
  };

  const renderAIFeedback = () => {
    if (!currentFeedback && !isGeneratingFeedback) return null;

    return (
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>AI Caddie Feedback</Text>
        
        {isGeneratingFeedback ? (
          <View style={styles.feedbackLoading}>
            <ActivityIndicator size="small" color="#2c5530" />
            <Text style={styles.feedbackLoadingText}>Analyzing your swing...</Text>
          </View>
        ) : currentFeedback && (
          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackMessage}>{currentFeedback.feedback}</Text>
            
            {currentFeedback.strengths.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackSectionTitle}>✅ Strengths</Text>
                {currentFeedback.strengths.map((strength, index) => (
                  <Text key={index} style={styles.feedbackItem}>• {strength}</Text>
                ))}
              </View>
            )}
            
            {currentFeedback.improvementAreas.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackSectionTitle}>💡 Areas to Improve</Text>
                {currentFeedback.improvementAreas.map((area, index) => (
                  <Text key={index} style={styles.feedbackItem}>• {area}</Text>
                ))}
              </View>
            )}
            
            {currentFeedback.nextSwingTips.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackSectionTitle}>🎯 Next Swing Tips</Text>
                {currentFeedback.nextSwingTips.map((tip, index) => (
                  <Text key={index} style={styles.feedbackItem}>• {tip}</Text>
                ))}
              </View>
            )}
            
            <View style={styles.feedbackFooter}>
              <Text style={styles.feedbackConfidence}>
                Confidence: {currentFeedback.confidence}%
              </Text>
              <Text style={styles.feedbackTimestamp}>
                {new Date(currentFeedback.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderStatusIndicator()}
      {renderSwingHistory()}
      {renderAIFeedback()}
      {renderSwingAnalysis()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5530',
    marginLeft: 8,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4f1',
    borderWidth: 1,
    borderColor: '#2c5530',
  },
  toggleButtonActive: {
    backgroundColor: '#2c5530',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  spinner: {
    marginLeft: 8,
  },
  historyContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
  },
  swingsList: {
    gap: 8,
  },
  swingItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  swingItemSelected: {
    borderColor: '#2c5530',
    backgroundColor: '#f0f4f1',
  },
  swingItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  swingItemInfo: {
    flex: 1,
  },
  swingTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 4,
  },
  swingItemBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  clubBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  driverBadge: {
    backgroundColor: '#e3f2fd',
  },
  ironBadge: {
    backgroundColor: '#f3e5f5',
  },
  wedgeBadge: {
    backgroundColor: '#fff3e0',
  },
  putterBadge: {
    backgroundColor: '#e8f5e8',
  },
  clubBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2c5530',
  },
  confidenceBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2c5530',
  },
  swingItemMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricText: {
    fontSize: 12,
    color: '#666',
  },
  analysisContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  disabledState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  disabledStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // AI Feedback styles
  feedbackContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5530',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  feedbackLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c5530',
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 2,
    marginLeft: 8,
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 4,
  },
  feedbackConfidence: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  feedbackTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  
  // Save error and retry styles
  saveErrorMessage: {
    marginBottom: 12,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingText: {
    fontSize: 12,
    color: '#2c5530',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default SwingAnalysisSection;