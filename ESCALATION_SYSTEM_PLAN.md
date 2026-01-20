# Task Escalation System - Implementation Plan

## Current State Analysis

### What Exists Today:
1. **Task Assignment System** (`task-assignment-store.ts`)
   - Pending/accepted/rejected/auto-accepted statuses
   - Accept/reject workflow with reasons
   - Capacity-aware assignment (shows impact before accepting)
   - Modal UI for reviewing pending assignments
   - Badge indicator on Home tab

2. **Notification System**
   - In-app notifications (`notification-store.ts`)
   - Push notifications (`notifications.ts`)
   - Types: approval, deadline, capacity, budget, assignment, message, achievement
   - Preference controls for each type
   - Action routes to navigate to relevant screens

3. **Current "Escalation" Feature**
   - Just updates task description with escalation text
   - No workflow, no notifications, no routing to leadership
   - No tracking of escalated state
   - No resolution mechanism

### Architecture Patterns Identified:
- **Request/Response Pattern**: TaskAssignment uses pending → accepted/rejected flow
- **Notification Pattern**: Notifications have actionLabel + actionRoute for navigation
- **Role-Based Access**: Founders, FractionalExec, Apprentice roles exist
- **Capacity-Aware**: System already calculates utilization and availability
- **Modal-Based Workflows**: PendingAssignmentsModal shows inbox of items needing action

---

## Proposed Escalation System Design

### Core Concept
Escalation should work like the existing task assignment system but specifically for leadership review. When someone escalates a task:

1. Create an **EscalationRequest** (similar to TaskAssignment)
2. Notify all Founders (leadership)
3. Founders see escalated tasks in a dedicated inbox
4. Founders can: Accept (take ownership), Delegate (assign to someone), or Reject (send back with guidance)
5. Requester gets notified of the outcome
6. Task gets updated based on the resolution

---

## Detailed Implementation Plan

### Phase 1: Escalation Request Store

**File**: `/src/lib/state/escalation-store.ts`

**Data Structure**:
```typescript
export type EscalationStatus = 'pending' | 'accepted' | 'delegated' | 'rejected' | 'resolved';
export type EscalationReason = 'resource_constraint' | 'timeline_issue' | 'scope_unclear' | 'blocked' | 'complexity' | 'other';

export interface EscalationRequest {
  id: string;
  workPlanId: string;
  workspaceId: string;

  // Who escalated and why
  escalatedBy: string;           // Member ID
  escalatedAt: string;           // ISO timestamp
  reason: EscalationReason;
  details: string;               // Explanation of the issue

  // Current state
  status: EscalationStatus;

  // Resolution (when leadership responds)
  respondedBy?: string;          // Founder who handled it
  respondedAt?: string;          // When resolved
  resolution?: {
    action: 'accepted' | 'delegated' | 'rejected';
    notes: string;               // Leadership's guidance/explanation
    delegatedTo?: string;        // If delegated, who gets it
    proposedChanges?: {          // If accepted, what changes
      newDueDate?: string;
      additionalTUs?: number;
      additionalMembers?: string[];
    };
  };

  // Metadata for display
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  currentAllocations: string[];  // Member IDs currently assigned
}
```

**Store Methods**:
- `createEscalation(request)` - Creates escalation, notifies all Founders
- `acceptEscalation(id, notes, changes)` - Founder takes ownership, applies changes
- `delegateEscalation(id, memberId, notes)` - Founder assigns to someone else
- `rejectEscalation(id, notes)` - Founder sends back with guidance
- `getPendingForLeadership()` - Returns all pending escalations
- `getEscalationsByTask(workPlanId)` - Get escalation history for a task
- `getEscalationsByMember(memberId)` - Get escalations created by someone

---

### Phase 2: Notification Integration

**Add to notification-store.ts**:

New notification type: `'escalation'`

