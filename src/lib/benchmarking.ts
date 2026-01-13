/**
 * Benchmarking Data
 * Industry comparisons and best practices
 */

export interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  unit: string;
  category: 'Financial' | 'Operational' | 'Team' | 'Product' | 'Sales' | 'Marketing';
  betterWhenHigher: boolean; // true if higher is better, false if lower is better
}

export interface IndustryInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  source: string;
}

export interface ComparisonGroup {
  id: string;
  name: string;
  description: string;
  companyCount: number;
  averageRevenue: string;
  averageTeamSize: number;
}

// Benchmark data by category
export const BENCHMARK_DATA: BenchmarkData[] = [
  // Financial
  {
    metric: 'Monthly Burn Rate',
    yourValue: 35000,
    industryAverage: 42000,
    topQuartile: 30000,
    bottomQuartile: 55000,
    unit: '$',
    category: 'Financial',
    betterWhenHigher: false,
  },
  {
    metric: 'CAC Payback Period',
    yourValue: 8,
    industryAverage: 12,
    topQuartile: 6,
    bottomQuartile: 18,
    unit: 'months',
    category: 'Financial',
    betterWhenHigher: false,
  },
  {
    metric: 'Gross Margin',
    yourValue: 75,
    industryAverage: 70,
    topQuartile: 80,
    bottomQuartile: 60,
    unit: '%',
    category: 'Financial',
    betterWhenHigher: true,
  },
  {
    metric: 'Revenue Growth Rate',
    yourValue: 15,
    industryAverage: 12,
    topQuartile: 20,
    bottomQuartile: 8,
    unit: '%/month',
    category: 'Financial',
    betterWhenHigher: true,
  },
  // Operational
  {
    metric: 'Task Completion Rate',
    yourValue: 87,
    industryAverage: 82,
    topQuartile: 90,
    bottomQuartile: 75,
    unit: '%',
    category: 'Operational',
    betterWhenHigher: true,
  },
  {
    metric: 'Average Cycle Time',
    yourValue: 3.2,
    industryAverage: 4.5,
    topQuartile: 2.5,
    bottomQuartile: 6.0,
    unit: 'days',
    category: 'Operational',
    betterWhenHigher: false,
  },
  {
    metric: 'OKR Completion Rate',
    yourValue: 68,
    industryAverage: 65,
    topQuartile: 75,
    bottomQuartile: 55,
    unit: '%',
    category: 'Operational',
    betterWhenHigher: true,
  },
  // Team
  {
    metric: 'Team Velocity',
    yourValue: 21,
    industryAverage: 18,
    topQuartile: 25,
    bottomQuartile: 12,
    unit: 'tasks/week',
    category: 'Team',
    betterWhenHigher: true,
  },
  {
    metric: 'Employee Retention',
    yourValue: 95,
    industryAverage: 88,
    topQuartile: 95,
    bottomQuartile: 80,
    unit: '%',
    category: 'Team',
    betterWhenHigher: true,
  },
  {
    metric: 'Time to Hire',
    yourValue: 21,
    industryAverage: 28,
    topQuartile: 18,
    bottomQuartile: 35,
    unit: 'days',
    category: 'Team',
    betterWhenHigher: false,
  },
  // Product
  {
    metric: 'User Engagement Score',
    yourValue: 72,
    industryAverage: 65,
    topQuartile: 80,
    bottomQuartile: 50,
    unit: '%',
    category: 'Product',
    betterWhenHigher: true,
  },
  {
    metric: 'Feature Adoption Rate',
    yourValue: 45,
    industryAverage: 40,
    topQuartile: 55,
    bottomQuartile: 30,
    unit: '%',
    category: 'Product',
    betterWhenHigher: true,
  },
  {
    metric: 'Net Promoter Score',
    yourValue: 45,
    industryAverage: 35,
    topQuartile: 50,
    bottomQuartile: 20,
    unit: 'score',
    category: 'Product',
    betterWhenHigher: true,
  },
  // Sales
  {
    metric: 'Sales Cycle Length',
    yourValue: 30,
    industryAverage: 45,
    topQuartile: 25,
    bottomQuartile: 60,
    unit: 'days',
    category: 'Sales',
    betterWhenHigher: false,
  },
  {
    metric: 'Win Rate',
    yourValue: 28,
    industryAverage: 25,
    topQuartile: 35,
    bottomQuartile: 18,
    unit: '%',
    category: 'Sales',
    betterWhenHigher: true,
  },
  {
    metric: 'Average Deal Size',
    yourValue: 12000,
    industryAverage: 10000,
    topQuartile: 15000,
    bottomQuartile: 7000,
    unit: '$',
    category: 'Sales',
    betterWhenHigher: true,
  },
  // Marketing
  {
    metric: 'Lead Conversion Rate',
    yourValue: 18,
    industryAverage: 15,
    topQuartile: 22,
    bottomQuartile: 10,
    unit: '%',
    category: 'Marketing',
    betterWhenHigher: true,
  },
  {
    metric: 'Cost Per Lead',
    yourValue: 45,
    industryAverage: 55,
    topQuartile: 35,
    bottomQuartile: 75,
    unit: '$',
    category: 'Marketing',
    betterWhenHigher: false,
  },
  {
    metric: 'Website Conversion Rate',
    yourValue: 3.2,
    industryAverage: 2.8,
    topQuartile: 4.0,
    bottomQuartile: 2.0,
    unit: '%',
    category: 'Marketing',
    betterWhenHigher: true,
  },
];

