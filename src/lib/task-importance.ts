/**
 * Task Importance Scoring System
 * Calculates importance based on TU requirements, deadlines, and business impact
 */

import type { WorkPlan } from '@/lib/state/work-plan-store';

export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ImportanceScore {
  score: number; // 0-100
  level: ImportanceLevel;
  label: string;
  color: string;
  bgColor: string;
  factors: {
    tuSize: number;
    deadline: number;
    progress: number;
    status: number;
  };
}

/**
 * Calculate importance score for a task
 * Score is 0-100 based on multiple factors
 */
export function calculateTaskImportance(task: WorkPlan): ImportanceScore {
  let score = 0;
  const factors = {
    tuSize: 0,
    deadline: 0,
    progress: 0,
    status: 0,
  };

  // 1. TU Size (0-40 points) - Primary factor
  // More TUs = more important project
  const tuSize = task.estimatedTimeUnits || 0;
  if (tuSize >= 50) {
    factors.tuSize = 40; // Major project
  } else if (tuSize >= 30) {
    factors.tuSize = 30; // Significant project
  } else if (tuSize >= 15) {
    factors.tuSize = 20; // Medium project
  } else if (tuSize >= 5) {
    factors.tuSize = 10; // Small project
  } else {
    factors.tuSize = 5; // Tiny task
  }

  // 2. Deadline Urgency (0-30 points)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      factors.deadline = 30; // Overdue
    } else if (daysUntilDue <= 3) {
      factors.deadline = 25; // Due very soon
    } else if (daysUntilDue <= 7) {
      factors.deadline = 20; // Due this week
    } else if (daysUntilDue <= 14) {
      factors.deadline = 15; // Due in 2 weeks
    } else if (daysUntilDue <= 30) {
      factors.deadline = 10; // Due this month
    } else {
      factors.deadline = 5; // Due later
    }
  }

  // 3. Progress/Completion Status (0-20 points)
  // Tasks that are started and making progress are more important (need to be finished)
  if (task.status === 'in-progress') {
    if (task.progress >= 50) {
      factors.progress = 20; // Almost done, important to finish
    } else if (task.progress >= 25) {
      factors.progress = 15; // Good progress
    } else {
      factors.progress = 10; // Just started
    }
  } else if (task.status === 'blocked') {
    factors.progress = 15; // Blocked tasks need attention
  } else if (task.status === 'not-started') {
    factors.progress = 5; // Not started yet
  }

  // 4. Status Criticality (0-10 points)
  if (task.status === 'blocked') {
    factors.status = 10; // Blocked = critical to unblock
  } else if (task.status === 'in-progress') {
    factors.status = 8; // In progress = keep momentum
  } else if (task.status === 'not-started') {
    factors.status = 5; // Not started
  }

  // Calculate total score
  score = factors.tuSize + factors.deadline + factors.progress + factors.status;

  // Determine level and styling
  let level: ImportanceLevel;
  let label: string;
  let color: string;
  let bgColor: string;

  if (score >= 70) {
    level = 'critical';
    label = 'Critical';
    color = '#ef4444'; // red-500
    bgColor = '#fee2e2'; // red-100
  } else if (score >= 50) {
    level = 'high';
    label = 'High';
    color = '#f97316'; // orange-500
    bgColor = '#ffedd5'; // orange-100
  } else if (score >= 30) {
    level = 'medium';
    label = 'Medium';
    color = '#eab308'; // yellow-500
    bgColor = '#fef9c3'; // yellow-100
  } else {
    level = 'low';
    label = 'Low';
    color = '#64748b'; // slate-500
    bgColor = '#f1f5f9'; // slate-100
  }

  return {
    score,
    level,
    label,
    color,
    bgColor,
    factors,
  };
}

/**
 * Sort tasks by importance score (descending)
 */
export function sortTasksByImportance(tasks: WorkPlan[]): WorkPlan[] {
  return [...tasks].sort((a, b) => {
    const scoreA = calculateTaskImportance(a).score;
    const scoreB = calculateTaskImportance(b).score;
    return scoreB - scoreA;
  });
}

/**
 * Get importance icon size based on level
 */
export function getImportanceBadgeSize(level: ImportanceLevel): { width: number; height: number } {
  switch (level) {
    case 'critical':
      return { width: 24, height: 24 };
    case 'high':
      return { width: 20, height: 20 };
    case 'medium':
      return { width: 16, height: 16 };
    case 'low':
      return { width: 14, height: 14 };
  }
}
