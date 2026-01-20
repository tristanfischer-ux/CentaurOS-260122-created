/**
 * Supabase Service Layer
 *
 * Centralized database operations for Centaur OS.
 * Uses existing Supabase tables: profiles, workspaces, memberships, team_members, okrs, tasks, decisions, work_plans
 */

import { supabase } from './supabase';
import type {
  User,
  Workspace,
  Membership,
  Task,
} from '@/types';

// ============================================================================
// TYPE CONVERSIONS (Supabase snake_case <-> App camelCase)
// ============================================================================

// Convert Supabase row to User (from profiles table)
function supabaseToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.email?.split('@')[0] || 'User', // Derive name from email since profiles table doesn't have name column
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    preferences: {
      themeMode: row.theme_mode || 'system',
    },
  };
}

// Convert User to Supabase row (for profiles table)
// Note: profiles table doesn't have 'name' column - only id, email, avatar_url, theme_mode
function userToSupabase(user: Partial<User>): any {
  const result: any = {};

  if (user.id !== undefined) result.id = user.id;
  if (user.email !== undefined) result.email = user.email;
  if (user.avatarUrl !== undefined) result.avatar_url = user.avatarUrl;
  if (user.preferences?.themeMode !== undefined) result.theme_mode = user.preferences.themeMode;

  // Remove undefined values
  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
}

// Convert Supabase row to Workspace
function supabaseToWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id || '', // May not exist in table, use empty string as fallback
    createdAt: row.created_at,
  };
}

// Convert Workspace to Supabase row
// Note: workspaces table doesn't have 'owner_id' column - only id, name, created_at
function workspaceToSupabase(workspace: Partial<Workspace>): any {
  const result: any = {};

  if (workspace.id !== undefined) result.id = workspace.id;
  if (workspace.name !== undefined) result.name = workspace.name;
  // owner_id doesn't exist in table, skip it

  // Remove undefined values
  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
}

// Convert Supabase row to Membership
function supabaseToMembership(row: any): Membership {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    function: row.function || 'Admin', // Default to Admin if column doesn't exist
    joinedAt: row.joined_at,
    permissions: row.permissions || {},
  };
}

// Convert Membership to Supabase row
function membershipToSupabase(membership: Partial<Membership>): any {
  const result: any = {};

  // Only include defined values to avoid sending columns that don't exist
  if (membership.id !== undefined) result.id = membership.id;
  if (membership.workspaceId !== undefined) result.workspace_id = membership.workspaceId;
  if (membership.userId !== undefined) result.user_id = membership.userId;
  if (membership.role !== undefined) result.role = membership.role;
  if (membership.function !== undefined) result.function = membership.function;
  if (membership.permissions !== undefined) result.permissions = membership.permissions;

  return result;
}