// Industry insights and best practices
export const INDUSTRY_INSIGHTS: IndustryInsight[] = [
  {
    id: 'ins1',
    title: 'Burn Rate Optimization',
    description:
      'Your burn rate is 17% lower than industry average. Top performers maintain burn rates 30% below market by prioritizing high-ROI initiatives.',
    impact: 'high',
    category: 'Financial',
    recommendation:
      'Continue optimizing spend. Consider reallocating savings to high-growth areas like product development or sales.',
    source: 'SaaS Benchmarks 2026',
  },
  {
    id: 'ins2',
    title: 'Team Velocity Above Average',
    description:
      'Your team completes 21 tasks per week vs. industry average of 18. This suggests strong execution culture and effective project management.',
    impact: 'high',
    category: 'Team',
    recommendation:
      'Document your processes and consider scaling the team while maintaining velocity. Focus on knowledge sharing.',
    source: 'Startup Productivity Report 2026',
  },
  {
    id: 'ins3',
    title: 'Sales Cycle Efficiency',
    description:
      'Your 30-day sales cycle is 33% faster than industry average. Top quartile companies achieve 25-day cycles through automated demos and streamlined onboarding.',
    impact: 'medium',
    category: 'Sales',
    recommendation:
      'Implement product-led growth tactics and self-serve demos to reduce cycle time further.',
    source: 'B2B Sales Benchmark 2026',
  },
  {
    id: 'ins4',
    title: 'NPS in Top 25%',
    description:
      'Your NPS of 45 places you in the top 25% of hardware startups. Companies with 50+ NPS see 2x referral rates.',
    impact: 'high',
    category: 'Product',
    recommendation:
      'Launch formal referral program to capitalize on promoters. Target 50+ NPS through proactive customer success.',
    source: 'Product Excellence Report 2026',
  },
  {
    id: 'ins5',
    title: 'Opportunity: Improve Lead Conversion',
    description:
      'Your 18% lead conversion rate is above average but below top quartile (22%). Small improvements here have outsized revenue impact.',
    impact: 'high',
    category: 'Marketing',
    recommendation:
      'A/B test landing pages, implement lead scoring, and improve nurture sequences. Target 20%+ conversion rate.',
    source: 'Marketing Performance Study 2026',
  },
  {
    id: 'ins6',
    title: 'Employee Retention Excellence',
    description:
      '95% retention rate matches top quartile. This saves $50K+ per avoided replacement and maintains team productivity.',
    impact: 'high',
    category: 'Team',
    recommendation:
      'Document retention best practices. Consider sharing culture playbook publicly as recruiting advantage.',
    source: 'Talent Benchmark Report 2026',
  },
];

// Comparison groups
export const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    id: 'hardware-startups',
    name: 'Hardware Startups (Seed-Series A)',
    description: 'Pre-revenue to $5M ARR, 5-25 employees',
    companyCount: 142,
    averageRevenue: '$2.3M ARR',
    averageTeamSize: 12,
  },
  {
    id: 'b2b-saas',
    name: 'B2B SaaS (Early Stage)',
    description: 'Seed to Series A, $1M-$10M ARR',
    companyCount: 856,
    averageRevenue: '$4.1M ARR',
    averageTeamSize: 18,
  },
  {
    id: 'lean-startups',
    name: 'Lean Startups (All Sectors)',
    description: '5-20 employees, focus on efficiency',
    companyCount: 1240,
    averageRevenue: '$1.8M ARR',
    averageTeamSize: 10,
  },
];

// Utility functions
export const calculatePerformanceScore = (benchmark: BenchmarkData): number => {
  const { yourValue, industryAverage, topQuartile, bottomQuartile, betterWhenHigher } = benchmark;

  let position: number;

  if (betterWhenHigher) {
    // Higher is better (e.g., revenue, velocity)
    if (yourValue >= topQuartile) position = 100;
    else if (yourValue >= industryAverage)
      position = 75 + ((yourValue - industryAverage) / (topQuartile - industryAverage)) * 25;
    else if (yourValue >= bottomQuartile)
      position = 50 + ((yourValue - bottomQuartile) / (industryAverage - bottomQuartile)) * 25;
    else position = (yourValue / bottomQuartile) * 50;
  } else {
    // Lower is better (e.g., burn rate, CAC)
    if (yourValue <= topQuartile) position = 100;
    else if (yourValue <= industryAverage)
      position = 75 + ((industryAverage - yourValue) / (industryAverage - topQuartile)) * 25;
    else if (yourValue <= bottomQuartile)
      position = 50 + ((bottomQuartile - yourValue) / (bottomQuartile - industryAverage)) * 25;
    else position = 50 - ((yourValue - bottomQuartile) / bottomQuartile) * 50;
  }

  return Math.round(Math.max(0, Math.min(100, position)));
};

export const getPerformanceLevel = (
  score: number
): { level: string; color: string; description: string } => {
  if (score >= 90)
    return {
      level: 'Exceptional',
      color: '#10b981',
      description: 'Top 10% performance',
    };
  if (score >= 75)
    return {
      level: 'Strong',
      color: '#3b82f6',
      description: 'Top 25% performance',
    };
  if (score >= 50)
    return {
      level: 'Average',
      color: '#f59e0b',
      description: 'Industry average',
    };
  return {
    level: 'Below Average',
    color: '#ef4444',
    description: 'Needs improvement',
  };
};

export const getBenchmarksByCategory = (
  category: BenchmarkData['category']
): BenchmarkData[] => {
  return BENCHMARK_DATA.filter((b) => b.category === category);
};

export const getOverallScore = (): number => {
  const scores = BENCHMARK_DATA.map((b) => calculatePerformanceScore(b));
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
};
