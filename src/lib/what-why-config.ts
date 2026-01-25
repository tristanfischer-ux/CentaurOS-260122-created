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
    apiKey: process.env.GOOGLE_AI_API_KEY ||
      process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY ||
      process.env.EXPO_PUBLIC_CENTAUROS_GOOGLE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.EXPO_PUBLIC_CENTAUROS_ANTHROPIC_API_KEY,
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

  // Log which API key source is being used
  if (whatWhyConfig.llm.apiKey) {
    if (process.env.GOOGLE_AI_API_KEY) {
      console.log('[WhatWhyConfig] ✅ Using your own GOOGLE_AI_API_KEY (FREE!)');
    } else if (process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY) {
      console.log('[WhatWhyConfig] ✅ Using your own EXPO_PUBLIC_GOOGLE_AI_API_KEY (FREE!)');
    } else if (process.env.EXPO_PUBLIC_CENTAUROS_GOOGLE_API_KEY) {
      console.warn('[WhatWhyConfig] ⚠️ Using EXPO_PUBLIC_CENTAUROS_GOOGLE_API_KEY (may incur charges from CentaurOS)');
      warnings.push('Consider getting your own free Google AI API key at https://aistudio.google.com/app/apikey');
    } else if (process.env.ANTHROPIC_API_KEY) {
      console.log('[WhatWhyConfig] ✅ Using your own ANTHROPIC_API_KEY');
    } else if (process.env.EXPO_PUBLIC_CENTAUROS_ANTHROPIC_API_KEY) {
      console.warn('[WhatWhyConfig] ⚠️ Using EXPO_PUBLIC_CENTAUROS_ANTHROPIC_API_KEY (may incur charges from CentaurOS)');
      warnings.push('Consider getting your own API key to avoid CentaurOS charges');
    }
  }

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
