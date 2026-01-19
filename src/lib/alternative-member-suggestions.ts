/**
 * Alternative Member Suggestion System
 * Suggests alternative team members when a task is rejected
 */

import type { WorkPlan } from './state/work-plan-store';
import type { OrganizationMember } from './organization-seed';
import { getAvailableTUsForMemberInWeek, getWeekStart, getCapacityPerWeek } from './task-scheduling';

export interface MemberSuggestion {
  member: OrganizationMember;
  score: number; // 0-100, higher is better
  availableTUs: number;
  matchReasons: string[];
  concerns: string[];
}

/**
 * Suggest alternative members for a task based on:
 * - Available capacity
 * - Function/skill match
 * - Current workload
 * - Role seniority
 */
export function suggestAlternativeMembers(
  task: WorkPlan,
  rejectedMemberId: string,
  allMembers: OrganizationMember[],
  allTasks: WorkPlan[],
  requiredTUsPerWeek: number
): MemberSuggestion[] {
  const today = getWeekStart(new Date());
  const taskStartDate = new Date(task.startDate);
  const relevantWeekStart = taskStartDate > today ? getWeekStart(taskStartDate) : today;

  // Filter out the rejected member
  const candidateMembers = allMembers.filter(
    m => m.id !== rejectedMemberId && m.status === 'active'
  );

  const suggestions: MemberSuggestion[] = candidateMembers.map(member => {
    const matchReasons: string[] = [];
    const concerns: string[] = [];
    let score = 0;

    // 1. Check available capacity (40 points max)
    const availableTUs = getAvailableTUsForMemberInWeek(member, relevantWeekStart, allTasks);
    const capacity = getCapacityPerWeek(member);

    if (availableTUs >= requiredTUsPerWeek) {
      score += 40;
      matchReasons.push(`Has ${availableTUs} TU available (needs ${requiredTUsPerWeek})`);
    } else if (availableTUs > 0) {
      score += Math.round((availableTUs / requiredTUsPerWeek) * 40);
      concerns.push(`Only ${availableTUs} TU available (needs ${requiredTUsPerWeek})`);
    } else {
      concerns.push('No capacity available this week');
    }

    // 2. Function/skill match (30 points max)
    if (member.function === task.function) {
      score += 30;
      matchReasons.push(`Same function (${task.function})`);
    } else {
      concerns.push(`Different function (${member.function} vs ${task.function})`);
    }

    // 3. Role/seniority (20 points max)
    if (member.role === 'Founder') {
      score += 20;
      matchReasons.push('Founder - high expertise');
    } else if (member.role === 'FractionalExec') {
      score += 15;
      matchReasons.push('Fractional Executive - specialized expertise');
    } else if (member.role === 'Apprentice') {
      score += 10;
      matchReasons.push('Apprentice - learning opportunity');
    }

    // 4. Current workload (10 points max)
    const utilizationRate = capacity.total > 0
      ? (capacity.total - availableTUs) / capacity.total
      : 1;

    if (utilizationRate < 0.5) {
      score += 10;
      matchReasons.push('Low current utilization - available bandwidth');
    } else if (utilizationRate < 0.8) {
      score += 5;
    } else {
      concerns.push('High current utilization - limited bandwidth');
    }

    return {
      member,
      score,
      availableTUs,
      matchReasons,
      concerns,
    };
  });

  // Sort by score (highest first)
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Get top N alternative members
 */
export function getTopAlternatives(
  task: WorkPlan,
  rejectedMemberId: string,
  allMembers: OrganizationMember[],
  allTasks: WorkPlan[],
  requiredTUsPerWeek: number,
  limit: number = 3
): MemberSuggestion[] {
  const suggestions = suggestAlternativeMembers(
    task,
    rejectedMemberId,
    allMembers,
    allTasks,
    requiredTUsPerWeek
  );

  return suggestions.slice(0, limit);
}

/**
 * Format suggestion for display
 */
export function formatSuggestion(suggestion: MemberSuggestion): string {
  const parts: string[] = [];

  parts.push(`${suggestion.member.name} (${suggestion.member.role})`);
  parts.push(`Score: ${suggestion.score}/100`);
  parts.push(`Available: ${suggestion.availableTUs} TU`);

  if (suggestion.matchReasons.length > 0) {
    parts.push('\nReasons: ' + suggestion.matchReasons.join(', '));
  }

  if (suggestion.concerns.length > 0) {
    parts.push('\nConcerns: ' + suggestion.concerns.join(', '));
  }

  return parts.join('\n');
}
