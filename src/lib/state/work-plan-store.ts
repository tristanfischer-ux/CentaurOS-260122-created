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
import { supabase } from '@/lib/supabase';
import type { Function as BusinessFunction } from '@/types';
import type { TaskVisibility, RestrictedCategory, TaskSharing } from '@/types/privacy';

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
  linkedOKRTitle?: string; // Optional - OKRs are now hidden from users
  startDate: string; // Start date of the task
  dueDate: string; // Delivery/due date of the task
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

  // ========================================
  // MANUFACTURING / SUPPLIER LINKAGE
  // ========================================
  linkedSupplierEngagementId?: string;  // Link to supplier engagement in Make tab
  componentBeingMade?: string;          // What is being manufactured/made
  manufacturingProcess?: string;        // Brief description of the process

  // ========================================
  // DECISION LINKAGE
  // ========================================
  linkedDecisionId?: string;            // Link to decision that created this task

  // ========================================
  // PRIVACY & VISIBILITY SYSTEM
  // ========================================

  // Visibility level for this work plan
  visibility?: TaskVisibility;           // private | shared | function | company | restricted

  // Owner/creator of the work plan (for privacy checks)
  ownerId?: string;                      // User ID of the creator

  // Restricted category (if visibility is 'restricted')
  restrictedCategory?: RestrictedCategory; // hr | legal | executive | confidential | finance

  // Sharing configuration (if visibility is 'shared')
  sharedWith?: TaskSharing;              // Who can access and their permission level
}

interface WorkPlanState {
  workPlans: WorkPlan[];
  selectedWorkPlan: WorkPlan | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeWorkPlans: () => void;
  loadWorkPlansFromSupabase: (workspaceId: string) => Promise<void>;
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

  // Privacy & Visibility methods
  setWorkPlanVisibility: (id: string, visibility: TaskVisibility) => void;
  setWorkPlanRestricted: (id: string, category: RestrictedCategory) => void;
  shareWorkPlan: (id: string, sharing: TaskSharing) => void;
  unshareWorkPlan: (id: string) => void;
  setWorkPlanOwner: (id: string, ownerId: string) => void;

  // Reset method for clearing all data
  reset: () => void;
}

// Initial work plan data - SINGLE SOURCE OF TRUTH
// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

// DISABLED: Work plans should be loaded from Supabase
// All hardcoded work plan data has been disabled for multi-tenant architecture
const INITIAL_WORK_PLANS: WorkPlan[] = [];

