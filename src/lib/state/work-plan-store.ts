/**
 * Centralized Work Plan Store
 * Single source of truth for all work plan data across the app
 *
 * UNIFIED TU ALLOCATION SYSTEM:
 * - Every task stores per-person TU allocations
 * - AI tools provide productivity multipliers
 * - Team efficiency affects output based on team size
 * - Cost tracking per task with audit trail
 */

import { create } from 'zustand';
import type { Function as BusinessFunction } from '@/types';

// Per-person TU allocation for a task
export interface TUAllocation {
  memberId: string;          // Organization member ID
  memberName: string;        // For display
  squaresPerWeek: number;    // TUs this person contributes per week
  costPerSquare: number;     // £ cost per TU for this person
}

// AI tool applied to a task
export interface AppliedAITool {
  toolId: string;
  toolName: string;
  multiplier: number;        // 2x, 5x, 10x, 20x
  costPerSquare: number;     // Additional AI cost per effective TU
}

// Audit record for completed/abandoned tasks
export interface TaskAuditRecord {
  completedAt?: string;
  abandonedAt?: string;
  totalTUsSpent: number;
  totalCost: number;
  totalWeeks: number;
  reason?: string;           // For abandoned tasks
}

export interface WorkPlan {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links work plan to specific company
  title: string;
  description: string;
  function: BusinessFunction;
  linkedOKRTitle: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'abandoned';
  progress: number;
  assignedBy: string;
  needsSubmission: boolean;
  lastSubmittedAt?: string;
  feedback?: string;

  // ========================================
  // UNIFIED TU ALLOCATION SYSTEM
  // ========================================

  // Total TUs required for task (adjustable)
  estimatedTimeUnits: number;           // Total squares for task (min: 1)

  // Per-person allocations (THE source of truth)
  allocations: TUAllocation[];          // Who is contributing and how much

  // AI productivity tools applied
  appliedAITools: AppliedAITool[];      // AI tools boosting productivity

  // Calculated fields (derived from allocations)
  allocatedTimeUnitsPerWeek?: number;   // Sum of all person allocations
  assignedMemberIds?: string[];         // Derived from allocations

  // TUs already expended (progress tracking)
  tusExpended: number;                  // TUs spent so far

  // Audit trail for completed/abandoned tasks
  auditRecord?: TaskAuditRecord;

  // Legacy field (kept for backwards compatibility)
  sprintMode?: boolean;                 // true = ASAP, false = spread over weeks

  // Enhanced submission data (Deloitte/Accenture process excellence)
  submissionData?: {
    notes: string;
    hoursSpent: number;
    blockersEncountered: string[];
    confidenceLevel: 'high' | 'medium' | 'low';
    qualityChecklist: {
      requirementsMet: boolean;
      testedLocally: boolean;
      documentationUpdated: boolean;
      peerReviewed: boolean;
    };
    estimatedQuality: number;
  };
}

interface WorkPlanState {
  workPlans: WorkPlan[];
  selectedWorkPlan: WorkPlan | null;

  // Actions
  initializeWorkPlans: () => void;
  getWorkPlanById: (id: string) => WorkPlan | undefined;
  getWorkPlansByFunction: (func: BusinessFunction) => WorkPlan[];
  getWorkPlansByStatus: (status: WorkPlan['status']) => WorkPlan[];
  getApprenticeWorkPlans: () => WorkPlan[];
  getFounderWorkPlansByFunction: (func: BusinessFunction) => WorkPlan[];
  getExecutiveWorkPlans: (func: BusinessFunction) => WorkPlan[];
  selectWorkPlan: (workPlan: WorkPlan | null) => void;
  addWorkPlan: (workPlan: WorkPlan) => void;
  updateWorkPlan: (id: string, updates: Partial<WorkPlan>) => void;
  completeWorkPlan: (id: string) => void; // Mark as complete and free resources
  abandonWorkPlan: (id: string, reason?: string) => void; // Abandon task and free resources
  deleteWorkPlan: (id: string) => void;
  getCounts: () => {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    blocked: number;
    abandoned: number;
  };

