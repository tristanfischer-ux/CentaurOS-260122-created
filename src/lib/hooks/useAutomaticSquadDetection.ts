/**
 * useAutomaticSquadDetection
 *
 * Hook that automatically detects and updates squads based on task allocations
 */

import { useEffect } from 'react';
import { useWorkPlanStore } from '@/lib/state/work-plan-store';
import { useSquadStore } from '@/lib/state/squad-store';

export function useAutomaticSquadDetection() {
  const workPlans = useWorkPlanStore((s) => s.workPlans);
  const detectAutomaticSquads = useSquadStore((s) => s.detectAutomaticSquads);

  useEffect(() => {
    // Get active work plans with 2+ people allocated
    const taskAllocations = workPlans
      .filter((wp) => wp.status !== 'completed' && wp.status !== 'abandoned')
      .filter((wp) => wp.assignedMemberIds && wp.assignedMemberIds.length >= 2)
      .map((wp) => ({
        taskId: wp.id,
        taskTitle: wp.title,
        memberIds: wp.assignedMemberIds || [],
      }));

    // Update automatic squads
    detectAutomaticSquads(taskAllocations);
  }, [workPlans, detectAutomaticSquads]);
}
