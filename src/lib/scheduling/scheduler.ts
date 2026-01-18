/**
 * Scheduling Engine
 * Pure functions for capacity-aware task scheduling
 *
 * Rules:
 * - Each task requires minimum 1 TU
 * - Each user has weekly capacity (default 10)
 * - If week full, overflow to next week
 * - If due date can't be met, set risk flag
 * - Deterministic (same inputs → same outputs)
 */

import { startOfWeek, addWeeks, parseISO, formatISO, isAfter, isBefore } from 'date-fns';

const DEFAULT_TIMEZONE = 'Europe/London';
const DEFAULT_CAPACITY = 10;

// ============================================================================
// TYPES
// ============================================================================

export interface TaskToSchedule {
  id: string;
  assignee_user_id: string;
  units: number; // TUs required
  start_iso: string; // ISO 8601
  due_iso?: string | null; // ISO 8601 or null
}

export interface UserCapacityRecord {
  user_id: string;
  week_start_iso: string; // ISO 8601 date (Monday)
  capacity_units: number;
}

export interface TaskAllocation {
  task_id: string;
  user_id: string;
  week_start_iso: string; // ISO 8601 date (Monday)
  units: number;
}

export interface ScheduleResult {
  allocations: TaskAllocation[];
  risks: {
    task_id: string;
    reason: string;
  }[];
}

// ============================================================================
// WEEK UTILITIES
// ============================================================================

/**
 * Get the Monday (week start) for a given date
 * Note: timezone parameter kept for API compatibility but uses local timezone
 */
