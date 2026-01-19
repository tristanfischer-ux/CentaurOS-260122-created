/**
 * AI-Powered Priority Scoring System
 * Identifies the most critical tasks for "Focus Today" section
 */

import type { WorkPlan } from './state/work-plan-store';
import type { OrganizationMember } from './organization-seed';
import { getAvailableTUsForMemberInWeek, getWeekStart } from './task-scheduling';

export type PriorityLevel = 'critical' | 'high' | 'important' | 'normal';

export interface PriorityScore {
  task: WorkPlan;
  totalScore: number; // 0-100
  level: PriorityLevel;
  factors: {
    deadlineUrgency: number;    // 0-25 points
    blockingOthers: number;     // 0-25 points
    businessImpact: number;     // 0-20 points
    riskAndStatus: number;      // 0-15 points
    resourceAvailability: number; // 0-15 points
  };
  reasoning: string; // AI-generated explanation
  actionLabel: string; // "Finish Report", "Unblock Team", etc.
  actionType: 'complete' | 'unblock' | 'assign' | 'start';
}

/**
 * Calculate deadline urgency score (0-25 points)
 */
function calculateDeadlineUrgency(task: WorkPlan): { score: number; reason: string } {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return { score: 25, reason: `Overdue by ${Math.abs(daysUntilDue)} days` };
  } else if (daysUntilDue === 0) {
    return { score: 25, reason: 'Due today' };
  } else if (daysUntilDue === 1) {
    return { score: 23, reason: 'Due tomorrow' };
  } else if (daysUntilDue <= 3) {
    return { score: 20, reason: `Due in ${daysUntilDue} days` };
  } else if (daysUntilDue <= 7) {
    return { score: 15, reason: `Due this week (${daysUntilDue} days)` };
  } else if (daysUntilDue <= 14) {
    return { score: 10, reason: `Due next week (${daysUntilDue} days)` };
  } else if (daysUntilDue <= 30) {
    return { score: 5, reason: `Due this month (${daysUntilDue} days)` };
  }

  return { score: 0, reason: `Due in ${daysUntilDue} days` };
}

/**
 * Calculate blocking others score (0-25 points)
 */
function calculateBlockingOthers(task: WorkPlan, allTasks: WorkPlan[]): { score: number; reason: string } {
  // Count how many other tasks are blocked by this one
  // In a real implementation, you'd have explicit task dependencies
  // For now, we'll use heuristics:
  // - Tasks in the same function with later start dates
  // - Tasks with team members waiting

  const blockedCount = task.allocations.length > 0 ? task.allocations.length : 0;
  const isBlocked = task.status === 'blocked';

  if (isBlocked && blockedCount >= 3) {
    return { score: 25, reason: `Blocking ${blockedCount} team members` };
  } else if (isBlocked && blockedCount >= 2) {
    return { score: 20, reason: `Blocking ${blockedCount} team members` };
  } else if (isBlocked && blockedCount >= 1) {
    return { score: 15, reason: `Blocking ${blockedCount} team member` };
  } else if (task.allocations.length >= 3) {
    return { score: 10, reason: `${task.allocations.length} team members waiting to work on this` };
  } else if (task.allocations.length >= 2) {
    return { score: 5, reason: `${task.allocations.length} team members assigned` };
  }

  return { score: 0, reason: 'Not blocking others' };
}

/**
 * Calculate business impact score (0-20 points)
 */
function calculateBusinessImpact(task: WorkPlan): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Check if linked to OKR
  if (task.linkedOKRTitle) {
    score += 10;
    reasons.push(`Linked to key objective: ${task.linkedOKRTitle}`);
  }

  // Check function criticality
  if (task.function === 'Sales' || task.function === 'Engineering') {
    score += 5;
    reasons.push('Critical business function');
  }

  // Check TU size (bigger projects = more impact)
  if (task.estimatedTimeUnits >= 50) {
    score += 5;
    reasons.push('Major project');
  } else if (task.estimatedTimeUnits >= 30) {
    score += 3;
  }

  return {
    score: Math.min(score, 20),
    reason: reasons.length > 0 ? reasons.join('. ') : 'Standard business task',
  };
}

/**
 * Calculate risk and status score (0-15 points)
 */
function calculateRiskAndStatus(task: WorkPlan): { score: number; reason: string } {
  const reasons: string[] = [];
  let score = 0;

  // Status-based scoring
  if (task.status === 'blocked') {
    score += 15;
    reasons.push('Currently blocked - needs immediate attention');
  } else if (task.status === 'in-progress') {
    // Check progress vs. time elapsed
    const startDate = new Date(task.startDate);
    const dueDate = new Date(task.dueDate);
    const now = new Date();

    const totalDuration = dueDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    if (task.progress < expectedProgress - 20) {
      score += 12;
      reasons.push(`Behind schedule - ${Math.round(task.progress)}% complete, expected ${Math.round(expectedProgress)}%`);
    } else if (task.progress < expectedProgress - 10) {
      score += 8;
      reasons.push('Slightly behind schedule');
    } else if (task.progress >= 80) {
      score += 10;
      reasons.push(`Almost done - ${Math.round(task.progress)}% complete`);
    } else {
      score += 5;
      reasons.push('In progress');
    }
  } else if (task.status === 'not-started') {
    const startDate = new Date(task.startDate);
    const now = new Date();
    if (startDate <= now) {
      score += 10;
      reasons.push('Scheduled to start - not yet begun');
    } else {
      score += 3;
      reasons.push('Not yet started');
    }
  }

  return { score: Math.min(score, 15), reason: reasons.join('. ') || 'Normal status' };
}

