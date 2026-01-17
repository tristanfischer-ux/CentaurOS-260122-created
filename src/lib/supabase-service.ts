/**
 * Supabase Service Layer
 *
 * Centralized database operations for Centaur OS.
 * Handles all CRUD operations with proper error handling and type safety.
 */

import { supabase } from './supabase';
import type {
  User,
  Workspace,
  Membership,
  Objective,
  KeyResult,
  Task,
} from '@/types';

// ============================================================================
// TYPE CONVERSIONS (Supabase snake_case <-> App camelCase)
// ============================================================================

// Convert Supabase row to User
function supabaseToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    preferences: {
      themeMode: row.theme_mode || 'system',
    },
  };
}

// Convert User to Supabase row
function userToSupabase(user: Partial<User>): any {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatarUrl,
    theme_mode: user.preferences?.themeMode,
  };
}

// Convert Supabase row to Workspace
function supabaseToWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

// Convert Workspace to Supabase row
function workspaceToSupabase(workspace: Partial<Workspace>): any {
  return {
    id: workspace.id,
    name: workspace.name,
    owner_id: workspace.ownerId,
  };
}

// Convert Supabase row to Membership
function supabaseToMembership(row: any): Membership {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    function: row.function,
    joinedAt: row.joined_at,
    permissions: row.permissions || {},
  };
}

// Convert Membership to Supabase row
function membershipToSupabase(membership: Partial<Membership>): any {
  return {
    id: membership.id,
    workspace_id: membership.workspaceId,
    user_id: membership.userId,
    role: membership.role,
    function: membership.function,
    permissions: membership.permissions,
  };
}

// Convert Supabase row to TeamMember
function supabaseToTeamMember(row: any): any {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    initials: row.initials,
    email: row.email,
    avatarColor: row.avatar_color,
    personClass: row.person_class,
    function: row.function,
    baseSquaresPerWeek: parseFloat(row.base_squares_per_week || '10'),
    overtimeSquaresPerWeek: parseFloat(row.overtime_squares_per_week || '5'),
    overtimeEnabled: row.overtime_enabled || false,
    allocatedSquares: parseFloat(row.allocated_squares || '0'),
    costPerSquare: parseFloat(row.cost_per_square || '0'),
    dayRate: row.day_rate ? parseFloat(row.day_rate) : undefined,
    aiTools: row.ai_tools || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert TeamMember to Supabase row
function teamMemberToSupabase(member: any): any {
  return {
    id: member.id,
    workspace_id: member.workspaceId,
    user_id: member.userId,
    name: member.name,
    initials: member.initials,
    email: member.email,
    avatar_color: member.avatarColor,
    person_class: member.personClass,
    function: member.function,
    base_squares_per_week: member.baseSquaresPerWeek,
    overtime_squares_per_week: member.overtimeSquaresPerWeek,
    overtime_enabled: member.overtimeEnabled,
    allocated_squares: member.allocatedSquares,
    cost_per_square: member.costPerSquare,
    day_rate: member.dayRate,
    ai_tools: member.aiTools,
  };
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userService = {
  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data ? supabaseToUser(data) : null;
  },

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      // User not found is not an error for this query
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data ? supabaseToUser(data) : null;
  },

  /**
   * Create a new user profile
   */
  async create(user: { id: string; email: string; name: string }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userToSupabase(user))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return supabaseToUser(data);
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userToSupabase(updates))
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return supabaseToUser(data);
  },
};

// ============================================================================
// WORKSPACE OPERATIONS
// ============================================================================

