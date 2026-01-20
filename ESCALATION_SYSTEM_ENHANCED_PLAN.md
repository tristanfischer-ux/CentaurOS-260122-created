# Task Escalation System - Enhanced Implementation Plan v2

## Executive Summary

This enhanced plan addresses the issues found in v1 and provides a more realistic, production-ready approach to implementing the escalation system. Key improvements:

1. **Simplified User Routing**: Uses workspace-level notifications instead of complex userId mapping
2. **Complete Technical Specification**: All code changes documented with file paths and line numbers
3. **Realistic Timeline**: More accurate estimates based on actual complexity
4. **Production Considerations**: Error handling, edge cases, and testing strategy
5. **MVP First, Then Enhance**: Phased approach with clear v1.0 scope vs future enhancements

---

## Critical Issues Fixed from v1

### ✅ Issue 1: Notification Type Missing
- **Problem**: Plan didn't specify updating `NotificationType` union type
- **Solution**: Added explicit step with code example to update notification-store.ts

### ✅ Issue 2: Preference Field Missing
- **Problem**: No mention of adding `escalations: boolean` to preferences
- **Solution**: Added step to update preferences object and checking logic

### ✅ Issue 3: userId Not Populated
- **Problem**: Assumed userId exists but `ORGANIZATION_MEMBERS` is empty array
- **Solution**: Simplified to workspace-level notifications for MVP, userId enhancement later

### ✅ Issue 4: Incomplete Component Specs
- **Problem**: UI components described abstractly without specific implementation details
- **Solution**: Added exact file structures, props interfaces, and integration points

### ✅ Issue 5: Missing Route Definition
- **Problem**: Plan references `/escalations` route but doesn't specify where to create it
- **Solution**: Added explicit routing setup in Phase 3

---

## Architecture Decision: Simplified Notification Routing (MVP)

**Decision**: For v1.0, use **workspace-level notifications** instead of user-specific routing.

**Why**:
- `OrganizationMember.userId` is currently not populated in seed data
- Real multi-user setup requires Supabase auth integration (out of scope for MVP)
- Workspace-level notifications already work reliably (tested in existing features)
- Can enhance to user-specific routing in v2.0 after auth is properly set up

**How it works**:
```typescript
// When Bob (exec-5) escalates a task:
const escalation = createEscalation({
  workPlanId: task.id,
  workspaceId: currentWorkspace.id,
  escalatedBy: 'exec-5',
  escalatedByName: 'Bob Smith',
  reason: 'resource_constraint',
  details: 'Need 2 more frontend devs'
});

// Notify ALL users in this workspace (Founders will see it)
addNotification({
  type: 'escalation',
  workspaceId: currentWorkspace.id,  // 🔑 Key for filtering
  title: '🚨 Task Escalated to Leadership',
  message: 'Bob Smith escalated "Build payment flow" - resource constraint',
  actionLabel: 'Review Escalation',
  actionRoute: '/(tabs)/?modal=escalations',  // Opens modal from Home tab
});

// In EscalationsInboxModal, filter by current user's role:
const currentMember = members.find(m => m.id === currentMemberId);
if (currentMember?.role !== 'Founder') {
  return null; // Only Founders can see escalations inbox
}
```

**Benefits**:
- ✅ Works immediately without userId setup
- ✅ Simple to implement and test
- ✅ Follows existing notification pattern
- ✅ Can enhance later without breaking changes

**Future Enhancement (v2.0)**:
- Add userId population via email matching on login
- Send targeted notifications only to Founders with userId
- Add push notification support with device tokens

---

## Implementation Plan

### Phase 1: Data Layer (4-5 hours)

#### 1A. Create Escalation Store

