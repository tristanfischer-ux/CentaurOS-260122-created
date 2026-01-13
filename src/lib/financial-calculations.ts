/**
 * Centralized Financial Calculations
 * Single source of truth for all financial metrics across the app
 */

// Cost item interface
export interface CostItem {
  id: string;
  name: string;
  amount: number;
  enabled: boolean;
  details?: string;
  editable: boolean;
}

// Centralized financial data - SINGLE SOURCE OF TRUTH
export const FINANCIAL_DATA = {
  cashPosition: 1207000,
  monthlyRevenue: 312000,

  costs: {
    team: [
      { id: 't1', name: 'Fractional Executives (5)', amount: 35000, enabled: true, details: '£7K each/month', editable: true },
      { id: 't2', name: 'Apprentices (8)', amount: 16000, enabled: true, details: '£2K each/month', editable: true },
      { id: 't3', name: 'Founder Salary', amount: 1000, enabled: true, details: 'Minimal draw', editable: true },
    ],
    manufacturing: [
      { id: 'm1', name: 'TechFab Manufacturing', amount: 12000, enabled: true, details: 'Primary manufacturer', editable: true },
      { id: 'm2', name: 'UK Electronics Supply', amount: 4500, enabled: true, details: 'Component supplier', editable: true },
      { id: 'm3', name: 'GlobalShip Fulfillment', amount: 1500, enabled: true, details: 'Shipping & logistics', editable: true },
    ],
    aiTools: [
      { id: 'ai1', name: 'OpenAI API', amount: 1200, enabled: true, details: '~40K requests/month', editable: true },
      { id: 'ai2', name: 'Anthropic Claude', amount: 800, enabled: true, details: '~25K requests/month', editable: true },
      { id: 'ai3', name: 'Midjourney Pro', amount: 600, enabled: true, details: 'Unlimited generations', editable: true },
      { id: 'ai4', name: 'ElevenLabs', amount: 400, enabled: true, details: '500K characters/month', editable: true },
    ],
    infrastructure: [
      { id: 'i1', name: 'AWS Cloud Hosting', amount: 3200, enabled: true, details: 'Production + staging', editable: true },
      { id: 'i2', name: 'Software Licenses', amount: 1200, enabled: true, details: 'Figma, Linear, Notion, etc.', editable: true },
      { id: 'i3', name: 'Domain & SSL', amount: 450, enabled: true, details: 'Annual costs amortized', editable: true },
    ],
    marketing: [
      { id: 'mk1', name: 'Google Ads', amount: 1500, enabled: true, details: 'Paid search campaigns', editable: true },
      { id: 'mk2', name: 'LinkedIn Ads', amount: 800, enabled: true, details: 'B2B lead generation', editable: true },
      { id: 'mk3', name: 'Content Marketing', amount: 600, enabled: true, details: 'Blog, SEO, copywriting', editable: true },
    ],
    facilities: [
      { id: 'f1', name: 'Co-working Space', amount: 2500, enabled: true, details: '10 desks @ £250/desk', editable: true },
      { id: 'f2', name: 'Utilities', amount: 200, enabled: true, details: 'Internet, phone, etc.', editable: true },
    ],
    equipment: [
      { id: 'e1', name: 'Equipment Leases', amount: 400, enabled: true, details: 'Laptops, monitors (leased)', editable: true },
    ],
    insurance: [
      { id: 'in1', name: 'Business Insurance', amount: 600, enabled: true, details: 'General liability, cyber', editable: true },
      { id: 'in2', name: 'Product Liability', amount: 500, enabled: true, details: 'Hardware product coverage', editable: true },
    ],
    professional: [
      { id: 'p1', name: 'Legal Retainer', amount: 1800, enabled: true, details: 'Corporate counsel', editable: true },
      { id: 'p2', name: 'Accounting & Tax', amount: 1200, enabled: true, details: 'Bookkeeping, CFO services', editable: true },
    ],
  },
};

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
 */
export function calculateRunway(
  cashPosition: number = FINANCIAL_DATA.cashPosition,
  costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs
): number {
  const monthlyBurn = calculateMonthlyBurn(costs);
  const runway = cashPosition / monthlyBurn;
  return Math.round(runway * 10) / 10; // Round to 1 decimal place
}

/**
 * Get all financial metrics
 */
export function getFinancialMetrics(costs: typeof FINANCIAL_DATA.costs = FINANCIAL_DATA.costs) {
  const monthlyBurn = calculateMonthlyBurn(costs);
  const runway = calculateRunway(FINANCIAL_DATA.cashPosition, costs);
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
