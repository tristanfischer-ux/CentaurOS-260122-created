# MIGRATION NOTES - 7-Tab Restructure

## Summary
Restructured CentaurOS from the original 7 visible tabs to a new 7-tab structure with clearer separation of concerns.

---

## Tab Mapping

| Old Tab | New Location | Notes |
|---------|--------------|-------|
| Home | **Home** | Unchanged - added Plan/Analytics drilldowns |
| Who | **People** | Renamed, consolidates team management |
| What | **Tasks** | Renamed, consolidates task management |
| Why | Home → Plan | Moved to Home drilldown |
| Tools | **Resources** | Renamed, current usage only |
| Performance | Home → Analytics | Moved to Home drilldown |
| Settings | **Settings** | Unchanged |

## New Tabs

| New Tab | Purpose | Content Source |
|---------|---------|----------------|
| **When** | Timeline/capacity view | New implementation |
| **Marketplace** | Discovery | community + tools discovery |

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

All legacy routes are preserved via hidden tabs (`href: null`). The original screens are still accessible but not shown in the tab bar.

| Old Route | Redirects To | Implementation | Status |
|-----------|--------------|----------------|--------|
| /who | /people | Hidden tab | ✅ DONE |
| /what | /tasks | Hidden tab | ✅ DONE |
| /tools | /resources | Hidden tab | ✅ DONE |
| /community | /marketplace | Hidden tab | ✅ DONE |
| /make | /resources | Hidden tab | ✅ DONE |
| /decide | /tasks | Hidden tab | ✅ DONE |
| /do | /tasks | Hidden tab | ✅ DONE |
| /why | Home → Plan | Quick Access button | ✅ DONE |
| /performance | Home → Analytics | Quick Access button | ✅ DONE |

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
- ✅ Task list with status groups (Doing/Queued/Blocked/Done)
- ✅ Voice/text task creation via UnifiedBottomDrawer
- ✅ Task drafts review via TaskDraftsReviewModal
- ✅ Role-based filtering
- ❌ Timeline/Gantt removed (moved to When)

### When Tab (new)
- ✅ Week view grid (rows=people, cols=Mon–Sun)
- ✅ Week navigation (forward/backward)
- ✅ Capacity summary (utilization %, hours allocated, available)
- ✅ Task blocks with status colors
- ✅ Links to Tasks on tap

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
- ✅ All actions create task drafts only (never auto-execute)
- ✅ Search functionality

### Home Drilldowns
- ✅ Plan/Strategy (formerly Why tab) - via Quick Access section
- ✅ Analytics (formerly Performance tab) - via Quick Access section

---

## Files Created

| File | Purpose |
|------|---------|
| `src/app/(tabs)/people.tsx` | New People tab |
| `src/app/(tabs)/tasks.tsx` | New Tasks tab |
| `src/app/(tabs)/when.tsx` | New When tab |
| `src/app/(tabs)/resources.tsx` | New Resources tab |
| `src/app/(tabs)/marketplace.tsx` | New Marketplace tab |
| `WORKPLAN_CHECKLIST.md` | Task tracking |
| `PROGRESS_TRACKER.md` | Progress documentation |
| `MIGRATION_NOTES.md` | This file |
| `TAB_CONTRACT.md` | Tab structure contract |
| `MANUAL_TEST_CHECKLIST.md` | Manual testing guide |

## Files Modified

| File | Changes |
|------|---------|
| `src/app/(tabs)/_layout.tsx` | New 7-tab structure, hidden legacy tabs |
| `src/app/(tabs)/index.tsx` | Added Plan/Analytics Quick Access buttons |
| `src/app/(tabs)/who.tsx` | Added LEGACY header comment |
| `src/app/(tabs)/what.tsx` | Added LEGACY header comment |
| `src/app/(tabs)/tools.tsx` | Added LEGACY header comment |
| `src/app/(tabs)/why.tsx` | Added LEGACY header comment |
| `src/app/(tabs)/performance.tsx` | Added LEGACY header comment |

---

## Breaking Changes

**None** - All old routes are preserved and continue to work.

Deep links to `/who`, `/what`, `/why`, `/performance`, `/tools` will still work, loading the original screens. These screens are simply hidden from the tab bar.

---

## Deprecation Timeline

| Phase | Timeline | Action |
|-------|----------|--------|
| Phase 1 | Now | Hide old tabs from tab bar, add LEGACY headers |
| Phase 2 | +1 week | Monitor usage of legacy routes |
| Phase 3 | +2 weeks | Consider removing legacy screens if unused |

---

## Last Updated
2024-01-19 - Initial migration complete
