/**
 * Centralized Organization Store
 * Single source of truth for all organization data (members, AI agents, supplier engagements)
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  type OrganizationMember,
  type AIAgent,
  type SupplierEngagement,
} from '@/lib/organization-seed';

interface OrganizationState {
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  supplierEngagements: SupplierEngagement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeOrganization: () => void;
  loadMembersFromSupabase: (workspaceId: string) => Promise<void>;
  loadEngagementsFromSupabase: (workspaceId: string) => Promise<void>;

  // Member methods
  getMemberById: (id: string) => OrganizationMember | undefined;
  getMembersByRole: (role: OrganizationMember['role']) => OrganizationMember[];
  getMembersByFunction: (func: string) => OrganizationMember[];
  addMember: (member: OrganizationMember) => void;
  updateMember: (id: string, updates: Partial<OrganizationMember>) => void;
  removeMember: (id: string) => void;

  // AI Agent methods
  getAIAgentById: (id: string) => AIAgent | undefined;
  getAIAgentsByFunction: (func: string) => AIAgent[];
  getActiveAIAgents: () => AIAgent[];
  deleteAIAgent: (id: string) => void;

  // Supplier Engagement methods
  getEngagementById: (id: string) => SupplierEngagement | undefined;
  getEngagementsByStatus: (status: SupplierEngagement['status']) => SupplierEngagement[];
  getEngagementsByAssignee: (assignedTo: string) => SupplierEngagement[];
  updateSupplierEngagement: (id: string, updates: Partial<SupplierEngagement>) => void;
  linkWorkPlanToSupplier: (engagementId: string, workPlanId: string) => void;
  unlinkWorkPlanFromSupplier: (engagementId: string, workPlanId: string) => void;

  // Calculated metrics
  getTotalAISpend: () => number;
  getTotalTeamCost: () => { total: number; founders: number; execs: number; apprentices: number };
  getTotalSupplierSpend: () => { total: number; paid: number; remaining: number };

  // Counts
  getCounts: () => {
    founders: number;
    executives: number;
    apprentices: number;
    activeAIAgents: number;
    activeEngagements: number;
  };

  // Reset method for clearing all data
  reset: () => void;

  // Multi-tenancy methods
  getMembersByWorkspace: (workspaceId: string) => OrganizationMember[];
  getAIAgentsByWorkspace: (workspaceId: string) => AIAgent[];
  getEngagementsByWorkspace: (workspaceId: string) => SupplierEngagement[];
  getAllMembers: () => OrganizationMember[]; // For government users
  getAllAIAgents: () => AIAgent[]; // For government users
  getAllEngagements: () => SupplierEngagement[]; // For government users
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  members: [],
  aiAgents: [],
  supplierEngagements: [],
  isLoading: false,
  error: null,

  initializeOrganization: () => {
    // DISABLED: No longer auto-loading seed data for new users
    // Users should start with empty organization and add their own data
    // Data should be loaded via loadMembersFromSupabase() and loadEngagementsFromSupabase()
    set({
      members: [],
      aiAgents: [],
      supplierEngagements: [],
    });
  },

  loadMembersFromSupabase: async (workspaceId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load members from Supabase
      // Note: We no longer try to delete dummy members as they may have foreign key references
      // Instead, we just filter them out client-side
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Error loading members:', membersError);
        set({ error: membersError.message, isLoading: false });
        return;
      }

      // Filter out any dummy data - only keep members with user_id
      const realMembers = (membersData || []).filter((m: any) => m.user_id);

      // Remove duplicates - keep only the most recent member per user_id
      const uniqueMembersMap = new Map<string, any>();
      const duplicatesToDelete: string[] = [];

      realMembers.forEach((m: any) => {
        const existing = uniqueMembersMap.get(m.user_id);
        if (!existing) {
          uniqueMembersMap.set(m.user_id, m);
        } else {
          // Keep the most recent one
          if (new Date(m.created_at) > new Date(existing.created_at)) {
            duplicatesToDelete.push(existing.id);
            uniqueMembersMap.set(m.user_id, m);
          } else {
            duplicatesToDelete.push(m.id);
          }
        }
      });

      // Delete duplicates from database
      if (duplicatesToDelete.length > 0) {
        console.log(`[Organization] Deleting ${duplicatesToDelete.length} duplicate members:`, duplicatesToDelete);
        for (const id of duplicatesToDelete) {
          await supabase.from('members').delete().eq('id', id);
        }
      }

      // Transform Supabase data to OrganizationMember format
      const members: OrganizationMember[] = Array.from(uniqueMembersMap.values()).map((m: any) => ({
        id: m.id,
        workspaceId: m.workspace_id,
        userId: m.user_id, // Link to auth user
        name: m.name,
        role: m.role as 'Founder' | 'CoFounder' | 'FractionalExec' | 'Apprentice',
        function: m.function || 'General',
        status: m.status as 'active' | 'inactive',
        daysPerWeek: m.days_per_week || 5,
        costPerDay: m.cost_per_day || 0,
        email: '', // Not in current DB schema
        startDate: m.created_at || new Date().toISOString(),
      }));

      console.log(`[Organization] Loaded ${members.length} unique members for workspace ${workspaceId}`);
      set({ members, isLoading: false });
    } catch (err) {
      console.error('Error loading members from Supabase:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to load members', isLoading: false });
    }
  },

  loadEngagementsFromSupabase: async (workspaceId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load supplier engagements from Supabase
      const { data: engagementsData, error: engagementsError } = await supabase
        .from('supplier_engagements')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (engagementsError) {
        console.error('Error loading engagements:', engagementsError);
        set({ error: engagementsError.message, isLoading: false });
        return;
      }

      // Transform Supabase data to SupplierEngagement format
      const engagements: SupplierEngagement[] = (engagementsData || []).map((e: any) => ({
        id: e.id,
        workspaceId: e.workspace_id,
        supplierId: e.supplier_id || '',
        supplierName: 'Unknown', // Will need to join with suppliers table or fetch separately
        projectName: 'Project', // Not in current schema
        description: '', // Not in current schema
        category: (e.category || 'Professional Services') as 'Manufacturing' | 'Materials' | 'Logistics' | 'Professional Services',
        status: (e.status === 'completed' ? 'delivered' : e.status) as 'planning' | 'in_progress' | 'delivered' | 'cancelled',
        totalCost: Number(e.contract_value) || 0,
        paidToDate: Number(e.paid_to_date) || 0,
        deliveryDate: e.end_date || '',
        startDate: e.start_date || '',
        tasks: [], // Not in current schema
        linkedWorkPlanIds: [], // Not in current schema
        assignedTo: '', // Not in current schema
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        location: {
          city: '',
          address: '',
          latitude: 0,
          longitude: 0,
        },
      }));

      set({ supplierEngagements: engagements, isLoading: false });
    } catch (err) {
      console.error('Error loading engagements from Supabase:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to load engagements', isLoading: false });
    }
  },

  // Member methods
  getMemberById: (id: string) => {
    return get().members.find(m => m.id === id);
  },

  getMembersByRole: (role: OrganizationMember['role']) => {
    return get().members.filter(m => m.role === role && m.status === 'active');
  },

  getMembersByFunction: (func: string) => {
    return get().members.filter(m => m.function === func && m.status === 'active');
  },

  addMember: async (member: OrganizationMember) => {
    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMember = { ...member, id: member.id || tempId };

    // Optimistic update
    set((state) => ({
      members: [...state.members, tempMember]
    }));

    try {
      // Transform to Supabase format
      const supabaseMember = {
        id: member.id !== tempId ? member.id : undefined,
        workspace_id: member.workspaceId,
        name: member.name,
        role: member.role,
        function: member.function,
        status: member.status,
        days_per_week: member.daysPerWeek,
        cost_per_day: member.costPerDay,
      };

      const { data, error } = await supabase
        .from('members')
        .insert(supabaseMember)
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      const realMember: OrganizationMember = {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        role: data.role,
        function: data.function || 'General',
        status: data.status,
        daysPerWeek: data.days_per_week,
        costPerDay: data.cost_per_day,
        email: '',
        startDate: data.created_at || new Date().toISOString(),
      };

      set((state) => ({
        members: state.members.map(m => m.id === tempId ? realMember : m)
      }));
    } catch (err) {
      // Rollback on error
      set((state) => ({
        members: state.members.filter(m => m.id !== tempId)
      }));
      console.error('Failed to add member:', err);
      throw err;
    }
  },

  updateMember: async (id: string, updates: Partial<OrganizationMember>) => {
    // Store previous state for rollback
    const previousMembers = get().members;

    // Optimistic update
    set((state) => ({
      members: state.members.map(m => m.id === id ? { ...m, ...updates } : m)
    }));

    try {
      // Transform updates to Supabase format
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.role !== undefined) supabaseUpdates.role = updates.role;
      if (updates.function !== undefined) supabaseUpdates.function = updates.function;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.daysPerWeek !== undefined) supabaseUpdates.days_per_week = updates.daysPerWeek;
      if (updates.costPerDay !== undefined) supabaseUpdates.cost_per_day = updates.costPerDay;

      const { data, error } = await supabase
        .from('members')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with real data from server
      const updatedMember: OrganizationMember = {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        role: data.role,
        function: data.function || 'General',
        status: data.status,
        daysPerWeek: data.days_per_week,
        costPerDay: data.cost_per_day,
        email: '',
        startDate: data.created_at || new Date().toISOString(),
      };

      set((state) => ({
        members: state.members.map(m => m.id === id ? updatedMember : m)
      }));
    } catch (err) {
      // Rollback on error
      set({ members: previousMembers });
      console.error('Failed to update member:', err);
      throw err;
    }
  },

  removeMember: async (id: string) => {
    // Store previous state for rollback
    const previousMembers = get().members;

    // Optimistic update
    set((state) => ({
      members: state.members.filter(m => m.id !== id)
    }));

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      set({ members: previousMembers });
      console.error('Failed to remove member:', err);
      throw err;
    }
  },

  // AI Agent methods
  getAIAgentById: (id: string) => {
    return get().aiAgents.find(a => a.id === id);
  },

  getAIAgentsByFunction: (func: string) => {
    return get().aiAgents.filter(a => a.functions.includes(func) && a.status === 'active');
  },

  getActiveAIAgents: () => {
    return get().aiAgents.filter(a => a.status === 'active');
  },

  deleteAIAgent: (id: string) => {
    set((state) => ({
      aiAgents: state.aiAgents.filter(agent => agent.id !== id)
    }));
  },

  // Supplier Engagement methods
  getEngagementById: (id: string) => {
    return get().supplierEngagements.find(e => e.id === id);
  },

  getEngagementsByStatus: (status: SupplierEngagement['status']) => {
    return get().supplierEngagements.filter(e => e.status === status);
  },

  getEngagementsByAssignee: (assignedTo: string) => {
    return get().supplierEngagements.filter(e => e.assignedTo === assignedTo);
  },

  updateSupplierEngagement: async (id: string, updates: Partial<SupplierEngagement>) => {
    // Store previous state for rollback
    const previousEngagements = get().supplierEngagements;

    // Optimistic update
    set((state) => ({
      supplierEngagements: state.supplierEngagements.map(e =>
        e.id === id ? { ...e, ...updates } : e
      )
    }));

    try {
      // Transform updates to Supabase format
      const supabaseUpdates: any = {};
      if (updates.status !== undefined) {
        // Map status to Supabase schema
        const statusMap: Record<string, string> = {
          'delivered': 'completed',
          'in_progress': 'active',
          'planning': 'pending',
          'cancelled': 'cancelled',
        };
        supabaseUpdates.status = statusMap[updates.status] || updates.status;
      }
      if (updates.totalCost !== undefined) supabaseUpdates.contract_value = updates.totalCost;
      if (updates.paidToDate !== undefined) supabaseUpdates.paid_to_date = updates.paidToDate;
      if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
      if (updates.deliveryDate !== undefined) supabaseUpdates.end_date = updates.deliveryDate;
      if (updates.category !== undefined) supabaseUpdates.category = updates.category;

      const { data, error } = await supabase
        .from('supplier_engagements')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with real data from server
      const current = get().supplierEngagements.find(e => e.id === id);
      if (current) {
        set((state) => ({
          supplierEngagements: state.supplierEngagements.map(e =>
            e.id === id ? { ...current, ...updates } : e
          )
        }));
      }
    } catch (err) {
      // Rollback on error
      set({ supplierEngagements: previousEngagements });
      console.error('Failed to update supplier engagement:', err);
      throw err;
    }
  },

  linkWorkPlanToSupplier: (engagementId: string, workPlanId: string) => {
    set((state) => ({
      supplierEngagements: state.supplierEngagements.map(e =>
        e.id === engagementId
          ? {
              ...e,
              linkedWorkPlanIds: [...(e.linkedWorkPlanIds || []), workPlanId]
            }
          : e
      )
    }));
  },

  unlinkWorkPlanFromSupplier: (engagementId: string, workPlanId: string) => {
    set((state) => ({
      supplierEngagements: state.supplierEngagements.map(e =>
        e.id === engagementId
          ? {
              ...e,
              linkedWorkPlanIds: (e.linkedWorkPlanIds || []).filter(id => id !== workPlanId)
            }
          : e
      )
    }));
  },

  // Calculated metrics
  getTotalAISpend: () => {
    // Calculate AI spend from active AI agents
    const activeAgents = get().aiAgents.filter(a => a.status === 'active');
    return activeAgents.reduce((sum, agent) => sum + (agent.costPerMonth || 0), 0);
  },

  getTotalTeamCost: () => {
    // Calculate team costs from active members
    const activeMembers = get().members.filter(m => m.status === 'active');
    const founders = activeMembers.filter(m => m.role === 'Founder');
    const execs = activeMembers.filter(m => m.role === 'FractionalExec');
    const apprentices = activeMembers.filter(m => m.role === 'Apprentice');

    return {
      total: activeMembers.reduce((sum, m) => sum + ((m.costPerDay || 0) * (m.daysPerWeek || 5)), 0),
      founders: founders.reduce((sum, m) => sum + ((m.costPerDay || 0) * (m.daysPerWeek || 5)), 0),
      execs: execs.reduce((sum, m) => sum + ((m.costPerDay || 0) * (m.daysPerWeek || 5)), 0),
      apprentices: apprentices.reduce((sum, m) => sum + ((m.costPerDay || 0) * (m.daysPerWeek || 5)), 0),
    };
  },

  getTotalSupplierSpend: () => {
    // Calculate supplier spend from engagements
    const engagements = get().supplierEngagements;
    const total = engagements.reduce((sum, e) => sum + e.totalCost, 0);
    const paid = engagements.reduce((sum, e) => sum + e.paidToDate, 0);

    return {
      total,
      paid,
      remaining: total - paid,
    };
  },

  // Counts
  getCounts: () => {
    const members = get().members;
    const aiAgents = get().aiAgents;
    const engagements = get().supplierEngagements;

    return {
      founders: members.filter(m => m.role === 'Founder' && m.status === 'active').length,
      executives: members.filter(m => m.role === 'FractionalExec' && m.status === 'active').length,
      apprentices: members.filter(m => m.role === 'Apprentice' && m.status === 'active').length,
      activeAIAgents: aiAgents.filter(a => a.status === 'active').length,
      activeEngagements: engagements.filter(e => e.status === 'in_progress' || e.status === 'planning').length,
    };
  },

  // Multi-tenancy methods
  getMembersByWorkspace: (workspaceId: string) => {
    return get().members.filter(m => m.workspaceId === workspaceId);
  },

  getAIAgentsByWorkspace: (workspaceId: string) => {
    return get().aiAgents.filter(a => a.workspaceId === workspaceId);
  },

  getEngagementsByWorkspace: (workspaceId: string) => {
    return get().supplierEngagements.filter(e => e.workspaceId === workspaceId);
  },

  getAllMembers: () => {
    return get().members; // No filter - for government users
  },

  getAllAIAgents: () => {
    return get().aiAgents; // No filter - for government users
  },

  getAllEngagements: () => {
    return get().supplierEngagements; // No filter - for government users
  },

  // Reset method - clears all organization data
  reset: () => {
    set({
      members: [],
      aiAgents: [],
      supplierEngagements: [],
    });
  },
}));

// Selector hooks for optimal performance
export const useOrganizationMembers = () => useOrganizationStore(s => s.members);
export const useAIAgents = () => useOrganizationStore(s => s.aiAgents);
export const useSupplierEngagements = () => useOrganizationStore(s => s.supplierEngagements);
export const useOrganizationCounts = () => useOrganizationStore(s => s.getCounts());
export const useMembersByRole = (role: OrganizationMember['role']) => useOrganizationStore(s => s.getMembersByRole(role));
export const useAIAgentsByFunction = (func: string) => useOrganizationStore(s => s.getAIAgentsByFunction(func));
