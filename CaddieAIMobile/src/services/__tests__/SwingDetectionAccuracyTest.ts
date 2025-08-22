import SwingDetectionService, { MotionData, SwingCalibration } from '../SwingDetectionService';
import SwingPatternService from '../SwingPatternService';
import SwingValidationService from '../SwingValidationService';
import SwingMetricsService from '../SwingMetricsService';

/**
 * SwingDetectionAccuracyTest
 * 
 * Comprehensive testing suite for swing detection accuracy across
 * various swing styles, club types, and conditions.
 */

export interface SwingTestCase {
  id: string;
  name: string;
  description: string;
  swingType: 'driver' | 'iron' | 'wedge' | 'putter';
  playerSkill: 'beginner' | 'intermediate' | 'advanced';
  expectedResult: boolean;
  mockData: MotionData[];
  expectedMetrics?: {
    maxSpeed?: number;
    backswingAngle?: number;
    swingTempo?: number;
    clubheadSpeed?: number;
  };
}

export interface TestResults {
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
  averageConfidence: number;
  detailsByType: Record<string, TestTypeResults>;
}

export interface TestTypeResults {
  testCount: number;
  accuracy: number;
  averageConfidence: number;
  commonIssues: string[];
}

export class SwingDetectionAccuracyTest {
  private swingDetectionService: SwingDetectionService;
  private swingPatternService: SwingPatternService;
  private swingValidationService: SwingValidationService;
  private swingMetricsService: SwingMetricsService;
  
  // Test data sets
  private testCases: SwingTestCase[] = [];
  private testCalibration: SwingCalibration;

  constructor() {
    this.swingDetectionService = SwingDetectionService.getInstance();
    this.swingPatternService = SwingPatternService.getInstance();
    this.swingValidationService = SwingValidationService.getInstance();
    this.swingMetricsService = SwingMetricsService.getInstance();
    
    // Create standard test calibration
    this.testCalibration = {
      userId: 999,
      baselineNoise: 0.3,
      swingThreshold: 2.5,
      handedness: 'right',
      clubType: 'iron',
      personalizedThresholds: {
        minBackswingAngle: 60,
        minDownswingSpeed: 8.0,
        expectedTempo: 2.8
      }
    };
    
    this.initializeTestCases();
  }