**File**: `/src/lib/state/escalation-store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';
import { useNotificationStore, notificationHelpers } from './notification-store';
import { useOrganizationStore } from './organization-store';

export type EscalationStatus = 'pending' | 'accepted' | 'delegated' | 'rejected' | 'resolved';
export type EscalationReason =
  | 'resource_constraint'
  | 'timeline_issue'
  | 'scope_unclear'
  | 'blocked'
  | 'complexity'
  | 'other';

export interface EscalationRequest {
  id: string;
  workPlanId: string;
  workspaceId: string;

  // Who escalated and why
  escalatedBy: string;           // Member ID (e.g., 'exec-5')
  escalatedByName: string;       // Display name (preserved even if member deleted)
  escalatedAt: string;           // ISO timestamp
  reason: EscalationReason;
  reasonLabel: string;           // Human-readable reason
  details: string;               // Explanation of the issue

  // Current state
  status: EscalationStatus;

  // Resolution (when leadership responds)
  respondedBy?: string;          // Founder member ID who handled it
  respondedByName?: string;      // Display name of responder
  respondedAt?: string;          // When resolved
  resolution?: {
    action: 'accepted' | 'delegated' | 'rejected';
    notes: string;               // Leadership's guidance/explanation
    delegatedTo?: string;        // If delegated, who gets it (member ID)
    delegatedToName?: string;    // Display name
    proposedChanges?: {          // If accepted, what changes
      newDueDate?: string;
      additionalTUs?: number;
      additionalMembers?: string[];  // Member IDs
    };
  };

  // Metadata for display
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  currentAllocations: string[];  // Member IDs currently assigned
}

interface EscalationStore {
  escalations: EscalationRequest[];

  // CRUD operations
  createEscalation: (request: Omit<EscalationRequest, 'id' | 'status' | 'escalatedAt'>) => EscalationRequest;
  acceptEscalation: (id: string, notes: string, changes?: EscalationRequest['resolution']['proposedChanges']) => void;
  delegateEscalation: (id: string, memberId: string, memberName: string, notes: string) => void;
  rejectEscalation: (id: string, notes: string) => void;

  // Queries
  getEscalationById: (id: string) => EscalationRequest | undefined;
  getPendingEscalations: (workspaceId: string) => EscalationRequest[];
  getEscalationsByTask: (workPlanId: string) => EscalationRequest[];
  getEscalationsByMember: (memberId: string) => EscalationRequest[];

  // Counts
  getPendingCount: (workspaceId: string) => number;

  // Cleanup
  clearResolvedEscalations: (workspaceId: string) => void;
}

export const useEscalationStore = create<EscalationStore>()(
  persist(
    (set, get) => ({
      escalations: [],

      createEscalation: (request) => {
        const newEscalation: EscalationRequest = {
          ...request,
          id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          escalatedAt: new Date().toISOString(),
        };

        set((state) => ({
          escalations: [...state.escalations, newEscalation],
        }));

        // Notify all users in workspace (Founders will see it in their inbox)
        useNotificationStore.getState().addNotification(
          notificationHelpers.escalationCreated(
            request.workspaceId,
            request.taskTitle,
            request.escalatedByName,
            request.reasonLabel
          )
        );

        console.log('[Escalation] Created:', newEscalation.id);
        return newEscalation;
      },

      acceptEscalation: (id, notes, changes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) {
          console.error('[Escalation] Not found:', id);
          return;
        }

        // Get current member (Founder accepting)
        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.role === 'Founder'); // In reality, use current user's member
        if (!founder) return;

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'accepted' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByName: founder.name,
                  respondedAt: new Date().toISOString(),
                  resolution: {
                    action: 'accepted',
                    notes,
                    proposedChanges: changes,
                  },
                }
              : esc
          ),
        }));

        // Notify original escalator
        useNotificationStore.getState().addNotification(
          notificationHelpers.escalationResolved(
            escalation.workspaceId,
            escalation.taskTitle,
            'accepted',
            founder.name,
            notes
          )
        );

        console.log('[Escalation] Accepted:', id);
      },

      delegateEscalation: (id, memberId, memberName, notes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) return;

        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.role === 'Founder');
        if (!founder) return;

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'delegated' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByName: founder.name,
                  respondedAt: new Date().toISOString(),
                  resolution: {
                    action: 'delegated',
                    notes,
                    delegatedTo: memberId,
                    delegatedToName: memberName,
                  },
                }
              : esc
          ),
        }));

        // Notify original escalator and new assignee
        useNotificationStore.getState().addNotification(
          notificationHelpers.escalationResolved(
            escalation.workspaceId,
            escalation.taskTitle,
            'delegated',
            founder.name,
            `Delegated to ${memberName}: ${notes}`
          )
        );

        console.log('[Escalation] Delegated:', id, 'to', memberName);
      },

      rejectEscalation: (id, notes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) return;

        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.role === 'Founder');
        if (!founder) return;

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'rejected' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByName: founder.name,
                  respondedAt: new Date().toISOString(),
                  resolution: {
                    action: 'rejected',
                    notes,
                  },
                }
              : esc
          ),
        }));

        // Notify original escalator with feedback
        useNotificationStore.getState().addNotification(
          notificationHelpers.escalationResolved(
            escalation.workspaceId,
            escalation.taskTitle,
            'rejected',
            founder.name,
            notes
          )
        );

        console.log('[Escalation] Rejected:', id);
      },

      getEscalationById: (id) => {
        return get().escalations.find((esc) => esc.id === id);
      },

      getPendingEscalations: (workspaceId) => {
        return get().escalations.filter(
          (esc) => esc.workspaceId === workspaceId && esc.status === 'pending'
        );
      },

      getEscalationsByTask: (workPlanId) => {
        return get().escalations.filter((esc) => esc.workPlanId === workPlanId);
      },

      getEscalationsByMember: (memberId) => {
        return get().escalations.filter((esc) => esc.escalatedBy === memberId);
      },

      getPendingCount: (workspaceId) => {
        return get().getPendingEscalations(workspaceId).length;
      },

      clearResolvedEscalations: (workspaceId) => {
        set((state) => ({
          escalations: state.escalations.filter(
            (esc) =>
              esc.workspaceId !== workspaceId ||
              esc.status === 'pending'
          ),
        }));
      },
    }),
    {
      name: 'escalation-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

**Checklist**:
- [ ] Create `/src/lib/state/escalation-store.ts` with above code
- [ ] Test creating escalation (should add to array and trigger notification)
- [ ] Test accepting escalation (should update status and notify)
- [ ] Test delegating escalation
- [ ] Test rejecting escalation
- [ ] Test queries (getPending, getByTask, etc.)

#### 1B. Update Work Plan Store

**File**: `/src/lib/state/work-plan-store.ts`

Add fields to `WorkPlan` interface (after line 149):

```typescript
// ========================================
// ESCALATION TRACKING
// ========================================

