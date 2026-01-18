/**
 * Visibility Check Functions
 * Core logic for determining who can view, edit, and share tasks based on visibility settings
 */

import type { Role, Function as BusinessFunction } from '@/types';
import type {
  TaskVisibility,
  RestrictedCategory,
  TaskSharing,
  VisibilityCheckResult,
} from '@/types/privacy';
import type { WorkPlan } from '@/lib/state/work-plan-store';
import { usePrivacyStore } from '@/lib/state/privacy-store';

/**
 * Extended WorkPlan with privacy fields (for type safety during migration)
 */
export interface WorkPlanWithPrivacy extends WorkPlan {
  visibility?: TaskVisibility;
  ownerId?: string;
  restrictedCategory?: RestrictedCategory;
  sharedWith?: TaskSharing;
}

/**
 * Check if a user can view a specific work plan
 */
export function canViewWorkPlan(
  workPlan: WorkPlanWithPrivacy,
  viewerId: string,
  viewerRole: Role,
  viewerFunction: BusinessFunction,
  workspaceId: string
): boolean {
  // Default visibility (for tasks without privacy fields yet)
  const visibility = workPlan.visibility || 'company';
  const ownerId = workPlan.ownerId || workPlan.assignedBy;

  // 1. PRIVATE - Only owner can see
  if (visibility === 'private') {
    // Check if founder override is allowed
    const allowFounderOverride = usePrivacyStore.getState().preferences.allowFounderOverride;
    if (viewerRole === 'Founder' && allowFounderOverride) {
      return true; // Founders can see everything (audit/compliance)
    }
    return viewerId === ownerId;
  }

  // 2. SHARED - Owner + specifically shared users
  if (visibility === 'shared') {
    // Owner can always see
    if (viewerId === ownerId) return true;

    // Founders with override
    const allowFounderOverride = usePrivacyStore.getState().preferences.allowFounderOverride;
    if (viewerRole === 'Founder' && allowFounderOverride) {
      return true;
    }

    const sharedWith = workPlan.sharedWith;
    if (!sharedWith) return false;

    // Check if user is in shared user list
    if (sharedWith.userIds?.includes(viewerId)) return true;

    // Check if user's role is in shared roles
    if (sharedWith.roles?.includes(viewerRole)) return true;

    // Check if user's function is in shared functions
    if (sharedWith.functions?.includes(viewerFunction)) return true;

    // Check expiration
    if (sharedWith.expiresAt && new Date(sharedWith.expiresAt) < new Date()) {
      return false; // Share has expired
    }

    return false;
  }

  // 3. FUNCTION - Visible to everyone in the task's business function
  if (visibility === 'function') {
    // Owner can see
    if (viewerId === ownerId) return true;

    // Founders can see
    if (viewerRole === 'Founder') return true;

    // Same function can see
    if (viewerFunction === workPlan.function) return true;

    return false;
  }

  // 4. RESTRICTED - Special category access required (HR, Legal, Executive, etc.)
  if (visibility === 'restricted') {
    // Owner can see
    if (viewerId === ownerId) return true;

    // Founders always have access to restricted content
    if (viewerRole === 'Founder') return true;

    // Check if user has restricted access to this category
    const category = workPlan.restrictedCategory;
    if (!category) return false;

    const hasAccess = usePrivacyStore
      .getState()
      .hasRestrictedAccess(workspaceId, viewerId, category);

    return hasAccess;
  }

  // 5. COMPANY - Default, everyone in the workspace can see
  return true;
}

/**
 * Check if a user can edit a work plan
 */
export function canEditWorkPlan(
  workPlan: WorkPlanWithPrivacy,
  userId: string,
  userRole: Role,
  userFunction: BusinessFunction,
  workspaceId: string
): boolean {
  // First check if they can even view it
  if (!canViewWorkPlan(workPlan, userId, userRole, userFunction, workspaceId)) {
    return false;
  }

  const ownerId = workPlan.ownerId || workPlan.assignedBy;

  // Owner can always edit
  if (userId === ownerId) return true;

  // Founders can edit everything
  if (userRole === 'Founder') return true;

  // For shared tasks, check permission level
  if (workPlan.visibility === 'shared' && workPlan.sharedWith) {
    const permission = workPlan.sharedWith.permission || 'view';

    // Only allow edit if user is in shared list AND has edit or share permission
    const isShared =
      workPlan.sharedWith.userIds?.includes(userId) ||
      workPlan.sharedWith.roles?.includes(userRole) ||
      workPlan.sharedWith.functions?.includes(userFunction);

    if (isShared && (permission === 'edit' || permission === 'share')) {
      return true;
    }

    return false;
  }

  // For function-level tasks, executives in that function can edit
  if (workPlan.visibility === 'function' || workPlan.visibility === 'company') {
    if (userRole === 'FractionalExec' && userFunction === workPlan.function) {
      return true;
    }
  }

  // Restricted tasks: only founder and owner can edit (restricted access users can only view)
  if (workPlan.visibility === 'restricted') {
    return false;
  }

  return false;
}

