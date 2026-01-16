/**
 * Role Utilities
 * Helper functions for role-based filtering and permissions
 */

import type { Role, Function as BusinessFunction } from '@/types';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import type { OKR } from '@/lib/state/okr-store';
import type { OrganizationMember } from '@/lib/organization-seed';

/**
 * Filter work plans based on user role and function
 */
export function filterWorkPlansByRole(
  workPlans: WorkPlan[],
  role: Role,
  userFunction?: BusinessFunction,
  userId?: string
): WorkPlan[] {
  if (role === 'Founder') {
    return workPlans;
  }

  if (role === 'FractionalExec' && userFunction) {
    return workPlans.filter((wp) => wp.function === userFunction);
  }

  if (role === 'Apprentice' && userId) {
    // Apprentices see only their assigned tasks
    return workPlans.filter(
      (wp) =>
        wp.assignedMemberIds?.includes(userId) ||
        wp.allocations?.some((a) => a.memberId === userId)
    );
  }

  return [];
}

/**
 * Filter OKRs based on user role and function
 */
export function filterOKRsByRole(
  okrs: OKR[],
  role: Role,
  userFunction?: BusinessFunction,
  userWorkPlans?: WorkPlan[]
): OKR[] {
  if (role === 'Founder') {
    return okrs;
  }

  if (role === 'FractionalExec' && userFunction) {
    return okrs.filter((okr) => okr.function === userFunction || okr.owner === userFunction);
  }

  if (role === 'Apprentice' && userWorkPlans) {
    // Show only OKRs linked to apprentice's tasks
    const taskOKRTitles = new Set(
      userWorkPlans.map((wp) => wp.linkedOKRTitle).filter(Boolean)
    );
    return okrs.filter((okr) => taskOKRTitles.has(okr.title));
  }

  return [];
}

/**
 * Filter team members based on user role and function
 */
export function filterTeamMembersByRole(
  members: OrganizationMember[],
  role: Role,
  userFunction?: BusinessFunction,
  userId?: string
): OrganizationMember[] {
  if (role === 'Founder') {
    return members;
  }

  if (role === 'FractionalExec' && userFunction) {
    // Executives see:
    // - Their apprentices (same function)
    // - Other executives (all functions)
    // - Founders
    return members.filter(
      (m) =>
        m.role === 'Founder' ||
        m.role === 'FractionalExec' ||
        (m.role === 'Apprentice' && m.function === userFunction)
    );
  }

  if (role === 'Apprentice' && userFunction) {
    // Apprentices see:
    // - Their mentor (executive in same function)
    // - Other apprentices in their function
    // - Founders (read-only)
    return members.filter(
      (m) =>
        m.role === 'Founder' ||
        (m.role === 'FractionalExec' && m.function === userFunction) ||
        (m.role === 'Apprentice' && m.function === userFunction)
    );
  }

  return [];
}

/**
 * Check if user can edit a resource based on role and function
 */
export function canUserEdit(
  role: Role,
  resourceFunction?: BusinessFunction,
  userFunction?: BusinessFunction
): boolean {
  if (role === 'Founder') {
    return true;
  }

  if (role === 'FractionalExec' && userFunction && resourceFunction) {
    return resourceFunction === userFunction;
  }

  // Apprentices cannot edit strategic resources
  return false;
}

/**
 * Check if user can allocate resources
 */
export function canUserAllocate(
  role: Role,
  targetMemberFunction?: BusinessFunction,
  userFunction?: BusinessFunction
): boolean {
  if (role === 'Founder') {
    return true;
  }

  if (role === 'FractionalExec' && userFunction && targetMemberFunction) {
    // Executives can only allocate people in their function
    return targetMemberFunction === userFunction;
  }

  // Apprentices cannot allocate
  return false;
}

/**
 * Check if user can create work plans
 */
export function canUserCreateWorkPlan(
  role: Role,
  targetFunction?: BusinessFunction,
  userFunction?: BusinessFunction
): boolean {
  if (role === 'Founder') {
    return true;
  }

  if (role === 'FractionalExec' && userFunction && targetFunction) {
    // Executives can create work plans for their function
    return targetFunction === userFunction;
  }

  // Apprentices cannot create work plans directly
  return false;
}

/**
 * Check if user can review submissions
 */
export function canUserReview(role: Role): boolean {
  return role === 'Founder' || role === 'FractionalExec';
}

/**
 * Get role-appropriate empty state message
 */