// Escalation metadata
isEscalated?: boolean;              // Quick flag for filtering
currentEscalationId?: string;       // If currently escalated
escalationHistory?: string[];       // Array of escalation IDs (for pattern detection)
```

**Checklist**:
- [ ] Add escalation fields to WorkPlan interface
- [ ] No store methods needed yet (escalation-store handles CRUD)
- [ ] Later: Add method to mark task as escalated when escalation created

#### 1C. Update Notification Store

**File**: `/src/lib/state/notification-store.ts`

**Change 1**: Update NotificationType (line 5):
```typescript
export type NotificationType =
  | 'approval'
  | 'deadline'
  | 'capacity'
  | 'budget'
  | 'assignment'
  | 'message'
  | 'achievement'
  | 'escalation';  // 🆕 ADD THIS
```

**Change 2**: Add escalations preference (line 22-30):
```typescript
preferences: {
  approvals: boolean;
  deadlines: boolean;
  capacity: boolean;
  budget: boolean;
  assignments: boolean;
  messages: boolean;
  achievements: boolean;
  escalations: boolean;  // 🆕 ADD THIS
}
```

**Change 3**: Update initial preferences (line 45-52):
```typescript
preferences: {
  approvals: true,
  deadlines: true,
  capacity: true,
  budget: true,
  assignments: true,
  messages: true,
  achievements: true,
  escalations: true,  // 🆕 ADD THIS
},
```

**Change 4**: Update preference checking logic (line 57-62):
```typescript
const typeKey = notification.type === 'approval' ? 'approvals' :
               notification.type === 'deadline' ? 'deadlines' :
               notification.type === 'capacity' ? 'capacity' :
               notification.type === 'budget' ? 'budget' :
               notification.type === 'assignment' ? 'assignments' :
               notification.type === 'message' ? 'messages' :
               notification.type === 'escalation' ? 'escalations' :  // 🆕 ADD THIS
               'achievements';
