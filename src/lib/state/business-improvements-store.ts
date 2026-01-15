// Business Improvements Store - Caches consulting insights from reports
// Syncs with reports dashboard to surface actionable recommendations on Home tab

import { create } from 'zustand';

export type ConsultingFirm =
  | 'McKinsey'
  | 'BCG'
  | 'Bain'
  | 'Deloitte'
  | 'Accenture'
  | 'EY'
  | 'PwC'
  | 'KPMG'
  | 'Oliver Wyman'
  | 'Mercer';

export type InsightCategory =
  | 'strategy'
  | 'operations'
  | 'finance'
  | 'talent'
  | 'process'
  | 'overview';

export interface BusinessImprovement {
  id: string;
  category: InsightCategory;
  firm: ConsultingFirm;
  priority: 1 | 2 | 3; // 1 = critical, 2 = important, 3 = nice to have
  title: string;
  rationale: string;
  expectedImpact: string;
  impactMetrics?: {
    runway?: number; // months
    revenue?: number; // £k
    burn?: number; // £k saved
    productivity?: number; // % improvement
  };
  owner: string;
  timeline: string;
  estimatedEffort?: string;
  convertedToTask: boolean;
  createdAt: string;
}

interface BusinessImprovementsStore {
  improvements: BusinessImprovement[];
  lastGeneratedAt: string | null;

  // Actions
  setImprovements: (improvements: BusinessImprovement[]) => void;
  markAsConverted: (id: string) => void;
  clearImprovements: () => void;
  getImprovementsByPriority: (priority: 1 | 2 | 3) => BusinessImprovement[];
  getImprovementsByCategory: (category: InsightCategory) => BusinessImprovement[];
  getUnconvertedImprovements: () => BusinessImprovement[];
}

export const useBusinessImprovementsStore = create<BusinessImprovementsStore>((set, get) => ({
  improvements: [],
  lastGeneratedAt: null,

  setImprovements: (improvements: BusinessImprovement[]) => {
    set({
      improvements,
      lastGeneratedAt: new Date().toISOString()
    });
  },

  markAsConverted: (id: string) => {
    set((state) => ({
      improvements: state.improvements.map(imp =>
        imp.id === id ? { ...imp, convertedToTask: true } : imp
      )
    }));
  },

  clearImprovements: () => {
    set({ improvements: [], lastGeneratedAt: null });
  },

  getImprovementsByPriority: (priority: 1 | 2 | 3) => {
    return get().improvements.filter(imp => imp.priority === priority);
  },

  getImprovementsByCategory: (category: InsightCategory) => {
    return get().improvements.filter(imp => imp.category === category);
  },

  getUnconvertedImprovements: () => {
    return get().improvements.filter(imp => !imp.convertedToTask);
  },
}));
