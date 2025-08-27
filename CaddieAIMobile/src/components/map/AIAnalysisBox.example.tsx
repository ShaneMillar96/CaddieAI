/**
 * AIAnalysisBox Usage Examples
 * 
 * This file demonstrates how to integrate the AIAnalysisBox component
 * with different states and scenarios in the golf application.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AIAnalysisBox, ShotAnalysis, WeatherConditions } from './AIAnalysisBox';

// =============================================================================
// EXAMPLE USAGE COMPONENT
// =============================================================================

export const AIAnalysisBoxExample: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ShotAnalysis | null>(null);

  // Example weather conditions
  const exampleWeather: WeatherConditions = {
    conditions: 'Windy',
    windSpeed: 15,
    windDirection: 'SW',
    temperature: 22,
  };

  // Example shot analysis
  const exampleAnalysis: ShotAnalysis = {
    recommendedClub: '7 Iron',
    shotTips: [
      'Aim slightly left of target',
      'Account for 15mph headwind', 
      'Use smooth, controlled tempo'
    ],
    weatherConditions: exampleWeather,
    confidenceScore: 85,
  };

  // Demo functions
  const showLoadingState = () => {
    setError(null);
    setAnalysis(null);
    setIsLoading(true);
    setVisible(true);
  };

  const showAnalysisState = () => {
    setError(null);
    setIsLoading(false);
    setAnalysis(exampleAnalysis);
    setVisible(true);
  };

  const showErrorState = () => {
    setAnalysis(null);
    setIsLoading(false);
    setError('OpenAI API unavailable');
    setVisible(true);
  };

  const hideBox = () => {
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Demo Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={showLoadingState}>
          <Text style={styles.buttonText}>Show Loading</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={showAnalysisState}>
          <Text style={styles.buttonText}>Show Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={showErrorState}>
          <Text style={styles.buttonText}>Show Error</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={hideBox}>
          <Text style={styles.buttonText}>Hide Box</Text>
        </TouchableOpacity>
      </View>

      {/* AIAnalysisBox Component */}
      <AIAnalysisBox
        visible={visible}
        analysis={analysis}
        isLoading={isLoading}
        error={error}
        onClose={hideBox}
        distance={150} // Example distance in yards
      />
    </View>
  );
};

// =============================================================================
// INTEGRATION EXAMPLES
// =============================================================================

/**
 * Example 1: Basic Integration in Map Screen
 */
export const MapScreenIntegration: React.FC = () => {
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);
  const [shotAnalysis, setShotAnalysis] = useState<ShotAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleShotPlacement = async (targetLocation: any, distance: number) => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      setAiAnalysisVisible(true);
      
      // Simulate AI analysis API call
      const analysis = await fetchAIAnalysis(targetLocation, distance);
      
      setShotAnalysis(analysis);
      setAnalysisLoading(false);
    } catch (error) {
      setAnalysisError('Failed to analyze shot');
      setAnalysisLoading(false);
    }
  };

  return (
    <View style={styles.mapContainer}>
      {/* Map component would be here */}
      
      <AIAnalysisBox
        visible={aiAnalysisVisible}
        analysis={shotAnalysis}
        isLoading={analysisLoading}
        error={analysisError}
        onClose={() => setAiAnalysisVisible(false)}
        distance={150}
      />
    </View>
  );
};

/**
 * Example 2: Redux Integration
 */
/*
export const ReduxIntegration: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    aiAnalysis, 
    isAnalysisLoading, 
    analysisError,
    selectedTargetDistance 
  } = useAppSelector(state => state.shotPlacement);

  const handleCloseAnalysis = () => {
    dispatch(clearAIAnalysis());
  };

  return (
    <AIAnalysisBox
      visible={!!aiAnalysis || isAnalysisLoading || !!analysisError}
      analysis={aiAnalysis}
      isLoading={isAnalysisLoading}
      error={analysisError}
      onClose={handleCloseAnalysis}
      distance={selectedTargetDistance}
    />
  );
};
*/

// =============================================================================
// MOCK API FUNCTION
// =============================================================================

const fetchAIAnalysis = async (
  targetLocation: any, 
  distance: number
): Promise<ShotAnalysis> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock analysis based on distance
  const getClubForDistance = (yards: number): string => {
    if (yards >= 200) return 'Driver';
    if (yards >= 150) return '7 Iron';
    if (yards >= 100) return 'Pitching Wedge';
    return 'Sand Wedge';
  };

  return {
    recommendedClub: getClubForDistance(distance),
    shotTips: [
      'Check wind direction',
      'Assess lie conditions', 
      'Focus on smooth tempo'
    ],
    weatherConditions: {
      conditions: 'Partly Cloudy',
      windSpeed: 8,
      windDirection: 'NW',
      temperature: 18,
    },
    confidenceScore: Math.floor(Math.random() * 20) + 80, // 80-100%
  };
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4a7c59',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#e8f5e8',
  },
});

export default AIAnalysisBoxExample;