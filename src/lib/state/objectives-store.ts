/**
 * Business Objectives Store
 * Manages strategic objectives and their progress tracking
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ObjectiveMilestone {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface ObjectiveMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface BusinessObjective {
  id: string;
  title: string;
  description: string;
  period: string; // e.g., "Q1 2026", "H1 2026"
  category: 'growth' | 'product' | 'operations' | 'financial' | 'team';
  progress: number; // 0-100
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  metrics: ObjectiveMetric[];
  milestones: ObjectiveMilestone[];
  linkedTaskIds: string[];
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

interface ObjectivesState {
  objectives: BusinessObjective[];
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  reset: () => Promise<void>;
  addObjective: (objective: Omit<BusinessObjective, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateObjective: (id: string, updates: Partial<BusinessObjective>) => void;
  updateProgress: (id: string, progress: number) => void;
  updateMetric: (objectiveId: string, metricId: string, currentValue: number) => void;
  completeMilestone: (objectiveId: string, milestoneId: string) => void;
  linkTask: (objectiveId: string, taskId: string) => void;
  unlinkTask: (objectiveId: string, taskId: string) => void;
  removeObjective: (id: string) => void;

  // Queries
  getObjectivesByPeriod: (period: string) => BusinessObjective[];
  getActiveObjectives: () => BusinessObjective[];
  getObjectivesByStatus: (status: BusinessObjective['status']) => BusinessObjective[];
}

const STORAGE_KEY = 'objectives-store';

// Sample objectives for demo
const sampleObjectives: BusinessObjective[] = [
  {
    id: 'obj-1',
    title: 'Launch MVP to First 100 Customers',
    description: 'Complete core product features and onboard initial customer base to validate product-market fit.',
    period: 'Q1 2026',
    category: 'product',
    progress: 65,
    status: 'on-track',
    metrics: [
      { id: 'm1', name: 'Customers Onboarded', currentValue: 47, targetValue: 100, unit: 'users', trend: 'up' },
      { id: 'm2', name: 'Feature Completion', currentValue: 8, targetValue: 12, unit: 'features', trend: 'up' },
      { id: 'm3', name: 'NPS Score', currentValue: 42, targetValue: 50, unit: 'score', trend: 'stable' },
    ],
    milestones: [
      { id: 'ms1', title: 'Core Features Complete', completed: true, completedAt: '2026-01-10' },
      { id: 'ms2', title: 'Beta Launch', completed: true, completedAt: '2026-01-15' },
      { id: 'ms3', title: '50 Users Milestone', dueDate: '2026-01-31', completed: false },
      { id: 'ms4', title: '100 Users Milestone', dueDate: '2026-02-28', completed: false },
    ],
    linkedTaskIds: ['task-1', 'task-2'],
    owner: 'Product Team',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'obj-2',
    title: 'Achieve £50K MRR',
    description: 'Drive revenue growth through customer acquisition and expansion to reach sustainable monthly revenue.',
    period: 'Q1 2026',
    category: 'financial',
    progress: 34,
    status: 'at-risk',
    metrics: [
      { id: 'm1', name: 'MRR', currentValue: 17000, targetValue: 50000, unit: '£', trend: 'up' },
      { id: 'm2', name: 'ARPU', currentValue: 340, targetValue: 400, unit: '£', trend: 'stable' },
      { id: 'm3', name: 'Churn Rate', currentValue: 5.2, targetValue: 3, unit: '%', trend: 'down' },
    ],
    milestones: [
      { id: 'ms1', title: '£20K MRR', dueDate: '2026-01-15', completed: false },
      { id: 'ms2', title: '£35K MRR', dueDate: '2026-02-15', completed: false },
      { id: 'ms3', title: '£50K MRR', dueDate: '2026-03-31', completed: false },
    ],
    linkedTaskIds: ['task-3'],
    owner: 'Sales Team',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'obj-3',
    title: 'Build World-Class Team',
    description: 'Recruit key hires and establish strong team culture and processes for scale.',
    period: 'Q1 2026',
    category: 'team',
    progress: 50,
    status: 'on-track',
    metrics: [
      { id: 'm1', name: 'Team Size', currentValue: 4, targetValue: 8, unit: 'people', trend: 'up' },
      { id: 'm2', name: 'Retention', currentValue: 100, targetValue: 95, unit: '%', trend: 'stable' },
    ],
    milestones: [
      { id: 'ms1', title: 'Hire Engineering Lead', completed: true, completedAt: '2026-01-05' },
      { id: 'ms2', title: 'Hire Marketing Manager', dueDate: '2026-02-01', completed: false },
      { id: 'ms3', title: 'Complete Team Onboarding', dueDate: '2026-02-15', completed: false },
    ],
    linkedTaskIds: [],
    owner: 'Founder',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'obj-4',
    title: 'Establish Market Presence',
    description: 'Build brand awareness and establish thought leadership in target market.',
    period: 'Q1 2026',
    category: 'growth',
    progress: 25,
    status: 'behind',
    metrics: [
      { id: 'm1', name: 'Website Traffic', currentValue: 5000, targetValue: 20000, unit: 'visits/mo', trend: 'up' },
      { id: 'm2', name: 'Social Followers', currentValue: 1200, targetValue: 5000, unit: 'followers', trend: 'up' },
      { id: 'm3', name: 'Press Mentions', currentValue: 2, targetValue: 10, unit: 'articles', trend: 'stable' },
    ],
    milestones: [
      { id: 'ms1', title: 'Launch Blog', dueDate: '2026-01-20', completed: false },
      { id: 'ms2', title: 'First PR Campaign', dueDate: '2026-02-01', completed: false },
      { id: 'ms3', title: 'Conference Speaking', dueDate: '2026-03-15', completed: false },
    ],
    linkedTaskIds: [],
    owner: 'Marketing',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-16T00:00:00Z',
  },
];

export const useObjectivesStore = create<ObjectivesState>((set, get) => ({
  objectives: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ objectives: parsed, initialized: true });
      } else {
        // CHANGED: Start with empty array instead of seeding sample data
        set({ objectives: [], initialized: true });
      }
    } catch (error) {
      console.error('[ObjectivesStore] Failed to initialize:', error);
      // CHANGED: Start with empty array instead of seeding sample data
      set({ objectives: [], initialized: true });
    }
  },

  reset: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ objectives: [], initialized: false });
      console.log('[ObjectivesStore] Reset complete');
    } catch (error) {
      console.error('[ObjectivesStore] Failed to reset:', error);
    }
  },

  addObjective: (objective) => {
    const now = new Date().toISOString();
    const newObjective: BusinessObjective = {
      ...objective,
      id: `obj-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const updated = [...state.objectives, newObjective];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  updateObjective: (id, updates) => {
    set((state) => {
      const updated = state.objectives.map((obj) =>
        obj.id === id
          ? { ...obj, ...updates, updatedAt: new Date().toISOString() }
          : obj
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  updateProgress: (id, progress) => {
    set((state) => {
      const updated = state.objectives.map((obj) => {
        if (obj.id !== id) return obj;

        // Auto-determine status based on progress and time
        let status: BusinessObjective['status'] = 'on-track';
        if (progress >= 100) {
          status = 'completed';
        } else if (progress < 30) {
          status = 'behind';
        } else if (progress < 60) {
          status = 'at-risk';
        }

        return {
          ...obj,
          progress,
          status,
          updatedAt: new Date().toISOString(),
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  updateMetric: (objectiveId, metricId, currentValue) => {
    set((state) => {
      const updated = state.objectives.map((obj) => {
        if (obj.id !== objectiveId) return obj;

        const updatedMetrics = obj.metrics.map((m) =>
          m.id === metricId
            ? {
                ...m,
                currentValue,
                trend: currentValue > m.currentValue ? 'up' : currentValue < m.currentValue ? 'down' : 'stable',
              } as ObjectiveMetric
            : m
        );

        return {
          ...obj,
          metrics: updatedMetrics,
          updatedAt: new Date().toISOString(),
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  completeMilestone: (objectiveId, milestoneId) => {
    set((state) => {
      const updated = state.objectives.map((obj) => {
        if (obj.id !== objectiveId) return obj;

        const updatedMilestones = obj.milestones.map((ms) =>
          ms.id === milestoneId
            ? { ...ms, completed: true, completedAt: new Date().toISOString() }
            : ms
        );

        // Recalculate progress based on milestones
        const completedCount = updatedMilestones.filter((ms) => ms.completed).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);

        return {
          ...obj,
          milestones: updatedMilestones,
          progress: newProgress,
          updatedAt: new Date().toISOString(),
        };
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  linkTask: (objectiveId, taskId) => {
    set((state) => {
      const updated = state.objectives.map((obj) =>
        obj.id === objectiveId && !obj.linkedTaskIds.includes(taskId)
          ? {
              ...obj,
              linkedTaskIds: [...obj.linkedTaskIds, taskId],
              updatedAt: new Date().toISOString(),
            }
          : obj
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  unlinkTask: (objectiveId, taskId) => {
    set((state) => {
      const updated = state.objectives.map((obj) =>
        obj.id === objectiveId
          ? {
              ...obj,
              linkedTaskIds: obj.linkedTaskIds.filter((id) => id !== taskId),
              updatedAt: new Date().toISOString(),
            }
          : obj
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  removeObjective: (id) => {
    set((state) => {
      const updated = state.objectives.filter((obj) => obj.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { objectives: updated };
    });
  },

  getObjectivesByPeriod: (period) => {
    return get().objectives.filter((obj) => obj.period === period);
  },

  getActiveObjectives: () => {
    return get().objectives.filter((obj) => obj.status !== 'completed');
  },

  getObjectivesByStatus: (status) => {
    return get().objectives.filter((obj) => obj.status === status);
  },
}));
