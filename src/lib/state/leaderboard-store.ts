/**
 * Leaderboard Store
 *
 * Competitive rankings showing how companies compare on key startup metrics:
 * - Time to Market (days to launch)
 * - Revenue Velocity (£ revenue / days since founding)
 * - Capital Efficiency (£ revenue / £ spent)
 * - Team Efficiency (£ revenue / team member)
 */

import { create } from 'zustand';

export type LeaderboardMetric = 'time-to-market' | 'revenue-velocity' | 'capital-efficiency' | 'team-efficiency';

export interface CompanyMetrics {
  id: string;
  workspaceId: string;
  companyName: string;
  industry: string;
  foundedDate: string; // ISO date when company was founded
  launchDate: string | null; // ISO date when product launched (null if not launched)
  monthlyRevenue: number; // Current monthly revenue in £
  totalSpend: number; // Total capital spent in £
  teamSize: number; // Total team members (founders + executives + apprentices)

  // Calculated metrics
  daysToLaunch: number | null; // Days from founding to launch (null if not launched)
  revenueVelocity: number; // Revenue per day since founding
  capitalEfficiency: number; // Revenue / Spend ratio
  teamEfficiency: number; // Revenue per team member
}

export interface LeaderboardEntry {
  rank: number;
  company: CompanyMetrics;
  score: number;
  change: number; // Position change from last week (positive = moved up)
}

interface LeaderboardState {
  companies: CompanyMetrics[];

  // Getters
  getLeaderboard: (metric: LeaderboardMetric) => LeaderboardEntry[];
  getCompanyRank: (workspaceId: string, metric: LeaderboardMetric) => number | null;
  getCompanyMetrics: (workspaceId: string) => CompanyMetrics | undefined;

  // Actions
  updateCompanyMetrics: (metrics: CompanyMetrics) => void;
  seedDemoData: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  companies: [],

  getLeaderboard: (metric: LeaderboardMetric) => {
    const companies = get().companies;

    // Sort by selected metric
    const sorted = [...companies].sort((a, b) => {
      switch (metric) {
        case 'time-to-market':
          // Lower is better (fewer days to launch)
          if (a.daysToLaunch === null) return 1;
          if (b.daysToLaunch === null) return -1;
          return a.daysToLaunch - b.daysToLaunch;

        case 'revenue-velocity':
          // Higher is better
          return b.revenueVelocity - a.revenueVelocity;

        case 'capital-efficiency':
          // Higher is better
          return b.capitalEfficiency - a.capitalEfficiency;

        case 'team-efficiency':
          // Higher is better
          return b.teamEfficiency - a.teamEfficiency;

        default:
          return 0;
      }
    });

    // Convert to leaderboard entries with ranks
    return sorted.map((company, index) => ({
      rank: index + 1,
      company,
      score: getMetricValue(company, metric),
      change: 0, // TODO: Calculate from historical data
    }));
  },

  getCompanyRank: (workspaceId: string, metric: LeaderboardMetric) => {
    const leaderboard = get().getLeaderboard(metric);
    const entry = leaderboard.find(e => e.company.workspaceId === workspaceId);
    return entry?.rank || null;
  },

  getCompanyMetrics: (workspaceId: string) => {
    return get().companies.find(c => c.workspaceId === workspaceId);
  },

  updateCompanyMetrics: (metrics: CompanyMetrics) => {
    set((state) => {
      const existing = state.companies.find(c => c.workspaceId === metrics.workspaceId);

      if (existing) {
        return {
          companies: state.companies.map(c =>
            c.workspaceId === metrics.workspaceId ? metrics : c
          ),
        };
      } else {
        return {
          companies: [...state.companies, metrics],
        };
      }
    });
  },

