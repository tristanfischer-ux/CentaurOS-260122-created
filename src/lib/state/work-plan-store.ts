/**
 * Centralized Work Plan Store
 * Single source of truth for all work plan data across the app
 */

import { create } from 'zustand';
import type { Function as BusinessFunction } from '@/types';

export interface WorkPlan {
  id: string;
  title: string;
  description: string;
  function: BusinessFunction;
  linkedOKRTitle: string;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  assignedBy: string;
  needsSubmission: boolean;
  lastSubmittedAt?: string;
  feedback?: string;
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
  deleteWorkPlan: (id: string) => void;
  getCounts: () => {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    blocked: number;
  };
}

// Initial work plan data - SINGLE SOURCE OF TRUTH
const INITIAL_WORK_PLANS: WorkPlan[] = [
  // Apprentice work plans
  {
    id: 'wp-a1',
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
  },
  {
    id: 'wp-a2',
    title: 'Research Competitor Pricing',
    description: 'Analyze pricing strategies of 10 direct competitors and create comparison spreadsheet',
    function: 'Sales',
    linkedOKRTitle: 'Achieve Product-Market Fit with 100 Customers',
    dueDate: '2026-01-25',
    status: 'in-progress',
    progress: 40,
    assignedBy: 'Sarah Mitchell',
    needsSubmission: false,
  },
  {
    id: 'wp-a3',
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
  },
  // Founder/Executive work plans
  {
    id: 'wp-f1',
    title: 'Launch Social Media Campaign',
    description: 'Execute 30-day social media campaign across all platforms',
    function: 'Marketing',
    linkedOKRTitle: 'Build Brand Awareness & Generate Leads',
    dueDate: '2026-02-15',
    status: 'in-progress',
    progress: 65,
    assignedBy: 'Priya Sharma',
    needsSubmission: true,
  },
  {
    id: 'wp-f2',
    title: 'Build Customer Outreach List',
    description: 'Compile 500 qualified leads with contact information',
    function: 'Sales',
    linkedOKRTitle: 'Achieve Product-Market Fit with 100 Customers',
    dueDate: '2026-01-31',
    status: 'in-progress',
    progress: 78,
    assignedBy: 'Sarah Mitchell',
    needsSubmission: false,
  },
  {
    id: 'wp-f3',
    title: 'Component Cost Analysis',
    description: 'Analyze BOM and find alternative suppliers',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    dueDate: '2026-01-25',
    status: 'completed',
    progress: 100,
    assignedBy: 'Marcus Rodriguez',
    needsSubmission: false,
  },
  {
    id: 'wp-f4',
    title: 'Manufacturing Lead Time Optimization',
    description: 'Reduce lead time from 6 to 4 weeks',
    function: 'Ops',
    linkedOKRTitle: 'Scale Manufacturing to 1000 Units/Month',
    dueDate: '2026-02-28',
    status: 'blocked',
    progress: 25,
    assignedBy: 'Thomas Anderson',
    needsSubmission: false,
  },
  {
    id: 'wp-f5',
    title: 'Investor Deck Update',
    description: 'Update pitch deck with Q4 metrics',
    function: 'Finance',
    linkedOKRTitle: 'Raise £2M Seed Round',
    dueDate: '2026-01-20',
    status: 'in-progress',
    progress: 85,
    assignedBy: 'James Chen',
    needsSubmission: false,
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
    };
  },
}));

// Selector hooks for optimal performance
export const useWorkPlans = () => useWorkPlanStore(s => s.workPlans);
export const useSelectedWorkPlan = () => useWorkPlanStore(s => s.selectedWorkPlan);
export const useWorkPlanCounts = () => useWorkPlanStore(s => s.getCounts());
export const useApprenticeWorkPlans = () => useWorkPlanStore(s => s.getApprenticeWorkPlans());
export const useWorkPlansByFunction = (func: BusinessFunction) => useWorkPlanStore(s => s.getWorkPlansByFunction(func));
