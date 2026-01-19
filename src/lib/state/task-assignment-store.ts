/**
 * Task Assignment Store
 * Manages task assignment requests with accept/reject workflow
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'auto-accepted';

export interface TaskAssignment {
  id: string;
  workPlanId: string;
  workspaceId: string;
  assignedTo: string; // Member ID
  assignedBy: string; // Member ID
  assignedAt: string; // ISO timestamp
  status: AssignmentStatus;
  proposedAllocation: {
    squaresPerWeek: number;
    estimatedWeeks: number;
  };
  responseAt?: string; // When accepted/rejected
  responseMessage?: string; // Feedback on rejection or acceptance
  rejectionReason?: string; // Why rejected

  // Metadata
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  taskEstimatedTUs: number;
}

interface TaskAssignmentState {
  assignments: TaskAssignment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAssignments: (workspaceId: string) => Promise<void>;
  createAssignment: (assignment: Omit<TaskAssignment, 'id' | 'assignedAt' | 'status'>) => Promise<TaskAssignment>;
  acceptAssignment: (assignmentId: string, message?: string) => Promise<void>;
  rejectAssignment: (assignmentId: string, reason: string, message?: string) => Promise<void>;
  bulkAccept: (assignmentIds: string[]) => Promise<void>;
  bulkReject: (assignmentIds: string[], reason: string) => Promise<void>;
  getPendingForMember: (memberId: string) => TaskAssignment[];
  getAssignmentsByTask: (workPlanId: string) => TaskAssignment[];
  deleteAssignment: (assignmentId: string) => Promise<void>;
  reset: () => void;
}

export const useTaskAssignmentStore = create<TaskAssignmentState>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,

  loadAssignments: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      // For now, use local state
      // In production, this would load from Supabase
      console.log('[TaskAssignment] Loading assignments for workspace:', workspaceId);

      // Filter assignments by workspace
      const workspaceAssignments = get().assignments.filter(a => a.workspaceId === workspaceId);
      set({ assignments: workspaceAssignments, isLoading: false });
    } catch (err) {
      console.error('[TaskAssignment] Failed to load assignments:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to load assignments', isLoading: false });
    }
  },

  createAssignment: async (assignment) => {
    const newAssignment: TaskAssignment = {
      ...assignment,
      id: `assign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedAt: new Date().toISOString(),
      status: assignment.assignedTo === assignment.assignedBy ? 'auto-accepted' : 'pending',
    };

    // Optimistic update
    set(state => ({
      assignments: [...state.assignments, newAssignment],
    }));

    try {
      // In production, save to Supabase
      console.log('[TaskAssignment] Created assignment:', newAssignment);

      // If auto-accepted (self-assignment), no notification needed
      if (newAssignment.status === 'auto-accepted') {
        console.log('[TaskAssignment] Auto-accepted (self-assignment)');
      } else {
        // TODO: Send notification to assignedTo member
        console.log('[TaskAssignment] Pending approval from:', newAssignment.assignedTo);
      }

      return newAssignment;
    } catch (err) {
      // Rollback on error
      set(state => ({
        assignments: state.assignments.filter(a => a.id !== newAssignment.id),
      }));
      throw err;
    }
  },

  acceptAssignment: async (assignmentId: string, message?: string) => {
    const previousAssignments = get().assignments;

    // Optimistic update
    set(state => ({
      assignments: state.assignments.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'accepted' as const,
              responseAt: new Date().toISOString(),
              responseMessage: message,
            }
          : a
      ),
    }));

    try {
      console.log('[TaskAssignment] Accepted assignment:', assignmentId, message);

      // TODO: Update Supabase
      // TODO: Notify task creator
      // TODO: Apply allocation to work plan
    } catch (err) {
      // Rollback
      set({ assignments: previousAssignments });
      console.error('[TaskAssignment] Failed to accept assignment:', err);
      throw err;
    }
  },

  rejectAssignment: async (assignmentId: string, reason: string, message?: string) => {
    const previousAssignments = get().assignments;

    // Optimistic update
    set(state => ({
      assignments: state.assignments.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'rejected' as const,
              responseAt: new Date().toISOString(),
              rejectionReason: reason,
              responseMessage: message,
            }
          : a
      ),
    }));

    try {
      console.log('[TaskAssignment] Rejected assignment:', assignmentId, reason, message);

      // TODO: Update Supabase
      // TODO: Notify task creator with reason
      // TODO: Suggest alternative members
    } catch (err) {
      // Rollback
      set({ assignments: previousAssignments });
      console.error('[TaskAssignment] Failed to reject assignment:', err);
      throw err;
    }
  },

  bulkAccept: async (assignmentIds: string[]) => {
    const previousAssignments = get().assignments;
    const now = new Date().toISOString();

    // Optimistic update
    set(state => ({
      assignments: state.assignments.map(a =>
        assignmentIds.includes(a.id)
          ? {
              ...a,
              status: 'accepted' as const,
              responseAt: now,
              responseMessage: 'Bulk accepted',
            }
          : a
      ),
    }));

    try {
      console.log('[TaskAssignment] Bulk accepted:', assignmentIds.length, 'assignments');

      // TODO: Update Supabase in batch
      // TODO: Send bulk notification
    } catch (err) {
      // Rollback
      set({ assignments: previousAssignments });
      console.error('[TaskAssignment] Failed to bulk accept:', err);
      throw err;
    }
  },

  bulkReject: async (assignmentIds: string[], reason: string) => {
    const previousAssignments = get().assignments;
    const now = new Date().toISOString();

    // Optimistic update
    set(state => ({
      assignments: state.assignments.map(a =>
        assignmentIds.includes(a.id)
          ? {
              ...a,
              status: 'rejected' as const,
              responseAt: now,
              rejectionReason: reason,
              responseMessage: 'Bulk rejected',
            }
          : a
      ),
    }));

    try {
      console.log('[TaskAssignment] Bulk rejected:', assignmentIds.length, 'assignments');

      // TODO: Update Supabase in batch
      // TODO: Send bulk notification
    } catch (err) {
      // Rollback
      set({ assignments: previousAssignments });
      console.error('[TaskAssignment] Failed to bulk reject:', err);
      throw err;
    }
  },

  getPendingForMember: (memberId: string) => {
    return get().assignments.filter(
      a => a.assignedTo === memberId && a.status === 'pending'
    );
  },

  getAssignmentsByTask: (workPlanId: string) => {
    return get().assignments.filter(a => a.workPlanId === workPlanId);
  },

  deleteAssignment: async (assignmentId: string) => {
    const previousAssignments = get().assignments;

    // Optimistic update
    set(state => ({
      assignments: state.assignments.filter(a => a.id !== assignmentId),
    }));

    try {
      console.log('[TaskAssignment] Deleted assignment:', assignmentId);
      // TODO: Delete from Supabase
    } catch (err) {
      // Rollback
      set({ assignments: previousAssignments });
      throw err;
    }
  },

  reset: () => {
    set({ assignments: [], isLoading: false, error: null });
  },
}));
