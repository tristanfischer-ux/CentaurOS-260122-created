# People Tab: Progressive Inline Disclosure Design

## Design Philosophy
Apply the same progressive inline disclosure pattern used in the Tasks tab:
- **Compact → Medium → Full** (all inline, additive)
- Each tier adds information without replacing previous content
- No modals for primary navigation
- Useful for managing people, not just displaying info

---

## Current State Analysis

### PersonCard Component (Current Implementation)
**Collapsed State:**
- Avatar with initials
- Name + Function/Role
- Days per week
- Capacity badge (X/Y TU)
- Task count
- Quick status pills (in-progress, blocked, not-started counts)
- "X TU free" indicator

**Expanded State:**
- Everything from collapsed +
- Capacity bar (visual progress)
- "Due This Week" alert box with task list
- Current tasks (up to 5) with status, progress, due date, TU allocation
- Quick action buttons (View Tasks, Schedule)
- "Tap again for full details" hint

**Modal State (PersonDetailsModal):**
- Full bio
- AI Tools equipped (name, purpose, cost)
- Squads (with management actions)
- Contact info (email, phone, LinkedIn)
- Company details (start date, day rate, reports to, manages)
- Performance modifiers (leadership, collaboration, AI proficiency)
- Current tasks (scrollable, with inline actions: complete, postpone, unassign, reassign, delete)
- Personal timeline (Mini Gantt chart)
- Swipe navigation between team members

---

## Proposed Three-Tier System

### **TIER 1: COMPACT** (Default view - for scanning)
**Purpose:** Quick scan of who's on the team and their availability

**Information to show:**
- Avatar with role color + initials
- Name
- Role badge (Founder/Fractional Exec/Apprentice)
- Function (e.g., Engineering, Marketing)
- **Key metric:** Capacity status
  - Visual indicator: Color-coded dot (green/yellow/red)
  - Text: "X TU available" or "At capacity" or "Over by X TU"
- Task count badge (e.g., "3 tasks")

**Visual design:**
- Single row card, ~60-70px height
- Horizontal layout: Avatar | Name/Role | Capacity indicator | Task count
- Color-coded capacity dot (green = available, yellow = near capacity, red = over)
- Subtle hover/tap affordance

**When to use:**
- Scanning team roster
- Quick availability check
- Finding who has capacity

---

### **TIER 2: MEDIUM** (First tap - for workload management)
**Purpose:** Understand what this person is working on and their workload breakdown

**Adds to Compact:**
- **Capacity breakdown visualization:**
  - Visual capacity bar showing utilization %
  - Breakdown by task type: "3 in-progress, 1 blocked, 2 not-started"
  - Available capacity highlighted: "2 TU available this week"

- **Current focus (top 3 tasks):**
  - Task name (truncated)
  - Status icon (in-progress/blocked/not-started)
  - Progress % or due date (whichever is more urgent)
  - TU allocation per task

- **Alert badges (if applicable):**
  - "2 tasks due this week" (amber badge)
  - "1 blocked task" (red badge)
  - "Available for new work" (green badge)

- **Quick stats row:**
  - Days/week: "3d/wk"
  - Utilization: "85%"
  - This week's commitment: "6 TU"

**Visual design:**
- Expands inline to ~200-250px height
- Maintains compact header at top
- Capacity bar prominent (full width, color-coded)
- Task list compact (icon + name + metric)
- Stats row at bottom

**When to use:**
- Assigning new tasks
- Checking workload balance
- Identifying bottlenecks

---

### **TIER 3: FULL** (Second tap - for complete profile & management)
**Purpose:** Full person profile with all details and management actions

**Adds to Medium:**

**Work Details:**
- **All current tasks** (scrollable list, max height 280px)
  - Full task cards with inline actions:
    - Mark complete
    - Postpone (+1 week)
    - Unassign from this person
    - Reassign to someone else
    - Delete task
  - Shows all task metadata (title, function, progress, due date, TU/week)

- **Personal timeline** (Mini Gantt chart)
  - Visual timeline of all their tasks
  - Shows overlaps and scheduling

**Professional Info:**
- **Bio** (if exists)
- **Company details:**
  - Start date
  - Day rate (£X/day)
  - Days per week
  - Reports to: [Name]
  - Manages: [Name, Name]

- **Performance multipliers** (if exists):
  - Team Leadership: 1.2x (+20%)
  - Collaboration: 1.1x (+10%)
  - AI Proficiency: 1.3x (+30%)
  - Visual cards with color-coded indicators

**Tools & Teams:**
- **AI Tools equipped:**
  - Tool name, purpose, cost/month
  - Total AI spend for this person

