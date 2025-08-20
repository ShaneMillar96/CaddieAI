import { SkillLevel } from '../types';
import { ShotType, UserSkillContext, AICaddieAdvice } from '../store/slices/aiCaddieSlice';
import TokenStorage from './tokenStorage';
import { dynamicCaddieService } from './DynamicCaddieService';
import { apiService } from './ApiService';

export interface AdviceRequest {
  userId: string;
  roundId?: number;
  shotType?: ShotType;
  userContext: UserSkillContext;
  golfContext?: {
    distance?: number;
    position?: { latitude: number; longitude: number };
    weather?: string;
    wind?: string;
    holeNumber?: number;
    par?: number;
  };
}

export interface AdviceResponse {
  advice: AICaddieAdvice;
  clubRecommendation?: string;
  strategy?: string;
  confidence: number;
}

export class SkillBasedAdviceEngine {
  
  /**
   * Get realistic distance suggestions based on skill level
   */
  getSkillBasedDistanceSuggestions(skillLevel: SkillLevel, shotType: 'tee' | 'approach' | 'short' = 'approach'): {
    min: number;
    max: number;
    typical: number[];
    clubSuggestions: string[];
  } {
    const suggestions = {
      [SkillLevel.Beginner]: {
        tee: { min: 80, max: 180, typical: [100, 120, 150], clubSuggestions: ['7-iron', '5-iron', 'hybrid'] },
        approach: { min: 50, max: 140, typical: [70, 90, 120], clubSuggestions: ['wedge', '9-iron', '7-iron'] },
        short: { min: 20, max: 80, typical: [30, 50, 70], clubSuggestions: ['wedge', 'pitching wedge', '9-iron'] }
      },
      [SkillLevel.Intermediate]: {
        tee: { min: 120, max: 220, typical: [150, 180, 200], clubSuggestions: ['6-iron', '4-iron', '3-wood'] },
        approach: { min: 80, max: 180, typical: [100, 130, 160], clubSuggestions: ['9-iron', '6-iron', '4-iron'] },
        short: { min: 30, max: 100, typical: [40, 60, 80], clubSuggestions: ['lob wedge', 'sand wedge', '9-iron'] }
      },
      [SkillLevel.Advanced]: {
        tee: { min: 150, max: 260, typical: [180, 220, 240], clubSuggestions: ['5-iron', '3-iron', 'driver'] },
        approach: { min: 100, max: 200, typical: [120, 150, 180], clubSuggestions: ['8-iron', '5-iron', '3-iron'] },
        short: { min: 40, max: 120, typical: [50, 75, 100], clubSuggestions: ['lob wedge', 'gap wedge', '8-iron'] }
      },
      [SkillLevel.Professional]: {
        tee: { min: 180, max: 300, typical: [220, 250, 280], clubSuggestions: ['4-iron', 'driver', '3-wood'] },
        approach: { min: 120, max: 230, typical: [140, 170, 200], clubSuggestions: ['7-iron', '4-iron', '2-iron'] },
        short: { min: 50, max: 140, typical: [60, 90, 120], clubSuggestions: ['60° wedge', '52° wedge', '7-iron'] }
      }
    };

    return suggestions[skillLevel]?.[shotType] || suggestions[SkillLevel.Intermediate][shotType];
  }
  
