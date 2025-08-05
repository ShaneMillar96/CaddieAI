import { useState, useEffect, useRef, useCallback } from 'react';
import { SimpleLocationData } from '../services/SimpleLocationService';

export interface GPSStabilityState {
  isStable: boolean;
  isStabilizing: boolean;
  currentAccuracy: number | null;
  stabilityDuration: number;
  requiredStability: number;
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  canRenderMap: boolean;
  stabilityProgress: number; // 0-100%
}

export interface GPSStabilizationConfig {
  requiredAccuracy: number; // Maximum accuracy in meters to consider "stable"
  requiredStabilityDuration: number; // Minimum duration in ms to maintain accuracy
  maxAccuracyForImmediate: number; // Accuracy threshold for immediate map rendering
  enableProgressiveStability: boolean; // Allow map rendering with improving accuracy
}

const DEFAULT_CONFIG: GPSStabilizationConfig = {
  requiredAccuracy: 15, // 15 meters
  requiredStabilityDuration: 3000, // 3 seconds
  maxAccuracyForImmediate: 5, // 5 meters for immediate rendering
  enableProgressiveStability: true,
};

/**
 * useGPSStabilization Hook
 * 
 * Monitors GPS accuracy and stability to determine when it's safe to render map components.
 * Prevents map crashes by ensuring GPS is stable before component mounting.
 * 
 * Features:
 * - Accuracy-based stability detection
 * - Progressive stability assessment
 * - Configurable thresholds
 * - Real-time stability progress tracking
 * - Quality level assessment
 */
