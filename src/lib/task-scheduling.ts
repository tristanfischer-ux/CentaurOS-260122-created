/**
 * Task Scheduling Logic
 * Automatically calculates when tasks should start based on available TU capacity
 */

import type { WorkPlan, TUAllocation } from './state/work-plan-store';
import type { OrganizationMember } from './organization-seed';

// Get TU capacity per week for a member
export function getCapacityPerWeek(member: OrganizationMember): { normal: number; overtime: number; total: number } {
  if (member.role === 'Founder' || member.role === 'Apprentice') {
    return { normal: 10, overtime: 5, total: 15 };
  }
  const daysPerWeek = member.daysPerWeek || 2;
  const normalSquares = daysPerWeek * 2;
  const overtimeSquares = Math.min((5 - daysPerWeek) * 2, 10);
  return { normal: normalSquares, overtime: overtimeSquares, total: normalSquares + overtimeSquares };
}

// Get start of week (Monday) for a given date
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Calculate allocated TUs for a member in a specific week
export function getAllocatedTUsForMemberInWeek(
  memberId: string,
  weekStart: Date,
  allTasks: WorkPlan[]
): number {
  let allocated = 0;

  for (const task of allTasks) {
    // Skip completed or abandoned tasks
    if (task.status === 'completed' || task.status === 'abandoned') {
      continue;
    }

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.dueDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Check if task overlaps with this week
    if (taskStart < weekEnd && taskEnd >= weekStart) {
      // Find allocation for this member
      const allocation = task.allocations.find(a => a.memberId === memberId);
      if (allocation) {
        allocated += allocation.squaresPerWeek;
      }
    }
  }

  return allocated;
}

// Get available TUs for a member in a specific week
export function getAvailableTUsForMemberInWeek(
  member: OrganizationMember,
  weekStart: Date,
  allTasks: WorkPlan[]
): number {
  const capacity = getCapacityPerWeek(member);
  const allocated = getAllocatedTUsForMemberInWeek(member.id, weekStart, allTasks);
  return Math.max(0, capacity.total - allocated);
}

// Calculate when a task can start based on team capacity
export interface TaskScheduleResult {
  canStartNow: boolean;
  earliestStartDate: string; // ISO date string
  weeklyCapacity: number; // Total TUs per week available
  weeksToComplete: number; // Estimated weeks to complete
  schedulingDetails: {
    memberId: string;
    memberName: string;
    weekStart: string;
    availableTUs: number;
    allocatedTUs: number;
  }[];
}

/**
 * Calculate when a task should start based on available team capacity
 *
 * @param task - The work plan task to schedule
 * @param teamMembers - All organization members
 * @param allTasks - All existing tasks (to check capacity)
 * @param startFromDate - Optional date to start checking from (defaults to today)
 * @returns Scheduling information including earliest start date
 */
export function calculateTaskStartDate(
  task: WorkPlan,
  teamMembers: OrganizationMember[],
  allTasks: WorkPlan[],
  startFromDate: Date = new Date()
): TaskScheduleResult {
  const today = getWeekStart(startFromDate);
  const assignedMembers = task.allocations.map(alloc =>
    teamMembers.find(m => m.id === alloc.memberId)
  ).filter(Boolean) as OrganizationMember[];

  // If no allocations yet, task can start now (will be scheduled when allocated)
  if (assignedMembers.length === 0) {
    return {
      canStartNow: true,
      earliestStartDate: today.toISOString().split('T')[0],
      weeklyCapacity: 0,
      weeksToComplete: 0,
      schedulingDetails: [],
    };
  }

  // Calculate total TUs needed per week for this task
  const totalTUsPerWeek = task.allocations.reduce((sum, alloc) => sum + alloc.squaresPerWeek, 0);

  // Find the first week where ALL assigned members have their required capacity available
  let currentWeek = new Date(today);
  let foundWeek = false;
  let weeklyCapacity = 0;
  const schedulingDetails: TaskScheduleResult['schedulingDetails'] = [];

  // Check up to 52 weeks in the future
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const weekStart = new Date(currentWeek);
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));

    let allMembersAvailable = true;
    const weekDetails: TaskScheduleResult['schedulingDetails'] = [];
    let totalAvailableThisWeek = 0;

    // Check if each assigned member has capacity in this week
    for (const allocation of task.allocations) {
      const member = teamMembers.find(m => m.id === allocation.memberId);
      if (!member) continue;

      const availableTUs = getAvailableTUsForMemberInWeek(member, weekStart, allTasks);
      const requiredTUs = allocation.squaresPerWeek;

      weekDetails.push({
        memberId: member.id,
        memberName: member.name,
        weekStart: weekStart.toISOString().split('T')[0],
        availableTUs,
        allocatedTUs: requiredTUs,
      });

      totalAvailableThisWeek += availableTUs;

      // Check if this member has enough capacity
      if (availableTUs < requiredTUs) {
        allMembersAvailable = false;
      }
    }

    // If all members have capacity, this is the earliest start date
    if (allMembersAvailable) {
      foundWeek = true;
      weeklyCapacity = totalAvailableThisWeek;
      schedulingDetails.push(...weekDetails);
      currentWeek = weekStart;
      break;
    }
  }

  const earliestStartDate = currentWeek.toISOString().split('T')[0];
  const weeksToComplete = totalTUsPerWeek > 0
    ? Math.ceil(task.estimatedTimeUnits / totalTUsPerWeek)
    : 0;

  return {
    canStartNow: foundWeek && currentWeek.getTime() === today.getTime(),
    earliestStartDate,
    weeklyCapacity,
    weeksToComplete,
    schedulingDetails,
  };
}

/**
 * Auto-schedule a task to start when capacity is available
 * Updates the task's startDate and calculates dueDate
 */
export function autoScheduleTask(
  task: WorkPlan,
  teamMembers: OrganizationMember[],
  allTasks: WorkPlan[]
): WorkPlan {
  const schedule = calculateTaskStartDate(task, teamMembers, allTasks);

  // Calculate due date based on weeks to complete
  const startDate = new Date(schedule.earliestStartDate);
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + (schedule.weeksToComplete * 7));

  return {
    ...task,
    startDate: schedule.earliestStartDate,
    dueDate: dueDate.toISOString().split('T')[0],
  };
}

/**
 * Batch re-schedule all tasks in the queue based on capacity
 * Prioritizes by importance or creation date
 */
export function batchScheduleTasks(
  tasks: WorkPlan[],
  teamMembers: OrganizationMember[],
  priorityFn?: (task: WorkPlan) => number
): WorkPlan[] {
  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityA = priorityFn ? priorityFn(a) : 0;
    const priorityB = priorityFn ? priorityFn(b) : 0;
    return priorityB - priorityA;
  });

  const scheduledTasks: WorkPlan[] = [];
  const allTasksForCapacity = [...tasks]; // Include all tasks for capacity calculation

  for (const task of sortedTasks) {
    // Schedule this task
    const scheduled = autoScheduleTask(task, teamMembers, allTasksForCapacity);
    scheduledTasks.push(scheduled);

    // Update the capacity list with this newly scheduled task
    const index = allTasksForCapacity.findIndex(t => t.id === task.id);
    if (index !== -1) {
      allTasksForCapacity[index] = scheduled;
    }
  }

  return scheduledTasks;
}
