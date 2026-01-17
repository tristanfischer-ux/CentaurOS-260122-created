/**
 * Centralized Financial Calculations
 * Single source of truth for all financial metrics across the app
 *
 * NOTE: This file now returns empty/zero values by default.
 * Actual financial data should be loaded from Supabase via the finance store.
 */

import { ORGANIZATION_MEMBERS } from './organization-seed';

// Cost item interface
export interface CostItem {
  id: string;
  name: string;
  amount: number;
  enabled: boolean;
  details?: string;
  editable: boolean;
}

// Calculate actual team costs from organization data
function calculateTeamCosts() {
  const executives = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec' && m.status === 'active');
  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice' && m.status === 'active');

  const execCost = executives.reduce((sum, exec) => {
    if (!exec.costPerDay) return sum;
    const daysPerWeek = exec.daysPerWeek || 5;
    return sum + (exec.costPerDay * daysPerWeek * 4.33);
  }, 0);

  const apprenticeCost = apprentices.reduce((sum, app) => {
    if (!app.costPerDay) return sum;
    const daysPerWeek = app.daysPerWeek || 5;
    return sum + (app.costPerDay * daysPerWeek * 4.33);
  }, 0);

  return {
    executives: { count: executives.length, cost: Math.round(execCost) },
    apprentices: { count: apprentices.length, cost: Math.round(apprenticeCost) },
  };
}

// Centralized financial data - returns zeros for multi-tenant architecture
// Actual data should come from Supabase via finance store
export const FINANCIAL_DATA = (() => {
  const teamCosts = calculateTeamCosts();

  return {
    // DISABLED: Hardcoded financial data removed for multi-tenant architecture
    // Financial data should be loaded from Supabase
    cashPosition: 0,
    monthlyRevenue: 0,

    costs: {
      team: [
        {
          id: 't1',
          name: `Fractional Executives (${teamCosts.executives.count})`,
          amount: teamCosts.executives.cost,
          enabled: true,
          details: 'Calculated from organization data',
          editable: false
        },
        {
          id: 't2',
          name: `Apprentices (${teamCosts.apprentices.count})`,
          amount: teamCosts.apprentices.cost,
          enabled: true,
          details: 'Calculated from organization data',
          editable: false
        },
        { id: 't3', name: 'Founder Salary', amount: 0, enabled: true, details: 'Minimal draw', editable: true },
      ],
    manufacturing: [
      { id: 'm1', name: 'TechFab Manufacturing', amount: 0, enabled: true, details: 'Primary manufacturer', editable: true },
      { id: 'm2', name: 'UK Electronics Supply', amount: 0, enabled: true, details: 'Component supplier', editable: true },
      { id: 'm3', name: 'GlobalShip Fulfillment', amount: 0, enabled: true, details: 'Shipping & logistics', editable: true },
    ],
    aiTools: [
      { id: 'ai1', name: 'OpenAI API', amount: 0, enabled: true, details: '~40K requests/month', editable: true },
      { id: 'ai2', name: 'Anthropic Claude', amount: 0, enabled: true, details: '~25K requests/month', editable: true },
      { id: 'ai3', name: 'Midjourney Pro', amount: 0, enabled: true, details: 'Unlimited generations', editable: true },
      { id: 'ai4', name: 'ElevenLabs', amount: 0, enabled: true, details: '500K characters/month', editable: true },
    ],
    infrastructure: [
      { id: 'i1', name: 'AWS Cloud Hosting', amount: 0, enabled: true, details: 'Production + staging', editable: true },
      { id: 'i2', name: 'Software Licenses', amount: 0, enabled: true, details: 'Figma, Linear, Notion, etc.', editable: true },
      { id: 'i3', name: 'Domain & SSL', amount: 0, enabled: true, details: 'Annual costs amortized', editable: true },
    ],
    marketing: [
      { id: 'mk1', name: 'Google Ads', amount: 0, enabled: true, details: 'Paid search campaigns', editable: true },
      { id: 'mk2', name: 'LinkedIn Ads', amount: 0, enabled: true, details: 'B2B lead generation', editable: true },
      { id: 'mk3', name: 'Content Marketing', amount: 0, enabled: true, details: 'Blog, SEO, copywriting', editable: true },
    ],
    facilities: [
      { id: 'f1', name: 'Co-working Space', amount: 0, enabled: true, details: '10 desks @ £250/desk', editable: true },
      { id: 'f2', name: 'Utilities', amount: 0, enabled: true, details: 'Internet, phone, etc.', editable: true },
    ],
    equipment: [
      { id: 'e1', name: 'Equipment Leases', amount: 0, enabled: true, details: 'Laptops, monitors (leased)', editable: true },
    ],
    insurance: [
      { id: 'in1', name: 'Business Insurance', amount: 0, enabled: true, details: 'General liability, cyber', editable: true },
      { id: 'in2', name: 'Product Liability', amount: 0, enabled: true, details: 'Hardware product coverage', editable: true },
    ],
    professional: [
      { id: 'p1', name: 'Legal Retainer', amount: 0, enabled: true, details: 'Corporate counsel', editable: true },
      { id: 'p2', name: 'Accounting & Tax', amount: 0, enabled: true, details: 'Bookkeeping, CFO services', editable: true },
    ],
    },
  };
})();

