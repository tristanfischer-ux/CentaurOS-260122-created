/**
 * Mission Control Logic
 * Computes Main Quest, Critical items, TU allocation, and recommendations
 */

import { TechNode, TechNodeProgress } from '@/lib/types/tech-tree-types';
import { TECH_TREE_NODES } from '@/lib/data/tech-tree-nodes';
import type { WorkPlan } from '@/lib/state/work-plan-store';

export interface MainQuest {
  node: TechNode;
  progress: TechNodeProgress;
  progressTU: number; // Completed TU
  totalTU: number; // Total research cost
  progressPercent: number;
  etaWeeks: number | null;
  allocatedTUPerWeek: number;
  blockers: QuestBlocker[];
  nextStep: NextStepAction | null;
}

export interface QuestBlocker {
  type: 'boss-gate' | 'prereq' | 'blocked-task';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface NextStepAction {
  type: 'task' | 'boss-gate' | 'prereq' | 'allocate';
  title: string;
  description: string;
  targetId?: string; // Task ID, node ID, etc.
  deepLink: string;
}

export interface CriticalItem {
  id: string;
  type: 'blocked-task' | 'at-risk-delivery' | 'pending-review';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  impact: string; // e.g., "6 TU blocked", "£15K at risk"
  deepLink: string;
  primaryCTA: string;
}

export interface TUAllocationSummary {
  totalAvailable: number;
  totalAllocated: number;
  blockedTU: number;
  mainQuestAllocation: number;
  remaining: number;
  topActiveTasks: Array<{
    id: string;
    title: string;
    ownerInitials: string;
    etaDays: number | null;
    tuAllocated: number;
  }>;
}

/**
 * Select the Main Quest from current node progress
 */
export function selectMainQuest(
  nodeProgress: Record<string, TechNodeProgress>,
  workPlans: WorkPlan[]
): MainQuest | null {
  // Find in-progress nodes
  const inProgressNodes = Object.entries(nodeProgress)
    .filter(([_, progress]) => progress.state === 'in-progress')
    .map(([nodeId, progress]) => ({
      node: TECH_TREE_NODES.find((n) => n.id === nodeId)!,
      progress,
    }))
    .filter((entry) => entry.node);

  let selectedNode: TechNode | undefined;
  let selectedProgress: TechNodeProgress | undefined;

  if (inProgressNodes.length > 0) {
    // Prioritize: most TU allocated, then most recently started
    const sorted = inProgressNodes.sort((a, b) => {
      const aTU = calculateAllocatedTU(a.node.id, workPlans);
      const bTU = calculateAllocatedTU(b.node.id, workPlans);
      if (aTU !== bTU) return bTU - aTU;

      const aTime = new Date(a.progress.taskPackStartedAt || 0).getTime();
      const bTime = new Date(b.progress.taskPackStartedAt || 0).getTime();
      return bTime - aTime;
    });

    selectedNode = sorted[0].node;
    selectedProgress = sorted[0].progress;
  } else {
    // Find best available node (first available node with no blockers)
    const availableNodes = Object.entries(nodeProgress)
      .filter(([_, progress]) => progress.state === 'available')
      .map(([nodeId, progress]) => ({
        node: TECH_TREE_NODES.find((n) => n.id === nodeId)!,
        progress,
      }))
      .filter((entry) => entry.node);

    if (availableNodes.length > 0) {
      // Prioritize main storyline nodes over side quests
      const mainNodes = availableNodes.filter((n) => n.node.type === 'main');
      const target = mainNodes.length > 0 ? mainNodes[0] : availableNodes[0];
      selectedNode = target.node;
      selectedProgress = target.progress;
    }
  }

  if (!selectedNode || !selectedProgress) return null;

  // Calculate progress
  const completedTasks = selectedProgress.completedTaskIds.length;
  const totalTasks = selectedNode.taskPack.tasks.length;
  const progressTU = selectedNode.taskPack.tasks
    .filter((t) => selectedProgress.completedTaskIds.includes(t.id))
    .reduce((sum, t) => sum + t.tuEstimate, 0);
  const totalTU = selectedNode.taskPack.totalTUEstimate;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate ETA
  const allocatedTUPerWeek = calculateAllocatedTU(selectedNode.id, workPlans);
  const remainingTU = totalTU - progressTU;
  const etaWeeks =
    allocatedTUPerWeek > 0 ? remainingTU / allocatedTUPerWeek : null;

  // Detect blockers
  const blockers = detectQuestBlockers(selectedNode, selectedProgress, nodeProgress);

  // Determine next step
  const nextStep = determineNextStep(selectedNode, selectedProgress, workPlans, blockers);

  return {
    node: selectedNode,
    progress: selectedProgress,
    progressTU,
    totalTU,
    progressPercent,
    etaWeeks,
    allocatedTUPerWeek,
    blockers,
    nextStep,
  };
}

/**
 * Calculate TU allocated to a specific node's tasks
 */
function calculateAllocatedTU(nodeId: string, workPlans: WorkPlan[]): number {
  // Sum TU from all work plans tagged to this node
  return workPlans
    .filter((wp) => wp.status === 'in-progress' && wp.linkedOKRTitle?.includes(nodeId))
    .reduce((sum, wp) => {
      const weeklyTU = (wp.allocations || []).reduce(
        (total, alloc) => total + (alloc.squaresPerWeek || 0),
        0
      );
      return sum + weeklyTU;
    }, 0);
}

/**
 * Detect blockers for the quest
 */
function detectQuestBlockers(
  node: TechNode,
  progress: TechNodeProgress,
  allNodeProgress: Record<string, TechNodeProgress>
): QuestBlocker[] {
  const blockers: QuestBlocker[] = [];

  // Check boss gate
  if (
    node.isBossGate &&
    progress.completedTaskIds.length === node.taskPack.tasks.length &&
    !progress.proofSubmitted?.length
  ) {
    blockers.push({
      type: 'boss-gate',
      title: 'Boss Gate Evidence Required',
      description: 'Submit proof to complete this milestone',
      severity: 'high',
    });
  }

  // Check prerequisites (shouldn't happen but safety check)
  const missingPrereqs = node.prerequisiteNodeIds.filter(
    (prereqId) => allNodeProgress[prereqId]?.state !== 'completed'
  );
  if (missingPrereqs.length > 0) {
    const prereqNode = TECH_TREE_NODES.find((n) => n.id === missingPrereqs[0]);
    blockers.push({
      type: 'prereq',
      title: `Prerequisite: ${prereqNode?.title || 'Unknown'}`,
      description: 'Complete prerequisite node first',
      severity: 'high',
    });
  }

  // Check for blocked tasks (simplified - would need task data)
  // For now, we'll skip this and implement when we have task blocking logic

  return blockers;
}

/**
 * Determine the next best action
 */
function determineNextStep(
  node: TechNode,
  progress: TechNodeProgress,
  workPlans: WorkPlan[],
  blockers: QuestBlocker[]
): NextStepAction | null {
  // If boss gate blocker exists, that's the next step
  const bossGateBlocker = blockers.find((b) => b.type === 'boss-gate');
  if (bossGateBlocker) {
    return {
      type: 'boss-gate',
      title: 'Submit Boss Gate Proof',
      description: 'Upload evidence to complete this milestone',
      targetId: node.id,
      deepLink: `/tech-tree/${node.id}`,
    };
  }

  // Find incomplete tasks
  const incompleteTasks = node.taskPack.tasks.filter(
    (t) => !progress.completedTaskIds.includes(t.id)
  );

  if (incompleteTasks.length === 0) {
    return {
      type: 'boss-gate',
      title: 'Complete Node',
      description: 'All tasks done - mark node as complete',
      targetId: node.id,
      deepLink: `/tech-tree/${node.id}`,
    };
  }

  // Find highest-impact incomplete task
  // Simple heuristic: highest TU estimate (proxy for impact)
  const nextTask = incompleteTasks.sort((a, b) => b.tuEstimate - a.tuEstimate)[0];

  return {
    type: 'task',
    title: nextTask.title,
    description: `${nextTask.tuEstimate} TU - ${nextTask.description}`,
    targetId: nextTask.id,
    deepLink: `/tech-tree/${node.id}`,
  };
}

/**
 * Get critical items requiring attention
 */
export function getCriticalItems(
  workPlans: WorkPlan[],
  // engagements: any[], // Would be from Make store
  // reviews: any[] // Would be from Evaluate store
): CriticalItem[] {
  const items: CriticalItem[] = [];

  // Find blocked tasks with high TU
  const blockedTasksWithTU = workPlans
    .filter((wp) => wp.status === 'blocked')
    .map((wp) => {
      const blockedTU = (wp.allocations || []).reduce(
        (sum, a) => sum + (a.squaresPerWeek || 0),
        0
      );

      const severity: 'critical' | 'high' | 'medium' = blockedTU > 5 ? 'critical' : blockedTU > 2 ? 'high' : 'medium';

      const item: CriticalItem = {
        id: wp.id,
        type: 'blocked-task',
        title: `Blocked: ${wp.title}`,
        description: wp.linkedOKRTitle || 'No description',
        severity,
        impact: `${blockedTU} TU blocked`,
        deepLink: '/do',
        primaryCTA: 'Resolve',
      };

      return { item, blockedTU };
    })
    .sort((a, b) => b.blockedTU - a.blockedTU);

  const blockedTasks = blockedTasksWithTU.map(({ item }) => item);

  items.push(...blockedTasks.slice(0, 1));

  // TODO: Add at-risk deliveries from Make
  // TODO: Add pending reviews from Evaluate

  return items.slice(0, 3);
}

/**
 * Calculate TU allocation summary
 */
export function calculateTUAllocation(
  members: any[],
  workPlans: WorkPlan[],
  mainQuestNodeId?: string
): TUAllocationSummary {
  // Calculate total available TU per week
  const totalAvailable = members
    .filter((m) => m.status === 'active')
    .reduce((sum, m) => {
      if (m.role === 'Founder') return sum + 10;
      if (m.role === 'FractionalExec') return sum + (m.daysPerWeek || 2) * 2;
      return sum + 10; // Apprentice
    }, 0);

  // Calculate allocated TU
  const totalAllocated = workPlans
    .filter((wp) => wp.status === 'in-progress')
    .reduce((sum, wp) => {
      const weeklyTU = (wp.allocations || []).reduce(
        (total, alloc) => total + (alloc.squaresPerWeek || 0),
        0
      );
      return sum + weeklyTU;
    }, 0);

  // Calculate blocked TU
  const blockedTU = workPlans
    .filter((wp) => wp.status === 'blocked')
    .reduce((sum, wp) => {
      const weeklyTU = (wp.allocations || []).reduce(
        (total, alloc) => total + (alloc.squaresPerWeek || 0),
        0
      );
      return sum + weeklyTU;
    }, 0);

  // Calculate main quest allocation
  const mainQuestAllocation = mainQuestNodeId
    ? calculateAllocatedTU(mainQuestNodeId, workPlans)
    : 0;

  // Get top active tasks
  const topActiveTasks = workPlans
    .filter((wp) => wp.status === 'in-progress')
    .map((wp) => {
      const tuAllocated = (wp.allocations || []).reduce(
        (sum, a) => sum + (a.squaresPerWeek || 0),
        0
      );
      const ownerInitials =
        members.find((m: any) => m.id === wp.allocations?.[0]?.memberId)?.name
          ?.split(' ')
          .map((n: string) => n[0])
          .join('') || '??';

      // Calculate days to completion (matches Decide tab logic)
      const etaDays =
        tuAllocated > 0 && wp.estimatedTimeUnits
          ? Math.ceil((wp.estimatedTimeUnits / tuAllocated)) * 5 // weeks * 5 working days
          : null;

      return {
        id: wp.id,
        title: wp.title,
        ownerInitials,
        etaDays,
        tuAllocated,
      };
    })
    // Sort by days to completion (shortest first) - matches Decide tab
    .sort((a, b) => {
      // If no ETA, push to end
      if (a.etaDays === null) return 1;
      if (b.etaDays === null) return -1;
      return a.etaDays - b.etaDays;
    })
    .slice(0, 5);

  return {
    totalAvailable,
    totalAllocated,
    blockedTU,
    mainQuestAllocation,
    remaining: totalAvailable - totalAllocated,
    topActiveTasks,
  };
}

/**
 * Get company health metrics
 */
export interface CompanyHealth {
  runwayMonths: number | null;
  netFlowMonthly: number;
  burnMonthly: number;
  cashAtRisk: number;
  okrsOnTrack: number;
  okrsTotal: number;
}

export function calculateCompanyHealth(
  financials: any,
  // engagements: any[],
  okrs: any[]
): CompanyHealth {
  const runwayMonths =
    financials?.totalCash && financials?.burnPerMonth
      ? financials.totalCash / financials.burnPerMonth
      : null;

  const netFlowMonthly = (financials?.revenuePerMonth || 0) - (financials?.burnPerMonth || 0);
  const burnMonthly = financials?.burnPerMonth || 0;

  // TODO: Calculate from Make engagements
  const cashAtRisk = 0;

  // Count on-track OKRs (simplified)
  const okrsOnTrack = okrs.filter((okr) => okr.status === 'on-track' || okr.status === 'completed').length;
  const okrsTotal = okrs.length;

  return {
    runwayMonths,
    netFlowMonthly,
    burnMonthly,
    cashAtRisk,
    okrsOnTrack,
    okrsTotal,
  };
}
