/**
 * Role-Based Permissions System
 *
 * Defines what each role can see and do in the app:
 * - Founder: Full access to everything
 * - FractionalExec: Team management, resource allocation (with approval), strategic planning
 * - Apprentice: Task-focused view, no cost information
 */

import { useCurrentMembership } from '@/lib/state/app-store';
import { type OrganizationMember } from '@/lib/organization-seed';

export type UserRole = 'Founder' | 'FractionalExec' | 'Apprentice';

export interface RolePermissions {
  // Visibility permissions
  canViewPersonnelCosts: boolean;
  canViewBudgetInfo: boolean;
  canViewFinancialMetrics: boolean;
  canViewAIServiceCosts: boolean;
  canViewSupplierCosts: boolean;
  canViewAllMembers: boolean;
  canViewTeamUtilization: boolean;

  // Action permissions
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canCreateObjectives: boolean;
  canEditObjectives: boolean;
  canAllocateResources: boolean;
  canAllocateWithoutApproval: boolean; // Only founders or delegated execs
  canRequestResources: boolean;
  canApproveRequests: boolean;
  canManageTeam: boolean;
  canAssignApprentices: boolean;
  canSubmitRecommendations: boolean;

  // Navigation permissions
  canAccessDecideTab: boolean;
  canAccessWhoTab: boolean;
  canAccessWhatTab: boolean;
  canAccessDoTab: boolean;
  canAccessToolsTab: boolean;
}

const FOUNDER_PERMISSIONS: RolePermissions = {
  // Full visibility
  canViewPersonnelCosts: true,
  canViewBudgetInfo: true,
  canViewFinancialMetrics: true,
  canViewAIServiceCosts: true,
  canViewSupplierCosts: true,
  canViewAllMembers: true,
  canViewTeamUtilization: true,

  // Full actions
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: true,
  canCreateObjectives: true,
  canEditObjectives: true,
  canAllocateResources: true,
  canAllocateWithoutApproval: true,
  canRequestResources: true,
  canApproveRequests: true,
  canManageTeam: true,
  canAssignApprentices: true,
  canSubmitRecommendations: false, // Founders don't need to submit - they decide

  // Full navigation
  canAccessDecideTab: true,
  canAccessWhoTab: true,
  canAccessWhatTab: true,
  canAccessDoTab: true,
  canAccessToolsTab: true,
};

const EXEC_PERMISSIONS: RolePermissions = {
  // Limited visibility - no personnel costs
  canViewPersonnelCosts: false,
  canViewBudgetInfo: false,
  canViewFinancialMetrics: false,
  canViewAIServiceCosts: true, // Can see AI costs
  canViewSupplierCosts: true, // Can see supplier costs
  canViewAllMembers: true,
  canViewTeamUtilization: true,

  // Team management actions
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: false, // Only founders can delete
  canCreateObjectives: true,
  canEditObjectives: true,
  canAllocateResources: true,
  canAllocateWithoutApproval: false, // Needs founder approval (unless delegated)
  canRequestResources: true,
  canApproveRequests: false, // Only founders approve
  canManageTeam: true,
  canAssignApprentices: true, // Can assign, but may need approval
  canSubmitRecommendations: true,

  // Full navigation
  canAccessDecideTab: true,
  canAccessWhoTab: true,
  canAccessWhatTab: true,
  canAccessDoTab: true,
  canAccessToolsTab: true,
};

