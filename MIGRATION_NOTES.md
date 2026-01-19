# MIGRATION NOTES - 7-Tab Restructure

**Last Updated**: 2026-01-19

## Summary

Restructured CentaurOS from the original 7 visible tabs to a new 7-tab structure with clearer separation of concerns.

**Key Changes in v2.0 (2026-01-19)**:
- Implemented unified Draft store (drafts are now separate entities from tasks)
- Added real auto-redirects for legacy routes (not just hidden tabs)
- Marketplace now creates drafts ONLY (no more fake `[DRAFT]` prefix tasks)
- Tasks tab now shows Drafts section at top

---

## Tab Mapping

| Old Tab | New Location | Notes |
|---------|--------------|-------|
| Home | **Home** | Unchanged - added Plan/Analytics drilldowns |
| Who | **People** | Renamed, consolidates team management |
| What | **Tasks** | Renamed, consolidates task management + DRAFTS |
| Why | Home → Plan | Moved to Home drilldown |
| Tools | **Resources** | Renamed, current usage only |
| Performance | Home → Analytics | Moved to Home drilldown |
| Settings | **Settings** | Unchanged |

## New Tabs

| New Tab | Purpose | Content Source |
|---------|---------|----------------|
| **When** | Timeline/capacity view | New implementation |
| **Marketplace** | Discovery only, creates DRAFTS | community + tools discovery |

---

## Hidden Tab Mapping

| Old Hidden Tab | New Location | Notes |
|----------------|--------------|-------|
| decide | Tasks | Merged into Tasks (hidden, accessible) |
| do | Tasks | Merged into Tasks (hidden, accessible) |
| evaluate | Tasks | Merged into Tasks (hidden, accessible) |
| make | Resources | Supplier engagements (hidden, accessible) |
| community | Marketplace | Discovery features (hidden, accessible) |

---

## Route Redirects

Legacy routes now use **real auto-redirects** (useEffect + router.replace) in addition to hidden tabs:

| Old Route | Redirects To | Implementation | Status |
|-----------|--------------|----------------|--------|
| /who | /people | **Auto-redirect on mount** | ✅ DONE |
| /what | /tasks | **Auto-redirect on mount** | ✅ DONE |
| /tools | /resources | **Auto-redirect on mount** | ✅ DONE |
| /community | /marketplace | Hidden tab | ✅ DONE |
| /make | /resources | Hidden tab | ✅ DONE |
| /decide | /tasks | Hidden tab | ✅ DONE |
| /do | /tasks | Hidden tab | ✅ DONE |
| /why | Home → Plan | Quick Access button | ✅ DONE |
| /performance | Home → Analytics | Quick Access button | ✅ DONE |

---

## Draft System (NEW in v2.0)

### Unified Draft Store

**File**: `src/lib/state/draft-store.ts`

Drafts are now **separate entities** from real tasks:

| Property | Drafts | Tasks |
|----------|--------|-------|
| Store | `useDraftStore` | `useWorkPlanStore` |
| Status | `pending_confirmation` | `not-started`, `in-progress`, etc. |
| Shown in When | NO | YES |
| In metrics | NO | YES |

### Draft Sources

| Source | Description |
|--------|-------------|
| `ai_extraction` | Voice or text AI extraction |
| `marketplace` | Marketplace discovery actions |
| `import` | External imports |
| `manual` | Manually created |

### No More Fake Drafts

**Before (WRONG)**:
```javascript
// Marketplace was writing real tasks with [DRAFT] prefix
addWorkPlan({
  title: '[DRAFT] Contact CFO',
  needsSubmission: true,  // Fake draft flag
  ...
});
```

**After (CORRECT)**:
```javascript
// Marketplace now creates real drafts
addDraft({
  title: 'Contact CFO',  // No prefix needed
  source: 'marketplace',
  ...
});
```

---

## Feature Relocation Details

### People Tab (from Who)
- ✅ My Team list (Founder/Exec/Apprentice roles)
- ✅ Capacity per person (daysPerWeek display)
- ✅ Hiring pipeline (5 stages: Identified → Contacted → Intro → Trial → Engaged)
- ✅ Links to Tasks ("View Tasks" button)
- ✅ Links to When ("View Schedule" button)
- 📦 Squads: Kept in Settings