  // Multi-tenancy methods
  getWorkPlansByWorkspace: (workspaceId: string) => WorkPlan[];
  getAllWorkPlans: () => WorkPlan[]; // For government users
  getWorkPlansByWorkspaceAndFunction: (workspaceId: string, func: BusinessFunction) => WorkPlan[];
  getWorkPlansByWorkspaceAndStatus: (workspaceId: string, status: WorkPlan['status']) => WorkPlan[];
}

// Initial work plan data - SINGLE SOURCE OF TRUTH
// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

const INITIAL_WORK_PLANS: WorkPlan[] = [
  // Apprentice work plans
  {
    id: 'wp-a1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Create Social Media Content Calendar',
    description: 'Develop a 30-day content calendar for LinkedIn, Twitter, and Instagram with daily posts',
    function: 'Marketing',
    linkedOKRTitle: 'Build Brand Awareness & Generate Leads',
    dueDate: '2026-01-20',
    status: 'in-progress',
    progress: 65,
    assignedBy: 'Priya Sharma',
    needsSubmission: true,
    lastSubmittedAt: '2026-01-12 14:30',
    estimatedTimeUnits: 8,
    allocations: [
      { memberId: 'apprentice-1', memberName: 'Alex Thompson', squaresPerWeek: 4, costPerSquare: 50 }
    ],
    assignedMemberIds: ['apprentice-1'],
    appliedAITools: [],
    tusExpended: 5,
    sprintMode: true,
  },
  {
    id: 'wp-a2',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Research Competitor Pricing',
    description: 'Analyze pricing strategies of 10 direct competitors and create comparison spreadsheet',
    function: 'Sales',
    linkedOKRTitle: 'Achieve Product-Market Fit with 100 Customers',
    dueDate: '2026-01-25',
    status: 'in-progress',
    progress: 40,
    assignedBy: 'Sarah Mitchell',
    needsSubmission: false,
    estimatedTimeUnits: 6,
    allocations: [
      { memberId: 'apprentice-2', memberName: 'Jordan Lee', squaresPerWeek: 3, costPerSquare: 50 }
    ],
    assignedMemberIds: ['apprentice-2'],
    appliedAITools: [],
    tusExpended: 2,
    sprintMode: true,
  },
  {
    id: 'wp-a3',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'BOM Component Sourcing Research',
    description: 'Find 3 alternative suppliers for PCB components with cost and lead time analysis',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    dueDate: '2026-01-18',
    status: 'completed',
    progress: 100,
    assignedBy: 'Marcus Rodriguez',
    needsSubmission: false,
    lastSubmittedAt: '2026-01-10 09:15',
    feedback: 'Excellent work! Moving forward with supplier B.',
    estimatedTimeUnits: 4,
    allocations: [],
    appliedAITools: [],
    tusExpended: 4,
    auditRecord: {
      completedAt: '2026-01-10',
      totalTUsSpent: 4,
      totalCost: 200,
      totalWeeks: 1,
    },
    sprintMode: true,
  },
  // Founder/Executive work plans
  {
    id: 'wp-f1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Launch Social Media Campaign',
    description: 'Execute 30-day social media campaign across all platforms',
    function: 'Marketing',
    linkedOKRTitle: 'Build Brand Awareness & Generate Leads',
    dueDate: '2026-02-15',
    status: 'in-progress',
    progress: 65,
    assignedBy: 'Priya Sharma',
    needsSubmission: true,
    estimatedTimeUnits: 10,
    allocatedTimeUnitsPerWeek: 2,
    allocations: [
      { memberId: 'exec-1', memberName: 'Priya Sharma', squaresPerWeek: 2, costPerSquare: 150 }
    ],
    assignedMemberIds: ['exec-1'],
    appliedAITools: [],
    tusExpended: 6,
    sprintMode: false,
  },
  {
    id: 'wp-f2',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Build Customer Outreach List',
    description: 'Compile 500 qualified leads with contact information',
    function: 'Sales',
    linkedOKRTitle: 'Achieve Product-Market Fit with 100 Customers',
    dueDate: '2026-01-31',
    status: 'in-progress',
    progress: 78,
    assignedBy: 'Sarah Mitchell',
    needsSubmission: false,
    estimatedTimeUnits: 12,
    allocations: [
      { memberId: 'exec-2', memberName: 'Sarah Mitchell', squaresPerWeek: 2, costPerSquare: 125 },
      { memberId: 'apprentice-2', memberName: 'Jordan Lee', squaresPerWeek: 4, costPerSquare: 50 }
    ],
    assignedMemberIds: ['exec-2', 'apprentice-2'],
    appliedAITools: [
      { toolId: 'ai-copilot', toolName: 'AI Copilot', multiplier: 5, costPerSquare: 15 }
    ],
    tusExpended: 9,
    sprintMode: true,
  },
  {
    id: 'wp-f3',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Component Cost Analysis',
    description: 'Analyze BOM and find alternative suppliers',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    dueDate: '2026-01-25',
    status: 'completed',
    progress: 100,
    assignedBy: 'Marcus Rodriguez',
    needsSubmission: false,
    estimatedTimeUnits: 4,
    allocations: [],
    appliedAITools: [],
    tusExpended: 4,
    auditRecord: {
      completedAt: '2026-01-20',
      totalTUsSpent: 4,
      totalCost: 400,
      totalWeeks: 1,
    },
    sprintMode: true,
  },
  {
    id: 'wp-f4',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Manufacturing Lead Time Optimization',
    description: 'Reduce lead time from 6 to 4 weeks',
    function: 'Ops',
    linkedOKRTitle: 'Scale Manufacturing to 1000 Units/Month',
    dueDate: '2026-02-28',
    status: 'blocked',
    progress: 25,
    assignedBy: 'Thomas Anderson',
    needsSubmission: false,
    estimatedTimeUnits: 20,
    allocatedTimeUnitsPerWeek: 4,
    allocations: [
      { memberId: 'exec-4', memberName: 'Thomas Anderson', squaresPerWeek: 2, costPerSquare: 175 },
      { memberId: 'apprentice-3', memberName: 'Taylor Morgan', squaresPerWeek: 2, costPerSquare: 50 }
    ],
    assignedMemberIds: ['exec-4', 'apprentice-3'],
    appliedAITools: [],
    tusExpended: 5,
    sprintMode: false,
  },
  {
    id: 'wp-f5',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Investor Deck Update',
    description: 'Update pitch deck with Q4 metrics',
    function: 'Finance',
    linkedOKRTitle: 'Raise £2M Seed Round',
    dueDate: '2026-01-20',
    status: 'in-progress',
    progress: 85,
    assignedBy: 'James Chen',
    needsSubmission: false,
    estimatedTimeUnits: 6,
    allocations: [
      { memberId: 'founder-1', memberName: 'Sarah Chen', squaresPerWeek: 2, costPerSquare: 200 },
      { memberId: 'exec-5', memberName: 'James Chen', squaresPerWeek: 2, costPerSquare: 150 }
    ],
    assignedMemberIds: ['founder-1', 'exec-5'],
    appliedAITools: [
      { toolId: 'ai-assist', toolName: 'AI Assist', multiplier: 2, costPerSquare: 5 }
    ],
    tusExpended: 5,
    sprintMode: true,
  },
];

