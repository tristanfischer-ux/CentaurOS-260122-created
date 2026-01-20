# Task Display Standardization Plan

## Executive Summary

This plan defines a consistent, standardized approach to displaying task information across the entire app. The goal is to eliminate confusion by ensuring tasks look and behave the same way regardless of where they appear in the UI.

---

## Current Problems

Based on the screenshots and component analysis:

1. **Inconsistent Data Display**: Same task shows different fields in different places
2. **Varying Visual Styles**: Different card designs, spacing, typography
3. **Confusion About Actions**: Users don't know what they can do at each level
4. **Redundant Components**: Multiple modals doing similar things (TaskDetailModal, TaskDetailsModal, UnifiedTaskAllocationModal)

---

## Proposed 3-Tier System

### TIER 1: COMPACT (Single Line / List Item)
**Use When:** Task lists, focus sections, quick overviews, search results

| Field | Display | Format |
|-------|---------|--------|
| Status | Colored dot | 🔵 Blue = In Progress, ⏸️ Gray = Queued, 🔴 Red = Blocked, ✅ Green = Done |
| Title | Text (truncated) | Max 30 chars, ellipsis |
| Function | Badge | Small pill (Engineering, Marketing, etc.) |
| TU/Week | Text | "4 TU/wk" |
| Progress | Mini bar | Thin progress bar (no percentage text) |
| Priority | Icon | 🔥 High only (hide if normal/low) |

**Actions Available:** Tap to expand (Tier 2)

**Visual:**
```
┌────────────────────────────────────────────────────────────┐
│ 🔵  Go to the bank          Engineering   4 TU/wk   ▓▓▓░░ 🔥│
└────────────────────────────────────────────────────────────┘
```

---

### TIER 2: MEDIUM (Expanded Card / Quick Actions)
**Use When:** User taps on compact view, timeline interactions, task previews

| Section | Fields | Format |
|---------|--------|--------|
| **Header** | Status badge, Function badge, Title | Full title visible |
| **Due Date** | Due date + overdue indicator | "Due Mon 9 Feb" or "3 days overdue" (red) |
| **Progress** | Progress bar + percentage | "60%" with animated bar |
| **Quick Stats** | TU/Week, Total TU, Weeks | "4 TU/wk • 16 TU total • ~4 weeks" |
| **Team Preview** | Assigned members | Avatars only (max 3) + "+2 more" |

**Actions Available:**
- Quick Status Change: Queue / Start / Block / Done
- Progress Adjustment: -10%, +10%, preset buttons (25%, 50%, 75%, 100%)
- Reschedule: -1 Week, -1 Day, +1 Day, +1 Week
- "View Full Details" → Opens Tier 3

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  Engineering    In Progress                              ✕  │
│                                                             │
│  Go to the bank                                             │
│  📅 Due Mon 9 Feb                              🔥 High      │
│                                                             │
│  Progress                                         60%       │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                              │
│                                                             │
│  4 TU/wk  •  16 TU total  •  ~4 weeks                      │
│                                                             │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │  Queue  │  Start  │  Block  │  Done   │                 │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                             │
│  ┌─ Reschedule Due Date ─────────────────┐                 │
│  │ -1 Wk │ -1 Day │  ↺  │ +1 Day │ +1 Wk │                 │
│  └───────────────────────────────────────┘                 │
│                                                             │
│  👤👤👤 +2 more                                             │
│                                                             │
│            [ View Full Details > ]                         │
└─────────────────────────────────────────────────────────────┘
```

---

### TIER 3: FULL (Detail / Edit Modal)
**Use When:** User explicitly wants to edit or see everything

| Section | Fields | Editable |
|---------|--------|----------|
| **Header** | Title, Function dropdown, Status dropdown | ✅ Yes |
| **Description** | Full description text | ✅ Yes |
| **Timeline** | Start Date, Due Date (with pickers) | ✅ Yes |
| **Progress** | Progress bar + percentage + stepper | ✅ Yes |
| **Time Units** | TU Needed, Allocated/Week, Completed, Remaining, Weeks to Go | ✅ Yes (first two) |
| **Team** | Full member list with roles, allocations, costs | ⚠️ View only (manage via People tab) |
| **Priority/Importance** | Priority selector or importance score | ✅ Yes |
| **History** | Creation date, last modified, status changes | ❌ View only |

**Actions Available:**
- Save Changes
- Mark as Done
- Delete Task
- Add/Remove Team Members (links to People tab)

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                        [ Save ]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Title                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Go to the bank                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Function              Status                               │
│  ┌─────────────┐       ┌─────────────┐                     │
│  │ Engineering ▼│       │ In Progress▼│                     │
│  └─────────────┘       └─────────────┘                     │
│                                                             │
│  Description                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Need to visit the bank to get sausages for the      │   │
│  │ engineering team event...                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TIMELINE                                                   │
│                                                             │
│  Start Date                    Due Date                     │
│  ┌─────────────┐               ┌─────────────┐             │
│  │ 📅 Mon 2 Feb │               │ 📅 Mon 9 Feb │             │
│  └─────────────┘               └─────────────┘             │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PROGRESS                                           60%     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                              │
│  [ - ]  25%   50%   75%   100%  [ + ]                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TIME UNITS                                                 │
│                                                             │
│  TU Needed        Allocated/Week                            │
│  ┌───────────┐    ┌───────────┐                            │
│  │  [ - ] 16 [ + ]│    │  [ - ] 4 [ + ] │                            │
│  └───────────┘    └───────────┘                            │
│                                                             │
│  Completed: 10 TU   Remaining: 6 TU   Weeks to Go: ~2      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TEAM (3 members)                          [ Manage > ]    │
│                                                             │
│  👤 Sarah Chen      Founder        4 TU/wk                 │
│  👤 Mike Johnson    Executive      2 TU/wk                 │
│  👤 Emma Wilson     Apprentice     2 TU/wk                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PRIORITY                                                   │
│  ┌───────┐ ┌────────┐ ┌───────┐ ┌──────────┐              │
│  │  Low  │ │ Normal │ │ High  │ │ Critical │              │
│  └───────┘ └────────┘ └───────┘ └──────────┘              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Mark as Done ]              [ Delete Task ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Field Definitions (Standardized Across All Tiers)

| Field | Definition | Format | Required |
|-------|------------|--------|----------|
| **Title** | Task name | String, max 100 chars | Yes |
| **Status** | Current state | Enum: queued, in-progress, blocked, done | Yes |
| **Function** | Business area | Enum: Engineering, Marketing, Operations, Sales, Finance, HR | Yes |
| **Progress** | Completion % | 0-100 integer | Yes |
| **TU Needed** | Total effort estimate | Integer (1-999) | Yes |
| **TU/Week** | Weekly allocation | Integer (1-40) | Yes |
| **Due Date** | Target completion | Date | Yes |
| **Start Date** | When work began | Date | Optional |
| **Priority** | Urgency level | Enum: low, normal, high, critical | Default: normal |
| **Description** | Details/notes | String, max 2000 chars | Optional |

---

## Status Colors (Universal)

| Status | Primary Color | Background | Badge Text |
|--------|--------------|------------|------------|
| Queued | `#6B7280` (Gray) | `#F3F4F6` | "Queued" |
| In Progress | `#3B82F6` (Blue) | `#EFF6FF` | "In Progress" |
| Blocked | `#EF4444` (Red) | `#FEF2F2` | "Blocked" |
| Done | `#10B981` (Green) | `#ECFDF5` | "Done" |