  /**
   * Initialize comprehensive test cases for different swing scenarios
   */
  private initializeTestCases(): void {
    // Driver swing test cases
    this.testCases.push({
      id: 'driver_perfect',
      name: 'Perfect Driver Swing',
      description: 'Textbook driver swing with optimal metrics',
      swingType: 'driver',
      playerSkill: 'advanced',
      expectedResult: true,
      mockData: this.generateDriverSwingData(),
      expectedMetrics: {
        maxSpeed: 15.0,
        backswingAngle: 90,
        swingTempo: 3.0,
        clubheadSpeed: 105
      }
    });

    this.testCases.push({
      id: 'driver_fast_tempo',
      name: 'Fast Tempo Driver',
      description: 'Driver swing with rushed tempo',
      swingType: 'driver',
      playerSkill: 'intermediate',
      expectedResult: true,
      mockData: this.generateFastTempoDriverData(),
      expectedMetrics: {
        maxSpeed: 16.5,
        swingTempo: 2.2
      }
    });

    // Iron swing test cases
    this.testCases.push({
      id: 'iron_controlled',
      name: 'Controlled Iron Swing',
      description: 'Precise iron swing with good control',
      swingType: 'iron',
      playerSkill: 'intermediate',
      expectedResult: true,
      mockData: this.generateIronSwingData(),
      expectedMetrics: {
        maxSpeed: 12.0,
        backswingAngle: 85,
        swingTempo: 2.8
      }
    });

    this.testCases.push({
      id: 'iron_beginner',
      name: 'Beginner Iron Swing',
      description: 'Less consistent iron swing from beginner',
      swingType: 'iron',
      playerSkill: 'beginner',
      expectedResult: true,
      mockData: this.generateBeginnerIronData(),
      expectedMetrics: {
        maxSpeed: 8.5,
        backswingAngle: 70
      }
    });

    // Wedge swing test cases
    this.testCases.push({
      id: 'wedge_short_game',
      name: 'Short Game Wedge',
      description: 'Precise wedge shot for short game',
      swingType: 'wedge',
      playerSkill: 'advanced',
      expectedResult: true,
      mockData: this.generateWedgeSwingData(),
      expectedMetrics: {
        maxSpeed: 8.0,
        backswingAngle: 70,
        clubheadSpeed: 50
      }
    });

    // False positive test cases
    this.testCases.push({
      id: 'walking_motion',
      name: 'Walking Motion',
      description: 'Walking motion that should not be detected as swing',
      swingType: 'driver', // Irrelevant for false positive
      playerSkill: 'intermediate',
      expectedResult: false,
      mockData: this.generateWalkingMotionData()
    });

    this.testCases.push({
      id: 'practice_swing',
      name: 'Practice Swing',
      description: 'Practice swing without ball contact',
      swingType: 'iron',
      playerSkill: 'intermediate',
      expectedResult: false, // Should be filtered as practice swing
      mockData: this.generatePracticeSwingData()
    });

    this.testCases.push({
      id: 'car_door_slam',
      name: 'Car Door Slam',
      description: 'Sharp impact from closing car door',
      swingType: 'driver',
      playerSkill: 'intermediate',
      expectedResult: false,
      mockData: this.generateCarDoorData()
    });

    // Edge case test cases
    this.testCases.push({
      id: 'very_slow_swing',
      name: 'Very Slow Swing',
      description: 'Extremely slow swing motion',
      swingType: 'iron',
      playerSkill: 'beginner',
      expectedResult: true,
      mockData: this.generateSlowSwingData(),
      expectedMetrics: {
        maxSpeed: 6.0,
        swingTempo: 4.5
      }
    });

    this.testCases.push({
      id: 'incomplete_swing',
      name: 'Incomplete Swing',
      description: 'Swing that stops mid-motion',
      swingType: 'iron',
      playerSkill: 'intermediate',
      expectedResult: false,
      mockData: this.generateIncompleteSwingData()
    });

    console.log(`🧪 SwingDetectionAccuracyTest: Initialized ${this.testCases.length} test cases`);
  }

  /**
   * Run comprehensive accuracy tests
   */
  public async runAccuracyTests(): Promise<TestResults> {
    console.log('🧪 Starting comprehensive swing detection accuracy tests...');
    
    // Initialize swing detection with test calibration
    await this.swingDetectionService.initialize(this.testCalibration);
    
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalConfidence = 0;
    
    const detailsByType: Record<string, TestTypeResults> = {};
    
    for (const testCase of this.testCases) {
      console.log(`🔍 Testing: ${testCase.name}`);
      
      try {
        const result = await this.runSingleTest(testCase);
        totalTests++;
        totalConfidence += result.confidence;
        
        // Track by swing type
        if (!detailsByType[testCase.swingType]) {
          detailsByType[testCase.swingType] = {
            testCount: 0,
            accuracy: 0,
            averageConfidence: 0,
            commonIssues: []
          };
        }
        detailsByType[testCase.swingType].testCount++;
        detailsByType[testCase.swingType].averageConfidence += result.confidence;
        
        // Evaluate test result
        const isCorrect = (result.detected === testCase.expectedResult);
        
        if (isCorrect) {
          passed++;
          console.log(`✅ ${testCase.name}: PASSED (confidence: ${result.confidence}%)`);
        } else {
          failed++;
          if (result.detected && !testCase.expectedResult) {
            falsePositives++;
            detailsByType[testCase.swingType].commonIssues.push('False positive detection');
          } else if (!result.detected && testCase.expectedResult) {
            falseNegatives++;
            detailsByType[testCase.swingType].commonIssues.push('Missed valid swing');
          }
          console.log(`❌ ${testCase.name}: FAILED (expected: ${testCase.expectedResult}, got: ${result.detected}, confidence: ${result.confidence}%)`);
        }
        
        // Validate expected metrics if provided
        if (testCase.expectedMetrics && result.metrics) {
          this.validateExpectedMetrics(testCase, result.metrics);
        }
        
      } catch (error) {
        console.error(`🔴 Error testing ${testCase.name}:`, error);
        failed++;
        totalTests++;
      }
    }
    
    // Calculate final accuracy percentages by type
    for (const swingType in detailsByType) {
      const typeData = detailsByType[swingType];
      if (typeData.testCount > 0) {
        typeData.averageConfidence = typeData.averageConfidence / typeData.testCount;
        typeData.accuracy = ((typeData.testCount - typeData.commonIssues.length) / typeData.testCount) * 100;
      }
    }
    
    const results: TestResults = {
      totalTests,
      passed,
      failed,
      accuracy: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      falsePositives,
      falseNegatives,
      averageConfidence: totalTests > 0 ? totalConfidence / totalTests : 0,
      detailsByType
    };
    
    this.logTestSummary(results);
    return results;
  }

