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

  // AI Agent methods
  getAIAgentById: (id: string) => AIAgent | undefined;
  getAIAgentsByFunction: (func: string) => AIAgent[];
  getActiveAIAgents: () => AIAgent[];

  // Supplier Engagement methods
  getEngagementById: (id: string) => SupplierEngagement | undefined;
  getEngagementsByStatus: (status: SupplierEngagement['status']) => SupplierEngagement[];
  getEngagementsByAssignee: (assignedTo: string) => SupplierEngagement[];

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
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  members: [],
  aiAgents: [],
  supplierEngagements: [],

  initializeOrganization: () => {
    set({
      members: ORGANIZATION_MEMBERS,
      aiAgents: AI_AGENTS,
      supplierEngagements: SUPPLIER_ENGAGEMENTS,
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
}));

// Selector hooks for optimal performance
export const useOrganizationMembers = () => useOrganizationStore(s => s.members);
export const useAIAgents = () => useOrganizationStore(s => s.aiAgents);
export const useSupplierEngagements = () => useOrganizationStore(s => s.supplierEngagements);
export const useOrganizationCounts = () => useOrganizationStore(s => s.getCounts());
export const useMembersByRole = (role: OrganizationMember['role']) => useOrganizationStore(s => s.getMembersByRole(role));
export const useAIAgentsByFunction = (func: string) => useOrganizationStore(s => s.getAIAgentsByFunction(func));
