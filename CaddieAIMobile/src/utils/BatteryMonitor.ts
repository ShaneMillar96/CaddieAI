/**
 * Battery Monitor Utility
 * 
 * Provides battery level monitoring and power management for the swing analysis system.
 * Integrates with native battery APIs and provides optimization recommendations.
 */

import { NativeModules, Platform, AppState, AppStateStatus } from 'react-native';
import { swingOptimizationService } from '../services/SwingAnalysisOptimizationService';

export interface BatteryState {
  level: number; // 0-1 (0% to 100%)
  charging: boolean;
  pluggedIn: boolean;
  capacityInfo?: {
    capacity: number;
    chargeCounter: number;
    currentAverage: number;
    currentNow: number;
  };
}

export interface PowerProfile {
  name: 'performance' | 'balanced' | 'power_saver' | 'ultra_saver';
  description: string;
  batteryThreshold: number;
  processingReduction: number;
  features: {
    backgroundProcessing: boolean;
    highQualityAnalysis: boolean;
    realTimeProcessing: boolean;
    caching: boolean;
  };
}

export class BatteryMonitor {
  private static instance: BatteryMonitor;
  private currentBatteryState: BatteryState = {
    level: 1.0,
    charging: false,
    pluggedIn: false
  };

  private monitoringInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private powerProfile: PowerProfile = this.getPowerProfiles().balanced;
  private batteryChangeCallbacks: Array<(state: BatteryState) => void> = [];

  private constructor() {
    this.initializeBatteryMonitoring();
  }

  public static getInstance(): BatteryMonitor {
    if (!BatteryMonitor.instance) {
      BatteryMonitor.instance = new BatteryMonitor();
    }
    return BatteryMonitor.instance;
  }

  /**
   * Initialize battery monitoring with native integration
   */
  public async initializeBatteryMonitoring(): Promise<void> {
    try {
      // Get initial battery state
      await this.updateBatteryState();

      // Set up periodic monitoring (every 30 seconds)
      this.monitoringInterval = setInterval(() => {
        this.updateBatteryState();
      }, 30000);

      // Monitor app state changes
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        this.handleAppStateChange(nextAppState);
      });

      // Set initial power profile based on battery level
      this.updatePowerProfile();