  /**
   * Run a single test case
   */
  private async runSingleTest(testCase: SwingTestCase): Promise<{
    detected: boolean;
    confidence: number;
    metrics?: any;
  }> {
    // Run swing detection
    const detectionResult = await this.swingDetectionService.detectSwing(testCase.mockData);
    
    if (!detectionResult.isSwing) {
      return {
        detected: false,
        confidence: detectionResult.confidence,
        metrics: null
      };
    }
    
    // Run pattern matching
    const patternResults = await this.swingPatternService.compareSwing(
      detectionResult.metrics!,
      detectionResult.swingPhases!,
      testCase.mockData,
      testCase.swingType
    );
    
    // Run validation
    const validationContext = this.createMockValidationContext(testCase);
    const validationResult = await this.swingValidationService.validateSwing(
      detectionResult,
      validationContext
    );
    
    return {
      detected: validationResult.isValid,
      confidence: validationResult.adjustedConfidence,
      metrics: detectionResult.metrics
    };
  }

  /**
   * Validate that detected metrics match expected ranges
   */
  private validateExpectedMetrics(testCase: SwingTestCase, actualMetrics: any): void {
    const expected = testCase.expectedMetrics!;
    const tolerance = 0.2; // 20% tolerance
    
    if (expected.maxSpeed) {
      const diff = Math.abs(actualMetrics.maxSpeed - expected.maxSpeed);
      const allowedDiff = expected.maxSpeed * tolerance;
      if (diff > allowedDiff) {
        console.warn(`⚠️ ${testCase.name}: MaxSpeed outside tolerance (expected: ${expected.maxSpeed}, got: ${actualMetrics.maxSpeed})`);
      }
    }
    
    if (expected.backswingAngle) {
      const diff = Math.abs(actualMetrics.backswingAngle - expected.backswingAngle);
      const allowedDiff = expected.backswingAngle * tolerance;
      if (diff > allowedDiff) {
        console.warn(`⚠️ ${testCase.name}: BackswingAngle outside tolerance (expected: ${expected.backswingAngle}, got: ${actualMetrics.backswingAngle})`);
      }
    }
    
    if (expected.swingTempo) {
      const diff = Math.abs(actualMetrics.swingTempo - expected.swingTempo);
      const allowedDiff = expected.swingTempo * tolerance;
      if (diff > allowedDiff) {
        console.warn(`⚠️ ${testCase.name}: SwingTempo outside tolerance (expected: ${expected.swingTempo}, got: ${actualMetrics.swingTempo})`);
      }
    }
  }

  /**
   * Create mock validation context for testing
   */
  private createMockValidationContext(testCase: SwingTestCase): any {
    return {
      isRoundActive: true,
      timeOfDay: 14, // 2 PM
      recentActivity: {
        walkingDetected: testCase.id === 'walking_motion',
        drivingDetected: testCase.id === 'car_door_slam',
        staticPeriod: testCase.id === 'walking_motion' ? 0 : 5,
        averageMotion: 1.5
      },
      deviceStability: {
        accelerometerVariance: 0.5,
        gyroscopeVariance: 0.3,
        temperatureDrift: 0,
        signalQuality: 95
      },
      environmentalFactors: {
        windLevel: 3,
        groundStability: 90,
        courseType: 'course' as const
      }
    };
  }