/**
 * Calculate total for a cost category
 */
export function calculateCategoryTotal(category: CostItem[]): number {
  return category.reduce((sum, item) => sum + (item.enabled ? item.amount : 0), 0);
}

/**
 * Calculate total monthly burn rate
 */
export function calculateMonthlyBurn(costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs): number {
  return (
    calculateCategoryTotal(costs.team) +
    calculateCategoryTotal(costs.manufacturing) +
    calculateCategoryTotal(costs.aiTools) +
    calculateCategoryTotal(costs.infrastructure) +
    calculateCategoryTotal(costs.marketing) +
    calculateCategoryTotal(costs.facilities) +
    calculateCategoryTotal(costs.equipment) +
    calculateCategoryTotal(costs.insurance) +
    calculateCategoryTotal(costs.professional)
  );
}

/**
 * Calculate runway in months - SINGLE SOURCE OF TRUTH
 * Returns runway rounded to 1 decimal place
 * If revenue > burn (positive cash flow), runway is infinite (returns 999)
 */
export function calculateRunway(
  cashPosition: number = FINANCIAL_DATA.cashPosition,
  costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs,
  monthlyRevenue: number = FINANCIAL_DATA.monthlyRevenue
): number {
  const monthlyBurn = calculateMonthlyBurn(costs);
  const netCashFlow = monthlyRevenue - monthlyBurn;

  // If we have positive cash flow, we're growing - runway is infinite
  if (netCashFlow >= 0) {
    return 999; // Represents infinite runway
  }

  // If we're burning cash, calculate months until we run out
  const monthlyNetBurn = Math.abs(netCashFlow);
  const runway = cashPosition / monthlyNetBurn;
  return Math.round(runway * 10) / 10; // Round to 1 decimal place
}

/**
 * Get all financial metrics
 */
export function getFinancialMetrics(costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs) {
  const monthlyBurn = calculateMonthlyBurn(costs);
  const runway = calculateRunway(FINANCIAL_DATA.cashPosition, costs, FINANCIAL_DATA.monthlyRevenue);
  const netCashFlow = FINANCIAL_DATA.monthlyRevenue - monthlyBurn;

  return {
    cashPosition: FINANCIAL_DATA.cashPosition,
    monthlyRevenue: FINANCIAL_DATA.monthlyRevenue,
    monthlyBurn,
    runway,
    netCashFlow,
    burnRate: monthlyBurn, // Alias for compatibility
  };
}

/**
 * Get breakdown by category
 */
export function getCostBreakdown(costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs) {
  return {
    team: calculateCategoryTotal(costs.team),
    manufacturing: calculateCategoryTotal(costs.manufacturing),
    aiTools: calculateCategoryTotal(costs.aiTools),
    infrastructure: calculateCategoryTotal(costs.infrastructure),
    marketing: calculateCategoryTotal(costs.marketing),
    facilities: calculateCategoryTotal(costs.facilities),
    equipment: calculateCategoryTotal(costs.equipment),
    insurance: calculateCategoryTotal(costs.insurance),
    professional: calculateCategoryTotal(costs.professional),
  };
}
