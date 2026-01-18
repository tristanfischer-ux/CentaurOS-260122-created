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

      // Transform Supabase data to OrganizationMember format
      const members: OrganizationMember[] = (membersData || []).map((m: any) => ({
        id: m.id,
        workspaceId: m.workspace_id,
        name: m.name,
        role: m.role as 'Founder' | 'FractionalExec' | 'Apprentice',
        function: m.function || 'General',
        status: m.status as 'active' | 'inactive',
        daysPerWeek: m.days_per_week || 5,
        costPerDay: m.cost_per_day || 0,
        email: '', // Not in current DB schema
        startDate: m.created_at || new Date().toISOString(),
      }));

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

  addMember: (member: OrganizationMember) => {
    set((state) => ({
      members: [...state.members, member]
    }));
  },

  updateMember: (id: string, updates: Partial<OrganizationMember>) => {
    set((state) => ({
      members: state.members.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  },

  removeMember: (id: string) => {
    set((state) => ({
      members: state.members.filter(m => m.id !== id)
    }));
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

  updateSupplierEngagement: (id: string, updates: Partial<SupplierEngagement>) => {
    set((state) => ({
      supplierEngagements: state.supplierEngagements.map(e =>
        e.id === id ? { ...e, ...updates } : e
      )
    }));
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
