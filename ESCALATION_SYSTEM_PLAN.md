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
  escalatedBy: string;           // Member ID (e.g., 'exec-5')
  escalatedByUserId?: string;    // Auth user ID (e.g., 'auth-user-456') - for notification routing
  escalatedByName: string;       // Display name (preserved even if member deleted)
  escalatedAt: string;           // ISO timestamp
  reason: EscalationReason;
  details: string;               // Explanation of the issue

  // Current state
  status: EscalationStatus;

  // Resolution (when leadership responds)
  respondedBy?: string;          // Founder member ID who handled it
  respondedByUserId?: string;    // Auth user ID of responder - for audit trail
  respondedByName?: string;      // Display name of responder
  respondedAt?: string;          // When resolved
  resolution?: {
    action: 'accepted' | 'delegated' | 'rejected';
    notes: string;               // Leadership's guidance/explanation
    delegatedTo?: string;        // If delegated, who gets it (member ID)
    delegatedToUserId?: string;  // Auth user ID of delegate - for notifications
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

**1. Update NotificationType**:
```typescript
export type NotificationType = 'approval' | 'deadline' | 'capacity' | 'budget' | 'assignment' | 'message' | 'achievement' | 'escalation';
```

**2. Add escalations preference**:
```typescript
preferences: {
  approvals: boolean;
  deadlines: boolean;
  capacity: boolean;
  budget: boolean;
  assignments: boolean;
  messages: boolean;
  achievements: boolean;
  escalations: boolean; // 🆕 ADD THIS
}
```

**3. Update preference checking logic**:
```typescript
// In addNotification method, add:
const typeKey = notification.type === 'approval' ? 'approvals' :
               notification.type === 'deadline' ? 'deadlines' :
               notification.type === 'capacity' ? 'capacity' :
               notification.type === 'budget' ? 'budget' :
               notification.type === 'assignment' ? 'assignments' :
               notification.type === 'message' ? 'messages' :
               notification.type === 'escalation' ? 'escalations' : // 🆕 ADD THIS
               'achievements';
```

**4. Add helper functions to notificationHelpers**:
```typescript
export const notificationHelpers = {
  // ... existing helpers ...

  escalationCreated: (
    workspaceId: string,
    taskTitle: string,
    escalatedByName: string,
    reason: string
  ) => ({
    type: 'escalation' as NotificationType,
    workspaceId,
    title: '🚨 Task Escalated to Leadership',
    message: `${escalatedByName} escalated "${taskTitle}" - ${reason}`,
    actionLabel: 'Review Escalation',
    actionRoute: '/escalations',
  }),

  escalationResolved: (
    workspaceId: string,
    taskTitle: string,
    action: string,
    respondedByName: string,
    notes: string
  ) => ({
    type: 'escalation' as NotificationType,
    workspaceId,
    title: `Escalation ${action}`,
    message: `${respondedByName} ${action} your escalation for "${taskTitle}": ${notes}`,
    actionLabel: 'View Task',
  }),
};
```

**Integration Points**:
- When escalation created → Find all Founders with `userId != null` → Notify each
- When escalation resolved → Find escalator by `escalatedByUserId` → Notify them
- If delegated → Find delegate by `delegatedToUserId` → Notify them
- Track `userId` alongside `memberId` for accurate notification routing

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
- **⚠️ CRITICAL**: `OrganizationMember.userId` must be populated for notification routing to work
  - Currently `ORGANIZATION_MEMBERS` is an empty array in organization-seed.ts
  - Need to populate userId for members who have auth accounts
  - OR implement email-based matching when user logs in
  - OR use demo mode where notifications just go to in-app inbox (no user-specific routing)

**Risks**:
- Too many escalations → inbox overwhelmed
  - Mitigation: Add reason categories, make it slightly harder to escalate
- Founders ignore escalations → tasks stuck
  - Mitigation: Reminder notifications, auto-escalate to other Founders
- Duplicate notifications if multiple Founders respond
  - Mitigation: Lock escalation when first Founder starts responding
- **⚠️ userId not populated → notifications won't route to specific users**
  - Mitigation: Add setup phase to populate userId OR fall back to workspace-level notifications

**Technical Risks**:
- State synchronization (escalation marked resolved but task not updated)
  - Mitigation: Optimistic updates with rollback
- Notification delivery failures
  - Mitigation: Persist notifications in store, poll on app open
- userId is null for most members → can't send notifications
  - Mitigation: Filter to only members with userId, OR match by email on login

---

## Timeline Estimate

**Phase 1 (Store & Data)**: 3-4 hours
- Create escalation-store.ts with full CRUD
- Add escalation fields to WorkPlan type
- Update work-plan-store to handle escalation state changes
- **CRITICAL**: Decide userId population strategy (real multi-user vs demo mode)
- Create user↔member mapping helpers

**Phase 2 (Notifications)**: 2 hours
- Update notification-store.ts to add 'escalation' type
- Add escalations preference field
- Update preference checking logic in addNotification
- Add escalation helpers to notificationHelpers object
- Wire up notification triggers in escalation-store methods

**Phase 3 (UI Components)**: 4-5 hours
- Enhanced escalate modal with reason selection
- EscalationsInboxModal for Founders
- Badge components for Home tab
- History display in task full view
- Escalated indicator on task cards

**Phase 4 (Integration)**: 2-3 hours
- Connect escalation store to UI components
- Handle state updates in work-plan-store
- Test notification routing (userId → member)
- Verify founders-only access
- Test flows end-to-end

**Phase 5 (Polish & Testing)**: 2 hours
- Visual indicators (badges, colors)
- Edge case handling (null userId, etc.)
- End-to-end testing of all flows
- Handle concurrent escalations

**Total**: ~13-16 hours of development

---

## User Identification & Message Routing

### Multi-User Architecture

This app is designed as a **collaborative multi-user system** where multiple people can be logged in simultaneously to the same workspace:

#### 1. Authentication vs Organization Members

**Two-Layer Identity System**:

```typescript
// Layer 1: Supabase Auth User (actual login account)
interface User {
  id: string;              // Supabase auth user ID
  email: string;
  name: string;
  // ... other auth fields
}

// Layer 2: Organization Member (role within a workspace)
interface OrganizationMember {
  id: string;              // Member ID (e.g., "founder-1", "exec-5")
  workspaceId: string;     // Which company/workspace they belong to
  userId?: string;         // 🔑 LINK to auth user ID
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  email: string;
  // ... role-specific fields
}
```

**Key Relationship**:
- A **User** is someone with a login account (can access the app)
- An **OrganizationMember** is a role within a workspace (may or may not have login access)
- The `userId` field in `OrganizationMember` links the two

**Example Scenario**:
```typescript
// Alice logs in
const aliceUser = {
  id: 'auth-user-123',
  email: 'alice@company.com',
  name: 'Alice Johnson'
};

// Alice is a Founder in Demo Company workspace
const aliceMember = {
  id: 'founder-1',
  workspaceId: 'workspace-demo-company',
  userId: 'auth-user-123',  // 👈 Links to her auth account
  name: 'Alice Johnson',
  role: 'Founder',
  email: 'alice@company.com'
};

// Bob is a fractional exec (also has login)
const bobUser = {
  id: 'auth-user-456',
  email: 'bob@fractional.com',
  name: 'Bob Smith'
};

const bobMember = {
  id: 'exec-5',
  workspaceId: 'workspace-demo-company',
  userId: 'auth-user-456',  // 👈 Links to his auth account
  name: 'Bob Smith',
  role: 'FractionalExec'
};

// Charlie is an external consultant (no login access yet)
const charlieMember = {
  id: 'exec-12',
  workspaceId: 'workspace-demo-company',
  userId: undefined,  // 👈 No auth account yet (can be invited later)
  name: 'Charlie Wilson',
  role: 'FractionalExec'
};
```

#### 2. How Notifications Route to Real Users

**When an escalation is created**, the system needs to notify all Founders:

```typescript
// Step 1: Create escalation
const escalation = await createEscalation({
  workPlanId: 'task-123',
  workspaceId: currentWorkspace.id,
  escalatedBy: 'exec-5',  // Bob's member ID
  reason: 'resource_constraint',
  details: 'Need more developers for this sprint'
});

// Step 2: Find all Founders in this workspace
const founders = organizationMembers.filter(
  m => m.workspaceId === currentWorkspace.id && m.role === 'Founder'
);
// Result: [{ id: 'founder-1', userId: 'auth-user-123', name: 'Alice', ... }]

// Step 3: For each Founder, check if they have a login account
founders.forEach(founder => {
  if (founder.userId) {
    // This Founder has an auth account - send them a notification
    addNotification({
      type: 'escalation',
      workspaceId: currentWorkspace.id,
      title: '🚨 Task Escalated to Leadership',
      message: `${bobMember.name} escalated "Build payment flow" - resource constraint`,
      actionLabel: 'Review Escalation',
      actionRoute: '/escalations',
    });

    // CRITICAL: Notification is stored with workspaceId
    // When Alice logs in, she'll see notifications for her workspace
  } else {
    // This Founder doesn't have login yet - can't notify via app
    // In production, might send email or SMS instead
    console.log(`Cannot notify ${founder.name} - no user account`);
  }
});
```

#### 3. In-App vs Push Notifications

**Current Implementation** (from code analysis):

The app has **two notification systems**:

**A. In-App Notifications** (`notification-store.ts`):
- Stored in Zustand + MMKV persistent storage
- Filtered by `workspaceId` when displayed
- When user logs in and selects a workspace, they see notifications for that workspace
- **How it works**:
  ```typescript
  // When Alice logs in and opens "Demo Company" workspace
  const unreadNotifications = useNotificationStore(s =>
    s.getNotificationsByWorkspace('workspace-demo-company')
  );
  // Shows all escalation notifications for this workspace
  ```

**B. Push Notifications** (`notifications.ts`):
- Uses Expo's push notification system
- Requires device token registration
- Can send to user's phone even when app is closed
- **How it works**:
  ```typescript
  // When Alice installs app, device registers for push
  const deviceToken = await registerForPushNotifications();
  // Store this: { userId: 'auth-user-123', deviceToken: 'ExponentPushToken[xxx]' }

  // When escalation created, send push to Alice's device
  await sendPushNotification(deviceToken, {
    title: '🚨 Task Escalated',
    body: 'Bob escalated "Build payment flow"',
    data: { escalationId: escalation.id }
  });
  ```

**For Escalation System**:
- **In-app notifications**: Automatically work (filtered by workspace)
- **Push notifications**: Need to map member.userId → device tokens

#### 4. Message Routing Flow (Complete Example)

**Scenario**: Bob (exec) escalates a task to leadership

```typescript
// 1. Bob is logged in as auth-user-456
const currentUser = useAppStore(s => s.currentUser);
// { id: 'auth-user-456', name: 'Bob Smith', ... }

const currentWorkspace = useAppStore(s => s.currentWorkspace);
// { id: 'workspace-demo-company', name: 'Demo Company', ... }

// 2. Bob clicks "Escalate to Leadership" on a task
const currentMember = organizationMembers.find(
  m => m.workspaceId === currentWorkspace.id && m.userId === currentUser.id
);
// { id: 'exec-5', userId: 'auth-user-456', name: 'Bob Smith', role: 'FractionalExec' }

// 3. System creates escalation
const escalation = await createEscalation({
  workPlanId: task.id,
  workspaceId: currentWorkspace.id,
  escalatedBy: currentMember.id,  // 'exec-5'
  escalatedByUserId: currentUser.id,  // 'auth-user-456' (for audit trail)
  reason: 'resource_constraint',
  details: 'Need 2 more frontend devs',
  // ... metadata
});

// 4. Find all Founders with login access
const foundersWithAccess = organizationMembers.filter(
  m => m.workspaceId === currentWorkspace.id
    && m.role === 'Founder'
    && m.userId != null  // Only notify if they have login
);
// Result: [{ id: 'founder-1', userId: 'auth-user-123', name: 'Alice', ... }]

// 5. Notify each Founder
for (const founder of foundersWithAccess) {
  // A. In-app notification (stored in notification-store)
  addNotification({
    type: 'escalation',
    workspaceId: currentWorkspace.id,  // 🔑 Key for filtering
    title: '🚨 Task Escalated to Leadership',
    message: `${currentMember.name} escalated "${task.title}" - ${escalation.reason}`,
    actionLabel: 'Review Escalation',
    actionRoute: '/escalations',
    actionData: { escalationId: escalation.id },
  });

  // B. Push notification (if device token exists)
  const deviceToken = await getDeviceTokenForUser(founder.userId);
  if (deviceToken) {
    await sendPushNotification(deviceToken, {
      title: '🚨 Task Escalated',
      body: `${currentMember.name} escalated "${task.title}"`,
      data: { escalationId: escalation.id, route: '/escalations' }
    });
  }
}

// 6. Alice (on her phone) receives notification
// - If app is open: sees red badge on Home tab
// - If app is closed: gets push notification on lock screen
// - Taps notification → opens EscalationsInboxModal
// - Sees Bob's escalation with full details
// - Can Accept/Delegate/Reject
```

#### 5. Handling Resolution (Reverse Flow)

**Scenario**: Alice accepts the escalation and adds resources

```typescript
// 1. Alice taps "Accept & Resolve" in EscalationsInboxModal
await acceptEscalation(escalation.id, {
  notes: 'Adding 2 frontend devs from partner agency',
  proposedChanges: {
    newDueDate: '2026-02-15',
    additionalTUs: 40,
    additionalMembers: ['exec-8', 'exec-9']
  }
});

// 2. System updates escalation
escalation.status = 'accepted';
escalation.respondedBy = 'founder-1';  // Alice's member ID
escalation.respondedByUserId = 'auth-user-123';  // Alice's user ID

// 3. Apply changes to task automatically
updateWorkPlan(task.id, {
  dueDate: '2026-02-15',
  estimatedTimeUnits: task.estimatedTimeUnits + 40,
  allocations: [...task.allocations, newAllocation1, newAllocation2]
});

// 4. Notify Bob (the person who escalated)
const bobMember = organizationMembers.find(m => m.id === escalation.escalatedBy);
// { id: 'exec-5', userId: 'auth-user-456', ... }

if (bobMember.userId) {
  // A. In-app notification
  addNotification({
    type: 'escalation',
    workspaceId: currentWorkspace.id,
    title: 'Escalation Accepted',
    message: `Alice accepted your escalation for "${task.title}": ${notes}`,
    actionLabel: 'View Task',
    actionRoute: '/(tabs)/tasks',
    actionData: { taskId: task.id }
  });

  // B. Push notification
  const bobDeviceToken = await getDeviceTokenForUser(bobMember.userId);
  if (bobDeviceToken) {
    await sendPushNotification(bobDeviceToken, {
      title: '✅ Escalation Accepted',
      body: `Alice resolved your escalation for "${task.title}"`,
      data: { taskId: task.id, route: '/(tabs)/tasks' }
    });
  }
}

// 5. Bob (on his phone) gets notified
// - Sees notification: "Alice accepted your escalation..."
// - Taps it → navigates to the task
// - Sees updated due date, new team members, Alice's notes
// - Can continue working with new resources
```

#### 6. Edge Cases & Considerations

**What if a Founder doesn't have a login?**
- They won't receive in-app or push notifications
- Solution: Send email notification via Supabase Edge Functions
- Or: Show "Pending Invitation" status in UI, allow sending invite

**What if multiple Founders respond to the same escalation?**
- First one to respond "locks" the escalation
- Use optimistic locking: check `status === 'pending'` before updating
- If another Founder already responded, show error: "Already handled by Alice"

**What if the escalator deletes their account?**
- Keep `escalatedBy` member ID in the record
- Also store `escalatedByName` for display even if member is gone
- Escalation history preserved for audit trail

**What if someone changes workspaces?**
- Notifications filtered by `workspaceId`
- Alice switching from "Demo Company" to "Startup XYZ" sees different notifications
- Each workspace has its own escalation inbox

**What about anonymous/guest users?**
- Guests can't escalate or receive escalations
- Escalation feature only available to authenticated users with workspace membership
- UI can hide "Escalate" button for guest users

#### 7. Implementation Checklist for User Routing

**Phase 1: Data Model Updates**
- [ ] Add `escalatedByUserId?: string` to `EscalationRequest` (for audit trail)
- [ ] Add `respondedByUserId?: string` to `EscalationRequest` (for audit trail)
- [ ] **CRITICAL**: Populate `userId` field in OrganizationMember seed data for demo users
  - Currently `ORGANIZATION_MEMBERS` is empty array
  - Need to either:
    - Option A: Populate userId for founders/execs who should receive notifications (if using real auth)
    - Option B: Use email matching to link members to auth users on login
    - Option C: Demo mode - skip userId and just use member IDs (notifications won't route to real users)
  - **Decision needed**: Is this a real multi-user app or single-user demo?

**Phase 2: Notification Routing Logic**
- [ ] Create helper: `getFoundersWithAccess(workspaceId) => OrganizationMember[]` (filters by role + userId exists)
- [ ] Create helper: `getMemberByUserId(workspaceId, userId) => OrganizationMember | null`
- [ ] Create helper: `getUserIdByMemberId(memberId) => string | null`
- [ ] Update `createEscalation()` to notify only Founders with `userId` set
- [ ] Update `resolveEscalation()` to notify original escalator via their `userId`
- [ ] **Handle case where userId is null**: Show in-app message or log warning

**Phase 3: Device Token Management** (for push notifications - OPTIONAL)
- [ ] Create `device_tokens` table in Supabase (only if push notifications needed):
  ```sql
  create table device_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    device_token text not null,
    platform text, -- 'ios' or 'android'
    created_at timestamp default now(),
    updated_at timestamp default now()
  );
  ```
- [ ] Register device token on app launch
- [ ] Update token when user logs in/out
- [ ] Query tokens when sending push notifications
- **NOTE**: For demo/MVP, in-app notifications may be sufficient

**Phase 4: Fallback for Non-Login Members**
- [ ] Detect when Founder has no `userId` (can't receive in-app notification)
- [ ] Option A: Send email via Supabase Edge Function
- [ ] Option B: Show warning in UI: "Cannot notify [Name] - no account"
- [ ] Option C: Create invitation flow to invite them to app
- **For MVP**: Just log to console and skip notification

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