/* REFERENCE: Original hardcoded data (will be migrated to Supabase)
const INITIAL_WORK_PLANS_ORIGINAL: WorkPlan[] = [
  // Apprentice work plans
  {
    id: 'wp-a1',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Create Social Media Content Calendar',
    description: 'Develop a 30-day content calendar for LinkedIn, Twitter, and Instagram with daily posts',
    function: 'Marketing',
    linkedOKRTitle: 'Build Brand Awareness & Generate Leads',
    startDate: '2026-01-13',
    dueDate: '2026-01-20',
    status: 'in-progress',
    progress: 65,
    assignedBy: 'Priya Sharma',
    needsSubmission: true,
    lastSubmittedAt: '2026-01-12 14:30',
    estimatedTimeUnits: 8,
    allocations: [
      { memberId: 'apprentice-1', memberName: 'Alex Rivera', squaresPerWeek: 4, costPerSquare: 50 }
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
    startDate: '2026-01-18',
    dueDate: '2026-01-25',
    status: 'in-progress',
    progress: 40,
    assignedBy: 'Sarah Mitchell',
    needsSubmission: false,
    estimatedTimeUnits: 6,
    allocations: [
      { memberId: 'apprentice-2', memberName: 'Priya Sharma', squaresPerWeek: 3, costPerSquare: 50 }
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
    startDate: '2026-01-03',
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
    title: 'PCB Design & Schematic Review',
    description: 'Finalize circuit board design and approve manufacturing specs for MVP units',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    startDate: '2026-01-20',
    dueDate: '2026-02-15',
    status: 'in-progress',
    progress: 65,
    assignedBy: 'Marcus Rodriguez',
    needsSubmission: false,
    estimatedTimeUnits: 10,
    allocatedTimeUnitsPerWeek: 2,
    allocations: [
      { memberId: 'exec-3', memberName: 'David Park', squaresPerWeek: 2, costPerSquare: 150 }
    ],
    assignedMemberIds: ['exec-3'],
    appliedAITools: [],
    tusExpended: 6,
    sprintMode: false,
    linkedSupplierEngagementId: 'eng-1',
    componentBeingMade: 'Main Circuit Board v2.0',
    manufacturingProcess: 'PCB fabrication with SMT assembly',
  },
  {
    id: 'wp-f2',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Product Housing CAD Design',
    description: 'Complete CAD design for injection-molded plastic housing and approve color samples',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    startDate: '2026-01-15',
    dueDate: '2026-01-31',
    status: 'in-progress',
    progress: 78,
    assignedBy: 'Marcus Rodriguez',
    needsSubmission: false,
    estimatedTimeUnits: 12,
    allocations: [
      { memberId: 'exec-3', memberName: 'David Park', squaresPerWeek: 2, costPerSquare: 150 },
      { memberId: 'apprentice-4', memberName: 'Lily Chen', squaresPerWeek: 4, costPerSquare: 50 }
    ],
    assignedMemberIds: ['exec-3', 'apprentice-4'],
    appliedAITools: [
      { toolId: 'ai-copilot', toolName: 'AI Copilot', multiplier: 5, costPerSquare: 15 }
    ],
    tusExpended: 9,
    sprintMode: true,
    linkedSupplierEngagementId: 'eng-2',
    componentBeingMade: 'Product Housing Shell',
    manufacturingProcess: 'Injection molding with ABS plastic',
  },
  {
    id: 'wp-f3',
    workspaceId: DEFAULT_WORKSPACE_ID,
    title: 'Component Cost Analysis',
    description: 'Analyze BOM and find alternative suppliers',
    function: 'Engineering',
    linkedOKRTitle: 'Finalize Bill of Materials & Reduce COGS by 20%',
    startDate: '2026-01-13',
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
    startDate: '2026-01-15',
    dueDate: '2026-02-28',
    status: 'blocked',
    progress: 25,
    assignedBy: 'Thomas Anderson',
    needsSubmission: false,
    estimatedTimeUnits: 20,
    allocatedTimeUnitsPerWeek: 4,
    allocations: [
      { memberId: 'exec-4', memberName: 'Sophie Adams', squaresPerWeek: 2, costPerSquare: 175 },
      { memberId: 'apprentice-3', memberName: 'James Wilson', squaresPerWeek: 2, costPerSquare: 50 }
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
    startDate: '2026-01-16',
    dueDate: '2026-01-20',
    status: 'not-started',
    progress: 0,
    assignedBy: 'James Chen',
    needsSubmission: false,
    estimatedTimeUnits: 6,
    allocations: [],
    assignedMemberIds: [],
    appliedAITools: [],
    tusExpended: 0,
    sprintMode: true,
  },
];
*/

