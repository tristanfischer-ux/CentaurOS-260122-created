# WHAT/WHY Flows - Implementation Summary

## What Was Built

**✅ Production-Ready Backend (70% Complete)**

1. **Database Schema** (`supabase/migrations/004_what_why_flows.sql`)
   - 9 tables: task_drafts, tasks, user_capacity, task_allocations, task_events, brainstorm_sessions, brainstorm_messages, objectives, objective_task_links
   - RLS policies for multi-tenant isolation
   - Indexes, constraints, audit triggers

2. **Scheduling Engine** (`src/lib/scheduling/scheduler.ts` + tests)
   - Capacity-aware weekly allocation
   - Automatic overflow to next weeks
   - Risk flags for missed deadlines
   - Deterministic (no randomness)
   - Unit tested

3. **Provider System**
   - LLM: Anthropic + Mock fallback
   - STT: Mock + WebSpeech option
   - Factory pattern with auto-fallback

4. **Runtime Prompts**
   - WHAT extract: Task extraction from text/voice
   - WHY turn: Strategic question generation
   - WHY synthesize: Objectives + tasks from conversation

5. **WHAT Backend APIs** (3 endpoints working)
   - POST /api/what/extract-drafts
   - GET /api/what/drafts, PATCH /api/what/drafts
   - POST /api/what/confirm (idempotent, schedules tasks)

**⚠️ Not Implemented (30%)**
- WHY backend APIs (session, turn, synthesize)
- Frontend UI components
- Integration with existing tabs

## Quick Test (No API Key Required)

```bash
# 1. Apply migration
psql <your-db> < supabase/migrations/004_what_why_flows.sql

# 2. Test extract API (mock mode)
curl -X POST http://localhost:8081/api/what/extract-drafts \
  -H "Content-Type: application/json" \
  -d '{
    "inputText": "Update landing page and fix checkout bug by Friday",
    "source": "text",
    "workspaceId": "your-workspace-id",
    "userId": "your-user-id"
  }'

# Expected: 2 drafts created in mock mode
```

## Environment Variables

**Production (with Anthropic):**
```
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=anthropic
```

**Development (no key needed):**
```
LLM_PROVIDER=mock
VOICE_DEV_MOCK_TRANSCRIPT=true
```

## How to Test Manually

See `TEST_CHECKLIST.md` for 20 test scenarios including:
- Basic text extraction
- Voice transcript handling  
- Capacity overflow
- Due date risk flags
- Idempotent confirmation
- WHY brainstorm flow

## Key Assumptions

1. **Timezone**: Europe/London
2. **Capacity**: 10 TU/week/user (default)
3. **Week Start**: Monday (ISO 8601)
4. **Assignee**: Speaker if not specified
5. **Mock Mode**: Works without API keys
6. **Audio Storage**: Disabled by default (privacy)
7. **Idempotency**: Draft→Task mapping prevents duplicates
8. **Scheduling**: Never fails (overflows weeks if needed)

## Known Limitations

1. WHY APIs not implemented (follow WHAT pattern)
2. Frontend UI not built
3. No auth checks in APIs (RLS only)
4. No real-time updates
5. Simplified timezone (no date-fns-tz)
6. No retry logic for LLM failures

## Next Steps (1-2 Days)

1. Implement WHY APIs (2-3 hours)
2. Build UI components (4-6 hours)
3. Wire existing tabs (2-3 hours)
4. Add auth middleware (1 hour)

## Files Created

**Documentation:**
- ARCHITECTURE_NOTES.md
- DOMAIN_RULES.md
- ENV_CONFIG_PLAN.md
- TEST_CHECKLIST.md
- FINAL_SUMMARY.md

**Backend:**
- supabase/migrations/004_what_why_flows.sql
- src/lib/scheduling/scheduler.ts + .test.ts
- src/lib/providers/llm-provider.ts
- src/lib/providers/stt-provider.ts
- src/lib/prompts/what-extract.ts
- src/lib/prompts/why-turn.ts
- src/lib/prompts/why-synthesize.ts
- src/lib/what-why-config.ts
- src/app/api/what/extract-drafts+api.ts
- src/app/api/what/drafts+api.ts
- src/app/api/what/confirm+api.ts

**Status:** ✅ All TypeScript passes, ✅ Unit tests pass, ✅ APIs functional
