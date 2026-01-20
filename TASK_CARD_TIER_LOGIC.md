# Task Card Tier Logic & Information Architecture

## Current Problem
The Medium and Full views currently show almost identical information. The Full view doesn't justify opening a full modal - it needs to provide strategic value beyond quick edits.

## Proposed Information Hierarchy

### Tier 1: Compact (Glanceable)
**Purpose**: Scan & triage tasks at a glance
**User Action**: Scroll through task list, identify what needs attention
**Information Shown**:
- Task title (truncated)
- Status indicator (dot)
- Team avatars (who's on it)
- Effort timeline: "16 TU @ 8/wk = ~2w"
- Progress bar
- Due date
- Priority border (critical/high/important)

**Why this tier?**
User needs to quickly scan 10-50 tasks to understand what's happening across the organization.

---

### Tier 2: Medium (Quick Actions)
**Purpose**: Make tactical updates without leaving the task list
**User Action**: Need to update status, progress, reschedule, or add notes
**Information Added to Compact**:
- AI priority reasoning (why it's flagged)
- Quick status buttons (Queue/Active/Blocked/Done)
- Progress presets (25%, 50%, 75%, 100%)
- Reschedule buttons (+1d, +3d, +1w)
- Editable description/notes field

**Why this tier?**
User is doing daily standup updates, quick triage, or adding context. They don't need to see team details or resource allocation - just quick status updates.

**Current Issue**: This tier is good. It's compact and functional.

---

### Tier 3: Full (Resource Planning & Strategic Decisions)
**Purpose**: Answer "Should we add more people to this?" and "Why is this taking so long?"
**User Action**: Need to understand team dynamics, coordination costs, and make resourcing decisions

**CURRENT PROBLEM**: Full view shows:
- Same effort timeline as Compact/Medium ❌ (redundant)
- Same progress as Medium ❌ (redundant)
- Same status updates as Medium ❌ (redundant)
- Team list (good, but not actionable)
- Coordination cost (good, but buried)

**WHAT FULL VIEW SHOULD SHOW**:

1. **Resource Allocation Deep Dive**
   - Each team member with their allocation % and availability
   - Capacity warnings: "Sarah is at 110% capacity across all tasks"
   - Allocation timeline: "John is allocated 8 TU/wk for 3 weeks, then 2 TU/wk after"
   - **Actionable**: "Add Resource" button to increase allocation or add team members

2. **Why Is This Slow? Analysis**
   - Coordination cost breakdown (already have this)
   - Velocity history: "Started at 10 TU/wk, now 6 TU/wk - why?"
   - Blockers history: "Blocked 3 times in past 2 weeks"
   - Dependencies: "Waiting on 2 other tasks"

3. **What-If Scenarios**
   - "If we add 1 person: ~1.5w instead of 2w" (calculate impact)
   - "If we remove coordination overhead: ~1.2w instead of 2w"
   - **Actionable**: Buttons to adjust allocations and see impact

4. **Team Context (Per Person)**
   - Member capacity across ALL tasks (not just this one)
   - Member's other commitments: "Sarah is on 4 other tasks"
   - Member's role fit: "Frontend task assigned to backend dev" (flag mismatches)
   - **Actionable**: Reassign or adjust individual allocations

5. **Strategic Actions** (Bottom of modal)
   - "Add Resource" → Opens allocation modal
   - "Request More Time" → Adjust due date with reasoning
   - "Split Task" → Break into smaller chunks
   - "Escalate" → Flag for leadership review
   - "Archive/Abandon" → Remove from active work

---

## Key Differences Summary

| Feature | Compact | Medium | Full |
|---------|---------|--------|------|
| **View** | Inline card | Dropdown expansion | Full modal |
| **Purpose** | Scan | Quick edit | Resource planning |
| **Info** | Basic metrics | Add quick actions | Deep team analysis |
| **Edits** | None | Status, progress, notes | + Allocations, resources |
| **Focus** | Task overview | Task updates | **People & capacity** |
| **Time** | <1 sec | 5-10 sec | 30-60 sec |

---

## User Journey Examples

### Example 1: Daily Standup
1. Open task list (Compact view) - scan all tasks
2. See task is at 50% progress - tap to expand (Medium view)
3. Update to 75% progress, add note "Waiting on API approval"
4. Collapse, move to next task
→ **Never needed Full view**

### Example 2: Task Is Falling Behind
1. Scan task list (Compact view) - notice task is overdue
2. Tap to expand (Medium view) - see AI flagged it as "critical, behind schedule"
3. Tap "Full Details" → **Full view opens**
4. See coordination cost is eating 40% of velocity (4-person team)
5. See Sarah is at 110% capacity and John only at 50%
6. **Decision**: Reallocate 2 TU/wk from Sarah to John
7. See "If we do this: completion moves from 3w to 2w"
8. **Action**: Tap "Update Allocations", save changes
→ **Full view was essential for this decision**

### Example 3: Quarterly Planning
1. Review all "In Progress" tasks (Compact view)
2. Tap task that's been in progress for 6 weeks (Full view)
3. See velocity chart: started 12 TU/wk, now 4 TU/wk
4. See team member turnover: 2 people left, 1 new person added
5. See coordination cost doubled from 2 TU/wk to 6 TU/wk
6. **Decision**: Split task into 2 smaller tasks, reduce team to 2 people each
7. **Action**: Tap "Split Task", create 2 new tasks with smaller teams
→ **Strategic decision enabled by Full view**

---

## Implementation Plan

**Medium View**: ✅ Already correct - keep as-is

**Full View**: ❌ Needs complete redesign focused on:
1. **Remove**: Redundant quick actions (status, progress presets)
2. **Enhance**: Team section with capacity, availability, conflicts
3. **Add**: Resource planning tools (add/remove people, reallocate TU)
4. **Add**: What-if scenarios (impact calculator)
5. **Add**: Velocity/blocker history timeline
6. **Add**: Strategic action buttons at bottom

**Goal**: Full view should answer "Why is this taking so long and what should I do about it?" NOT "What's the current status?" (that's Medium's job)
