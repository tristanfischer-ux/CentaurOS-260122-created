/**
 * OKR Planner Store
 * Zustand store for managing OKR plans, forecasts, and planning history
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OKRPlan, PlannerHistoryWeek, OKRPlanSnapshot } from '@/lib/okr/planner-types';

const STORAGE_KEY = 'okr-planner-state';

interface OKRPlannerState {
  plans: OKRPlan[];
  history: PlannerHistoryWeek[];
  activePlanId: string | null;

  // Actions
  initializePlans: () => Promise<void>;

  // Plan CRUD
  createPlan: (plan: Omit<OKRPlan, 'id' | 'createdAt' | 'updatedAt'>) => string;
  getPlanById: (id: string) => OKRPlan | undefined;
  getPlansByOKR: (okrId: string) => OKRPlan[];
  getPlansByWorkspace: (workspaceId: string) => OKRPlan[];
  updatePlan: (id: string, updates: Partial<OKRPlan>) => void;
  deletePlan: (id: string) => void;

  // Active plan management
  setActivePlan: (id: string | null) => void;
  getActivePlan: () => OKRPlan | undefined;

  // Undo/Redo for plan edits
  savePlanSnapshot: (planId: string) => void;
  undoPlanChange: (planId: string) => boolean;

  // History tracking
  addHistoryWeek: (week: PlannerHistoryWeek) => void;
  getHistoryByOKR: (okrId: string) => PlannerHistoryWeek[];
  getHistoryByWorkspace: (workspaceId: string) => PlannerHistoryWeek[];

  // Persistence
  saveToDisk: () => Promise<void>;
}

export const useOKRPlannerStore = create<OKRPlannerState>((set, get) => ({
  plans: [],
  history: [],
  activePlanId: null,

  // Initialize from AsyncStorage
  initializePlans: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          plans: data.plans || [],
          history: data.history || [],
          activePlanId: data.activePlanId || null,
        });
      }
    } catch (error) {
      console.error('Failed to load OKR planner state:', error);
    }
  },

  // Create new plan
  createPlan: (planData) => {
    const id = `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newPlan: OKRPlan = {
      ...planData,
      id,
      createdAt: now,
      updatedAt: now,
      undoStack: [],
    };

    set((state) => ({
      plans: [...state.plans, newPlan],
      activePlanId: id,
    }));

    get().saveToDisk();
    return id;
  },

  // Get plan by ID
  getPlanById: (id) => {
    return get().plans.find((p) => p.id === id);
  },

  // Get all plans for an OKR
  getPlansByOKR: (okrId) => {
    return get().plans.filter((p) => p.okrId === okrId);
  },

  // Get all plans for a workspace
  getPlansByWorkspace: (workspaceId) => {
    return get().plans.filter((p) => p.workspaceId === workspaceId);
  },

  // Update plan
  updatePlan: (id, updates) => {
    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ),
    }));

    get().saveToDisk();
  },

  // Delete plan
  deletePlan: (id) => {
    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      activePlanId: state.activePlanId === id ? null : state.activePlanId,
    }));

    get().saveToDisk();
  },

  // Set active plan
  setActivePlan: (id) => {
    set({ activePlanId: id });
    get().saveToDisk();
  },

  // Get active plan
  getActivePlan: () => {
    const { activePlanId, plans } = get();
    if (!activePlanId) return undefined;
    return plans.find((p) => p.id === activePlanId);
  },

  // Save plan snapshot for undo
  savePlanSnapshot: (planId) => {
    const plan = get().getPlanById(planId);
    if (!plan) return;

    const snapshot: OKRPlanSnapshot = {
      allocations: plan.allocations,
      toolAttachments: plan.toolAttachments,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              undoStack: [...(p.undoStack || []), snapshot].slice(-10), // Keep last 10 snapshots
            }
          : p
      ),
    }));

    get().saveToDisk();
  },

  // Undo last plan change
  undoPlanChange: (planId) => {
    const plan = get().getPlanById(planId);
    if (!plan || !plan.undoStack || plan.undoStack.length === 0) {
      return false;
    }

    const lastSnapshot = plan.undoStack[plan.undoStack.length - 1];

    set((state) => ({
      plans: state.plans.map((p) =>
        p.id === planId
          ? {
              ...p,
              allocations: lastSnapshot.allocations,
              toolAttachments: lastSnapshot.toolAttachments,
              undoStack: p.undoStack!.slice(0, -1),
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));

    get().saveToDisk();
    return true;
  },

  // Add history week
  addHistoryWeek: (week) => {
    set((state) => ({
      history: [...state.history, week],
    }));

    get().saveToDisk();
  },

  // Get history by OKR
  getHistoryByOKR: (okrId) => {
    return get().history.filter((h) => h.okrId === okrId);
  },

  // Get history by workspace
  getHistoryByWorkspace: (workspaceId) => {
    return get().history.filter((h) => h.workspaceId === workspaceId);
  },

  // Persist to AsyncStorage
  saveToDisk: async () => {
    try {
      const { plans, history, activePlanId } = get();
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ plans, history, activePlanId })
      );
    } catch (error) {
      console.error('Failed to save OKR planner state:', error);
    }
  },
}));
