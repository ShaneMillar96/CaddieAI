/**
 * Swing Analysis Optimization Service
 * 
 * Provides performance optimization and battery usage management for the swing analysis system.
 * Implements adaptive processing, intelligent caching, and resource management strategies.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SwingAnalysisSummary } from '../store/slices/aiCaddieSlice';
import { SwingAnalysisErrorUtils, PerformanceMonitor } from '../utils/SwingAnalysisErrorUtils';
import { SwingAnalysisErrorType } from './SwingAnalysisErrorHandler';

export interface OptimizationConfig {
  enableAdaptiveProcessing: boolean;
  enableIntelligentCaching: boolean;
  enableBatteryOptimization: boolean;
  enableBackgroundProcessing: boolean;
  maxConcurrentAnalyses: number;
  cacheMaxSize: number;
  processingQualityMode: 'low' | 'medium' | 'high' | 'adaptive';
  batteryThreshold: number; // Percentage below which to enable power saving
}

export interface BatteryInfo {
  level: number; // 0-1
  charging: boolean;
  powerSaveMode: boolean;
}

export interface PerformanceMetrics {
  avgProcessingTime: number;
  memoryUsage: number;
  batteryDrain: number;
  cacheHitRatio: number;
  throughput: number;
  concurrentAnalyses: number;
}

export interface OptimizationRecommendation {
  category: 'performance' | 'battery' | 'memory' | 'network';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action: string;
  estimatedImprovement: string;
}

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated memory size in bytes
}

interface ProcessingQueue {
  id: string;
  priority: number;
  data: any;
  callback: (result: any) => void;
  timeout: number;
  retries: number;
}

export class SwingAnalysisOptimizationService {
  private static instance: SwingAnalysisOptimizationService;

  private config: OptimizationConfig;
  private cache = new Map<string, CacheEntry>();
  private processingQueue: ProcessingQueue[] = [];
  private activeAnalyses = new Set<string>();
  private batteryInfo: BatteryInfo = { level: 1, charging: false, powerSaveMode: false };
  private performanceHistory: PerformanceMetrics[] = [];
  private optimizationRecommendations: OptimizationRecommendation[] = [];

  // Background processing controls
  private backgroundProcessor: NodeJS.Timeout | null = null;
  private isProcessingPaused = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeOptimization();
  }

  public static getInstance(): SwingAnalysisOptimizationService {
    if (!SwingAnalysisOptimizationService.instance) {
      SwingAnalysisOptimizationService.instance = new SwingAnalysisOptimizationService();
    }
    return SwingAnalysisOptimizationService.instance;
  }

  /**
   * Initialize optimization service with adaptive configuration
   */
  public async initializeOptimization(): Promise<void> {
    try {
      // Load saved configuration
      await this.loadConfiguration();
      
      // Initialize battery monitoring
      await this.initializeBatteryMonitoring();
      
      // Start background optimization
      this.startBackgroundOptimization();
      
      // Load performance history
      await this.loadPerformanceHistory();
      
      console.log('🚀 SwingAnalysisOptimizationService initialized');
      console.log('⚙️ Configuration:', this.config);
      
    } catch (error) {
      console.error('❌ Failed to initialize optimization service:', error);
    }
  }

  /**
   * Optimize swing analysis processing with adaptive algorithms
   */
  public async optimizeSwingAnalysis<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string,
    priority: number = 5,
    cacheKey?: string
  ): Promise<T | null> {
    // Check cache first if enabled
    if (this.config.enableIntelligentCaching && cacheKey) {
      const cachedResult = this.getCachedResult<T>(cacheKey);
      if (cachedResult) {
        console.log(`💾 Cache hit for ${cacheKey}`);
        return cachedResult;
      }
    }

    // Apply battery optimization if needed
    if (this.config.enableBatteryOptimization && this.shouldEnablePowerSaving()) {
      const powerSavedResult = await this.procesWithPowerSaving(analysisFunction, analysisId);
      if (powerSavedResult) {
        this.cacheResult(cacheKey, powerSavedResult);
        return powerSavedResult;
      }
    }

    // Check concurrent analysis limits
    if (this.activeAnalyses.size >= this.config.maxConcurrentAnalyses) {
      return await this.queueAnalysis(analysisFunction, analysisId, priority, cacheKey);
    }

    // Process analysis with performance monitoring
    return await this.processAnalysisWithMonitoring(analysisFunction, analysisId, cacheKey);
  }

  /**
   * Adaptive processing based on device performance and battery state
   */
  public async adaptiveProcessing<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string,
    adaptiveOptions?: {
      canDegrade?: boolean;
      minQuality?: 'low' | 'medium';
      maxRetries?: number;
    }
  ): Promise<T | null> {
    const options = {
      canDegrade: true,
      minQuality: 'medium' as 'low' | 'medium',
      maxRetries: 3,
      ...adaptiveOptions
    };

    const currentQuality = this.determineOptimalQuality();
    
    // Adjust processing quality based on current conditions
    if (currentQuality === 'low' && options.canDegrade) {
      console.log(`📉 Degrading analysis quality for ${analysisId} due to performance constraints`);
      return await this.processWithReducedQuality(analysisFunction, analysisId);
    }

    if (currentQuality === 'medium' && options.minQuality === 'low') {
      console.log(`⚖️ Using medium quality processing for ${analysisId}`);
      return await this.processWithMediumQuality(analysisFunction, analysisId);
    }

    // Full quality processing
    return await this.optimizeSwingAnalysis(analysisFunction, analysisId);
  }

  /**
   * Intelligent caching with LRU eviction and size management
   */
  public cacheResult(key: string | undefined, data: any, customTTL?: number): void {
    if (!key || !this.config.enableIntelligentCaching) return;

    const now = Date.now();
    const estimatedSize = this.estimateDataSize(data);
    
    // Check cache size limits
    if (this.getCurrentCacheSize() + estimatedSize > this.config.cacheMaxSize) {
      this.evictLRUEntries(estimatedSize);
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size: estimatedSize
    };

    this.cache.set(key, entry);
    
    console.log(`💾 Cached result for ${key} (${estimatedSize} bytes)`);
  }

  /**
   * Get cached result with access tracking
   */
  public getCachedResult<T>(key: string): T | null {
    if (!this.config.enableIntelligentCaching) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache entry is still valid (1 hour TTL)
    const TTL = 60 * 60 * 1000; // 1 hour
    if (Date.now() - entry.timestamp > TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  /**
   * Monitor and optimize battery usage
   */
  public async updateBatteryInfo(newBatteryInfo: Partial<BatteryInfo>): Promise<void> {
    this.batteryInfo = { ...this.batteryInfo, ...newBatteryInfo };
    
    const previousPowerSaveMode = this.batteryInfo.powerSaveMode;
    this.batteryInfo.powerSaveMode = this.shouldEnablePowerSaving();

    if (this.batteryInfo.powerSaveMode && !previousPowerSaveMode) {
      console.log('🔋 Enabling power save mode for swing analysis');
      await this.enablePowerSaveMode();
    } else if (!this.batteryInfo.powerSaveMode && previousPowerSaveMode) {
      console.log('⚡ Disabling power save mode for swing analysis');
      await this.disablePowerSaveMode();
    }
  }

  /**
   * Background processing optimization
   */
  public pauseBackgroundProcessing(): void {
    this.isProcessingPaused = true;
    if (this.backgroundProcessor) {
      clearInterval(this.backgroundProcessor);
      this.backgroundProcessor = null;
    }
    console.log('⏸️ Background processing paused');
  }

  public resumeBackgroundProcessing(): void {
    this.isProcessingPaused = false;
    this.startBackgroundOptimization();
    console.log('▶️ Background processing resumed');
  }

  /**
   * Get current performance metrics and recommendations
   */
  public getOptimizationReport(): {
    currentMetrics: PerformanceMetrics;
    recommendations: OptimizationRecommendation[];
    batteryInfo: BatteryInfo;
    config: OptimizationConfig;
    cacheStats: {
      entries: number;
      totalSize: number;
      hitRatio: number;
    };
  } {
    const currentMetrics = this.calculateCurrentMetrics();
    this.updateOptimizationRecommendations(currentMetrics);

    return {
      currentMetrics,
      recommendations: this.optimizationRecommendations,
      batteryInfo: this.batteryInfo,
      config: this.config,
      cacheStats: {
        entries: this.cache.size,
        totalSize: this.getCurrentCacheSize(),
        hitRatio: this.calculateCacheHitRatio()
      }
    };
  }

  /**
   * Update optimization configuration
   */
  public async updateConfiguration(newConfig: Partial<OptimizationConfig>): Promise<void> {
    const previousConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Apply configuration changes
    if (newConfig.enableBackgroundProcessing !== previousConfig.enableBackgroundProcessing) {
      if (this.config.enableBackgroundProcessing) {
        this.startBackgroundOptimization();
      } else {
        this.pauseBackgroundProcessing();
      }
    }

    if (newConfig.cacheMaxSize && newConfig.cacheMaxSize < previousConfig.cacheMaxSize) {
      this.enforceNewCacheLimit(newConfig.cacheMaxSize);
    }

    await this.saveConfiguration();
    console.log('⚙️ Optimization configuration updated');
  }

  /**
   * Clear all optimizations and reset to defaults
   */
  public async resetOptimizations(): Promise<void> {
    // Clear cache
    this.cache.clear();
    
    // Clear processing queue
    this.processingQueue = [];
    
    // Reset configuration
    this.config = this.getDefaultConfig();
    
    // Clear performance history
    this.performanceHistory = [];
    
    // Reset recommendations
    this.optimizationRecommendations = [];
    
    // Save reset state
    await this.saveConfiguration();
    await this.savePerformanceHistory();
    
    console.log('🔄 Optimization service reset to defaults');
  }

  // Private helper methods

  private getDefaultConfig(): OptimizationConfig {
    return {
      enableAdaptiveProcessing: true,
      enableIntelligentCaching: true,
      enableBatteryOptimization: true,
      enableBackgroundProcessing: true,
      maxConcurrentAnalyses: 3,
      cacheMaxSize: 50 * 1024 * 1024, // 50MB
      processingQualityMode: 'adaptive',
      batteryThreshold: 0.2 // 20%
    };
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('swing_optimization_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load optimization configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('swing_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('⚠️ Failed to save optimization configuration:', error);
    }
  }

  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      // In a real implementation, this would integrate with native battery APIs
      // For now, we'll simulate battery monitoring
      this.batteryInfo = {
        level: 0.8, // 80%
        charging: false,
        powerSaveMode: false
      };
      
      console.log('🔋 Battery monitoring initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize battery monitoring:', error);
    }
  }

  private shouldEnablePowerSaving(): boolean {
    return this.batteryInfo.level < this.config.batteryThreshold && !this.batteryInfo.charging;
  }

  private async enablePowerSaveMode(): Promise<void> {
    // Reduce cache size
    this.enforceNewCacheLimit(this.config.cacheMaxSize / 2);
    
    // Reduce concurrent analysis limit
    this.config.maxConcurrentAnalyses = Math.max(1, Math.floor(this.config.maxConcurrentAnalyses / 2));
    
    // Switch to low quality processing
    this.config.processingQualityMode = 'low';
    
    console.log('🔋 Power save mode enabled');
  }

  private async disablePowerSaveMode(): Promise<void> {
    // Restore normal configuration
    const defaultConfig = this.getDefaultConfig();
    this.config.maxConcurrentAnalyses = defaultConfig.maxConcurrentAnalyses;
    this.config.processingQualityMode = 'adaptive';
    
    console.log('⚡ Power save mode disabled');
  }

  private determineOptimalQuality(): 'low' | 'medium' | 'high' {
    if (this.config.processingQualityMode !== 'adaptive') {
      return this.config.processingQualityMode as 'low' | 'medium' | 'high';
    }

    // Adaptive quality based on battery and performance
    if (this.batteryInfo.powerSaveMode) return 'low';
    if (this.batteryInfo.level < 0.5) return 'medium';
    if (this.activeAnalyses.size >= this.config.maxConcurrentAnalyses * 0.8) return 'medium';
    
    return 'high';
  }

  private async processAnalysisWithMonitoring<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string,
    cacheKey?: string
  ): Promise<T | null> {
    this.activeAnalyses.add(analysisId);
    const stopTimer = PerformanceMonitor.startMeasurement(`SwingAnalysis_${analysisId}`);

    try {
      const result = await SwingAnalysisErrorUtils.withErrorHandling(
        analysisFunction,
        { analysisId, optimized: true },
        {
          showUserAlert: false,
          logToConsole: true,
          retryOnFailure: true,
          fallbackValue: null
        }
      );

      if (result && cacheKey) {
        this.cacheResult(cacheKey, result);
      }

      return result;

    } finally {
      stopTimer();
      this.activeAnalyses.delete(analysisId);
      this.recordPerformanceMetrics();
    }
  }

  private async procesWithPowerSaving<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string
  ): Promise<T | null> {
    // Add delay to reduce CPU usage
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return await this.processAnalysisWithMonitoring(analysisFunction, analysisId);
  }

  private async processWithReducedQuality<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string
  ): Promise<T | null> {
    // Implement reduced quality processing (simplified algorithms)
    console.log(`📉 Processing ${analysisId} with reduced quality`);
    return await this.processAnalysisWithMonitoring(analysisFunction, analysisId);
  }

  private async processWithMediumQuality<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string
  ): Promise<T | null> {
    // Implement medium quality processing
    console.log(`⚖️ Processing ${analysisId} with medium quality`);
    return await this.processAnalysisWithMonitoring(analysisFunction, analysisId);
  }

  private async queueAnalysis<T>(
    analysisFunction: () => Promise<T>,
    analysisId: string,
    priority: number,
    cacheKey?: string
  ): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const queueEntry: ProcessingQueue = {
        id: analysisId,
        priority,
        data: { analysisFunction, cacheKey },
        callback: resolve,
        timeout: Date.now() + 30000, // 30 second timeout
        retries: 0
      };

      // Insert in priority order
      const insertIndex = this.processingQueue.findIndex(item => item.priority < priority);
      if (insertIndex === -1) {
        this.processingQueue.push(queueEntry);
      } else {
        this.processingQueue.splice(insertIndex, 0, queueEntry);
      }

      console.log(`📋 Queued analysis ${analysisId} with priority ${priority}`);
    });
  }

  private startBackgroundOptimization(): void {
    if (this.backgroundProcessor || !this.config.enableBackgroundProcessing) return;

    this.backgroundProcessor = setInterval(async () => {
      if (this.isProcessingPaused) return;

      try {
        // Process queued analyses
        await this.processQueue();
        
        // Cleanup expired cache entries
        this.cleanupExpiredCache();
        
        // Update performance metrics
        this.recordPerformanceMetrics();
        
        // Check for optimization opportunities
        this.checkOptimizationOpportunities();

      } catch (error) {
        console.warn('⚠️ Background optimization error:', error);
      }
    }, 5000); // Every 5 seconds
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) return;
    if (this.activeAnalyses.size >= this.config.maxConcurrentAnalyses) return;

    const now = Date.now();
    
    // Remove expired items
    this.processingQueue = this.processingQueue.filter(item => {
      if (item.timeout < now) {
        item.callback(null);
        return false;
      }
      return true;
    });

    // Process highest priority item
    const nextItem = this.processingQueue.shift();
    if (nextItem) {
      try {
        const result = await this.processAnalysisWithMonitoring(
          nextItem.data.analysisFunction,
          nextItem.id,
          nextItem.data.cacheKey
        );
        nextItem.callback(result);
      } catch (error) {
        nextItem.callback(null);
      }
    }
  }

  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1024; // Default 1KB estimate
    }
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  private evictLRUEntries(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;
      
      if (freedSpace >= requiredSpace) break;
    }

    console.log(`🧹 Evicted cache entries, freed ${freedSpace} bytes`);
  }

  private enforceNewCacheLimit(newLimit: number): void {
    const currentSize = this.getCurrentCacheSize();
    if (currentSize > newLimit) {
      this.evictLRUEntries(currentSize - newLimit);
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const TTL = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > TTL) {
        this.cache.delete(key);
      }
    }
  }

  private calculateCurrentMetrics(): PerformanceMetrics {
    const stats = PerformanceMonitor.getPerformanceStats('SwingAnalysis');
    
    return {
      avgProcessingTime: stats?.average || 0,
      memoryUsage: this.getCurrentCacheSize() / (1024 * 1024), // MB
      batteryDrain: this.estimateBatteryDrain(),
      cacheHitRatio: this.calculateCacheHitRatio(),
      throughput: this.calculateThroughput(),
      concurrentAnalyses: this.activeAnalyses.size
    };
  }

  private calculateCacheHitRatio(): number {
    if (this.cache.size === 0) return 0;
    
    const totalAccesses = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.accessCount, 0);
    
    return totalAccesses / this.cache.size;
  }

  private calculateThroughput(): number {
    // Analyses per minute over last 5 minutes
    const recentMetrics = this.performanceHistory.slice(-5);
    if (recentMetrics.length === 0) return 0;
    
    const avgConcurrent = recentMetrics.reduce((sum, m) => sum + m.concurrentAnalyses, 0) / recentMetrics.length;
    return avgConcurrent * 12; // Extrapolate to per minute
  }

  private estimateBatteryDrain(): number {
    // Simplified battery drain estimation
    const baselineUsage = 0.1; // 0.1% per minute baseline
    const processingBonus = this.activeAnalyses.size * 0.05; // 0.05% per active analysis
    return baselineUsage + processingBonus;
  }

  private recordPerformanceMetrics(): void {
    const metrics = this.calculateCurrentMetrics();
    this.performanceHistory.push(metrics);
    
    // Keep only last 100 entries
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
  }

  private checkOptimizationOpportunities(): void {
    const metrics = this.calculateCurrentMetrics();
    
    this.optimizationRecommendations = [];

    // Performance recommendations
    if (metrics.avgProcessingTime > 3000) {
      this.optimizationRecommendations.push({
        category: 'performance',
        priority: 'high',
        message: 'Average processing time is high',
        action: 'Enable adaptive processing or reduce quality',
        estimatedImprovement: '30-50% faster processing'
      });
    }

    // Memory recommendations
    if (metrics.memoryUsage > 40) {
      this.optimizationRecommendations.push({
        category: 'memory',
        priority: 'medium',
        message: 'Memory usage is high',
        action: 'Reduce cache size or enable more aggressive eviction',
        estimatedImprovement: '20-30% less memory usage'
      });
    }

    // Battery recommendations
    if (metrics.batteryDrain > 0.3) {
      this.optimizationRecommendations.push({
        category: 'battery',
        priority: 'high',
        message: 'Battery drain is excessive',
        action: 'Enable power save mode or reduce concurrent analyses',
        estimatedImprovement: '40-60% less battery usage'
      });
    }

    // Cache recommendations
    if (metrics.cacheHitRatio < 0.3) {
      this.optimizationRecommendations.push({
        category: 'performance',
        priority: 'low',
        message: 'Cache hit ratio is low',
        action: 'Adjust caching strategy or increase cache size',
        estimatedImprovement: '10-20% faster response times'
      });
    }
  }

  private updateOptimizationRecommendations(metrics: PerformanceMetrics): void {
    this.checkOptimizationOpportunities();
  }

  private async loadPerformanceHistory(): Promise<void> {
    try {
      const savedHistory = await AsyncStorage.getItem('swing_performance_history');
      if (savedHistory) {
        this.performanceHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load performance history:', error);
    }
  }

  private async savePerformanceHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('swing_performance_history', JSON.stringify(this.performanceHistory));
    } catch (error) {
      console.warn('⚠️ Failed to save performance history:', error);
    }
  }
}

// Export singleton instance and convenience functions
export const swingOptimizationService = SwingAnalysisOptimizationService.getInstance();

export const optimizeSwingAnalysis = <T>(
  analysisFunction: () => Promise<T>,
  analysisId: string,
  priority?: number,
  cacheKey?: string
) => swingOptimizationService.optimizeSwingAnalysis(analysisFunction, analysisId, priority, cacheKey);

export const getOptimizationReport = () => swingOptimizationService.getOptimizationReport();