- **Squads:**
  - Squad name, function, role (leader/member)
  - Other squad members (first 3 + count)
  - Management actions (if applicable):
    - Create new squad (if Founder/Exec)
    - Join existing squad
    - Leave squad
    - Delete squad (if leader)

**Contact:**
- Email (tappable → opens mail)
- Phone (tappable → opens dialer)
- LinkedIn (tappable → opens browser)

**Navigation:**
- Swipe left/right to navigate between team members
- Member counter (e.g., "2/5")
- Chevron arrows for explicit navigation

**Visual design:**
- Full card expansion ~600-700px height
- Scrollable content within card
- Maintains compact + medium sections at top (collapsed/summarized)
- Organized sections with clear headers
- Action buttons contextual to each section

**When to use:**
- Deep dive into person's work
- Managing their task assignments
- Reviewing performance data
- Contacting team member
- Squad management

---

## Key Differences from Modal Approach

### Old (Modal):
- Tap collapsed → expanded inline
- Tap expanded → MODAL opens
- Modal is separate context, loses spatial relationship
- No inline actions on tasks in expanded view
- Can't quickly compare people side-by-side

### New (Progressive Inline):
- Tap compact → medium inline
- Tap medium → full inline
- Everything stays in context
- Can expand multiple people to compare
- Full task management inline
- Swipe navigation available at full tier only

---

## Information Architecture Summary

| Tier | Height | Primary Use Case | Key Info |
|------|--------|-----------------|----------|
| Compact | ~60px | Scanning, availability check | Name, role, capacity dot, task count |
| Medium | ~220px | Workload management, task assignment | Capacity bar, top 3 tasks, alerts, utilization % |
| Full | ~650px | Complete profile, deep management | All tasks (with actions), timeline, bio, contact, squads, AI tools, performance |

---

## Implementation Notes

### State Management:
```typescript
type PersonViewState = 'compact' | 'medium' | 'full';
```

### Interaction Pattern:
- First tap: compact → medium
- Second tap: medium → full
- Third tap: full → compact (collapse)
- OR: Tap outside to collapse any expanded card

### Responsive Considerations:
- Compact: Always fits in viewport
- Medium: May require slight scroll
- Full: Definitely scrollable, but card itself has max height with internal scroll

### Performance:
- Render all cards in compact by default
- Lazy render medium/full content only when expanded
- Only show full task list (with actions) in full tier

---

## Design Principles Applied

✅ **Additive, not replacive:** Each tier includes previous content
✅ **Progressive disclosure:** Show more detail as user needs it
✅ **Contextual actions:** Actions appear where they're needed
✅ **Spatial consistency:** Everything stays inline, no modals
✅ **Glanceability:** Compact tier optimized for scanning
✅ **Management-focused:** Medium/full tiers enable actual work
✅ **Mobile-optimized:** Touch-friendly, clear tap targets

---

## Expected User Flows

### Flow 1: Quick availability check
1. View compact list
2. Scan capacity dots (green/yellow/red)
3. See "2 TU available" on Sarah
4. Done.

### Flow 2: Assign new task to someone
1. View compact list
2. Tap on Alex (compact → medium)
3. See capacity bar: 75% utilized, 3 TU available
4. See current tasks: working on onboarding, API integration, docs
5. Decide: Alex has capacity, assign new task
6. Navigate to Tasks tab to create assignment

### Flow 3: Manage blocked task
1. View compact list
2. See "1 blocked" badge on Jamie's card
3. Tap once (compact → medium)
4. See blocked task in top 3 tasks list
5. Tap again (medium → full)
6. Scroll to full task list
7. Tap on blocked task to expand actions
8. Choose action: unassign, reassign, or delete
9. Done.

### Flow 4: Review performance & contact
1. Tap member card twice to get to full view
2. Scroll to performance modifiers section
3. Review AI proficiency: 1.4x
4. Scroll to contact section
5. Tap email to send message
6. Done.

### Flow 5: Squad management
1. Tap member card twice to get to full view
2. Scroll to Squads section
3. See they're not in any squads
4. Tap "Join Squad" or "Create Squad"
5. Follow squad creation/join flow
6. Done.

---

## Success Metrics

This design succeeds if:
1. ✅ Users can quickly scan availability without expanding cards
2. ✅ Users can understand workload without opening modals
3. ✅ Users can manage tasks inline without context switching
4. ✅ All person management actions are discoverable within card
5. ✅ Navigation feels natural and predictable
6. ✅ Performance stays smooth even with many team members

---

## Next Steps: Implementation

1. **Create new PersonCard component** with three-tier system
2. **Update people.tsx** to use new component
3. **Test interaction patterns** (tap compact → medium → full)
4. **Ensure alignment** with other sections on page
5. **Add haptic feedback** on state transitions
6. **Optimize rendering** for large teams (virtualization if needed)
