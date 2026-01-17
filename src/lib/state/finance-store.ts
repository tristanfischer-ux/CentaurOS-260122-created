/**
 * Finance Store
 *
 * Manages financial data for workspaces (company data tier).
 * All data is loaded from Supabase and cached in memory.
 *
 * Includes:
 * - Financial transactions (revenue and costs)
 * - Budget targets
 * - Calculated metrics (cash balance, burn rate, runway, etc.)
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface FinancialTransaction {
  id: string;
  workspace_id: string;
  type: 'revenue' | 'cost';
  category: string; // 'product_sales', 'services', 'team', 'ai_tools', 'manufacturing', etc.
  subcategory: string | null;
  amount: number;
  transaction_date: string; // ISO date string
  description: string | null;
  recurring: boolean;
  recurrence_period: string | null; // 'monthly', 'quarterly', 'annual'
  created_at: string;
}

export interface BudgetTarget {
  id: string;
  workspace_id: string;
  month: string; // ISO date string (first day of month)
  category: string; // 'revenue', 'team_cost', 'ai_cost', 'cogs', 'other'
  target_amount: number;
  created_at: string;
}

export interface BurnBreakdown {
  teamCostGBP: number;
  aiToolsCostGBP: number;
  supplierCostGBP: number;
  infrastructureCostGBP: number;
  manufacturingCostGBP: number;
  otherCostGBP: number;
  totalWeeklyBurnGBP: number;
}

export interface CashFlowProjection {
  weekOffset: number; // 0 = current week, 1 = next week, etc.
  startingCashGBP: number;
  incomingGBP: number;
  outgoingGBP: number;
  endingCashGBP: number;
}

// ============================================================================
// STORE
// ============================================================================

interface FinanceStore {
  // State
  transactions: FinancialTransaction[];
  budgetTargets: BudgetTarget[];
  isLoaded: boolean;

  // Actions
  loadFinancialData: (workspaceId: string) => Promise<void>;
  addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<FinancialTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudgetTarget: (target: Omit<BudgetTarget, 'id' | 'created_at'>) => Promise<void>;
  clearFinancialData: () => void;

  // Selectors - Cash metrics
  getCashBalance: (workspaceId: string) => number;
  getWeeklyBurn: (workspaceId: string) => number;
  getMonthlyBurn: (workspaceId: string) => number;
  getRunway: (workspaceId: string) => number;
  getMonthlyRevenue: (workspaceId: string) => number;

  // Selectors - Breakdowns
  getBurnBreakdown: (workspaceId: string) => BurnBreakdown;
  getRevenueByCategory: (workspaceId: string) => Record<string, number>;
  getCostsByCategory: (workspaceId: string) => Record<string, number>;

  // Selectors - Projections
  projectCashFlow: (workspaceId: string, weeksAhead: number) => CashFlowProjection[];
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  // Initial state
  transactions: [],
  budgetTargets: [],
  isLoaded: false,

  // Actions
  loadFinancialData: async (workspaceId: string) => {
    const { supabase } = await import('../supabase');

    console.log('[FinanceStore] Loading financial data for workspace:', workspaceId);

    try {
      // Load all financial data for workspace
      const [transactionsRes, budgetTargetsRes] = await Promise.all([
        supabase
          .from('financial_transactions')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('transaction_date', { ascending: false }),
        supabase
          .from('budget_targets')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('month', { ascending: false }),
      ]);

      if (transactionsRes.error) {
        console.error('[FinanceStore] Transaction error:', transactionsRes.error);
        throw transactionsRes.error;
      }
      if (budgetTargetsRes.error) {
        console.error('[FinanceStore] Budget targets error:', budgetTargetsRes.error);
        throw budgetTargetsRes.error;
      }

      console.log('[FinanceStore] Loaded transactions:', transactionsRes.data?.length || 0);
      console.log('[FinanceStore] Loaded budget targets:', budgetTargetsRes.data?.length || 0);

      set({
        transactions: transactionsRes.data || [],
        budgetTargets: budgetTargetsRes.data || [],
        isLoaded: true,
      });

      // Calculate and log metrics
      const cashBalance = get().getCashBalance(workspaceId);
      const weeklyBurn = get().getWeeklyBurn(workspaceId);
      const runway = get().getRunway(workspaceId);
      console.log('[FinanceStore] Calculated metrics:', {
        cashBalance,
        weeklyBurn,
        runway,
      });
    } catch (error) {
      console.error('[FinanceStore] Failed to load financial data:', error);
      set({
        transactions: [],
        budgetTargets: [],
        isLoaded: true,
      });
    }
  },

  addTransaction: async (transaction) => {
    const { supabase } = await import('../supabase');

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        transactions: [data, ...state.transactions],
      }));
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    const { supabase } = await import('../supabase');

    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? data : t)),
      }));
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    const { supabase } = await import('../supabase');

    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  },

  addBudgetTarget: async (target) => {
    const { supabase } = await import('../supabase');

    try {
      const { data, error } = await supabase
        .from('budget_targets')
        .insert(target)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        budgetTargets: [data, ...state.budgetTargets],
      }));
    } catch (error) {
      console.error('Failed to add budget target:', error);
      throw error;
    }
  },

  clearFinancialData: () => {
    set({
      transactions: [],
      budgetTargets: [],
      isLoaded: false,
    });
  },

  // Selectors - Cash metrics
  getCashBalance: (workspaceId: string) => {
    const transactions = get().transactions.filter((t) => t.workspace_id === workspaceId);

    const totalRevenue = transactions
      .filter((t) => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCosts = transactions
      .filter((t) => t.type === 'cost')
      .reduce((sum, t) => sum + t.amount, 0);

    return totalRevenue - totalCosts;
  },

  getWeeklyBurn: (workspaceId: string) => {
    const transactions = get().transactions.filter((t) => t.workspace_id === workspaceId);

    // Get recurring monthly costs
    const monthlyRecurringCosts = transactions
      .filter((t) => t.type === 'cost' && t.recurring && t.recurrence_period === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);

    // Convert to weekly (monthly / 4.33)
    return monthlyRecurringCosts / 4.33;
  },

  getMonthlyBurn: (workspaceId: string) => {
    const weeklyBurn = get().getWeeklyBurn(workspaceId);
    return weeklyBurn * 4.33;
  },

  getRunway: (workspaceId: string) => {
    const cashBalance = get().getCashBalance(workspaceId);
    const weeklyBurn = get().getWeeklyBurn(workspaceId);

    if (weeklyBurn <= 0) return 999; // Infinite runway if not burning
    return Math.floor(cashBalance / weeklyBurn);
  },

  getMonthlyRevenue: (workspaceId: string) => {
    const transactions = get().transactions.filter((t) => t.workspace_id === workspaceId);

    // Get recurring monthly revenue
    const monthlyRecurringRevenue = transactions
      .filter((t) => t.type === 'revenue' && t.recurring && t.recurrence_period === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);

    // Also calculate average monthly revenue from recent transactions (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentRevenue = transactions
      .filter(
        (t) =>
          t.type === 'revenue' &&
          !t.recurring &&
          new Date(t.transaction_date) >= threeMonthsAgo
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const recentMonthlyAvg = recentRevenue / 3;

    // Return sum of recurring + average recent
    return monthlyRecurringRevenue + recentMonthlyAvg;
  },

  // Selectors - Breakdowns
  getBurnBreakdown: (workspaceId: string) => {
    const transactions = get().transactions.filter(
      (t) => t.workspace_id === workspaceId && t.type === 'cost' && t.recurring
    );

    const breakdown: BurnBreakdown = {
      teamCostGBP: 0,
      aiToolsCostGBP: 0,
      supplierCostGBP: 0,
      infrastructureCostGBP: 0,
      manufacturingCostGBP: 0,
      otherCostGBP: 0,
      totalWeeklyBurnGBP: 0,
    };

    transactions.forEach((t) => {
      const weeklyAmount = t.recurrence_period === 'monthly' ? t.amount / 4.33 : t.amount;

      switch (t.category) {
        case 'team':
          breakdown.teamCostGBP += weeklyAmount;
          break;
        case 'ai_tools':
          breakdown.aiToolsCostGBP += weeklyAmount;
          break;
        case 'supplier':
          breakdown.supplierCostGBP += weeklyAmount;
          break;
        case 'infrastructure':
          breakdown.infrastructureCostGBP += weeklyAmount;
          break;
        case 'manufacturing':
          breakdown.manufacturingCostGBP += weeklyAmount;
          break;
        default:
          breakdown.otherCostGBP += weeklyAmount;
      }
    });

    breakdown.totalWeeklyBurnGBP =
      breakdown.teamCostGBP +
      breakdown.aiToolsCostGBP +
      breakdown.supplierCostGBP +
      breakdown.infrastructureCostGBP +
      breakdown.manufacturingCostGBP +
      breakdown.otherCostGBP;

    return breakdown;
  },

  getRevenueByCategory: (workspaceId: string) => {
    const transactions = get().transactions.filter(
      (t) => t.workspace_id === workspaceId && t.type === 'revenue'
    );

    const breakdown: Record<string, number> = {};

    transactions.forEach((t) => {
      const category = t.category || 'other';
      breakdown[category] = (breakdown[category] || 0) + t.amount;
    });

    return breakdown;
  },

  getCostsByCategory: (workspaceId: string) => {
    const transactions = get().transactions.filter(
      (t) => t.workspace_id === workspaceId && t.type === 'cost'
    );

    const breakdown: Record<string, number> = {};

    transactions.forEach((t) => {
      const category = t.category || 'other';
      breakdown[category] = (breakdown[category] || 0) + t.amount;
    });

    return breakdown;
  },

  // Selectors - Projections
  projectCashFlow: (workspaceId: string, weeksAhead: number) => {
    const cashBalance = get().getCashBalance(workspaceId);
    const weeklyBurn = get().getWeeklyBurn(workspaceId);
    const monthlyRevenue = get().getMonthlyRevenue(workspaceId);
    const weeklyRevenue = monthlyRevenue / 4.33;

    const projections: CashFlowProjection[] = [];
    let currentCash = cashBalance;

    for (let week = 0; week < weeksAhead; week++) {
      const projection: CashFlowProjection = {
        weekOffset: week,
        startingCashGBP: currentCash,
        incomingGBP: weeklyRevenue,
        outgoingGBP: weeklyBurn,
        endingCashGBP: currentCash + weeklyRevenue - weeklyBurn,
      };
      projections.push(projection);
      currentCash = projection.endingCashGBP;
    }

    return projections;
  },
}));

// Selector hooks for convenience
export const useCashBalance = (workspaceId: string) =>
  useFinanceStore((s) => s.getCashBalance(workspaceId));

export const useWeeklyBurn = (workspaceId: string) =>
  useFinanceStore((s) => s.getWeeklyBurn(workspaceId));

export const useMonthlyBurn = (workspaceId: string) =>
  useFinanceStore((s) => s.getMonthlyBurn(workspaceId));

export const useRunway = (workspaceId: string) =>
  useFinanceStore((s) => s.getRunway(workspaceId));

export const useMonthlyRevenue = (workspaceId: string) =>
  useFinanceStore((s) => s.getMonthlyRevenue(workspaceId));
