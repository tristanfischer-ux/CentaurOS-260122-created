// Financial data for founders dashboard and board pack
// Includes revenues, costs, burn rate, and budget tracking
//
// NOTE: This file now returns empty/zero values by default.
// Actual financial data should be loaded from Supabase.

export interface FinancialMetrics {
  currentMonth: string; // e.g., "January 2026"
  revenue: {
    total: number;
    breakdown: {
      productSales: number;
      services: number;
      recurring: number;
      other: number;
    };
    growth: number; // percentage change from last month
  };
  cogs: {
    total: number;
    breakdown: {
      materials: number;
      manufacturing: number;
      shipping: number;
      other: number;
    };
  };
  teamCosts: {
    total: number;
    breakdown: {
      founders: number;
      fractionalExecs: number;
      apprentices: number;
    };
    headcount: {
      founders: number;
      fractionalExecs: number;
      apprentices: number;
    };
  };
  aiCosts: {
    total: number;
    breakdown: {
      openai: number;
      anthropic: number;
      google: number;
      elevenlabs: number;
      other: number;
    };
  };
  otherCosts: {
    total: number;
    breakdown: {
      office: number;
      software: number;
      marketing: number;
      legal: number;
      other: number;
    };
  };
  burnRate: number; // total monthly spend
  runway: number; // months of runway remaining
  cashBalance: number;
}

export interface BudgetTargets {
  monthlyRevenue: number;
  maxTeamCost: number;
  maxAICost: number;
  maxCOGS: number;
  maxOtherCosts: number;
  targetBurnRate: number;
}

// Current financial metrics - DISABLED: Returns zeros for multi-tenant architecture
// Actual data should be loaded from Supabase
export const CURRENT_FINANCIALS: FinancialMetrics = {
  currentMonth: 'January 2026',
  revenue: {
    total: 0,
    breakdown: {
      productSales: 0,
      services: 0,
      recurring: 0,
      other: 0,
    },
    growth: 0,
  },
  cogs: {
    total: 0,
    breakdown: {
      materials: 0,
      manufacturing: 0,
      shipping: 0,
      other: 0,
    },
  },
  teamCosts: {
    total: 0,
    breakdown: {
      founders: 0,
      fractionalExecs: 0,
      apprentices: 0,
    },
    headcount: {
      founders: 0,
      fractionalExecs: 0,
      apprentices: 0,
    },
  },
  aiCosts: {
    total: 0,
    breakdown: {
      openai: 0,
      anthropic: 0,
      google: 0,
      elevenlabs: 0,
      other: 0,
    },
  },
  otherCosts: {
    total: 0,
    breakdown: {
      office: 0,
      software: 0,
      marketing: 0,
      legal: 0,
      other: 0,
    },
  },
  burnRate: 0,
  runway: 0,
  cashBalance: 0,
};

// Historical data for trend analysis - DISABLED: Returns empty for multi-tenant architecture
// Actual data should be loaded from Supabase
export const FINANCIAL_HISTORY: FinancialMetrics[] = [];

// Default budget targets - can be customized per workspace
export const DEFAULT_BUDGET: BudgetTargets = {
  monthlyRevenue: 0,
  maxTeamCost: 0,
  maxAICost: 0,
  maxCOGS: 0,
  maxOtherCosts: 0,
  targetBurnRate: 0,
};

// Calculate key financial ratios
export function calculateFinancialRatios(metrics: FinancialMetrics) {
  const grossProfit = metrics.revenue.total - metrics.cogs.total;
  const grossMargin = metrics.revenue.total > 0 ? (grossProfit / metrics.revenue.total) * 100 : 0;

  const operatingExpenses = metrics.teamCosts.total + metrics.aiCosts.total + metrics.otherCosts.total;
  const netProfit = grossProfit - operatingExpenses;
  const netMargin = metrics.revenue.total > 0 ? (netProfit / metrics.revenue.total) * 100 : 0;

  const teamBurnPercentage = metrics.burnRate > 0 ? (metrics.teamCosts.total / metrics.burnRate) * 100 : 0;
  const aiBurnPercentage = metrics.burnRate > 0 ? (metrics.aiCosts.total / metrics.burnRate) * 100 : 0;
  const cogsBurnPercentage = metrics.burnRate > 0 ? (metrics.cogs.total / metrics.burnRate) * 100 : 0;

  return {
    grossProfit,
    grossMargin,
    operatingExpenses,
    netProfit,
    netMargin,
    teamBurnPercentage,
    aiBurnPercentage,
    cogsBurnPercentage,
    cashBurnPercentage: 100,
  };
}

// Calculate budget variance
export function calculateBudgetVariance(actual: FinancialMetrics, budget: BudgetTargets) {
  return {
    revenue: {
      actual: actual.revenue.total,
      budget: budget.monthlyRevenue,
      variance: actual.revenue.total - budget.monthlyRevenue,
      variancePercent: budget.monthlyRevenue > 0 ? ((actual.revenue.total - budget.monthlyRevenue) / budget.monthlyRevenue) * 100 : 0,
    },
    teamCost: {
      actual: actual.teamCosts.total,
      budget: budget.maxTeamCost,
      variance: actual.teamCosts.total - budget.maxTeamCost,
      variancePercent: budget.maxTeamCost > 0 ? ((actual.teamCosts.total - budget.maxTeamCost) / budget.maxTeamCost) * 100 : 0,
    },
    aiCost: {
      actual: actual.aiCosts.total,
      budget: budget.maxAICost,
      variance: actual.aiCosts.total - budget.maxAICost,
      variancePercent: budget.maxAICost > 0 ? ((actual.aiCosts.total - budget.maxAICost) / budget.maxAICost) * 100 : 0,
    },
    cogs: {
      actual: actual.cogs.total,
      budget: budget.maxCOGS,
      variance: actual.cogs.total - budget.maxCOGS,
      variancePercent: budget.maxCOGS > 0 ? ((actual.cogs.total - budget.maxCOGS) / budget.maxCOGS) * 100 : 0,
    },
    otherCosts: {
      actual: actual.otherCosts.total,
      budget: budget.maxOtherCosts,
      variance: actual.otherCosts.total - budget.maxOtherCosts,
      variancePercent: budget.maxOtherCosts > 0 ? ((actual.otherCosts.total - budget.maxOtherCosts) / budget.maxOtherCosts) * 100 : 0,
    },
    burnRate: {
      actual: actual.burnRate,
      budget: budget.targetBurnRate,
      variance: actual.burnRate - budget.targetBurnRate,
      variancePercent: budget.targetBurnRate > 0 ? ((actual.burnRate - budget.targetBurnRate) / budget.targetBurnRate) * 100 : 0,
    },
  };
}