export function getRoleEmptyStateMessage(
  role: Role,
  context: 'tasks' | 'okrs' | 'team' | 'workplans'
): {
  title: string;
  description: string;
  actionLabel?: string;
} {
  const messages = {
    Apprentice: {
      tasks: {
        title: 'All Caught Up!',
        description: 'No tasks assigned yet. Your mentor will add work soon.',
      },
      okrs: {
        title: 'No Active OKRs',
        description: "You'll see OKRs here once you're assigned tasks that contribute to them.",
      },
      team: {
        title: 'Your Team',
        description: 'Connect with your mentor and fellow apprentices in your function.',
      },
      workplans: {
        title: 'Your Work Queue',
        description: 'Tasks will appear here when assigned by your mentor.',
      },
    },
    FractionalExec: {
      tasks: {
        title: 'No Active Tasks',
        description: 'No tasks in your function. Create new work in the Decide tab.',
        actionLabel: 'Create Task',
      },
      okrs: {
        title: 'No OKRs Yet',
        description: 'Create objectives for your function to start tracking progress.',
        actionLabel: 'Create OKR',
      },
      team: {
        title: 'Build Your Team',
        description: 'Hire apprentices to grow your function.',
        actionLabel: 'Hire Apprentice',
      },
      workplans: {
        title: 'No Work Plans',
        description: 'Create work plans to organize tasks for your function.',
        actionLabel: 'Create Work Plan',
      },
    },
    Founder: {
      tasks: {
        title: 'All Tasks Complete!',
        description: 'Excellent work! Time to plan the next sprint.',
        actionLabel: 'Plan Sprint',
      },
      okrs: {
        title: 'Set Company Goals',
        description: 'Create OKRs to align the team around strategic objectives.',
        actionLabel: 'Create OKR',
      },
      team: {
        title: 'Build Your Team',
        description: 'Hire executives and apprentices to grow the company.',
        actionLabel: 'Hire Team Member',
      },
      workplans: {
        title: 'No Work Planned',
        description: 'Create work plans to organize tasks across all functions.',
        actionLabel: 'Create Work Plan',
      },
    },
  };

  // Default to Apprentice messages for Government/Unaffiliated
  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return messages[safeRole][context];
}

/**
 * Get role-specific gradient colors
 */
export function getRoleGradient(role: Role): readonly [string, string, string] {
  const gradients = {
    Founder: ['#3b82f6', '#2563eb', '#1d4ed8'] as const,
    FractionalExec: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    Apprentice: ['#10b981', '#059669', '#047857'] as const,
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return gradients[safeRole];
}

/**
 * Get role-specific primary color
 */
export function getRoleColor(role: Role): string {
  const colors = {
    Founder: '#3b82f6',
    FractionalExec: '#8b5cf6',
    Apprentice: '#10b981',
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return colors[safeRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const names = {
    Founder: 'Founder',
    FractionalExec: 'Executive',
    Apprentice: 'Apprentice',
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return names[safeRole];
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions = {
    Founder: 'Full company overview with financials, strategy, and team management',
    FractionalExec: 'Multi-company view with domain-specific access and time tracking',
    Apprentice: 'Task-focused view with learning resources and mentor communication',
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return descriptions[safeRole];
}

/**
 * Get role capabilities list
 */
export function getRoleCapabilities(role: Role): string[] {
  const capabilities = {
    Founder: [
      'View company financials & runway',
      'Manage all OKRs across functions',
      'Allocate resources company-wide',
      'Approve hiring and major decisions',
      'Access cross-function insights',
      'Generate board reports',
    ],
    FractionalExec: [
      'Manage tasks in your function',
      'Review apprentice work',
      'Create OKRs for your function',
      'Allocate people in your team',
      'Track utilization across companies',
      'Request cross-function resources',
    ],
    Apprentice: [
      'View and complete assigned tasks',
      'Track personal progress',
      'Communicate with your mentor',
      'Access learning resources',
      'Submit work for review',
      'Request help when blocked',
    ],
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return capabilities[safeRole];
}

/**
 * Get role restrictions list
 */
export function getRoleRestrictions(role: Role): string[] {
  const restrictions = {
    Founder: [],
    FractionalExec: [
      'Cannot edit other functions\' OKRs',
      'Cannot allocate people outside your function',
      'Cannot access detailed company financials',
      'Cannot approve company-wide decisions',
    ],
    Apprentice: [
      'Cannot create or edit OKRs',
      'Cannot allocate resources',
      'Cannot view company financials',
      'Cannot access other functions\' work',
      'Cannot review other team members',
    ],
  };

  const safeRole = (role === 'Founder' || role === 'FractionalExec' || role === 'Apprentice') ? role : 'Apprentice';
  return restrictions[safeRole];
}