### Tasks Tab (from What + decide + do)
- ✅ **Drafts section at top** (unified Draft store)
- ✅ Task list with status groups (Doing/Queued/Blocked/Done)
- ✅ Voice/text task creation via UnifiedBottomDrawer
- ✅ Draft confirmation (converts to real tasks)
- ✅ Role-based filtering
- ❌ Timeline/Gantt removed (moved to When)

### When Tab (new)
- ✅ Week view grid (rows=people, cols=Mon–Sun)
- ✅ Week navigation (forward/backward)
- ✅ Capacity summary (utilization %, hours allocated, available)
- ✅ Task blocks with status colors
- ✅ Links to Tasks on tap
- ⚠️ **Only shows real tasks** (not drafts)

### Resources Tab (from Tools - current usage only)
- ✅ Configured AI tools (aiAgents from organization store)
- ✅ Active supplier engagements with progress bars
- ✅ Contact actions (Call/Email/SMS)
- ✅ Linked tasks display
- ❌ Discovery removed (moved to Marketplace)

### Marketplace Tab (discovery only)
- ✅ People discovery (Fractional Executives, Apprentices)
- ✅ Suppliers discovery (Manufacturing, Logistics, Professional Services)
- ✅ AI tool catalog (THIRD_PARTY_AI_TOOLS integration)
- ✅ Advisors discovery (VC, Legal, Accounting, Domain Experts)
- ✅ **All actions create DRAFTS only** (via Draft store)
- ✅ Search functionality

### Home Drilldowns
- ✅ Plan/Strategy (formerly Why tab) - via Quick Access section
- ✅ Analytics (formerly Performance tab) - via Quick Access section

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/state/draft-store.ts` | **NEW** Unified Draft store |
| `src/app/(tabs)/people.tsx` | New People tab |
| `src/app/(tabs)/tasks.tsx` | New Tasks tab (with Drafts section) |
| `src/app/(tabs)/when.tsx` | New When tab |
| `src/app/(tabs)/resources.tsx` | New Resources tab |
| `src/app/(tabs)/marketplace.tsx` | New Marketplace tab (creates drafts) |
| `WORKPLAN_CHECKLIST.md` | Task tracking |
| `PROGRESS_TRACKER.md` | Progress documentation |
| `MIGRATION_NOTES.md` | This file |
| `TAB_CONTRACT.md` | Tab structure contract |
| `MANUAL_TEST_CHECKLIST.md` | Manual testing guide |
| `STYLE_SYSTEM.md` | UI primitives documentation |
| `REFACTOR_BACKLOG_CODE_STYLE.md` | Lint issues tracking |
| `OVERNIGHT_LOG.md` | Session log |

## Files Modified

| File | Changes |
|------|---------|
| `src/app/(tabs)/_layout.tsx` | New 7-tab structure, hidden legacy tabs |
| `src/app/(tabs)/index.tsx` | Added Plan/Analytics Quick Access buttons |
| `src/app/(tabs)/who.tsx` | Added auto-redirect to /people |
| `src/app/(tabs)/what.tsx` | Added auto-redirect to /tasks |
| `src/app/(tabs)/tools.tsx` | Added auto-redirect to /resources |
| `src/app/(tabs)/why.tsx` | Added LEGACY header comment |
| `src/app/(tabs)/performance.tsx` | Added LEGACY header comment |

---

## Breaking Changes

**None** - All old routes are preserved and continue to work via auto-redirects.

Deep links to `/who`, `/what`, `/tools` will auto-redirect to new locations.

---

## Deprecation Timeline

| Phase | Timeline | Action |
|-------|----------|--------|
| Phase 1 | Now | Auto-redirect legacy routes, add LEGACY headers |
| Phase 2 | +2 weeks | Monitor usage of legacy routes via console logs |
| Phase 3 | +4 weeks | Remove legacy screen code, keep redirects only |

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-19 | 2.0 | Draft store, unified drafts, real redirects |
| 2024-01-19 | 1.0 | Initial 7-tab restructure |
