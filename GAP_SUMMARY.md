# GAP SUMMARY
**Priority Ranking of Missing/Incomplete Requirements**
**Date:** 2026-01-19

---

## TOP 15 GAPS BY IMPACT

### P0 Gaps (Critical - Blocks Production)

#### 1. **API Key Security Exposure** [A1]
**Impact:** High security risk
**Status:** ❌ Missing
**Details:**
- All AI API keys (OpenAI, Google, Anthropic) exposed via `EXPO_PUBLIC_*` env vars
- Keys are bundled in client app and can be extracted
- Documented as "not secure for production" in docs/API_SECURITY_NOTE.md

**Evidence:**
- `src/lib/ai/task-extraction.ts:39` - `process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY`
- `src/app/founder-onboarding.tsx:181` - Client-side key checks

**Recommended Fix:**
- Use Vibecode API integrations (API tab) for secure key management, OR
- Implement Supabase Edge Functions for server-side LLM calls, OR
- Add real backend (Next.js, Express) with API routes

**Effort:** Medium (architectural decision required)

---

#### 2. **Server-Side Gemini Execution** [A2]
**Impact:** High security + architectural concern
**Status:** ⚠️ Partial (code exists but not reachable)
**Details:**
- Server routes exist (`src/app/api/why/*.ts`) with Gemini provider
- Routes can't be called as HTTP endpoints (Expo Router limitation)
- Direct fetch to `/api/why/turn` returns HTML, not JSON

**Evidence:**
- `src/app/api/why/turn+api.ts` - Implementation exists
- docs/API_SECURITY_NOTE.md documents "API routes only work within React rendering context"

**Root Cause:**
- Expo Router API routes are not traditional REST endpoints
- Designed for SSR, not standalone API calls

**Recommended Fix:**
- Migrate to Supabase Edge Functions for server-side LLM, OR
- Accept client-side calls + use Vibecode API integrations

**Effort:** High (requires architectural change)

---

#### 3. **Model Router Dispatcher Not Implemented** [A4]
**Impact:** Medium - routing policy not enforced
**Status:** ❌ Missing
**Details:**
- `config/model_router.json` exists with excellent routing policy
- No dispatcher reads this policy and routes requests
- Current code uses direct provider selection via `whatWhyConfig.llm.provider`

**Evidence:**
- `config/model_router.json` - Policy defined
- `src/lib/providers/llm-provider.ts:278` - Factory doesn't consult router
- No dispatcher found in codebase

**Recommended Fix:**
- Create `src/lib/routing/dispatcher.ts` that:
  - Reads `model_router.json`
  - Maps operation types to providers
  - Handles fallback on provider failure
  - Implements priority-based routing

**Effort:** Medium (2-3 hours)

---

### P1 Gaps (Important - Reduces Quality)

#### 4. **Cost-Aware Routing Not Implemented** [A5]
**Impact:** Medium - cost optimization missing
**Status:** ❌ Missing
**Details:**
- model_router.json documents cost intent ("Gemini cheap calls")
- No token counting or cost tracking
- No budget enforcement

**Evidence:**
- No cost tracking found in LLM provider calls
- No usage metrics stored

**Recommended Fix:**
- Add token counting to LLM responses
- Track cumulative costs per workspace
- Implement budget alerts
- Route to cheaper models when budget constrained

**Effort:** Medium (requires cost API integration)

---