// Convert Supabase row to Member (from members table)
function supabaseToMember(row: any): any {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    function: row.function,
    status: row.status,
    daysPerWeek: row.days_per_week,
    costPerDay: row.cost_per_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert Member to Supabase row (for members table)
function memberToSupabase(member: any): any {
  const result: any = {};

  if (member.id !== undefined) result.id = member.id;
  if (member.workspaceId !== undefined) result.workspace_id = member.workspaceId;
  if (member.userId !== undefined) result.user_id = member.userId;
  if (member.name !== undefined) result.name = member.name;
  if (member.role !== undefined) result.role = member.role;
  if (member.function !== undefined) result.function = member.function;
  if (member.status !== undefined) result.status = member.status;
  if (member.daysPerWeek !== undefined) result.days_per_week = member.daysPerWeek;
  if (member.costPerDay !== undefined) result.cost_per_day = member.costPerDay;

  // Remove undefined values
  Object.keys(result).forEach(key => result[key] === undefined && delete result[key]);

  return result;
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

// Convert Supabase OKR row (objectives stored as JSONB array)
function supabaseToOKR(row: any): any {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    function: row.function,
    title: row.title,
    description: row.description,
    owner: row.owner,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    queueStatus: row.queue_status,
    objectives: row.objectives || [], // JSONB array
    isExpanded: false, // Local UI state
  };
}

// Convert OKR to Supabase row
function okrToSupabase(okr: any): any {
  return {
    id: okr.id,
    workspace_id: okr.workspaceId,
    function: okr.function,
    title: okr.title,
    description: okr.description,
    owner: okr.owner,
    start_date: okr.startDate,
    end_date: okr.endDate,
    status: okr.status,
    queue_status: okr.queueStatus,
    objectives: okr.objectives, // JSONB array
  };
}

// ============================================================================
// USER OPERATIONS (profiles table)
// ============================================================================

export const userService = {
  /**
   * Get user by ID from profiles table
   */
  async getById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error.message, error.details, error.hint);
      return null;
    }

    return data ? supabaseToUser(data) : null;
  },

  /**
   * Get user by email from profiles table
   */
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      // User not found is not an error for this query
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user by email:', error.message, error.details, error.hint);
      return null;
    }

    return data ? supabaseToUser(data) : null;
  },

  /**
   * Create a new user profile
   * Note: This will only work if the RLS policy allows the authenticated user to insert their own profile
   * The policy should be: CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
   */
  async create(user: { id: string; email: string; name: string }): Promise<User> {
    // First, check if profile already exists (Supabase may auto-create it)
    const existing = await this.getById(user.id);
    if (existing) {
      console.log('[userService] Profile already exists, returning existing profile');
      return existing;
    }

    // Try to create the profile
    const { data, error } = await supabase
      .from('profiles')
      .insert(userToSupabase(user))
      .select()
      .single();

    if (error) {
      console.error('Failed to create user:', error.message, error.details, error.hint);

      // Check if profile was auto-created by Supabase trigger
      const retryFetch = await this.getById(user.id);
      if (retryFetch) {
        console.log('[userService] Profile was auto-created by Supabase, using that instead');
        return retryFetch;
      }

      throw new Error(`Failed to create user: ${error.message}`);
    }

    return supabaseToUser(data);
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update(userToSupabase(updates))
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error.message, error.details, error.hint);
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
   * Uses a direct workspace query with RLS instead of querying memberships first
   */
  async getForUser(userId: string): Promise<Workspace[]> {
    // Query workspaces directly - RLS should handle membership filtering
    const { data, error } = await supabase
      .from('workspaces')
      .select('*');

    if (error) {
      console.error('Error fetching workspaces:', error.message, error.details, error.hint);
      return [];
    }

    return (data || []).map(supabaseToWorkspace);
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
      console.error('Error fetching workspace:', error.message, error.details, error.hint);
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
      console.error('Failed to create workspace:', error.message, error.details, error.hint);
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    // Automatically create a Founder membership for the owner
    try {
      await membershipService.create({
        workspaceId: data.id,
        userId: workspace.ownerId,
        role: 'Founder',
        // Note: 'function' column may not exist in database, so we don't pass it
      });
    } catch (membershipError) {
      console.error('Failed to create founder membership:', membershipError);
      // Don't throw here - workspace was created successfully
    }

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
      console.error('Failed to update workspace:', error.message, error.details, error.hint);
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
      console.error('Error fetching memberships:', error.message, error.details, error.hint);
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
      console.error('Error fetching workspace memberships:', error.message, error.details, error.hint);
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
      console.error('Error fetching membership:', error.message, error.details, error.hint);
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
    role: 'Founder' | 'FractionalExec' | 'Apprentice';
    function?: 'Finance' | 'Sales' | 'Marketing' | 'Ops' | 'Engineering' | 'Admin';
  }): Promise<Membership> {
    const payload = membershipToSupabase(membership);
    console.log('[membershipService.create] Inserting membership with payload:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from('memberships')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to create membership:', error.message, error.details, error.hint);
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
      console.error('Failed to update membership:', error.message, error.details, error.hint);
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
      console.error('Failed to delete membership:', error.message, error.details, error.hint);
      throw new Error(`Failed to delete membership: ${error.message}`);
    }
  },
};

