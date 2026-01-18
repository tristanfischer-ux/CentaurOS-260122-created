/**
 * Scheduler Unit Tests
 * Tests for capacity-aware scheduling logic
 */

import {
  getWeekStart,
  formatWeekStart,
  getNextWeek,
  getRemainingCapacity,
  allocateTask,
  scheduleConfirmedTasks,
  validateTask,
  type TaskToSchedule,
  type UserCapacityRecord,
  type TaskAllocation,
} from './scheduler';
import { addDays } from 'date-fns';

describe('Scheduler - Week Utilities', () => {
  test('getWeekStart returns Monday for any day of week', () => {
    // Wednesday, Jan 17, 2024
    const wednesday = new Date('2024-01-17T10:00:00Z');
    const weekStart = getWeekStart(wednesday);

    // Should return Monday, Jan 15, 2024
    expect(weekStart.getDay()).toBe(1); // Monday
    expect(weekStart.getDate()).toBe(15);
  });

  test('formatWeekStart returns ISO date string', () => {
    const monday = new Date('2024-01-15T00:00:00Z');
    const formatted = formatWeekStart(monday);

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatted).toContain('2024-01-15');
  });

  test('getNextWeek returns next Monday', () => {
    const monday = new Date('2024-01-15T00:00:00Z');
    const nextMonday = getNextWeek(monday);

    expect(nextMonday.getDay()).toBe(1);
    expect(nextMonday.getDate()).toBe(22);
  });
});

describe('Scheduler - Capacity Management', () => {
  test('getRemainingCapacity returns full capacity when no allocations', () => {
    const userId = 'user-1';
    const weekStart = new Date('2024-01-15T00:00:00Z');
    const capacity: UserCapacityRecord[] = [
      { user_id: userId, week_start_iso: '2024-01-15', capacity_units: 10 },
    ];
    const allocations: TaskAllocation[] = [];

    const remaining = getRemainingCapacity(userId, weekStart, capacity, allocations);

    expect(remaining).toBe(10);
  });

  test('getRemainingCapacity subtracts allocated units', () => {
    const userId = 'user-1';
    const weekStart = new Date('2024-01-15T00:00:00Z');
    const capacity: UserCapacityRecord[] = [
      { user_id: userId, week_start_iso: '2024-01-15', capacity_units: 10 },
    ];
    const allocations: TaskAllocation[] = [
      { task_id: 'task-1', user_id: userId, week_start_iso: '2024-01-15', units: 3 },
      { task_id: 'task-2', user_id: userId, week_start_iso: '2024-01-15', units: 2 },
    ];

    const remaining = getRemainingCapacity(userId, weekStart, capacity, allocations);

    expect(remaining).toBe(5); // 10 - 3 - 2
  });
});

describe('Scheduler - Task Allocation', () => {
  test('allocateTask fits task in single week if capacity available', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 5,
      start_iso: '2024-01-17T00:00:00Z',
      due_iso: null,
    };

    const capacity: UserCapacityRecord[] = [
      { user_id: 'user-1', week_start_iso: '2024-01-15', capacity_units: 10 },
    ];

    const result = allocateTask(task, capacity, []);

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].units).toBe(5);
    expect(result.allocations[0].week_start_iso).toBe('2024-01-15');
    expect(result.riskFlag).toBe(false);
  });

  test('allocateTask overflows to next week if capacity full', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 15, // More than weekly capacity
      start_iso: '2024-01-17T00:00:00Z',
      due_iso: null,
    };

    const capacity: UserCapacityRecord[] = [
      { user_id: 'user-1', week_start_iso: '2024-01-15', capacity_units: 10 },
      { user_id: 'user-1', week_start_iso: '2024-01-22', capacity_units: 10 },
    ];

    const result = allocateTask(task, capacity, []);

    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].units).toBe(10); // First week: 10
    expect(result.allocations[1].units).toBe(5);  // Second week: 5
    expect(result.riskFlag).toBe(false);
  });

  test('allocateTask sets risk flag if due date exceeded', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 15,
      start_iso: '2024-01-17T00:00:00Z',
      due_iso: '2024-01-19T23:59:59Z', // Due Friday same week
    };

    const capacity: UserCapacityRecord[] = [
      { user_id: 'user-1', week_start_iso: '2024-01-15', capacity_units: 10 },
      { user_id: 'user-1', week_start_iso: '2024-01-22', capacity_units: 10 },
    ];

    const result = allocateTask(task, capacity, []);

    // Should still allocate but flag risk
    expect(result.allocations.length).toBeGreaterThan(1);
    expect(result.riskFlag).toBe(true);
    expect(result.riskReason).toContain('beyond due date');
  });
});

describe('Scheduler - Batch Scheduling', () => {
  test('scheduleConfirmedTasks schedules multiple tasks deterministically', () => {
    const tasks: TaskToSchedule[] = [
      {
        id: 'task-1',
        assignee_user_id: 'user-1',
        units: 5,
        start_iso: '2024-01-17T00:00:00Z',
        due_iso: null,
      },
      {
        id: 'task-2',
        assignee_user_id: 'user-1',
        units: 8,
        start_iso: '2024-01-18T00:00:00Z',
        due_iso: null,
      },
    ];

    const capacity: UserCapacityRecord[] = [
      { user_id: 'user-1', week_start_iso: '2024-01-15', capacity_units: 10 },
      { user_id: 'user-1', week_start_iso: '2024-01-22', capacity_units: 10 },
    ];

    const result = scheduleConfirmedTasks(tasks, capacity, []);

    // Task 1: 5 units in week 1
    // Task 2: 5 units in week 1 (remaining capacity), 3 units in week 2
    expect(result.allocations.length).toBe(3);
    expect(result.risks).toHaveLength(0);
  });

  test('scheduleConfirmedTasks reports risks for tasks exceeding deadlines', () => {
    const tasks: TaskToSchedule[] = [
      {
        id: 'task-1',
        assignee_user_id: 'user-1',
        units: 20,
        start_iso: '2024-01-17T00:00:00Z',
        due_iso: '2024-01-19T00:00:00Z', // Due in 2 days but needs 2 weeks
      },
    ];

    const capacity: UserCapacityRecord[] = [
      { user_id: 'user-1', week_start_iso: '2024-01-15', capacity_units: 10 },
      { user_id: 'user-1', week_start_iso: '2024-01-22', capacity_units: 10 },
    ];

    const result = scheduleConfirmedTasks(tasks, capacity, []);

    expect(result.risks).toHaveLength(1);
    expect(result.risks[0].task_id).toBe('task-1');
  });
});

describe('Scheduler - Validation', () => {
  test('validateTask passes for valid task', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 5,
      start_iso: '2024-01-17T00:00:00Z',
      due_iso: '2024-01-24T00:00:00Z',
    };

    const result = validateTask(task);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateTask fails when units < 1', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 0,
      start_iso: '2024-01-17T00:00:00Z',
      due_iso: null,
    };

    const result = validateTask(task);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Task must have at least 1 time unit');
  });

  test('validateTask fails when due date before start date', () => {
    const task: TaskToSchedule = {
      id: 'task-1',
      assignee_user_id: 'user-1',
      units: 5,
      start_iso: '2024-01-20T00:00:00Z',
      due_iso: '2024-01-15T00:00:00Z', // Before start
    };

    const result = validateTask(task);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Due date cannot be before start date');
  });
});