New helper functions:
```typescript
escalationCreated: (workspaceId: string, taskTitle: string, escalatedBy: string, reason: string) => ({
  type: 'escalation' as NotificationType,
  workspaceId,
  title: '🚨 Task Escalated to Leadership',
  message: `${escalatedBy} escalated "${taskTitle}" - ${reason}`,
  actionLabel: 'Review Escalation',
  actionRoute: '/escalations',
})

escalationResolved: (workspaceId: string, taskTitle: string, action: string, notes: string) => ({
  type: 'escalation' as NotificationType,
  workspaceId,
  title: `Escalation ${action}`,
  message: `Leadership ${action} your escalation for "${taskTitle}": ${notes}`,
  actionLabel: 'View Task',
})
```

**Integration Points**:
- When escalation created → notify all Founders
- When escalation resolved → notify the person who escalated
- If delegated → notify the person it's delegated to

---

### Phase 3: UI Components

#### 3A. Enhanced Escalate Modal (TaskCardExpansion.tsx)

Replace the current simple modal with a form that collects:
- **Reason** (dropdown): Resource constraint, Timeline issue, Scope unclear, Blocked, Too complex, Other
- **Details** (text area): Detailed explanation
- **Urgency** (optional): How soon does leadership need to decide?

Show preview of:
- Current task state (allocations, due date, progress)
- Who will be notified (all Founders)

#### 3B. Escalations Inbox Modal

**File**: `/src/components/EscalationsInboxModal.tsx`

Similar to PendingAssignmentsModal but for Founders:
- Shows all pending escalations
- Grouped by urgency/age
- Each escalation shows:
  - Task title & description
  - Who escalated and when
  - Reason and details
  - Current allocations and capacity
  - Three action buttons: Accept, Delegate, Reject

**Accept Flow**:
- Modal to propose changes:
  - New due date (date picker)
  - Additional TUs needed (number input)
  - Add more people (member selector with capacity preview)
  - Notes for requester
- Apply changes to task automatically
- Notify requester

**Delegate Flow**:
- Select team member (shows their capacity)
- Add delegation notes
- Creates task assignment for selected person
- Notify both the new assignee and original requester

**Reject Flow**:
- Text area for guidance/feedback
- Mark escalation as rejected
- Task stays with original assignee
- Notify requester with feedback

#### 3C. Escalations Badge (Home Tab)

**File**: `/src/components/EscalationsBadge.tsx`

Similar to PendingAssignmentsBadge:
- Shows count of pending escalations (Founders only)
- Tapping opens EscalationsInboxModal
- Red badge for urgent items

Position: Next to PendingAssignmentsBadge in Home header

#### 3D. Escalation History (Task Card Full View)

In TaskCardExpansion.tsx Full view, add section showing:
- Escalation history for this task
- Timeline of escalations (created date, resolved date, outcome)
- Helps avoid repeated escalations

---

### Phase 4: Task Metadata Enhancement

**Update WorkPlan interface** (`work-plan-store.ts`):

Add fields:
```typescript
// Escalation tracking
isEscalated?: boolean;              // Quick flag for filtering
currentEscalationId?: string;       // If currently escalated
escalationHistory?: string[];       // Array of escalation IDs
```

**Benefits**:
- Can filter tasks by escalation status
- Can show escalated badge on task cards
- Track repeat escalations (pattern detection)

---

### Phase 5: Visual Indicators

#### Task Cards
- **Escalated badge**: 🚨 indicator on task cards in escalated state
- **Color coding**: Amber border when escalated
- **History badge**: "Previously escalated 2x" if task has history

#### Home Tab
- **Escalations section** (Founders only): Quick summary of pending escalations
- Shows count, most urgent item, quick action button

#### Tasks Tab
- **Filter option**: "Show escalated only" toggle
- Helps Founders quickly see all escalated tasks

---

### Phase 6: Integration with Work Plan Store

**Updates needed in work-plan-store.ts**:

When escalation is accepted with changes:
```typescript
// Apply leadership's proposed changes
updateWorkPlan(taskId, {
  dueDate: resolution.proposedChanges.newDueDate,
  estimatedTimeUnits: currentTUs + resolution.proposedChanges.additionalTUs,
  allocations: [...existingAllocations, ...newAllocations],
  isEscalated: false,
  escalationHistory: [...history, escalationId],
});
```

