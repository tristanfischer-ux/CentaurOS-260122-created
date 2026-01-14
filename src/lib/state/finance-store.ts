/**
 * Finance Store
 * Central source of truth for company financial data
 *
 * DATA SEPARATION:
 * - All financial data is COMPANY DATA (keyed by workspaceId)
 * - Cash is the ONLY currency (no secondary currencies like "Fuel")
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'finance-store-v1';
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export interface FinanceSnapshot {
  workspaceId: string;
  cashBalanceGBP: number;
  weeklyBurnGBP: number;
  runwayWeeks: number;
  monthlyRevenueGBP: number;
  updatedAt: string;
}

export interface CashFlowProjection {
  weekOffset: number; // 0 = current week, 1 = next week, etc.
  startingCashGBP: number;
  incomingGBP: number;
  outgoingGBP: number;
  endingCashGBP: number;
}

export interface BurnBreakdown {
  teamCostGBP: number;
  aiToolsCostGBP: number;
  supplierCostGBP: number;
  otherCostGBP: number;
  totalWeeklyBurnGBP: number;
}

interface FinanceState {
  snapshots: FinanceSnapshot[];
  isInitialized: boolean;

  // Actions
  initializeFinance: () => Promise<void>;

  // Getters
  getSnapshot: (workspaceId: string) => FinanceSnapshot | undefined;
  getCashBalance: (workspaceId: string) => number;
  getWeeklyBurn: (workspaceId: string) => number;
  getRunway: (workspaceId: string) => number;
  getMonthlyRevenue: (workspaceId: string) => number;

  // Mutations
  updateCashBalance: (workspaceId: string, newBalance: number) => void;
  updateWeeklyBurn: (workspaceId: string, newBurn: number) => void;
  updateMonthlyRevenue: (workspaceId: string, newRevenue: number) => void;
  updateSnapshot: (workspaceId: string, updates: Partial<Omit<FinanceSnapshot, 'workspaceId'>>) => void;

  // Calculations
  calculateRunway: (cashGBP: number, weeklyBurnGBP: number) => number;
  projectCashFlow: (workspaceId: string, weeksAhead: number) => CashFlowProjection[];
  getBurnBreakdown: (workspaceId: string) => BurnBreakdown;

  // Persistence
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

// Demo financial data
const DEMO_SNAPSHOT: FinanceSnapshot = {
  workspaceId: DEFAULT_WORKSPACE_ID,
  cashBalanceGBP: 485000, // ~£485K in the bank
  weeklyBurnGBP: 18500, // £18.5K/week burn (team + AI + suppliers)
  runwayWeeks: 26, // ~6 months
  monthlyRevenueGBP: 26000, // £26K/month revenue (early traction)
  updatedAt: new Date().toISOString(),
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  snapshots: [],
  isInitialized: false,

  initializeFinance: async () => {
    await get().loadFromStorage();

    const state = get();
    const existingSnapshot = state.snapshots.find(s => s.workspaceId === DEFAULT_WORKSPACE_ID);

    if (!existingSnapshot) {
      set((state) => ({
        snapshots: [...state.snapshots, DEMO_SNAPSHOT],
        isInitialized: true,
      }));
      await get().saveToStorage();
    } else {
      set({ isInitialized: true });
    }
  },

  getSnapshot: (workspaceId: string) => {
    return get().snapshots.find(s => s.workspaceId === workspaceId);
  },

  getCashBalance: (workspaceId: string) => {
    const snapshot = get().getSnapshot(workspaceId);
    return snapshot?.cashBalanceGBP ?? 0;
  },

  getWeeklyBurn: (workspaceId: string) => {
    const snapshot = get().getSnapshot(workspaceId);
    return snapshot?.weeklyBurnGBP ?? 0;
  },

  getRunway: (workspaceId: string) => {
    const snapshot = get().getSnapshot(workspaceId);
    return snapshot?.runwayWeeks ?? 0;
  },

  getMonthlyRevenue: (workspaceId: string) => {
    const snapshot = get().getSnapshot(workspaceId);
    return snapshot?.monthlyRevenueGBP ?? 0;
  },

  updateCashBalance: (workspaceId: string, newBalance: number) => {
    const weeklyBurn = get().getWeeklyBurn(workspaceId);
    const newRunway = get().calculateRunway(newBalance, weeklyBurn);

    set((state) => ({
      snapshots: state.snapshots.map(s =>
        s.workspaceId === workspaceId
          ? { ...s, cashBalanceGBP: newBalance, runwayWeeks: newRunway, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
    get().saveToStorage();
  },

  updateWeeklyBurn: (workspaceId: string, newBurn: number) => {
    const cashBalance = get().getCashBalance(workspaceId);
    const newRunway = get().calculateRunway(cashBalance, newBurn);

    set((state) => ({
      snapshots: state.snapshots.map(s =>
        s.workspaceId === workspaceId
          ? { ...s, weeklyBurnGBP: newBurn, runwayWeeks: newRunway, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
    get().saveToStorage();
  },

  updateMonthlyRevenue: (workspaceId: string, newRevenue: number) => {
    set((state) => ({
      snapshots: state.snapshots.map(s =>
        s.workspaceId === workspaceId
          ? { ...s, monthlyRevenueGBP: newRevenue, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
    get().saveToStorage();
  },

  updateSnapshot: (workspaceId: string, updates: Partial<Omit<FinanceSnapshot, 'workspaceId'>>) => {
    set((state) => ({
      snapshots: state.snapshots.map(s =>
        s.workspaceId === workspaceId
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      ),
    }));
    get().saveToStorage();
  },

  calculateRunway: (cashGBP: number, weeklyBurnGBP: number) => {
    if (weeklyBurnGBP <= 0) return 999; // Infinite runway if not burning
    return Math.floor(cashGBP / weeklyBurnGBP);
  },

  projectCashFlow: (workspaceId: string, weeksAhead: number) => {
    const snapshot = get().getSnapshot(workspaceId);
    if (!snapshot) return [];

    const projections: CashFlowProjection[] = [];
    let currentCash = snapshot.cashBalanceGBP;
    const weeklyRevenue = snapshot.monthlyRevenueGBP / 4.33; // Convert monthly to weekly

    for (let week = 0; week < weeksAhead; week++) {
      const projection: CashFlowProjection = {
        weekOffset: week,
        startingCashGBP: currentCash,
        incomingGBP: weeklyRevenue,
        outgoingGBP: snapshot.weeklyBurnGBP,
        endingCashGBP: currentCash + weeklyRevenue - snapshot.weeklyBurnGBP,
      };
      projections.push(projection);
      currentCash = projection.endingCashGBP;
    }

    return projections;
  },

  getBurnBreakdown: (workspaceId: string) => {
    // This would ideally pull from organization store
    // For now, use reasonable approximations based on demo data
    const weeklyBurn = get().getWeeklyBurn(workspaceId);

    return {
      teamCostGBP: weeklyBurn * 0.65, // ~65% team costs
      aiToolsCostGBP: weeklyBurn * 0.08, // ~8% AI tools
      supplierCostGBP: weeklyBurn * 0.20, // ~20% supplier costs
      otherCostGBP: weeklyBurn * 0.07, // ~7% other
      totalWeeklyBurnGBP: weeklyBurn,
    };
  },

  saveToStorage: async () => {
    try {
      const { snapshots } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ snapshots }));
    } catch (error) {
      console.error('Failed to save finance store:', error);
    }
  },

  loadFromStorage: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        set({
          snapshots: data.snapshots || [],
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error('Failed to load finance store:', error);
    }
  },
}));

// Selector hooks
export const useCashBalance = (workspaceId: string) =>
  useFinanceStore((s) => s.snapshots.find(snap => snap.workspaceId === workspaceId)?.cashBalanceGBP ?? 0);

export const useWeeklyBurn = (workspaceId: string) =>
  useFinanceStore((s) => s.snapshots.find(snap => snap.workspaceId === workspaceId)?.weeklyBurnGBP ?? 0);

export const useRunway = (workspaceId: string) =>
  useFinanceStore((s) => s.snapshots.find(snap => snap.workspaceId === workspaceId)?.runwayWeeks ?? 0);

export const useMonthlyRevenue = (workspaceId: string) =>
  useFinanceStore((s) => s.snapshots.find(snap => snap.workspaceId === workspaceId)?.monthlyRevenueGBP ?? 0);
