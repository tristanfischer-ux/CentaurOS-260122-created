/**
 * Task Delay Tracker
 * Utilities for detecting and visualizing task delays and timeline overruns
 */

import type { WorkPlan, TimelineExtension } from './state/work-plan-store';

export interface DelayInfo {
  isDelayed: boolean;
  delayDays: number;
  delayPercentage: number;      // Percentage over original timeline
  originalEndDate: Date | null;
  currentEndDate: Date | null;
  tuOverrun: number;            // Additional TUs beyond original
  tuOverrunPercentage: number;  // Percentage over original TUs
  severity: 'none' | 'minor' | 'moderate' | 'severe';
}

/**
 * Calculate if a task is past its original due date
 */
export function isTaskDelayed(task: WorkPlan): boolean {
  const originalEnd = task.originalDueDate || task.dueDate;
  const currentEnd = task.dueDate;

  if (!originalEnd || !currentEnd) return false;

  const originalDate = new Date(originalEnd);
  const currentDate = new Date(currentEnd);

  return currentDate > originalDate;
}

/**
 * Calculate the number of days a task is delayed
 */
export function getDelayDays(task: WorkPlan): number {
  const originalEnd = task.originalDueDate || task.dueDate;
  const currentEnd = task.dueDate;

  if (!originalEnd || !currentEnd) return 0;

  const originalDate = new Date(originalEnd);
  const currentDate = new Date(currentEnd);

  const diffMs = currentDate.getTime() - originalDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate TU overrun
 */
export function getTUOverrun(task: WorkPlan): number {
  const originalTUs = task.originalEstimatedTimeUnits ?? task.estimatedTimeUnits;
  const currentTUs = task.estimatedTimeUnits;

  return Math.max(0, currentTUs - originalTUs);
}

/**
 * Get comprehensive delay information for a task
 */
export function getDelayInfo(task: WorkPlan): DelayInfo {
  const originalEnd = task.originalDueDate || task.dueDate;
  const currentEnd = task.dueDate;
  const originalTUs = task.originalEstimatedTimeUnits ?? task.estimatedTimeUnits;
  const currentTUs = task.estimatedTimeUnits;

  const originalEndDate = originalEnd ? new Date(originalEnd) : null;
  const currentEndDate = currentEnd ? new Date(currentEnd) : null;

  let delayDays = 0;
  let delayPercentage = 0;

  if (originalEndDate && currentEndDate) {
    delayDays = Math.max(0, Math.ceil((currentEndDate.getTime() - originalEndDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate delay as percentage of original duration
    const startDate = task.startDate ? new Date(task.startDate) : null;
    if (startDate && originalEndDate) {
      const originalDuration = originalEndDate.getTime() - startDate.getTime();
      if (originalDuration > 0) {
        const delayMs = currentEndDate.getTime() - originalEndDate.getTime();
        delayPercentage = Math.round((delayMs / originalDuration) * 100);
      }
    }
  }

  const tuOverrun = Math.max(0, currentTUs - originalTUs);
  const tuOverrunPercentage = originalTUs > 0 ? Math.round((tuOverrun / originalTUs) * 100) : 0;

  const isDelayed = delayDays > 0 || tuOverrun > 0;

  // Determine severity based on percentage over original
  let severity: DelayInfo['severity'] = 'none';
  const maxOverrunPct = Math.max(delayPercentage, tuOverrunPercentage);

  if (maxOverrunPct > 0 && maxOverrunPct <= 25) {
    severity = 'minor';
  } else if (maxOverrunPct > 25 && maxOverrunPct <= 50) {
    severity = 'moderate';
  } else if (maxOverrunPct > 50) {
    severity = 'severe';
  }

  return {
    isDelayed,
    delayDays,
    delayPercentage,
    originalEndDate,
    currentEndDate,
    tuOverrun,
    tuOverrunPercentage,
    severity,
  };
}

/**
 * Get delay severity color based on overrun percentage
 */
export function getDelaySeverityColor(severity: DelayInfo['severity']): {
  bg: string;
  text: string;
  border: string;
  bar: string;
} {
  switch (severity) {
    case 'minor':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-400 dark:border-amber-600',
        bar: '#f59e0b', // amber-500
      };
    case 'moderate':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-400 dark:border-orange-600',
        bar: '#f97316', // orange-500
      };
    case 'severe':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-400 dark:border-red-600',
        bar: '#ef4444', // red-500
      };
    default:
      return {
        bg: '',
        text: '',
        border: '',
        bar: 'transparent',
      };
  }
}

/**
 * Format delay for display (e.g., "+3 days" or "+2 TUs")
 */
export function formatDelay(delayInfo: DelayInfo): string {
  const parts: string[] = [];

  if (delayInfo.delayDays > 0) {
    parts.push(`+${delayInfo.delayDays}d`);
  }

  if (delayInfo.tuOverrun > 0) {
    parts.push(`+${delayInfo.tuOverrun} TU`);
  }

  return parts.join(' / ') || '';
}

/**
 * Format detailed delay description
 */
export function formatDelayDescription(delayInfo: DelayInfo): string {
  const parts: string[] = [];

  if (delayInfo.delayDays > 0) {
    parts.push(`${delayInfo.delayDays} day${delayInfo.delayDays > 1 ? 's' : ''} over original deadline`);
  }

  if (delayInfo.tuOverrun > 0) {
    parts.push(`${delayInfo.tuOverrun} TU${delayInfo.tuOverrun > 1 ? 's' : ''} over original estimate`);
  }

  return parts.join(', ') || 'On track';
}

/**
 * Create a timeline extension record
 */
export function createTimelineExtension(
  previousDueDate: string,
  newDueDate: string,
  additionalTUs: number,
  reason?: string
): TimelineExtension {
  return {
    extendedAt: new Date().toISOString(),
    previousDueDate,
    newDueDate,
    additionalTUs,
    reason,
  };
}

/**
 * Check if task should have its original values frozen
 * (freeze when task moves from not-started to in-progress)
 */
export function shouldFreezeOriginalTimeline(
  previousStatus: WorkPlan['status'],
  newStatus: WorkPlan['status']
): boolean {
  return previousStatus === 'not-started' && newStatus === 'in-progress';
}

/**
 * Get the original timeline dates for display
 */
export function getOriginalTimeline(task: WorkPlan): {
  originalStart: string;
  originalEnd: string;
  originalTUs: number;
} {
  return {
    originalStart: task.startDate,
    originalEnd: task.originalDueDate || task.dueDate,
    originalTUs: task.originalEstimatedTimeUnits ?? task.estimatedTimeUnits,
  };
}
