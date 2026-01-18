/**
 * Real-time Subscriptions Helper
 *
 * Adds Supabase real-time subscriptions to stores for live data updates.
 * Use this in store initialization or in React components.
 *
 * Features:
 * - Automatic subscription setup
 * - Handles INSERT, UPDATE, DELETE events
 * - Updates store state in real-time
 * - Proper cleanup on unmount
 *
 * Usage in a React component:
 * ```tsx
 * useEffect(() => {
 *   const cleanup = subscribeToMembers(workspaceId, (payload) => {
 *     // Handle real-time update
 *     organizationStore.loadMembersFromSupabase(workspaceId);
 *   });
 *
 *   return cleanup;
 * }, [workspaceId]);
 * ```
 */

import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================================
// MEMBERS SUBSCRIPTIONS
// ============================================================================

export function subscribeToMembers(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`members:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] Members change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// WORK PLANS SUBSCRIPTIONS
// ============================================================================

export function subscribeToWorkPlans(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`work_plans:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'work_plans',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] Work plans change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToWorkPlanAllocations(
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel('work_plan_allocations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'work_plan_allocations',
      },
      (payload) => {
        console.log('[Real-time] Allocations change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// OKRS SUBSCRIPTIONS
// ============================================================================

export function subscribeToOKRs(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`okrs:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'okrs',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] OKRs change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToOKRObjectives(
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel('okr_objectives')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'okr_objectives',
      },
      (payload) => {
        console.log('[Real-time] Objectives change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// SUPPLIERS SUBSCRIPTIONS
// ============================================================================

export function subscribeToSuppliers(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`suppliers:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'suppliers',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] Suppliers change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToSupplierEngagements(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`supplier_engagements:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'supplier_engagements',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] Engagements change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// FINANCIAL TRANSACTIONS SUBSCRIPTIONS
// ============================================================================

export function subscribeToFinancialTransactions(
  workspaceId: string,
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  const channel = supabase
    .channel(`financial_transactions:${workspaceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'financial_transactions',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        console.log('[Real-time] Financial transactions change:', payload.eventType);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ============================================================================
// COMPOSITE SUBSCRIPTION (Subscribe to all workspace data)
// ============================================================================

export function subscribeToWorkspace(
  workspaceId: string,
  callbacks: {
    onMembersUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onWorkPlansUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onOKRsUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onSuppliersUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onFinancialUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  }
) {
  const cleanups: (() => void)[] = [];

  if (callbacks.onMembersUpdate) {
    cleanups.push(subscribeToMembers(workspaceId, callbacks.onMembersUpdate));
  }

  if (callbacks.onWorkPlansUpdate) {
    cleanups.push(subscribeToWorkPlans(workspaceId, callbacks.onWorkPlansUpdate));
  }

  if (callbacks.onOKRsUpdate) {
    cleanups.push(subscribeToOKRs(workspaceId, callbacks.onOKRsUpdate));
  }

  if (callbacks.onSuppliersUpdate) {
    cleanups.push(subscribeToSuppliers(workspaceId, callbacks.onSuppliersUpdate));
  }

  if (callbacks.onFinancialUpdate) {
    cleanups.push(subscribeToFinancialTransactions(workspaceId, callbacks.onFinancialUpdate));
  }

  // Return cleanup function that unsubscribes from all channels
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}

// ============================================================================
// EXAMPLE USAGE IN REACT COMPONENT
// ============================================================================

/*
import { useEffect } from 'react';
import { subscribeToWorkspace } from '@/lib/realtime-subscriptions';
import { useOrganizationStore } from '@/lib/state/organization-store';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useOKRStore } from '@/lib/state/okr-store';

function MyComponent() {
  const workspaceId = 'workspace-id';

  useEffect(() => {
    const cleanup = subscribeToWorkspace(workspaceId, {
      onMembersUpdate: () => {
        useOrganizationStore.getState().loadMembersFromSupabase(workspaceId);
      },
      onWorkPlansUpdate: () => {
        useWorkPlanStore.getState().loadWorkPlansFromSupabase(workspaceId);
      },
      onOKRsUpdate: () => {
        useOKRStore.getState().loadOKRsFromSupabase(workspaceId);
      },
    });

    return cleanup;
  }, [workspaceId]);

  return <View>...</View>;
}
*/
