/**
 * Decisions Store
 * Manages urgent decisions that require founder/leadership attention
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UrgencyLevel = 'critical' | 'high' | 'normal';

export interface Decision {
  id: string;
  title: string;
  question: string;
  context: string;
  category: 'hiring' | 'budget' | 'strategy' | 'operations' | 'product' | 'legal';
  urgency: UrgencyLevel;
  deadline?: string; // ISO date string
  requiredDecisionMaker: 'founder' | 'executive' | 'team';
  options?: DecisionOption[];
  relatedTaskIds?: string[];
  relatedMemberIds?: string[];
  status: 'pending' | 'decided' | 'deferred';
  decidedOption?: string;
  decidedAt?: string;
  decidedBy?: string;
  createdAt: string;
  createdBy?: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  impact?: string;
  recommended?: boolean;
}

interface DecisionsState {
  decisions: Decision[];
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addDecision: (decision: Omit<Decision, 'id' | 'createdAt' | 'status'>) => void;
  makeDecision: (decisionId: string, optionId: string, decidedBy: string) => void;
  deferDecision: (decisionId: string) => void;
  removeDecision: (decisionId: string) => void;

  // Queries
  getPendingDecisions: () => Decision[];
  getUrgentDecisions: () => Decision[];
  getDecisionsByCategory: (category: Decision['category']) => Decision[];
}

const STORAGE_KEY = 'decisions-store';

// Sample decisions for demo
const sampleDecisions: Decision[] = [
  {
    id: 'dec-1',
    title: 'Approve Q1 Marketing Budget',
    question: 'Should we increase marketing spend by 30% for Q1?',
    context: 'Marketing team has proposed increasing paid acquisition budget to capitalize on seasonal demand. Current CAC is £45, target is £40.',
    category: 'budget',
    urgency: 'high',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    requiredDecisionMaker: 'founder',
    options: [
      { id: 'opt-1', label: 'Approve Full Increase', description: 'Approve 30% increase (£15K additional)', impact: 'Higher acquisition, faster growth', recommended: true },
      { id: 'opt-2', label: 'Partial Increase', description: 'Approve 15% increase (£7.5K additional)', impact: 'Moderate growth, lower risk' },
      { id: 'opt-3', label: 'Decline', description: 'Keep current budget', impact: 'Preserve runway, slower growth' },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Marketing Lead',
  },
  {
    id: 'dec-2',
    title: 'Hire Senior Developer',
    question: 'Should we hire the senior developer candidate at £650/day?',
    context: 'Strong candidate with React Native expertise. Would accelerate product roadmap by 40%. Current burn would increase by £13K/month.',
    category: 'hiring',
    urgency: 'critical',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day - candidate has other offers
    requiredDecisionMaker: 'founder',
    options: [
      { id: 'opt-1', label: 'Hire Now', description: 'Extend offer at £650/day', impact: 'Fast product delivery, higher burn', recommended: true },
      { id: 'opt-2', label: 'Negotiate', description: 'Counter at £550/day', impact: 'Lower cost, risk losing candidate' },
      { id: 'opt-3', label: 'Pass', description: 'Continue search', impact: 'Delay roadmap, preserve runway' },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdBy: 'HR',
  },
  {
    id: 'dec-3',
    title: 'Product Feature Priority',
    question: 'Which feature should we prioritize for the next sprint?',
    context: 'Team can only complete one major feature. Analytics shows users requesting both equally.',
    category: 'product',
    urgency: 'normal',
    requiredDecisionMaker: 'founder',
    options: [
      { id: 'opt-1', label: 'Payment Integration', description: 'Enable in-app purchases', impact: 'Revenue enablement' },
      { id: 'opt-2', label: 'Social Sharing', description: 'Add viral growth features', impact: 'User acquisition' },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Product Manager',
  },
];

export const useDecisionsStore = create<DecisionsState>((set, get) => ({
  decisions: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ decisions: parsed, initialized: true });
      } else {
        // Seed with sample data
        set({ decisions: sampleDecisions, initialized: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleDecisions));
      }
    } catch (error) {
      console.error('[DecisionsStore] Failed to initialize:', error);
      set({ decisions: sampleDecisions, initialized: true });
    }
  },

  addDecision: (decision) => {
    const newDecision: Decision = {
      ...decision,
      id: `dec-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.decisions, newDecision];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  makeDecision: (decisionId, optionId, decidedBy) => {
    set((state) => {
      const updated = state.decisions.map((d) =>
        d.id === decisionId
          ? {
              ...d,
              status: 'decided' as const,
              decidedOption: optionId,
              decidedAt: new Date().toISOString(),
              decidedBy,
            }
          : d
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  deferDecision: (decisionId) => {
    set((state) => {
      const updated = state.decisions.map((d) =>
        d.id === decisionId ? { ...d, status: 'deferred' as const } : d
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  removeDecision: (decisionId) => {
    set((state) => {
      const updated = state.decisions.filter((d) => d.id !== decisionId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { decisions: updated };
    });
  },

  getPendingDecisions: () => {
    return get().decisions.filter((d) => d.status === 'pending');
  },

  getUrgentDecisions: () => {
    return get()
      .decisions
      .filter((d) => d.status === 'pending')
      .sort((a, b) => {
        // Sort by urgency (critical > high > normal), then by deadline
        const urgencyOrder = { critical: 0, high: 1, normal: 2 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;

        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
      });
  },

  getDecisionsByCategory: (category) => {
    return get().decisions.filter((d) => d.category === category);
  },
}));