```

**Change 5**: Add helper functions to notificationHelpers (after line 178):
```typescript
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
  actionLabel: 'Review Escalations',
  actionRoute: '/(tabs)/?modal=escalations',
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
  actionRoute: '/(tabs)/tasks',
}),
```

**Checklist**:
- [ ] Update NotificationType union
- [ ] Add escalations preference field
- [ ] Update default preferences
- [ ] Update typeKey checking logic
- [ ] Add escalationCreated helper
- [ ] Add escalationResolved helper
- [ ] Test notifications appear with correct type

---

### Phase 2: UI Components (6-7 hours)

#### 2A. Enhanced Escalate Modal

**File**: `/src/components/tasks/TaskCardExpansion.tsx`

Replace `handleEscalate` function (around line 260) with enhanced version:

```typescript
const [escalationReason, setEscalationReason] = useState<EscalationReason>('resource_constraint');
const [escalationDetails, setEscalationDetails] = useState('');

const reasonOptions: { value: EscalationReason; label: string; icon: string }[] = [
  { value: 'resource_constraint', label: 'Resource Constraint', icon: '👥' },
  { value: 'timeline_issue', label: 'Timeline Issue', icon: '⏰' },
  { value: 'scope_unclear', label: 'Scope Unclear', icon: '❓' },
  { value: 'blocked', label: 'Blocked', icon: '🚧' },
  { value: 'complexity', label: 'Too Complex', icon: '🧩' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const handleEscalate = () => {
  if (!escalationDetails.trim()) {
    Alert.alert('Details Required', 'Please explain why you need to escalate this task.');
    return;
  }

  const currentMember = members.find(m => m.id === /* current user's member ID */);
  if (!currentMember) return;

  const reasonLabel = reasonOptions.find(r => r.value === escalationReason)?.label || 'Unknown';

  createEscalation({
    workPlanId: task.id,
    workspaceId: task.workspaceId,
    escalatedBy: currentMember.id,
    escalatedByName: currentMember.name,
    reason: escalationReason,
    reasonLabel,
    details: escalationDetails,
    taskTitle: task.title,
    taskDescription: task.description,
    taskDueDate: task.dueDate,
    currentAllocations: task.allocations.map(a => a.memberId),
  });

  // Mark task as escalated
  updateWorkPlan(task.id, {
    isEscalated: true,
    currentEscalationId: /* escalation.id from return value */,
  });

  setShowEscalateModal(false);
  setEscalationDetails('');
  Alert.alert('Task Escalated', 'Leadership has been notified and will review shortly.');
};
```

Update the escalate modal JSX to include reason selector and details text area.

**Checklist**:
- [ ] Import useEscalationStore at top of file
- [ ] Add state variables for reason and details
- [ ] Replace handleEscalate function
- [ ] Update modal UI to show reason dropdown
- [ ] Add multiline text input for details
- [ ] Show preview of who will be notified
- [ ] Test creating escalation from task card

#### 2B. Escalations Inbox Modal

**File**: `/src/components/EscalationsInboxModal.tsx`

Create new file:

```typescript
/**
 * Escalations Inbox Modal
 * Shows all pending escalations for Founders to review
 * Similar pattern to PendingAssignmentsModal
 */

import { View, Text, Modal, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { X, CheckCircle, UserPlus, XCircle, Calendar, Users } from 'lucide-react-native';
import { useEscalationStore } from '@/lib/state/escalation-store';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { format } from 'date-fns';

interface EscalationsInboxModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: string;
  currentMemberId: string;  // To check if Founder
}

export function EscalationsInboxModal({
  visible,
  onClose,
  workspaceId,
  currentMemberId,
}: EscalationsInboxModalProps) {
  const pendingEscalations = useEscalationStore(s => s.getPendingEscalations(workspaceId));
  const acceptEscalation = useEscalationStore(s => s.acceptEscalation);
  const delegateEscalation = useEscalationStore(s => s.delegateEscalation);
  const rejectEscalation = useEscalationStore(s => s.rejectEscalation);
  const members = useOrganizationStore(s => s.members);
  const updateWorkPlan = useWorkPlanStore(s => s.updateWorkPlan);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [additionalTUs, setAdditionalTUs] = useState('');

  // Check if current user is a Founder
  const currentMember = members.find(m => m.id === currentMemberId);
  const isFounder = currentMember?.role === 'Founder';

  if (!isFounder) {
    return null; // Only Founders can access escalations inbox
  }

  const handleAccept = (escalationId: string) => {
    if (!actionNotes.trim()) {
      Alert.alert('Notes Required', 'Please provide notes for the team.');
      return;
    }

    const esc = pendingEscalations.find(e => e.id === escalationId);
    if (!esc) return;

    const changes = {
      newDueDate: newDueDate || undefined,
      additionalTUs: additionalTUs ? parseInt(additionalTUs) : undefined,
    };

    acceptEscalation(escalationId, actionNotes, changes);

    // Apply changes to task
    if (changes.newDueDate || changes.additionalTUs) {
      updateWorkPlan(esc.workPlanId, {
        dueDate: changes.newDueDate || esc.taskDueDate,
        estimatedTimeUnits: esc./* current TUs */ + (changes.additionalTUs || 0),
        isEscalated: false,
      });
    }

    setExpandedId(null);
    setActionNotes('');
    setNewDueDate('');
    setAdditionalTUs('');
  };

  const handleDelegate = (escalationId: string, memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    delegateEscalation(escalationId, memberId, member.name, actionNotes);
    setExpandedId(null);
    setActionNotes('');
  };

  const handleReject = (escalationId: string) => {
    if (!actionNotes.trim()) {
      Alert.alert('Feedback Required', 'Please provide guidance for why this was rejected.');
      return;
    }

    rejectEscalation(escalationId, actionNotes);
    setExpandedId(null);
    setActionNotes('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxHeight: '90%' }}>
          <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  Escalations Inbox
                </Text>
                <Text className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {pendingEscalations.length} pending review{pendingEscalations.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            {/* Escalations List */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
              {pendingEscalations.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-slate-500 dark:text-slate-400 text-center">
                    No pending escalations
                  </Text>
                </View>
              ) : (
                pendingEscalations.map((esc) => (
                  <View
                    key={esc.id}
                    className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3"
                  >
                    {/* Escalation Summary */}
                    <Pressable onPress={() => setExpandedId(expandedId === esc.id ? null : esc.id)}>
                      <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {esc.taskTitle}
                      </Text>
                      <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Escalated by {esc.escalatedByName} • {esc.reasonLabel}
                      </Text>
                      <Text className="text-sm text-slate-700 dark:text-slate-300">
                        {esc.details}
                      </Text>
                    </Pressable>

                    {/* Expanded Actions */}
                    {expandedId === esc.id && (
                      <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <TextInput
                          placeholder="Add notes for the team..."
                          value={actionNotes}
                          onChangeText={setActionNotes}
                          multiline
                          className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3 text-slate-900 dark:text-white"
                          placeholderTextColor="#94a3b8"
                        />

                        {/* Action Buttons */}
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => handleAccept(esc.id)}
                            className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} color="white" />
                            <Text className="text-white font-bold">Accept</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => handleReject(esc.id)}
                            className="flex-1 bg-red-500 py-3 rounded-lg flex-row items-center justify-center gap-2"
                          >
                            <XCircle size={18} color="white" />
                            <Text className="text-white font-bold">Reject</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

**Checklist**:
- [ ] Create EscalationsInboxModal.tsx
- [ ] Test modal opening/closing
- [ ] Test accept flow (with and without changes)
- [ ] Test delegate flow
- [ ] Test reject flow
- [ ] Verify only Founders can see modal

#### 2C. Escalations Badge

**File**: `/src/components/EscalationsBadge.tsx`

Create new file (similar to PendingAssignmentsBadge):

```typescript
import { View, Text, Pressable } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useEscalationStore } from '@/lib/state/escalation-store';

interface EscalationsBadgeProps {
  workspaceId: string;
  onPress: () => void;
  style?: 'default' | 'compact' | 'icon-only';
}

export function EscalationsBadge({
  workspaceId,
  onPress,
  style = 'default',
}: EscalationsBadgeProps) {
  const pendingCount = useEscalationStore(s => s.getPendingCount(workspaceId));

  if (pendingCount === 0) return null;

  if (style === 'icon-only') {
    return (
      <Pressable
        onPress={onPress}
        className="relative bg-red-500/20 p-2 rounded-full active:opacity-70"
      >
        <AlertTriangle size={20} color="#ef4444" />
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
          <Text className="text-white text-xs font-bold">
            {pendingCount > 9 ? '9+' : pendingCount}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center gap-2 active:opacity-80"
    >
      <AlertTriangle size={18} color="white" />
      <View>
        <Text className="text-white font-bold text-sm">
          {pendingCount} Escalation{pendingCount !== 1 ? 's' : ''}
        </Text>
        <Text className="text-white/80 text-xs">Tap to review</Text>
      </View>
    </Pressable>
  );
}
```

**Checklist**:
- [ ] Create EscalationsBadge.tsx
- [ ] Test badge shows correct count
- [ ] Test badge hides when count is 0
- [ ] Test onPress triggers modal

#### 2D. Integrate Badge into Home Tab

**File**: `/src/app/(tabs)/index.tsx`

Add after PendingAssignmentsBadge (around line 58):

```typescript
import { EscalationsBadge } from '@/components/EscalationsBadge';
import { EscalationsInboxModal } from '@/components/EscalationsInboxModal';

// In component:
const [showEscalationsModal, setShowEscalationsModal] = useState(false);

// In JSX (in header section, next to PendingAssignmentsBadge):
{currentMember?.role === 'Founder' && (
  <EscalationsBadge
    workspaceId={currentWorkspace.id}
    onPress={() => setShowEscalationsModal(true)}
    style="icon-only"
  />
)}

// Before closing tag:
<EscalationsInboxModal
  visible={showEscalationsModal}
  onClose={() => setShowEscalationsModal(false)}
  workspaceId={currentWorkspace.id}
  currentMemberId={currentMember?.id}
/>
```

**Checklist**:
- [ ] Import components
- [ ] Add state for modal visibility
- [ ] Add badge to header (Founders only)
- [ ] Add modal at end of component
- [ ] Test badge appears for Founders
- [ ] Test badge doesn't appear for non-Founders
- [ ] Test clicking badge opens modal

---

### Phase 3: Visual Indicators (2-3 hours)

#### 3A. Escalated Badge on Task Cards

**File**: `/src/components/tasks/TaskCardCompact.tsx`

Add escalated indicator after status badge (around line 50):

```typescript
{task.isEscalated && (
  <View className="flex-row items-center gap-1 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
    <AlertTriangle size={12} color="#ef4444" />
    <Text className="text-red-600 dark:text-red-400 text-xs font-semibold">
      Escalated
    </Text>
  </View>
)}
```

#### 3B. Escalation History in Full View

**File**: `/src/components/tasks/TaskCardExpansion.tsx`

Add history section in Full view (after allocations section):

```typescript
// Get escalation history
const escalationHistory = useEscalationStore(s => s.getEscalationsByTask(task.id));

// In JSX:
{escalationHistory.length > 0 && (
  <View className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
    <Text className="text-sm font-bold text-slate-900 dark:text-white mb-2">
      Escalation History ({escalationHistory.length})
    </Text>
    {escalationHistory.map(esc => (
      <View key={esc.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-2">
        <Text className="text-xs text-slate-600 dark:text-slate-400">
          {format(new Date(esc.escalatedAt), 'MMM d, yyyy')} • {esc.reasonLabel}
        </Text>
        <Text className="text-sm text-slate-700 dark:text-slate-300 mt-1">
          {esc.details}
        </Text>
        {esc.resolution && (
          <Text className="text-xs text-green-600 dark:text-green-400 mt-1">
            {esc.resolution.action} by {esc.respondedByName}: {esc.resolution.notes}
          </Text>
        )}
      </View>
    ))}
  </View>
)}
```

**Checklist**:
- [ ] Add escalated badge to TaskCardCompact
- [ ] Add escalation history to TaskCardExpansion Full view
- [ ] Test badges appear when isEscalated is true
- [ ] Test history shows all escalations for task
- [ ] Test history shows resolution details

---

### Phase 4: Testing & Polish (3-4 hours)

#### 4A. End-to-End Flow Testing

**Test Scenarios**:

1. **Escalation Creation**:
   - [ ] Non-Founder can create escalation
   - [ ] Modal validation works (requires details)
   - [ ] Task marked as escalated after creation
   - [ ] Notification sent to workspace
   - [ ] Badge appears on task card

2. **Founder Review**:
   - [ ] Founders see badge on Home tab
   - [ ] Badge shows correct count
   - [ ] Modal opens with pending escalations
   - [ ] Can expand/collapse escalation details

3. **Accept Flow**:
   - [ ] Can accept with notes only
   - [ ] Can accept with due date change
   - [ ] Can accept with TU increase
   - [ ] Task updated automatically
   - [ ] Escalator receives notification
   - [ ] Escalation removed from pending list

4. **Delegate Flow**:
   - [ ] Can select team member
   - [ ] Both parties receive notifications
   - [ ] Task assignment created (if using assignment system)

5. **Reject Flow**:
   - [ ] Requires feedback notes
   - [ ] Escalator receives notification with guidance
   - [ ] Task stays with original assignee

6. **Edge Cases**:
   - [ ] Multiple concurrent escalations
   - [ ] Escalating already-escalated task
   - [ ] Deleting task with escalation
   - [ ] Founder deletes their account (resolution still shows name)

#### 4B. Performance & Optimization

**Optimizations**:
- [ ] Use selectors in Zustand to prevent unnecessary re-renders
- [ ] Memoize expensive calculations (counts, filters)
- [ ] Lazy load escalation history (only when Full view opened)
- [ ] Persist escalations to MMKV for offline access

#### 4C. Error Handling

**Add try-catch blocks**:
- [ ] Escalation creation failure (show error alert)
- [ ] Notification delivery failure (log to console, continue)
- [ ] Store persistence failure (graceful degradation)

---

## Timeline Summary

**Total Estimate**: 15-19 hours

| Phase | Tasks | Hours |
|-------|-------|-------|
| Phase 1: Data Layer | Escalation store, work plan updates, notification updates | 4-5 |
| Phase 2: UI Components | Enhanced modal, inbox modal, badge, integration | 6-7 |
| Phase 3: Visual Indicators | Task badges, history display | 2-3 |
| Phase 4: Testing & Polish | E2E testing, optimization, error handling | 3-4 |

**Breakdown by Skill**:
- Backend/State: 4-5 hours
- UI/Components: 8-10 hours
- Testing: 3-4 hours

---

## Success Criteria

After implementation, the system should:

1. ✅ Allow any team member to escalate a blocked task
2. ✅ Notify all Founders of escalations (workspace-level)
3. ✅ Show Founders an inbox with pending escalations
4. ✅ Allow Founders to Accept (with changes), Delegate, or Reject
5. ✅ Automatically apply accepted changes to tasks
6. ✅ Notify escalator of resolution with notes
7. ✅ Show escalated badge on task cards
8. ✅ Display escalation history in full view
9. ✅ Work offline (persist to MMKV)
10. ✅ Handle edge cases gracefully (no crashes)

---

## Future Enhancements (v2.0)

### User-Specific Routing
- Populate `userId` in OrganizationMember via email matching on login
- Send notifications only to Founders with userId
- Show "X unread" count per Founder

### Push Notifications
- Register device tokens on app launch
- Send push notifications for urgent escalations
- Deep link from push notification to modal

### Analytics
- Track escalation metrics (time to resolve, common reasons)
- Show on Performance dashboard
- Identify repeat escalators (training opportunity)

### Auto-Actions
- Auto-delegate based on capacity
- Auto-extend due dates for accepted escalations
- Auto-reject if no response after 48 hours

### Escalation Templates
- Save common escalation scenarios
- One-tap escalate with pre-filled reason
- Suggest resolution based on past escalations

---

## Migration from Current System

**Current State**:
- Escalate button just updates task description
- No workflow, no notifications

**Migration Steps**:
1. Keep existing button for now (won't break anything)
2. Implement new escalation system alongside
3. Test thoroughly with demo data
4. Replace old button with new enhanced modal
5. Add migration script to convert old escalated tasks (optional)

**No Breaking Changes**:
- Old tasks with escalation text in description will continue to work
- New system is additive (new fields are optional)

---

## Dependencies

**Required**:
- notification-store.ts (already exists)
- organization-store.ts (already exists)
- work-plan-store.ts (already exists)
- PendingAssignmentsModal.tsx (for pattern reference)

**Optional**:
- task-assignment-store.ts (for delegation feature)
- date-fns (for date formatting in history)

**No New Packages Required**: Everything uses existing dependencies.

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Too many escalations | High | Add friction (reason + details required), educate users |
| Founders ignore inbox | High | Badge notification, reminder after 24hrs |
| Concurrent updates | Medium | Optimistic locking, show error if already handled |
| Notification delivery failure | Low | Persist to store, poll on app open |
| Performance with many escalations | Low | Paginate history, filter by date range |

---

## Open Questions

1. **Should non-Founders be able to see escalation status?**
   - Proposed: Yes, show "Escalated to leadership" badge but not resolution details

2. **Should there be a limit on escalations per task?**
   - Proposed: No hard limit, but show warning if task escalated >2 times

3. **Should escalations expire after X days?**
   - Proposed: No auto-expiry, but show "Pending 5 days" to pressure Founders

4. **Should we track escalation response SLA?**
   - Proposed: v2.0 feature - add to analytics

5. **Can Founders escalate to other Founders?**
   - Proposed: v2.0 feature - add "Escalate to Board" option

---

## Implementation Checklist

### Phase 1: Data Layer
- [ ] Create escalation-store.ts
- [ ] Update WorkPlan interface
- [ ] Update notification-store.ts (type, preference, helpers)
- [ ] Test escalation CRUD operations
- [ ] Test notification delivery

### Phase 2: UI Components
- [ ] Enhance escalate modal in TaskCardExpansion.tsx
- [ ] Create EscalationsInboxModal.tsx
- [ ] Create EscalationsBadge.tsx
- [ ] Integrate badge into Home tab
- [ ] Test modal flows

### Phase 3: Visual Indicators
- [ ] Add escalated badge to TaskCardCompact
- [ ] Add history section to TaskCardExpansion
- [ ] Test visual indicators

### Phase 4: Testing & Polish
- [ ] Run all test scenarios
- [ ] Add error handling
- [ ] Optimize performance
- [ ] Update README.md

### Phase 5: Documentation
- [ ] Update CLAUDE.md with escalation system info
- [ ] Add escalation guide to help modal
- [ ] Document for future developers

---

## Conclusion

This enhanced plan provides a complete, production-ready implementation of the escalation system. Key improvements over v1:

- ✅ All code changes specified with exact file locations
- ✅ Realistic timeline based on actual complexity
- ✅ Simplified user routing for MVP (workspace-level)
- ✅ Complete testing strategy
- ✅ Error handling and edge cases covered
- ✅ Clear migration path from current system
- ✅ Future enhancements documented for v2.0

The system follows existing app patterns (PendingAssignmentsModal, notification-store), requires no new packages, and can be implemented incrementally without breaking changes.