#### 5. **Stage-Aware WHY Synthesis Missing** [C4]
**Impact:** Medium - reduces WHY tab intelligence
**Status:** ⚠️ Partial (onboarding has stage logic, WHY doesn't)
**Details:**
- Stage mapping exists in `src/lib/onboarding/stage-rules.ts`
- Founder onboarding uses stage awareness
- WHY brainstorm/synthesis doesn't adapt prompts by stage

**Evidence:**
- `src/app/api/why/synthesize+api.ts` - No stage-based prompt variation
- Prompts are generic, not tailored to S0 vs S2 vs S3

**Recommended Fix:**
- Pass `org_stage` + `finance_stage` to WHY endpoints
- Vary synthesis prompts:
  - S0/S1: Foundation-heavy (mission, ICP, MVP)
  - S2: GTM-heavy (channel, pipeline, metrics)
  - S3+: Scale-heavy (org design, systems, process)

**Effort:** Low-Medium (1-2 hours)

---

#### 6. **Marketplace Ingestion Limited to People** [D3]
**Impact:** Medium - limits marketplace utility
**Status:** ⚠️ Partial
**Details:**
- People seeding works (`src/app/api/people/seed/upload+api.ts`)
- No bulk ingestion for `directory_orgs`, `directory_ai_tools`
- Schema supports it, tooling doesn't

**Evidence:**
- People upload API exists
- No equivalent for org/tool bulk import

**Recommended Fix:**
- Create `src/app/api/marketplace/seed/orgs+api.ts`
- Create `src/app/api/marketplace/seed/tools+api.ts`
- Support CSV/JSON bulk upload
- Add deduplication by domain/Companies House number

**Effort:** Medium (3-4 hours per entity type)

---

#### 7. **Test Coverage Incomplete** [I4]
**Impact:** Medium - reduces confidence
**Status:** ⚠️ Partial (only scheduler tested)
**Details:**
- `src/lib/scheduling/scheduler.test.ts` exists
- No tests for:
  - LLM providers
  - WHAT/WHY flows
  - Marketplace search
  - People matching
  - Onboarding logic

**Evidence:**
- No test files found for most modules

**Recommended Fix:**
- Add Jest/React Native Testing Library tests for:
  - Critical business logic (capacity, matching)
  - API route handlers
  - Store mutations
  - Edge cases (overflow, conflicts)

**Effort:** High (ongoing work)

---

### P2 Gaps (Nice to Have - Polish)

#### 8. **IndexedDB Not Used (AsyncStorage Instead)** [G3]
**Impact:** Low - AsyncStorage is RN standard
**Status:** ⚠️ Partial (architectural mismatch)
**Details:**
- Requirement assumed web environment (IndexedDB)
- React Native uses AsyncStorage (correct choice)
- No issue with functionality, just spec mismatch

**Evidence:**
- `src/lib/offline/storage.ts` - AsyncStorage-based

**Recommended Fix:**
- Update requirement to reflect RN reality
- OR add web-specific IndexedDB adapter
- Current implementation is correct for RN

**Effort:** N/A (spec issue, not code issue)

---

#### 9. **LLM Onboarding Uses Client Keys** [F4]
**Impact:** Low-Medium - same as general key issue
**Status:** ⚠️ Partial
**Details:**
- Onboarding LLM generation exists
- Uses same client-side key pattern
- Duplicate of Gap #1

**Evidence:**
- `src/app/api/onboarding/generate+api.ts`

**Recommended Fix:**
- Same as Gap #1 (Vibecode API integrations)

**Effort:** N/A (duplicate of #1)

---

#### 10. **No Cost Monitoring Dashboard** [A5 extension]
**Impact:** Low - operational visibility
**Status:** ❌ Missing
**Details:**
- No UI to view LLM usage/costs
- No per-workspace cost breakdown

**Recommended Fix:**
- Add `/settings/api-usage` screen
- Show token counts, costs per provider
- Chart usage over time

**Effort:** Low (1-2 hours)

---

#### 11. **No Admin UI for Model Router Config** [A3 extension]
**Impact:** Low - configuration UX
**Status:** ❌ Missing
**Details:**
- `model_router.json` must be edited manually
- No UI to change routing priorities or add operations

**Recommended Fix:**
- Create `/settings/model-router` admin screen
- Allow editing provider priorities
- Allow adding custom operations

**Effort:** Medium (2-3 hours)

---

#### 12. **Freshness System Has No UI Dashboard** [D6 extension]
**Impact:** Low - operational visibility
**Status:** ⚠️ Partial
**Details:**
- Freshness system is CLI-only (`scripts/run_freshness_job.ts`)
- README mentions `/freshness-dashboard` route
- Dashboard may exist but not prominently featured

**Evidence:**
- `src/app/freshness-dashboard.tsx` exists

**Recommended Fix:**
- Ensure dashboard is accessible
- Add link from Settings or WHO tab

**Effort:** Low (UI routing)

---

#### 13. **No Automatic Stage Detection in WHY** [C4 extension]
**Impact:** Low - automation
**Status:** ❌ Missing
**Details:**
- Stage must be manually set
- No automatic detection from company signals (revenue, team size, funding)

**Recommended Fix:**
- Create stage detection heuristics:
  - F0 + 1-2 people = S0 (Idea)
  - F1 + <£50K revenue = S1 (Pre-seed)
  - F2 + <£500K revenue = S2 (Seed)
  - etc.
- Auto-suggest stage changes

**Effort:** Medium (2-3 hours)

---

#### 14. **No Failover Testing for Model Router** [A4 extension]
**Impact:** Low - reliability
**Status:** ❌ Missing
**Details:**
- Router policy defines fallback providers
- No tests verify failover works
- No monitoring of provider health

**Recommended Fix:**
- Add integration tests for routing
- Simulate provider failures
- Verify fallback kicks in

**Effort:** Medium (requires test infrastructure)

---

#### 15. **No Bulk Delete/Archive for Completed Tasks** [B1 extension]
**Impact:** Low - UX polish
**Status:** ❌ Missing
**Details:**
- Tasks can be completed individually
- No bulk operations for cleanup
- Old completed tasks clutter UI

**Recommended Fix:**
- Add "Archive completed" action
- Add "Delete completed older than X days"
- Move archived tasks to separate view

**Effort:** Low (1 hour)

---

## GAP CATEGORY SUMMARY

| Priority | Count | % of Total |
|----------|-------|------------|
| P0 (Critical) | 3 | 20% |
| P1 (Important) | 4 | 27% |
| P2 (Nice to Have) | 8 | 53% |

---

## RECOMMENDED IMPLEMENTATION ORDER

**If implementation were allowed, tackle in this order:**

1. **Gap #1 (API Security)** - Immediate production blocker
2. **Gap #3 (Model Router)** - Enables proper routing architecture
3. **Gap #4 (Cost Tracking)** - Prevents budget overruns
4. **Gap #5 (Stage-Aware WHY)** - High user value
5. **Gap #6 (Marketplace Ingestion)** - Completes marketplace vision
6. **Gap #2 (Server-Side Gemini)** - Architectural decision required
7. **Gaps #7-15** - Polish and operational improvements

---

## EFFORT ESTIMATION

| Gap | Effort | Dependencies |
|-----|--------|--------------|
| #1 API Security | Medium | Architectural decision |
| #2 Server-Side Gemini | High | Backend architecture |
| #3 Model Router | Medium | None |
| #4 Cost Tracking | Medium | Provider APIs |
| #5 Stage WHY | Low-Medium | None |
| #6 Ingestion | Medium | None |
| #7 Test Coverage | High | Ongoing |
| #8-15 | Low-Medium | Various |

**Total Estimated Effort:** 2-3 weeks (assuming 1 developer)

---

**End of Gap Summary**
