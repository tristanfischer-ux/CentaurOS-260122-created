/**
 * Centralized OKR Store
 * Single source of truth for all OKR data across the app
 */

import { create } from 'zustand';
import type { Function as BusinessFunction } from '@/types';

export interface Objective {
  id: string;
  title: string;
  target: string;
  current: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track';
  assignedMemberIds?: string[]; // Track assigned team members
}

export type QueueStatus = 'not_queued' | 'queued' | 'in_progress' | 'blocked' | 'completed' | 'paused';

export interface OKR {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links OKR to specific company
  function: BusinessFunction;
  title: string;
  description: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: 'on-track' | 'at-risk' | 'off-track';
  queueStatus?: QueueStatus; // Build queue status
  objectives: Objective[];
  isExpanded?: boolean;
}

interface OKRState {
  okrs: OKR[];
  selectedOKR: OKR | null;

  // Actions
  initializeOKRs: () => void;
  getOKRById: (id: string) => OKR | undefined;
  getOKRsByFunction: (func: BusinessFunction) => OKR[];
  getOKRsByStatus: (status: 'on-track' | 'at-risk' | 'off-track') => OKR[];
  getOKRsNeedingDecisions: () => OKR[];
  selectOKR: (okr: OKR | null) => void;
  toggleOKRExpanded: (okrId: string) => void;
  addOKR: (okr: OKR) => void;
  updateOKR: (id: string, updates: Partial<OKR>) => void;
  updateQueueStatus: (okrId: string, queueStatus: QueueStatus) => void;
  deleteOKR: (id: string) => void;
  reorderOKRs: (okrIds: string[]) => void;
  getCounts: () => {
    total: number;
    onTrack: number;
    atRisk: number;
    offTrack: number;
  };

  // Member assignment methods
  assignMemberToObjective: (okrId: string, objectiveId: string, memberId: string) => void;
  removeMemberFromObjective: (okrId: string, objectiveId: string, memberId: string) => void;
  getObjectiveMembers: (okrId: string, objectiveId: string) => string[];

  // Multi-tenancy methods
  getOKRsByWorkspace: (workspaceId: string) => OKR[];
  getAllOKRs: () => OKR[]; // For government users
  getOKRsByWorkspaceAndFunction: (workspaceId: string, func: BusinessFunction) => OKR[];
  getOKRsByWorkspaceAndStatus: (workspaceId: string, status: 'on-track' | 'at-risk' | 'off-track') => OKR[];
}

// Initial OKR data - SINGLE SOURCE OF TRUTH
// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

