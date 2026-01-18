# Environment Configuration Plan

## Required Environment Variables

### 1. LLM Provider (Server-Side Only)
```bash
# Anthropic API key for Claude (production)
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-...

# LLM provider selection
LLM_PROVIDER=anthropic  # or "mock" for dev

# Model selection (optional, defaults to claude-3-5-sonnet-20241022)
LLM_MODEL=claude-3-5-sonnet-20241022
```

**Security**:
- Keys stored in `.env` (never committed)
- Never exposed to client/browser
- Only used in `/api` routes (server-side)

**Dev Fallback**:
- If `LLM_PROVIDER=mock` or key missing → MockLLMProvider
- Mock returns safe empty results or regex-based extraction
- Full pipeline works end-to-end

### 2. Voice & Speech-to-Text
```bash
# Voice feature flag
VOICE_ENABLED=true

# Dev mock transcript mode
VOICE_DEV_MOCK_TRANSCRIPT=true  # Default in dev

# STT provider selection
STT_PROVIDER=mock  # Options: "mock", "webspeech"

# Audio/transcript storage (privacy)
STORE_AUDIO=false          # Never store raw audio by default
STORE_TRANSCRIPT=false     # Only store after user confirmation
```

**Behavior**:
- `VOICE_ENABLED=true`: Show voice input UI
- `VOICE_DEV_MOCK_TRANSCRIPT=true`: Show "Use mock transcript" button
- `STT_PROVIDER=mock`: /api/stt/transcribe returns mock data
- `STT_PROVIDER=webspeech`: Use browser Web Speech API (client-side)

### 3. Timezone
```bash
# Default timezone for scheduling
TZ=Europe/London
```

### 4. Feature Flags
```bash
# Enable/disable entire WHAT flow
FEATURE_WHAT_FLOW=true

# Enable/disable entire WHY flow
FEATURE_WHY_FLOW=true

# Show debug info in UI
DEBUG_SCHEDULING=false
```

## Configuration by Environment

### Development (.env.local)
```bash
# LLM - Mock mode (no key required)
LLM_PROVIDER=mock
LLM_MODEL=mock

# Voice - Dev mode with mock
VOICE_ENABLED=true
VOICE_DEV_MOCK_TRANSCRIPT=true
STT_PROVIDER=mock

# Privacy - Don't store anything
STORE_AUDIO=false
STORE_TRANSCRIPT=false

# Features - All enabled
FEATURE_WHAT_FLOW=true
FEATURE_WHY_FLOW=true
DEBUG_SCHEDULING=true

# Timezone
TZ=Europe/London
```

### Production (.env.production)
```bash
# LLM - Real Anthropic
LLM_PROVIDER=anthropic
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=<from-secrets-manager>
LLM_MODEL=claude-3-5-sonnet-20241022

# Voice - Real STT (when available)
VOICE_ENABLED=true
VOICE_DEV_MOCK_TRANSCRIPT=false
STT_PROVIDER=webspeech  # or real STT service

# Privacy - Respect user choice
STORE_AUDIO=false
STORE_TRANSCRIPT=false

# Features - All enabled
FEATURE_WHAT_FLOW=true
FEATURE_WHY_FLOW=true
DEBUG_SCHEDULING=false

# Timezone
TZ=Europe/London
```

## Runtime Configuration Access

### Server-Side (API Routes)
```typescript
// /src/lib/config.ts
export const config = {
  llm: {
    provider: process.env.LLM_PROVIDER || 'mock',
    model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
    apiKey: process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY,
  },
  voice: {
    enabled: process.env.VOICE_ENABLED !== 'false',
    devMockTranscript: process.env.VOICE_DEV_MOCK_TRANSCRIPT === 'true',
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
```

### Client-Side (React Components)
```typescript
// Only use EXPO_PUBLIC_ prefixed vars on client
// Most config should come from server API responses
const voiceEnabled = process.env.VOICE_ENABLED !== 'false';
```

## Mock Data for Development

### Mock Transcript Examples
```typescript
export const MOCK_TRANSCRIPTS = {
  simple: "Create a task to update the landing page and another to review analytics dashboard. Both should be done by next Friday.",

  complex: "Hey team, we need to finish the Q1 marketing campaign. Sarah should handle the social media posts, should take about 3 days. John can work on the email templates, probably 2 days of work. And we need someone to review the analytics from last quarter before our board meeting on March 15th.",

  brainstorm: "I want to think through our go-to-market strategy. We're launching a new product in 3 months and need to figure out the right channels and messaging.",
};
```

### Mock LLM Responses
```typescript
// If no LLM key, mock provider can do simple regex extraction
// or return safe empty state
```

## Validation on Startup

```typescript
// /src/lib/validate-config.ts
export function validateConfig() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check LLM setup
  if (config.llm.provider === 'anthropic' && !config.llm.apiKey) {
    warnings.push('LLM_PROVIDER=anthropic but no API key. Falling back to mock.');
  }

  // Check required Supabase vars
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL required');
  }

  if (errors.length > 0) {
    throw new Error(`Config errors:\n${errors.join('\n')}`);
  }

  if (warnings.length > 0) {
    console.warn(`Config warnings:\n${warnings.join('\n')}`);
  }
}
```

## Security Checklist

- [ ] API keys never in client code
- [ ] API keys never in git commits
- [ ] `.env` in `.gitignore`
- [ ] Production keys in secrets manager (not `.env.production`)
- [ ] RLS policies on all Supabase tables
- [ ] Input validation on all API endpoints
- [ ] Rate limiting on LLM endpoints
- [ ] No raw audio stored without explicit user consent
