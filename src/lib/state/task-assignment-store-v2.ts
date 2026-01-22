/**
 * Task Assignment Store v2
 *
 * Hardened assignment workflow with:
 * - State machine: PROPOSED → PENDING → { ACCEPTED | REJECTED | EXPIRED | WITHDRAWN }
 * - Capacity reservation (soft holds during pending)
 * - SLA tracking with auto-expiry
 * - Assignment history and audit trail
 * - Smart rejection flow with alternatives
 *
 * Red-teamed improvements:
 * - Proposed assignments auto-expire after 1 hour
 * - Limit concurrent proposed per user (max 5)
 * - Early response tracking
 * - Cascade handling for deleted tasks
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

// Assignment lifecycle states
export type AssignmentStatus =
  | 'proposed'     // Draft - capacity held, not sent to assignee yet
  | 'pending'      // Sent to assignee, awaiting response
  | 'accepted'     // Assignee accepted
  | 'rejected'     // Assignee rejected
  | 'expired'      // Auto-expired after SLA (48h default)
  | 'withdrawn';   // Assigner cancelled before response

// SLA configuration
export const ASSIGNMENT_SLA = {
  PROPOSED_EXPIRY_MS: 1 * 60 * 60 * 1000,     // 1 hour to send proposed
  PENDING_EXPIRY_MS: 48 * 60 * 60 * 1000,     // 48 hours to respond
  SLOW_RESPONSE_MS: 24 * 60 * 60 * 1000,      // 24 hours = "responding slowly"
  MAX_CONCURRENT_PROPOSED: 5,                  // Max proposed per assigner
};

export interface AssignmentAuditEntry {
  timestamp: string;
  action: 'created' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'withdrawn' | 'reminder_sent';
  actorId: string;
  actorName: string;
  details?: string;
}

export interface TaskAssignmentV2 {
  id: string;
  workPlanId: string;
  workspaceId: string;

  // Who
  assignedTo: string;           // Member ID receiving assignment
  assignedToName: string;       // For display even if member deleted
  assignedBy: string;           // Member ID who created assignment
  assignedByName: string;       // For display

  // Timeline
  createdAt: string;            // When proposed
  sentAt?: string;              // When moved to pending
  respondedAt?: string;         // When accepted/rejected
  expiresAt: string;            // SLA deadline

  // Status
  status: AssignmentStatus;

  // Allocation details
  proposedAllocation: {
    squaresPerWeek: number;
    estimatedWeeks: number;
    notes?: string;             // Why this allocation
  };

  // Response (if any)
  response?: {
    message?: string;
    rejectionReason?: string;
    suggestedAlternative?: string;  // Member ID they suggest instead
    suggestedAlternativeName?: string;
  };

  // Task metadata (snapshot at assignment time)
  taskSnapshot: {
    title: string;
    description: string;
    function: string;
    dueDate: string;
    estimatedTUs: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };

  // Audit trail
  history: AssignmentAuditEntry[];

  // Flags
  reminderSent: boolean;
  isSlowResponse: boolean;
}

export interface CapacityHold {
  memberId: string;
  assignmentId: string;
  squaresPerWeek: number;
  expiresAt: string;
}

interface SuggestedAlternative {
  memberId: string;
  memberName: string;
  availableCapacity: number;
  totalCapacity: number;
  utilizationPercent: number;
  recentRejections: number;     // Last 7 days
  skillMatch: number;           // 0-100 score
}

interface TaskAssignmentStoreV2 {
  assignments: TaskAssignmentV2[];
  capacityHolds: CapacityHold[];

  // Core actions
  createProposedAssignment: (params: {
    workPlanId: string;
    workspaceId: string;
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
    assignedByName: string;
    proposedAllocation: TaskAssignmentV2['proposedAllocation'];
    taskSnapshot: TaskAssignmentV2['taskSnapshot'];
  }) => TaskAssignmentV2 | { error: string };

  sendAssignment: (assignmentId: string) => boolean;
  withdrawAssignment: (assignmentId: string, reason?: string) => boolean;
  acceptAssignment: (assignmentId: string, message?: string) => boolean;
  rejectAssignment: (assignmentId: string, reason: string, message?: string, suggestedAlternative?: { id: string; name: string }) => boolean;

  // Queries
  getAssignmentById: (id: string) => TaskAssignmentV2 | undefined;
  getPendingForMember: (memberId: string) => TaskAssignmentV2[];
  getProposedByMember: (memberId: string) => TaskAssignmentV2[];
  getAssignmentsByTask: (workPlanId: string) => TaskAssignmentV2[];
  getAssignmentHistory: (workPlanId: string) => TaskAssignmentV2[];

  // Capacity
  getCapacityHolds: (memberId: string) => number;
  getEffectiveCapacity: (memberId: string, baseCapacity: number, allocatedCapacity: number) => {
    allocated: number;
    held: number;
    available: number;
    total: number;
  };

  // SLA management
  checkAndExpireAssignments: () => number;  // Returns count expired
  sendReminders: () => string[];            // Returns assignment IDs reminded

  // Suggestions
  getSuggestedAlternatives: (params: {
    workspaceId: string;
    excludeMemberId: string;
    taskFunction: string;
    requiredTUs: number;
  }) => SuggestedAlternative[];

  // Cleanup
  cleanupOrphanedAssignments: (validWorkPlanIds: string[]) => number;
  reset: () => void;
}

export const useTaskAssignmentStoreV2 = create<TaskAssignmentStoreV2>()(
  persist(
    (set, get) => ({
      assignments: [],
      capacityHolds: [],

      createProposedAssignment: (params) => {
        const { assignedBy, workPlanId } = params;
        const state = get();

        // Check concurrent proposed limit
        const currentProposed = state.assignments.filter(
          a => a.assignedBy === assignedBy && a.status === 'proposed'
        );

        if (currentProposed.length >= ASSIGNMENT_SLA.MAX_CONCURRENT_PROPOSED) {
          return { error: `You have ${ASSIGNMENT_SLA.MAX_CONCURRENT_PROPOSED} unsent assignments. Please send or withdraw them first.` };
        }

        // Check for duplicate pending assignment to same person for same task
        const existingPending = state.assignments.find(
          a => a.workPlanId === workPlanId &&
               a.assignedTo === params.assignedTo &&
               ['proposed', 'pending'].includes(a.status)
        );

        if (existingPending) {
          return { error: 'This person already has a pending assignment for this task.' };
        }

        const now = new Date().toISOString();
        const expiresAt = new Date(Date.now() + ASSIGNMENT_SLA.PROPOSED_EXPIRY_MS).toISOString();

        const newAssignment: TaskAssignmentV2 = {
          id: `assign-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...params,
          createdAt: now,
          expiresAt,
          status: 'proposed',
          history: [{
            timestamp: now,
            action: 'created',
            actorId: params.assignedBy,
            actorName: params.assignedByName,
            details: `Proposed ${params.proposedAllocation.squaresPerWeek} TU/week for ${params.proposedAllocation.estimatedWeeks} weeks`,
          }],
          reminderSent: false,
          isSlowResponse: false,
        };

        // Create capacity hold
        const newHold: CapacityHold = {
          memberId: params.assignedTo,
          assignmentId: newAssignment.id,
          squaresPerWeek: params.proposedAllocation.squaresPerWeek,
          expiresAt,
        };

        set(state => ({
          assignments: [...state.assignments, newAssignment],
          capacityHolds: [...state.capacityHolds, newHold],
        }));

        console.log('[AssignmentV2] Created proposed:', newAssignment.id);
        return newAssignment;
      },

      sendAssignment: (assignmentId: string) => {
        const assignment = get().getAssignmentById(assignmentId);
        if (!assignment || assignment.status !== 'proposed') {
          console.error('[AssignmentV2] Cannot send - invalid state:', assignmentId);
          return false;
        }

        const now = new Date().toISOString();
        const newExpiresAt = new Date(Date.now() + ASSIGNMENT_SLA.PENDING_EXPIRY_MS).toISOString();

        set(state => ({
          assignments: state.assignments.map(a =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'pending' as const,
                  sentAt: now,
                  expiresAt: newExpiresAt,
                  history: [...a.history, {
                    timestamp: now,
                    action: 'sent' as const,
                    actorId: a.assignedBy,
                    actorName: a.assignedByName,
                  }],
                }
              : a
          ),
          // Update capacity hold expiry
          capacityHolds: state.capacityHolds.map(h =>
            h.assignmentId === assignmentId
              ? { ...h, expiresAt: newExpiresAt }
              : h
          ),
        }));

        // TODO: Send notification to assignee
        console.log('[AssignmentV2] Sent to:', assignment.assignedToName);
        return true;
      },

      withdrawAssignment: (assignmentId: string, reason?: string) => {
        const assignment = get().getAssignmentById(assignmentId);
        if (!assignment || !['proposed', 'pending'].includes(assignment.status)) {
          console.error('[AssignmentV2] Cannot withdraw - invalid state:', assignmentId);
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          assignments: state.assignments.map(a =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'withdrawn' as const,
                  respondedAt: now,
                  history: [...a.history, {
                    timestamp: now,
                    action: 'withdrawn' as const,
                    actorId: a.assignedBy,
                    actorName: a.assignedByName,
                    details: reason,
                  }],
                }
              : a
          ),
          // Release capacity hold
          capacityHolds: state.capacityHolds.filter(h => h.assignmentId !== assignmentId),
        }));

        console.log('[AssignmentV2] Withdrawn:', assignmentId);
        return true;
      },

      acceptAssignment: (assignmentId: string, message?: string) => {
        const assignment = get().getAssignmentById(assignmentId);
        if (!assignment || assignment.status !== 'pending') {
          console.error('[AssignmentV2] Cannot accept - invalid state:', assignmentId);
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          assignments: state.assignments.map(a =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'accepted' as const,
                  respondedAt: now,
                  response: message ? { message } : undefined,
                  history: [...a.history, {
                    timestamp: now,
                    action: 'accepted' as const,
                    actorId: a.assignedTo,
                    actorName: a.assignedToName,
                    details: message,
                  }],
                }
              : a
          ),
          // Release capacity hold (it becomes real allocation)
          capacityHolds: state.capacityHolds.filter(h => h.assignmentId !== assignmentId),
        }));

        // TODO: Notify assigner
        // TODO: Update work plan allocations
        console.log('[AssignmentV2] Accepted:', assignmentId);
        return true;
      },

      rejectAssignment: (assignmentId, reason, message, suggestedAlternative) => {
        const assignment = get().getAssignmentById(assignmentId);
        if (!assignment || assignment.status !== 'pending') {
          console.error('[AssignmentV2] Cannot reject - invalid state:', assignmentId);
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          assignments: state.assignments.map(a =>
            a.id === assignmentId
              ? {
                  ...a,
                  status: 'rejected' as const,
                  respondedAt: now,
                  response: {
                    rejectionReason: reason,
                    message,
                    suggestedAlternative: suggestedAlternative?.id,
                    suggestedAlternativeName: suggestedAlternative?.name,
                  },
                  history: [...a.history, {
                    timestamp: now,
                    action: 'rejected' as const,
                    actorId: a.assignedTo,
                    actorName: a.assignedToName,
                    details: `Reason: ${reason}${suggestedAlternative ? `. Suggested: ${suggestedAlternative.name}` : ''}`,
                  }],
                }
              : a
          ),
          // Release capacity hold
          capacityHolds: state.capacityHolds.filter(h => h.assignmentId !== assignmentId),
        }));

        // TODO: Notify assigner with reason and suggestion
        console.log('[AssignmentV2] Rejected:', assignmentId, reason);
        return true;
      },

      getAssignmentById: (id) => {
        return get().assignments.find(a => a.id === id);
      },

      getPendingForMember: (memberId) => {
        return get().assignments.filter(
          a => a.assignedTo === memberId && a.status === 'pending'
        );
      },

      getProposedByMember: (memberId) => {
        return get().assignments.filter(
          a => a.assignedBy === memberId && a.status === 'proposed'
        );
      },

      getAssignmentsByTask: (workPlanId) => {
        return get().assignments.filter(
          a => a.workPlanId === workPlanId && ['proposed', 'pending'].includes(a.status)
        );
      },

      getAssignmentHistory: (workPlanId) => {
        return get().assignments
          .filter(a => a.workPlanId === workPlanId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getCapacityHolds: (memberId) => {
        const holds = get().capacityHolds.filter(h => h.memberId === memberId);
        return holds.reduce((sum, h) => sum + h.squaresPerWeek, 0);
      },

      getEffectiveCapacity: (memberId, baseCapacity, allocatedCapacity) => {
        const held = get().getCapacityHolds(memberId);
        return {
          allocated: allocatedCapacity,
          held,
          available: Math.max(0, baseCapacity - allocatedCapacity - held),
          total: baseCapacity,
        };
      },

      checkAndExpireAssignments: () => {
        const now = new Date();
        let expiredCount = 0;

        set(state => {
          const updatedAssignments = state.assignments.map(a => {
            if (['proposed', 'pending'].includes(a.status) && new Date(a.expiresAt) < now) {
              expiredCount++;
              return {
                ...a,
                status: 'expired' as const,
                respondedAt: now.toISOString(),
                history: [...a.history, {
                  timestamp: now.toISOString(),
                  action: 'expired' as const,
                  actorId: 'system',
                  actorName: 'System',
                  details: a.status === 'proposed' ? 'Proposed assignment expired (1h)' : 'Pending assignment expired (48h SLA)',
                }],
              };
            }

            // Check for slow response (24h)
            if (a.status === 'pending' && !a.isSlowResponse && a.sentAt) {
              const sentTime = new Date(a.sentAt).getTime();
              if (now.getTime() - sentTime > ASSIGNMENT_SLA.SLOW_RESPONSE_MS) {
                return { ...a, isSlowResponse: true };
              }
            }

            return a;
          });

          // Remove holds for expired assignments
          const expiredIds = updatedAssignments
            .filter(a => a.status === 'expired')
            .map(a => a.id);

          return {
            assignments: updatedAssignments,
            capacityHolds: state.capacityHolds.filter(h => !expiredIds.includes(h.assignmentId)),
          };
        });

        if (expiredCount > 0) {
          console.log('[AssignmentV2] Expired', expiredCount, 'assignments');
        }
        return expiredCount;
      },

      sendReminders: () => {
        const now = new Date();
        const remindedIds: string[] = [];

        set(state => ({
          assignments: state.assignments.map(a => {
            // Send reminder at 24h if not already sent
            if (a.status === 'pending' && !a.reminderSent && a.sentAt) {
              const sentTime = new Date(a.sentAt).getTime();
              if (now.getTime() - sentTime > ASSIGNMENT_SLA.SLOW_RESPONSE_MS) {
                remindedIds.push(a.id);
                return {
                  ...a,
                  reminderSent: true,
                  history: [...a.history, {
                    timestamp: now.toISOString(),
                    action: 'reminder_sent' as const,
                    actorId: 'system',
                    actorName: 'System',
                    details: '24h reminder sent',
                  }],
                };
              }
            }
            return a;
          }),
        }));

        // TODO: Actually send reminder notifications
        if (remindedIds.length > 0) {
          console.log('[AssignmentV2] Sent', remindedIds.length, 'reminders');
        }
        return remindedIds;
      },

      getSuggestedAlternatives: ({ workspaceId, excludeMemberId, taskFunction, requiredTUs }) => {
        // This would integrate with organization store and work plan store
        // For now, return empty array - will be implemented with full integration
        console.log('[AssignmentV2] Getting alternatives for', taskFunction, 'excluding', excludeMemberId);
        return [];
      },

      cleanupOrphanedAssignments: (validWorkPlanIds) => {
        let cleanedCount = 0;

        set(state => {
          const orphaned = state.assignments.filter(
            a => !validWorkPlanIds.includes(a.workPlanId) && ['proposed', 'pending'].includes(a.status)
          );

          cleanedCount = orphaned.length;
          const orphanedIds = orphaned.map(a => a.id);

          return {
            assignments: state.assignments.map(a =>
              orphanedIds.includes(a.id)
                ? {
                    ...a,
                    status: 'withdrawn' as const,
                    respondedAt: new Date().toISOString(),
                    history: [...a.history, {
                      timestamp: new Date().toISOString(),
                      action: 'withdrawn' as const,
                      actorId: 'system',
                      actorName: 'System',
                      details: 'Task was deleted',
                    }],
                  }
                : a
            ),
            capacityHolds: state.capacityHolds.filter(h => !orphanedIds.includes(h.assignmentId)),
          };
        });

        if (cleanedCount > 0) {
          console.log('[AssignmentV2] Cleaned up', cleanedCount, 'orphaned assignments');
        }
        return cleanedCount;
      },

      reset: () => {
        set({ assignments: [], capacityHolds: [] });
      },
    }),
    {
      name: 'task-assignment-v2-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
