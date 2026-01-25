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
import { useAppStore } from './app-store';
import { autoScheduleTask } from '../task-scheduling';
import type { OrganizationMember } from '@/lib/organization-seed';

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

// Timeline extension record for tracking delays
export interface TimelineExtension {
  extendedAt: string;              // When the extension was made
  previousDueDate: string;         // What the due date was before
  newDueDate: string;              // What it was extended to
  additionalTUs: number;           // How many TUs were added
  reason?: string;                 // Optional reason for extension
}

// Completion checklist item
export interface CompletionChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
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

  // ========================================
  // STRATEGIC ALIGNMENT (NEW)
  // ========================================
  linkedObjectiveId?: string;           // 🔑 Mandatory link to a strategic objective

  // ========================================
  // ASSIGNMENT WORKFLOW (NEW)
  // ========================================
  assignmentStatus: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;             // Required if status is 'rejected'

  // ========================================
  // ATTACHMENTS (NEW)
  // ========================================
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
    createdAt: string;
  }[];

  // ========================================
  // ORIGINAL TIMELINE TRACKING (for delay detection)
  // ========================================

  // Original estimates (frozen when task starts)
  originalDueDate?: string;             // Original planned end date
  originalEstimatedTimeUnits?: number;  // Original TU estimate

  // Timeline extension history
  timelineExtensions?: TimelineExtension[];

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
  // COMPLETION WORKFLOW (NEW)
  // ========================================

  // Completion status for review workflow
  completionStatus?: 'working' | 'submitted' | 'approved' | 'needs-revision';

  // Submission tracking
  submittedForReviewAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  submissionNotes?: string;

  // Review tracking
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewFeedback?: string;

  // Completion checklist
  completionChecklist?: CompletionChecklistItem[];

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

  // ========================================
  // ESCALATION TRACKING
  // ========================================

  // Escalation metadata
  isEscalated?: boolean;              // Quick flag for filtering
  currentEscalationId?: string;       // If currently escalated
  escalationHistory?: string[];       // Array of escalation IDs (for pattern detection)
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

  // NEW: Completion workflow methods
  submitForReview: (workPlanId: string, submittedBy: string, submittedByName: string, notes?: string) => Promise<boolean>;
  approveCompletion: (workPlanId: string, reviewedBy: string, reviewedByName: string, feedback?: string) => Promise<boolean>;
  requestRevisions: (workPlanId: string, reviewedBy: string, reviewedByName: string, feedback: string) => Promise<boolean>;
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

  // Miscellaneous task management
  ensureMiscellaneousTask: (workspaceId: string) => Promise<void>;

  // Reset method for clearing all data
  reset: () => void;

  // NEW: Assignment workflow methods
  acceptTask: (id: string, memberId: string) => Promise<void>;
  rejectTask: (id: string, memberId: string, reason: string) => Promise<void>;
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
          // Map 'planning' back to 'not-started' for app compatibility
          status: (wp.status === 'planning' ? 'not-started' : wp.status) as WorkPlan['status'],
          progress: wp.progress || 0,
          assignedBy: wp.created_by || '', // Use created_by for assignedBy
          needsSubmission: false, // Not in current schema
          estimatedTimeUnits: wpAllocations.reduce((sum, a) => sum + a.squaresPerWeek, 0) || 1,
          allocations: wpAllocations,
          appliedAITools: [],
          tusExpended: 0, // Not in current schema
          linkedObjectiveId: wp.linked_objective_id || '', // Map from Supabase
          assignmentStatus: (wp.assignment_status || 'accepted') as WorkPlan['assignmentStatus'],
          rejectionReason: wp.rejection_reason,
          attachments: wp.attachments || [],
        };
      });

      set({ workPlans, isLoading: false });

      // Ensure miscellaneous task exists after loading
      await get().ensureMiscellaneousTask(workspaceId);
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
      // NOTE: Supabase schema only has: id, workspace_id, title, description, status,
      // priority, progress, start_date, end_date, created_by, created_at, updated_at
      // Supabase status values: 'planning', 'in-progress', 'blocked', 'completed', 'abandoned'

      // Get current membership to use as default creator if assignedBy is not specified
      const currentMembership = useAppStore.getState().currentMembership;
      const assignedBy = workPlan.assignedBy || currentMembership?.id || '';

      // Only include created_by if it's a valid member ID (not a demo UUID)
      // Demo UUIDs start with 00000000, so we'll set them to null
      const isValidMemberId = assignedBy && !assignedBy.startsWith('00000000');

      const supabaseWorkPlan = {
        id: workPlan.id !== tempId ? workPlan.id : undefined,
        workspace_id: workPlan.workspaceId,
        title: workPlan.title,
        description: workPlan.description,
        // Map 'not-started' to 'planning' for Supabase compatibility
        status: workPlan.status === 'not-started' ? 'planning' : workPlan.status,
        priority: 'medium', // Default priority
        progress: workPlan.progress,
        start_date: workPlan.startDate,
        end_date: workPlan.dueDate,
        created_by: isValidMemberId ? assignedBy : null,
      };

      const { data, error } = await supabase
        .from('work_plans')
        .insert(supabaseWorkPlan)
        .select()
        .single();

      if (error) {
        console.log('[WorkPlanStore] Failed to add work plan to Supabase:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          workPlan: supabaseWorkPlan,
        });
        throw error;
      }

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
          console.log('Failed to insert allocations:', allocError);
        }

        // Trigger notifications for each assigned member
        const { useNotificationStore, notificationHelpers } = await import('./notification-store');
        workPlan.allocations.forEach(alloc => {
          useNotificationStore.getState().addNotification(
            notificationHelpers.newAssignment(workPlan.workspaceId, workPlan.title)
          );
        });
      }

      // Replace temp with real data
      const realWorkPlan: WorkPlan = {
        ...workPlan,
        id: data.id,
        workspaceId: data.workspace_id,
        startDate: data.start_date,
        dueDate: data.end_date,
        // Map 'planning' back to 'not-started' for app compatibility
        status: (data.status === 'planning' ? 'not-started' : data.status) as WorkPlan['status'],
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
      console.log('Failed to add work plan:', err);
      throw err;
    }
  },

  updateWorkPlan: async (id: string, updates: Partial<WorkPlan>) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Check if allocations are being updated - if so, we need to auto-schedule
    const shouldAutoSchedule = updates.allocations !== undefined && updates.allocations.length > 0;
    let schedulingUpdates: Partial<WorkPlan> = {};

    if (shouldAutoSchedule) {
      // Get team members from organization store
      const { useOrganizationStore } = await import('./organization-store');
      const members = useOrganizationStore.getState().members;

      // Get current task
      const currentTask = get().workPlans.find(wp => wp.id === id);
      if (currentTask) {
        // Create updated task with new allocations
        const taskWithNewAllocations = { ...currentTask, ...updates };

        // Auto-schedule based on team capacity
        const scheduledTask = autoScheduleTask(
          taskWithNewAllocations,
          members as OrganizationMember[],
          get().workPlans.filter(wp => wp.id !== id) // Exclude current task from capacity calculation
        );

        // Add scheduling updates to the updates object
        schedulingUpdates = {
          startDate: scheduledTask.startDate,
          dueDate: scheduledTask.dueDate,
        };

        console.log('[WorkPlan] Auto-scheduled task:', {
          id,
          startDate: scheduledTask.startDate,
          dueDate: scheduledTask.dueDate,
        });
      }
    }

    // Merge scheduling updates with original updates
    const finalUpdates = { ...updates, ...schedulingUpdates };

    // Optimistic update
    set(state => ({
      workPlans: state.workPlans.map(wp => (wp.id === id ? { ...wp, ...finalUpdates } : wp)),
    }));

    try {
      // Check if this is a real work plan (exists in Supabase) or a temporary draft
      const workPlanExists = !id.startsWith('temp-');

      if (!workPlanExists) {
        // This is a temporary work plan (draft), only update local state
        console.log('[WorkPlan] Skipping Supabase update for temporary work plan:', id);
        return;
      }

      // Transform updates to Supabase format
      // Only use columns that exist in the actual Supabase schema
      const supabaseUpdates: any = {};
      if (finalUpdates.title !== undefined) supabaseUpdates.title = finalUpdates.title;
      if (finalUpdates.description !== undefined) supabaseUpdates.description = finalUpdates.description;
      if (finalUpdates.startDate !== undefined) supabaseUpdates.start_date = finalUpdates.startDate;
      if (finalUpdates.dueDate !== undefined) supabaseUpdates.end_date = finalUpdates.dueDate;
      if (finalUpdates.status !== undefined) supabaseUpdates.status = finalUpdates.status;
      if (finalUpdates.progress !== undefined) supabaseUpdates.progress = finalUpdates.progress;
      // Always update updated_at timestamp
      supabaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('work_plans')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

      if (error) throw error;

      // If no data returned, the work plan doesn't exist in the database
      if (!data) {
        console.log('[WorkPlan] Work plan not found in database:', id);
        // Keep the optimistic update, but don't sync to server
        return;
      }

      // Update allocations if provided
      if (finalUpdates.allocations !== undefined) {
        // Delete existing allocations
        await supabase
          .from('work_plan_allocations')
          .delete()
          .eq('work_plan_id', id);

        // Insert new allocations
        if (finalUpdates.allocations.length > 0) {
          const allocationsToInsert = finalUpdates.allocations.map(a => ({
            work_plan_id: id,
            member_id: a.memberId,
            squares_per_week: a.squaresPerWeek,
          }));

          const { error: allocError } = await supabase
            .from('work_plan_allocations')
            .insert(allocationsToInsert);

          if (allocError) {
            console.log('[WorkPlan] Failed to update allocations:', allocError);
          }
        }
      }

      // Update with real data from server
      const current = get().workPlans.find(wp => wp.id === id);
      if (current) {
        set((state) => ({
          workPlans: state.workPlans.map(wp =>
            wp.id === id ? { ...current, ...finalUpdates } : wp
          )
        }));
      }
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.log('[WorkPlan] Failed to update work plan:', err);
      throw err;
    }
  },

  completeWorkPlan: async (id: string) => {
    // Store previous state for rollback
    const previousWorkPlans = get().workPlans;

    // Get the work plan to capture details before completion
    const workPlan = get().workPlans.find(wp => wp.id === id);
    if (!workPlan) {
      console.log('[WorkPlan] Work plan not found:', id);
      return;
    }

    // Calculate duration in weeks
    const startDate = new Date(workPlan.startDate);
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startDate.getTime();
    const durationWeeks = Math.max(0.1, Math.round((durationMs / (1000 * 60 * 60 * 24 * 7)) * 10) / 10);

    // Calculate total cost including AI tools
    const humanCost = workPlan.allocations.reduce((sum, a) => sum + (a.squaresPerWeek * a.costPerSquare), 0);
    const aiCost = workPlan.appliedAITools.reduce((sum, tool) => sum + (tool.costPerSquare * workPlan.tusExpended), 0);
    const totalCost = humanCost + aiCost;

    // Extract team member details
    const teamMemberIds = workPlan.allocations.map(a => a.memberId);
    const teamMemberNames = workPlan.allocations.map(a => a.memberName);

    // Optimistic update
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id
          ? {
            ...wp,
            status: 'completed' as const,
            progress: 100,
            // Keep assignedMemberIds for history/visibility (don't clear)
            // Only clear allocations to free up TU capacity
            allocations: [], // Free all TU allocations
            auditRecord: {
              completedAt: completedAt.toISOString(),
              totalTUsSpent: wp.tusExpended,
              totalCost,
              totalWeeks: durationWeeks,
            },
          }
          : wp
      ),
    }));

    try {
      // Check if this is a real work plan or temporary draft
      const workPlanExists = !id.startsWith('temp-');

      if (!workPlanExists) {
        console.log('[WorkPlan] Skipping Supabase update for temporary work plan:', id);
        return;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('work_plans')
        .update({ status: 'completed', progress: 100 })
        .eq('id', id);

      if (error) throw error;

      // Create comprehensive audit record
      const { error: auditError } = await supabase
        .from('work_plan_audit_records')
        .upsert({
          work_plan_id: id,
          completed_at: completedAt.toISOString(),
          completed_by: teamMemberIds.length > 0 ? teamMemberIds[0] : null,
          task_title: workPlan.title,
          task_description: workPlan.description,
          team_member_ids: teamMemberIds,
          team_member_names: teamMemberNames,
          duration_weeks: durationWeeks,
          total_tu_spent: workPlan.tusExpended,
          total_cost: totalCost,
          start_date: workPlan.startDate,
          actual_end_date: completedAt.toISOString(),
          notes: `Task completed. Team: ${teamMemberNames.join(', ')}. Duration: ${durationWeeks} weeks. Total TUs: ${workPlan.tusExpended}.`,
        });

      if (auditError) {
        console.log('[WorkPlan] Failed to create audit record:', auditError);
        // Don't fail the entire operation if audit fails
      }

      // Delete allocations (free resources)
      await supabase
        .from('work_plan_allocations')
        .delete()
        .eq('work_plan_id', id);

      console.log(`[WorkPlan] ✅ Task completed and recorded: "${workPlan.title}" by ${teamMemberNames.join(', ')} (${durationWeeks} weeks, ${workPlan.tusExpended} TUs, £${totalCost.toFixed(2)})`);
    } catch (err) {
      // Rollback on error
      set({ workPlans: previousWorkPlans });
      console.log('[WorkPlan] Failed to complete work plan:', err);
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
      // Check if this is a real work plan or temporary draft
      const workPlanExists = !id.startsWith('temp-');

      if (!workPlanExists) {
        console.log('[WorkPlan] Skipping Supabase update for temporary work plan:', id);
        return;
      }

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
      console.log('[WorkPlan] Failed to abandon work plan:', err);
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
      // Check if this is a real work plan or temporary draft
      const workPlanExists = !id.startsWith('temp-');

      if (!workPlanExists) {
        console.log('[WorkPlan] Skipping Supabase delete for temporary work plan:', id);
        return;
      }

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
      console.log('[WorkPlan] Failed to delete work plan:', err);
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
  // COMPLETION WORKFLOW METHODS (NEW)
  // ========================================

  submitForReview: async (workPlanId: string, submittedBy: string, submittedByName: string, notes?: string) => {
    const workPlan = get().workPlans.find(wp => wp.id === workPlanId);
    if (!workPlan) {
      console.error('[WorkPlan] Work plan not found:', workPlanId);
      return false;
    }

    // Validation: Must be at least 90% complete
    if (workPlan.progress < 90) {
      console.error('[WorkPlan] Task must be at least 90% complete to submit');
      return false;
    }

    // Validation: Check required checklist items
    const requiredIncomplete = workPlan.completionChecklist?.filter(
      item => item.required && !item.completed
    ) || [];

    if (requiredIncomplete.length > 0) {
      console.error('[WorkPlan] Required checklist items incomplete:', requiredIncomplete);
      return false;
    }

    const now = new Date().toISOString();

    // Optimistic update
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === workPlanId
          ? {
            ...wp,
            completionStatus: 'submitted' as const,
            submittedForReviewAt: now,
            submittedBy,
            submittedByName,
            submissionNotes: notes,
            status: 'in-progress' as const, // Stays in-progress until approved
          }
          : wp
      ),
    }));

    console.log(`[WorkPlan] Task ${workPlanId} submitted for review by ${submittedByName}`);

    try {
      const workPlanExists = !workPlanId.startsWith('temp-');
      if (workPlanExists) {
        await supabase
          .from('work_plans')
          .update({
            completion_status: 'submitted',
            submitted_for_review_at: now,
            submitted_by: submittedBy,
            submitted_by_name: submittedByName,
            submission_notes: notes,
          })
          .eq('id', workPlanId);
      }
    } catch (err) {
      console.error('[WorkPlan] Failed to sync submission:', err);
    }

    return true;
  },

  approveCompletion: async (workPlanId: string, reviewedBy: string, reviewedByName: string, feedback?: string) => {
    const workPlan = get().workPlans.find(wp => wp.id === workPlanId);
    if (!workPlan) {
      console.error('[WorkPlan] Work plan not found:', workPlanId);
      return false;
    }

    // Can only approve tasks that are submitted
    if (workPlan.completionStatus !== 'submitted') {
      console.error('[WorkPlan] Task must be submitted before approval');
      return false;
    }

    const now = new Date().toISOString();

    // Update to approved
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === workPlanId
          ? {
            ...wp,
            completionStatus: 'approved' as const,
            reviewedAt: now,
            reviewedBy,
            reviewedByName,
            reviewFeedback: feedback,
          }
          : wp
      ),
    }));

    // Now actually complete the task
    await get().completeWorkPlan(workPlanId);

    console.log(`[WorkPlan] Task ${workPlanId} approved by ${reviewedByName}`);

    try {
      const workPlanExists = !workPlanId.startsWith('temp-');
      if (workPlanExists) {
        await supabase
          .from('work_plans')
          .update({
            completion_status: 'approved',
            reviewed_at: now,
            reviewed_by: reviewedBy,
            reviewed_by_name: reviewedByName,
            review_feedback: feedback,
          })
          .eq('id', workPlanId);
      }
    } catch (err) {
      console.error('[WorkPlan] Failed to sync approval:', err);
    }

    return true;
  },

  requestRevisions: async (workPlanId: string, reviewedBy: string, reviewedByName: string, feedback: string) => {
    const workPlan = get().workPlans.find(wp => wp.id === workPlanId);
    if (!workPlan) {
      console.error('[WorkPlan] Work plan not found:', workPlanId);
      return false;
    }

    if (workPlan.completionStatus !== 'submitted') {
      console.error('[WorkPlan] Task must be submitted before requesting revisions');
      return false;
    }

    const now = new Date().toISOString();

    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === workPlanId
          ? {
            ...wp,
            completionStatus: 'needs-revision' as const,
            reviewedAt: now,
            reviewedBy,
            reviewedByName,
            reviewFeedback: feedback,
            status: 'in-progress' as const, // Back to in-progress
          }
          : wp
      ),
    }));

    console.log(`[WorkPlan] Task ${workPlanId} needs revisions: ${feedback}`);

    try {
      const workPlanExists = !workPlanId.startsWith('temp-');
      if (workPlanExists) {
        await supabase
          .from('work_plans')
          .update({
            completion_status: 'needs-revision',
            reviewed_at: now,
            reviewed_by: reviewedBy,
            reviewed_by_name: reviewedByName,
            review_feedback: feedback,
            status: 'in-progress',
          })
          .eq('id', workPlanId);
      }
    } catch (err) {
      console.error('[WorkPlan] Failed to sync revision request:', err);
    }

    return true;
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

  // Ensure a default miscellaneous task exists for unaccounted TUs
  ensureMiscellaneousTask: async (workspaceId: string) => {
    // Check if any miscellaneous task already exists for this workspace
    const existingMiscTask = get().workPlans.find(
      wp => wp.workspaceId === workspaceId && wp.title === 'Miscellaneous'
    );

    // If miscellaneous task already exists, skip
    if (existingMiscTask) {
      return;
    }

    // Also check Supabase to see if one exists there
    try {
      const { data: existingInDb } = await supabase
        .from('work_plans')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('title', 'Miscellaneous')
        .maybeSingle();

      if (existingInDb) {
        // Already exists in database, don't create duplicate
        return;
      }
    } catch {
      // If check fails, continue to try creating
    }

    console.log('[WorkPlanStore] Creating default miscellaneous task');

    // Get current user from app store
    const currentMembership = useAppStore.getState().currentMembership;
    const assignedBy = currentMembership?.id || 'system';
    const ownerId = currentMembership?.id || undefined;

    // Create a permanent miscellaneous task assigned to current user
    // Use a local-only ID that won't be persisted to Supabase
    const localMiscTaskId = `local-misc-${Date.now()}`;
    const miscTask: WorkPlan = {
      id: localMiscTaskId,
      workspaceId,
      title: 'Miscellaneous',
      description: 'Default task for unaccounted time units - meetings, admin, learning, etc.',
      function: 'Ops',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      status: 'in-progress',
      progress: 0,
      assignedBy,
      needsSubmission: false,
      assignmentStatus: 'accepted',
      estimatedTimeUnits: 1000, // Large buffer for misc work
      allocations: currentMembership ? [{
        memberId: currentMembership.id,
        memberName: 'User', // Default name - will be updated by UI
        squaresPerWeek: 0, // User can allocate as needed
        costPerSquare: 0,
      }] : [],
      appliedAITools: [],
      tusExpended: 0,
      assignedMemberIds: currentMembership ? [currentMembership.id] : [],
      ownerId,
    };

    // Try to persist to Supabase first (let DB generate proper UUID)
    try {
      const supabaseWorkPlan = {
        // Don't provide id - let Supabase generate a proper UUID
        workspace_id: workspaceId,
        title: miscTask.title,
        description: miscTask.description,
        status: 'in-progress',
        priority: 'low',
        progress: 0,
        start_date: miscTask.startDate,
        end_date: miscTask.dueDate,
        created_by: null,
      };

      const { data, error } = await supabase
        .from('work_plans')
        .insert(supabaseWorkPlan)
        .select()
        .single();

      if (error) {
        console.log('[WorkPlanStore] Failed to persist miscellaneous task to Supabase:', error.message);
        // Add local-only version
        set(state => ({ workPlans: [...state.workPlans, miscTask] }));
      } else if (data) {
        // Update the task with the real ID from Supabase
        const realMiscTask: WorkPlan = {
          ...miscTask,
          id: data.id,
        };
        set(state => ({ workPlans: [...state.workPlans, realMiscTask] }));
      }
    } catch (err) {
      console.error('[WorkPlanStore] Error creating miscellaneous task:', err);
      // Add local-only version as fallback
      set(state => ({ workPlans: [...state.workPlans, miscTask] }));
    }
  },

  // NEW: Assignment workflow methods
  acceptTask: async (id: string, memberId: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id ? { ...wp, assignmentStatus: 'accepted' as const } : wp
      ),
    }));

    try {
      const workPlanExists = !id.startsWith('temp-');
      if (workPlanExists) {
        await supabase
          .from('work_plans')
          .update({ assignment_status: 'accepted' })
          .eq('id', id);
      }
    } catch (err) {
      console.error('[WorkPlan] Failed to accept task:', err);
    }
  },

  rejectTask: async (id: string, memberId: string, reason: string) => {
    set(state => ({
      workPlans: state.workPlans.map(wp =>
        wp.id === id ? { ...wp, assignmentStatus: 'rejected' as const, rejectionReason: reason } : wp
      ),
    }));

    try {
      const workPlanExists = !id.startsWith('temp-');
      if (workPlanExists) {
        await supabase
          .from('work_plans')
          .update({ assignment_status: 'rejected', rejection_reason: reason })
          .eq('id', id);

        // Notify the creator about the rejection
        const task = get().workPlans.find(wp => wp.id === id);
        if (task && task.assignedBy) {
          const { useNotificationStore } = await import('./notification-store');
          useNotificationStore.getState().addNotification({
            type: 'message',
            workspaceId: task.workspaceId,
            title: 'Task Rejected',
            message: `A task was rejected: "${task.title}". Reason: ${reason}`,
            actionLabel: 'Review',
            userId: task.assignedBy, // Notify the person who assigned it
          });
        }
      }
    } catch (err) {
      console.error('[WorkPlan] Failed to reject task:', err);
    }
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