export const useGPSStabilization = (
  currentLocation: SimpleLocationData | null,
  config: Partial<GPSStabilizationConfig> = {}
): GPSStabilityState => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [stabilityState, setStabilityState] = useState<GPSStabilityState>({
    isStable: false,
    isStabilizing: false,
    currentAccuracy: null,
    stabilityDuration: 0,
    requiredStability: mergedConfig.requiredStabilityDuration,
    qualityLevel: 'unknown',
    canRenderMap: false,
    stabilityProgress: 0,
  });

  // Refs for tracking stability over time
  const stabilityStartTime = useRef<number | null>(null);
  const lastAccuracy = useRef<number | null>(null);
  const accuracyHistory = useRef<Array<{ accuracy: number; timestamp: number }>>([]);
  const stabilityCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper function to determine GPS quality level
  const getQualityLevel = useCallback((accuracy: number | undefined): GPSStabilityState['qualityLevel'] => {
    if (!accuracy || accuracy <= 0) return 'unknown';
    if (accuracy <= 3) return 'excellent';
    if (accuracy <= 8) return 'good';
    if (accuracy <= 15) return 'fair';
    return 'poor';
  }, []);

  // Helper function to calculate average accuracy over recent readings
  const getAverageAccuracy = useCallback(() => {
    if (accuracyHistory.current.length === 0) return null;
    
    const recentReadings = accuracyHistory.current.slice(-5); // Last 5 readings
    const sum = recentReadings.reduce((acc, reading) => acc + reading.accuracy, 0);
    return sum / recentReadings.length;
  }, []);

  // Reset stability tracking - NOT in useCallback to avoid dependency issues
  const resetStabilityTracking = () => {
    console.log('🔄 GPS Stabilization: Resetting stability tracking');
    stabilityStartTime.current = null;
    accuracyHistory.current = [];
    
    if (stabilityCheckInterval.current) {
      clearInterval(stabilityCheckInterval.current);
      stabilityCheckInterval.current = null;
    }
  };

  // Start stability monitoring - stabilized function reference
  const startStabilityMonitoring = useCallback((accuracy: number) => {
    const now = Date.now();
    
    if (!stabilityStartTime.current) {
      console.log(`🟡 GPS Stabilization: Starting stability monitoring with ${accuracy.toFixed(1)}m accuracy`);
      stabilityStartTime.current = now;
    }

    // Add to accuracy history
    accuracyHistory.current.push({ accuracy, timestamp: now });
    
    // Keep only recent history (last 10 readings)
    if (accuracyHistory.current.length > 10) {
      accuracyHistory.current = accuracyHistory.current.slice(-10);
    }

    // Start interval checking if not already running
    if (!stabilityCheckInterval.current) {
      stabilityCheckInterval.current = setInterval(() => {
        const currentTime = Date.now();
        const stabilityDuration = stabilityStartTime.current ? currentTime - stabilityStartTime.current : 0;
        const averageAccuracy = getAverageAccuracy();
        const progress = Math.min((stabilityDuration / mergedConfig.requiredStabilityDuration) * 100, 100);

        const isStable = stabilityDuration >= mergedConfig.requiredStabilityDuration && 
                        averageAccuracy !== null && 
                        averageAccuracy <= mergedConfig.requiredAccuracy;

        const canRenderMap = isStable || 
                           (mergedConfig.enableProgressiveStability && 
                            averageAccuracy !== null && 
                            averageAccuracy <= mergedConfig.maxAccuracyForImmediate);

        setStabilityState(prev => ({
          ...prev,
          stabilityDuration,
          stabilityProgress: progress,
          isStable,
          canRenderMap,
        }));

        if (isStable) {
          console.log(`✅ GPS Stabilization: GPS is now stable! Average accuracy: ${averageAccuracy?.toFixed(1)}m over ${(stabilityDuration / 1000).toFixed(1)}s`);
        }
      }, 500); // Check every 500ms
    }
  }, [mergedConfig, getAverageAccuracy]);

  // Debounce ref to prevent excessive logging
  const lastLogTime = useRef<number>(0);
  const logThreshold = 2000; // Only log every 2 seconds
  
  // Main effect to monitor location changes
  useEffect(() => {
    if (!currentLocation || !currentLocation.accuracy) {
      // Rate-limited logging to prevent spam
      const now = Date.now();
      if (now - lastLogTime.current > logThreshold) {
        console.log('🔴 GPS Stabilization: No location or accuracy data');
        lastLogTime.current = now;
      }
      
      resetStabilityTracking();
      setStabilityState(prev => ({
        ...prev,
        isStable: false,
        isStabilizing: false,
        currentAccuracy: null,
        qualityLevel: 'unknown',
        canRenderMap: false,
        stabilityDuration: 0,
        stabilityProgress: 0,
      }));
      return;
    }

    const accuracy = currentLocation.accuracy;
    const qualityLevel = getQualityLevel(accuracy);
    const now = Date.now();

    // Rate-limited logging for location updates
    if (now - lastLogTime.current > logThreshold) {
      console.log(`🟠 GPS Stabilization: Location update - Accuracy: ${accuracy.toFixed(1)}m, Quality: ${qualityLevel}`);
      lastLogTime.current = now;
    }

    // Update current state
    setStabilityState(prev => ({
      ...prev,
      currentAccuracy: accuracy,
      qualityLevel,
      isStabilizing: true,
    }));

    // Check if accuracy is good enough to start/continue monitoring
    if (accuracy <= mergedConfig.requiredAccuracy) {
      startStabilityMonitoring(accuracy);
    } else {
      // Accuracy not good enough, reset tracking
      console.log(`🟡 GPS Stabilization: Accuracy ${accuracy.toFixed(1)}m exceeds threshold ${mergedConfig.requiredAccuracy}m, resetting`);
      resetStabilityTracking();
      setStabilityState(prev => ({
        ...prev,
        isStable: false,
        canRenderMap: mergedConfig.enableProgressiveStability && accuracy <= mergedConfig.maxAccuracyForImmediate,
        stabilityDuration: 0,
        stabilityProgress: 0,
      }));
    }

    // Store for comparison
    lastAccuracy.current = accuracy;
  }, [currentLocation, mergedConfig.requiredAccuracy, mergedConfig.maxAccuracyForImmediate, mergedConfig.enableProgressiveStability]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stabilityCheckInterval.current) {
        clearInterval(stabilityCheckInterval.current);
      }
    };
  }, []);

  return stabilityState;
};

/**
 * Hook for getting GPS stability configuration presets
 */
export const useGPSStabilityPresets = () => {
  return {
    strict: {
      requiredAccuracy: 10,
      requiredStabilityDuration: 5000,
      maxAccuracyForImmediate: 3,
      enableProgressiveStability: false,
    } as GPSStabilizationConfig,
    
    balanced: DEFAULT_CONFIG,
    
    relaxed: {
      requiredAccuracy: 25,
      requiredStabilityDuration: 2000,
      maxAccuracyForImmediate: 10,
      enableProgressiveStability: true,
    } as GPSStabilizationConfig,
    
    testing: {
      requiredAccuracy: 50,
      requiredStabilityDuration: 1000,
      maxAccuracyForImmediate: 20,
      enableProgressiveStability: true,
    } as GPSStabilizationConfig,
  };
};

export default useGPSStabilization;