When escalation is delegated:
```typescript
// Remove from current assignee, create assignment for new person
createAssignment({
  workPlanId: task.id,
  assignedTo: delegatedMemberId,
  assignedBy: founderId,
  proposedAllocation: { squaresPerWeek: X, estimatedWeeks: Y },
  // ... metadata
});
```

---

## User Flows

### Flow 1: Team Member Escalates Task

1. User viewing task in Full view (TaskCardExpansion)
2. Taps "Escalate to Leadership" button
3. Modal opens with form:
   - Select reason (dropdown)
   - Enter details (text area)
   - Preview who will be notified
4. Taps "Escalate Task"
5. System:
   - Creates EscalationRequest
   - Marks task with `isEscalated: true`
   - Sends notifications to all Founders
   - Shows success message to user
6. User sees amber "Escalated" badge on task card

### Flow 2: Founder Reviews Escalation

1. Founder sees red badge (3) on Home tab
2. Taps badge → EscalationsInboxModal opens
3. Sees list of 3 pending escalations, sorted by urgency
4. Taps first escalation to expand details:
   - Sees who escalated, when, why
   - Sees current task state
   - Sees three options: Accept, Delegate, Reject

**Option A: Accept**
5A. Taps "Accept & Resolve"
6A. Modal opens to propose changes:
    - Extend due date by 2 weeks
    - Add 10 more TUs
    - Add another team member
7A. Enters notes: "Added Sarah to help. Extended timeline to accommodate scope."
8A. Taps "Apply Changes"
9A. System:
    - Updates task with new date, TUs, allocations
    - Marks escalation as resolved
    - Notifies original requester
    - If adding team member, creates assignment

**Option B: Delegate**
5B. Taps "Delegate"
6B. Member selector opens (shows capacity for each)
7B. Selects experienced exec
8B. Enters notes: "Alex has dealt with this before. He'll guide you."
9B. Taps "Delegate"
10B. System:
    - Creates assignment for Alex
    - Notifies Alex
    - Notifies original requester
    - Marks escalation as delegated

**Option C: Reject**
5C. Taps "Send Back with Guidance"
6C. Text area opens
7C. Enters guidance: "The timeline is realistic. Focus on MVP scope first, then iterate. Check the spec doc again."
8C. Taps "Send Feedback"
9C. System:
    - Marks escalation as rejected
    - Task stays with original team
    - Notifies requester with feedback
    - Removes escalated badge

### Flow 3: Team Member Gets Response

1. User receives notification: "Leadership accepted your escalation..."
2. Taps notification → navigates to task
3. Sees updated task with:
   - New due date
   - New team member added
   - Note from leadership
4. Can continue working with new parameters

---

## Implementation Checklist

### Store & Data (Backend)
- [ ] Create `escalation-store.ts` with full CRUD operations
- [ ] Add escalation fields to WorkPlan type
- [ ] Update work-plan-store to handle escalation state changes
- [ ] Add escalation notification helpers to notification-store

### UI Components
- [ ] Enhance escalate modal in TaskCardExpansion.tsx (reason + details form)
- [ ] Create EscalationsInboxModal.tsx (for Founders)
- [ ] Create EscalationsBadge.tsx (Home tab indicator)
- [ ] Add escalation history section to TaskCardExpansion full view
- [ ] Add escalated badge to TaskCardCompact
- [ ] Add escalations filter to Tasks tab

### Integration
- [ ] Connect escalate button to new store (create escalation)
- [ ] Add EscalationsBadge to Home tab header (Founders only)
- [ ] Wire up notification taps to open EscalationsInboxModal
- [ ] Test accept flow (apply changes to task)
- [ ] Test delegate flow (create assignment)
- [ ] Test reject flow (notify with feedback)

### Visual Polish
- [ ] Amber border for escalated tasks
- [ ] 🚨 emoji badge on escalated task cards
- [ ] Color-coded urgency in inbox
- [ ] Count badge on Home tab
- [ ] Success/error messages for all actions

