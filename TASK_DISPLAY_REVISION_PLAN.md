# Task Display Revision Plan

## Current Issues Identified

### 1. Visual Disconnection Between Compact and Inline Medium Views
**Problem**: The inline expansion (`TaskCardMediumInline`) looks detached from the Compact card:
- Has different background color (`bg-slate-50` vs `bg-white`)
- Has margin (`mx-3`) creating visual gap
- Has colored left border that doesn't connect to parent
- Uses `rounded-lg` on all sides when it should flow from above

**Solution**: Make the expansion appear as a continuation of the Compact card, not a separate element

### 2. Redundant Information in Medium View
**Problem**: The Medium view repeats information already shown in Compact:
- Title repeated (shown in both Compact and Medium)
- Due date repeated (shown in both)
- Progress bar repeated (shown in both)

**Solution**: Medium view should ONLY show NEW information not in Compact:
- Description (editable) - NEW
- Quick action buttons (status, progress controls, reschedule) - NEW
- "View Full Details" button - NEW

### 3. Font Inconsistencies Across Components
**Problem**: Different font sizes and weights used inconsistently:

| Component | Title | Labels | Values |
|-----------|-------|--------|--------|
| **TaskCardCompact** | `text-sm font-medium` | `text-[10px]` | `text-[10px]` |
| **TaskCardMediumInline** | `text-base font-bold` | `text-xs font-semibold` | `text-xs font-semibold` |
| **TaskCardMedium** (modal) | `text-lg font-bold` | `text-sm font-semibold` | `text-xs font-semibold` |

**Solution**: Standardize typography across all components:
- Title: `text-sm font-semibold` (everywhere)
- Section labels: `text-xs font-medium text-slate-500`
- Values: `text-xs font-semibold`

### 4. Two Different "Medium" Views
**Problem**: `TaskCardMediumInline` (Home) and `TaskCardMedium` (Tasks tab modal) are completely different:
- Different layouts
- Different font sizes
- Different sections shown
- Different background colors

**Solution**: Create ONE unified design that works for both contexts

---

## Revised Design Specification

### Tier 1: Compact View (unchanged)
```
┌─────────────────────────────────────────────────────────────┐
│ ● Title goes here                          👤👤👤  ⚡      │
│   16 TU @ 8/wk = ~2w                      Due Tue 3 Feb    │
│   ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
└─────────────────────────────────────────────────────────────┘
```

### Tier 2: Medium View (INLINE EXPANSION - REVISED)
When you tap a Compact card, it EXPANDS IN PLACE. The Compact content stays at the top, and additional content slides down below it.

```
┌─────────────────────────────────────────────────────────────┐
│ ● Title goes here                          👤👤👤  ⚡      │
│   16 TU @ 8/wk = ~2w                      Due Tue 3 Feb    │
│   ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Description                                          ✎    │
│  Task description text here, can be edited...              │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Status     [Queue] [Start] [Block] [Done]                 │
│                                                             │
│  Progress   [-] [25%] [50%] [75%] [100%] [+]               │
│                                                             │
│  Reschedule [-1 Wk] [-1 Day] [+1 Day] [+1 Wk]              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │        View Full Details & Coordination Cost          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                          ▲ tap to collapse                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes**:
1. **Connected appearance**: No gap between Compact and expansion
2. **No repeated info**: Title, due date, effort timeline, progress bar are NOT repeated
3. **Same background**: Uses same `bg-white dark:bg-slate-800` as Compact
4. **Separator line**: Thin divider between Compact content and expansion
5. **Collapse affordance**: Clear indicator that tapping collapses back

### Tier 2: Medium View (MODAL VERSION - for Tasks tab)
The modal version should match the inline version's content, just presented as a bottom sheet:

```
┌─────────────────────────────────────────────────────────────┐
│  Status Badge   Function                              ✕    │
├─────────────────────────────────────────────────────────────┤
│  Task Title                                👤👤👤  ⚡      │
│  📅 Due Tue 3 Feb (or "3 days overdue")                    │
│  ████████████░░░░░░░░░░░░░░ 45%                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Description                                          ✎    │
│  Task description text here...                             │
│                                                             │
│  Status     [Queue] [Start] [Block] [Done]                 │
│                                                             │
│  Progress   [-] [25%] [50%] [75%] [100%] [+]               │
│                                                             │
│  Reschedule [-1 Wk] [-1 Day] [+1 Day] [+1 Wk]              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │        View Full Details & Coordination Cost          │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Difference from Inline**: Modal shows Compact-equivalent info at top (since there's no Compact card above it)

---

## Implementation Plan

### Phase 1: Create Unified Quick Actions Component
Create `TaskQuickActions.tsx` - a reusable component for the action buttons:
- Status selector buttons
- Progress control buttons
- Reschedule buttons
- "View Full Details" button

### Phase 2: Redesign TaskCardMediumInline
- Remove duplicate info (title, due date, progress bar)
- Add thin separator line below Compact card
- Match background color to Compact card
- Remove left border and margins
- Use consistent typography
- Include collapse indicator

### Phase 3: Redesign TaskCardMedium (Modal)
- Include Compact-equivalent header (since no Compact card above)
- Use same Quick Actions component
- Match typography to inline version
- Consistent layout and spacing

### Phase 4: Update FocusTodaySection & CurrentActivitiesSection
- Update how expansion is rendered (connected appearance)
- Pass priority indicator as prop to Compact card, not as wrapper border

### Phase 5: Typography Standardization
- Update all task components to use consistent font sizes/weights
- Document in STYLE_GUIDE.md

---

## Typography Standards (Proposed)

```typescript
// Task Card Typography
const TASK_TYPOGRAPHY = {
  title: 'text-sm font-semibold text-slate-900 dark:text-white',
  subtitle: 'text-xs font-medium text-slate-600 dark:text-slate-400',
  label: 'text-xs font-medium text-slate-500 dark:text-slate-500',
  value: 'text-xs font-semibold text-slate-900 dark:text-white',
  smallValue: 'text-[10px] font-medium text-slate-600 dark:text-slate-400',
  button: 'text-xs font-semibold',
};
```

---

## Files to Modify

1. `src/components/tasks/TaskQuickActions.tsx` - NEW
2. `src/components/tasks/TaskCardMediumInline.tsx` - REWRITE
3. `src/components/tasks/TaskCardMedium.tsx` - REWRITE
4. `src/components/tasks/TaskCardCompact.tsx` - Minor updates (add expansion slot)
5. `src/components/FocusTodaySection.tsx` - Update expansion rendering
6. `src/components/home/CurrentActivitiesSection.tsx` - Update expansion rendering
7. `src/components/tasks/index.ts` - Export new component

---

## Questions for Approval

1. Should the inline expansion animate height smoothly, or is slide-down acceptable?
2. Should the priority indicator (colored border) be on the Compact card itself, or only visible in Focus Today section?
3. For the modal Medium view, should it include the effort timeline ("16 TU @ 8/wk = ~2w") like Compact does?

---

Please review and approve this plan before I proceed with implementation.