/**
 * Check if a user can share a work plan with others
 */
export function canShareWorkPlan(
  workPlan: WorkPlanWithPrivacy,
  userId: string,
  userRole: Role,
  userFunction: BusinessFunction,
  workspaceId: string
): boolean {
  // First check if they can view and edit it
  if (!canEditWorkPlan(workPlan, userId, userRole, userFunction, workspaceId)) {
    return false;
  }

  const ownerId = workPlan.ownerId || workPlan.assignedBy;

  // Owner can always share
  if (userId === ownerId) return true;

  // Founders can share
  if (userRole === 'Founder') return true;

  // For shared tasks, check if user has 'share' permission
  if (workPlan.visibility === 'shared' && workPlan.sharedWith) {
    const permission = workPlan.sharedWith.permission || 'view';

    const isShared =
      workPlan.sharedWith.userIds?.includes(userId) ||
      workPlan.sharedWith.roles?.includes(userRole) ||
      workPlan.sharedWith.functions?.includes(userFunction);

    if (isShared && permission === 'share') {
      return true;
    }
  }

  return false;
}

/**
 * Check if a user can modify the visibility settings of a work plan
 */
export function canModifyVisibility(
  workPlan: WorkPlanWithPrivacy,
  userId: string,
  userRole: Role
): boolean {
  const ownerId = workPlan.ownerId || workPlan.assignedBy;

  // Only owner and founders can modify visibility
  return userId === ownerId || userRole === 'Founder';
}

/**
 * Get comprehensive visibility check result for a work plan
 */
export function getVisibilityCheckResult(
  workPlan: WorkPlanWithPrivacy,
  userId: string,
  userRole: Role,
  userFunction: BusinessFunction,
  workspaceId: string
): VisibilityCheckResult {
  const canView = canViewWorkPlan(workPlan, userId, userRole, userFunction, workspaceId);

  if (!canView) {
    return {
      canView: false,
      canEdit: false,
      canShare: false,
      reason: 'You do not have permission to view this task',
    };
  }

  const canEdit = canEditWorkPlan(workPlan, userId, userRole, userFunction, workspaceId);
  const canShare = canShareWorkPlan(workPlan, userId, userRole, userFunction, workspaceId);

  return {
    canView,
    canEdit,
    canShare,
  };
}

/**
 * Filter work plans based on visibility for a specific user
 */
export function filterWorkPlansByVisibility(
  workPlans: WorkPlanWithPrivacy[],
  userId: string,
  userRole: Role,
  userFunction: BusinessFunction,
  workspaceId: string
): WorkPlanWithPrivacy[] {
  return workPlans.filter((plan) =>
    canViewWorkPlan(plan, userId, userRole, userFunction, workspaceId)
  );
}

/**
 * Get visibility badge info for UI display
 */
export function getVisibilityBadge(visibility: TaskVisibility, restrictedCategory?: RestrictedCategory): {
  icon: string;
  label: string;
  color: string;
} {
  switch (visibility) {
    case 'private':
      return { icon: '🔒', label: 'Private', color: '#ef4444' };
    case 'shared':
      return { icon: '👥', label: 'Shared', color: '#3b82f6' };
    case 'function':
      return { icon: '🏢', label: 'Function', color: '#8b5cf6' };
    case 'restricted':
      if (restrictedCategory === 'hr') return { icon: '⚠️', label: 'HR Confidential', color: '#f59e0b' };
      if (restrictedCategory === 'legal') return { icon: '⚖️', label: 'Legal', color: '#dc2626' };
      if (restrictedCategory === 'executive') return { icon: '👔', label: 'Executive Only', color: '#7c3aed' };
      if (restrictedCategory === 'finance') return { icon: '💰', label: 'Financial', color: '#059669' };
      return { icon: '🔐', label: 'Confidential', color: '#dc2626' };
    case 'company':
    default:
      return { icon: '🌐', label: 'Company', color: '#10b981' };
  }
}