export const useWorkPlanStore = create<WorkPlanState>((set, get) => ({
  workPlans: [],
  selectedWorkPlan: null,
  isLoading: false,
  error: null,

  initializeWorkPlans: () => {
    set({ workPlans: INITIAL_WORK_PLANS });
  },

  loadWorkPlansFromSupabase: async (workspaceId: string) => {
    set({ isLoading: true, error: null });

    try {
      // Load work plans from Supabase
      const { data: workPlansData, error: workPlansError } = await supabase
        .from('work_plans')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (workPlansError) {
        console.error('Error loading work plans:', workPlansError);
        set({ error: workPlansError.message, isLoading: false });
        return;
      }

      // Load allocations for all work plans
      const { data: allocationsData, error: allocationsError } = await supabase
        .from('work_plan_allocations')
        .select('*')
        .in('work_plan_id', (workPlansData || []).map((wp: any) => wp.id));

      if (allocationsError) {
        console.error('Error loading allocations:', allocationsError);
      }

      // Transform Supabase data to WorkPlan format
      const workPlans: WorkPlan[] = (workPlansData || []).map((wp: any) => {
        // Find allocations for this work plan
        const wpAllocations = (allocationsData || [])
          .filter((a: any) => a.work_plan_id === wp.id)
          .map((a: any) => ({
            memberId: a.member_id,
            memberName: 'Member', // Will need to join with members table
            squaresPerWeek: Number(a.squares_per_week) || 0,
            costPerSquare: 0, // Not in current schema
          }));

        return {
          id: wp.id,
          workspaceId: wp.workspace_id,
          title: wp.title || '',
          description: wp.description || '',
          function: 'Engineering' as BusinessFunction, // Not in current schema
          startDate: wp.start_date || '',
          dueDate: wp.end_date || '',
          status: (wp.status || 'not-started') as WorkPlan['status'],
          progress: wp.progress || 0,
          assignedBy: '', // Not in current schema
          needsSubmission: false, // Not in current schema
          estimatedTimeUnits: wpAllocations.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 1,
          allocations: wpAllocations,
          appliedAITools: [],
          tusExpended: 0, // Not in current schema
        };
      });

      set({ workPlans, isLoading: false });
    } catch (err) {
      console.error('Error loading work plans from Supabase:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to load work plans', isLoading: false });
    }
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

  addWorkPlan: async (workPlan: WorkPlan) => {
    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempWorkPlan = { ...workPlan, id: workPlan.id || tempId };

    // Optimistic update
    set(state => ({ workPlans: [...state.workPlans, tempWorkPlan] }));

    try {
      // Transform to Supabase format
      const supabaseWorkPlan = {
        id: workPlan.id !== tempId ? workPlan.id : undefined,
        workspace_id: workPlan.workspaceId,
        title: workPlan.title,
        description: workPlan.description,
        start_date: workPlan.startDate,
        end_date: workPlan.dueDate,
        status: workPlan.status,
        progress: workPlan.progress,
      };

      const { data, error } = await supabase
        .from('work_plans')
        .insert(supabaseWorkPlan)
        .select()
        .single();

      if (error) throw error;

      // Insert allocations if any
      if (workPlan.allocations && workPlan.allocations.length > 0) {
        const allocationsToInsert = workPlan.allocations.map(a => ({
          work_plan_id: data.id,
          member_id: a.memberId,
          squares_per_week: a.squaresPerWeek,
        }));

        const { error: allocError } = await supabase
          .from('work_plan_allocations')
          .insert(allocationsToInsert);

        if (allocError) {
          console.error('Failed to insert allocations:', allocError);
        }
      }

      // Replace temp with real data
      const realWorkPlan: WorkPlan = {
        ...workPlan,
        id: data.id,
        workspaceId: data.workspace_id,
        startDate: data.start_date,
        dueDate: data.end_date,
        status: data.status,
        progress: data.progress,
      };

      set((state) => ({
        workPlans: state.workPlans.map(wp => wp.id === tempId ? realWorkPlan : wp)
      }));
    } catch (err) {
      // Rollback on error
      set((state) => ({
        workPlans: state.workPlans.filter(wp => wp.id !== tempId)
      }));
      console.error('Failed to add work plan:', err);
      throw err;
    }
  },

  updateWorkPlan: async (id: string, updates: Partial<WorkPlan>) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Optimistic update
    set(state => ({
      workPlans: state.workPlans.map(wp => (wp.id === id ? { ...wp, ...updates } : wp)),
    }));

    try {
      // Transform updates to Supabase format
      const supabaseUpdates: any = {};
      if (updates.title !== undefined) supabaseUpdates.title = updates.title;
      if (updates.description !== undefined) supabaseUpdates.description = updates.description;
      if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate;
      if (updates.dueDate !== undefined) supabaseUpdates.end_date = updates.dueDate;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.progress !== undefined) supabaseUpdates.progress = updates.progress;

      const { data, error } = await supabase
        .from('work_plans')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update allocations if provided
      if (updates.allocations !== undefined) {
        // Delete existing allocations
        await supabase
          .from('work_plan_allocations')
          .delete()
          .eq('work_plan_id', id);

        // Insert new allocations
        if (updates.allocations.length > 0) {
          const allocationsToInsert = updates.allocations.map(a => ({
            work_plan_id: id,
            member_id: a.memberId,
            squares_per_week: a.squaresPerWeek,
          }));

          const { error: allocError } = await supabase
            .from('work_plan_allocations')
            .insert(allocationsToInsert);

          if (allocError) {
            console.error('Failed to update allocations:', allocError);
          }
        }
      }

      // Update with real data from server
      const current = get().workPlans.find(wp => wp.id === id);
      if (current) {
        set((state) => ({
          workPlans: state.workPlans.map(wp =>
            wp.id === id ? { ...current, ...updates } : wp
          )
        }));
      }
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.error('Failed to update work plan:', err);
      throw err;
    }
  },

  completeWorkPlan: async (id: string) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Optimistic update
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

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('work_plans')
        .update({ status: 'completed', progress: 100 })
        .eq('id', id);

      if (error) throw error;

      // Delete allocations (free resources)
      await supabase
        .from('work_plan_allocations')
        .delete()
        .eq('work_plan_id', id);
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.error('Failed to complete work plan:', err);
      throw err;
    }
  },

  abandonWorkPlan: async (id: string, reason?: string) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Optimistic update
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

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('work_plans')
        .update({ status: 'abandoned' })
        .eq('id', id);

      if (error) throw error;

      // Delete allocations (free resources)
      await supabase
        .from('work_plan_allocations')
        .delete()
        .eq('work_plan_id', id);
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.error('Failed to abandon work plan:', err);
      throw err;
    }
  },

  deleteWorkPlan: async (id: string) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Optimistic update
    set(state => ({
      workPlans: state.workPlans.filter(wp => wp.id !== id),
    }));

    try {
      // Delete allocations first (foreign key constraint)
      await supabase
        .from('work_plan_allocations')
        .delete()
        .eq('work_plan_id', id);

      // Delete work plan
      const { error } = await supabase
        .from('work_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.error('Failed to delete work plan:', err);
      throw err;
    }
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

  // ========================================
  // PRIVACY & VISIBILITY METHODS
  // ========================================

  setWorkPlanVisibility: (id: string, visibility: TaskVisibility) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? { ...wp, visibility, updatedAt: new Date().toISOString() }
          : wp
      ),
    }));
    console.log(`[WorkPlanStore] Set visibility for ${id} to ${visibility}`);
  },

  setWorkPlanRestricted: (id: string, category: RestrictedCategory) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
              ...wp,
              visibility: 'restricted',
              restrictedCategory: category,
              updatedAt: new Date().toISOString(),
            }
          : wp
      ),
    }));
    console.log(`[WorkPlanStore] Set restricted category for ${id} to ${category}`);
  },

  shareWorkPlan: (id: string, sharing: TaskSharing) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
              ...wp,
              visibility: 'shared',
              sharedWith: sharing,
              updatedAt: new Date().toISOString(),
            }
          : wp
      ),
    }));
    console.log(`[WorkPlanStore] Shared work plan ${id}`);
  },

  unshareWorkPlan: (id: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
              ...wp,
              visibility: 'company',
              sharedWith: undefined,
              updatedAt: new Date().toISOString(),
            }
          : wp
      ),
    }));
    console.log(`[WorkPlanStore] Unshared work plan ${id}`);
  },

  setWorkPlanOwner: (id: string, ownerId: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? { ...wp, ownerId, updatedAt: new Date().toISOString() }
          : wp
      ),
    }));
    console.log(`[WorkPlanStore] Set owner for ${id} to ${ownerId}`);
  },

  // Reset method - clears all work plan data
  reset: () => {
    set({
      workPlans: [],
      selectedWorkPlan: null,
      isLoading: false,
      error: null,
    });
  },
}));

// Selector hooks for optimal performance
export const useWorkPlans = () => useWorkPlanStore(s => s.workPlans);
export const useSelectedWorkPlan = () => useWorkPlanStore(s => s.selectedWorkPlan);
export const useWorkPlanCounts = () => useWorkPlanStore(s => s.getCounts());
export const useApprenticeWorkPlans = () => useWorkPlanStore(s => s.getApprenticeWorkPlans());
export const useWorkPlansByFunction = (func: BusinessFunction) => useWorkPlanStore(s => s.getWorkPlansByFunction(func));