const INITIAL_OKRS: OKR[] = [
  {
    id: 'okr-marketing-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Marketing',
    title: 'Build Brand Awareness & Generate Leads',
    description: 'Establish market presence and create demand for our hardware product',
    owner: 'Priya Sharma',
    startDate: 'Q1 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-m1', title: 'Achieve 50K website visitors/month', target: '50,000', current: '32,000', progress: 64, status: 'on-track' },
      { id: 'kr-m2', title: 'Generate 500 qualified leads', target: '500', current: '287', progress: 57, status: 'on-track' },
      { id: 'kr-m3', title: 'Reach 10K social media followers', target: '10,000', current: '6,200', progress: 62, status: 'on-track' },
    ],
  },
  {
    id: 'okr-sales-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Sales',
    title: 'Achieve Product-Market Fit with 100 Customers',
    description: 'Validate product-market fit through customer acquisition and revenue',
    owner: 'Sarah Mitchell',
    startDate: 'Q1 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-s1', title: 'Close 100 customers', target: '100', current: '67', progress: 67, status: 'on-track' },
      { id: 'kr-s2', title: 'Reach £500K ARR', target: '£500,000', current: '£312,000', progress: 62, status: 'on-track' },
      { id: 'kr-s3', title: 'Achieve 85% customer satisfaction', target: '85%', current: '91%', progress: 100, status: 'on-track' },
    ],
  },
  {
    id: 'okr-bom-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Engineering',
    title: 'Finalize Bill of Materials & Reduce COGS by 20%',
    description: 'Optimize product design and supply chain to hit target unit economics',
    owner: 'Marcus Rodriguez',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'at-risk',
    objectives: [
      { id: 'kr-b1', title: 'Reduce COGS from £80 to £64/unit', target: '£64', current: '£72', progress: 50, status: 'at-risk' },
      { id: 'kr-b2', title: 'Finalize BOM with 95% component sourcing', target: '95%', current: '88%', progress: 93, status: 'on-track' },
      { id: 'kr-b3', title: 'Complete 3 design iterations', target: '3', current: '2', progress: 67, status: 'on-track' },
    ],
  },
  {
    id: 'okr-engineering-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Engineering',
    title: 'Ship Production-Ready Hardware v1.0',
    description: 'Complete product development and pass all quality certifications',
    owner: 'Marcus Rodriguez',
    startDate: 'Q1 2026',
    endDate: 'Q3 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-e1', title: 'Pass CE & FCC certifications', target: '2', current: '1', progress: 50, status: 'on-track' },
      { id: 'kr-e2', title: 'Achieve <2% defect rate in production', target: '<2%', current: '3.1%', progress: 60, status: 'at-risk' },
      { id: 'kr-e3', title: 'Complete 100 unit pilot run', target: '100', current: '100', progress: 100, status: 'on-track' },
    ],
  },
  {
    id: 'okr-ops-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Ops',
    title: 'Scale Manufacturing to 1000 Units/Month',
    description: 'Build operational capacity to meet initial market demand',
    owner: 'Thomas Anderson',
    startDate: 'Q2 2026',
    endDate: 'Q4 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-o1', title: 'Onboard 3 contract manufacturers', target: '3', current: '2', progress: 67, status: 'on-track' },
      { id: 'kr-o2', title: 'Achieve 95% on-time delivery rate', target: '95%', current: '89%', progress: 94, status: 'on-track' },
      { id: 'kr-o3', title: 'Reduce lead time to 4 weeks', target: '4 weeks', current: '6 weeks', progress: 50, status: 'at-risk' },
    ],
  },
  {
    id: 'okr-finance-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Finance',
    title: 'Raise £2M Seed Round & Extend Runway to 18 Months',
    description: 'Secure funding and manage burn rate to reach profitability',
    owner: 'James Chen',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-f1', title: 'Close £2M seed round', target: '£2,000,000', current: '£1,500,000', progress: 75, status: 'on-track' },
      { id: 'kr-f2', title: 'Reduce monthly burn to £80K', target: '£80,000', current: '£95,000', progress: 70, status: 'at-risk' },
      { id: 'kr-f3', title: 'Reach 18-month runway', target: '18', current: '14', progress: 78, status: 'on-track' },
    ],
  },
  {
    id: 'okr-finance-2',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Finance',
    title: 'Achieve Unit Economics Profitability',
    description: 'Ensure positive unit economics before scaling production',
    owner: 'James Chen',
    startDate: 'Q2 2026',
    endDate: 'Q3 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-f4', title: 'Reach 40% gross margin', target: '40%', current: '35%', progress: 88, status: 'on-track' },
      { id: 'kr-f5', title: 'Reduce CAC to <£200', target: '£200', current: '£245', progress: 70, status: 'at-risk' },
      { id: 'kr-f6', title: 'Achieve LTV:CAC ratio of 3:1', target: '3:1', current: '2.4:1', progress: 80, status: 'on-track' },
    ],
  },
  {
    id: 'okr-legal-1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    function: 'Admin',
    title: 'Complete Legal & Compliance Foundation',
    description: 'Establish legal structure and protect intellectual property',
    owner: 'Founder',
    startDate: 'Q1 2026',
    endDate: 'Q2 2026',
    status: 'on-track',
    objectives: [
      { id: 'kr-l1', title: 'File 2 patent applications', target: '2', current: '1', progress: 50, status: 'on-track' },
      { id: 'kr-l2', title: 'Complete supplier contracts', target: '5', current: '4', progress: 80, status: 'on-track' },
      { id: 'kr-l3', title: 'Finalize customer T&Cs and privacy policy', target: '2', current: '2', progress: 100, status: 'on-track' },
    ],
  },
];