export const workspaceService = {
  /**
   * Get all workspaces for a user
   */
  async getForUser(userId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        memberships!inner(user_id)
      `)
      .eq('memberships.user_id', userId);

    if (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }

    return data.map(supabaseToWorkspace);
  },

  /**
   * Get workspace by ID
   */
  async getById(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error) {
      console.error('Error fetching workspace:', error);
      return null;
    }

    return data ? supabaseToWorkspace(data) : null;
  },

  /**
   * Create a new workspace
   */
  async create(workspace: { name: string; ownerId: string }): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert(workspaceToSupabase(workspace))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    // Automatically create a Founder membership for the owner
    await membershipService.create({
      workspaceId: data.id,
      userId: workspace.ownerId,
      role: 'Founder',
      function: 'Admin', // Default function, can be changed later
    });

    return supabaseToWorkspace(data);
  },

  /**
   * Update workspace
   */
  async update(workspaceId: string, updates: Partial<Workspace>): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .update(workspaceToSupabase(updates))
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }

    return supabaseToWorkspace(data);
  },
};

// ============================================================================
// MEMBERSHIP OPERATIONS
// ============================================================================

export const membershipService = {
  /**
   * Get all memberships for a user
   */
  async getForUser(userId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching memberships:', error);
      return [];
    }

    return data.map(supabaseToMembership);
  },

  /**
   * Get all memberships for a workspace
   */
  async getForWorkspace(workspaceId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('Error fetching workspace memberships:', error);
      return [];
    }

    return data.map(supabaseToMembership);
  },

  /**
   * Get membership for user in workspace
   */
  async getForUserInWorkspace(userId: string, workspaceId: string): Promise<Membership | null> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching membership:', error);
      return null;
    }

    return data ? supabaseToMembership(data) : null;
  },

  /**
   * Create a new membership
   */
  async create(membership: {
    workspaceId: string;
    userId: string;
    role: 'Founder' | 'Apprentice' | 'FractionalExec' | 'Government' | 'Unaffiliated';
    function: 'Finance' | 'Sales' | 'Marketing' | 'Ops' | 'Engineering' | 'Admin';
  }): Promise<Membership> {
    const { data, error } = await supabase
      .from('memberships')
      .insert(membershipToSupabase(membership))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create membership: ${error.message}`);
    }

    return supabaseToMembership(data);
  },

  /**
   * Update membership
   */
  async update(membershipId: string, updates: Partial<Membership>): Promise<Membership> {
    const { data, error } = await supabase
      .from('memberships')
      .update(membershipToSupabase(updates))
      .eq('id', membershipId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update membership: ${error.message}`);
    }

    return supabaseToMembership(data);
  },

  /**
   * Delete membership
   */
  async delete(membershipId: string): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId);

    if (error) {
      throw new Error(`Failed to delete membership: ${error.message}`);
    }
  },
};

// ============================================================================
// TEAM MEMBER OPERATIONS
// ============================================================================

export const teamMemberService = {
  /**
   * Get all team members for a workspace
   */
  async getForWorkspace(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return [];
    }

    return data.map(supabaseToTeamMember);
  },

  /**
   * Create a new team member
   */
  async create(member: any): Promise<any> {
    const { data, error } = await supabase
      .from('team_members')
      .insert(teamMemberToSupabase(member))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create team member: ${error.message}`);
    }

    return supabaseToTeamMember(data);
  },

  /**
   * Update team member
   */
  async update(memberId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('team_members')
      .update(teamMemberToSupabase(updates))
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update team member: ${error.message}`);
    }

    return supabaseToTeamMember(data);
  },

  /**
   * Delete team member
   */
  async delete(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      throw new Error(`Failed to delete team member: ${error.message}`);
    }
  },
};

// ============================================================================
// INITIALIZE USER DATA
// ============================================================================

/**
 * Initialize all user data after login
 * Fetches workspaces, memberships, and team members
 */
export async function initializeUserData(userId: string) {
  try {
    // Fetch in parallel
    const [workspaces, memberships] = await Promise.all([
      workspaceService.getForUser(userId),
      membershipService.getForUser(userId),
    ]);

    // Fetch team members for all workspaces
    const teamMembersPromises = workspaces.map((ws) =>
      teamMemberService.getForWorkspace(ws.id)
    );
    const teamMembersArrays = await Promise.all(teamMembersPromises);
    const teamMembers = teamMembersArrays.flat();

    return {
      workspaces,
      memberships,
      teamMembers,
    };
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
}