---

## Priority Indicators (Universal)

| Priority | Icon | Color | When to Show |
|----------|------|-------|--------------|
| Low | None | — | Never show |
| Normal | None | — | Never show |
| High | 🔥 | `#F59E0B` (Amber) | Compact + Medium |
| Critical | ⚠️ | `#EF4444` (Red) | All tiers |

---

## Implementation Phases

### Phase 1: Create Base Components
1. Create `TaskCardCompact.tsx` - Tier 1 component
2. Create `TaskCardMedium.tsx` - Tier 2 component
3. Refactor `UnifiedTaskAllocationModal.tsx` - Tier 3 component (already closest to spec)

### Phase 2: Replace Existing Components
1. Replace all inline task rendering with new components
2. Remove redundant modals (TaskDetailModal.tsx, TaskDetailsModal.tsx)
3. Update TaskQuickActionsModal to use TaskCardMedium internally

### Phase 3: Unify Across Screens
1. Update Tasks tab to use new components
2. Update Home tab (FocusTodaySection) to use new components
3. Update When tab (timeline) to use new components
4. Update People tab task lists to use new components

### Phase 4: Polish & Test
1. Ensure animations are consistent
2. Test all navigation flows
3. Verify offline behavior
4. User testing for confusion reduction

---

## Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/components/tasks/TaskCardCompact.tsx` | CREATE | Tier 1 component |
| `src/components/tasks/TaskCardMedium.tsx` | CREATE | Tier 2 component |
| `src/components/tasks/TaskCardFull.tsx` | CREATE | Tier 3 component (refactored from UnifiedTaskAllocationModal) |
| `src/components/tasks/TaskStatusBadge.tsx` | CREATE | Reusable status badge |
| `src/components/tasks/TaskProgressBar.tsx` | CREATE | Reusable progress bar |
| `src/components/tasks/TaskPriorityIndicator.tsx` | CREATE | Reusable priority icon |
| `src/components/tasks/index.ts` | CREATE | Barrel export |
| `src/lib/task-utils.ts` | CREATE | Shared formatting functions |
| `src/components/CompactTaskCard.tsx` | DELETE | Replaced by new system |
| `src/components/TaskDetailModal.tsx` | DELETE | Redundant |
| `src/components/TaskDetailsModal.tsx` | DELETE | Redundant |
| `src/components/TaskQuickActionsModal.tsx` | REFACTOR | Use TaskCardMedium |
| `src/components/UnifiedTaskAllocationModal.tsx` | REFACTOR | Becomes TaskCardFull |

---

## Questions for Discussion

1. **Team Display in Tier 2**: Should we show avatars only, or names + avatars?
2. **Importance Score**: Keep the AI-calculated importance, or simplify to user-set priority?
3. **Inline Editing in Tier 2**: Should quick status/progress changes save immediately, or require a "Save" button?
4. **Animation on Expand**: Should Tier 1 → Tier 2 be an inline expand or a modal slide-up?
5. **Overdue Handling**: How prominently should we show overdue tasks? Red border? Special section?

---

## Success Metrics

- Users can identify task status at a glance in any screen
- No confusion about what fields mean (consistent labels)
- Clear understanding of what actions are available at each tier
- Reduced time to complete common actions (status change, progress update)
- Zero navigation dead-ends (all "View Details" links work)

---

*Plan created: January 2026*
*Status: DRAFT - Awaiting User Review*
