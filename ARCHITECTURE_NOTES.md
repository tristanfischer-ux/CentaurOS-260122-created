# Architecture Notes - WHAT/WHY Implementation

## Overview
Implementing two distinct flows for Centaur OS:
- **WHAT Tab**: Rapid task creation from text/voice → draft → confirm → schedule
- **WHY Tab**: Strategic brainstorming → objectives + tasks → confirm → schedule

## Key Principles
1. **No task creation without explicit user confirmation** - everything starts as drafts
2. **Voice supported** with dev fallback (paste transcript or mock)
3. **No modals** unless absolutely necessary (mobile-safe scrolling)
4. **Server-side LLM** - API keys never exposed to browser
5. **Idempotent confirmation** - no duplicate tasks
6. **Timezone**: Europe/London

## Architecture

### Data Flow - WHAT
```
User Input (text/voice) → Transcript (editable) → Extract Drafts (LLM) →
User Review/Edit Drafts → Confirm → Create Tasks → Schedule (capacity-aware) →
Task Allocations (weekly)
```

### Data Flow - WHY
```
User Message → Brainstorm Turn (LLM one question at a time) →
Conversation History → Synthesize (LLM) → Objectives + Task Drafts →
User Review/Edit → Confirm → Create Tasks (linked to objectives) → Schedule
```

### File Structure
```
/src
  /app
    /api
      /what
        extract-drafts+api.ts     # POST extract text → drafts
        drafts+api.ts             # GET list, PATCH edit
        confirm+api.ts            # POST confirm drafts → tasks
      /why
        session+api.ts            # POST create session
        turn+api.ts               # POST user message → assistant reply
        synthesize+api.ts         # POST session → objectives + drafts
      /stt
        transcribe+api.ts         # POST audio → transcript (mock in dev)
    /(tabs)
      what.tsx                    # Update with draft flow
      why.tsx                     # Update with brainstorm flow
  /lib
    /providers
      llm-provider.ts             # Interface + Anthropic + mock
      stt-provider.ts             # Interface + mock
    /scheduling
      scheduler.ts                # Pure scheduling functions
      scheduler.test.ts           # Unit tests
    /prompts
      what-extract.ts             # Task extraction prompt
      why-turn.ts                 # Brainstorm turn prompt
      why-synthesize.ts           # Synthesis prompt
  /components
    TaskDraftCard.tsx             # Draft editing UI
    VoiceTranscriptInput.tsx      # Voice/transcript input
    ObjectiveEditor.tsx           # Objective editing
    SchedulePreview.tsx           # Week allocation preview
  /types
    drafts.ts                     # Draft types
    brainstorm.ts                 # Brainstorm session types
```

### Database Schema
- **task_drafts**: Pending tasks before confirmation
- **tasks**: Confirmed tasks (replaces work_plans eventually)
- **user_capacity**: Weekly capacity per user (default 10 TUs)
- **task_allocations**: Weekly task assignments
- **task_events**: Audit log
- **brainstorm_sessions**: WHY conversation sessions
- **brainstorm_messages**: Chat history
- **objectives**: Strategic goals from WHY
- **objective_task_links**: Traceability (objective → tasks)

### Scheduling Rules
- Each task = minimum 1 TU
- Each user has weekly capacity (default 10)
- If week full → push to next week
- If due date exists and can't fit → set risk_flag, schedule earliest possible
- Deterministic allocation (no randomness)

## Provider Interfaces

### LLMProvider
```typescript
interface LLMProvider {
  complete(prompt: string, schema?: object): Promise<any>;
}
```
Implementations: AnthropicProvider (prod), MockProvider (dev fallback)

### STTProvider
```typescript
interface STTProvider {
  transcribe(audio: Blob): Promise<{transcript: string, confidence?: number}>;
}
```
Implementations: MockProvider (dev), WebSpeechProvider (optional client-side)

## Environment Variables
```
# LLM
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=...   # Server-side only
LLM_PROVIDER=anthropic                        # or "mock"

# Voice/STT
VOICE_ENABLED=true                            # Feature flag
VOICE_DEV_MOCK_TRANSCRIPT=true                # Dev mode
STT_PROVIDER=mock                             # or "webspeech"

# Privacy
STORE_AUDIO=false                             # Don't store raw audio
STORE_TRANSCRIPT=false                        # Only after confirmation

# Timezone
TZ=Europe/London
```

## Security
- API keys in env vars, **never** in client code
- All LLM calls happen in `/api` routes (server-side)
- RLS policies on Supabase tables
- Input validation on all endpoints

## Dev Fallbacks
If no LLM key configured:
- MockLLMProvider returns safe "no tasks extracted" or regex-based extraction
- Mock transcripts available via "Use mock transcript" button
- Full pipeline still works end-to-end

## Testing Strategy
1. Unit tests for scheduling logic (pure functions)
2. Manual test checklist (WHAT text, WHAT voice, WHY brainstorm)
3. Integration tests for confirm flow (no duplicates)
4. Edge cases: overflow, due dates, capacity limits
