// Financial data for founders dashboard and board pack
// Includes revenues, costs, burn rate, and budget tracking

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

// Current financial metrics (January 2026)
export const CURRENT_FINANCIALS: FinancialMetrics = {
  currentMonth: 'January 2026',
  revenue: {
    total: 45000,
    breakdown: {
      productSales: 38000,
      services: 5000,
      recurring: 2000,
      other: 0,
    },
    growth: 15.5, // 15.5% growth from last month
  },
  cogs: {
    total: 18500,
    breakdown: {
      materials: 12000,
      manufacturing: 4500,
      shipping: 1500,
      other: 500,
    },
  },
  teamCosts: {
    total: 28600,
    breakdown: {
      founders: 0, // Founders not taking salary yet
      fractionalExecs: 13600, // 4 execs * ~3400/month average
      apprentices: 15000, // 7 apprentices * ~2150/month average
    },
    headcount: {
      founders: 2,
      fractionalExecs: 4,
      apprentices: 7,
    },
  },
  aiCosts: {
    total: 2169,
    breakdown: {
      openai: 1110, // GPT-4 Turbo + DALL-E + GitHub Copilot + ChatGPT Enterprise
      anthropic: 380, // Claude 3.5 Sonnet
      google: 200, // Gemini Pro
      elevenlabs: 99, // Voice AI
      other: 380, // Perplexity + Midjourney + Zapier
    },
  },
  otherCosts: {
    total: 8500,
    breakdown: {
      office: 2000,
      software: 1500,
      marketing: 3000,
      legal: 1500,
      other: 500,
    },
  },
  burnRate: 57769, // Total monthly spend
  runway: 10.4, // months
  cashBalance: 600000,
};

// Historical data for trend analysis (last 6 months)
export const FINANCIAL_HISTORY: FinancialMetrics[] = [
  {
    currentMonth: 'August 2025',
    revenue: {
      total: 12000,
      breakdown: { productSales: 10000, services: 2000, recurring: 0, other: 0 },
      growth: 0,
    },
    cogs: {
      total: 8000,
      breakdown: { materials: 6000, manufacturing: 1500, shipping: 400, other: 100 },
    },
    teamCosts: {
      total: 18200,
      breakdown: { founders: 0, fractionalExecs: 6800, apprentices: 11400 },
      headcount: { founders: 2, fractionalExecs: 2, apprentices: 6 },
    },
    aiCosts: {
      total: 980,
      breakdown: { openai: 450, anthropic: 380, google: 0, elevenlabs: 0, other: 150 },
    },
    otherCosts: {
      total: 6500,
      breakdown: { office: 2000, software: 1200, marketing: 2000, legal: 1000, other: 300 },
    },
    burnRate: 33680,
    runway: 17.8,
    cashBalance: 600000,
  },
  {
    currentMonth: 'September 2025',
    revenue: {
      total: 18000,
      breakdown: { productSales: 15000, services: 3000, recurring: 0, other: 0 },
      growth: 50,
    },
    cogs: {
      total: 11000,
      breakdown: { materials: 8000, manufacturing: 2200, shipping: 600, other: 200 },
    },
    teamCosts: {
      total: 20800,
      breakdown: { founders: 0, fractionalExecs: 8500, apprentices: 12300 },
      headcount: { founders: 2, fractionalExecs: 3, apprentices: 6 },
    },
    aiCosts: {
      total: 1350,
      breakdown: { openai: 520, anthropic: 380, google: 200, elevenlabs: 0, other: 250 },
    },
    otherCosts: {
      total: 7000,
      breakdown: { office: 2000, software: 1300, marketing: 2200, legal: 1200, other: 300 },
    },
    burnRate: 40150,
    runway: 14.9,
    cashBalance: 600000,
  },
  {
    currentMonth: 'October 2025',
    revenue: {
      total: 25000,
      breakdown: { productSales: 21000, services: 3000, recurring: 1000, other: 0 },
      growth: 38.9,
    },
    cogs: {
      total: 13500,
      breakdown: { materials: 9500, manufacturing: 3000, shipping: 800, other: 200 },
    },
    teamCosts: {
      total: 23400,
      breakdown: { founders: 0, fractionalExecs: 10200, apprentices: 13200 },
      headcount: { founders: 2, fractionalExecs: 3, apprentices: 7 },
    },
    aiCosts: {
      total: 1680,
      breakdown: { openai: 780, anthropic: 380, google: 200, elevenlabs: 0, other: 320 },
    },
    otherCosts: {
      total: 7500,
      breakdown: { office: 2000, software: 1400, marketing: 2500, legal: 1300, other: 300 },
    },
    burnRate: 46080,
    runway: 13.0,
    cashBalance: 600000,
  },
  {
    currentMonth: 'November 2025',
    revenue: {
      total: 32000,
      breakdown: { productSales: 27000, services: 4000, recurring: 1000, other: 0 },
      growth: 28.0,
    },
    cogs: {
      total: 15500,
      breakdown: { materials: 10500, manufacturing: 3800, shipping: 1000, other: 200 },
    },
    teamCosts: {
      total: 25900,
      breakdown: { founders: 0, fractionalExecs: 11800, apprentices: 14100 },
      headcount: { founders: 2, fractionalExecs: 4, apprentices: 7 },
    },
    aiCosts: {
      total: 1890,
      breakdown: { openai: 880, anthropic: 380, google: 200, elevenlabs: 99, other: 331 },
    },
    otherCosts: {
      total: 8000,
      breakdown: { office: 2000, software: 1450, marketing: 2700, legal: 1400, other: 450 },
    },
    burnRate: 51290,
    runway: 11.7,
    cashBalance: 600000,
  },
  {
    currentMonth: 'December 2025',
    revenue: {
      total: 39000,
      breakdown: { productSales: 33000, services: 4000, recurring: 2000, other: 0 },
      growth: 21.9,
    },
    cogs: {
      total: 17000,
      breakdown: { materials: 11500, manufacturing: 4200, shipping: 1100, other: 200 },
    },
    teamCosts: {
      total: 27200,
      breakdown: { founders: 0, fractionalExecs: 12400, apprentices: 14800 },
      headcount: { founders: 2, fractionalExecs: 4, apprentices: 7 },
    },
    aiCosts: {
      total: 2050,
      breakdown: { openai: 1010, anthropic: 380, google: 200, elevenlabs: 99, other: 361 },
    },
    otherCosts: {
      total: 8300,
      breakdown: { office: 2000, software: 1500, marketing: 2800, legal: 1500, other: 500 },
    },
    burnRate: 54550,
    runway: 11.0,
    cashBalance: 600000,
  },
  CURRENT_FINANCIALS, // January 2026
];

// Default budget targets
export const DEFAULT_BUDGET: BudgetTargets = {
  monthlyRevenue: 50000,
  maxTeamCost: 30000,
  maxAICost: 2500,
  maxCOGS: 20000,
  maxOtherCosts: 9000,
  targetBurnRate: 60000,
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
