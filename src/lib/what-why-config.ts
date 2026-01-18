/**
 * WHAT/WHY Flows Configuration
 * Configuration specific to task extraction and brainstorming features
 */

export interface WhatWhyConfig {
  llm: {
    provider: string;
    model: string;
    apiKey?: string;
  };
  voice: {
    enabled: boolean;
    devMockTranscript: boolean;
    sttProvider: string;
    storeAudio: boolean;
    storeTranscript: boolean;
  };
  features: {
    whatFlow: boolean;
    whyFlow: boolean;
    debugScheduling: boolean;
  };
  timezone: string;
}

export const whatWhyConfig: WhatWhyConfig = {
  llm: {
    provider: process.env.LLM_PROVIDER || 'google', // Default to Google (free!)
    model: process.env.LLM_MODEL || 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_AI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY,
  },
  voice: {
    enabled: process.env.VOICE_ENABLED !== 'false',
    devMockTranscript: process.env.VOICE_DEV_MOCK_TRANSCRIPT !== 'false', // Default true
    sttProvider: process.env.STT_PROVIDER || 'mock',
    storeAudio: process.env.STORE_AUDIO === 'true',
    storeTranscript: process.env.STORE_TRANSCRIPT === 'true',
  },
  features: {
    whatFlow: process.env.FEATURE_WHAT_FLOW !== 'false',
    whyFlow: process.env.FEATURE_WHY_FLOW !== 'false',
    debugScheduling: process.env.DEBUG_SCHEDULING === 'true',
  },
  timezone: process.env.TZ || 'Europe/London',
};

export function validateWhatWhyConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check LLM setup
  if (whatWhyConfig.llm.provider === 'anthropic' && !whatWhyConfig.llm.apiKey) {
    warnings.push('LLM_PROVIDER=anthropic but no API key found. Will fall back to mock.');
  }

  if (whatWhyConfig.llm.provider === 'google' && !whatWhyConfig.llm.apiKey) {
    warnings.push('LLM_PROVIDER=google but no API key found. Will fall back to mock.');
  }

  if (warnings.length > 0) {
    console.warn('[WhatWhyConfig] Warnings:\n' + warnings.join('\n'));
  }

  return { valid: true, warnings };
}