// ============================================================================
// MEMBER OPERATIONS (members table - people in workspaces)
// ============================================================================

export const memberService = {
  /**
   * Get all members for a workspace
   */
  async getForWorkspace(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }

    return data.map(supabaseToMember);
  },

  /**
   * Get member by user ID and workspace ID
   */
  async getByUserAndWorkspace(userId: string, workspaceId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member:', error);
      return null;
    }

    return data ? supabaseToMember(data) : null;
  },

  /**
   * Create a new member
   */
  async create(member: {
    workspaceId: string;
    userId?: string;
    name: string;
    role: string;
    function?: string;
    status?: string;
    daysPerWeek?: number;
    costPerDay?: number;
  }): Promise<any> {
    const { data, error} = await supabase
      .from('members')
      .insert(memberToSupabase(member))
      .select()
      .single();

    if (error) {
      console.error('Failed to create member:', error.message, error.details, error.hint);
      throw new Error(`Failed to create member: ${error.message}`);
    }

    return supabaseToMember(data);
  },

  /**
   * Update member
   */
  async update(memberId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('members')
      .update(memberToSupabase(updates))
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update member:', error.message, error.details, error.hint);
      throw new Error(`Failed to update member: ${error.message}`);
    }

    return supabaseToMember(data);
  },

  /**
   * Delete member
   */
  async delete(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Failed to delete member:', error.message, error.details, error.hint);
      throw new Error(`Failed to delete member: ${error.message}`);
    }
  },
};

// ============================================================================
// TEAM MEMBER OPERATIONS (team_members table - legacy system)
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
// OKR OPERATIONS (objectives stored as JSONB array in okrs table)
// ============================================================================

export const okrService = {
  /**
   * Get all OKRs for a workspace
   */
  async getForWorkspace(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching OKRs:', error);
      return [];
    }

    return data.map(supabaseToOKR);
  },

  /**
   * Create a new OKR
   */
  async create(okr: any): Promise<any> {
    const { data, error } = await supabase
      .from('okrs')
      .insert(okrToSupabase(okr))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create OKR: ${error.message}`);
    }

    return supabaseToOKR(data);
  },

  /**
   * Update OKR (including objectives array)
   */
  async update(okrId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('okrs')
      .update(okrToSupabase(updates))
      .eq('id', okrId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update OKR: ${error.message}`);
    }

    return supabaseToOKR(data);
  },

  /**
   * Delete OKR
   */
  async delete(okrId: string): Promise<void> {
    const { error } = await supabase
      .from('okrs')
      .delete()
      .eq('id', okrId);

    if (error) {
      throw new Error(`Failed to delete OKR: ${error.message}`);
    }
  },
};

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export const taskService = {
  /**
   * Get all tasks for a workspace
   */
  async getForWorkspace(workspaceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data;
  },

  /**
   * Create a new task
   */
  async create(task: any): Promise<any> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
  },

  /**
   * Update task
   */
  async update(taskId: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete task
   */
  async delete(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  },
};

// ============================================================================
// INITIALIZE USER DATA
// ============================================================================

/**
 * Initialize all user data after login
 * Fetches workspaces, memberships, and team members from existing tables
 */
export async function initializeUserData(userId: string): Promise<{
  workspaces: Workspace[];
  memberships: Membership[];
  teamMembers: any[];
}> {
  try {
    console.log('[initializeUserData] Starting for userId:', userId);

    // Fetch in parallel
    const [workspaces, memberships] = await Promise.all([
      workspaceService.getForUser(userId),
      membershipService.getForUser(userId),
    ]);

    console.log('[initializeUserData] Loaded workspaces:', workspaces.length);
    console.log('[initializeUserData] Loaded memberships:', memberships.length);

    // Fetch team members for all workspaces
    const teamMembersPromises = workspaces.map((ws) =>
      teamMemberService.getForWorkspace(ws.id)
    );
    const teamMembersArrays = await Promise.all(teamMembersPromises);
    const teamMembers = teamMembersArrays.flat();

    console.log('[initializeUserData] Loaded team members:', teamMembers.length);

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
