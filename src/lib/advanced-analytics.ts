/**
 * Advanced Analytics Data & Metrics
 * Custom dashboards, KPI tracking, and deep insights
 */

export interface KPI {
  id: string;
  name: string;
  category: 'Financial' | 'Operational' | 'Team' | 'Product' | 'Marketing' | 'Sales';
  value: number;
  unit: string;
  target?: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated: Date;
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi-card' | 'chart' | 'table' | 'metric' | 'progress' | 'list';
  title: string;
  dataSource: string; // KPI ID or data query
  size: 'small' | 'medium' | 'large' | 'full-width';
  config: WidgetConfig;
  position: { row: number; col: number };
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'gauge';
  timeRange?: '7d' | '30d' | '90d' | '1y';
  groupBy?: string;
  filters?: Record<string, any>;
  showTrend?: boolean;
  showTarget?: boolean;
  colorScheme?: string[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface FunnelStage {
  name: string;
  value: number;
  conversionRate?: number;
}

// KPI Categories and Definitions
export const KPI_DEFINITIONS: Record<string, KPI[]> = {
  Financial: [
    {
      id: 'revenue-mrr',
      name: 'Monthly Recurring Revenue',
      category: 'Financial',
      value: 45000,
      unit: '$',
      target: 50000,
      previousValue: 42000,
      trend: 'up',
      changePercentage: 7.1,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
    {
      id: 'burn-rate',
      name: 'Monthly Burn Rate',
      category: 'Financial',
      value: 35000,
      unit: '$',
      target: 30000,
      previousValue: 36000,
      trend: 'down',
      changePercentage: -2.8,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
    {
      id: 'runway',
      name: 'Runway',
      category: 'Financial',
      value: 18,
      unit: 'months',
      target: 24,
      previousValue: 17,
      trend: 'up',
      changePercentage: 5.9,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
    {
      id: 'cac',
      name: 'Customer Acquisition Cost',
      category: 'Financial',
      value: 850,
      unit: '$',
      target: 750,
      previousValue: 920,
      trend: 'down',
      changePercentage: -7.6,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
  ],
  Operational: [
    {
      id: 'task-completion',
      name: 'Task Completion Rate',
      category: 'Operational',
      value: 87,
      unit: '%',
      target: 90,
      previousValue: 83,
      trend: 'up',
      changePercentage: 4.8,
      timeframe: 'weekly',
      lastUpdated: new Date(),
    },
    {
      id: 'okr-progress',
      name: 'Average OKR Progress',
      category: 'Operational',
      value: 68,
      unit: '%',
      target: 75,
      previousValue: 65,
      trend: 'up',
      changePercentage: 4.6,
      timeframe: 'quarterly',
      lastUpdated: new Date(),
    },
    {
      id: 'cycle-time',
      name: 'Average Cycle Time',
      category: 'Operational',
      value: 3.2,
      unit: 'days',
      target: 2.5,
      previousValue: 3.5,
      trend: 'down',
      changePercentage: -8.6,
      timeframe: 'weekly',
      lastUpdated: new Date(),
    },
  ],
  Team: [
    {
      id: 'team-velocity',
      name: 'Team Velocity',
      category: 'Team',
      value: 21,
      unit: 'tasks/week',
      target: 25,
      previousValue: 19,
      trend: 'up',
      changePercentage: 10.5,
      timeframe: 'weekly',
      lastUpdated: new Date(),
    },
    {
      id: 'utilization',
      name: 'Team Utilization',
      category: 'Team',
      value: 82,
      unit: '%',
      target: 85,
      previousValue: 78,
      trend: 'up',
      changePercentage: 5.1,
      timeframe: 'weekly',
      lastUpdated: new Date(),
    },
    {
      id: 'retention',
      name: 'Employee Retention',
      category: 'Team',
      value: 95,
      unit: '%',
      target: 95,
      previousValue: 92,
      trend: 'up',
      changePercentage: 3.3,
      timeframe: 'quarterly',
      lastUpdated: new Date(),
    },
  ],
  Product: [
    {
      id: 'dau',
      name: 'Daily Active Users',
      category: 'Product',
      value: 1250,
      unit: 'users',
      target: 1500,
      previousValue: 1180,
      trend: 'up',
      changePercentage: 5.9,
      timeframe: 'daily',
      lastUpdated: new Date(),
    },
    {
      id: 'engagement',
      name: 'User Engagement Score',
      category: 'Product',
      value: 72,
      unit: '%',
      target: 80,
      previousValue: 68,
      trend: 'up',
      changePercentage: 5.9,
      timeframe: 'weekly',
      lastUpdated: new Date(),
    },
    {
      id: 'nps',
      name: 'Net Promoter Score',
      category: 'Product',
      value: 45,
      unit: 'score',
      target: 50,
      previousValue: 42,
      trend: 'up',
      changePercentage: 7.1,
      timeframe: 'quarterly',
      lastUpdated: new Date(),
    },
  ],
  Marketing: [
    {
      id: 'leads',
      name: 'Monthly Qualified Leads',
      category: 'Marketing',
      value: 320,
      unit: 'leads',
      target: 400,
      previousValue: 285,
      trend: 'up',
      changePercentage: 12.3,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
    {
      id: 'conversion-rate',
      name: 'Lead Conversion Rate',
      category: 'Marketing',
      value: 18,
      unit: '%',
      target: 20,
      previousValue: 16,
      trend: 'up',
      changePercentage: 12.5,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
  ],
  Sales: [
    {
      id: 'pipeline',
      name: 'Sales Pipeline Value',
      category: 'Sales',
      value: 250000,
      unit: '$',
      target: 300000,
      previousValue: 230000,
      trend: 'up',
      changePercentage: 8.7,
      timeframe: 'monthly',
      lastUpdated: new Date(),
    },
    {
      id: 'win-rate',
      name: 'Win Rate',
      category: 'Sales',
      value: 28,
      unit: '%',
      target: 30,
      previousValue: 25,
      trend: 'up',
      changePercentage: 12.0,
      timeframe: 'quarterly',
      lastUpdated: new Date(),
    },
  ],
};

// Generate time series data
export const generateTimeSeriesData = (
  kpiId: string,
  days: number = 30
): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const kpi = Object.values(KPI_DEFINITIONS)
    .flat()
    .find((k) => k.id === kpiId);

  if (!kpi) return [];

  const baseValue = kpi.value;
  const variance = baseValue * 0.15; // 15% variance

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const randomVariance = (Math.random() - 0.5) * variance;
    const trend = kpi.trend === 'up' ? i * 0.5 : kpi.trend === 'down' ? -i * 0.5 : 0;

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue + randomVariance + trend),
    });
  }

  return data;
};

// Generate funnel data
export const generateFunnelData = (): FunnelStage[] => {
  return [
    { name: 'Website Visitors', value: 10000, conversionRate: 100 },
    { name: 'Signups', value: 1500, conversionRate: 15 },
    { name: 'Active Users', value: 800, conversionRate: 53 },
    { name: 'Paying Customers', value: 250, conversionRate: 31 },
    { name: 'Promoters', value: 100, conversionRate: 40 },
  ];
};

// Default dashboard configurations
export const DEFAULT_DASHBOARDS: CustomDashboard[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level metrics for leadership team',
    widgets: [
      {
        id: 'w1',
        type: 'kpi-card',
        title: 'MRR',
        dataSource: 'revenue-mrr',
        size: 'small',
        config: { showTrend: true, showTarget: true },
        position: { row: 0, col: 0 },
      },
      {
        id: 'w2',
        type: 'kpi-card',
        title: 'Burn Rate',
        dataSource: 'burn-rate',
        size: 'small',
        config: { showTrend: true, showTarget: true },
        position: { row: 0, col: 1 },
      },
      {
        id: 'w3',
        type: 'kpi-card',
        title: 'Team Velocity',
        dataSource: 'team-velocity',
        size: 'small',
        config: { showTrend: true },
        position: { row: 0, col: 2 },
      },
      {
        id: 'w4',
        type: 'chart',
        title: 'Revenue Trend',
        dataSource: 'revenue-mrr',
        size: 'large',
        config: { chartType: 'line', timeRange: '90d', showTrend: true },
        position: { row: 1, col: 0 },
      },
      {
        id: 'w5',
        type: 'chart',
        title: 'OKR Progress',
        dataSource: 'okr-progress',
        size: 'medium',
        config: { chartType: 'gauge', showTarget: true },
        position: { row: 2, col: 0 },
      },
    ],
    layout: 'grid',
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'team-performance',
    name: 'Team Performance',
    description: 'Track team productivity and velocity',
    widgets: [
      {
        id: 'w6',
        type: 'kpi-card',
        title: 'Velocity',
        dataSource: 'team-velocity',
        size: 'small',
        config: { showTrend: true, showTarget: true },
        position: { row: 0, col: 0 },
      },
      {
        id: 'w7',
        type: 'kpi-card',
        title: 'Utilization',
        dataSource: 'utilization',
        size: 'small',
        config: { showTrend: true, showTarget: true },
        position: { row: 0, col: 1 },
      },
      {
        id: 'w8',
        type: 'chart',
        title: 'Task Completion Trend',
        dataSource: 'task-completion',
        size: 'full-width',
        config: { chartType: 'area', timeRange: '30d' },
        position: { row: 1, col: 0 },
      },
    ],
    layout: 'grid',
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Utility functions
export const getAllKPIs = (): KPI[] => {
  return Object.values(KPI_DEFINITIONS).flat();
};

export const getKPIsByCategory = (category: KPI['category']): KPI[] => {
  return KPI_DEFINITIONS[category] || [];
};

export const getKPIById = (id: string): KPI | undefined => {
  return getAllKPIs().find((kpi) => kpi.id === id);
};

export const calculateKPIHealth = (kpi: KPI): 'healthy' | 'warning' | 'critical' => {
  if (!kpi.target) return 'healthy';

  const percentage = (kpi.value / kpi.target) * 100;

  if (percentage >= 90) return 'healthy';
  if (percentage >= 70) return 'warning';
  return 'critical';
};