      console.log('🔋 Battery monitoring initialized');
      console.log('📊 Initial battery state:', this.currentBatteryState);

    } catch (error) {
      console.warn('⚠️ Failed to initialize battery monitoring:', error);
      // Fall back to simulated monitoring
      this.startSimulatedMonitoring();
    }
  }

  /**
   * Get current battery state
   */
  public getCurrentBatteryState(): BatteryState {
    return { ...this.currentBatteryState };
  }

  /**
   * Get current power profile
   */
  public getCurrentPowerProfile(): PowerProfile {
    return { ...this.powerProfile };
  }

  /**
   * Get all available power profiles
   */
  public getPowerProfiles(): Record<string, PowerProfile> {
    return {
      performance: {
        name: 'performance',
        description: 'Maximum performance, higher battery usage',
        batteryThreshold: 0.3, // 30%
        processingReduction: 0,
        features: {
          backgroundProcessing: true,
          highQualityAnalysis: true,
          realTimeProcessing: true,
          caching: true
        }
      },
      balanced: {
        name: 'balanced',
        description: 'Balanced performance and battery life',
        batteryThreshold: 0.5, // 50%
        processingReduction: 0.2, // 20% reduction
        features: {
          backgroundProcessing: true,
          highQualityAnalysis: true,
          realTimeProcessing: true,
          caching: true
        }
      },
      power_saver: {
        name: 'power_saver',
        description: 'Reduced performance, extended battery life',
        batteryThreshold: 0.8, // 80%
        processingReduction: 0.4, // 40% reduction
        features: {
          backgroundProcessing: false,
          highQualityAnalysis: false,
          realTimeProcessing: false,
          caching: true
        }
      },
      ultra_saver: {
        name: 'ultra_saver',
        description: 'Minimal features, maximum battery conservation',
        batteryThreshold: 1.0, // Always
        processingReduction: 0.7, // 70% reduction
        features: {
          backgroundProcessing: false,
          highQualityAnalysis: false,
          realTimeProcessing: false,
          caching: false
        }
      }
    };
  }

  /**
   * Set power profile manually
   */
  public async setPowerProfile(profileName: keyof ReturnType<typeof BatteryMonitor.prototype.getPowerProfiles>): Promise<void> {
    const profiles = this.getPowerProfiles();
    const newProfile = profiles[profileName];
    
    if (!newProfile) {
      throw new Error(`Invalid power profile: ${profileName}`);
    }

    this.powerProfile = newProfile;
    await this.applyPowerProfile();
    
    console.log(`🔋 Power profile changed to: ${profileName}`);
  }

  /**
   * Enable automatic power profile switching based on battery level
   */
  public enableAutomaticPowerManagement(): void {
    console.log('🤖 Automatic power management enabled');
    this.updatePowerProfile();
  }

  /**
   * Get power usage recommendations based on current state
   */
  public getPowerRecommendations(): {
    currentUsage: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    estimatedTimeRemaining: string;
    shouldReduceProcessing: boolean;
  } {
    const { level, charging } = this.currentBatteryState;
    
    let currentUsage: 'low' | 'medium' | 'high' | 'critical';
    let recommendations: string[] = [];
    let shouldReduceProcessing = false;

    if (level < 0.1) {
      currentUsage = 'critical';
      recommendations = [
        'Enable Ultra Power Saver mode',
        'Disable all background processing',
        'Stop real-time analysis',
        'Find a charger immediately'
      ];
      shouldReduceProcessing = true;
    } else if (level < 0.2) {
      currentUsage = 'high';
      recommendations = [
        'Enable Power Saver mode',
        'Reduce analysis quality',
        'Disable background processing',
        'Consider charging soon'
      ];
      shouldReduceProcessing = true;
    } else if (level < 0.5) {
      currentUsage = 'medium';
      recommendations = [
        'Use Balanced power profile',
        'Monitor battery usage',
        'Prepare to reduce features if needed'
      ];
      shouldReduceProcessing = !charging;
    } else {
      currentUsage = 'low';
      recommendations = [
        'Full performance available',
        'All features enabled'
      ];
    }

    // Estimate time remaining
    let estimatedTimeRemaining = 'Unknown';
    if (!charging && level > 0) {
      // Rough estimation: assume 2% drain per hour during golf
      const hoursRemaining = (level * 100) / 2;
      estimatedTimeRemaining = `${hoursRemaining.toFixed(1)} hours`;
    } else if (charging) {
      estimatedTimeRemaining = 'Charging';
    }

    return {
      currentUsage,
      recommendations,
      estimatedTimeRemaining,
      shouldReduceProcessing
    };
  }

  /**
   * Subscribe to battery state changes
   */
  public onBatteryStateChange(callback: (state: BatteryState) => void): () => void {
    this.batteryChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.batteryChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.batteryChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Stop battery monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    console.log('🔋 Battery monitoring stopped');
  }

  // Private methods

  private async updateBatteryState(): Promise<void> {
    try {
      const newState = await this.getNativeBatteryState();
      const previousLevel = this.currentBatteryState.level;
      
      this.currentBatteryState = newState;

      // Check for significant battery level changes
      if (Math.abs(newState.level - previousLevel) > 0.05) { // 5% change
        this.onSignificantBatteryChange();
      }

      // Notify callbacks
      this.batteryChangeCallbacks.forEach(callback => {
        try {
          callback(newState);
        } catch (error) {
          console.warn('⚠️ Battery callback error:', error);
        }
      });

      // Update optimization service
      await swingOptimizationService.updateBatteryInfo({
        level: newState.level,
        charging: newState.charging,
        powerSaveMode: newState.level < this.powerProfile.batteryThreshold
      });

    } catch (error) {
      console.warn('⚠️ Failed to update battery state:', error);
    }
  }

  private async getNativeBatteryState(): Promise<BatteryState> {
    if (Platform.OS === 'android') {
      return await this.getAndroidBatteryState();
    } else if (Platform.OS === 'ios') {
      return await this.getIOSBatteryState();
    } else {
      return this.getSimulatedBatteryState();
    }
  }

  private async getAndroidBatteryState(): Promise<BatteryState> {
    try {
      // In a real implementation, this would use native Android battery APIs
      // For now, we'll use a simulated state
      return this.getSimulatedBatteryState();
    } catch (error) {
      console.warn('⚠️ Android battery API error:', error);
      return this.getSimulatedBatteryState();
    }
  }

  private async getIOSBatteryState(): Promise<BatteryState> {
    try {
      // In a real implementation, this would use native iOS battery APIs
      // For now, we'll use a simulated state
      return this.getSimulatedBatteryState();
    } catch (error) {
      console.warn('⚠️ iOS battery API error:', error);
      return this.getSimulatedBatteryState();
    }
  }

  private getSimulatedBatteryState(): BatteryState {
    // Simulate realistic battery behavior
    const now = Date.now();
    const hoursSinceStart = (now % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000);
    
    // Simulate battery drain throughout the day
    let level = 1.0 - (hoursSinceStart / 24) * 0.7; // 70% drain over 24 hours
    level = Math.max(0.1, Math.min(1.0, level + (Math.random() - 0.5) * 0.1));
    
    const charging = Math.random() < 0.2; // 20% chance of charging
    const pluggedIn = charging || Math.random() < 0.1; // 10% chance of plugged in but not charging

    return {
      level,
      charging,
      pluggedIn,
      capacityInfo: {
        capacity: 3000, // mAh
        chargeCounter: Math.floor(level * 3000),
        currentAverage: charging ? 1000 : -500, // mA
        currentNow: charging ? 950 : -480
      }
    };
  }

  private startSimulatedMonitoring(): void {
    console.log('🔋 Starting simulated battery monitoring');
    
    this.monitoringInterval = setInterval(() => {
      this.updateBatteryState();
    }, 30000);
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      // App went to background - reduce monitoring frequency
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = setInterval(() => {
          this.updateBatteryState();
        }, 60000); // Every minute in background
      }
    } else if (nextAppState === 'active') {
      // App became active - resume normal monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = setInterval(() => {
          this.updateBatteryState();
        }, 30000); // Every 30 seconds when active
      }
    }
  }

  private onSignificantBatteryChange(): void {
    console.log(`🔋 Significant battery change: ${(this.currentBatteryState.level * 100).toFixed(1)}%`);
    
    // Update power profile if automatic management is enabled
    this.updatePowerProfile();
    
    // Log recommendations
    const recommendations = this.getPowerRecommendations();
    if (recommendations.shouldReduceProcessing) {
      console.log('⚡ Battery optimization recommendations:', recommendations.recommendations);
    }
  }

  private updatePowerProfile(): void {
    const { level, charging } = this.currentBatteryState;
    const profiles = this.getPowerProfiles();
    
    let newProfile: PowerProfile;
    
    if (level < 0.1) {
      newProfile = profiles.ultra_saver;
    } else if (level < 0.2) {
      newProfile = profiles.power_saver;
    } else if (level < 0.5 && !charging) {
      newProfile = profiles.balanced;
    } else {
      newProfile = profiles.performance;
    }

    if (newProfile.name !== this.powerProfile.name) {
      this.powerProfile = newProfile;
      this.applyPowerProfile();
      console.log(`🔋 Auto-switched to ${newProfile.name} power profile`);
    }
  }

  private async applyPowerProfile(): Promise<void> {
    try {
      // Apply power profile settings to optimization service
      await swingOptimizationService.updateConfiguration({
        enableBackgroundProcessing: this.powerProfile.features.backgroundProcessing,
        processingQualityMode: this.powerProfile.features.highQualityAnalysis ? 'adaptive' : 'low',
        enableIntelligentCaching: this.powerProfile.features.caching,
        batteryThreshold: this.powerProfile.batteryThreshold
      });

      console.log(`⚙️ Applied power profile: ${this.powerProfile.name}`);
      
    } catch (error) {
      console.warn('⚠️ Failed to apply power profile:', error);
    }
  }
}

// Export singleton instance and convenience functions
export const batteryMonitor = BatteryMonitor.getInstance();

export const getCurrentBatteryLevel = () => batteryMonitor.getCurrentBatteryState().level;
export const isCharging = () => batteryMonitor.getCurrentBatteryState().charging;
export const getCurrentPowerProfile = () => batteryMonitor.getCurrentPowerProfile();
export const getPowerRecommendations = () => batteryMonitor.getPowerRecommendations();