/**
 * Escalation Store v2
 *
 * Hardened escalation workflow with:
 * - Urgency levels: low, medium, high, critical
 * - SLA timers with visual countdown
 * - Auto-escalation to backup founders
 * - One active escalation per task (deduplication)
 * - Urgency inflation prevention (limits per user)
 *
 * Red-teamed improvements:
 * - Max 1 critical escalation per user per week
 * - Randomized backup founder selection
 * - Auto-escalation logging for pattern detection
 * - Conflict detection for same-task escalations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage/mmkv-storage';

export type EscalationStatus = 'pending' | 'accepted' | 'delegated' | 'rejected' | 'resolved' | 'auto_escalated';

export type EscalationReason =
  | 'resource_constraint'
  | 'timeline_issue'
  | 'scope_unclear'
  | 'blocked'
  | 'complexity'
  | 'dependency'
  | 'quality_concern'
  | 'other';

export type EscalationUrgency = 'low' | 'medium' | 'high' | 'critical';

// SLA configuration by urgency
export const ESCALATION_SLA = {
  critical: {
    initialResponseMs: 2 * 60 * 60 * 1000,      // 2 hours
    autoEscalateMs: 4 * 60 * 60 * 1000,         // 4 hours
    maxPerUserPerWeek: 1,
  },
  high: {
    initialResponseMs: 8 * 60 * 60 * 1000,      // 8 hours
    autoEscalateMs: 24 * 60 * 60 * 1000,        // 24 hours
    maxPerUserPerWeek: 3,
  },
  medium: {
    initialResponseMs: 24 * 60 * 60 * 1000,     // 24 hours
    autoEscalateMs: 72 * 60 * 60 * 1000,        // 72 hours
    maxPerUserPerWeek: 10,
  },
  low: {
    initialResponseMs: 48 * 60 * 60 * 1000,     // 48 hours
    autoEscalateMs: 7 * 24 * 60 * 60 * 1000,    // 7 days
    maxPerUserPerWeek: 999,                      // Unlimited
  },
};

export const URGENCY_LABELS: Record<EscalationUrgency, { label: string; color: string; description: string }> = {
  critical: {
    label: 'Critical',
    color: '#dc2626',
    description: 'Blocking revenue, customers, or critical launch. Requires immediate attention.',
  },
  high: {
    label: 'High',
    color: '#ea580c',
    description: 'Significant impact on timeline or deliverables. Needs same-day response.',
  },
  medium: {
    label: 'Medium',
    color: '#ca8a04',
    description: 'Notable blocker that needs resolution within 24-48 hours.',
  },
  low: {
    label: 'Low',
    color: '#64748b',
    description: 'General issue for founder awareness. No immediate action required.',
  },
};

export const REASON_LABELS: Record<EscalationReason, string> = {
  resource_constraint: 'Not enough capacity/people',
  timeline_issue: 'Cannot meet deadline',
  scope_unclear: 'Requirements unclear',
  blocked: 'Blocked by external dependency',
  complexity: 'More complex than estimated',
  dependency: 'Waiting on another task/team',
  quality_concern: 'Quality risk if we proceed',
  other: 'Other issue',
};

export interface EscalationAuditEntry {
  timestamp: string;
  action: 'created' | 'viewed' | 'responded' | 'auto_escalated' | 'reminder_sent';
  actorId: string;
  actorName: string;
  details?: string;
}

export interface EscalationResolution {
  action: 'accepted' | 'delegated' | 'rejected';
  respondedBy: string;
  respondedByName: string;
  respondedAt: string;
  notes: string;
  // For accepted
  proposedChanges?: {
    newDueDate?: string;
    additionalTUs?: number;
    additionalMembers?: { id: string; name: string }[];
  };
  // For delegated
  delegatedTo?: string;
  delegatedToName?: string;
}

export interface EscalationRequestV2 {
  id: string;
  workPlanId: string;
  workspaceId: string;

  // Who escalated
  escalatedBy: string;
  escalatedByUserId?: string;
  escalatedByName: string;
  escalatedAt: string;

  // What
  reason: EscalationReason;
  urgency: EscalationUrgency;
  details: string;
  impactDescription?: string;   // What happens if not resolved

  // SLA tracking
  responseDeadline: string;     // When initial response expected
  autoEscalateAt: string;       // When auto-escalates to backup
  slaBreached: boolean;

  // Routing
  assignedToFounderId?: string;          // Primary founder
  assignedToFounderName?: string;
  backupFounderId?: string;              // Backup if primary doesn't respond
  backupFounderName?: string;
  autoEscalatedToBackup: boolean;
  autoEscalatedAt?: string;

  // Status
  status: EscalationStatus;
  viewedAt?: string;            // When founder first viewed

  // Resolution
  resolution?: EscalationResolution;

  // Task snapshot
  taskSnapshot: {
    title: string;
    description: string;
    function: string;
    dueDate: string;
    currentAllocations: { memberId: string; memberName: string; squaresPerWeek: number }[];
  };

  // Audit
  history: EscalationAuditEntry[];
}

interface EscalationStoreV2 {
  escalations: EscalationRequestV2[];

  // Core actions
  createEscalation: (params: {
    workPlanId: string;
    workspaceId: string;
    escalatedBy: string;
    escalatedByUserId?: string;
    escalatedByName: string;
    reason: EscalationReason;
    urgency: EscalationUrgency;
    details: string;
    impactDescription?: string;
    taskSnapshot: EscalationRequestV2['taskSnapshot'];
    founders: { id: string; name: string; userId?: string }[];
  }) => EscalationRequestV2 | { error: string };

  markViewed: (id: string, founderId: string, founderName: string) => boolean;

  acceptEscalation: (params: {
    id: string;
    founderId: string;
    founderName: string;
    notes: string;
    proposedChanges?: EscalationResolution['proposedChanges'];
  }) => boolean;

  delegateEscalation: (params: {
    id: string;
    founderId: string;
    founderName: string;
    delegateToId: string;
    delegateToName: string;
    notes: string;
  }) => boolean;

  rejectEscalation: (params: {
    id: string;
    founderId: string;
    founderName: string;
    notes: string;
  }) => boolean;

  // Queries
  getEscalationById: (id: string) => EscalationRequestV2 | undefined;
  getPendingEscalations: (workspaceId: string) => EscalationRequestV2[];
  getActiveEscalationForTask: (workPlanId: string) => EscalationRequestV2 | undefined;
  getEscalationsByMember: (memberId: string) => EscalationRequestV2[];
  getPendingCount: (workspaceId: string) => number;
  getUrgencyBreakdown: (workspaceId: string) => Record<EscalationUrgency, number>;

  // Urgency limits
  canCreateUrgency: (memberId: string, urgency: EscalationUrgency) => { allowed: boolean; reason?: string };
  getUrgencyUsage: (memberId: string) => Record<EscalationUrgency, { used: number; max: number }>;

  // SLA management
  checkAndAutoEscalate: () => string[];   // Returns IDs that auto-escalated
  getSLAStatus: (id: string) => {
    breached: boolean;
    timeRemaining: number;
    percentRemaining: number;
  } | null;

  // Cleanup
  clearResolvedEscalations: (workspaceId: string, olderThanDays: number) => number;
  reset: () => void;
}

export const useEscalationStoreV2 = create<EscalationStoreV2>()(
  persist(
    (set, get) => ({
      escalations: [],

      createEscalation: (params) => {
        const { workPlanId, escalatedBy, urgency, founders } = params;
        const state = get();

        // Check for existing active escalation on this task
        const existingActive = state.getActiveEscalationForTask(workPlanId);
        if (existingActive) {
          return { error: `This task already has an active escalation (${existingActive.urgency} priority). Please wait for resolution or update the existing escalation.` };
        }

        // Check urgency limits
        const limitCheck = state.canCreateUrgency(escalatedBy, urgency);
        if (!limitCheck.allowed) {
          return { error: limitCheck.reason || 'Urgency limit reached' };
        }

        // Select primary and backup founders (randomized for fairness)
        const shuffledFounders = [...founders].sort(() => Math.random() - 0.5);
        const primaryFounder = shuffledFounders[0];
        const backupFounder = shuffledFounders.length > 1 ? shuffledFounders[1] : undefined;

        const now = new Date();
        const slaConfig = ESCALATION_SLA[urgency];

        const newEscalation: EscalationRequestV2 = {
          id: `esc-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          workPlanId: params.workPlanId,
          workspaceId: params.workspaceId,
          escalatedBy: params.escalatedBy,
          escalatedByUserId: params.escalatedByUserId,
          escalatedByName: params.escalatedByName,
          escalatedAt: now.toISOString(),
          reason: params.reason,
          urgency: params.urgency,
          details: params.details,
          impactDescription: params.impactDescription,
          responseDeadline: new Date(now.getTime() + slaConfig.initialResponseMs).toISOString(),
          autoEscalateAt: new Date(now.getTime() + slaConfig.autoEscalateMs).toISOString(),
          slaBreached: false,
          assignedToFounderId: primaryFounder?.id,
          assignedToFounderName: primaryFounder?.name,
          backupFounderId: backupFounder?.id,
          backupFounderName: backupFounder?.name,
          autoEscalatedToBackup: false,
          status: 'pending',
          taskSnapshot: params.taskSnapshot,
          history: [{
            timestamp: now.toISOString(),
            action: 'created',
            actorId: params.escalatedBy,
            actorName: params.escalatedByName,
            details: `${URGENCY_LABELS[urgency].label} priority: ${REASON_LABELS[params.reason]}`,
          }],
        };

        set(state => ({
          escalations: [...state.escalations, newEscalation],
        }));

        // TODO: Send notification to primary founder
        console.log('[EscalationV2] Created:', newEscalation.id, urgency, 'assigned to', primaryFounder?.name);
        return newEscalation;
      },

      markViewed: (id, founderId, founderName) => {
        const escalation = get().getEscalationById(id);
        if (!escalation || escalation.viewedAt) return false;

        const now = new Date().toISOString();

        set(state => ({
          escalations: state.escalations.map(e =>
            e.id === id
              ? {
                  ...e,
                  viewedAt: now,
                  history: [...e.history, {
                    timestamp: now,
                    action: 'viewed' as const,
                    actorId: founderId,
                    actorName: founderName,
                  }],
                }
              : e
          ),
        }));

        return true;
      },

      acceptEscalation: ({ id, founderId, founderName, notes, proposedChanges }) => {
        const escalation = get().getEscalationById(id);
        if (!escalation || !['pending', 'auto_escalated'].includes(escalation.status)) {
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          escalations: state.escalations.map(e =>
            e.id === id
              ? {
                  ...e,
                  status: 'accepted' as const,
                  resolution: {
                    action: 'accepted',
                    respondedBy: founderId,
                    respondedByName: founderName,
                    respondedAt: now,
                    notes,
                    proposedChanges,
                  },
                  history: [...e.history, {
                    timestamp: now,
                    action: 'responded' as const,
                    actorId: founderId,
                    actorName: founderName,
                    details: `Accepted: ${notes}`,
                  }],
                }
              : e
          ),
        }));

        // TODO: Notify escalator
        // TODO: Apply changes to work plan
        console.log('[EscalationV2] Accepted:', id, 'by', founderName);
        return true;
      },

      delegateEscalation: ({ id, founderId, founderName, delegateToId, delegateToName, notes }) => {
        const escalation = get().getEscalationById(id);
        if (!escalation || !['pending', 'auto_escalated'].includes(escalation.status)) {
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          escalations: state.escalations.map(e =>
            e.id === id
              ? {
                  ...e,
                  status: 'delegated' as const,
                  resolution: {
                    action: 'delegated',
                    respondedBy: founderId,
                    respondedByName: founderName,
                    respondedAt: now,
                    notes,
                    delegatedTo: delegateToId,
                    delegatedToName: delegateToName,
                  },
                  history: [...e.history, {
                    timestamp: now,
                    action: 'responded' as const,
                    actorId: founderId,
                    actorName: founderName,
                    details: `Delegated to ${delegateToName}: ${notes}`,
                  }],
                }
              : e
          ),
        }));

        // TODO: Notify escalator and delegate
        console.log('[EscalationV2] Delegated:', id, 'to', delegateToName);
        return true;
      },

      rejectEscalation: ({ id, founderId, founderName, notes }) => {
        const escalation = get().getEscalationById(id);
        if (!escalation || !['pending', 'auto_escalated'].includes(escalation.status)) {
          return false;
        }

        const now = new Date().toISOString();

        set(state => ({
          escalations: state.escalations.map(e =>
            e.id === id
              ? {
                  ...e,
                  status: 'rejected' as const,
                  resolution: {
                    action: 'rejected',
                    respondedBy: founderId,
                    respondedByName: founderName,
                    respondedAt: now,
                    notes,
                  },
                  history: [...e.history, {
                    timestamp: now,
                    action: 'responded' as const,
                    actorId: founderId,
                    actorName: founderName,
                    details: `Rejected: ${notes}`,
                  }],
                }
              : e
          ),
        }));

        // TODO: Notify escalator with feedback
        console.log('[EscalationV2] Rejected:', id, 'by', founderName);
        return true;
      },

      getEscalationById: (id) => {
        return get().escalations.find(e => e.id === id);
      },

      getPendingEscalations: (workspaceId) => {
        return get().escalations
          .filter(e => e.workspaceId === workspaceId && ['pending', 'auto_escalated'].includes(e.status))
          .sort((a, b) => {
            // Sort by urgency (critical first), then by date
            const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
              return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            }
            return new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime();
          });
      },

      getActiveEscalationForTask: (workPlanId) => {
        return get().escalations.find(
          e => e.workPlanId === workPlanId && ['pending', 'auto_escalated'].includes(e.status)
        );
      },

      getEscalationsByMember: (memberId) => {
        return get().escalations.filter(e => e.escalatedBy === memberId);
      },

      getPendingCount: (workspaceId) => {
        return get().getPendingEscalations(workspaceId).length;
      },

      getUrgencyBreakdown: (workspaceId) => {
        const pending = get().getPendingEscalations(workspaceId);
        return {
          critical: pending.filter(e => e.urgency === 'critical').length,
          high: pending.filter(e => e.urgency === 'high').length,
          medium: pending.filter(e => e.urgency === 'medium').length,
          low: pending.filter(e => e.urgency === 'low').length,
        };
      },

      canCreateUrgency: (memberId, urgency) => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentEscalations = get().escalations.filter(
          e => e.escalatedBy === memberId &&
               e.urgency === urgency &&
               new Date(e.escalatedAt) > oneWeekAgo
        );

        const max = ESCALATION_SLA[urgency].maxPerUserPerWeek;
        const used = recentEscalations.length;

        if (used >= max) {
          return {
            allowed: false,
            reason: `You've used ${used}/${max} ${URGENCY_LABELS[urgency].label} escalations this week. Consider ${urgency === 'critical' ? 'High' : urgency === 'high' ? 'Medium' : 'Low'} priority instead.`,
          };
        }

        return { allowed: true };
      },

      getUrgencyUsage: (memberId) => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentByUrgency = get().escalations.filter(
          e => e.escalatedBy === memberId && new Date(e.escalatedAt) > oneWeekAgo
        );

        return {
          critical: {
            used: recentByUrgency.filter(e => e.urgency === 'critical').length,
            max: ESCALATION_SLA.critical.maxPerUserPerWeek,
          },
          high: {
            used: recentByUrgency.filter(e => e.urgency === 'high').length,
            max: ESCALATION_SLA.high.maxPerUserPerWeek,
          },
          medium: {
            used: recentByUrgency.filter(e => e.urgency === 'medium').length,
            max: ESCALATION_SLA.medium.maxPerUserPerWeek,
          },
          low: {
            used: recentByUrgency.filter(e => e.urgency === 'low').length,
            max: ESCALATION_SLA.low.maxPerUserPerWeek,
          },
        };
      },

      checkAndAutoEscalate: () => {
        const now = new Date();
        const autoEscalatedIds: string[] = [];

        set(state => ({
          escalations: state.escalations.map(e => {
            // Check for auto-escalation trigger
            if (
              e.status === 'pending' &&
              !e.autoEscalatedToBackup &&
              e.backupFounderId &&
              new Date(e.autoEscalateAt) < now
            ) {
              autoEscalatedIds.push(e.id);
              return {
                ...e,
                status: 'auto_escalated' as const,
                autoEscalatedToBackup: true,
                autoEscalatedAt: now.toISOString(),
                slaBreached: true,
                history: [...e.history, {
                  timestamp: now.toISOString(),
                  action: 'auto_escalated' as const,
                  actorId: 'system',
                  actorName: 'System',
                  details: `Auto-escalated to ${e.backupFounderName} (primary didn't respond within SLA)`,
                }],
              };
            }

            // Check for SLA breach (response deadline passed)
            if (e.status === 'pending' && !e.slaBreached && new Date(e.responseDeadline) < now) {
              return { ...e, slaBreached: true };
            }

            return e;
          }),
        }));

        if (autoEscalatedIds.length > 0) {
          console.log('[EscalationV2] Auto-escalated', autoEscalatedIds.length, 'to backups');
          // TODO: Notify backup founders
        }

        return autoEscalatedIds;
      },

      getSLAStatus: (id) => {
        const escalation = get().getEscalationById(id);
        if (!escalation || !['pending', 'auto_escalated'].includes(escalation.status)) {
          return null;
        }

        const now = Date.now();
        const deadline = new Date(escalation.responseDeadline).getTime();
        const created = new Date(escalation.escalatedAt).getTime();
        const totalTime = deadline - created;
        const timeRemaining = deadline - now;
        const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));

        return {
          breached: escalation.slaBreached || timeRemaining < 0,
          timeRemaining,
          percentRemaining,
        };
      },

      clearResolvedEscalations: (workspaceId, olderThanDays) => {
        const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        let cleaned = 0;

        set(state => ({
          escalations: state.escalations.filter(e => {
            const shouldRemove =
              e.workspaceId === workspaceId &&
              ['accepted', 'delegated', 'rejected', 'resolved'].includes(e.status) &&
              e.resolution?.respondedAt &&
              new Date(e.resolution.respondedAt) < cutoff;

            if (shouldRemove) cleaned++;
            return !shouldRemove;
          }),
        }));

        console.log('[EscalationV2] Cleaned', cleaned, 'resolved escalations older than', olderThanDays, 'days');
        return cleaned;
      },

      reset: () => {
        set({ escalations: [] });
      },
    }),
    {
      name: 'escalation-v2-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
