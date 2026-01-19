# Implementation Plan: Task Timeline Delay Tracking

## Overview
Add delay/overrun tracking to tasks with visual indicators in Gantt charts showing when a task exceeds its original timeline.

## Problem Statement
Currently, tasks have:
- `estimatedTimeUnits` (original TUs required)
- `startDate` and `dueDate` (original timeline)
- `tusExpended` (TUs already spent)
- `progress` (0-100%)

**What's Missing:**
1. No tracking of **original vs actual** timeline
2. No visual indicator of **delay/overrun** in Gantt charts
3. No way to show **expanded timeline** beyond original end date

---

## Data Model Changes

### 1. Extend WorkPlan interface (`src/lib/state/work-plan-store.ts`)

Add new fields to track original vs current timeline:

```typescript
// Add to WorkPlan interface:
originalDueDate?: string;           // Original planned end date (frozen once task starts)
originalEstimatedTimeUnits?: number; // Original TU estimate (frozen once task starts)
timelineExtensions?: TimelineExtension[]; // History of timeline extensions

// New interface:
interface TimelineExtension {
  extendedAt: string;              // When the extension was made
  previousDueDate: string;         // What the due date was before
  newDueDate: string;              // What it was extended to
  additionalTUs: number;           // How many TUs were added
  reason?: string;                 // Optional reason for extension
}
```

### 2. Create helper functions to detect delays

```typescript
// Calculate if task is delayed
function isTaskDelayed(task: WorkPlan): boolean
function getDelayDays(task: WorkPlan): number
function getTimelineOverrun(task: WorkPlan): { isDelayed: boolean; delayDays: number; originalEnd: Date; currentEnd: Date }
```

---

## UI Changes

### 1. MiniGanttChart (`src/components/MiniGanttChart.tsx`)

**Add visual indicators for:**

a) **Original timeline segment** (faded/dashed bar)
   - Shows the original planned timeline
   - Positioned at original start → original end

b) **Extension segment** (different color, e.g., amber/red)
   - Shows the additional time beyond original
   - Positioned from original end → current end
   - Color coding:
     - Amber: 1-25% over original time
     - Orange: 26-50% over original time
     - Red: 50%+ over original time

c) **Visual indicator icon**
   - Warning triangle for delayed tasks
   - Show delay badge (e.g., "+3 days" or "+2 TUs")

### 2. Task detail views

Show in task cards/modals:
- "Original: 8 TUs, Now: 10 TUs (+25%)"
- "Original due: Jan 20, Now: Jan 25 (+5 days)"
- Timeline extension history

---

## Implementation Steps

### Step 1: Update WorkPlan type (work-plan-store.ts)
- Add `originalDueDate`, `originalEstimatedTimeUnits`, `timelineExtensions` fields
- Create helper functions for delay detection
- Update `updateWorkPlan` to capture extensions when due date changes

### Step 2: Create delay calculation utilities
- New file: `src/lib/task-delay-tracker.ts`
- Functions to calculate delays and format for display

### Step 3: Update MiniGanttChart for delay visualization
- Add visual distinction between original and extended timeline
- Add delay indicators (icons, badges)
- Color-code based on severity

### Step 4: Update CompactTaskCard
- Show delay status when relevant
- Display original vs current timeline info

### Step 5: Update task detail modal
- Show full timeline extension history
- Allow manual extension with reason

---

## Visual Design

### Gantt Bar with Delay

```
Original (solid):      ████████████
Extension (striped):                ░░░░░
                       ↑           ↑    ↑
                    Start     Original Current
                               End      End

Color scheme:
- Original bar: Status color (blue for in-progress)
- Extension bar: Amber → Orange → Red based on % over
- Warning icon: ⚠ appears on extended bars
```

### Task Card Badge

```
[PCB Design]  ⚠ +3 days
8→10 TUs | Due: Jan 25
████████░░ 65%
```

---

## Files to Modify

1. `src/lib/state/work-plan-store.ts` - Data model
2. `src/lib/task-delay-tracker.ts` (NEW) - Delay calculation utilities
3. `src/components/MiniGanttChart.tsx` - Visual delay indicators
4. `src/components/CompactTaskCard.tsx` - Delay badge
5. `src/components/UnifiedTaskAllocationModal.tsx` - Extension controls

---

## Acceptance Criteria

1. ✅ Tasks track original timeline when first started
2. ✅ Gantt chart shows visual difference between original and extended timeline
3. ✅ Color coding indicates severity of delay
4. ✅ Task cards show delay badges
5. ✅ Extension history is preserved
6. ✅ Works with existing TU allocation system