export const useWorkPlanStore = create<WorkPlanState>((set, get) => ({
  workPlans: [],
  selectedWorkPlan: null,

  initializeWorkPlans: () => {
    set({ workPlans: INITIAL_WORK_PLANS });
  },

  getWorkPlanById: (id: string) => {
    return get().workPlans.find(wp => wp.id === id);
  },

  getWorkPlansByFunction: (func: BusinessFunction) => {
    return get().workPlans.filter(wp => wp.function === func);
  },

  getWorkPlansByStatus: (status: WorkPlan['status']) => {
    return get().workPlans.filter(wp => wp.status === status);
  },

  getApprenticeWorkPlans: () => {
    // Apprentice work plans have IDs starting with 'wp-a'
    return get().workPlans.filter(wp => wp.id.startsWith('wp-a'));
  },

  getFounderWorkPlansByFunction: (func: BusinessFunction) => {
    // Founder work plans have IDs starting with 'wp-f'
    return get().workPlans.filter(wp => wp.id.startsWith('wp-f') && wp.function === func);
  },

  getExecutiveWorkPlans: (func: BusinessFunction) => {
    // Executive work plans are the same as founder work plans for their function
    return get().workPlans.filter(wp => wp.id.startsWith('wp-f') && wp.function === func);
  },

  selectWorkPlan: (workPlan: WorkPlan | null) => {
    set({ selectedWorkPlan: workPlan });
  },

  addWorkPlan: (workPlan: WorkPlan) => {
    set(state => ({ workPlans: [...state.workPlans, workPlan] }));
  },

  updateWorkPlan: (id: string, updates: Partial<WorkPlan>) => {
    set(state => ({
      workPlans: state.workPlans.map(wp => (wp.id === id ? { ...wp, ...updates } : wp)),
    }));
  },

  completeWorkPlan: (id: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
              ...wp,
              status: 'completed' as const,
              progress: 100,
              assignedMemberIds: [], // Free up all assigned members
              allocations: [], // Free all TU allocations
              auditRecord: {
                completedAt: new Date().toISOString(),
                totalTUsSpent: wp.tusExpended,
                totalCost: wp.allocations.reduce((sum, a) => sum + (a.squaresPerWeek * a.costPerSquare), 0),
                totalWeeks: 1, // TODO: calculate actual weeks
              },
            }
          : wp
      ),
    }));
  },

  abandonWorkPlan: (id: string, reason?: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
              ...wp,
              status: 'abandoned' as const,
              assignedMemberIds: [], // Free up all assigned members
              allocations: [], // Free all TU allocations - returns resources to pool
              auditRecord: {
                abandonedAt: new Date().toISOString(),
                totalTUsSpent: wp.tusExpended,
                totalCost: wp.allocations.reduce((sum, a) => sum + (a.squaresPerWeek * a.costPerSquare), 0),
                totalWeeks: 1, // TODO: calculate actual weeks
                reason: reason || 'Task abandoned via swipe',
              },
            }
          : wp
      ),
    }));
  },

  deleteWorkPlan: (id: string) => {
    set(state => ({
      workPlans: state.workPlans.filter(wp => wp.id !== id),
    }));
  },

  getCounts: () => {
    const workPlans = get().workPlans;
    return {
      total: workPlans.length,
      notStarted: workPlans.filter(wp => wp.status === 'not-started').length,
      inProgress: workPlans.filter(wp => wp.status === 'in-progress').length,
      completed: workPlans.filter(wp => wp.status === 'completed').length,
      blocked: workPlans.filter(wp => wp.status === 'blocked').length,
      abandoned: workPlans.filter(wp => wp.status === 'abandoned').length,
    };
  },

  // Multi-tenancy methods
  getWorkPlansByWorkspace: (workspaceId: string) => {
    return get().workPlans.filter(wp => wp.workspaceId === workspaceId);
  },

  getAllWorkPlans: () => {
    return get().workPlans; // No filter - for government users
  },

  getWorkPlansByWorkspaceAndFunction: (workspaceId: string, func: BusinessFunction) => {
    return get().workPlans.filter(wp => wp.workspaceId === workspaceId && wp.function === func);
  },

  getWorkPlansByWorkspaceAndStatus: (workspaceId: string, status: WorkPlan['status']) => {
    return get().workPlans.filter(wp => wp.workspaceId === workspaceId && wp.status === status);
  },
}));

// Selector hooks for optimal performance
export const useWorkPlans = () => useWorkPlanStore(s => s.workPlans);
export const useSelectedWorkPlan = () => useWorkPlanStore(s => s.selectedWorkPlan);
export const useWorkPlanCounts = () => useWorkPlanStore(s => s.getCounts());
export const useApprenticeWorkPlans = () => useWorkPlanStore(s => s.getApprenticeWorkPlans());
export const useWorkPlansByFunction = (func: BusinessFunction) => useWorkPlanStore(s => s.getWorkPlansByFunction(func));
