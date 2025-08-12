/**
 * OpenAI configuration for CaddieAI
 * Reads configuration from environment variables for security
 */

import { OPENAI_API_KEY } from '@env';

// The API key from environment variables
export const OPENAI_CONFIG = {
  // API key loaded from .env file for security
  apiKey: OPENAI_API_KEY || '',
  model: 'gpt-4o-realtime-preview-2024-12-17',
  voice: 'alloy' as const,
  temperature: 0.7,
};

export default OPENAI_CONFIG;