# PROGRESS TRACKER - 7-Tab Restructure

## Current Status: STEP 10-11 IN PROGRESS

---

## STEP 0 — Repo inventory & safety ✅ COMPLETE

### Evidence:
- Tab layout: `src/app/(tabs)/_layout.tsx`
- Build status: TypeScript PASSES

---

## STEP 1 — Create new top-level tab routes ✅ COMPLETE

| Task | Status | Evidence |
|------|--------|----------|
| Create /people route | DONE | `src/app/(tabs)/people.tsx` |
| Create /tasks route | DONE | `src/app/(tabs)/tasks.tsx` |
| Create /when route | DONE | `src/app/(tabs)/when.tsx` |
| Create /resources route | DONE | `src/app/(tabs)/resources.tsx` |
| Create /marketplace route | DONE | `src/app/(tabs)/marketplace.tsx` |
| Update tab navigation | DONE | `src/app/(tabs)/_layout.tsx` |
| Verify navigation | DONE | TypeScript passes |

---

## STEP 2 — Backward compatible redirects ✅ COMPLETE

| Old Route | New Route | Status | Implementation |
|-----------|-----------|--------|----------------|
| /who | /people | DONE | Hidden tab (href: null), still accessible |
| /what | /tasks | DONE | Hidden tab (href: null), still accessible |
| /tools | /resources | DONE | Hidden tab (href: null), still accessible |
| /community | /marketplace | DONE | Hidden tab (href: null), still accessible |
| /make | /resources | DONE | Hidden tab (href: null), still accessible |
| /decide | /tasks | DONE | Hidden tab (href: null), still accessible |
| /do | /tasks | DONE | Hidden tab (href: null), still accessible |
| /why | /home (Plan) | DONE | Quick Access → Plan button |
| /performance | /home (Analytics) | DONE | Quick Access → Analytics button |

---

## STEP 3 — People consolidation ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| My Team list | DONE | `people.tsx` line 200-281 |
| Capacity per person | DONE | Shows daysPerWeek |
| Hiring pipeline | DONE | Pipeline stages UI |
| Links to Tasks/When | DONE | Quick action buttons |

---

## STEP 4 — Tasks consolidation ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| Status-first view | DONE | Doing/Queued/Blocked/Done groups |
| Task creation | DONE | UnifiedBottomDrawer integration |
| Voice/text drafts | DONE | handleVoiceTranscript, handleTextInput |
| No timeline/Gantt | DONE | Moved to When tab |

---

## STEP 5 — When tab ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| Week view grid | DONE | `when.tsx` lines 180-240 |
| People rows | DONE | memberAllocations mapping |
| Day columns | DONE | Mon-Sun weekDates |
| Task blocks | DONE | Color-coded by status |
| Links to Tasks | DONE | onPress → router.push |

---

## STEP 6 — Resources tab ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| AI tools configured | DONE | aiAgents section |
| Supplier engagements | DONE | supplierEngagements section |
| No discovery | DONE | "Browse Marketplace" CTA |

---

## STEP 7 — Marketplace tab ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| People discovery | DONE | Fractional Execs, Apprentices cards |
| Suppliers discovery | DONE | Manufacturing, Logistics, Services |
| AI tool catalog | DONE | THIRD_PARTY_AI_TOOLS integration |
| Advisors discovery | DONE | VC, Legal, Accounting, Domain Experts |
| Draft-only actions | DONE | handleCreateOutreachDraft creates real drafts via Draft store |

---

## STEP 8 — Home drilldowns ✅ COMPLETE

| Feature | Status | Evidence |
|---------|--------|----------|
| Plan / Strategy | DONE | `index.tsx` Quick Access → Plan button |
| Analytics | DONE | `index.tsx` Quick Access → Analytics button |

---

## STEP 9 — Archive old tabs ✅ PARTIAL

| Task | Status | Notes |
|------|--------|-------|
| Hide from tab bar | DONE | href: null in _layout.tsx |
| Add LEGACY headers | DONE | who.tsx, what.tsx, tools.tsx, why.tsx, performance.tsx |
| Move to _archived | DEFERRED | Keeping for backward compatibility |

---

## STEP 10 — Docs + consistency 🔄 IN PROGRESS

| Task | Status | Evidence |
|------|--------|----------|
| TAB_CONTRACT.md | PENDING | |
| README.md update | PENDING | |
| Status vocabulary | DONE | Doing/Queued/Blocked/Done consistent |
| Theme consistency | DONE | Using existing color scheme |

---

## STEP 11 — Regression checks 🔄 IN PROGRESS

| Task | Status | Evidence |
|------|--------|----------|
| TypeScript check | DONE | `bun run tsc --noEmit` passes |
| Fix regressions | DONE | None found |
| MANUAL_TEST_CHECKLIST | PENDING | |

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
| `PROGRESS_TRACKER.md` | This file |
| `MIGRATION_NOTES.md` | Route mapping |

## Files Modified

| File | Changes |
|------|---------|
| `src/app/(tabs)/_layout.tsx` | New 7-tab structure, hidden legacy tabs |
| `src/app/(tabs)/index.tsx` | Added Plan/Analytics Quick Access buttons |
| `src/app/(tabs)/who.tsx` | Added LEGACY header |
| `src/app/(tabs)/what.tsx` | Added LEGACY header |
| `src/app/(tabs)/tools.tsx` | Added LEGACY header |
| `src/app/(tabs)/why.tsx` | Added LEGACY header |
| `src/app/(tabs)/performance.tsx` | Added LEGACY header |

---

## Last Updated: Step 9 Complete, Step 10-11 in progress