  /**
   * Log comprehensive test summary
   */
  private logTestSummary(results: TestResults): void {
    console.log('\n📊 SWING DETECTION ACCURACY TEST RESULTS');
    console.log('==========================================');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Overall Accuracy: ${results.accuracy.toFixed(1)}%`);
    console.log(`False Positives: ${results.falsePositives}`);
    console.log(`False Negatives: ${results.falseNegatives}`);
    console.log(`Average Confidence: ${results.averageConfidence.toFixed(1)}%`);
    
    console.log('\n📋 Results by Swing Type:');
    for (const [swingType, typeResults] of Object.entries(results.detailsByType)) {
      console.log(`\n${swingType.toUpperCase()}:`);
      console.log(`  Tests: ${typeResults.testCount}`);
      console.log(`  Accuracy: ${typeResults.accuracy.toFixed(1)}%`);
      console.log(`  Avg Confidence: ${typeResults.averageConfidence.toFixed(1)}%`);
      if (typeResults.commonIssues.length > 0) {
        console.log(`  Issues: ${typeResults.commonIssues.join(', ')}`);
      }
    }
    
    console.log('\n🎯 Performance Assessment:');
    if (results.accuracy >= 90) {
      console.log('✅ EXCELLENT: Detection accuracy exceeds 90%');
    } else if (results.accuracy >= 80) {
      console.log('✅ GOOD: Detection accuracy above 80%');
    } else if (results.accuracy >= 70) {
      console.log('⚠️ ACCEPTABLE: Detection accuracy above 70%, but needs improvement');
    } else {
      console.log('❌ POOR: Detection accuracy below 70%, significant improvements needed');
    }
    
    if (results.falsePositives === 0) {
      console.log('✅ EXCELLENT: Zero false positives detected');
    } else if (results.falsePositives <= 2) {
      console.log('✅ GOOD: Low false positive rate');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: High false positive rate');
    }
  }

  // Mock data generation methods for different swing types and scenarios
  
  private generateDriverSwingData(): MotionData[] {
    const data: MotionData[] = [];
    const duration = 1800; // 1.8 seconds
    const sampleRate = 50; // 50Hz
    const samples = Math.floor(duration / 1000 * sampleRate);
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples; // Normalize time 0-1
      const timestamp = Date.now() + (i * 20); // 20ms intervals
      
      // Driver swing pattern: slow backswing, fast downswing
      let accelX = 0, accelY = 0, accelZ = 9.81; // Start at rest
      let gyroX = 0, gyroY = 0, gyroZ = 0;
      
      if (t < 0.6) {
        // Backswing phase
        const backswingProgress = t / 0.6;
        accelX = Math.sin(backswingProgress * Math.PI) * 4;
        accelY = Math.cos(backswingProgress * Math.PI) * 3;
        gyroY = Math.sin(backswingProgress * Math.PI) * 200;
      } else if (t < 0.8) {
        // Transition and downswing
        const downswingProgress = (t - 0.6) / 0.2;
        accelX = Math.sin(downswingProgress * Math.PI) * 15;
        accelY = Math.cos(downswingProgress * Math.PI) * 12;
        accelZ = 9.81 + Math.sin(downswingProgress * Math.PI) * 8;
        gyroY = Math.sin(downswingProgress * Math.PI) * 400;
      } else {
        // Follow-through
        const followProgress = (t - 0.8) / 0.2;
        accelX = Math.sin(followProgress * Math.PI) * 8;
        accelY = Math.cos(followProgress * Math.PI) * 6;
        gyroY = Math.sin(followProgress * Math.PI) * 150;
      }
      
      data.push({
        acceleration: { x: accelX, y: accelY, z: accelZ },
        gyroscope: { x: gyroX, y: gyroY, z: gyroZ },
        timestamp
      });
    }
    
    return data;
  }

  private generateFastTempoDriverData(): MotionData[] {
    const data = this.generateDriverSwingData();
    // Compress the timing to simulate faster tempo
    return data.map((point, index) => ({
      ...point,
      timestamp: point.timestamp - (index * 5) // Faster sampling
    })).slice(0, Math.floor(data.length * 0.7)); // Shorter duration
  }

  private generateIronSwingData(): MotionData[] {
    const data: MotionData[] = [];
    const duration = 1500; // Shorter than driver
    const sampleRate = 50;
    const samples = Math.floor(duration / 1000 * sampleRate);
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const timestamp = Date.now() + (i * 20);
      
      // Iron swing: more controlled, less power
      let accelX = 0, accelY = 0, accelZ = 9.81;
      let gyroY = 0;
      
      if (t < 0.55) {
        // Backswing
        const progress = t / 0.55;
        accelX = Math.sin(progress * Math.PI) * 3;
        accelY = Math.cos(progress * Math.PI) * 2.5;
        gyroY = Math.sin(progress * Math.PI) * 150;
      } else if (t < 0.8) {
        // Downswing
        const progress = (t - 0.55) / 0.25;
        accelX = Math.sin(progress * Math.PI) * 12;
        accelY = Math.cos(progress * Math.PI) * 10;
        accelZ = 9.81 + Math.sin(progress * Math.PI) * 6;
        gyroY = Math.sin(progress * Math.PI) * 300;
      } else {
        // Follow-through
        const progress = (t - 0.8) / 0.2;
        accelX = Math.sin(progress * Math.PI) * 6;
        accelY = Math.cos(progress * Math.PI) * 4;
        gyroY = Math.sin(progress * Math.PI) * 100;
      }
      
      data.push({
        acceleration: { x: accelX, y: accelY, z: accelZ },
        gyroscope: { x: 0, y: gyroY, z: 0 },
        timestamp
      });
    }
    
    return data;
  }

  private generateBeginnerIronData(): MotionData[] {
    const data = this.generateIronSwingData();
    // Add noise and reduce consistency for beginner pattern
    return data.map(point => ({
      acceleration: {
        x: point.acceleration.x * (0.7 + Math.random() * 0.3), // Variable power
        y: point.acceleration.y * (0.8 + Math.random() * 0.2),
        z: point.acceleration.z + (Math.random() - 0.5) * 2 // Add noise
      },
      gyroscope: {
        x: point.gyroscope.x + (Math.random() - 0.5) * 20,
        y: point.gyroscope.y * (0.6 + Math.random() * 0.4),
        z: point.gyroscope.z + (Math.random() - 0.5) * 10
      },
      timestamp: point.timestamp
    }));
  }

  private generateWedgeSwingData(): MotionData[] {
    const data: MotionData[] = [];
    const duration = 1200; // Shorter swing
    const sampleRate = 50;
    const samples = Math.floor(duration / 1000 * sampleRate);
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const timestamp = Date.now() + (i * 20);
      
      // Wedge swing: precise, less power, shorter backswing
      let accelX = 0, accelY = 0, accelZ = 9.81;
      let gyroY = 0;
      
      if (t < 0.5) {
        // Short backswing
        const progress = t / 0.5;
        accelX = Math.sin(progress * Math.PI) * 2;
        accelY = Math.cos(progress * Math.PI) * 1.5;
        gyroY = Math.sin(progress * Math.PI) * 100;
      } else if (t < 0.8) {
        // Controlled downswing
        const progress = (t - 0.5) / 0.3;
        accelX = Math.sin(progress * Math.PI) * 8;
        accelY = Math.cos(progress * Math.PI) * 7;
        accelZ = 9.81 + Math.sin(progress * Math.PI) * 4;
        gyroY = Math.sin(progress * Math.PI) * 200;
      } else {
        // Short follow-through
        const progress = (t - 0.8) / 0.2;
        accelX = Math.sin(progress * Math.PI) * 4;
        accelY = Math.cos(progress * Math.PI) * 3;
        gyroY = Math.sin(progress * Math.PI) * 75;
      }
      
      data.push({
        acceleration: { x: accelX, y: accelY, z: accelZ },
        gyroscope: { x: 0, y: gyroY, z: 0 },
        timestamp
      });
    }
    
    return data;
  }

  // False positive data generators

  private generateWalkingMotionData(): MotionData[] {
    const data: MotionData[] = [];
    const duration = 3000; // 3 seconds of walking
    const sampleRate = 50;
    const samples = Math.floor(duration / 1000 * sampleRate);
    const stepFreq = 2; // 2 Hz step frequency
    
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * duration / 1000;
      const timestamp = Date.now() + (i * 20);
      
      // Walking pattern: regular vertical oscillation
      const stepPhase = t * stepFreq * 2 * Math.PI;
      const accelX = Math.sin(stepPhase * 0.5) * 1.5; // Slight horizontal sway
      const accelY = Math.sin(stepPhase) * 2.5; // Vertical bounce
      const accelZ = 9.81 + Math.cos(stepPhase) * 1.8; // Gravity + vertical
      
      data.push({
        acceleration: { x: accelX, y: accelY, z: accelZ },
        gyroscope: { x: 0, y: 0, z: Math.sin(stepPhase * 0.3) * 10 },
        timestamp
      });
    }
    
    return data;
  }

  private generatePracticeSwingData(): MotionData[] {
    const swingData = this.generateIronSwingData();
    // Reduce impact signature for practice swing (no ball contact)
    return swingData.map((point, index) => {
      const t = index / swingData.length;
      if (t > 0.7 && t < 0.85) {
        // Reduce impact phase acceleration
        return {
          ...point,
          acceleration: {
            x: point.acceleration.x * 0.6,
            y: point.acceleration.y * 0.6,
            z: point.acceleration.z * 0.8
          }
        };
      }
      return point;
    });
  }

  private generateCarDoorData(): MotionData[] {
    const data: MotionData[] = [];
    const duration = 500; // Short sharp impact
    const sampleRate = 50;
    const samples = Math.floor(duration / 1000 * sampleRate);
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const timestamp = Date.now() + (i * 20);
      
      let accelX = 0, accelY = 0, accelZ = 9.81;
      
      if (t > 0.4 && t < 0.6) {
        // Sharp impact spike
        const impactIntensity = Math.sin((t - 0.4) / 0.2 * Math.PI);
        accelX = impactIntensity * 20; // Very sharp, single-axis impact
        accelZ = 9.81 + impactIntensity * 5;
      }
      
      data.push({
        acceleration: { x: accelX, y: accelY, z: accelZ },
        gyroscope: { x: 0, y: 0, z: 0 }, // Minimal rotation
        timestamp
      });
    }
    
    return data;
  }

  private generateSlowSwingData(): MotionData[] {
    const data = this.generateIronSwingData();
    // Stretch the timing and reduce power
    return data.map((point, index) => ({
      acceleration: {
        x: point.acceleration.x * 0.5,
        y: point.acceleration.y * 0.5,
        z: point.acceleration.z
      },
      gyroscope: {
        x: point.gyroscope.x * 0.4,
        y: point.gyroscope.y * 0.4,
        z: point.gyroscope.z * 0.4
      },
      timestamp: point.timestamp + (index * 10) // Slower timing
    }));
  }

  private generateIncompleteSwingData(): MotionData[] {
    const fullSwing = this.generateIronSwingData();
    // Cut off at 60% through the swing (no impact or follow-through)
    return fullSwing.slice(0, Math.floor(fullSwing.length * 0.6));
  }

  /**
   * Get test case by ID for individual testing
   */
  public getTestCase(id: string): SwingTestCase | undefined {
    return this.testCases.find(test => test.id === id);
  }

  /**
   * Run specific test by ID
   */
  public async runSpecificTest(id: string): Promise<any> {
    const testCase = this.getTestCase(id);
    if (!testCase) {
      throw new Error(`Test case ${id} not found`);
    }
    
    await this.swingDetectionService.initialize(this.testCalibration);
    return this.runSingleTest(testCase);
  }
}

export default SwingDetectionAccuracyTest;