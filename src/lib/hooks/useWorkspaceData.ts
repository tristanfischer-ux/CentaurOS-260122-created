/**
 * Hook for loading all workspace-specific data from Supabase
 * Centralizes data loading logic for authenticated users
 */

import { useEffect } from 'react';
import { useOrganizationStore } from '../state/organization-store';
import { useWorkPlanStore } from '../state/work-plan-store';
import { useOKRStore } from '../state/okr-store';
import { useSupplierStore } from '../state/supplier-store';

export function useWorkspaceData(workspaceId: string | null) {
  const loadMembers = useOrganizationStore((s) => s.loadMembersFromSupabase);
  const loadEngagements = useOrganizationStore((s) => s.loadEngagementsFromSupabase);
  const loadWorkPlans = useWorkPlanStore((s) => s.loadWorkPlansFromSupabase);
  const loadOKRs = useOKRStore((s) => s.loadOKRsFromSupabase);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliersFromSupabase);

  useEffect(() => {
    if (!workspaceId) {
      console.log('[useWorkspaceData] No workspace selected, skipping data load');
      return;
    }

    console.log('[useWorkspaceData] Loading data for workspace:', workspaceId);

    const loadAllData = async () => {
      try {
        // Load all workspace data in parallel
        await Promise.all([
          loadMembers(workspaceId),
          loadEngagements(workspaceId),
          loadWorkPlans(workspaceId),
          loadOKRs(workspaceId),
          loadSuppliers(workspaceId),
        ]);

        console.log('[useWorkspaceData] All workspace data loaded successfully');
      } catch (error) {
        console.error('[useWorkspaceData] Error loading workspace data:', error);
      }
    };

    loadAllData();
  }, [workspaceId, loadMembers, loadEngagements, loadWorkPlans, loadOKRs, loadSuppliers]);
}
