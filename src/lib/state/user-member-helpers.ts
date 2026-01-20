/**
 * User-Member Linking Helpers
 * Maps Supabase auth users to OrganizationMembers
 */

import { useAppStore } from './app-store';
import { useOrganizationStore } from './organization-store';
import type { OrganizationMember } from '@/lib/organization-seed';

/**
 * Hook to get the current user's organization member record
 * Links Supabase auth user to their OrganizationMember role
 */
export function useCurrentMember(): OrganizationMember | null {
  const currentUser = useAppStore(s => s.currentUser);
  const currentWorkspace = useAppStore(s => s.currentWorkspace);
  const members = useOrganizationStore(s => s.members);

  if (!currentUser || !currentWorkspace) return null;

  // Find member by userId in current workspace
  return members.find(
    m => m.workspaceId === currentWorkspace.id && m.userId === currentUser.id
  ) || null;
}

/**
 * Get a member's auth user ID
 */
export function getMemberUserId(memberId: string, members: OrganizationMember[]): string | undefined {
  return members.find(m => m.id === memberId)?.userId;
}

/**
 * Get all members with auth user IDs (can receive notifications)
 */
export function getMembersWithAuth(members: OrganizationMember[]): OrganizationMember[] {
  return members.filter(m => m.userId != null);
}

/**
 * Get all Founders with auth user IDs
 */
export function getFoundersWithAuth(workspaceId: string, members: OrganizationMember[]): OrganizationMember[] {
  return members.filter(
    m => m.workspaceId === workspaceId &&
         m.role === 'Founder' &&
         m.userId != null &&
         m.status === 'active'
  );
}