export function getWeekStart(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(dateObj, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Format week start as ISO date string (YYYY-MM-DD)
 */
export function formatWeekStart(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

/**
 * Get next week's Monday
 */
export function getNextWeek(weekStart: Date): Date {
  return addWeeks(weekStart, 1);
}

// ============================================================================
// CAPACITY MANAGEMENT
// ============================================================================

/**
 * Get or create capacity record for user/week
 */
export function getOrCreateCapacity(
  userId: string,
  weekStart: Date,
  existingCapacity: UserCapacityRecord[]
): UserCapacityRecord {
  const weekStartStr = formatWeekStart(weekStart);

  const existing = existingCapacity.find(
    c => c.user_id === userId && c.week_start_iso === weekStartStr
  );

  if (existing) {
    return existing;
  }

  // Create default capacity
  return {
    user_id: userId,
    week_start_iso: weekStartStr,
    capacity_units: DEFAULT_CAPACITY,
  };
}

/**
 * Calculate remaining capacity for a user in a week
 */
export function getRemainingCapacity(
  userId: string,
  weekStart: Date,
  existingCapacity: UserCapacityRecord[],
  existingAllocations: TaskAllocation[]
): number {
  const weekStartStr = formatWeekStart(weekStart);

  // Get total capacity
  const capacity = getOrCreateCapacity(userId, weekStart, existingCapacity);

  // Sum allocated units for this user/week
  const allocated = existingAllocations
    .filter(a => a.user_id === userId && a.week_start_iso === weekStartStr)
    .reduce((sum, a) => sum + a.units, 0);

  return capacity.capacity_units - allocated;
}

// ============================================================================
// TASK ALLOCATION
// ============================================================================

/**
 * Allocate a single task to weeks based on capacity
 * Returns allocations and risk flag if deadline can't be met
 */
export function allocateTask(
  task: TaskToSchedule,
  existingCapacity: UserCapacityRecord[],
  existingAllocations: TaskAllocation[],
  timezone: string = DEFAULT_TIMEZONE
): {
  allocations: TaskAllocation[];
  riskFlag: boolean;
  riskReason?: string;
} {
  const allocations: TaskAllocation[] = [];
  let remainingUnits = task.units;
  let currentWeek = getWeekStart(task.start_iso, timezone);
  const dueDate = task.due_iso ? parseISO(task.due_iso) : null;

  // Allocate week by week until all units allocated
  while (remainingUnits > 0) {
    const available = getRemainingCapacity(
      task.assignee_user_id,
      currentWeek,
      existingCapacity,
      [...existingAllocations, ...allocations] // Include newly created allocations
    );

    if (available > 0) {
      const toAllocate = Math.min(remainingUnits, available);

      allocations.push({
        task_id: task.id,
        user_id: task.assignee_user_id,
        week_start_iso: formatWeekStart(currentWeek),
        units: toAllocate,
      });

      remainingUnits -= toAllocate;
    }

    // Check if we've exceeded due date
    if (dueDate && remainingUnits > 0) {
      const weekEnd = addWeeks(currentWeek, 1);
      if (isAfter(weekEnd, dueDate)) {
        // Continue allocating but flag as risk
        return {
          allocations: [...allocations, ...allocateRemainingUnits(
            task,
            remainingUnits,
            getNextWeek(currentWeek),
            existingCapacity,
            [...existingAllocations, ...allocations]
          )],
          riskFlag: true,
          riskReason: `Task scheduled beyond due date (${task.due_iso})`,
        };
      }
    }

    currentWeek = getNextWeek(currentWeek);

    // Safety: prevent infinite loop (max 52 weeks)
    if (allocations.length > 52) {
      return {
        allocations,
        riskFlag: true,
        riskReason: 'Task requires more than 52 weeks to complete',
      };
    }
  }

  return {
    allocations,
    riskFlag: false,
  };
}

/**
 * Helper: allocate remaining units across weeks
 */
function allocateRemainingUnits(
  task: TaskToSchedule,
  remainingUnits: number,
  startWeek: Date,
  existingCapacity: UserCapacityRecord[],
  existingAllocations: TaskAllocation[]
): TaskAllocation[] {
  const allocations: TaskAllocation[] = [];
  let remaining = remainingUnits;
  let currentWeek = startWeek;

  while (remaining > 0 && allocations.length < 52) {
    const available = getRemainingCapacity(
      task.assignee_user_id,
      currentWeek,
      existingCapacity,
      [...existingAllocations, ...allocations]
    );

    if (available > 0) {
      const toAllocate = Math.min(remaining, available);
      allocations.push({
        task_id: task.id,
        user_id: task.assignee_user_id,
        week_start_iso: formatWeekStart(currentWeek),
        units: toAllocate,
      });
      remaining -= toAllocate;
    }

    currentWeek = getNextWeek(currentWeek);
  }

  return allocations;
}

// ============================================================================
// BATCH SCHEDULING
// ============================================================================

/**
 * Schedule multiple tasks deterministically
 * Tasks with explicit start dates are scheduled in chronological order
 * Tasks with no start date are scheduled after explicit ones
 */
export function scheduleConfirmedTasks(
  tasks: TaskToSchedule[],
  existingCapacity: UserCapacityRecord[],
  existingAllocations: TaskAllocation[],
  timezone: string = DEFAULT_TIMEZONE
): ScheduleResult {
  // Sort tasks: by start date (earliest first), then by ID (deterministic)
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = parseISO(a.start_iso);
    const dateB = parseISO(b.start_iso);

    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    return a.id.localeCompare(b.id); // Deterministic tie-breaker
  });

  const allAllocations: TaskAllocation[] = [...existingAllocations];
  const risks: { task_id: string; reason: string }[] = [];

  for (const task of sortedTasks) {
    const result = allocateTask(task, existingCapacity, allAllocations, timezone);

    allAllocations.push(...result.allocations);

    if (result.riskFlag && result.riskReason) {
      risks.push({
        task_id: task.id,
        reason: result.riskReason,
      });
    }
  }

  // Return only new allocations (not including existing ones)
  const newAllocations = allAllocations.slice(existingAllocations.length);

  return {
    allocations: newAllocations,
    risks,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate task before scheduling
 */
export function validateTask(task: TaskToSchedule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.id || task.id.trim() === '') {
    errors.push('Task ID is required');
  }

  if (!task.assignee_user_id || task.assignee_user_id.trim() === '') {
    errors.push('Assignee user ID is required');
  }

  if (!task.units || task.units < 1) {
    errors.push('Task must have at least 1 time unit');
  }

  if (!task.start_iso) {
    errors.push('Start date is required');
  } else {
    try {
      parseISO(task.start_iso);
    } catch (e) {
      errors.push('Invalid start_iso format (must be ISO 8601)');
    }
  }

  if (task.due_iso) {
    try {
      const start = parseISO(task.start_iso);
      const due = parseISO(task.due_iso);
      if (isBefore(due, start)) {
        errors.push('Due date cannot be before start date');
      }
    } catch (e) {
      errors.push('Invalid due_iso format (must be ISO 8601)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