  seedDemoData: () => {
    const demoCompanies: CompanyMetrics[] = [
      {
        id: 'company-1',
        workspaceId: 'workspace-demo-company',
        companyName: 'TechForge Hardware',
        industry: 'Hardware',
        foundedDate: '2025-06-01',
        launchDate: '2025-09-15',
        monthlyRevenue: 45000,
        totalSpend: 120000,
        teamSize: 7,
        daysToLaunch: 106, // ~3.5 months
        revenueVelocity: 196, // 45000 / 230 days
        capitalEfficiency: 0.375, // 45000 / 120000
        teamEfficiency: 6428, // 45000 / 7
      },
      {
        id: 'company-2',
        workspaceId: 'workspace-2',
        companyName: 'RapidLaunch',
        industry: 'SaaS',
        foundedDate: '2025-07-01',
        launchDate: '2025-08-01',
        monthlyRevenue: 28000,
        totalSpend: 45000,
        teamSize: 4,
        daysToLaunch: 31, // 1 month - FASTEST
        revenueVelocity: 143,
        capitalEfficiency: 0.622, // MOST EFFICIENT
        teamEfficiency: 7000,
      },
      {
        id: 'company-3',
        workspaceId: 'workspace-3',
        companyName: 'GrowthMax',
        industry: 'E-commerce',
        foundedDate: '2025-01-15',
        launchDate: '2025-06-01',
        monthlyRevenue: 125000,
        totalSpend: 350000,
        teamSize: 12,
        daysToLaunch: 137,
        revenueVelocity: 543, // HIGHEST REVENUE VELOCITY
        capitalEfficiency: 0.357,
        teamEfficiency: 10416, // HIGHEST TEAM EFFICIENCY
      },
      {
        id: 'company-4',
        workspaceId: 'workspace-4',
        companyName: 'SlowBurn Co',
        industry: 'Manufacturing',
        foundedDate: '2024-09-01',
        launchDate: '2025-11-01',
        monthlyRevenue: 65000,
        totalSpend: 500000,
        teamSize: 15,
        daysToLaunch: 426, // 14 months - slowest
        revenueVelocity: 143,
        capitalEfficiency: 0.13, // Least efficient
        teamEfficiency: 4333,
      },
      {
        id: 'company-5',
        workspaceId: 'workspace-5',
        companyName: 'AgileStartup',
        industry: 'SaaS',
        foundedDate: '2025-08-01',
        launchDate: '2025-10-15',
        monthlyRevenue: 38000,
        totalSpend: 65000,
        teamSize: 5,
        daysToLaunch: 75,
        revenueVelocity: 273,
        capitalEfficiency: 0.584,
        teamEfficiency: 7600,
      },
      {
        id: 'company-6',
        workspaceId: 'workspace-6',
        companyName: 'BootstrapHQ',
        industry: 'Services',
        foundedDate: '2025-05-01',
        launchDate: '2025-07-01',
        monthlyRevenue: 52000,
        totalSpend: 95000,
        teamSize: 6,
        daysToLaunch: 61,
        revenueVelocity: 217,
        capitalEfficiency: 0.547,
        teamEfficiency: 8666,
      },
      {
        id: 'company-7',
        workspaceId: 'workspace-7',
        companyName: 'FastTrack Tech',
        industry: 'Hardware',
        foundedDate: '2025-04-01',
        launchDate: '2025-08-15',
        monthlyRevenue: 71000,
        totalSpend: 180000,
        teamSize: 9,
        daysToLaunch: 136,
        revenueVelocity: 260,
        capitalEfficiency: 0.394,
        teamEfficiency: 7888,
      },
      {
        id: 'company-8',
        workspaceId: 'workspace-8',
        companyName: 'LeanMachine',
        industry: 'SaaS',
        foundedDate: '2025-09-01',
        launchDate: '2025-10-01',
        monthlyRevenue: 19000,
        totalSpend: 28000,
        teamSize: 3,
        daysToLaunch: 30,
        revenueVelocity: 140,
        capitalEfficiency: 0.678, // Second most efficient
        teamEfficiency: 6333,
      },
    ];

    set({ companies: demoCompanies });
  },
}));

// Helper function to get metric value for display
function getMetricValue(company: CompanyMetrics, metric: LeaderboardMetric): number {
  switch (metric) {
    case 'time-to-market':
      return company.daysToLaunch || 9999;
    case 'revenue-velocity':
      return company.revenueVelocity;
    case 'capital-efficiency':
      return company.capitalEfficiency;
    case 'team-efficiency':
      return company.teamEfficiency;
    default:
      return 0;
  }
}

// Seed demo data on initialization
useLeaderboardStore.getState().seedDemoData();