  /**
   * Initialize a voice session with the backend AI Caddie service
   */
  async initializeVoiceSession(params: {
    userId: string;
    roundId?: number;
    userContext: UserSkillContext;
  }): Promise<{ sessionId: string; initialized: boolean }> {
    try {
      const response = await apiService.post('ai-caddie/voice-session', params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to initialize voice session');
      }

      return response.data;
    } catch (error) {
      console.error('SkillBasedAdviceEngine: Voice session initialization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze a shot and provide skill-appropriate advice
   */
  async analyzeShot(request: AdviceRequest): Promise<AdviceResponse> {
    try {
      const response = await apiService.post('ai-caddie/analyze-shot', request);

      if (!response.success) {
        throw new Error(response.message || 'Failed to analyze shot');
      }
      
      // Process the response based on skill level
      const processedAdvice = this.processAdviceForSkillLevel(response.data, request.userContext.skillLevel);
      
      return processedAdvice;
    } catch (error) {
      console.error('SkillBasedAdviceEngine: Shot analysis failed:', error);
      
      // Return fallback advice based on shot type and skill level
      return this.generateFallbackAdvice(request);
    }
  }

  /**
   * Get user context from the backend
   */
  async fetchUserContext(userId: string): Promise<UserSkillContext> {
    try {
      const response = await apiService.get(`ai-caddie/user-context/${userId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user context');
      }

      return response.data;
    } catch (error) {
      console.error('SkillBasedAdviceEngine: Failed to fetch user context:', error);
      throw error;
    }
  }

  /**
   * Generate general golf advice outside of active rounds
   */
  async generateGeneralAdvice(params: {
    userId: string;
    userContext: UserSkillContext;
    topic?: string;
  }): Promise<AdviceResponse> {
    try {
      const request: AdviceRequest = {
        userId: params.userId,
        userContext: params.userContext,
      };

      // For general advice, use a simplified approach
      const fallbackAdvice = this.generateFallbackAdvice(request, params.topic);
      return fallbackAdvice;
    } catch (error) {
      console.error('SkillBasedAdviceEngine: General advice generation failed:', error);
      throw error;
    }
  }

  /**
   * Process advice response based on user skill level
   */
  private processAdviceForSkillLevel(
    rawAdvice: any,
    skillLevel: SkillLevel
  ): AdviceResponse {
    const baseAdvice: AICaddieAdvice = {
      id: `advice_${Date.now()}`,
      message: rawAdvice.message || rawAdvice.advice,
      timestamp: new Date().toISOString(),
      shotType: rawAdvice.shotType,
      clubRecommendation: rawAdvice.clubRecommendation,
      confidence: rawAdvice.confidence || 0.8,
      audioUrl: rawAdvice.audioUrl,
    };

    // Adjust advice complexity based on skill level
    switch (skillLevel) {
      case SkillLevel.Beginner:
        return {
          advice: {
            ...baseAdvice,
            message: this.simplifyAdvice(baseAdvice.message),
          },
          clubRecommendation: this.simplifyClubRecommendation(rawAdvice.clubRecommendation),
          strategy: this.generateBeginnerStrategy(rawAdvice),
          confidence: Math.max(0.7, baseAdvice.confidence),
        };

      case SkillLevel.Intermediate:
        return {
          advice: baseAdvice,
          clubRecommendation: rawAdvice.clubRecommendation,
          strategy: rawAdvice.strategy,
          confidence: baseAdvice.confidence,
        };

      case SkillLevel.Advanced:
      case SkillLevel.Professional:
        return {
          advice: {
            ...baseAdvice,
            message: this.enhanceAdvice(baseAdvice.message, rawAdvice.technicalDetails),
          },
          clubRecommendation: rawAdvice.clubRecommendation,
          strategy: rawAdvice.advancedStrategy || rawAdvice.strategy,
          confidence: baseAdvice.confidence,
        };

      default:
        return {
          advice: baseAdvice,
          clubRecommendation: rawAdvice.clubRecommendation,
          strategy: rawAdvice.strategy,
          confidence: baseAdvice.confidence,
        };
    }
  }

  /**
   * Generate fallback advice when API calls fail
   */
  private generateFallbackAdvice(request: AdviceRequest, topic?: string): AdviceResponse {
    const { userContext, shotType } = request;
    const skillLevel = userContext.skillLevel;

    let message = '';
    let clubRecommendation = '';
    let strategy = '';

    if (topic) {
      // General advice topic
      message = this.getGeneralAdviceByTopic(topic, skillLevel);
    } else if (shotType) {
      // Shot-specific advice
      switch (shotType.type) {
        case 'tee_shot':
          message = this.getTeeAdvice(skillLevel, shotType.distance);
          clubRecommendation = this.getClubForDistance(shotType.distance, 'tee');
          break;
        case 'approach':
          message = this.getApproachAdvice(skillLevel, shotType.distance);
          clubRecommendation = this.getClubForDistance(shotType.distance, 'approach');
          break;
        case 'chip':
          message = this.getChipAdvice(skillLevel);
          clubRecommendation = 'Wedge or 9-iron';
          break;
        case 'bunker':
          message = this.getBunkerAdvice(skillLevel);
          clubRecommendation = 'Sand wedge';
          break;
        case 'putt':
          message = this.getPuttAdvice(skillLevel);
          clubRecommendation = 'Putter';
          break;
        default:
          message = this.getGeneralGolfAdvice(skillLevel);
      }
    } else {
      message = this.getGeneralGolfAdvice(skillLevel);
    }

    return {
      advice: {
        id: `fallback_advice_${Date.now()}`,
        message,
        timestamp: new Date().toISOString(),
        shotType,
        clubRecommendation,
        confidence: 0.7,
      },
      clubRecommendation,
      strategy,
      confidence: 0.7,
    };
  }

  // Helper methods for skill-level appropriate advice
  private simplifyAdvice(message: string): string {
    // Simplify complex golf terminology for beginners
    return message
      .replace(/draw|fade/g, 'curve')
      .replace(/trajectory/g, 'ball flight')
      .replace(/loft/g, 'club angle');
  }

  private simplifyClubRecommendation(recommendation?: string): string {
    if (!recommendation) return '';
    
    // Provide clearer club recommendations for beginners
    return recommendation
      .replace(/PW/g, 'Pitching Wedge')
      .replace(/SW/g, 'Sand Wedge')
      .replace(/LW/g, 'Lob Wedge');
  }

  private enhanceAdvice(message: string, technicalDetails?: any): string {
    if (!technicalDetails) return message;
    
    // Add technical details for advanced players
    let enhanced = message;
    
    if (technicalDetails.spin) {
      enhanced += ` Consider ${technicalDetails.spin} spin for optimal control.`;
    }
    
    if (technicalDetails.trajectory) {
      enhanced += ` Target a ${technicalDetails.trajectory} trajectory.`;
    }
    
    return enhanced;
  }

  private generateBeginnerStrategy(rawAdvice: any): string {
    return 'Focus on making solid contact and keeping the ball in play. Take your time and trust your setup.';
  }

  // Fallback advice generators
  private getTeeAdvice(skillLevel: SkillLevel, distance?: number): string {
    const beginner = skillLevel === SkillLevel.Beginner;
    const baseAdvice = beginner 
      ? 'Focus on making good contact and keeping the ball in the fairway.'
      : 'Aim for the center of the fairway and commit to your swing.';
    
    if (distance && distance > 400) {
      return beginner 
        ? `${baseAdvice} This is a long hole, so take a club you're comfortable with.`
        : `${baseAdvice} Consider course management on this long hole.`;
    }
    
    return baseAdvice;
  }

  private getApproachAdvice(skillLevel: SkillLevel, distance?: number): string {
    if (skillLevel === SkillLevel.Beginner) {
      return 'Aim for the center of the green and focus on smooth tempo.';
    }
    
    if (distance && distance < 100) {
      return 'This is a scoring opportunity. Trust your short iron and aim for the pin.';
    }
    
    return 'Pick a target on the green and commit to your club selection.';
  }

  private getChipAdvice(skillLevel: SkillLevel): string {
    return skillLevel === SkillLevel.Beginner
      ? 'Use a putting motion with your wedge. Keep your wrists firm.'
      : 'Choose the right landing spot and let the ball roll to the hole.';
  }

  private getBunkerAdvice(skillLevel: SkillLevel): string {
    return skillLevel === SkillLevel.Beginner
      ? 'Open your clubface, aim behind the ball, and make a full swing.'
      : 'Focus on hitting the sand first. Accelerate through the shot.';
  }

  private getPuttAdvice(skillLevel: SkillLevel): string {
    return skillLevel === SkillLevel.Beginner
      ? 'Focus on distance control. A smooth stroke is key.'
      : 'Read the green carefully and trust your line. Speed is crucial.';
  }

  private getGeneralGolfAdvice(skillLevel: SkillLevel): string {
    const advice = [
      'Stay relaxed and enjoy your round.',
      'Focus on one shot at a time.',
      'Trust your preparation and setup.',
      'Course management is key to lower scores.',
    ];
    
    return advice[Math.floor(Math.random() * advice.length)];
  }

  private getGeneralAdviceByTopic(topic: string, skillLevel: SkillLevel): string {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('putting')) {
      return this.getPuttAdvice(skillLevel);
    } else if (topicLower.includes('driving')) {
      return this.getTeeAdvice(skillLevel);
    } else if (topicLower.includes('short game')) {
      return this.getChipAdvice(skillLevel);
    }
    
    return this.getGeneralGolfAdvice(skillLevel);
  }

  private getClubForDistance(distance?: number, shotType?: string): string {
    if (!distance) return '';
    
    if (distance > 250) return 'Driver';
    if (distance > 200) return '3-wood or long iron';
    if (distance > 150) return 'Mid iron (6-7 iron)';
    if (distance > 100) return 'Short iron (8-9 iron)';
    if (distance > 50) return 'Wedge';
    
    return 'Short wedge or putter';
  }

  private async getAuthToken(): Promise<string> {
    try {
      const token = await TokenStorage.getAccessToken();
      return token || '';
    } catch (error) {
      console.error('SkillBasedAdviceEngine: Failed to get auth token:', error);
      return '';
    }
  }

  /**
   * Generate advice with dynamic AI integration
   */
  async generateAdviceWithVoice(
    request: AdviceRequest,
    useVoice: boolean = true
  ): Promise<AdviceResponse> {
    try {
      // Try backend analysis first
      const backendResponse = await this.analyzeShot(request);
      
      // If voice is requested and we have dynamic caddie service
      if (useVoice && request.golfContext?.distance) {
        // Generate voice response through dynamic caddie service
        await dynamicCaddieService.generateClubRecommendation(
          parseInt(request.userId),
          request.roundId || 0,
          request.golfContext.distance,
          {
            windSpeedMph: request.golfContext.wind ? parseInt(request.golfContext.wind) : undefined,
            temperature: 70, // Default temperature
            courseCondition: 'good'
          },
          request.golfContext.holeNumber,
          undefined,
          8 // High priority
        );
      }
      
      return backendResponse;
    } catch (error) {
      console.warn('SkillBasedAdviceEngine: Backend failed, using fallback with voice:', error);
      
      const fallbackResponse = this.generateFallbackAdvice(request);
      
      // Still try to provide voice feedback for fallback
      if (useVoice) {
        await dynamicCaddieService.generateGeneralAdvice(
          parseInt(request.userId),
          fallbackResponse.advice.message
        );
      }
      
      return fallbackResponse;
    }
  }

  /**
   * Validate if distance is appropriate for skill level
   */
  validateDistanceForSkillLevel(
    distance: number, 
    skillLevel: SkillLevel, 
    shotType: 'tee' | 'approach' | 'short' = 'approach'
  ): {
    isRealistic: boolean;
    suggestion?: string;
    adjustedDistance?: number;
  } {
    const suggestions = this.getSkillBasedDistanceSuggestions(skillLevel, shotType);
    
    if (distance >= suggestions.min && distance <= suggestions.max) {
      return { isRealistic: true };
    }
    
    // Find closest typical distance
    const closest = suggestions.typical.reduce((prev, curr) => 
      Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
    );
    
    const skillName = SkillLevel[skillLevel]?.toLowerCase() || 'intermediate';
    
    if (distance < suggestions.min) {
      return {
        isRealistic: false,
        suggestion: `For ${skillName} level, consider a longer shot (${suggestions.min}+ yards).`,
        adjustedDistance: closest
      };
    } else {
      return {
        isRealistic: false,
        suggestion: `That's quite ambitious for ${skillName} level. Try around ${closest} yards.`,
        adjustedDistance: closest
      };
    }
  }
}

// Export singleton instance
export const skillBasedAdviceEngine = new SkillBasedAdviceEngine();

// Export helper functions
export const getSkillBasedDistanceSuggestions = (skillLevel: SkillLevel, shotType: 'tee' | 'approach' | 'short' = 'approach') => {
  return skillBasedAdviceEngine.getSkillBasedDistanceSuggestions(skillLevel, shotType);
};

export const validateDistanceForSkillLevel = (distance: number, skillLevel: SkillLevel, shotType: 'tee' | 'approach' | 'short' = 'approach') => {
  return skillBasedAdviceEngine.validateDistanceForSkillLevel(distance, skillLevel, shotType);
};