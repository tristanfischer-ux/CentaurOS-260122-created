# Good Night Mode - Workplan Checklist

## Phase 0: Security Fix (MUST DO FIRST)
- [x] Audit all EXPO_PUBLIC_* API key usages
- [x] Create server-side only env var pattern for AI keys
- [x] Ensure no AI keys leak to client bundle
- [x] Update .env.example with server-only vars
- [x] Create config/model_router.json scaffold
- [x] Update README/docs

## Phase 1: Offline-First Core + AI Outbox (NEW)
### Core Offline Storage
- [x] Create lib/offline/storage.ts (IndexedDB wrapper)
- [x] Create lib/offline/outbox.ts (job queue)

### Offline Features
- [x] Voice recording stores locally offline
- [x] Deterministic scheduling runs locally
- [ ] Manual task create/edit works offline (infrastructure ready)
- [ ] Cached marketplace data viewable offline (infrastructure ready)
- [ ] WHY tab supports offline journaling (infrastructure ready)

### AI Degradation
- [x] Show "Offline mode" banner when offline
- [x] "Pending AI processing" status indicator
- [x] Queue STT jobs for later
- [x] Queue WHAT extract jobs for later
- [x] Queue WHY turn/synthesize jobs for later

### Background Sync
- [x] Online/offline event detection
- [x] Queue flush with backoff
- [x] Job retry logic
- [x] Results stored locally until confirmed

### Documentation
- [x] Create OFFLINE_MODE_SPEC.md
- [x] Create OFFLINE_TEST_CHECKLIST.md

## Phase 2: Holistic App Review (Anti-Bloat Governance)
- [x] Create TAB_CONTRACT.md
- [x] Create SYSTEM_OBJECTS.md
- [x] Create FEATURE_REGISTRY.md
- [x] Create UX_CONSISTENCY_CHECKLIST.md
- [x] Create PRODUCT_REFACTOR_BACKLOG.md
- [x] Create QUICK_WINS.md
- [x] Implement top safe quick wins (Offline banner integrated)

## Phase 3: Code Review + Style/UX Consistency
- [x] Create CODE_STYLE_AUDIT_REPORT.md
- [x] STYLE_GUIDE.md (already exists - comprehensive)
- [x] REFACTOR_BACKLOG_CODE_STYLE.md (merged into PRODUCT_REFACTOR_BACKLOG.md)
- [x] Create QUICK_FIXES_APPLIED.md
- [x] Run lint/format (identified issues)
- [ ] Fix obvious drift and regressions (deferred - requires individual review)

## Phase 4: Autopilot Execution
- [ ] draft→confirm→schedule stability (needs runtime testing)
- [ ] WHY→WHAT stability (needs runtime testing)
- [ ] voice transcript-first stability (needs runtime testing)
- [ ] marketplace ingestion + wizard (needs runtime testing)
- [ ] freshness + portfolio refresh (needs runtime testing)
- [ ] people layer + opt-in + matching (needs runtime testing)
- [x] founder onboarding checklist (implemented in previous session)

## Final
- [ ] Run FINAL_COMPLETION_AUDIT
- [x] Create MORNING_SUMMARY.md
- [x] All items Done or Blocked with NEEDS_TRISTAN entry

## Carry Forward (from previous sessions)
- (None identified - first session)