const APPRENTICE_PERMISSIONS: RolePermissions = {
  // Very limited visibility - no cost info
  canViewPersonnelCosts: false,
  canViewBudgetInfo: false,
  canViewFinancialMetrics: false,
  canViewAIServiceCosts: true, // Exception: can see AI service costs
  canViewSupplierCosts: true, // Exception: can see vendor costs
  canViewAllMembers: true, // Can view all company members
  canViewTeamUtilization: false, // Can't see utilization rates

  // Limited actions - task focused
  canCreateTasks: false,
  canEditTasks: false, // Can only update their own task progress
  canDeleteTasks: false,
  canCreateObjectives: false,
  canEditObjectives: false,
  canAllocateResources: false,
  canAllocateWithoutApproval: false,
  canRequestResources: false,
  canApproveRequests: false,
  canManageTeam: false,
  canAssignApprentices: false,
  canSubmitRecommendations: false,

  // Limited navigation - focused on tasks
  canAccessDecideTab: false, // No access to strategic decisions
  canAccessWhoTab: true, // Can see team structure
  canAccessWhatTab: true, // Can see tasks
  canAccessDoTab: true, // Primary focus - their tasks
  canAccessToolsTab: true, // Can use tools
};

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: UserRole): RolePermissions {
  switch (role) {
    case 'Founder':
      return FOUNDER_PERMISSIONS;
    case 'FractionalExec':
      return EXEC_PERMISSIONS;
    case 'Apprentice':
      return APPRENTICE_PERMISSIONS;
    default:
      return APPRENTICE_PERMISSIONS; // Default to most restrictive
  }
}

/**
 * Hook to get current user's permissions
 */
export function usePermissions(): RolePermissions & { role: UserRole | null; isLoading: boolean } {
  const membership = useCurrentMembership();

  if (!membership) {
    return {
      ...APPRENTICE_PERMISSIONS, // Default to most restrictive
      role: null,
      isLoading: true,
    };
  }

  const role = membership.role as UserRole;
  const permissions = getPermissionsForRole(role);

  return {
    ...permissions,
    role,
    isLoading: false,
  };
}

/**
 * Check if a member can be managed by the current user
 */
export function canManageMember(
  currentMember: OrganizationMember,
  targetMember: OrganizationMember
): boolean {
  // Founders can manage everyone
  if (currentMember.role === 'Founder') return true;

  // Execs can manage their direct reports
  if (currentMember.role === 'FractionalExec') {
    return currentMember.manages?.includes(targetMember.id) ?? false;
  }

  // Apprentices can't manage anyone
  return false;
}

/**
 * Check if current user can allocate a specific member
 */
export function canAllocateMember(
  currentMember: OrganizationMember,
  targetMember: OrganizationMember,
  delegationEnabled: boolean = false
): { canAllocate: boolean; requiresApproval: boolean } {
  // Founders can always allocate without approval
  if (currentMember.role === 'Founder') {
    return { canAllocate: true, requiresApproval: false };
  }

  // Execs can allocate their direct reports
  if (currentMember.role === 'FractionalExec') {
    const isDirectReport = currentMember.manages?.includes(targetMember.id) ?? false;

    if (isDirectReport) {
      // If delegation is enabled, no approval needed
      return { canAllocate: true, requiresApproval: !delegationEnabled };
    }

    // Execs can request to allocate other apprentices (always needs approval)
    if (targetMember.role === 'Apprentice') {
      return { canAllocate: true, requiresApproval: true };
    }

    return { canAllocate: false, requiresApproval: false };
  }

  // Apprentices can't allocate anyone
  return { canAllocate: false, requiresApproval: false };
}

/**
 * Filter members based on what the current role can see
 */
export function filterMembersForRole(
  members: OrganizationMember[],
  role: UserRole
): OrganizationMember[] {
  // All roles can see all members (for navigation)
  return members;
}

/**
 * Filter cost information from a member based on role
 */
export function sanitizeMemberForRole(
  member: OrganizationMember,
  role: UserRole
): OrganizationMember {
  const permissions = getPermissionsForRole(role);

  if (!permissions.canViewPersonnelCosts) {
    // Remove cost information for non-founders
    return {
      ...member,
      costPerDay: undefined,
    };
  }

  return member;
}

/**
 * Check if user can view a specific cost type
 */
export function canViewCost(
  role: UserRole,
  costType: 'personnel' | 'budget' | 'financial' | 'ai' | 'supplier'
): boolean {
  const permissions = getPermissionsForRole(role);

  switch (costType) {
    case 'personnel':
      return permissions.canViewPersonnelCosts;
    case 'budget':
      return permissions.canViewBudgetInfo;
    case 'financial':
      return permissions.canViewFinancialMetrics;
    case 'ai':
      return permissions.canViewAIServiceCosts;
    case 'supplier':
      return permissions.canViewSupplierCosts;
    default:
      return false;
  }
}
