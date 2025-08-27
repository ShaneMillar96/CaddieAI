/**
 * AI Analysis Configuration for CaddieAI
 * Configuration settings for the enhanced shot analysis feature
 */

export interface AnalysisConfig {
  // Feature toggles
  enableAIAnalysis: boolean;
  showAnalysisBox: boolean;
  autoFetchWeather: boolean;
  cacheAnalysisResults: boolean;
  
  // Timing settings
  analysisDisplayDuration: number; // milliseconds
  weatherCacheDuration: number; // milliseconds
  
  // UI preferences
  animationDuration: number;
  autoCloseAfter: number; // milliseconds, 0 = no auto close
  
  // Analysis preferences
  maxShotTips: number;
  includeWeatherInAnalysis: boolean;
  preferSkillBasedRecommendations: boolean;
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  // Feature toggles
  enableAIAnalysis: true,
  showAnalysisBox: true,
  autoFetchWeather: true,
  cacheAnalysisResults: true,
  
  // Timing settings (5 minutes weather cache)
  analysisDisplayDuration: 10000, // 10 seconds
  weatherCacheDuration: 5 * 60 * 1000, // 5 minutes
  
  // UI preferences
  animationDuration: 300, // 300ms animations
  autoCloseAfter: 0, // No auto close, user controlled
  
  // Analysis preferences
  maxShotTips: 3,
  includeWeatherInAnalysis: true,
  preferSkillBasedRecommendations: true,
};

/**
 * Get analysis configuration with environment-based overrides
 */
export const getAnalysisConfig = (): AnalysisConfig => {
  // In production, all features enabled
  // In development, can be controlled via feature flags
  return {
    ...DEFAULT_ANALYSIS_CONFIG,
    // Development overrides can be added here
    enableAIAnalysis: __DEV__ ? true : true,
    showAnalysisBox: __DEV__ ? true : true,
  };
};

export default getAnalysisConfig;