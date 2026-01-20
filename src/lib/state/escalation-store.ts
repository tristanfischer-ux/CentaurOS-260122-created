/**
 * Escalation Store
 * Manages task escalations to leadership
 *
 * Pattern: Similar to task-assignment-store.ts
 * - Pending escalations → Founders review → Accept/Delegate/Reject
 * - Notifications sent to workspace (Founders filter in UI)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';
import { useNotificationStore, notificationHelpers } from './notification-store';
import { useOrganizationStore } from './organization-store';
import { getFoundersWithAuth, getMemberUserId } from './user-member-helpers';

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
  escalatedByUserId?: string;    // Auth user ID (for user-specific notifications)
  escalatedByName: string;       // Display name (preserved even if member deleted)
  escalatedAt: string;           // ISO timestamp
  reason: EscalationReason;
  reasonLabel: string;           // Human-readable reason
  details: string;               // Explanation of the issue

  // Current state
  status: EscalationStatus;

  // Resolution (when leadership responds)
  respondedBy?: string;          // Founder member ID who handled it
  respondedByUserId?: string;    // Auth user ID of responder
  respondedByName?: string;      // Display name of responder
  respondedAt?: string;          // When resolved
  resolution?: {
    action: 'accepted' | 'delegated' | 'rejected';
    notes: string;               // Leadership's guidance/explanation
    delegatedTo?: string;        // If delegated, who gets it (member ID)
    delegatedToName?: string;    // Display name
    delegatedToUserId?: string;  // Auth user ID of delegate
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
  acceptEscalation: (id: string, founderMemberId: string, notes: string, changes?: { newDueDate?: string; additionalTUs?: number; additionalMembers?: string[] }) => void;
  delegateEscalation: (id: string, founderMemberId: string, memberId: string, memberName: string, notes: string) => void;
  rejectEscalation: (id: string, founderMemberId: string, notes: string) => void;

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

        // Notify Founders with auth accounts (user-specific routing)
        const members = useOrganizationStore.getState().members;
        const foundersWithAuth = getFoundersWithAuth(request.workspaceId, members);

        const notification = notificationHelpers.escalationCreated(
          request.workspaceId,
          request.taskTitle,
          request.escalatedByName,
          request.reasonLabel
        );

        if (foundersWithAuth.length > 0) {
          // Send to specific Founders with auth
          foundersWithAuth.forEach(founder => {
            if (founder.userId) {
              useNotificationStore.getState().addNotification({
                ...notification,
                userId: founder.userId, // User-specific routing
              });
            }
          });
          console.log('[Escalation] Notified', foundersWithAuth.length, 'Founders with auth');
        } else {
          // Fallback: workspace-level notification if no Founders have auth
          useNotificationStore.getState().addNotification(notification);
          console.log('[Escalation] Fallback: workspace-level notification (no Founders with auth)');
        }

        console.log('[Escalation] Created:', newEscalation.id, 'for task:', request.taskTitle);
        return newEscalation;
      },

      acceptEscalation: (id, founderMemberId, notes, changes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) {
          console.error('[Escalation] Not found:', id);
          return;
        }

        // Get founder info
        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.id === founderMemberId);
        if (!founder) {
          console.error('[Escalation] Founder not found:', founderMemberId);
          return;
        }

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'accepted' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByUserId: founder.userId, // Track responder's auth user ID
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

        // Notify original escalator (user-specific if they have auth)
        const notification = notificationHelpers.escalationResolved(
          escalation.workspaceId,
          escalation.taskTitle,
          'accepted',
          founder.name,
          notes
        );

        if (escalation.escalatedByUserId) {
          // User-specific notification to escalator
          useNotificationStore.getState().addNotification({
            ...notification,
            userId: escalation.escalatedByUserId,
          });
          console.log('[Escalation] Notified escalator (userId:', escalation.escalatedByUserId, ')');
        } else {
          // Fallback: workspace-level notification
          useNotificationStore.getState().addNotification(notification);
          console.log('[Escalation] Fallback: workspace-level notification');
        }

        console.log('[Escalation] Accepted:', id, 'by', founder.name);
      },

      delegateEscalation: (id, founderMemberId, memberId, memberName, notes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) {
          console.error('[Escalation] Not found:', id);
          return;
        }

        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.id === founderMemberId);
        if (!founder) {
          console.error('[Escalation] Founder not found:', founderMemberId);
          return;
        }

        const delegateMember = members.find(m => m.id === memberId);

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'delegated' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByUserId: founder.userId, // Track responder's auth user ID
                  respondedByName: founder.name,
                  respondedAt: new Date().toISOString(),
                  resolution: {
                    action: 'delegated',
                    notes,
                    delegatedTo: memberId,
                    delegatedToName: memberName,
                    delegatedToUserId: delegateMember?.userId, // Track delegate's auth user ID
                  },
                }
              : esc
          ),
        }));

        // Notify original escalator and new assignee (user-specific if they have auth)
        const notification = notificationHelpers.escalationResolved(
          escalation.workspaceId,
          escalation.taskTitle,
          'delegated',
          founder.name,
          `Delegated to ${memberName}: ${notes}`
        );

        // Notify original escalator
        if (escalation.escalatedByUserId) {
          useNotificationStore.getState().addNotification({
            ...notification,
            userId: escalation.escalatedByUserId,
          });
          console.log('[Escalation] Notified escalator (userId:', escalation.escalatedByUserId, ')');
        }

        // Notify delegate
        if (delegateMember?.userId) {
          useNotificationStore.getState().addNotification({
            ...notification,
            userId: delegateMember.userId,
            title: '📋 Task Delegated to You',
            message: `${founder.name} delegated "${escalation.taskTitle}" to you: ${notes}`,
          });
          console.log('[Escalation] Notified delegate (userId:', delegateMember.userId, ')');
        }

        // Fallback if no one has auth
        if (!escalation.escalatedByUserId && !delegateMember?.userId) {
          useNotificationStore.getState().addNotification(notification);
          console.log('[Escalation] Fallback: workspace-level notification');
        }

        console.log('[Escalation] Delegated:', id, 'to', memberName, 'by', founder.name);
      },

      rejectEscalation: (id, founderMemberId, notes) => {
        const escalation = get().getEscalationById(id);
        if (!escalation) {
          console.error('[Escalation] Not found:', id);
          return;
        }

        const members = useOrganizationStore.getState().members;
        const founder = members.find(m => m.id === founderMemberId);
        if (!founder) {
          console.error('[Escalation] Founder not found:', founderMemberId);
          return;
        }

        set((state) => ({
          escalations: state.escalations.map((esc) =>
            esc.id === id
              ? {
                  ...esc,
                  status: 'rejected' as EscalationStatus,
                  respondedBy: founder.id,
                  respondedByUserId: founder.userId, // Track responder's auth user ID
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

        // Notify original escalator with feedback (user-specific if they have auth)
        const notification = notificationHelpers.escalationResolved(
          escalation.workspaceId,
          escalation.taskTitle,
          'rejected',
          founder.name,
          notes
        );

        if (escalation.escalatedByUserId) {
          // User-specific notification to escalator
          useNotificationStore.getState().addNotification({
            ...notification,
            userId: escalation.escalatedByUserId,
          });
          console.log('[Escalation] Notified escalator (userId:', escalation.escalatedByUserId, ')');
        } else {
          // Fallback: workspace-level notification
          useNotificationStore.getState().addNotification(notification);
          console.log('[Escalation] Fallback: workspace-level notification');
        }

        console.log('[Escalation] Rejected:', id, 'by', founder.name);
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
