/**
 * Centralized Organization Store
 * Single source of truth for all organization data (members, AI agents, supplier engagements)
 */

import { create } from 'zustand';
import {
  ORGANIZATION_MEMBERS,
  AI_AGENTS,
  SUPPLIER_ENGAGEMENTS,
  getTotalAISpend,
  getTotalTeamCost,
  getTotalSupplierSpend,
  type OrganizationMember,
  type AIAgent,
  type SupplierEngagement,
} from '@/lib/organization-seed';

interface OrganizationState {
  members: OrganizationMember[];
  aiAgents: AIAgent[];
  supplierEngagements: SupplierEngagement[];

  // Actions
  initializeOrganization: () => void;

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

  initializeOrganization: () => {
    // DISABLED: No longer auto-loading seed data for new users
    // Users should start with empty organization and add their own data
    // set({
    //   members: ORGANIZATION_MEMBERS,
    //   aiAgents: AI_AGENTS,
    //   supplierEngagements: SUPPLIER_ENGAGEMENTS,
    // });

    // Start with empty arrays for fresh users
    set({
      members: [],
      aiAgents: [],
      supplierEngagements: [],
    });
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
    return getTotalAISpend();
  },

  getTotalTeamCost: () => {
    return getTotalTeamCost();
  },

  getTotalSupplierSpend: () => {
    return getTotalSupplierSpend();
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
}));

// Selector hooks for optimal performance
export const useOrganizationMembers = () => useOrganizationStore(s => s.members);
export const useAIAgents = () => useOrganizationStore(s => s.aiAgents);
export const useSupplierEngagements = () => useOrganizationStore(s => s.supplierEngagements);
export const useOrganizationCounts = () => useOrganizationStore(s => s.getCounts());
export const useMembersByRole = (role: OrganizationMember['role']) => useOrganizationStore(s => s.getMembersByRole(role));
export const useAIAgentsByFunction = (func: string) => useOrganizationStore(s => s.getAIAgentsByFunction(func));
