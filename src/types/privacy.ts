/**
 * Privacy & Visibility System Types
 * Defines visibility levels and access control for tasks and resources
 */

import type { Role, Function } from './index';

/**
 * Task visibility levels
 * - private: Only the owner can see
 * - shared: Owner + specifically shared users
 * - function: All members in the task's business function
 * - company: All workspace members
 * - restricted: Special category access required
 */
export type TaskVisibility =
  | 'private'
  | 'shared'
  | 'function'
  | 'company'
  | 'restricted';

/**
 * Restricted access categories for sensitive information
 */
export type RestrictedCategory =
  | 'hr'           // HR-sensitive (performance reviews, terminations, salaries)
  | 'legal'        // Legal matters (litigation, IP, compliance)
  | 'executive'    // C-suite only discussions (board, fundraising)
  | 'confidential' // General confidential matters
  | 'finance';     // Financial sensitive data (M&A, budgets)

/**
 * Permission level when sharing a task
 */
export type SharePermission =
  | 'view'    // Can only view the task
  | 'edit'    // Can view and edit the task
  | 'share';  // Can view, edit, and share with others

/**
 * Sharing configuration for a task
 */
export interface TaskSharing {
  /** User IDs who have access */
  userIds?: string[];

  /** Roles that have access */
  roles?: Role[];

  /** Business functions that have access */
  functions?: Function[];

  /** Permission level for shared users */
  permission?: SharePermission;

  /** Optional expiration date for shared access */
  expiresAt?: string;
}

/**
 * Restricted access grant for a user
 */
export interface RestrictedAccessGrant {
  id: string;
  workspaceId: string;
  userId: string;
  category: RestrictedCategory;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

/**
 * User privacy preferences
 */
export interface PrivacyPreferences {
  /** Default visibility for new tasks */
  defaultVisibility: TaskVisibility;

  /** Allow founders to see private tasks (default: true) */
  allowFounderOverride: boolean;

  /** Show privacy badges on tasks */
  showPrivacyBadges: boolean;
}

/**
 * Audit log entry for privacy-related actions
 */
export interface PrivacyAuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: 'view' | 'share' | 'unshare' | 'visibility_change' | 'access_grant' | 'access_revoke';
  resourceType: 'task' | 'member' | 'okr' | 'decision';
  resourceId: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Visibility check result
 */
export interface VisibilityCheckResult {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  reason?: string;
}
