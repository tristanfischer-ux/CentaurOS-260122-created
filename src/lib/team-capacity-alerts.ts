// Team Capacity Alerts System
// Monitors team workload and generates alerts for overload conditions

import type { Task, Membership } from '@/types';

export interface CapacityAlert {
  level: 'info' | 'warning' | 'critical';
  memberId: string;
  memberName: string;
  tasksCount: number;
  threshold: number;
  message: string;
  recommendation: string;
}

export interface TeamCapacityReport {
  totalMembers: number;
  overloadedMembers: number;
  atRiskMembers: number;
  averageTasksPerMember: number;
  alerts: CapacityAlert[];
  healthStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * Task load thresholds per team member
 */
const CAPACITY_THRESHOLDS = {
  HEALTHY: 5,      // 0-5 tasks = healthy
  WARNING: 10,     // 6-10 tasks = at risk
  CRITICAL: 15,    // 10+ tasks = overloaded
};

/**
 * Analyze team capacity and generate alerts
 */
export function analyzeTeamCapacity(
  tasks: Task[],
  members: Membership[],
  users: Record<string, any>
): TeamCapacityReport {
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const alerts: CapacityAlert[] = [];

  // Calculate tasks per member
  const tasksByMember: Record<string, Task[]> = {};

  members.forEach(member => {
    tasksByMember[member.userId] = activeTasks.filter(t => t.assigneeId === member.userId);
  });

  // Generate alerts for each member
  let overloadedCount = 0;
  let atRiskCount = 0;

  members.forEach(member => {
    const memberTasks = tasksByMember[member.userId] || [];
    const taskCount = memberTasks.length;
    const user = users[member.userId];
    const memberName = user?.name || 'Unknown';

    if (taskCount > CAPACITY_THRESHOLDS.CRITICAL) {
      overloadedCount++;
      alerts.push({
        level: 'critical',
        memberId: member.userId,
        memberName,
        tasksCount: taskCount,
        threshold: CAPACITY_THRESHOLDS.CRITICAL,
        message: `${memberName} is severely overloaded with ${taskCount} active tasks`,
        recommendation: 'Immediately redistribute tasks or extend deadlines',
      });
    } else if (taskCount > CAPACITY_THRESHOLDS.WARNING) {
      atRiskCount++;
      alerts.push({
        level: 'warning',
        memberId: member.userId,
        memberName,
        tasksCount: taskCount,
        threshold: CAPACITY_THRESHOLDS.WARNING,
        message: `${memberName} is approaching capacity with ${taskCount} active tasks`,
        recommendation: 'Monitor closely and avoid adding more tasks',
      });
    } else if (taskCount > CAPACITY_THRESHOLDS.HEALTHY) {
      atRiskCount++;
      alerts.push({
        level: 'info',
        memberId: member.userId,
        memberName,
        tasksCount: taskCount,
        threshold: CAPACITY_THRESHOLDS.HEALTHY,
        message: `${memberName} has ${taskCount} active tasks`,
        recommendation: 'Workload is manageable but close to limit',
      });
    }
  });

  // Calculate averages
  const averageTasksPerMember = members.length > 0
    ? activeTasks.length / members.length
    : 0;

  // Determine overall health
  let healthStatus: TeamCapacityReport['healthStatus'];
  if (overloadedCount > 0 || averageTasksPerMember > CAPACITY_THRESHOLDS.WARNING) {
    healthStatus = 'critical';
  } else if (atRiskCount > 0 || averageTasksPerMember > CAPACITY_THRESHOLDS.HEALTHY) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'healthy';
  }

  // Sort alerts by severity
  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.level] - severityOrder[b.level];
  });

  return {
    totalMembers: members.length,
    overloadedMembers: overloadedCount,
    atRiskMembers: atRiskCount,
    averageTasksPerMember,
    alerts,
    healthStatus,
  };
}

/**
 * Get alert color scheme
 */
export function getAlertColor(level: CapacityAlert['level']): {
  bg: string;
  text: string;
  hex: string;
} {
  switch (level) {
    case 'info':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', hex: '#3b82f6' };
    case 'warning':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hex: '#eab308' };
    case 'critical':
      return { bg: 'bg-red-500/20', text: 'text-red-400', hex: '#ef4444' };
  }
}

/**
 * Get capacity health color
 */
export function getCapacityHealthColor(status: TeamCapacityReport['healthStatus']): {
  bg: string;
  text: string;
  hex: string;
} {
  switch (status) {
    case 'healthy':
      return { bg: 'bg-green-500/20', text: 'text-green-400', hex: '#10b981' };
    case 'warning':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', hex: '#eab308' };
    case 'critical':
      return { bg: 'bg-red-500/20', text: 'text-red-400', hex: '#ef4444' };
  }
}

/**
 * Generate executive summary for capacity report
 */
export function getCapacitySummary(report: TeamCapacityReport): string {
  if (report.healthStatus === 'critical') {
    return `Critical: ${report.overloadedMembers} team members severely overloaded. Immediate action required.`;
  } else if (report.healthStatus === 'warning') {
    return `Warning: ${report.atRiskMembers} team members approaching capacity. Monitor workload distribution.`;
  } else {
    return `Team capacity is healthy. Average ${report.averageTasksPerMember.toFixed(1)} tasks per member.`;
  }
}