### Edge Cases
- [ ] Handle multiple escalations for same task
- [ ] Prevent duplicate escalations (can't escalate already-escalated task)
- [ ] Show "Previously escalated" indicator if resolved and re-escalated
- [ ] What if Founder who responds is assigned to the task?
- [ ] What if task is completed before escalation resolved?
- [ ] Cleanup rejected/resolved escalations after 30 days

---

## Open Questions for User

1. **Who counts as "Leadership"?**
   - Just Founders? Or also Fractional Execs?
   - Current assumption: Only `role === 'Founder'`

2. **Escalation Expiry?**
   - Should escalations auto-expire if not responded to in X days?
   - Should we send reminder notifications?

3. **Multiple Escalations?**
   - Can the same task be escalated multiple times?
   - If so, do we show all history or just most recent?

4. **Auto-Actions?**
   - Should accepting an escalation automatically update the task?
   - Or require manual edits after acceptance?
   - Current plan: Auto-apply proposed changes

5. **Analytics?**
   - Track escalation metrics (time to resolve, common reasons)?
   - Show on Performance dashboard?

---

## Success Metrics

After implementation, we should be able to:

1. ✅ Team member escalates a blocked task → All Founders notified instantly
2. ✅ Founder sees inbox with all pending escalations
3. ✅ Founder accepts escalation → Task updated with new parameters automatically
4. ✅ Founder delegates → Assignment created for appropriate person
5. ✅ Founder rejects → Original assignee gets feedback
6. ✅ Escalated tasks clearly visible in tasks list
7. ✅ Full audit trail of escalations per task
8. ✅ No orphaned escalations (all get resolved or expire)

---

## Dependencies & Risks

**Dependencies**:
- Notification system must work reliably
- Task assignment system must be stable (we're building on that pattern)
- Member role data must be accurate (to identify Founders)

**Risks**:
- Too many escalations → inbox overwhelmed
  - Mitigation: Add reason categories, make it slightly harder to escalate
- Founders ignore escalations → tasks stuck
  - Mitigation: Reminder notifications, auto-escalate to other Founders
- Duplicate notifications if multiple Founders respond
  - Mitigation: Lock escalation when first Founder starts responding

**Technical Risks**:
- State synchronization (escalation marked resolved but task not updated)
  - Mitigation: Optimistic updates with rollback
- Notification delivery failures
  - Mitigation: Persist notifications in store, poll on app open

---

## Timeline Estimate

**Phase 1 (Store)**: 2-3 hours
- Create escalation-store.ts
- Add types to work-plan-store

**Phase 2 (Notifications)**: 1 hour
- Add notification helpers
- Wire up notification triggers

**Phase 3 (UI Components)**: 4-5 hours
- Enhanced escalate modal
- EscalationsInboxModal
- Badge components
- History display

**Phase 4 (Integration)**: 2-3 hours
- Connect all the pieces
- Handle state updates
- Test flows

**Phase 5 (Polish & Testing)**: 2 hours
- Visual indicators
- Edge case handling
- End-to-end testing

**Total**: ~12-15 hours of development

---

## Alternative Approaches Considered

### Approach A: Simple Status Flag (Rejected)
- Just add `escalated: boolean` to task
- No workflow, no tracking, no resolution
- **Why rejected**: Doesn't solve the core problem of routing to leadership

### Approach B: Email-Based (Rejected)
- Send email to Founders when escalated
- Handle via email thread
- **Why rejected**: Keeps workflow outside the app, loses audit trail

### Approach C: Chat/Comments (Considered)
- Add comments system to tasks
- "@mention" Founders to escalate
- **Why rejected**: More general than needed, harder to track resolution state

### Approach D: Automatic Escalation (Rejected)
- Auto-escalate when task is overdue by X days
- **Why rejected**: Removes human judgment, could spam Founders

**Selected Approach**: Request/Response pattern (matches existing task assignment system)
- Pros: Consistent with app patterns, full workflow, trackable, actionable
- Cons: More code than simple flag, requires inbox UI