/**
 * Calculate resource availability score (0-15 points)
 */
function calculateResourceAvailability(
  task: WorkPlan,
  teamMembers: OrganizationMember[],
  allTasks: WorkPlan[]
): { score: number; reason: string } {
  if (task.allocations.length === 0) {
    return { score: 0, reason: 'No team assigned yet' };
  }

  const today = getWeekStart(new Date());
  let totalAvailable = 0;
  let totalRequired = 0;

  for (const allocation of task.allocations) {
    const member = teamMembers.find(m => m.id === allocation.memberId);
    if (member) {
      const available = getAvailableTUsForMemberInWeek(member, today, allTasks);
      totalAvailable += available;
      totalRequired += allocation.squaresPerWeek;
    }
  }

  const availabilityRatio = totalRequired > 0 ? totalAvailable / totalRequired : 0;

  if (availabilityRatio >= 1) {
    return { score: 15, reason: 'Team has full capacity available this week' };
  } else if (availabilityRatio >= 0.75) {
    return { score: 12, reason: 'Team has capacity to make good progress' };
  } else if (availabilityRatio >= 0.5) {
    return { score: 8, reason: 'Team has partial capacity this week' };
  } else if (availabilityRatio > 0) {
    return { score: 5, reason: 'Team has limited capacity this week' };
  }

  return { score: 0, reason: 'Team is at full capacity' };
}

/**
 * Generate AI reasoning for priority task
 */
function generateReasoning(
  task: WorkPlan,
  factors: PriorityScore['factors'],
  deadlineReason: string,
  blockingReason: string,
  impactReason: string,
  riskReason: string,
  resourceReason: string
): string {
  const reasons: string[] = [];

  // Prioritize most important reasons
  if (factors.deadlineUrgency >= 20) {
    reasons.push(deadlineReason);
  }

  if (factors.blockingOthers >= 15) {
    reasons.push(blockingReason);
  }

  if (factors.riskAndStatus >= 10) {
    reasons.push(riskReason);
  }

  if (factors.businessImpact >= 10) {
    reasons.push(impactReason);
  }

  if (factors.resourceAvailability >= 12) {
    reasons.push(resourceReason);
  }

  // Add progress if in-progress
  if (task.status === 'in-progress' && task.progress > 0) {
    reasons.push(`Currently ${Math.round(task.progress)}% complete`);
  }

  return reasons.join('. ') + '.';
}

/**
 * Determine action label and type
 */
function determineAction(task: WorkPlan): { label: string; type: PriorityScore['actionType'] } {
  if (task.status === 'blocked') {
    return { label: 'Unblock Task', type: 'unblock' };
  } else if (task.allocations.length === 0) {
    return { label: 'Assign Team', type: 'assign' };
  } else if (task.status === 'not-started') {
    return { label: 'Start Task', type: 'start' };
  } else if (task.progress >= 70) {
    return { label: 'Finish Task', type: 'complete' };
  }

  return { label: 'View Details', type: 'complete' };
}

/**
 * Calculate full priority score for a task
 */
export function calculatePriorityScore(
  task: WorkPlan,
  allTasks: WorkPlan[],
  teamMembers: OrganizationMember[]
): PriorityScore {
  const deadlineResult = calculateDeadlineUrgency(task);
  const blockingResult = calculateBlockingOthers(task, allTasks);
  const impactResult = calculateBusinessImpact(task);
  const riskResult = calculateRiskAndStatus(task);
  const resourceResult = calculateResourceAvailability(task, teamMembers, allTasks);

  const factors = {
    deadlineUrgency: deadlineResult.score,
    blockingOthers: blockingResult.score,
    businessImpact: impactResult.score,
    riskAndStatus: riskResult.score,
    resourceAvailability: resourceResult.score,
  };

  const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);

  // Determine priority level
  let level: PriorityLevel;
  if (totalScore >= 75) {
    level = 'critical';
  } else if (totalScore >= 60) {
    level = 'high';
  } else if (totalScore >= 40) {
    level = 'important';
  } else {
    level = 'normal';
  }

  const reasoning = generateReasoning(
    task,
    factors,
    deadlineResult.reason,
    blockingResult.reason,
    impactResult.reason,
    riskResult.reason,
    resourceResult.reason
  );

  const action = determineAction(task);

  return {
    task,
    totalScore,
    level,
    factors,
    reasoning,
    actionLabel: action.label,
    actionType: action.type,
  };
}

/**
 * Get top priority tasks for "Focus Today" section
 */
export function getFocusTodayTasks(
  allTasks: WorkPlan[],
  teamMembers: OrganizationMember[],
  limit: number = 5
): PriorityScore[] {
  // Filter out completed and abandoned tasks
  const activeTasks = allTasks.filter(
    t => t.status !== 'completed' && t.status !== 'abandoned'
  );

  // Calculate scores for all active tasks
  const scoredTasks = activeTasks.map(task =>
    calculatePriorityScore(task, allTasks, teamMembers)
  );

  // Sort by score (highest first) and take top N
  return scoredTasks
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit)
    .filter(t => t.totalScore >= 30); // Only show tasks with meaningful priority
}