export const useOKRStore = create<OKRState>((set, get) => ({
  okrs: [],
  selectedOKR: null,

  initializeOKRs: () => {
    // DISABLED: OKRs should be loaded from Supabase
    // set({ okrs: INITIAL_OKRS });

    // Start with empty array until Supabase integration is complete
    set({ okrs: [] });
  },

  getOKRById: (id: string) => {
    return get().okrs.find(okr => okr.id === id);
  },

  getOKRsByFunction: (func: BusinessFunction) => {
    return get().okrs.filter(okr => okr.function === func);
  },

  getOKRsByStatus: (status: 'on-track' | 'at-risk' | 'off-track') => {
    return get().okrs.filter(okr => okr.status === status);
  },

  getOKRsNeedingDecisions: () => {
    return get().okrs.filter(okr => okr.status === 'at-risk' || okr.status === 'off-track');
  },

  selectOKR: (okr: OKR | null) => {
    set({ selectedOKR: okr });
  },

  toggleOKRExpanded: (okrId: string) => {
    set(state => ({
      okrs: state.okrs.map(okr =>
        okr.id === okrId ? { ...okr, isExpanded: !okr.isExpanded } : okr
      ),
    }));
  },

  addOKR: (okr: OKR) => {
    set(state => ({ okrs: [...state.okrs, okr] }));
  },

  updateOKR: (id: string, updates: Partial<OKR>) => {
    set(state => ({
      okrs: state.okrs.map(okr => (okr.id === id ? { ...okr, ...updates } : okr)),
    }));
  },

  updateQueueStatus: (okrId: string, queueStatus: QueueStatus) => {
    set(state => ({
      okrs: state.okrs.map(okr =>
        okr.id === okrId ? { ...okr, queueStatus } : okr
      ),
    }));
  },

  deleteOKR: (id: string) => {
    set(state => ({
      okrs: state.okrs.filter(okr => okr.id !== id),
    }));
  },

  reorderOKRs: (okrIds: string[]) => {
    set(state => {
      const okrMap = new Map(state.okrs.map(okr => [okr.id, okr]));
      const reorderedOKRs: OKR[] = [];

      // First add OKRs in the new order
      for (const id of okrIds) {
        const okr = okrMap.get(id);
        if (okr) {
          reorderedOKRs.push(okr);
          okrMap.delete(id);
        }
      }

      // Then add any remaining OKRs that weren't in the reorder list
      for (const okr of okrMap.values()) {
        reorderedOKRs.push(okr);
      }

      return { okrs: reorderedOKRs };
    });
  },

  getCounts: () => {
    const okrs = get().okrs;
    return {
      total: okrs.length,
      onTrack: okrs.filter(o => o.status === 'on-track').length,
      atRisk: okrs.filter(o => o.status === 'at-risk').length,
      offTrack: okrs.filter(o => o.status === 'off-track').length,
    };
  },

  // Member assignment methods
  assignMemberToObjective: (okrId: string, objectiveId: string, memberId: string) => {
    set(state => ({
      okrs: state.okrs.map(okr => {
        if (okr.id !== okrId) return okr;

        return {
          ...okr,
          objectives: okr.objectives.map(obj => {
            if (obj.id !== objectiveId) return obj;

            const currentMembers = obj.assignedMemberIds || [];
            if (currentMembers.includes(memberId)) return obj; // Already assigned

            return {
              ...obj,
              assignedMemberIds: [...currentMembers, memberId],
            };
          }),
        };
      }),
    }));
  },

  removeMemberFromObjective: (okrId: string, objectiveId: string, memberId: string) => {
    set(state => ({
      okrs: state.okrs.map(okr => {
        if (okr.id !== okrId) return okr;

        return {
          ...okr,
          objectives: okr.objectives.map(obj => {
            if (obj.id !== objectiveId) return obj;

            const currentMembers = obj.assignedMemberIds || [];
            return {
              ...obj,
              assignedMemberIds: currentMembers.filter(id => id !== memberId),
            };
          }),
        };
      }),
    }));
  },

  getObjectiveMembers: (okrId: string, objectiveId: string) => {
    const okr = get().okrs.find(o => o.id === okrId);
    if (!okr) return [];

    const objective = okr.objectives.find(obj => obj.id === objectiveId);
    return objective?.assignedMemberIds || [];
  },

  // Multi-tenancy methods
  getOKRsByWorkspace: (workspaceId: string) => {
    return get().okrs.filter(okr => okr.workspaceId === workspaceId);
  },

  getAllOKRs: () => {
    return get().okrs; // No filter - for government users
  },

  getOKRsByWorkspaceAndFunction: (workspaceId: string, func: BusinessFunction) => {
    return get().okrs.filter(okr => okr.workspaceId === workspaceId && okr.function === func);
  },

  getOKRsByWorkspaceAndStatus: (workspaceId: string, status: 'on-track' | 'at-risk' | 'off-track') => {
    return get().okrs.filter(okr => okr.workspaceId === workspaceId && okr.status === status);
  },
}));

// Selector hooks for optimal performance
export const useOKRs = () => useOKRStore(s => s.okrs);
export const useSelectedOKR = () => useOKRStore(s => s.selectedOKR);
export const useOKRCounts = () => useOKRStore(s => s.getCounts());
export const useOKRsByFunction = (func: BusinessFunction) => useOKRStore(s => s.getOKRsByFunction(func));
export const useOKRsNeedingDecisions = () => useOKRStore(s => s.getOKRsNeedingDecisions());
